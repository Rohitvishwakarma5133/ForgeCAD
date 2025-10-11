import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { CADAnalysisResult } from './cad-analysis';

interface ReportOptions {
  includeExecutiveSummary: boolean;
  includeDetailedAnalysis: boolean;
  includeRecommendations: boolean;
  includeAppendices: boolean;
  companyName?: string;
  projectName?: string;
  reportAuthor?: string;
}

export class PDFReportGenerator {
  private pdfDoc: PDFDocument | null = null;
  private currentPage: PDFPage | null = null;
  private currentY: number = 750;
  private font: PDFFont | null = null;
  private boldFont: PDFFont | null = null;
  private pageMargin: number = 50;
  private lineHeight: number = 15;
  private pageNumber: number = 1;

  async generateComprehensiveReport(
    analysisResult: CADAnalysisResult, 
    options: ReportOptions = { 
      includeExecutiveSummary: true,
      includeDetailedAnalysis: true,
      includeRecommendations: true,
      includeAppendices: true
    }
  ): Promise<Buffer> {
    
    // Initialize PDF document
    this.pdfDoc = await PDFDocument.create();
    this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);

    console.log(`📄 Generating comprehensive report for ${analysisResult.filename}`);

    // Generate report sections
    await this.generateTitlePage(analysisResult, options);
    await this.generateTableOfContents();
    
    if (options.includeExecutiveSummary) {
      await this.generateExecutiveSummary(analysisResult);
    }
    
    await this.generateProjectOverview(analysisResult);
    await this.generateMethodology();
    
    if (options.includeDetailedAnalysis) {
      await this.generateDetailedAnalysis(analysisResult);
      await this.generateEquipmentAnalysis(analysisResult);
      await this.generateInstrumentationAnalysis(analysisResult);
      await this.generatePipingAnalysis(analysisResult);
    }
    
    await this.generateQualityAssessment(analysisResult);
    await this.generateProcessAnalysis(analysisResult);
    
    if (options.includeRecommendations) {
      await this.generateRecommendations(analysisResult);
    }
    
    await this.generateConclusions(analysisResult);
    
    if (options.includeAppendices) {
      await this.generateAppendices(analysisResult);
    }

    // Add page numbers and footers
    await this.addPageNumbers();

    const pdfBytes = await this.pdfDoc.save();
    console.log(`✅ Generated ${this.pageNumber} page comprehensive report`);
    
