import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Recommended Clerk pattern: exclude all static assets and _next
    '/((?!.*\\..*|_next).*)',
    '/(api|trpc)(.*)'
  ],
};
