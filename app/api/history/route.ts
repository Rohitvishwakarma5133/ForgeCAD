import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || '').trim();
  const search = (url.searchParams.get('search') || '').toLowerCase().trim();
  const sortBy = (url.searchParams.get('sortBy') || 'date').trim();
  const sortOrder = (url.searchParams.get('sortOrder') || 'desc').trim();
  const limit = Number(url.searchParams.get('limit') || 50);

  // Mock conversion history list
  let conversions: Array<{
    id: string;
    filename: string;
    type: string;
    status: 'completed' | 'processing' | 'review_required' | 'failed';
    confidence: number;
    equipmentCount: number;
    processingTime: number;
    createdAt: string;
  }> = [];

  // Optionally filter/search - with empty data, these are no-ops
  if (status) {
    conversions = conversions.filter((c) => c.status === status);
  }
  if (search) {
    conversions = conversions.filter((c) => c.filename.toLowerCase().includes(search));
  }

  // Optionally sort
  conversions = conversions.slice(0, limit);

  const summary = {
    total: conversions.length,
    completed: conversions.filter((c) => c.status === 'completed').length,
    processing: conversions.filter((c) => c.status === 'processing').length,
    failed: conversions.filter((c) => c.status === 'failed').length,
    reviewRequired: conversions.filter((c) => c.status === 'review_required').length,
  };

  return NextResponse.json(
    {
      conversions,
      summary,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
