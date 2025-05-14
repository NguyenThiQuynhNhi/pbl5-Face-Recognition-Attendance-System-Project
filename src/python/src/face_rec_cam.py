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
    """
    Calculate attendance status based on working hours
    Returns: (status, late_hours)
    """
    if not time_in or not time_out:
        return 'Lack', 0

    # Convert times to datetime objects for easier calculation
    time_in = datetime.datetime.strptime(time_in, '%H:%M:%S')
    time_out = datetime.datetime.strptime(time_out, '%H:%M:%S')
    
    # Standard working hours
    start_time = datetime.datetime.strptime('08:00:00', '%H:%M:%S')
    end_time = datetime.datetime.strptime('17:00:00', '%H:%M:%S')
    
    # Calculate late minutes
    late_minutes = 0
    if time_in > start_time:
        late_minutes = (time_in - start_time).total_seconds() / 60
    
    # Calculate early leave minutes
    early_leave_minutes = 0
    if time_out < end_time:
        early_leave_minutes = (end_time - time_out).total_seconds() / 60
    
    # Calculate total working hours
    working_hours = (time_out - time_in).total_seconds() / 3600
    
    # Calculate late hours (rounded up)
    late_hours = math.ceil(late_minutes / 60)
    
    # Determine status
    if working_hours >= 9 and early_leave_minutes == 0:
        return 'Enough', late_hours
    else:
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

    # Load The Custom Classifier
    with open(CLASSIFIER_PATH, 'rb') as file:
        model, class_names = pickle.load(file)
    print("Custom Classifier, Successfully loaded")

    # Create a mapping of employee IDs to names for display purposes
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="employee_management"
    )
    cursor = connection.cursor()
    cursor.execute("SELECT employee_id, employee_name FROM employees")
    # Create case-insensitive mapping by converting IDs to uppercase
    employee_names = {id.upper(): name for id, name in cursor.fetchall()}
    cursor.close()
    connection.close()

    # Load YOLO model for anti-spoofing
    spoofing_model = YOLO(os.path.join(MODELS_PATH, "best.pt"))
    spoofing_confidence = 0.7  # Tăng ngưỡng tin cậy lên 0.7
    classNames = ["fake", "real"]

    # Auto-check functionality
    last_check_time = 0
    check_interval = 3  # Giảm interval xuống 3 giây
    last_recognized_employee = None
    last_recognized_time = 0
    cooldown_period = 30  # 30 seconds cooldown before recognizing the same person again

    with tf.Graph().as_default():
        # Configure GPU if available
        gpu_options = tf.compat.v1.GPUOptions(per_process_gpu_memory_fraction=0.6)
        sess = tf.compat.v1.Session(config=tf.compat.v1.ConfigProto(gpu_options=gpu_options, log_device_placement=False))

        with sess.as_default():
            # Load the FaceNet model
            print('Loading feature extraction model')
            facenet.load_model(FACENET_MODEL_PATH)

            # Get input and output tensors
            images_placeholder = tf.get_default_graph().get_tensor_by_name("input:0")
            embeddings = tf.get_default_graph().get_tensor_by_name("embeddings:0")
            phase_train_placeholder = tf.get_default_graph().get_tensor_by_name("phase_train:0")
            embedding_size = embeddings.get_shape()[1]

            print(f"Loading MTCNN models from: {ALIGN_PATH}")
            pnet, rnet, onet = align.detect_face.create_mtcnn(sess, ALIGN_PATH)

            people_detected = set()
            person_detected = collections.Counter()

            cap = VideoStream(src=0).start()

            while True:
                frame = cap.read()
                frame = imutils.resize(frame, width=600)
                frame = cv2.flip(frame, 1)

                # Auto check face every 3 seconds
                current_time = time.time()
                if current_time - last_check_time >= check_interval:
                    last_check_time = current_time
                    
                    # Anti-spoofing check using YOLO
                    results = spoofing_model(frame, stream=True, verbose=False)
                    is_real = False
                    detected_spoofing = False

                    for r in results:
                        boxes = r.boxes
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0]
                            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                            w, h = x2 - x1, y2 - y1
                            conf = math.ceil((box.conf[0] * 100)) / 100
                            cls = int(box.cls[0])

                            if conf > spoofing_confidence:
                                if classNames[cls] == 'real':
                                    is_real = True
                                    color = (0, 255, 0)
                                else:
                                    detected_spoofing = True
                                    color = (0, 0, 255)

                                cvzone.cornerRect(frame, (x1, y1, w, h), colorC=color, colorR=color)
                                cvzone.putTextRect(frame, f'{classNames[cls].upper()} {int(conf * 100)}%',
                                                   (max(0, x1), max(35, y1)), scale=2, thickness=4, colorR=color,
                                                   colorB=color)

                    if is_real and not detected_spoofing:
                        # Proceed with face recognition
                        bounding_boxes, _ = align.detect_face.detect_face(frame, MINSIZE, pnet, rnet, onet, THRESHOLD, FACTOR)
                        faces_found = bounding_boxes.shape[0]

                        if faces_found == 1:
                            det = bounding_boxes[:, 0:4]
                            bb = np.zeros((faces_found, 4), dtype=np.int32)
                            for i in range(faces_found):
                                bb[i][0] = det[i][0]
                                bb[i][1] = det[i][1]
                                bb[i][2] = det[i][2]
                                bb[i][3] = det[i][3]
                                
                                if (bb[i][3] - bb[i][1]) / frame.shape[0] > 0.25:
                                    # Tăng kích thước ảnh khuôn mặt để cải thiện độ chính xác
                                    cropped = frame[bb[i][1]:bb[i][3], bb[i][0]:bb[i][2], :]
                                    scaled = cv2.resize(cropped, (INPUT_IMAGE_SIZE, INPUT_IMAGE_SIZE),
                                                        interpolation=cv2.INTER_CUBIC)
                                    scaled = facenet.prewhiten(scaled)
                                    scaled_reshape = scaled.reshape(-1, INPUT_IMAGE_SIZE, INPUT_IMAGE_SIZE, 3)
                                    feed_dict = {images_placeholder: scaled_reshape, phase_train_placeholder: False}
                                    emb_array = sess.run(embeddings, feed_dict=feed_dict)
                                    
                                    predictions = model.predict_proba(emb_array)
                                    best_class_indices = np.argmax(predictions, axis=1)
                                    best_class_probabilities = predictions[
                                        np.arange(len(best_class_indices)), best_class_indices]
                                    best_name = class_names[best_class_indices[0]]

                                    # Giảm ngưỡng nhận diện xuống 0.6 để tăng độ nhạy
                                    if best_class_probabilities > 0.6:
                                        # Get employee ID directly from face recognition and convert to uppercase
                                        employee_id = best_name.upper()
                                        
                                        # Verify if this is a valid employee ID
                                        if employee_id not in employee_names:
                                            print(f"Warning: Employee ID '{employee_id}' not found in database")
                                            continue
                                            
                                        employee_name = employee_names[employee_id]
                                        
                                        # Check cooldown period
                                        if (last_recognized_employee == employee_id and 
                                            current_time - last_recognized_time < cooldown_period):
                                            continue

                                        # Update last recognized employee and time
                                        last_recognized_employee = employee_id
                                        last_recognized_time = current_time

                                        # Process attendance
                                        now = datetime.datetime.now()
                                        sql_datetime = now.strftime('%Y-%m-%d %H:%M:%S')
                                        today = now.strftime('%Y-%m-%d')
                                        timestamp = now.strftime('%Y%m%d_%H%M%S')

                                        # Save attendance photo
                                        year = now.strftime('%Y')
                                        month = now.strftime('%m')
                                        day = now.strftime('%d')
                                        date_folder = os.path.join(year, month, day)
                                        full_proof_path = os.path.join(PROOF_PATH, date_folder)

                                        if not os.path.exists(full_proof_path):
                                            os.makedirs(full_proof_path)

                                        photo_filename = f"{employee_id}_{timestamp}.jpg"
                                        photo_path = os.path.join(full_proof_path, photo_filename)
                                        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                                        cv2.imwrite(photo_path, frame_bgr)
                                        photo_proof = f"/{year}/{month}/{day}/{photo_filename}"

                                        # Database connection
                                        connection = mysql.connector.connect(
                                            host="localhost",
                                            user="root",
                                            password="",
                                            database="employee_management"
                                        )
                                        cursor = connection.cursor()
                                        
                                        # Check existing attendance record
                                        cursor.execute(f"SELECT * FROM attendance WHERE employee_id='{employee_id}' AND DATE(attendance_date) = '{today}'")
                                        result = cursor.fetchall()

                                        if not result:
                                            # First check-in of the day
                                            cursor.execute(f"INSERT INTO attendance (employee_id, attendance_date, time_in, status, photo_proof_in) VALUES ('{employee_id}', '{today}', '{sql_datetime}', 'Enough', '{photo_proof}')")
                                            print(f"✅ Đã chấm công vào làm cho nhân viên: {employee_name}")
                                        else:
                                            # Check-out
                                            last_record = result[-1]
                                            if last_record[3] == 'In':
                                                # Calculate attendance status
                                                time_in = last_record[2].strftime('%H:%M:%S')
                                                time_out = now.strftime('%H:%M:%S')
                                                status, late_hours = calculate_attendance_status(time_in, time_out)
                                                
                                                cursor.execute(f"UPDATE attendance SET time_out = '{sql_datetime}', status = '{status}', late_hours = {late_hours}, photo_proof_out = '{photo_proof}' WHERE employee_id = '{employee_id}' AND DATE(attendance_date) = '{today}'")
                                                print(f"✅ Đã chấm công ra về cho nhân viên: {employee_name}")

                                        connection.commit()
                                        cursor.close()
                                        connection.close()

                cv2.imshow('Face Recognition', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            cap.release()
            cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
