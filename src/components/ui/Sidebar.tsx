'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  Car,
  AlertTriangle,
  ListChecks,
  Shield,
  FileText,
  Settings,
  TestTube,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Cameras', href: '/cameras', icon: Video },
  { name: 'Vehicle Intelligence', href: '/vehicles', icon: Car },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Watchlist', href: '/watchlist', icon: ListChecks },
  { name: 'Evidence', href: '/evidence', icon: FileText },
  { name: 'Test AI', href: '/test', icon: TestTube },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <Shield className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-lg font-bold">Sentinel Gujarat</h1>
          <p className="text-xs text-slate-400">CCTV Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
            <span className="text-sm font-medium">A</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-slate-400">admin@sentinel.gov.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
