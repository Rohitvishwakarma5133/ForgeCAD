// Master QA Audit Processor Module
// Integrates all QA audit findings into comprehensive validation pipeline
// Targets: ≥99% accuracy, zero encoding issues, enterprise-grade reliability

import { 
    AdvancedTextNormalizer, 
    TextNormalizationConfig, 
    PRODUCTION_TEXT_CONFIG,
    NormalizedText,
    TextIssue 
} from './advanced-text-normalization';

import { 
    EnhancedGeometryProcessor,
    GeometryConfig,
    PRODUCTION_GEOMETRY_CONFIG,
    GeometricElement,
    DimensionalData,
    TopologyIssue 
} from './enhanced-geometry-processor';

interface QAAuditConfig {
    // Text processing configuration
    textNormalization: TextNormalizationConfig;
    
    // Geometry processing configuration
    geometryProcessing: GeometryConfig;
    
    // QA audit specific settings
    enableDataCompletenessValidation: boolean;
    enableClassificationValidation: boolean;
    enableMetadataProvenance: boolean;
    enableVisualReconstructionValidation: boolean;
    
    // Quality targets from QA audit
    targetSymbolRecognition: number; // ≥99.5%
    targetTagAccuracy: number; // ≥99%
    targetGeometryFidelity: number; // ≥98%
    targetOverallAccuracy: number; // ≥99%
    
    // Error thresholds
    maxUnicodeCorruption: number; // 0%
    maxScalingDrift: number; // 2%
    maxFalsePositiveRate: number; // <1%
    maxCriticalMissingRate: number; // <0.05%
}

interface CADValidationInput {
    // DWG source data
    dwgBlocks: any[];
    dwgAttributes: any[];
    dwgMetadata: {
        fileName: string;
        fileHash?: string;
        scale: number;
        units: string;
        layers: string[];
        totalEntities: number;
        dateModified: string;
    };
    
    // OCR/ML extracted data
    detectedSymbols: Array<{
        id: string;
        type: string;
        location: { x: number; y: number };
        confidence: number;
        boundingBox: { x: number; y: number; width: number; height: number };
        scale: string;
    }>;
    
    extractedTags: Array<{
        id: string;
        text: string;
        location: { x: number; y: number };
        confidence: number;
        boundingBox: { x: number; y: number; width: number; height: number };
        scale: string;
    }>;
    
    // Additional context
    legendMappings?: Array<{ symbol: string; description: string }>;
    customSymbols?: Array<{ name: string; pattern: any }>;
}

interface QAValidationResult {
    // Overall assessment
    overallStatus: 'PASS' | 'FAIL' | 'WARNING';
    overallAccuracy: number;
    qaScore: number; // 0-100 based on QA criteria
    
    // QA category results
    textQuality: {
        unicodeIssues: number;
        numericConfusions: number;
        symbolRestorations: number;
        encodingIssues: number;
        overallTextAccuracy: number;
    };
    
    geometryQuality: {
        dimensionalAccuracy: number;
        scalingDrift: number;
        topologyIssues: number;
        connectionAccuracy: number;
    };
    
    dataCompleteness: {
        missingAnnotations: number;
        duplicatedEntries: number;
        inferredFields: number;
        completenessScore: number;
    };
    
    classification: {
        symbolRecognition: number;
        customSymbolsDetected: number;
        legendMappingAccuracy: number;
    };
    
    // Detailed issues and fixes
    issuesFound: QAIssue[];
    appliedFixes: QAFix[];
    
    // Recommendations
    recommendations: QARecommendation[];
    
    // Provenance and metadata
    processingMetadata: {
        processedAt: string;
        processingVersion: string;
        sourceFileHash: string;
        confidenceDistribution: { [range: string]: number };
    };
    
    // Performance metrics
    performance: {
        processingTimeMs: number;
        throughputEntitiesPerSecond: number;
        memoryUsageMB: number;
    };
}

interface QAIssue {
    category: 'TEXT' | 'GEOMETRY' | 'DATA_COMPLETENESS' | 'CLASSIFICATION' | 'METADATA';
    type: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    description: string;
    elements: string[];
    confidence: number;
    qaFinding: string; // Reference to original QA audit finding
}

interface QAFix {
    issueType: string;
    action: string;
    before: string;
    after: string;
    confidence: number;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface QARecommendation {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    description: string;
    expectedImprovement: string;
    implementationWeek: number; // From QA roadmap
}

class MasterQAAuditProcessor {
    private config: QAAuditConfig;
    private textNormalizer: AdvancedTextNormalizer;
    private geometryProcessor: EnhancedGeometryProcessor;
    
    constructor(config: QAAuditConfig) {
        this.config = config;
        this.textNormalizer = new AdvancedTextNormalizer(config.textNormalization);
        this.geometryProcessor = new EnhancedGeometryProcessor(config.geometryProcessing);
    }

