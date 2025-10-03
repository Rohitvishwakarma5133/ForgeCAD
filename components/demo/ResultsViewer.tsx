'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, FileText, BarChart3, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ResultsViewerProps {
  result: {
    conversionId: string;
    filename: string;
    equipmentCount: number;
    pipeCount?: number;
    instrumentCount?: number;
    confidence: number;
    processingTime: number;
  };
  onStartNew: () => void;
}

export default function ResultsViewer({ result, onStartNew }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const confidenceColor = result.confidence >= 0.9 ? 'bg-green-500' : result.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500';
  const confidenceLabel = result.confidence >= 0.9 ? 'High' : result.confidence >= 0.7 ? 'Medium' : 'Low';

  // Mock equipment data
  const equipmentData = [
    { tag: 'P-101A', type: 'Centrifugal Pump', service: 'Crude Feed Pump', confidence: 0.96 },
    { tag: 'V-201', type: 'Separator Vessel', service: 'Gas-Liquid Separator', confidence: 0.94 },
    { tag: 'E-301', type: 'Heat Exchanger', service: 'Crude Heater', confidence: 0.92 },
    { tag: 'T-401', type: 'Storage Tank', service: 'Crude Storage', confidence: 0.89 },
    { tag: 'C-501', type: 'Compressor', service: 'Gas Compressor', confidence: 0.87 }
  ];

  const downloadOptions = [
    { format: 'DWG', description: 'AutoCAD Drawing', icon: FileText },
    { format: 'DXF', description: 'Drawing Exchange Format', icon: FileText },
    { format: 'PDF', description: 'Portable Document Format', icon: FileText },
    { format: 'CSV', description: 'Equipment Database', icon: BarChart3 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200"
    >
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mx-6 mt-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

        <div className="p-6">
          <TabsContent value="overview" className="space-y-6">
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
              
              {result.pipeCount && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pipe Segments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{result.pipeCount}</div>
                    <p className="text-sm text-gray-500 mt-1">Connections mapped</p>
                  </CardContent>
                </Card>
              )}
              
              {result.instrumentCount && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Instruments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{result.instrumentCount}</div>
                    <p className="text-sm text-gray-500 mt-1">Control devices</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Confidence Breakdown */}
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
                      <div className="text-2xl font-bold text-green-600">78%</div>
                      <div className="text-xs text-gray-500">High Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">18%</div>
                      <div className="text-xs text-gray-500">Medium Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">4%</div>
                      <div className="text-xs text-gray-500">Needs Review</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Equipment</CardTitle>
                <CardDescription>
                  List of equipment items identified in your drawing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {equipmentData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{item.tag}</span>
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.service}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.confidence >= 0.9 ? 'bg-green-500' : 
                          item.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium">{(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
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
                        <span className="text-gray-600">Text Elements</span>
                        <span className="font-medium">142</span>
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
                        <span className="text-gray-600">Items Requiring Review</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auto-validated Items</span>
                        <span className="font-medium">{result.equipmentCount - 3}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
                <CardDescription>
                  Choose the format that best fits your workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {downloadOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-20 p-4 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <IconComponent className="w-6 h-6 text-blue-600" />
                        <div className="text-center">
                          <div className="font-semibold">{option.format}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-4">
              <Button onClick={onStartNew} variant="outline" className="flex-1">
                Convert Another Drawing
              </Button>
              <Button className="flex-1">
                <Download className="mr-2 w-4 h-4" />
                Download All Files
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
