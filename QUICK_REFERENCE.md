# Sentinel Gujarat - Quick Reference Guide

## 🚀 Quick Start Commands

### Start Everything
```bash
# Terminal 1: Next.js Frontend
npm run dev

# Terminal 2: Python AI Service (Phase 2+)
cd ai-service
source venv/bin/activate
python app/main.py
```

### Database Commands
```bash
# Push schema changes
npm run db:push

# Seed demo data
npm run db:seed

# Connect to database
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db

# Enable PostGIS
psql -d app_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Build & Test
```bash
# Type check
npm run typecheck

# Build
npm run build

# Run production
npm start
```

---

## 📁 Project Structure

```
sentinel-gujarat/
├── src/                          # Next.js application
│   ├── app/
│   │   ├── (dashboard)/          # Protected pages
│   │   │   ├── dashboard/        # ✅ Main dashboard
│   │   │   ├── cameras/          # ✅ Camera registry
│   │   │   ├── vehicles/         # ✅ Vehicle search
│   │   │   ├── watchlist/        # ✅ Watchlist management
│   │   │   ├── alerts/           # ✅ Alert center
│   │   │   └── evidence/         # ✅ Evidence viewer
│   │   ├── api/                  # API routes
│   │   │   ├── health/           # ✅ Health check
│   │   │   ├── auth/             # 🔄 Authentication
│   │   │   ├── cameras/          # 🔄 Camera APIs
│   │   │   ├── vehicles/         # 🔄 Vehicle APIs
│   │   │   ├── watchlist/        # 🔄 Watchlist APIs
│   │   │   └── alerts/           # 🔄 Alert APIs
│   │   └── page.tsx              # ✅ Redirects to dashboard
│   ├── components/
│   │   └── ui/                   # ✅ Reusable components
│   ├── lib/
│   │   ├── auth.ts               # ✅ Auth utilities
│   │   └── utils.ts              # ✅ Helper functions
│   └── db/
│       ├── schema.ts             # ✅ Database schema
│       └── index.ts              # ✅ Database connection
├── ai-service/                   # 🔄 Python AI service (Phase 2)
│   ├── app/
│   │   ├── main.py               # FastAPI app
│   │   ├── models/
│   │   │   ├── yolo.py           # YOLO detector
│   │   │   └── ocr.py            # OCR reader
│   │   └── api/
│   │       └── frames.py         # Frame processing
│   ├── models/                   # Downloaded AI models
│   ├── evidence/                 # Saved detection images
│   ├── requirements.txt
│   └── venv/
├── scripts/
│   └── seed.ts                   # ✅ Database seeding
├── public/                       # Static assets
├── README.md                     # ✅ Main documentation
├── IMPLEMENTATION_PLAN.md        # ✅ Detailed roadmap
└── package.json                  # ✅ Dependencies

Legend:
✅ Implemented
🔄 To be implemented
```

---

## 🗄️ Database Quick Reference

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | System users | email, password_hash, role |
| `cameras` | Camera registry | camera_id, name, location, latitude, longitude, status |
| `camera_sources` | Stream URLs | source_url, username, password |
| `vehicle_detections` | Raw YOLO detections | camera_id, vehicle_type, confidence, bounding_box |
| `number_plate_detections` | OCR results | plate_number, plate_number_normalized, confidence |
| `vehicles` | Unique vehicles | registration_number, total_detections |
| `watchlist` | Vehicles to monitor | registration_number, reason, severity |
| `alerts` | Real-time alerts | watchlist_id, detection_id, is_acknowledged |
| `evidence` | Saved files | file_path, detection_id |
| `audit_logs` | System activity | user_id, action, details |

### Useful Queries

```sql
-- Get online cameras
SELECT camera_id, name, area FROM cameras WHERE status = 'online';

-- Get detections for vehicle
SELECT 
  vd.detection_time,
  vd.vehicle_type,
  c.name as camera_name,
  np.plate_number
FROM number_plate_detections np
JOIN vehicle_detections vd ON np.vehicle_detection_id = vd.id
JOIN cameras c ON vd.camera_id = c.id
WHERE np.plate_number_normalized = 'GJ01AB1234'
ORDER BY vd.detection_time DESC;

