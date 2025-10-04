import { NextRequest, NextResponse } from 'next/server';
import { sampleConversions } from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conversionId = id;
    const conversion = sampleConversions.find(c => c.id === conversionId);

    if (!conversion) {
      return NextResponse.json(
        { error: 'Conversion not found' },
        { status: 404 }
      );
    }

    if (conversion.status !== 'completed') {
      return NextResponse.json(
        { error: 'Conversion not yet complete' },
        { status: 400 }
      );
    }

    // In a real implementation, this would serve the actual CAD file
    // For now, we'll return metadata about the download
    return NextResponse.json({
      downloadUrl: `/downloads/${conversionId}.dwg`,
      filename: conversion.filename.replace(/\.[^.]+$/, '.dwg'),
      fileSize: '2.4 MB',
      format: 'DWG',
      message: 'Download ready'
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare download' },
      { status: 500 }
    );
  }
}