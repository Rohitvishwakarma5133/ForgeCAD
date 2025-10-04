import { NextRequest, NextResponse } from 'next/server';
import { forgeClient, ForgeClient } from '@/lib/forge';
import { CreateBucketRequest } from '@/types/forge';

/**
 * POST /api/forge/buckets
 * Create a new bucket
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateBucketRequest;
    
    // Validate required fields
    if (!body.bucketKey) {
      return NextResponse.json(
        { error: 'Missing bucketKey', message: 'bucketKey is required' },
        { status: 400 }
      );
    }

    // Set default policy if not provided
    if (!body.policyKey) {
      body.policyKey = 'temporary';
    }

    const result = await forgeClient.createBucket(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bucket creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create bucket' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/forge/buckets?key={bucketKey}
 * Get bucket details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucketKey = searchParams.get('key');

    if (!bucketKey) {
      return NextResponse.json(
        { error: 'Missing bucketKey', message: 'bucketKey parameter is required' },
        { status: 400 }
      );
    }

    const result = await forgeClient.getBucket(bucketKey);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get bucket error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get bucket' },
      { status: 500 }
    );
  }
}