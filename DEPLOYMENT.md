# Sentinel Gujarat - Deployment Guide

Complete guide for deploying the Sentinel Gujarat CCTV Intelligence Platform.

---

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 14+
- 4GB RAM minimum
- 10GB free disk space

### One-Command Start

```bash
# Start Next.js only
npm run dev

# Start Next.js + Python AI service
./start-dev.sh --with-ai
```

---

## Step-by-Step Setup

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb app_db

# Or using psql
psql -c "CREATE DATABASE app_db;"

# Enable PostGIS extension (optional for now)
psql app_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Next.js Frontend/Backend

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL

# Push database schema
npm run db:push

# Seed demo data (50 cameras + 4 watchlist vehicles)
npm run db:seed

# Start development server
npm run dev
```

Visit: http://localhost:3000

### 3. Python AI Service

```bash
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR venv\Scripts\activate on Windows

# Install dependencies (takes ~10 minutes first time)
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start AI service
python app/main.py
```

AI service runs on: http://localhost:8000

**First run:** AI models will auto-download (~500MB YOLO + ~100MB OCR). Be patient!

---

## Testing the Complete System

### 1. Verify Services

```bash
# Check Next.js
curl http://localhost:3000/api/health

# Check Python AI
curl http://localhost:8000/health
```

### 2. Test AI Detection

1. Go to http://localhost:3000/test
2. Select camera: CAM-001
3. Upload a traffic image with vehicles
4. Click "Process Frame"
5. Verify detections appear
6. Check database:

```bash
psql $DATABASE_URL
SELECT COUNT(*) FROM vehicle_detections;
SELECT COUNT(*) FROM number_plate_detections;
```

### 3. Test Vehicle Search

1. Note the plate number from step 2
2. Go to http://localhost:3000/vehicles
3. Search for the plate
4. Verify detection history appears

### 4. Test Watchlist Alert

1. Add a vehicle to watchlist (use a detected plate)
2. Process another image with that plate
3. Go to http://localhost:3000/alerts
4. Verify alert appears
5. Click "Acknowledge"

---

## Production Deployment

### Architecture

```
                   ┌─────────────────┐
Internet ──────────│  Load Balancer  │
                   └────────┬─────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   ┌────▼────┐                          ┌────▼────┐
   │Next.js  │                          │Next.js  │
   │Instance │                          │Instance │
   └────┬────┘                          └────┬────┘
        │                                     │
        └──────────────────┬──────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
       ┌────▼─────┐                  ┌────▼─────┐
       │ Python   │                  │ Python   │
       │ AI       │                  │ AI       │
       │ Worker   │                  │ Worker   │
       └────┬─────┘                  └────┬─────┘
            │                             │
            └──────────────┬──────────────┘
                          │
                     ┌────▼─────┐
                     │PostgreSQL│
                     │  Primary │
                     └──────────┘
```

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: sentinel_db
      POSTGRES_USER: sentinel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile.nextjs
    environment:
      DATABASE_URL: postgresql://sentinel:${DB_PASSWORD}@postgres:5432/sentinel_db
      AI_SERVICE_URL: http://ai-service:8000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
  
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://sentinel:${DB_PASSWORD}@postgres:5432/sentinel_db
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    deploy:
      resources:
        limits:
          memory: 4G

volumes:
  postgres_data:
```

Start with:
```bash
docker-compose up -d
```

### Option 2: Kubernetes (Enterprise)

See `k8s/` directory for manifests.

### Option 3: Manual VPS

**Requirements:**
- Ubuntu 22.04 LTS
- 4 CPU cores
- 8GB RAM
- 50GB storage

**Setup:**

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y postgresql postgis python3.11 python3-pip nodejs npm nginx

# 2. Setup PostgreSQL
sudo -u postgres createdb sentinel_db
sudo -u postgres psql sentinel_db -c "CREATE EXTENSION postgis;"

# 3. Clone repository
git clone https://github.com/your-repo/sentinel-gujarat
cd sentinel-gujarat

