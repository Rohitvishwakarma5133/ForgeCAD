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
    
    const { email, firstName, lastName } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userId });
    
    if (existingUser) {
      // Update existing user
      existingUser.email = email;
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.updatedAt = new Date();
      await existingUser.save();
      
      return NextResponse.json({ user: existingUser });
    } else {
      // Create new user
      const newUser = new User({
        clerkId: userId,
        email,
        firstName,
        lastName,
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