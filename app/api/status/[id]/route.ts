import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';

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
    console.log('Available jobs in storage:', jobStorage.getAllJobIds());
    console.log('Total jobs in storage:', jobStorage.getAllJobIds().length);

    // Get job status from the job storage
    const job = jobStorage.getJob(conversionId);
    
    if (!job) {
      console.error(`Job not found! ConversionId: ${conversionId}`);
      console.error('Available jobs:', jobStorage.getAllJobIds());
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Conversion job not found',
          conversionId,
          filename,
          debug: {
            requestedId: conversionId,
            availableIds: jobStorage.getAllJobIds(),
            totalJobs: jobStorage.getAllJobIds().length
          }
        },
        { status: 404 }
      );
    }

    // Return current job status
    if (job.status === 'processing') {
      return NextResponse.json({
        status: 'processing',
        progress: job.progress,
        message: job.message,
        conversionId,
        filename: job.filename
      });
    } else if (job.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        progress: 100,
        message: 'Analysis completed successfully',
        conversionId,
        filename: job.filename,
        result: {
          // Convert CADAnalysisResult to expected format
          documentType: job.result?.documentType || 'Engineering Drawing',
          confidence: job.result?.confidence || 0.85,
          equipmentCount: job.result?.statistics?.equipmentCount || 0,
          instrumentCount: job.result?.statistics?.instrumentCount || 0,
          pipeCount: job.result?.statistics?.pipeCount || 0,
          processingTime: job.result?.processingTime || 0,
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
          outputFormats: ['DWG', 'DXF', 'PDF', 'CSV'],
          downloadUrl: `/api/download/${conversionId}`
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
