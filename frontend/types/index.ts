export interface ConversionResult {
  id: string;
  filename: string;
  type: 'P&ID' | 'Electrical' | 'Mechanical' | 'Structural' | 'Other';
  status: 'processing' | 'completed' | 'failed' | 'review_required';
  confidence: number;
  processingTime: number; // seconds
  equipmentCount: number;
  pipeCount?: number;
  instrumentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  tag: string;
  type: string;
  service?: string;
  size?: string;
  material?: string;
  rating?: string;
  confidence: number;
  position: {
    x: number;
    y: number;
  };
}

export interface ProcessingStatus {
  stage: 'upload' | 'preprocessing' | 'symbol_detection' | 'text_extraction' | 'connection_tracing' | 'validation' | 'complete';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: 'per-drawing' | 'monthly' | 'yearly';
  features: string[];
  limits: {
    drawingsPerMonth?: number;
    processingTime?: string;
    apiAccess?: boolean;
    support?: string;
  };
  popular?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  drawingCount: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  conversions: ConversionResult[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  plan: 'free' | 'professional' | 'enterprise';
  creditsRemaining: number;
  createdAt: Date;
}

export interface UploadResponse {
  success: boolean;
  conversionId?: string;
  filename?: string;
  size?: number;
  message: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}