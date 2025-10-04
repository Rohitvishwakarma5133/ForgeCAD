/**
 * Material and Pressure Rating Extraction Validator
 * Addresses issue #5 (incorrect material/pressure rating extraction)
 */

export interface TextFragment {
  id: string;
  text: string;
  geometry: { x: number; y: number; width: number; height: number };
  layer: string;
  fontSize: number;
  confidence: number;
  source: 'ocr' | 'dwg_text' | 'attribute';
}

export interface LayerMetadata {
  name: string;
  type: 'piping' | 'equipment' | 'notes' | 'dimensions' | 'other';
  defaultMaterial?: string;
  defaultRating?: string;
  conventions: {
    materialPrefix?: string;
    ratingFormat?: RegExp;
    separators: string[];
  };
}

export interface MaterialRatingSpec {
  id: string;
  lineId?: string;
  equipmentId?: string;
  geometry: { x: number; y: number; width: number; height: number };
  extractedText: string;
  normalizedSpec: {
    size?: string;
    material?: string;
    rating?: string;
    schedule?: string;
    additional?: string[];
  };
  confidence: number;
  sources: TextFragment[];
  layer: string;
  validation: {
    isValid: boolean;
    issues: ValidationIssue[];
    suggestions: string[];
  };
}

export interface ValidationIssue {
  type: 'fragmented_text' | 'material_mismatch' | 'rating_invalid' | 'layer_inconsistency' | 'format_error';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix: string;
  affectedFragments: string[];
}

export interface MaterialDatabase {
  materials: Array<{
    code: string;
    fullName: string;
    aliases: string[];
    compatibleRatings: string[];
    temperatureRange?: { min: number; max: number };
    properties: Record<string, any>;
  }>;
  ratings: Array<{
    code: string;
    description: string;
    pressure: number;
    temperature: number;
    standard: string;
  }>;
}

export class MaterialRatingValidator {
  private materialDatabase: MaterialDatabase;
  private layerConventions: LayerMetadata[] = [];
  private proximityThreshold = 50; // pixels
  private fragmentMergeThreshold = 20; // pixels

  constructor() {
    this.initializeMaterialDatabase();
    this.initializeLayerConventions();
  }

  /**
   * Main validation method for material and pressure rating extraction
   */
  public validateMaterialRatings(
    textFragments: TextFragment[],
    layerMetadata: LayerMetadata[]
  ): MaterialRatingSpec[] {
    console.log('🧪 Starting material/pressure rating validation...');
    
    // Step 1: Update layer conventions with provided metadata
    this.updateLayerConventions(layerMetadata);
    
    // Step 2: Group and merge text fragments into potential specifications
    const potentialSpecs = this.assembleTextFragments(textFragments);
    
    // Step 3: Parse and normalize each specification
    const materialSpecs: MaterialRatingSpec[] = [];
    
    for (const spec of potentialSpecs) {
      const parsedSpec = this.parseSpecification(spec);
      if (parsedSpec) {
        materialSpecs.push(parsedSpec);
      }
    }
    
    // Step 4: Cross-validate with layer metadata
    this.crossValidateWithLayers(materialSpecs);
    
    // Step 5: Validate against material database
    this.validateAgainstDatabase(materialSpecs);
    
    console.log(`✅ Validated ${materialSpecs.length} material/rating specifications`);
    
    return materialSpecs;
  }

  /**
   * Assemble fragmented text into coherent specifications
   */
  private assembleTextFragments(fragments: TextFragment[]): Array<{
    id: string;
    fragments: TextFragment[];
    combinedText: string;
    geometry: { x: number; y: number; width: number; height: number };
    layer: string;
  }> {
    const specifications = [];
    const processedFragments = new Set<string>();
    
    // Group fragments by proximity and layer
    for (const fragment of fragments) {
      if (processedFragments.has(fragment.id)) continue;
      
      // Find nearby fragments that might be part of the same specification
      const relatedFragments = this.findRelatedFragments(fragment, fragments, processedFragments);
      
      if (relatedFragments.length > 0) {
        // Sort fragments by position (left to right, top to bottom)
        relatedFragments.sort((a, b) => {
          const yDiff = a.geometry.y - b.geometry.y;
          if (Math.abs(yDiff) < 10) { // Same line
            return a.geometry.x - b.geometry.x;
          }
          return yDiff;
        });
        
        // Combine text with appropriate spacing
        const combinedText = this.combineFragmentText(relatedFragments);
        
        // Calculate bounding geometry
        const boundingGeometry = this.calculateBoundingGeometry(relatedFragments);
        
        specifications.push({
          id: `spec-${specifications.length + 1}`,
          fragments: relatedFragments,
          combinedText,
          geometry: boundingGeometry,
          layer: fragment.layer
        });
        
        // Mark fragments as processed
        relatedFragments.forEach(f => processedFragments.add(f.id));
      }
    }
    
    return specifications;
  }

