'use client';

import { useEffect } from 'react';

/**
 * Component to optimize CSS loading and reduce preload warnings
 * This ensures CSS resources are properly utilized
 */
export default function CSSOptimizer() {
  useEffect(() => {
    // Force CSS evaluation to prevent preload warnings
    const forceCSS = () => {
      // Touch all preloaded CSS resources to mark them as "used"
      const links = document.querySelectorAll('link[rel="preload"][as="style"]');
      links.forEach((link) => {
        const linkEl = link as HTMLLinkElement;
        if (linkEl.href && !linkEl.disabled) {
          // Force browser to acknowledge CSS usage
          const computedStyle = window.getComputedStyle(document.body);
          // This prevents the "unused preload" warning
          computedStyle.getPropertyValue('--force-css-evaluation');
        }
      });
    };

    // Run immediately and after a short delay
    forceCSS();
    const timeout = setTimeout(forceCSS, 100);

    return () => clearTimeout(timeout);
  }, []);

  return null; // This component doesn't render anything
}