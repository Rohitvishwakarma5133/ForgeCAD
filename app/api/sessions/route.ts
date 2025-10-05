import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { User, Session } from '@/lib/models';

// Create new session on login
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { sessionId, userInfo } = await request.json();
    
    // Get client info
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = xForwardedFor?.split(',')[0] || 'unknown';
    
    // Parse user agent for device/browser info
    const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
    const browser = getBrowserFromUserAgent(userAgent);
    
    // Update user login info
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = new User({
        clerkId: userId,
        email: userInfo?.email || 'unknown@example.com',
        firstName: userInfo?.firstName || 'Unknown',
        lastName: userInfo?.lastName || 'User',
        profileImageUrl: userInfo?.imageUrl,
        loginCount: 1,
        lastLoginAt: new Date(),
      });
    } else {
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();
      
      // Update user info if provided
      if (userInfo) {
        if (userInfo.email) user.email = userInfo.email;
        if (userInfo.firstName) user.firstName = userInfo.firstName;
        if (userInfo.lastName) user.lastName = userInfo.lastName;
        if (userInfo.imageUrl) user.profileImageUrl = userInfo.imageUrl;
      }
    }
    
    await user.save();
    
    // Create session record
    const session = new Session({
      userId: user._id,
      clerkId: userId,
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ipAddress,
      userAgent,
      device,
      browser,
      loginAt: new Date(),
      isActive: true,
      lastActivity: new Date(),
    });
    
    await session.save();
    
    return NextResponse.json({
      message: 'Session created successfully',
      sessionId: session.sessionId,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        loginCount: user.loginCount,
        subscriptionTier: user.subscriptionTier,
        totalConversions: user.totalConversions,
        monthlyConversions: user.monthlyConversions,
      }
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update session activity (heartbeat)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { sessionId } = await request.json();
    
    // Update session last activity
    const session = await Session.findOne({
      clerkId: userId,
      sessionId,
      isActive: true,
    });
    
    if (session) {
      session.lastActivity = new Date();
      await session.save();
    }
    
    return NextResponse.json({ message: 'Session updated' });
    
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// End session on logout
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { sessionId } = await request.json();
    
    // End session
    const session = await Session.findOne({
      clerkId: userId,
      sessionId,
      isActive: true,
    });
    
    if (session) {
      session.isActive = false;
      session.logoutAt = new Date();
      session.duration = Math.floor((session.logoutAt.getTime() - session.loginAt.getTime()) / (1000 * 60)); // minutes
      await session.save();
    }
    
    return NextResponse.json({ message: 'Session ended successfully' });
    
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user sessions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    await dbConnect();
    
    // Get user sessions
    const sessions = await Session.find({ clerkId: userId })
      .sort({ loginAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    const total = await Session.countDocuments({ clerkId: userId });
    
    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getBrowserFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}