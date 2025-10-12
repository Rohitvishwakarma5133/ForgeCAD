'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Clock, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  filename: string;
  type: 'DWG' | 'DXF' | 'PDF' | 'Image' | string;
  createdAt: string; // ISO string
}

const SIDEBAR_KEY = 'cadly:sidebarCollapsed';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load persisted sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(SIDEBAR_KEY);
        if (raw) setCollapsed(raw === '1');
      } catch {}
    }
  }, []);

  // Persist state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch {}
    }
  }, [collapsed]);

  // Placeholder mock history (replace with API later)
  useEffect(() => {
    // Show last few mock items
    const now = new Date();
    const items: HistoryItem[] = [
      { id: '1', filename: 'P_ID-Unit-A.pdf', type: 'PDF', createdAt: new Date(now.getTime() - 3600_000).toISOString() },
      { id: '2', filename: 'Pump-Layout.dwg', type: 'DWG', createdAt: new Date(now.getTime() - 7200_000).toISOString() },
      { id: '3', filename: 'Valve-List.xlsx', type: 'Other', createdAt: new Date(now.getTime() - 86400_000).toISOString() },
    ];
    setHistory(items);
  }, []);

  const widthClass = collapsed ? 'w-16' : 'w-72';

  return (
    <aside
      className={`h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 ${widthClass} transition-[width] duration-300 ease-in-out z-40`}
    >
      {/* Header / toggle */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <Link href="/dashboard" className="font-semibold text-gray-900 dark:text-gray-100">CADly</Link>
        )}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(v => !v)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-gray-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>


      {/* History */}
      <div
        className={`sticky top-0 z-10 px-3 py-2 text-xs font-semibold tracking-wide ${
          collapsed ? 'hidden' : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-950'
        }`}
      >
        History
      </div>

      <div className="overflow-y-auto px-2 pb-24 space-y-1 h-[calc(100vh-140px)]">
        {history.length === 0 && (
          <div className={`text-sm text-gray-500 dark:text-gray-400 ${collapsed ? 'text-center' : 'px-2'}`}>No history yet</div>
        )}
        {history.map(item => (
          <Link key={item.id} href={`/dashboard/history?id=${item.id}`}>
            <div className={`group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''}`}>
              <FileText className="h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{item.filename}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{item.type}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom settings when expanded (sticky at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 p-3">
        <Link href="/dashboard/settings" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100`}>
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}