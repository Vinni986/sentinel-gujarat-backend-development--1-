"""
YOLO Vehicle Detection Model
Uses YOLOv8 for detecting vehicles in images/video frames
"""
import os
from typing import List, Dict, Any
from ultralytics import YOLO


class VehicleDetector:
    """
    Vehicle detector using YOLOv8
    Detects: car, truck, bus, motorcycle
    """
    
    def __init__(self, model_name: str = "yolov8n.pt"):
        """
        Initialize YOLO model
        Args:
            model_name: YOLO model variant (n=nano, s=small, m=medium, l=large, x=xlarge)
        """
        model_path = os.path.join("models", model_name)
        
        # Download model if not exists
        if not os.path.exists(model_path):
            os.makedirs("models", exist_ok=True)
            print(f"Downloading {model_name}...")
            self.model = YOLO(model_name)
            print(f"Model saved to {model_path}")
        else:
            self.model = YOLO(model_path)
            print(f"Loaded model from {model_path}")
        
        # Vehicle classes in COCO dataset (YOLOv8 default)
        self.vehicle_classes = {
            2: 'car',
            3: 'motorcycle', 
            5: 'bus',
            7: 'truck'
        }
    
    def detect(self, image_path: str, confidence_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Detect vehicles in an image
        
        Args:
            image_path: Path to image file
            confidence_threshold: Minimum confidence score (0-1)
            
        Returns:
            List of detections with bounding boxes and metadata
        """
        results = self.model(image_path, conf=confidence_threshold, verbose=False, device="cpu")
        
        detections = []
        
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                
                # Only keep vehicles
                if class_id in self.vehicle_classes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    
                    detection = {
                        'type': self.vehicle_classes[class_id],
                        'confidence': round(confidence, 4),
                        'bbox': {
                            'x': int(x1),
                            'y': int(y1),
                            'width': int(x2 - x1),
                            'height': int(y2 - y1)
                        }
                    }
                    detections.append(detection)
        
        return detections


# Global instance (singleton)
_detector = None

def get_detector() -> VehicleDetector:
    """Get or create global detector instance"""
    global _detector
    if _detector is None:
        _detector = VehicleDetector()
    return _detector
