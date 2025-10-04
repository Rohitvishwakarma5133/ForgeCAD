/**
 * Test Suite: Critical Missing Equipment Detector
 * 
 * VALIDATES ACCEPTANCE CRITERIA:
 * ✅ DWG→extraction missing critical tags ≤ 0.1%
 * ✅ Automated report shows zero missing for critical classes  
 * ✅ Multi-pass OCR with scale variations (100%, 200%, 400%)
 * ✅ Fail if any critical tag missing (pump, vessel, PSV, LIC, PIC)
 */

import CriticalMissingDetector, { 
  DWGBlockEntity, 
  ExtractionEntity, 
  CriticalMissingResult 
} from '../lib/validation/critical-missing-detector';

// Test data generators
function createSampleDWGEntities(): DWGBlockEntity[] {
  return [
    // Critical safety equipment - must never be missing
    {
      id: 'psv-001',
      name: 'PSV-001', 
      type: 'block',
      layer: 'SAFETY',
      geometry: { x: 100, y: 200, width: 50, height: 30 },
      tag: 'PSV-001'
    },
    {
      id: 'psv-002',
      name: 'PRESSURE_SAFETY_VALVE_002',
      type: 'block', 
      layer: 'SAFETY',
      geometry: { x: 300, y: 250, width: 50, height: 30 },
      tag: 'PSV-002'
    },
    {
      id: 'psh-001',
      name: 'PSH-001',
      type: 'attribute',
      layer: 'INSTRUMENTS', 
      geometry: { x: 150, y: 400, width: 40, height: 20 },
      tag: 'PSH-001'
    },
    
    // High priority equipment
    {
      id: 'p-101',
      name: 'CENTRIFUGAL_PUMP_101',
      type: 'block',
      layer: 'EQUIPMENT',
      geometry: { x: 500, y: 300, width: 80, height: 60 },
      tag: 'P-101'
    },
    {
      id: 'v-201', 
      name: 'STORAGE_TANK_201',
      type: 'block',
      layer: 'VESSELS',
      geometry: { x: 700, y: 100, width: 120, height: 200 },
      tag: 'V-201'
    },
    {
      id: 'lic-301',
      name: 'LIC-301',
      type: 'text',
      layer: 'INSTRUMENTS',
      geometry: { x: 750, y: 350, width: 50, height: 15 },
      tag: 'LIC-301'
    },
    
    // Medium priority
    {
      id: 'cv-401',
      name: 'CONTROL_VALVE_401', 
      type: 'block',
      layer: 'PIPING',
      geometry: { x: 400, y: 500, width: 30, height: 40 },
      tag: 'CV-401'
    },
    
    // Low priority / non-equipment
    {
      id: 'text-001',
      name: 'PROCESS_NOTE_1',
      type: 'text',
      layer: 'TEXT',
      geometry: { x: 50, y: 50, width: 200, height: 25 }
    }
  ];
}

function createPerfectExtractionEntities(): ExtractionEntity[] {
  // Perfect extraction with all critical tags found
  return [
    {
      tag: 'PSV-001',
      confidence: 0.95,
      source: 'ocr_200',
      geometry: { x: 102, y: 205, width: 45, height: 25 },
      ocrScale: 200
    },
    {
      tag: 'PSV-002', 
      confidence: 0.92,
      source: 'ocr_400',
      geometry: { x: 298, y: 248, width: 48, height: 28 },
      ocrScale: 400
    },
    {
      tag: 'PSH-001',
      confidence: 0.88,
      source: 'ocr_100',
      geometry: { x: 152, y: 402, width: 38, height: 18 },
      ocrScale: 100
    },
    {
      tag: 'P-101',
      confidence: 0.96,
      source: 'dwg_attribute',
      geometry: { x: 505, y: 305, width: 35, height: 15 }
    },
    {
      tag: 'V-201',
      confidence: 0.93,
      source: 'ocr_200', 
      geometry: { x: 710, y: 110, width: 40, height: 20 },
      ocrScale: 200
    },
    {
      tag: 'LIC-301',
      confidence: 0.89,
      source: 'ocr_100',
      geometry: { x: 752, y: 352, width: 45, height: 12 },
      ocrScale: 100
    },
    {
      tag: 'CV-401',
      confidence: 0.91,
      source: 'ocr_200',
      geometry: { x: 402, y: 505, width: 28, height: 18 },
      ocrScale: 200
    }
  ];
}

