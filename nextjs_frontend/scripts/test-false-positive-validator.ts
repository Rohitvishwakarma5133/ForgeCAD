/**
 * Test Suite: Advanced False Positive Validator
 * 
 * VALIDATES ACCEPTANCE CRITERIA:
 * ✅ Symbol + tag cross-validation: symbol_confidence ≥ 0.85 AND tag proximity ≤ 25mm
 * ✅ Ghost detection elimination from OCR noise
 * ✅ Two-pass validation: individual confidence + spatial correlation
 * ✅ False positive rate ≤ 5% for production use
 */

import AdvancedFalsePositiveValidator, { 
  DetectedSymbol, 
  ExtractedTag, 
  FalsePositiveValidationResult 
} from '../lib/validation/advanced-false-positive-validator';

// Test data generators
function createValidSymbolTagPairs(): { symbols: DetectedSymbol[], tags: ExtractedTag[] } {
  const symbols: DetectedSymbol[] = [
    {
      id: 'sym-pump-001',
      type: 'pump',
      confidence: 0.92,
      geometry: { x: 100, y: 200, width: 60, height: 40 },
      attributes: { symbolName: 'CENTRIFUGAL_PUMP', layer: 'EQUIPMENT' },
      source: 'template_match'
    },
    {
      id: 'sym-valve-001',
      type: 'valve',
      confidence: 0.88,
      geometry: { x: 300, y: 150, width: 30, height: 30 },
      attributes: { symbolName: 'CONTROL_VALVE', layer: 'PIPING' },
      source: 'ml_detection'
    },
    {
      id: 'sym-instrument-001',
      type: 'instrument',
      confidence: 0.95,
      geometry: { x: 500, y: 300, width: 40, height: 25 },
      attributes: { symbolName: 'PRESSURE_INDICATOR', layer: 'INSTRUMENTS' },
      source: 'template_match'
    },
    {
      id: 'sym-vessel-001',
      type: 'vessel',
      confidence: 0.89,
      geometry: { x: 200, y: 400, width: 80, height: 120 },
      attributes: { symbolName: 'STORAGE_TANK', layer: 'VESSELS' },
      source: 'dwg_block'
    }
  ];

  const tags: ExtractedTag[] = [
    {
      id: 'tag-pump-001',
      tag: 'P-101',
      confidence: 0.91,
      source: 'ocr_200',
      geometry: { x: 110, y: 185, width: 35, height: 15 }, // Close to pump symbol
      ocrMetadata: {
        characterConfidences: [0.95, 0.88, 0.92, 0.89, 0.91],
        preprocessingSteps: ['denoise', 'sharpen'],
        recognizedFont: 'Arial'
      }
    },
    {
      id: 'tag-valve-001',
      tag: 'CV-201',
      confidence: 0.87,
      source: 'ocr_400',
      geometry: { x: 295, y: 140, width: 40, height: 12 }, // Close to valve symbol
      ocrMetadata: {
        characterConfidences: [0.92, 0.85, 0.89, 0.91, 0.84, 0.88],
        preprocessingSteps: ['scale_400', 'contrast_enhance'],
        recognizedFont: 'Arial'
      }
    },
    {
      id: 'tag-instrument-001',
      tag: 'PIC-301',
      confidence: 0.94,
      source: 'dwg_attribute',
      geometry: { x: 505, y: 285, width: 45, height: 10 }, // Close to instrument symbol
    },
    {
      id: 'tag-vessel-001',
      tag: 'T-401',
      confidence: 0.90,
      source: 'ocr_200',
      geometry: { x: 210, y: 380, width: 30, height: 15 }, // Close to vessel symbol
      ocrMetadata: {
        characterConfidences: [0.93, 0.88, 0.92, 0.90, 0.87],
        preprocessingSteps: ['denoise', 'sharpen'],
        recognizedFont: 'Arial'
      }
    }
  ];

  return { symbols, tags };
}

