import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { notes } = body;
    
    // In a real app, get user ID from session
    // For now, we'll use a placeholder
    const userId = '00000000-0000-0000-0000-000000000000'; // TODO: Get from auth
    
    const [alert] = await db
      .update(alerts)
      .set({
        isAcknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        notes: notes || null,
      })
      .where(eq(alerts.id, id))
      .returning();
    
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error('Alert acknowledge error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
