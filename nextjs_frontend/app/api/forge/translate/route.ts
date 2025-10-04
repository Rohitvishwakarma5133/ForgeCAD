import { NextRequest, NextResponse } from 'next/server';
import { forgeClient } from '@/lib/forge';

/**
 * GET /api/forge/translate?urn={urn}
 * Get translation status for a model
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urn = searchParams.get('urn');

    if (!urn) {
      return NextResponse.json(
        { error: 'Missing URN', message: 'URN parameter is required' },
        { status: 400 }
      );
    }

    const result = await forgeClient.getTranslationStatus(urn);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get translation status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forge/translate
 * Start translation for a model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urn, outputFormats } = body;

    if (!urn) {
      return NextResponse.json(
        { error: 'Missing URN', message: 'URN is required in request body' },
        { status: 400 }
      );
    }

    const formats = outputFormats || ['svf2', 'thumbnail'];
    const result = await forgeClient.translateModel(urn, formats);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation start error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to start translation' },
      { status: 500 }
    );
  }
}