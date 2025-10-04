'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast, Toast } from '@/hooks/use-toast';

const ToastIcon = ({ type }: { type?: Toast['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-300 ring-1 ring-green-200';
      case 'error':
        return 'bg-red-50 border-red-300 ring-1 ring-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-200';
      default:
        return 'bg-blue-50 border-blue-300 ring-1 ring-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`max-w-sm w-full shadow-xl rounded-xl border-2 ${getBackgroundColor()} p-4 pointer-events-auto backdrop-blur-sm`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ToastIcon type={toast.type} />
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md transition-colors"
            onClick={() => onDismiss(toast.id)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none w-full max-w-sm sm:max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ToastProvider;