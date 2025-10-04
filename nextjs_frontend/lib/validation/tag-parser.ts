/**
 * Tag Parsing and Normalization Engine
 * Addresses issues #3 (tag corruption) and #10 (notation normalization)
 */

export interface TagParseResult {
  originalTag: string;
  normalizedTag: string;
  confidence: number;
  issues: string[];
  category: 'pump' | 'valve' | 'instrument' | 'vessel' | 'line' | 'unknown';
  components: {
    prefix?: string;
    number?: string;
    suffix?: string;
    unit?: string;
  };
}

export interface TagValidationRule {
  pattern: RegExp;
  category: TagParseResult['category'];
  description: string;
  confidence: number;
}

export class TagParser {
  private validationRules: TagValidationRule[] = [
    // Pump tags: P-101, P-101A, P-101B, etc.
    {
      pattern: /^P-\d{3}[A-Z]?$/i,
      category: 'pump',
      description: 'Standard pump tag format',
      confidence: 0.95
    },
    // Valve tags: V-101, FV-101, PV-101, etc.
    {
      pattern: /^[A-Z]*V-\d{3}[A-Z]?$/i,
      category: 'valve',
      description: 'Standard valve tag format',
      confidence: 0.9
    },
    // Instrument tags: FIC-101, TI-101, PI-101, etc.
    {
      pattern: /^[A-Z]{2,3}[A-Z]?-\d{3}[A-Z]?$/i,
      category: 'instrument',
      description: 'Standard instrument tag format (ISA)',
      confidence: 0.85
    },
    // Vessel tags: T-101, R-101, D-101, etc.
    {
      pattern: /^[TRD]-\d{3}[A-Z]?$/i,
      category: 'vessel',
      description: 'Standard vessel tag format',
      confidence: 0.9
    },
    // Line tags: 6"-CS-150, 4"-SS-300, etc.
    {
      pattern: /^\d+["\s]*-[A-Z]{2,4}-\d{3}$/i,
      category: 'line',
      description: 'Standard line specification format',
      confidence: 0.8
    }
  ];

  private characterSubstitutions: Record<string, string> = {
    // Common OCR mistakes
    'O': '0', // When in numeric context
    'I': '1', // When in numeric context
    'S': '5', // When in numeric context
    'Z': '2', // When in numeric context
    'l': '1', // Lowercase L to 1
    '|': '1', // Pipe character to 1
    // Punctuation normalization
    '_': '-', // Underscore to hyphen
    '‐': '-', // En dash to hyphen
    '—': '-', // Em dash to hyphen
    '"': '"', // Smart quote to regular quote
    '"': '"', // Smart quote to regular quote
  };

  private unitNormalizations: Record<string, string> = {
    // Size normalizations
    'inch': '"',
    'inches': '"',
    'in': '"',
    '\'\'': '"',
    // Pressure normalizations
    'psi': 'PSI',
    'psig': 'PSIG',
    'bar': 'BAR',
    'barg': 'BARG',
    // Material normalizations
    'cs': 'CS',
    'carbonSteel': 'CS',
    'carbon_steel': 'CS',
    'ss': 'SS',
    'stainlessSteel': 'SS',
    'stainless_steel': 'SS',
    'ss316': 'SS316',
    'ss304': 'SS304',
  };

  /**
   * Parse and normalize a tag string
   */
  public parseTag(rawTag: string): TagParseResult {
    const issues: string[] = [];
    let normalizedTag = rawTag.trim();
    
    // Step 1: Basic cleanup
    normalizedTag = this.cleanupTag(normalizedTag);
    
    // Step 2: Character substitutions
    const { tag: substitutedTag, substitutions } = this.applyCharacterSubstitutions(normalizedTag);
    normalizedTag = substitutedTag;
    
    if (substitutions.length > 0) {
      issues.push(`Character substitutions applied: ${substitutions.join(', ')}`);
    }

    // Step 3: Extract components
    const components = this.extractComponents(normalizedTag);
    
    // Step 4: Validate against rules
    const { category, confidence, matchedRule } = this.validateTag(normalizedTag);
    
    if (!matchedRule) {
      issues.push('Tag does not match any known pattern');
    }

    // Step 5: Additional validation checks
    const additionalIssues = this.performAdditionalValidation(normalizedTag, components);
    issues.push(...additionalIssues);

    return {
      originalTag: rawTag,
      normalizedTag,
      confidence,
      issues,
      category,
      components
    };
  }

  /**
   * Basic cleanup of tag string
   */
  private cleanupTag(tag: string): string {
    return tag
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\-"'\.]/g, '') // Remove special characters except common ones
      .toUpperCase();
  }

  /**
   * Apply character substitutions based on context
   */
  private applyCharacterSubstitutions(tag: string): { tag: string; substitutions: string[] } {
    let result = tag;
    const substitutions: string[] = [];

    // Apply numeric context substitutions
    result = result.replace(/[OIL]\d+|\d+[OIL]/g, (match) => {
      let substituted = match;
      for (const [from, to] of Object.entries(this.characterSubstitutions)) {
        if (match.includes(from) && /\d/.test(match)) {
          substituted = substituted.replace(new RegExp(from, 'g'), to);
          substitutions.push(`${from} → ${to}`);
        }
      }
      return substituted;
    });

    // Apply general substitutions
    for (const [from, to] of Object.entries(this.characterSubstitutions)) {
      if (result.includes(from) && !substitutions.some(s => s.startsWith(from))) {
        result = result.replace(new RegExp(from, 'g'), to);
        substitutions.push(`${from} → ${to}`);
      }
    }

    return { tag: result, substitutions };
  }

  /**
   * Extract tag components (prefix, number, suffix, etc.)
   */
  private extractComponents(tag: string): TagParseResult['components'] {
    const components: TagParseResult['components'] = {};

    // Try to match standard tag patterns
    const standardMatch = tag.match(/^([A-Z]+)-(\d+)([A-Z]?)$/);
    if (standardMatch) {
      components.prefix = standardMatch[1];
      components.number = standardMatch[2];
      components.suffix = standardMatch[3] || undefined;
      return components;
    }

    // Try to match line specification patterns
    const lineMatch = tag.match(/^(\d+)["\s]*-([A-Z]+)-(\d+)$/);
    if (lineMatch) {
      components.prefix = lineMatch[2]; // Material
      components.number = lineMatch[1]; // Size
      components.suffix = lineMatch[3]; // Rating
      components.unit = '"';
      return components;
    }

    return components;
  }

  /**
   * Validate tag against known patterns
   */
  private validateTag(tag: string): { category: TagParseResult['category']; confidence: number; matchedRule?: TagValidationRule } {
    for (const rule of this.validationRules) {
      if (rule.pattern.test(tag)) {
        return {
          category: rule.category,
          confidence: rule.confidence,
          matchedRule: rule
        };
      }
    }

    return {
      category: 'unknown',
      confidence: 0.1
    };
  }

  /**
   * Perform additional validation checks
   */
  private performAdditionalValidation(tag: string, components: TagParseResult['components']): string[] {
    const issues: string[] = [];

    // Check for common issues
    if (tag.includes('00') && !tag.includes('100')) {
      issues.push('Possible OCR error: double zeros detected');
    }

    if (tag.includes('II') || tag.includes('11')) {
      issues.push('Possible OCR error: double ones/I detected');
    }

    // Check component consistency
    if (components.prefix && components.number) {
      const numericValue = parseInt(components.number);
      if (numericValue < 100 || numericValue > 999) {
        issues.push('Equipment number outside typical range (100-999)');
      }
    }

    return issues;
  }

  /**
   * Normalize units in a text string
   */
  public normalizeUnits(text: string): string {
    let result = text;
    
    for (const [variant, canonical] of Object.entries(this.unitNormalizations)) {
      const regex = new RegExp(`\\b${variant}\\b`, 'gi');
      result = result.replace(regex, canonical);
    }

    return result;
  }

  /**
   * Batch parse multiple tags
   */
  public parseTagsBatch(tags: string[]): TagParseResult[] {
    return tags.map(tag => this.parseTag(tag));
  }

  /**
   * Get validation statistics for a batch of tags
   */
  public getValidationStats(results: TagParseResult[]): {
    totalTags: number;
    validTags: number;
    invalidTags: number;
    averageConfidence: number;
    categoryBreakdown: Record<string, number>;
    commonIssues: Record<string, number>;
  } {
    const validTags = results.filter(r => r.confidence > 0.7).length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    const categoryBreakdown: Record<string, number> = {};
    const commonIssues: Record<string, number> = {};

    for (const result of results) {
      categoryBreakdown[result.category] = (categoryBreakdown[result.category] || 0) + 1;
      
      for (const issue of result.issues) {
        commonIssues[issue] = (commonIssues[issue] || 0) + 1;
      }
    }

    return {
      totalTags: results.length,
      validTags,
      invalidTags: results.length - validTags,
      averageConfidence,
      categoryBreakdown,
      commonIssues
    };
  }
}

export default TagParser;