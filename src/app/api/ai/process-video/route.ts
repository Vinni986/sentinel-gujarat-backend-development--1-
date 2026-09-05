import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  vehicleDetections,
  numberPlateDetections,
  cameras,
  watchlist,
  alerts,
  vehicles,
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const cameraId = formData.get('camera_id') as string;
    const video = formData.get('video');

    if (!cameraId) {
      return NextResponse.json(
        { error: 'camera_id is required' },
        { status: 400 }
      );
    }

    if (!(video instanceof File)) {
      return NextResponse.json(
        { error: 'video is required' },
        { status: 400 }
      );
    }

    const [camera] = await db
      .select()
      .from(cameras)
      .where(eq(cameras.cameraId, cameraId))
      .limit(1);

    if (!camera) {
      return NextResponse.json(
        { error: 'Camera not found' },
        { status: 404 }
      );
    }

    const response = await fetch(`${AI_SERVICE_URL}/process/video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'AI video processing failed',
          details: errorText,
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    const savedDetections: any[] = [];

    for (const detection of result.detections || []) {
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
            frameNumber: detection.frameNumber,
            videoProcessing: true,
          },
        })
        .returning();

      let plateDetectionRecord = null;
      let alertCreated = false;
      let alertSeverity = null;
      let alertReason = null;

      if (detection.plate?.normalized) {
        const plateNormalized = detection.plate.normalized;

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

        const [existingVehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.registrationNumber, plateNormalized))
          .limit(1);

        if (existingVehicle) {
          await db
            .update(vehicles)
            .set({
              lastSeenAt: new Date(detection.timestamp),
              totalDetections: sql`${vehicles.totalDetections} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(vehicles.registrationNumber, plateNormalized));
        } else {
          await db.insert(vehicles).values({
            registrationNumber: plateNormalized,
            vehicleType: detection.vehicleType,
            firstSeenAt: new Date(detection.timestamp),
            lastSeenAt: new Date(detection.timestamp),
            totalDetections: 1,
          });
        }

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
          await db
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
                source: 'video',
              },
            })
            .returning();

          alertCreated = true;
          alertSeverity = watchlistEntry.severity;
          alertReason = watchlistEntry.reason;
        }

        savedDetections.push({
          detectionId: vehicleDetection.id,
          plateDetectionId: plateDetectionRecord?.id,
          alertCreated,
          alertSeverity,
          alertReason,
          vehicleType: detection.vehicleType,
          plate: plateNormalized,
          frameNumber: detection.frameNumber,
          timestamp: detection.timestamp,
        });
      } else {
        savedDetections.push({
          detectionId: vehicleDetection.id,
          plateDetectionId: null,
          alertCreated: false,
          alertSeverity: null,
          alertReason: null,
          vehicleType: detection.vehicleType,
          plate: null,
          frameNumber: detection.frameNumber,
          timestamp: detection.timestamp,
        });
      }
    }

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
      framesProcessed: result.framesProcessed || 0,
      totalFrames: result.totalFrames || 0,
      detections: savedDetections.length,
      savedCount: savedDetections.length,
      alerts: savedDetections.filter((d) => d.alertCreated).length,
      saved: savedDetections,
    });
  } catch (error) {
    console.error('Process video error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process CCTV video',
        details:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
