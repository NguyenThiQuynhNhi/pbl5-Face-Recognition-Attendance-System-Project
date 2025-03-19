import tkinter
import cv2
from PIL import Image, ImageTk
import tkinter.messagebox
import datetime
import mysql.connector  
from face_recognition import face_recognition
print("face_recognition loaded successfully")
import os

class MyVideoCapture:
    def __init__(self, video_source):
        self.vid = cv2.VideoCapture(video_source)
        if not self.vid.isOpened():
            raise ValueError("Unable to open video source", video_source)
        self.width = self.vid.get(cv2.CAP_PROP_FRAME_WIDTH)
        self.height = self.vid.get(cv2.CAP_PROP_FRAME_HEIGHT)

    def __del__(self):
        if self.vid.isOpened():
            self.vid.release()

    def get_frame(self):
        if self.vid.isOpened():
            ret, frame = self.vid.read()
            frame = cv2.resize(frame, (640, 480))
            if ret:
                return (ret, cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            else:
                return (ret, None)

class App:
    def __init__(self, window, window_title, listimg, video_source=0):
        self.listimg = listimg
        self.window = window
        self.window.config(bg="#FFC470")
        self.window.title(window_title)
        self.window.geometry(f"+{450}+{100}")
        self.video_source = video_source
        self.vid = MyVideoCapture(video_source)
        self.canvas = tkinter.Canvas(window, width=self.vid.width, height=self.vid.height)
        self.canvas.pack()
        self.btn_getTimekeeping = tkinter.Button(window, text="Chấm công", width=50, command=self.getvideo, font=("SVN-HC calvous", 14, "bold"), foreground="#FFC470", bg="#BD2C13")
        self.btn_getTimekeeping.pack(anchor=tkinter.CENTER, expand=True)

        self.delay = 1
        self.update()
        self.window.mainloop()

    def getvideo(self):
        ret, frame = self.vid.get_frame()
        frame = cv2.resize(frame, (0, 0), None, fx=0.5, fy=0.5)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        encodeface = face_recognition.face_encodings(frame)
        matchindex = 0
        if not encodeface:
            tkinter.messagebox.showinfo(title="Notification", message="Không thể nhận dạng")
        else:
            matchindex = 0
            for index, encodeknow in enumerate(self.listimg.encodelist):
                if face_recognition.face_distance(encodeknow, encodeface) < face_recognition.face_distance(self.listimg.encodelist[matchindex], encodeface):
                    matchindex = index
                    rate = face_recognition.face_distance(encodeknow, encodeface)
            print(rate)
            if rate <= 0.5:
                dialog = DialogBox(self.window, "Xác nhận thông tin", self.listimg.classname[matchindex], self.listimg.namect[matchindex])
                image_label = tkinter.Label(dialog)
                image_label.pack()
                image = Image.open(f"image/{self.listimg.classname[matchindex]}.jpg")
                resized_image = image.resize((200, 200))
                tk_image = ImageTk.PhotoImage(resized_image)
                image_label.configure(image=tk_image)
                dialog.mainloop()
            else:
                tkinter.messagebox.showinfo(title="Notification", message="Không thể nhận dạng")

    def update(self):
        ret, frame = self.vid.get_frame()
        if ret:
            self.photo = ImageTk.PhotoImage(image=Image.fromarray(frame))
            self.canvas.create_image(0, 0, image=self.photo, anchor=tkinter.NW)
        self.window.after(self.delay, self.update)

class loadimg:
    path = "image"
    images = []
    classname = []
    namect = []
    encodelist = []
    imgsrclist = []

    def __init__(self):
        # Kết nối MySQL
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="quanlychamcong"
        )
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM CauThu")
        player_rows = cursor.fetchall()
        for row in player_rows:
            self.imgsrclist.append(row[2])  
            self.namect.append(row[1])      
        for cl in self.imgsrclist:
            curimg = cv2.imread(f"{self.path}/{cl}")
            self.images.append(curimg)
            self.classname.append(os.path.splitext(cl)[0])
        for img in self.images:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            encode = face_recognition.face_encodings(img)[0]
            self.encodelist.append(encode)
        cursor.close()
        connection.close()

class DialogBox(tkinter.Toplevel):
    def __init__(self, parent, title, codect, namect):
        super().__init__(parent)
        self.codect = codect
        self.namect = namect
        self.title(title)
        self.config(bg="#FFC470")
        self.geometry("400x400+600+150")
        label = tkinter.Label(self, text="Mã cầu thủ: " + codect, font=("SVN-HC calvous", 14, "bold"), foreground="#1A4185")
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
        # Kết nối MySQL
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="quanlychamcong"
        )
        cursor = connection.cursor()
        cursor.execute(f"SELECT * FROM ChamCong WHERE MaCauThu='{self.codect}' AND YEAR(NgayChamCong) = {now.year} AND MONTH(NgayChamCong) = {now.month} AND DAY(NgayChamCong) = {now.day}")
        ChamCong_rows = cursor.fetchall()
        count = len(ChamCong_rows)
        if count == 0:
            state = "tập trung đúng giờ" if now.hour < 9 else "tập trung muộn"
            cursor.execute("INSERT INTO ChamCong (MaCauThu, NgayChamCong, `InOut`, TrangThai) VALUES (%s, %s, %s, %s)",
                           (self.codect, sql_datetime, 'in', state))
            tkinter.messagebox.showinfo(title="Notification", message=f"Đã chấm công thành công. {state} checkin: {sql_datetime}")
        elif count == 1:
            state = "về đúng giờ" if now.hour >= 15 else "về sớm"
            cursor.execute("INSERT INTO ChamCong (MaCauThu, NgayChamCong, `InOut`, TrangThai) VALUES (%s, %s, %s, %s)",
                           (self.codect, sql_datetime, 'out', state))
            tkinter.messagebox.showinfo(title="Notification", message=f"Đã chấm công thành công. {state} checkout: {sql_datetime}")
        elif count == 2:
            tkinter.messagebox.showinfo(title="Notification", message="Đã chấm công")
        connection.commit()
        cursor.close()
        connection.close()
        self.destroy()

# Khởi chạy ứng dụng
App(tkinter.Tk(), "Vui lòng tháo kính và nhìn thẳng vào camera để thực hiện chấm công", loadimg(), 0)