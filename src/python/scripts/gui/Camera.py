import tkinter
import cv2
from PIL import Image, ImageTk
import tkinter.messagebox
import datetime
import mysql.connector
import face_recognition
import os
import numpy as np
import serial
import time

# Đường dẫn đến thư mục chứa ảnh nhân viên
DATA_PATH = "D:/SEM6/PBL5/Face-Recognition/src/python/data/image"

# Đường dẫn để lưu ảnh chấm công
PROOF_PATH = "D:/SEM6/PBL5/Face-Recognition/src/python/data/proofs/"

# Đảm bảo thư mục lưu ảnh chấm công tồn tại
if not os.path.exists(PROOF_PATH):
    os.makedirs(PROOF_PATH)

# Dùng camera máy
# class MyVideoCapture:
#     def __init__(self, video_source=0):
#         # Mở camera
#         self.vid = cv2.VideoCapture(video_source)
#         if not self.vid.isOpened():
#             raise ValueError("Không thể mở camera")
# 
#     def __del__(self):
#         # Đóng camera khi không dùng nữa
#         if self.vid.isOpened():
#             self.vid.release()
# 
#     def get_frame(self):
#         # Lấy khung hình từ camera
#         ret, frame = self.vid.read()
#         if ret:
#             frame = cv2.resize(frame, (640, 480))
#             return (ret, cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
#         return (ret, None)

# DÙNG CAMERA ESP32
class MyVideoCapture:
    def __init__(self, video_source="http://172.20.10.5:81/stream"):
        print("Đang mở camera từ:", video_source)
        self.video_source = video_source
        self.stream = cv2.VideoCapture(video_source)
        if not self.stream.isOpened():
            print("LỖI: Không thể mở stream từ ESP32-CAM!")
            raise ValueError("Unable to open ESP32-CAM stream", video_source)
        else:
            print("Camera ESP32-CAM đã kết nối thành công!")

        self.width = 640
        self.height = 480

    def __del__(self):
        if self.stream.isOpened():
            self.stream.release()

    def get_frame(self):
        ret, frame = self.stream.read()
        if ret:
            # Đôi khi ESP32 trả về hình JPEG không hoàn chỉnh, cần xử lý lại
            try:
                frame = cv2.resize(frame, (self.width, self.height))
                return ret, cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            except Exception as e:
                print(f"⚠️ Lỗi khi xử lý hình ảnh từ ESP32-CAM: {e}")
                return False, None
        else:
            print("⚠️ Không đọc được frame từ ESP32-CAM!")
            return False, None

