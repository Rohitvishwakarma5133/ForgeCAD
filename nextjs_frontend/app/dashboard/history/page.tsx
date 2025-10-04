'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Download, Eye, Calendar, 
  CheckCircle, Clock, AlertTriangle, X, FileText,
  MoreVertical, ArrowUpDown, RefreshCw
} from 'lucide-react';
import { ConversionResult } from '@/types';

type SortField = 'date' | 'filename' | 'status' | 'confidence';
type SortOrder = 'asc' | 'desc';

interface HistoryData {
  conversions: ConversionResult[];
  summary: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    reviewRequired: number;
  };
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Clock;
      case 'review_required': return AlertTriangle;
      case 'failed': return X;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'review_required': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter === 'all' ? '' : statusFilter,
        search: searchQuery,
        sortBy: sortField,
        sortOrder: sortOrder,
        limit: '50'
      });

      const response = await fetch(`/api/history?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load history');
      }
      
      setHistoryData({
        conversions: data.conversions,
        summary: data.summary
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, searchQuery, sortField, sortOrder]);

  const filteredAndSortedHistory = historyData?.conversions || [];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const statusCounts = historyData ? {
    all: historyData.summary.total,
    completed: historyData.summary.completed,
    processing: historyData.summary.processing,
    review_required: historyData.summary.reviewRequired,
    failed: historyData.summary.failed,
  } : {
    all: 0,
    completed: 0,
    processing: 0,
    review_required: 0,
    failed: 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversion history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading History</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchHistory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conversion History</h1>
          <p className="text-gray-600 mt-1">
            View and manage all your drawing conversions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: statusCounts.all, key: 'all', color: 'blue' },
          { label: 'Completed', value: statusCounts.completed, key: 'completed', color: 'green' },
          { label: 'Processing', value: statusCounts.processing, key: 'processing', color: 'blue' },
          { label: 'Review Required', value: statusCounts.review_required, key: 'review_required', color: 'yellow' },
          { label: 'Failed', value: statusCounts.failed, key: 'failed', color: 'red' },
        ].map((stat) => (
          <Card 
            key={stat.key}
            className={`cursor-pointer transition-all ${
              statusFilter === stat.key ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setStatusFilter(stat.key)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {filteredAndSortedHistory.length} of {statusCounts.all} conversions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('filename')}
                      className="font-semibold"
                    >
                      Filename
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="font-semibold"
                    >
                      Status
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('confidence')}
                      className="font-semibold"
                    >
                      Confidence
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4">Equipment</th>
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('date')}
                      className="font-semibold"
                    >
                      Date
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedHistory.map((conversion, index) => {
                  const StatusIcon = getStatusIcon(conversion.status);
                  
                  return (
                    <motion.tr
                      key={conversion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-xs">
                              {conversion.filename}
                            </div>
                            {conversion.status === 'completed' && (
                              <div className="text-xs text-gray-500">
                                {Math.floor(conversion.processingTime / 60)}m {conversion.processingTime % 60}s
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {conversion.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(conversion.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {conversion.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="p-4">
                        {conversion.confidence > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {Math.round(conversion.confidence * 100)}%
                            </div>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  conversion.confidence >= 0.9 ? 'bg-green-500' :
                                  conversion.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${conversion.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {conversion.equipmentCount > 0 ? (
                          <span className="text-sm text-gray-900">
                            {conversion.equipmentCount} items
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900">
                          {new Date(conversion.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(conversion.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {conversion.status === 'completed' && (
                            <>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </>
                          )}
                          {conversion.status === 'review_required' && (
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          )}
                          {conversion.status === 'failed' && (
                            <Button size="sm" variant="outline">
                              Retry
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedHistory.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No conversions found
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Start converting drawings to see your history here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}