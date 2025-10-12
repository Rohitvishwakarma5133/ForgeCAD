'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';

interface FileUploaderProps {
  onUpload: (uploadResult: File | { filename: string; conversionId: string }) => void;
  isUploading?: boolean;
}

export default function FileUploader({ onUpload, isUploading = false }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!file || isUploading) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', 'Demo Project');
      formData.append('drawingType', 'Demo');
      formData.append('priority', 'normal');

      const { uploadFileToBackend } = await import('@/lib/backend');
      const result = await uploadFileToBackend(file);
      onUpload({ filename: file.name, conversionId: result.id, ...result });
      return;
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw the error instead of using mock data
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200 min-h-[300px] flex flex-col items-center justify-center
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${file ? 'bg-gray-50' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        {!file ? (
          <>
            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              {isDragActive ? 'Drop your drawing here' : 'Upload Your Engineering Drawing'}
            </h3>
            <p className="text-lg text-gray-500 mb-6">
              Drag & drop your file here, or click to browse
            </p>
            <div className="bg-white rounded-lg p-4 max-w-md">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Supported formats:</strong>
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• PDF, PNG, JPEG, TIFF, BMP</div>
                <div>• DWG, DXF (AutoCAD files)</div>
                <div>• Maximum file size: 50MB</div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-6 w-full max-w-md">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{file.name}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {formatFileSize(file.size)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-2 bg-gray-200 rounded-full flex-1">
                  <div className="h-2 bg-green-500 rounded-full w-full"></div>
                </div>
                <span className="text-xs text-green-600 font-medium">Ready</span>
              </div>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {file && (
        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 h-12 text-lg font-semibold"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Start Conversion
              </>
            )}
          </Button>
        </div>
      )}

    </div>
  );
}
