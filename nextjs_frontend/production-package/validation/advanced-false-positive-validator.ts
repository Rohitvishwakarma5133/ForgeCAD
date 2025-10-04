/**
 * Advanced False Positive Validator - Production Implementation
 * Addresses Critical Issue #2: False positives from OCR noise
 * 
 * ACCEPTANCE CRITERIA:
 * - Symbol + tag cross-validation: symbol_confidence ≥ 0.85 AND tag proximity ≤ 25mm
 * - Eliminate ghost detections from image artifacts, shadows, grid lines
 * - Two-pass validation: individual confidence + spatial correlation
 * - Report false positive rate ≤ 5% for production use
 */

import EnhancedTagParser, { TagCategory } from './enhanced-tag-parser';

export interface DetectedSymbol {
  id: string;
  type: 'equipment' | 'instrument' | 'valve' | 'vessel' | 'pump' | 'fitting';
  confidence: number;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  attributes?: {
    symbolName?: string;
    layer?: string;
    color?: string;
    lineWeight?: number;
  };
  source: 'template_match' | 'ml_detection' | 'dwg_block';
}

export interface ExtractedTag {
  id: string;
  tag: string;
  confidence: number;
  source: 'ocr_100' | 'ocr_200' | 'ocr_400' | 'dwg_attribute' | 'dwg_text';
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ocrMetadata?: {
    characterConfidences: number[];
    preprocessingSteps: string[];
    recognizedFont?: string;
  };
}

export interface CrossValidationPair {
  symbol: DetectedSymbol;
  tag: ExtractedTag;
  distance: number;
  spatialMatch: boolean;
  semanticMatch: boolean;
  combinedConfidence: number;
  validationStatus: 'VALID' | 'SUSPICIOUS' | 'FALSE_POSITIVE';
  validationReasons: string[];
}

export interface FalsePositiveValidationResult {
  testPassed: boolean;
  falsePositiveRate: number;
  summary: {
    totalSymbols: number;
    totalTags: number;
    validatedPairs: number;
    validPairs: number;
    suspiciousPairs: number;
    falsePositives: number;
    orphanedSymbols: number;
    orphanedTags: number;
  };
  validatedPairs: CrossValidationPair[];
  falsePositives: Array<{
    type: 'orphaned_symbol' | 'orphaned_tag' | 'confidence_mismatch' | 'spatial_mismatch' | 'semantic_mismatch';
    item: DetectedSymbol | ExtractedTag;
    reason: string;
    confidence: number;
    nearestMatch?: DetectedSymbol | ExtractedTag;
    distance?: number;
  }>;
  recommendations: string[];
  confidenceAnalysis: {
    symbolConfidenceDistribution: { range: string; count: number }[];
    tagConfidenceDistribution: { range: string; count: number }[];
    optimalThresholds: {
      symbolConfidence: number;
      tagConfidence: number;
      proximityThreshold: number;
    };
  };
}

export class AdvancedFalsePositiveValidator {
  // Production thresholds from specification
  private static readonly SYMBOL_CONFIDENCE_THRESHOLD = 0.85;
  private static readonly TAG_PROXIMITY_THRESHOLD = 25; // mm
  private static readonly FALSE_POSITIVE_RATE_THRESHOLD = 0.05; // 5%
  private static readonly COMBINED_CONFIDENCE_THRESHOLD = 0.80;
  
  // Semantic correlation rules
  private static readonly SYMBOL_TAG_CORRELATIONS = new Map([
    ['pump', ['P-', 'PUMP']],
    ['valve', ['V-', 'VALVE', 'CV-', 'PV-', 'SV-']],
    ['vessel', ['T-', 'TANK', 'V-', 'VESSEL']],
    ['instrument', ['LIC', 'PIC', 'FIC', 'TIC', 'PSV', 'PSH', 'LSV', 'FCV']],
    ['equipment', ['E-', 'EQ-', 'EQUIP']],
    ['fitting', ['FIT', 'CONN', 'JOINT']]
  ]);

