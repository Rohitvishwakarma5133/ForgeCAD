'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileUploader from '@/components/demo/FileUploader';
import ProcessingView from '@/components/demo/ProcessingView';
import ResultsViewer from '@/components/demo/ResultsViewer';
import { Upload, FolderPlus, Settings, Info, AlertCircle } from 'lucide-react';

type UploadState = 'setup' | 'upload' | 'processing' | 'results' | 'error';

export default function DashboardUploadPage() {
  const [state, setState] = useState<UploadState>('setup');
  const [projectName, setProjectName] = useState('');
  const [drawingType, setDrawingType] = useState('');
  const [priority, setPriority] = useState('normal');
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSetupComplete = () => {
    setState('upload');
  };

  const handleFileUpload = async (uploadResult: File | { filename: string; conversionId: string }) => {
    if (!drawingType) {
      setError('Please select a drawing type first');
      return;
    }

    // Handle both File objects and upload results
    if (uploadResult instanceof File) {
      const file = uploadResult;
      setUploadedFile(file.name);
      setError(null);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectName', projectName || 'Untitled Project');
        formData.append('drawingType', drawingType);
        formData.append('priority', priority);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        setConversionId(data.conversionId);
        setState('processing');
        
      } catch (error) {
        console.error('Upload error:', error);
        setError(error instanceof Error ? error.message : 'Upload failed');
        setState('error');
      }
    } else {
      // Handle upload result object (from FileUploader component)
      setUploadedFile(uploadResult.filename);
      setConversionId(uploadResult.conversionId);
      setState('processing');
    }
  };


  const handleProcessingComplete = (conversionResult: any) => {
    setResult(conversionResult);
    setState('results');
  };

  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setState('error');
  };

  const handleStartNew = () => {
    setState('setup');
    setProjectName('');
    setDrawingType('');
    setPriority('normal');
    setUploadedFile('');
    setResult(null);
    setConversionId(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Drawing</h1>
          <p className="text-gray-600 mt-1">
            Convert your engineering drawings with advanced AI processing
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          47 credits remaining
        </Badge>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
            state === 'setup' 
              ? 'bg-blue-600 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            1
          </div>
          <span className={`text-sm font-medium ${
            state === 'setup' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Setup
          </span>
        </div>
        
        <div className={`w-8 h-0.5 ${
          state === 'upload' || state === 'processing' || state === 'results' ? 'bg-green-500' : 'bg-gray-300'
        }`} />
        
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
            state === 'upload' 
              ? 'bg-blue-600 text-white' 
              : state === 'processing' || state === 'results'
              ? 'bg-green-500 text-white'
              : 'bg-gray-300 text-gray-600'
          }`}>
            2
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
            3
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
            4
          </div>
          <span className={`text-sm font-medium ${
            state === 'results' ? 'text-green-600' : 'text-gray-500'
          }`}>
            Complete
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {state === 'setup' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Conversion Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your drawing conversion preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name (Optional)</Label>
                      <Input
                        id="project-name"
                        placeholder="e.g., Refinery Unit A"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="drawing-type">Drawing Type</Label>
                      <Select value={drawingType} onValueChange={setDrawingType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select drawing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pid">P&ID (Process & Instrumentation)</SelectItem>
                          <SelectItem value="electrical">Electrical Schematic</SelectItem>
                          <SelectItem value="mechanical">Mechanical Drawing</SelectItem>
                          <SelectItem value="structural">Structural Drawing</SelectItem>
                          <SelectItem value="piping">Piping Isometric</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Processing Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="md:w-1/2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (4 hours SLA)</SelectItem>
                        <SelectItem value="high">High Priority (1 hour SLA) - +$5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-6">
                    <Button 
                      onClick={handleSetupComplete}
                      disabled={!drawingType}
                      size="lg"
                    >
                      Continue to Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {state === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FileUploader 
                onUpload={handleFileUpload}
                isUploading={false}
              />
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProcessingView 
                filename={uploadedFile}
                conversionId={conversionId}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-200 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">Processing Failed</h3>
                  <p className="text-gray-600 mb-6">{error || 'An error occurred during processing.'}</p>
                  
                  <div className="space-y-3">
                    <Button onClick={() => setState('upload')} className="w-full">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={handleStartNew} className="w-full">
                      Start Over
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'results' && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ResultsViewer 
                result={result}
                onStartNew={handleStartNew}
              />
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Settings */}
          {(state === 'upload' || state === 'processing' || state === 'results') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectName && (
                    <div>
                      <Label className="text-xs text-gray-500">Project</Label>
                      <p className="text-sm font-medium">{projectName}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <p className="text-sm font-medium capitalize">
                      {drawingType === 'pid' ? 'P&ID' : drawingType}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Priority</Label>
                    <p className="text-sm font-medium capitalize">{priority}</p>
                  </div>
                  {state !== 'results' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setState('setup')}
                    >
                      Change Settings
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4" />
                Tips for Best Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><strong>File Quality:</strong> Use high-resolution scans (300+ DPI)</p>
                <p><strong>Format:</strong> PDF or PNG files work best</p>
                <p><strong>Size:</strong> Keep files under 50MB</p>
                <p><strong>Clarity:</strong> Ensure text and symbols are clearly visible</p>
              </div>
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Drawings</span>
                    <span>34/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-[34%]" />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Resets April 1st
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Our support team is here to help you get the best results.
              </p>
              <Button size="sm" variant="outline">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}