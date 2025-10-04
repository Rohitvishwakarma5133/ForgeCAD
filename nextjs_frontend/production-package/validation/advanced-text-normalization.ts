// Advanced Text Normalization Module
// Addresses all QA audit findings from deep engineering analysis
// Targets: >99% OCR accuracy, zero encoding issues, robust text processing

interface TextNormalizationConfig {
    enableUnicodeNormalization: boolean;
    enableNumericContextRules: boolean;
    enableMultiPassOCR: boolean;
    enableGeometricTextMerging: boolean;
    minTextHeight: number; // mm
    textMergeDistance: number; // mm
    confidenceThreshold: number;
}

interface NormalizedText {
    original: string;
    normalized: string;
    confidence: number;
    issues: TextIssue[];
    coordinates: { x: number; y: number; width: number; height: number };
    encoding: 'UTF-8' | 'ASCII' | 'EXTENDED_ASCII';
}

interface TextIssue {
    type: 'UNICODE_CORRUPTION' | 'NUMERIC_CONFUSION' | 'SYMBOL_MISSING' | 'ENCODING_ERROR';
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    original: string;
    corrected: string;
    confidence: number;
}

class AdvancedTextNormalizer {
    private config: TextNormalizationConfig;
    private unicodeLookupMap: Map<string, string>;
    private numericContextPatterns: RegExp[];
    private symbolPatterns: Map<string, string>;

    constructor(config: TextNormalizationConfig) {
        this.config = config;
        this.initializeLookupMaps();
        this.initializePatterns();
    }