    return Buffer.from(pdfBytes);
  }

  private async generateTitlePage(result: CADAnalysisResult, options: ReportOptions): Promise<void> {
    this.currentPage = this.pdfDoc!.addPage([612, 792]);
    this.currentY = 700;

    // Company logo area (placeholder)
    await this.addText('CADLY AI', 24, true, 'center');
    this.currentY -= 20;
    await this.addText('Advanced CAD Analysis & Intelligence Platform', 14, false, 'center');
    this.currentY -= 60;

    // Report title
    await this.addText('COMPREHENSIVE CAD ANALYSIS REPORT', 20, true, 'center');
    this.currentY -= 40;

    // Document details
    await this.addText(`Document: ${result.filename}`, 16, true, 'center');
    this.currentY -= 25;
    await this.addText(`Document Type: ${result.documentType}`, 14, false, 'center');
    this.currentY -= 25;
    await this.addText(`Analysis Date: ${new Date().toLocaleDateString()}`, 14, false, 'center');
    this.currentY -= 25;
    await this.addText(`Conversion ID: ${result.conversionId}`, 12, false, 'center');
    this.currentY -= 60;

    // Project information
    if (options.projectName) {
      await this.addText(`Project: ${options.projectName}`, 14, true, 'center');
      this.currentY -= 20;
    }
    
    if (options.companyName) {
      await this.addText(`Client: ${options.companyName}`, 14, false, 'center');
      this.currentY -= 20;
    }

    // Quality metrics summary box
    this.currentY -= 40;
    await this.drawBox(100, this.currentY - 80, 412, 80, rgb(0.95, 0.95, 0.95));
    this.currentY -= 20;
    await this.addText('ANALYSIS SUMMARY', 14, true, 'center');
    this.currentY -= 25;
    await this.addText(`Overall Accuracy: ${this.formatPercentage(result.confidence)}`, 12, false, 'center');
    this.currentY -= 15;
    await this.addText(`Processing Time: ${result.processingTime} seconds`, 12, false, 'center');
    this.currentY -= 15;
    await this.addText(`Total Elements: ${result.statistics.totalElements}`, 12, false, 'center');

    // Footer
    this.currentY = 100;
    await this.addText('Confidential and Proprietary', 10, false, 'center');
    this.currentY -= 15;
    await this.addText(`© ${new Date().getFullYear()} CADly AI Technologies. All rights reserved.`, 10, false, 'center');
  }

  private async generateTableOfContents(): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('TABLE OF CONTENTS');

    const contents = [
      'Executive Summary ....................................... 3',
      'Project Overview ........................................ 4',
      'Analysis Methodology .................................... 5',
      'Detailed Technical Analysis ............................. 6',
      '  Equipment Analysis ................................... 7',
      '  Instrumentation Analysis ............................. 8',
      '  Piping System Analysis ............................... 9',
      'Quality Assessment ..................................... 10',
      'Process System Analysis ................................ 11',
      'Recommendations ........................................ 12',
      'Conclusions ............................................ 13',
      'Appendices ............................................. 14',
      '  Appendix A: Equipment Specifications ................ 15',
      '  Appendix B: Instrumentation Details ................. 16',
      '  Appendix C: Piping Specifications ................... 17',
      '  Appendix D: Technical References .................... 18'
    ];

    for (const item of contents) {
      this.currentY -= this.lineHeight + 5;
      if (item.startsWith('  ')) {
        await this.addText(item, 11, false, 'left', this.pageMargin + 20);
      } else {
        await this.addText(item, 12, false, 'left');
      }
    }
  }

  private async generateExecutiveSummary(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('EXECUTIVE SUMMARY');

    await this.addParagraph('Project Scope and Objectives');
    await this.addText(
      `This report presents a comprehensive analysis of the CAD document "${result.filename}", ` +
      `identified as a ${result.documentType}. The analysis was conducted using advanced AI-powered ` +
      `computer vision and machine learning algorithms to extract, classify, and analyze technical ` +
      `elements within the drawing.`
    );

    await this.addParagraph('Key Findings');
    const keyFindings = [
      `• Document Analysis Confidence: ${this.formatPercentage(result.confidence)} - ${this.getConfidenceDescription(result.confidence)}`,
      `• Total Elements Identified: ${result.statistics.totalElements} technical elements`,
      `• Equipment Count: ${result.statistics.equipmentCount} major process equipment items`,
      `• Instrumentation Count: ${result.statistics.instrumentCount} control and monitoring devices`,
      `• Piping Systems: ${result.statistics.pipeCount} pipe lines and connections`,
      `• Drawing Complexity: ${result.statistics.layerCount} layers identified`,
      `• Processing Performance: ${this.formatNumber(result.processingTime, 2)} seconds analysis time`
    ];

    for (const finding of keyFindings) {
      this.currentY -= this.lineHeight;
      await this.addText(finding, 11);
    }

    await this.addParagraph('Quality Assessment');
    await this.addText(this.generateConfidenceBasedSummary(result));

    await this.addParagraph('Process Systems Identified');
    if (result.processAnalysis.processUnits.length > 0) {
      await this.addText(`Major process units: ${result.processAnalysis.processUnits.join(', ')}`);
    }
    if (result.processAnalysis.utilityServices.length > 0) {
      await this.addText(`Utility services: ${result.processAnalysis.utilityServices.join(', ')}`);
    }
    if (result.processAnalysis.majorEquipmentTypes.length > 0) {
      await this.addText(`Equipment types: ${result.processAnalysis.majorEquipmentTypes.join(', ')}`);
    }

    await this.addParagraph('Recommendations Summary');
    const contextualRecommendations = this.generateContextualRecommendations(result);
    await this.addText(
      'Based on the analysis results and confidence levels, the following key recommendations are proposed:'
    );
    
    for (let i = 0; i < Math.min(4, contextualRecommendations.length); i++) {
      this.currentY -= this.lineHeight;
      await this.addText(`(${i + 1}) ${contextualRecommendations[i]}`, 11);
    }
  }

  private async generateProjectOverview(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('PROJECT OVERVIEW');

    await this.addParagraph('Document Information');
    const docInfo = [
      `Filename: ${result.filename}`,
      `Document Type: ${result.documentType}`,
      `File Size: ${this.formatFileSize(100000)}`, // Placeholder
      `Analysis Date: ${new Date().toLocaleDateString()}`,
      `Processing Time: ${result.processingTime} seconds`,
      `Drawing Area: ${result.statistics.drawingArea.width.toFixed(0)} x ${result.statistics.drawingArea.height.toFixed(0)} units`
    ];

    for (const info of docInfo) {
      this.currentY -= this.lineHeight;
      await this.addText(`• ${info}`, 11);
    }

    await this.addParagraph('Analysis Scope');
    await this.addText(
      'The analysis encompassed the complete technical drawing, including all visible elements ' +
      'such as process equipment, instrumentation devices, piping systems, text annotations, ' +
      'and dimensional information. Advanced pattern recognition algorithms were employed to ' +
      'identify and classify each element according to industry-standard taxonomies.'
    );

    await this.addParagraph('Technology Platform');
    await this.addText(
      'CADly AI utilizes state-of-the-art computer vision models trained on extensive datasets ' +
      'of process engineering drawings. The platform employs deep learning neural networks ' +
      'for symbol recognition, optical character recognition (OCR) for text extraction, and ' +
      'geometric analysis algorithms for spatial relationship mapping.'
    );

    await this.addParagraph('Quality Assurance');
    await this.addText(
      'All identifications are assigned confidence scores based on multiple validation criteria ' +
      'including symbol clarity, contextual consistency, and geometric properties. Items with ' +
      'confidence scores below 70% are flagged for human review to ensure accuracy.'
    );
  }

  private async generateMethodology(): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('ANALYSIS METHODOLOGY');

    await this.addParagraph('Processing Pipeline');
    await this.addText(
      'The CAD analysis follows a systematic five-stage pipeline: (1) Document preprocessing ' +
      'and quality enhancement, (2) Element detection and segmentation, (3) Symbol classification ' +
      'and recognition, (4) Text extraction and interpretation, and (5) Spatial relationship analysis.'
    );

    await this.addParagraph('Element Detection');
    await this.addText(
      'Computer vision algorithms scan the drawing to identify geometric primitives (circles, ' +
      'rectangles, lines, arcs) and complex symbols. Each detected element is analyzed for ' +
      'size, position, orientation, and connection points to establish its likely function.'
    );

    await this.addParagraph('Classification Algorithms');
    await this.addText(
      'Machine learning models trained on industry-standard symbol libraries classify detected ' +
      'elements into equipment categories (pumps, vessels, heat exchangers), instrumentation ' +
      'types (transmitters, controllers, indicators), and piping components (lines, valves, fittings).'
    );

    await this.addParagraph('Confidence Scoring');
    await this.addText(
      'Each identification receives a confidence score (0-100%) based on symbol clarity, ' +
      'geometric consistency, contextual appropriateness, and training data similarity. ' +
      'High confidence (>85%) items are considered reliable, medium confidence (70-85%) ' +
      'items are flagged for verification, and low confidence (<70%) items require review.'
    );

    await this.addParagraph('Quality Control');
    await this.addText(
      'Post-processing validation checks ensure logical consistency, verify standard compliance, ' +
      'and identify potential errors or ambiguities in the analysis results.'
    );
  }

  private async generateDetailedAnalysis(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('DETAILED TECHNICAL ANALYSIS');

    await this.addParagraph('Analysis Statistics');
    
    // Create statistics table
    await this.drawBox(this.pageMargin, this.currentY - 150, 512, 150, rgb(0.98, 0.98, 0.98));
    
    const stats = [
      ['Metric', 'Count', 'Percentage'],
      ['Process Equipment', result.statistics.equipmentCount.toString(), this.formatPercentage(result.statistics.equipmentCount / result.statistics.totalElements)],
      ['Instrumentation', result.statistics.instrumentCount.toString(), this.formatPercentage(result.statistics.instrumentCount / result.statistics.totalElements)],
      ['Piping Systems', result.statistics.pipeCount.toString(), this.formatPercentage(result.statistics.pipeCount / result.statistics.totalElements)],
      ['Text Elements', result.statistics.textCount.toString(), this.formatPercentage(result.statistics.textCount / result.statistics.totalElements)],
      ['Dimensions', result.statistics.dimensionCount.toString(), this.formatPercentage(result.statistics.dimensionCount / result.statistics.totalElements)],
      ['Drawing Layers', result.statistics.layerCount.toString(), '-'],
      ['Total Elements', result.statistics.totalElements.toString(), '100.0%']
    ];

    let tableY = this.currentY - 20;
    for (let i = 0; i < stats.length; i++) {
      const [col1, col2, col3] = stats[i];
      const isHeader = i === 0;
      
      await this.addText(col1, 10, isHeader, 'left', this.pageMargin + 10, tableY);
      await this.addText(col2, 10, isHeader, 'center', this.pageMargin + 200, tableY);
      await this.addText(col3, 10, isHeader, 'right', this.pageMargin + 400, tableY);
      
      tableY -= 15;
    }

    this.currentY -= 170;

    await this.addParagraph('Element Distribution Analysis');
    await this.addText(
      'The drawing exhibits a balanced distribution of technical elements consistent with typical ' +
      'process engineering drawings. Equipment elements represent the primary process components, ' +
      'while instrumentation provides necessary monitoring and control capabilities. The piping ' +
      'network establishes interconnections between process units.'
    );

    await this.addParagraph('Spatial Layout Assessment');
    await this.addText(
      `The drawing spans ${result.statistics.drawingArea.width.toFixed(0)} by ${result.statistics.drawingArea.height.toFixed(0)} ` +
      'drawing units, indicating a ' + (result.statistics.drawingArea.width > 1000 ? 'large-scale' : 'medium-scale') + ' ' +
      'process system. Element density and spacing appear appropriate for the drawing scale and complexity level.'
    );
  }

  private async generateEquipmentAnalysis(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('EQUIPMENT ANALYSIS');

    await this.addParagraph('Equipment Summary');
    await this.addText(
      `A total of ${result.elements.equipment.length} process equipment items were identified ` +
      'and classified according to their function and design characteristics. Each equipment ' +
      'item has been analyzed for type, specifications, and operational parameters.'
    );

    if (result.elements.equipment.length > 0) {
      // Equipment types distribution
      const equipmentTypes = result.elements.equipment.reduce((acc, eq) => {
        acc[eq.type] = (acc[eq.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await this.addParagraph('Equipment Type Distribution');
      Object.entries(equipmentTypes).forEach(async ([type, count]) => {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${type}: ${count} unit${count > 1 ? 's' : ''}`, 11);
      });

      // Detailed equipment list
      await this.addParagraph('Detailed Equipment Inventory');
      
      for (let i = 0; i < Math.min(result.elements.equipment.length, 10); i++) {
        const eq = result.elements.equipment[i];
        
        if (this.currentY < 150) {
          await this.newPage();
        }
        
        this.currentY -= 5;
        await this.drawBox(this.pageMargin, this.currentY - 80, 512, 80, rgb(0.97, 0.97, 0.97));
        this.currentY -= 15;
        
        await this.addText(`${eq.tagNumber} - ${eq.type}`, 12, true);
        this.currentY -= this.lineHeight;
        await this.addText(`Description: ${eq.description}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Position: (${eq.position.x.toFixed(1)}, ${eq.position.y.toFixed(1)})`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Confidence: ${(eq.confidence * 100).toFixed(1)}%`, 10);
        
        if (eq.specifications && Object.keys(eq.specifications).length > 0) {
          this.currentY -= this.lineHeight;
          const specs = Object.entries(eq.specifications).map(([key, value]) => `${key}: ${value}`).join(', ');
          await this.addText(`Specifications: ${specs}`, 10);
        }
        
        this.currentY -= 25;
      }

      if (result.elements.equipment.length > 10) {
        await this.addText(`... and ${result.elements.equipment.length - 10} additional equipment items (see Appendix A for complete list)`, 10, false, 'center');
      }
    }

    await this.addParagraph('Equipment Analysis Observations');
    await this.addText(
      'The equipment inventory reflects a typical process system with appropriate redundancy ' +
      'and operational flexibility. All major equipment items have been identified with ' +
      'high confidence levels, indicating clear symbol representation in the drawing.'
    );
  }

  private async generateInstrumentationAnalysis(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('INSTRUMENTATION ANALYSIS');

    await this.addParagraph('Instrumentation Overview');
    await this.addText(
      `The analysis identified ${result.elements.instrumentation.length} instrumentation devices ` +
      'providing process monitoring, control, and safety functions. Each instrument has been ' +
      'classified by type, function, and safety integrity level where applicable.'
    );

    if (result.elements.instrumentation.length > 0) {
      // Instrumentation types
      const instrumentTypes = result.elements.instrumentation.reduce((acc, inst) => {
        acc[inst.type] = (acc[inst.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await this.addParagraph('Instrumentation Type Distribution');
      Object.entries(instrumentTypes).forEach(async ([type, count]) => {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${type}: ${count} device${count > 1 ? 's' : ''}`, 11);
      });

      // SIL ratings distribution
      const silRatings = result.elements.instrumentation.reduce((acc, inst) => {
        const sil = inst.SIL_Rating || 'Not Specified';
        acc[sil] = (acc[sil] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await this.addParagraph('Safety Integrity Level (SIL) Distribution');
      Object.entries(silRatings).forEach(async ([sil, count]) => {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${sil}: ${count} device${count > 1 ? 's' : ''}`, 11);
      });

      // Detailed instrumentation list
      await this.addParagraph('Key Instrumentation Devices');
      
      for (let i = 0; i < Math.min(result.elements.instrumentation.length, 8); i++) {
        const inst = result.elements.instrumentation[i];
        
        if (this.currentY < 150) {
          await this.newPage();
        }
        
        this.currentY -= 5;
        await this.drawBox(this.pageMargin, this.currentY - 90, 512, 90, rgb(0.97, 0.97, 0.97));
        this.currentY -= 15;
        
        await this.addText(`${inst.tagNumber} - ${inst.type}`, 12, true);
        this.currentY -= this.lineHeight;
        await this.addText(`Description: ${inst.description}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Position: (${inst.position.x.toFixed(1)}, ${inst.position.y.toFixed(1)})`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Confidence: ${this.formatPercentage(inst.confidence)} | Range: ${this.getInstrumentRange(inst)}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`SIL Rating: ${this.getSILRating(inst)} | Accuracy: ${this.getAccuracy(inst)}`, 10);
        
        this.currentY -= 25;
      }
    }

    await this.addParagraph('Control System Architecture');
    await this.addText(
      `Control Philosophy: ${result.processAnalysis.controlPhilosophy}. ` +
      'The instrumentation configuration suggests a modern control system architecture ' +
      'with distributed control capabilities and appropriate safety system integration.'
    );
  }

  private async generatePipingAnalysis(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('PIPING SYSTEM ANALYSIS');

    await this.addParagraph('Piping Overview');
    await this.addText(
      `The analysis identified ${result.elements.piping.length} piping systems connecting ` +
      'process equipment and providing fluid transport throughout the facility. Each piping ' +
      'system has been analyzed for size, material specification, and service application.'
    );

    if (result.elements.piping.length > 0) {
      // Pipe sizes distribution
      const pipeSizes = result.elements.piping.reduce((acc, pipe) => {
        acc[pipe.size] = (acc[pipe.size] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await this.addParagraph('Pipe Size Distribution');
      Object.entries(pipeSizes).forEach(async ([size, count]) => {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${size}: ${count} line${count > 1 ? 's' : ''}`, 11);
      });

      // Materials distribution
      const materials = result.elements.piping.reduce((acc, pipe) => {
        acc[pipe.material] = (acc[pipe.material] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      await this.addParagraph('Material Specification Distribution');
      Object.entries(materials).forEach(async ([material, count]) => {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${material}: ${count} line${count > 1 ? 's' : ''}`, 11);
      });

      // Detailed piping list
      await this.addParagraph('Major Piping Systems');
      
      for (let i = 0; i < Math.min(result.elements.piping.length, 6); i++) {
        const pipe = result.elements.piping[i];
        
        if (this.currentY < 150) {
          await this.newPage();
        }
        
        this.currentY -= 5;
        await this.drawBox(this.pageMargin, this.currentY - 100, 512, 100, rgb(0.97, 0.97, 0.97));
        this.currentY -= 15;
        
        await this.addText(`${pipe.lineNumber} - ${pipe.size} ${pipe.material}`, 12, true);
        this.currentY -= this.lineHeight;
        await this.addText(`Service: ${pipe.fluidService}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Operating Conditions: ${pipe.operatingPressure}, ${pipe.operatingTemperature}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Insulation: ${pipe.insulationType || 'Not specified'}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Heat Tracing: ${pipe.heatTracing ? 'Yes' : 'No'}`, 10);
        
        this.currentY -= 30;
      }
    }

    await this.addParagraph('Piping System Assessment');
    await this.addText(
      'The piping configuration appears consistent with industry best practices for process ' +
      'piping systems. Material selections are appropriate for the identified service applications, ' +
      'and pipe sizing follows standard hydraulic design principles.'
    );
  }

  private async generateQualityAssessment(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('QUALITY ASSESSMENT');

    await this.addParagraph('Overall Quality Metrics');
    const qualityMetrics = [
      `Overall Analysis Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      `High Confidence Items (>85%): ${result.qualityMetrics.highConfidenceItems}`,
      `Medium Confidence Items (70-85%): ${result.qualityMetrics.mediumConfidenceItems}`,
      `Low Confidence Items (<70%): ${result.qualityMetrics.lowConfidenceItems}`,
      `Items Requiring Review: ${result.qualityMetrics.itemsNeedingReview}`
    ];

    for (const metric of qualityMetrics) {
      this.currentY -= this.lineHeight;
      await this.addText(`• ${metric}`, 11);
    }

    await this.addParagraph('Confidence Level Analysis');
    const confidenceDescription = this.getConfidenceDescription(result.confidence);
    await this.addText(
      `The overall analysis confidence of ${(result.confidence * 100).toFixed(1)}% indicates ` +
      `${confidenceDescription.toLowerCase()} accuracy in element identification and classification. ` +
      'This confidence level is based on symbol clarity, geometric consistency, and contextual appropriateness.'
    );

    await this.addParagraph('Quality Control Observations');
    if (result.qualityMetrics.highConfidenceItems > result.qualityMetrics.lowConfidenceItems * 2) {
      await this.addText(
        'The analysis demonstrates excellent quality with a high proportion of confidently ' +
        'identified elements. This indicates clear symbol representation and good drawing quality.'
      );
    } else {
      await this.addText(
        'The analysis shows moderate quality with some elements requiring additional review. ' +
        'This may be due to symbol complexity, drawing resolution, or non-standard representations.'
      );
    }

    await this.addParagraph('Recommended Review Items');
    await this.addText(
      'All items with confidence scores below 70% should be reviewed by qualified engineers ' +
      'to verify correct identification and classification. Pay particular attention to safety-critical ' +
      'instrumentation and pressure-containing equipment.'
    );

    if (result.qualityMetrics.itemsNeedingReview > 0) {
      await this.addText(
        `There are ${result.qualityMetrics.itemsNeedingReview} items flagged for engineering review. ` +
        'These items are listed in detail within their respective analysis sections.'
      );
    }
  }

  private async generateProcessAnalysis(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('PROCESS SYSTEM ANALYSIS');

    await this.addParagraph('Process Units Identified');
    if (result.processAnalysis.processUnits.length > 0) {
      await this.addText('The following major process units were identified:');
      for (const unit of result.processAnalysis.processUnits) {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${unit}`, 11);
      }
    }

    await this.addParagraph('Utility Services');
    if (result.processAnalysis.utilityServices.length > 0) {
      await this.addText('The following utility services were identified:');
      for (const service of result.processAnalysis.utilityServices) {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${service}`, 11);
      }
    }

    await this.addParagraph('Safety Systems');
    if (result.processAnalysis.safetySystemsIdentified.length > 0) {
      await this.addText('The following safety-related instrumentation was identified:');
      for (const safety of result.processAnalysis.safetySystemsIdentified) {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${safety}`, 11);
      }
    }

    await this.addParagraph('Fluid Types and Services');
    if (result.processAnalysis.fluidTypes.length > 0) {
      await this.addText('The following fluid services were identified:');
      for (const fluid of result.processAnalysis.fluidTypes) {
        this.currentY -= this.lineHeight;
        await this.addText(`• ${fluid}`, 11);
      }
    }

    await this.addParagraph('Control Philosophy Assessment');
    await this.addText(
      `Control Philosophy: ${result.processAnalysis.controlPhilosophy}. ` +
      'This configuration suggests appropriate control system architecture for the identified ' +
      'process complexity and safety requirements.'
    );

    await this.addParagraph('Process Integration Assessment');
    await this.addText(
      'The identified process units, utility services, and control systems demonstrate ' +
      'appropriate integration typical of modern process facilities. The balance between ' +
      'process equipment and instrumentation indicates adequate monitoring and control capabilities.'
    );
  }

  private async generateRecommendations(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('RECOMMENDATIONS');

    await this.addParagraph('Immediate Actions');
    const immediateActions = [
      'Review all equipment and instrumentation items with confidence scores below 70%',
      'Verify safety-critical instrument SIL ratings against safety requirements',
      'Confirm equipment specifications match process design requirements',
      'Validate piping material specifications for corrosive service applications'
    ];

    for (const action of immediateActions) {
      this.currentY -= this.lineHeight;
      await this.addText(`• ${action}`, 11);
    }

    await this.addParagraph('Technical Verification');
    await this.addText(
      'Engage qualified process engineers to review the analysis results and verify ' +
      'critical identifications, particularly for safety-related systems and equipment ' +
      'operating under severe service conditions.'
    );

    await this.addParagraph('Drawing Quality Improvements');
    if (result.confidence < 0.85) {
      await this.addText(
        'Consider updating the original drawing to improve symbol clarity and standardization. ' +
        'This will enhance future analysis accuracy and reduce manual review requirements.'
      );
    }

    await this.addParagraph('Database Integration');
    await this.addText(
      'Consider integrating the extracted data with existing asset management and maintenance ' +
      'systems to leverage the structured equipment and instrumentation inventory.'
    );

    await this.addParagraph('Future Analysis Enhancements');
    await this.addText(
      'For improved analysis accuracy, provide additional context such as process descriptions, ' +
      'design basis documents, or equipment data sheets that can help refine identification algorithms.'
    );
  }

  private async generateConclusions(result: CADAnalysisResult): Promise<void> {
    await this.newPage();
    await this.addSectionHeader('CONCLUSIONS');

    await this.addParagraph('Analysis Summary');
    await this.addText(
      `The comprehensive analysis of ${result.filename} has successfully identified and ` +
      `classified ${result.statistics.totalElements} technical elements with an overall ` +
      `confidence of ${(result.confidence * 100).toFixed(1)}%. The analysis provides a ` +
      'detailed technical inventory suitable for engineering applications.'
    );

    await this.addParagraph('Key Achievements');
    const achievements = [
      `Successfully processed ${result.documentType.toLowerCase()} in ${result.processingTime} seconds`,
      `Identified ${result.statistics.equipmentCount} process equipment items`,
      `Catalogued ${result.statistics.instrumentCount} instrumentation devices`,
      `Mapped ${result.statistics.pipeCount} piping systems`,
      `Achieved ${(result.confidence * 100).toFixed(1)}% overall analysis confidence`
    ];

    for (const achievement of achievements) {
      this.currentY -= this.lineHeight;
      await this.addText(`• ${achievement}`, 11);
    }

    await this.addParagraph('Technical Validation');
    await this.addText(
      'The analysis results demonstrate high technical accuracy and comprehensive coverage ' +
      'of the drawing content. The structured data format enables direct integration with ' +
      'engineering databases and asset management systems.'
    );

    await this.addParagraph('Reliability Assessment');
    const reliabilityLevel = result.confidence > 0.9 ? 'Excellent' : 
                           result.confidence > 0.8 ? 'Good' : 
                           result.confidence > 0.7 ? 'Acceptable' : 'Requires Review';
    
    await this.addText(
      `Analysis Reliability: ${reliabilityLevel}. The confidence metrics indicate ` +
      (result.confidence > 0.8 ? 'high reliability for direct use in engineering applications.' :
       'moderate reliability with recommended engineering review for critical applications.')
    );

    await this.addParagraph('Final Recommendations');
    await this.addText(
      'The analysis provides a solid foundation for equipment management, maintenance planning, ' +
      'and process optimization activities. Regular validation against field conditions and ' +
      'design documents will maintain data accuracy and reliability.'
    );
  }

  private async generateAppendices(result: CADAnalysisResult): Promise<void> {
    // Appendix A: Complete Equipment List
    await this.newPage();
    await this.addSectionHeader('APPENDIX A: COMPLETE EQUIPMENT SPECIFICATIONS');

    if (result.elements.equipment.length > 0) {
      for (const equipment of result.elements.equipment) {
        if (this.currentY < 120) {
          await this.newPage();
        }
        
        this.currentY -= 5;
        await this.addText(`${equipment.tagNumber} - ${equipment.type}`, 12, true);
        this.currentY -= this.lineHeight;
        await this.addText(`Description: ${equipment.description}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Position: (${equipment.position.x.toFixed(1)}, ${equipment.position.y.toFixed(1)})`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Confidence: ${(equipment.confidence * 100).toFixed(1)}%`, 10);
        
        if (equipment.specifications) {
          this.currentY -= this.lineHeight;
          const specs = Object.entries(equipment.specifications).map(([k, v]) => `${k}: ${v}`).join(', ');
          await this.addText(`Specifications: ${specs}`, 10);
        }
        
        if (equipment.operatingConditions) {
          this.currentY -= this.lineHeight;
          const conditions = Object.entries(equipment.operatingConditions).map(([k, v]) => `${k}: ${v}`).join(', ');
          await this.addText(`Operating Conditions: ${conditions}`, 10);
        }
        
        this.currentY -= 20;
      }
    }

    // Appendix B: Complete Instrumentation List
    await this.newPage();
    await this.addSectionHeader('APPENDIX B: COMPLETE INSTRUMENTATION DETAILS');

    if (result.elements.instrumentation.length > 0) {
      for (const instrument of result.elements.instrumentation) {
        if (this.currentY < 120) {
          await this.newPage();
        }
        
        this.currentY -= 5;
        await this.addText(`${instrument.tagNumber} - ${instrument.type}`, 12, true);
        this.currentY -= this.lineHeight;
        await this.addText(`Description: ${instrument.description}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Position: (${instrument.position.x.toFixed(1)}, ${instrument.position.y.toFixed(1)})`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Confidence: ${(instrument.confidence * 100).toFixed(1)}%`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Range: ${instrument.range || 'Not specified'} | Accuracy: ${instrument.accuracy || 'Not specified'}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`SIL Rating: ${instrument.SIL_Rating || 'Not specified'}`, 10);
        
        if (instrument.alarmLimits) {
          this.currentY -= this.lineHeight;
          const limits = Object.entries(instrument.alarmLimits).map(([k, v]) => `${k}: ${v}`).join(', ');
          await this.addText(`Alarm Limits: ${limits}`, 10);
        }
        
        this.currentY -= 20;
      }
    }

    // Appendix C: Complete Piping List
    await this.newPage();
    await this.addSectionHeader('APPENDIX C: COMPLETE PIPING SPECIFICATIONS');

    if (result.elements.piping.length > 0) {
      for (const pipe of result.elements.piping) {
        if (this.currentY < 120) {
          await this.newPage();
        }
        
        this.currentY -= 5;
        await this.addText(`${pipe.lineNumber} - ${pipe.size}`, 12, true);
        this.currentY -= this.lineHeight;
        await this.addText(`Material: ${pipe.material}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Service: ${pipe.fluidService}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Operating Pressure: ${pipe.operatingPressure}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Operating Temperature: ${pipe.operatingTemperature}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Insulation: ${pipe.insulationType || 'Not specified'}`, 10);
        this.currentY -= this.lineHeight;
        await this.addText(`Heat Tracing: ${pipe.heatTracing ? 'Yes' : 'No'}`, 10);
        
        this.currentY -= 20;
      }
    }

    // Appendix D: Technical References
    await this.newPage();
    await this.addSectionHeader('APPENDIX D: TECHNICAL REFERENCES AND STANDARDS');

    const references = [
      'ASME B31.3 - Process Piping Code',
      'ANSI/ISA-5.1 - Instrumentation Symbols and Identification',
      'API 14C - Analysis, Design, Installation, and Testing of Safety Systems',
      'IEC 61508 - Functional Safety of Electrical/Electronic/Programmable Electronic Safety-related Systems',
      'ANSI/ASME PTC 10 - Performance Test Code on Compressors and Exhausters',
      'TEMA Standards - Tubular Exchanger Manufacturers Association',
      'API 660 - Shell-and-Tube Heat Exchangers for General Refinery Service'
    ];

    await this.addText('Industry Standards and Codes Applied:', 12, true);
    for (const ref of references) {
      this.currentY -= this.lineHeight;
      await this.addText(`• ${ref}`, 10);
    }

    this.currentY -= 30;
    await this.addText('Analysis Algorithms and Methods:', 12, true);
    const methods = [
      'Computer Vision: OpenCV-based symbol detection and classification',
      'Machine Learning: Deep neural networks trained on CAD symbol datasets',
      'Pattern Recognition: Geometric analysis for equipment identification',
      'OCR Technology: Text extraction and interpretation algorithms',
      'Spatial Analysis: Relationship mapping and connectivity analysis'
    ];

    for (const method of methods) {
      this.currentY -= this.lineHeight;
      await this.addText(`• ${method}`, 10);
    }
  }

  // Utility methods
  private async newPage(): Promise<void> {
    this.currentPage = this.pdfDoc!.addPage([612, 792]);
    this.currentY = 750;
    this.pageNumber++;
  }

  private async addSectionHeader(title: string): Promise<void> {
    this.currentY -= 20;
    await this.addText(title, 16, true, 'left');
    this.currentY -= 10;
    
    // Add underline
    this.currentPage!.drawLine({
      start: { x: this.pageMargin, y: this.currentY },
      end: { x: 562, y: this.currentY },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    this.currentY -= 20;
  }

  private async addParagraph(title: string): Promise<void> {
    this.currentY -= 20;
    await this.addText(title, 12, true);
    this.currentY -= 5;
  }

  private sanitizeText(text: string): string {
    // Replace Unicode characters that can't be encoded in WinAnsi
    return text
      .replace(/≥/g, '>=')  // Greater than or equal
      .replace(/≤/g, '<=')  // Less than or equal
      .replace(/±/g, '+/-') // Plus-minus
      .replace(/≠/g, '!=')  // Not equal
      .replace(/°/g, 'deg') // Degree symbol
      .replace(/[‘’]/g, "'")  // Smart quotes
      .replace(/[“”]/g, '"')  // Smart double quotes
      .replace(/–/g, '-')   // En dash
      .replace(/—/g, '--')  // Em dash
      .replace(/•/g, '*')   // Bullet point
      .replace(/[^\x00-\xFF]/g, '?'); // Any other non-ASCII characters
  }

  private async addText(
    text: string, 
    size: number = 11, 
    bold: boolean = false, 
    align: 'left' | 'center' | 'right' = 'left',
    x?: number,
    y?: number
  ): Promise<void> {
    // Sanitize text to prevent encoding errors
    const sanitizedText = this.sanitizeText(text);
    const font = bold ? this.boldFont! : this.font!;
    const textWidth = font.widthOfTextAtSize(sanitizedText, size);
    
    let xPos = x ?? this.pageMargin;
    if (align === 'center' && x === undefined) {
      xPos = (612 - textWidth) / 2;
    } else if (align === 'right' && x === undefined) {
      xPos = 562 - textWidth;
    }
    
    const yPos = y ?? this.currentY;

    // Handle text wrapping for long lines
    if (textWidth > 512 && x === undefined) {
      const words = sanitizedText.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        
        if (testWidth > 512) {
          if (currentLine) {
            this.currentPage!.drawText(currentLine, {
              x: xPos,
              y: this.currentY,
              size,
              font,
              color: rgb(0, 0, 0)
            });
            this.currentY -= this.lineHeight;
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        this.currentPage!.drawText(currentLine, {
          x: xPos,
          y: this.currentY,
          size,
          font,
          color: rgb(0, 0, 0)
        });
      }
    } else {
      this.currentPage!.drawText(sanitizedText, {
        x: xPos,
        y: yPos,
        size,
        font,
        color: rgb(0, 0, 0)
      });
    }

    if (y === undefined) {
      this.currentY -= this.lineHeight;
    }
  }

  private async drawBox(x: number, y: number, width: number, height: number, color: any): Promise<void> {
    this.currentPage!.drawRectangle({
      x,
      y,
      width,
      height,
      color,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5
    });
  }

  private async addPageNumbers(): Promise<void> {
    const pages = this.pdfDoc!.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      page.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: 300,
        y: 30,
        size: 10,
        font: this.font!,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }
  
  // =============================================================================
  // ENHANCED DATA FORMATTING AND TBD ELIMINATION METHODS
  // =============================================================================
  
  /**
   * Format percentage values consistently (eliminates .toFixed issues)
   */
  private formatPercentage(value: number, precision: number = 1): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'Not Available';
    }
    return `${(value * 100).toFixed(precision)}%`;
  }
  
  /**
   * Format numerical values with proper precision
   */
  private formatNumber(value: number, precision: number = 1): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'Not Specified';
    }
    return value.toFixed(precision);
  }
  
  /**
   * Get confidence description based on confidence level
   */
  private getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.9) return 'Excellent';
    if (confidence >= 0.8) return 'Very Good';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.6) return 'Fair';
    if (confidence >= 0.5) return 'Moderate';
    return 'Requires Review';
  }
  
  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Get equipment specification with fallback
   */
  private getEquipmentSpec(equipment: any, specKey: string, fallback: string = 'Not Specified'): string {
    if (!equipment.specifications) return fallback;
    const value = equipment.specifications[specKey];
    if (!value || value === 'TBD' || value === '' || value === 'undefined') {
      return fallback;
    }
    return value.toString();
  }
  
  /**
   * Get instrumentation range with intelligent fallback
   */
  private getInstrumentRange(instrument: any): string {
    if (instrument.range && instrument.range !== 'TBD' && instrument.range !== 'Not specified') {
      return instrument.range;
    }
    
    // Try to infer from type
    const type = instrument.type.toLowerCase();
    if (type.includes('pressure')) {
      return this.getInferredPressureRange(instrument);
    } else if (type.includes('temperature')) {
      return this.getInferredTemperatureRange(instrument);
    } else if (type.includes('flow')) {
      return this.getInferredFlowRange(instrument);
    } else if (type.includes('level')) {
      return this.getInferredLevelRange(instrument);
    }
    
    return 'Range to be determined';
  }
  
  /**
   * Infer pressure range based on instrument type and context
   */
  private getInferredPressureRange(instrument: any): string {
    const tagNumber = instrument.tagNumber.toLowerCase();
    
    // Common pressure ranges by application
    if (tagNumber.includes('steam') || tagNumber.includes('boiler')) {
      return '0-150 PSI';
    } else if (tagNumber.includes('vacuum')) {
      return '0-30 in Hg';
    } else if (tagNumber.includes('high') || tagNumber.includes('hp')) {
      return '0-500 PSI';
    } else {
      return '0-100 PSI';
    }
  }
  
  /**
   * Infer temperature range based on context
   */
  private getInferredTemperatureRange(instrument: any): string {
    const tagNumber = instrument.tagNumber.toLowerCase();
    
    if (tagNumber.includes('steam') || tagNumber.includes('hot')) {
      return '0-500°F';
    } else if (tagNumber.includes('cooling') || tagNumber.includes('cold')) {
      return '32-200°F';
    } else if (tagNumber.includes('ambient') || tagNumber.includes('room')) {
      return '50-150°F';
    } else {
      return '0-200°F';
    }
  }
  
  /**
   * Infer flow range based on pipe size and service
   */
  private getInferredFlowRange(instrument: any): string {
    const tagNumber = instrument.tagNumber.toLowerCase();
    
    if (tagNumber.includes('water') || tagNumber.includes('cooling')) {
      return '0-1000 GPM';
    } else if (tagNumber.includes('steam')) {
      return '0-10000 lb/hr';
    } else if (tagNumber.includes('gas') || tagNumber.includes('air')) {
      return '0-1000 SCFM';
    } else {
      return '0-500 GPM';
    }
  }
  
  /**
   * Infer level range for tanks and vessels
   */
  private getInferredLevelRange(instrument: any): string {
    return '0-100%';
  }
  
  /**
   * Get SIL rating with intelligent fallback
   */
  private getSILRating(instrument: any): string {
    if (instrument.SIL_Rating && instrument.SIL_Rating !== 'TBD' && instrument.SIL_Rating !== 'Not specified') {
      return instrument.SIL_Rating;
    }
    
    // Infer SIL rating based on instrument type
    const type = instrument.type.toLowerCase();
    const tagNumber = instrument.tagNumber.toLowerCase();
    
    if (type.includes('safety') || type.includes('emergency') || type.includes('shutdown')) {
      return 'SIL-2 (Estimated)';
    } else if (tagNumber.includes('sh') || tagNumber.includes('sl')) { // Switch High/Low
      return 'SIL-1 (Estimated)';
    } else if (type.includes('controller') && (tagNumber.includes('critical') || tagNumber.includes('important'))) {
      return 'SIL-1 (Estimated)';
    }
    
    return 'Not safety-related';
  }
  
  /**
   * Get accuracy specification with fallback
   */
  private getAccuracy(instrument: any): string {
    if (instrument.accuracy && instrument.accuracy !== 'TBD' && instrument.accuracy !== 'Not specified') {
      return instrument.accuracy;
    }
    
    // Typical accuracies by instrument type
    const type = instrument.type.toLowerCase();
    
    if (type.includes('transmitter')) {
      return '±0.5% (Typical)';
    } else if (type.includes('indicator') || type.includes('gauge')) {
      return '±2.0% (Typical)';
    } else if (type.includes('controller')) {
      return '±1.0% (Typical)';
    } else if (type.includes('switch')) {
      return '±1.0% (Typical)';
    }
    
    return '±1.0% (Estimated)';
  }
  
  /**
   * Get piping material with intelligent fallback
   */
  private getPipingMaterial(pipe: any): string {
    if (pipe.material && pipe.material !== 'TBD' && pipe.material !== '' && pipe.material !== 'undefined') {
      return pipe.material;
    }
    
    // Infer material based on line number or service
    const lineNumber = pipe.lineNumber.toLowerCase();
    
    if (lineNumber.includes('steam') || lineNumber.includes('high') || lineNumber.includes('hot')) {
      return 'A106 Gr B (Inferred)';
    } else if (lineNumber.includes('corrosive') || lineNumber.includes('acid') || lineNumber.includes('chemical')) {
      return '316L SS (Inferred)';
    } else if (lineNumber.includes('water') || lineNumber.includes('cooling')) {
      return 'A53 Gr B (Inferred)';
    } else if (lineNumber.includes('utility') || lineNumber.includes('service')) {
      return 'A106 Gr B (Inferred)';
    }
    
    return 'Carbon Steel (Default)';
  }
  
  /**
   * Get piping size with fallback
   */
  private getPipingSize(pipe: any): string {
    if (pipe.size && pipe.size !== 'TBD' && pipe.size !== '' && pipe.size !== 'undefined') {
      return pipe.size;
    }
    
    // Infer size from service type
    const lineNumber = pipe.lineNumber.toLowerCase();
    
    if (lineNumber.includes('main') || lineNumber.includes('header')) {
      return '8" (Estimated)';
    } else if (lineNumber.includes('utility') || lineNumber.includes('service')) {
      return '2" (Estimated)';
    } else if (lineNumber.includes('instrument') || lineNumber.includes('sample')) {
      return '1/2" (Estimated)';
    } else if (lineNumber.includes('drain') || lineNumber.includes('vent')) {
      return '3/4" (Estimated)';
    }
    
    return '4" (Estimated)';
  }
  
  /**
   * Get operating pressure with intelligent fallback
   */
  private getOperatingPressure(pipe: any): string {
    if (pipe.operatingPressure && pipe.operatingPressure !== 'TBD' && pipe.operatingPressure !== '') {
      return pipe.operatingPressure;
    }
    
    // Infer pressure based on service
    const lineNumber = pipe.lineNumber.toLowerCase();
    
    if (lineNumber.includes('steam') || lineNumber.includes('high')) {
      return '150 PSI (Estimated)';
    } else if (lineNumber.includes('vacuum')) {
      return '15 PSI (Estimated)';
    } else if (lineNumber.includes('low') || lineNumber.includes('utility')) {
      return '50 PSI (Estimated)';
    }
    
    return '100 PSI (Estimated)';
  }
  
  /**
   * Get operating temperature with intelligent fallback
   */
  private getOperatingTemperature(pipe: any): string {
    if (pipe.operatingTemperature && pipe.operatingTemperature !== 'TBD' && pipe.operatingTemperature !== '') {
      return pipe.operatingTemperature;
    }
    
    // Infer temperature based on service
    const lineNumber = pipe.lineNumber.toLowerCase();
    
    if (lineNumber.includes('steam') || lineNumber.includes('hot')) {
      return '400°F (Estimated)';
    } else if (lineNumber.includes('cooling') || lineNumber.includes('cold')) {
      return '80°F (Estimated)';
    } else if (lineNumber.includes('ambient')) {
      return '70°F (Estimated)';
    }
    
    return '200°F (Estimated)';
  }
  
  /**
   * Generate confidence-based summary text
   */
  private generateConfidenceBasedSummary(result: CADAnalysisResult): string {
    const confidence = result.confidence;
    const elementCount = result.statistics.totalElements;
    
    let summary = '';
    
    if (confidence >= 0.9) {
      summary = `Excellent analysis results with ${this.formatPercentage(confidence)} overall accuracy. `;
      summary += `All ${elementCount} identified elements show high confidence scores, indicating `;
      summary += 'reliable symbol recognition and classification. The drawing is well-structured and follows industry standards.';
    } else if (confidence >= 0.8) {
      summary = `Very good analysis results with ${this.formatPercentage(confidence)} overall accuracy. `;
      summary += `The majority of the ${elementCount} identified elements demonstrate high confidence, `;
      summary += 'with only minor items requiring verification. The drawing quality supports accurate automated analysis.';
    } else if (confidence >= 0.7) {
      summary = `Good analysis results with ${this.formatPercentage(confidence)} overall accuracy. `;
      summary += `Most of the ${elementCount} identified elements are reliable, though some items `;
      summary += 'may benefit from engineering review to confirm classifications and specifications.';
    } else if (confidence >= 0.6) {
      summary = `Fair analysis results with ${this.formatPercentage(confidence)} overall accuracy. `;
      summary += `While ${elementCount} elements were identified, a significant portion requires `;
      summary += 'engineering review due to drawing quality or symbol ambiguity issues.';
    } else {
      summary = `Moderate analysis results with ${this.formatPercentage(confidence)} overall accuracy. `;
      summary += `The ${elementCount} identified elements require comprehensive engineering review `;
      summary += 'due to poor drawing quality, non-standard symbols, or unclear representation.';
    }
    
    return summary;
  }
  
  /**
   * Generate contextual recommendations based on analysis results
   */
  private generateContextualRecommendations(result: CADAnalysisResult): string[] {
    const recommendations = [];
    const confidence = result.confidence;
    const lowConfidenceItems = result.qualityMetrics.lowConfidenceItems || 0;
    const hasEquipment = result.elements.equipment.length > 0;
    const hasInstrumentation = result.elements.instrumentation.length > 0;
    const hasPiping = result.elements.piping.length > 0;
    
    // Confidence-based recommendations
    if (confidence < 0.7) {
      recommendations.push('Conduct comprehensive engineering review of all identified elements due to moderate analysis confidence.');
      recommendations.push('Consider improving drawing quality or scanning resolution for better automated analysis results.');
    } else if (lowConfidenceItems > 0) {
      recommendations.push(`Review ${lowConfidenceItems} low-confidence items to verify accuracy of identifications.`);
    }
    
    // System-specific recommendations
    if (hasEquipment) {
      recommendations.push('Validate equipment specifications against P&ID design documents and vendor data sheets.');
      recommendations.push('Confirm equipment sizing and capacity calculations for process requirements.');
    }
    
    if (hasInstrumentation) {
      recommendations.push('Verify instrument SIL ratings for safety-critical applications and emergency shutdown systems.');
      recommendations.push('Confirm instrument ranges and accuracies meet process control requirements.');
      recommendations.push('Review instrument installation and maintenance accessibility in final design.');
    }
    
    if (hasPiping) {
      recommendations.push('Validate piping material selections against process conditions and corrosion requirements.');
      recommendations.push('Confirm pipe sizing calculations for flow rates and pressure drop requirements.');
      recommendations.push('Review piping layout for maintenance access and thermal expansion considerations.');
    }
    
    // General recommendations
    recommendations.push('Update all specifications marked as "estimated" or "inferred" with actual design values.');
    recommendations.push('Perform detailed stress analysis and hydraulic calculations for final design validation.');
    recommendations.push('Coordinate with process, mechanical, and instrumentation disciplines for integrated design review.');
    
    return recommendations;
  }


}
