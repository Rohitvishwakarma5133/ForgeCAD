/**
 * Automated Testing Framework
 * Addresses testing requirements for validation and quality assurance
 */

import TagParser from './tag-parser';
import MissingEquipmentDetector, { DWGEntity, ExtractedTag } from './missing-equipment-detector';
import FalsePositiveValidator from './false-positive-validator';

export interface TestConfig {
  dwgToExtractedThreshold: number; // Fail if >2% discrepancy by default
  confidenceThreshold: number; // Items with >90% confidence but fail rules
  sampleSize: number; // Number of items for random sampling
  visualDiffEnabled: boolean;
}

export interface DWGExtractionDiff {
  dwgTags: string[];
  extractedTags: string[];
  missing: string[];
  extra: string[];
  matched: Array<{ dwg: string; extracted: string; similarity: number }>;
  discrepancyPercentage: number;
  testPassed: boolean;
}

export interface ConfidenceCalibrationItem {
  tag: string;
  confidence: number;
  actualValidity: boolean;
  ruleViolations: string[];
  geometry: { x: number; y: number; width: number; height: number };
}

export interface VisualDiffItem {
  id: string;
  type: 'symbol' | 'tag' | 'missing' | 'false_positive';
  dwgGeometry?: { x: number; y: number; width: number; height: number };
  extractedGeometry?: { x: number; y: number; width: number; height: number };
  status: 'match' | 'missing_in_extracted' | 'missing_in_dwg' | 'mismatch';
  confidence?: number;
  notes: string[];
}

export interface TestReport {
  timestamp: string;
  config: TestConfig;
  dwgExtractionDiff: DWGExtractionDiff;
  confidenceCalibration: {
    items: ConfidenceCalibrationItem[];
    overconfidentCount: number;
    underconfidentCount: number;
    calibrationScore: number; // 0-1, where 1 is perfectly calibrated
  };
  visualDiff: {
    items: VisualDiffItem[];
    summary: {
      totalItems: number;
      matches: number;
      missingInExtracted: number;
      missingInDWG: number;
      mismatches: number;
    };
  };
  overallScore: number;
  recommendations: string[];
}

export class AutomatedTestingFramework {
  private tagParser: TagParser;
  private missingEquipmentDetector: MissingEquipmentDetector;
  private falsePositiveValidator: FalsePositiveValidator;
  private config: TestConfig;

  constructor(config: Partial<TestConfig> = {}) {
    this.tagParser = new TagParser();
    this.missingEquipmentDetector = new MissingEquipmentDetector();
    this.falsePositiveValidator = new FalsePositiveValidator();
    
    this.config = {
      dwgToExtractedThreshold: 2.0, // 2% threshold
      confidenceThreshold: 90.0, // 90% confidence threshold
      sampleSize: 50,
      visualDiffEnabled: true,
      ...config
    };
  }

  /**
   * Run comprehensive test suite
   */
  public async runTestSuite(
    dwgEntities: DWGEntity[],
    extractedTags: ExtractedTag[]
  ): Promise<TestReport> {
    const timestamp = new Date().toISOString();
    
    console.log('🧪 Starting automated test suite...');
    
    // Test 1: DWG to Extracted Tag Diff Report
    console.log('📊 Running DWG vs Extracted tag comparison...');
    const dwgExtractionDiff = await this.generateDWGExtractionDiff(dwgEntities, extractedTags);
    
    // Test 2: Confidence Calibration Analysis
    console.log('🎯 Analyzing confidence calibration...');
    const confidenceCalibration = await this.analyzeConfidenceCalibration(extractedTags);
    
    // Test 3: Visual Diff Export (if enabled)
    let visualDiff: TestReport['visualDiff'];
    if (this.config.visualDiffEnabled) {
      console.log('👁️  Generating visual diff report...');
      visualDiff = await this.generateVisualDiff(dwgEntities, extractedTags);
    } else {
      visualDiff = {
        items: [],
        summary: { totalItems: 0, matches: 0, missingInExtracted: 0, missingInDWG: 0, mismatches: 0 }
      };
    }

    // Calculate overall score and generate recommendations
    const overallScore = this.calculateOverallScore(dwgExtractionDiff, confidenceCalibration);
    const recommendations = this.generateRecommendations(dwgExtractionDiff, confidenceCalibration, visualDiff);

    console.log('✅ Test suite completed');

    return {
      timestamp,
      config: this.config,
      dwgExtractionDiff,
      confidenceCalibration,
      visualDiff,
      overallScore,
      recommendations
    };
  }

