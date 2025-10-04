import axios, { AxiosResponse } from 'axios';
import {
  ForgeAuthResponse,
  ForgeConfig,
  ForgeBucket,
  CreateBucketRequest,
  ForgeObject,
  UploadObjectRequest,
  TranslationRequest,
  TranslationStatus,
  ForgeApiResponse,
} from '@/types/forge';

/**
 * Forge API Client Class
 * Handles authentication and API calls to Autodesk Forge
 */
export class ForgeClient {
  private config: ForgeConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: process.env.FORGE_CLIENT_ID || '',
      clientSecret: process.env.FORGE_CLIENT_SECRET || '',
      scope: (process.env.FORGE_SCOPE || 'data:read data:write data:create bucket:create bucket:read viewables:read').split(' ') as any,
      baseUrl: process.env.FORGE_BASE_URL || 'https://developer.api.autodesk.com',
      authUrl: process.env.FORGE_AUTH_URL || 'https://developer.api.autodesk.com/authentication/v1/authenticate',
    };

    // Only check credentials at runtime, not during build
    if (typeof window !== 'undefined' && (!this.config.clientId || !this.config.clientSecret)) {
      console.warn('Forge API credentials not found. Please check your environment variables.');
    }
  }

  /**
   * Authenticate with Forge API and get access token
   */
  async authenticate(): Promise<string> {
    // Check credentials at runtime
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Forge API credentials not found. Please check your environment variables.');
    }

    // Return existing token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    try {
      const response: AxiosResponse<ForgeAuthResponse> = await axios.post(
        this.config.authUrl,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
          scope: this.config.scope.join(' '),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  /**
   * Get authenticated axios instance
   */
  private async getAuthenticatedAxios() {
    const token = await this.authenticate();
    return axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new bucket
   */
  async createBucket(request: CreateBucketRequest): Promise<ForgeApiResponse<ForgeBucket>> {
    try {
      const axiosInstance = await this.getAuthenticatedAxios();
      const response = await axiosInstance.post('/oss/v2/buckets', request);
      
      return {
        success: true,
        data: response.data,
        message: 'Bucket created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to create bucket',
      };
    }
  }

  /**
   * Get bucket details
   */
  async getBucket(bucketKey: string): Promise<ForgeApiResponse<ForgeBucket>> {
    try {
      const axiosInstance = await this.getAuthenticatedAxios();
      const response = await axiosInstance.get(`/oss/v2/buckets/${bucketKey}/details`);
      
      return {
        success: true,
        data: response.data,
        message: 'Bucket retrieved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to get bucket',
      };
    }
  }

  /**
   * Upload file to bucket
   */
  async uploadFile(request: UploadObjectRequest): Promise<ForgeApiResponse<ForgeObject>> {
    try {
      const axiosInstance = await this.getAuthenticatedAxios();
      
      // Convert File to Buffer if needed
      let fileBuffer: Buffer;
      if (request.file instanceof Buffer) {
        fileBuffer = request.file;
      } else {
        // For File objects (browser)
        const arrayBuffer = await (request.file as File).arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }

      const response = await axiosInstance.put(
        `/oss/v2/buckets/${request.bucketKey}/objects/${encodeURIComponent(request.objectName)}`,
        fileBuffer,
        {
          headers: {
            'Content-Type': request.contentType || 'application/octet-stream',
            'Content-Length': fileBuffer.length,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      
      return {
        success: true,
        data: response.data,
        message: 'File uploaded successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to upload file',
      };
    }
  }

  /**
   * Get objects in bucket
   */
  async getBucketObjects(bucketKey: string): Promise<ForgeApiResponse<{ items: ForgeObject[] }>> {
    try {
      const axiosInstance = await this.getAuthenticatedAxios();
      const response = await axiosInstance.get(`/oss/v2/buckets/${bucketKey}/objects`);
      
      return {
        success: true,
        data: response.data,
        message: 'Objects retrieved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to get objects',
      };
    }
  }

  /**
   * Start model translation
   */
  async translateModel(urn: string, outputFormats: Array<'svf' | 'svf2' | 'thumbnail'> = ['svf2']): Promise<ForgeApiResponse<any>> {
    try {
      const axiosInstance = await this.getAuthenticatedAxios();
      
      const translationRequest: TranslationRequest = {
        input: {
          urn: urn,
        },
        output: {
          formats: outputFormats.map(type => ({ type })),
        },
      };

      const response = await axiosInstance.post('/modelderivative/v2/designdata/job', translationRequest);
      
      return {
        success: true,
        data: response.data,
        message: 'Translation started successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to start translation',
      };
    }
  }

  /**
   * Get translation status
   */
  async getTranslationStatus(urn: string): Promise<ForgeApiResponse<TranslationStatus>> {
    try {
      const axiosInstance = await this.getAuthenticatedAxios();
      const response = await axiosInstance.get(`/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`);
      
      return {
        success: true,
        data: response.data,
        message: 'Translation status retrieved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to get translation status',
      };
    }
  }

  /**
   * Get viewer token (public token for frontend)
   */
  async getViewerToken(): Promise<ForgeApiResponse<{ access_token: string; expires_in: number }>> {
    try {
      const response: AxiosResponse<ForgeAuthResponse> = await axios.post(
        this.config.authUrl,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
          scope: 'viewables:read',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        data: {
          access_token: response.data.access_token,
          expires_in: response.data.expires_in,
        },
        message: 'Viewer token generated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to get viewer token',
      };
    }
  }

  /**
   * Generate safe URN (Base64 encoded)
   */
  static generateUrn(objectId: string): string {
    return Buffer.from(objectId).toString('base64').replace(/=/g, '');
  }

  /**
   * Generate unique bucket key
   */
  static generateBucketKey(prefix: string = 'cadly'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`.toLowerCase();
  }
}

// Export singleton instance
export const forgeClient = new ForgeClient();