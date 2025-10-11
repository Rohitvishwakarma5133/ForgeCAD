import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Production health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'online',
        database: process.env.MONGODB_URI ? 'configured' : 'not_configured'
      },
      version: '1.0.0'
    };

    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}