'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export function useSessionTracking() {
  const { user, isSignedIn } = useUser();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSignedIn && user) {
      // Create session on login
      createSession();
      
      // Start heartbeat to track activity
      startHeartbeat();
      
      // Handle page unload (logout/close)
      const handleBeforeUnload = () => {
        if (sessionIdRef.current) {
          // Use sendBeacon for reliable session ending
          const data = JSON.stringify({ sessionId: sessionIdRef.current });
          navigator.sendBeacon('/api/sessions', data);
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        endSession();
      };
    }
  }, [isSignedIn, user]);

  const createSession = async () => {
    if (!user) return;
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userInfo: {
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.sessionId;
        console.log('Session created:', data.sessionId);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const startHeartbeat = () => {
    // Send heartbeat every 5 minutes to track activity
    heartbeatIntervalRef.current = setInterval(async () => {
      if (sessionIdRef.current) {
        try {
          await fetch('/api/sessions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
            }),
          });
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const endSession = async () => {
    if (!sessionIdRef.current) return;
    
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
        }),
      });
      
      sessionIdRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return {
    sessionId: sessionIdRef.current,
    endSession,
  };
}