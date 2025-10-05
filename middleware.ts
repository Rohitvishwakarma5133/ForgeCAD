import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that handles both cases
export default function middleware(request: NextRequest) {
  // Check if Clerk environment variables are present
  const hasClerkConfig = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.CLERK_SECRET_KEY
  );

  // If Clerk is not configured, allow all requests through
  if (!hasClerkConfig) {
    return NextResponse.next();
  }

  // Otherwise, try to use Clerk middleware with error handling
  try {
    const clerkHandler = clerkMiddleware();
    // clerkMiddleware returns a function that expects (request, event)
    return clerkHandler(request, undefined as any);
  } catch (error) {
    // If Clerk middleware fails, log error and allow request through
    console.error('Clerk middleware failed:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};