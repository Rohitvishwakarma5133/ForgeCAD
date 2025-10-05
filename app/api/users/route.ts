import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { email, firstName, lastName, imageUrl, sessionId } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userId });
    
    if (existingUser) {
      // Update existing user
      if (email) existingUser.email = email;
      if (firstName) existingUser.firstName = firstName;
      if (lastName) existingUser.lastName = lastName;
      if (imageUrl) existingUser.profileImageUrl = imageUrl;
      existingUser.lastLoginAt = new Date();
      existingUser.loginCount = (existingUser.loginCount || 0) + 1;
      existingUser.updatedAt = new Date();
      await existingUser.save();
      
      return NextResponse.json({ user: existingUser });
    } else {
      // Create new user
      const newUser = new User({
        clerkId: userId,
        email: email || 'unknown@example.com',
        firstName: firstName || 'Unknown',
        lastName: lastName || 'User',
        profileImageUrl: imageUrl,
        loginCount: 1,
        lastLoginAt: new Date(),
      });
      
      await newUser.save();
      
      return NextResponse.json({ user: newUser }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}