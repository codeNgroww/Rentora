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
  ShieldCheck,
  X,
  LogOut,
} from 'lucide-react';

import { RentoraLogo } from './RentoraLogo';
import { useAuth } from '../lib/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  arrearsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  companyName?: string;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  arrearsCount = 1,
  isOpen = false,
  onClose,
  companyName,
}: SidebarProps) {
  const { user, signOut, activeCompanyName, isSuperAdmin } = useAuth();
  const displayCompanyName = companyName || activeCompanyName || (isSuperAdmin ? 'Rentora Platform' : 'Rentora');

  // Super Admin navigation vs Company Tenant Staff navigation
  const allNavItems = isSuperAdmin
    ? [
        { id: 'super-admin', module: 'companies', label: 'Company Governance', icon: Building2 },
        { id: 'audit', module: 'activity_logs', label: 'Platform Audit Trail', icon: History },
      ]
    : [
        { id: 'dashboard', module: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'properties', module: 'properties', label: 'Building & Properties', icon: Building2 },
        { id: 'tenants', module: 'tenants', label: 'Tenants & Leases', icon: Users },
        { id: 'expenses', module: 'expenses', label: 'Expenses', icon: Receipt },
        {
          id: 'rent',
          module: 'rent',
          label: 'Rent & Payments',
          icon: CircleDollarSign,
          badge: arrearsCount > 0 ? `${arrearsCount} Due` : undefined,
        },
        { id: 'reports', module: 'reports', label: 'Financial Reports', icon: FileBarChart },
        { id: 'audit', module: 'activity_logs', label: 'Activity Logs', icon: History },
      ];

  const navItems = user?.permissions && user.permissions.length > 0
    ? allNavItems.filter((item) => user.permissions?.includes(item.module as any))
    : allNavItems;

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div
          className="sidebar-header"
          style={{
            padding: '20px 18px',
            gap: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <RentoraLogo size={36} showText={true} textSize={18} variant="light" />
          {/* Mobile close button */}
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Company Switcher */}
        <div className="workspace-badge">
          <div>
            <div className="ws-name">
              {isSuperAdmin ? 'Rentora Global Platform' : displayCompanyName}
            </div>
            <span className="ws-market">
              {isSuperAdmin ? 'Super Admin Authority • UAE' : 'Dubai • UAE (AED)'}
            </span>
          </div>
          {!isSuperAdmin && <ChevronDown size={14} color="#94a3b8" />}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {isSuperAdmin ? 'Platform Governance' : 'Portfolio Operations'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}

          {!isSuperAdmin && (
            <>
              <div className="nav-section-title" style={{ marginTop: '20px' }}>
                Governance & Setup
              </div>
              <button
                id="nav-item-settings"
                onClick={() => handleSelect('settings')}
                className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
              >
                <Settings size={18} />
                <span>Company Settings</span>
              </button>
            </>
          )}
        </nav>

        {/* User Footer */}
        {user && (
          <div className="sidebar-footer">
            <div className="user-avatar">
              {user.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.fullName}</div>
              <div className="user-role">
                {isSuperAdmin ? 'Super Admin' : 'Company POC Admin'}
              </div>
            </div>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={() => signOut()}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
