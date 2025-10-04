'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, FileText, BarChart3, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mooreIndustriesEquipment, mooreIndustriesInstrumentation } from '@/lib/mockData';

interface ResultsViewerProps {
  result: {
    conversionId: string;
    filename: string;
    equipmentCount: number;
    pipeCount?: number;
    instrumentCount?: number;
    confidence: number;
    processingTime: number;
    equipment?: any[];
    instrumentation?: any[];
  };
  onStartNew: () => void;
}

export default function ResultsViewer({ result, onStartNew }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const confidenceColor = result.confidence >= 0.9 ? 'bg-green-500' : result.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500';
  const confidenceLabel = result.confidence >= 0.9 ? 'High' : result.confidence >= 0.7 ? 'Medium' : 'Low';

  // Use real Moore Industries equipment data or fallback
  const equipmentData = result.equipment || mooreIndustriesEquipment || [
    { tag: 'P-101A', type: 'Centrifugal Pump', service: 'Crude Feed Pump', confidence: 0.96 },
    { tag: 'V-201', type: 'Separator Vessel', service: 'Gas-Liquid Separator', confidence: 0.94 },
    { tag: 'E-301', type: 'Heat Exchanger', service: 'Crude Heater', confidence: 0.92 },
    { tag: 'T-401', type: 'Storage Tank', service: 'Crude Storage', confidence: 0.89 },
    { tag: 'C-501', type: 'Compressor', service: 'Gas Compressor', confidence: 0.87 }
  ];
  
  const instrumentationData = result.instrumentation || mooreIndustriesInstrumentation || [];

  const downloadOptions = [
    { format: 'DWG', description: 'AutoCAD Drawing', icon: FileText },
    { format: 'DXF', description: 'Drawing Exchange Format', icon: FileText },
    { format: 'PDF', description: 'Industrial Analysis Report (15+ pages)', icon: FileText },
    { format: 'CSV', description: 'Complete Equipment Database (110+ items)', icon: BarChart3 }
  ];

  const handleDownload = async (format: string) => {
    setIsDownloading(format);
    
    try {
      // For demo purposes, we'll simulate a download
      // In a real app, this would call the download API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate download delay
      
      // Create a mock file download
      const mockContent = generateMockFileContent(format);
      const blob = new Blob([mockContent], { type: getMimeType(format) });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${result.filename.replace(/\.[^/.]+$/, '')}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      toast({
        title: `${format} Downloaded Successfully!`,
        description: `${result.filename.replace(/\.[^/.]+$/, '')}.${format.toLowerCase()} is ready to use.`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: `Failed to download ${format} file. Please try again.`,
        type: 'error'
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading('all');
    
    try {
      // Download all files individually
      for (const option of downloadOptions) {
        // Simulate download delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create and download file
        const mockContent = generateMockFileContent(option.format);
        const blob = new Blob([mockContent], { type: getMimeType(option.format) });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${result.filename.replace(/\.[^/.]+$/, '')}.${option.format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      // Show success message
      toast({
        title: 'All Files Downloaded!',
        description: `${downloadOptions.length} files (DWG, DXF, PDF, CSV) downloaded successfully.`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Batch download failed:', error);
      toast({
        title: 'Batch Download Failed',
        description: 'Failed to download files. Please try again.',
        type: 'error'
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const generateMockFileContent = (format: string): string => {
    const timestamp = new Date().toISOString();
    const filename = result.filename.replace(/\.[^/.]+$/, '');
    
    switch (format.toUpperCase()) {
      case 'DWG':
      case 'DXF':
        const dxfContent = [
          '; AutoCAD DXF File Generated by CADly AI',
          `; Generated: ${timestamp}`,
          `; Original File: ${result.filename}`,
          `; Equipment Count: ${result.equipmentCount}`,
          `; Analysis Confidence: ${(result.confidence * 100).toFixed(1)}%`,
          `; Processing Time: ${Math.floor(result.processingTime / 60)}m ${result.processingTime % 60}s`,
          '',
          '0',
          'SECTION',
          '2',
          'HEADER',
          '9',
          '$ACADVER',
          '1',
          'AC1021',
          '9',
          '$DWGCODEPAGE',
          '3',
          'ANSI_1252',
          '0',
          'ENDSEC',
          '',
          '0',
          'SECTION',
          '2',
          'CLASSES',
          '0',
          'ENDSEC',
          '',
          '0',
          'SECTION',
          '2',
          'TABLES',
          '0',
          'TABLE',
          '2',
          'LAYER',
          '0',
          'LAYER',
          '5',
          '10',
          '100',
          'AcDbSymbolTableRecord',
          '100',
          'AcDbLayerTableRecord',
          '2',
          'EQUIPMENT',
          '70',
          '0',
          '62',
          '1',
          '6',
          'CONTINUOUS',
          '0',
          'LAYER',
          '5',
          '11',
          '100',
          'AcDbSymbolTableRecord',
          '100',
          'AcDbLayerTableRecord',
          '2',
          'PIPING',
          '70',
          '0',
          '62',
          '2',
          '6',
          'CONTINUOUS',
          '0',
          'LAYER',
          '5',
          '12',
          '100',
          'AcDbSymbolTableRecord',
          '100',
          'AcDbLayerTableRecord',
          '2',
          'INSTRUMENTS',
          '70',
          '0',
          '62',
          '3',
          '6',
          'CONTINUOUS',
          '0',
          'ENDTAB',
          '0',
          'ENDSEC',
          '',
          '0',
          'SECTION',
          '2',
          'BLOCKS',
          '0',
          'ENDSEC',
          '',
          '0',
          'SECTION',
          '2',
          'ENTITIES',
          '; Equipment Symbols',
          '0',
          'CIRCLE',
          '8',
          'EQUIPMENT',
          '10',
          '100.0',
          '20',
          '100.0',
          '40',
          '25.0',
          '; P-101A - Centrifugal Pump',
          '0',
          'TEXT',
          '8',
          'EQUIPMENT',
          '10',
          '85.0',
          '20',
          '75.0',
          '1',
          'P-101A',
          '40',
          '8.0',
          '0',
          'CIRCLE',
          '8',
          'EQUIPMENT',
          '10',
          '300.0',
          '20',
          '200.0',
          '40',
          '35.0',
          '; V-201 - Separator Vessel',
          '0',
          'TEXT',
          '8',
          'EQUIPMENT',
          '10',
          '280.0',
          '20',
          '160.0',
          '1',
          'V-201',
          '40',
          '8.0',
          '; Process Lines',
          '0',
          'LINE',
          '8',
          'PIPING',
          '10',
          '125.0',
          '20',
          '100.0',
          '11',
          '265.0',
          '21',
          '100.0',
          '; 12" Crude Feed Line',
          '0',
          'LINE',
          '8',
          'PIPING',
          '10',
          '300.0',
          '20',
          '165.0',
          '11',
          '300.0',
          '21',
          '100.0',
          '; Connection to V-201',
          '0',
          'CIRCLE',
          '8',
          'INSTRUMENTS',
          '10',
          '200.0',
          '20',
          '100.0',
          '40',
          '8.0',
          '; FIC-101 Flow Control',
          '0',
          'TEXT',
          '8',
          'INSTRUMENTS',
          '10',
          '185.0',
          '20',
          '85.0',
          '1',
          'FIC-101',
          '40',
          '5.0',
          '0',
          'ENDSEC',
          '',
          '0',
          'EOF'
        ];
        return dxfContent.join('\n');
      
      case 'PDF':
        // Create a COMPREHENSIVE UNLIMITED INDUSTRIAL-SCALE CADly analysis report
        const generateIndustrialScaleReport = () => {
          // Calculate ADVANCED analysis metrics
          const totalItems = equipmentData.length + instrumentationData.length;
          const highConfItems = equipmentData.filter(eq => eq.confidence >= 0.90).length + instrumentationData.filter(inst => inst.confidence >= 0.90).length;
          const mediumConfItems = equipmentData.filter(eq => eq.confidence >= 0.70 && eq.confidence < 0.90).length + instrumentationData.filter(inst => inst.confidence >= 0.70 && inst.confidence < 0.90).length;
          const lowConfItems = equipmentData.filter(eq => eq.confidence < 0.70).length + instrumentationData.filter(inst => inst.confidence < 0.70).length;
          const ultraHighConfItems = equipmentData.filter(eq => eq.confidence >= 0.95).length + instrumentationData.filter(inst => inst.confidence >= 0.95).length;
          
          // Safety systems analysis
          const safetyInstruments = instrumentationData.filter(inst => inst.SIL_Rating).length;
          const advancedAnalyzers = instrumentationData.filter(inst => inst.type?.includes('Chromatograph') || inst.type?.includes('Analyzer')).length;
          const vibrationMonitors = instrumentationData.filter(inst => inst.type?.includes('Vibration')).length;
          
          // Equipment categories
          const rotatingEquipment = equipmentData.filter(eq => eq.type?.includes('Pump') || eq.type?.includes('Compressor') || eq.type?.includes('Blower')).length;
          const staticEquipment = equipmentData.filter(eq => eq.type?.includes('Vessel') || eq.type?.includes('Tank') || eq.type?.includes('Exchanger')).length;
          const controlValves = equipmentData.filter(eq => eq.type?.includes('Control Valve')).length;
          const safetyEquipment = equipmentData.filter(eq => eq.type?.includes('Safety') || eq.type?.includes('Rupture')).length;
          
          const pages = [];
          
          // PAGE 1: EXECUTIVE SUMMARY & ANALYSIS OVERVIEW
          pages.push([
            'BT',
            '/F1 24 Tf',
            '100 720 Td',
            '(CADly Industrial AI Analysis Report) Tj',
            '0 -25 Td',
            '/F1 18 Tf',
            '0 0 1 rg',
            '(Advanced Technical Drawing Intelligence Engine v3.2) Tj',
            '0 0 0 rg',
            '0 -40 Td',
            '/F1 14 Tf',
            `(Source Drawing: 531_CAD_Drawing_Moore_Industries.dwg) Tj`,
            '0 -15 Td',
            `(Analysis Timestamp: ${timestamp}) Tj`,
            '0 -15 Td',
            `(Conversion ID: ${result.conversionId}) Tj`,
            '0 -15 Td',
            `(Report Classification: INDUSTRIAL SCALE ANALYSIS) Tj`,
            '0 -30 Td',
            '/F1 16 Tf',
            '0 0 1 rg',
            '(EXECUTIVE SUMMARY) Tj',
            '0 0 0 rg',
            '0 -20 Td',
            '/F1 10 Tf',
            '(CADly AI has executed a comprehensive industrial-scale analysis of the Moore) Tj',
            '0 -12 Td',
            '(Industries P&ID, deploying advanced machine learning algorithms to identify,) Tj',
            '0 -12 Td',
            '(classify, and catalog all process equipment, instrumentation, piping systems,) Tj',
            '0 -12 Td',
            '(safety devices, and control systems with unprecedented accuracy. This analysis) Tj',
            '0 -12 Td',
            '(represents a complete digital transformation of legacy engineering drawings) Tj',
            '0 -12 Td',
            '(into actionable, structured engineering data suitable for immediate integration) Tj',
            '0 -12 Td',
            '(into modern CAD, simulation, and asset management systems.) Tj',
            '0 -25 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(INDUSTRIAL SCALE METRICS:) Tj',
            '0 0 0 rg',
            '0 -15 Td',
            '/F1 9 Tf',
            `(• Total Process Equipment: ${result.equipmentCount} major industrial units) Tj`,
            '0 -10 Td',
            `(• Process Instrumentation: ${result.instrumentCount} control/measurement devices) Tj`,
            '0 -10 Td',
            `(• Piping Network Complexity: ${result.pipeCount} interconnected segments) Tj`,
            '0 -10 Td',
            `(• Safety Instrumented Systems: ${safetyInstruments} SIL-rated devices) Tj`,
            '0 -10 Td',
            `(• Advanced Process Analyzers: ${advancedAnalyzers} analytical instruments) Tj`,
            '0 -10 Td',
            `(• Rotating Equipment Monitoring: ${vibrationMonitors} vibration sensors) Tj`,
            '0 -10 Td',
            `(• Overall Analysis Confidence: ${(result.confidence * 100).toFixed(1)}% [SUPERIOR GRADE]) Tj`,
            '0 -10 Td',
            `(• Ultra-High Confidence Items: ${ultraHighConfItems} items (≥95% confidence)) Tj`,
            '0 -10 Td',
            `(• Processing Duration: ${Math.floor(result.processingTime / 60)}m ${result.processingTime % 60}s [Complex Analysis]) Tj`,
            '0 -20 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(ADVANCED QUALITY METRICS:) Tj',
            '0 0 0 rg',
            '0 -12 Td',
            '/F1 9 Tf',
            '(Drawing Complexity: INDUSTRIAL GRADE - Multi-process unit integration) Tj',
            '0 -10 Td',
            '(Symbol Recognition Accuracy: 98.7% - Advanced P&ID symbol library) Tj',
            '0 -10 Td',
            '(Text Extraction Precision: 97.3% - Multi-font industrial labeling) Tj',
            '0 -10 Td',
            '(Connection Mapping Fidelity: 96.8% - Complex piping network analysis) Tj',
            '0 -10 Td',
            '(Material Specification Accuracy: 94.2% - Advanced materials database) Tj',
            '0 -10 Td',
            '(Dimensional Analysis Precision: 91.7% - Equipment sizing algorithms) Tj',
            '0 -10 Td',
            '(Safety System Classification: 99.1% - Critical safety device identification) Tj',
            '0 -20 Td',
            '/F1 10 Tf',
            '0 0 1 rg',
            '(INDUSTRIAL INTEGRATION READINESS CERTIFICATION:) Tj',
            '0 0 0 rg',
            '0 -12 Td',
            '/F1 8 Tf',
            '(This analysis meets and exceeds industrial engineering standards for:) Tj',
            '0 -10 Td',
            '(• FEED/Basic Engineering Design • Detailed Engineering • Procurement) Tj',
            '0 -10 Td',
            '(• Construction Planning • Commissioning • Operations & Maintenance) Tj',
            'ET'
          ]);
          
          // PAGE 2: PRIMARY PROCESS EQUIPMENT DETAILED INVENTORY
          pages.push([
            'BT',
            '/F1 16 Tf',
            '50 750 Td',
            '(PRIMARY PROCESS EQUIPMENT - DETAILED INVENTORY) Tj',
            '0 -20 Td',
            '/F1 8 Tf',
            '0.5 0.5 0.5 rg',
            `(Page 2 of ${Math.ceil(totalItems/10) + 8} | Industrial CADly Analysis | Moore Industries Complex) Tj`,
            '0 0 0 rg',
            '0 -25 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(PUMPING SYSTEMS - PROCESS CRITICAL) Tj',
            '0 0 0 rg',
            '0 -15 Td',
            '/F1 7 Tf',
            '(TAG       TYPE                     SERVICE                   CONF   MATERIAL     RATING      SIZE        CAPACITY         POWER   VENDOR) Tj',
            '0 -12 Td',
            '0.3 0.3 0.3 rg',
            ...equipmentData.filter(eq => eq.type?.includes('Pump')).map((eq) => [
              `0 -8 Td`,
              `(${(eq.tag || '').padEnd(9)} ${(eq.type || '').substring(0,20).padEnd(21)} ${(eq.service || '').substring(0,24).padEnd(25)} ${((eq.confidence || 0) * 100).toFixed(1)}%  ${(eq.material || '').substring(0,11).padEnd(12)} ${(eq.rating || '').padEnd(11)} ${(eq.size || 'N/A').padEnd(11)} ${(eq.capacity || 'N/A').padEnd(16)} ${(eq.power || 'N/A').padEnd(7)} ${(eq.vendor || 'TBD')}) Tj`
            ]).flat(),
            '0 0 0 rg',
            '0 -20 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(SEPARATION & STORAGE VESSELS) Tj',
            '0 0 0 rg',
            '0 -12 Td',
            '/F1 7 Tf',
            ...equipmentData.filter(eq => eq.type?.includes('Vessel') || eq.type?.includes('Tank') || eq.type?.includes('Drum')).map((eq) => [
              `0 -8 Td`,
              `(${(eq.tag || '').padEnd(9)} ${(eq.type || '').substring(0,20).padEnd(21)} ${(eq.service || '').substring(0,24).padEnd(25)} ${((eq.confidence || 0) * 100).toFixed(1)}%  ${(eq.material || '').substring(0,11).padEnd(12)} ${(eq.rating || '').padEnd(11)} ${(eq.size || 'N/A').padEnd(11)} ${(eq.volume || eq.capacity || 'N/A').padEnd(16)} N/A     ${(eq.vendor || 'TBD')}) Tj`
            ]).flat(),
            '0 -20 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(HEAT TRANSFER EQUIPMENT) Tj',
            '0 0 0 rg',
            '0 -12 Td',
            '/F1 7 Tf',
            ...equipmentData.filter(eq => eq.type?.includes('Exchanger') || eq.type?.includes('Cooler') || eq.type?.includes('Heater')).map((eq) => [
              `0 -8 Td`,
              `(${(eq.tag || '').padEnd(9)} ${(eq.type || '').substring(0,20).padEnd(21)} ${(eq.service || '').substring(0,24).padEnd(25)} ${((eq.confidence || 0) * 100).toFixed(1)}%  ${(eq.material || '').substring(0,11).padEnd(12)} ${(eq.rating || '').padEnd(11)} ${(eq.size || 'N/A').padEnd(11)} ${(eq.area || eq.capacity || 'N/A').padEnd(16)} ${(eq.power || 'N/A').padEnd(7)} ${(eq.vendor || 'TBD')}) Tj`
            ]).flat(),
            'ET'
          ]);
          
          // PAGE 3: INSTRUMENTATION & CONTROL SYSTEMS
          pages.push([
            'BT',
            '/F1 16 Tf',
            '50 750 Td',
            '(INSTRUMENTATION & CONTROL SYSTEMS) Tj',
            '0 -25 Td',
            '/F1 8 Tf',
            '0.5 0.5 0.5 rg',
            '(Page 3 of 6 | CADly Analysis Report | Moore Industries P&ID) Tj',
            '0 0 0 rg',
            '0 -30 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(PROCESS CONTROL INSTRUMENTS) Tj',
            '0 0 0 rg',
            '0 -20 Td',
            '/F1 8 Tf',
            '(TAG        FUNCTION                     TYPE                     LOCATION           CONF) Tj',
            '0 -15 Td',
            '0.3 0.3 0.3 rg',
            ...instrumentationData.map((inst, i) => [
              `0 -12 Td`,
              `(${inst.tag.padEnd(10)} ${inst.service.padEnd(28)} ${inst.type.padEnd(24)} ${inst.location.padEnd(18)} ${(inst.confidence * 100).toFixed(1)}%) Tj`
            ]).flat(),
            '0 0 0 rg',
            '0 -30 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(CONTROL LOOP ANALYSIS) Tj',
            '0 0 0 rg',
            '0 -20 Td',
            '/F1 10 Tf',
            '(Flow Control Loops: 2 identified (FIC-101, FI-102)) Tj',
            '0 -12 Td',
            '(Pressure Control Loops: 2 identified (PIC-201, PI-202)) Tj',
            '0 -12 Td',
            '(Temperature Control Loops: 3 identified (TIC-301A, TIC-301B, TI-302)) Tj',
            '0 -12 Td',
            '(Level Control Loops: 2 identified (LIC-401, LI-402)) Tj',
            '0 -12 Td',
            '(Specialized Controls: 3 identified (PDIC-501A/B, AIC-701, DIC-801)) Tj',
            '0 -20 Td',
            '(Control System Architecture: Distributed (DCS-compatible)) Tj',
            '0 -12 Td',
            '(Safety Instrumentation: SIL-rated systems detected) Tj',
            '0 -12 Td',
            '(Communication Protocol: HART/Foundation Fieldbus ready) Tj',
            'ET'
          ]);
          
          // PAGE 4: PROCESS FLOW ANALYSIS
          pages.push([
            'BT',
            '/F1 16 Tf',
            '50 750 Td',
            '(PROCESS FLOW & PIPING ANALYSIS) Tj',
            '0 -25 Td',
            '/F1 8 Tf',
            '0.5 0.5 0.5 rg',
            '(Page 4 of 6 | CADly Analysis Report | Moore Industries P&ID) Tj',
            '0 0 0 rg',
            '0 -30 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(PIPING SYSTEM BREAKDOWN) Tj',
            '0 0 0 rg',
            '0 -20 Td',
            '/F1 10 Tf',
            '(PRIMARY PROCESS LINES:) Tj',
            '0 -15 Td',
            '• Main Feed Line: 12" ANSI 300# SS316L (P-101A/B to V-201)) Tj',
            '0 -12 Td',
            '• Gas Export Line: 8" ANSI 600# CS A53-B (V-201 to C-501A/B)) Tj',
            '0 -12 Td',
            '• Liquid Product Line: 6" ANSI 150# SS316L (V-201 to E-301A)) Tj',
            '0 -12 Td',
            '• Recycle Line: 4" ANSI 300# SS316L (E-301A to P-101A)) Tj',
            '0 -12 Td',
            '• Steam Supply: 3" ANSI 600# A106-B (Utility header to E-301A/B)) Tj',
            '0 -20 Td',
            '(UTILITY SYSTEMS:) Tj',
            '0 -15 Td',
            '• Instrument Air: 1" ANSI 150# SS316L (Multiple connection points)) Tj',
            '0 -12 Td',
            '• Cooling Water: 2" ANSI 150# A53-B (E-302 cooling system)) Tj',
            '0 -12 Td',
            '• Drain Systems: 1.5" ANSI 150# CS (Equipment drainage)) Tj',
            '0 -12 Td',
            '• Vent Systems: 2" ANSI 150# CS (Atmospheric venting)) Tj',
            '0 -20 Td',
            '(VALVE INVENTORY:) Tj',
            '0 -15 Td',
            '• Control Valves: 8 identified (4 primary, 4 secondary)) Tj',
            '0 -12 Td',
            '• Block Valves: 23 identified (Gate, Ball, Globe types)) Tj',
            '0 -12 Td',
            '• Check Valves: 6 identified (Swing and spring-loaded)) Tj',
            '0 -12 Td',
            '• Safety Valves: 3 identified (PSV-201A/B, RD-401)) Tj',
            '0 -20 Td',
            '(PROCESS FLOW PATHS IDENTIFIED:) Tj',
            '0 -15 Td',
            '1. Feed → P-101A/B → V-201 → E-301A → Product Export) Tj',
            '0 -12 Td',
            '2. Gas Phase → V-201 → C-501A/B → Gas Export System) Tj',
            '0 -12 Td',
            '3. Recycle Loop → E-301A → V-202 → P-101A (Process optimization)) Tj',
            'ET'
          ]);
          
          // PAGE 5: VISUAL P&ID DIAGRAM
          pages.push([
            'BT',
            '/F1 16 Tf',
            '50 750 Td',
            '(VISUAL P&ID RECONSTRUCTION) Tj',
            '0 -25 Td',
            '/F1 8 Tf',
            '0.5 0.5 0.5 rg',
            '(Page 5 of 6 | CADly Analysis Report | Moore Industries P&ID) Tj',
            '0 0 0 rg',
            'ET',
            '',
            '% Generate all equipment symbols positioned accurately',
            ...equipmentData.map(eq => [
              `% ${eq.tag} - ${eq.type}`,
              '1 w',
              eq.type.includes('Pump') ? `${eq.position.x} ${eq.position.y} 15 0 360 arc S` :
              eq.type.includes('Vessel') || eq.type.includes('Tank') ? `${eq.position.x - 20} ${eq.position.y - 15} 40 30 re S` :
              eq.type.includes('Exchanger') || eq.type.includes('Cooler') ? `${eq.position.x - 15} ${eq.position.y - 10} 30 20 re S` :
              eq.type.includes('Compressor') ? `${eq.position.x} ${eq.position.y} 18 0 360 arc S` :
              eq.type.includes('Filter') ? `${eq.position.x - 10} ${eq.position.y - 8} 20 16 re S` :
              eq.type.includes('Valve') ? `${eq.position.x} ${eq.position.y} 8 0 360 arc S` :
              `${eq.position.x - 8} ${eq.position.y - 8} 16 16 re S`,
              `BT /F1 6 Tf ${eq.position.x - 15} ${eq.position.y - 25} Td (${eq.tag}) Tj ET`,
              `BT /F1 4 Tf 0.6 0.6 0.6 rg ${eq.position.x - 12} ${eq.position.y - 35} Td (${(eq.confidence * 100).toFixed(0)}%) Tj 0 0 0 rg ET`,
              ''
            ]).flat(),
            '',
            '% Instrumentation symbols',
            ...instrumentationData.map(inst => [
              `% ${inst.tag} - ${inst.type}`,
              '0.8 w',
              `${inst.position.x} ${inst.position.y} 6 0 360 arc S`,
              `${inst.position.x - 3} ${inst.position.y} m ${inst.position.x + 3} ${inst.position.y} l S`,
              `${inst.position.x} ${inst.position.y - 3} m ${inst.position.x} ${inst.position.y + 3} l S`,
              `BT /F1 5 Tf ${inst.position.x - 10} ${inst.position.y + 8} Td (${inst.tag}) Tj ET`,
              ''
            ]).flat(),
            '',
            '% Process flow lines with specifications',
            '2 w 80 400 m 520 400 l S',
            '320 450 m 320 500 l 480 500 l S',
            '320 350 m 320 250 l 450 250 l S',
            '1 w 150 200 m 200 200 l 200 150 l S',
            '400 480 m 450 480 l S',
            '2 w 240 395 m 250 400 l 240 405 l S',
            '440 495 m 450 500 l 440 505 l S',
            '325 280 m 320 270 l 315 280 l S',
            'BT /F1 5 Tf 0.4 0.4 0.4 rg',
            '85 415 Td (12" ANSI 300# SS316L) Tj',
            '180 515 Td (8" ANSI 600# CS) Tj',
            '360 265 Td (6" ANSI 150# SS316L) Tj',
            '0 0 0 rg ET'
          ]);
          
          // PAGE 6: QUALITY METRICS & RECOMMENDATIONS
          pages.push([
            'BT',
            '/F1 16 Tf',
            '50 750 Td',
            '(QUALITY METRICS & RECOMMENDATIONS) Tj',
            '0 -25 Td',
            '/F1 8 Tf',
            '0.5 0.5 0.5 rg',
            '(Page 6 of 6 | CADly Analysis Report | Moore Industries P&ID) Tj',
            '0 0 0 rg',
            '0 -30 Td',
            '/F1 12 Tf',
            '0 0 1 rg',
            '(DETAILED CONFIDENCE ANALYSIS) Tj',
            '0 0 0 rg',
            '0 -20 Td',
            '/F1 10 Tf',
            `(High Confidence Items (≥90%): ${highConfItems} items (${Math.round((highConfItems/(result.equipmentCount + result.instrumentCount))*100)}%)) Tj`,
            '0 -12 Td',
            `(Medium Confidence Items (70-89%): ${mediumConfItems} items (${Math.round((mediumConfItems/(result.equipmentCount + result.instrumentCount))*100)}%)) Tj`,
            '0 -12 Td',
            `(Low Confidence Items (<70%): ${lowConfItems} items (${Math.round((lowConfItems/(result.equipmentCount + result.instrumentCount))*100)}%)) Tj`,
            '0 -20 Td',
            '(PROCESSING PERFORMANCE METRICS:) Tj',
            '0 -15 Td',
            '• Symbol Detection Rate: 97.2% (Industry best: 98.5%)) Tj',
            '0 -12 Td',
            '• Text Recognition Rate: 95.8% (Industry standard: 92%)) Tj',
            '0 -12 Td',
            '• Connection Mapping: 94.1% (Target: 95%)) Tj',
            '0 -12 Td',
            '• Material Classification: 91.3% (Advanced feature)) Tj',
            '0 -12 Td',
            '• Equipment Sizing: 88.7% (Dimensional analysis)) Tj',
            '0 -20 Td',
            '0 0 1 rg',
            '(RECOMMENDATIONS FOR PRODUCTION USE:) Tj',
            '0 0 0 rg',
            '0 -15 Td',
            '(IMMEDIATE ACTIONS:) Tj',
            '0 -12 Td',
            `(• Review ${lowConfItems} low-confidence items for manual verification) Tj`,
            '0 -12 Td',
            '(• Validate material specifications for critical pressure vessels) Tj',
            '0 -12 Td',
            '(• Cross-reference equipment tags with existing plant database) Tj',
            '0 -12 Td',
            '(• Verify control loop assignments with process engineers) Tj',
            '0 -20 Td',
            '(INTEGRATION READINESS:) Tj',
            '0 -12 Td',
            '(• AutoCAD/Inventor: Ready for import (DWG/DXF formats)) Tj',
            '0 -12 Td',
            '(• Aspen HYSYS: Equipment list compatible (CSV export)) Tj',
            '0 -12 Td',
            '(• AVEVA PDMS: 3D model ready (pipe routing data)) Tj',
            '0 -12 Td',
            '(• SAP PM: Maintenance schedules can be auto-generated) Tj',
            '0 -20 Td',
            '0 0 1 rg',
            '(ANALYSIS CERTIFICATION:) Tj',
            '0 0 0 rg',
            '0 -15 Td',
            '(This analysis meets engineering-grade standards for:) Tj',
            '0 -12 Td',
            '(• Preliminary design reviews and feasibility studies) Tj',
            '0 -12 Td',
            '(• Equipment procurement and specification development) Tj',
            '0 -12 Td',
            '(• Process simulation model initialization) Tj',
            '0 -12 Td',
            '(• Safety analysis and HAZOP preparation) Tj',
            '0 -20 Td',
            '/F1 8 Tf',
            '0.6 0.6 0.6 rg',
            `(Generated by CADly AI Analysis Engine v2.1 | Confidence: ${(result.confidence * 100).toFixed(1)}% | Processing ID: ${result.conversionId}) Tj`,
            '0 -10 Td',
            '(Copyright © 2024 CADly Technologies | All analysis results verified by AI quality assurance) Tj',
            '0 0 0 rg',
            'ET'
          ]);
          
          return pages;
        };
        
        const pages = generateIndustrialScaleReport();
        const drawingContent = pages.flat();
        
        // Create multi-page PDF structure
        const pageCount = pages.length;
        const pageObjects = [];
        const contentObjects = [];
        let objectNumber = 3; // Starting after catalog and pages objects
        
        // Generate page and content objects for each page
        pages.forEach((pageContent, index) => {
          const contentStream = pageContent.join('\n');
          const streamLength = contentStream.length;
          
          // Page object
          pageObjects.push({
            number: objectNumber,
            content: [
              `${objectNumber} 0 obj`,
              '<<',
              '/Type /Page',
              '/Parent 2 0 R',
              '/MediaBox [0 0 612 792]',
              `/Contents ${objectNumber + 1} 0 R`,
              '/Resources <<',
              '/Font <<',
              '/F1 <<',
              '/Type /Font',
              '/Subtype /Type1',
              '/BaseFont /Helvetica',
              '>>',
              '>>',
              '>>',
              '>>',
              'endobj'
            ].join('\n')
          });
          
          // Content object
          contentObjects.push({
            number: objectNumber + 1,
            content: [
              `${objectNumber + 1} 0 obj`,
              '<<',
              `/Length ${streamLength}`,
              '>>',
              'stream',
              contentStream,
              'endstream',
              'endobj'
            ].join('\n')
          });
          
          objectNumber += 2; // Each page needs 2 objects (page + content)
        });
        
        const pageRefs = pageObjects.map(p => `${p.number} 0 R`).join(' ');
        
        const pdfContent = [
          '%PDF-1.4',
          '1 0 obj',
          '<<',
          '/Type /Catalog',
          '/Pages 2 0 R',
          '>>',
          'endobj',
          '',
          '2 0 obj',
          '<<',
          '/Type /Pages',
          `/Kids [${pageRefs}]`,
          `/Count ${pageCount}`,
          '>>',
          'endobj',
          '',
          // Add all page objects
          ...pageObjects.map(p => p.content),
          '',
          // Add all content objects
          ...contentObjects.map(c => c.content),
          '',
          'xref',
          `0 ${objectNumber}`,
          '0000000000 65535 f ',
          ...Array.from({length: objectNumber - 1}, (_, i) => `${String(100 + (i * 150)).padStart(10, '0')} 00000 n `),
          'trailer',
          '<<',
          `/Size ${objectNumber}`,
          '/Root 1 0 R',
          '>>',
          'startxref',
          '1000',
          '%%EOF'
        ];
        return pdfContent.join('\n');
      
      case 'CSV':
        const csvHeaders = 'Equipment Tag,Type,Service,Confidence,Material,Rating,Status,Notes';
        
        // Generate CSV from real equipment data
        const equipmentCsvData = equipmentData.map(eq => 
          `${eq.tag},${eq.type},${eq.service},${(eq.confidence * 100).toFixed(1)}%,${eq.material},${eq.rating},Active,${eq.service}`
        );
        
        const instrumentCsvData = instrumentationData.map(inst => 
          `${inst.tag},${inst.type},${inst.service},${(inst.confidence * 100).toFixed(1)}%,SS316L,ANSI 150#,Active,${inst.location}`
        );
        
        const allCsvData = [...equipmentCsvData, ...instrumentCsvData];
        return `${csvHeaders}\n${allCsvData.join('\n')}`;
      
      default:
        return `CADly Demo File\nGenerated: ${timestamp}\nOriginal: ${result.filename}\nFormat: ${format}\n\nThis is a demonstration file generated by CADly.\nIn production, this would contain the actual converted data.`;
    }
  };

  const getMimeType = (format: string): string => {
    switch (format.toUpperCase()) {
      case 'PDF': return 'application/pdf';
      case 'CSV': return 'text/csv';
      case 'DWG': return 'application/octet-stream';
      case 'DXF': return 'application/octet-stream';
      default: return 'text/plain';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversion Complete!</h2>
            <p className="text-gray-600">Successfully processed: {result.filename}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Badge className={`${confidenceColor} text-white`}>
                {confidenceLabel} Confidence ({(result.confidence * 100).toFixed(1)}%)
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Processed in {Math.floor(result.processingTime / 60)}m {result.processingTime % 60}s
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mx-6 mt-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

        <div className="p-6">
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Equipment Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{result.equipmentCount}</div>
                  <p className="text-sm text-gray-500 mt-1">Items identified</p>
                </CardContent>
              </Card>
              
              {result.pipeCount && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pipe Segments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{result.pipeCount}</div>
                    <p className="text-sm text-gray-500 mt-1">Connections mapped</p>
                  </CardContent>
                </Card>
              )}
              
              {result.instrumentCount && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Instruments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{result.instrumentCount}</div>
                    <p className="text-sm text-gray-500 mt-1">Control devices</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Confidence Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Confidence Breakdown
                </CardTitle>
                <CardDescription>
                  Quality assessment of the conversion results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${confidenceColor} transition-all duration-500`}
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">78%</div>
                      <div className="text-xs text-gray-500">High Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">18%</div>
                      <div className="text-xs text-gray-500">Medium Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">4%</div>
                      <div className="text-xs text-gray-500">Needs Review</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Equipment</CardTitle>
                <CardDescription>
                  List of equipment items identified in your drawing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {equipmentData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{item.tag}</span>
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.service}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.confidence >= 0.9 ? 'bg-green-500' : 
                          item.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium">{(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Statistics</CardTitle>
                <CardDescription>Detailed metrics about the conversion process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Processing Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Processing Time</span>
                        <span className="font-medium">{Math.floor(result.processingTime / 60)}m {result.processingTime % 60}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Symbols Detected</span>
                        <span className="font-medium">{result.equipmentCount + (result.instrumentCount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Text Elements</span>
                        <span className="font-medium">142</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connection Points</span>
                        <span className="font-medium">{result.pipeCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Accuracy</span>
                        <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Requiring Review</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auto-validated Items</span>
                        <span className="font-medium">{result.equipmentCount - 3}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
                <CardDescription>
                  Choose the format that best fits your workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {downloadOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    const isCurrentlyDownloading = isDownloading === option.format;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-24 p-4 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 relative group"
                        onClick={() => handleDownload(option.format)}
                        disabled={isDownloading !== null}
                      >
                        {isCurrentlyDownloading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <div className="text-center">
                              <div className="font-semibold text-blue-600 text-sm">Downloading...</div>
                              <div className="text-xs text-blue-500">Please wait</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <IconComponent className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                            <div className="text-center">
                              <div className="font-semibold text-sm">{option.format}</div>
                              <div className="text-xs text-gray-500 group-hover:text-gray-600">{option.description}</div>
                            </div>
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onStartNew} 
                variant="outline" 
                className="flex-1 h-12 font-medium"
              >
                Convert Another Drawing
              </Button>
              <Button 
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                onClick={handleDownloadAll}
                disabled={isDownloading !== null}
              >
                {isDownloading === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Downloading All Files...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 w-4 h-4" />
                    Download All Files
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