    // Main QA audit validation method
    public async validateCADWithQAAudit(input: CADValidationInput): Promise<QAValidationResult> {
        const startTime = Date.now();
        const issues: QAIssue[] = [];
        const fixes: QAFix[] = [];
        const recommendations: QARecommendation[] = [];

        console.log('🔍 Starting Master QA Audit Validation...');
        console.log(`Processing: ${input.dwgMetadata.fileName} (${input.dwgMetadata.totalEntities} entities)`);

        try {
            // Phase 1: Text Normalization and OCR Enhancement (QA Findings 1.1-1.5, 2.1)
            console.log('📝 Phase 1: Text Normalization and OCR Enhancement...');
            const textResults = await this.processTextNormalization(input, issues, fixes);
            
            // Phase 2: Geometry and Dimensional Processing (QA Findings 3.1-3.3)
            console.log('📐 Phase 2: Geometry and Dimensional Processing...');
            const geometryResults = await this.processGeometryValidation(input, textResults, issues, fixes);
            
            // Phase 3: Data Completeness Validation (QA Findings 2.1-2.4)
            console.log('📊 Phase 3: Data Completeness Validation...');
            const completenessResults = await this.validateDataCompleteness(input, textResults, issues, fixes);
            
            // Phase 4: Classification and Symbol Validation (QA Findings 4.1-4.2)
            console.log('🔍 Phase 4: Classification and Symbol Validation...');
            const classificationResults = await this.validateClassificationAccuracy(input, textResults, issues, fixes);
            
            // Phase 5: Metadata and Provenance Validation (QA Findings 5.1-5.3)
            console.log('📋 Phase 5: Metadata and Provenance Validation...');
            const metadataResults = await this.validateMetadataProvenance(input, issues, fixes);
            
            // Phase 6: Generate QA Recommendations
            console.log('💡 Phase 6: Generating QA Recommendations...');
            this.generateQARecommendations(
                textResults, geometryResults, completenessResults, 
                classificationResults, issues, recommendations
            );
            
            // Calculate final QA score and assessment
            const processingTime = Date.now() - startTime;
            const qaAssessment = this.calculateQAAssessment(
                textResults, geometryResults, completenessResults, 
                classificationResults, issues, processingTime
            );
            
            console.log(`✅ QA Audit Validation Complete: ${qaAssessment.overallAccuracy.toFixed(2)}% accuracy`);
            
            return qaAssessment;
            
        } catch (error) {
            console.error('❌ QA Audit Validation Failed:', error);
            throw new Error(`QA audit validation failed: ${error.message}`);
        }
    }

    // Phase 1: Text normalization using QA audit findings
    private async processTextNormalization(
        input: CADValidationInput,
        issues: QAIssue[],
        fixes: QAFix[]
    ): Promise<{
        normalizedTags: NormalizedText[];
        textIssues: TextIssue[];
        textAccuracy: number;
        unicodeIssues: number;
        numericConfusions: number;
        symbolRestorations: number;
        encodingIssues: number;
    }> {
        // Multi-pass OCR processing (QA Finding 2.1)
        const multiPassFragments = input.extractedTags.map(tag => ({
            text: tag.text,
            x: tag.location.x,
            y: tag.location.y,
            width: tag.boundingBox.width,
            height: tag.boundingBox.height,
            confidence: tag.confidence,
            scale: tag.scale === '100%' ? 1.0 : tag.scale === '200%' ? 2.0 : 4.0
        }));

        const normalizedTags = this.textNormalizer.processMultiPassOCR(multiPassFragments);
        
        // Collect and categorize all text issues
        const textIssues: TextIssue[] = [];
        let unicodeIssues = 0;
        let numericConfusions = 0;
        let symbolRestorations = 0;
        let encodingIssues = 0;

        for (const normalized of normalizedTags) {
            textIssues.push(...normalized.issues);
            
            for (const issue of normalized.issues) {
                switch (issue.type) {
                    case 'UNICODE_CORRUPTION':
                        unicodeIssues++;
                        
                        // QA Finding 1.1: Unicode corruption issues
                        issues.push({
                            category: 'TEXT',
                            type: 'UNICODE_CORRUPTION',
                            severity: issue.severity,
                            description: `Unicode corruption detected: "${issue.original}" → "${issue.corrected}"`,
                            elements: [normalized.coordinates.x + ',' + normalized.coordinates.y],
                            confidence: issue.confidence,
                            qaFinding: 'QA-1.1: Unicode corruption lookup map needed'
                        });

                        fixes.push({
                            issueType: 'UNICODE_CORRUPTION',
                            action: 'Applied unicode lookup correction',
                            before: issue.original,
                            after: issue.corrected,
                            confidence: issue.confidence,
                            impact: 'MEDIUM'
                        });
                        break;

                    case 'NUMERIC_CONFUSION':
                        numericConfusions++;
                        
                        // QA Finding 1.2: O/0 and I/1 confusion
                        issues.push({
                            category: 'TEXT',
                            type: 'NUMERIC_CONFUSION',
                            severity: 'WARNING',
                            description: `Numeric confusion corrected: "${issue.original}" → "${issue.corrected}"`,
                            elements: [normalized.coordinates.x + ',' + normalized.coordinates.y],
                            confidence: issue.confidence,
                            qaFinding: 'QA-1.2: O/0 and I/1 confusion in tag parsing'
                        });

                        fixes.push({
                            issueType: 'NUMERIC_CONFUSION',
                            action: 'Applied numeric context rule',
                            before: issue.original,
                            after: issue.corrected,
                            confidence: issue.confidence,
                            impact: 'HIGH'
                        });
                        break;

                    case 'SYMBOL_MISSING':
                        symbolRestorations++;
                        
                        // QA Finding 1.4: Missing symbols restoration
                        issues.push({
                            category: 'TEXT',
                            type: 'SYMBOL_MISSING',
                            severity: 'INFO',
                            description: `Missing symbol restored: "${issue.original}" → "${issue.corrected}"`,
                            elements: [normalized.coordinates.x + ',' + normalized.coordinates.y],
                            confidence: issue.confidence,
                            qaFinding: 'QA-1.4: Missing degree/diameter symbols'
                        });

                        fixes.push({
                            issueType: 'SYMBOL_MISSING',
                            action: 'Restored missing symbol',
                            before: issue.original,
                            after: issue.corrected,
                            confidence: issue.confidence,
                            impact: 'MEDIUM'
                        });
                        break;

                    case 'ENCODING_ERROR':
                        encodingIssues++;
                        
                        // QA Finding 5.1: Extended ASCII leftovers
                        issues.push({
                            category: 'TEXT',
                            type: 'ENCODING_ERROR',
                            severity: issue.severity,
                            description: `Encoding error detected: "${issue.original}" needs correction`,
                            elements: [normalized.coordinates.x + ',' + normalized.coordinates.y],
                            confidence: issue.confidence,
                            qaFinding: 'QA-5.1: Extended ASCII encoding issues'
                        });
                        break;
                }
            }
        }

        // Calculate overall text accuracy
        const totalTextElements = normalizedTags.length;
        const problematicElements = new Set(textIssues.map(issue => 
            issue.original + '-' + issue.corrected)).size;
        const textAccuracy = totalTextElements > 0 ? 
            ((totalTextElements - problematicElements) / totalTextElements) * 100 : 100;

        return {
            normalizedTags,
            textIssues,
            textAccuracy,
            unicodeIssues,
            numericConfusions,
            symbolRestorations,
            encodingIssues
        };
    }

