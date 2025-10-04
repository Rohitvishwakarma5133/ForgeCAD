/**
 * Example Usage and Test Data for CAD Validation System
 * This demonstrates how to use the validation tools with sample data
 */

import TagParser from './tag-parser';
import MissingEquipmentDetector, { DWGEntity, ExtractedTag } from './missing-equipment-detector';
import FalsePositiveValidator, { DetectedSymbol, SymbolTemplate } from './false-positive-validator';
import AutomatedTestingFramework from './automated-testing-framework';

// Sample data that represents typical CAD extraction results
export const sampleDWGEntities: DWGEntity[] = [
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
  }
];

export const sampleExtractedTags: ExtractedTag[] = [
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
];

export const sampleDetectedSymbols: DetectedSymbol[] = [
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
];

/**
 * Example function showing how to run tag parsing
 */
export async function exampleTagParsing() {
  console.log('🏷️ Example: Tag Parsing and Normalization\n');
  
  const tagParser = new TagParser();
  const tags = ['P-I01A', 'FV-101', 'PT-1OI', '6"-CS-150', 'INVALID-TAG-123'];
  
  console.log('Input tags:', tags);
  console.log('---');
  
  for (const tag of tags) {
    const result = tagParser.parseTag(tag);
    console.log(`Original: "${result.originalTag}"`);
    console.log(`Normalized: "${result.normalizedTag}"`);
    console.log(`Category: ${result.category}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    if (result.issues.length > 0) {
      console.log(`Issues: ${result.issues.join(', ')}`);
    }
    console.log('---');
  }
  
  // Batch processing
  const batchResults = tagParser.parseTagsBatch(tags);
  const stats = tagParser.getValidationStats(batchResults);
  
  console.log('Batch Statistics:');
  console.log(`- Valid tags: ${stats.validTags}/${stats.totalTags}`);
  console.log(`- Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
  console.log(`- Categories:`, stats.categoryBreakdown);
  console.log('');
}

/**
 * Example function showing missing equipment detection
 */
export async function exampleMissingEquipmentDetection() {
  console.log('🔍 Example: Missing Equipment Detection\n');
  
  const detector = new MissingEquipmentDetector();
  const result = detector.detectMissingEquipment(sampleDWGEntities, sampleExtractedTags);
  
  console.log('Detection Results:');
  console.log(`- DWG entities analyzed: ${result.analysis.totalDwgEntities}`);
  console.log(`- Extracted tags: ${result.analysis.totalExtractedTags}`);
  console.log(`- Successful matches: ${result.analysis.matchedTags.length}`);
  console.log(`- Missing from extraction: ${result.analysis.missingTags.length}`);
  console.log(`- False positives: ${result.analysis.falsePositives.length}`);
  console.log(`- Overall confidence: ${(result.analysis.confidence * 100).toFixed(1)}%`);
  
  if (result.analysis.missingTags.length > 0) {
    console.log('\nMissing Tags:');
    result.analysis.missingTags.forEach(missing => {
      console.log(`- ${missing.type} "${missing.text || missing.name}" on layer "${missing.layer}"`);
    });
  }
  
  if (result.analysis.falsePositives.length > 0) {
    console.log('\nFalse Positives:');
    result.analysis.falsePositives.forEach(fp => {
      console.log(`- "${fp.tag}" (confidence: ${(fp.confidence * 100).toFixed(1)}%)`);
    });
  }
  
  console.log('\nRecommendations:');
  result.analysis.recommendations.forEach(rec => {
    console.log(`- ${rec}`);
  });
  
  // Export detailed report
  const report = detector.exportReport(result);
  console.log('\n📄 Detailed Report:');
  console.log(report);
  console.log('');
}

/**
 * Example function showing false positive validation
 */
export async function exampleFalsePositiveValidation() {
  console.log('🚫 Example: False Positive Validation\n');
  
  const validator = new FalsePositiveValidator();
  const results = validator.validateExtraction(sampleDetectedSymbols, sampleExtractedTags);
  
  console.log('Validation Results:');
  console.log(`- Items validated: ${results.length}`);
  console.log(`- Valid items: ${results.filter(r => r.isValid).length}`);
  console.log(`- Invalid items (potential false positives): ${results.filter(r => !r.isValid).length}`);
  
  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const itemName = 'template' in result.item ? result.item.template.name : result.item.tag;
    console.log(`${index + 1}. ${itemName}`);
    console.log(`   Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    if (result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.map(i => i.description).join(', ')}`);
    }
    if (result.recommendations.length > 0) {
      console.log(`   Recommendations: ${result.recommendations.join(', ')}`);
    }
  });
  
  // Generate validation report
  const report = validator.generateValidationReport(results);
  console.log('\n📊 Validation Report:');
  console.log(report);
  console.log('');
}

/**
 * Example function showing automated testing framework
 */
