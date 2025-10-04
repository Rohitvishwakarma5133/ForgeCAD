import { PricingTier } from '@/types';

export const COMPANY_NAME = 'CADly';
export const COMPANY_TAGLINE = 'Transform Legacy Drawings into Digital Intelligence';

export const SUPPORTED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
  'application/pdf': ['.pdf'],
  'application/acad': ['.dwg', '.dxf'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const NAVIGATION_ITEMS = [
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Demo', href: '/demo' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export const DASHBOARD_NAVIGATION = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Upload Drawing', href: '/dashboard/upload' },
  { name: 'My Projects', href: '/dashboard/projects' },
  { name: 'History', href: '/dashboard/history' },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'pay-per-drawing',
    name: 'Pay-Per-Drawing',
    price: 10,
    period: 'per-drawing',
    features: [
      'Simple drawings from $10',
      'Complex drawings up to $25',
      'No subscription required',
      '48-hour processing',
      'Email delivery',
      'Basic support'
    ],
    limits: {
      processingTime: '48 hours',
      apiAccess: false,
      support: 'Email'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 499,
    period: 'monthly',
    features: [
      '100 drawings included',
      '$5 per additional drawing',
      '4-hour priority SLA',
      'API access',
      'Batch upload',
      'Custom validation rules',
      'Priority support'
    ],
    limits: {
      drawingsPerMonth: 100,
      processingTime: '4 hours',
      apiAccess: true,
      support: 'Email + Chat'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    period: 'monthly',
    features: [
      'Unlimited drawings',
      'Dedicated infrastructure',
      'On-premise option',
      'Custom AI training',
      'Integration support',
      '99.9% SLA',
      '24/7 phone support',
      'Dedicated account manager'
    ],
    limits: {
      processingTime: '1 hour',
      apiAccess: true,
      support: '24/7 Phone + Dedicated AM'
    }
  }
];

export const PROCESSING_STAGES = [
  { stage: 'upload', label: 'Uploading file...', progress: 10 },
  { stage: 'preprocessing', label: 'Preprocessing image...', progress: 25 },
  { stage: 'symbol_detection', label: 'Detecting symbols...', progress: 45 },
  { stage: 'text_extraction', label: 'Extracting text...', progress: 65 },
  { stage: 'connection_tracing', label: 'Tracing connections...', progress: 80 },
  { stage: 'validation', label: 'Validating results...', progress: 95 },
  { stage: 'complete', label: 'Complete!', progress: 100 },
];

export const STATS = [
  { value: '95%', label: 'Faster' },
  { value: '96%', label: 'Cost Reduction' },
  { value: '91.5%', label: 'Accuracy' },
  { value: '50K+', label: 'Drawings Processed' }
];

export const INDUSTRIES = [
  {
    name: 'Oil & Gas',
    description: 'Brownfield modernization and digital transformation',
    icon: '🛢️'
  },
  {
    name: 'Power Plants',
    description: 'Digital twin creation and asset management',
    icon: '⚡'
  },
  {
    name: 'Manufacturing',
    description: 'Legacy equipment digitization',
    icon: '🏭'
  },
  {
    name: 'Construction',
    description: 'As-built documentation and BIM integration',
    icon: '🏗️'
  },
  {
    name: 'Facility Management',
    description: 'Building system mapping and maintenance',
    icon: '🏢'
  }
];

export const FEATURES = [
  {
    title: 'Multi-Format Input',
    description: 'Support for PDF, images, legacy CAD files, and handwritten drawings',
    icon: '📁'
  },
  {
    title: '94% Symbol Detection',
    description: 'AI-powered recognition of 200+ engineering symbols with high accuracy',
    icon: '🎯'
  },
  {
    title: 'Native CAD Output',
    description: 'Generate AutoCAD, Plant 3D, and other industry-standard formats',
    icon: '📐'
  },
  {
    title: '3D Model Generation',
    description: 'Automatic creation of 3D models from 2D drawings',
    icon: '🎲'
  },
  {
    title: 'Enterprise Integration',
    description: 'APIs for SAP, Maximo, and other enterprise systems',
    icon: '🔗'
  },
  {
    title: 'Quality Assurance',
    description: 'Confidence scoring and engineering validation rules',
    icon: '✅'
  }
];