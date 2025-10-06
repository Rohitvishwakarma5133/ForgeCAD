import { NextRequest, NextResponse } from 'next/server';
import { PDFReportGenerator } from '@/lib/pdf-report-generator';
import { jobStorage } from '@/lib/job-storage';

const pdfReportGenerator = new PDFReportGenerator();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conversionId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'dwg';

    console.log('Download request:', { conversionId, format });

    // Get the analysis results
    const job = jobStorage.getJob(conversionId);
    if (!job || job.status !== 'completed' || !job.result) {
      return NextResponse.json(
        { error: 'Analysis results not available or conversion not completed' },
        { status: 404 }
      );
    }

    const analysisResult = job.result;
    let content: Buffer;
    let mimeType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'dwg':
        content = await generateDWGContent(analysisResult, conversionId);
        mimeType = 'application/octet-stream';
        filename = `${analysisResult.filename.replace(/\.[^/.]+$/, '')}_analysis.dwg`;
        break;
      
      case 'dxf':
        content = await generateDXFContent(analysisResult, conversionId);
        mimeType = 'application/dxf';
        filename = `${analysisResult.filename.replace(/\.[^/.]+$/, '')}_analysis.dxf`;
        break;
      
      case 'pdf':
        content = await generatePDFContent(analysisResult, conversionId);
        mimeType = 'application/pdf';
        filename = `${analysisResult.filename.replace(/\.[^/.]+$/, '')}_analysis_report.pdf`;
        break;
      
      case 'csv':
        content = await generateCSVContent(analysisResult, conversionId);
        mimeType = 'text/csv';
        filename = `${analysisResult.filename.replace(/\.[^/.]+$/, '')}_equipment_data.csv`;
        break;
      
      case 'xlsx':
      case 'excel':
        content = await generateExcelContent(analysisResult, conversionId);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${analysisResult.filename.replace(/\.[^/.]+$/, '')}_comprehensive_analysis.xlsx`;
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Create response with appropriate headers
    return new NextResponse(content as any, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function generateDWGContent(analysisResult: any, conversionId: string): Promise<Buffer> {
  // Generate enhanced DXF content that can be saved as DWG-compatible
  const dxfContent = await generateDXFContentString(analysisResult, conversionId);
  return Buffer.from(dxfContent, 'utf-8');
}

async function generateDXFContent(analysisResult: any, conversionId: string): Promise<Buffer> {
  const dxfContent = await generateDXFContentString(analysisResult, conversionId);
  return Buffer.from(dxfContent, 'utf-8');
}

async function generateDXFContentString(analysisResult: any, _conversionId: string): Promise<string> {
  const equipment = analysisResult.elements?.equipment || [];
  const instrumentation = analysisResult.elements?.instrumentation || [];
  const piping = analysisResult.elements?.piping || [];
  const textElements = analysisResult.elements?.text || [];
  
  let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1021\n9\n$DWGCODEPAGE\n3\nANSI_1252\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n10\n`;
  
  // Add layers
  const layers = ['EQUIPMENT', 'INSTRUMENTATION', 'PIPING', 'TEXT', 'DIMENSIONS'];
  layers.forEach((layerName, index) => {
    dxf += `0\nLAYER\n2\n${layerName}\n70\n0\n62\n${index + 1}\n6\nCONTINUOUS\n`;
  });
  
  dxf += `0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  
  // Add equipment as circles
  equipment.forEach((eq: any) => {
    const radius = eq.type.includes('Tank') ? 30 : eq.type.includes('Vessel') ? 25 : 15;
    dxf += `0\nCIRCLE\n8\nEQUIPMENT\n10\n${eq.position.x}\n20\n${eq.position.y}\n30\n0.0\n40\n${radius}\n`;
    
    // Add equipment tag
    dxf += `0\nTEXT\n8\nEQUIPMENT\n10\n${eq.position.x - 10}\n20\n${eq.position.y - radius - 10}\n30\n0.0\n40\n8.0\n1\n${eq.tagNumber}\n`;
  });
  
  // Add instrumentation as smaller circles
  instrumentation.forEach((inst: any) => {
    dxf += `0\nCIRCLE\n8\nINSTRUMENTATION\n10\n${inst.position.x}\n20\n${inst.position.y}\n30\n0.0\n40\n8.0\n`;
    
    // Add instrument tag
    dxf += `0\nTEXT\n8\nINSTRUMENTATION\n10\n${inst.position.x - 8}\n20\n${inst.position.y - 15}\n30\n0.0\n40\n5.0\n1\n${inst.tagNumber}\n`;
  });
  
  // Add piping as polylines
  piping.forEach((pipe: any) => {
    if (pipe.path && pipe.path.length >= 2) {
      dxf += `0\nLWPOLYLINE\n8\nPIPING\n90\n${pipe.path.length}\n70\n0\n`;
      pipe.path.forEach((point: any) => {
        dxf += `10\n${point.x}\n20\n${point.y}\n`;
      });
      
      // Add pipe label at midpoint
      if (pipe.path.length >= 2) {
        const midX = (pipe.path[0].x + pipe.path[pipe.path.length - 1].x) / 2;
        const midY = (pipe.path[0].y + pipe.path[pipe.path.length - 1].y) / 2;
        dxf += `0\nTEXT\n8\nPIPING\n10\n${midX}\n20\n${midY + 5}\n30\n0.0\n40\n6.0\n1\n${pipe.lineNumber}\n`;
      }
    }
  });
  
  // Add text elements
  textElements.forEach((text: any) => {
    dxf += `0\nTEXT\n8\nTEXT\n10\n${text.position.x}\n20\n${text.position.y}\n30\n0.0\n40\n${text.size || 10}\n1\n${text.content}\n`;
  });
  
  // Add title block
  dxf += `0\nTEXT\n8\nTEXT\n10\n50\n20\n750\n30\n0.0\n40\n16\n1\nCADly AI Analysis - ${analysisResult.filename}\n`;
  dxf += `0\nTEXT\n8\nTEXT\n10\n50\n20\n720\n30\n0.0\n40\n12\n1\nGenerated: ${new Date().toLocaleDateString()}\n`;
  dxf += `0\nTEXT\n8\nTEXT\n10\n50\n20\n700\n30\n0.0\n40\n10\n1\nConfidence: ${(analysisResult.confidence * 100).toFixed(1)}%\n`;
  
  dxf += `0\nENDSEC\n0\nEOF`;
  
  return dxf;
}

async function generatePDFContent(analysisResult: any, _conversionId: string): Promise<Buffer> {
  console.log('📄 Generating comprehensive PDF report...');
  
  const reportOptions = {
    includeExecutiveSummary: true,
    includeDetailedAnalysis: true,
    includeRecommendations: true,
    includeAppendices: true,
    companyName: 'CADly AI Client',
    projectName: `Analysis of ${analysisResult.filename}`,
    reportAuthor: 'CADly AI Analysis Engine'
  };
  
  const pdfBuffer = await pdfReportGenerator.generateComprehensiveReport(analysisResult, reportOptions);
  return pdfBuffer;
}

async function generateCSVContent(analysisResult: any, conversionId: string): Promise<Buffer> {
  const equipment = analysisResult.elements?.equipment || [];
  const instrumentation = analysisResult.elements?.instrumentation || [];
  const piping = analysisResult.elements?.piping || [];
  
  let csv = `CADly AI + OCR Analysis Export\n`;
  csv += `Document: ${analysisResult.filename}\n`;
  csv += `Document Type: ${analysisResult.documentType}\n`;
  csv += `Analysis Method: OCR + OpenAI GPT-4o-mini\n`;
  csv += `Analysis Date: ${new Date().toISOString()}\n`;
  csv += `Overall Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%\n`;
  csv += `Processing Time: ${analysisResult.processingTime} seconds\n`;
  csv += `Conversion ID: ${conversionId}\n\n`;
  
  // Add OCR text summary
  if (analysisResult.ocrText) {
    csv += `OCR TEXT SUMMARY\n`;
    csv += `Total Characters Extracted: ${analysisResult.ocrText.length}\n`;
    csv += `Text Preview: ${analysisResult.ocrText.substring(0, 200).replace(/\n/g, ' ')}...\n\n`;
  }
  
  // Equipment section
  csv += `EQUIPMENT INVENTORY\n`;
  csv += `Tag Number,Type,Description,X Position,Y Position,Confidence,Safety Classification\n`;
  
  equipment.forEach((eq: any) => {
    csv += `${eq.tagNumber || 'N/A'},`;
    csv += `"${eq.type || 'Unknown'}",`;
    csv += `"${eq.description || 'No description'}",`;
    csv += `${eq.position?.x || 0},`;
    csv += `${eq.position?.y || 0},`;
    csv += `${((eq.confidence || 0) * 100).toFixed(1)}%,`;
    csv += `${eq.safetyClassification || 'N/A'}\n`;
  });
  
  csv += `\nINSTRUMENTATION DEVICES\n`;
  csv += `Tag Number,Type,Description,X Position,Y Position,SIL Rating,Range,Accuracy,Confidence\n`;
  
  instrumentation.forEach((inst: any) => {
    csv += `${inst.tagNumber || 'N/A'},`;
    csv += `"${inst.type || 'Unknown'}",`;
    csv += `"${inst.description || 'No description'}",`;
    csv += `${inst.position?.x || 0},`;
    csv += `${inst.position?.y || 0},`;
    csv += `${inst.SIL_Rating || 'N/A'},`;
    csv += `"${inst.range || 'N/A'}",`;
    csv += `"${inst.accuracy || 'N/A'}",`;
    csv += `${((inst.confidence || 0) * 100).toFixed(1)}%\n`;
  });
  
  csv += `\nPIPING SYSTEMS\n`;
  csv += `Line Number,Size,Material,Fluid Service,Operating Pressure,Operating Temperature,Insulation,Heat Tracing\n`;
  
  piping.forEach((pipe: any) => {
    csv += `${pipe.lineNumber || 'N/A'},`;
    csv += `"${pipe.size || 'N/A'}",`;
    csv += `"${pipe.material || 'N/A'}",`;
    csv += `"${pipe.fluidService || 'N/A'}",`;
    csv += `"${pipe.operatingPressure || 'N/A'}",`;
    csv += `"${pipe.operatingTemperature || 'N/A'}",`;
    csv += `"${pipe.insulationType || 'N/A'}",`;
    csv += `${pipe.heatTracing ? 'Yes' : 'No'}\n`;
  });
  
  // Analysis summary
  csv += `\nANALYSIS SUMMARY\n`;
  if (analysisResult.statistics) {
    csv += `Total Elements,${analysisResult.statistics.totalElements}\n`;
    csv += `Equipment Count,${analysisResult.statistics.equipmentCount}\n`;
    csv += `Instrumentation Count,${analysisResult.statistics.instrumentCount}\n`;
    csv += `Piping Systems,${analysisResult.statistics.pipeCount}\n`;
    csv += `Text Elements,${analysisResult.statistics.textCount}\n`;
    csv += `Dimensions,${analysisResult.statistics.dimensionCount}\n`;
    csv += `Drawing Layers,${analysisResult.statistics.layerCount}\n`;
  }
  
  if (analysisResult.qualityMetrics) {
    csv += `\nQUALITY METRICS\n`;
    csv += `High Confidence Items (>85%),${analysisResult.qualityMetrics.highConfidenceItems}\n`;
    csv += `Medium Confidence Items (70-85%),${analysisResult.qualityMetrics.mediumConfidenceItems}\n`;
    csv += `Low Confidence Items (<70%),${analysisResult.qualityMetrics.lowConfidenceItems}\n`;
    csv += `Items Needing Review,${analysisResult.qualityMetrics.itemsNeedingReview}\n`;
  }
  
  return Buffer.from(csv, 'utf-8');
}

async function generateExcelContent(analysisResult: any, conversionId: string): Promise<Buffer> {
  const XLSX = require('xlsx');
  
  const equipment = analysisResult.elements?.equipment || [];
  const instrumentation = analysisResult.elements?.instrumentation || [];
  const piping = analysisResult.elements?.piping || [];
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // 1. Summary Sheet
  const summaryData = [
    ['CADly AI + OCR Analysis Report'],
    [''],
    ['Document Information'],
    ['Filename', analysisResult.filename || 'Unknown'],
    ['Document Type', analysisResult.documentType || 'Engineering Drawing'],
    ['Analysis Method', 'OCR + OpenAI GPT-4o-mini'],
    ['Analysis Date', new Date().toISOString()],
    ['Conversion ID', conversionId],
    [''],
    ['Analysis Results'],
    ['Overall Confidence', `${(analysisResult.confidence * 100).toFixed(1)}%`],
    ['Processing Time', `${analysisResult.processingTime} seconds`],
    [''],
    ['Element Counts'],
    ['Total Elements', analysisResult.statistics?.totalElements || 0],
    ['Equipment Items', analysisResult.statistics?.equipmentCount || 0],
    ['Instrumentation Items', analysisResult.statistics?.instrumentCount || 0],
    ['Piping Systems', analysisResult.statistics?.pipeCount || 0],
    ['Text Elements', analysisResult.statistics?.textCount || 0],
    ['Dimensions', analysisResult.statistics?.dimensionCount || 0],
    [''],
    ['Quality Metrics'],
    ['High Confidence Items (>85%)', analysisResult.qualityMetrics?.highConfidenceItems || 0],
    ['Medium Confidence Items (70-85%)', analysisResult.qualityMetrics?.mediumConfidenceItems || 0],
    ['Low Confidence Items (<70%)', analysisResult.qualityMetrics?.lowConfidenceItems || 0],
    ['Items Needing Review', analysisResult.qualityMetrics?.itemsNeedingReview || 0]
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // 2. Equipment Sheet
  const equipmentData = [
    ['Equipment Inventory'],
    [''],
    ['Tag Number', 'Type', 'Description', 'X Position', 'Y Position', 'Confidence (%)', 'Safety Classification', 'Operating Temperature', 'Operating Pressure', 'Flow Rate']
  ];
  
  equipment.forEach((eq: any) => {
    equipmentData.push([
      eq.tagNumber || 'N/A',
      eq.type || 'Unknown',
      eq.description || 'No description',
      eq.position?.x || 0,
      eq.position?.y || 0,
      ((eq.confidence || 0) * 100).toFixed(1),
      eq.safetyClassification || 'N/A',
      eq.operatingConditions?.temperature || 'N/A',
      eq.operatingConditions?.pressure || 'N/A',
      eq.operatingConditions?.flowRate || 'N/A'
    ]);
  });
  
  const equipmentSheet = XLSX.utils.aoa_to_sheet(equipmentData);
  XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment');
  
  // 3. Instrumentation Sheet
  const instrumentationData = [
    ['Instrumentation Devices'],
    [''],
    ['Tag Number', 'Type', 'Description', 'X Position', 'Y Position', 'SIL Rating', 'Range', 'Accuracy', 'Control Loop', 'High Alarm', 'Low Alarm', 'Confidence (%)']
  ];
  
  instrumentation.forEach((inst: any) => {
    instrumentationData.push([
      inst.tagNumber || 'N/A',
      inst.type || 'Unknown',
      inst.description || 'No description',
      inst.position?.x || 0,
      inst.position?.y || 0,
      inst.SIL_Rating || 'N/A',
      inst.range || 'N/A',
      inst.accuracy || 'N/A',
      inst.controlLoop || 'N/A',
      inst.alarmLimits?.high || 'N/A',
      inst.alarmLimits?.low || 'N/A',
      ((inst.confidence || 0) * 100).toFixed(1)
    ]);
  });
  
  const instrumentationSheet = XLSX.utils.aoa_to_sheet(instrumentationData);
  XLSX.utils.book_append_sheet(workbook, instrumentationSheet, 'Instrumentation');
  
  // 4. Piping Systems Sheet
  const pipingData = [
    ['Piping Systems'],
    [''],
    ['Line Number', 'Size', 'Material', 'Fluid Service', 'Operating Pressure', 'Operating Temperature', 'Insulation Type', 'Heat Tracing', 'Path Points']
  ];
  
  piping.forEach((pipe: any) => {
    const pathPoints = pipe.path ? pipe.path.map((p: any) => `(${p.x},${p.y})`).join('; ') : 'N/A';
    pipingData.push([
      pipe.lineNumber || 'N/A',
      pipe.size || 'N/A',
      pipe.material || 'N/A',
      pipe.fluidService || 'N/A',
      pipe.operatingPressure || 'N/A',
      pipe.operatingTemperature || 'N/A',
      pipe.insulationType || 'N/A',
      pipe.heatTracing ? 'Yes' : 'No',
      pathPoints
    ]);
  });
  
  const pipingSheet = XLSX.utils.aoa_to_sheet(pipingData);
  XLSX.utils.book_append_sheet(workbook, pipingSheet, 'Piping Systems');
  
  // 5. OCR Text Sheet (if available)
  if (analysisResult.ocrText) {
    const ocrData = [
      ['OCR Extracted Text'],
      [''],
      ['Total Characters', analysisResult.ocrText.length],
      [''],
      ['Full Text Content'],
      [analysisResult.ocrText]
    ];
    
    const ocrSheet = XLSX.utils.aoa_to_sheet(ocrData);
    XLSX.utils.book_append_sheet(workbook, ocrSheet, 'OCR Text');
  }
  
  // 6. Process Analysis Sheet (if available)
  if (analysisResult.processAnalysis) {
    const processData = [
      ['Process Analysis'],
      [''],
      ['Process Units'],
      ...analysisResult.processAnalysis.processUnits.map((unit: string) => [unit]),
      [''],
      ['Utility Services'],
      ...analysisResult.processAnalysis.utilityServices.map((service: string) => [service]),
      [''],
      ['Safety Systems Identified'],
      ...analysisResult.processAnalysis.safetySystemsIdentified.map((system: string) => [system]),
      [''],
      ['Control Philosophy', analysisResult.processAnalysis.controlPhilosophy],
      [''],
      ['Major Equipment Types'],
      ...analysisResult.processAnalysis.majorEquipmentTypes.map((type: string) => [type]),
      [''],
      ['Fluid Types'],
      ...analysisResult.processAnalysis.fluidTypes.map((fluid: string) => [fluid])
    ];
    
    const processSheet = XLSX.utils.aoa_to_sheet(processData);
    XLSX.utils.book_append_sheet(workbook, processSheet, 'Process Analysis');
  }
  
  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}

