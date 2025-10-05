const { analysisEngine } = require('./lib/analysisEngine.ts');

// Test real-time analysis engine
async function testAnalysisEngine() {
  console.log('🚀 Testing Real-Time Analysis Engine...\n');
  
  try {
    // Create a mock file for testing
    const mockFile = new File(['test content'], 'test-drawing.pdf', {
      type: 'application/pdf'
    });
    
    const conversionId = 'test_conv_123';
    console.log('📄 Starting analysis for:', 'test-drawing.pdf');
    console.log('🆔 Conversion ID:', conversionId);
    
    // Start processing
    const processingPromise = analysisEngine.processFile(
      conversionId,
      mockFile,
      'test-drawing.pdf',
      'application/pdf',
      1024
    );
    
    // Monitor progress
    console.log('\n⏱️  Monitoring progress...');
    const monitorInterval = setInterval(async () => {
      try {
        const status = await analysisEngine.getProcessingStatus(conversionId);
        if (status) {
          console.log(`📊 Progress: ${status.progress}% - Stage: ${status.stage || 'processing'} - ${status.stageLabel || ''}`);
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(monitorInterval);
            
            if (status.status === 'completed') {
              console.log('\n✅ Analysis completed successfully!');
              console.log('📈 Results:');
              console.log('  - Equipment Count:', status.equipmentCount);
              console.log('  - Processing Time:', status.processingTime + 's');
              console.log('  - Confidence:', (status.confidence * 100).toFixed(1) + '%');
              console.log('  - Type:', status.type);
              console.log('  - File Size:', status.fileSize + ' bytes');
              
              if (status.equipment && status.equipment.length > 0) {
                console.log('  - Sample Equipment:');
                status.equipment.slice(0, 3).forEach(eq => {
                  console.log(`    • ${eq.tag}: ${eq.type} (${eq.service}) - ${(eq.confidence * 100).toFixed(1)}%`);
                });
              }
            } else {
              console.log('\n❌ Analysis failed:', status.error);
            }
            
            console.log('\n🎉 Test completed!');
            process.exit(0);
          }
        }
      } catch (error) {
        console.error('Monitor error:', error);
      }
    }, 1000);
    
    // Wait for processing to complete
    await processingPromise;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAnalysisEngine().catch(console.error);
}

module.exports = { testAnalysisEngine };