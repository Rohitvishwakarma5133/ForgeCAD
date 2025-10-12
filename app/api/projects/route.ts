import { NextRequest, NextResponse } from 'next/server';

// Very simple in-memory mock for projects (ephemeral in serverless; for UI only)
const MOCK_PROJECTS: Array<{
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  drawingCount: number;
  createdAt: string;
  updatedAt: string;
}> = [];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || '').trim();
  const search = (url.searchParams.get('search') || '').toLowerCase().trim();

  let projects = [...MOCK_PROJECTS];

  if (status) {
    projects = projects.filter((p) => p.status === status);
  }
  if (search) {
    projects = projects.filter(
      (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(
    {
      projects,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
