import { NextResponse } from 'next/server';
import { mongoJobStorage } from '@/lib/mongodb-job-storage';
import ProcessingJob from '@/lib/models/ProcessingJob';
import { connectToMongoDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectToMongoDB();

    // Totals by status
    const total = await ProcessingJob.countDocuments({});
    const completed = await ProcessingJob.countDocuments({ status: 'completed' });
    const processing = await ProcessingJob.countDocuments({ status: 'processing' });
    const failed = await ProcessingJob.countDocuments({ status: 'failed' });

    // Average confidence and equipment sum for completed jobs
    const completedAgg = await ProcessingJob.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: { $ifNull: ['$result.confidence', 0] } },
          totalEquipment: { $sum: { $ifNull: ['$result.statistics.equipmentCount', 0] } },
        },
      },
    ]);

    const avgConfidence = completedAgg?.[0]?.avgConfidence || 0;
    const totalEquipment = completedAgg?.[0]?.totalEquipment || 0;

    // Usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const thisMonth = await ProcessingJob.countDocuments({ createdAt: { $gte: startOfMonth } });
    const planLimit = 100; // TODO: pull from billing/plan
    const percentUsed = planLimit > 0 ? Math.min(100, Math.round((thisMonth / planLimit) * 100)) : 0;

    // Recent conversions (latest 10)
    const recentDocs = await ProcessingJob.find({}, {
      conversionId: 1,
      filename: 1,
      status: 1,
      'result.confidence': 1,
      'result.statistics.equipmentCount': 1,
      createdAt: 1,
    }).sort({ createdAt: -1 }).limit(10);

    const recentConversions = recentDocs.map((d) => ({
      id: d.conversionId,
      filename: d.filename,
      status: d.status,
      confidence: d.result?.confidence || 0,
      equipmentCount: d.result?.statistics?.equipmentCount || 0,
      createdAt: d.createdAt,
    }));

    const data = {
      stats: {
        totalConversions: total,
        completedConversions: completed,
        processingConversions: processing,
        reviewRequiredConversions: 0, // not tracked; keep 0
        totalProjects: 0, // no projects model yet
        activeProjects: 0,
        completedProjects: 0,
        avgConfidence,
        totalEquipment,
      },
      recentConversions,
      usage: {
        thisMonth,
        planLimit,
        percentUsed,
      },
    };

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
