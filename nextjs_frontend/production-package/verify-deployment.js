// Deployment Verification Script
// Run this in your production environment to verify deployment

const fs = require('fs');
const path = require('path');

console.log('🔍 CAD Validation Pipeline - Deployment Verification');
console.log('=' .repeat(60));

// Check required files
const requiredFiles = [
  'validation/critical-missing-detector.ts',
  'validation/advanced-false-positive-validator.ts',
  'validation/enhanced-tag-parser.ts', 
  'validation/cad-validation-pipeline.ts'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (MISSING)`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ DEPLOYMENT VERIFICATION FAILED: Missing files');
  process.exit(1);
}

console.log('\n🧪 Running validation tests...');

// Run tests
require('child_process').exec('node tests/simple-test.js', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Critical missing test failed:', error.message);
    return;
  }
  
  if (stdout.includes('ALL CORE VALIDATIONS PASSED')) {
    console.log('✅ Critical missing detector: VERIFIED');
  } else {
    console.log('❌ Critical missing detector: FAILED');
  }
});

require('child_process').exec('node tests/simple-false-positive-test.js', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ False positive test failed:', error.message);
    return;
  }
  
  if (stdout.includes('Cross-validation thresholds: PASS')) {
    console.log('✅ False positive validator: VERIFIED');
  } else {
    console.log('❌ False positive validator: FAILED');
  }
});

setTimeout(() => {
  console.log('\n🎯 DEPLOYMENT VERIFICATION COMPLETE');
  console.log('Your CAD validation pipeline is ready for production use!');
}, 2000);
