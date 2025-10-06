import { NextRequest, NextResponse } from 'next/server';

// Generate unique ID for this session
function generateConversionId(): string {
  return `conversion_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const drawingType = formData.get('drawingType') as string;
    const priority = formData.get('priority') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400, headers: getCORSHeaders() }
      );
    }

    const conversionId = generateConversionId();
    
    console.log('✅ File received:', {
      conversionId,
      filename: file.name,
      size: file.size,
      type: file.type,
      projectName,
      drawingType,
      priority
    });

    // Return immediate success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully and processing started',
      conversionId,
      filename: file.name,
      size: file.size,
      type: file.type,
      status: 'processing',
      timestamp: new Date().toISOString()
    }, {
      headers: getCORSHeaders()
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: getCORSHeaders()
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'CADly AI Upload API',
      description: 'Use POST method to upload CAD files for analysis',
      supportedFormats: ['.dwg', '.dxf', '.pdf'],
      maxFileSize: '50MB',
      timestamp: new Date().toISOString()
    },
    { 
      status: 200,
      headers: getCORSHeaders()
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders(),
  });
}

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}