'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react';
import {
  TimeframeFilter,
  TimeframeMode,
  getMonthlyRange,
  getQuarterlyRange,
  getYearlyRange,
  getCustomRange,
} from '../lib/dateFilters';

interface TimeframeFilterBarProps {
  filter: TimeframeFilter;
  onChange: (filter: TimeframeFilter) => void;
  compact?: boolean;
}

export function TimeframeFilterBar({
  filter,
  onChange,
  compact = false,
}: TimeframeFilterBarProps) {
  const { mode, year, month, quarter, startDate, endDate, label } = filter;

  const handleModeChange = (newMode: TimeframeMode) => {
    if (newMode === 'monthly') {
      onChange(getMonthlyRange(year, month));
    } else if (newMode === 'quarterly') {
      onChange(getQuarterlyRange(year, quarter));
    } else if (newMode === 'yearly') {
      onChange(getYearlyRange(year));
    } else if (newMode === 'custom') {
      onChange(getCustomRange(startDate, endDate));
    }
  };

  const handlePrev = () => {
    if (mode === 'monthly') {
      if (month === 1) {
        onChange(getMonthlyRange(year - 1, 12));
      } else {
        onChange(getMonthlyRange(year, month - 1));
      }
    } else if (mode === 'quarterly') {
      if (quarter === 1) {
        onChange(getQuarterlyRange(year - 1, 4));
      } else {
        onChange(getQuarterlyRange(year, quarter - 1));
      }
    } else if (mode === 'yearly') {
      onChange(getYearlyRange(year - 1));
    }
  };

  const handleNext = () => {
    if (mode === 'monthly') {
      if (month === 12) {
        onChange(getMonthlyRange(year + 1, 1));
      } else {
        onChange(getMonthlyRange(year, month + 1));
      }
    } else if (mode === 'quarterly') {
      if (quarter === 4) {
        onChange(getQuarterlyRange(year + 1, 1));
      } else {
        onChange(getQuarterlyRange(year, quarter + 1));
      }
    } else if (mode === 'yearly') {
      onChange(getYearlyRange(year + 1));
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '3px 6px',
        gap: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        flexWrap: 'wrap',
      }}
    >
      {/* Mode Buttons */}
      <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '2px', borderRadius: '7px' }}>
        <button
          type="button"
          className={`btn btn-sm ${mode === 'monthly' ? 'btn-primary' : ''}`}
          style={{
            fontSize: '11px',
            padding: '3px 9px',
            borderRadius: '6px',
            background: mode === 'monthly' ? '#0284c7' : 'transparent',
            color: mode === 'monthly' ? '#ffffff' : '#475569',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => handleModeChange('monthly')}
        >
          Monthly
        </button>

        <button
          type="button"
          className={`btn btn-sm ${mode === 'quarterly' ? 'btn-primary' : ''}`}
          style={{
            fontSize: '11px',
            padding: '3px 9px',
            borderRadius: '6px',
            background: mode === 'quarterly' ? '#0284c7' : 'transparent',
            color: mode === 'quarterly' ? '#ffffff' : '#475569',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => handleModeChange('quarterly')}
        >
          Quarterly
        </button>

        <button
          type="button"
          className={`btn btn-sm ${mode === 'yearly' ? 'btn-primary' : ''}`}
          style={{
            fontSize: '11px',
            padding: '3px 9px',
            borderRadius: '6px',
            background: mode === 'yearly' ? '#0284c7' : 'transparent',
            color: mode === 'yearly' ? '#ffffff' : '#475569',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => handleModeChange('yearly')}
        >
          Yearly
        </button>

        <button
          type="button"
          className={`btn btn-sm ${mode === 'custom' ? 'btn-primary' : ''}`}
          style={{
            fontSize: '11px',
            padding: '3px 9px',
            borderRadius: '6px',
            background: mode === 'custom' ? '#0284c7' : 'transparent',
            color: mode === 'custom' ? '#ffffff' : '#475569',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => handleModeChange('custom')}
        >
          Custom
        </button>
      </div>

      {/* Navigator Controls (Monthly, Quarterly, Yearly) */}
      {mode !== 'custom' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="period-btn"
            style={{ width: '26px', height: '26px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
            onClick={handlePrev}
            title={`Previous ${mode}`}
          >
            <ChevronLeft size={15} color="#475569" />
          </button>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#0f172a',
              minWidth: compact ? '90px' : '120px',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {label}
          </span>

          <button
            type="button"
            className="period-btn"
            style={{ width: '26px', height: '26px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
            onClick={handleNext}
            title={`Next ${mode}`}
          >
            <ChevronRight size={15} color="#475569" />
          </button>
        </div>
      ) : (
        /* Custom Date Range Inputs */
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>From:</span>
            <input
              type="date"
              style={{
                fontSize: '11.5px',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                height: '26px',
              }}
              value={startDate}
              onChange={(e) => {
                const s = e.target.value;
                onChange(getCustomRange(s, endDate));
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>To:</span>
            <input
              type="date"
              style={{
                fontSize: '11.5px',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                height: '26px',
              }}
              value={endDate}
              onChange={(e) => {
                const end = e.target.value;
                onChange(getCustomRange(startDate, end));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