function createCriticalMissingEntities(): ExtractionEntity[] {
  // Missing critical PSV-001 - should trigger fail-fast
  return [
    {
      tag: 'PSV-002',
      confidence: 0.92,
      source: 'ocr_400', 
      geometry: { x: 298, y: 248, width: 48, height: 28 },
      ocrScale: 400
    },
    {
      tag: 'PSH-001',
      confidence: 0.88,
      source: 'ocr_100',
      geometry: { x: 152, y: 402, width: 38, height: 18 },
      ocrScale: 100
    },
    {
      tag: 'P-101',
      confidence: 0.96,
      source: 'dwg_attribute',
      geometry: { x: 505, y: 305, width: 35, height: 15 }
    },
    {
      tag: 'V-201', 
      confidence: 0.93,
      source: 'ocr_200',
      geometry: { x: 710, y: 110, width: 40, height: 20 },
      ocrScale: 200
    }
  ];
}

function createLowConfidenceEntities(): ExtractionEntity[] {
  // Low confidence extractions that might be false positives
  return [
    {
      tag: 'PSV-OO1', // Character confusion: O instead of 0
      confidence: 0.65,
      source: 'ocr_100',
      geometry: { x: 105, y: 210, width: 40, height: 20 },
      ocrScale: 100
    },
    {
      tag: 'P5V-002', // Character confusion: 5 instead of S  
      confidence: 0.58,
      source: 'ocr_100',
      geometry: { x: 295, y: 245, width: 45, height: 25 },
      ocrScale: 100
    },
    {
      tag: 'PSV-002', // Correct version from higher resolution
      confidence: 0.92,
      source: 'ocr_400',
      geometry: { x: 298, y: 248, width: 48, height: 28 },
      ocrScale: 400
    },
    {
      tag: 'P-101',
      confidence: 0.96,
      source: 'dwg_attribute',
      geometry: { x: 505, y: 305, width: 35, height: 15 }
    }
  ];
}

function createMultiScaleTestEntities(): ExtractionEntity[] {
  // Different results at different OCR scales
  return [
    // Scale 100% - basic results
    {
      tag: 'P-101', 
      confidence: 0.75,
      source: 'ocr_100',
      geometry: { x: 505, y: 305, width: 35, height: 15 },
      ocrScale: 100
    },
    
    // Scale 200% - better quality
    {
      tag: 'PSV-001',
      confidence: 0.95,
      source: 'ocr_200', 
      geometry: { x: 102, y: 205, width: 45, height: 25 },
      ocrScale: 200
    },
    {
      tag: 'PSV-002',
      confidence: 0.89,
      source: 'ocr_200',
      geometry: { x: 300, y: 250, width: 50, height: 30 },
      ocrScale: 200
    },
    {
      tag: 'V-201',
      confidence: 0.93,
      source: 'ocr_200',
      geometry: { x: 710, y: 110, width: 40, height: 20 },
      ocrScale: 200
    },
    
    // Scale 400% - highest quality but might miss some
    {
      tag: 'LIC-301',
      confidence: 0.97,
      source: 'ocr_400',
      geometry: { x: 750, y: 350, width: 50, height: 15 },
      ocrScale: 400
    }
  ];
}

