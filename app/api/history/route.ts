import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Conversion } from '@/lib/models';
import { sampleConversions } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // If user not authenticated, return mock data for demo purposes
    if (!userId) {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const sortBy = searchParams.get('sortBy') || 'date';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      let filteredConversions = [...sampleConversions];

      // Continue with existing mock logic...
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

      // Sort and paginate mock data
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

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedConversions = filteredConversions.slice(startIndex, endIndex);

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
        filters: { status, search, sortBy, sortOrder },
        summary: {
          total: sampleConversions.length,
          completed: sampleConversions.filter(c => c.status === 'completed').length,
          processing: sampleConversions.filter(c => c.status === 'processing').length,
          failed: sampleConversions.filter(c => c.status === 'failed').length,
          reviewRequired: sampleConversions.filter(c => c.status === 'review_required').length
        }
      });
    }

    // Authenticated user - use database
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build MongoDB query
    const query: any = { clerkId: userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { fileType: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case 'filename':
        sortCriteria.fileName = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'status':
        sortCriteria.status = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'confidence':
        sortCriteria['results.validationResults.validTags'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'date':
      default:
        sortCriteria.createdAt = sortOrder === 'asc' ? 1 : -1;
        break;
    }
    
    // Get total count
    const total = await Conversion.countDocuments(query);
    
    // Get paginated results
    const conversions = await Conversion.find(query)
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Transform to match frontend expectations
    const conversionsWithMetadata = conversions.map((conversion: any) => ({
      id: conversion._id.toString(),
      filename: conversion.fileName,
      type: conversion.fileType,
      size: `${(conversion.originalFileSize / (1024 * 1024)).toFixed(1)} MB`,
      status: conversion.status,
      confidence: conversion.results?.validationResults?.validTags || 0,
      createdAt: conversion.createdAt,
      processingTime: conversion.processingTime,
      downloadUrl: `/api/download/${conversion._id}`,
      previewUrl: `/api/preview/${conversion._id}`,
      canRetry: conversion.status === 'failed',
      canReview: conversion.status === 'review_required',
      results: conversion.results,
      forgeData: conversion.forgeData
    }));
    
    // Get summary statistics
    const allConversions = await Conversion.find({ clerkId: userId }).lean();
    const summary = {
      total: allConversions.length,
      completed: allConversions.filter(c => c.status === 'completed').length,
      processing: allConversions.filter(c => c.status === 'processing').length,
      failed: allConversions.filter(c => c.status === 'failed').length,
      reviewRequired: allConversions.filter(c => c.status === 'review_required').length
    };

    return NextResponse.json({
      conversions: conversionsWithMetadata,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      },
      filters: {
        status,
        search,
        sortBy,
        sortOrder
      },
      summary
    });


  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversion history' },
      { status: 500 }
    );
  }
}