import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Conversion, User } from '@/lib/models';
import { generateMockResult } from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const drawingType = formData.get('drawingType') as string;
    const priority = formData.get('priority') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Simulate file validation
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, PNG, JPEG, or TIFF files.' },
        { status: 400 }
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Generate a mock result for demo purposes
    const result = generateMockResult(file.name);

    // If user is authenticated, save to database
    if (userId) {
      await dbConnect();
      
      // Ensure user exists in database
      let user = await User.findOne({ clerkId: userId });
      if (!user) {
        user = new User({
          clerkId: userId,
          email: 'unknown@example.com',
          firstName: 'Unknown',
          lastName: 'User',
        });
        await user.save();
      }
      
      // Create conversion record
      const conversion = new Conversion({
        userId: user._id,
        clerkId: userId,
        fileName: file.name,
        originalFileSize: file.size,
        fileType: file.type,
        status: 'processing',
        forgeData: {
          bucketKey: result.conversionId, // Use mock ID for now
          objectName: file.name,
        }
      });
      
      await conversion.save();
      
      // Return the database conversion ID
      return NextResponse.json({
        conversionId: conversion._id.toString(),
        filename: conversion.fileName,
        type: drawingType || conversion.fileType,
        status: 'processing',
        projectName,
        priority,
        message: 'Upload successful. Processing started.',
        databaseId: conversion._id.toString()
      });
    }

    // For non-authenticated users, return mock result
    return NextResponse.json({
      conversionId: result.conversionId,
      filename: result.filename,
      type: drawingType || result.type,
      status: 'processing',
      projectName,
      priority,
      message: 'Upload successful. Processing started.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint' });
}