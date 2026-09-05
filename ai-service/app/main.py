"""
Sentinel Gujarat AI Service
FastAPI service for vehicle detection and number plate recognition
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.api.frames import router as frames_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Sentinel Gujarat AI Service",
    description="Vehicle detection and number plate recognition API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://3000-*",  # Arena preview URLs
    ],
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
    """Root endpoint with service information"""
    return {
        "service": "Sentinel Gujarat AI Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /process/health",
            "process_frame": "POST /process/frame",
            "docs": "GET /docs"
        }
    }


@app.get("/health")
def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "sentinel-ai"
    }


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 80)
    print("🚀 Sentinel Gujarat AI Service Starting...")
    print("=" * 80)
    print("\nNote: First run will download AI models (~2GB)")
    print("This may take a few minutes. Please be patient...\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
