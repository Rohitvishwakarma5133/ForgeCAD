'use client';

import { useEffect } from 'react';

export default function HideClerkDevNotices() {
  useEffect(() => {
    function hideClerkDevNotices() {
      const selectors = [
        '.cl-devModeWarning',
        '.cl-internal-b3fm6y',
        '[data-clerk-dev-notice]',
        '.clerk-tooltip'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          (element as HTMLElement).style.display = 'none';
        });
      });
    }

    // Initial cleanup
    hideClerkDevNotices();

    // Set up mutation observer to catch dynamically added notices
    const observer = new MutationObserver(() => {
      hideClerkDevNotices();
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also run on a slight delay to catch any late-loading elements
    const timeoutId = setTimeout(hideClerkDevNotices, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  return null; // This component doesn't render anything
}