  /**
   * Find fragments that are related to the current fragment
   */
  private findRelatedFragments(
    baseFragment: TextFragment,
    allFragments: TextFragment[],
    processedFragments: Set<string>
  ): TextFragment[] {
    const related = [baseFragment];
    
    for (const fragment of allFragments) {
      if (fragment.id === baseFragment.id || processedFragments.has(fragment.id)) continue;
      
      // Check proximity
      const distance = this.calculateDistance(
        { x: baseFragment.geometry.x + baseFragment.geometry.width / 2, y: baseFragment.geometry.y + baseFragment.geometry.height / 2 },
        { x: fragment.geometry.x + fragment.geometry.width / 2, y: fragment.geometry.y + fragment.geometry.height / 2 }
      );
      
      // Check layer consistency
      const sameLayer = fragment.layer === baseFragment.layer;
      
      // Check if text could be part of specification
      const textRelevant = this.isSpecificationRelevantText(fragment.text);
      
      if (distance <= this.proximityThreshold && sameLayer && textRelevant) {
        related.push(fragment);
      }
    }
    
    return related;
  }

  /**
   * Combine fragment text with intelligent spacing
   */
  private combineFragmentText(fragments: TextFragment[]): string {
    if (fragments.length === 0) return '';
    if (fragments.length === 1) return fragments[0].text.trim();
    
    let combinedText = fragments[0].text.trim();
    
    for (let i = 1; i < fragments.length; i++) {
      const prevFragment = fragments[i - 1];
      const currentFragment = fragments[i];
      
      // Determine spacing based on geometry
      const horizontalGap = currentFragment.geometry.x - (prevFragment.geometry.x + prevFragment.geometry.width);
      const verticalGap = Math.abs(currentFragment.geometry.y - prevFragment.geometry.y);
      
      let separator = '';
      if (verticalGap > 5) {
        separator = ' '; // New line or significant vertical gap
      } else if (horizontalGap > 10) {
        separator = ' '; // Horizontal gap
      } else if (horizontalGap < -5) {
        separator = ''; // Overlapping or very close
      } else {
        separator = ''; // Adjacent
      }
      
      combinedText += separator + currentFragment.text.trim();
    }
    
    return combinedText;
  }

  /**
   * Parse a specification string into components
   */
  private parseSpecification(spec: {
    id: string;
    fragments: TextFragment[];
    combinedText: string;
    geometry: { x: number; y: number; width: number; height: number };
    layer: string;
  }): MaterialRatingSpec | null {
    const text = spec.combinedText;
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    
    // Parse using multiple patterns
    const parsedComponents = this.parseSpecificationText(text);
    
    if (!parsedComponents.size && !parsedComponents.material && !parsedComponents.rating) {
      return null; // Not a valid specification
    }
    
    // Validate components
    const validation = this.validateComponents(parsedComponents, spec.layer);
    issues.push(...validation.issues);
    suggestions.push(...validation.suggestions);
    
    // Calculate overall confidence
    let confidence = 0.5;
    
    // Fragment confidence contribution
    const avgFragmentConfidence = spec.fragments.reduce((sum, f) => sum + f.confidence, 0) / spec.fragments.length;
    confidence += avgFragmentConfidence * 0.3;
    
    // Parsing success contribution
    const componentsFound = Object.values(parsedComponents).filter(v => v !== undefined).length;
    confidence += (componentsFound / 4) * 0.4; // Up to 4 main components
    
    // Layer metadata contribution
    const layerMatch = this.validateLayerConsistency(parsedComponents, spec.layer);
    if (layerMatch.valid) {
      confidence += 0.2;
    } else {
      issues.push({
        type: 'layer_inconsistency',
        severity: 'medium',
        description: layerMatch.reason,
        suggestedFix: layerMatch.suggestedFix,
        affectedFragments: spec.fragments.map(f => f.id)
      });
    }
    
    // Validation issues impact
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;
    
    confidence = Math.max(0.1, confidence - (highSeverityIssues * 0.3) - (mediumSeverityIssues * 0.1));
    
    return {
      id: spec.id,
      geometry: spec.geometry,
      extractedText: text,
      normalizedSpec: parsedComponents,
      confidence,
      sources: spec.fragments,
      layer: spec.layer,
      validation: {
        isValid: confidence > 0.6 && highSeverityIssues === 0,
        issues,
        suggestions
      }
    };
  }

