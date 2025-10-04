import { NextRequest, NextResponse } from 'next/server';
import { sampleConversions, sampleEquipment } from '@/lib/mockData';

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
        { error: 'Preview not available yet' },
        { status: 400 }
      );
    }

    // Return preview data including equipment detected
    return NextResponse.json({
      conversion,
      equipment: sampleEquipment.slice(0, conversion.equipmentCount || 5),
      preview: {
        thumbnailUrl: `/previews/${conversionId}_thumb.png`,
        fullPreviewUrl: `/previews/${conversionId}_preview.png`,
        drawingBounds: {
          width: 1200,
          height: 800,
          scale: '1:100'
        }
      },
      metadata: {
        detectedSymbols: conversion.equipmentCount || 0,
        detectedText: Math.floor((conversion.equipmentCount || 0) * 2.3),
        detectedConnections: conversion.pipeCount || 0,
        processingVersion: '2.1.0',
        confidenceBreakdown: {
          symbols: Math.round((conversion.confidence + 0.02) * 100),
          text: Math.round((conversion.confidence - 0.03) * 100),
          connections: Math.round((conversion.confidence + 0.01) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to load preview' },
      { status: 500 }
    );
  }
}