# 4. Setup Next.js
npm install
npm run build

# 5. Setup Python AI
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Setup systemd services
sudo cp deploy/sentinel-nextjs.service /etc/systemd/system/
sudo cp deploy/sentinel-ai.service /etc/systemd/system/
sudo systemctl enable sentinel-nextjs sentinel-ai
sudo systemctl start sentinel-nextjs sentinel-ai

# 7. Setup nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sentinel
sudo ln -s /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

---

## Environment Variables

### Next.js (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/app_db

# AI Service
AI_SERVICE_URL=http://localhost:8000

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://sentinel.gujarat.gov.in
```

### Python AI (.env)

```bash
# Database (for watchlist checks)
DATABASE_URL=postgresql://user:pass@localhost:5432/app_db

# Performance
USE_GPU=false  # Set true if GPU available
```

---

## Performance Optimization

### Database

```sql
-- Create additional indexes
CREATE INDEX idx_detections_time ON vehicle_detections(detection_time DESC);
CREATE INDEX idx_plates_normalized ON number_plate_detections(plate_number_normalized);
CREATE INDEX idx_alerts_pending ON alerts(is_acknowledged, alert_time DESC);

-- Enable query optimization
ANALYZE;
```

### Next.js

```bash
# Build optimized
npm run build

# Use PM2 for production
npm install -g pm2
pm2 start npm --name "sentinel-nextjs" -- start
pm2 save
pm2 startup
```

### Python AI

```bash
# Use Gunicorn with workers
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

---

## Monitoring

### Health Checks

```bash
# Next.js
curl http://localhost:3000/api/health

# Python AI
curl http://localhost:8000/health

# PostgreSQL
psql $DATABASE_URL -c "SELECT 1"
```

### Metrics

Install Prometheus + Grafana for monitoring:

```bash
# Docker compose
docker-compose -f monitoring/docker-compose.yml up -d
```

Dashboards available at:
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

### Logs

```bash
# Next.js logs
pm2 logs sentinel-nextjs

# Python AI logs
journalctl -u sentinel-ai -f

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log
```

---

## Backup & Recovery

### Database Backup

```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240115.sql
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Enable firewall (UFW)
- [ ] Restrict database access (pg_hba.conf)
- [ ] Enable rate limiting
- [ ] Set up fail2ban
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Encrypt camera credentials
- [ ] Use environment secrets (not .env in production)

---

## Troubleshooting

### AI Service Won't Start

```bash
# Check Python version
python3 --version  # Should be 3.11+

# Check dependencies
pip list | grep -E "fastapi|ultralytics|easyocr"

# Check disk space (models need ~500MB)
df -h

# Check logs
python app/main.py
```

### Database Connection Failed

```bash
# Check PostgreSQL running
systemctl status postgresql

# Check connection
psql $DATABASE_URL

# Check pg_hba.conf allows connection
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

### Slow AI Processing

```bash
# Enable GPU (if available)
export USE_GPU=true

# Reduce image resolution
# Edit app/api/frames.py, resize images before processing

# Use smaller YOLO model (already using yolov8n)
```

---

## Scaling

### Horizontal Scaling

1. **Load Balancer**: nginx/HAProxy
2. **Multiple Next.js instances**: PM2 cluster mode
3. **Multiple AI workers**: Separate servers
4. **Database read replicas**: For search queries
5. **Redis cache**: For session + stats

### Vertical Scaling

1. **CPU**: More cores for AI processing
2. **RAM**: More memory for concurrent streams
3. **GPU**: Tesla T4/A100 for 10x speedup
4. **Storage**: SSD for database + evidence

---

## Support

For issues or questions:
1. Check `README.md`
2. Check `IMPLEMENTATION_PLAN.md`
3. Check `QUICK_REFERENCE.md`
4. Check logs
5. Open GitHub issue

---

**Deployment Status:** Ready for production with proper infrastructure! 🚀
