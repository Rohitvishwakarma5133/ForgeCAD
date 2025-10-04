/**
 * False Positive Validation System
 * Addresses issue #2 (false positives/ghost items not in DWG)
 */

export interface SymbolTemplate {
  id: string;
  name: string;
  category: 'pump' | 'valve' | 'instrument' | 'vessel' | 'equipment';
  geometry: {
    width: number;
    height: number;
    keyPoints: Array<{ x: number; y: number; type: 'connection' | 'center' | 'label' }>;
  };
  expectedTags: {
    pattern: RegExp;
    proximity: number; // pixels
    relativePosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  }[];
}

export interface DetectedSymbol {
  id: string;
  confidence: number;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  template: SymbolTemplate;
  nearbyTags: ExtractedTag[];
}

export interface ExtractedTag {
  tag: string;
  confidence: number;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  source: 'ocr' | 'dwg_text' | 'attribute';
}

export interface ValidationResult {
  item: DetectedSymbol | ExtractedTag;
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: 'geometry' | 'symbol_tag_mismatch' | 'orphaned_tag' | 'duplicate' | 'low_confidence';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedArea?: { x: number; y: number; width: number; height: number };
}

export class FalsePositiveValidator {
  private symbolTemplates: SymbolTemplate[] = [];
  private validationRules: ValidationRule[] = [];

  constructor() {
    this.initializeSymbolTemplates();
    this.initializeValidationRules();
  }

