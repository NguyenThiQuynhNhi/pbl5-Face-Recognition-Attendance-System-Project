from ultralytics import YOLO
import os

model = YOLO('yolov8n.pt')

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))    
    data_path = os.path.join(current_dir, "Dataset/SplitData/data.yaml")
    project_path = os.path.join(current_dir, "runs")
    
    data_path = data_path.replace("\\", "/")
    project_path = project_path.replace("\\", "/")
        
    model.train(
        data=data_path,
        epochs=3,
        project=project_path,  
        name='train'     
    )

if __name__ == '__main__':
    main()