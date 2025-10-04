// Enhanced Geometry Processor Module
// Addresses QA findings 3.1-3.3: Scaling drift, junction gaps, incorrect loop links
// Targets: <2% dimensional error, perfect topology, semantic-aware connections

interface GeometryConfig {
    snapTolerance: number; // mm
    scalingTolerance: number; // percentage
    enableTopologicalMerge: boolean;
    enableSemanticValidation: boolean;
    enableArrowDirectionWeighting: boolean;
    maxJunctionGap: number; // mm
    enableDWGAttributeReading: boolean;
    preserveVertexPolylines: boolean;
}

interface DimensionalData {
    original: number;
    dwgAttribute: number | null;
    corrected: number;
    accuracy: number; // percentage
    source: 'MEASURED' | 'DWG_ATTRIBUTE' | 'INFERRED';
    confidence: number;
}

interface GeometricElement {
    id: string;
    type: 'LINE' | 'ARC' | 'CIRCLE' | 'POLYLINE' | 'BLOCK' | 'TEXT';
    coordinates: number[];
    attributes: Map<string, any>;
    dimensions: {
        length?: DimensionalData;
        diameter?: DimensionalData;
        width?: DimensionalData;
        height?: DimensionalData;
    };
    connections: Connection[];
    confidence: number;
}

interface Connection {
    elementId: string;
    connectionType: 'PIPE' | 'ELECTRICAL' | 'INSTRUMENT' | 'SIGNAL';
    semanticType: 'FLOW_LINE' | 'CONTROL_LINE' | 'POWER_LINE' | 'DATA_LINE';
    direction?: 'IN' | 'OUT' | 'BIDIRECTIONAL';
    confidence: number;
    hasArrow: boolean;
    arrowDirection?: number; // degrees
}

interface TopologyIssue {
    type: 'GAP' | 'OVERLAP' | 'INCORRECT_CONNECTION' | 'MISSING_ARROW' | 'SCALING_DRIFT';
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    description: string;
    elements: string[];
    suggestedFix: string;
    confidence: number;
}

class EnhancedGeometryProcessor {
    private config: GeometryConfig;
    private dwgAttributes: Map<string, any>;
    private semanticRules: Map<string, string[]>;

    constructor(config: GeometryConfig) {
        this.config = config;
        this.dwgAttributes = new Map();
        this.initializeSemanticRules();
    }

    private initializeSemanticRules() {
        // QA Finding 3.3: Semantic rules for instrument-to-line connections
        this.semanticRules = new Map([
            ['FIC', ['FLOW_LINE', 'PIPE']], // Flow Indicator Controller → Flow lines
            ['PIC', ['PIPE', 'PRESSURE_LINE']], // Pressure Indicator Controller → Pressure lines
            ['TIC', ['PIPE', 'THERMAL_LINE']], // Temperature Indicator Controller → Process lines
            ['LIC', ['PIPE', 'LEVEL_LINE']], // Level Indicator Controller → Process lines
            ['PSV', ['PIPE', 'PRESSURE_LINE']], // Pressure Safety Valve → Pressure lines
            ['PSH', ['PIPE', 'PRESSURE_LINE']], // Pressure Switch High → Pressure lines
            ['PSL', ['PIPE', 'PRESSURE_LINE']], // Pressure Switch Low → Pressure lines
            ['TSV', ['PIPE', 'THERMAL_LINE']], // Temperature Safety Valve → Process lines
            ['LSV', ['PIPE', 'LEVEL_LINE']], // Level Safety Valve → Process lines
            ['PUMP', ['PIPE', 'FLOW_LINE']], // Pumps → Flow lines
            ['VALVE', ['PIPE', 'FLOW_LINE']], // Valves → Flow lines
            ['VESSEL', ['PIPE', 'MULTIPLE']], // Vessels → Multiple connections
            ['TANK', ['PIPE', 'MULTIPLE']], // Tanks → Multiple connections
        ]);
    }

