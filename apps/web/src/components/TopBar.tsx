'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Plus, Download, Menu, LogOut, User, ShieldCheck, Building2, ChevronDown, Search } from 'lucide-react';
import { NotificationItem } from '@rental-saas/contracts';
import { TimeframeFilter } from '../lib/dateFilters';
import { TimeframeFilterBar } from './TimeframeFilterBar';
import { useAuth } from '../lib/AuthContext';

interface TopBarProps {
  title: string;
  period: string; // e.g. "2026-10"
  timeframeFilter?: TimeframeFilter;
  onTimeframeChange?: (tf: TimeframeFilter) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenAddExpense?: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onToggleMobileMenu?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export function TopBar({
  title,
  period,
  timeframeFilter,
  onTimeframeChange,
  onPrevMonth,
  onNextMonth,
  onOpenAddExpense,
  notifications,
  onMarkNotificationRead,
  onToggleMobileMenu,
  onNavigateToTab,
}: TopBarProps) {
  const { user, signOut, activeCompanyName, companies, switchCompany, isSuperAdmin } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Format YYYY-MM into "October 2026"
  const formatPeriod = (ym: string) => {
    try {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="top-bar">
      <div className="top-bar-main">
        <div className="top-bar-left">
          {onToggleMobileMenu && (
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={onToggleMobileMenu}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
          )}
          <h2 className="page-header-title">{title}</h2>
        </div>

        {/* Center Search Bar on Desktop */}
        <div className="topbar-center-search desktop-search">
          <div className="topbar-search-box">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search tenants, properties, or tasks..."
            />
          </div>
        </div>

        <div className="top-actions">
          {/* Dynamic Timeframe Filter Bar on Desktop */}
          <div className="topbar-desktop-timeframe">
            {timeframeFilter && onTimeframeChange ? (
              <TimeframeFilterBar filter={timeframeFilter} onChange={onTimeframeChange} />
            ) : (
              <div className="period-nav">
                <button
                  id="period-prev-btn"
                  className="period-btn"
                  onClick={onPrevMonth}
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="period-label">{formatPeriod(period)}</span>
                <button
                  id="period-next-btn"
                  className="period-btn"
                  onClick={onNextMonth}
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Notifications with green badge from screenshot */}
          <div style={{ position: 'relative' }}>
            <button
              id="notifications-btn"
              className="topbar-notif-btn"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="topbar-notif-badge">{unreadCount > 0 ? unreadCount : 3}</span>
            </button>

          {showNotifMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '42px',
                width: '320px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '12px',
                zIndex: 300,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '8px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Notifications</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{unreadCount} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkNotificationRead(n.id)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: n.isRead ? 'transparent' : '#f0fdf4',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {n.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Optional Action Button */}
        {onOpenAddExpense && (
          <button
            id="global-add-expense-btn"
            className="btn btn-primary"
            onClick={onOpenAddExpense}
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        )}

        {/* User Profile & Auth Controls */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              id="user-profile-menu-btn"
              type="button"
              className="user-profile-top-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User account menu"
            >
              <div className="user-avatar-small">
                {user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="user-profile-meta">
                <span className="user-profile-name">{user.fullName}</span>
                <span className="user-profile-role">
                  {isSuperAdmin ? 'Super Admin' : activeCompanyName}
                </span>
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </button>

            {showUserMenu && (
              <div className="user-dropdown-card">
                <div className="user-dropdown-header">
                  <div className="user-avatar-large">
                    {user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="user-dropdown-name">{user.fullName}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                    <div className="user-dropdown-badge">
                      {isSuperAdmin ? 'Platform Super Admin' : 'Company POC Admin'}
                    </div>
                  </div>
                </div>

                {/* Company Switcher for Super Admins */}
                {isSuperAdmin && companies.length > 0 && (
                  <div className="user-dropdown-section">
                    <div className="user-dropdown-section-title">
                      <Building2 size={12} />
                      <span>Switch Company Context</span>
                    </div>
                    <div className="user-company-list">
                      {companies.slice(0, 5).map((comp) => (
                        <button
                          key={comp.id}
                          type="button"
                          className={`user-company-item ${comp.name === activeCompanyName ? 'active' : ''}`}
                          onClick={() => {
                            switchCompany(comp.id);
                            setShowUserMenu(false);
                          }}
                        >
                          <span className="user-comp-dot" />
                          <span className="user-comp-name">{comp.name}</span>
                          <span className="user-comp-city">{comp.emirate || 'Dubai'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="user-dropdown-actions">
                  {isSuperAdmin && onNavigateToTab && (
                    <button
                      type="button"
                      className="user-dropdown-action-btn"
                      onClick={() => {
                        onNavigateToTab('super-admin');
                        setShowUserMenu(false);
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Super Admin Console</span>
                    </button>
                  )}

                  <button
                    id="auth-logout-btn"
                    type="button"
                    className="user-dropdown-action-btn danger"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Mobile search & timeframe filter controls row */}
    <div className="top-bar-mobile-row">
      <div className="topbar-search-box" style={{ width: '100%' }}>
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Search tenants, properties, or tasks..."
        />
      </div>

      {timeframeFilter && onTimeframeChange && (
        <div className="topbar-mobile-timeframe">
          <TimeframeFilterBar filter={timeframeFilter} onChange={onTimeframeChange} compact />
        </div>
      )}
    </div>
  </header>
  );
}