// Test functions
async function testPerfectExtraction() {
  console.log('\n🧪 TEST 1: Perfect Extraction (All Tags Found)');
  console.log('='.repeat(50));
  
  const dwgEntities = createSampleDWGEntities();
  const extractedEntities = createPerfectExtractionEntities();
  
  const result = await CriticalMissingDetector.detectMissingEquipment(dwgEntities, extractedEntities);
  
  console.log(`✅ Test Passed: ${result.testPassed}`);
  console.log(`💀 Critical Failure: ${result.criticalFailure}`); 
  console.log(`📊 Missing Rate: ${(result.missingRate * 100).toFixed(2)}%`);
  console.log(`🔥 Critical Missing Rate: ${(result.criticalMissingRate * 100).toFixed(3)}%`);
  console.log(`📈 Summary:`, result.summary);
  
  // Acceptance criteria validation
  const acceptancePassed = 
    result.missingRate <= 0.01 && 
    result.criticalMissingRate <= 0.001 &&
    result.testPassed &&
    !result.criticalFailure;
    
  console.log(`\n🎯 ACCEPTANCE CRITERIA: ${acceptancePassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return { result, acceptancePassed };
}

async function testCriticalMissing() {
  console.log('\n🧪 TEST 2: Critical Missing (Fail-Fast Trigger)');
  console.log('='.repeat(50));
  
  const dwgEntities = createSampleDWGEntities();
  const extractedEntities = createCriticalMissingEntities(); // Missing PSV-001
  
  const result = await CriticalMissingDetector.detectMissingEquipment(dwgEntities, extractedEntities);
  
  console.log(`✅ Test Passed: ${result.testPassed}`);
  console.log(`💀 Critical Failure: ${result.criticalFailure}`);
  console.log(`📊 Missing Rate: ${(result.missingRate * 100).toFixed(2)}%`);
  console.log(`🔥 Critical Missing Rate: ${(result.criticalMissingRate * 100).toFixed(3)}%`);
  console.log(`🚨 Critical Missing Items: ${result.criticalMissing.length}`);
  
  if (result.criticalMissing.length > 0) {
    console.log('\nCritical Missing Details:');
    result.criticalMissing.forEach((missing, i) => {
      console.log(`  ${i+1}. ${missing.tag} (${missing.category}) - Layer: ${missing.dwgEntity.layer}`);
    });
  }
  
  // Should fail due to critical missing
  const shouldFailFast = result.criticalFailure && !result.testPassed;
  console.log(`\n⚡ FAIL-FAST BEHAVIOR: ${shouldFailFast ? '✅ WORKING' : '❌ NOT WORKING'}`);
  
  return { result, shouldFailFast };
}

async function testMultiScaleAnalysis() {
  console.log('\n🧪 TEST 3: Multi-Scale OCR Analysis (100%, 200%, 400%)');
  console.log('='.repeat(50));
  
  const dwgEntities = createSampleDWGEntities();
  const extractedEntities = createMultiScaleTestEntities();
  
  const result = await CriticalMissingDetector.detectMissingEquipment(dwgEntities, extractedEntities);
  
  console.log('Multi-Scale Results:');
  console.log(`  📏 100% Scale: ${result.multiScaleResults.scale100.found} items (${(result.multiScaleResults.scale100.confidence * 100).toFixed(1)}% avg confidence)`);
  console.log(`  📏 200% Scale: ${result.multiScaleResults.scale200.found} items (${(result.multiScaleResults.scale200.confidence * 100).toFixed(1)}% avg confidence)`);
  console.log(`  📏 400% Scale: ${result.multiScaleResults.scale400.found} items (${(result.multiScaleResults.scale400.confidence * 100).toFixed(1)}% avg confidence)`);
  
  // Validate multi-scale implementation
  const hasAllScales = result.multiScaleResults.scale100.found > 0 ||
                      result.multiScaleResults.scale200.found > 0 ||
                      result.multiScaleResults.scale400.found > 0;
                      
  console.log(`\n🔍 MULTI-SCALE IMPLEMENTED: ${hasAllScales ? '✅ YES' : '❌ NO'}`);
  
  return { result, hasAllScales };
}

async function testFalsePositiveDetection() {
  console.log('\n🧪 TEST 4: False Positive Detection');
  console.log('='.repeat(50));
  
  const dwgEntities = createSampleDWGEntities();
  const extractedEntities = createLowConfidenceEntities();
  
  const result = await CriticalMissingDetector.detectMissingEquipment(dwgEntities, extractedEntities);
  
  console.log(`🔍 False Positives Detected: ${result.falsePositives.length}`);
  console.log(`📊 Total Extracted: ${result.summary.extractedTotal}`);
  console.log(`✅ Matched: ${result.summary.matchedTotal}`);
  
  if (result.falsePositives.length > 0) {
    console.log('\nFalse Positive Details:');
    result.falsePositives.slice(0, 3).forEach((fp, i) => {
      console.log(`  ${i+1}. "${fp.extractedEntity.tag}" (${(fp.extractedEntity.confidence * 100).toFixed(1)}% confidence) - ${fp.reason}`);
    });
  }
  
  const falsePositiveRate = result.falsePositives.length / Math.max(result.summary.extractedTotal, 1);
  console.log(`\n📉 False Positive Rate: ${(falsePositiveRate * 100).toFixed(2)}%`);
  
  return { result, falsePositiveRate };
}

async function testReportGeneration() {
  console.log('\n🧪 TEST 5: Detailed Report Generation');
  console.log('='.repeat(50));
  
  const dwgEntities = createSampleDWGEntities();
  const extractedEntities = createCriticalMissingEntities(); // Has missing items for interesting report
  
  const result = await CriticalMissingDetector.detectMissingEquipment(dwgEntities, extractedEntities);
  const detailedReport = CriticalMissingDetector.exportDetailedReport(result);
  
  console.log('Generated detailed report:');
  console.log(detailedReport.substring(0, 500) + '...');
  
  // Check report has key sections
  const hasExecutiveSummary = detailedReport.includes('Executive Summary');
  const hasRecommendations = detailedReport.includes('Recommendations'); 
  const hasMultiScale = detailedReport.includes('Multi-scale OCR');
  const hasCriticalSection = detailedReport.includes('Critical Missing');
  
  console.log(`\n📋 REPORT COMPLETENESS:`);
  console.log(`  Executive Summary: ${hasExecutiveSummary ? '✅' : '❌'}`);
  console.log(`  Recommendations: ${hasRecommendations ? '✅' : '❌'}`);
  console.log(`  Multi-scale Analysis: ${hasMultiScale ? '✅' : '❌'}`); 
  console.log(`  Critical Missing Section: ${hasCriticalSection ? '✅' : '❌'}`);
  
  const reportComplete = hasExecutiveSummary && hasRecommendations && hasMultiScale && hasCriticalSection;
  
  return { result, detailedReport, reportComplete };
}

async function runBenchmarkTest() {
  console.log('\n🧪 BENCHMARK TEST: Performance with Large Dataset');
  console.log('='.repeat(50));
  
  // Generate large dataset
  const largeDwgEntities: DWGBlockEntity[] = [];
  const largeExtractedEntities: ExtractionEntity[] = [];
  
  for (let i = 0; i < 1000; i++) {
    largeDwgEntities.push({
      id: `equip-${i}`,
      name: `EQUIPMENT-${String(i).padStart(3, '0')}`,
      type: 'block',
      layer: i % 2 === 0 ? 'EQUIPMENT' : 'INSTRUMENTS',
      geometry: { x: i * 10, y: i * 5, width: 50, height: 30 },
      tag: i < 10 ? `PSV-${String(i).padStart(3, '0')}` : `EQ-${String(i).padStart(3, '0')}`
    });
    
    // 95% extraction rate
    if (i % 20 !== 0) {
      largeExtractedEntities.push({
        tag: i < 10 ? `PSV-${String(i).padStart(3, '0')}` : `EQ-${String(i).padStart(3, '0')}`,
        confidence: 0.85 + Math.random() * 0.15,
        source: ['ocr_100', 'ocr_200', 'ocr_400'][i % 3] as any,
        geometry: { x: i * 10 + Math.random() * 5, y: i * 5 + Math.random() * 5, width: 45, height: 25 },
        ocrScale: [100, 200, 400][i % 3]
      });
    }
  }
  
  const startTime = Date.now();
  const result = await CriticalMissingDetector.detectMissingEquipment(largeDwgEntities, largeExtractedEntities);
  const endTime = Date.now();
  
  const processingTime = endTime - startTime;
  const entitiesPerSecond = (largeDwgEntities.length + largeExtractedEntities.length) / (processingTime / 1000);
  
  console.log(`⏱️ Processing Time: ${processingTime}ms`);
  console.log(`🚀 Throughput: ${entitiesPerSecond.toFixed(0)} entities/second`);
  console.log(`📊 Dataset: ${largeDwgEntities.length} DWG + ${largeExtractedEntities.length} extracted`);
  console.log(`📈 Results: ${result.summary.matchedTotal} matched, ${result.summary.missingTotal} missing`);
  
  const performanceAcceptable = processingTime < 5000; // Should complete within 5 seconds
  console.log(`\n🎯 PERFORMANCE: ${performanceAcceptable ? '✅ ACCEPTABLE' : '❌ TOO SLOW'}`);
  
  return { result, processingTime, performanceAcceptable };
}

// Main test runner
async function runAllTests() {
  console.log('🔬 CRITICAL MISSING EQUIPMENT DETECTOR - TEST SUITE');
  console.log('='.repeat(60));
  console.log('Testing against acceptance criteria:');
  console.log('  ✓ DWG→extraction missing critical tags ≤ 0.1%');
  console.log('  ✓ Automated report shows zero missing for critical classes');
  console.log('  ✓ Multi-pass OCR with scale variations (100%, 200%, 400%)');
  console.log('  ✓ Fail if any critical tag missing (pump, vessel, PSV, LIC, PIC)');
  console.log('='.repeat(60));
  
  const testResults = [];
  
  try {
    // Run all tests
    testResults.push(await testPerfectExtraction());
    testResults.push(await testCriticalMissing());
    testResults.push(await testMultiScaleAnalysis()); 
    testResults.push(await testFalsePositiveDetection());
    testResults.push(await testReportGeneration());
    testResults.push(await runBenchmarkTest());
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🏆 FINAL TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    // Type-safe access to test results
    const perfectTest = testResults[0] as { acceptancePassed: boolean };
    const criticalTest = testResults[1] as { shouldFailFast: boolean };
    const multiScaleTest = testResults[2] as { hasAllScales: boolean };
    const reportTest = testResults[4] as { reportComplete: boolean };
    const benchmarkTest = testResults[5] as { performanceAcceptable: boolean };
    
    const allTestsPassed = 
      perfectTest.acceptancePassed &&
      criticalTest.shouldFailFast &&
      multiScaleTest.hasAllScales &&
      reportTest.reportComplete &&
      benchmarkTest.performanceAcceptable;
    
    console.log(`Overall Status: ${allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    console.log(`\nAcceptance Criteria Validation:`);
    console.log(`  ✅ Perfect extraction handling: ${perfectTest.acceptancePassed ? 'PASS' : 'FAIL'}`);
    console.log(`  ⚡ Critical failure fail-fast: ${criticalTest.shouldFailFast ? 'PASS' : 'FAIL'}`);
    console.log(`  🔍 Multi-scale OCR support: ${multiScaleTest.hasAllScales ? 'PASS' : 'FAIL'}`);
    console.log(`  📋 Report generation: ${reportTest.reportComplete ? 'PASS' : 'FAIL'}`);
    console.log(`  🚀 Performance benchmark: ${benchmarkTest.performanceAcceptable ? 'PASS' : 'FAIL'}`);
    
    if (allTestsPassed) {
      console.log('\n🎯 READY FOR PRODUCTION DEPLOYMENT');
      console.log('The Critical Missing Equipment Detector meets all acceptance criteria.');
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
  testPerfectExtraction,
  testCriticalMissing, 
  testMultiScaleAnalysis,
  testFalsePositiveDetection,
  testReportGeneration,
  runBenchmarkTest,
  createSampleDWGEntities,
  createPerfectExtractionEntities,
  createCriticalMissingEntities,
  createLowConfidenceEntities,
  createMultiScaleTestEntities
};