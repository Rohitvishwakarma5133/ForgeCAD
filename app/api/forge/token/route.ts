import { NextRequest, NextResponse } from 'next/server';
import { forgeClient } from '@/lib/forge';

/**
 * GET /api/forge/token
 * Returns a viewer token for frontend authentication
 */
export async function GET(request: NextRequest) {
  try {
    const result = await forgeClient.getViewerToken();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to generate token' },
      { status: 500 }
    );
  }
}