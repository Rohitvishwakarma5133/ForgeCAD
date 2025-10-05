import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Conversion } from '@/lib/models';
import { isDatabaseEnabled } from '@/lib/db-config';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Update conversion status and results
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversion ID' }, { status: 400 });
    }

    if (!isDatabaseEnabled()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    await dbConnect();
    
    const updateData = await request.json();
    const { status, results, processingTime, forgeData } = updateData;

    // Find and update the conversion
    const conversion = await Conversion.findOne({
      _id: id,
      clerkId: userId, // Ensure user can only update their own conversions
    });

    if (!conversion) {
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 });
    }

    // Update fields
    if (status) conversion.status = status;
    if (results) conversion.results = results;
    if (processingTime) conversion.processingTime = processingTime;
    if (forgeData) conversion.forgeData = { ...conversion.forgeData, ...forgeData };
    
    conversion.updatedAt = new Date();

    await conversion.save();
    
    return NextResponse.json({ conversion });
  } catch (error) {
    console.error('Error updating conversion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get specific conversion
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversion ID' }, { status: 400 });
    }

    if (!isDatabaseEnabled()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    await dbConnect();
    
    const conversion = await Conversion.findOne({
      _id: id,
      clerkId: userId, // Ensure user can only access their own conversions
    });

    if (!conversion) {
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 });
    }
    
    return NextResponse.json({ conversion });
  } catch (error) {
    console.error('Error fetching conversion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete conversion
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversion ID' }, { status: 400 });
    }

    if (!isDatabaseEnabled()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    await dbConnect();
    
    const result = await Conversion.findOneAndDelete({
      _id: id,
      clerkId: userId, // Ensure user can only delete their own conversions
    });

    if (!result) {
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Conversion deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}