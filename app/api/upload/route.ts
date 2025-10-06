import { NextRequest, NextResponse } from 'next/server';
import { OCRAIAnalysisService } from '@/lib/ocr-ai-analysis';
import { jobStorage, ProcessingJob } from '@/lib/job-storage';
import * as fs from 'fs';
import * as path from 'path';

const ocrAIAnalysisService = new OCRAIAnalysisService();

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

    // Validate file type (temporarily allowing PDF for demo)
    const allowedExtensions = ['.dwg', '.dxf', '.pdf'];
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileExtension}. Supported types: DWG, DXF, PDF (demo)` },
        { status: 400 }
      );
    }

    // Generate a unique conversion ID
    const conversionId = `conversion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the uploaded file
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, `${conversionId}_${file.name}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);
    
    console.log('File upload received:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      projectName,
      drawingType,
      priority,
      conversionId,
      savedPath: filePath
    });

    // Initialize processing job status
    const initialJob: ProcessingJob = {
      status: 'processing',
      progress: 0,
      message: 'Initializing CAD analysis...',
      filename: file.name,
      startTime: Date.now()
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
    // Update progress: Starting analysis
    updateJobProgress(conversionId, 5, 'Initializing OCR + AI analysis...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateJobProgress(conversionId, 15, 'Converting document to images...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateJobProgress(conversionId, 30, 'Performing OCR text extraction...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    updateJobProgress(conversionId, 60, 'Sending to OpenAI for intelligent analysis...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateJobProgress(conversionId, 85, 'Processing AI response and structuring data...');
    
    // Perform actual OCR + AI analysis
    const analysisResult = await ocrAIAnalysisService.analyzeDocument(filePath, filename, conversionId);
    
    // Update progress: Processing complete
    updateJobProgress(conversionId, 100, 'Analysis completed successfully', analysisResult);
    
    console.log(`✅ Analysis completed for ${filename} with ${analysisResult.confidence * 100}% confidence`);
    
  } catch (error) {
    console.error(`❌ Analysis failed for ${filename}:`, error);
    throw error;
  }
}

function updateJobProgress(conversionId: string, progress: number, message: string, result?: any) {
  const job = jobStorage.getJob(conversionId);
  if (job) {
    jobStorage.setJob(conversionId, {
      ...job,
      progress,
      message,
      status: progress === 100 ? 'completed' : 'processing',
      result: result || job.result
    });
  }
}

// Export jobStorage for use in status API
export { jobStorage };

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
