import { NextRequest, NextResponse } from 'next/server';
import { sampleConversions } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let filteredConversions = [...sampleConversions];

    // Filter by status
    if (status && status !== 'all') {
      filteredConversions = filteredConversions.filter(conversion => 
        conversion.status === status
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversions = filteredConversions.filter(conversion =>
        conversion.filename.toLowerCase().includes(searchLower) ||
        conversion.type.toLowerCase().includes(searchLower)
      );
    }

    // Sort conversions
    filteredConversions.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'date':
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversions = filteredConversions.slice(startIndex, endIndex);

    // Add additional metadata for each conversion
    const conversionsWithMetadata = paginatedConversions.map(conversion => ({
      ...conversion,
      downloadUrl: `/api/download/${conversion.id}`,
      previewUrl: `/api/preview/${conversion.id}`,
      canRetry: conversion.status === 'failed',
      canReview: conversion.status === 'review_required'
    }));

    return NextResponse.json({
      conversions: conversionsWithMetadata,
      pagination: {
        page,
        limit,
        total: filteredConversions.length,
        totalPages: Math.ceil(filteredConversions.length / limit),
        hasNext: endIndex < filteredConversions.length,
        hasPrev: page > 1
      },
      filters: {
        status,
        search,
        sortBy,
        sortOrder
      },
      summary: {
        total: sampleConversions.length,
        completed: sampleConversions.filter(c => c.status === 'completed').length,
        processing: sampleConversions.filter(c => c.status === 'processing').length,
        failed: sampleConversions.filter(c => c.status === 'failed').length,
        reviewRequired: sampleConversions.filter(c => c.status === 'review_required').length
      }
    });

  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversion history' },
      { status: 500 }
    );
  }
}