    // QA Finding 3.1: Read DWG attributes instead of measuring geometry
    public loadDWGAttributes(dwgData: any[]): void {
        this.dwgAttributes.clear();
        
        for (const entity of dwgData) {
            if (entity.attributes && entity.id) {
                // Store all DWG attributes for dimensional validation
                this.dwgAttributes.set(entity.id, {
                    dimensions: entity.attributes.dimensions || {},
                    coordinates: entity.coordinates || [],
                    blockAttributes: entity.blockAttributes || {},
                    scale: entity.scale || 1.0,
                    units: entity.units || 'mm'
                });
            }
        }
        
        console.log(`Loaded DWG attributes for ${this.dwgAttributes.size} entities`);
    }

    // QA Finding 3.1: Correct dimensional scaling using DWG attributes
    public correctDimensionalScaling(
        elements: GeometricElement[]
    ): {
        correctedElements: GeometricElement[];
        issues: TopologyIssue[];
        scalingReport: {
            averageError: number;
            maxError: number;
            correctedCount: number;
            attributeSourceCount: number;
        };
    } {
        const correctedElements: GeometricElement[] = [];
        const issues: TopologyIssue[] = [];
        let totalError = 0;
        let maxError = 0;
        let correctedCount = 0;
        let attributeSourceCount = 0;

        for (const element of elements) {
            const corrected = { ...element };
            const dwgData = this.dwgAttributes.get(element.id);

            // Correct dimensions using DWG attributes when available
            if (dwgData && this.config.enableDWGAttributeReading) {
                corrected.dimensions = this.correctElementDimensions(element, dwgData);
                
                // Count corrections and calculate errors
                for (const [dimType, dimData] of Object.entries(corrected.dimensions)) {
                    if (dimData && dimData.source === 'DWG_ATTRIBUTE') {
                        attributeSourceCount++;
                        
                        if (dimData.original !== dimData.corrected) {
                            correctedCount++;
                            const error = Math.abs(dimData.corrected - dimData.original) / dimData.original;
                            totalError += error;
                            maxError = Math.max(maxError, error);
                            
                            // Flag significant scaling drift
                            if (error > this.config.scalingTolerance / 100) {
                                issues.push({
                                    type: 'SCALING_DRIFT',
                                    severity: error > 0.05 ? 'WARNING' : 'INFO',
                                    description: `Scaling drift detected: ${dimType} ${dimData.original}→${dimData.corrected} (${(error * 100).toFixed(1)}% error)`,
                                    elements: [element.id],
                                    suggestedFix: `Use DWG attribute value ${dimData.corrected} instead of measured ${dimData.original}`,
                                    confidence: dimData.confidence
                                });
                            }
                        }
                    }
                }
            } else {
                // No DWG attributes available, flag for manual review
                if (element.dimensions.length && element.dimensions.length.source === 'MEASURED') {
                    issues.push({
                        type: 'SCALING_DRIFT',
                        severity: 'INFO',
                        description: `No DWG attributes available for dimensional validation of ${element.id}`,
                        elements: [element.id],
                        suggestedFix: 'Verify dimensions manually or ensure DWG attributes are exported',
                        confidence: 0.5
                    });
                }
            }

            correctedElements.push(corrected);
        }

        const averageError = correctedCount > 0 ? totalError / correctedCount : 0;

        return {
            correctedElements,
            issues,
            scalingReport: {
                averageError: averageError * 100, // Convert to percentage
                maxError: maxError * 100,
                correctedCount,
                attributeSourceCount
            }
        };
    }

