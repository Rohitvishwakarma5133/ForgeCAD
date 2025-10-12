import { NextRequest, NextResponse } from 'next/server';
import ProcessingJob from '@/lib/models/ProcessingJob';
import { connectToMongoDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    await connectToMongoDB();

    const url = new URL(req.url);
    const status = (url.searchParams.get('status') || '').trim();
    const search = (url.searchParams.get('search') || '').toLowerCase().trim();
    const sortBy = (url.searchParams.get('sortBy') || 'date').trim();
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc').trim();
    const limit = Math.min(200, Number(url.searchParams.get('limit') || 50));

    const filter: any = {};
    if (status && ['completed', 'processing', 'failed'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.filename = { $regex: new RegExp(search, 'i') };
    }

    const sort: any = {};
    if (sortBy === 'filename') sort.filename = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'status') sort.status = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'confidence') sort['result.confidence'] = sortOrder === 'asc' ? 1 : -1;
    else sort.createdAt = sortOrder === 'asc' ? 1 : -1;

    const docs = await ProcessingJob.find(filter, {
      conversionId: 1,
      filename: 1,
      status: 1,
      'result.confidence': 1,
      'result.statistics.equipmentCount': 1,
      createdAt: 1,
      startTime: 1,
      result: 1,
    }).sort(sort).limit(limit);

    const conversions = docs.map((d) => ({
      id: d.conversionId,
      filename: d.filename,
      type: d.result?.documentType || 'Engineering Drawing',
      status: d.status as 'completed' | 'processing' | 'failed',
      confidence: d.result?.confidence || 0,
      equipmentCount: d.result?.statistics?.equipmentCount || 0,
      processingTime: d.result?.processingTime || (d.createdAt ? Math.max(0, Math.round(((d as any).updatedAt?.getTime?.() || Date.now()) - d.createdAt.getTime()) / 1000) : 0),
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
    }));

    // Summary
    const total = await ProcessingJob.countDocuments(filter);
    const completed = await ProcessingJob.countDocuments({ ...filter, status: 'completed' });
    const processing = await ProcessingJob.countDocuments({ ...filter, status: 'processing' });
    const failed = await ProcessingJob.countDocuments({ ...filter, status: 'failed' });

    const summary = {
      total,
      completed,
      processing,
      failed,
      reviewRequired: 0,
    };

    return NextResponse.json({ conversions, summary }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