  /**
   * Main validation method - checks for false positives
   */
  public validateExtraction(
    detectedSymbols: DetectedSymbol[],
    extractedTags: ExtractedTag[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Validate symbols
    for (const symbol of detectedSymbols) {
      const symbolResult = this.validateSymbol(symbol, extractedTags);
      results.push(symbolResult);
    }

    // Validate orphaned tags (tags without nearby symbols)
    const orphanedTags = this.findOrphanedTags(extractedTags, detectedSymbols);
    for (const tag of orphanedTags) {
      const tagResult = this.validateOrphanedTag(tag, detectedSymbols);
      results.push(tagResult);
    }

    return results;
  }

  /**
   * Validate a detected symbol for false positives
   */
  private validateSymbol(symbol: DetectedSymbol, allTags: ExtractedTag[]): ValidationResult {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let confidence = symbol.confidence;

    // Rule 1: Symbol must have at least one nearby tag
    const nearbyTags = this.findNearbyTags(symbol, allTags);
    if (nearbyTags.length === 0) {
      issues.push({
        type: 'orphaned_tag',
        severity: 'high',
        description: 'Symbol detected without any nearby identifying tags',
        affectedArea: symbol.geometry
      });
      confidence *= 0.3;
      recommendations.push('Verify symbol detection accuracy - symbols should have identifying tags nearby');
    }

    // Rule 2: Symbol geometry should match template expectations
    const geometryValidation = this.validateGeometry(symbol);
    if (!geometryValidation.valid) {
      issues.push({
        type: 'geometry',
        severity: 'medium',
        description: geometryValidation.reason,
        affectedArea: symbol.geometry
      });
      confidence *= 0.7;
      recommendations.push('Review symbol detection parameters for size and proportion accuracy');
    }

    // Rule 3: Tag patterns should match symbol type
    for (const tag of nearbyTags) {
      const tagValidation = this.validateTagSymbolMatch(tag, symbol);
      if (!tagValidation.valid) {
        issues.push({
          type: 'symbol_tag_mismatch',
          severity: 'medium',
          description: `Tag "${tag.tag}" doesn't match expected pattern for ${symbol.template.name}`,
          affectedArea: tag.geometry
        });
        confidence *= 0.8;
        recommendations.push(`Review tag extraction for ${symbol.template.name} symbols`);
      }
    }

    // Rule 4: Check for duplicate symbols in same area
    const duplicates = this.findDuplicateSymbols(symbol, []);
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate',
        severity: 'medium',
        description: 'Multiple similar symbols detected in same area',
        affectedArea: symbol.geometry
      });
      confidence *= 0.6;
      recommendations.push('Remove duplicate symbol detections');
    }

    // Rule 5: Confidence threshold validation
    if (symbol.confidence < 0.5) {
      issues.push({
        type: 'low_confidence',
        severity: 'high',
        description: 'Symbol detection confidence below acceptable threshold',
        affectedArea: symbol.geometry
      });
      recommendations.push('Consider removing low-confidence detections or improving detection algorithm');
    }

    const isValid = confidence > 0.6 && !issues.some(i => i.severity === 'high');

    return {
      item: symbol,
      isValid,
      confidence,
      issues,
      recommendations
    };
  }

  /**
   * Validate an orphaned tag (tag without nearby symbol)
   */
  private validateOrphanedTag(tag: ExtractedTag, symbols: DetectedSymbol[]): ValidationResult {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let confidence = tag.confidence;

    // Check if tag could be a line specification or note (valid orphaned tags)
    const isValidOrphan = this.isValidOrphanedTag(tag);
    
    if (!isValidOrphan) {
      issues.push({
        type: 'orphaned_tag',
        severity: 'high',
        description: 'Tag extracted without corresponding symbol nearby',
        affectedArea: tag.geometry
      });
      confidence *= 0.3;
      recommendations.push('Verify tag extraction accuracy - equipment tags should have corresponding symbols');
    }

    // Check if tag might be noise or artifact
    const isNoiseCandidate = this.isLikelyNoise(tag);
    if (isNoiseCandidate) {
      issues.push({
        type: 'geometry',
        severity: 'high',
        description: 'Tag appears to be extraction noise or artifact',
        affectedArea: tag.geometry
      });
      confidence *= 0.2;
      recommendations.push('Review OCR preprocessing to reduce noise artifacts');
    }

    const isValid = confidence > 0.5 && !issues.some(i => i.severity === 'high');

    return {
      item: tag,
      isValid,
      confidence,
      issues,
      recommendations
    };
  }

  /**
   * Find tags near a symbol based on proximity and expected positions
   */
  private findNearbyTags(symbol: DetectedSymbol, tags: ExtractedTag[]): ExtractedTag[] {
    const nearbyTags: ExtractedTag[] = [];

    for (const expectedTag of symbol.template.expectedTags) {
      const candidateTags = tags.filter(tag => {
        const distance = this.calculateDistance(
          { x: symbol.geometry.x + symbol.geometry.width / 2, y: symbol.geometry.y + symbol.geometry.height / 2 },
          { x: tag.geometry.x + tag.geometry.width / 2, y: tag.geometry.y + tag.geometry.height / 2 }
        );

        const matchesPattern = expectedTag.pattern.test(tag.tag);
        const withinProximity = distance <= expectedTag.proximity;
        const correctPosition = this.isInExpectedPosition(symbol.geometry, tag.geometry, expectedTag.relativePosition);

        return matchesPattern && withinProximity && correctPosition;
      });

      nearbyTags.push(...candidateTags);
    }

    // Also include any tags within general proximity
    const generalNearbyTags = tags.filter(tag => {
      const distance = this.calculateDistance(
        { x: symbol.geometry.x + symbol.geometry.width / 2, y: symbol.geometry.y + symbol.geometry.height / 2 },
        { x: tag.geometry.x + tag.geometry.width / 2, y: tag.geometry.y + tag.geometry.height / 2 }
      );
      return distance <= 100; // General proximity threshold
    });

    // Merge and deduplicate
    const allNearby = [...nearbyTags, ...generalNearbyTags];
    return allNearby.filter((tag, index) => 
      allNearby.findIndex(t => t.tag === tag.tag && t.geometry.x === tag.geometry.x) === index
    );
  }

  /**
   * Find tags that don't have nearby symbols (orphaned)
   */
  private findOrphanedTags(tags: ExtractedTag[], symbols: DetectedSymbol[]): ExtractedTag[] {
    return tags.filter(tag => {
      // Check if any symbol is near this tag
      const hasNearbySymbol = symbols.some(symbol => {
        const distance = this.calculateDistance(
          { x: tag.geometry.x + tag.geometry.width / 2, y: tag.geometry.y + tag.geometry.height / 2 },
          { x: symbol.geometry.x + symbol.geometry.width / 2, y: symbol.geometry.y + symbol.geometry.height / 2 }
        );
        return distance <= 100; // Proximity threshold
      });

      return !hasNearbySymbol;
    });
  }

  /**
   * Validate symbol geometry against template
   */
  private validateGeometry(symbol: DetectedSymbol): { valid: boolean; reason: string } {
    const template = symbol.template;
    const geometry = symbol.geometry;

    // Check aspect ratio
    const actualRatio = geometry.width / geometry.height;
    const expectedRatio = template.geometry.width / template.geometry.height;
    const ratioTolerance = 0.3;

    if (Math.abs(actualRatio - expectedRatio) > ratioTolerance) {
      return {
        valid: false,
        reason: `Aspect ratio mismatch: expected ${expectedRatio.toFixed(2)}, got ${actualRatio.toFixed(2)}`
      };
    }

    // Check size reasonableness (should be within reasonable bounds)
    if (geometry.width < 10 || geometry.height < 10) {
      return {
        valid: false,
        reason: 'Symbol too small to be realistic'
      };
    }

    if (geometry.width > 200 || geometry.height > 200) {
      return {
        valid: false,
        reason: 'Symbol too large to be typical equipment symbol'
      };
    }

    return { valid: true, reason: '' };
  }

  /**
   * Validate that a tag matches the expected pattern for a symbol type
   */
  private validateTagSymbolMatch(tag: ExtractedTag, symbol: DetectedSymbol): { valid: boolean; reason: string } {
    const expectedPatterns = symbol.template.expectedTags.map(et => et.pattern);
    
    for (const pattern of expectedPatterns) {
      if (pattern.test(tag.tag)) {
        return { valid: true, reason: '' };
      }
    }

    return {
      valid: false,
      reason: `Tag "${tag.tag}" doesn't match any expected patterns for ${symbol.template.name}`
    };
  }

  /**
   * Check if a tag could be validly orphaned (like line specs, notes, etc.)
   */
  private isValidOrphanedTag(tag: ExtractedTag): boolean {
    const validOrphanPatterns = [
      /^\d+["\s]*-[A-Z]{2,4}-\d{3}$/, // Line specifications
      /^NOTE:/i, // Notes
      /^TYP\.?$/i, // Typical callouts
      /^NORTH$/i, // Direction indicators
      /^SCALE/i, // Scale indicators
      /^DWG/i, // Drawing references
      /^REV/i, // Revision callouts
    ];

    return validOrphanPatterns.some(pattern => pattern.test(tag.tag));
  }

  /**
   * Check if a tag is likely to be noise or an artifact
   */
  private isLikelyNoise(tag: ExtractedTag): boolean {
    // Very small text
    if (tag.geometry.width < 5 || tag.geometry.height < 5) {
      return true;
    }

    // Single characters that aren't likely to be valid
    if (tag.tag.length === 1 && !/[A-Z0-9]/.test(tag.tag)) {
      return true;
    }

    // Common OCR artifacts
    const noisePatterns = [
      /^[|\\\/\-_]+$/, // Lines and underscores only
      /^\.+$/, // Dots only
      /^[,;:]+$/, // Punctuation only
    ];

    return noisePatterns.some(pattern => pattern.test(tag.tag));
  }

  /**
   * Find duplicate symbols in the same area
   */
  private findDuplicateSymbols(symbol: DetectedSymbol, allSymbols: DetectedSymbol[]): DetectedSymbol[] {
    const duplicates: DetectedSymbol[] = [];
    const overlapThreshold = 0.5; // 50% overlap

    for (const other of allSymbols) {
      if (other.id === symbol.id) continue;

      const overlap = this.calculateOverlap(symbol.geometry, other.geometry);
      if (overlap > overlapThreshold && symbol.template.id === other.template.id) {
        duplicates.push(other);
      }
    }

    return duplicates;
  }

  /**
   * Check if tag is in expected position relative to symbol
   */
  private isInExpectedPosition(
    symbolGeom: { x: number; y: number; width: number; height: number },
    tagGeom: { x: number; y: number; width: number; height: number },
    expectedPosition: 'top' | 'bottom' | 'left' | 'right' | 'center'
  ): boolean {
    const symbolCenter = {
      x: symbolGeom.x + symbolGeom.width / 2,
      y: symbolGeom.y + symbolGeom.height / 2
    };
    
    const tagCenter = {
      x: tagGeom.x + tagGeom.width / 2,
      y: tagGeom.y + tagGeom.height / 2
    };

    const tolerance = 20; // pixels

    switch (expectedPosition) {
      case 'top':
        return tagCenter.y < symbolGeom.y - tolerance;
      case 'bottom':
        return tagCenter.y > symbolGeom.y + symbolGeom.height + tolerance;
      case 'left':
        return tagCenter.x < symbolGeom.x - tolerance;
      case 'right':
        return tagCenter.x > symbolGeom.x + symbolGeom.width + tolerance;
      case 'center':
        return Math.abs(tagCenter.x - symbolCenter.x) < tolerance && 
               Math.abs(tagCenter.y - symbolCenter.y) < tolerance;
      default:
        return true;
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  }

  /**
   * Calculate overlap percentage between two rectangles
   */
  private calculateOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): number {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (x2 <= x1 || y2 <= y1) return 0;

    const overlapArea = (x2 - x1) * (y2 - y1);
    const rect1Area = rect1.width * rect1.height;
    const rect2Area = rect2.width * rect2.height;
    const unionArea = rect1Area + rect2Area - overlapArea;

    return overlapArea / unionArea;
  }

  /**
   * Initialize standard symbol templates
   */
  private initializeSymbolTemplates(): void {
    this.symbolTemplates = [
      {
        id: 'centrifugal_pump',
        name: 'Centrifugal Pump',
        category: 'pump',
        geometry: {
          width: 40,
          height: 30,
          keyPoints: [
            { x: 0, y: 15, type: 'connection' }, // suction
            { x: 40, y: 15, type: 'connection' }, // discharge
            { x: 20, y: 15, type: 'center' }
          ]
        },
        expectedTags: [
          {
            pattern: /^P-\d{3}[A-Z]?$/,
            proximity: 60,
            relativePosition: 'bottom'
          }
        ]
      },
      {
        id: 'gate_valve',
        name: 'Gate Valve',
        category: 'valve',
        geometry: {
          width: 20,
          height: 20,
          keyPoints: [
            { x: 10, y: 10, type: 'center' }
          ]
        },
        expectedTags: [
          {
            pattern: /^[A-Z]*V-\d{3}[A-Z]?$/,
            proximity: 40,
            relativePosition: 'top'
          }
        ]
      },
      {
        id: 'pressure_transmitter',
        name: 'Pressure Transmitter',
        category: 'instrument',
        geometry: {
          width: 25,
          height: 25,
          keyPoints: [
            { x: 12.5, y: 12.5, type: 'center' }
          ]
        },
        expectedTags: [
          {
            pattern: /^P[TI]-\d{3}[A-Z]?$/,
            proximity: 50,
            relativePosition: 'bottom'
          }
        ]
      }
    ];
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Rules would be defined here for more complex validation scenarios
    this.validationRules = [];
  }

  /**
   * Generate summary report of validation results
   */
  public generateValidationReport(results: ValidationResult[]): string {
    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    let report = '# False Positive Validation Report\n\n';
    report += `## Summary\n`;
    report += `- Total Items Validated: ${results.length}\n`;
    report += `- Valid Items: ${validCount}\n`;
    report += `- Invalid Items (Potential False Positives): ${invalidCount}\n`;
    report += `- Average Confidence: ${(averageConfidence * 100).toFixed(1)}%\n\n`;

    const invalidResults = results.filter(r => !r.isValid);
    if (invalidResults.length > 0) {
      report += `## Potential False Positives (${invalidResults.length})\n`;
      for (const result of invalidResults) {
        const itemDesc = 'template' in result.item ? 
          `Symbol: ${result.item.template.name}` : 
          `Tag: ${result.item.tag}`;
        
        report += `### ${itemDesc}\n`;
        report += `- Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
        report += `- Issues:\n`;
        for (const issue of result.issues) {
          report += `  - ${issue.description} (${issue.severity})\n`;
        }
        report += `- Recommendations:\n`;
        for (const rec of result.recommendations) {
          report += `  - ${rec}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }
}

interface ValidationRule {
  id: string;
  description: string;
  validate: (item: DetectedSymbol | ExtractedTag) => ValidationIssue[];
}

export default FalsePositiveValidator;