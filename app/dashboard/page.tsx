'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, FolderOpen, Clock, TrendingUp, 
  ArrowUp, ArrowDown, Plus, BarChart3,
  CheckCircle, AlertTriangle, Zap, Users, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import CreditMeter from '@/components/CreditMeter';

interface DashboardData {
  stats: {
    totalConversions: number;
    completedConversions: number;
    processingConversions: number;
    reviewRequiredConversions: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    avgConfidence: number;
    totalEquipment: number;
  };
  recentConversions: Array<{
    id: string;
    filename: string;
    status: string;
    confidence: number;
    equipmentCount: number;
    createdAt: Date;
  }>;
  usage: {
    thisMonth: number;
    planLimit: number;
    percentUsed: number;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard data');
      }
      
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { stats, recentConversions, usage } = dashboardData!;

  // Calculate derived stats for display
  const statsDisplay = [
    {
      title: 'Total Conversions',
      value: stats.totalConversions.toString(),
      change: '+12%',
      trend: 'up' as const,
      icon: BarChart3,
      color: 'blue'
    },
    {
      title: 'This Month',
      value: usage.thisMonth.toString(),
      change: `${usage.percentUsed}%`,
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Success Rate',
      value: `${Math.round(stats.avgConfidence * 100)}%`,
      change: '+2.1%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'purple'
    },
    {
      title: 'Credits Remaining',
      value: (usage.planLimit - usage.thisMonth).toString(),
      change: `-${usage.thisMonth}`,
      trend: 'down' as const,
      icon: Zap,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Credit meter at top-center */}
      <section className="mt-2 flex justify-center">
        <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-gray-200 dark:border-gray-800 p-4 w-full max-w-2xl mx-auto">
          <CreditMeter totalCredits={usage.planLimit} usedCredits={usage.thisMonth} />
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat, index) => {
          const IconComponent = stat.icon;
          const isPositive = stat.trend === 'up';
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    {isPositive ? (
                      <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity & History Overview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Conversion Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Conversion Timeline
                    </CardTitle>
                    <CardDescription>Track your conversion activity over time</CardDescription>
                  </div>
                  <Link href="/dashboard/history">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Full History
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentConversions.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversions yet</h3>
                      <p className="text-gray-600 mb-4">Upload your first drawing to get started!</p>
                      <Link href="/dashboard/upload">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Drawing
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    recentConversions.map((conversion, index) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'completed': return 'bg-green-100 text-green-700';
                        case 'processing': return 'bg-blue-100 text-blue-700';
                        case 'review_required': return 'bg-yellow-100 text-yellow-700';
                        case 'failed': return 'bg-red-100 text-red-700';
                        default: return 'bg-gray-100 text-gray-700';
                      }
                    };

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'completed': return CheckCircle;
                        case 'processing': return Clock;
                        case 'review_required': return AlertTriangle;
                        default: return Clock;
                      }
                    };

                    const StatusIcon = getStatusIcon(conversion.status);

                    return (
                      <motion.div
                        key={conversion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg ${getStatusColor(conversion.status).split(' ')[0]} flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${getStatusColor(conversion.status).split(' ')[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversion.filename}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {conversion.status.replace('_', ' ')}
                              </Badge>
                              {conversion.equipmentCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {conversion.equipmentCount} items
                                </span>
                              )}
                              {conversion.confidence > 0 && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(conversion.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {new Date(conversion.createdAt).toLocaleDateString()}
                          <br />
                          {new Date(conversion.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions & Usage */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/upload">
                  <Button className="w-full justify-start" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Drawing
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button className="w-full justify-start" variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Try Live Demo
                  </Button>
                </Link>
                <Link href="/dashboard/projects">
                  <Button className="w-full justify-start" variant="outline">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Usage Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage This Month</CardTitle>
                <CardDescription>Professional Plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Drawings Converted</span>
                      <span className="font-medium">{usage.thisMonth} / {usage.planLimit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Credits Remaining</span>
                      <Badge variant="outline">{usage.planLimit - usage.thisMonth} left</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Resets on April 1st
                    </p>
                  </div>

                  <Link href="/pricing">
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Help Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Our team is here to help you get the most out of CADly.
                  </p>
                  <Link href="/contact">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
