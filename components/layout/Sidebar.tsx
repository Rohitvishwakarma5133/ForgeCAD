'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, Upload, FolderOpen, History, Settings, 
  CreditCard, HelpCircle, LogOut, Menu, X,
  BarChart3, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COMPANY_NAME } from '@/lib/constants';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and analytics'
  },
  {
    name: 'Upload Drawing',
    href: '/dashboard/upload',
    icon: Upload,
    description: 'Convert new drawings'
  },
  {
    name: 'My Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    description: 'Organize your work'
  },
  {
    name: 'History',
    href: '/dashboard/history',
    icon: History,
    description: 'Past conversions'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Usage insights'
  }
];

const bottomItems = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard
  },
  {
    name: 'Help',
    href: '/help',
    icon: HelpCircle
  }
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white/90 backdrop-blur-sm"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isMobileOpen ? 0 : '-100%' 
        }}
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${className}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{COMPANY_NAME}</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  John Engineer
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Professional
                  </Badge>
                  <span className="text-xs text-gray-500">
                    47 credits
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200 group relative
                    ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{item.name}</span>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <div className="absolute right-2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {bottomItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            <button className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-full transition-colors duration-200">
              <LogOut className="h-5 w-5 text-gray-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}