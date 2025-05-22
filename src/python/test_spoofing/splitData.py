import os
import random
import shutil
from itertools import islice

outputFolderPath = "Dataset/SplitData"
inputFolderPath = "Dataset/all"
splitRatio = {"train": 0.7, "val": 0.2, "test": 0.1}
classes = ["fake", "real"]

# -------- Xóa thư mục cũ nếu có --------
if os.path.exists(outputFolderPath):
    shutil.rmtree(outputFolderPath)

# -------- Tạo lại các thư mục cần thiết --------
for phase in ["train", "val", "test"]:
    os.makedirs(f"{outputFolderPath}/{phase}/images", exist_ok=True)
    os.makedirs(f"{outputFolderPath}/{phase}/labels", exist_ok=True)

# -------- Lấy danh sách file gốc --------
listNames = os.listdir(inputFolderPath)
uniqueNames = list(set([name.split('.')[0] for name in listNames]))

# -------- Xáo trộn và chia dữ liệu --------
random.shuffle(uniqueNames)
lenData = len(uniqueNames)
lenTrain = int(lenData * splitRatio['train'])
lenVal = int(lenData * splitRatio['val'])
lenTest = lenData - lenTrain - lenVal  # đảm bảo tổng bằng lenData

# -------- Chia danh sách --------
lengthToSplit = [lenTrain, lenVal, lenTest]
Input = iter(uniqueNames)
Output = [list(islice(Input, n)) for n in lengthToSplit]

print(f'Total Images: {lenData} \nSplit: {len(Output[0])} train, {len(Output[1])} val, {len(Output[2])} test')

# -------- Copy ảnh và nhãn --------
phases = ["train", "val", "test"]
for i, phaseNames in enumerate(Output):
    for name in phaseNames:
        shutil.copy(f"{inputFolderPath}/{name}.jpg", f"{outputFolderPath}/{phases[i]}/images/{name}.jpg")
        shutil.copy(f"{inputFolderPath}/{name}.txt", f"{outputFolderPath}/{phases[i]}/labels/{name}.txt")

print("Split Process Completed...")

# -------- Tạo file data.yaml --------
abs_output_path = os.path.abspath(outputFolderPath).replace("\\", "/")

dataYaml = f"""path: {abs_output_path}
train: {abs_output_path}/train/images
val: {abs_output_path}/val/images
test: {abs_output_path}/test/images

nc: {len(classes)}
names: {classes}
"""

with open(f"{outputFolderPath}/data.yaml", 'w', encoding='utf-8') as f:
    f.write(dataYaml)

print("✅ File data.yaml đã được tạo chuẩn.")