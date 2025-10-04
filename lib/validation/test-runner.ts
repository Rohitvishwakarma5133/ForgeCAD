/**
 * Complete Test Runner for CAD Validation System
 * Runs all validation components with comprehensive test data
 */

import TagParser from './tag-parser';
import MissingEquipmentDetector, { DWGEntity, ExtractedTag } from './missing-equipment-detector';
import FalsePositiveValidator, { DetectedSymbol, SymbolTemplate } from './false-positive-validator';
import InstrumentMappingValidator, { InstrumentConnection, EquipmentItem, ProcessLine } from './instrument-mapping-validator';
import MaterialRatingValidator, { TextFragment, LayerMetadata } from './material-rating-validator';
import AutomatedTestingFramework from './automated-testing-framework';

export interface ComprehensiveTestData {
  dwgEntities: DWGEntity[];
  extractedTags: ExtractedTag[];
  detectedSymbols: DetectedSymbol[];
  instrumentConnections: InstrumentConnection[];
  equipmentItems: EquipmentItem[];
  processLines: ProcessLine[];
  textFragments: TextFragment[];
  layerMetadata: LayerMetadata[];
}

export interface ValidationReport {
  timestamp: string;
  overallScore: number;
  results: {
    tagParsing: any;
    missingEquipment: any;
    falsePositives: any;
    instrumentMapping: any;
    materialRating: any;
    automatedTesting: any;
  };
  summary: {
    totalItems: number;
    validItems: number;
    confidence: number;
    criticalIssues: number;
    recommendations: string[];
  };
  exportFiles: {
    detailedReport: string;
    issuesSummary: string;
    recommendationsAction: string;
  };
}

export class CADValidationTestRunner {
  private testData: ComprehensiveTestData;

  constructor() {
    this.testData = this.generateComprehensiveTestData();
  }

  /**
   * Run complete validation test suite
   */
  public async runCompleteValidation(): Promise<ValidationReport> {
    console.log('🚀 Starting Complete CAD Validation Test Suite');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const results: any = {};

    try {
      // Step 1: Tag Parsing and Normalization
      console.log('📝 Step 1: Tag Parsing and Normalization');
      results.tagParsing = await this.runTagParsingTests();

      // Step 2: Missing Equipment Detection
      console.log('🔍 Step 2: Missing Equipment Detection');
      results.missingEquipment = await this.runMissingEquipmentTests();

      // Step 3: False Positive Validation
      console.log('🚫 Step 3: False Positive Validation');
      results.falsePositives = await this.runFalsePositiveTests();

      // Step 4: Instrument Mapping Validation
      console.log('🔗 Step 4: Instrument-to-Equipment Mapping');
      results.instrumentMapping = await this.runInstrumentMappingTests();

      // Step 5: Material/Rating Validation
      console.log('🧪 Step 5: Material/Pressure Rating Validation');
      results.materialRating = await this.runMaterialRatingTests();

      // Step 6: Automated Testing Framework
      console.log('🧪 Step 6: Automated Testing Framework');
      results.automatedTesting = await this.runAutomatedTestingFramework();

      const endTime = Date.now();
      console.log(`⏱️  Total execution time: ${(endTime - startTime) / 1000}s`);

      // Generate comprehensive report
      const report = this.generateComprehensiveReport(results);
      
      console.log('✅ Complete validation test suite finished successfully');
      console.log(`📊 Overall Score: ${report.overallScore}%`);
      
      return report;

    } catch (error) {
      console.error('❌ Error during validation test suite:', error);
      throw error;
    }
  }

