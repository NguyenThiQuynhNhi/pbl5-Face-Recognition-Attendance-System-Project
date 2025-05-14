--> Nhận diện khuôn mặt
  Phát hiện khuôn mặt bằng MTCNN, trích xuất đặt trừng FaceNet, dùng SVM để phân loại

  Tải thư viện cần thiết: pip install -r requirements.txt 

  Chụp 100 ảnh để chuẩn bị xử lý
  - Trước khi chạy file capture thì tạo folder mới tại Dataset/FaceData/raw (tên ở đây và tên nhập ở file capture là giống nhau, tránh nhập sai gây lỗi. Đặt tên thư mục theo employeeId)
  - python capture.py

  Tiền xử lý dữ liệu cắt khuôn mặt từ ảnh gốc:
  - python src/align_dataset_mtcnn.py  Dataset/FaceData/raw Dataset/FaceData/processed --image_size 160 --margin 32  --random_order --gpu_memory_fraction 0.25

  Train model nhận diện khuôn mặt:
  - python src/classifier.py TRAIN Dataset/FaceData/processed Models/20180402-114759.pb Models/facemodel.pkl --batch_size 1000

  Chaỵ chương trình nhâ diện khuôn mặt:
  - python src/face_rec_cam.py

  --> Ấn q để thoát khung nhận diện

------- Anti Spoofing (Chống giả mạo) -------
 (1 là mở folder này riêng ở cửa sổ khác rồi train xong cop model cần thiết qua cho việc nhận diện
  2 là cd tới folder cho đúng rồi chạy trong cùng 1 project luôn)
- Run file dataCollection.py (lưu ý đổi classID cho đúng: 0 là fake, 1 là real)
- Vào test_spoofing/Dataset/Datacollect rồi copy mấy ảnh mà mình vừa chụp xong qua thư mục tương ứng (tầm 100-200 cái)
 + Nếu đang lấy real thì để vào folder real còn fake thì vào folder fake (Nhớ để id cho đúng)
 + Cop tất cả ảnh real và fake đó folder: all

- Run file splitData.py, (nó tự tạo folder SplitData, nếu trước đó đã có thì xóa đi)
 + Config lại file data.yaml trong SplitData lại tương tự thế này:  
    path: D:\PBL5\Face-Recognition\test_spoofing\Dataset\SplitData
    train: train/images
    val: val/images
    test: test/images

    nc: 2
    names: ['fake', 'real']

- Run file train.py để train model
- Vào runs/detect/train/weights: lấy model best.pt rồi cop qua project nhận diện của mình, ở Models
 (tác dụng của folder test_spoofing là chỉ để train được model này để dùng thôi, còn project chính, xử lý logic gì vẫn ở bên kia, nhận diện khuôn mặt)
