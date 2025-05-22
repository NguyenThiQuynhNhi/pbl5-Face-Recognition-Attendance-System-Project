import os
from time import time
import cv2
import cvzone
from cvzone.FaceDetectionModule import FaceDetector

####################################
classID = 0  # 0 is fake, 1 is real
confidence = 0.8
blurThreshold = 35
debug = False
offsetPercentageW = 10
offsetPercentageH = 20
camWidth, camHeight = 640, 480
floatingPoint = 6
maxImages = 100  # Số lượng ảnh cần thu thập

# ------ Output folder --------
baseFolders = ["Dataset/All", "Dataset/Real"] if classID == 1 else ["Dataset/All", "Dataset/Fake"]
for folder in baseFolders:
    os.makedirs(folder, exist_ok=True)

cap = cv2.VideoCapture(0)
cap.set(3, camWidth)
cap.set(4, camHeight)

detector = FaceDetector()

savedCount = 0  # Biến đếm số ảnh đã lưu

while savedCount < maxImages:
    success, img = cap.read()
    imgOut = img.copy()
    img, bboxs = detector.findFaces(img, draw=False)

    listBlur = []
    listInfo = []

    if bboxs:
        for bbox in bboxs:
            x, y, w, h = bbox["bbox"]
            score = bbox["score"][0]

            if score > confidence:
                offsetW = (offsetPercentageW / 100) * w
                x = max(0, int(x - offsetW))
                w = max(0, int(w + offsetW * 2))

                offsetH = (offsetPercentageH / 100) * h
                y = max(0, int(y - offsetH * 3))
                h = max(0, int(h + offsetH * 3.5))

                imgFace = img[y:y + h, x:x + w]
                cv2.imshow("Face", imgFace)

                blurValue = int(cv2.Laplacian(imgFace, cv2.CV_64F).var())
                listBlur.append(blurValue > blurThreshold)

                ih, iw, _ = img.shape
                xc, yc = x + w / 2, y + h / 2

                xcn = min(1, round(xc / iw, floatingPoint))
                ycn = min(1, round(yc / ih, floatingPoint))
                wn = min(1, round(w / iw, floatingPoint))
                hn = min(1, round(h / ih, floatingPoint))

                listInfo.append(f"{classID} {xcn} {ycn} {wn} {hn}\n")

                cv2.rectangle(imgOut, (x, y, w, h), (255, 0, 0), 3)
                cvzone.putTextRect(imgOut, f'Score: {int(score * 100)}% Blur: {blurValue}', (x, y - 10),
                                   scale=2, thickness=3)

    # ------ Save if all faces clear --------
    if listBlur and all(listBlur):
        timeNow = str(time()).replace(".", "")
        for folder in baseFolders:
            cv2.imwrite(f"{folder}/{timeNow}.jpg", img)
            with open(f"{folder}/{timeNow}.txt", 'a') as f:
                f.writelines(listInfo)
        savedCount += 1
        print(f"[INFO] Đã lưu {savedCount}/{maxImages} ảnh.")

    cv2.imshow("Image", imgOut)
    cv2.waitKey(1)

# ------ Kết thúc --------
print("[DONE] Thu thập dữ liệu hoàn tất.")
cap.release()
cv2.destroyAllWindows()
