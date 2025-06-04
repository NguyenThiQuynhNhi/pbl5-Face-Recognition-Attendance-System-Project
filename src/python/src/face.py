from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow.compat.v1 as tf
tf.disable_v2_behavior()
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
import socket
import unicodedata

# Cấu hình UTF-8 để hỗ trợ tiếng Việt
sys.stdout.reconfigure(encoding='utf-8')

# Đường dẫn thư mục
PYTHON_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_PATH = os.path.join(PYTHON_DIR, "data", "image")
PROOF_PATH = os.path.join(PYTHON_DIR, "data", "proofs")
MODELS_PATH = os.path.join(PYTHON_DIR, "Models")
ALIGN_PATH = os.path.join(PYTHON_DIR, "src", "align")

# Cấu hình ESP8266
ESP8266_IP = "172.20.10.2"  # Thay bằng IP thực tế của ESP8266
PORT = 12345

# Cấu hình ESP32-CAM
ESP32_CAM_URL = "http://172.20.10.6:81/stream"  # Thay bằng URL luồng của ESP32-CAM

# Tạo thư mục lưu ảnh nếu chưa có
if not os.path.exists(PROOF_PATH):
    os.makedirs(PROOF_PATH)

def remove_accents(input_str, for_filename=False):
    """Chuyển chuỗi tiếng Việt có dấu sang không dấu."""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    ascii_str = ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
    if for_filename:
        ascii_str = ascii_str.replace(' ', '_')
    return ascii_str

def send_checkin(name):
    """Gửi thông báo (tên nhân viên hoặc thông báo sự kiện) đến ESP8266."""
    try:
        print("🔗 Đang kết nối đến ESP8266...")
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect((ESP8266_IP, PORT))
        # Chuyển tên hoặc thông báo sang không dấu (nếu cần)
        name_no_accents = remove_accents(name) if "Fake" not in name and "Unknown" not in name else name
        name_to_send = f"{name_no_accents}\n"
        print(f"📤 Gửi thông báo: {name_no_accents.strip()}")
        client.sendall(name_to_send.encode('utf-8'))
        ack = client.recv(1024).decode('utf-8').strip()
        if ack == "ACK":
            print("✅ ESP8266 xác nhận đã nhận!")
        else:
            print("⚠️ Phản hồi không hợp lệ:", ack)
        client.close()
    except Exception as e:
        print("❌ Lỗi khi gửi dữ liệu đến ESP8266:", e)