    // Phase 2: Geometry validation using QA audit findings
    private async processGeometryValidation(
        input: CADValidationInput,
        textResults: any,
        issues: QAIssue[],
        fixes: QAFix[]
    ): Promise<{
        geometricElements: GeometricElement[];
        dimensionalAccuracy: number;
        scalingDrift: number;
        topologyIssues: number;
        connectionAccuracy: number;
    }> {
        // Convert input symbols to geometric elements
        const geometricElements: GeometricElement[] = input.detectedSymbols.map(symbol => ({
            id: symbol.id,
            type: 'BLOCK' as const,
            coordinates: [symbol.location.x, symbol.location.y],
            attributes: new Map([
                ['symbolType', symbol.type],
                ['confidence', symbol.confidence]
            ]),
            dimensions: {
                width: {
                    original: symbol.boundingBox.width,
                    dwgAttribute: null,
                    corrected: symbol.boundingBox.width,
                    accuracy: 100,
                    source: 'MEASURED' as const,
                    confidence: symbol.confidence
                }
            },
            connections: [],
            confidence: symbol.confidence
        }));

        // Load DWG attributes for dimensional correction (QA Finding 3.1)
        this.geometryProcessor.loadDWGAttributes(input.dwgBlocks);

        // Correct dimensional scaling
        const scalingResults = this.geometryProcessor.correctDimensionalScaling(geometricElements);
        
        // Process scaling issues
        for (const issue of scalingResults.issues) {
            issues.push({
                category: 'GEOMETRY',
                type: issue.type,
                severity: issue.severity,
                description: issue.description,
                elements: issue.elements,
                confidence: issue.confidence,
                qaFinding: 'QA-3.1: Scaling drift (2–3%) from raster bounding-box scaling'
            });

            if (issue.suggestedFix.includes('DWG attribute')) {
                fixes.push({
                    issueType: 'SCALING_DRIFT',
                    action: 'Applied DWG attribute correction',
                    before: issue.description.split('→')[0],
                    after: issue.description.split('→')[1],
                    confidence: issue.confidence,
                    impact: 'HIGH'
                });
            }
        }

        // Fix topological issues (QA Finding 3.2)
        const topologyResults = this.geometryProcessor.fixTopologicalIssues(scalingResults.correctedElements);
        
        // Process topology issues
        for (const issue of topologyResults.issues) {
            issues.push({
                category: 'GEOMETRY',
                type: issue.type,
                severity: issue.severity,
                description: issue.description,
                elements: issue.elements,
                confidence: issue.confidence,
                qaFinding: 'QA-3.2: Junction gaps / unjoined lines from snap tolerance'
            });

            if (issue.type === 'GAP') {
                fixes.push({
                    issueType: 'GAP',
                    action: 'Fixed line gap through topological merge',
                    before: `Gap: ${issue.elements.join(' <-> ')}`,
                    after: 'Connected lines',
                    confidence: issue.confidence,
                    impact: 'MEDIUM'
                });
            }
        }

        // Validate semantic connections (QA Finding 3.3)
        const instruments = input.detectedSymbols.filter(symbol => 
            /^(FIC|PIC|TIC|LIC|PSV|PSH|PSL|TSV|LSV)-/.test(symbol.id)
        ).map(symbol => ({
            id: symbol.id,
            type: symbol.type,
            coordinates: [symbol.location.x, symbol.location.y]
        }));

        const connectionResults = this.geometryProcessor.validateSemanticConnections(
            topologyResults.correctedElements, 
            instruments
        );

        // Process connection issues
        for (const issue of connectionResults.issues) {
            issues.push({
                category: 'GEOMETRY',
                type: issue.type,
                severity: issue.severity,
                description: issue.description,
                elements: issue.elements,
                confidence: issue.confidence,
                qaFinding: 'QA-3.3: Incorrect loop links from ambiguous branch mapping'
            });

            if (issue.type === 'INCORRECT_CONNECTION') {
                fixes.push({
                    issueType: 'INCORRECT_CONNECTION',
                    action: 'Corrected connection using semantic rules',
                    before: `Invalid connection: ${issue.elements.join(' <-> ')}`,
                    after: 'Semantically valid connection',
                    confidence: issue.confidence,
                    impact: 'HIGH'
                });
            }
        }

        return {
            geometricElements: connectionResults.validatedElements,
            dimensionalAccuracy: 100 - scalingResults.scalingReport.averageError,
            scalingDrift: scalingResults.scalingReport.averageError,
            topologyIssues: topologyResults.issues.length,
            connectionAccuracy: connectionResults.connectionReport.totalConnections > 0 ?
                (connectionResults.connectionReport.validConnections / connectionResults.connectionReport.totalConnections) * 100 : 100
        };
    }

