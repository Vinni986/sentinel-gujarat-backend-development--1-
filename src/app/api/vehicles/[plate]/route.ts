import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, vehicleDetections, numberPlateDetections, cameras } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

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
    
    // Get vehicle profile
    const [vehicleProfile] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.registrationNumber, plateNormalized))
      .limit(1);
    
    // Get all detections for this plate
    const detections = await db
      .select({
        id: vehicleDetections.id,
        detectionTime: vehicleDetections.detectionTime,
        vehicleType: vehicleDetections.vehicleType,
        confidence: vehicleDetections.confidence,
        imagePath: vehicleDetections.imagePath,
        thumbnailPath: vehicleDetections.thumbnailPath,
        latitude: vehicleDetections.latitude,
        longitude: vehicleDetections.longitude,
        cameraId: cameras.cameraId,
        cameraName: cameras.name,
        cameraLocation: cameras.location,
        cameraArea: cameras.area,
        cameraLatitude: cameras.latitude,
        cameraLongitude: cameras.longitude,
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
      vehicle: vehicleProfile || null,
      detections,
      total: detections.length,
    });
  } catch (error) {
    console.error('Vehicle search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
