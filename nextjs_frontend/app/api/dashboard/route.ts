import { NextRequest, NextResponse } from 'next/server';
import { sampleConversions, sampleProjects } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    // Calculate dashboard statistics
    const totalConversions = sampleConversions.length;
    const completedConversions = sampleConversions.filter(c => c.status === 'completed').length;
    const processingConversions = sampleConversions.filter(c => c.status === 'processing').length;
    const reviewRequiredConversions = sampleConversions.filter(c => c.status === 'review_required').length;
    
    const totalProjects = sampleProjects.length;
    const activeProjects = sampleProjects.filter(p => p.status === 'active').length;
    const completedProjects = sampleProjects.filter(p => p.status === 'completed').length;
    
    // Calculate average confidence
    const avgConfidence = sampleConversions.reduce((sum, c) => sum + c.confidence, 0) / sampleConversions.length;
    
    // Calculate total equipment detected
    const totalEquipment = sampleConversions.reduce((sum, c) => sum + c.equipmentCount, 0);
    
    // Get recent conversions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentConversions = sampleConversions.filter(c => c.createdAt >= sevenDaysAgo);
    
    // Calculate usage statistics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthConversions = sampleConversions.filter(c => c.createdAt >= thisMonth).length;
    
    const dashboardData = {
      stats: {
        totalConversions,
        completedConversions,
        processingConversions,
        reviewRequiredConversions,
        totalProjects,
        activeProjects,
        completedProjects,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        totalEquipment
      },
      recentConversions: recentConversions.slice(0, 5), // Show only 5 most recent
      projects: sampleProjects.slice(0, 3), // Show only 3 most recent projects
      usage: {
        thisMonth: thisMonthConversions,
        planLimit: 100, // Mock plan limit
        percentUsed: Math.round((thisMonthConversions / 100) * 100)
      },
      activity: [
        { date: '2024-03-15', conversions: 3 },
        { date: '2024-03-14', conversions: 5 },
        { date: '2024-03-13', conversions: 2 },
        { date: '2024-03-12', conversions: 1 },
        { date: '2024-03-11', conversions: 4 },
        { date: '2024-03-10', conversions: 3 },
        { date: '2024-03-09', conversions: 6 }
      ]
    };
    
    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}