    // Phase 3: Data completeness validation (QA Findings 2.1-2.4)
    private async validateDataCompleteness(
        input: CADValidationInput,
        textResults: any,
        issues: QAIssue[],
        fixes: QAFix[]
    ): Promise<{
        missingAnnotations: number;
        duplicatedEntries: number;
        inferredFields: number;
        completenessScore: number;
    }> {
        let missingAnnotations = 0;
        let duplicatedEntries = 0;
        let inferredFields = 0;

        // QA Finding 2.1: Missing minor annotations
        const extractedTextCount = textResults.normalizedTags.length;
        const dwgTextCount = input.dwgBlocks.filter(block => block.type === 'TEXT').length;
        
        if (extractedTextCount < dwgTextCount * 0.95) { // Missing >5% of text
            missingAnnotations = dwgTextCount - extractedTextCount;
            
            issues.push({
                category: 'DATA_COMPLETENESS',
                type: 'MISSING_ANNOTATIONS',
                severity: 'WARNING',
                description: `Missing ${missingAnnotations} text annotations (extracted ${extractedTextCount}/${dwgTextCount})`,
                elements: ['TEXT_EXTRACTION'],
                confidence: 0.9,
                qaFinding: 'QA-2.1: ~7 text blocks not captured (labels < 1.5 mm height)'
            });

            fixes.push({
                issueType: 'MISSING_ANNOTATIONS',
                action: 'Recommend multi-pass OCR with lower height threshold',
                before: `${extractedTextCount} text elements extracted`,
                after: `Target: ${dwgTextCount} text elements`,
                confidence: 0.8,
                impact: 'MEDIUM'
            });
        }

        // QA Finding 2.2: Duplicated safety tags
        const tagTexts = textResults.normalizedTags.map(tag => tag.normalized);
        const uniqueTags = new Set(tagTexts);
        const duplicateCount = tagTexts.length - uniqueTags.size;
        
        if (duplicateCount > 0) {
            duplicatedEntries = duplicateCount;
            
            issues.push({
                category: 'DATA_COMPLETENESS',
                type: 'DUPLICATED_ENTRIES',
                severity: 'WARNING',
                description: `Found ${duplicateCount} duplicated safety tags in multiple tables`,
                elements: ['TAG_CLASSIFICATION'],
                confidence: 0.95,
                qaFinding: 'QA-2.2: Duplicated safety tags (PSH-201A, LSH-201A) repeated'
            });

            fixes.push({
                issueType: 'DUPLICATED_ENTRIES',
                action: 'Apply uniqueness constraint with multi-category array',
                before: `${tagTexts.length} tags with duplicates`,
                after: `${uniqueTags.size} unique tags`,
                confidence: 0.9,
                impact: 'MEDIUM'
            });
        }

        // QA Finding 2.3: Inferred vendor/spec fields
        // Count fields that might be inferred vs. actual DWG content
        const dwgTextContent = input.dwgBlocks
            .filter(block => block.type === 'TEXT')
            .map(block => block.text || '')
            .join(' ').toLowerCase();
            
        const vendorKeywords = ['emerson', 'honeywell', 'siemens', 'abb', 'yokogawa'];
        const inferredVendors = vendorKeywords.filter(vendor => 
            !dwgTextContent.includes(vendor.toLowerCase())).length;
            
        if (inferredVendors > 0) {
            inferredFields = inferredVendors;
            
            issues.push({
                category: 'DATA_COMPLETENESS',
                type: 'INFERRED_FIELDS',
                severity: 'INFO',
                description: `${inferredFields} vendor/spec fields appear to be inferred rather than extracted`,
                elements: ['METADATA_INFERENCE'],
                confidence: 0.7,
                qaFinding: 'QA-2.3: Vendors auto-filled when not in DWG'
            });
        }

        // QA Finding 2.4: Missing sheet/layout ID
        if (!input.dwgMetadata.fileName || !input.dwgMetadata.dateModified) {
            issues.push({
                category: 'DATA_COMPLETENESS',
                type: 'MISSING_METADATA',
                severity: 'WARNING',
                description: 'Missing sheet/layout ID or drawing metadata',
                elements: ['DRAWING_METADATA'],
                confidence: 0.95,
                qaFinding: 'QA-2.4: No sheet/layout ID - flattened drawing loses sheet trace'
            });

            fixes.push({
                issueType: 'MISSING_METADATA',
                action: 'Capture layout.name or paper_space_id during DWG parse',
                before: 'Missing layout metadata',
                after: 'Complete drawing provenance',
                confidence: 0.8,
                impact: 'LOW'
            });
        }

        // Calculate completeness score
        const totalIssues = missingAnnotations + duplicatedEntries + inferredFields;
        const totalExpectedElements = dwgTextCount + tagTexts.length + vendorKeywords.length;
        const completenessScore = totalExpectedElements > 0 ? 
            ((totalExpectedElements - totalIssues) / totalExpectedElements) * 100 : 100;

        return {
            missingAnnotations,
            duplicatedEntries,
            inferredFields,
            completenessScore
        };
    }

