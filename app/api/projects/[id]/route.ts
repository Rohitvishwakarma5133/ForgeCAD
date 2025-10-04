import { NextRequest, NextResponse } from 'next/server';
import { sampleProjects } from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const projectId = id;
    const project = sampleProjects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to load project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const projectId = id;
    const body = await request.json();
    const { name, description, status } = body;

    const project = sampleProjects.find(p => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project (in a real app, this would update the database)
    const updatedProject = {
      ...project,
      name: name || project.name,
      description: description || project.description,
      status: status || project.status,
      updatedAt: new Date()
    };

    return NextResponse.json({
      project: updatedProject,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const projectId = id;
    const project = sampleProjects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // In a real app, this would delete from the database
    return NextResponse.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}