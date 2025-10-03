import { NextRequest, NextResponse } from 'next/server';
import { sampleProjects } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredProjects = [...sampleProjects];

    // Filter by status
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.status === status);
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    return NextResponse.json({
      projects: paginatedProjects,
      pagination: {
        page,
        limit,
        total: filteredProjects.length,
        totalPages: Math.ceil(filteredProjects.length / limit),
        hasNext: endIndex < filteredProjects.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Failed to load projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, drawingType } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const newProject = {
      id: `proj_${Date.now()}`,
      name,
      description,
      drawingCount: 0,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      conversions: []
    };

    return NextResponse.json({
      project: newProject,
      message: 'Project created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}