'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Upload, Brain, Search, GitBranch, ShieldCheck, AlertCircle } from 'lucide-react';
import { ProcessingStatus } from '@/types';

interface ProcessingViewProps {
  filename: string;
  conversionId: string | null;
  onComplete: (result: any) => void;
  onError?: (error: string) => void;
}

const processingStages = [
  { 
    stage: 'upload', 
    label: 'Uploading file...', 
    progress: 10, 
    icon: Upload,
    description: 'Securing your file on our servers'
  },
  { 
    stage: 'preprocessing', 
    label: 'Preprocessing image...', 
    progress: 25, 
    icon: Search,
    description: 'Enhancing image quality and preparing for analysis'
  },
  { 
    stage: 'symbol_detection', 
    label: 'Detecting symbols...', 
    progress: 50, 
    icon: Brain,
    description: 'AI analyzing drawing and identifying engineering symbols'
  },
  { 
    stage: 'text_extraction', 
    label: 'Extracting text...', 
    progress: 70, 
    icon: Search,
    description: 'OCR processing handwritten and printed text'
  },
  { 
    stage: 'connection_tracing', 
    label: 'Tracing connections...', 
    progress: 85, 
    icon: GitBranch,
    description: 'Mapping pipe and electrical connections'
  },
  { 
    stage: 'validation', 
    label: 'Validating results...', 
    progress: 95, 
    icon: ShieldCheck,
    description: 'Quality assurance and confidence scoring'
  },
  { 
    stage: 'complete', 
    label: 'Complete!', 
    progress: 100, 
    icon: CheckCircle,
    description: 'Your CAD files are ready for download'
  }
];

export default function ProcessingView({ filename, conversionId, onComplete, onError }: ProcessingViewProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentStageData, setCurrentStageData] = useState(processingStages[0]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  const pollConversionStatus = useCallback(async () => {
    if (!conversionId) return;

    try {
      const response = await fetch(`/api/status/${conversionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setProgress(data.progress || 0);
      setEstimatedTimeRemaining(data.estimatedTimeRemaining || 0);
      
      // Find the current stage based on the API response
      const stage = processingStages.find(s => s.stage === data.currentStage) || processingStages[0];
      setCurrentStageData(stage);
      setCurrentStage(processingStages.indexOf(stage));

      if (data.status === 'completed') {
        onComplete(data);
        return;
      } else if (data.status === 'failed') {
        onError?.(data.error || 'Processing failed');
        return;
      }

      // Continue polling if still processing
      setTimeout(pollConversionStatus, 2000);
    } catch (error) {
      console.error('Status polling error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to check conversion status');
    }
  }, [conversionId, onComplete, onError]);

  useEffect(() => {
    if (conversionId) {
      pollConversionStatus();
    }
  }, [conversionId, pollConversionStatus]);

  const IconComponent = currentStageData.icon;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <IconComponent className="w-10 h-10 text-blue-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Drawing</h2>
        <p className="text-gray-600">Converting: {filename}</p>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{currentStageData.label}</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Stage Description */}
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-4"
        >
          <p className="text-sm text-blue-800">{currentStageData.description}</p>
        </motion.div>

        {/* Stage List */}
        <div className="space-y-3">
          {processingStages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;

            return (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isCompleted 
                    ? 'bg-green-50 border border-green-200'
                    : isCurrent 
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <StageIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted
                      ? 'text-green-700'
                      : isCurrent
                      ? 'text-blue-700'
                      : 'text-gray-500'
                  }`}>
                    {stage.label}
                  </p>
                </div>
                {isCompleted && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Estimated Time */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            Estimated time remaining: {estimatedTimeRemaining > 0 ? `${Math.round(estimatedTimeRemaining)} seconds` : 'Calculating...'}
          </p>
        </div>
      </div>
    </div>
  );
}
