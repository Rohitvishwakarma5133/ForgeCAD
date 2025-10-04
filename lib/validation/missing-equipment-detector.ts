/**
 * Missing Equipment Detection System
 * Addresses issue #1 (missing equipment/dropped tags)
 */

import TagParser, { TagParseResult } from './tag-parser';

export interface DWGEntity {
  id: string;
  type: 'block' | 'text' | 'mtext' | 'attribute';
  name?: string;
  text?: string;
  layer: string;
  geometry: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  attributes?: Record<string, string>;
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
  layer?: string;
}

export interface MissingEquipmentResult {
  dwgEntities: DWGEntity[];
  extractedTags: ExtractedTag[];
  analysis: {
    totalDwgEntities: number;
    totalExtractedTags: number;
    matchedTags: TagMatch[];
    missingTags: DWGEntity[];
    falsePositives: ExtractedTag[];
    confidence: number;
    recommendations: string[];
  };
}

export interface TagMatch {
  dwgEntity: DWGEntity;
  extractedTag: ExtractedTag;
  confidence: number;
  spatialDistance: number;
  textSimilarity: number;
}

export class MissingEquipmentDetector {
  private tagParser: TagParser;
  private proximityThreshold: number = 50; // pixels
  private similarityThreshold: number = 0.8;

  constructor() {
    this.tagParser = new TagParser();
  }

  /**
   * Main detection method - compares DWG entities with extracted tags
   */
  public detectMissingEquipment(
    dwgEntities: DWGEntity[],
    extractedTags: ExtractedTag[]
  ): MissingEquipmentResult {
    // Step 1: Filter relevant DWG entities (equipment-related)
    const relevantDwgEntities = this.filterRelevantEntities(dwgEntities);

    // Step 2: Normalize and parse extracted tags
    const normalizedTags = this.normalizeExtractedTags(extractedTags);

    // Step 3: Find matches between DWG entities and extracted tags
    const matches = this.findMatches(relevantDwgEntities, normalizedTags);

    // Step 4: Identify missing tags and false positives
    const missingTags = this.findMissingTags(relevantDwgEntities, matches);
    const falsePositives = this.findFalsePositives(normalizedTags, matches);

    // Step 5: Calculate overall confidence and generate recommendations
    const confidence = this.calculateConfidence(relevantDwgEntities.length, matches.length);
    const recommendations = this.generateRecommendations(missingTags, falsePositives, matches);

    return {
      dwgEntities: relevantDwgEntities,
      extractedTags: normalizedTags,
      analysis: {
        totalDwgEntities: relevantDwgEntities.length,
        totalExtractedTags: normalizedTags.length,
        matchedTags: matches,
        missingTags,
        falsePositives,
        confidence,
        recommendations
      }
    };
  }

  /**
   * Filter DWG entities to include only equipment-related ones
   */
  private filterRelevantEntities(entities: DWGEntity[]): DWGEntity[] {
    const equipmentKeywords = [
      'pump', 'valve', 'tank', 'vessel', 'instrument', 'meter', 'sensor',
      'compressor', 'exchanger', 'heater', 'cooler', 'separator', 'filter'
    ];

    const equipmentLayers = [
      'equipment', 'instruments', 'piping', 'process', 'vessels',
      'pumps', 'valves', 'tanks', 'pid', 'mechanical'
    ];

    return entities.filter(entity => {
      // Check if it's a block (symbol)
      if (entity.type === 'block' && entity.name) {
        const blockName = entity.name.toLowerCase();
        return equipmentKeywords.some(keyword => blockName.includes(keyword));
      }

      // Check if it's text/attribute with equipment tags
      if ((entity.type === 'text' || entity.type === 'mtext' || entity.type === 'attribute') && entity.text) {
        const parseResult = this.tagParser.parseTag(entity.text);
        return parseResult.category !== 'unknown' && parseResult.confidence > 0.3;
      }

      // Check if it's on an equipment layer
      const layerName = entity.layer.toLowerCase();
      return equipmentLayers.some(layer => layerName.includes(layer));
    });
  }

  /**
   * Normalize extracted tags using the tag parser
   */
  private normalizeExtractedTags(tags: ExtractedTag[]): ExtractedTag[] {
    return tags.map(tag => {
      const parseResult = this.tagParser.parseTag(tag.tag);
      return {
        ...tag,
        tag: parseResult.normalizedTag,
        confidence: Math.min(tag.confidence, parseResult.confidence)
      };
    }).filter(tag => tag.confidence > 0.1); // Filter out very low confidence tags
  }