export async function exampleAutomatedTesting() {
  console.log('🧪 Example: Automated Testing Framework\n');
  
  const testFramework = new AutomatedTestingFramework({
    dwgToExtractedThreshold: 2.0,
    confidenceThreshold: 90.0,
    visualDiffEnabled: true
  });
  
  const testResults = await testFramework.runTestSuite(sampleDWGEntities, sampleExtractedTags);
  
  console.log('Test Results Summary:');
  console.log(`- Overall Score: ${testResults.overallScore}%`);
  console.log(`- DWG Extraction Test: ${testResults.dwgExtractionDiff.testPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`- Discrepancy: ${testResults.dwgExtractionDiff.discrepancyPercentage.toFixed(1)}%`);
  console.log(`- Confidence Calibration Score: ${(testResults.confidenceCalibration.calibrationScore * 100).toFixed(1)}%`);
  console.log(`- Overconfident Items: ${testResults.confidenceCalibration.overconfidentCount}`);
  
  console.log('\nTest Recommendations:');
  testResults.recommendations.forEach(rec => {
    console.log(`- ${rec}`);
  });
  
  // Export full test report
  const report = testFramework.exportTestReport(testResults);
  console.log('\n📋 Full Test Report:');
  console.log(report);
  console.log('');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running CAD Validation System Examples\n');
  console.log('=' .repeat(60));
  
  await exampleTagParsing();
  console.log('=' .repeat(60));
  
  await exampleMissingEquipmentDetection();
  console.log('=' .repeat(60));
  
  await exampleFalsePositiveValidation();
  console.log('=' .repeat(60));
  
  await exampleAutomatedTesting();
  console.log('=' .repeat(60));
  
  console.log('✅ All examples completed!');
}

// Example of how to generate regex patterns and normalization rules as requested
export const exampleRegexPatterns = {
  pumps: /^P-\d{3}[A-Z]?$/i,
  valves: /^[A-Z]*V-\d{3}[A-Z]?$/i,
  instruments: /^[A-Z]{2,3}-\d{3}[A-Z]?$/i,
  vessels: /^[TRD]-\d{3}[A-Z]?$/i,
  lines: /^\d+["\s]*-[A-Z]{2,4}-\d{3}$/i,
  
  // More specific patterns
  pressureInstruments: /^P[ICTSA]-\d{3}[A-Z]?$/i,
  flowInstruments: /^F[ICTSA]-\d{3}[A-Z]?$/i,
  temperatureInstruments: /^T[ICTSA]-\d{3}[A-Z]?$/i,
  levelInstruments: /^L[ICTSA]-\d{3}[A-Z]?$/i,
  
  // Safety instruments
  safetyValves: /^PSV-\d{3}[A-Z]?$/i,
  reliefValves: /^PRV-\d{3}[A-Z]?$/i,
  shutdownValves: /^SDV-\d{3}[A-Z]?$/i
};

export const exampleNormalizationRules = {
  characterSubstitutions: {
    'O': '0', // In numeric context
    'I': '1', // In numeric context
    'S': '5', // In numeric context
    'Z': '2', // In numeric context
    'l': '1', // Lowercase L to 1
    '|': '1', // Pipe character to 1
    '_': '-', // Underscore to hyphen
    '‐': '-', // En dash to hyphen
    '—': '-'  // Em dash to hyphen
  },
  
  unitNormalizations: {
    'inch': '"',
    'inches': '"',
    'in': '"',
    'psi': 'PSI',
    'psig': 'PSIG',
    'cs': 'CS',
    'ss': 'SS'
  },
  
  materialMappings: {
    'carbon steel': 'CS',
    'stainless steel': 'SS',
    'carbon_steel': 'CS',
    'stainless_steel': 'SS'
  }
};

// Example of DWG vs extracted tag table generation
export function generateTagComparisonTable(dwgEntities: DWGEntity[], extractedTags: ExtractedTag[]) {
  const table = [];
  
  for (const entity of dwgEntities) {
    if (!entity.text && !entity.name) continue;
    
    const tagText = entity.text || entity.name || '';
    const correspondingExtracted = extractedTags.find(tag => {
      // Simple similarity check - in practice you'd use more sophisticated matching
      return tag.tag.toLowerCase().includes(tagText.toLowerCase().substring(0, 3));
    });
    
    table.push({
      dwgTag: tagText,
      extractedTag: correspondingExtracted?.tag || 'MISSING',
      confidence: correspondingExtracted?.confidence || 0,
      dwgLayer: entity.layer,
      geometry: entity.geometry,
      status: correspondingExtracted ? 'MATCHED' : 'MISSING_IN_EXTRACTION'
    });
  }
  
  // Add extracted tags that don't have DWG correspondence
  for (const extracted of extractedTags) {
    const hasDWGMatch = dwgEntities.some(entity => {
      const tagText = entity.text || entity.name || '';
      return extracted.tag.toLowerCase().includes(tagText.toLowerCase().substring(0, 3));
    });
    
    if (!hasDWGMatch) {
      table.push({
        dwgTag: 'NOT_FOUND',
        extractedTag: extracted.tag,
        confidence: extracted.confidence,
        dwgLayer: 'N/A',
        geometry: extracted.geometry,
        status: 'FALSE_POSITIVE'
      });
    }
  }
  
  return table;
}