import { ConversionResult, Equipment, Project } from '@/types';

export const sampleConversions: ConversionResult[] = [
  {
    id: 'conv_001',
    filename: 'P&ID-Legacy-1995.pdf',
    type: 'P&ID',
    status: 'completed',
    confidence: 0.94,
    processingTime: 223,
    equipmentCount: 47,
    pipeCount: 203,
    instrumentCount: 89,
    createdAt: new Date('2024-03-15T10:30:00'),
    updatedAt: new Date('2024-03-15T10:34:00')
  },
  {
    id: 'conv_002',
    filename: 'Electrical-Distribution-Main.dwg',
    type: 'Electrical',
    status: 'completed',
    confidence: 0.91,
    processingTime: 156,
    equipmentCount: 34,
    createdAt: new Date('2024-03-14T16:20:00'),
    updatedAt: new Date('2024-03-14T16:23:00')
  },
  {
    id: 'conv_003',
    filename: 'Mechanical-HVAC-System.pdf',
    type: 'Mechanical',
    status: 'review_required',
    confidence: 0.76,
    processingTime: 298,
    equipmentCount: 23,
    createdAt: new Date('2024-03-13T14:15:00'),
    updatedAt: new Date('2024-03-13T14:20:00')
  }
];

export const sampleEquipment: Equipment[] = [
  {
    tag: 'P-101A',
    type: 'Centrifugal Pump',
    service: 'Crude Feed Pump',
    size: '6x4x13',
    material: 'SS316L',
    rating: 'ANSI 300#',
    confidence: 0.96,
    position: { x: 150, y: 200 }
  },
  {
    tag: 'V-201',
    type: 'Separator Vessel',
    service: 'Gas-Liquid Separator',
    size: '8\' x 20\'',
    material: 'CS + SS Internals',
    rating: 'ANSI 150#',
    confidence: 0.94,
    position: { x: 300, y: 180 }
  },
  {
    tag: 'E-301A',
    type: 'Heat Exchanger',
    service: 'Crude Preheater',
    size: '24" x 16\'',
    material: 'SS316L Tubes',
    rating: 'ANSI 300#',
    confidence: 0.92,
    position: { x: 450, y: 220 }
  },
  {
    tag: 'T-401',
    type: 'Storage Tank',
    service: 'Crude Storage',
    size: '40\' x 60\'',
    material: 'Carbon Steel',
    rating: 'Atmospheric',
    confidence: 0.89,
    position: { x: 100, y: 350 }
  },
  {
    tag: 'C-501A',
    type: 'Compressor',
    service: 'Gas Compressor',
    size: '1000 HP',
    material: 'Cast Iron',
    rating: 'High Pressure',
    confidence: 0.87,
    position: { x: 500, y: 120 }
  }
];

export const sampleProjects: Project[] = [
  {
    id: 'proj_001',
    name: 'Refinery Unit A Modernization',
    description: 'Complete P&ID digitization for the main processing unit including all auxiliary systems',
    drawingCount: 45,
    status: 'active',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10'),
    conversions: [sampleConversions[0]]
  },
  {
    id: 'proj_002',
    name: 'Electrical Infrastructure Upgrade',
    description: 'Single-line diagrams and control schematics conversion for power distribution',
    drawingCount: 28,
    status: 'completed',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-28'),
    conversions: [sampleConversions[1]]
  },
  {
    id: 'proj_003',
    name: 'Mechanical Systems Documentation',
    description: 'HVAC and mechanical equipment drawings for facility management',
    drawingCount: 15,
    status: 'active',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-14'),
    conversions: [sampleConversions[2]]
  }
];

export const processingStages = [
  { stage: 'upload', label: 'Uploading file...', progress: 10, duration: 2000 },
  { stage: 'preprocessing', label: 'Preprocessing image...', progress: 25, duration: 3000 },
  { stage: 'symbol_detection', label: 'Detecting symbols...', progress: 50, duration: 4000 },
  { stage: 'text_extraction', label: 'Extracting text...', progress: 70, duration: 3500 },
  { stage: 'connection_tracing', label: 'Tracing connections...', progress: 85, duration: 2500 },
  { stage: 'validation', label: 'Validating results...', progress: 95, duration: 2000 },
  { stage: 'complete', label: 'Complete!', progress: 100, duration: 1000 }
];

export const generateMockResult = (filename: string) => {
  const types = ['P&ID', 'Electrical', 'Mechanical', 'Structural', 'Other'];
  const randomType = types[Math.floor(Math.random() * types.length)] as any;
  
  return {
    conversionId: `demo_${Date.now()}`,
    filename,
    type: randomType,
    status: 'completed' as const,
    confidence: 0.85 + Math.random() * 0.15, // 0.85-1.0
    processingTime: 120 + Math.floor(Math.random() * 300), // 120-420 seconds
    equipmentCount: 15 + Math.floor(Math.random() * 50), // 15-65 items
    pipeCount: randomType === 'P&ID' ? 50 + Math.floor(Math.random() * 200) : undefined,
    instrumentCount: randomType === 'P&ID' ? 10 + Math.floor(Math.random() * 40) : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};