import { NextRequest, NextResponse } from 'next/server';
import { mongoJobStorage as jobStorage } from '@/lib/mongodb-job-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conversionId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    console.log('Status check for conversion:', { conversionId, filename });
    const availableJobIds = await jobStorage.getAllJobIds();
    console.log('Available jobs in storage:', availableJobIds);
    console.log('Total jobs in storage:', availableJobIds.length);

    // Get job status from the job storage
    const job = await jobStorage.getJob(conversionId);
    
    if (!job) {
      console.error(`Job not found! ConversionId: ${conversionId}`);
      console.error('Available jobs:', availableJobIds);
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Conversion job not found',
          conversionId,
          filename,
          debug: {
            requestedId: conversionId,
            availableIds: availableJobIds,
            totalJobs: availableJobIds.length
          }
        },
        { status: 404 }
      );
    }

    // Return current job status with global timer info
    if (job.status === 'processing') {
      const elapsedTime = job.globalTimer ? 
        Math.round((Date.now() - job.globalTimer.startTime) / 1000) : 0;
      
      return NextResponse.json({
        status: 'processing',
        progress: job.progress,
        message: job.message,
        conversionId,
        filename: job.filename,
        processingTime: elapsedTime,
        currentStage: job.globalTimer?.currentStage || 'Processing',
        fileIntake: job.fileIntake,
        // Enhanced progress information
        progressInfo: {
          currentStage: job.globalTimer?.currentStage || 'Processing',
          stageProgress: job.progress,
          detailedStages: [
            { name: 'File Intake', progress: job.progress >= 5 ? 100 : 0, status: job.progress >= 5 ? 'completed' : 'pending' },
            { name: 'CAD Parser Layer', progress: job.progress >= 30 ? 100 : job.progress >= 10 ? Math.round(((job.progress - 10) / 20) * 100) : 0, status: job.progress >= 30 ? 'completed' : job.progress >= 10 ? 'active' : 'pending' },
            { name: 'Entity Recognition Layer', progress: job.progress >= 50 ? 100 : job.progress >= 30 ? Math.round(((job.progress - 30) / 20) * 100) : 0, status: job.progress >= 50 ? 'completed' : job.progress >= 30 ? 'active' : 'pending' },
            { name: 'Relationship Engine', progress: job.progress >= 70 ? 100 : job.progress >= 50 ? Math.round(((job.progress - 50) / 20) * 100) : 0, status: job.progress >= 70 ? 'completed' : job.progress >= 50 ? 'active' : 'pending' },
            { name: 'QA/Validation Layer', progress: job.progress >= 85 ? 100 : job.progress >= 70 ? Math.round(((job.progress - 70) / 15) * 100) : 0, status: job.progress >= 85 ? 'completed' : job.progress >= 70 ? 'active' : 'pending' },
            { name: 'Report Builder Layer', progress: job.progress >= 95 ? 100 : job.progress >= 85 ? Math.round(((job.progress - 85) / 10) * 100) : 0, status: job.progress >= 95 ? 'completed' : job.progress >= 85 ? 'active' : 'pending' },
            { name: 'Front-End/API Output', progress: job.progress >= 100 ? 100 : job.progress >= 95 ? Math.round(((job.progress - 95) / 5) * 100) : 0, status: job.progress >= 100 ? 'completed' : job.progress >= 95 ? 'active' : 'pending' }
          ],
          estimatedTimeRemaining: estimateRemainingTime(job.progress, elapsedTime),
          pipelineVisualization: '📥 → 🔧 → 🔍 → 🔗 → ✅ → 📊 → 🎯'
        }
      });
    } else if (job.status === 'completed') {
      const finalProcessingTime = job.globalTimer ? 
        Math.round((Date.now() - job.globalTimer.startTime) / 1000) : 
        job.result?.processingTime || 0;
        
      return NextResponse.json({
        status: 'completed',
        progress: 100,
        message: 'Analysis completed successfully',
        conversionId,
        filename: job.filename,
        processingTime: finalProcessingTime,
        currentStage: 'Complete',
        fileIntake: job.fileIntake,
        stageTimestamps: job.globalTimer?.stageTimestamps,
        result: {
          // Convert CADAnalysisResult to expected format
          documentType: job.result?.documentType || 'Engineering Drawing',
          confidence: job.result?.confidence || 0.85,
          equipmentCount: job.result?.statistics?.equipmentCount || 0,
          instrumentCount: job.result?.statistics?.instrumentCount || 0,
          pipeCount: job.result?.statistics?.pipeCount || 0,
          processingTime: finalProcessingTime, // Use the global timer result
          extractedElements: {
            equipment: job.result?.statistics?.equipmentCount || 0,
            instruments: job.result?.statistics?.instrumentCount || 0,
            piping: job.result?.statistics?.pipeCount || 0,
            text: job.result?.statistics?.textCount || 0
          },
          // Pass through the detailed analysis data
          equipment: job.result?.elements?.equipment || [],
          instrumentation: job.result?.elements?.instrumentation || [],
          piping: job.result?.elements?.piping || [],
          statistics: job.result?.statistics,
          qualityMetrics: job.result?.qualityMetrics,
          processAnalysis: job.result?.processAnalysis,
          outputFormats: ['DWG', 'DXF', 'PDF', 'CSV', 'JSON'],
          downloadUrl: `/api/download/${conversionId}`,
          // Enhanced progress information
          progressInfo: {
            currentStage: 'Complete',
            stageProgress: 100,
            detailedStages: [
              { name: 'File Intake', progress: 100, duration: calculateStageDuration(job.globalTimer?.stageTimestamps, 'File Intake') },
              { name: 'CAD Parser Layer', progress: 100, duration: calculateStageDuration(job.globalTimer?.stageTimestamps, 'CAD Parser Layer') },
              { name: 'Entity Recognition Layer', progress: 100, duration: calculateStageDuration(job.globalTimer?.stageTimestamps, 'Entity Recognition Layer') },
              { name: 'Relationship Engine', progress: 100, duration: calculateStageDuration(job.globalTimer?.stageTimestamps, 'Relationship Engine') },
              { name: 'QA/Validation Layer', progress: 100, duration: calculateStageDuration(job.globalTimer?.stageTimestamps, 'QA/Validation Layer') },
              { name: 'Report Builder Layer', progress: 100, duration: calculateStageDuration(job.globalTimer?.stageTimestamps, 'Report Builder Layer') }
            ]
          },
          // Confidence histogram data
          confidenceHistogram: generateConfidenceHistogram(job.result),
          // Debug and QA information
          debugInfo: {
            totalProcessingTime: finalProcessingTime,
            stageBreakdown: job.globalTimer?.stageTimestamps,
            fileIntakeInfo: job.fileIntake,
            jsonDownloadUrl: `/api/download/${conversionId}?format=json`
          }
        }
      });
    } else if (job.status === 'failed') {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Analysis failed',
          details: job.error || 'Unknown error occurred',
          conversionId,
          filename: job.filename
        },
        { status: 500 }
      );
    }

    // Fallback response
    return NextResponse.json(
      {
        status: 'error',
        error: 'Unknown job status',
        conversionId,
        filename
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to check conversion status',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate stage duration
function calculateStageDuration(stageTimestamps: Record<string, number> | undefined, stageName: string): number {
  if (!stageTimestamps || !stageTimestamps[stageName]) return 0;
  
  const stageNames = Object.keys(stageTimestamps);
  const currentIndex = stageNames.indexOf(stageName);
  
  if (currentIndex === -1) return 0;
  
  const startTime = stageTimestamps[stageName];
  const nextStageName = stageNames[currentIndex + 1];
  const endTime = nextStageName ? stageTimestamps[nextStageName] : Date.now();
  
  return Math.round((endTime - startTime) / 1000); // Convert to seconds
}

// Helper function to generate confidence histogram
function generateConfidenceHistogram(result: any): any {
  if (!result || !result.elements) {
    return {
      high: 0,
      medium: 0,
      low: 0,
      distribution: [],
      averageConfidence: 0
    };
  }
  
  const allItems = [
    ...(result.elements.equipment || []),
    ...(result.elements.instrumentation || [])
  ];
  
  if (allItems.length === 0) {
    return {
      high: 0,
      medium: 0,
      low: 0,
      distribution: [],
      averageConfidence: 0
    };
  }
  
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalConfidence = 0;
  
  const distribution: Array<{ range: string; count: number; percentage: number }> = [];
  const ranges = [
    { min: 0.9, max: 1.0, label: '90-100%' },
    { min: 0.8, max: 0.89, label: '80-89%' },
    { min: 0.7, max: 0.79, label: '70-79%' },
    { min: 0.6, max: 0.69, label: '60-69%' },
    { min: 0.5, max: 0.59, label: '50-59%' },
    { min: 0.0, max: 0.49, label: '<50%' }
  ];
  
  // Initialize range counters
  const rangeCounts = ranges.map(() => 0);
  
  for (const item of allItems) {
    const confidence = item.confidence || 0;
    totalConfidence += confidence;
    
    // Categorize by confidence level
    if (confidence >= 0.85) highCount++;
    else if (confidence >= 0.7) mediumCount++;
    else lowCount++;
    
    // Find appropriate range
    for (let i = 0; i < ranges.length; i++) {
      if (confidence >= ranges[i].min && confidence <= ranges[i].max) {
        rangeCounts[i]++;
        break;
      }
    }
  }
  
  // Build distribution array
  for (let i = 0; i < ranges.length; i++) {
    distribution.push({
      range: ranges[i].label,
      count: rangeCounts[i],
      percentage: Math.round((rangeCounts[i] / allItems.length) * 100)
    });
  }
  
  return {
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    distribution,
    averageConfidence: Math.round((totalConfidence / allItems.length) * 100) / 100
  };
}

// Helper function to estimate remaining time
function estimateRemainingTime(currentProgress: number, elapsedTime: number): number {
  if (currentProgress <= 0 || currentProgress >= 100) return 0;
  
  // Calculate estimated total time based on current progress
  const estimatedTotalTime = (elapsedTime / currentProgress) * 100;
  const remainingTime = estimatedTotalTime - elapsedTime;
  
  return Math.max(0, Math.round(remainingTime));
}