  /**
   * Find matches between DWG entities and extracted tags
   */
  private findMatches(dwgEntities: DWGEntity[], extractedTags: ExtractedTag[]): TagMatch[] {
    const matches: TagMatch[] = [];

    for (const dwgEntity of dwgEntities) {
      const bestMatch = this.findBestMatch(dwgEntity, extractedTags);
      if (bestMatch) {
        matches.push(bestMatch);
      }
    }

    // Remove duplicate matches (one-to-one mapping)
    return this.resolveDuplicateMatches(matches);
  }

  /**
   * Find the best matching extracted tag for a DWG entity
   */
  private findBestMatch(dwgEntity: DWGEntity, extractedTags: ExtractedTag[]): TagMatch | null {
    let bestMatch: TagMatch | null = null;
    let bestScore = 0;

    for (const extractedTag of extractedTags) {
      const spatialDistance = this.calculateSpatialDistance(dwgEntity.geometry, extractedTag.geometry);
      
      // Skip if too far away
      if (spatialDistance > this.proximityThreshold) {
        continue;
      }

      const textSimilarity = this.calculateTextSimilarity(dwgEntity, extractedTag);
      const confidence = this.calculateMatchConfidence(spatialDistance, textSimilarity, extractedTag.confidence);

      if (confidence > bestScore && confidence > 0.5) {
        bestMatch = {
          dwgEntity,
          extractedTag,
          confidence,
          spatialDistance,
          textSimilarity
        };
        bestScore = confidence;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate spatial distance between two geometric entities
   */
  private calculateSpatialDistance(
    geom1: { x: number; y: number; width?: number; height?: number },
    geom2: { x: number; y: number; width: number; height: number }
  ): number {
    // Calculate center points
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
   * Calculate text similarity between DWG entity and extracted tag
   */
  private calculateTextSimilarity(dwgEntity: DWGEntity, extractedTag: ExtractedTag): number {
    // If DWG entity has text/attribute, compare directly
    if (dwgEntity.text) {
      return this.stringSimilarity(dwgEntity.text, extractedTag.tag);
    }

    // If it's a block, check if block name relates to tag category
    if (dwgEntity.type === 'block' && dwgEntity.name) {
      const parseResult = this.tagParser.parseTag(extractedTag.tag);
      const blockName = dwgEntity.name.toLowerCase();
      
      // Simple category matching
      const categoryKeywords: Record<string, string[]> = {
        pump: ['pump', 'centrifugal', 'positive'],
        valve: ['valve', 'gate', 'globe', 'ball', 'butterfly'],
        vessel: ['tank', 'vessel', 'drum', 'tower', 'column'],
        instrument: ['instrument', 'meter', 'gauge', 'transmitter', 'indicator']
      };

      const keywords = categoryKeywords[parseResult.category] || [];
      const hasKeyword = keywords.some(keyword => blockName.includes(keyword));
      
      return hasKeyword ? 0.8 : 0.3;
    }

    return 0.1; // Default low similarity
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 || len2 === 0) return 0;

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
   * Calculate overall match confidence
   */
  private calculateMatchConfidence(
    spatialDistance: number,
    textSimilarity: number,
    tagConfidence: number
  ): number {
    // Normalize spatial distance (closer = better)
    const spatialScore = Math.max(0, 1 - spatialDistance / this.proximityThreshold);
    
    // Weighted combination
    const weights = { spatial: 0.3, text: 0.4, confidence: 0.3 };
    
    return (
      spatialScore * weights.spatial +
      textSimilarity * weights.text +
      tagConfidence * weights.confidence
    );
  }

  /**
   * Resolve duplicate matches to ensure one-to-one mapping
   */
  private resolveDuplicateMatches(matches: TagMatch[]): TagMatch[] {
    const resolvedMatches: TagMatch[] = [];
    const usedTags = new Set<string>();

    // Sort by confidence (highest first)
    const sortedMatches = matches.sort((a, b) => b.confidence - a.confidence);

    for (const match of sortedMatches) {
      const tagKey = `${match.extractedTag.tag}-${match.extractedTag.geometry.x}-${match.extractedTag.geometry.y}`;
      
      if (!usedTags.has(tagKey)) {
        resolvedMatches.push(match);
        usedTags.add(tagKey);
      }
    }

    return resolvedMatches;
  }

  /**
   * Find DWG entities that don't have corresponding extracted tags
   */
  private findMissingTags(dwgEntities: DWGEntity[], matches: TagMatch[]): DWGEntity[] {
    const matchedEntityIds = new Set(matches.map(m => m.dwgEntity.id));
    return dwgEntities.filter(entity => !matchedEntityIds.has(entity.id));
  }

  /**
   * Find extracted tags that don't have corresponding DWG entities
   */
  private findFalsePositives(extractedTags: ExtractedTag[], matches: TagMatch[]): ExtractedTag[] {
    const matchedTags = new Set(matches.map(m => 
      `${m.extractedTag.tag}-${m.extractedTag.geometry.x}-${m.extractedTag.geometry.y}`
    ));
    
    return extractedTags.filter(tag => {
      const tagKey = `${tag.tag}-${tag.geometry.x}-${tag.geometry.y}`;
      return !matchedTags.has(tagKey);
    });
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(totalDwgEntities: number, matchedCount: number): number {
    if (totalDwgEntities === 0) return 1;
    return matchedCount / totalDwgEntities;
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(
    missingTags: DWGEntity[],
    falsePositives: ExtractedTag[],
    matches: TagMatch[]
  ): string[] {
    const recommendations: string[] = [];

    if (missingTags.length > 0) {
      recommendations.push(`${missingTags.length} equipment items were found in DWG but not extracted. Consider multi-pass OCR or manual review.`);
      
      // Analyze missing tag patterns
      const missingByLayer = this.groupByLayer(missingTags);
      for (const [layer, count] of Object.entries(missingByLayer)) {
        if (count > 1) {
          recommendations.push(`Multiple missing items on layer '${layer}' - check layer visibility settings.`);
        }
      }
    }

    if (falsePositives.length > 0) {
      recommendations.push(`${falsePositives.length} tags were extracted but not found in DWG. Review extraction accuracy.`);
      
      const lowConfidenceFalsePositives = falsePositives.filter(fp => fp.confidence < 0.5);
      if (lowConfidenceFalsePositives.length > 0) {
        recommendations.push(`${lowConfidenceFalsePositives.length} false positives have low confidence - consider raising confidence threshold.`);
      }
    }

    const lowConfidenceMatches = matches.filter(m => m.confidence < 0.7);
    if (lowConfidenceMatches.length > 0) {
      recommendations.push(`${lowConfidenceMatches.length} matches have low confidence - manual review recommended.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All equipment items appear to be correctly detected and matched.');
    }

    return recommendations;
  }

  /**
   * Group entities by layer for analysis
   */
  private groupByLayer(entities: DWGEntity[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const entity of entities) {
      groups[entity.layer] = (groups[entity.layer] || 0) + 1;
    }
    return groups;
  }

  /**
   * Export results as a detailed report
   */
  public exportReport(result: MissingEquipmentResult): string {
    const { analysis } = result;
    
    let report = '# Missing Equipment Detection Report\n\n';
    report += `## Summary\n`;
    report += `- Total DWG Entities: ${analysis.totalDwgEntities}\n`;
    report += `- Total Extracted Tags: ${analysis.totalExtractedTags}\n`;
    report += `- Successful Matches: ${analysis.matchedTags.length}\n`;
    report += `- Missing Tags: ${analysis.missingTags.length}\n`;
    report += `- False Positives: ${analysis.falsePositives.length}\n`;
    report += `- Overall Confidence: ${(analysis.confidence * 100).toFixed(1)}%\n\n`;

    if (analysis.missingTags.length > 0) {
      report += `## Missing Tags (${analysis.missingTags.length})\n`;
      for (const missing of analysis.missingTags) {
        report += `- ${missing.type} "${missing.name || missing.text || 'Unknown'}" on layer "${missing.layer}"\n`;
      }
      report += '\n';
    }

    if (analysis.falsePositives.length > 0) {
      report += `## False Positives (${analysis.falsePositives.length})\n`;
      for (const fp of analysis.falsePositives) {
        report += `- "${fp.tag}" (confidence: ${(fp.confidence * 100).toFixed(1)}%)\n`;
      }
      report += '\n';
    }

    report += `## Recommendations\n`;
    for (const rec of analysis.recommendations) {
      report += `- ${rec}\n`;
    }

    return report;
  }
}

export default MissingEquipmentDetector;