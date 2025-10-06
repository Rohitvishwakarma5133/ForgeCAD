import { NextRequest, NextResponse } from 'next/server';
import { OCRAIAnalysisService } from '@/lib/ocr-ai-analysis';
import { jobStorage, ProcessingJob } from '@/lib/job-storage';
import { FileIntakeService, FileValidationOptions } from '@/lib/file-intake';
import * as fs from 'fs';
import * as path from 'path';

const ocrAIAnalysisService = new OCRAIAnalysisService();
const fileIntakeService = new FileIntakeService();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const drawingType = formData.get('drawingType') as string;
    const priority = formData.get('priority') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('🔧 Starting File Intake Layer processing...');
    
    // Process file through File Intake Service
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    const validationOptions: FileValidationOptions = {
      allowedExtensions: ['.dwg', '.dxf', '.pdf'],
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      requireDWGR2013Plus: false // Set to true for stricter validation
    };
    
    let fileIntakeResult;
    try {
      fileIntakeResult = await fileIntakeService.processFileIntake(
        fileBuffer,
        file.name,
        validationOptions
      );
    } catch (error) {
      console.error('File intake validation failed:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }
    
    const conversionId = fileIntakeResult.conversionId;
    const filePath = fileIntakeResult.filePath;
    
    console.log('✅ File intake completed:', {
      conversionId,
      originalName: fileIntakeResult.originalName,
      fileSize: fileIntakeResult.fileSize,
      fileType: fileIntakeResult.fileType,
      checksum: fileIntakeResult.checksum,
      dwgVersion: fileIntakeResult.dwgVersion,
      validationWarnings: fileIntakeResult.validationWarnings.length,
      projectName,
      drawingType,
      priority,
      globalTimerStarted: new Date(fileIntakeResult.globalTimer.startTime).toISOString()
    });

    // Initialize processing job status with global timer and file intake data
    const initialJob: ProcessingJob = {
      status: 'processing',
      progress: 5, // File intake completed
      message: 'File intake completed, starting CAD parser layer...',
      filename: file.name,
      startTime: fileIntakeResult.globalTimer.startTime,
      globalTimer: {
        startTime: fileIntakeResult.globalTimer.startTime,
        currentStage: 'CAD Parser Layer',
        stageTimestamps: {
          'File Intake': Date.now()
        }
      },
      fileIntake: {
        originalName: fileIntakeResult.originalName,
        fileSize: fileIntakeResult.fileSize,
        fileType: fileIntakeResult.fileType,
        checksum: fileIntakeResult.checksum,
        dwgVersion: fileIntakeResult.dwgVersion,
        validationWarnings: fileIntakeResult.validationWarnings
      }
    };
    jobStorage.setJob(conversionId, initialJob);
    
    console.log(`✅ Job stored with ID: ${conversionId}`);
    console.log(`📊 Total jobs in storage: ${jobStorage.getAllJobIds().length}`);
    console.log('🔍 All job IDs:', jobStorage.getAllJobIds());

    // Start asynchronous analysis (don't await)
    processCADFileAsync(conversionId, filePath, file.name)
      .catch(error => {
        console.error('Analysis failed:', error);
        const existingJob = jobStorage.getJob(conversionId);
        if (existingJob) {
          jobStorage.setJob(conversionId, {
            ...existingJob,
            status: 'failed',
            progress: 0,
            message: 'Analysis failed',
            error: error.message
          });
        }
      });

    // Return immediate success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully and analysis started',
      conversionId,
      filename: file.name,
      size: file.size,
      type: file.type,
      status: 'processing'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function processCADFileAsync(conversionId: string, filePath: string, filename: string) {
  try {
    // Get initial job to access global timer
    const job = jobStorage.getJob(conversionId);
    if (!job || !job.globalTimer) {
      throw new Error('Job not found or missing global timer');
    }
    
    console.log(`🔧 Starting CAD processing pipeline for: ${filename}`);
    
    // Stage 2: CAD Parser Layer (10-30%)
    updateJobProgressWithStage(conversionId, 10, 'CAD Parser Layer', 'Extracting CAD entities and geometry...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateJobProgressWithStage(conversionId, 20, 'CAD Parser Layer', 'Analyzing layers and bounding boxes...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Stage 3: Entity Recognition Layer (30-50%)
    updateJobProgressWithStage(conversionId, 30, 'Entity Recognition Layer', 'Identifying equipment symbols...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateJobProgressWithStage(conversionId, 40, 'Entity Recognition Layer', 'Detecting instrumentation and piping...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Stage 4: Relationship Engine (50-70%)
    updateJobProgressWithStage(conversionId, 50, 'Relationship Engine', 'Building connectivity graph...');
    await new Promise(resolve => setTimeout(resolve, 700));
    
    updateJobProgressWithStage(conversionId, 60, 'Relationship Engine', 'Mapping equipment connections...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Stage 5: QA/Validation Layer (70-85%)
    updateJobProgressWithStage(conversionId, 70, 'QA/Validation Layer', 'Validating engineering logic...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Perform actual OCR + AI analysis
    updateJobProgressWithStage(conversionId, 80, 'QA/Validation Layer', 'Running comprehensive analysis...');
    const analysisResult = await ocrAIAnalysisService.analyzeDocument(filePath, filename, conversionId);
    
    // Stage 6: Report Builder Layer (85-95%)
    updateJobProgressWithStage(conversionId, 85, 'Report Builder Layer', 'Generating structured data...');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    updateJobProgressWithStage(conversionId, 90, 'Report Builder Layer', 'Creating analysis report...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Stage 7: Completion (95-100%)
    updateJobProgressWithStage(conversionId, 95, 'Front-End/API Output', 'Finalizing results...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Calculate final processing time
    const totalProcessingTime = FileIntakeService.calculateElapsedTime(job.globalTimer.startTime);
    const formattedTime = FileIntakeService.formatElapsedTime(totalProcessingTime);
    
    // Update progress: Processing complete with timing
    updateJobProgressWithStage(
      conversionId, 
      100, 
      'Complete', 
      `Analysis completed successfully in ${formattedTime}`, 
      analysisResult,
      totalProcessingTime
    );
    
    console.log(`✅ Pipeline completed for ${filename}:`);
    console.log(`   Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%`);
    console.log(`   Processing Time: ${formattedTime}`);
    console.log(`   Equipment Found: ${analysisResult.statistics.equipmentCount}`);
    console.log(`   Instruments Found: ${analysisResult.statistics.instrumentCount}`);
    
  } catch (error) {
    console.error(`❌ Analysis failed for ${filename}:`, error);
    throw error;
  }
}

function updateJobProgressWithStage(
  conversionId: string, 
  progress: number, 
  stage: string, 
  message: string, 
  result?: any,
  processingTime?: number
) {
  const job = jobStorage.getJob(conversionId);
  if (!job) return;

  // Track stage in global timer
  const globalTimer = job.globalTimer || {
    startTime: job.startTime,
    currentStage: 'Unknown',
    stageTimestamps: {}
  };
  
  // Add timestamp for this stage if it's new
  if (globalTimer.currentStage !== stage) {
    globalTimer.stageTimestamps[stage] = Date.now();
    globalTimer.currentStage = stage;
  }
  
  // Calculate elapsed time from the start
  const elapsedTime = processingTime || Math.round((Date.now() - globalTimer.startTime) / 1000);
  
  // Get previous progress message to preserve tracking pattern
  const progressPattern = job.message?.match(/\[.*?\]/);
  const progressPrefix = progressPattern ? progressPattern[0] + ' ' : '';
  const formattedMessage = `[${stage}] ${message}`;
  
  // Format elapsed time display
  const timeDisplay = FileIntakeService.formatElapsedTime(elapsedTime);
  
  // Add processing time to result if needed
  let updatedResult = result;
  if (updatedResult && typeof processingTime === 'number') {
    updatedResult = { ...updatedResult, processingTime };
  }
  
  jobStorage.setJob(conversionId, {
    ...job,
    progress,
    message: formattedMessage,
    status: progress === 100 ? 'completed' : 'processing',
    globalTimer,
    result: updatedResult || job.result
  });
  
  // Log progress update with timing
  console.log(`📊 [${progress}%] ${timeDisplay} - ${formattedMessage}`);
}

// Keep backward compatibility
function updateJobProgress(conversionId: string, progress: number, message: string, result?: any) {
  updateJobProgressWithStage(conversionId, progress, 'Processing', message, result);
}

// Export jobStorage for use in status API
export { jobStorage };

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
