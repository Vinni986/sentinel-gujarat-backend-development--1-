import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts, cameras, watchlist, vehicleDetections } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const acknowledged = searchParams.get('acknowledged');
    const severity = searchParams.get('severity');
    
    let query = db
      .select({
        id: alerts.id,
        registrationNumber: alerts.registrationNumber,
        severity: alerts.severity,
        alertTime: alerts.alertTime,
        isAcknowledged: alerts.isAcknowledged,
        acknowledgedAt: alerts.acknowledgedAt,
        notes: alerts.notes,
        cameraId: cameras.cameraId,
        cameraName: cameras.name,
        cameraLocation: cameras.location,
        watchlistReason: watchlist.reason,
        watchlistCaseRef: watchlist.caseReference,
        detectionTime: vehicleDetections.detectionTime,
        detectionImage: vehicleDetections.imagePath,
      })
      .from(alerts)
      .leftJoin(cameras, eq(alerts.cameraId, cameras.id))
      .leftJoin(watchlist, eq(alerts.watchlistId, watchlist.id))
      .leftJoin(vehicleDetections, eq(alerts.vehicleDetectionId, vehicleDetections.id))
      .$dynamic();
    
    // Apply filters
    const conditions = [];
    
    if (acknowledged !== null) {
      conditions.push(eq(alerts.isAcknowledged, acknowledged === 'true'));
    }
    
    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const alertList = await query.orderBy(desc(alerts.alertTime));
    
    return NextResponse.json({
      alerts: alertList,
      total: alertList.length,
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
