// Autodesk Forge API TypeScript Types and Interfaces

// Authentication Types
export interface ForgeAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface ForgeAuthConfig {
  clientId: string;
  clientSecret: string;
  scope: string;
  baseUrl?: string;
}

// Bucket Types
export interface ForgeBucket {
  bucketKey: string;
  bucketOwner: string;
  createdDate: number;
  permissions: Array<{
    authId: string;
    access: string;
  }>;
  policyKey: string;
}

export interface CreateBucketRequest {
  bucketKey: string;
  policyKey: 'transient' | 'temporary' | 'persistent';
}

// Object/File Types
export interface ForgeObject {
  bucketKey: string;
  objectId: string;
  objectKey: string;
  sha1: string;
  size: number;
  contentType: string;
  location: string;
}

export interface UploadObjectRequest {
  bucketKey: string;
  objectName: string;
  file: Buffer | File;
  contentType?: string;
}

// Translation/Model Derivative Types
export interface TranslationJob {
  type: 'svf' | 'svf2' | 'thumbnail';
  views?: string[];
}

export interface TranslationRequest {
  input: {
    urn: string;
  };
  output: {
    formats: TranslationJob[];
  };
}

export interface TranslationStatus {
  type: string;
  hasThumbnail: string;
  status: 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout';
  progress: string;
  region: string;
  urn: string;
  version: string;
  derivatives?: Array<{
    name: string;
    hasThumbnail: string;
    status: string;
    progress: string;
    messages?: Array<{
      type: string;
      message: string;
      code: string;
    }>;
    outputType: string;
  }>;
}

// Viewer Types
export interface ForgeViewerOptions {
  env: 'AutodeskProduction' | 'AutodeskStaging';
  api: 'derivativeV2' | 'derivativeV2_EU' | 'modelDerivativeV2' | 'fluent' | 'D3S' | 'D3S_EU';
  getAccessToken: (onTokenReady: (token: string, expire: number) => void) => void;
}

export interface ViewerDocument {
  myPath: string;
  myPropertyDbPath: string;
  acmSessionId: string;
  viewableType: string;
  name: string;
  progress: string;
  role: string;
  success: string;
  type: string;
  urn: string;
  viewableID: string;
  children?: ViewerDocument[];
}

// Error Types
export interface ForgeError {
  developerMessage: string;
  userMessage: string;
  errorCode: string;
  moreInfo: string;
}

// API Response Types
export interface ForgeApiResponse<T = any> {
  data?: T;
  error?: ForgeError;
  success: boolean;
  message?: string;
}

// Common Types
export type ForgeScope = 
  | 'data:read' 
  | 'data:write' 
  | 'data:create' 
  | 'data:search'
  | 'bucket:create' 
  | 'bucket:read' 
  | 'bucket:update' 
  | 'bucket:delete'
  | 'viewables:read';

export interface ForgeConfig {
  clientId: string;
  clientSecret: string;
  scope: ForgeScope[];
  baseUrl: string;
  authUrl: string;
}