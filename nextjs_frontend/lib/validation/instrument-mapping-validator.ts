/**
 * Instrument-to-Equipment Mapping Validator
 * Addresses issue #4 (wrong instrument-to-equipment mapping/mis-linked instruments)
 */

export interface ConnectionPoint {
  x: number;
  y: number;
  type: 'inlet' | 'outlet' | 'tap' | 'connection';
  direction?: number; // Angle in degrees
  equipmentId?: string;
  lineId?: string;
}

export interface ProcessLine {
  id: string;
  type: 'pipe' | 'signal' | 'pneumatic' | 'electric';
  material?: string;
  size?: string;
  rating?: string;
  geometry: {
    points: Array<{ x: number; y: number }>;
    width: number;
  };
  connections: ConnectionPoint[];
  layer: string;
}

export interface InstrumentConnection {
  instrumentId: string;
  instrumentTag: string;
  instrumentType: 'pressure' | 'temperature' | 'flow' | 'level' | 'control' | 'safety';
  geometry: { x: number; y: number; width: number; height: number };
  expectedConnections: {
    process?: boolean; // Should connect to process line
    signal?: boolean;  // Should connect to control system
    power?: boolean;   // Should connect to power
  };
  detectedConnections: {
    processLines: ProcessLine[];
    signalLines: ProcessLine[];
    powerLines: ProcessLine[];
  };
}

export interface EquipmentItem {
  id: string;
  tag: string;
  type: 'pump' | 'vessel' | 'valve' | 'exchanger' | 'equipment';
  geometry: { x: number; y: number; width: number; height: number };
  connectionPoints: ConnectionPoint[];
  associatedInstruments: string[]; // Expected instrument tags
}

export interface MappingValidationResult {
  instrumentId: string;
  isValid: boolean;
  confidence: number;
  issues: MappingIssue[];
  recommendations: string[];
  correctMappings: Array<{
    targetId: string;
    targetType: 'equipment' | 'line';
    targetTag: string;
    connectionType: 'process' | 'signal' | 'power';
    confidence: number;
  }>;
}

export interface MappingIssue {
  type: 'wrong_equipment' | 'missing_connection' | 'invalid_line_type' | 'distance_mismatch' | 'flow_direction_error';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix: string;
}

export class InstrumentMappingValidator {
  private proximityThreshold = 75; // pixels
  private connectionTolerance = 15; // pixels for connection point matching
  private flowDirectionTolerance = 30; // degrees