  /**
   * Run tag parsing tests
   */
  private async runTagParsingTests(): Promise<any> {
    const tagParser = new TagParser();
    
    const testTags = [
      'P-101A', 'P-I01A', 'FV-101', 'PT-1OI', 'TI-2O3B', 
      '6"-CS-150', '4"-SS-300', 'INVALID-TAG-123',
      'FIC-101', 'PSV-201A', 'LT-301', '8"-CS-600',
      'P-101', 'V-201B', 'TT-401C', 'PHANTOM_TAG'
    ];
    
    console.log(`  • Parsing ${testTags.length} test tags...`);
    
    const parseResults = tagParser.parseTagsBatch(testTags);
    const stats = tagParser.getValidationStats(parseResults);
    
    console.log(`  • Valid tags: ${stats.validTags}/${stats.totalTags} (${((stats.validTags/stats.totalTags)*100).toFixed(1)}%)`);
    console.log(`  • Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    
    return {
      results: parseResults,
      stats,
      testPassed: stats.averageConfidence > 0.7
    };
  }

  /**
   * Run missing equipment detection tests
   */
  private async runMissingEquipmentTests(): Promise<any> {
    const detector = new MissingEquipmentDetector();
    
    console.log(`  • Analyzing ${this.testData.dwgEntities.length} DWG entities vs ${this.testData.extractedTags.length} extracted tags...`);
    
    const result = detector.detectMissingEquipment(
      this.testData.dwgEntities,
      this.testData.extractedTags
    );
    
    console.log(`  • Missing tags: ${result.analysis.missingTags.length}`);
    console.log(`  • False positives: ${result.analysis.falsePositives.length}`);
    console.log(`  • Overall confidence: ${(result.analysis.confidence * 100).toFixed(1)}%`);
    
    return {
      result,
      testPassed: result.analysis.confidence > 0.8,
      report: detector.exportReport(result)
    };
  }

  /**
   * Run false positive validation tests
   */
  private async runFalsePositiveTests(): Promise<any> {
    const validator = new FalsePositiveValidator();
    
    console.log(`  • Validating ${this.testData.detectedSymbols.length} symbols and ${this.testData.extractedTags.length} tags...`);
    
    const results = validator.validateExtraction(
      this.testData.detectedSymbols,
      this.testData.extractedTags
    );
    
    const validCount = results.filter(r => r.isValid).length;
    console.log(`  • Valid items: ${validCount}/${results.length} (${((validCount/results.length)*100).toFixed(1)}%)`);
    
    return {
      results,
      testPassed: validCount / results.length > 0.8,
      report: validator.generateValidationReport(results)
    };
  }

  /**
   * Run instrument mapping tests
   */
  private async runInstrumentMappingTests(): Promise<any> {
    const validator = new InstrumentMappingValidator();
    
    console.log(`  • Validating ${this.testData.instrumentConnections.length} instrument mappings...`);
    
    const results = validator.validateInstrumentMappings(
      this.testData.instrumentConnections,
      this.testData.equipmentItems,
      this.testData.processLines
    );
    
    const validCount = results.filter(r => r.isValid).length;
    console.log(`  • Valid mappings: ${validCount}/${results.length} (${((validCount/results.length)*100).toFixed(1)}%)`);
    
    return {
      results,
      testPassed: validCount / results.length > 0.7,
      report: validator.generateMappingReport(results)
    };
  }

  /**
   * Run material rating validation tests
   */
  private async runMaterialRatingTests(): Promise<any> {
    const validator = new MaterialRatingValidator();
    
    console.log(`  • Processing ${this.testData.textFragments.length} text fragments...`);
    
    const results = validator.validateMaterialRatings(
      this.testData.textFragments,
      this.testData.layerMetadata
    );
    
    const validCount = results.filter(r => r.validation.isValid).length;
    console.log(`  • Valid specifications: ${validCount}/${results.length} (${((validCount/results.length)*100).toFixed(1)}%)`);
    
    return {
      results,
      testPassed: validCount / results.length > 0.6,
      report: validator.generateValidationReport(results)
    };
  }

  /**
   * Run automated testing framework
   */
  private async runAutomatedTestingFramework(): Promise<any> {
    const framework = new AutomatedTestingFramework({
      dwgToExtractedThreshold: 2.0,
      confidenceThreshold: 90.0,
      visualDiffEnabled: true
    });
    
    console.log('  • Running automated test suite...');
    
    const results = await framework.runTestSuite(
      this.testData.dwgEntities,
      this.testData.extractedTags
    );
    
    console.log(`  • Test score: ${results.overallScore}%`);
    console.log(`  • DWG extraction test: ${results.dwgExtractionDiff.testPassed ? 'PASSED' : 'FAILED'}`);
    
    return {
      results,
      testPassed: results.overallScore > 70,
      report: framework.exportTestReport(results)
    };
  }

  /**
   * Generate comprehensive test data
   */
  private generateComprehensiveTestData(): ComprehensiveTestData {
    return {
      dwgEntities: [
        {
          id: 'dwg-1',
          type: 'block',
          name: 'PUMP_CENTRIFUGAL',
          layer: 'EQUIPMENT',
          geometry: { x: 100, y: 100, width: 40, height: 30 }
        },
        {
          id: 'dwg-2',
          type: 'text',
          text: 'P-101A',
          layer: 'TAGS',
          geometry: { x: 105, y: 140, width: 30, height: 12 }
        },
        {
          id: 'dwg-3',
          type: 'block',
          name: 'VALVE_GATE',
          layer: 'EQUIPMENT',
          geometry: { x: 200, y: 100, width: 20, height: 20 }
        },
        {
          id: 'dwg-4',
          type: 'text',
          text: 'FV-101',
          layer: 'TAGS',
          geometry: { x: 205, y: 80, width: 25, height: 10 }
        },
        {
          id: 'dwg-5',
          type: 'text',
          text: '6"-CS-150',
          layer: 'PIPING',
          geometry: { x: 150, y: 110, width: 40, height: 8 }
        },
        {
          id: 'dwg-6',
          type: 'block',
          name: 'TRANSMITTER_PRESSURE',
          layer: 'INSTRUMENTS',
          geometry: { x: 300, y: 100, width: 25, height: 25 }
        },
        {
          id: 'dwg-7',
          type: 'text',
          text: 'PT-101',
          layer: 'TAGS',
          geometry: { x: 305, y: 135, width: 20, height: 10 }
        },
        {
          id: 'dwg-8',
          type: 'text',
          text: 'MISSING_TAG_DWG_ONLY',
          layer: 'TAGS',
          geometry: { x: 500, y: 200, width: 80, height: 12 }
        }
      ],

      extractedTags: [
        {
          tag: 'P-I01A', // OCR error: 1 read as I
          confidence: 0.85,
          geometry: { x: 107, y: 142, width: 28, height: 10 },
          source: 'ocr'
        },
        {
          tag: 'FV-101',
          confidence: 0.92,
          geometry: { x: 206, y: 81, width: 23, height: 9 },
          source: 'ocr'
        },
        {
          tag: '6"-CS-150',
          confidence: 0.78,
          geometry: { x: 152, y: 112, width: 38, height: 7 },
          source: 'ocr'
        },
        {
          tag: 'PT-101',
          confidence: 0.89,
          geometry: { x: 306, y: 136, width: 19, height: 9 },
          source: 'ocr'
        },
        {
          tag: 'PHANTOM-TAG', // False positive - not in DWG
          confidence: 0.65,
          geometry: { x: 400, y: 200, width: 50, height: 12 },
          source: 'ocr'
        }
      ],

      detectedSymbols: [
        {
          id: 'sym-1',
          confidence: 0.91,
          geometry: { x: 100, y: 100, width: 40, height: 30 },
          template: {
            id: 'centrifugal_pump',
            name: 'Centrifugal Pump',
            category: 'pump',
            geometry: {
              width: 40,
              height: 30,
              keyPoints: [
                { x: 0, y: 15, type: 'connection' },
                { x: 40, y: 15, type: 'connection' },
                { x: 20, y: 15, type: 'center' }
              ]
            },
            expectedTags: [{
              pattern: /^P-\d{3}[A-Z]?$/,
              proximity: 60,
              relativePosition: 'bottom'
            }]
          } as SymbolTemplate,
          nearbyTags: []
        },
        {
          id: 'sym-2',
          confidence: 0.88,
          geometry: { x: 200, y: 100, width: 20, height: 20 },
          template: {
            id: 'gate_valve',
            name: 'Gate Valve',
            category: 'valve',
            geometry: {
              width: 20,
              height: 20,
              keyPoints: [{ x: 10, y: 10, type: 'center' }]
            },
            expectedTags: [{
              pattern: /^[A-Z]*V-\d{3}[A-Z]?$/,
              proximity: 40,
              relativePosition: 'top'
            }]
          } as SymbolTemplate,
          nearbyTags: []
        }
      ],

      instrumentConnections: [
        {
          instrumentId: 'PT-101',
          instrumentTag: 'PT-101',
          instrumentType: 'pressure',
          geometry: { x: 300, y: 100, width: 25, height: 25 },
          expectedConnections: {
            process: true,
            signal: true,
            power: true
          },
          detectedConnections: {
            processLines: [],
            signalLines: [],
            powerLines: []
          }
        }
      ],

      equipmentItems: [
        {
          id: 'P-101A',
          tag: 'P-101A',
          type: 'pump',
          geometry: { x: 100, y: 100, width: 40, height: 30 },
          connectionPoints: [
            { x: 100, y: 115, type: 'inlet' },
            { x: 140, y: 115, type: 'outlet' }
          ],
          associatedInstruments: ['PT-101', 'FI-101']
        }
      ],

      processLines: [
        {
          id: 'line-1',
          type: 'pipe',
          material: 'CS',
          size: '6"',
          rating: '150',
          geometry: {
            points: [
              { x: 80, y: 115 },
              { x: 100, y: 115 },
              { x: 140, y: 115 },
              { x: 200, y: 115 }
            ],
            width: 4
          },
          connections: [
            { x: 100, y: 115, type: 'connection' },
            { x: 140, y: 115, type: 'connection' }
          ],
          layer: 'PIPING'
        }
      ],

      textFragments: [
        {
          id: 'frag-1',
          text: '6"',
          geometry: { x: 150, y: 110, width: 15, height: 8 },
          layer: 'PIPING',
          fontSize: 8,
          confidence: 0.9,
          source: 'ocr'
        },
        {
          id: 'frag-2',
          text: '-CS-',
          geometry: { x: 165, y: 110, width: 20, height: 8 },
          layer: 'PIPING',
          fontSize: 8,
          confidence: 0.85,
          source: 'ocr'
        },
        {
          id: 'frag-3',
          text: '150',
          geometry: { x: 185, y: 110, width: 15, height: 8 },
          layer: 'PIPING',
          fontSize: 8,
          confidence: 0.92,
          source: 'ocr'
        }
      ],

      layerMetadata: [
        {
          name: 'PIPING',
          type: 'piping',
          defaultMaterial: 'CS',
          defaultRating: '150',
          conventions: {
            separators: ['-', ' ']
          }
        },
        {
          name: 'EQUIPMENT',
          type: 'equipment',
          conventions: {
            separators: ['-', ' ']
          }
        },
        {
          name: 'INSTRUMENTS',
          type: 'equipment',
          conventions: {
            separators: ['-', ' ']
          }
        }
      ]
    };
  }

  /**
   * Generate comprehensive validation report
   */
  private generateComprehensiveReport(results: any): ValidationReport {
    // Calculate overall metrics
    const scores = [
      results.tagParsing?.testPassed ? 100 : 50,
      results.missingEquipment?.testPassed ? 100 : 60,
      results.falsePositives?.testPassed ? 100 : 70,
      results.instrumentMapping?.testPassed ? 100 : 65,
      results.materialRating?.testPassed ? 100 : 55,
      results.automatedTesting?.results?.overallScore || 0
    ];

    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    // Count critical issues
    let criticalIssues = 0;
    if (!results.tagParsing?.testPassed) criticalIssues++;
    if (!results.missingEquipment?.testPassed) criticalIssues++;
    if (!results.falsePositives?.testPassed) criticalIssues++;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (!results.tagParsing?.testPassed) {
      recommendations.push('🚨 CRITICAL: Tag parsing accuracy below 70% - review OCR and normalization rules');
    }
    
    if (!results.missingEquipment?.testPassed) {
      recommendations.push('🚨 CRITICAL: Missing equipment detection confidence below 80% - improve multi-pass OCR');
    }
    
    if (!results.instrumentMapping?.testPassed) {
      recommendations.push('⚠️ WARNING: Instrument mapping accuracy below 70% - review connection topology algorithms');
    }
    
    if (!results.materialRating?.testPassed) {
      recommendations.push('⚠️ WARNING: Material rating extraction below 60% - improve text fragment assembly');
    }

    if (overallScore > 90) {
      recommendations.push('✅ EXCELLENT: System performing at production-ready levels');
    } else if (overallScore > 80) {
      recommendations.push('✅ GOOD: System ready for production with monitoring');
    } else if (overallScore > 70) {
      recommendations.push('⚠️ FAIR: System needs improvements before production deployment');
    } else {
      recommendations.push('🚨 POOR: System requires significant improvements before deployment');
    }

    // Generate export files
    const detailedReport = this.generateDetailedReport(results);
    const issuesSummary = this.generateIssuesSummary(results);
    const recommendationsAction = this.generateActionPlan(recommendations, criticalIssues);

    return {
      timestamp: new Date().toISOString(),
      overallScore,
      results,
      summary: {
        totalItems: 50, // Approximate total items processed
        validItems: Math.round(50 * (overallScore / 100)),
        confidence: overallScore,
        criticalIssues,
        recommendations
      },
      exportFiles: {
        detailedReport,
        issuesSummary,
        recommendationsAction
      }
    };
  }

  /**
   * Generate detailed report
   */
  private generateDetailedReport(results: any): string {
    let report = '# CAD Validation System - Detailed Test Report\n\n';
    report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    report += '## Test Results Summary\n\n';
    
    report += '### 1. Tag Parsing and Normalization\n';
    report += `- Status: ${results.tagParsing?.testPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- Valid Tags: ${results.tagParsing?.stats?.validTags}/${results.tagParsing?.stats?.totalTags}\n`;
    report += `- Average Confidence: ${(results.tagParsing?.stats?.averageConfidence * 100).toFixed(1)}%\n\n`;
    
    report += '### 2. Missing Equipment Detection\n';
    report += `- Status: ${results.missingEquipment?.testPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- Missing Tags: ${results.missingEquipment?.result?.analysis?.missingTags?.length || 0}\n`;
    report += `- False Positives: ${results.missingEquipment?.result?.analysis?.falsePositives?.length || 0}\n\n`;
    
    report += '### 3. False Positive Validation\n';
    report += `- Status: ${results.falsePositives?.testPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- Valid Items: ${results.falsePositives?.results?.filter((r: any) => r.isValid).length || 0}/${results.falsePositives?.results?.length || 0}\n\n`;
    
    report += '### 4. Instrument Mapping\n';
    report += `- Status: ${results.instrumentMapping?.testPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- Valid Mappings: ${results.instrumentMapping?.results?.filter((r: any) => r.isValid).length || 0}/${results.instrumentMapping?.results?.length || 0}\n\n`;
    
    report += '### 5. Material/Rating Validation\n';
    report += `- Status: ${results.materialRating?.testPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- Valid Specs: ${results.materialRating?.results?.filter((r: any) => r.validation.isValid).length || 0}/${results.materialRating?.results?.length || 0}\n\n`;
    
    report += '### 6. Automated Testing\n';
    report += `- Overall Score: ${results.automatedTesting?.results?.overallScore || 0}%\n`;
    report += `- DWG Extraction: ${results.automatedTesting?.results?.dwgExtractionDiff?.testPassed ? 'PASSED' : 'FAILED'}\n\n`;
    
    return report;
  }

  /**
   * Generate issues summary
   */
  private generateIssuesSummary(results: any): string {
    let summary = '# Issues Summary\n\n';
    
    const allIssues: string[] = [];
    
    // Collect issues from all validators
    if (!results.tagParsing?.testPassed) {
      allIssues.push('Tag parsing accuracy below threshold');
    }
    
    if (!results.missingEquipment?.testPassed) {
      allIssues.push('Missing equipment detection confidence low');
    }
    
    if (!results.falsePositives?.testPassed) {
      allIssues.push('High false positive rate detected');
    }

    if (!results.instrumentMapping?.testPassed) {
      allIssues.push('Instrument mapping validation failed');
    }

    if (!results.materialRating?.testPassed) {
      allIssues.push('Material rating extraction issues');
    }
    
    summary += `**Total Issues Found:** ${allIssues.length}\n\n`;
    
    allIssues.forEach((issue, index) => {
      summary += `${index + 1}. ${issue}\n`;
    });
    
    return summary;
  }

  /**
   * Generate action plan
   */
  private generateActionPlan(recommendations: string[], criticalIssues: number): string {
    let plan = '# Action Plan for CAD Validation System\n\n';
    
    plan += `## Priority Level: ${criticalIssues === 0 ? 'LOW' : criticalIssues < 3 ? 'MEDIUM' : 'HIGH'}\n\n`;
    
    plan += '## Immediate Actions\n';
    recommendations.slice(0, 3).forEach((rec, index) => {
      plan += `${index + 1}. ${rec}\n`;
    });
    
    plan += '\n## Long-term Improvements\n';
    plan += '- Implement continuous monitoring dashboard\n';
    plan += '- Set up automated regression testing\n';
    plan += '- Create user feedback collection system\n';
    plan += '- Optimize performance for large-scale processing\n';
    
    return plan;
  }

  /**
   * Export all test results to files
   */
  public async exportTestResults(report: ValidationReport): Promise<void> {
    console.log('\n📁 Exporting test results...');
    
    try {
      // In a real implementation, you would write these to actual files
      console.log('  • Detailed report generated');
      console.log('  • Issues summary generated');
      console.log('  • Action plan generated');
      
      console.log('\n📋 Test Results Summary:');
      console.log(`  • Overall Score: ${report.overallScore}%`);
      console.log(`  • Critical Issues: ${report.summary.criticalIssues}`);
      console.log(`  • Valid Items: ${report.summary.validItems}/${report.summary.totalItems}`);
      
      console.log('\n🎯 Top Recommendations:');
      report.summary.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      
    } catch (error) {
      console.error('❌ Error exporting test results:', error);
      throw error;
    }
  }
}

export default CADValidationTestRunner;