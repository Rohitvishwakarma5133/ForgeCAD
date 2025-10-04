import { NextRequest, NextResponse } from 'next/server';
import { generateMockResult } from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const drawingType = formData.get('drawingType') as string;
    const priority = formData.get('priority') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Simulate file validation
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, PNG, JPEG, or TIFF files.' },
        { status: 400 }
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Generate a mock result
    const result = generateMockResult(file.name);

    // Return the conversion ID and initial status
    return NextResponse.json({
      conversionId: result.conversionId,
      filename: result.filename,
      type: drawingType || result.type,
      status: 'processing',
      projectName,
      priority,
      message: 'Upload successful. Processing started.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint' });
}