class App:
    def __init__(self, window, window_title, listimg):
        self.listimg = listimg
        self.window = window
        self.window.config(bg="#FFC470")
        self.window.title(window_title)
        self.window.geometry(f"+{450}+{100}")
        self.vid = MyVideoCapture("http://172.20.10.5:81/stream")  # Sử dụng ESP32 camera
        self.canvas = tkinter.Canvas(window, width=self.vid.width, height=self.vid.height)
        self.canvas.pack()
        self.btn_getTimekeeping = tkinter.Button(window, text="Chấm công", width=50, command=self.getvideo, font=("SVN-HC calvous", 14, "bold"), foreground="#FFC470", bg="#BD2C13")
        self.btn_getTimekeeping.pack(anchor=tkinter.CENTER, expand=True)

        self.delay = 1
        self.current_frame = None  # Lưu khung hình hiện tại để sử dụng khi chấm công
        self.update()
        self.window.mainloop()

    def getvideo(self):
        # Chụp ảnh từ camera
        ret, frame = self.vid.get_frame()
        if not ret:
            tkinter.messagebox.showinfo(title="Notification", message="Không thể chụp ảnh từ camera")
            return

        # Lưu khung hình hiện tại để sử dụng sau
        self.current_frame = frame.copy()

        # Chuẩn bị ảnh để nhận diện
        frame = cv2.resize(frame, (0, 0), None, fx=0.5, fy=0.5)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        encodeface = face_recognition.face_encodings(frame)
        if not encodeface:
            tkinter.messagebox.showinfo(title="Notification", message="Không tìm thấy khuôn mặt trong ảnh")
            return

        # Kiểm tra nếu không có dữ liệu để so sánh
        if not self.listimg.encodelist:
            tkinter.messagebox.showinfo(title="Notification", message="Không có dữ liệu khuôn mặt để so sánh")
            return

        # So sánh khuôn mặt
        best_match_index = None
        best_match_distance = float('inf')
        for index, known_encodings in enumerate(self.listimg.encodelist):
            distances = face_recognition.face_distance(known_encodings, encodeface[0])
            min_distance = min(distances)
            if min_distance < best_match_distance:
                best_match_distance = min_distance
                best_match_index = index

        # Chuyển khoảng cách thành tỷ lệ phần trăm giống
        similarity_percentage = (1 - best_match_distance) * 100
        print(f"Tỷ lệ giống: {similarity_percentage:.2f}%")

        # Ngưỡng nhận diện: 50% (tương ứng với khoảng cách 0.5)
        if similarity_percentage >= 50:
            dialog = DialogBox(self.window, "Xác nhận thông tin", self.listimg.classname[best_match_index], self.listimg.namect[best_match_index], self.current_frame)
            image_label = tkinter.Label(dialog)
            image_label.pack()
            employee_dir = os.path.join(DATA_PATH, self.listimg.classname[best_match_index])
            image_files = [f for f in os.listdir(employee_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
            if image_files:
                image_path = os.path.join(employee_dir, image_files[0])
                image = Image.open(image_path).convert("RGB")
                resized_image = image.resize((200, 200))
                tk_image = ImageTk.PhotoImage(resized_image)
                image_label.configure(image=tk_image)
            dialog.mainloop()
        else:
            tkinter.messagebox.showinfo(title="Notification", message="Không thể nhận dạng")

    def update(self):
        # Cập nhật khung hình từ camera lên giao diện
        ret, frame = self.vid.get_frame()
        if ret:
            self.photo = ImageTk.PhotoImage(image=Image.fromarray(frame))
            self.canvas.create_image(0, 0, image=self.photo, anchor=tkinter.NW)
        self.window.after(self.delay, self.update)

class loadimg:
    def __init__(self):
        self.classname = []  # Mã nhân viên
        self.namect = []    # Tên nhân viên
        self.encodelist = []  # Danh sách mã hóa khuôn mặt

        # Kết nối cơ sở dữ liệu
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="employee_management"
        )
        cursor = connection.cursor()
        cursor.execute("SELECT employee_id, employee_name FROM employees")
        employees = cursor.fetchall()

        # Lấy thông tin nhân viên và mã hóa ảnh
        for employee in employees:
            employee_id = employee[0]
            employee_name = employee[1]
            employee_dir = os.path.join(DATA_PATH, str(employee_id))
            if not os.path.exists(employee_dir):
                print(f"Thư mục không tồn tại: {employee_dir}")
                continue

            # Lấy tất cả ảnh trong thư mục của nhân viên
            image_files = [f for f in os.listdir(employee_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
            if not image_files:
                print(f"Không có ảnh trong thư mục: {employee_dir}")
                continue

            # Mã hóa tất cả ảnh của nhân viên
            employee_encodings = []
            for img_file in image_files:
                img_path = os.path.join(employee_dir, img_file)
                try:
                    img = Image.open(img_path).convert("RGB")
                    img_array = np.array(img)
                    if img_array.dtype != np.uint8:
                        img_array = img_array.astype(np.uint8)
                    if len(img_array.shape) != 3 or img_array.shape[2] != 3:
                        print(f"Ảnh không ở định dạng RGB 3 kênh: {img_path}")
                        continue
                    encodings = face_recognition.face_encodings(img_array)
                    if encodings:
                        employee_encodings.append(encodings[0])
                    else:
                        print(f"Không tìm thấy khuôn mặt trong ảnh: {img_path}")
                except Exception as e:
                    print(f"Không thể xử lý ảnh {img_path}: {e}")
                    continue

            if employee_encodings:
                self.classname.append(str(employee_id))
                self.namect.append(employee_name)
                self.encodelist.append(employee_encodings)
            else:
                print(f"Không có mã hóa hợp lệ cho nhân viên {employee_id}")

        cursor.close()
        connection.close()

class DialogBox(tkinter.Toplevel):
    def __init__(self, parent, title, codect, namect, frame):
        super().__init__(parent)
        self.codect = codect
        self.namect = namect
        self.frame = frame  # Khung hình từ camera
        self.title(title)
        self.config(bg="#FFC470")
        self.geometry("400x400+600+150")
        label = tkinter.Label(self, text="Mã nhân viên: " + codect, font=("SVN-HC calvous", 14, "bold"), foreground="#1A4185")
        label.config(bg="#FFC470")
        label.place(x=60, y=200, width=250, height=50)
        labelname = tkinter.Label(self, text="Họ và Tên: " + namect, font=("SVN-HC calvous", 14, "bold"), foreground="#1A4185")
        labelname.config(bg="#FFC470")
        labelname.place(x=0, y=260, width=400, height=50)
        button = tkinter.Button(self, text="Xác nhận", command=self.submit, font=("SVN-HC calvous", 14, "bold"), foreground="#FFC470", bg="#BD2C13")
        button.place(x=100, y=360, width=200, height=50)

    def submit(self):
        now = datetime.datetime.now()
        sql_datetime = now.strftime('%Y-%m-%d %H:%M:%S')
        today = now.strftime('%Y-%m-%d')
        timestamp = now.strftime('%Y%m%d_%H%M%S')

        # Lưu ảnh chấm công
        photo_proof = None
        if self.frame is not None:
            # Đặt tên file ảnh: employee_<employee_id>_<timestamp>.jpg
            date_folder = now.strftime('%Y/%m/%d')
            full_proof_path = os.path.join(PROOF_PATH, date_folder)
            if not os.path.exists(full_proof_path):
                os.makedirs(full_proof_path)
            photo_filename = f"{self.namect}_{self.codect}_{timestamp}.jpg"
            photo_path = os.path.join(full_proof_path, photo_filename)
            photo_path = os.path.join(PROOF_PATH, photo_filename)
            # Chuyển đổi khung hình từ RGB sang BGR để lưu bằng OpenCV
            frame_bgr = cv2.cvtColor(self.frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(photo_path, frame_bgr)
            # Đường dẫn lưu vào database (đường dẫn tương đối để truy cập qua URL)
            photo_proof = f"/proofs/{photo_filename}"

        # Kết nối cơ sở dữ liệu
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="employee_management"
        )
        cursor = connection.cursor()
        cursor.execute(f"SELECT * FROM attendance WHERE employee_id='{self.codect}' AND DATE(date_n_time) = '{today}'")
        result = cursor.fetchall()

        # Xác định trạng thái chấm công
        status = "Enough"
        if not result:
            # Chưa có bản ghi nào trong ngày
            cursor.execute(f"INSERT INTO attendance (employee_id, date_n_time, in_out, status, photo_proof) VALUES ('{self.codect}', '{sql_datetime}', 'In', '{status}', '{photo_proof}')")
        else:
            # Đã có bản ghi trong ngày
            last_record = result[-1]
            if last_record[3] == 'In':
                # Nếu lần cuối là check-in, thì lần này là check-out
                cursor.execute(f"INSERT INTO attendance (employee_id, date_n_time, in_out, status, photo_proof) VALUES ('{self.codect}', '{sql_datetime}', 'Out', '{status}', '{photo_proof}')")
            else:
                # Nếu lần cuối là check-out, thì lần này là check-in mới
                cursor.execute(f"INSERT INTO attendance (employee_id, date_n_time, in_out, status, photo_proof) VALUES ('{self.codect}', '{sql_datetime}', 'In', '{status}', '{photo_proof}')")

        connection.commit()
        cursor.close()
        connection.close()

        # Gửi thông tin đến Arduino LCD qua cổng COM5
        try:
            print("Đang kết nối với Arduino qua cổng COM5...")
            ser = serial.Serial('COM5', 9600, timeout=1)
            time.sleep(2)  # Đợi Arduino khởi động
            
            # Gửi tên nhân viên
            ser.write((self.namect + '\n').encode('utf-8'))
            time.sleep(0.5)  # Thêm thời gian chờ để đảm bảo dữ liệu được gửi
            ser.flush()  # Đảm bảo dữ liệu được gửi hết
            
            print(f"🟢 Gửi thành công đến Arduino: {self.namect}")
            ser.close()
        except Exception as e:
            print(f"⚠️ Không thể kết nối với Arduino qua cổng COM5: {str(e)}")
            if 'ser' in locals():
                ser.close()

        self.destroy()

# Khởi chạy ứng dụng
App(tkinter.Tk(), "Vui lòng tháo kính và nhìn thẳng vào camera để thực hiện chấm công", loadimg())