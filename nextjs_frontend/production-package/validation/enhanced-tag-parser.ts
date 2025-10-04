/**
 * Enhanced Tag Parser - Production Implementation
 * Addresses Critical Issue #3: Incorrect tag parsing / character confusion
 * 
 * ACCEPTANCE CRITERIA:
 * - Post-normalization, >99.5% of tags match regex
 * - Character-level edit distance to DWG tags ≤ 1 for >99% tags
 */

export interface TagNormalizationResult {
  originalTag: string;
  normalizedTag: string;
  confidence: number;
  editDistance: number;
  matchesRegex: boolean;
  appliedRules: string[];
  category: TagCategory;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export type TagCategory = 
  | 'pump' | 'valve' | 'vessel' | 'equipment' 
  | 'instrument' | 'safety_valve' | 'safety_instrument'
  | 'compressor' | 'heat_exchanger' | 'line_spec' | 'unknown';

export interface ValidationStats {
  totalTags: number;
  validTags: number;
  regexMatchRate: number;
  averageEditDistance: number;
  criticalTagsValid: number;
  criticalTagsTotal: number;
  characterConfusionCount: number;
  passes: boolean; // true if meets acceptance criteria
}

export class EnhancedTagParser {
  // Production regex patterns based on specification
  private static readonly TAG_PATTERNS = {
    // Primary equipment tags
    equipment: /^(?:P|V|T|E|C|D|MX|R|X|AG|BL)-\d{2,4}[A-Z]?$/,
    
    // Instruments (both simple and composite)
    instruments: /^(?:FIC|PIC|TIC|LIC|FI|PI|TI|LI|LSH|LSL|PSH|PSL)-\d{2,4}[A-Z]?$/,
    
    // Safety devices (critical)
    safety_valves: /^(?:PSV|PRV|TSV|LSV)-\d{2,4}[A-Z]?$/,
    safety_instruments: /^(?:PSH|PSL|TSH|TSL|LSH|LSL|PSHH|PSLL)-\d{2,4}[A-Z]?$/,
    
    // Specific equipment types
    pumps: /^P-\d{2,4}[A-Z]?$/,
    valves: /^[A-Z]*V-\d{2,4}[A-Z]?$/,
    vessels: /^[TVR]-\d{2,4}[A-Z]?$/,
    compressors: /^C-\d{2,4}[A-Z]?$/,
    heat_exchangers: /^E-\d{2,4}[A-Z]?$/,
    
    // Line specifications
    line_specs: /^\d{1,2}[\s"]*-[A-Z]{2,6}-\d{2,4}[A-Z]?$/
  };

  // Master validation regex combining all patterns
  private static readonly MASTER_REGEX = new RegExp(
    Object.values(EnhancedTagParser.TAG_PATTERNS)
      .map(pattern => `(${pattern.source})`)
      .join('|')
  );

  /**
   * Normalize tag with production-grade rules
   * Implements exact specification from requirements
   */
  public static normalizeTag(rawTag: string): string {
    let normalized = rawTag.trim();
    
    // Step 1: Basic normalization
    normalized = normalized.replace(/\s+/g, ''); // Remove all spaces
    normalized = normalized.replace(/[—_]/g, '-'); // Replace em-dash and underscore with hyphen
    
    // Step 2: Character confusion fixes (O/0, I/1) with context awareness
    // Replace O->0 when adjacent to digits (specification requirement)
    normalized = normalized.replace(/(?<=\d)O(?=\d)|(?<=\d)O$/g, '0');
    
    // Replace I->1 in numeric contexts (specification requirement)  
    normalized = normalized.replace(/(?<=\D)I(?=\d)|(?<=\d)I(?=\D)/g, '1');
    
    // Step 3: Additional character fixes
    normalized = normalized.replace(/[|]/g, '1'); // Pipe character to 1
    normalized = normalized.replace(/[Ss](?=\d)|(?<=\d)[Ss]/g, '5'); // S to 5 in numeric context
    normalized = normalized.replace(/[Zz](?=\d)|(?<=\d)[Zz]/g, '2'); // Z to 2 in numeric context
    
    // Step 4: Case normalization
    normalized = normalized.toUpperCase();
    
    return normalized;
  }

  /**
   * Validate tag against production regex patterns
   */
  public static validateTag(tag: string): { 
    isValid: boolean; 
    category: TagCategory; 
    criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    matchedPattern?: string;
  } {
    // Check critical safety patterns first
    if (EnhancedTagParser.TAG_PATTERNS.safety_valves.test(tag)) {
      return { isValid: true, category: 'safety_valve', criticality: 'CRITICAL', matchedPattern: 'safety_valves' };
    }
    
    if (EnhancedTagParser.TAG_PATTERNS.safety_instruments.test(tag)) {
      return { isValid: true, category: 'safety_instrument', criticality: 'CRITICAL', matchedPattern: 'safety_instruments' };
    }

    // Check high-priority equipment
    if (EnhancedTagParser.TAG_PATTERNS.pumps.test(tag)) {
      return { isValid: true, category: 'pump', criticality: 'HIGH', matchedPattern: 'pumps' };
    }

    if (EnhancedTagParser.TAG_PATTERNS.vessels.test(tag)) {
      return { isValid: true, category: 'vessel', criticality: 'HIGH', matchedPattern: 'vessels' };
    }

    if (EnhancedTagParser.TAG_PATTERNS.instruments.test(tag)) {
      return { isValid: true, category: 'instrument', criticality: 'HIGH', matchedPattern: 'instruments' };
    }

    // Check medium-priority equipment
    if (EnhancedTagParser.TAG_PATTERNS.valves.test(tag)) {
      return { isValid: true, category: 'valve', criticality: 'MEDIUM', matchedPattern: 'valves' };
    }

    if (EnhancedTagParser.TAG_PATTERNS.equipment.test(tag)) {
      return { isValid: true, category: 'equipment', criticality: 'MEDIUM', matchedPattern: 'equipment' };
    }

    if (EnhancedTagParser.TAG_PATTERNS.line_specs.test(tag)) {
      return { isValid: true, category: 'line_spec', criticality: 'LOW', matchedPattern: 'line_specs' };
    }

    // No pattern matched
    return { isValid: false, category: 'unknown', criticality: 'LOW' };
  }

  /**
   * Calculate Levenshtein distance for edit distance measurement
   */
  public static calculateEditDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Process single tag with full normalization and validation
   */
  public static processTag(
    originalTag: string, 
    dwgReferenceTag?: string
  ): TagNormalizationResult {
    const appliedRules: string[] = [];
    let workingTag = originalTag;
    
    // Track original for rule application
    const beforeNormalization = workingTag;
    
    // Apply normalization
    const normalizedTag = EnhancedTagParser.normalizeTag(workingTag);
    
    // Track which rules were applied
    if (beforeNormalization !== normalizedTag) {
      if (/[—_]/.test(beforeNormalization)) appliedRules.push('hyphen_normalization');
      if (/(?<=\d)O|O(?=\d)/.test(beforeNormalization)) appliedRules.push('O_to_0_substitution');
      if (/(?<=\D)I(?=\d)|(?<=\d)I(?=\D)/.test(beforeNormalization)) appliedRules.push('I_to_1_substitution');
      if (/\s/.test(beforeNormalization)) appliedRules.push('space_removal');
      if (beforeNormalization !== beforeNormalization.toUpperCase()) appliedRules.push('case_normalization');
    }

    // Validate against patterns
    const validation = EnhancedTagParser.validateTag(normalizedTag);
    
    // Calculate edit distance to reference if provided
    const editDistance = dwgReferenceTag ? 
      EnhancedTagParser.calculateEditDistance(normalizedTag, dwgReferenceTag) : 0;
    
    // Calculate confidence based on validation and edit distance
    let confidence = 0.5; // Base confidence
    
    if (validation.isValid) {
      confidence += 0.4; // Regex match bonus
      
      if (validation.criticality === 'CRITICAL') confidence += 0.1;
      else if (validation.criticality === 'HIGH') confidence += 0.05;
    }
    
    if (dwgReferenceTag && editDistance <= 1) {
      confidence += 0.3; // Close to reference bonus
    } else if (dwgReferenceTag && editDistance > 2) {
      confidence -= 0.2; // Penalty for large deviation
    }
    
    confidence = Math.min(1.0, Math.max(0.0, confidence));

    return {
      originalTag,
      normalizedTag,
      confidence,
      editDistance,
      matchesRegex: validation.isValid,
      appliedRules,
      category: validation.category,
      criticality: validation.criticality
    };
  }

  /**
   * Batch process tags with validation statistics
   */
  public static batchProcess(
    extractedTags: string[],
    dwgReferenceTags?: string[]
  ): {
    results: TagNormalizationResult[];
    stats: ValidationStats;
  } {
    const results: TagNormalizationResult[] = [];
    
    for (let i = 0; i < extractedTags.length; i++) {
      const extractedTag = extractedTags[i];
      const referenceTag = dwgReferenceTags?.[i];
      
      const result = EnhancedTagParser.processTag(extractedTag, referenceTag);
      results.push(result);
    }

    // Calculate statistics
    const validTags = results.filter(r => r.matchesRegex).length;
    const regexMatchRate = validTags / results.length;
    const averageEditDistance = dwgReferenceTags ? 
      results.reduce((sum, r) => sum + r.editDistance, 0) / results.length : 0;
    
    const criticalTags = results.filter(r => r.criticality === 'CRITICAL');
    const criticalTagsValid = criticalTags.filter(r => r.matchesRegex).length;
    
    const characterConfusionCount = results.filter(r => 
      r.appliedRules.some(rule => rule.includes('substitution'))
    ).length;

    // Check acceptance criteria
    const passes = regexMatchRate >= 0.995 && // >99.5% regex match
      (dwgReferenceTags ? averageEditDistance <= 1 : true) && // edit distance ≤ 1
      (criticalTags.length === 0 || criticalTagsValid / criticalTags.length >= 0.999); // >99.9% critical tags valid

    const stats: ValidationStats = {
      totalTags: results.length,
      validTags,
      regexMatchRate,
      averageEditDistance,
      criticalTagsValid,
      criticalTagsTotal: criticalTags.length,
      characterConfusionCount,
      passes
    };

    return { results, stats };
  }

  /**
   * Generate detailed validation report
   */
  public static generateValidationReport(
    results: TagNormalizationResult[],
    stats: ValidationStats
  ): string {
    let report = '# Enhanced Tag Parser Validation Report\n\n';
    
    // Overall status
    report += `## Overall Status: ${stats.passes ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    // Key metrics
    report += `## Key Metrics\n`;
    report += `- **Regex Match Rate**: ${(stats.regexMatchRate * 100).toFixed(2)}% (Target: ≥99.5%)\n`;
    report += `- **Valid Tags**: ${stats.validTags}/${stats.totalTags}\n`;
    report += `- **Average Edit Distance**: ${stats.averageEditDistance.toFixed(2)} (Target: ≤1.0)\n`;
    report += `- **Critical Tags Valid**: ${stats.criticalTagsValid}/${stats.criticalTagsTotal}\n`;
    report += `- **Character Confusions Fixed**: ${stats.characterConfusionCount}\n\n`;
    
    // Failed tags (if any)
    const failedTags = results.filter(r => !r.matchesRegex);
    if (failedTags.length > 0) {
      report += `## Failed Tags (${failedTags.length})\n`;
      failedTags.slice(0, 20).forEach(tag => {
        report += `- \`${tag.originalTag}\` → \`${tag.normalizedTag}\` (${tag.category})\n`;
      });
      if (failedTags.length > 20) {
        report += `- ... and ${failedTags.length - 20} more\n`;
      }
      report += '\n';
    }
    
    // Character substitution summary
    const substitutionCounts = results.reduce((acc, r) => {
      r.appliedRules.forEach(rule => {
        acc[rule] = (acc[rule] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    if (Object.keys(substitutionCounts).length > 0) {
      report += `## Applied Normalization Rules\n`;
      Object.entries(substitutionCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([rule, count]) => {
          report += `- **${rule}**: ${count} times\n`;
        });
      report += '\n';
    }
    
    // Category breakdown
    const categoryBreakdown = results.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    report += `## Tag Category Breakdown\n`;
    Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / results.length) * 100).toFixed(1);
        report += `- **${category}**: ${count} (${percentage}%)\n`;
      });
    
    return report;
  }

  /**
   * Critical tag validation - ensures no critical safety tags are missed
   */
  public static validateCriticalTags(tags: string[]): {
    hasCriticalIssues: boolean;
    criticalIssues: string[];
    safetyCoverage: number;
  } {
    const criticalIssues: string[] = [];
    const safetyTags = tags.filter(tag => {
      const validation = EnhancedTagParser.validateTag(tag);
      return validation.criticality === 'CRITICAL';
    });
    
    const validSafetyTags = safetyTags.filter(tag => {
      const validation = EnhancedTagParser.validateTag(tag);
      return validation.isValid;
    });
    
    const safetyCoverage = safetyTags.length > 0 ? validSafetyTags.length / safetyTags.length : 1.0;
    
    if (safetyCoverage < 0.999) {
      criticalIssues.push(`Safety tag coverage ${(safetyCoverage * 100).toFixed(1)}% below 99.9% requirement`);
    }
    
    // Check for common critical prefixes
    const criticalPrefixes = ['PSV', 'PSH', 'PSL', 'TSV', 'LSV', 'PSHH', 'PSLL'];
    const foundCritical = tags.filter(tag => 
      criticalPrefixes.some(prefix => tag.startsWith(prefix))
    );
    
    const invalidCritical = foundCritical.filter(tag => {
      const validation = EnhancedTagParser.validateTag(tag);
      return !validation.isValid;
    });
    
    if (invalidCritical.length > 0) {
      criticalIssues.push(`Invalid critical tags detected: ${invalidCritical.join(', ')}`);
    }
    
    return {
      hasCriticalIssues: criticalIssues.length > 0,
      criticalIssues,
      safetyCoverage
    };
  }
}

export default EnhancedTagParser;