'use client';

import React, { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

let toastCount = 0;

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = (++toastCount).toString();
  const newToast = { ...toast, id };
  toasts.push(newToast);
  listeners.forEach((listener) => listener([...toasts]));

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);

  return id;
};

const removeToast = (id: string) => {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
};

export const useToast = () => {
  const [toastList, setToastList] = useState<Toast[]>([]);

  const subscribe = useCallback((callback: (toasts: Toast[]) => void) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const toast = useCallback((toastOptions: Omit<Toast, 'id'>) => {
    return addToast(toastOptions);
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  // Subscribe to toast updates
  React.useEffect(() => {
    const unsubscribe = subscribe(setToastList);
    return unsubscribe;
  }, [subscribe]);

  return {
    toast,
    dismiss,
    toasts: toastList,
  };
};

// Export a singleton toast function for convenience
export const toast = (options: Omit<Toast, 'id'>) => addToast(options);