  /**
   * Parse specification text into components
   */
  private parseSpecificationText(text: string): {
    size?: string;
    material?: string;
    rating?: string;
    schedule?: string;
    additional?: string[];
  } {
    const components: any = { additional: [] };
    const normalizedText = text.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // Size pattern (e.g., 6", 4", 12")
    const sizeMatch = normalizedText.match(/(\d+(?:\.\d+)?)["\s]*(?:-|$)/);
    if (sizeMatch) {
      components.size = sizeMatch[1] + '"';
    }
    
    // Material patterns
    const materialPatterns = [
      /\b(CS|CARBON\s*STEEL)\b/,
      /\b(SS|STAINLESS\s*STEEL|SS\d{3})\b/,
      /\b(A\d{3}[A-Z]?)\b/, // ASTM grades
      /\b(316L?|304L?|321|347)\b/, // Stainless grades
      /\b(INCONEL|MONEL|HASTELLOY)\b/
    ];
    
    for (const pattern of materialPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        components.material = this.normalizeMaterial(match[1]);
        break;
      }
    }
    
    // Rating/Pressure patterns
    const ratingPatterns = [
      /\b(\d{3})\s*(?:LB|#|PSI)?\b/, // 150, 300, 600, etc.
      /\b(ANSI\s*)?(\d{3})(?:\s*LB)?\b/,
      /\b(\d+)\s*PSI(?:G)?\b/
    ];
    
    for (const pattern of ratingPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const ratingValue = match[2] || match[1];
        components.rating = this.normalizeRating(ratingValue);
        break;
      }
    }
    
    // Schedule pattern
    const scheduleMatch = normalizedText.match(/\b(SCH\s*\d+|XS|XXS|STD)\b/);
    if (scheduleMatch) {
      components.schedule = scheduleMatch[1].replace(/\s+/g, '');
    }
    
    // Additional specifications
    const additionalPatterns = [
      /\b(SEAMLESS|WELDED)\b/,
      /\b(ANSI\s*B\d+\.\d+)\b/,
      /\b(ASTM\s*[A-Z]\d+)\b/
    ];
    
    for (const pattern of additionalPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        components.additional.push(match[1]);
      }
    }
    
    return components;
  }

  /**
   * Normalize material designation
   */
  private normalizeMaterial(material: string): string {
    const normalizedMaterial = material.toUpperCase().replace(/\s+/g, '');
    
    const materialMap: Record<string, string> = {
      'CARBONSTEEL': 'CS',
      'STAINLESSSTEEL': 'SS',
      'SS304': 'SS304',
      'SS316': 'SS316',
      '304L': 'SS304L',
      '316L': 'SS316L',
      '321': 'SS321',
      '347': 'SS347'
    };
    
    return materialMap[normalizedMaterial] || normalizedMaterial;
  }

  /**
   * Normalize pressure rating
   */
  private normalizeRating(rating: string): string {
    const numericRating = parseInt(rating);
    
    // Standard ANSI ratings
    const standardRatings = [150, 300, 600, 900, 1500, 2500];
    const closest = standardRatings.reduce((prev, curr) => 
      Math.abs(curr - numericRating) < Math.abs(prev - numericRating) ? curr : prev
    );
    
    // If close to standard rating, normalize to it
    if (Math.abs(numericRating - closest) <= 25) {
      return `${closest}`;
    }
    
    return rating;
  }

