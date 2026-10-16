'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Plus, Download } from 'lucide-react';
import { NotificationItem } from '@rental-saas/contracts';
import { TimeframeFilter } from '../lib/dateFilters';
import { TimeframeFilterBar } from './TimeframeFilterBar';

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
}: TopBarProps) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);

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
      <h2 className="page-header-title">{title}</h2>

      <div className="top-actions">
        {/* Dynamic Timeframe Filter Bar (Monthly, Quarterly, Yearly, Custom) */}
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

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            id="notifications-btn"
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', padding: '8px 10px' }}
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
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
      </div>
    </header>
  );
}