  /**
   * Generate DWG vs Extracted tag diff report
   */
  private async generateDWGExtractionDiff(
    dwgEntities: DWGEntity[],
    extractedTags: ExtractedTag[]
  ): Promise<DWGExtractionDiff> {
    // Extract tags from DWG entities
    const dwgTags = dwgEntities
      .filter(entity => entity.text || entity.name)
      .map(entity => entity.text || entity.name || '')
      .filter(tag => {
        const parseResult = this.tagParser.parseTag(tag);
        return parseResult.category !== 'unknown' && parseResult.confidence > 0.3;
      })
      .map(tag => this.tagParser.parseTag(tag).normalizedTag);

    const extractedTagStrings = extractedTags.map(tag => tag.tag);

    // Find matches using fuzzy matching
    const matched: Array<{ dwg: string; extracted: string; similarity: number }> = [];
    const dwgTagsUsed = new Set<string>();
    const extractedTagsUsed = new Set<string>();

    for (const dwgTag of dwgTags) {
      if (dwgTagsUsed.has(dwgTag)) continue;

      let bestMatch: { extracted: string; similarity: number } | null = null;
      
      for (const extractedTag of extractedTagStrings) {
        if (extractedTagsUsed.has(extractedTag)) continue;

        const similarity = this.calculateStringSimilarity(dwgTag, extractedTag);
        
        if (similarity > 0.8 && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { extracted: extractedTag, similarity };
        }
      }

      if (bestMatch) {
        matched.push({
          dwg: dwgTag,
          extracted: bestMatch.extracted,
          similarity: bestMatch.similarity
        });
        dwgTagsUsed.add(dwgTag);
        extractedTagsUsed.add(bestMatch.extracted);
      }
    }

    const missing = dwgTags.filter(tag => !dwgTagsUsed.has(tag));
    const extra = extractedTagStrings.filter(tag => !extractedTagsUsed.has(tag));

    const discrepancyPercentage = dwgTags.length > 0 ? 
      ((missing.length + extra.length) / dwgTags.length) * 100 : 0;

    const testPassed = discrepancyPercentage <= this.config.dwgToExtractedThreshold;

    return {
      dwgTags,
      extractedTags: extractedTagStrings,
      missing,
      extra,
      matched,
      discrepancyPercentage,
      testPassed
    };
  }

  /**
   * Analyze confidence calibration
   */
  private async analyzeConfidenceCalibration(
    extractedTags: ExtractedTag[]
  ): Promise<TestReport['confidenceCalibration']> {
    const items: ConfidenceCalibrationItem[] = [];
    
    for (const tag of extractedTags) {
      const parseResult = this.tagParser.parseTag(tag.tag);
      const ruleViolations: string[] = [];

      // Check against validation rules
      if (parseResult.issues.length > 0) {
        ruleViolations.push(...parseResult.issues);
      }

      // Geometric validation
      if (tag.geometry.width < 5 || tag.geometry.height < 5) {
        ruleViolations.push('Suspiciously small text geometry');
      }

      // Pattern validation
      if (parseResult.category === 'unknown') {
        ruleViolations.push('Tag does not match known patterns');
      }

      const actualValidity = ruleViolations.length === 0 || 
        !ruleViolations.some(v => v.includes('OCR error') || v.includes('unknown'));

      items.push({
        tag: tag.tag,
        confidence: tag.confidence * 100, // Convert to percentage
        actualValidity,
        ruleViolations,
        geometry: tag.geometry
      });
    }

    // Find overconfident items (high confidence but invalid)
    const overconfidentItems = items.filter(item => 
      item.confidence >= this.config.confidenceThreshold && !item.actualValidity
    );

    // Find underconfident items (low confidence but valid)
    const underconfidentItems = items.filter(item =>
      item.confidence < this.config.confidenceThreshold && item.actualValidity
    );

    // Calculate calibration score using reliability diagram approach
    const calibrationScore = this.calculateCalibrationScore(items);

    return {
      items,
      overconfidentCount: overconfidentItems.length,
      underconfidentCount: underconfidentItems.length,
      calibrationScore
    };
  }

