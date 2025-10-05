'use client';

import { useEffect } from 'react';

export default function LoadingOptimizer() {
  useEffect(() => {
    // Optimize loading by preconnecting to Clerk's domains
    const preconnectLinks = [
      'https://clerk.accounts.dev',
      'https://img.clerk.com'
    ];

    preconnectLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      document.head.appendChild(link);
    });

    // Add loading performance optimizations
    const style = document.createElement('style');
    style.textContent = `
      /* Optimize Clerk component loading */
      .cl-loading {
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      
      .cl-loaded {
        opacity: 1;
      }
      
      /* Hide flash of unstyled content */
      .cl-rootBox:empty {
        min-height: 0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup on unmount
      preconnectLinks.forEach(href => {
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) {
          link.remove();
        }
      });
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null;
}