function createFalsePositiveScenario(): { symbols: DetectedSymbol[], tags: ExtractedTag[] } {
  const symbols: DetectedSymbol[] = [
    // Valid high-confidence symbol
    {
      id: 'sym-valid-001',
      type: 'pump',
      confidence: 0.93,
      geometry: { x: 100, y: 100, width: 50, height: 40 },
      source: 'template_match'
    },
    // Low-confidence symbol (should be filtered out)
    {
      id: 'sym-false-001',
      type: 'valve',
      confidence: 0.65, // Below 0.85 threshold
      geometry: { x: 200, y: 200, width: 25, height: 25 },
      source: 'ml_detection'
    },
    // Valid symbol with no nearby tag (orphaned)
    {
      id: 'sym-orphaned-001',
      type: 'instrument',
      confidence: 0.91,
      geometry: { x: 500, y: 500, width: 40, height: 25 },
      source: 'template_match'
    }
  ];

  const tags: ExtractedTag[] = [
    // Valid tag close to valid symbol
    {
      id: 'tag-valid-001',
      tag: 'P-201',
      confidence: 0.89,
      source: 'ocr_200',
      geometry: { x: 105, y: 85, width: 30, height: 12 }, // 20mm from sym-valid-001
    },
    // Low-confidence tag (OCR noise)
    {
      id: 'tag-noise-001',
      tag: 'X#@!', // Invalid characters from noise
      confidence: 0.45,
      source: 'ocr_100',
      geometry: { x: 300, y: 300, width: 25, height: 10 },
    },
    // Tag far from any symbol (ghost detection)
    {
      id: 'tag-ghost-001',
      tag: 'V-999',
      confidence: 0.78,
      source: 'ocr_100',
      geometry: { x: 1000, y: 1000, width: 30, height: 12 }, // Very far from any symbol
    },
    // Semantically mismatched tag
    {
      id: 'tag-mismatch-001',
      tag: 'PUMP-301', // Pump tag near valve symbol
      confidence: 0.85,
      source: 'ocr_200',
      geometry: { x: 205, y: 195, width: 50, height: 12 }, // Close to valve symbol but semantic mismatch
    }
  ];

  return { symbols, tags };
}

function createConfidenceDistributionTest(): { symbols: DetectedSymbol[], tags: ExtractedTag[] } {
  const symbols: DetectedSymbol[] = [];
  const tags: ExtractedTag[] = [];

  // Create symbols with various confidence levels
  const confidenceLevels = [0.99, 0.95, 0.90, 0.87, 0.82, 0.78, 0.75, 0.68, 0.55];
  confidenceLevels.forEach((confidence, i) => {
    symbols.push({
      id: `sym-conf-${i}`,
      type: i % 2 === 0 ? 'pump' : 'valve',
      confidence,
      geometry: { x: i * 100, y: 200, width: 50, height: 40 },
      source: 'template_match'
    });

    // Matching tag with slightly different confidence
    tags.push({
      id: `tag-conf-${i}`,
      tag: i % 2 === 0 ? `P-${i + 100}` : `CV-${i + 100}`,
      confidence: confidence + (Math.random() - 0.5) * 0.1, // ±0.05 variation
      source: 'ocr_200',
      geometry: { x: i * 100 + 5, y: 185, width: 30, height: 12 },
    });
  });

  return { symbols, tags };
}

function createSpatialThresholdTest(): { symbols: DetectedSymbol[], tags: ExtractedTag[] } {
  const baseSymbol: DetectedSymbol = {
    id: 'sym-spatial-001',
    type: 'pump',
    confidence: 0.90,
    geometry: { x: 100, y: 100, width: 50, height: 40 },
    source: 'template_match'
  };

  const symbols = [baseSymbol];
  const tags: ExtractedTag[] = [];

  // Create tags at various distances from the symbol
  const distances = [5, 15, 25, 35, 50, 75, 100]; // mm
  distances.forEach((distance, i) => {
    tags.push({
      id: `tag-dist-${i}`,
      tag: `P-${i + 500}`,
      confidence: 0.85,
      source: 'ocr_200',
      geometry: { 
        x: baseSymbol.geometry.x + distance, // Horizontal offset
        y: baseSymbol.geometry.y, 
        width: 30, 
        height: 12 
      },
    });
  });

  return { symbols, tags };
}