  /**
   * Generate visual diff report
   */
  private async generateVisualDiff(
    dwgEntities: DWGEntity[],
    extractedTags: ExtractedTag[]
  ): Promise<TestReport['visualDiff']> {
    const items: VisualDiffItem[] = [];

    // Process DWG entities
    for (const dwgEntity of dwgEntities) {
      const entityTag = dwgEntity.text || dwgEntity.name || '';
      if (!entityTag) continue;

      // Find corresponding extracted tag
      const correspondingExtracted = extractedTags.find(tag => {
        const similarity = this.calculateStringSimilarity(entityTag, tag.tag);
        return similarity > 0.8;
      });

      if (correspondingExtracted) {
        // Check if positions match reasonably well
        const spatialDistance = this.calculateSpatialDistance(
          dwgEntity.geometry,
          correspondingExtracted.geometry
        );

        const status = spatialDistance < 50 ? 'match' : 'mismatch';

        items.push({
          id: `dwg-${dwgEntity.id}`,
          type: dwgEntity.type === 'block' ? 'symbol' : 'tag',
          dwgGeometry: dwgEntity.geometry,
          extractedGeometry: correspondingExtracted.geometry,
          status,
          confidence: correspondingExtracted.confidence,
          notes: status === 'mismatch' ? 
            [`Spatial distance: ${spatialDistance.toFixed(1)}px`] : 
            ['Positions match well']
        });
      } else {
        items.push({
          id: `missing-${dwgEntity.id}`,
          type: dwgEntity.type === 'block' ? 'symbol' : 'tag',
          dwgGeometry: dwgEntity.geometry,
          status: 'missing_in_extracted',
          notes: [`Tag "${entityTag}" found in DWG but not extracted`]
        });
      }
    }

    // Process extracted tags without DWG correspondence
    for (const extractedTag of extractedTags) {
      const hasDWGCorrespondence = dwgEntities.some(entity => {
        const entityTag = entity.text || entity.name || '';
        return this.calculateStringSimilarity(entityTag, extractedTag.tag) > 0.8;
      });

      if (!hasDWGCorrespondence) {
        items.push({
          id: `extra-${extractedTag.tag}`,
          type: 'false_positive',
          extractedGeometry: extractedTag.geometry,
          status: 'missing_in_dwg',
          confidence: extractedTag.confidence,
          notes: [`Tag "${extractedTag.tag}" extracted but not found in DWG`]
        });
      }
    }

    // Generate summary
    const summary = {
      totalItems: items.length,
      matches: items.filter(i => i.status === 'match').length,
      missingInExtracted: items.filter(i => i.status === 'missing_in_extracted').length,
      missingInDWG: items.filter(i => i.status === 'missing_in_dwg').length,
      mismatches: items.filter(i => i.status === 'mismatch').length
    };

    return { items, summary };
  }

