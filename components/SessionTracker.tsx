'use client';

import { useSessionTracking } from '@/hooks/use-session-tracking';

export default function SessionTracker() {
  useSessionTracking();
  
  // This component doesn't render anything visible
  // It just handles session tracking in the background
  return null;
}