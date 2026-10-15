'use client';

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  CircleDollarSign,
  FileBarChart,
  History,
  Settings,
  ChevronDown,
} from 'lucide-react';

import { RentoraLogo } from './RentoraLogo';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  arrearsCount?: number;
}

export function Sidebar({ currentTab, onSelectTab, arrearsCount = 1 }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Building & Properties', icon: Building2 },
    { id: 'tenants', label: 'Tenants & Leases', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'rent', label: 'Rent & Payments', icon: CircleDollarSign, badge: arrearsCount > 0 ? `${arrearsCount} Due` : undefined },
    { id: 'reports', label: 'Financial Reports', icon: FileBarChart },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '20px 18px', gap: '12px' }}>
        <RentoraLogo size={38} showText={true} textSize={18} variant="light" />
      </div>

      {/* Workspace Switcher */}
      <div className="workspace-badge">
        <div>
          <div className="ws-name">Al Reem Properties</div>
          <span className="ws-market">Dubai • AED</span>
        </div>
        <ChevronDown size={14} color="#94a3b8" />
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Portfolio Operations</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '20px' }}>Settings</div>
        <button
          id="nav-item-settings"
          onClick={() => onSelectTab('settings')}
          className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Workspace Settings</span>
        </button>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">SA</div>
        <div className="user-info">
          <div className="user-name">Sultan Al Nuaimi</div>
          <div className="user-role">Workspace Owner</div>
        </div>
      </div>
    </aside>
  );
}