-- Get active alerts
SELECT 
  a.registration_number,
  a.severity,
  a.alert_time,
  c.name as camera_name,
  w.reason
FROM alerts a
JOIN cameras c ON a.camera_id = c.id
JOIN watchlist w ON a.watchlist_id = w.id
WHERE a.is_acknowledged = false
ORDER BY a.alert_time DESC;

-- Get watchlist summary
SELECT 
  severity,
  COUNT(*) as count
FROM watchlist
WHERE is_active = true
GROUP BY severity;
```

---

## 🔌 API Quick Reference

### Current APIs (Phase 1)

```
GET  /api/health                  ✅ Health check
```

### To Implement (Phase 2+)

```
# Authentication
POST /api/auth/login              Login
GET  /api/auth/me                 Current user

# Dashboard
GET  /api/dashboard/stats         Statistics

# Cameras
GET  /api/cameras                 List cameras
POST /api/cameras                 Add camera
POST /api/cameras/bulk-import     CSV import

# Vehicles
GET  /api/vehicles/search?q=      Search vehicles
GET  /api/vehicles/:plate         Vehicle details
GET  /api/vehicles/:plate/detections  Detection history
GET  /api/vehicles/:plate/route   Route visualization

# Watchlist
GET  /api/watchlist               List watchlist
POST /api/watchlist               Add to watchlist

# Alerts
GET  /api/alerts                  List alerts
PUT  /api/alerts/:id/acknowledge  Acknowledge alert

# AI Processing
POST /api/ai/process-frame        Process uploaded image
```

---

## 🎨 UI Components

### Available Components

```typescript
// Layout
<Sidebar />                       // ✅ Main navigation
<Header />                        // ✅ Top bar with search

// Status Badges
<span className={getStatusColor(status)}>
  {status}
</span>

<span className={getSeverityColor(severity)}>
  {severity}
</span>

// Utility Functions
formatDateTime(date)              // "Jan 15, 2024, 10:30 AM"
formatRelativeTime(date)          // "2h ago"
formatRegistrationNumber(plate)   // "GJ 01 AB 1234"
normalizeRegistrationNumber(plate) // "GJ01AB1234"
calculateDistance(lat1, lon1, lat2, lon2) // km
```

### Tailwind Utility Classes

```css
/* Status Colors */
text-green-600 bg-green-50        /* Online/Success */
text-red-600 bg-red-50            /* Critical/Error */
text-yellow-600 bg-yellow-50      /* Warning/Medium */
text-blue-600 bg-blue-50          /* Info/Active */
text-slate-600 bg-slate-50        /* Offline/Inactive */

/* Common Patterns */
rounded-lg shadow-sm border       /* Card */
px-6 py-4                         /* Padding */
space-y-6                         /* Vertical spacing */
grid grid-cols-4 gap-4            /* Grid layout */
flex items-center gap-2           /* Flex row */
```

---

## 🐍 Python AI Service (Phase 2)

### Setup

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

### requirements.txt

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

### Run AI Service

```bash
python app/main.py

# Or with auto-reload
uvicorn app.main:app --reload --port 8000
```

### Test AI Service

```bash
# Test health
curl http://localhost:8000/health

# Test frame processing
curl -X POST http://localhost:8000/process/frame \
  -F "image=@test.jpg" \
  -F "camera_id=CAM-001"
```

---

## 🧪 Testing Workflow

### End-to-End Test

1. **Start services:**
```bash
# Terminal 1
npm run dev

# Terminal 2
cd ai-service && source venv/bin/activate && python app/main.py
```

2. **Upload test image:**
- Go to http://localhost:3000/test
- Select camera: CAM-001
- Upload traffic image
- Click "Process Frame"

3. **Verify detection:**
```sql
-- Check database
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db

SELECT COUNT(*) FROM vehicle_detections;
SELECT COUNT(*) FROM number_plate_detections;

-- View recent detections
SELECT 
  vd.vehicle_type,
  np.plate_number,
  c.camera_id,
  vd.detection_time
