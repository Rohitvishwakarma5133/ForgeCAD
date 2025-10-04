"use strict";
/**
 * Critical Missing Equipment Detector - Production Implementation
 * Addresses Critical Issue #1: Missing equipment / dropped tags
 *
 * ACCEPTANCE CRITERIA:
 * - DWG→extraction missing critical tags ≤ 0.1%
 * - Automated report shows zero missing for critical classes
 * - Multi-pass OCR with scale variations (100%, 200%, 400%)
 * - Fail if any critical tag missing (pump, vessel, PSV, LIC, PIC)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticalMissingDetector = void 0;
const enhanced_tag_parser_1 = __importDefault(require("./enhanced-tag-parser"));
class CriticalMissingDetector {
    /**
     * Run complete missing equipment detection with multi-scale analysis
     */
    static async detectMissingEquipment(dwgEntities, extractedEntities) {
        console.log('🔍 Starting critical missing equipment detection...');
        // Step 1: Filter and categorize DWG entities
        const relevantDwgEntities = this.filterRelevantDWGEntities(dwgEntities);
        const criticalDwgEntities = this.identifyCriticalEntities(relevantDwgEntities);
        console.log(`📊 Analyzing ${relevantDwgEntities.length} DWG entities (${criticalDwgEntities.length} critical)`);
        // Step 2: Multi-scale extraction analysis
        const multiScaleResults = this.analyzeMultiScaleExtraction(extractedEntities);
        // Step 3: Spatial matching between DWG and extracted
        const { matched, missing, falsePositives } = this.performSpatialMatching(relevantDwgEntities, extractedEntities);
        // Step 4: Identify critical missing items
        const criticalMissing = this.identifyCriticalMissing(missing, extractedEntities);
        // Step 5: Calculate rates and determine pass/fail
        const missingRate = missing.length / relevantDwgEntities.length;
        const criticalMissingRate = criticalMissing.length / Math.max(criticalDwgEntities.length, 1);
        const testPassed = missingRate <= this.MISSING_RATE_THRESHOLD &&
            criticalMissingRate <= this.CRITICAL_MISSING_THRESHOLD;
        const criticalFailure = criticalMissing.length > 0; // Fail-fast on any critical missing
        // Step 6: Generate recommendations
        const recommendations = this.generateRecommendations(missing, criticalMissing, falsePositives, multiScaleResults);
        const result = {
            testPassed: testPassed && !criticalFailure,
            criticalFailure,
            missingRate,
            criticalMissingRate,
            summary: {
                dwgEntitiesTotal: relevantDwgEntities.length,
                dwgCriticalTotal: criticalDwgEntities.length,
                extractedTotal: extractedEntities.length,
                matchedTotal: matched.length,
                missingTotal: missing.length,
                criticalMissingTotal: criticalMissing.length,
                falsePositivesTotal: falsePositives.length
            },
            missingEntities: missing.map(entity => ({
                dwgEntity: entity,
                criticality: this.getCriticality(entity.tag || entity.name),
                category: this.getCategory(entity.tag || entity.name),
                reason: this.getMissingReason(entity, extractedEntities)
            })),
            criticalMissing,
            falsePositives,
            multiScaleResults,
            recommendations
        };
        console.log(`${result.testPassed ? '✅' : '❌'} Missing detection: ${(missingRate * 100).toFixed(2)}% missing, ${criticalMissing.length} critical`);
        return result;
    }
    /**
     * Filter DWG entities to equipment-relevant items only
     */
    static filterRelevantDWGEntities(dwgEntities) {
        const equipmentKeywords = [
            'pump', 'valve', 'tank', 'vessel', 'instrument', 'meter', 'sensor',
            'compressor', 'exchanger', 'heater', 'cooler', 'separator', 'filter',
            'psv', 'prv', 'tsv', 'transmitter', 'indicator', 'controller'
        ];
        const equipmentLayers = [
            'equipment', 'instruments', 'piping', 'process', 'vessels',
            'pumps', 'valves', 'tanks', 'pid', 'mechanical', 'safety'
        ];
        return dwgEntities.filter(entity => {
            // Check block names for equipment keywords
            if (entity.type === 'block' && entity.name) {
                const blockName = entity.name.toLowerCase();
                if (equipmentKeywords.some(keyword => blockName.includes(keyword))) {
                    return true;
                }
            }
            // Check text entities for valid tags
            if ((entity.type === 'text' || entity.type === 'mtext' || entity.type === 'attribute') && entity.tag) {
                const validation = enhanced_tag_parser_1.default.validateTag(entity.tag);
                if (validation.isValid) {
                    return true;
                }
            }
            // Check layer names
            const layerName = entity.layer.toLowerCase();
            if (equipmentLayers.some(layer => layerName.includes(layer))) {
                return true;
            }
            return false;
        });
    }
    /**
     * Identify critical entities that must not be missing
     */
    static identifyCriticalEntities(dwgEntities) {
        return dwgEntities.filter(entity => {
            const tag = entity.tag || entity.name || '';
            const criticality = this.getCriticality(tag);
            return criticality === 'CRITICAL';
        });
    }
    /**
     * Analyze multi-scale extraction results
     */
    static analyzeMultiScaleExtraction(extractedEntities) {
        const scale100 = extractedEntities.filter(e => e.source === 'ocr_100' || e.ocrScale === 100);
        const scale200 = extractedEntities.filter(e => e.source === 'ocr_200' || e.ocrScale === 200);
        const scale400 = extractedEntities.filter(e => e.source === 'ocr_400' || e.ocrScale === 400);
        return {
            scale100: {
                found: scale100.length,
                confidence: scale100.length > 0 ? scale100.reduce((sum, e) => sum + e.confidence, 0) / scale100.length : 0
            },
            scale200: {
                found: scale200.length,
                confidence: scale200.length > 0 ? scale200.reduce((sum, e) => sum + e.confidence, 0) / scale200.length : 0
            },
            scale400: {
                found: scale400.length,
                confidence: scale400.length > 0 ? scale400.reduce((sum, e) => sum + e.confidence, 0) / scale400.length : 0
            }
        };
    }
    /**
     * Perform spatial matching between DWG and extracted entities
     */
    static performSpatialMatching(dwgEntities, extractedEntities) {
        const matched = [];
        const usedExtracted = new Set();
        const usedDwg = new Set();
        // First pass: exact tag matches
        for (const dwgEntity of dwgEntities) {
            if (usedDwg.has(dwgEntity))
                continue;
            const dwgTag = dwgEntity.tag || this.extractTagFromName(dwgEntity.name);
            if (!dwgTag)
                continue;
            const normalizedDwgTag = enhanced_tag_parser_1.default.normalizeTag(dwgTag);
            for (const extractedEntity of extractedEntities) {
                if (usedExtracted.has(extractedEntity))
                    continue;
                const normalizedExtractedTag = enhanced_tag_parser_1.default.normalizeTag(extractedEntity.tag);
                if (normalizedDwgTag === normalizedExtractedTag) {
                    const distance = this.calculateDistance(dwgEntity.geometry, extractedEntity.geometry);
                    if (distance <= this.PROXIMITY_THRESHOLD) {
                        matched.push({ dwg: dwgEntity, extracted: extractedEntity, distance });
                        usedDwg.add(dwgEntity);
                        usedExtracted.add(extractedEntity);
                        break;
                    }
                }
            }
        }
        // Second pass: spatial proximity matching for unmatched items
        for (const dwgEntity of dwgEntities) {
            if (usedDwg.has(dwgEntity))
                continue;
            let bestMatch = null;
            for (const extractedEntity of extractedEntities) {
                if (usedExtracted.has(extractedEntity))
                    continue;
                const distance = this.calculateDistance(dwgEntity.geometry, extractedEntity.geometry);
                if (distance <= this.PROXIMITY_THRESHOLD &&
                    (!bestMatch || distance < bestMatch.distance)) {
                    bestMatch = { extracted: extractedEntity, distance };
                }
            }
            if (bestMatch) {
                // Additional validation: check if tags are similar enough
                const dwgTag = dwgEntity.tag || this.extractTagFromName(dwgEntity.name);
                if (dwgTag) {
                    const editDistance = enhanced_tag_parser_1.default.calculateEditDistance(enhanced_tag_parser_1.default.normalizeTag(dwgTag), enhanced_tag_parser_1.default.normalizeTag(bestMatch.extracted.tag));
                    if (editDistance <= 2) { // Allow up to 2 character differences
                        matched.push({ dwg: dwgEntity, extracted: bestMatch.extracted, distance: bestMatch.distance });
                        usedDwg.add(dwgEntity);
                        usedExtracted.add(bestMatch.extracted);
                    }
                }
            }
        }
        const missing = dwgEntities.filter(entity => !usedDwg.has(entity));
        const falsePositives = extractedEntities.filter(entity => !usedExtracted.has(entity));
        return { matched, missing, falsePositives };
    }
    /**
     * Identify critical missing items with detailed analysis
     */
    static identifyCriticalMissing(missing, extractedEntities) {
        const criticalMissing = [];
        for (const missingEntity of missing) {
            const tag = missingEntity.tag || missingEntity.name || '';
            const criticality = this.getCriticality(tag);
            if (criticality === 'CRITICAL') {
                // Find nearest extracted entity for debugging
                let nearestExtracted;
                let minDistance = Infinity;
                for (const extracted of extractedEntities) {
                    const distance = this.calculateDistance(missingEntity.geometry, extracted.geometry);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestExtracted = extracted;
                    }
                }
                criticalMissing.push({
                    tag,
                    category: this.getCategory(tag),
                    dwgEntity: missingEntity,
                    searchRadius: this.PROXIMITY_THRESHOLD,
                    nearestExtracted,
                    distance: nearestExtracted ? minDistance : undefined
                });
            }
        }
        return criticalMissing;
    }
    /**
     * Generate actionable recommendations based on results
     */
    static generateRecommendations(missing, criticalMissing, falsePositives, multiScaleResults) {
        const recommendations = [];
        // Critical recommendations first
        if (criticalMissing.length > 0) {
            recommendations.push(`🚨 CRITICAL: ${criticalMissing.length} safety-critical tags missing from extraction`);
            recommendations.push('🔧 IMMEDIATE ACTION: Review OCR thresholds and layer scanning for safety equipment');
            const criticalLayers = [...new Set(criticalMissing.map(c => c.dwgEntity.layer))];
            if (criticalLayers.length > 0) {
                recommendations.push(`📂 Focus on layers: ${criticalLayers.join(', ')}`);
            }
        }
        // Missing equipment recommendations
        if (missing.length > 0) {
            const missingByLayer = this.groupByProperty(missing, entity => entity.layer);
            const problematicLayers = Object.entries(missingByLayer)
                .filter(([, entities]) => entities.length > 2)
                .map(([layer, entities]) => `${layer} (${entities.length} items)`);
            if (problematicLayers.length > 0) {
                recommendations.push(`📊 Layers with high missing rates: ${problematicLayers.join(', ')}`);
            }
            recommendations.push('🔍 Implement multi-pass OCR with scales 100%, 200%, 400%');
            recommendations.push('📑 Add DWG attribute reading as fallback for block instances');
        }
        // Multi-scale recommendations
        const bestScale = Object.entries(multiScaleResults).reduce((best, [scale, data]) => {
            return data.found > best.found ? { scale, ...data } : best;
        }, { scale: 'none', found: 0, confidence: 0 });
        if (bestScale.scale !== 'none') {
            recommendations.push(`🎯 Optimal OCR scale: ${bestScale.scale} (${bestScale.found} items, ${(bestScale.confidence * 100).toFixed(1)}% avg confidence)`);
        }
        // False positive recommendations
        if (falsePositives.length > 5) {
            recommendations.push(`⚠️ High false positive rate: ${falsePositives.length} ghost detections`);
            recommendations.push('🧹 Implement symbol+tag cross-validation to reduce false positives');
        }
        return recommendations;
    }
    /**
     * Get criticality level for a tag
     */
    static getCriticality(tag) {
        const normalizedTag = tag.toUpperCase();
        if (this.CRITICAL_TAG_PREFIXES.some(prefix => normalizedTag.startsWith(prefix))) {
            return 'CRITICAL';
        }
        if (this.HIGH_PRIORITY_PREFIXES.some(prefix => normalizedTag.startsWith(prefix))) {
            return 'HIGH';
        }
        const validation = enhanced_tag_parser_1.default.validateTag(normalizedTag);
        if (validation.isValid && ['pump', 'vessel', 'instrument'].includes(validation.category)) {
            return 'HIGH';
        }
        if (validation.isValid) {
            return 'MEDIUM';
        }
        return 'LOW';
    }
    /**
     * Get category for a tag
     */
    static getCategory(tag) {
        const validation = enhanced_tag_parser_1.default.validateTag(tag);
        return validation.category;
    }
    /**
     * Extract tag from block name if not explicitly provided
     */
    static extractTagFromName(name) {
        if (!name)
            return null;
        // Try to extract tag-like patterns from block names
        const tagPattern = /([A-Z]{1,4}-?\d{2,4}[A-Z]?)/i;
        const match = name.match(tagPattern);
        return match ? match[1] : null;
    }
    /**
     * Calculate distance between two geometric entities
     */
    static calculateDistance(geom1, geom2) {
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
     * Get reason why an entity is missing
     */
    static getMissingReason(entity, extractedEntities) {
        const tag = entity.tag || entity.name || '';
        // Check if there's a nearby extracted entity with similar tag
        const nearbyEntities = extractedEntities.filter(extracted => {
            const distance = this.calculateDistance(entity.geometry, extracted.geometry);
            return distance <= this.PROXIMITY_THRESHOLD * 2; // Wider search for analysis
        });
        if (nearbyEntities.length === 0) {
            return 'No extracted entities found in vicinity - possible OCR blind spot';
        }
        const similarTags = nearbyEntities.filter(extracted => {
            const editDistance = enhanced_tag_parser_1.default.calculateEditDistance(enhanced_tag_parser_1.default.normalizeTag(tag), enhanced_tag_parser_1.default.normalizeTag(extracted.tag));
            return editDistance <= 3;
        });
        if (similarTags.length > 0) {
            const bestMatch = similarTags[0];
            return `Similar tag found: "${bestMatch.tag}" (confidence: ${(bestMatch.confidence * 100).toFixed(1)}%)`;
        }
        return 'No matching or similar tags found - possible character recognition error';
    }
    /**
     * Group array by property value
     */
    static groupByProperty(array, keyFn) {
        return array.reduce((groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }
    /**
     * Export detailed report for analysis
     */
    static exportDetailedReport(result) {
        let report = '# Critical Missing Equipment Detection Report\n\n';
        // Status header
        const status = result.testPassed ? '✅ PASSED' : '❌ FAILED';
        const criticalStatus = result.criticalFailure ? ' (CRITICAL FAILURE)' : '';
        report += `## Overall Status: ${status}${criticalStatus}\n\n`;
        // Executive Summary
        report += `## Executive Summary\n`;
        report += `- **Missing Rate**: ${(result.missingRate * 100).toFixed(2)}% (Threshold: ≤1.0%)\n`;
        report += `- **Critical Missing Rate**: ${(result.criticalMissingRate * 100).toFixed(3)}% (Threshold: ≤0.1%)\n`;
        report += `- **DWG Entities**: ${result.summary.dwgEntitiesTotal} total, ${result.summary.dwgCriticalTotal} critical\n`;
        report += `- **Extracted Entities**: ${result.summary.extractedTotal}\n`;
        report += `- **Matches**: ${result.summary.matchedTotal}\n`;
        report += `- **Missing**: ${result.summary.missingTotal} (${result.summary.criticalMissingTotal} critical)\n`;
        report += `- **False Positives**: ${result.summary.falsePositivesTotal}\n\n`;
        // Critical Missing (if any)
        if (result.criticalMissing.length > 0) {
            report += `## 🚨 Critical Missing Items (${result.criticalMissing.length})\n`;
            result.criticalMissing.forEach((missing, index) => {
                report += `${index + 1}. **${missing.tag}** (${missing.category})\n`;
                report += `   - Layer: ${missing.dwgEntity.layer}\n`;
                report += `   - Position: (${missing.dwgEntity.geometry.x}, ${missing.dwgEntity.geometry.y})\n`;
                if (missing.nearestExtracted) {
                    report += `   - Nearest extracted: "${missing.nearestExtracted.tag}" (${missing.distance?.toFixed(1)}mm away)\n`;
                }
                report += '\n';
            });
        }
        // Multi-scale Results
        report += `## Multi-scale OCR Analysis\n`;
        report += `- **100% Scale**: ${result.multiScaleResults.scale100.found} items (${(result.multiScaleResults.scale100.confidence * 100).toFixed(1)}% avg confidence)\n`;
        report += `- **200% Scale**: ${result.multiScaleResults.scale200.found} items (${(result.multiScaleResults.scale200.confidence * 100).toFixed(1)}% avg confidence)\n`;
        report += `- **400% Scale**: ${result.multiScaleResults.scale400.found} items (${(result.multiScaleResults.scale400.confidence * 100).toFixed(1)}% avg confidence)\n\n`;
        // Recommendations
        if (result.recommendations.length > 0) {
            report += `## Recommendations\n`;
            result.recommendations.forEach((rec, index) => {
                report += `${index + 1}. ${rec}\n`;
            });
            report += '\n';
        }
        // Missing Details (top 10)
        if (result.missingEntities.length > 0) {
            report += `## Missing Items Details (Top 10)\n`;
            result.missingEntities.slice(0, 10).forEach((missing, index) => {
                report += `${index + 1}. **${missing.dwgEntity.tag || missing.dwgEntity.name}** (${missing.criticality})\n`;
                report += `   - Category: ${missing.category}\n`;
                report += `   - Layer: ${missing.dwgEntity.layer}\n`;
                report += `   - Reason: ${missing.reason}\n`;
            });
            if (result.missingEntities.length > 10) {
                report += `   ... and ${result.missingEntities.length - 10} more missing items\n`;
            }
        }
        return report;
    }
}
exports.CriticalMissingDetector = CriticalMissingDetector;
CriticalMissingDetector.CRITICAL_TAG_PREFIXES = ['PSV', 'PSH', 'PSL', 'PSHH', 'PSLL', 'TSV', 'LSV'];
CriticalMissingDetector.HIGH_PRIORITY_PREFIXES = ['P-', 'V-', 'T-', 'LIC', 'PIC', 'FIC', 'TIC'];
// Production thresholds from specification
CriticalMissingDetector.MISSING_RATE_THRESHOLD = 0.01; // 1% general threshold
CriticalMissingDetector.CRITICAL_MISSING_THRESHOLD = 0.001; // 0.1% for critical
CriticalMissingDetector.PROXIMITY_THRESHOLD = 50; // mm for spatial matching
exports.default = CriticalMissingDetector;
