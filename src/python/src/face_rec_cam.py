from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow.compat.v1 as tf
tf.disable_v2_behavior()
from imutils.video import VideoStream
import argparse
import facenet
import imutils
import os
import sys
import math
import pickle
import align.detect_face
import numpy as np
import cv2
import collections
from sklearn.svm import SVC
from ultralytics import YOLO
import cvzone
import datetime
import mysql.connector
import time

# Get the absolute path to the python directory
PYTHON_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Constants for paths
DATA_PATH = os.path.join(PYTHON_DIR, "data", "image")
PROOF_PATH = os.path.join(PYTHON_DIR, "data", "proofs")
MODELS_PATH = os.path.join(PYTHON_DIR, "Models")
ALIGN_PATH = os.path.join(PYTHON_DIR, "src", "align")

# Ensure proof directory exists
if not os.path.exists(PROOF_PATH):
    os.makedirs(PROOF_PATH)

def calculate_attendance_status(time_in, time_out):
    if not time_out:
        return 'pending', 0

    try:
        time_in = datetime.datetime.strptime(time_in, '%H:%M:%S')
        time_out = datetime.datetime.strptime(time_out, '%H:%M:%S')
    except ValueError:
        return 'alert', 0

    start_time = datetime.datetime.strptime('08:00:00', '%H:%M:%S')
    end_time = datetime.datetime.strptime('17:00:00', '%H:%M:%S')
    late_hours = 0

    # Trường hợp bất hợp lệ
    if (time_in < start_time and time_out <= start_time) or \
       (time_in >= end_time and time_out > end_time) or \
       (time_in >= end_time):
        return 'alert', 0

    # Tính đi trễ
    if time_in > start_time:
        current_hour = 8
        while current_hour < 17:
            frame_start = datetime.datetime.strptime(f'{current_hour:02d}:00:00', '%H:%M:%S')
            frame_end = datetime.datetime.strptime(f'{current_hour + 1:02d}:00:00', '%H:%M:%S')
            
            if time_in <= frame_start:
                break
            
            if time_in <= frame_end:
                late_minutes = (time_in - frame_start).total_seconds() / 60
                if late_minutes >= 10:
                    late_hours += 1
                break
            
            late_hours += 1
            current_hour += 1

    # Tính về sớm
    if time_out < end_time:
        current_hour = 17
        while current_hour > 8:
            frame_end = datetime.datetime.strptime(f'{current_hour:02d}:00:00', '%H:%M:%S')
            frame_start = datetime.datetime.strptime(f'{current_hour - 1:02d}:00:00', '%H:%M:%S')
            
            if time_out >= frame_end:
                break
            
            late_hours += 1
            break
            
            current_hour -= 1

    # Giới hạn late_hours tối đa là 9 (tổng số giờ làm việc)
    late_hours = min(late_hours, 9)

    if late_hours == 0:
        return 'Enough', late_hours
    return 'Lack', late_hours

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--path', help='Path of the video you want to test on.', default=0)
    args = parser.parse_args()

    MINSIZE = 20
    THRESHOLD = [0.6, 0.7, 0.7]
    FACTOR = 0.709
    IMAGE_SIZE = 182
    INPUT_IMAGE_SIZE = 160
    CLASSIFIER_PATH = os.path.join(MODELS_PATH, 'facemodel.pkl')
    VIDEO_PATH = args.path
    FACENET_MODEL_PATH = os.path.join(MODELS_PATH, '20180402-114759.pb')

    with open(CLASSIFIER_PATH, 'rb') as file:
        model, class_names = pickle.load(file)
    print("Custom Classifier, Successfully loaded")

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="employee_management"
    )
    cursor = connection.cursor()
    cursor.execute("SELECT employee_id, employee_name FROM employees")
    employee_names = {id.upper(): name for id, name in cursor.fetchall()}
    cursor.close()
    connection.close()

    spoofing_model = YOLO(os.path.join(MODELS_PATH, "best.pt"))
    spoofing_confidence = 0.7 
    classNames = ["fake", "real"]

    last_check_time = 0
    check_interval = 0.5  # Tăng interval để giảm tải xử lý
    last_recognized_employee = None
    last_recognized_time = 0
    cooldown_period = 30

    with tf.Graph().as_default():
        gpu_options = tf.compat.v1.GPUOptions(per_process_gpu_memory_fraction=0.6)
        sess = tf.compat.v1.Session(config=tf.compat.v1.ConfigProto(gpu_options=gpu_options, log_device_placement=False))

        with sess.as_default():
            print('Loading feature extraction model')
            facenet.load_model(FACENET_MODEL_PATH)

            images_placeholder = tf.get_default_graph().get_tensor_by_name("input:0")
            embeddings = tf.get_default_graph().get_tensor_by_name("embeddings:0")
            phase_train_placeholder = tf.get_default_graph().get_tensor_by_name("phase_train:0")
            embedding_size = embeddings.get_shape()[1]

            print(f"Loading MTCNN models from: {ALIGN_PATH}")
            pnet, rnet, onet = align.detect_face.create_mtcnn(sess, ALIGN_PATH)

            people_detected = set()
            person_detected = collections.Counter()

            try:
                cap = VideoStream(src=0).start()
                print("Đã khởi tạo VideoStream")
            except Exception as e:
                print(f"🚫 Lỗi khởi tạo VideoStream: {e}")
                return

            try:
                while True:
                    frame = cap.read()
                    if frame is None:
                        print("🚫 Lỗi: Không thể đọc khung hình từ VideoStream")
                        continue

                    frame = imutils.resize(frame, width=600)
                    frame = cv2.flip(frame, 1)

                    now = datetime.datetime.now()
                    current_time_str = now.strftime('%Y-%m-%d %H:%M:%S')
                    cv2.putText(frame, f"Time: {current_time_str}", (10, 30), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                    current_time = time.time()
                    if current_time - last_check_time >= check_interval:
                        last_check_time = current_time

                        # Anti-spoofing check using YOLO
                        results = spoofing_model(frame, stream=True, verbose=False)
                        yolo_boxes = []
                        detected_spoofing = False

                        for r in results:
                            boxes = r.boxes
                            for box in boxes:
                                x1, y1, x2, y2 = box.xyxy[0]
                                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(x2)
                                w, h = x2 - x1, y2 - y1
                                conf = math.ceil((box.conf[0] * 100)) / 100
                                cls = int(box.cls[0])
                                print(f"YOLO class: {classNames[cls]}, confidence: {conf}")

                                yolo_boxes.append((x1, y1, x2, y2, conf, cls))

                                if classNames[cls] == 'real':
                                    color = (0, 255, 0)
                                else:
                                    color = (0, 0, 255)
                                    detected_spoofing = True
                                    print(f"🚫 Phát hiện giả mạo: Không thể chấm công!")

                                cvzone.cornerRect(frame, (x1, y1, w, h), colorC=color, colorR=color)
                                cvzone.putTextRect(frame, f'{classNames[cls].upper()} {int(conf * 100)}%',
                                                (max(0, x1), max(35, y1)), scale=2, thickness=4, colorR=color,
                                                colorB=color)

                        bounding_boxes, _ = align.detect_face.detect_face(frame, MINSIZE, pnet, rnet, onet, THRESHOLD, FACTOR)
                        print(f"Số khuôn mặt phát hiện: {bounding_boxes.shape[0]}")
                        if bounding_boxes.shape[0] > 0:
                            print(f"Hộp giới hạn: {bounding_boxes}")

                        faces_found = bounding_boxes.shape[0]
                        if faces_found == 0:
                            print("🚫 Không phát hiện được khuôn mặt nào bằng MTCNN!")
                            continue

                        det = bounding_boxes[:, 0:4]
                        bb = np.zeros((faces_found, 4), dtype=np.int32)
                        for i in range(faces_found):
                            bb[i][0] = det[i][0]
                            bb[i][1] = det[i][1]
                            bb[i][2] = det[i][2]
                            bb[i][3] = det[i][3]
                            print(f"Kích thước khuôn mặt: {(bb[i][3] - bb[i][1]) / frame.shape[0]:.3f}")

                            x1, y1, x2, y2 = bb[i][0], bb[i][1], bb[i][2], bb[i][3]
                            if x1 < 0 or y1 < 0 or x2 <= x1 or y2 <= y1 or \
                            y2 > frame.shape[0] or x2 > frame.shape[1]:
                                print(f"🚫 Tọa độ cắt không hợp lệ: ({x1}, {y1}, {x2}, {y2})")
                                continue

                            cropped = frame[y1:y2, x1:x2, :]
                            if cropped is None or cropped.size == 0 or cropped.shape[0] == 0 or cropped.shape[1] == 0:
                                print(f"🚫 Hình ảnh cắt rỗng hoặc không hợp lệ tại: ({x1}, {y1}, {x2}, {y2})")
                                continue

                            try:
                                scaled = cv2.resize(cropped, (INPUT_IMAGE_SIZE, INPUT_IMAGE_SIZE),
                                                    interpolation=cv2.INTER_CUBIC)
                            except cv2.error as e:
                                print(f"🚫 Lỗi resize hình ảnh: {e}")
                                continue

                            scaled = facenet.prewhiten(scaled)
                            scaled_reshape = scaled.reshape(-1, INPUT_IMAGE_SIZE, INPUT_IMAGE_SIZE, 3)
                            feed_dict = {images_placeholder: scaled_reshape, phase_train_placeholder: False}
                            emb_array = sess.run(embeddings, feed_dict=feed_dict)
                            
                            predictions = model.predict_proba(emb_array)
                            best_class_indices = np.argmax(predictions, axis=1)
                            best_class_probabilities = predictions[
                                np.arange(len(best_class_indices)), best_class_indices]
                            best_name = class_names[best_class_indices[0]]

                            probability = best_class_probabilities[0] * 100
                            if probability >= 90:
                                rect_color = (0, 255, 0)
                            elif probability >= 75:
                                rect_color = (0, 165, 255)
                            else:
                                rect_color = (0, 0, 255)

                            cv2.rectangle(frame, (bb[i][0], bb[i][1]), (bb[i][2], bb[i][3]), rect_color, 2)

                            employee_id = best_name.upper()
                            employee_name = employee_names.get(employee_id, "Unknown")
                            label = f"{employee_name} ({probability:.1f}%)"
                            cv2.putText(frame, label, (bb[i][0], bb[i][1] - 10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, rect_color, 2)

                            if best_class_probabilities > 0.6 and not detected_spoofing:
                                if employee_id not in employee_names:
                                    print(f"🚫 Người chấm công không phải nhân viên công ty: {employee_id}")
                                    continue
                                    
                                if (last_recognized_employee == employee_id and 
                                    current_time - last_recognized_time < cooldown_period):
                                    print(f"⏳ Đang trong thời gian chờ: {employee_id} (còn {cooldown_period - (current_time - last_recognized_time):.1f} giây)")
                                    continue

                                last_recognized_employee = employee_id
                                last_recognized_time = current_time

                                now = datetime.datetime.now()
                                sql_datetime = now.strftime('%Y-%m-%d %H:%M:%S')
                                today = now.strftime('%Y-%m-%d')
                                timestamp = now.strftime('%Y%m%d_%H%M%S')

                                year = now.strftime('%Y')
                                month = now.strftime('%m')
                                day = now.strftime('%d')
                                date_folder = os.path.join(year, month, day)
                                full_proof_path = os.path.join(PROOF_PATH, date_folder)

                                if not os.path.exists(full_proof_path):
                                    os.makedirs(full_proof_path)

                                try:
                                    connection = mysql.connector.connect(
                                        host="localhost",
                                        user="root",
                                        password="",
                                        database="employee_management"
                                    )
                                    cursor = connection.cursor()
                                    cursor.execute(f"SELECT * FROM attendance WHERE employee_id='{employee_id}' AND DATE(attendance_date) = '{today}'")
                                    result = cursor.fetchall()

                                    if result:
                                        last_record = result[-1]
                                        status = last_record[5]
                                        if status.lower() != 'pending':
                                            print(f"⚠️ Bạn đã quét đủ lượt vào và ra, nếu có sai sót hãy báo cáo ở trang cá nhân cho nhân viên: {employee_name}")
                                            cursor.close()
                                            connection.close()
                                            continue

                                    # Chỉ lưu ảnh nếu chấm công thành công
                                    photo_filename = f"{employee_id}_{timestamp}.jpg"
                                    photo_path = os.path.join(full_proof_path, photo_filename)
                                    photo_proof = f"/{year}/{month}/{day}/{photo_filename}"

                                    if not result:  # Chấm công vào
                                        # Lưu ảnh với màu sắc bình thường (frame đã ở BGR, không cần chuyển đổi)
                                        cv2.imwrite(photo_path, frame)
                                        cursor.execute(f"INSERT INTO attendance (employee_id, attendance_date, time_in, status, late_hours, photo_proof_in) VALUES ('{employee_id}', '{today}', '{sql_datetime}', 'pending', 0, '{photo_proof}')")
                                        print(f"✅ Đã chấm công vào làm cho nhân viên: {employee_name} vào lúc: {sql_datetime}")
                                    else:  # Chấm công ra
                                        status = last_record[5]
                                        if status.lower() == 'pending':
                                            time_in_timedelta = last_record[3]
                                            total_seconds = int(time_in_timedelta.total_seconds())
                                            hours = total_seconds // 3600
                                            minutes = (total_seconds % 3600) // 60
                                            seconds = total_seconds % 60
                                            time_in = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

                                            time_out = now.strftime('%H:%M:%S')
                                            status, late_hours = calculate_attendance_status(time_in, time_out)
                                            # Lưu ảnh với màu sắc bình thường (frame đã ở BGR, không cần chuyển đổi)
                                            cv2.imwrite(photo_path, frame)
                                            cursor.execute(f"UPDATE attendance SET time_out = '{sql_datetime}', status = '{status}', late_hours = {late_hours}, photo_proof_out = '{photo_proof}' WHERE employee_id = '{employee_id}' AND DATE(attendance_date) = '{today}'")
                                            print(f"✅ Đã chấm công ra về cho nhân viên: {employee_name} vào lúc: {sql_datetime}")
                                        else:
                                            print(f"🚫 Không thể chấm công ra về: Trạng thái không phải 'pending' (hiện tại: {status})")
                                            
                                    connection.commit()
                                except mysql.connector.Error as err:
                                    print(f"🚫 Lỗi kết nối database: {err}")
                                    # Nếu có lỗi, xóa ảnh vừa lưu (nếu đã lưu)
                                    if os.path.exists(photo_path):
                                        os.remove(photo_path)
                                finally:
                                    if cursor:
                                        cursor.close()
                                    if connection:
                                        connection.close()

                    cv2.imshow('Face Recognition', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

            finally:
                cap.stop()
                cv2.destroyAllWindows()

if __name__ == "__main__":
    main()