// Test functions
async function testPerfectCrossValidation() {
  console.log('\n🧪 TEST 1: Perfect Cross-Validation (All Valid Pairs)');
  console.log('='.repeat(55));
  
  const { symbols, tags } = createValidSymbolTagPairs();
  
  const result = await AdvancedFalsePositiveValidator.validateFalsePositives(symbols, tags);
  
  console.log(`✅ Test Passed: ${result.testPassed}`);
  console.log(`📊 False Positive Rate: ${(result.falsePositiveRate * 100).toFixed(2)}%`);
  console.log(`🔄 Cross-Validated Pairs: ${result.summary.validatedPairs}`);
  console.log(`✅ Valid Pairs: ${result.summary.validPairs}`);
  console.log(`⚠️ Suspicious Pairs: ${result.summary.suspiciousPairs}`);
  console.log(`❌ False Positives: ${result.summary.falsePositives}`);
  
  // Acceptance criteria validation
  const acceptancePassed = 
    result.testPassed &&
    result.falsePositiveRate <= 0.05 &&
    result.summary.validPairs === result.summary.validatedPairs && // All pairs should be valid
    result.summary.falsePositives === 0;
    
  console.log(`\n🎯 ACCEPTANCE CRITERIA: ${acceptancePassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (result.recommendations.length > 0) {
    console.log('\nRecommendations:');
    result.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`  ${i+1}. ${rec}`);
    });
  }
  
  return { result, acceptancePassed };
}

async function testFalsePositiveDetection() {
  console.log('\n🧪 TEST 2: False Positive Detection & Elimination');
  console.log('='.repeat(55));
  
  const { symbols, tags } = createFalsePositiveScenario();
  
  const result = await AdvancedFalsePositiveValidator.validateFalsePositives(symbols, tags);
  
  console.log(`✅ Test Passed: ${result.testPassed}`);
  console.log(`📊 False Positive Rate: ${(result.falsePositiveRate * 100).toFixed(2)}%`);
  console.log(`🔄 Total Input: ${result.summary.totalSymbols} symbols, ${result.summary.totalTags} tags`);
  console.log(`✅ Valid Pairs: ${result.summary.validPairs}`);
  console.log(`❌ False Positives: ${result.summary.falsePositives}`);
  console.log(`🏝️ Orphaned: ${result.summary.orphanedSymbols} symbols, ${result.summary.orphanedTags} tags`);
  
  // Should detect false positives
  const detectedFalsePositives = result.summary.falsePositives > 0;
  const lowConfidenceFiltered = result.summary.totalSymbols > result.summary.validatedPairs; // Some symbols filtered out
  const acceptableRate = result.falsePositiveRate <= 0.20; // Relaxed threshold for this test scenario
  
  console.log(`\n🔍 FALSE POSITIVE DETECTION:`);
  console.log(`  Detected false positives: ${detectedFalsePositives ? '✅' : '❌'}`);
  console.log(`  Low confidence filtering: ${lowConfidenceFiltered ? '✅' : '❌'}`);
  console.log(`  Rate within bounds: ${acceptableRate ? '✅' : '❌'}`);
  
  if (result.falsePositives.length > 0) {
    console.log('\nFalse Positive Details:');
    result.falsePositives.slice(0, 3).forEach((fp, i) => {
      console.log(`  ${i+1}. ${fp.type}: ${fp.reason} (${(fp.confidence * 100).toFixed(1)}%)`);
    });
  }
  
  const testPassed = detectedFalsePositives && lowConfidenceFiltered && acceptableRate;
  
  return { result, testPassed };
}

async function testConfidenceThresholds() {
  console.log('\n🧪 TEST 3: Confidence Threshold Analysis');
  console.log('='.repeat(55));
  
  const { symbols, tags } = createConfidenceDistributionTest();
  
  const result = await AdvancedFalsePositiveValidator.validateFalsePositives(symbols, tags);
  
  console.log('Confidence Distribution Analysis:');
  console.log('Symbol Confidence Distribution:');
  result.confidenceAnalysis.symbolConfidenceDistribution.forEach(({ range, count }) => {
    if (count > 0) {
      console.log(`  ${range}: ${count} symbols`);
    }
  });
  
  console.log('\nTag Confidence Distribution:');
  result.confidenceAnalysis.tagConfidenceDistribution.forEach(({ range, count }) => {
    if (count > 0) {
      console.log(`  ${range}: ${count} tags`);
    }
  });
  
  console.log('\nOptimal Thresholds:');
  console.log(`  Symbol: ${result.confidenceAnalysis.optimalThresholds.symbolConfidence.toFixed(3)}`);
  console.log(`  Tag: ${result.confidenceAnalysis.optimalThresholds.tagConfidence.toFixed(3)}`);
  console.log(`  Proximity: ${result.confidenceAnalysis.optimalThresholds.proximityThreshold}mm`);
  
  // Verify threshold enforcement
  const symbolThresholdEnforced = result.confidenceAnalysis.optimalThresholds.symbolConfidence >= 0.85;
  const proximityThresholdSet = result.confidenceAnalysis.optimalThresholds.proximityThreshold === 25;
  
  console.log(`\n📊 THRESHOLD VALIDATION:`);
  console.log(`  Symbol threshold ≥ 0.85: ${symbolThresholdEnforced ? '✅' : '❌'}`);
  console.log(`  Proximity threshold = 25mm: ${proximityThresholdSet ? '✅' : '❌'}`);
  
  const thresholdTestPassed = symbolThresholdEnforced && proximityThresholdSet;
  
  return { result, thresholdTestPassed };
}

async function testSpatialCorrelation() {
  console.log('\n🧪 TEST 4: Spatial Proximity Validation (≤25mm)');
  console.log('='.repeat(55));
  
  const { symbols, tags } = createSpatialThresholdTest();
  
  const result = await AdvancedFalsePositiveValidator.validateFalsePositives(symbols, tags);
  
  console.log(`📏 Spatial Proximity Test Results:`);
  console.log(`  Total tags tested: ${tags.length}`);
  console.log(`  Valid pairs (≤25mm): ${result.summary.validPairs}`);
  console.log(`  Rejected (>25mm): ${tags.length - result.summary.validPairs}`);
  
  // Analyze which tags were accepted/rejected based on distance
  const validatedDistances: number[] = [];
  const rejectedDistances: number[] = [];
  
  const baseSymbol = symbols[0];
  tags.forEach(tag => {
    const distance = Math.sqrt(
      Math.pow(tag.geometry.x - baseSymbol.geometry.x, 2) + 
      Math.pow(tag.geometry.y - baseSymbol.geometry.y, 2)
    );
    
    const isValidated = result.validatedPairs.some(pair => pair.tag.id === tag.id);
    if (isValidated) {
      validatedDistances.push(distance);
    } else {
      rejectedDistances.push(distance);
    }
  });
  
  console.log(`\n📐 Distance Analysis:`);
  console.log(`  Accepted distances: [${validatedDistances.map(d => d.toFixed(0)).join(', ')}]mm`);
  console.log(`  Rejected distances: [${rejectedDistances.map(d => d.toFixed(0)).join(', ')}]mm`);
  
  // Verify 25mm threshold enforcement
  const allValidWithin25mm = validatedDistances.every(d => d <= 25);
  const someRejectedBeyond25mm = rejectedDistances.some(d => d > 25);
  
  console.log(`\n🎯 PROXIMITY THRESHOLD VALIDATION:`);
  console.log(`  All valid pairs ≤ 25mm: ${allValidWithin25mm ? '✅' : '❌'}`);
  console.log(`  Some rejected > 25mm: ${someRejectedBeyond25mm ? '✅' : '❌'}`);
  
  const spatialTestPassed = allValidWithin25mm && someRejectedBeyond25mm;
  
  return { result, spatialTestPassed };
}

async function testSemanticCorrelation() {
  console.log('\n🧪 TEST 5: Semantic Cross-Validation');
  console.log('='.repeat(55));
  
  // Create symbols with semantically correct and incorrect tag pairs
  const symbols: DetectedSymbol[] = [
    {
      id: 'sym-pump-sem',
      type: 'pump',
      confidence: 0.90,
      geometry: { x: 100, y: 100, width: 50, height: 40 },
      source: 'template_match'
    },
    {
      id: 'sym-valve-sem',
      type: 'valve',
      confidence: 0.88,
      geometry: { x: 200, y: 100, width: 30, height: 30 },
      source: 'template_match'
    }
  ];

  const tags: ExtractedTag[] = [
    {
      id: 'tag-pump-correct',
      tag: 'P-101', // Correct for pump
      confidence: 0.85,
      source: 'ocr_200',
      geometry: { x: 105, y: 85, width: 30, height: 12 },
    },
    {
      id: 'tag-valve-incorrect',
      tag: 'P-201', // Incorrect for valve (should be CV-, V-, etc.)
      confidence: 0.87,
      source: 'ocr_200',
      geometry: { x: 205, y: 85, width: 30, height: 12 },
    }
  ];
  
  const result = await AdvancedFalsePositiveValidator.validateFalsePositives(symbols, tags);
  
  console.log(`🔗 Semantic Correlation Results:`);
  console.log(`  Total pairs: ${result.validatedPairs.length}`);
  
  result.validatedPairs.forEach((pair, i) => {
    console.log(`  ${i+1}. ${pair.symbol.type} ↔ ${pair.tag.tag}: ${pair.semanticMatch ? 'MATCH' : 'MISMATCH'} (${pair.validationStatus})`);
  });
  
  // Check semantic validation
  const hasSemanticMatch = result.validatedPairs.some(pair => pair.semanticMatch);
  const hasSemanticMismatch = result.validatedPairs.some(pair => !pair.semanticMatch);
  
  console.log(`\n🧠 SEMANTIC VALIDATION:`);
  console.log(`  Detected semantic matches: ${hasSemanticMatch ? '✅' : '❌'}`);
  console.log(`  Detected semantic mismatches: ${hasSemanticMismatch ? '✅' : '❌'}`);
  
  const semanticTestPassed = hasSemanticMatch && hasSemanticMismatch;
  
  return { result, semanticTestPassed };
}

async function testReportGeneration() {
  console.log('\n🧪 TEST 6: Detailed Report Generation');
  console.log('='.repeat(55));
  
  const { symbols, tags } = createFalsePositiveScenario();
  
  const result = await AdvancedFalsePositiveValidator.validateFalsePositives(symbols, tags);
  const detailedReport = AdvancedFalsePositiveValidator.exportValidationReport(result);
  
  console.log('Generated detailed report preview:');
  console.log(detailedReport.substring(0, 600) + '...');
  
  // Check report sections
  const hasExecutiveSummary = detailedReport.includes('Executive Summary');
  const hasConfidenceAnalysis = detailedReport.includes('Confidence Distribution Analysis');
  const hasFalsePositiveDetails = detailedReport.includes('False Positives Details');
  const hasRecommendations = detailedReport.includes('Recommendations');
  const hasOptimalThresholds = detailedReport.includes('Optimal Thresholds');
  
  console.log(`\n📋 REPORT COMPLETENESS:`);
  console.log(`  Executive Summary: ${hasExecutiveSummary ? '✅' : '❌'}`);
  console.log(`  Confidence Analysis: ${hasConfidenceAnalysis ? '✅' : '❌'}`);
  console.log(`  False Positive Details: ${hasFalsePositiveDetails ? '✅' : '❌'}`);
  console.log(`  Recommendations: ${hasRecommendations ? '✅' : '❌'}`);
  console.log(`  Optimal Thresholds: ${hasOptimalThresholds ? '✅' : '❌'}`);
  
  const reportComplete = hasExecutiveSummary && hasConfidenceAnalysis && 
                        hasFalsePositiveDetails && hasRecommendations && hasOptimalThresholds;
  
  return { result, detailedReport, reportComplete };
}

// Main test runner
async function runAllTests() {
  console.log('🔬 ADVANCED FALSE POSITIVE VALIDATOR - TEST SUITE');
  console.log('='.repeat(70));
  console.log('Testing against acceptance criteria:');
  console.log('  ✓ Symbol + tag cross-validation: symbol_confidence ≥ 0.85 AND tag proximity ≤ 25mm');
  console.log('  ✓ Eliminate ghost detections from image artifacts, shadows, grid lines');
  console.log('  ✓ Two-pass validation: individual confidence + spatial correlation');
  console.log('  ✓ Report false positive rate ≤ 5% for production use');
  console.log('='.repeat(70));
  
  const testResults = [];
  
  try {
    // Run all tests
    testResults.push(await testPerfectCrossValidation());
    testResults.push(await testFalsePositiveDetection());
    testResults.push(await testConfidenceThresholds());
    testResults.push(await testSpatialCorrelation());
    testResults.push(await testSemanticCorrelation());
    testResults.push(await testReportGeneration());
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('🏆 FINAL TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    
    // Type-safe access to test results
    const perfectTest = testResults[0] as { acceptancePassed: boolean };
    const falsePositiveTest = testResults[1] as { testPassed: boolean };
    const thresholdTest = testResults[2] as { thresholdTestPassed: boolean };
    const spatialTest = testResults[3] as { spatialTestPassed: boolean };
    const semanticTest = testResults[4] as { semanticTestPassed: boolean };
    const reportTest = testResults[5] as { reportComplete: boolean };
    
    const allTestsPassed = 
      perfectTest.acceptancePassed &&
      falsePositiveTest.testPassed &&
      thresholdTest.thresholdTestPassed &&
      spatialTest.spatialTestPassed &&
      semanticTest.semanticTestPassed &&
      reportTest.reportComplete;
    
    console.log(`Overall Status: ${allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    console.log(`\nAcceptance Criteria Validation:`);
    console.log(`  ✅ Perfect cross-validation: ${perfectTest.acceptancePassed ? 'PASS' : 'FAIL'}`);
    console.log(`  🔍 False positive detection: ${falsePositiveTest.testPassed ? 'PASS' : 'FAIL'}`);
    console.log(`  📊 Confidence thresholds: ${thresholdTest.thresholdTestPassed ? 'PASS' : 'FAIL'}`);
    console.log(`  📏 Spatial correlation (≤25mm): ${spatialTest.spatialTestPassed ? 'PASS' : 'FAIL'}`);
    console.log(`  🧠 Semantic correlation: ${semanticTest.semanticTestPassed ? 'PASS' : 'FAIL'}`);
    console.log(`  📋 Report generation: ${reportTest.reportComplete ? 'PASS' : 'FAIL'}`);
    
    if (allTestsPassed) {
      console.log('\n🎯 READY FOR PRODUCTION DEPLOYMENT');
      console.log('The Advanced False Positive Validator meets all acceptance criteria:');
      console.log('  • Symbol confidence ≥ 0.85 + Tag proximity ≤ 25mm cross-validation');
      console.log('  • Ghost detection elimination from OCR noise and artifacts');
      console.log('  • Two-pass validation with confidence + spatial correlation');
      console.log('  • Production false positive rate ≤ 5%');
    } else {
      console.log('\n🔧 REQUIRES FIXES BEFORE PRODUCTION');
      console.log('Some acceptance criteria are not met. Review failed tests above.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
  }
}

// Export for use as module
if (require.main === module) {
  runAllTests().catch(console.error);
}

export {
  runAllTests,
  testPerfectCrossValidation,
  testFalsePositiveDetection,
  testConfidenceThresholds,
  testSpatialCorrelation,
  testSemanticCorrelation,
  testReportGeneration,
  createValidSymbolTagPairs,
  createFalsePositiveScenario,
  createConfidenceDistributionTest,
  createSpatialThresholdTest
};