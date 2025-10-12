'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 dark:text-gray-100">CADly</Link>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-gray-300" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </button>
          {/* Placeholder avatar to avoid external dependency issues during setup */}
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-zinc-800" />
        </div>
      </div>
    </header>
  );
}
