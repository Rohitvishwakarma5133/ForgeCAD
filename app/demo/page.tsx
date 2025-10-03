'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import FileUploader from '@/components/demo/FileUploader';
import ProcessingView from '@/components/demo/ProcessingView';
import ResultsViewer from '@/components/demo/ResultsViewer';

type DemoState = 'upload' | 'processing' | 'results';

export default function DemoPage() {
  const [state, setState] = useState<DemoState>('upload');
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file.name);
    setState('processing');
  };

  const handleSampleLoad = (sampleName: string) => {
    setUploadedFile(sampleName);
    setState('processing');
  };

  const handleProcessingComplete = (conversionResult: any) => {
    setResult(conversionResult);
    setState('results');
  };

  const handleStartNew = () => {
    setState('upload');
    setUploadedFile('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Try CADly Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience our AI-powered conversion technology. Upload your engineering drawing 
            and see it transformed into structured CAD files in minutes.
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                state === 'upload' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-500 text-white'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                state === 'upload' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Upload
              </span>
            </div>
            
            <div className={`w-8 h-0.5 ${
              state === 'processing' || state === 'results' ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                state === 'processing' 
                  ? 'bg-blue-600 text-white' 
                  : state === 'results'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                state === 'processing' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Process
              </span>
            </div>
            
            <div className={`w-8 h-0.5 ${
              state === 'results' ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                state === 'results' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className={`text-sm font-medium ${
                state === 'results' ? 'text-green-600' : 'text-gray-500'
              }`}>
                Download
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {state === 'upload' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <FileUploader 
                onUpload={handleFileUpload}
                onSampleLoad={handleSampleLoad}
                isUploading={false}
              />
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ProcessingView 
                filename={uploadedFile}
                conversionId={`demo_${Date.now()}`}
                onComplete={handleProcessingComplete}
              />
            </motion.div>
          )}

          {state === 'results' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ResultsViewer 
                result={result}
                onStartNew={handleStartNew}
              />
            </motion.div>
          )}
        </div>

        {/* Info Section */}
        {state === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16 max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Processing</h3>
                <p className="text-gray-600 text-sm">
                  Most drawings are processed in under 5 minutes, compared to hours of manual work.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">High Accuracy</h3>
                <p className="text-gray-600 text-sm">
                  Our AI achieves 91.5% accuracy with confidence scoring for quality assurance.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📁</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Formats</h3>
                <p className="text-gray-600 text-sm">
                  Export to DWG, DXF, PDF, CSV, and integrate with your existing tools.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}