  /**
   * Run complete false positive validation with cross-validation
   */
  public static async validateFalsePositives(
    detectedSymbols: DetectedSymbol[],
    extractedTags: ExtractedTag[]
  ): Promise<FalsePositiveValidationResult> {
    console.log('🔍 Starting advanced false positive validation...');
    
    // Step 1: Filter symbols and tags by confidence thresholds
    const qualifyingSymbols = this.filterSymbolsByConfidence(detectedSymbols);
    const qualifyingTags = this.filterTagsByConfidence(extractedTags);
    
    console.log(`📊 Qualified: ${qualifyingSymbols.length}/${detectedSymbols.length} symbols, ${qualifyingTags.length}/${extractedTags.length} tags`);
    
    // Step 2: Perform spatial proximity matching
    const spatialPairs = this.performSpatialMatching(qualifyingSymbols, qualifyingTags);
    
    // Step 3: Apply semantic cross-validation
    const validatedPairs = this.applyCrossValidation(spatialPairs);
    
    // Step 4: Identify false positives
    const falsePositives = this.identifyFalsePositives(
      detectedSymbols,
      extractedTags,
      validatedPairs
    );
    
    // Step 5: Calculate validation metrics
    const falsePositiveRate = falsePositives.length / Math.max(detectedSymbols.length + extractedTags.length, 1);
    const testPassed = falsePositiveRate <= this.FALSE_POSITIVE_RATE_THRESHOLD;
    
    // Step 6: Generate confidence analysis
    const confidenceAnalysis = this.analyzeConfidenceDistributions(detectedSymbols, extractedTags);
    
    // Step 7: Generate recommendations
    const recommendations = this.generateRecommendations(
      validatedPairs,
      falsePositives,
      confidenceAnalysis
    );
    
    const result: FalsePositiveValidationResult = {
      testPassed,
      falsePositiveRate,
      summary: {
        totalSymbols: detectedSymbols.length,
        totalTags: extractedTags.length,
        validatedPairs: validatedPairs.length,
        validPairs: validatedPairs.filter(p => p.validationStatus === 'VALID').length,
        suspiciousPairs: validatedPairs.filter(p => p.validationStatus === 'SUSPICIOUS').length,
        falsePositives: falsePositives.length,
        orphanedSymbols: detectedSymbols.length - validatedPairs.length,
        orphanedTags: extractedTags.length - validatedPairs.length
      },
      validatedPairs,
      falsePositives,
      recommendations,
      confidenceAnalysis
    };
    
    console.log(`${result.testPassed ? '✅' : '❌'} False positive validation: ${(falsePositiveRate * 100).toFixed(2)}% false positive rate`);
    
    return result;
  }
  
  /**
   * Filter symbols by confidence threshold
   */
  private static filterSymbolsByConfidence(symbols: DetectedSymbol[]): DetectedSymbol[] {
    return symbols.filter(symbol => symbol.confidence >= this.SYMBOL_CONFIDENCE_THRESHOLD);
  }
  