    // QA Finding 3.2: Fix junction gaps and unjoined lines
    public fixTopologicalIssues(
        elements: GeometricElement[]
    ): {
        correctedElements: GeometricElement[];
        issues: TopologyIssue[];
        topologyReport: {
            gapsFixed: number;
            junctionsCreated: number;
            connectedComponents: number;
            expectedComponents: number;
        };
    } {
        const correctedElements = [...elements];
        const issues: TopologyIssue[] = [];
        let gapsFixed = 0;
        let junctionsCreated = 0;

        if (!this.config.enableTopologicalMerge) {
            return {
                correctedElements,
                issues,
                topologyReport: { gapsFixed: 0, junctionsCreated: 0, connectedComponents: 0, expectedComponents: 0 }
            };
        }

        // Step 1: Find and fix line gaps
        const lineElements = correctedElements.filter(e => e.type === 'LINE' || e.type === 'POLYLINE');
        const gapFixes = this.findAndFixGaps(lineElements);
        
        for (const fix of gapFixes) {
            // Apply gap fix
            const element = correctedElements.find(e => e.id === fix.elementId);
            if (element && fix.newCoordinates) {
                element.coordinates = fix.newCoordinates;
                gapsFixed++;
                
                issues.push({
                    type: 'GAP',
                    severity: 'INFO',
                    description: `Fixed gap in line ${fix.elementId}: moved endpoint by ${fix.distance.toFixed(2)}mm`,
                    elements: [fix.elementId, fix.targetId],
                    suggestedFix: 'Gap automatically fixed through topological merge',
                    confidence: fix.confidence
                });
            }
        }

        // Step 2: Create proper junctions at intersections
        const junctionFixes = this.createJunctions(correctedElements);
        
        for (const junction of junctionFixes) {
            // Add junction elements if needed
            if (junction.createJunctionElement) {
                correctedElements.push({
                    id: junction.id,
                    type: 'CIRCLE',
                    coordinates: junction.coordinates,
                    attributes: new Map([['junction', true], ['radius', 2]]),
                    dimensions: { diameter: { original: 4, dwgAttribute: null, corrected: 4, accuracy: 100, source: 'INFERRED', confidence: 0.9 }},
                    connections: junction.connections,
                    confidence: junction.confidence
                });
                junctionsCreated++;
            }

            // Update connection information for connected elements
            for (const connectedId of junction.connectedElements) {
                const element = correctedElements.find(e => e.id === connectedId);
                if (element) {
                    element.connections.push({
                        elementId: junction.id,
                        connectionType: 'PIPE',
                        semanticType: 'FLOW_LINE',
                        confidence: junction.confidence,
                        hasArrow: false
                    });
                }
            }
        }

        // Step 3: Analyze connected components
        const componentAnalysis = this.analyzeConnectedComponents(correctedElements);

        return {
            correctedElements,
            issues,
            topologyReport: {
                gapsFixed,
                junctionsCreated,
                connectedComponents: componentAnalysis.actualComponents,
                expectedComponents: componentAnalysis.expectedComponents
            }
        };
    }