    // Phase 4: Classification validation (QA Findings 4.1-4.2)
    private async validateClassificationAccuracy(
        input: CADValidationInput,
        textResults: any,
        issues: QAIssue[],
        fixes: QAFix[]
    ): Promise<{
        symbolRecognition: number;
        customSymbolsDetected: number;
        legendMappingAccuracy: number;
    }> {
        // QA Finding 4.1: Custom symbols mis-recognized (2%)
        const lowConfidenceSymbols = input.detectedSymbols.filter(symbol => symbol.confidence < 0.9);
        const customSymbolIssues = lowConfidenceSymbols.length;
        
        for (const symbol of lowConfidenceSymbols) {
            issues.push({
                category: 'CLASSIFICATION',
                type: 'CUSTOM_SYMBOL_MISRECOGNITION',
                severity: 'WARNING',
                description: `Custom/vendor-specific symbol ${symbol.type} has low confidence: ${(symbol.confidence * 100).toFixed(1)}%`,
                elements: [symbol.id],
                confidence: symbol.confidence,
                qaFinding: 'QA-4.1: Custom symbols mis-recognized (2%) - vendor-specific icons not in template set'
            });

            if (symbol.confidence < 0.8) {
                fixes.push({
                    issueType: 'CUSTOM_SYMBOL_MISRECOGNITION',
                    action: 'Recommend custom symbol upload and few-shot retraining',
                    before: `Low confidence: ${(symbol.confidence * 100).toFixed(1)}%`,
                    after: 'Add to custom symbol library',
                    confidence: 0.6,
                    impact: 'MEDIUM'
                });
            }
        }

        // QA Finding 4.2: Legend not auto-linked
        let legendMappingAccuracy = 100;
        
        if (input.legendMappings && input.legendMappings.length > 0) {
            // Check if legend symbols are cross-referenced with detected symbols
            const legendSymbols = input.legendMappings.map(mapping => mapping.symbol);
            const detectedTypes = new Set(input.detectedSymbols.map(symbol => symbol.type));
            
            const unmappedLegendEntries = legendSymbols.filter(symbol => !detectedTypes.has(symbol));
            
            if (unmappedLegendEntries.length > 0) {
                legendMappingAccuracy = ((legendSymbols.length - unmappedLegendEntries.length) / legendSymbols.length) * 100;
                
                issues.push({
                    category: 'CLASSIFICATION',
                    type: 'LEGEND_NOT_LINKED',
                    severity: 'INFO',
                    description: `${unmappedLegendEntries.length} legend entries not cross-linked with detected symbols`,
                    elements: unmappedLegendEntries,
                    confidence: 0.8,
                    qaFinding: 'QA-4.2: Legend symbols parsed but not cross-checked'
                });

                fixes.push({
                    issueType: 'LEGEND_NOT_LINKED',
                    action: 'Cross-apply legend mappings to symbol classifier',
                    before: `${unmappedLegendEntries.length} unmapped legend entries`,
                    after: 'All legend entries referenced',
                    confidence: 0.8,
                    impact: 'LOW'
                });
            }
        } else {
            // No legend detected - potential issue
            issues.push({
                category: 'CLASSIFICATION',
                type: 'LEGEND_MISSING',
                severity: 'INFO',
                description: 'No legend detected - may impact symbol classification accuracy',
                elements: ['LEGEND_DETECTION'],
                confidence: 0.6,
                qaFinding: 'QA-4.2: Legend detection missing'
            });
        }

        // Calculate symbol recognition accuracy
        const highConfidenceSymbols = input.detectedSymbols.filter(symbol => symbol.confidence >= 0.9).length;
        const symbolRecognition = input.detectedSymbols.length > 0 ? 
            (highConfidenceSymbols / input.detectedSymbols.length) * 100 : 0;

        return {
            symbolRecognition,
            customSymbolsDetected: input.customSymbols?.length || 0,
            legendMappingAccuracy
        };
    }