  /**
   * Validate parsed components
   */
  private validateComponents(
    components: any,
    layer: string
  ): { issues: ValidationIssue[]; suggestions: string[] } {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    
    // Validate material
    if (components.material) {
      const materialValid = this.validateMaterial(components.material);
      if (!materialValid.valid) {
        issues.push({
          type: 'material_mismatch',
          severity: 'high',
          description: `Unknown or invalid material: ${components.material}`,
          suggestedFix: `Use standard material code. Suggestions: ${materialValid.suggestions.join(', ')}`,
          affectedFragments: []
        });
      }
    }
    
    // Validate rating
    if (components.rating) {
      const ratingValid = this.validateRating(components.rating);
      if (!ratingValid.valid) {
        issues.push({
          type: 'rating_invalid',
          severity: 'high',
          description: `Invalid pressure rating: ${components.rating}`,
          suggestedFix: `Use standard ANSI rating. Suggestions: ${ratingValid.suggestions.join(', ')}`,
          affectedFragments: []
        });
      }
    }
    
    // Validate material-rating compatibility
    if (components.material && components.rating) {
      const compatibilityCheck = this.validateMaterialRatingCompatibility(components.material, components.rating);
      if (!compatibilityCheck.valid) {
        issues.push({
          type: 'material_mismatch',
          severity: 'medium',
          description: compatibilityCheck.reason,
          suggestedFix: compatibilityCheck.suggestedFix,
          affectedFragments: []
        });
      }
    }
    
    return { issues, suggestions };
  }

  /**
   * Validate material against database
   */
  private validateMaterial(material: string): { valid: boolean; suggestions: string[] } {
    const normalizedMaterial = material.toUpperCase();
    
    for (const dbMaterial of this.materialDatabase.materials) {
      if (dbMaterial.code === normalizedMaterial || 
          dbMaterial.aliases.includes(normalizedMaterial)) {
        return { valid: true, suggestions: [] };
      }
    }
    
    // Find similar materials
    const suggestions = this.materialDatabase.materials
      .filter(m => m.code.includes(normalizedMaterial.substring(0, 2)))
      .map(m => m.code)
      .slice(0, 3);
    
    return { valid: false, suggestions };
  }

  /**
   * Validate pressure rating
   */
  private validateRating(rating: string): { valid: boolean; suggestions: string[] } {
    const numericRating = parseInt(rating);
    
    for (const dbRating of this.materialDatabase.ratings) {
      if (dbRating.code === rating || dbRating.pressure === numericRating) {
        return { valid: true, suggestions: [] };
      }
    }
    
    // Find closest ratings
    const suggestions = this.materialDatabase.ratings
      .sort((a, b) => Math.abs(a.pressure - numericRating) - Math.abs(b.pressure - numericRating))
      .slice(0, 3)
      .map(r => r.code);
    
    return { valid: false, suggestions };
  }

  /**
   * Validate material-rating compatibility
   */
  private validateMaterialRatingCompatibility(
    material: string,
    rating: string
  ): { valid: boolean; reason: string; suggestedFix: string } {
    const materialEntry = this.materialDatabase.materials.find(m => 
      m.code === material || m.aliases.includes(material)
    );
    
    if (!materialEntry) {
      return {
        valid: true, // Can't validate if material not found
        reason: '',
        suggestedFix: ''
      };
    }
    
    if (!materialEntry.compatibleRatings.includes(rating)) {
      return {
        valid: false,
        reason: `Material ${material} typically not used with ${rating} rating`,
        suggestedFix: `Consider using ratings: ${materialEntry.compatibleRatings.join(', ')}`
      };
    }
    
    return { valid: true, reason: '', suggestedFix: '' };
  }

  /**
   * Validate layer consistency
   */
  private validateLayerConsistency(
    components: any,
    layer: string
  ): { valid: boolean; reason: string; suggestedFix: string } {
    const layerConvention = this.layerConventions.find(l => l.name.toLowerCase() === layer.toLowerCase());
    
    if (!layerConvention) {
      return { valid: true, reason: '', suggestedFix: '' }; // Can't validate unknown layers
    }
    
    // Check material consistency
    if (layerConvention.defaultMaterial && components.material) {
      if (layerConvention.defaultMaterial !== components.material) {
        return {
          valid: false,
          reason: `Material ${components.material} inconsistent with layer ${layer} default (${layerConvention.defaultMaterial})`,
          suggestedFix: `Verify material or check if specification should be on different layer`
        };
      }
    }
    
    // Check rating consistency
    if (layerConvention.defaultRating && components.rating) {
      if (layerConvention.defaultRating !== components.rating) {
        return {
          valid: false,
          reason: `Rating ${components.rating} inconsistent with layer ${layer} default (${layerConvention.defaultRating})`,
          suggestedFix: `Verify rating or check if specification should be on different layer`
        };
      }
    }
    
    return { valid: true, reason: '', suggestedFix: '' };
  }

