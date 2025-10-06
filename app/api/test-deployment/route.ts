import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      deployment: 'vercel',
      api: {
        methods: ['GET', 'POST', 'OPTIONS'],
        endpoints: {
          upload: '/api/upload',
          uploadClean: '/api/upload-clean',
          uploadFixed: '/api/upload-fixed',
          status: '/api/status/[id]',
          test: '/api/test-deployment'
        }
      },
      mongodb: {
        connection: process.env.MONGODB_URI ? 'configured' : 'not_configured',
        uri_preview: process.env.MONGODB_URI ? 
          process.env.MONGODB_URI.substring(0, 20) + '...' : 
          'not set'
      },
      clerk: {
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'configured' : 'not_configured',
        secretKey: process.env.CLERK_SECRET_KEY ? 'configured' : 'not_configured'
      }
    };

    return NextResponse.json(healthCheck, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Health check failed',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      status: 'success',
      message: 'POST method working correctly',
      timestamp: new Date().toISOString(),
      note: 'This confirms the API route supports POST requests'
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}