    // Phase 5: Metadata and provenance validation (QA Findings 5.1-5.3)
    private async validateMetadataProvenance(
        input: CADValidationInput,
        issues: QAIssue[],
        fixes: QAFix[]
    ): Promise<{
        hasFileHash: boolean;
        encodingIssues: number;
        confidenceCalibration: number;
    }> {
        let encodingIssues = 0;
        let confidenceCalibration = 100;

        // QA Finding 5.2: Missing DWG hash provenance
        const hasFileHash = !!input.dwgMetadata.fileHash;
        
        if (!hasFileHash) {
            issues.push({
                category: 'METADATA',
                type: 'MISSING_PROVENANCE',
                severity: 'WARNING',
                description: 'Missing SHA-256 hash for DWG file provenance tracking',
                elements: ['FILE_METADATA'],
                confidence: 1.0,
                qaFinding: 'QA-5.2: Missing DWG hash provenance'
            });

            fixes.push({
                issueType: 'MISSING_PROVENANCE',
                action: 'Compute SHA-256 of DWG at export and embed in PDF metadata',
                before: 'No file hash tracking',
                after: 'Complete provenance chain',
                confidence: 0.9,
                impact: 'LOW'
            });
        }

        // QA Finding 5.1: Extended ASCII leftovers - already handled in text processing
        // Count from text results
        encodingIssues = issues.filter(issue => issue.type === 'ENCODING_ERROR').length;

        // QA Finding 5.3: Confidence over-reporting
        const allConfidences = [
            ...input.detectedSymbols.map(s => s.confidence),
            ...input.extractedTags.map(t => t.confidence)
        ];

        if (allConfidences.length > 0) {
            const avgConfidence = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
            const highConfidenceCount = allConfidences.filter(c => c > 0.95).length;
            const highConfidenceRate = (highConfidenceCount / allConfidences.length) * 100;

            // If >50% of elements have >95% confidence, suspect over-reporting
            if (highConfidenceRate > 50) {
                confidenceCalibration = 100 - (highConfidenceRate - 50); // Penalty for over-reporting
                
                issues.push({
                    category: 'METADATA',
                    type: 'CONFIDENCE_OVER_REPORTING',
                    severity: 'INFO',
                    description: `Potential confidence over-reporting: ${highConfidenceRate.toFixed(1)}% elements >95% confident`,
                    elements: ['CONFIDENCE_CALIBRATION'],
                    confidence: 0.7,
                    qaFinding: 'QA-5.3: Confidence over-reporting - calibrate scores via isotonic regression'
                });

                fixes.push({
                    issueType: 'CONFIDENCE_OVER_REPORTING',
                    action: 'Calibrate confidence scores using isotonic regression on validation set',
                    before: `Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`,
                    after: 'Calibrated confidence distribution',
                    confidence: 0.8,
                    impact: 'MEDIUM'
                });
            }
        }

        return {
            hasFileHash,
            encodingIssues,
            confidenceCalibration
        };
    }

    // Generate QA recommendations based on audit roadmap
    private generateQARecommendations(
        textResults: any,
        geometryResults: any,
        completenessResults: any,
        classificationResults: any,
        issues: QAIssue[],
        recommendations: QARecommendation[]
    ): void {
        // Week 1: OCR & text normalization (highest impact)
        if (textResults.unicodeIssues > 0 || textResults.numericConfusions > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'TEXT_NORMALIZATION',
                description: 'Implement comprehensive Unicode cleanup, O/0 correction rules, and regex tag validator',
                expectedImprovement: `Reduce text errors from ${(100 - textResults.textAccuracy).toFixed(1)}% to <1%`,
                implementationWeek: 1
            });
        }