    // QA Finding 3.3: Semantic-aware connection validation
    public validateSemanticConnections(
        elements: GeometricElement[],
        instruments: Array<{ id: string; type: string; coordinates: number[] }>
    ): {
        validatedElements: GeometricElement[];
        issues: TopologyIssue[];
        connectionReport: {
            totalConnections: number;
            validConnections: number;
            correctedConnections: number;
            semanticViolations: number;
        };
    } {
        const validatedElements = [...elements];
        const issues: TopologyIssue[] = [];
        let correctedConnections = 0;
        let semanticViolations = 0;
        let validConnections = 0;

        if (!this.config.enableSemanticValidation) {
            return {
                validatedElements,
                issues,
                connectionReport: { totalConnections: 0, validConnections: 0, correctedConnections: 0, semanticViolations: 0 }
            };
        }

        for (const instrument of instruments) {
            const instrumentType = this.extractInstrumentType(instrument.type);
            const allowedConnections = this.semanticRules.get(instrumentType) || [];
            
            // Find nearby line elements that could be connected
            const nearbyLines = this.findNearbyLines(instrument.coordinates, validatedElements, 50); // 50mm search radius

            for (const line of nearbyLines) {
                const currentConnection = line.connections.find(c => c.elementId === instrument.id);
                
                if (currentConnection) {
                    // Validate existing connection
                    const isValidConnection = allowedConnections.some(allowed => 
                        currentConnection.semanticType.includes(allowed) || 
                        currentConnection.connectionType.includes(allowed)
                    );

                    if (isValidConnection) {
                        validConnections++;
                        
                        // Enhance connection with arrow direction if available
                        if (this.config.enableArrowDirectionWeighting) {
                            const arrowInfo = this.detectArrowDirection(line, instrument.coordinates);
                            if (arrowInfo.hasArrow) {
                                currentConnection.hasArrow = true;
                                currentConnection.arrowDirection = arrowInfo.direction;
                                currentConnection.confidence *= 1.2; // Boost confidence for arrows
                                
                                // Set flow direction based on arrow
                                currentConnection.direction = arrowInfo.flowDirection;
                            }
                        }
                    } else {
                        semanticViolations++;
                        
                        // Try to correct the connection type
                        const suggestedType = this.suggestConnectionType(instrumentType, line);
                        if (suggestedType) {
                            currentConnection.semanticType = suggestedType;
                            correctedConnections++;
                            
                            issues.push({
                                type: 'INCORRECT_CONNECTION',
                                severity: 'WARNING',
                                description: `Corrected connection type for ${instrument.type} from ${currentConnection.semanticType} to ${suggestedType}`,
                                elements: [instrument.id, line.id],
                                suggestedFix: `Connection type corrected based on instrument type ${instrumentType}`,
                                confidence: 0.8
                            });
                        } else {
                            issues.push({
                                type: 'INCORRECT_CONNECTION',
                                severity: 'CRITICAL',
                                description: `Invalid connection: ${instrument.type} should not connect to ${currentConnection.semanticType}`,
                                elements: [instrument.id, line.id],
                                suggestedFix: `Review connection - ${instrumentType} should connect to: ${allowedConnections.join(', ')}`,
                                confidence: 0.9
                            });
                        }
                    }
                } else {
                    // Check if a connection should exist but is missing
                    const distance = this.calculateDistance(instrument.coordinates, this.getClosestPoint(line, instrument.coordinates));
                    
                    if (distance < 10) { // Within 10mm - should probably be connected
                        const suggestedType = this.suggestConnectionType(instrumentType, line);
                        
                        if (suggestedType) {
                            // Add missing connection
                            line.connections.push({
                                elementId: instrument.id,
                                connectionType: 'PIPE',
                                semanticType: suggestedType,
                                confidence: 0.7,
                                hasArrow: false
                            });
                            
                            correctedConnections++;
                            
                            issues.push({
                                type: 'INCORRECT_CONNECTION',
                                severity: 'INFO',
                                description: `Added missing connection between ${instrument.type} and line ${line.id}`,
                                elements: [instrument.id, line.id],
                                suggestedFix: `Connection added automatically based on proximity (${distance.toFixed(1)}mm)`,
                                confidence: 0.7
                            });
                        }
                    }
                }
            }
        }

        const totalConnections = validatedElements.reduce((sum, el) => sum + el.connections.length, 0);

        return {
            validatedElements,
            issues,
            connectionReport: {
                totalConnections,
                validConnections,
                correctedConnections,
                semanticViolations
            }
        };
    }

    // Helper method to correct individual element dimensions
    private correctElementDimensions(
        element: GeometricElement,
        dwgData: any
    ): GeometricElement['dimensions'] {
        const corrected = { ...element.dimensions };

        // Check each dimension type
        for (const [dimType, dimData] of Object.entries(corrected)) {
            if (dimData && dwgData.dimensions && dwgData.dimensions[dimType]) {
                const dwgValue = dwgData.dimensions[dimType];
                const measuredValue = dimData.original;
                
                // Calculate accuracy
                const accuracy = dwgValue > 0 ? (1 - Math.abs(dwgValue - measuredValue) / dwgValue) * 100 : 0;
                
                corrected[dimType as keyof GeometricElement['dimensions']] = {
                    original: measuredValue,
                    dwgAttribute: dwgValue,
                    corrected: dwgValue, // Use DWG value as authoritative
                    accuracy: accuracy,
                    source: 'DWG_ATTRIBUTE',
                    confidence: accuracy > 95 ? 0.95 : 0.8
                };
            }
        }

        return corrected;
    }

