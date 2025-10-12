'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, BarChart3, CheckCircle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ResultsViewerProps {
  result: {
    conversionId: string;
    filename: string;
    equipmentCount: number;
    pipeCount?: number;
    instrumentCount?: number;
    confidence: number;
    processingTime: number;
    equipment?: any[];
    instrumentation?: any[];
  };
  onStartNew: () => void;
}

type TabType = 'overview' | 'equipment' | 'statistics' | 'download';

export default function ResultsViewer({ result, onStartNew }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const confidenceColor = result.confidence >= 0.9 ? 'bg-green-500' : result.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500';
  const confidenceLabel = result.confidence >= 0.9 ? 'High' : result.confidence >= 0.7 ? 'Medium' : 'Low';

  // Use real AI analysis data
  const equipmentData = result.equipment || [];
  const instrumentationData = result.instrumentation || [];
  
  const downloadOptions = [
    { format: 'DWG', description: 'AutoCAD Drawing', icon: FileText },
    { format: 'DXF', description: 'Drawing Exchange Format', icon: FileText },
    { format: 'PDF', description: 'Industrial Analysis Report', icon: FileText },
    { format: 'CSV', description: 'Equipment Database', icon: BarChart3 }
  ];

  // Navigation buttons configuration
  const tabButtons = [
    { id: 'overview', label: 'Overview' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'download', label: 'Download' }
  ];

  const handleTabChange = (tabId: TabType) => {
    console.log('🔵 Tab button clicked:', tabId);
    setActiveTab(tabId);
  };

  const handleDownload = async (format: string) => {
    console.log('🔴 DOWNLOAD BUTTON CLICKED!', format);
    
    if (!result.conversionId) {
      alert('Error: No conversion ID found. Please try converting the file again.');
      return;
    }
    
    setIsDownloading(format);
    
    try {
      const { downloadReport } = await import('@/lib/backend');
      const response = await downloadReport(result.conversionId, format);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty.');
      }
      
      const url = window.URL.createObjectURL(blob);
      
      // Generate filename
      let filename = `${result.filename.replace(/\.[^/.]+$/, '')}_analysis.${format.toLowerCase()}`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download completed:', filename);
      alert(`${format.toUpperCase()} file downloaded successfully!`);
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      const message = error instanceof Error ? error.message : 'Download failed';
      alert(`Download failed: ${message}`);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!result.conversionId) {
      toast({
        title: 'Download Failed',
        description: 'No conversion ID found. Please try converting the file again.',
      });
      return;
    }
    
    setIsDownloading('all');
    let successCount = 0;
    const failedFormats: string[] = [];
    
    try {
      console.log('Starting batch download of all formats...');
      
      for (const option of downloadOptions) {
        try {
          console.log(`Downloading ${option.format}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(`/api/download/${result.conversionId}?format=${option.format.toLowerCase()}`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/octet-stream, application/pdf, text/csv, */*'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Empty file received');
          }
          
          const url = window.URL.createObjectURL(blob);
          
          // Get filename from Content-Disposition header or generate one
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `${result.filename.replace(/\.[^/.]+$/, '')}_analysis.${option.format.toLowerCase()}`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          // Create and download file
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          successCount++;
          console.log(`✅ ${option.format} downloaded successfully`);
          
        } catch (error) {
          console.error(`❌ Failed to download ${option.format}:`, error);
          failedFormats.push(option.format);
        }
        
        // Brief delay between downloads
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Show appropriate success/warning message
      if (successCount === downloadOptions.length) {
        toast({
          title: 'All Files Downloaded!',
          description: `Successfully downloaded ${successCount} files (DWG, DXF, PDF, CSV).`,
        });
      } else if (successCount > 0) {
        toast({
          title: 'Partial Download Complete',
          description: `Downloaded ${successCount}/${downloadOptions.length} files. Failed: ${failedFormats.join(', ')}.`,
        });
      } else {
        throw new Error('All downloads failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Batch download failed:', error);
      if (successCount === 0) {
        toast({
          title: 'Batch Download Failed',
          description: error instanceof Error ? error.message : 'Failed to download any files. Please check your connection and try again.',
        });
      }
    } finally {
      setIsDownloading(null);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Equipment Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{result.equipmentCount}</div>
                  <p className="text-sm text-gray-500 mt-1">Items identified</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pipe Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{result.pipeCount || 0}</div>
                  <p className="text-sm text-gray-500 mt-1">Connections mapped</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Instruments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{result.instrumentCount || 0}</div>
                  <p className="text-sm text-gray-500 mt-1">Control devices</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Confidence Breakdown
                </CardTitle>
                <CardDescription>
                  Quality assessment of the conversion results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${confidenceColor} transition-all duration-500`}
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((equipmentData.filter(eq => eq.confidence >= 0.9).length / Math.max(equipmentData.length, 1)) * 100) || 0}%
                      </div>
                      <div className="text-xs text-gray-500">High Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {Math.round((equipmentData.filter(eq => eq.confidence >= 0.7 && eq.confidence < 0.9).length / Math.max(equipmentData.length, 1)) * 100) || 0}%
                      </div>
                      <div className="text-xs text-gray-500">Medium Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {Math.round((equipmentData.filter(eq => eq.confidence < 0.7).length / Math.max(equipmentData.length, 1)) * 100) || 0}%
                      </div>
                      <div className="text-xs text-gray-500">Needs Review</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'equipment':
        return (
          <motion.div
            key="equipment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Detected Equipment & Instrumentation</CardTitle>
                <CardDescription>
                  List of equipment items and instruments identified in your drawing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Equipment Section */}
                  {equipmentData.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Equipment ({equipmentData.length})
                      </h4>
                      <div className="space-y-2">
                        {equipmentData.map((item, index) => (
                          <div key={`eq-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">{item.id}</span>
                                <Badge variant="outline">{item.type}</Badge>
                                <div className={`w-3 h-3 rounded-full ${
                                  item.confidence >= 0.9 ? 'bg-green-500' : 
                                  item.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="text-sm font-medium">{(item.confidence * 100).toFixed(1)}%</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                              <div className="text-xs text-gray-500">
                                Position: ({item.position?.x}, {item.position?.y})
                                {item.specifications && Object.entries(item.specifications).length > 0 && (
                                  <span className="ml-3">Specs: {Object.entries(item.specifications).map(([key, value]) => `${key}: ${value}`).join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Instrumentation Section */}
                  {instrumentationData.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        Instrumentation ({instrumentationData.length})
                      </h4>
                      <div className="space-y-2">
                        {instrumentationData.map((item, index) => (
                          <div key={`inst-${index}`} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">{item.id}</span>
                                <Badge variant="outline">{item.type}</Badge>
                                {item.SIL_Rating && (
                                  <Badge variant="secondary">{item.SIL_Rating}</Badge>
                                )}
                                <div className={`w-3 h-3 rounded-full ${
                                  item.confidence >= 0.9 ? 'bg-green-500' : 
                                  item.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="text-sm font-medium">{(item.confidence * 100).toFixed(1)}%</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                              <div className="text-xs text-gray-500">
                                Position: ({item.position?.x}, {item.position?.y})
                                {item.range && (
                                  <span className="ml-3">Range: {item.range}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No Data Message */}
                  {equipmentData.length === 0 && instrumentationData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">No equipment or instrumentation identified</p>
                      <p className="text-sm mt-1">The AI analysis did not detect any equipment or instruments in this drawing.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'statistics':
        return (
          <motion.div
            key="statistics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Conversion Statistics</CardTitle>
                <CardDescription>Detailed metrics about the conversion process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Processing Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Processing Time</span>
                        <span className="font-medium">{Math.floor(result.processingTime / 60)}m {result.processingTime % 60}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Symbols Detected</span>
                        <span className="font-medium">{result.equipmentCount + (result.instrumentCount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equipment Items</span>
                        <span className="font-medium">{equipmentData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Instrumentation</span>
                        <span className="font-medium">{instrumentationData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connection Points</span>
                        <span className="font-medium">{result.pipeCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Accuracy</span>
                        <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">High Confidence Items</span>
                        <span className="font-medium">{equipmentData.filter(eq => eq.confidence >= 0.9).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Needing Review</span>
                        <span className="font-medium">{equipmentData.filter(eq => eq.confidence < 0.7).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'download':
        return (
          <motion.div
            key="download"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
                <CardDescription>
                  Choose the format that best fits your workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {downloadOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    const isCurrentlyDownloading = isDownloading === option.format;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-28 p-4 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        onClick={() => {
                          console.log('🟢 DOWNLOAD BUTTON CLICKED:', option.format);
                          handleDownload(option.format);
                        }}
                        disabled={isDownloading !== null}
                      >
                        {isCurrentlyDownloading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            <div className="text-center min-w-0 w-full">
                              <div className="font-semibold text-blue-600 text-sm truncate">Downloading...</div>
                              <div className="text-xs text-blue-500 truncate">Please wait</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <IconComponent className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0" />
                            <div className="text-center min-w-0 w-full">
                              <div className="font-semibold text-sm truncate">{option.format}</div>
                              <div className="text-xs text-gray-500 group-hover:text-gray-600 truncate leading-tight">{option.description}</div>
                            </div>
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onStartNew} 
                variant="outline" 
                className="flex-1 h-12 font-medium"
              >
                Convert Another Drawing
              </Button>
              <Button 
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                onClick={handleDownloadAll}
                disabled={isDownloading !== null}
              >
                {isDownloading === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Downloading All Files...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 w-4 h-4" />
                    Download All Files
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversion Complete!</h2>
            <p className="text-gray-600">Successfully processed: {result.filename}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Badge className={`${confidenceColor} text-white`}>
                {confidenceLabel} Confidence ({(result.confidence * 100).toFixed(1)}%)
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Processed in {Math.floor(result.processingTime / 60)}m {result.processingTime % 60}s
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons with Proper Grid */}
      <div className="p-6">
        <div className="w-full mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 bg-gray-100 rounded-lg">
            {tabButtons.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`
                  relative h-12 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
                onClick={() => handleTabChange(tab.id as TabType)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </motion.div>
  );
}