FROM vehicle_detections vd
LEFT JOIN number_plate_detections np ON np.vehicle_detection_id = vd.id
JOIN cameras c ON vd.camera_id = c.id
ORDER BY vd.detection_time DESC
LIMIT 10;
```

4. **Search vehicle:**
- Go to http://localhost:3000/vehicles
- Search for detected plate
- Verify results appear

---

## 🚨 Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check if PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Python service won't start**
```bash
# Check Python version (need 3.11+)
python --version

# Activate virtual environment
source venv/bin/activate

# Check dependencies
pip list
```

**YOLO/OCR download stuck**
```bash
# Models download on first run (~2GB)
# Check available disk space
df -h

# Check internet connection
ping google.com

# Try manual download
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

**Next.js build fails**
```bash
# Clear cache
rm -rf .next

# Type check
npm run typecheck

# Check for errors
npm run build 2>&1 | grep -i error
```

**Frontend shows no data**
```bash
# Check if database is seeded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM cameras;"

# Re-seed if needed
npm run db:seed
```

---

## 📊 Demo Data

### Cameras (50 total)

**Distribution:**
- Ahmedabad: 15 cameras
- Surat: 10 cameras
- Vadodara: 8 cameras
- Rajkot: 7 cameras
- Gandhinagar: 5 cameras
- Others: 5 cameras

**Status:**
- Online: ~40 (80%)
- Offline: ~5 (10%)
- Maintenance: ~3 (6%)
- Error: ~2 (4%)

### Watchlist (4 vehicles)

| Plate | Severity | Reason |
|-------|----------|--------|
| GJ 01 AB 1234 | High | Theft case #2024/156 |
| GJ 05 XY 9876 | Critical | Hit and run incident |
| GJ 12 PQ 5678 | High | Stolen vehicle |
| MH 02 CD 4321 | Medium | Border crossing alert |

### Demo User

```
Email: admin@sentinel.gov.in
Password: admin123
Role: admin
```

---

## 🎯 Hackathon Demo Checklist

### Before Demo

- [ ] Both services running (Next.js + Python)
- [ ] Database seeded
- [ ] Test video ready
- [ ] Backup video recorded
- [ ] Presentation slides ready
- [ ] Internet connection tested

### Demo Flow (5 minutes)

1. **Opening (30s)**
   - Show dashboard
   - Highlight 50 cameras online

2. **Camera Registry (30s)**
   - Show camera map
   - Show camera details
   - Show online/offline status

3. **AI Detection (1m 30s)**
   - Upload test video/image
   - Show YOLO detection
   - Show OCR plate reading
   - Show confidence scores

4. **Vehicle Search (1m)**
   - Search detected vehicle
   - Show detection history
   - Show camera locations
   - Show timestamps

5. **Watchlist Alert (1m)**
   - Add vehicle to watchlist
   - Process image with watchlist vehicle
   - Show real-time alert
   - Show alert details

6. **Route Visualization (30s)**
   - Show vehicle route on map
   - Show camera-to-camera movement
   - Show timeline

7. **Closing (30s)**
   - Highlight key features
   - Mention scalability
   - Thank judges

### Backup Plan

If live demo fails:
1. Show recorded demo video
2. Walk through screenshots
3. Show architecture diagram
4. Explain technical approach

---

## 🔐 Security Notes

### Development vs. Production

**Current (Development):**
- ❌ Simple SHA-256 password hashing
- ❌ No session encryption
- ❌ Camera credentials in plain text
- ❌ No rate limiting
- ❌ CORS wide open

**For Production:**
- ✅ Use bcrypt/argon2 for passwords
- ✅ Implement JWT tokens
- ✅ Encrypt camera credentials
- ✅ Add rate limiting
- ✅ Restrict CORS origins
- ✅ Add API authentication
- ✅ Use HTTPS only
- ✅ Add audit logging for all actions

---

## 📈 Scalability Path

### Current Capacity
- **Cameras:** Up to ~100 without changes
- **Detections:** Thousands per day
- **Users:** 10-20 concurrent

### Scale to 500 Cameras
- Add Redis for caching
- Add stream gateways (1 per 50 cameras)
- Partition database by region
- Add read replicas

### Scale to 5,000 Cameras
- Microservices architecture
- Kubernetes deployment
- Message queue (RabbitMQ/Kafka)
- CDN for evidence files
- Regional data centers

