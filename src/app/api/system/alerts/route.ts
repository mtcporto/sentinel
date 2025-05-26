import { NextResponse } from 'next/server';
import { getSystemAlerts } from '@/lib/actions';

export async function GET() {
  try {
    const alerts = await getSystemAlerts();
    
    return NextResponse.json({
      success: true,
      alerts: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch system alerts',
        alerts: []
      },
      { status: 500 }
    );
  }
}