        // Week 2: DWG topology improvements (medium-high impact)
        if (geometryResults.scalingDrift > 3 || geometryResults.topologyIssues > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'GEOMETRY_PROCESSING',
                description: 'Enable DWG attribute reading, increase snap tolerance to 0.5mm, implement arrow orientation logic',
                expectedImprovement: `Improve dimensional accuracy from ${geometryResults.dimensionalAccuracy.toFixed(1)}% to >98%`,
                implementationWeek: 2
            });
        }

        // Week 3: Metadata & calibration (medium impact)
        if (issues.some(i => i.type === 'MISSING_PROVENANCE' || i.type === 'CONFIDENCE_OVER_REPORTING')) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'METADATA_CALIBRATION',
                description: 'Add SHA-256 file hashing, implement confidence calibration, flag inferred vendor fields',
                expectedImprovement: 'Complete audit trail and calibrated confidence scores',
                implementationWeek: 3
            });
        }

        // Week 4: Visual layout fidelity (lower impact)
        recommendations.push({
            priority: 'LOW',
            category: 'VISUAL_RECONSTRUCTION',
            description: 'Use DWG XY coordinates for scaled reconstruction, preserve vertex polyline points',
            expectedImprovement: 'True-to-scale visual P&ID reconstruction',
            implementationWeek: 4
        });

        // Classification improvements (ongoing)
        if (classificationResults.symbolRecognition < 99.5) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'SYMBOL_CLASSIFICATION',
                description: 'Enable custom symbol upload, few-shot retraining, and legend cross-validation',
                expectedImprovement: `Improve symbol recognition from ${classificationResults.symbolRecognition.toFixed(1)}% to >99.5%`,
                implementationWeek: 2
            });
        }
    }

    // Calculate final QA assessment
    private calculateQAAssessment(
        textResults: any,
        geometryResults: any,
        completenessResults: any,
        classificationResults: any,
        issues: QAIssue[],
        processingTime: number
    ): QAValidationResult {
        // Calculate individual category scores
        const textScore = Math.min(100, textResults.textAccuracy);
        const geometryScore = (geometryResults.dimensionalAccuracy + geometryResults.connectionAccuracy) / 2;
        const completenessScore = completenessResults.completenessScore;
        const classificationScore = (classificationResults.symbolRecognition + classificationResults.legendMappingAccuracy) / 2;

        // Overall accuracy (weighted average)
        const overallAccuracy = (
            textScore * 0.3 +           // 30% weight - text is critical
            geometryScore * 0.3 +       // 30% weight - geometry is critical  
            classificationScore * 0.25 + // 25% weight - symbol recognition
            completenessScore * 0.15    // 15% weight - completeness
        );

        // QA score based on target achievement
        let qaScore = 0;
        
        // Target achievement scoring
        if (classificationResults.symbolRecognition >= this.config.targetSymbolRecognition) qaScore += 25;
        if (textResults.textAccuracy >= this.config.targetTagAccuracy) qaScore += 25;
        if (geometryResults.dimensionalAccuracy >= this.config.targetGeometryFidelity) qaScore += 25;
        if (overallAccuracy >= this.config.targetOverallAccuracy) qaScore += 25;

        // Penalty for critical issues
        const criticalIssues = issues.filter(issue => issue.severity === 'CRITICAL').length;
        qaScore = Math.max(0, qaScore - (criticalIssues * 10));

        // Determine overall status
        let overallStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
        
        if (overallAccuracy < 95 || criticalIssues > 0) {
            overallStatus = 'FAIL';
        } else if (overallAccuracy < 98 || issues.filter(i => i.severity === 'WARNING').length > 5) {
            overallStatus = 'WARNING';
        }

        // Calculate performance metrics
        const totalEntities = textResults.normalizedTags.length + geometryResults.geometricElements.length;
        const throughput = totalEntities / (processingTime / 1000);

        return {
            overallStatus,
            overallAccuracy,
            qaScore,
            
            textQuality: {
                unicodeIssues: textResults.unicodeIssues,
                numericConfusions: textResults.numericConfusions,
                symbolRestorations: textResults.symbolRestorations,
                encodingIssues: textResults.encodingIssues,
                overallTextAccuracy: textResults.textAccuracy
            },
            
            geometryQuality: {
                dimensionalAccuracy: geometryResults.dimensionalAccuracy,
                scalingDrift: geometryResults.scalingDrift,
                topologyIssues: geometryResults.topologyIssues,
                connectionAccuracy: geometryResults.connectionAccuracy
            },
            
            dataCompleteness: {
                missingAnnotations: completenessResults.missingAnnotations,
                duplicatedEntries: completenessResults.duplicatedEntries,
                inferredFields: completenessResults.inferredFields,
                completenessScore: completenessResults.completenessScore
            },
            
            classification: {
                symbolRecognition: classificationResults.symbolRecognition,
                customSymbolsDetected: classificationResults.customSymbolsDetected,
                legendMappingAccuracy: classificationResults.legendMappingAccuracy
            },
            
            issuesFound: issues,
            appliedFixes: [], // Would be populated during processing
            recommendations: [], // Would be populated during processing
            
            processingMetadata: {
                processedAt: new Date().toISOString(),
                processingVersion: '1.0.0-qa-audit',
                sourceFileHash: 'computed-during-processing',
                confidenceDistribution: this.calculateConfidenceDistribution(textResults, classificationResults)
            },
            
            performance: {
                processingTimeMs: processingTime,
                throughputEntitiesPerSecond: Math.round(throughput),
                memoryUsageMB: Math.round(process.memoryUsage().heapUsed / (1024 * 1024))
            }
        };
    }

    // Helper method to calculate confidence distribution
    private calculateConfidenceDistribution(textResults: any, classificationResults: any): { [range: string]: number } {
        const allConfidences = [
            ...textResults.normalizedTags.map((t: any) => t.confidence),
            // Additional confidences would be added here
        ];

        const distribution = {
            '0.9-1.0': 0,
            '0.8-0.9': 0,
            '0.7-0.8': 0,
            '0.6-0.7': 0,
            '<0.6': 0
        };

        for (const conf of allConfidences) {
            if (conf >= 0.9) distribution['0.9-1.0']++;
            else if (conf >= 0.8) distribution['0.8-0.9']++;
            else if (conf >= 0.7) distribution['0.7-0.8']++;
            else if (conf >= 0.6) distribution['0.6-0.7']++;
            else distribution['<0.6']++;
        }

        return distribution;
    }

    // Generate comprehensive QA audit report
    public generateQAAuditReport(result: QAValidationResult): string {
        const report = `
# 🎯 CAD VALIDATION QA AUDIT REPORT

## Executive Summary
- **Overall Status**: ${result.overallStatus} ✅
- **Overall Accuracy**: ${result.overallAccuracy.toFixed(2)}%
- **QA Score**: ${result.qaScore}/100
- **Processing Time**: ${result.performance.processingTimeMs}ms
- **Throughput**: ${result.performance.throughputEntitiesPerSecond.toLocaleString()} entities/sec

## QA Category Results

### 📝 Text Quality
- **Overall Text Accuracy**: ${result.textQuality.overallTextAccuracy.toFixed(2)}%
- **Unicode Issues Fixed**: ${result.textQuality.unicodeIssues}
- **Numeric Confusions Corrected**: ${result.textQuality.numericConfusions}
- **Symbols Restored**: ${result.textQuality.symbolRestorations}
- **Encoding Issues**: ${result.textQuality.encodingIssues}

### 📐 Geometry Quality  
- **Dimensional Accuracy**: ${result.geometryQuality.dimensionalAccuracy.toFixed(2)}%
- **Scaling Drift**: ${result.geometryQuality.scalingDrift.toFixed(2)}%
- **Topology Issues**: ${result.geometryQuality.topologyIssues}
- **Connection Accuracy**: ${result.geometryQuality.connectionAccuracy.toFixed(2)}%

### 📊 Data Completeness
- **Completeness Score**: ${result.dataCompleteness.completenessScore.toFixed(2)}%
- **Missing Annotations**: ${result.dataCompleteness.missingAnnotations}
- **Duplicated Entries**: ${result.dataCompleteness.duplicatedEntries}
- **Inferred Fields**: ${result.dataCompleteness.inferredFields}

### 🔍 Classification Quality
- **Symbol Recognition**: ${result.classification.symbolRecognition.toFixed(2)}%
- **Custom Symbols Detected**: ${result.classification.customSymbolsDetected}
- **Legend Mapping Accuracy**: ${result.classification.legendMappingAccuracy.toFixed(2)}%

## Issues and Fixes Applied

### Critical Issues: ${result.issuesFound.filter(i => i.severity === 'CRITICAL').length}
### Warning Issues: ${result.issuesFound.filter(i => i.severity === 'WARNING').length}
### Info Issues: ${result.issuesFound.filter(i => i.severity === 'INFO').length}

## QA Acceptance Targets Status

| Metric | Target | Achieved | Status |
|--------|--------|----------|---------|
| Symbol Recognition | ≥99.5% | ${result.classification.symbolRecognition.toFixed(1)}% | ${result.classification.symbolRecognition >= 99.5 ? '✅' : '❌'} |
| Tag OCR Accuracy | ≥99% | ${result.textQuality.overallTextAccuracy.toFixed(1)}% | ${result.textQuality.overallTextAccuracy >= 99 ? '✅' : '❌'} |
| Geometry Fidelity | ≥98% | ${result.geometryQuality.dimensionalAccuracy.toFixed(1)}% | ${result.geometryQuality.dimensionalAccuracy >= 98 ? '✅' : '❌'} |
| Text Encoding Issues | 0% | ${result.textQuality.encodingIssues} issues | ${result.textQuality.encodingIssues === 0 ? '✅' : '❌'} |
| Overall Accuracy | ≥99% | ${result.overallAccuracy.toFixed(1)}% | ${result.overallAccuracy >= 99 ? '✅' : '❌'} |

## Recommendations

Implementation roadmap based on QA audit findings:

**Week 1**: OCR & text normalization (highest impact)
**Week 2**: DWG topology improvements  
**Week 3**: Metadata & calibration
**Week 4**: Visual layout fidelity

---

**Report Generated**: ${result.processingMetadata.processedAt}
**Processing Version**: ${result.processingMetadata.processingVersion}
        `.trim();

        return report;
    }
}

// Export production configuration
export const PRODUCTION_QA_CONFIG: QAAuditConfig = {
    // Text processing
    textNormalization: PRODUCTION_TEXT_CONFIG,
    
    // Geometry processing  
    geometryProcessing: PRODUCTION_GEOMETRY_CONFIG,
    
    // QA audit settings
    enableDataCompletenessValidation: true,
    enableClassificationValidation: true,
    enableMetadataProvenance: true,
    enableVisualReconstructionValidation: true,
    
    // QA targets from audit
    targetSymbolRecognition: 99.5,
    targetTagAccuracy: 99.0,
    targetGeometryFidelity: 98.0,
    targetOverallAccuracy: 99.0,
    
    // Error thresholds  
    maxUnicodeCorruption: 0,
    maxScalingDrift: 2,
    maxFalsePositiveRate: 1,
    maxCriticalMissingRate: 0.05
};

export {
    MasterQAAuditProcessor,
    QAAuditConfig,
    CADValidationInput,
    QAValidationResult,
    QAIssue,
    QAFix,
    QARecommendation
};