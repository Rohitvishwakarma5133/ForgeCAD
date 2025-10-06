import { NextRequest, NextResponse } from 'next/server';

// Generate unique ID for this session
function generateConversionId(): string {
  return `conversion_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// CORS headers helper
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

// Mock job storage for fallback
const mockJobStorage = new Map();

async function saveJobToStorage(conversionId: string, jobData: any) {
  try {
    // Try MongoDB first (will fail if unavailable)
    const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
    await mongoJobStorage.setJob(conversionId, jobData);
    console.log('✅ Job saved to MongoDB');
    return 'mongodb';
  } catch (error) {
    console.warn('⚠️ MongoDB unavailable, using memory storage:', error.message);
    // Fallback to memory storage
    mockJobStorage.set(conversionId, jobData);
    console.log('✅ Job saved to memory storage');
    return 'memory';
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload endpoint called - POST method confirmed');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const drawingType = formData.get('drawingType') as string;
    const priority = formData.get('priority') as string;

    if (!file) {
      console.error('❌ No file in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { 
          status: 400,
          headers: getCORSHeaders()
        }
      );
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      projectName: projectName || 'Untitled Project',
      drawingType: drawingType || 'General',
      priority: priority || 'medium'
    });

    // Generate conversion ID
    const conversionId = generateConversionId();
    
    // Create job data
    const jobData = {
      conversionId,
      filename: file.name,
      status: 'processing',
      progress: 5,
      message: 'File uploaded successfully, starting analysis...',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        projectName: projectName || 'Untitled Project',
        drawingType: drawingType || 'General',
        priority: priority || 'medium',
        uploadTimestamp: new Date().toISOString()
      },
      fileIntake: {
        filename: file.name,
        size: file.size,
        type: file.type,
        timestamp: new Date().toISOString()
      },
      globalTimer: {
        startTime: Date.now(),
        currentStage: 'File Intake',
        stageTimestamps: {
          'File Intake': Date.now()
        }
      }
    };

    // Try to save job (with fallback)
    const storageType = await saveJobToStorage(conversionId, jobData);

    // Start background processing (mock)
    processInBackground(conversionId, file, storageType).catch(error => {
      console.error('Background processing error:', error);
    });

    // Return immediate success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully and analysis started',
      conversionId,
      filename: file.name,
      size: file.size,
      type: file.type,
      status: 'processing',
      progress: 5,
      storageType,
      timestamp: new Date().toISOString(),
      statusUrl: `/api/status/${conversionId}?filename=${encodeURIComponent(file.name)}`,
      warning: storageType === 'memory' ? 'Using temporary storage - job may not persist between sessions' : null
    }, {
      status: 200,
      headers: getCORSHeaders()
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
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

// Mock background processing
async function processInBackground(conversionId: string, file: File, storageType: string) {
  try {
    console.log(`🔧 Starting background processing for ${conversionId}`);
    
    // Simulate processing stages
    const stages = [
      { progress: 10, stage: 'CAD Parser Layer', message: 'Parsing CAD file structure...', delay: 2000 },
      { progress: 30, stage: 'Entity Recognition', message: 'Identifying drawing elements...', delay: 3000 },
      { progress: 50, stage: 'Relationship Engine', message: 'Building connectivity graph...', delay: 2500 },
      { progress: 70, stage: 'QA Validation', message: 'Validating engineering logic...', delay: 2000 },
      { progress: 85, stage: 'Report Builder', message: 'Generating analysis report...', delay: 1500 },
      { progress: 100, stage: 'Complete', message: 'Analysis completed successfully', delay: 500 }
    ];

    for (const stageInfo of stages) {
      await new Promise(resolve => setTimeout(resolve, stageInfo.delay));
      
      const updatedJob = {
        conversionId,
        filename: file.name,
        status: stageInfo.progress === 100 ? 'completed' : 'processing',
        progress: stageInfo.progress,
        message: `[${stageInfo.stage}] ${stageInfo.message}`,
        updatedAt: new Date(),
        globalTimer: {
          startTime: Date.now() - (stages.indexOf(stageInfo) + 1) * 1000,
          currentStage: stageInfo.stage,
          stageTimestamps: {} // Would track real timestamps
        }
      };

      // Update job in storage
      if (storageType === 'mongodb') {
        try {
          const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
          await mongoJobStorage.setJob(conversionId, updatedJob);
        } catch (error) {
          console.error('Failed to update MongoDB job:', error);
          mockJobStorage.set(conversionId, updatedJob);
        }
      } else {
        mockJobStorage.set(conversionId, updatedJob);
      }

      console.log(`📊 [${stageInfo.progress}%] ${stageInfo.stage} - ${stageInfo.message}`);
    }

    console.log(`✅ Background processing completed for ${conversionId}`);
    
  } catch (error) {
    console.error(`❌ Background processing failed for ${conversionId}:`, error);
    
    // Mark job as failed
    const failedJob = {
      conversionId,
      filename: file.name,
      status: 'failed',
      progress: 0,
      message: 'Processing failed',
      error: error.message,
      updatedAt: new Date()
    };
    
    if (storageType === 'mongodb') {
      try {
        const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
        await mongoJobStorage.setJob(conversionId, failedJob);
      } catch (e) {
        mockJobStorage.set(conversionId, failedJob);
      }
    } else {
      mockJobStorage.set(conversionId, failedJob);
    }
  }
}