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

// Import shared fallback storage
import { fallbackJobStorage } from '@/lib/fallback-job-storage';

async function saveJobToStorage(conversionId: string, jobData: any) {
  try {
    // Try MongoDB first (will fail if unavailable)
    const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
    await mongoJobStorage.setJob(conversionId, jobData);
    console.log('✅ Job saved to MongoDB');
    return 'mongodb';
  } catch (error: any) {
    console.warn('⚠️ MongoDB unavailable, using shared fallback storage:', error.message);
    // Fallback to shared memory storage
    await fallbackJobStorage.setJob(conversionId, jobData);
    console.log('✅ Job saved to shared fallback storage');
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
      status: 'processing' as 'processing' | 'completed' | 'failed',
      progress: 5,
      message: 'File uploaded successfully, starting analysis...',
      startTime: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        projectName: projectName || 'Untitled Project',
        drawingType: drawingType || 'General',
        priority: priority || 'medium',
        uploadTimestamp: new Date().toISOString()
      },
      fileIntake: {
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        checksum: `${Date.now()}-${file.size}`, // Simple checksum for now
        validationWarnings: []
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

// Real OCR + AI analysis processing
async function processInBackground(conversionId: string, file: File, storageType: string) {
  try {
    console.log(`🔧 Starting real OCR + AI analysis for ${conversionId}`);
    
    // Save the uploaded file to disk for processing
    const uploadDir = 'uploads';
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, `${conversionId}_${file.name}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);
    
    console.log(`💾 File saved to ${filePath} for processing`);
    
    // Update job status to indicate OCR processing started
    await updateJobProgress(conversionId, storageType, {
      progress: 10,
      stage: 'OCR Processing',
      message: 'Starting OCR text extraction...',
      status: 'processing'
    });
    
    // Initialize the real OCR + AI analysis service
    const { OCRAIAnalysisService } = await import('@/lib/ocr-ai-analysis');
    const analysisService = new OCRAIAnalysisService();
    
    // Update job status to indicate AI analysis started
    await updateJobProgress(conversionId, storageType, {
      progress: 50,
      stage: 'AI Analysis',
      message: 'Sending data to ChatGPT for analysis and structuring...',
      status: 'processing'
    });
    
    // Perform real analysis using OCR + ChatGPT
    const analysisResult = await analysisService.analyzeDocument(filePath, file.name, conversionId);
    
    // Update job status to indicate data storage phase
    await updateJobProgress(conversionId, storageType, {
      progress: 85,
      stage: 'Data Storage',
      message: 'Storing structured data in MongoDB...',
      status: 'processing'
    });
    
    // Complete the job with the analysis results
    const completedJob = {
      conversionId,
      filename: file.name,
      status: 'completed' as 'processing' | 'completed' | 'failed',
      progress: 100,
      message: 'Analysis completed successfully',
      startTime: Date.now(),
      updatedAt: new Date(),
      result: analysisResult, // Store the ChatGPT analysis results
      globalTimer: {
        startTime: Date.now() - analysisResult.processingTime * 1000,
        currentStage: 'Complete',
        stageTimestamps: {
          'File Intake': Date.now() - analysisResult.processingTime * 1000,
          'OCR Processing': Date.now() - (analysisResult.processingTime * 1000 * 0.8),
          'AI Analysis': Date.now() - (analysisResult.processingTime * 1000 * 0.4),
          'Data Storage': Date.now() - (analysisResult.processingTime * 1000 * 0.1),
          'Complete': Date.now()
        }
      }
    };
    
    // Store the completed job with results
    if (storageType === 'mongodb') {
      try {
        const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
        await mongoJobStorage.setJob(conversionId, completedJob);
        console.log(`💾 Analysis results stored in MongoDB for ${conversionId}`);
      } catch (error) {
        console.error('Failed to store in MongoDB, using fallback:', error);
        await fallbackJobStorage.setJob(conversionId, completedJob);
      }
    } else {
      await fallbackJobStorage.setJob(conversionId, completedJob);
      console.log(`💾 Analysis results stored in fallback storage for ${conversionId}`);
    }
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up temporary file: ${filePath}`);
    } catch (cleanupError) {
      console.warn(`⚠️ Could not clean up file ${filePath}:`, cleanupError);
    }

    console.log(`✅ Real OCR + AI processing completed for ${conversionId}`);
    console.log(`📊 Results: ${analysisResult.elements.equipment.length} equipment, ${analysisResult.elements.instrumentation.length} instruments, ${analysisResult.elements.piping.length} piping systems`);
    
  } catch (error) {
    console.error(`❌ OCR + AI processing failed for ${conversionId}:`, error);
    
    // Mark job as failed
    const failedJob = {
      conversionId,
      filename: file.name,
      status: 'failed' as 'processing' | 'completed' | 'failed',
      progress: 0,
      message: 'OCR + AI analysis failed',
      startTime: Date.now(),
      error: (error as Error).message,
      updatedAt: new Date()
    };
    
    if (storageType === 'mongodb') {
      try {
        const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
        await mongoJobStorage.setJob(conversionId, failedJob);
      } catch (e) {
        await fallbackJobStorage.setJob(conversionId, failedJob);
      }
    } else {
      await fallbackJobStorage.setJob(conversionId, failedJob);
    }
  }
}

// Helper function to update job progress
async function updateJobProgress(conversionId: string, storageType: string, update: {
  progress: number;
  stage: string;
  message: string;
  status: 'processing' | 'completed' | 'failed';
}) {
  const updatedJob = {
    conversionId,
    status: update.status,
    progress: update.progress,
    message: `[${update.stage}] ${update.message}`,
    startTime: Date.now(),
    updatedAt: new Date(),
    globalTimer: {
      startTime: Date.now(),
      currentStage: update.stage,
      stageTimestamps: {} // Real timestamps would be tracked here
    }
  };

  if (storageType === 'mongodb') {
    try {
      const { mongoJobStorage } = await import('@/lib/mongodb-job-storage');
      await mongoJobStorage.setJob(conversionId, updatedJob);
    } catch (error) {
      await fallbackJobStorage.setJob(conversionId, updatedJob);
    }
  } else {
    await fallbackJobStorage.setJob(conversionId, updatedJob);
  }

  console.log(`📊 [${update.progress}%] ${update.stage} - ${update.message}`);
}