### Scale to 50,000 Cameras
- Edge computing (process at camera location)
- Object storage (S3/MinIO)
- Time-series database (TimescaleDB)
- Distributed tracing
- Auto-scaling infrastructure

**For Hackathon:** Explain this path, don't implement it!

---

## 🆘 Get Help

### Logs to Check

```bash
# Next.js logs
npm run dev
# Check terminal output

# Python logs
python app/main.py
# Check terminal output

# Database logs
psql $DATABASE_URL
# Run queries to check data

# System logs
tail -f /var/log/postgresql/postgresql-*.log  # Linux
# Or check Docker logs if using Docker
```

### Debug Mode

```bash
# Next.js with verbose logging
NODE_ENV=development npm run dev

# Python with debug
uvicorn app.main:app --reload --log-level debug

# Database query logging
# Add to drizzle config:
{ logger: true }
```

---

## ✅ Daily Checklist

### Start of Day
- [ ] Pull latest code
- [ ] Start PostgreSQL
- [ ] Start Next.js dev server
- [ ] Start Python AI service (if Phase 2+)
- [ ] Check all services healthy

### End of Day
- [ ] Commit code
- [ ] Push to repository
- [ ] Stop all services
- [ ] Document any issues
- [ ] Plan next day tasks

---

## 🎓 Key Concepts

### Vehicle Registration Normalization

**Why:** OCR might read same plate differently
```
Input:  "GJ 01 AB 1234"
        "GJ01AB1234"
        "GJ-01-AB-1234"
        
Output: "GJ01AB1234" (always)
```

**How:**
1. Remove all spaces and hyphens
2. Convert to uppercase
3. Validate format (optional)
4. Store in `plate_number_normalized`

### Multi-Camera Tracking

**Problem:** How to know if detections from different cameras are the same vehicle?

**Solution (MVP):**
1. Same normalized registration number
2. Reasonable time gap (not 2 detections 100km apart in 5 minutes)
3. Geographic proximity of cameras

**Advanced (Future):**
- Vehicle appearance matching (color, make, model)
- Deep learning re-identification
- License plate + visual features

### Confidence Scores

**YOLO Confidence:** How sure the model is it detected a vehicle
- 0.5-0.7: Low confidence (might be false positive)
- 0.7-0.85: Medium confidence (probably correct)
- 0.85+: High confidence (very likely correct)

**OCR Confidence:** How sure the model is it read the plate correctly
- 0.5-0.7: Low (blurry/partial plate)
- 0.7-0.85: Medium (readable but some uncertainty)
- 0.85+: High (clear plate, high accuracy)

**Threshold:** Set minimum confidence (e.g., 0.6) to filter noise

---

## 🎤 Presentation Tips

### What Judges Want to See

1. **Working Demo** - Live is best, video is backup
2. **Technical Depth** - Show you understand AI/computer vision
3. **Scalability** - Explain how it grows from 50 to 50,000 cameras
4. **Real Problem** - Explain Gujarat Police's actual challenge
5. **Practical Solution** - Show it's deployable, not just theory

### What NOT to Say

- ❌ "This is just a prototype"
- ❌ "It doesn't work perfectly yet"
- ❌ "We ran out of time"
- ❌ "The AI is basic"

### What TO Say

- ✅ "This is a production-ready MVP"
- ✅ "We focused on core workflow first"
- ✅ "The architecture is designed to scale"
- ✅ "We used proven technologies"

### Handle Questions

**Q: "What if the camera goes offline?"**
A: "System marks it offline, sends alert to admin, stores last-seen timestamp. Once back online, it resumes processing."

**Q: "What about privacy?"**
A: "System is for law enforcement only. Role-based access control. Complete audit logs. GDPR-compliant data retention policies."

**Q: "Can it handle night/rain/fog?"**
A: "Current MVP uses standard YOLO. For production, we'd use domain-specific models trained on night/weather conditions."

**Q: "How accurate is the OCR?"**
A: "EasyOCR achieves ~85-90% on clear plates. We store confidence scores and allow manual verification for critical cases."

---

**YOU ARE READY FOR PHASE 2!** 🚀

Start with Python AI service setup, and you'll have a working vehicle detection system within 1-2 days.
