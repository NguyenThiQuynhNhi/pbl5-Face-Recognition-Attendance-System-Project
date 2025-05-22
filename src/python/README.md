--> Nhận diện khuôn mặt
  Phát hiện khuôn mặt bằng MTCNN, trích xuất đặt trừng FaceNet, dùng SVM để phân loại

  Tải thư viện cần thiết: pip install -r requirements.txt 

  Chụp 100 ảnh để chuẩn bị xử lý
  - Trước khi chạy file capture thì tạo folder mới tại Dataset/FaceData/raw (tên ở đây và tên nhập ở file capture là giống nhau, tránh nhập sai gây lỗi. Đặt tên thư mục theo employeeId)
  - python capture.py

  Tiền xử lý dữ liệu cắt khuôn mặt từ ảnh gốc:
  - python src/align_dataset_mtcnn.py  Dataset/FaceData/raw Dataset/FaceData/processed --image_size 160 --margin 32 --random_order --gpu_memory_fraction 0.25

  Train model nhận diện khuôn mặt:
  - python src/classifier.py TRAIN Dataset/FaceData/processed Models/20180402-114759.pb Models/facemodel.pkl --batch_size 1000

  Chaỵ chương trình nhâ diện khuôn mặt:
  - python src/face_rec_cam.py

  --> Ấn q để thoát khung nhận diện

------- Anti Spoofing (Chống giả mạo) -------
LƯU Ý đổi classID cho đúng: 0 là fake, 1 là real
ví dụ: bạn muốn nạp ảnh để nhận diện real => chỉnh class = 1
       ngược lại, bạn muốn nạp ảnh để nhận diện fake => chỉnh class = 0
- Run file "python dataCollection.py" 

- Run file "python splitData.py"

- Run file "python train.py" để train model
- Sau khi train xong vào runs/detect/train/weights: lấy model best.pt rồi copy qua project nhận diện của mình, ở thư mục Models.
 (tác dụng của folder test_spoofing là chỉ để train được model này để dùng thôi, còn project chính, xử lý logic gì vẫn ở bên kia, nhận diện khuôn mặt)