  /**
   * Calculate overall test score
   */
  private calculateOverallScore(
    dwgDiff: DWGExtractionDiff,
    calibration: TestReport['confidenceCalibration']
  ): number {
    const weights = {
      extraction: 0.4, // 40% weight for extraction accuracy
      calibration: 0.3, // 30% weight for confidence calibration
      precision: 0.3 // 30% weight for precision (avoiding false positives)
    };

    // Extraction score (0-1, where 1 is perfect)
    const extractionScore = dwgDiff.testPassed ? 
      Math.max(0, 1 - (dwgDiff.discrepancyPercentage / 100)) : 0;

    // Calibration score (already 0-1)
    const calibrationScore = calibration.calibrationScore;

    // Precision score based on false positives
    const precisionScore = calibration.items.length > 0 ?
      1 - (calibration.overconfidentCount / calibration.items.length) : 1;

    const overallScore = 
      extractionScore * weights.extraction +
      calibrationScore * weights.calibration +
      precisionScore * weights.precision;

    return Math.round(overallScore * 100); // Convert to percentage
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(
    dwgDiff: DWGExtractionDiff,
    calibration: TestReport['confidenceCalibration'],
    visualDiff: TestReport['visualDiff']
  ): string[] {
    const recommendations: string[] = [];

    // DWG extraction recommendations
    if (!dwgDiff.testPassed) {
      recommendations.push(
        `❌ DWG extraction test FAILED: ${dwgDiff.discrepancyPercentage.toFixed(1)}% discrepancy ` +
        `(threshold: ${this.config.dwgToExtractedThreshold}%)`
      );
      
      if (dwgDiff.missing.length > 0) {
        recommendations.push(
          `🔍 ${dwgDiff.missing.length} tags missing from extraction. ` +
          `Consider multi-pass OCR or reviewing layer visibility.`
        );
      }
      
      if (dwgDiff.extra.length > 0) {
        recommendations.push(
          `⚠️  ${dwgDiff.extra.length} extra tags found in extraction. ` +
          `Review false positive detection and OCR noise filtering.`
        );
      }
    } else {
      recommendations.push(`✅ DWG extraction test PASSED`);
    }

    // Confidence calibration recommendations
    if (calibration.overconfidentCount > 0) {
      recommendations.push(
        `📊 ${calibration.overconfidentCount} overconfident predictions detected. ` +
        `Consider recalibrating confidence estimator.`
      );
    }

    if (calibration.calibrationScore < 0.8) {
      recommendations.push(
        `🎯 Confidence calibration score: ${(calibration.calibrationScore * 100).toFixed(1)}%. ` +
        `Review confidence calculation algorithm.`
      );
    }

    // Visual diff recommendations
    if (visualDiff.summary.mismatches > 0) {
      recommendations.push(
        `📍 ${visualDiff.summary.mismatches} spatial position mismatches detected. ` +
        `Review coordinate system calibration.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 All tests passed! System is performing well.');
    }

    return recommendations;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 || len2 === 0) return 0;
    if (str1 === str2) return 1;

    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * Calculate spatial distance between geometries
   */
  private calculateSpatialDistance(
    geom1: { x: number; y: number; width?: number; height?: number },
    geom2: { x: number; y: number; width: number; height: number }
  ): number {
    const center1 = {
      x: geom1.x + (geom1.width || 0) / 2,
      y: geom1.y + (geom1.height || 0) / 2
    };
    
    const center2 = {
      x: geom2.x + geom2.width / 2,
      y: geom2.y + geom2.height / 2
    };

    return Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
  }

  /**
   * Calculate calibration score using reliability diagram approach
   */
  private calculateCalibrationScore(items: ConfidenceCalibrationItem[]): number {
    if (items.length === 0) return 1;

    // Group items into confidence bins
    const binSize = 10; // 10% bins
    const bins: { [key: number]: { correct: number; total: number } } = {};

    for (const item of items) {
      const binIndex = Math.floor(item.confidence / binSize) * binSize;
      if (!bins[binIndex]) {
        bins[binIndex] = { correct: 0, total: 0 };
      }
      
      bins[binIndex].total++;
      if (item.actualValidity) {
        bins[binIndex].correct++;
      }
    }

    // Calculate Expected Calibration Error (ECE)
    let ece = 0;
    const totalItems = items.length;

    for (const [binIndex, bin] of Object.entries(bins)) {
      const binConfidence = parseInt(binIndex) + binSize / 2; // Mid-point of bin
      const binAccuracy = bin.correct / bin.total;
      const binWeight = bin.total / totalItems;
      
      ece += binWeight * Math.abs(binConfidence / 100 - binAccuracy);
    }

    // Return calibration score (1 - ECE, where lower ECE is better)
    return Math.max(0, 1 - ece);
  }

  /**
   * Export test report as detailed markdown
   */
  public exportTestReport(report: TestReport): string {
    let output = `# Automated Test Report\n`;
    output += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
    output += `**Overall Score:** ${report.overallScore}% 🎯\n\n`;

    output += `## Configuration\n`;
    output += `- DWG-to-Extracted Threshold: ${report.config.dwgToExtractedThreshold}%\n`;
    output += `- Confidence Threshold: ${report.config.confidenceThreshold}%\n`;
    output += `- Sample Size: ${report.config.sampleSize}\n`;
    output += `- Visual Diff Enabled: ${report.config.visualDiffEnabled}\n\n`;

    output += `## DWG vs Extracted Comparison\n`;
    output += `- **Test Status:** ${report.dwgExtractionDiff.testPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    output += `- **Discrepancy:** ${report.dwgExtractionDiff.discrepancyPercentage.toFixed(1)}%\n`;
    output += `- **DWG Tags:** ${report.dwgExtractionDiff.dwgTags.length}\n`;
    output += `- **Extracted Tags:** ${report.dwgExtractionDiff.extractedTags.length}\n`;
    output += `- **Missing from Extraction:** ${report.dwgExtractionDiff.missing.length}\n`;
    output += `- **Extra in Extraction:** ${report.dwgExtractionDiff.extra.length}\n`;
    output += `- **Successful Matches:** ${report.dwgExtractionDiff.matched.length}\n\n`;

    if (report.dwgExtractionDiff.missing.length > 0) {
      output += `### Missing Tags\n`;
      report.dwgExtractionDiff.missing.slice(0, 10).forEach(tag => {
        output += `- ${tag}\n`;
      });
      if (report.dwgExtractionDiff.missing.length > 10) {
        output += `- ... and ${report.dwgExtractionDiff.missing.length - 10} more\n`;
      }
      output += '\n';
    }

    output += `## Confidence Calibration\n`;
    output += `- **Calibration Score:** ${(report.confidenceCalibration.calibrationScore * 100).toFixed(1)}%\n`;
    output += `- **Overconfident Items:** ${report.confidenceCalibration.overconfidentCount}\n`;
    output += `- **Underconfident Items:** ${report.confidenceCalibration.underconfidentCount}\n`;
    output += `- **Total Analyzed:** ${report.confidenceCalibration.items.length}\n\n`;

    output += `## Visual Diff Summary\n`;
    output += `- **Total Items:** ${report.visualDiff.summary.totalItems}\n`;
    output += `- **Matches:** ${report.visualDiff.summary.matches}\n`;
    output += `- **Missing in Extracted:** ${report.visualDiff.summary.missingInExtracted}\n`;
    output += `- **Missing in DWG:** ${report.visualDiff.summary.missingInDWG}\n`;
    output += `- **Position Mismatches:** ${report.visualDiff.summary.mismatches}\n\n`;

    output += `## Recommendations\n`;
    report.recommendations.forEach(rec => {
      output += `- ${rec}\n`;
    });

    return output;
  }
}

export default AutomatedTestingFramework;