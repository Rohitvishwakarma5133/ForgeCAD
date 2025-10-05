import { NextRequest, NextResponse } from 'next/server';
import { generateMockResult, processingStages } from '@/lib/mockData';
import { analysisEngine } from '@/lib/analysisEngine';
import dbConnect from '@/lib/mongodb';
import { Conversion } from '@/lib/models';
import mongoose from 'mongoose';

// In-memory store for demo purposes - now stores filename mapping
const conversions = new Map();
const conversionFilenames = new Map(); // Store filename mapping

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conversionId = id;
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    // First, try to get real-time analysis status from analysis engine
    const realTimeStatus = await analysisEngine.getProcessingStatus(conversionId);
    
    if (realTimeStatus) {
      // Real-time analysis is running or completed
      if (realTimeStatus.status === 'completed') {
        return NextResponse.json({
          ...realTimeStatus,
          id: conversionId,
          status: 'completed',
          progress: 100,
          currentStage: 'complete',
          stageLabel: 'Analysis complete!'
        });
      } else if (realTimeStatus.status === 'failed') {
        return NextResponse.json({
          id: conversionId,
          status: 'failed',
          progress: 0,
          currentStage: 'error',
          stageLabel: 'Processing failed',
          error: realTimeStatus.error || 'Unknown error occurred'
        });
      } else {
        // Still processing - return real-time progress
        return NextResponse.json({
          id: conversionId,
          status: 'processing',
          progress: realTimeStatus.progress || 0,
          currentStage: realTimeStatus.stage || 'processing',
          stageLabel: realTimeStatus.stageLabel || 'Processing...',
          filename: realTimeStatus.filename,
          fileType: realTimeStatus.fileType,
          fileSize: realTimeStatus.fileSize
        });
      }
    }

    // If it's a database ID, check if it exists in the database
    if (mongoose.Types.ObjectId.isValid(conversionId)) {
      try {
        await dbConnect();
        const dbConversion = await Conversion.findById(conversionId);
        if (dbConversion) {
          // Check if real-time processing exists for this database record
          const realTimeDbStatus = await analysisEngine.getProcessingStatus(dbConversion._id.toString());
          
          if (realTimeDbStatus) {
            if (realTimeDbStatus.status === 'completed') {
              // Update database record with results
              dbConversion.status = 'completed';
              dbConversion.results = realTimeDbStatus;
              await dbConversion.save();
              
              return NextResponse.json({
                ...realTimeDbStatus,
                id: conversionId,
                status: 'completed',
                progress: 100,
                currentStage: 'complete',
                stageLabel: 'Analysis complete!'
              });
            } else if (realTimeDbStatus.status === 'failed') {
              dbConversion.status = 'failed';
              await dbConversion.save();
              
              return NextResponse.json({
                id: conversionId,
                status: 'failed',
                progress: 0,
                currentStage: 'error',
                stageLabel: 'Processing failed',
                error: realTimeDbStatus.error || 'Unknown error occurred'
              });
            } else {
              // Still processing
              return NextResponse.json({
                id: conversionId,
                status: 'processing',
                progress: realTimeDbStatus.progress || 0,
                currentStage: realTimeDbStatus.stage || 'processing',
                stageLabel: realTimeDbStatus.stageLabel || 'Processing...',
                filename: dbConversion.fileName,
                fileType: dbConversion.fileType,
                fileSize: dbConversion.originalFileSize
              });
            }
          }
          
          // Database record exists but no real-time processing - return database status
          return NextResponse.json({
            id: conversionId,
            status: dbConversion.status,
            progress: dbConversion.status === 'completed' ? 100 : 50,
            currentStage: dbConversion.status,
            stageLabel: `Status: ${dbConversion.status}`,
            filename: dbConversion.fileName,
            fileType: dbConversion.fileType,
            fileSize: dbConversion.originalFileSize,
            results: dbConversion.results
          });
        }
      } catch (dbError) {
        console.error('Database error in status check:', dbError);
        // Continue to fallback processing
      }
    }

    // Fallback to mock processing for backwards compatibility
    if (!conversions.has(conversionId)) {
      // Create a new conversion entry if it doesn't exist
      const now = Date.now();
      conversions.set(conversionId, {
        id: conversionId,
        startTime: now,
        currentStage: 0,
        status: 'processing'
      });
      
      // Store filename mapping if provided
      if (filename) {
        conversionFilenames.set(conversionId, filename);
      }
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
      // Processing complete - use stored filename or fallback
      const storedFilename = conversionFilenames.get(conversionId) || `demo-${conversionId}.pdf`;
      const result = generateMockResult(storedFilename);
      
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