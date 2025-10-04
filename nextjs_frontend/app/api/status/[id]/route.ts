import { NextRequest, NextResponse } from 'next/server';
import { generateMockResult, processingStages } from '@/lib/mockData';

// In-memory store for demo purposes
const conversions = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conversionId = id;

    if (!conversions.has(conversionId)) {
      // Create a new conversion entry if it doesn't exist
      const now = Date.now();
      conversions.set(conversionId, {
        id: conversionId,
        startTime: now,
        currentStage: 0,
        status: 'processing'
      });
    }

    const conversion = conversions.get(conversionId);
    const elapsed = Date.now() - conversion.startTime;

    // Simulate processing stages
    let totalDuration = 0;
    let currentStage = 0;

    for (let i = 0; i < processingStages.length; i++) {
      totalDuration += processingStages[i].duration;
      if (elapsed < totalDuration) {
        currentStage = i;
        break;
      }
      currentStage = i + 1;
    }

    if (currentStage >= processingStages.length) {
      // Processing complete
      const result = generateMockResult(`demo-${conversionId}.pdf`);
      
      return NextResponse.json({
        ...result,
        id: conversionId,
        status: 'completed',
        progress: 100,
        currentStage: 'complete',
        stageLabel: 'Processing complete!'
      });
    }

    // Still processing
    const stage = processingStages[currentStage];
    const stageElapsed = elapsed - processingStages.slice(0, currentStage).reduce((sum, s) => sum + s.duration, 0);
    const stageProgress = Math.min((stageElapsed / stage.duration) * 100, 100);
    const overallProgress = Math.min(stage.progress + (stageProgress * 0.01 * (processingStages[currentStage + 1]?.progress - stage.progress || 0)), 100);

    return NextResponse.json({
      id: conversionId,
      status: 'processing',
      progress: Math.round(overallProgress),
      currentStage: stage.stage,
      stageLabel: stage.label,
      estimatedTimeRemaining: Math.max(0, (totalDuration - elapsed) / 1000)
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversion status' },
      { status: 500 }
    );
  }
}