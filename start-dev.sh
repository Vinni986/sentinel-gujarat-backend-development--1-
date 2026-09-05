#!/bin/bash

# Sentinel Gujarat - Development Startup Script

echo "================================================"
echo "  Sentinel Gujarat - Starting Development"
echo "================================================"
echo ""

# Check if Python AI service should be started
if [ "$1" = "--with-ai" ]; then
    echo "📦 Starting Python AI Service..."
    echo ""
    
    cd ai-service
    
    # Check if venv exists
    if [ ! -d "venv" ]; then
        echo "⚠️  Python virtual environment not found!"
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate venv and start service in background
    source venv/bin/activate
    
    # Check if dependencies are installed
    if ! python -c "import fastapi" 2>/dev/null; then
        echo "📥 Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    
    echo "🚀 Starting AI service on port 8000..."
    python app/main.py &
    AI_PID=$!
    
    cd ..
    
    echo "✅ AI service started (PID: $AI_PID)"
    echo ""
fi

# Start Next.js
echo "🚀 Starting Next.js on port 3000..."
echo ""
npm run dev

# Cleanup on exit
if [ ! -z "$AI_PID" ]; then
    echo ""
    echo "🛑 Stopping AI service..."
    kill $AI_PID
fi
