import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleDetections, numberPlateDetections, cameras, watchlist, alerts, vehicles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cameraId = formData.get('camera_id') as string;
    
    if (!cameraId) {
      return NextResponse.json({ error: 'camera_id is required' }, { status: 400 });
    }
    
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
    const response = await fetch(`${AI_SERVICE_URL}/process/frame`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('AI service error');
    }
    
    const result = await response.json();
    
    if (!result.success || !result.detections || result.detections.length === 0) {
      return NextResponse.json({
        success: true,
        detections: 0,
        message: 'No vehicles detected'
      });
    }
    
    // Save detections to database
    const savedDetections = [];
    
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
          detectionTime: new Date(detection.timestamp),
          metadata: {
            jobId: detection.jobId,
            cameraName: camera.name,
          }
        })
        .returning();
      
      let plateDetectionRecord = null;
      let alertCreated = false;
      
      // If plate was read, process it
      if (detection.plate && detection.plate.normalized) {
        const plateNormalized = detection.plate.normalized;
        
        // Insert plate detection
        [plateDetectionRecord] = await db
          .insert(numberPlateDetections)
          .values({
            vehicleDetectionId: vehicleDetection.id,
            plateNumber: detection.plate.raw,
            plateNumberNormalized: plateNormalized,
            confidence: detection.plate.confidence.toString(),
            ocrText: detection.plate.raw,
          })
          .returning();
        
        // Update or create vehicle record
        const [existingVehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.registrationNumber, plateNormalized))
          .limit(1);
        
        if (existingVehicle) {
          // Update existing vehicle
          await db
            .update(vehicles)
            .set({
              lastSeenAt: new Date(detection.timestamp),
              totalDetections: sql`${vehicles.totalDetections} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(vehicles.registrationNumber, plateNormalized));
        } else {
          // Create new vehicle record
          await db
            .insert(vehicles)
            .values({
              registrationNumber: plateNormalized,
              vehicleType: detection.vehicleType,
              firstSeenAt: new Date(detection.timestamp),
              lastSeenAt: new Date(detection.timestamp),
              totalDetections: 1,
            });
        }
        
        // Check watchlist
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
              plateDetectionId: plateDetectionRecord.id,
              cameraId: camera.id,
              registrationNumber: plateNormalized,
              severity: watchlistEntry.severity,
              metadata: {
                cameraName: camera.name,
                location: camera.location,
                reason: watchlistEntry.reason,
                caseReference: watchlistEntry.caseReference,
              }
            })
            .returning();
          
          alertCreated = true;
        }
      }
      
      savedDetections.push({
        detectionId: vehicleDetection.id,
        plateDetectionId: plateDetectionRecord?.id,
        alertCreated,
        vehicleType: detection.vehicleType,
        plate: detection.plate?.normalized,
      });
    }
    
    // Update camera last_seen
    await db
      .update(cameras)
      .set({
        lastSeen: new Date(),
        status: 'online',
        updatedAt: new Date(),
      })
      .where(eq(cameras.id, camera.id));
    
    return NextResponse.json({
      success: true,
      detections: savedDetections.length,
      saved: savedDetections,
      alerts: savedDetections.filter(d => d.alertCreated).length,
    });
    
  } catch (error) {
    console.error('Process frame error:', error);
    return NextResponse.json(
      { error: 'Failed to process frame', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