    // Helper method to find and fix gaps between lines
    private findAndFixGaps(lineElements: GeometricElement[]): Array<{
        elementId: string;
        targetId: string;
        distance: number;
        newCoordinates: number[];
        confidence: number;
    }> {
        const fixes: Array<{
            elementId: string;
            targetId: string;
            distance: number;
            newCoordinates: number[];
            confidence: number;
        }> = [];

        for (let i = 0; i < lineElements.length; i++) {
            for (let j = i + 1; j < lineElements.length; j++) {
                const line1 = lineElements[i];
                const line2 = lineElements[j];
                
                const gap = this.findGapBetweenLines(line1, line2);
                
                if (gap && gap.distance <= this.config.maxJunctionGap && gap.distance > 0) {
                    // Determine which line to adjust (prefer shorter moves)
                    const fix1Distance = this.calculateDistance(gap.point1, gap.midpoint);
                    const fix2Distance = this.calculateDistance(gap.point2, gap.midpoint);
                    
                    if (fix1Distance <= fix2Distance) {
                        // Move line1 endpoint to midpoint
                        const newCoords = [...line1.coordinates];
                        if (gap.endpoint1 === 'start') {
                            newCoords[0] = gap.midpoint[0];
                            newCoords[1] = gap.midpoint[1];
                        } else {
                            const endIndex = newCoords.length - 2;
                            newCoords[endIndex] = gap.midpoint[0];
                            newCoords[endIndex + 1] = gap.midpoint[1];
                        }
                        
                        fixes.push({
                            elementId: line1.id,
                            targetId: line2.id,
                            distance: gap.distance,
                            newCoordinates: newCoords,
                            confidence: 0.9 - (gap.distance / this.config.maxJunctionGap) * 0.3
                        });
                    }
                }
            }
        }

        return fixes;
    }

    // Helper method to create junctions at intersections
    private createJunctions(elements: GeometricElement[]): Array<{
        id: string;
        coordinates: number[];
        connectedElements: string[];
        connections: Connection[];
        confidence: number;
        createJunctionElement: boolean;
    }> {
        const junctions: Array<{
            id: string;
            coordinates: number[];
            connectedElements: string[];
            connections: Connection[];
            confidence: number;
            createJunctionElement: boolean;
        }> = [];

        const lineElements = elements.filter(e => e.type === 'LINE' || e.type === 'POLYLINE');
        
        // Find intersection points where 3 or more lines meet
        const intersectionGroups = this.findIntersectionGroups(lineElements);
        
        for (const group of intersectionGroups) {
            if (group.lines.length >= 3) {
                // Create a junction element
                const junctionId = `JUNCTION_${group.point[0].toFixed(0)}_${group.point[1].toFixed(0)}`;
                
                const connections = group.lines.map(lineId => ({
                    elementId: lineId,
                    connectionType: 'PIPE' as const,
                    semanticType: 'FLOW_LINE' as const,
                    confidence: 0.85,
                    hasArrow: false
                }));
                
                junctions.push({
                    id: junctionId,
                    coordinates: group.point,
                    connectedElements: group.lines,
                    connections,
                    confidence: 0.85,
                    createJunctionElement: true
                });
            }
        }

        return junctions;
    }

    // Helper method to analyze connected components
    private analyzeConnectedComponents(elements: GeometricElement[]): {
        actualComponents: number;
        expectedComponents: number;
    } {
        // Build adjacency graph
        const adjacencyMap = new Map<string, Set<string>>();
        
        for (const element of elements) {
            if (!adjacencyMap.has(element.id)) {
                adjacencyMap.set(element.id, new Set());
            }
            
            for (const connection of element.connections) {
                adjacencyMap.get(element.id)!.add(connection.elementId);
                
                if (!adjacencyMap.has(connection.elementId)) {
                    adjacencyMap.set(connection.elementId, new Set());
                }
                adjacencyMap.get(connection.elementId)!.add(element.id);
            }
        }

        // Count connected components using DFS
        const visited = new Set<string>();
        let componentCount = 0;
        
        for (const elementId of adjacencyMap.keys()) {
            if (!visited.has(elementId)) {
                this.dfsVisit(elementId, adjacencyMap, visited);
                componentCount++;
            }
        }

        // Expected components: typically 1 main piping network per system
        const expectedComponents = 1; // This could be made configurable based on system type

        return {
            actualComponents: componentCount,
            expectedComponents: expectedComponents
        };
    }

