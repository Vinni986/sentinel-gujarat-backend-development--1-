import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleDetections, numberPlateDetections, cameras } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { calculateDistance } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ plate: string }> }
) {
  try {
    const { plate } = await context.params;
    const plateNormalized = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    if (!plateNormalized) {
      return NextResponse.json({ error: 'Invalid plate number' }, { status: 400 });
    }
    
    // Get detections ordered by time
    const detections = await db
      .select({
        id: vehicleDetections.id,
        detectionTime: vehicleDetections.detectionTime,
        cameraId: cameras.cameraId,
        cameraName: cameras.name,
        cameraLocation: cameras.location,
        latitude: cameras.latitude,
        longitude: cameras.longitude,
      })
      .from(numberPlateDetections)
      .innerJoin(
        vehicleDetections,
        eq(numberPlateDetections.vehicleDetectionId, vehicleDetections.id)
      )
      .innerJoin(cameras, eq(vehicleDetections.cameraId, cameras.id))
      .where(eq(numberPlateDetections.plateNumberNormalized, plateNormalized))
      .orderBy(asc(vehicleDetections.detectionTime));
    
    if (detections.length === 0) {
      return NextResponse.json({
        route: [],
        totalDistance: 0,
        duration: 0,
      });
    }
    
    // Calculate route with distances and durations
    const route = [];
    let totalDistance = 0;
    
    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      const lat = parseFloat(detection.latitude as string);
      const lon = parseFloat(detection.longitude as string);
      
      let distanceFromPrevious = 0;
      let timeFromPrevious = 0;
      
      if (i > 0) {
        const prev = detections[i - 1];
        const prevLat = parseFloat(prev.latitude as string);
        const prevLon = parseFloat(prev.longitude as string);
        
        distanceFromPrevious = calculateDistance(prevLat, prevLon, lat, lon);
        totalDistance += distanceFromPrevious;
        
        timeFromPrevious = new Date(detection.detectionTime).getTime() - new Date(prev.detectionTime).getTime();
      }
      
      route.push({
        camera: {
          cameraId: detection.cameraId,
          name: detection.cameraName,
          location: detection.cameraLocation,
          latitude: lat,
          longitude: lon,
        },
        detectionTime: detection.detectionTime,
        sequence: i + 1,
        distanceFromPrevious: Math.round(distanceFromPrevious * 100) / 100, // km, 2 decimals
        timeFromPrevious: Math.round(timeFromPrevious / 1000 / 60), // minutes
      });
    }
    
    const duration = detections.length > 1
      ? new Date(detections[detections.length - 1].detectionTime).getTime() - new Date(detections[0].detectionTime).getTime()
      : 0;
    
    return NextResponse.json({
      route,
      totalDistance: Math.round(totalDistance * 100) / 100,
      duration: Math.round(duration / 1000 / 60), // minutes
      detections: detections.length,
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    return NextResponse.json(
      { error: 'Route calculation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