  /**
   * Main validation method for instrument mappings
   */
  public validateInstrumentMappings(
    instruments: InstrumentConnection[],
    equipment: EquipmentItem[],
    processLines: ProcessLine[]
  ): MappingValidationResult[] {
    const results: MappingValidationResult[] = [];

    for (const instrument of instruments) {
      console.log(`🔍 Validating instrument ${instrument.instrumentTag}...`);
      
      const result = this.validateSingleInstrument(instrument, equipment, processLines);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate a single instrument's connections and mappings
   */
  private validateSingleInstrument(
    instrument: InstrumentConnection,
    equipment: EquipmentItem[],
    processLines: ProcessLine[]
  ): MappingValidationResult {
    const issues: MappingIssue[] = [];
    const recommendations: string[] = [];
    const correctMappings: MappingValidationResult['correctMappings'] = [];
    let confidence = 1.0;

    // Step 1: Trace process connections
    const processConnections = this.traceProcessConnections(instrument, processLines);
    
    // Step 2: Find connected equipment
    const connectedEquipment = this.findConnectedEquipment(instrument, equipment, processConnections);
    
    // Step 3: Validate instrument type matches connected equipment
    const typeValidation = this.validateInstrumentTypeMatch(instrument, connectedEquipment);
    if (!typeValidation.valid) {
      issues.push({
        type: 'wrong_equipment',
        severity: 'high',
        description: typeValidation.reason,
        suggestedFix: typeValidation.suggestedFix
      });
      confidence *= 0.5;
    }

    // Step 4: Validate connection topology
    const topologyValidation = this.validateConnectionTopology(instrument, processConnections);
    if (!topologyValidation.valid) {
      issues.push({
        type: 'invalid_line_type',
        severity: 'medium',
        description: topologyValidation.reason,
        suggestedFix: topologyValidation.suggestedFix
      });
      confidence *= 0.7;
    }

    // Step 5: Validate flow direction and orientation
    const flowValidation = this.validateFlowDirection(instrument, processConnections);
    if (!flowValidation.valid) {
      issues.push({
        type: 'flow_direction_error',
        severity: 'medium',
        description: flowValidation.reason,
        suggestedFix: flowValidation.suggestedFix
      });
      confidence *= 0.8;
    }

    // Step 6: Check for missing required connections
    const missingConnections = this.checkMissingConnections(instrument);
    for (const missing of missingConnections) {
      issues.push({
        type: 'missing_connection',
        severity: missing.required ? 'high' : 'low',
        description: missing.description,
        suggestedFix: missing.suggestedFix
      });
      if (missing.required) confidence *= 0.6;
    }

    // Step 7: Generate correct mappings
    for (const equipment of connectedEquipment) {
      correctMappings.push({
        targetId: equipment.id,
        targetType: 'equipment',
        targetTag: equipment.tag,
        connectionType: 'process',
        confidence: this.calculateMappingConfidence(instrument, equipment, processConnections)
      });
    }

    for (const line of processConnections) {
      correctMappings.push({
        targetId: line.id,
        targetType: 'line',
        targetTag: `${line.type}-${line.size || 'unknown'}`,
        connectionType: line.type as 'process' | 'signal' | 'power',
        confidence: this.calculateLineConnectionConfidence(instrument, line)
      });
    }

    // Step 8: Generate recommendations
    if (issues.length === 0) {
      recommendations.push(`✅ Instrument ${instrument.instrumentTag} is correctly mapped`);
    } else {
      recommendations.push(`🔧 Review ${instrument.instrumentTag} connections`);
      
      if (issues.some(i => i.type === 'wrong_equipment')) {
        recommendations.push('Verify instrument is connected to correct process equipment');
      }
      
      if (issues.some(i => i.type === 'flow_direction_error')) {
        recommendations.push('Check flow direction arrows and instrument orientation');
      }
      
      if (missingConnections.length > 0) {
        recommendations.push('Add missing signal/power connections as required');
      }
    }

    const isValid = confidence > 0.7 && !issues.some(i => i.severity === 'high');

    return {
      instrumentId: instrument.instrumentId,
      isValid,
      confidence,
      issues,
      recommendations,
      correctMappings
    };
  }

  /**
   * Trace process connections from instrument location
   */
  private traceProcessConnections(
    instrument: InstrumentConnection,
    processLines: ProcessLine[]
  ): ProcessLine[] {
    const connectedLines: ProcessLine[] = [];
    const instrumentCenter = {
      x: instrument.geometry.x + instrument.geometry.width / 2,
      y: instrument.geometry.y + instrument.geometry.height / 2
    };

    for (const line of processLines) {
      // Check if instrument is near any point on the line
      const isNearLine = this.isPointNearLine(instrumentCenter, line);
      
      if (isNearLine) {
        // Verify connection makes sense for instrument type
        const connectionValid = this.validateLineTypeForInstrument(instrument.instrumentType, line.type);
        
        if (connectionValid) {
          connectedLines.push(line);
        }
      }
    }

    return connectedLines;
  }

  /**
   * Find equipment connected to the instrument via process lines
   */
  private findConnectedEquipment(
    instrument: InstrumentConnection,
    equipment: EquipmentItem[],
    connectedLines: ProcessLine[]
  ): EquipmentItem[] {
    const connectedEquipment: EquipmentItem[] = [];

    // Direct connection to equipment
    for (const equip of equipment) {
      const distance = this.calculateDistance(
        { x: instrument.geometry.x + instrument.geometry.width / 2, y: instrument.geometry.y + instrument.geometry.height / 2 },
        { x: equip.geometry.x + equip.geometry.width / 2, y: equip.geometry.y + equip.geometry.height / 2 }
      );

      if (distance <= this.proximityThreshold) {
        connectedEquipment.push(equip);
      }
    }

    // Connection via process lines
    for (const line of connectedLines) {
      for (const equip of equipment) {
        const equipmentConnected = this.isEquipmentConnectedToLine(equip, line);
        
        if (equipmentConnected && !connectedEquipment.includes(equip)) {
          connectedEquipment.push(equip);
        }
      }
    }

    return connectedEquipment;
  }

  /**
   * Validate that instrument type matches connected equipment
   */
  private validateInstrumentTypeMatch(
    instrument: InstrumentConnection,
    connectedEquipment: EquipmentItem[]
  ): { valid: boolean; reason: string; suggestedFix: string } {
    if (connectedEquipment.length === 0) {
      return {
        valid: false,
        reason: 'Instrument not connected to any equipment',
        suggestedFix: 'Ensure instrument has proper process connection'
      };
    }

    // Define valid instrument-equipment combinations
    const validCombinations: Record<string, string[]> = {
      pressure: ['pump', 'vessel', 'valve', 'equipment'],
      temperature: ['vessel', 'exchanger', 'equipment'],
      flow: ['pump', 'valve', 'equipment'],
      level: ['vessel', 'equipment'],
      control: ['pump', 'valve', 'equipment'],
      safety: ['vessel', 'valve', 'equipment']
    };

    const validEquipmentTypes = validCombinations[instrument.instrumentType] || [];
    
    for (const equipment of connectedEquipment) {
      if (validEquipmentTypes.includes(equipment.type)) {
        return { valid: true, reason: '', suggestedFix: '' };
      }
    }

    const connectedTypes = connectedEquipment.map(e => e.type).join(', ');
    return {
      valid: false,
      reason: `${instrument.instrumentType} instrument connected to incompatible equipment: ${connectedTypes}`,
      suggestedFix: `Connect ${instrument.instrumentType} instrument to: ${validEquipmentTypes.join(', ')}`
    };
  }

  /**
   * Validate connection topology (graph structure)
   */
  private validateConnectionTopology(
    instrument: InstrumentConnection,
    connectedLines: ProcessLine[]
  ): { valid: boolean; reason: string; suggestedFix: string } {
    // Check minimum required connections
    const requiredConnections = this.getRequiredConnectionsForInstrument(instrument.instrumentType);
    
    if (connectedLines.length < requiredConnections.minProcessLines) {
      return {
        valid: false,
        reason: `Insufficient process connections: found ${connectedLines.length}, required ${requiredConnections.minProcessLines}`,
        suggestedFix: 'Add missing process line connections'
      };
    }

    // Check for conflicting line types
    const lineTypes = connectedLines.map(line => line.type);
    const uniqueTypes = [...new Set(lineTypes)];
    
    if (uniqueTypes.length > requiredConnections.maxProcessLineTypes) {
      return {
        valid: false,
        reason: `Too many different line types connected: ${uniqueTypes.join(', ')}`,
        suggestedFix: 'Review process connections - instrument should connect to consistent line types'
      };
    }

    return { valid: true, reason: '', suggestedFix: '' };
  }

  /**
   * Validate flow direction and instrument orientation
   */
  private validateFlowDirection(
    instrument: InstrumentConnection,
    connectedLines: ProcessLine[]
  ): { valid: boolean; reason: string; suggestedFix: string } {
    for (const line of connectedLines) {
      const connectionPoint = this.findConnectionPointOnLine(instrument, line);
      
      if (connectionPoint) {
        const expectedDirection = this.getExpectedFlowDirection(instrument.instrumentType);
        const actualDirection = connectionPoint.direction || 0;
        
        const directionDiff = Math.abs(expectedDirection - actualDirection);
        const normalizedDiff = Math.min(directionDiff, 360 - directionDiff);
        
        if (normalizedDiff > this.flowDirectionTolerance) {
          return {
            valid: false,
            reason: `Flow direction mismatch: expected ${expectedDirection}°, found ${actualDirection}°`,
            suggestedFix: 'Verify flow arrows and instrument tap orientation'
          };
        }
      }
    }

    return { valid: true, reason: '', suggestedFix: '' };
  }

  /**
   * Check for missing required connections
   */
  private checkMissingConnections(instrument: InstrumentConnection): Array<{
    type: string;
    required: boolean;
    description: string;
    suggestedFix: string;
  }> {
    const missing = [];
    const requirements = this.getRequiredConnectionsForInstrument(instrument.instrumentType);

    if (requirements.requiresSignal && instrument.detectedConnections.signalLines.length === 0) {
      missing.push({
        type: 'signal',
        required: true,
        description: 'Missing required signal connection to control system',
        suggestedFix: 'Add signal line connection from instrument to control panel/DCS'
      });
    }

    if (requirements.requiresPower && instrument.detectedConnections.powerLines.length === 0) {
      missing.push({
        type: 'power',
        required: requirements.powerRequired,
        description: 'Missing power connection',
        suggestedFix: 'Add power supply connection for instrument operation'
      });
    }

    return missing;
  }

  /**
   * Check if a point is near a process line
   */
  private isPointNearLine(point: { x: number; y: number }, line: ProcessLine): boolean {
    for (let i = 0; i < line.geometry.points.length - 1; i++) {
      const lineStart = line.geometry.points[i];
      const lineEnd = line.geometry.points[i + 1];
      
      const distance = this.pointToLineDistance(point, lineStart, lineEnd);
      
      if (distance <= this.connectionTolerance + line.geometry.width / 2) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate line type is appropriate for instrument type
   */
  private validateLineTypeForInstrument(instrumentType: string, lineType: string): boolean {
    const validCombinations: Record<string, string[]> = {
      pressure: ['pipe'],
      temperature: ['pipe'],
      flow: ['pipe'],
      level: ['pipe'],
      control: ['pipe', 'signal', 'pneumatic'],
      safety: ['pipe']
    };

    return validCombinations[instrumentType]?.includes(lineType) || false;
  }

  /**
   * Check if equipment is connected to a process line
   */
  private isEquipmentConnectedToLine(equipment: EquipmentItem, line: ProcessLine): boolean {
    for (const connectionPoint of equipment.connectionPoints) {
      const isNear = this.isPointNearLine(connectionPoint, line);
      if (isNear) return true;
    }
    
    return false;
  }

  /**
   * Get required connections for instrument type
   */
  private getRequiredConnectionsForInstrument(instrumentType: string): {
    minProcessLines: number;
    maxProcessLineTypes: number;
    requiresSignal: boolean;
    requiresPower: boolean;
    powerRequired: boolean;
  } {
    const requirements: Record<string, {
      minProcessLines: number;
      maxProcessLineTypes: number;
      requiresSignal: boolean;
      requiresPower: boolean;
      powerRequired: boolean;
    }> = {
      pressure: { minProcessLines: 1, maxProcessLineTypes: 1, requiresSignal: true, requiresPower: true, powerRequired: true },
      temperature: { minProcessLines: 1, maxProcessLineTypes: 1, requiresSignal: true, requiresPower: true, powerRequired: true },
      flow: { minProcessLines: 1, maxProcessLineTypes: 1, requiresSignal: true, requiresPower: true, powerRequired: true },
      level: { minProcessLines: 1, maxProcessLineTypes: 1, requiresSignal: true, requiresPower: true, powerRequired: true },
      control: { minProcessLines: 1, maxProcessLineTypes: 2, requiresSignal: true, requiresPower: true, powerRequired: true },
      safety: { minProcessLines: 1, maxProcessLineTypes: 1, requiresSignal: false, requiresPower: false, powerRequired: false }
    };

    return requirements[instrumentType] || requirements.pressure;
  }

  /**
   * Get expected flow direction for instrument type
   */
  private getExpectedFlowDirection(instrumentType: string): number {
    const directions: Record<string, number> = {
      pressure: 90,  // Perpendicular to flow
      temperature: 0, // Parallel to flow
      flow: 0,       // Parallel to flow
      level: 270,    // Downward
      control: 90,   // Perpendicular to flow
      safety: 90     // Perpendicular to flow
    };

    return directions[instrumentType] || 0;
  }

  /**
   * Find connection point on line where instrument connects
   */
  private findConnectionPointOnLine(
    instrument: InstrumentConnection,
    line: ProcessLine
  ): ConnectionPoint | null {
    const instrumentCenter = {
      x: instrument.geometry.x + instrument.geometry.width / 2,
      y: instrument.geometry.y + instrument.geometry.height / 2
    };

    for (const connection of line.connections) {
      const distance = this.calculateDistance(instrumentCenter, connection);
      
      if (distance <= this.connectionTolerance) {
        return connection;
      }
    }

    return null;
  }

  /**
   * Calculate mapping confidence between instrument and equipment
   */
  private calculateMappingConfidence(
    instrument: InstrumentConnection,
    equipment: EquipmentItem,
    connectedLines: ProcessLine[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Distance factor (closer = higher confidence)
    const distance = this.calculateDistance(
      { x: instrument.geometry.x + instrument.geometry.width / 2, y: instrument.geometry.y + instrument.geometry.height / 2 },
      { x: equipment.geometry.x + equipment.geometry.width / 2, y: equipment.geometry.y + equipment.geometry.height / 2 }
    );
    
    const distanceFactor = Math.max(0, 1 - distance / this.proximityThreshold);
    confidence += distanceFactor * 0.3;

    // Type compatibility factor
    const typeMatch = this.validateInstrumentTypeMatch(instrument, [equipment]);
    if (typeMatch.valid) {
      confidence += 0.3;
    }

    // Connection quality factor
    if (connectedLines.length > 0) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate line connection confidence
   */
  private calculateLineConnectionConfidence(instrument: InstrumentConnection, line: ProcessLine): number {
    let confidence = 0.6; // Base confidence

    // Line type validity
    const typeValid = this.validateLineTypeForInstrument(instrument.instrumentType, line.type);
    if (typeValid) {
      confidence += 0.3;
    }

    // Connection proximity
    const instrumentCenter = {
      x: instrument.geometry.x + instrument.geometry.width / 2,
      y: instrument.geometry.y + instrument.geometry.height / 2
    };
    
    const isNear = this.isPointNearLine(instrumentCenter, line);
    if (isNear) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  }

  /**
   * Calculate distance from point to line segment
   */
  private pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    
    if (param < 0) {
      return Math.sqrt(A * A + B * B);
    } else if (param > 1) {
      const E = point.x - lineEnd.x;
      const F = point.y - lineEnd.y;
      return Math.sqrt(E * E + F * F);
    } else {
      const projX = lineStart.x + param * C;
      const projY = lineStart.y + param * D;
      const G = point.x - projX;
      const H = point.y - projY;
      return Math.sqrt(G * G + H * H);
    }
  }

  /**
   * Generate comprehensive mapping report
   */
  public generateMappingReport(results: MappingValidationResult[]): string {
    const validMappings = results.filter(r => r.isValid).length;
    const invalidMappings = results.length - validMappings;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    let report = '# Instrument-to-Equipment Mapping Validation Report\n\n';
    report += `## Summary\n`;
    report += `- Total Instruments: ${results.length}\n`;
    report += `- Valid Mappings: ${validMappings}\n`;
    report += `- Invalid Mappings: ${invalidMappings}\n`;
    report += `- Average Confidence: ${(averageConfidence * 100).toFixed(1)}%\n\n`;

    if (invalidMappings > 0) {
      report += `## Invalid Mappings (${invalidMappings})\n`;
      
      for (const result of results.filter(r => !r.isValid)) {
        report += `### Instrument ${result.instrumentId}\n`;
        report += `- Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
        report += `- Issues:\n`;
        for (const issue of result.issues) {
          report += `  - ${issue.description} (${issue.severity})\n`;
          report += `    Suggested fix: ${issue.suggestedFix}\n`;
        }
        report += `- Recommendations:\n`;
        for (const rec of result.recommendations) {
          report += `  - ${rec}\n`;
        }
        report += '\n';
      }
    }

    report += `## Overall Recommendations\n`;
    const highSeverityIssues = results.flatMap(r => r.issues).filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      report += `- 🚨 ${highSeverityIssues.length} high-severity mapping issues require immediate attention\n`;
    }
    
    const wrongEquipmentIssues = results.flatMap(r => r.issues).filter(i => i.type === 'wrong_equipment');
    if (wrongEquipmentIssues.length > 0) {
      report += `- 🔧 ${wrongEquipmentIssues.length} instruments connected to wrong equipment\n`;
    }

    const missingConnectionIssues = results.flatMap(r => r.issues).filter(i => i.type === 'missing_connection');
    if (missingConnectionIssues.length > 0) {
      report += `- ⚡ ${missingConnectionIssues.length} instruments missing required connections\n`;
    }

    if (averageConfidence > 0.9) {
      report += `- ✅ High overall confidence - mappings appear accurate\n`;
    } else if (averageConfidence < 0.7) {
      report += `- ⚠️ Low overall confidence - review mapping algorithm\n`;
    }

    return report;
  }
}

export default InstrumentMappingValidator;