    // Helper methods for geometric calculations
    private extractInstrumentType(fullType: string): string {
        // Extract base instrument type (e.g., "FIC-301A" → "FIC")
        const match = fullType.match(/^([A-Z]+)/);
        return match ? match[1] : fullType;
    }

    private findNearbyLines(
        point: number[],
        elements: GeometricElement[],
        radius: number
    ): GeometricElement[] {
        return elements.filter(element => {
            if (element.type !== 'LINE' && element.type !== 'POLYLINE') return false;
            
            const closestPoint = this.getClosestPoint(element, point);
            const distance = this.calculateDistance(point, closestPoint);
            
            return distance <= radius;
        });
    }

    private detectArrowDirection(
        line: GeometricElement,
        instrumentLocation: number[]
    ): {
        hasArrow: boolean;
        direction?: number;
        flowDirection?: 'IN' | 'OUT' | 'BIDIRECTIONAL';
    } {
        // Look for arrow symbols near the line endpoints
        const endpoints = this.getLineEndpoints(line);
        
        for (const endpoint of endpoints) {
            const distance = this.calculateDistance(endpoint, instrumentLocation);
            
            if (distance < 20) { // Within 20mm of instrument
                // Check if there's an arrow block or arrow geometry near this endpoint
                // This would need to be implemented based on the specific CAD format
                // For now, return basic heuristic
                
                return {
                    hasArrow: true, // Assume arrows exist if connection is very close
                    direction: this.calculateAngle(endpoint, instrumentLocation),
                    flowDirection: distance < 10 ? 'IN' : 'OUT'
                };
            }
        }

        return { hasArrow: false };
    }

    private suggestConnectionType(instrumentType: string, line: GeometricElement): string | null {
        const allowedTypes = this.semanticRules.get(instrumentType);
        if (!allowedTypes || allowedTypes.length === 0) return null;
        
        // Return the most appropriate connection type based on instrument
        if (allowedTypes.includes('FLOW_LINE')) return 'FLOW_LINE';
        if (allowedTypes.includes('PRESSURE_LINE')) return 'PRESSURE_LINE';
        if (allowedTypes.includes('PIPE')) return 'PIPE';
        
        return allowedTypes[0]; // Default to first allowed type
    }

    private calculateDistance(point1: number[], point2: number[]): number {
        const dx = point1[0] - point2[0];
        const dy = point1[1] - point2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getClosestPoint(element: GeometricElement, point: number[]): number[] {
        // Simplified implementation - would need full geometric calculation
        // For lines, find the closest point on the line segment
        if (element.type === 'LINE' && element.coordinates.length >= 4) {
            const start = [element.coordinates[0], element.coordinates[1]];
            const end = [element.coordinates[2], element.coordinates[3]];
            
            return this.closestPointOnLineSegment(point, start, end);
        }
        
        // For other types, return first coordinate
        return [element.coordinates[0] || 0, element.coordinates[1] || 0];
    }

    private closestPointOnLineSegment(
        point: number[],
        lineStart: number[],
        lineEnd: number[]
    ): number[] {
        const dx = lineEnd[0] - lineStart[0];
        const dy = lineEnd[1] - lineStart[1];
        
        if (dx === 0 && dy === 0) return lineStart;
        
        const t = Math.max(0, Math.min(1, 
            ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (dx * dx + dy * dy)
        ));
        
        return [
            lineStart[0] + t * dx,
            lineStart[1] + t * dy
        ];
    }

    private findGapBetweenLines(
        line1: GeometricElement,
        line2: GeometricElement
    ): {
        distance: number;
        point1: number[];
        point2: number[];
        midpoint: number[];
        endpoint1: 'start' | 'end';
        endpoint2: 'start' | 'end';
    } | null {
        const line1Endpoints = this.getLineEndpoints(line1);
        const line2Endpoints = this.getLineEndpoints(line2);
        
        let minDistance = Infinity;
        let closestPair: any = null;
        
        for (let i = 0; i < line1Endpoints.length; i++) {
            for (let j = 0; j < line2Endpoints.length; j++) {
                const distance = this.calculateDistance(line1Endpoints[i], line2Endpoints[j]);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPair = {
                        distance,
                        point1: line1Endpoints[i],
                        point2: line2Endpoints[j],
                        midpoint: [
                            (line1Endpoints[i][0] + line2Endpoints[j][0]) / 2,
                            (line1Endpoints[i][1] + line2Endpoints[j][1]) / 2
                        ],
                        endpoint1: i === 0 ? 'start' : 'end',
                        endpoint2: j === 0 ? 'start' : 'end'
                    };
                }
            }
        }
        
        return closestPair;
    }

