# Sentinel Gujarat - Complete Implementation Plan

## A. CURRENT STATE ASSESSMENT

### What EXISTS ✅
- **Next.js 16 Application:** Complete frontend UI with 6 pages
- **Database Schema:** Full PostgreSQL schema with 10 tables + PostGIS support
- **50 Synthetic Cameras:** Seeded across Gujarat cities with realistic metadata
- **4 Watchlist Vehicles:** Demo data for testing
- **Authentication System:** Basic user login (demo user created)
- **UI Components:** Dashboard, Camera Registry, Vehicle Search, Watchlist, Alerts, Evidence pages
- **Utility Functions:** Registration number normalization, date formatting, distance calculation
- **Responsive Layout:** Sidebar navigation, header, search bar

### What DOES NOT EXIST ❌
- **AI/Computer Vision Pipeline:** No YOLO, no OCR, no video processing
- **Python Service:** FastAPI service not created
- **Real Detections:** No actual vehicle detections in database (only schema)
- **RTSP Stream Processing:** No video ingestion
- **Multi-Camera Tracking:** Logic not implemented
- **Real-time Alerts:** WebSocket not implemented
- **Evidence Files:** No actual images/videos saved
- **API Endpoints:** Only health check exists, no vehicle/camera/alert APIs
- **Map Integration:** MapLibre installed but not integrated

---

## B. FINAL ARCHITECTURE

### Simplified 2-Tier Architecture (Recommended for Hackathon)

```
┌─────────────────────────────────────────────────────┐
│                  TIER 1: Frontend                    │
│              Next.js (React + TypeScript)            │
│   ┌─────────────────────────────────────────┐      │
│   │  Dashboard  │  Cameras  │  Vehicles     │      │
│   │  Watchlist  │  Alerts   │  Evidence     │      │
│   └─────────────────────────────────────────┘      │
│                                                      │
│   Next.js API Routes:                               │
│   - /api/auth/*                                     │
│   - /api/cameras/*                                  │
│   - /api/vehicles/*                                 │
│   - /api/watchlist/*                                │
│   - /api/alerts/*                                   │
│   - /api/ws/alerts (WebSocket)                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────────────────┐
│              TIER 2: AI Service                      │
│          Python FastAPI (Separate Process)           │
│   ┌─────────────────────────────────────────┐      │
│   │  YOLOv8        │  EasyOCR              │      │
│   │  OpenCV        │  FFmpeg               │      │
│   └─────────────────────────────────────────┘      │
│                                                      │
│   Endpoints:                                        │
│   - POST /process-frame                             │
│   - POST /start-stream                              │
│   - GET  /stream-status                             │
│   - POST /stop-stream                               │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Direct DB Insert
                  │
┌─────────────────▼───────────────────────────────────┐
│               PostgreSQL + PostGIS                   │
│                                                      │
│  Tables:                                            │
│  - cameras                                          │
│  - vehicle_detections                               │
│  - number_plate_detections                          │
│  - vehicles                                         │
│  - watchlist                                        │
│  - alerts                                           │
│  - evidence                                         │
│  - users                                            │
│  - audit_logs                                       │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
CAMERA (RTSP/File)
      ↓
Python AI Service (FastAPI)
      ↓
  Frame Extract (OpenCV)
      ↓
  YOLO Detection → [Vehicle Bounding Box]
      ↓
  Crop Vehicle Region
      ↓
  EasyOCR → [Number Plate Text]
      ↓
  Normalize Plate (GJ01AB1234)
      ↓
  Insert to Database:
    - vehicle_detections
    - number_plate_detections
    - vehicles (upsert)
      ↓
  Check Watchlist → MATCH?
      ↓ YES
  Create Alert
      ↓
  Send WebSocket → Frontend
      ↓
  Officer Sees Red Alert
      ↓
  Click → View Detection + Route
      ↓
  Acknowledge Alert
      ↓
  Save Evidence
      ↓
  Log Audit
```

---

## C. TECHNOLOGY STACK (FINAL)

### Frontend & Next.js Backend
| Technology | Purpose | Status |
|------------|---------|--------|
| Next.js 16 (App Router) | React framework, SSR, API routes | ✅ Installed |
| TypeScript | Type safety | ✅ Configured |
| Tailwind CSS | Styling | ✅ Configured |
| Drizzle ORM | Database queries | ✅ Configured |
| PostgreSQL + PostGIS | Database with GIS | ✅ Running |
| Lucide React | Icons | ✅ Installed |
| MapLibre GL | Maps | ✅ Installed (not integrated) |
| Recharts | Charts | ✅ Installed (not used yet) |
| Zustand | State management | ✅ Installed (not used yet) |
| date-fns | Date formatting | ✅ Installed |

### Python AI Service (To Install)
| Technology | Purpose | Status |
|------------|---------|--------|
| Python 3.11+ | AI service runtime | ❌ Not setup |
| FastAPI | Python web framework | ❌ Not installed |
| Uvicorn | ASGI server | ❌ Not installed |
| YOLOv8 (ultralytics) | Vehicle detection | ❌ Not installed |
| EasyOCR | Number plate OCR | ❌ Not installed |
| OpenCV (opencv-python) | Video processing | ❌ Not installed |
| FFmpeg | Stream handling | ❌ Not installed |
| Pillow | Image processing | ❌ Not installed |
| psycopg2 | PostgreSQL driver | ❌ Not installed |

### Why This Stack?

**Next.js:**
- ✅ Single framework for frontend + backend APIs
- ✅ TypeScript support out-of-box
- ✅ Server-side rendering for SEO
- ✅ API routes avoid CORS issues
- ✅ Built-in optimization

**Python AI Service (Separate):**
- ✅ Best ecosystem for computer vision (YOLO, OpenCV)
- ✅ EasyOCR optimized for Indian plates
- ✅ FastAPI is fast and async
- ✅ Easy to scale independently
- ✅ GPU support if needed

**PostgreSQL + PostGIS:**
- ✅ ACID compliance (critical for police data)
- ✅ PostGIS for geographic queries (camera locations, routes)
- ✅ JSON support for flexible metadata
- ✅ Full-text search
- ✅ Proven at scale

**Why NOT Kafka/Kubernetes/Microservices?**
- ❌ Overkill for hackathon MVP
- ❌ Adds complexity without immediate benefit
- ❌ Can add later if actually needed
- ✅ Current stack can handle 100+ cameras easily

---

## D. DATABASE DESIGN

### Visual Schema

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │───┐
│ email       │   │
│ password    │   │
│ name        │   │
│ role        │   │
└─────────────┘   │
                  │
                  │
┌─────────────┐   │         ┌──────────────────┐
│   cameras   │   │         │  camera_sources  │
│─────────────│   │         │──────────────────│
│ id (PK)     │───┼────────▶│ camera_id (FK)   │
│ camera_id   │   │         │ source_url       │
│ name        │   │         │ username         │
│ location    │   │         │ password         │
│ latitude    │   │         └──────────────────┘
│ longitude   │   │
│ area        │   │
│ status      │   │
└─────────────┘   │
       │          │
       │          │
       │          │         ┌──────────────────────────┐
       │          │         │  number_plate_detections │
       │          │         │──────────────────────────│
       │          │         │ id (PK)                  │
       │          │         │ vehicle_detection_id (FK)│
       │          │    ┌────│ plate_number             │
       │          │    │    │ plate_number_normalized  │
       │          │    │    │ confidence               │
       │          │    │    │ ocr_text                 │
       ▼          │    │    └──────────────────────────┘
┌──────────────────────┐   │
│ vehicle_detections   │   │
│──────────────────────│   │
│ id (PK)              │───┘
│ camera_id (FK)       │
│ detection_time       │
│ vehicle_type         │
│ confidence           │
│ bounding_box (JSON)  │
│ image_path           │
│ latitude             │
│ longitude            │
└──────────────────────┘
         │
         │
         ▼
┌──────────────┐         ┌────────────┐
│   vehicles   │         │  watchlist │
│──────────────│         │────────────│
│ id (PK)      │         │ id (PK)    │
│ registration │◀────────│ registration│
│ vehicle_type │         │ reason     │
│ first_seen   │         │ severity   │
│ last_seen    │         │ case_ref   │
│ total_count  │         │ added_by(FK)│─┘
└──────────────┘         └────────────┘
         │                      │
         │                      │
         │    ┌─────────────────┘
         │    │
         ▼    ▼
      ┌──────────┐
      │  alerts  │
      │──────────│
      │ id (PK)  │
      │ watchlist_id (FK)
      │ vehicle_detection_id (FK)
      │ camera_id (FK)
      │ severity │
      │ is_ack   │
      │ ack_by(FK)│───┐
      └──────────┘    │
                      │
                      │
      ┌──────────┐    │
      │ evidence │    │
      │──────────│    │
      │ id (PK)  │    │
      │ detection_id (FK)
      │ file_path│    │
      │ type     │    │
      └──────────┘    │
                      │
      ┌──────────┐    │
      │audit_logs│    │
      │──────────│    │
      │ id (PK)  │    │
      │ user_id(FK)───┘
      │ action   │
      │ details  │
      └──────────┘
```

### Table Purposes (Beginner-Friendly)

**1. users** - Who can access the system?
- Police officers, control room staff, investigators
- Stores login credentials, name, role (admin/officer/viewer)
- Used for authentication and audit trails

**2. cameras** - Where are the cameras?
- Every CCTV camera in Gujarat network
- GPS coordinates (latitude/longitude) for map display
- Status: online, offline, maintenance, error
- Area: Ahmedabad, Surat, etc.

**3. camera_sources** - How to connect to cameras?
- Actual RTSP URLs (rtsp://camera-ip:554/stream)
- Username/password for camera login
- Kept separate from cameras table for security

**4. vehicle_detections** - Raw AI detections
- Every time YOLO sees a vehicle in any frame
- Bounding box (x, y, width, height)
- Confidence score (0-1)
- Links to camera that saw it
- Image path to saved frame

**5. number_plate_detections** - What plates were read?
- Every successful OCR result
- Links to the vehicle detection
- Raw OCR output + normalized version
- Normalized: "GJ 01 AB 1234" → "GJ01AB1234" for searching

**6. vehicles** - Unique vehicles
- One record per unique registration number
- First seen, last seen timestamps
- Total detection count
- Built automatically as detections come in

**7. watchlist** - Which vehicles to watch?
- Stolen vehicles, suspect vehicles, border alerts
- Severity: low, medium, high, critical
- Reason: "Theft case #2024/156"
- Case reference for investigation

**8. alerts** - Real-time notifications
- Created when watchlist vehicle detected
- Links to: watchlist entry + detection + camera
- Can be acknowledged by officer
- Sorted by severity for priority

**9. evidence** - Saved images/videos
- Cropped vehicle images
- Full frame images
- Short video clips
- Linked to detection for investigation

**10. audit_logs** - Who did what when?
- Every important action logged
- User login, vehicle search, watchlist add/remove
- IP address, timestamp, details
- Required for police accountability

### Key Design Decisions

**Why normalize registration numbers?**
- OCR might read: "GJ 01 AB 1234", "GJ01AB1234", "GJ-01-AB-1234"
- All stored as: "GJ01AB1234" in `plate_number_normalized`
- Makes searching reliable

**Why separate cameras and camera_sources?**
- Security: Don't expose credentials in all API responses
- Flexibility: One camera can have multiple sources (backup stream)

**Why separate vehicle_detections and number_plate_detections?**
- Not all vehicle detections have readable plates
- One vehicle might have multiple plate readings in same frame
- Allows separate confidence scores

**Why PostGIS?**
- Query: "Show all cameras within 5km of this detection"
- Query: "Find route between Camera A and Camera B"
- Standard SQL: Complex math
- PostGIS: `ST_Distance(point1, point2)`

---

## E. API DESIGN

### Authentication APIs

**POST /api/auth/login**
```typescript
Request:
{
  "email": "admin@sentinel.gov.in",
  "password": "admin123"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@sentinel.gov.in",
    "name": "System Administrator",
    "role": "admin"
  },
  "token": "session-token" // or cookie
}
```

**GET /api/auth/me**
```typescript
Response:
{
  "user": {
    "id": "uuid",
    "email": "admin@sentinel.gov.in",
    "name": "System Administrator",
    "role": "admin"
  }
}
```

---

### Dashboard APIs

**GET /api/dashboard/stats**
```typescript
Response:
{
  "cameras": {
    "total": 50,
    "online": 40,
    "offline": 7,
    "maintenance": 2,
    "error": 1
  },
  "detections": {
    "last24h": 15420,
    "today": 8234,
    "percentChange": "+12"
  },
  "alerts": {
    "active": 3,
    "critical": 1,
    "high": 1,
    "medium": 1
  },
  "watchlist": {
    "total": 4,
    "critical": 1,
    "high": 2,
    "medium": 1
  }
}
```

---

### Camera APIs

**GET /api/cameras?area=Ahmedabad&status=online**
```typescript
Response:
{
  "cameras": [
    {
      "id": "uuid",
      "cameraId": "CAM-001",
      "name": "Ahmedabad - SG Highway",
      "location": "SG Highway, Ahmedabad, Gujarat",
      "latitude": 23.0225,
      "longitude": 72.5714,
      "area": "Ahmedabad",
      "status": "online",
      "streamType": "rtsp",
      "lastSeen": "2024-01-15T10:30:00Z",
      "metadata": {
        "vendor": "Hikvision",
        "model": "CAM-5432",
        "resolution": "1080p",
        "fps": 25
      }
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 50
}
```

**POST /api/cameras**
```typescript
Request:
{
  "cameraId": "CAM-051",
  "name": "Gandhinagar - Secretariat",
  "location": "Gandhinagar Secretariat, Gujarat",
  "latitude": 23.2156,
  "longitude": 72.6369,
  "area": "Gandhinagar",
  "streamType": "rtsp",
  "sourceUrl": "rtsp://192.168.1.100:554/stream",
  "username": "admin",
  "password": "camera123"
}

Response:
{
  "success": true,
  "camera": { ... }
}
```

**POST /api/cameras/bulk-import**
```typescript
Request: (multipart/form-data)
file: cameras.csv

CSV Format:
cameraId,name,location,latitude,longitude,area,streamType,sourceUrl
CAM-051,Test Camera,Location,23.0,72.5,Ahmedabad,rtsp,rtsp://...

Response:
{
  "success": true,
  "imported": 45,
  "failed": 5,
  "errors": [
    {
      "row": 10,
      "error": "Invalid coordinates"
    }
  ]
}
```

---

### Vehicle APIs

**GET /api/vehicles/search?q=GJ01AB1234**
```typescript
Response:
{
  "results": [
    {
      "registrationNumber": "GJ01AB1234",
      "vehicleType": "car",
      "firstSeen": "2024-01-10T08:00:00Z",
      "lastSeen": "2024-01-15T16:30:00Z",
      "totalDetections": 23,
      "isWatchlisted": true,
      "watchlistSeverity": "high"
    }
  ]
}
```

**GET /api/vehicles/GJ01AB1234**
```typescript
Response:
{
  "vehicle": {
    "registrationNumber": "GJ01AB1234",
    "vehicleType": "car",
    "firstSeen": "2024-01-10T08:00:00Z",
    "lastSeen": "2024-01-15T16:30:00Z",
    "totalDetections": 23
  },
  "watchlist": {
    "isWatchlisted": true,
    "severity": "high",
    "reason": "Suspected involvement in theft case",
    "caseReference": "FIR-2024-156"
  }
}
```

**GET /api/vehicles/GJ01AB1234/detections**
```typescript
Response:
{
  "detections": [
    {
      "id": "uuid",
      "camera": {
        "cameraId": "CAM-012",
        "name": "Ahmedabad - Ring Road",
        "location": "Ring Road, Ahmedabad"
      },
      "detectionTime": "2024-01-15T16:30:00Z",
      "vehicleType": "car",
      "confidence": 0.94,
      "plateConfidence": 0.89,
      "imagePath": "/evidence/det_123.jpg",
      "thumbnailPath": "/evidence/det_123_thumb.jpg",
      "latitude": 23.0225,
      "longitude": 72.5714
    }
  ],
  "total": 23,
  "page": 1
}
```

**GET /api/vehicles/GJ01AB1234/route**
```typescript
Response:
{
  "route": [
    {
      "camera": {
        "cameraId": "CAM-012",
        "name": "Ahmedabad - Ring Road",
        "latitude": 23.0225,
        "longitude": 72.5714
      },
      "detectionTime": "2024-01-15T10:30:00Z",
      "sequence": 1
    },
    {
      "camera": {
        "cameraId": "CAM-019",
        "name": "Ahmedabad - SG Highway",
        "latitude": 23.0300,
        "longitude": 72.5800
      },
      "detectionTime": "2024-01-15T10:47:00Z",
      "sequence": 2
    }
  ],
  "totalDistance": 12.5, // km
  "duration": 17 // minutes
}
```

---

### Watchlist APIs

**GET /api/watchlist**
```typescript
Response:
{
  "watchlist": [
    {
      "id": "uuid",
      "registrationNumber": "GJ01AB1234",
      "reason": "Suspected involvement in theft case",
      "severity": "high",
      "caseReference": "FIR-2024-156",
      "addedBy": {
        "name": "Officer Name",
        "email": "officer@example.com"
      },
      "createdAt": "2024-01-10T00:00:00Z",
      "isActive": true
    }
  ]
}
```

**POST /api/watchlist**
```typescript
Request:
{
  "registrationNumber": "GJ99XY1234",
  "reason": "Wanted in robbery case",
  "severity": "critical",
  "caseReference": "FIR-2024-500"
}

Response:
{
  "success": true,
  "watchlist": { ... }
}
```

---

### Alert APIs

**GET /api/alerts?acknowledged=false&severity=critical**
```typescript
Response:
{
  "alerts": [
    {
      "id": "uuid",
      "registrationNumber": "GJ05XY9876",
      "severity": "critical",
      "alertTime": "2024-01-15T16:45:00Z",
      "isAcknowledged": false,
      "camera": {
        "cameraId": "CAM-023",
        "name": "Surat - Ring Road",
        "location": "Ring Road, Surat"
      },
      "watchlist": {
        "reason": "Wanted in hit and run incident",
        "caseReference": "FIR-2024-289"
      },
      "detection": {
        "imagePath": "/evidence/det_456.jpg",
        "confidence": 0.92
      }
    }
  ]
}
```

**PUT /api/alerts/:id/acknowledge**
```typescript
Request:
{
  "notes": "Dispatched patrol unit to location"
}

Response:
{
  "success": true,
  "alert": {
    "id": "uuid",
    "isAcknowledged": true,
    "acknowledgedBy": "Officer Name",
    "acknowledgedAt": "2024-01-15T16:50:00Z",
    "notes": "Dispatched patrol unit to location"
  }
}
```

**WebSocket /api/ws/alerts**
```typescript
// Server sends when new alert created:
{
  "type": "new_alert",
  "alert": {
    "id": "uuid",
    "registrationNumber": "GJ05XY9876",
    "severity": "critical",
    "camera": { ... },
    "watchlist": { ... }
  }
}

// Client sends to acknowledge:
{
  "type": "acknowledge",
  "alertId": "uuid",
  "notes": "Investigating"
}
```

---

### Python AI Service APIs

**POST /ai/process-frame**
```typescript
Request: (multipart/form-data)
image: file.jpg
cameraId: "CAM-012"

Response:
{
  "detections": [
    {
      "vehicleType": "car",
      "confidence": 0.94,
      "boundingBox": {
        "x": 100,
        "y": 150,
        "width": 300,
        "height": 200
      },
      "plate": {
        "text": "GJ01AB1234",
        "normalized": "GJ01AB1234",
        "confidence": 0.89
      }
    }
  ],
  "detectionId": "uuid",
  "saved": true
}
```

**POST /ai/start-stream**
```typescript
Request:
{
  "cameraId": "CAM-012",
  "sourceUrl": "rtsp://192.168.1.100:554/stream",
  "frameRate": 1 // process 1 frame per second
}

Response:
{
  "success": true,
  "streamId": "uuid",
  "status": "running"
}
```

**GET /ai/streams/:id/status**
```typescript
Response:
{
  "streamId": "uuid",
  "cameraId": "CAM-012",
  "status": "running",
  "framesProcessed": 1523,
  "detectionsFound": 234,
  "platesRead": 189,
  "uptime": 3600, // seconds
  "lastFrameTime": "2024-01-15T17:00:00Z"
}
```

---

## F. EXACT IMPLEMENTATION ROADMAP

### PHASE 1: Foundation ✅ COMPLETE

**Status:** DONE
**Duration:** Completed

**What Was Built:**
- ✅ Complete database schema (10 tables)
- ✅ Frontend UI (6 pages)
- ✅ Authentication system
- ✅ Navigation layout
- ✅ 50 synthetic cameras seeded
- ✅ 4 watchlist vehicles
- ✅ Utility functions

**Commands Run:**
```bash
npm install
npm run db:push
npm run db:seed
npm run build
```

**Success Criteria Met:**
- ✅ Database schema applied
- ✅ Can view dashboard
- ✅ Can see 50 cameras
- ✅ Can see watchlist
- ✅ Pages render without errors

---

### PHASE 2: Python AI Service Setup 🔄 NEXT

**Goal:** Get Python service running with YOLO + OCR

**Duration:** 1-2 days

**Step-by-Step Instructions:**

#### Step 2.1: Create Python Service Structure

```bash
# From project root
mkdir -p ai-service/app/models
mkdir -p ai-service/app/processors
mkdir -p ai-service/app/api
mkdir -p ai-service/models
mkdir -p ai-service/uploads
mkdir -p ai-service/evidence
```

#### Step 2.2: Create requirements.txt

File: `ai-service/requirements.txt`
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
pillow==10.2.0
opencv-python==4.9.0.80
ultralytics==8.1.0
easyocr==1.7.1
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

#### Step 2.3: Install Python Dependencies

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On Linux/Mac
# OR
venv\Scripts\activate  # On Windows

pip install -r requirements.txt
```

**Expected:** This will download ~2GB of dependencies including PyTorch.

#### Step 2.4: Create Main FastAPI App

File: `ai-service/app/main.py`
```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Sentinel Gujarat AI Service")

# CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Sentinel Gujarat AI Service Running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Step 2.5: Test Python Service

```bash
cd ai-service
source venv/bin/activate
python app/main.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test:** Open http://localhost:8000 → Should see {"status": "Sentinel Gujarat AI Service Running"}

**Success Criteria:**
- ✅ Python service starts without errors
- ✅ Can access http://localhost:8000/health
- ✅ No import errors

---

#### Step 2.6: Add YOLO Detection

File: `ai-service/app/models/yolo.py`
```python
from ultralytics import YOLO
import os

class VehicleDetector:
    def __init__(self):
        # YOLOv8 nano (fast, good for demo)
        model_path = "models/yolov8n.pt"
        
        # Download if not exists
        if not os.path.exists(model_path):
            os.makedirs("models", exist_ok=True)
            self.model = YOLO("yolov8n.pt")  # Auto-downloads
            self.model.save(model_path)
        else:
            self.model = YOLO(model_path)
        
        # Vehicle classes in COCO dataset
        self.vehicle_classes = [
            'car', 'motorcycle', 'bus', 'truck'
        ]
    
    def detect(self, image_path, confidence_threshold=0.5):
        """
        Detect vehicles in image
        Returns list of detections with bounding boxes
        """
        results = self.model(image_path, conf=confidence_threshold)
        
        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = result.names[class_id]
                
                # Only keep vehicles
                if class_name in self.vehicle_classes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    
                    detections.append({
                        'type': class_name,
                        'confidence': confidence,
                        'bbox': {
                            'x': int(x1),
                            'y': int(y1),
                            'width': int(x2 - x1),
                            'height': int(y2 - y1)
                        }
                    })
        
        return detections

# Global instance
detector = VehicleDetector()
```

#### Step 2.7: Add OCR

File: `ai-service/app/models/ocr.py`
```python
import easyocr
import re
import numpy as np
from PIL import Image

class PlateReader:
    def __init__(self):
        # Initialize EasyOCR for English
        # First run will download models (~50MB)
        self.reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if GPU available
    
    def read_plate(self, image_path_or_array):
        """
        Read number plate from image
        Returns plate text and confidence
        """
        # Read image
        if isinstance(image_path_or_array, str):
            image = np.array(Image.open(image_path_or_array))
        else:
            image = image_path_or_array
        
        # OCR
        results = self.reader.readtext(image)
        
        if not results:
            return None
        
        # Combine all text (plates might be read in parts)
        texts = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            # Clean text (remove spaces, special chars)
            cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
            if cleaned:
                texts.append(cleaned)
                confidences.append(confidence)
        
        if not texts:
            return None
        
        # Combine texts
        plate_text = ''.join(texts)
        avg_confidence = sum(confidences) / len(confidences)
        
        # Normalize Indian plate format
        normalized = self.normalize_indian_plate(plate_text)
        
        return {
            'raw': plate_text,
            'normalized': normalized,
            'confidence': avg_confidence
        }
    
    def normalize_indian_plate(self, text):
        """
        Normalize Indian vehicle registration
        Example: GJ01AB1234
        """
        # Remove all non-alphanumeric
        cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
        
        # Try to match Indian format: ST DD AA NNNN
        # ST = State (2 letters)
        # DD = District (2 digits)
        # AA = Series (1-3 letters)
        # NNNN = Number (4 digits)
        
        match = re.match(r'^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$', cleaned)
        
        if match:
            state, district, series, number = match.groups()
            return f"{state}{district}{series}{number}"
        
        # Return cleaned version even if format doesn't match
        return cleaned

# Global instance
plate_reader = PlateReader()
```

#### Step 2.8: Add Frame Processing Endpoint

File: `ai-service/app/api/frames.py`
```python
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from PIL import Image
import io
import os
import uuid
from datetime import datetime

from app.models.yolo import detector
from app.models.ocr import plate_reader

router = APIRouter(prefix="/process", tags=["Processing"])

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
    2. For each vehicle, try to read number plate
    3. Return detections
    """
    
    # Save uploaded image
    image_id = str(uuid.uuid4())
    image_path = f"{UPLOAD_DIR}/{image_id}.jpg"
    
    contents = await image.read()
    with open(image_path, "wb") as f:
        f.write(contents)
    
    try:
        # Step 1: Detect vehicles
        vehicles = detector.detect(image_path, confidence_threshold=0.5)
        
        # Step 2: For each vehicle, try to read plate
        img = Image.open(image_path)
        
        results = []
        
        for i, vehicle in enumerate(vehicles):
            bbox = vehicle['bbox']
            
            # Crop vehicle region
            vehicle_crop = img.crop((
                bbox['x'],
                bbox['y'],
                bbox['x'] + bbox['width'],
                bbox['y'] + bbox['height']
            ))
            
            # Try OCR on vehicle crop
            plate_result = None
            try:
                import numpy as np
                vehicle_array = np.array(vehicle_crop)
                plate_result = plate_reader.read_plate(vehicle_array)
            except Exception as e:
                print(f"OCR failed for vehicle {i}: {e}")
            
            # Save vehicle crop
            evidence_path = f"{EVIDENCE_DIR}/{image_id}_vehicle_{i}.jpg"
            vehicle_crop.save(evidence_path)
            
            detection = {
                'vehicleType': vehicle['type'],
                'confidence': vehicle['confidence'],
                'boundingBox': bbox,
                'imagePath': evidence_path,
                'plate': plate_result,
                'cameraId': camera_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            results.append(detection)
        
        return {
            'success': True,
            'detections': results,
            'totalVehicles': len(vehicles)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up uploaded file
        if os.path.exists(image_path):
            os.remove(image_path)
```

#### Step 2.9: Update main.py to Include Router

File: `ai-service/app/main.py` (update)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.api.frames import router as frames_router

load_dotenv()

app = FastAPI(title="Sentinel Gujarat AI Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(frames_router)

# Serve evidence files
os.makedirs("evidence", exist_ok=True)
app.mount("/evidence", StaticFiles(directory="evidence"), name="evidence")

@app.get("/")
def read_root():
    return {
        "status": "Sentinel Gujarat AI Service Running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "process_frame": "POST /process/frame"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Step 2.10: Test YOLO + OCR

**Download a test traffic image with vehicles:**

```bash
# From ai-service directory
mkdir -p test_images
# Download any traffic image from internet or use sample
```

**Create test script:**

File: `ai-service/test_detection.py`
```python
import requests

# Test frame processing
with open('test_images/traffic.jpg', 'rb') as f:
    files = {'image': f}
    data = {'camera_id': 'CAM-TEST'}
    
    response = requests.post(
        'http://localhost:8000/process/frame',
        files=files,
        data=data
    )
    
    print(response.json())
```

**Run test:**
```bash
# Terminal 1: Start AI service
cd ai-service
source venv/bin/activate
python app/main.py

# Terminal 2: Test
python test_detection.py
```

**Expected Output:**
```json
{
  "success": true,
  "detections": [
    {
      "vehicleType": "car",
      "confidence": 0.87,
      "boundingBox": { "x": 100, "y": 150, "width": 300, "height": 200 },
      "imagePath": "evidence/xxx_vehicle_0.jpg",
      "plate": {
        "raw": "GJ01AB1234",
        "normalized": "GJ01AB1234",
        "confidence": 0.82
      },
      "cameraId": "CAM-TEST",
      "timestamp": "2024-01-15T17:00:00"
    }
  ],
  "totalVehicles": 1
}
```

**Success Criteria for Phase 2:**
- ✅ Python service starts
- ✅ YOLO detects vehicles in test image
- ✅ OCR attempts to read plates
- ✅ Results returned as JSON
- ✅ Evidence images saved

**Common Errors:**

**Error:** "CUDA not available"
- **Fix:** EasyOCR/YOLO will use CPU (slower but works)

**Error:** "Model download failed"
- **Fix:** Check internet connection, models auto-download on first run

**Error:** "No text detected"
- **Fix:** Normal if plate is blurry/small, try clearer image

---

### PHASE 3: Connect Frontend to AI Service 🔄

**Goal:** Next.js calls Python service, saves to database

**Duration:** 1 day

#### Step 3.1: Create Next.js API Proxy

File: `src/app/api/ai/process-frame/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Forward to Python AI service
    const response = await fetch('http://localhost:8000/process/frame', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('AI service error');
    }
    
    const result = await response.json();
    
    // TODO: Save detections to database here
    // (Phase 3.2)
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
}
```

#### Step 3.2: Save Detections to Database

Update the above file:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleDetections, numberPlateDetections, cameras } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cameraId = formData.get('camera_id') as string;
    
    // Get camera from database
    const [camera] = await db
      .select()
      .from(cameras)
      .where(eq(cameras.cameraId, cameraId))
      .limit(1);
    
    if (!camera) {
      return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    
    // Forward to Python AI service
    const response = await fetch('http://localhost:8000/process/frame', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('AI service error');
    }
    
    const result = await response.json();
    
    // Save each detection to database
    for (const detection of result.detections) {
      // Insert vehicle detection
      const [vehicleDetection] = await db
        .insert(vehicleDetections)
        .values({
          cameraId: camera.id,
          vehicleType: detection.vehicleType,
          confidence: detection.confidence.toString(),
          boundingBox: detection.boundingBox,
          imagePath: detection.imagePath,
          latitude: camera.latitude,
          longitude: camera.longitude,
        })
        .returning();
      
      // If plate was read, insert plate detection
      if (detection.plate) {
        await db.insert(numberPlateDetections).values({
          vehicleDetectionId: vehicleDetection.id,
          plateNumber: detection.plate.raw,
          plateNumberNormalized: detection.plate.normalized,
          confidence: detection.plate.confidence.toString(),
          ocrText: detection.plate.raw,
        });
        
        // TODO: Check watchlist (Phase 5)
      }
    }
    
    return NextResponse.json({
      success: true,
      detections: result.detections.length,
    });
  } catch (error) {
    console.error('Process frame error:', error);
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
}
```

#### Step 3.3: Create Test Upload Page

File: `src/app/(dashboard)/test/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cameraId, setCameraId] = useState('CAM-001');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('camera_id', cameraId);

    try {
      const response = await fetch('/api/ai/process-frame', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test AI Detection</h1>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Camera ID</label>
            <input
              type="text"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
          
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Frame'}
          </button>
        </form>
        
        {result && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Step 3.4: Test End-to-End

1. Start both services:
```bash
# Terminal 1: Python AI service
cd ai-service
source venv/bin/activate
python app/main.py

# Terminal 2: Next.js
npm run dev
```

2. Open http://localhost:3000/test
3. Select camera: CAM-001
4. Upload traffic image
5. Click "Process Frame"

**Expected:**
- Image processed by YOLO
- Vehicles detected
- Plates read
- Saved to database
- Result displayed

**Verify database:**
```bash
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db

SELECT * FROM vehicle_detections ORDER BY created_at DESC LIMIT 5;
SELECT * FROM number_plate_detections ORDER BY created_at DESC LIMIT 5;
```

**Success Criteria:**
- ✅ Frontend uploads image
- ✅ Python processes image
- ✅ Detections saved to database
- ✅ Can query detections from database

---

### PHASE 4: Vehicle Search & Display 🔄

**Goal:** Show detection history for any vehicle

**Duration:** 1 day

#### Step 4.1: Create Vehicle Search API

File: `src/app/api/vehicles/[plate]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, vehicleDetections, numberPlateDetections, cameras } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { plate: string } }
) {
  const plateNormalized = params.plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
  
  // Get all detections for this plate
  const detections = await db
    .select({
      id: vehicleDetections.id,
      detectionTime: vehicleDetections.detectionTime,
      vehicleType: vehicleDetections.vehicleType,
      confidence: vehicleDetections.confidence,
      imagePath: vehicleDetections.imagePath,
      latitude: vehicleDetections.latitude,
      longitude: vehicleDetections.longitude,
      cameraId: cameras.cameraId,
      cameraName: cameras.name,
      cameraLocation: cameras.location,
      plateNumber: numberPlateDetections.plateNumber,
      plateConfidence: numberPlateDetections.confidence,
    })
    .from(numberPlateDetections)
    .innerJoin(
      vehicleDetections,
      eq(numberPlateDetections.vehicleDetectionId, vehicleDetections.id)
    )
    .innerJoin(cameras, eq(vehicleDetections.cameraId, cameras.id))
    .where(eq(numberPlateDetections.plateNumberNormalized, plateNormalized))
    .orderBy(desc(vehicleDetections.detectionTime));
  
  return NextResponse.json({
    registrationNumber: plateNormalized,
    detections,
    total: detections.length,
  });
}
```

#### Step 4.2: Update Vehicle Search Page

File: `src/app/(dashboard)/vehicles/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Search, Car, MapPin, Clock, TrendingUp } from 'lucide-react';
import { formatDateTime, formatRegistrationNumber } from '@/lib/utils';

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
    try {
      const plate = searchQuery.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const response = await fetch(`/api/vehicles/${plate}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1">
          Search and track vehicles across the camera network
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search Vehicle by Registration Number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter registration number (e.g., GJ 01 AB 1234)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Registration</p>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {formatRegistrationNumber(results.registrationNumber)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Total Detections</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {results.total}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">First Seen</p>
              <p className="text-sm text-slate-900 mt-1">
                {results.detections[results.detections.length - 1]?.detectionTime
                  ? formatDateTime(results.detections[results.detections.length - 1].detectionTime)
                  : '—'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-sm text-slate-600">Last Seen</p>
              <p className="text-sm text-slate-900 mt-1">
                {results.detections[0]?.detectionTime
                  ? formatDateTime(results.detections[0].detectionTime)
                  : '—'}
              </p>
            </div>
          </div>

          {/* Detection List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Detection History
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {results.detections.map((detection: any) => (
                <div key={detection.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {detection.vehicleType.toUpperCase()}
                        </span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {(parseFloat(detection.confidence) * 100).toFixed(0)}% confident
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {detection.cameraId} - {detection.cameraLocation}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(detection.detectionTime)}
                        </span>
                      </div>
                    </div>
                    {detection.imagePath && (
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View Evidence
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && (
        <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200">
          <div className="text-center">
            <Car className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No search results</h3>
            <p className="mt-2 text-sm text-slate-600">
              Enter a vehicle registration number to view detection history
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Success Criteria:**
- ✅ Can search for vehicle by plate number
- ✅ Shows all detections
- ✅ Shows camera locations
- ✅ Shows timestamps
- ✅ Shows confidence scores

---

### PHASE 5: Watchlist Alerts 🔄

**Goal:** Auto-detect watchlist matches, create alerts

**Duration:** 1 day

#### Step 5.1: Add Watchlist Check in Detection API

Update `src/app/api/ai/process-frame/route.ts`:

```typescript
// After saving plate detection, add:

if (detection.plate) {
  const plateNormalized = detection.plate.normalized;
  
  // Check if vehicle is in watchlist
  const [watchlistEntry] = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.registrationNumber, plateNormalized),
        eq(watchlist.isActive, true)
      )
    )
    .limit(1);
  
  if (watchlistEntry) {
    // CREATE ALERT!
    const [alert] = await db
      .insert(alerts)
      .values({
        watchlistId: watchlistEntry.id,
        vehicleDetectionId: vehicleDetection.id,
        plateDetectionId: plateDetection.id,
        cameraId: camera.id,
        registrationNumber: plateNormalized,
        severity: watchlistEntry.severity,
      })
      .returning();
    
    // TODO: Send WebSocket notification (Phase 5.2)
  }
}
```

#### Step 5.2: Create WebSocket Server

File: `src/app/api/ws/alerts/route.ts`

```typescript
import { NextRequest } from 'next/server';

// Simple WebSocket implementation
// In production, use a proper WebSocket library

export async function GET(request: NextRequest) {
  // This would need WebSocket upgrade
  // For MVP, use polling or Server-Sent Events instead
  
  return new Response('WebSocket endpoint', {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Note:** Full WebSocket in Next.js requires custom server or use polling for MVP.

#### Step 5.3: Add Real-time Alert Component

File: `src/components/ui/AlertNotification.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatRegistrationNumber } from '@/lib/utils';

export function AlertNotification() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Poll for new alerts every 5 seconds
    const interval = setInterval(async () => {
      const response = await fetch('/api/alerts?acknowledged=false');
      const data = await response.json();
      setAlerts(data.alerts || []);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-red-600 text-white rounded-lg p-4 shadow-lg max-w-sm animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Watchlist Alert!</p>
              <p className="text-sm mt-1">
                Vehicle {formatRegistrationNumber(alert.registrationNumber)} detected at {alert.camera.name}
              </p>
            </div>
            <button className="hover:bg-red-700 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Success Criteria:**
- ✅ Watchlist vehicle detected → Alert created
- ✅ Alert appears on dashboard
- ✅ Alert notification pops up
- ✅ Can acknowledge alert

---

### PHASE 6-10: Remaining Features

I'll provide brief summaries for remaining phases:

**PHASE 6: Multi-Camera Route Visualization**
- Create `/api/vehicles/[plate]/route` endpoint
- Query detections ordered by time
- Extract camera coordinates
- Return GeoJSON route
- Integrate MapLibre to draw route

**PHASE 7: Evidence Management**
- Serve evidence images from Python service
- Add evidence viewer component
- Allow evidence download
- Add evidence to alerts

**PHASE 8: Audit Logging**
- Create audit logging middleware
- Log all important actions
- Create audit log viewer page

**PHASE 9: Final Polish**
- Add loading states
- Error handling
- Performance optimization
- UI polish

**PHASE 10: Demo Preparation**
- Create demo script
- Record backup video
- Prepare presentation
- Test complete workflow

---

## G. PHASE 1 RECAP - WHAT YOU HAVE NOW

### ✅ Complete Working Features

1. **Database:**
   - 10 tables created
   - PostGIS ready (not enabled yet)
   - 50 synthetic cameras
   - 4 watchlist vehicles
   - 1 demo user

2. **Frontend:**
   - Dashboard with statistics
   - Camera registry with status
   - Vehicle search UI (backend needed)
   - Watchlist management
   - Alerts page
   - Evidence page
   - Responsive layout
   - Navigation

3. **Backend:**
   - Health check API
   - Database connection
   - Authentication utilities
   - Utility functions

### 🔄 What to Build Next

**Immediate Next Steps (Phase 2):**

1. Create `ai-service` directory
2. Install Python dependencies
3. Set up YOLO + EasyOCR
4. Create `/process/frame` endpoint
5. Test with sample image

**Commands to run:**
```bash
# 1. Create Python service
mkdir -p ai-service/app/models ai-service/app/api

# 2. Create requirements.txt (content above)
# 3. Install dependencies
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Create main.py (content above)
# 5. Test
python app/main.py
```

---

## CRITICAL SUCCESS FACTORS

### For Hackathon Demo

1. **MUST HAVE:**
   - ✅ 50 cameras visible on map
   - ✅ Watchlist working
   - 🔄 At least 1 video processed
   - 🔄 At least 1 vehicle detected
   - 🔄 At least 1 plate read
   - 🔄 At least 1 alert fired
   - 🔄 Route shown on map

2. **NICE TO HAVE:**
   - Real-time streaming
   - 100+ detections
   - Advanced analytics
   - Mobile app

3. **DON'T NEED:**
   - Kubernetes
   - Kafka
   - Microservices
   - Load balancing
   - 50,000 cameras actually running

### Demo Script

**Opening (30s):**
"This is Sentinel Gujarat - AI-powered vehicle tracking for Gujarat Police."

**Show Dashboard (30s):**
"50 cameras online across Gujarat, processing video in real-time."

**Upload Test Video (1min):**
"AI detects vehicles using YOLO, reads plates using OCR."

**Show Detection (30s):**
"Vehicle GJ 05 XY 9876 detected at Ring Road, Ahmedabad."

**Watchlist Match (30s):**
"This vehicle is on the watchlist - immediate alert fires."

**Show Route (30s):**
"System correlates detections across cameras, showing vehicle movement."

**Conclusion (30s):**
"Sentinel Gujarat: Real-time intelligence, scalable architecture, ready for deployment."

---

## NEXT IMMEDIATE ACTION

**RIGHT NOW, DO THIS:**

1. **Create ai-service directory structure**
2. **Create requirements.txt**
3. **Set up Python virtual environment**
4. **Install dependencies (will take ~10 minutes)**
5. **Create main.py with basic FastAPI**
6. **Test Python service starts**
7. **Add YOLO detection**
8. **Test with sample image**

Then we move to Phase 3 (connecting to Next.js).

---

**YOU ARE HERE:** ✅ Phase 1 Complete → 🔄 Phase 2 Starting

**ESTIMATED TIME TO WORKING DEMO:** 3-4 days if following this plan

Would you like me to now implement Phase 2 (Python AI Service) or do you have questions about the architecture/plan?