def calculate_attendance_status(time_in, time_out):
    """Tính trạng thái chấm công và số giờ trễ."""
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

    if (time_in < start_time and time_out <= start_time) or \
       (time_in >= end_time and time_out > end_time) or \
       (time_in >= end_time):
        return 'alert', 0

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

    if time_out < end_time:
        current_hour = 17
        while current_hour > 8:
            frame_end = datetime.datetime.strptime(f'{current_hour:02d}:00:00', '%H:%M:%S')
            frame_start = datetime.datetime.strptime(f'{current_hour - 1:02d}:00:00', '%H:%M:%S')
            
            if time_out >= frame_end:
                break
            
            late_hours += 1
            current_hour -= 1

    late_hours = min(late_hours, 9)
    status = 'Enough' if late_hours == 0 else 'Lack'
    return status, late_hours

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--path', help='Đường dẫn video để kiểm tra.', default=ESP32_CAM_URL)
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
    print("Đã tải mô hình phân loại tùy chỉnh")

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
    check_interval = 0.5
    last_recognized_employee = None
    last_recognized_time = 0
    cooldown_period = 30

    with tf.Graph().as_default():
        gpu_options = tf.compat.v1.GPUOptions(per_process_gpu_memory_fraction=0.6)
        sess = tf.compat.v1.Session(config=tf.compat.v1.ConfigProto(gpu_options=gpu_options, log_device_placement=False))

        with sess.as_default():
            print('Đang tải mô hình trích xuất đặc trưng')
            facenet.load_model(FACENET_MODEL_PATH)

            images_placeholder = tf.get_default_graph().get_tensor_by_name("input:0")
            embeddings = tf.get_default_graph().get_tensor_by_name("embeddings:0")
            phase_train_placeholder = tf.get_default_graph().get_tensor_by_name("phase_train:0")
            embedding_size = embeddings.get_shape()[1]

            print(f"Đang tải mô hình MTCNN từ: {ALIGN_PATH}")
            pnet, rnet, onet = align.detect_face.create_mtcnn(sess, ALIGN_PATH)

            people_detected = set()
            person_detected = collections.Counter()

            try:
                cap = cv2.VideoCapture(VIDEO_PATH)
                if not cap.isOpened():
                    raise Exception("Không thể mở luồng video từ ESP32-CAM")
                print("Đã khởi tạo luồng video từ ESP32-CAM")
            except Exception as e:
                print(f"🚫 Lỗi khởi tạo luồng video: {e}")
                return

            try:
                while True:
                    ret, frame = cap.read()
                    if not ret or frame is None:
                        print("🚫 Lỗi: Không thể đọc khung hình từ ESP32-CAM")
                        continue

                    frame = imutils.resize(frame, width=600)
                    frame = cv2.flip(frame, 1)

                    now = datetime.datetime.now()
                    current_time_str = now.strftime('%Y-%m-%d %H:%M:%S')
                    cv2.putText(frame, f"Thoi gian: {current_time_str}", (10, 30), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                    current_time = time.time()
                    if current_time - last_check_time >= check_interval:
                        last_check_time = current_time

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
                                print(f"Lop YOLO: {classNames[cls]}, do tin cay: {conf}")

                                yolo_boxes.append((x1, y1, x2, y2, conf, cls))

                                if classNames[cls] == 'real':
                                    color = (0, 255, 0)
                                else:
                                    color = (0, 0, 255)
                                    detected_spoofing = True
                                    print(f"🚫 Phat hien gia mao: Khong the cham cong!")
                                    # Gửi thông báo "Fake detected" tới ESP8266
                                    send_checkin("Fake detected")

                                cvzone.cornerRect(frame, (x1, y1, w, h), colorC=color, colorR=color)
                                cvzone.putTextRect(frame, f'{classNames[cls].upper()} {int(conf * 100)}%',
                                                (max(0, x1), max(35, y1)), scale=2, thickness=4, colorR=color,
                                                colorB=color)

                        bounding_boxes, _ = align.detect_face.detect_face(frame, MINSIZE, pnet, rnet, onet, THRESHOLD, FACTOR)
                        print(f"So khuon mat phat hien: {bounding_boxes.shape[0]}")
                        if bounding_boxes.shape[0] > 0:
                            print(f"Hop gioi han: {bounding_boxes}")

                        faces_found = bounding_boxes.shape[0]
                        if faces_found == 0:
                            print("🚫 Khong phat hien duoc khuon mat nao bang MTCNN!")
                            continue

                        det = bounding_boxes[:, 0:4]
                        bb = np.zeros((faces_found, 4), dtype=np.int32)
                        for i in range(faces_found):
                            bb[i][0] = det[i][0]
                            bb[i][1] = det[i][1]
                            bb[i][2] = det[i][2]
                            bb[i][3] = det[i][3]
                            print(f"Kich thuoc khuon mat: {(bb[i][3] - bb[i][1]) / frame.shape[0]:.3f}")

                            x1, y1, x2, y2 = bb[i][0], bb[i][1], bb[i][2], bb[i][3]
                            if x1 < 0 or y1 < 0 or x2 <= x1 or y2 <= y1 or \
                            y2 > frame.shape[0] or x2 > frame.shape[1]:
                                print(f"🚫 Toa do cat khong hop le: ({x1}, {y1}, {x2}, {y2})")
                                continue

                            cropped = frame[y1:y2, x1:x2, :]
                            if cropped is None or cropped.size == 0 or cropped.shape[0] == 0 or cropped.shape[1] == 0:
                                print(f"🚫 Hinh anh cat rong hoac khong hop le tai: ({x1}, {y1}, {x2}, {y2})")
                                continue

                            try:
                                scaled = cv2.resize(cropped, (INPUT_IMAGE_SIZE, INPUT_IMAGE_SIZE),
                                                    interpolation=cv2.INTER_CUBIC)
                            except cv2.error as e:
                                print(f"🚫 Loi resize hinh anh: {e}")
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
                            employee_name = employee_names.get(employee_id, "Khong xac dinh")
                            employee_name_no_accents = remove_accents(employee_name)
                            label = f"{employee_name_no_accents} ({probability:.1f}%)"
                            cv2.putText(frame, label, (bb[i][0], bb[i][1] - 10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, rect_color, 2)

                            if best_class_probabilities > 0.6 and not detected_spoofing:
                                if employee_id not in employee_names:
                                    print(f"🚫 Nguoi cham cong khong phai nhan vien cong ty: {employee_id}")
                                    # Gửi thông báo "Unknown person" tới ESP8266
                                    send_checkin("Unknown person")
                                    continue
                                    
                                if (last_recognized_employee == employee_id and 
                                    current_time - last_recognized_time < cooldown_period):
                                    print(f"⏳ Dang trong thoi gian cho: {employee_id} (con {cooldown_period - (current_time - last_recognized_time):.1f} giay)")
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
                                            print(f"⚠️ Ban da quet du luot vao va ra, neu co sai sot hay bao cao o trang ca nhan cho nhan vien: {employee_name_no_accents}")
                                            cursor.close()
                                            connection.close()
                                            continue

                                    employee_name_no_accents_filename = remove_accents(employee_name, for_filename=True)
                                    photo_filename = f"{employee_name_no_accents_filename}_{timestamp}.jpg"
                                    photo_path = os.path.join(full_proof_path, photo_filename)
                                    photo_proof = f"/{year}/{month}/{day}/{photo_filename}"

                                    if not result:  # Chấm công vào
                                        cv2.imwrite(photo_path, frame)
                                        cursor.execute(f"INSERT INTO attendance (employee_id, attendance_date, time_in, status, late_hours, photo_proof_in) VALUES ('{employee_id}', '{today}', '{sql_datetime}', 'pending', 0, '{photo_proof}')")
                                        print(f"✅ Da cham cong vao lam cho nhan vien: {employee_name_no_accents} vao luc: {sql_datetime}")
                                        send_checkin(employee_name)
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
                                            cv2.imwrite(photo_path, frame)
                                            cursor.execute(f"UPDATE attendance SET time_out = '{sql_datetime}', status = '{status}', late_hours = {late_hours}, photo_proof_out = '{photo_proof}' WHERE employee_id = '{employee_id}' AND DATE(attendance_date) = '{today}'")
                                            print(f"✅ Da cham cong ra ve cho nhan vien: {employee_name_no_accents} vao luc: {sql_datetime}")
                                            send_checkin(employee_name)
                                        else:
                                            print(f"🚫 Khong the cham cong ra ve: Trang thai khong phai 'pending' (hien tai: {status})")
                                            
                                    connection.commit()
                                except mysql.connector.Error as err:
                                    print(f"🚫 Loi ket noi co so du lieu: {err}")
                                    if os.path.exists(photo_path):
                                        os.remove(photo_path)
                                finally:
                                    if cursor:
                                        cursor.close()
                                    if connection:
                                        connection.close()

                    cv2.imshow('Nhan dien khuon mat', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

            finally:
                cap.release()
                cv2.destroyAllWindows()

if __name__ == "__main__":
    main()