    private initializeLookupMaps() {
        // QA Finding 1.1: Unicode corruption lookup map
        this.unicodeLookupMap = new Map([
            // Greek letters and symbols
            ['˛�P', 'ΔP'],
            ['Î"P', 'ΔP'], 
            ['â–³P', 'ΔP'],
            ['â�¢', '•'],
            ['â€¢', '•'],
            ['Ã©', 'é'],
            ['â€™', "'"],
            ['â€œ', '"'],
            ['â€�', '"'],
            ['Â°', '°'],
            ['Âµ', 'µ'],
            ['ÂΩ', 'Ω'],
            ['Ã˜', 'Ø'],
            ['Ã¸', 'ø'],
            ['âŒ€', '⌀'],
            // Extended ASCII corruptions
            ['Ã ', 'à'],
            ['Ã¡', 'á'],
            ['Ã¢', 'â'],
            ['Ã£', 'ã'],
            ['Ã¤', 'ä'],
            ['Ã¥', 'å'],
            // Common encoding artifacts
            ['ï»¿', ''], // BOM removal
            ['â†'', '→'],
            ['â†�', '←'],
            ['â†'', '↑'],
            ['â†"', '↓'],
        ]);

        // QA Finding 1.4: Symbol pattern restoration
        this.symbolPatterns = new Map([
            // Diameter symbols
            ['(\\d+)\\s*in', 'Ø$1 in'],
            ['(\\d+)\\s*mm', 'Ø$1 mm'],
            ['(\\d+)\\s*cm', 'Ø$1 cm'],
            // Degree symbols
            ['(\\d+)\\s*C(?!\\w)', '$1°C'],
            ['(\\d+)\\s*F(?!\\w)', '$1°F'],
            // Delta P patterns
            ['dP', 'ΔP'],
            ['Delta P', 'ΔP'],
            ['delta-P', 'ΔP'],
        ]);
    }

    private initializePatterns() {
        // QA Finding 1.2: Numeric context patterns for O/0, I/1 confusion
        this.numericContextPatterns = [
            // O to 0 in numeric context
            /(?<=\d)O(?=\d)/g,
            /(?<=P-)O(?=\d)/g,
            /(?<=V-)O(?=\d)/g,
            /(?<=T-)O(?=\d)/g,
            // I to 1 in numeric context  
            /(?<=\d)I(?=\d)/g,
            /(?<=P-)I(?=\d)/g,
            /(?<=V-)I(?=\d)/g,
            /(?<=T-)I(?=\d)/g,
        ];
    }

    // QA Finding 1.1: Unicode normalization and corruption fix
    private normalizeUnicodeCorruption(text: string): { normalized: string; issues: TextIssue[] } {
        let normalized = text;
        const issues: TextIssue[] = [];

        // First pass: Direct lookup replacement
        for (const [corrupted, correct] of this.unicodeLookupMap) {
            if (normalized.includes(corrupted)) {
                const beforeReplace = normalized;
                normalized = normalized.replace(new RegExp(corrupted, 'g'), correct);
                
                if (normalized !== beforeReplace) {
                    issues.push({
                        type: 'UNICODE_CORRUPTION',
                        severity: 'WARNING',
                        original: corrupted,
                        corrected: correct,
                        confidence: 0.95
                    });
                }
            }
        }

        // Second pass: UTF-8 normalization
        try {
            // Normalize to NFC (Canonical Decomposition, then Canonical Composition)
            const nfcNormalized = normalized.normalize('NFC');
            
            // Detect and flag remaining non-ASCII characters
            const nonAsciiPattern = /[^\x00-\x7F]/g;
            const nonAsciiMatches = nfcNormalized.match(nonAsciiPattern);
            
            if (nonAsciiMatches && nonAsciiMatches.length > 0) {
                for (const char of nonAsciiMatches) {
                    if (!this.isKnownValidUnicode(char)) {
                        issues.push({
                            type: 'ENCODING_ERROR',
                            severity: 'INFO',
                            original: char,
                            corrected: this.getAsciiEquivalent(char),
                            confidence: 0.8
                        });
                    }
                }
            }

            normalized = nfcNormalized;
        } catch (error) {
            issues.push({
                type: 'ENCODING_ERROR',
                severity: 'CRITICAL',
                original: text,
                corrected: normalized,
                confidence: 0.5
            });
        }

        return { normalized, issues };
    }

    // QA Finding 1.2: Numeric context O/0 and I/1 correction
    private correctNumericConfusion(text: string): { normalized: string; issues: TextIssue[] } {
        let normalized = text;
        const issues: TextIssue[] = [];

        // O to 0 corrections
        const oTo0Patterns = [
            { pattern: /(?<=\d)O(?=\d)/g, replacement: '0', context: 'numeric_middle' },
            { pattern: /(?<=\d)O$/g, replacement: '0', context: 'numeric_end' },
            { pattern: /(?<=P-)O(?=\d)/g, replacement: '0', context: 'tag_numeric' },
            { pattern: /(?<=V-)O(?=\d)/g, replacement: '0', context: 'tag_numeric' },
            { pattern: /(?<=T-)O(?=\d)/g, replacement: '0', context: 'tag_numeric' },
            { pattern: /(?<=PSH-)O(?=\d)/g, replacement: '0', context: 'instrument_tag' },
            { pattern: /(?<=PSL-)O(?=\d)/g, replacement: '0', context: 'instrument_tag' },
        ];

        for (const { pattern, replacement, context } of oTo0Patterns) {
            const matches = [...normalized.matchAll(pattern)];
            if (matches.length > 0) {
                const beforeReplace = normalized;
                normalized = normalized.replace(pattern, replacement);
                
                issues.push({
                    type: 'NUMERIC_CONFUSION',
                    severity: 'WARNING',
                    original: 'O',
                    corrected: replacement,
                    confidence: 0.92
                });
            }
        }

        // I to 1 corrections
        const iTo1Patterns = [
            { pattern: /(?<=\d)I(?=\d)/g, replacement: '1' },
            { pattern: /(?<=\d)I$/g, replacement: '1' },
            { pattern: /(?<=P-)I(?=\d)/g, replacement: '1' },
            { pattern: /(?<=V-)I(?=\d)/g, replacement: '1' },
            { pattern: /(?<=T-)I(?=\d)/g, replacement: '1' },
        ];

        for (const { pattern, replacement } of iTo1Patterns) {
            const matches = [...normalized.matchAll(pattern)];
            if (matches.length > 0) {
                normalized = normalized.replace(pattern, replacement);
                
                issues.push({
                    type: 'NUMERIC_CONFUSION',
                    severity: 'WARNING',
                    original: 'I',
                    corrected: replacement,
                    confidence: 0.89
                });
            }
        }

        return { normalized, issues };
    }

    // QA Finding 1.3: Hyphen/underscore normalization
    private normalizeHyphens(text: string): { normalized: string; issues: TextIssue[] } {
        const issues: TextIssue[] = [];
        const hyphenVariants = ['_', '—', '–', '−', '⸗'];
        
        let normalized = text;
        for (const variant of hyphenVariants) {
            if (normalized.includes(variant)) {
                normalized = normalized.replace(new RegExp(variant, 'g'), '-');
                issues.push({
                    type: 'UNICODE_CORRUPTION',
                    severity: 'INFO',
                    original: variant,
                    corrected: '-',
                    confidence: 0.98
                });
            }
        }

        return { normalized, issues };
    }

    // QA Finding 1.4: Missing symbol restoration
    private restoreMissingSymbols(text: string): { normalized: string; issues: TextIssue[] } {
        let normalized = text;
        const issues: TextIssue[] = [];

        for (const [pattern, replacement] of this.symbolPatterns) {
            const regex = new RegExp(pattern, 'gi');
            const matches = [...normalized.matchAll(regex)];
            
            if (matches.length > 0) {
                const beforeReplace = normalized;
                normalized = normalized.replace(regex, replacement);
                
                if (normalized !== beforeReplace) {
                    issues.push({
                        type: 'SYMBOL_MISSING',
                        severity: 'INFO',
                        original: matches[0][0],
                        corrected: replacement.replace('$1', matches[0][1] || ''),
                        confidence: 0.85
                    });
                }
            }
        }

        return { normalized, issues };
    }

    // QA Finding 1.5: Multi-line text merging
    private mergeFragmentedText(textFragments: Array<{
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
    }>): Array<{
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        merged: boolean;
        fragments?: number;
    }> {
        const merged: Array<{
            text: string;
            x: number;
            y: number;
            width: number;
            height: number;
            merged: boolean;
            fragments?: number;
        }> = [];

        const processed = new Set<number>();

        for (let i = 0; i < textFragments.length; i++) {
            if (processed.has(i)) continue;

            const fragment = textFragments[i];
            let mergedText = fragment.text;
            let mergedFragments = 1;
            const mergeGroup = [i];

            // Look for nearby fragments to merge
            for (let j = i + 1; j < textFragments.length; j++) {
                if (processed.has(j)) continue;

                const otherFragment = textFragments[j];
                
                // Check if fragments should be merged
                const verticalDistance = Math.abs(fragment.y - otherFragment.y);
                const horizontalOverlap = this.calculateHorizontalOverlap(fragment, otherFragment);
                const rotationDiff = Math.abs((fragment.rotation || 0) - (otherFragment.rotation || 0));

                if (verticalDistance <= this.config.textMergeDistance && 
                    horizontalOverlap > 0.3 && 
                    rotationDiff <= 3) {
                    
                    // Merge fragments in reading order
                    if (otherFragment.y > fragment.y || 
                        (Math.abs(otherFragment.y - fragment.y) < 2 && otherFragment.x > fragment.x)) {
                        mergedText += ' ' + otherFragment.text;
                    } else {
                        mergedText = otherFragment.text + ' ' + mergedText;
                    }
                    
                    mergeGroup.push(j);
                    mergedFragments++;
                }
            }

            // Mark all merged fragments as processed
            mergeGroup.forEach(idx => processed.add(idx));

            merged.push({
                text: mergedText.trim(),
                x: fragment.x,
                y: fragment.y,
                width: fragment.width,
                height: fragment.height,
                merged: mergedFragments > 1,
                fragments: mergedFragments > 1 ? mergedFragments : undefined
            });
        }

        return merged;
    }

    // Main normalization function
    public normalizeText(
        text: string,
        coordinates?: { x: number; y: number; width: number; height: number }
    ): NormalizedText {
        const allIssues: TextIssue[] = [];
        let normalized = text;
        let confidence = 1.0;

        // Step 1: Unicode corruption fix
        if (this.config.enableUnicodeNormalization) {
            const unicodeResult = this.normalizeUnicodeCorruption(normalized);
            normalized = unicodeResult.normalized;
            allIssues.push(...unicodeResult.issues);
            
            // Reduce confidence based on issues found
            confidence -= unicodeResult.issues.length * 0.05;
        }

        // Step 2: Numeric context corrections
        if (this.config.enableNumericContextRules) {
            const numericResult = this.correctNumericConfusion(normalized);
            normalized = numericResult.normalized;
            allIssues.push(...numericResult.issues);
            
            confidence -= numericResult.issues.length * 0.03;
        }

        // Step 3: Hyphen normalization
        const hyphenResult = this.normalizeHyphens(normalized);
        normalized = hyphenResult.normalized;
        allIssues.push(...hyphenResult.issues);

        // Step 4: Symbol restoration
        const symbolResult = this.restoreMissingSymbols(normalized);
        normalized = symbolResult.normalized;
        allIssues.push(...symbolResult.issues);

        // Step 5: Determine encoding
        const encoding = this.detectEncoding(normalized);

        // Final confidence adjustment
        confidence = Math.max(0.1, Math.min(1.0, confidence));

        return {
            original: text,
            normalized: normalized,
            confidence: confidence,
            issues: allIssues,
            coordinates: coordinates || { x: 0, y: 0, width: 0, height: 0 },
            encoding: encoding
        };
    }

    // Multi-pass OCR support (QA Finding 2.1)
    public processMultiPassOCR(
        textFragments: Array<{
            text: string;
            x: number;
            y: number;
            width: number;
            height: number;
            confidence: number;
            scale: number;
        }>
    ): NormalizedText[] {
        // Group fragments by proximity and scale
        const scaleGroups = this.groupByScale(textFragments);
        const results: NormalizedText[] = [];

        for (const [scale, fragments] of scaleGroups) {
            // Merge fragmented text if enabled
            if (this.config.enableGeometricTextMerging) {
                const mergedFragments = this.mergeFragmentedText(fragments);
                
                for (const merged of mergedFragments) {
                    // Skip text below minimum height threshold
                    if (merged.height < this.config.minTextHeight) {
                        continue;
                    }

                    const normalized = this.normalizeText(merged.text, {
                        x: merged.x,
                        y: merged.y,
                        width: merged.width,
                        height: merged.height
                    });

                    // Boost confidence for merged text
                    if (merged.merged) {
                        normalized.confidence *= 1.1; // Bonus for successful merge
                    }

                    results.push(normalized);
                }
            } else {
                // Process fragments individually
                for (const fragment of fragments) {
                    if (fragment.height < this.config.minTextHeight) {
                        continue;
                    }

                    const normalized = this.normalizeText(fragment.text, {
                        x: fragment.x,
                        y: fragment.y,
                        width: fragment.width,
                        height: fragment.height
                    });

                    results.push(normalized);
                }
            }
        }

        return results;
    }

    // Tag validation and correction
    public validateAndCorrectTag(tag: string): {
        isValid: boolean;
        corrected: string;
        confidence: number;
        issues: string[];
    } {
        const issues: string[] = [];
        let corrected = tag;
        let confidence = 1.0;

        // Normalize the tag first
        const normalized = this.normalizeText(tag);
        corrected = normalized.normalized;
        confidence *= normalized.confidence;

        if (normalized.issues.length > 0) {
            issues.push(...normalized.issues.map(issue => `${issue.type}: ${issue.original} → ${issue.corrected}`));
        }

        // Tag format validation
        const tagPatterns = [
            /^[A-Z]{1,4}-\d{3}[A-Z]?$/,  // P-101A, PSH-201, etc.
            /^[A-Z]{2,4}-\d{2,3}[A-Z]?$/, // PI-01, TIC-301A, etc.
            /^[A-Z]-\d{3}[A-Z]?$/,       // V-101, T-201A, etc.
        ];

        const isValid = tagPatterns.some(pattern => pattern.test(corrected));

        if (!isValid) {
            confidence *= 0.7;
            issues.push(`Invalid tag format: ${corrected}`);
        }

        return {
            isValid,
            corrected,
            confidence,
            issues
        };
    }

    // Helper methods
    private isKnownValidUnicode(char: string): boolean {
        const validUnicodeRanges = [
            [0x0080, 0x00FF], // Latin-1 Supplement
            [0x0100, 0x017F], // Latin Extended-A
            [0x0370, 0x03FF], // Greek and Coptic
            [0x2000, 0x206F], // General Punctuation
            [0x2070, 0x209F], // Superscripts and Subscripts
            [0x20A0, 0x20CF], // Currency Symbols
            [0x2100, 0x214F], // Letterlike Symbols
            [0x2190, 0x21FF], // Arrows
            [0x2200, 0x22FF], // Mathematical Operators
        ];

        const codePoint = char.codePointAt(0);
        if (!codePoint) return false;

        return validUnicodeRanges.some(([start, end]) => 
            codePoint >= start && codePoint <= end
        );
    }

    private getAsciiEquivalent(char: string): string {
        // Simple transliteration for common cases
        const transliterationMap: { [key: string]: string } = {
            'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
            'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
            'λ': 'lambda', 'μ': 'mu', 'π': 'pi', 'ρ': 'rho',
            'σ': 'sigma', 'τ': 'tau', 'φ': 'phi', 'χ': 'chi',
            'ψ': 'psi', 'ω': 'omega', 'Δ': 'Delta', 'Ω': 'Omega',
            '°': 'deg', '±': '+-', '≤': '<=', '≥': '>=',
            '≠': '!=', '≈': '~=', '∞': 'infinity', '√': 'sqrt',
        };

        return transliterationMap[char] || char;
    }

    private calculateHorizontalOverlap(
        frag1: { x: number; width: number },
        frag2: { x: number; width: number }
    ): number {
        const left1 = frag1.x;
        const right1 = frag1.x + frag1.width;
        const left2 = frag2.x;
        const right2 = frag2.x + frag2.width;

        const overlap = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
        const totalWidth = Math.max(right1, right2) - Math.min(left1, left2);

        return totalWidth > 0 ? overlap / totalWidth : 0;
    }

    private groupByScale(fragments: Array<{ scale: number; [key: string]: any }>): Map<number, any[]> {
        const groups = new Map<number, any[]>();
        
        for (const fragment of fragments) {
            const scale = fragment.scale;
            if (!groups.has(scale)) {
                groups.set(scale, []);
            }
            groups.get(scale)!.push(fragment);
        }

        return groups;
    }

    private detectEncoding(text: string): 'UTF-8' | 'ASCII' | 'EXTENDED_ASCII' {
        // Check if text contains only ASCII characters
        if (/^[\x00-\x7F]*$/.test(text)) {
            return 'ASCII';
        }

        // Check for common extended ASCII patterns
        if (/[\x80-\xFF]/.test(text)) {
            return 'EXTENDED_ASCII';
        }

        return 'UTF-8';
    }

    // Generate normalization report
    public generateNormalizationReport(results: NormalizedText[]): {
        totalTexts: number;
        normalizedTexts: number;
        issuesSummary: { [key: string]: number };
        confidenceStats: {
            average: number;
            minimum: number;
            maximum: number;
            distribution: { [range: string]: number };
        };
        encodingDistribution: { [encoding: string]: number };
        recommendations: string[];
    } {
        const issuesSummary: { [key: string]: number } = {};
        const confidences = results.map(r => r.confidence);
        const encodings: { [key: string]: number } = {};
        const recommendations: string[] = [];

        // Count issues by type
        for (const result of results) {
            for (const issue of result.issues) {
                issuesSummary[issue.type] = (issuesSummary[issue.type] || 0) + 1;
            }
            encodings[result.encoding] = (encodings[result.encoding] || 0) + 1;
        }

        // Calculate confidence statistics
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length || 0;
        const minConfidence = Math.min(...confidences);
        const maxConfidence = Math.max(...confidences);

        // Confidence distribution
        const distribution: { [range: string]: number } = {
            '0.9-1.0': 0,
            '0.8-0.9': 0,
            '0.7-0.8': 0,
            '0.6-0.7': 0,
            '<0.6': 0
        };

        for (const conf of confidences) {
            if (conf >= 0.9) distribution['0.9-1.0']++;
            else if (conf >= 0.8) distribution['0.8-0.9']++;
            else if (conf >= 0.7) distribution['0.7-0.8']++;
            else if (conf >= 0.6) distribution['0.6-0.7']++;
            else distribution['<0.6']++;
        }

        // Generate recommendations
        if (issuesSummary['UNICODE_CORRUPTION'] > 0) {
            recommendations.push('Consider upgrading OCR engine for better Unicode handling');
        }
        if (issuesSummary['NUMERIC_CONFUSION'] > 0) {
            recommendations.push('Implement font-specific O/0, I/1 correction rules');
        }
        if (avgConfidence < 0.9) {
            recommendations.push('Review low-confidence text extractions manually');
        }
        if (encodings['EXTENDED_ASCII'] > 0) {
            recommendations.push('Ensure all text sources use UTF-8 encoding');
        }

        return {
            totalTexts: results.length,
            normalizedTexts: results.filter(r => r.issues.length > 0).length,
            issuesSummary,
            confidenceStats: {
                average: avgConfidence,
                minimum: minConfidence,
                maximum: maxConfidence,
                distribution
            },
            encodingDistribution: encodings,
            recommendations
        };
    }
}

// Export configuration for production use
export const PRODUCTION_TEXT_CONFIG: TextNormalizationConfig = {
    enableUnicodeNormalization: true,
    enableNumericContextRules: true,
    enableMultiPassOCR: true,
    enableGeometricTextMerging: true,
    minTextHeight: 0.6, // mm - QA Finding 2.1
    textMergeDistance: 10, // mm - QA Finding 1.5
    confidenceThreshold: 0.8
};

export { AdvancedTextNormalizer, TextNormalizationConfig, NormalizedText, TextIssue };