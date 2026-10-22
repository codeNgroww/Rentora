'use client';

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  History,
} from 'lucide-react';

import { useAuth } from '../lib/AuthContext';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  arrearsCount?: number;
}

export function BottomNav({ currentTab, onSelectTab, arrearsCount = 0 }: BottomNavProps) {
  const { user, isSuperAdmin } = useAuth();

  const allNavItems = isSuperAdmin
    ? [
        { id: 'super-admin', module: 'companies', label: 'Companies', icon: Building2 },
        { id: 'audit', module: 'activity_logs', label: 'Audit Trail', icon: History },
      ]
    : [
        { id: 'dashboard', module: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'properties', module: 'properties', label: 'Properties', icon: Building2 },
        { id: 'tenants', module: 'tenants', label: 'Leases', icon: FileText },
        { id: 'rent', module: 'rent', label: 'Collect', icon: CreditCard },
        { id: 'expenses', module: 'expenses', label: 'Expenses', icon: Receipt },
      ];

  const navItems = user?.permissions && user.permissions.length > 0
    ? allNavItems.filter((item) => user.permissions?.includes(item.module as any))
    : allNavItems;

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
          >
            <div className="bottom-nav-icon-wrapper">
              <Icon size={20} />
              {item.id === 'rent' && arrearsCount > 0 && (
                <span className="bottom-nav-badge">{arrearsCount}</span>
              )}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
