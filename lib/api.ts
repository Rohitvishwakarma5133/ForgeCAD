import { UploadResponse, ApiResponse, ProcessingStatus, ConversionResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async startConversion(
    conversionId: string,
    options: { priority?: 'normal' | 'high' } = {}
  ): Promise<ApiResponse<{ conversionId: string }>> {
    return this.request(`/api/convert`, {
      method: 'POST',
      body: JSON.stringify({ conversionId, ...options }),
    });
  }

  static async getConversionStatus(
    conversionId: string
  ): Promise<ApiResponse<ProcessingStatus>> {
    return this.request(`/api/status/${conversionId}`);
  }

  static async getConversionResult(
    conversionId: string
  ): Promise<ApiResponse<ConversionResult>> {
    return this.request(`/api/results/${conversionId}`);
  }

  static async getConversionHistory(): Promise<ApiResponse<ConversionResult[]>> {
    return this.request('/api/conversions');
  }

  static async deleteConversion(
    conversionId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/conversions/${conversionId}`, {
      method: 'DELETE',
    });
  }

  static async downloadResult(
    conversionId: string,
    format: 'dwg' | 'dxf' | 'pdf' | 'csv'
  ): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/api/download/${conversionId}?format=${format}`
    );
    
    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }
}

export const api = ApiClient;