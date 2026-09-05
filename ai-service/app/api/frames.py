"""
Frame Processing API
Handles single frame and video stream processing
"""
import os
import uuid
import cv2
import tempfile
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from PIL import Image
import numpy as np

from app.models.yolo import get_detector
from app.models.ocr import get_plate_reader


router = APIRouter(prefix="/process", tags=["Processing"])

# Directories
UPLOAD_DIR = "uploads"
EVIDENCE_DIR = "evidence"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EVIDENCE_DIR, exist_ok=True)


@router.post("/frame")
async def process_frame(
    image: UploadFile = File(...),
    camera_id: str = Form(...)
):
    """
    Process a single frame:
    1. Detect vehicles with YOLO
    2. For each vehicle, try to read number plate with OCR
    3. Save evidence images
    4. Return detection results
    
    Args:
        image: Uploaded image file
        camera_id: Camera identifier (e.g., CAM-001)
        
    Returns:
        JSON with detections, plates, and evidence paths
    """
    
    # Validate camera_id
    if not camera_id:
        raise HTTPException(status_code=400, detail="camera_id is required")
    
    # Generate unique ID for this processing job
    job_id = str(uuid.uuid4())
    image_path = os.path.join(UPLOAD_DIR, f"{job_id}.jpg")
    
    try:
        # Save uploaded image
        contents = await image.read()
        with open(image_path, "wb") as f:
            f.write(contents)
        
        # Step 1: Detect vehicles
        detector = get_detector()
        vehicles = detector.detect(image_path, confidence_threshold=0.5)
        
        if not vehicles:
            return {
                'success': True,
                'detections': [],
                'totalVehicles': 0,
                'message': 'No vehicles detected'
            }
        
        # Step 2: Process each vehicle
        img = Image.open(image_path)
        plate_reader = get_plate_reader()
        
        detections = []
        
        for i, vehicle in enumerate(vehicles):
            bbox = vehicle['bbox']
            
            # Crop vehicle region
            vehicle_crop = img.crop((
                bbox['x'],
                bbox['y'],
                bbox['x'] + bbox['width'],
                bbox['y'] + bbox['height']
            ))
            
            # Save vehicle crop as evidence
            vehicle_evidence_path = os.path.join(EVIDENCE_DIR, f"{job_id}_vehicle_{i}.jpg")
            vehicle_crop.save(vehicle_evidence_path)
            
            # Try OCR on vehicle crop
            plate_result = None
            try:
                vehicle_array = np.array(vehicle_crop)
                plate_result = plate_reader.read_plate(vehicle_array)
            except Exception as e:
                print(f"OCR failed for vehicle {i}: {e}")
            
            detection = {
                'vehicleType': vehicle['type'],
                'confidence': vehicle['confidence'],
                'boundingBox': bbox,
                'imagePath': f"/evidence/{os.path.basename(vehicle_evidence_path)}",
                'plate': plate_result,
                'cameraId': camera_id,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'jobId': job_id
            }
            
            detections.append(detection)
        
        return {
            'success': True,
            'detections': detections,
            'totalVehicles': len(vehicles),
            'jobId': job_id
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    
    finally:
        # Clean up uploaded file
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except:
                pass


@router.post("/video")
async def process_video(
    video: UploadFile = File(...),
    camera_id: str = Form(...),
    frame_interval: int = Form(10)
):
    """
    Process a CCTV video by sampling every Nth frame.

    This provides continuous video analysis without attempting
    inference on every frame, which is important on CPU hardware.
    """

    if not camera_id:
        raise HTTPException(status_code=400, detail="camera_id is required")

    try:
        frame_interval = max(1, int(frame_interval))
    except Exception:
        frame_interval = 10

    job_id = str(uuid.uuid4())
    suffix = os.path.splitext(video.filename or ".mp4")[1] or ".mp4"

    temp_path = os.path.join(
        UPLOAD_DIR,
        f"{job_id}{suffix}"
    )

    try:
        contents = await video.read()

        with open(temp_path, "wb") as f:
            f.write(contents)

        cap = cv2.VideoCapture(temp_path)

        if not cap.isOpened():
            raise HTTPException(
                status_code=400,
                detail="Unable to open video file"
            )

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)

        detector = get_detector()
        plate_reader = get_plate_reader()

        detections = []
        frame_number = 0
        frames_processed = 0

        while True:
            ok, frame = cap.read()

            if not ok:
                break

            current_frame = frame_number
            frame_number += 1

            if current_frame % frame_interval != 0:
                continue

            frames_processed += 1

            timestamp_seconds = current_frame / fps if fps > 0 else 0

            frame_path = os.path.join(
                UPLOAD_DIR,
                f"{job_id}_frame_{current_frame}.jpg"
            )

            cv2.imwrite(frame_path, frame)

            try:
                vehicles = detector.detect(
                    frame_path,
                    confidence_threshold=0.5
                )
            except Exception as e:
                print(
                    f"Vehicle detection failed on frame "
                    f"{current_frame}: {e}"
                )
                vehicles = []

            img = Image.open(frame_path)

            for i, vehicle in enumerate(vehicles):
                bbox = vehicle["bbox"]

                vehicle_crop = img.crop((
                    bbox["x"],
                    bbox["y"],
                    bbox["x"] + bbox["width"],
                    bbox["y"] + bbox["height"]
                ))

                evidence_path = os.path.join(
                    EVIDENCE_DIR,
                    f"{job_id}_frame_{current_frame}_vehicle_{i}.jpg"
                )

                vehicle_crop.save(evidence_path)

                plate_result = None

                try:
                    vehicle_array = np.array(vehicle_crop)
                    plate_result = plate_reader.read_plate(vehicle_array)
                except Exception as e:
                    print(
                        f"OCR failed on frame "
                        f"{current_frame}, vehicle {i}: {e}"
                    )

                detection_time = datetime.utcnow()

                detections.append({
                    "vehicleType": vehicle["type"],
                    "confidence": vehicle["confidence"],
                    "boundingBox": bbox,
                    "imagePath": (
                        f"/evidence/"
                        f"{os.path.basename(evidence_path)}"
                    ),
                    "plate": plate_result,
                    "cameraId": camera_id,
                    "timestamp": detection_time.isoformat() + "Z",
                    "jobId": job_id,
                    "frameNumber": current_frame,
                })

            try:
                os.remove(frame_path)
            except Exception:
                pass

        cap.release()

        return {
            "success": True,
            "jobId": job_id,
            "cameraId": camera_id,
            "totalFrames": total_frames,
            "framesProcessed": frames_processed,
            "frameInterval": frame_interval,
            "detections": detections,
        }

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Video processing error: {str(e)}"
        )

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@router.get("/health")
async def health_check():
    """Check if AI models are loaded and ready"""
    try:
        detector = get_detector()
        plate_reader = get_plate_reader()
        
        return {
            'status': 'healthy',
            'models': {
                'yolo': 'loaded',
                'ocr': 'loaded'
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }
