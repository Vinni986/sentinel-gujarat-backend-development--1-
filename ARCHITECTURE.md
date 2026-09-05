# Sentinel Gujarat - System Architecture

## Complete System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SENTINEL GUJARAT                                │
│              Unified CCTV Intelligence Platform                         │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           USER LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Control    │  │ Investigator │  │    Admin     │                 │
│  │     Room     │  │              │  │              │                 │
│  │   Officer    │  │   Dashboard  │  │   Console    │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
│         └──────────────────┴──────────────────┘                         │
│                            │                                            │
│                            ▼                                            │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                      PRESENTATION LAYER                                  │
│                       Next.js Frontend                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Dashboard  │  │  Live       │  │  Vehicle    │  │  Watchlist  │  │
│  │             │  │  Cameras    │  │  Intel      │  │  Alerts     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │  Evidence   │  │  GIS Maps   │  │  Reports    │                    │
│  │             │  │  Routes     │  │  Audit      │                    │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                          │
│  Components:                                                            │
│  - MapLibre GL (GIS visualization)                                     │
│  - Recharts (Analytics)                                                │
│  - WebSocket (Real-time alerts)                                        │
│  - React Query (Data fetching)                                         │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             │ REST API
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                      APPLICATION LAYER                                   │
│                    Next.js API Routes                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      API Endpoints                                │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  Authentication     │  /api/auth/*                              │  │
│  │  Dashboard          │  /api/dashboard/stats                     │  │
│  │  Camera Management  │  /api/cameras/*                           │  │
│  │  Vehicle Search     │  /api/vehicles/*                          │  │
│  │  Watchlist          │  /api/watchlist/*                         │  │
│  │  Alerts             │  /api/alerts/*                            │  │
│  │  Evidence           │  /api/evidence/*                          │  │
│  │  WebSocket          │  /api/ws/alerts                           │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Business Logic:                                                        │
│  - Authentication & Authorization                                       │
│  - Watchlist matching                                                   │
│  - Alert generation                                                     │
│  - Route correlation                                                    │
│  - Audit logging                                                        │
└────────────────┬──────────────────────────────────┬─────────────────────┘
                 │                                  │
                 │ HTTP/REST                        │ Direct DB Access
                 │                                  │
┌────────────────▼─────────────────┐    ┌──────────▼──────────────────────┐
│      AI SERVICE LAYER            │    │      DATA LAYER                 │
│    Python FastAPI Service        │    │   PostgreSQL + PostGIS          │
├──────────────────────────────────┤    ├─────────────────────────────────┤
│                                  │    │                                 │
│  ┌────────────────────────────┐ │    │  ┌───────────────────────────┐ │
│  │  Frame Processing Pipeline │ │    │  │  Core Tables              │ │
│  ├────────────────────────────┤ │    │  ├───────────────────────────┤ │
│  │                            │ │    │  │  • users                  │ │
│  │  1. Frame Extraction       │ │    │  │  • cameras                │ │
│  │     (OpenCV/FFmpeg)        │ │    │  │  • camera_sources         │ │
│  │         │                  │ │    │  │  • vehicle_detections     │ │
│  │         ▼                  │ │    │  │  • number_plate_detections│ │
│  │  2. Vehicle Detection      │ │    │  │  • vehicles               │ │
│  │     (YOLOv8)              │ │    │  │  • watchlist              │ │
│  │         │                  │ │    │  │  • alerts                 │ │
│  │         ▼                  │ │    │  │  • evidence               │ │
│  │  3. Plate Recognition      │ │    │  │  • audit_logs             │ │
│  │     (EasyOCR)             │ │    │  │                           │ │
│  │         │                  │ │    │  └───────────────────────────┘ │
│  │         ▼                  │ │    │                                 │
│  │  4. Save Detection         │──────▶  PostGIS Features:              │
│  │     (Database Insert)      │ │    │  • Spatial indexes            │
│  │         │                  │ │    │  • Distance calculations      │
│  │         ▼                  │ │    │  • Route optimization         │
│  │  5. Watchlist Check        │ │    │  • Geographic queries         │
│  │         │                  │ │    │                                 │
│  │         ▼                  │ │    │  Connection Pool:              │
│  │  6. Alert Generation       │ │    │  • 20 connections             │
│  │                            │ │    │  • Auto-scaling               │
│  └────────────────────────────┘ │    │                                 │
│                                  │    └─────────────────────────────────┘
│  AI Models:                      │
│  • YOLOv8 (Vehicle Detection)    │
│  • EasyOCR (Plate Recognition)   │
│  • (Future) Re-ID Models         │
│                                  │
│  Endpoints:                      │
│  • POST /process/frame           │
│  • POST /start-stream            │
│  • GET  /stream-status           │
│  • POST /stop-stream             │
└──────────────┬───────────────────┘
               │
               │ RTSP/HTTP/File
               │
┌──────────────▼───────────────────────────────────────────────────────────┐
│                         INPUT LAYER                                       │
│                      Camera Network                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   RTSP      │  │   ONVIF     │  │   HTTP      │  │   File      │   │
│  │   Cameras   │  │   Cameras   │  │   Cameras   │  │   Upload    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                           │
│  Supported Sources:                                                      │
│  • RTSP streams (rtsp://camera-ip:554/stream)                           │
│  • ONVIF protocol cameras                                               │
│  • HTTP video streams                                                   │
│  • Video file uploads (for testing)                                     │
│  • (Future) Cloud camera APIs                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### Detection Pipeline (Real-time)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DETECTION DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: Video Ingestion
┌────────────┐
│   Camera   │──────▶ RTSP Stream: rtsp://192.168.1.100:554/stream
└────────────┘
      │
      │ 25 FPS Video
      ▼
┌────────────────────┐
│   AI Service       │
│   Frame Extractor  │
│   (OpenCV/FFmpeg)  │
└────────────────────┘
      │
      │ Sample 1 FPS (configurable)
      ▼

STEP 2: Vehicle Detection
┌────────────────────┐
│   YOLOv8 Model     │───▶ Detects: car, truck, bus, motorcycle
└────────────────────┘
      │
      │ For each detected vehicle:
      │ {
      │   type: "car",
      │   confidence: 0.89,
      │   bbox: { x: 100, y: 150, w: 300, h: 200 }
      │ }
      ▼

STEP 3: Number Plate Extraction
┌────────────────────┐
│  Crop Vehicle ROI  │───▶ Extract region: bbox[x:x+w, y:y+h]
└────────────────────┘
      │
      │ Cropped vehicle image
      ▼

STEP 4: OCR Processing
┌────────────────────┐
│   EasyOCR Model    │───▶ Reads text from plate region
└────────────────────┘
      │
      │ OCR Result:
      │ {
      │   raw: "GJ 01 AB 1234",
      │   normalized: "GJ01AB1234",
      │   confidence: 0.85
      │ }
      ▼

STEP 5: Database Storage
┌────────────────────────────────────────────────────┐
│                  PostgreSQL                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  INSERT vehicle_detections:                       │
│  ┌──────────────────────────────────────────┐    │
│  │ camera_id:      uuid-of-camera           │    │
│  │ vehicle_type:   "car"                    │    │
│  │ confidence:     0.89                     │    │
│  │ bounding_box:   {x, y, w, h}            │    │
│  │ image_path:     "/evidence/det_123.jpg" │    │
│  │ detection_time: "2024-01-15T10:30:00Z"  │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  INSERT number_plate_detections:                  │
│  ┌──────────────────────────────────────────┐    │
│  │ vehicle_detection_id: uuid-from-above    │    │
│  │ plate_number:         "GJ 01 AB 1234"   │    │
│  │ plate_number_normalized: "GJ01AB1234"    │    │
│  │ confidence:           0.85               │    │
│  └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
      │
      ▼

STEP 6: Watchlist Check
┌────────────────────────────────────────────────────┐
│  SELECT * FROM watchlist                           │
│  WHERE registration_number = 'GJ01AB1234'          │
│  AND is_active = true                              │
└────────────────────────────────────────────────────┘
      │
      │ IF MATCH FOUND:
      ▼

STEP 7: Alert Generation
┌────────────────────────────────────────────────────┐
│  INSERT alerts:                                    │
│  ┌──────────────────────────────────────────┐    │
│  │ watchlist_id:         uuid               │    │
│  │ vehicle_detection_id: uuid               │    │
│  │ camera_id:           uuid                │    │
│  │ registration_number: "GJ01AB1234"        │    │
│  │ severity:            "critical"          │    │
│  │ is_acknowledged:     false               │    │
│  └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
      │
      ▼

STEP 8: Real-time Notification
┌────────────────────┐
│   WebSocket        │───▶ Push alert to all connected clients
│   /api/ws/alerts   │
└────────────────────┘
      │
      ▼

STEP 9: Frontend Display
┌────────────────────────────────────────────────────┐
│              Control Room Dashboard                │
├────────────────────────────────────────────────────┤
│                                                    │
│  🚨 CRITICAL ALERT                                │
│                                                    │
│  Vehicle: GJ 01 AB 1234                           │
│  Camera:  CAM-023 - Surat Ring Road              │
│  Time:    10:30:15                                │
│  Reason:  Wanted in hit and run incident          │
│                                                    │
│  [View Details]  [Acknowledge]                    │
└────────────────────────────────────────────────────┘

Total Time: < 2 seconds from detection to alert!
```

---

## Multi-Camera Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│               MULTI-CAMERA VEHICLE TRACKING                              │
└─────────────────────────────────────────────────────────────────────────┘

SCENARIO: Track vehicle GJ 01 AB 1234 across Gujarat

┌─────────────┐                          ┌─────────────────────────────────┐
│   CAM-012   │                          │      Detection Database         │
│  Ahmedabad  │                          ├─────────────────────────────────┤
│  Ring Road  │                          │                                 │
│  10:30 AM   │──────────────────────────▶  Detection #1                  │
└─────────────┘                          │  • Camera: CAM-012              │
     GPS: 23.0225, 72.5714               │  • Location: 23.0225, 72.5714   │
                                         │  • Time: 10:30:00               │
                                         │  • Plate: GJ01AB1234            │
                                         └─────────────────────────────────┘
        │
        │ 17 minutes later, 12.5 km away
        ▼
┌─────────────┐                          ┌─────────────────────────────────┐
│   CAM-019   │                          │      Detection Database         │
│  Ahmedabad  │                          ├─────────────────────────────────┤
│  SG Highway │                          │                                 │
│  10:47 AM   │──────────────────────────▶  Detection #2                  │
└─────────────┘                          │  • Camera: CAM-019              │
     GPS: 23.0300, 72.5800               │  • Location: 23.0300, 72.5800   │
                                         │  • Time: 10:47:00               │
                                         │  • Plate: GJ01AB1234            │
                                         └─────────────────────────────────┘
        │
        │ 28 minutes later, 35 km away
        ▼
┌─────────────┐                          ┌─────────────────────────────────┐
│   CAM-031   │                          │      Detection Database         │
│ Gandhinagar │                          ├─────────────────────────────────┤
│ Secretariat │                          │                                 │
│  11:15 AM   │──────────────────────────▶  Detection #3                  │
└─────────────┘                          │  • Camera: CAM-031              │
     GPS: 23.2156, 72.6369               │  • Location: 23.2156, 72.6369   │
                                         │  • Time: 11:15:00               │
                                         │  • Plate: GJ01AB1234            │
                                         └─────────────────────────────────┘

───────────────────────────────────────────────────────────────────────────

CORRELATION LOGIC:

Step 1: Query all detections for plate "GJ01AB1234"
┌──────────────────────────────────────────────────────────────────────────┐
│ SELECT                                                                    │
│   vd.id,                                                                  │
│   vd.detection_time,                                                      │
│   c.camera_id,                                                            │
│   c.name,                                                                 │
│   c.latitude,                                                             │
│   c.longitude                                                             │
│ FROM number_plate_detections np                                          │
│ JOIN vehicle_detections vd ON np.vehicle_detection_id = vd.id            │
│ JOIN cameras c ON vd.camera_id = c.id                                    │
│ WHERE np.plate_number_normalized = 'GJ01AB1234'                          │
│ ORDER BY vd.detection_time ASC                                           │
└──────────────────────────────────────────────────────────────────────────┘

Step 2: Build chronological route
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROUTE TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  10:30 ─────▶ 10:47 ─────▶ 11:15                                       │
│  CAM-012      CAM-019      CAM-031                                      │
│  Ahmedabad    Ahmedabad    Gandhinagar                                  │
│                                                                          │
│  Distance: 12.5 km + 35 km = 47.5 km total                             │
│  Time: 17 min + 28 min = 45 minutes                                    │
│  Avg Speed: ~63 km/h                                                   │
└─────────────────────────────────────────────────────────────────────────┘

Step 3: GIS Route Visualization
┌─────────────────────────────────────────────────────────────────────────┐
│                        MapLibre GL Map                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│         Gandhinagar                                                     │
│              ▲                                                          │
│              │ CAM-031                                                  │
│              │ 11:15 AM                                                 │
│              │                                                          │
│              │                                                          │
│              │                                                          │
│         Ahmedabad                                                       │
│              ▲                                                          │
│              │ CAM-019                                                  │
│              │ 10:47 AM                                                 │
│              │                                                          │
│              │                                                          │
│              ● CAM-012                                                  │
│                10:30 AM                                                 │
│                                                                          │
│  Legend:                                                                │
│  ● Camera location (numbered in sequence)                              │
│  ▲ Direction arrow                                                     │
│  ─ Route line (blue)                                                   │
└─────────────────────────────────────────────────────────────────────────┘

Step 4: Present to Officer
┌─────────────────────────────────────────────────────────────────────────┐
│              Vehicle Movement Report - GJ 01 AB 1234                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Total Detections: 3                                                    │
│  First Seen: Jan 15, 2024 10:30 AM                                     │
│  Last Seen:  Jan 15, 2024 11:15 AM                                     │
│  Total Distance: 47.5 km                                                │
│  Average Speed: 63 km/h                                                 │
│                                                                          │
│  Route:                                                                 │
│  1. CAM-012 - Ahmedabad Ring Road     - 10:30:00                       │
│  2. CAM-019 - Ahmedabad SG Highway    - 10:47:00 (+17 min, 12.5 km)   │
│  3. CAM-031 - Gandhinagar Secretariat - 11:15:00 (+28 min, 35 km)     │
│                                                                          │
│  [Download Report] [Export Evidence] [Add to Case]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Scalability Architecture

### Current (MVP): Up to 100 cameras

```
┌─────────────────────────────────────────────────────────────┐
│                   Single Server Setup                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Next.js App    │◀───────▶│   PostgreSQL     │         │
│  │   (Port 3000)    │         │   (Port 5432)    │         │
│  └────────┬─────────┘         └──────────────────┘         │
│           │                                                  │
│           │ HTTP                                            │
│           │                                                  │
│  ┌────────▼─────────┐                                       │
│  │  Python AI       │                                       │
│  │  Service         │                                       │
│  │  (Port 8000)     │                                       │
│  └──────────────────┘                                       │
│                                                              │
│  Capacity:                                                  │
│  • 50-100 cameras                                          │
│  • 1-5 FPS processing per camera                           │
│  • ~500 detections/minute                                  │
│  • 10-20 concurrent users                                  │
└─────────────────────────────────────────────────────────────┘
```

### Scale 1: 500 cameras

```
┌──────────────────────────────────────────────────────────────────┐
│                   Regional Distribution                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐                                     │
│  │   Load Balancer         │                                     │
│  │   (nginx/HAProxy)       │                                     │
│  └────┬────────────────┬───┘                                     │
│       │                │                                          │
│  ┌────▼────────┐  ┌───▼─────────┐                               │
│  │  Next.js #1 │  │  Next.js #2 │                               │
│  └─────┬───────┘  └──────┬──────┘                               │
│        │                  │                                       │
│        │  ┌───────────────┴───────────────┐                     │
│        │  │                                │                     │
│        │  │        Redis Cache             │                     │
│        │  │     (Session + Stats)          │                     │
│        │  │                                │                     │
│        │  └────────────────────────────────┘                     │
│        │                                                          │
│  ┌─────▼──────────────────────────────────────┐                 │
│  │         PostgreSQL Primary                  │                 │
│  │         (Write + Critical Reads)            │                 │
│  └─────┬───────────────────────────┬──────────┘                 │
│        │                            │                             │
│  ┌─────▼──────┐            ┌───────▼────────┐                   │
│  │  Replica 1 │            │  Replica 2     │                   │
│  │  (Reads)   │            │  (Reads)       │                   │
│  └────────────┘            └────────────────┘                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  AI Worker 1 │  │  AI Worker 2 │  │  AI Worker 3 │          │
│  │  (150 cams)  │  │  (150 cams)  │  │  (200 cams)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌────────────────────────────────────────────────┐             │
│  │           S3/MinIO Object Storage               │             │
│  │          (Evidence images/videos)               │             │
│  └────────────────────────────────────────────────┘             │
│                                                                   │
│  Features Added:                                                 │
│  • Horizontal scaling (multiple Next.js instances)              │
│  • Database read replicas                                       │
│  • Redis caching layer                                          │
│  • Multiple AI workers                                          │
│  • Object storage for evidence                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Scale 2: 5,000 cameras

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Regional Edge Architecture                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                     ┌─────────────────────┐                            │
│                     │   Central Command   │                            │
│                     │   Center Dashboard  │                            │
│                     └──────────┬──────────┘                            │
│                                │                                        │
│                                │ API Gateway                            │
│                                │                                        │
│         ┌──────────────────────┼──────────────────────┐                │
│         │                      │                       │                │
│  ┌──────▼──────┐      ┌────────▼────────┐     ┌──────▼──────┐        │
│  │  Ahmedabad  │      │     Surat       │     │  Vadodara   │        │
│  │   Region    │      │    Region       │     │   Region    │        │
│  │ (2000 cams) │      │  (1500 cams)    │     │ (1500 cams) │        │
│  └──────┬──────┘      └────────┬────────┘     └──────┬──────┘        │
│         │                      │                       │                │
│  Each Region:                                                          │
│  ┌─────────────────────────────────────────────────┐                  │
│  │  ┌────────────────┐                             │                  │
│  │  │ Stream Gateway │  (Receives RTSP feeds)      │                  │
│  │  └────────┬───────┘                             │                  │
│  │           │                                      │                  │
│  │  ┌────────▼───────────────────────────┐         │                  │
│  │  │  AI Processing Cluster              │         │                  │
│  │  │  (10-20 GPU workers)                │         │                  │
│  │  │  - Vehicle detection                │         │                  │
│  │  │  - Plate recognition                │         │                  │
│  │  └────────┬────────────────────────────┘         │                  │
│  │           │                                      │                  │
│  │  ┌────────▼────────┐                            │                  │
│  │  │ Regional DB     │  (PostgreSQL cluster)      │                  │
│  │  │ (Partitioned)   │                             │                  │
│  │  └────────┬────────┘                            │                  │
│  │           │                                      │                  │
│  │  ┌────────▼────────┐                            │                  │
│  │  │ Message Queue   │  (RabbitMQ/Kafka)          │                  │
│  │  │ (Alert routing) │                             │                  │
│  │  └─────────────────┘                            │                  │
│  └─────────────────────────────────────────────────┘                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────┐               │
│  │         Central Data Warehouse                      │               │
│  │         (TimescaleDB for time-series)              │               │
│  │         • Historical detections                     │               │
│  │         • Analytics                                 │               │
│  │         • Long-term storage                         │               │
│  └────────────────────────────────────────────────────┘               │
│                                                                         │
│  Features:                                                             │
│  • Regional edge processing (low latency)                             │
│  • GPU clusters for AI workload                                       │
│  • Message queue for inter-region communication                       │
│  • Time-series database for analytics                                 │
│  • Data replication for disaster recovery                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Scale 3: 50,000 cameras (Gujarat-wide)

```
┌────────────────────────────────────────────────────────────────────────┐
│                 Enterprise Distributed Architecture                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Internet/VPN                                                          │
│       │                                                                 │
│  ┌────▼─────────────────────────────────────────┐                     │
│  │        CDN / Edge Network                     │                     │
│  │        (CloudFlare / AWS CloudFront)          │                     │
│  └────┬──────────────────────────────────────────┘                     │
│       │                                                                 │
│  ┌────▼─────────────────────────────────────────┐                     │
│  │        WAF / DDoS Protection                  │                     │
│  └────┬──────────────────────────────────────────┘                     │
│       │                                                                 │
│  ┌────▼─────────────────────────────────────────┐                     │
│  │        API Gateway / Load Balancer            │                     │
│  │        (Kong / AWS API Gateway)               │                     │
│  └────┬──────────────────────────────────────────┘                     │
│       │                                                                 │
│  ┌────▼───────────────────────────────────────────────┐               │
│  │      Kubernetes Cluster (Auto-scaling)             │               │
│  ├────────────────────────────────────────────────────┤               │
│  │                                                     │               │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │               │
│  │  │  Frontend   │  │   API       │  │  WebSocket│  │               │
│  │  │  Pods (20)  │  │  Pods (50)  │  │  Pods (10)│  │               │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │               │
│  └─────────────────────────────────────────────────┘  │               │
│                                                         │               │
│  ┌──────────────────────────────────────────────────┐ │               │
│  │         Message Broker Cluster                    │ │               │
│  │         (Kafka / RabbitMQ)                        │ │               │
│  │  Topics:                                          │ │               │
│  │  • camera-frames                                  │ │               │
│  │  • vehicle-detections                             │ │               │
│  │  • plate-detections                               │ │               │
│  │  • watchlist-alerts                               │ │               │
│  └──────────────────────────────────────────────────┘ │               │
│                                                         │               │
│  Regional Processing Nodes (10 regions across Gujarat) │               │
│  ┌─────────────────────────────────────────────────────┐               │
│  │  Each Node:                                          │               │
│  │  • 5,000 cameras                                     │               │
│  │  • 100 GPU workers (Tesla T4 / A100)                │               │
│  │  • Local cache (Redis Cluster)                      │               │
│  │  • Edge database (PostgreSQL + PostGIS)             │               │
│  │  • Object storage (MinIO cluster)                   │               │
│  └─────────────────────────────────────────────────────┘               │
│                                                                         │
│  ┌──────────────────────────────────────────────────┐                 │
│  │         Central Data Layer                        │                 │
│  ├──────────────────────────────────────────────────┤                 │
│  │                                                   │                 │
│  │  ┌────────────────────────────────────────────┐ │                 │
│  │  │  PostgreSQL Cluster (Citus/Patroni)       │ │                 │
│  │  │  • Sharded by region                       │ │                 │
│  │  │  • 20 nodes                                 │ │                 │
│  │  │  • Replication factor: 3                   │ │                 │
│  │  └────────────────────────────────────────────┘ │                 │
│  │                                                   │                 │
│  │  ┌────────────────────────────────────────────┐ │                 │
│  │  │  TimescaleDB (Time-series analytics)       │ │                 │
│  │  │  • Compressed historical data              │ │                 │
│  │  │  • Continuous aggregates                   │ │                 │
│  │  └────────────────────────────────────────────┘ │                 │
│  │                                                   │                 │
│  │  ┌────────────────────────────────────────────┐ │                 │
│  │  │  Elasticsearch (Full-text search)          │ │                 │
│  │  │  • Vehicle search                           │ │                 │
│  │  │  • Audit logs                               │ │                 │
│  │  └────────────────────────────────────────────┘ │                 │
│  │                                                   │                 │
│  │  ┌────────────────────────────────────────────┐ │                 │
│  │  │  S3 / Object Storage                        │ │                 │
│  │  │  • Evidence (images/videos)                │ │                 │
│  │  │  • Lifecycle policies (30-day retention)   │ │                 │
│  │  │  • 100+ TB storage                          │ │                 │
│  │  └────────────────────────────────────────────┘ │                 │
│  └──────────────────────────────────────────────────┘                 │
│                                                                         │
│  Monitoring & Operations:                                             │
│  • Prometheus + Grafana (Metrics)                                     │
│  • ELK Stack (Logs)                                                   │
│  • Jaeger (Distributed tracing)                                       │
│  • PagerDuty (Alerting)                                               │
│  • DataDog (APM)                                                      │
│                                                                         │
│  Capacity:                                                             │
│  • 50,000+ cameras                                                    │
│  • 500,000+ detections/hour                                           │
│  • 100+ concurrent analysts                                           │
│  • 99.9% uptime SLA                                                   │
│  • < 3 second end-to-end latency                                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                  │
└────────────────────────────────────────────────────────────────────────┘

Layer 1: Network Security
┌──────────────────────────────────────────────────────┐
│  • Firewall (Allow only 443, 80)                     │
│  • VPN for internal access                           │
│  • DDoS protection                                   │
│  • Rate limiting (100 req/min per IP)                │
└──────────────────────────────────────────────────────┘

Layer 2: Application Security
┌──────────────────────────────────────────────────────┐
│  • HTTPS only (TLS 1.3)                              │
│  • CORS restrictions                                 │
│  • CSP headers                                       │
│  • XSS protection                                    │
│  • SQL injection prevention (ORM)                    │
└──────────────────────────────────────────────────────┘

Layer 3: Authentication
┌──────────────────────────────────────────────────────┐
│  • JWT tokens (short-lived)                          │
│  • Refresh tokens (httpOnly cookies)                 │
│  • bcrypt password hashing (cost=12)                 │
│  • MFA (optional for admin)                          │
│  • Session timeout (30 minutes)                      │
└──────────────────────────────────────────────────────┘

Layer 4: Authorization
┌──────────────────────────────────────────────────────┐
│  Roles:                                              │
│  • Admin      - Full access                          │
│  • Control_Room - View + Alert management            │
│  • Investigator - View + Search + Evidence           │
│  • Viewer     - Read-only                            │
│                                                       │
│  Permissions enforced at:                            │
│  • API route level                                   │
│  • Database query level                              │
│  • UI component level                                │
└──────────────────────────────────────────────────────┘

Layer 5: Data Security
┌──────────────────────────────────────────────────────┐
│  • Encryption at rest (AES-256)                      │
│  • Encryption in transit (TLS)                       │
│  • Camera credentials encrypted                      │
│  • PII data anonymized in logs                       │
│  • Evidence watermarked                              │
└──────────────────────────────────────────────────────┘

Layer 6: Audit & Compliance
┌──────────────────────────────────────────────────────┐
│  Every action logged:                                │
│  • User ID                                           │
│  • Action type                                       │
│  • Resource accessed                                 │
│  • IP address                                        │
│  • Timestamp                                         │
│  • Request/response summary                          │
│                                                       │
│  Logs retention: 1 year                              │
│  Logs encrypted and tamper-proof                     │
└──────────────────────────────────────────────────────┘
```

---

**This completes the comprehensive architecture documentation!**

Your system is designed to:
1. ✅ Work today with 50 cameras (MVP)
2. ✅ Scale to 500 cameras (minor upgrades)
3. ✅ Scale to 5,000 cameras (regional distribution)
4. ✅ Scale to 50,000 cameras (enterprise architecture)

**For the hackathon, focus on the MVP architecture and EXPLAIN the scalability path in your presentation.**