  /**
   * Cross-validate specifications with layer metadata
   */
  private crossValidateWithLayers(specs: MaterialRatingSpec[]): void {
    for (const spec of specs) {
      const layerMetadata = this.layerConventions.find(l => 
        l.name.toLowerCase() === spec.layer.toLowerCase()
      );
      
      if (layerMetadata) {
        // Check if missing information can be inferred from layer
        if (!spec.normalizedSpec.material && layerMetadata.defaultMaterial) {
          spec.normalizedSpec.material = layerMetadata.defaultMaterial;
          spec.validation.suggestions.push(`Inferred material ${layerMetadata.defaultMaterial} from layer ${spec.layer}`);
        }
        
        if (!spec.normalizedSpec.rating && layerMetadata.defaultRating) {
          spec.normalizedSpec.rating = layerMetadata.defaultRating;
          spec.validation.suggestions.push(`Inferred rating ${layerMetadata.defaultRating} from layer ${spec.layer}`);
        }
      }
    }
  }

  /**
   * Validate against material database
   */
  private validateAgainstDatabase(specs: MaterialRatingSpec[]): void {
    for (const spec of specs) {
      // Additional database validations can be added here
      // For now, component validation is sufficient
    }
  }

  /**
   * Check if text is relevant to specifications
   */
  private isSpecificationRelevantText(text: string): boolean {
    const relevantPatterns = [
      /\d+["\s]*-/, // Size dash pattern
      /\b(CS|SS|STAINLESS|CARBON)\b/i,
      /\b\d{3}(?:\s*LB)?\b/, // Pressure ratings
      /\b(SCH|ANSI|ASTM)\b/i
    ];
    
    return relevantPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate bounding geometry for multiple fragments
   */
  private calculateBoundingGeometry(fragments: TextFragment[]): {
    x: number; y: number; width: number; height: number;
  } {
    if (fragments.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const minX = Math.min(...fragments.map(f => f.geometry.x));
    const minY = Math.min(...fragments.map(f => f.geometry.y));
    const maxX = Math.max(...fragments.map(f => f.geometry.x + f.geometry.width));
    const maxY = Math.max(...fragments.map(f => f.geometry.y + f.geometry.height));
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  }

  /**
   * Update layer conventions with provided metadata
   */
  private updateLayerConventions(metadata: LayerMetadata[]): void {
    for (const meta of metadata) {
      const existingIndex = this.layerConventions.findIndex(l => 
        l.name.toLowerCase() === meta.name.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        this.layerConventions[existingIndex] = { ...this.layerConventions[existingIndex], ...meta };
      } else {
        this.layerConventions.push(meta);
      }
    }
  }

  /**
   * Initialize material database
   */
  private initializeMaterialDatabase(): void {
    this.materialDatabase = {
      materials: [
        {
          code: 'CS',
          fullName: 'Carbon Steel',
          aliases: ['CARBON STEEL', 'A106', 'A53'],
          compatibleRatings: ['150', '300', '600', '900', '1500'],
          temperatureRange: { min: -20, max: 400 },
          properties: { density: 7.85, strength: 'medium' }
        },
        {
          code: 'SS304',
          fullName: 'Stainless Steel 304',
          aliases: ['304', '304L', 'SS', 'STAINLESS STEEL'],
          compatibleRatings: ['150', '300', '600', '900', '1500', '2500'],
          temperatureRange: { min: -196, max: 800 },
          properties: { density: 8.0, strength: 'high', corrosionResistance: 'excellent' }
        },
        {
          code: 'SS316',
          fullName: 'Stainless Steel 316',
          aliases: ['316', '316L'],
          compatibleRatings: ['150', '300', '600', '900', '1500', '2500'],
          temperatureRange: { min: -196, max: 800 },
          properties: { density: 8.0, strength: 'high', corrosionResistance: 'superior' }
        }
      ],
      ratings: [
        { code: '150', description: 'ANSI 150', pressure: 150, temperature: 400, standard: 'ANSI B16.5' },
        { code: '300', description: 'ANSI 300', pressure: 300, temperature: 400, standard: 'ANSI B16.5' },
        { code: '600', description: 'ANSI 600', pressure: 600, temperature: 400, standard: 'ANSI B16.5' },
        { code: '900', description: 'ANSI 900', pressure: 900, temperature: 400, standard: 'ANSI B16.5' },
        { code: '1500', description: 'ANSI 1500', pressure: 1500, temperature: 400, standard: 'ANSI B16.5' },
        { code: '2500', description: 'ANSI 2500', pressure: 2500, temperature: 400, standard: 'ANSI B16.5' }
      ]
    };
  }

  /**
   * Initialize layer conventions
   */
  private initializeLayerConventions(): void {
    this.layerConventions = [
      {
        name: 'PIPING',
        type: 'piping',
        conventions: { separators: ['-', ' ', '/'] }
      },
      {
        name: 'PROCESS',
        type: 'piping',
        conventions: { separators: ['-', ' '] }
      },
      {
        name: 'EQUIPMENT',
        type: 'equipment',
        conventions: { separators: ['-', ' '] }
      },
      {
        name: 'NOTES',
        type: 'notes',
        conventions: { separators: [' ', ','] }
      }
    ];
  }

  /**
   * Generate validation report
   */
  public generateValidationReport(specs: MaterialRatingSpec[]): string {
    const validSpecs = specs.filter(s => s.validation.isValid).length;
    const invalidSpecs = specs.length - validSpecs;
    const averageConfidence = specs.reduce((sum, s) => sum + s.confidence, 0) / specs.length;
    
    let report = '# Material/Pressure Rating Validation Report\n\n';
    report += `## Summary\n`;
    report += `- Total Specifications: ${specs.length}\n`;
    report += `- Valid Specifications: ${validSpecs}\n`;
    report += `- Invalid Specifications: ${invalidSpecs}\n`;
    report += `- Average Confidence: ${(averageConfidence * 100).toFixed(1)}%\n\n`;
    
    if (invalidSpecs > 0) {
      report += `## Invalid Specifications (${invalidSpecs})\n`;
      
      for (const spec of specs.filter(s => !s.validation.isValid)) {
        report += `### ${spec.id}\n`;
        report += `- Extracted Text: "${spec.extractedText}"\n`;
        report += `- Confidence: ${(spec.confidence * 100).toFixed(1)}%\n`;
        report += `- Layer: ${spec.layer}\n`;
        
        if (spec.normalizedSpec.size) report += `- Size: ${spec.normalizedSpec.size}\n`;
        if (spec.normalizedSpec.material) report += `- Material: ${spec.normalizedSpec.material}\n`;
        if (spec.normalizedSpec.rating) report += `- Rating: ${spec.normalizedSpec.rating}\n`;
        
        report += `- Issues:\n`;
        for (const issue of spec.validation.issues) {
          report += `  - ${issue.description} (${issue.severity})\n`;
          report += `    Fix: ${issue.suggestedFix}\n`;
        }
        
        if (spec.validation.suggestions.length > 0) {
          report += `- Suggestions:\n`;
          for (const suggestion of spec.validation.suggestions) {
            report += `  - ${suggestion}\n`;
          }
        }
        
        report += '\n';
      }
    }
    
    const fragmentationIssues = specs.flatMap(s => s.validation.issues).filter(i => i.type === 'fragmented_text');
    const materialIssues = specs.flatMap(s => s.validation.issues).filter(i => i.type === 'material_mismatch');
    const ratingIssues = specs.flatMap(s => s.validation.issues).filter(i => i.type === 'rating_invalid');
    
    report += `## Overall Recommendations\n`;
    if (fragmentationIssues.length > 0) {
      report += `- 📝 ${fragmentationIssues.length} specifications have fragmented text - improve OCR text assembly\n`;
    }
    if (materialIssues.length > 0) {
      report += `- 🔧 ${materialIssues.length} material specification issues - review material database and parsing rules\n`;
    }
    if (ratingIssues.length > 0) {
      report += `- ⚡ ${ratingIssues.length} pressure rating issues - validate against standard ANSI ratings\n`;
    }
    
    if (averageConfidence > 0.8) {
      report += `- ✅ High overall confidence - material/rating extraction appears accurate\n`;
    } else if (averageConfidence < 0.6) {
      report += `- ⚠️ Low overall confidence - review extraction and validation algorithms\n`;
    }
    
    return report;
  }
}

export default MaterialRatingValidator;