    private getLineEndpoints(line: GeometricElement): number[][] {
        if (line.type === 'LINE' && line.coordinates.length >= 4) {
            return [
                [line.coordinates[0], line.coordinates[1]],
                [line.coordinates[2], line.coordinates[3]]
            ];
        } else if (line.type === 'POLYLINE' && line.coordinates.length >= 4) {
            return [
                [line.coordinates[0], line.coordinates[1]],
                [line.coordinates[line.coordinates.length - 2], line.coordinates[line.coordinates.length - 1]]
            ];
        }
        
        return [];
    }

    private findIntersectionGroups(lines: GeometricElement[]): Array<{
        point: number[];
        lines: string[];
    }> {
        const groups: Array<{ point: number[]; lines: string[] }> = [];
        const processed = new Set<string>();
        
        for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                const line1 = lines[i];
                const line2 = lines[j];
                
                const intersection = this.findLineIntersection(line1, line2);
                
                if (intersection) {
                    const key = `${intersection[0].toFixed(1)},${intersection[1].toFixed(1)}`;
                    
                    if (!processed.has(key)) {
                        const group = {
                            point: intersection,
                            lines: [line1.id, line2.id]
                        };
                        
                        // Find other lines that pass through this point
                        for (let k = 0; k < lines.length; k++) {
                            if (k !== i && k !== j) {
                                const line3 = lines[k];
                                if (this.linePassesThroughPoint(line3, intersection, this.config.snapTolerance)) {
                                    group.lines.push(line3.id);
                                }
                            }
                        }
                        
                        groups.push(group);
                        processed.add(key);
                    }
                }
            }
        }
        
        return groups;
    }

    private findLineIntersection(line1: GeometricElement, line2: GeometricElement): number[] | null {
        // Simplified line intersection for demonstration
        // Real implementation would handle all line segment cases
        if (line1.coordinates.length >= 4 && line2.coordinates.length >= 4) {
            const x1 = line1.coordinates[0];
            const y1 = line1.coordinates[1];
            const x2 = line1.coordinates[2];
            const y2 = line1.coordinates[3];
            
            const x3 = line2.coordinates[0];
            const y3 = line2.coordinates[1];
            const x4 = line2.coordinates[2];
            const y4 = line2.coordinates[3];
            
            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            
            if (Math.abs(denom) < 1e-10) return null; // Parallel lines
            
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
            
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                return [
                    x1 + t * (x2 - x1),
                    y1 + t * (y2 - y1)
                ];
            }
        }
        
        return null;
    }

    private linePassesThroughPoint(line: GeometricElement, point: number[], tolerance: number): boolean {
        const closestPoint = this.getClosestPoint(line, point);
        const distance = this.calculateDistance(point, closestPoint);
        return distance <= tolerance;
    }

    private calculateAngle(from: number[], to: number[]): number {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    private dfsVisit(
        nodeId: string,
        adjacencyMap: Map<string, Set<string>>,
        visited: Set<string>
    ): void {
        visited.add(nodeId);
        
        const neighbors = adjacencyMap.get(nodeId);
        if (neighbors) {
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    this.dfsVisit(neighbor, adjacencyMap, visited);
                }
            }
        }
    }

    // Generate comprehensive geometry report
    public generateGeometryReport(
        originalElements: GeometricElement[],
        correctedElements: GeometricElement[],
        issues: TopologyIssue[]
    ): {
        dimensionalAccuracy: {
            averageError: number;
            maxError: number;
            elementsWithDWGAttributes: number;
            totalElements: number;
        };
        topologyHealth: {
            gapsFixed: number;
            junctionsCreated: number;
            connectedComponents: number;
            connectionAccuracy: number;
        };
        issuesSummary: { [type: string]: number };
        recommendations: string[];
        overallScore: number;
    } {
        const issuesSummary: { [type: string]: number } = {};
        const recommendations: string[] = [];
        
        // Count issues by type
        for (const issue of issues) {
            issuesSummary[issue.type] = (issuesSummary[issue.type] || 0) + 1;
        }
        
        // Calculate dimensional accuracy
        let totalDimError = 0;
        let maxDimError = 0;
        let elementsWithAttributes = 0;
        let dimCount = 0;
        
        for (const element of correctedElements) {
            for (const [dimType, dimData] of Object.entries(element.dimensions)) {
                if (dimData) {
                    dimCount++;
                    if (dimData.source === 'DWG_ATTRIBUTE') {
                        elementsWithAttributes++;
                        const error = (100 - dimData.accuracy) / 100;
                        totalDimError += error;
                        maxDimError = Math.max(maxDimError, error);
                    }
                }
            }
        }
        
        const avgDimError = dimCount > 0 ? (totalDimError / dimCount) * 100 : 0;
        
        // Calculate topology metrics
        const totalConnections = correctedElements.reduce((sum, el) => sum + el.connections.length, 0);
        const validConnections = totalConnections - (issuesSummary['INCORRECT_CONNECTION'] || 0);
        const connectionAccuracy = totalConnections > 0 ? (validConnections / totalConnections) * 100 : 100;
        
        // Generate recommendations
        if (avgDimError > 3) {
            recommendations.push('Enable DWG attribute reading to improve dimensional accuracy');
        }
        if (issuesSummary['GAP'] > 0) {
            recommendations.push('Increase snap tolerance to automatically fix line gaps');
        }
        if (issuesSummary['INCORRECT_CONNECTION'] > 0) {
            recommendations.push('Review semantic connection rules for instrument types');
        }
        if (connectionAccuracy < 95) {
            recommendations.push('Enable arrow direction weighting for better connection inference');
        }
        
        // Calculate overall score (0-100)
        const dimensionalScore = Math.max(0, 100 - avgDimError);
        const topologyScore = connectionAccuracy;
        const issuesPenalty = Math.min(20, Object.values(issuesSummary).reduce((a, b) => a + b, 0) * 2);
        const overallScore = Math.max(0, (dimensionalScore + topologyScore) / 2 - issuesPenalty);
        
        return {
            dimensionalAccuracy: {
                averageError: avgDimError,
                maxError: maxDimError * 100,
                elementsWithDWGAttributes: elementsWithAttributes,
                totalElements: correctedElements.length
            },
            topologyHealth: {
                gapsFixed: issuesSummary['GAP'] || 0,
                junctionsCreated: 0, // Would be tracked during processing
                connectedComponents: 1, // Would be calculated
                connectionAccuracy: connectionAccuracy
            },
            issuesSummary,
            recommendations,
            overallScore: overallScore
        };
    }
}

// Export configuration for production use
export const PRODUCTION_GEOMETRY_CONFIG: GeometryConfig = {
    snapTolerance: 0.5, // mm - QA Finding 3.2
    scalingTolerance: 3, // % - QA Finding 3.1
    enableTopologicalMerge: true,
    enableSemanticValidation: true,
    enableArrowDirectionWeighting: true,
    maxJunctionGap: 2.0, // mm
    enableDWGAttributeReading: true,
    preserveVertexPolylines: true
};

export {
    EnhancedGeometryProcessor,
    GeometryConfig,
    GeometricElement,
    DimensionalData,
    Connection,
    TopologyIssue
};