  /**
   * Filter tags by quality metrics
   */
  private static filterTagsByConfidence(tags: ExtractedTag[]): ExtractedTag[] {
    return tags.filter(tag => {
      // Base confidence threshold
      if (tag.confidence < 0.70) return false;
      
      // Enhanced validation using tag parser
      const validation = EnhancedTagParser.validateTag(tag.tag);
      if (!validation.isValid) return false;
      
      // Check OCR metadata quality if available
      if (tag.ocrMetadata?.characterConfidences) {
        const avgCharConfidence = tag.ocrMetadata.characterConfidences.reduce((sum, conf) => sum + conf, 0) / tag.ocrMetadata.characterConfidences.length;
        if (avgCharConfidence < 0.60) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Perform spatial proximity matching between symbols and tags
   */
  private static performSpatialMatching(
    symbols: DetectedSymbol[],
    tags: ExtractedTag[]
  ): Array<{ symbol: DetectedSymbol; tag: ExtractedTag; distance: number }> {
    const pairs: Array<{ symbol: DetectedSymbol; tag: ExtractedTag; distance: number }> = [];
    const usedTags = new Set<ExtractedTag>();
    
    // For each symbol, find the closest qualifying tag
    for (const symbol of symbols) {
      let bestMatch: { tag: ExtractedTag; distance: number } | null = null;
      
      for (const tag of tags) {
        if (usedTags.has(tag)) continue;
        
        const distance = this.calculateDistance(symbol.geometry, tag.geometry);
        
        if (distance <= this.TAG_PROXIMITY_THRESHOLD &&
            (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = { tag, distance };
        }
      }
      
      if (bestMatch) {
        pairs.push({
          symbol,
          tag: bestMatch.tag,
          distance: bestMatch.distance
        });
        usedTags.add(bestMatch.tag);
      }
    }
    
    return pairs;
  }
  
  /**
   * Apply cross-validation to spatial pairs
   */
  private static applyCrossValidation(
    pairs: Array<{ symbol: DetectedSymbol; tag: ExtractedTag; distance: number }>
  ): CrossValidationPair[] {
    return pairs.map(({ symbol, tag, distance }) => {
      const spatialMatch = distance <= this.TAG_PROXIMITY_THRESHOLD;
      const semanticMatch = this.checkSemanticCorrelation(symbol, tag);
      
      // Calculate combined confidence score
      const spatialScore = Math.max(0, 1 - (distance / this.TAG_PROXIMITY_THRESHOLD));
      const combinedConfidence = (symbol.confidence + tag.confidence + spatialScore) / 3;
      
      // Determine validation status
      let validationStatus: 'VALID' | 'SUSPICIOUS' | 'FALSE_POSITIVE';
      const validationReasons: string[] = [];
      
      if (symbol.confidence >= this.SYMBOL_CONFIDENCE_THRESHOLD &&
          spatialMatch && semanticMatch &&
          combinedConfidence >= this.COMBINED_CONFIDENCE_THRESHOLD) {
        validationStatus = 'VALID';
        validationReasons.push('High confidence symbol and tag with semantic correlation');
      } else if (combinedConfidence >= 0.65) {
        validationStatus = 'SUSPICIOUS';
        if (!semanticMatch) validationReasons.push('Semantic mismatch between symbol and tag');
        if (symbol.confidence < this.SYMBOL_CONFIDENCE_THRESHOLD) validationReasons.push('Low symbol confidence');
        if (!spatialMatch) validationReasons.push('Tags too far from symbol');
      } else {
        validationStatus = 'FALSE_POSITIVE';
        validationReasons.push('Low combined confidence score');
        if (symbol.confidence < 0.70) validationReasons.push('Very low symbol confidence');
        if (tag.confidence < 0.70) validationReasons.push('Very low tag confidence');
      }
      
      return {
        symbol,
        tag,
        distance,
        spatialMatch,
        semanticMatch,
        combinedConfidence,
        validationStatus,
        validationReasons
      };
    });
  }
  
  /**
   * Check semantic correlation between symbol type and tag content
   */
  private static checkSemanticCorrelation(symbol: DetectedSymbol, tag: ExtractedTag): boolean {
    const symbolType = symbol.type;
    const tagContent = tag.tag.toUpperCase();
    
    const correlatedPrefixes = this.SYMBOL_TAG_CORRELATIONS.get(symbolType) || [];
    
    // Check if tag starts with any correlated prefix
    const hasCorrelation = correlatedPrefixes.some(prefix => 
      tagContent.startsWith(prefix.toUpperCase())
    );
    
    if (hasCorrelation) return true;
    
    // Special cases for instruments
    if (symbolType === 'instrument') {
      const instrumentPatterns = [/^[A-Z]{1,4}[ICV]-?\d+/, /^PSV-?\d+/, /^[FPTL]I[CSV]-?\d+/];
      if (instrumentPatterns.some(pattern => pattern.test(tagContent))) {
        return true;
      }
    }
    
    // Fuzzy matching for common equipment types
    const fuzzyMatches = new Map([
      ['pump', ['PUMP', 'P-']],
      ['valve', ['VALVE', 'VLV']],
      ['vessel', ['TANK', 'VESSEL', 'TK']],
      ['equipment', ['EQUIP', 'EQ']]
    ]);
    
    const fuzzyPrefixes = fuzzyMatches.get(symbolType) || [];
    return fuzzyPrefixes.some(prefix => tagContent.includes(prefix));
  }
  
  /**
   * Identify false positives from unmatched items and low-confidence pairs
   */
  private static identifyFalsePositives(
    allSymbols: DetectedSymbol[],
    allTags: ExtractedTag[],
    validatedPairs: CrossValidationPair[]
  ): FalsePositiveValidationResult['falsePositives'] {
    const falsePositives: FalsePositiveValidationResult['falsePositives'] = [];
    
    // Get used symbols and tags
    const usedSymbolIds = new Set(validatedPairs.map(p => p.symbol.id));
    const usedTagIds = new Set(validatedPairs.map(p => p.tag.id));
    
    // Identify orphaned symbols (no matching tag)
    const orphanedSymbols = allSymbols.filter(symbol => !usedSymbolIds.has(symbol.id));
    for (const symbol of orphanedSymbols) {
      // Find nearest tag for analysis
      let nearestTag: ExtractedTag | undefined;
      let minDistance = Infinity;
      
      for (const tag of allTags) {
        const distance = this.calculateDistance(symbol.geometry, tag.geometry);
        if (distance < minDistance) {
          minDistance = distance;
          nearestTag = tag;
        }
      }
      
      falsePositives.push({
        type: 'orphaned_symbol',
        item: symbol,
        reason: `Symbol detected but no qualifying tag found within ${this.TAG_PROXIMITY_THRESHOLD}mm`,
        confidence: symbol.confidence,
        nearestMatch: nearestTag,
        distance: nearestTag ? minDistance : undefined
      });
    }
    
    // Identify orphaned tags (no matching symbol)
    const orphanedTags = allTags.filter(tag => !usedTagIds.has(tag.id));
    for (const tag of orphanedTags) {
      // Find nearest symbol for analysis
      let nearestSymbol: DetectedSymbol | undefined;
      let minDistance = Infinity;
      
      for (const symbol of allSymbols) {
        const distance = this.calculateDistance(symbol.geometry, tag.geometry);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSymbol = symbol;
        }
      }
      
      falsePositives.push({
        type: 'orphaned_tag',
        item: tag,
        reason: `Tag extracted but no qualifying symbol found within ${this.TAG_PROXIMITY_THRESHOLD}mm`,
        confidence: tag.confidence,
        nearestMatch: nearestSymbol,
        distance: nearestSymbol ? minDistance : undefined
      });
    }
    
    // Add false positive pairs from cross-validation
    const falsePositivePairs = validatedPairs.filter(pair => pair.validationStatus === 'FALSE_POSITIVE');
    for (const pair of falsePositivePairs) {
      falsePositives.push({
        type: 'confidence_mismatch',
        item: pair.symbol,
        reason: `Cross-validation failed: ${pair.validationReasons.join(', ')}`,
        confidence: pair.combinedConfidence,
        nearestMatch: pair.tag,
        distance: pair.distance
      });
    }
    
    return falsePositives;
  }
  
  /**
   * Analyze confidence distributions for optimization
   */
  private static analyzeConfidenceDistributions(
    symbols: DetectedSymbol[],
    tags: ExtractedTag[]
  ): FalsePositiveValidationResult['confidenceAnalysis'] {
    // Symbol confidence distribution
    const symbolRanges = [
      { range: '0.95-1.00', min: 0.95, max: 1.00 },
      { range: '0.90-0.95', min: 0.90, max: 0.95 },
      { range: '0.85-0.90', min: 0.85, max: 0.90 },
      { range: '0.80-0.85', min: 0.80, max: 0.85 },
      { range: '0.70-0.80', min: 0.70, max: 0.80 },
      { range: '0.00-0.70', min: 0.00, max: 0.70 }
    ];
    
    const symbolDistribution = symbolRanges.map(({ range, min, max }) => ({
      range,
      count: symbols.filter(s => s.confidence >= min && s.confidence < max).length
    }));
    
    const tagDistribution = symbolRanges.map(({ range, min, max }) => ({
      range,
      count: tags.filter(t => t.confidence >= min && t.confidence < max).length
    }));
    
    // Calculate optimal thresholds based on distribution
    const symbolConfidences = symbols.map(s => s.confidence).sort((a, b) => b - a);
    const tagConfidences = tags.map(t => t.confidence).sort((a, b) => b - a);
    
    const optimalSymbolThreshold = this.findOptimalThreshold(symbolConfidences, 0.15); // Keep 85% of symbols
    const optimalTagThreshold = this.findOptimalThreshold(tagConfidences, 0.20); // Keep 80% of tags
    
    return {
      symbolConfidenceDistribution: symbolDistribution,
      tagConfidenceDistribution: tagDistribution,
      optimalThresholds: {
        symbolConfidence: Math.max(optimalSymbolThreshold, this.SYMBOL_CONFIDENCE_THRESHOLD),
        tagConfidence: Math.max(optimalTagThreshold, 0.70),
        proximityThreshold: this.TAG_PROXIMITY_THRESHOLD
      }
    };
  }
  
  /**
   * Find optimal threshold to keep desired percentage of items
   */
  private static findOptimalThreshold(sortedConfidences: number[], rejectPercentage: number): number {
    const rejectCount = Math.floor(sortedConfidences.length * rejectPercentage);
    const keepCount = sortedConfidences.length - rejectCount;
    
    if (keepCount <= 0) return 0.90; // Fallback
    if (keepCount >= sortedConfidences.length) return 0.50; // Fallback
    
    return sortedConfidences[keepCount - 1];
  }
  
  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    validatedPairs: CrossValidationPair[],
    falsePositives: FalsePositiveValidationResult['falsePositives'],
    confidenceAnalysis: FalsePositiveValidationResult['confidenceAnalysis']
  ): string[] {
    const recommendations: string[] = [];
    
    // False positive rate recommendations
    const fpRate = falsePositives.length / Math.max(validatedPairs.length + falsePositives.length, 1);
    if (fpRate > 0.05) {
      recommendations.push(`🚨 High false positive rate: ${(fpRate * 100).toFixed(1)}% (target: ≤5%)`);
      recommendations.push('🔧 Increase symbol confidence threshold or reduce proximity threshold');
    }
    
    // Confidence threshold recommendations
    const lowConfidenceSymbols = falsePositives.filter(fp => 
      fp.type === 'orphaned_symbol' && fp.confidence < this.SYMBOL_CONFIDENCE_THRESHOLD
    ).length;
    
    if (lowConfidenceSymbols > 3) {
      recommendations.push(`📊 ${lowConfidenceSymbols} symbols below confidence threshold (${this.SYMBOL_CONFIDENCE_THRESHOLD})`);
      recommendations.push(`🎯 Consider raising symbol threshold to ${confidenceAnalysis.optimalThresholds.symbolConfidence.toFixed(2)}`);
    }
    
    // Semantic correlation recommendations
    const semanticMismatches = validatedPairs.filter(pair => !pair.semanticMatch).length;
    if (semanticMismatches > 0) {
      recommendations.push(`🔗 ${semanticMismatches} pairs with semantic mismatches`);
      recommendations.push('📝 Review symbol-tag correlation rules for equipment types');
    }
    
    // Spatial clustering recommendations
    const spatialMismatches = validatedPairs.filter(pair => !pair.spatialMatch).length;
    if (spatialMismatches > 0) {
      recommendations.push(`📏 ${spatialMismatches} pairs exceed proximity threshold (${this.TAG_PROXIMITY_THRESHOLD}mm)`);
      recommendations.push('🎯 Consider adjusting proximity threshold or improving spatial alignment');
    }
    
    // OCR quality recommendations
    const lowOcrTags = falsePositives.filter(fp => 
      fp.type === 'orphaned_tag' && fp.confidence < 0.80
    ).length;
    
    if (lowOcrTags > 2) {
      recommendations.push(`📑 ${lowOcrTags} tags with low OCR confidence`);
      recommendations.push('🔍 Implement multi-scale OCR preprocessing or font-specific training');
    }
    
    // Distribution balance recommendations
    const symbolCount = confidenceAnalysis.symbolConfidenceDistribution.reduce((sum, d) => sum + d.count, 0);
    const tagCount = confidenceAnalysis.tagConfidenceDistribution.reduce((sum, d) => sum + d.count, 0);
    const imbalance = Math.abs(symbolCount - tagCount) / Math.max(symbolCount, tagCount);
    
    if (imbalance > 0.20) {
      recommendations.push(`⚖️ Significant imbalance: ${symbolCount} symbols vs ${tagCount} tags`);
      recommendations.push('🔄 Review detection pipeline - symbols and tags should have similar counts');
    }
    
    return recommendations;
  }
  
  /**
   * Calculate distance between geometric entities
   */
  private static calculateDistance(
    geom1: { x: number; y: number; width: number; height: number },
    geom2: { x: number; y: number; width: number; height: number }
  ): number {
    const center1 = {
      x: geom1.x + geom1.width / 2,
      y: geom1.y + geom1.height / 2
    };
    
    const center2 = {
      x: geom2.x + geom2.width / 2,
      y: geom2.y + geom2.height / 2
    };
    
    return Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
  }
  
  /**
   * Export detailed validation report
   */
  public static exportValidationReport(result: FalsePositiveValidationResult): string {
    let report = '# Advanced False Positive Validation Report\n\n';
    
    // Status header
    const status = result.testPassed ? '✅ PASSED' : '❌ FAILED';
    report += `## Overall Status: ${status}\n\n`;
    
    // Executive Summary
    report += `## Executive Summary\n`;
    report += `- **False Positive Rate**: ${(result.falsePositiveRate * 100).toFixed(2)}% (Threshold: ≤5.0%)\n`;
    report += `- **Total Detections**: ${result.summary.totalSymbols} symbols, ${result.summary.totalTags} tags\n`;
    report += `- **Cross-Validated Pairs**: ${result.summary.validatedPairs}\n`;
    report += `- **Valid Pairs**: ${result.summary.validPairs} (${((result.summary.validPairs / Math.max(result.summary.validatedPairs, 1)) * 100).toFixed(1)}%)\n`;
    report += `- **Suspicious Pairs**: ${result.summary.suspiciousPairs}\n`;
    report += `- **False Positives**: ${result.summary.falsePositives}\n`;
    report += `- **Orphaned Items**: ${result.summary.orphanedSymbols} symbols, ${result.summary.orphanedTags} tags\n\n`;
    
    // Confidence Analysis
    report += `## Confidence Distribution Analysis\n`;
    report += `### Symbol Confidence Distribution\n`;
    result.confidenceAnalysis.symbolConfidenceDistribution.forEach(({ range, count }) => {
      report += `- ${range}: ${count} symbols\n`;
    });
    
    report += `\n### Tag Confidence Distribution\n`;
    result.confidenceAnalysis.tagConfidenceDistribution.forEach(({ range, count }) => {
      report += `- ${range}: ${count} tags\n`;
    });
    
    report += `\n### Optimal Thresholds\n`;
    report += `- **Symbol Confidence**: ${result.confidenceAnalysis.optimalThresholds.symbolConfidence.toFixed(3)}\n`;
    report += `- **Tag Confidence**: ${result.confidenceAnalysis.optimalThresholds.tagConfidence.toFixed(3)}\n`;
    report += `- **Proximity Threshold**: ${result.confidenceAnalysis.optimalThresholds.proximityThreshold}mm\n\n`;
    
    // False Positives Details (top 10)
    if (result.falsePositives.length > 0) {
      report += `## False Positives Details (Top 10)\n`;
      result.falsePositives.slice(0, 10).forEach((fp, index) => {
        const itemType = 'type' in fp.item ? 'symbol' : 'tag';
        const itemId = fp.item.id;
        report += `${index + 1}. **${itemType.toUpperCase()} ${itemId}** (${fp.type})\n`;
        report += `   - Confidence: ${(fp.confidence * 100).toFixed(1)}%\n`;
        report += `   - Reason: ${fp.reason}\n`;
        if (fp.distance) {
          report += `   - Distance to nearest match: ${fp.distance.toFixed(1)}mm\n`;
        }
        report += '\n';
      });
      
      if (result.falsePositives.length > 10) {
        report += `   ... and ${result.falsePositives.length - 10} more false positives\n\n`;
      }
    }
    
    // Recommendations
    if (result.recommendations.length > 0) {
      report += `## Recommendations\n`;
      result.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }
    
    // Valid Pairs Sample (top 5)
    const validPairs = result.validatedPairs.filter(pair => pair.validationStatus === 'VALID');
    if (validPairs.length > 0) {
      report += `## Sample Valid Cross-Validations (Top 5)\n`;
      validPairs.slice(0, 5).forEach((pair, index) => {
        report += `${index + 1}. **${pair.symbol.type.toUpperCase()}** ↔ **${pair.tag.tag}**\n`;
        report += `   - Combined Confidence: ${(pair.combinedConfidence * 100).toFixed(1)}%\n`;
        report += `   - Distance: ${pair.distance.toFixed(1)}mm\n`;
        report += `   - Semantic Match: ${pair.semanticMatch ? 'Yes' : 'No'}\n`;
        report += '\n';
      });
    }
    
    return report;
  }
}

export default AdvancedFalsePositiveValidator;