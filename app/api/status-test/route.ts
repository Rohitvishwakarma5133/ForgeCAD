import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Status API route is working!',
    timestamp: new Date().toISOString(),
    route: '/api/status-test'
  });
}