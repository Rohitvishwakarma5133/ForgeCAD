import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock dashboard data so the UI renders even without a DB
  const now = new Date();

  const data = {
    stats: {
      totalConversions: 0,
      completedConversions: 0,
      processingConversions: 0,
      reviewRequiredConversions: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      avgConfidence: 0.0,
      totalEquipment: 0,
    },
    recentConversions: [],
    usage: {
      thisMonth: 0,
      planLimit: 100,
      percentUsed: 0,
    },
  } as const;

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
