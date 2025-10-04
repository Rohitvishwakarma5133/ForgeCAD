import { NextRequest, NextResponse } from 'next/server';
import TagParser from '@/lib/validation/tag-parser';
import MissingEquipmentDetector, { DWGEntity, ExtractedTag } from '@/lib/validation/missing-equipment-detector';
import FalsePositiveValidator, { DetectedSymbol } from '@/lib/validation/false-positive-validator';
import InstrumentMappingValidator, { InstrumentConnection, EquipmentItem, ProcessLine } from '@/lib/validation/instrument-mapping-validator';
import MaterialRatingValidator, { TextFragment, LayerMetadata } from '@/lib/validation/material-rating-validator';
import AutomatedTestingFramework from '@/lib/validation/automated-testing-framework';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting CAD validation pipeline...');
    
    const body = await request.json();
    const { 
      dwgEntities, 
      extractedTags, 
      detectedSymbols, 
      instrumentConnections,
      equipmentItems,
      processLines,
      textFragments,
      layerMetadata,
      runTests = false 
    } = body;

    if (!dwgEntities || !extractedTags) {
      return NextResponse.json(
        { error: 'Missing required fields: dwgEntities and extractedTags' },
        { status: 400 }
      );
    }

    const results = {
      timestamp: new Date().toISOString(),
      validationResults: {} as any,
      testResults: null as any,
      summary: {} as any,
      recommendations: [] as string[]
    };

    // Step 1: Tag Parsing and Normalization
    console.log('📝 Parsing and normalizing tags...');
    const tagParser = new TagParser();
    const parseResults = tagParser.parseTagsBatch(extractedTags.map((t: ExtractedTag) => t.tag));
    const validationStats = tagParser.getValidationStats(parseResults);
    
    console.log(`✅ Parsed ${parseResults.length} tags with ${validationStats.validTags} valid tags`);

    // Step 2: Missing Equipment Detection
    console.log('🔍 Running missing equipment detection...');
    const missingDetector = new MissingEquipmentDetector();
    const missingEquipmentResult = missingDetector.detectMissingEquipment(
      dwgEntities as DWGEntity[],
      extractedTags as ExtractedTag[]
    );

    console.log(`📊 Found ${missingEquipmentResult.analysis.missingTags.length} missing tags and ${missingEquipmentResult.analysis.falsePositives.length} false positives`);

    // Step 3: False Positive Validation (if symbols provided)
    let falsePositiveResults = null;
    if (detectedSymbols && detectedSymbols.length > 0) {
      console.log('🚫 Running false positive validation...');
      const falsePositiveValidator = new FalsePositiveValidator();
      falsePositiveResults = falsePositiveValidator.validateExtraction(
        detectedSymbols as DetectedSymbol[],
        extractedTags as ExtractedTag[]
      );
      console.log(`✅ Validated ${falsePositiveResults.length} items`);
    }

    // Step 4: Instrument Mapping Validation (if instrument data provided)
    let instrumentMappingResults = null;
    if (instrumentConnections && equipmentItems && processLines) {
      console.log('🔗 Running instrument-to-equipment mapping validation...');
      const instrumentValidator = new InstrumentMappingValidator();
      instrumentMappingResults = instrumentValidator.validateInstrumentMappings(
        instrumentConnections as InstrumentConnection[],
        equipmentItems as EquipmentItem[],
        processLines as ProcessLine[]
      );
      console.log(`✅ Validated ${instrumentMappingResults.length} instrument mappings`);
    }

    // Step 5: Material/Rating Validation (if text fragments provided)
    let materialRatingResults = null;
    if (textFragments && textFragments.length > 0) {
      console.log('🧪 Running material/pressure rating validation...');
      const materialValidator = new MaterialRatingValidator();
      materialRatingResults = materialValidator.validateMaterialRatings(
        textFragments as TextFragment[],
        layerMetadata as LayerMetadata[] || []
      );
      console.log(`✅ Validated ${materialRatingResults.length} material specifications`);
    }

    // Step 6: Automated Testing (if requested)
    let testResults = null;
    if (runTests) {
      console.log('🧪 Running automated test suite...');
      const testFramework = new AutomatedTestingFramework({
        dwgToExtractedThreshold: 2.0,
        confidenceThreshold: 90.0,
        visualDiffEnabled: true
      });
      
      testResults = await testFramework.runTestSuite(
        dwgEntities as DWGEntity[],
        extractedTags as ExtractedTag[]
      );
      
      console.log(`🎯 Test suite completed with overall score: ${testResults.overallScore}%`);
    }

    // Compile results
    results.validationResults = {
      tagParsing: {
        stats: validationStats,
        issues: parseResults.filter(r => r.issues.length > 0).map(r => ({
          tag: r.originalTag,
          normalizedTag: r.normalizedTag,
          confidence: r.confidence,
          category: r.category,
          issues: r.issues
        }))
      },
      missingEquipment: {
        analysis: missingEquipmentResult.analysis,
        confidence: missingEquipmentResult.analysis.confidence,
        recommendations: missingEquipmentResult.analysis.recommendations
      },
      falsePositives: falsePositiveResults ? {
        validCount: falsePositiveResults.filter(r => r.isValid).length,
        invalidCount: falsePositiveResults.filter(r => !r.isValid).length,
        issues: falsePositiveResults.filter(r => !r.isValid).map(r => ({
          item: 'template' in r.item ? `${r.item.template.name}` : r.item.tag,
          confidence: r.confidence,
          issues: r.issues,
          recommendations: r.recommendations
        }))
      } : null,
      instrumentMapping: instrumentMappingResults ? {
        validCount: instrumentMappingResults.filter(r => r.isValid).length,
        invalidCount: instrumentMappingResults.filter(r => !r.isValid).length,
        averageConfidence: instrumentMappingResults.reduce((sum, r) => sum + r.confidence, 0) / instrumentMappingResults.length,
        issues: instrumentMappingResults.filter(r => !r.isValid).map(r => ({
          instrumentId: r.instrumentId,
          confidence: r.confidence,
          issues: r.issues,
          recommendations: r.recommendations
        }))
      } : null,
      materialRating: materialRatingResults ? {
        validCount: materialRatingResults.filter(r => r.validation.isValid).length,
        invalidCount: materialRatingResults.filter(r => !r.validation.isValid).length,
        averageConfidence: materialRatingResults.reduce((sum, r) => sum + r.confidence, 0) / materialRatingResults.length,
        issues: materialRatingResults.filter(r => !r.validation.isValid).map(r => ({
          specId: r.id,
          extractedText: r.extractedText,
          confidence: r.confidence,
          issues: r.validation.issues,
          suggestions: r.validation.suggestions
        }))
      } : null
    };

    results.testResults = testResults;

    // Generate overall summary and recommendations
    const validationComponents = [
      (validationStats.validTags / validationStats.totalTags) * 0.25, // Tag parsing: 25%
      missingEquipmentResult.analysis.confidence * 0.25, // Missing equipment: 25%
      ((falsePositiveResults?.filter(r => r.isValid).length || 0) / Math.max(falsePositiveResults?.length || 1, 1)) * 0.2, // False positives: 20%
      ((instrumentMappingResults?.filter(r => r.isValid).length || 0) / Math.max(instrumentMappingResults?.length || 1, 1)) * 0.15, // Instrument mapping: 15%
      ((materialRatingResults?.filter(r => r.validation.isValid).length || 0) / Math.max(materialRatingResults?.length || 1, 1)) * 0.15 // Material rating: 15%
    ];
    
    const overallConfidence = validationComponents.reduce((sum, component) => sum + component, 0);

    results.summary = {
      totalTags: validationStats.totalTags,
      validTags: validationStats.validTags,
      missingTags: missingEquipmentResult.analysis.missingTags.length,
      falsePositives: missingEquipmentResult.analysis.falsePositives.length,
      instrumentMappings: instrumentMappingResults?.length || 0,
      validInstrumentMappings: instrumentMappingResults?.filter(r => r.isValid).length || 0,
      materialSpecs: materialRatingResults?.length || 0,
      validMaterialSpecs: materialRatingResults?.filter(r => r.validation.isValid).length || 0,
      overallConfidence: Math.round(overallConfidence * 100),
      testScore: testResults?.overallScore || null
    };

    // Collect all recommendations
    const recommendations = [
      ...missingEquipmentResult.analysis.recommendations
    ];

    if (falsePositiveResults) {
      const fpRecommendations = falsePositiveResults
        .filter(r => !r.isValid)
        .flatMap(r => r.recommendations);
      recommendations.push(...fpRecommendations);
    }

    if (testResults) {
      recommendations.push(...testResults.recommendations);
    }

    if (instrumentMappingResults) {
      const instrumentRecommendations = instrumentMappingResults
        .filter(r => !r.isValid)
        .flatMap(r => r.recommendations);
      recommendations.push(...instrumentRecommendations);
    }

    if (materialRatingResults) {
      const materialRecommendations = materialRatingResults
        .filter(r => !r.validation.isValid)
        .flatMap(r => r.validation.suggestions);
      recommendations.push(...materialRecommendations);
    }

    // Add priority recommendations based on analysis
    if (validationStats.invalidTags > validationStats.totalTags * 0.1) {
      recommendations.unshift('🚨 HIGH PRIORITY: >10% of tags are invalid - review OCR accuracy');
    }

    if (missingEquipmentResult.analysis.confidence < 0.8) {
      recommendations.unshift('⚠️ MEDIUM PRIORITY: Low equipment detection confidence - consider manual review');
    }

    if (instrumentMappingResults && instrumentMappingResults.filter(r => !r.isValid).length > 0) {
      const invalidMappings = instrumentMappingResults.filter(r => !r.isValid).length;
      const totalMappings = instrumentMappingResults.length;
      if (invalidMappings / totalMappings > 0.2) {
        recommendations.unshift(`🚨 HIGH PRIORITY: ${invalidMappings}/${totalMappings} instrument mappings invalid - review connection topology`);
      }
    }

    if (materialRatingResults && materialRatingResults.filter(r => !r.validation.isValid).length > 0) {
      const invalidSpecs = materialRatingResults.filter(r => !r.validation.isValid).length;
      const totalSpecs = materialRatingResults.length;
      if (invalidSpecs / totalSpecs > 0.3) {
        recommendations.unshift(`⚠️ MEDIUM PRIORITY: ${invalidSpecs}/${totalSpecs} material specifications invalid - improve text assembly`);
      }
    }

    results.recommendations = [...new Set(recommendations)]; // Remove duplicates

    console.log('✅ CAD validation pipeline completed successfully');
    
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('❌ Error in validation pipeline:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during validation',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve validation status or run health check
export async function GET() {
  try {
    // Simple health check
    const tagParser = new TagParser();
    const testResult = tagParser.parseTag('P-101A');
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        tagParser: testResult.confidence > 0.8 ? 'operational' : 'degraded',
        missingDetector: 'operational',
        falsePositiveValidator: 'operational',
        testingFramework: 'operational'
      },
      version: '1.0.0'
    };

    return NextResponse.json(healthCheck, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}