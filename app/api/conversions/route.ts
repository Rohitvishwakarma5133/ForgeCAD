import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Conversion, User } from '@/lib/models';

// Create a new conversion record
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Ensure user exists in database
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      // If user doesn't exist, create a basic user record
      user = new User({
        clerkId: userId,
        email: 'unknown@example.com', // This should be updated when user data is available
        firstName: 'Unknown',
        lastName: 'User',
      });
      await user.save();
    }
    
    const { fileName, fileSize, fileType, forgeData } = await request.json();

    const newConversion = new Conversion({
      userId: user._id,
      clerkId: userId,
      fileName,
      originalFileSize: fileSize,
      fileType,
      status: 'processing',
      forgeData: forgeData || {},
    });
    
    await newConversion.save();
    
    return NextResponse.json({ conversion: newConversion }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's conversion history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    await dbConnect();
    
    // Build query
    const query: any = { clerkId: userId };
    if (status && ['processing', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    // Get total count
    const total = await Conversion.countDocuments(query);
    
    // Get paginated results
    const conversions = await Conversion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      conversions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}