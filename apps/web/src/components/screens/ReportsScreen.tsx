'use client';

import React, { useState } from 'react';
import { Download, Building2, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Clock, ShieldAlert } from 'lucide-react';
import { FinancialReportSummary, RentArrearsItem } from '@rental-saas/contracts';
import { TimeframeFilter } from '../../lib/dateFilters';

interface ReportsScreenProps {
  summary: FinancialReportSummary | null;
  arrears: RentArrearsItem[];
  timeframeFilter?: TimeframeFilter;
  onTimeframeChange?: (tf: TimeframeFilter) => void;
  onExportCsv: (type: string) => void;
}

export function ReportsScreen({
  summary,
  arrears,
  timeframeFilter,
  onTimeframeChange,
  onExportCsv,
}: ReportsScreenProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'arrears'>('performance');

  // Performance calculations
  const totalIncome = summary?.propertiesSummary.reduce((acc, p) => acc + parseFloat(p.income || '0'), 0) || 0;
  const totalExpenses = summary?.propertiesSummary.reduce((acc, p) => acc + parseFloat(p.expenses || '0'), 0) || 0;
  const totalNet = totalIncome - totalExpenses;

  // Arrears calculations
  const totalArrearsAmount = arrears.reduce((acc, a) => acc + parseFloat(a.outstandingBalance || '0'), 0);
  const maxDaysOverdue = arrears.length > 0 ? Math.max(...arrears.map((a) => a.daysOverdue)) : 0;

  return (
    <div>
      {/* Top Header & Tab Switcher Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            id="tab-financial-performance"
            className={`btn btn-sm ${activeTab === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('performance')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Building2 size={14} />
            <span>Property Financial Performance</span>
          </button>
          <button
            id="tab-rent-arrears"
            className={`btn btn-sm ${activeTab === 'arrears' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('arrears')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <AlertTriangle size={14} />
            <span>Rent Arrears & Aging</span>
            {arrears.length > 0 && (
              <span
                style={{
                  marginLeft: '4px',
                  backgroundColor: activeTab === 'arrears' ? '#ef4444' : '#fee2e2',
                  color: activeTab === 'arrears' ? '#ffffff' : '#991b1b',
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                {arrears.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeTab === 'performance' ? (
            <button
              id="export-financial-csv-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => onExportCsv('financials')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>Export Financials CSV</span>
            </button>
          ) : (
            <button
              id="export-arrears-csv-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => onExportCsv('arrears')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>Export Arrears CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Financial Performance View */}
      {activeTab === 'performance' && (
        <div>
          {/* KPI Summary Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">
                <span>Rental Income</span>
                <TrendingUp size={16} color="#15803d" />
              </div>
              <div className="kpi-value positive">
                AED {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">
                <span>Operating Expenses</span>
                <TrendingDown size={16} color="#dc2626" />
              </div>
              <div className="kpi-value negative">
                AED {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">
                <span>Net Cash Flow</span>
                <DollarSign size={16} color={totalNet >= 0 ? '#15803d' : '#dc2626'} />
              </div>
              <div className={`kpi-value ${totalNet >= 0 ? 'positive' : 'negative'}`}>
                AED {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Property Profitability Statement Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  Property-Level Financial Performance ({summary?.periodLabel || timeframeFilter?.label || '2026'})
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Operating income, maintenance expenditures, and net yield across portfolio
                </span>
              </div>
            </div>
            <div className="card-body">
              {!summary ? (
                <div className="empty-state">Loading financial report...</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Property Name</th>
                        <th>Units (Occupied / Total)</th>
                        <th style={{ textAlign: 'right' }}>Rental Income (AED)</th>
                        <th style={{ textAlign: 'right' }}>Operating Expenses (AED)</th>
                        <th style={{ textAlign: 'right' }}>Net Cash Flow (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.propertiesSummary.map((p) => {
                        const netNum = parseFloat(p.net);
                        return (
                          <tr key={p.propertyId}>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>{p.propertyName}</td>
                            <td>
                              {p.occupiedUnits} / {p.totalUnits} units
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                              AED {parseFloat(p.income).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                              AED {parseFloat(p.expenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 800,
                                color: netNum >= 0 ? '#15803d' : '#dc2626',
                              }}
                            >
                              AED {netNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Rent Arrears & Aging Report View */}
      {activeTab === 'arrears' && (
        <div>
          {/* Arrears KPI Summary Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">
                <span>Total Overdue Arrears</span>
                <ShieldAlert size={16} color="#dc2626" />
              </div>
              <div className="kpi-value negative">
                AED {totalArrearsAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">
                <span>Delinquent Charges</span>
                <AlertTriangle size={16} color="#d97706" />
              </div>
              <div className="kpi-value" style={{ color: '#d97706' }}>
                {arrears.length} overdue
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">
                <span>Oldest Overdue</span>
                <Clock size={16} color="#64748b" />
              </div>
              <div className="kpi-value" style={{ color: '#0f172a', fontSize: '20px' }}>
                {maxDaysOverdue > 0 ? `${maxDaysOverdue} Days` : '0 Days'}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Rent Arrears & Aging Report</h3>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Uncollected rent installments with days past due and outstanding balances
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                {arrears.length} overdue charge(s)
              </span>
            </div>
            <div className="card-body">
              {arrears.length === 0 ? (
                <div className="empty-state">
                  <h4 className="empty-state-title">No rent arrears</h4>
                  <p className="empty-state-desc">All rent installments are fully settled on time.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tenant</th>
                        <th>Property / Unit</th>
                        <th>Due Date</th>
                        <th>Days Overdue</th>
                        <th style={{ textAlign: 'right' }}>Total Billed</th>
                        <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arrears.map((a) => (
                        <tr key={a.rentChargeId}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            <div>{a.tenantName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{a.tenantPhone}</div>
                          </td>
                          <td>
                            {a.propertyName} • Unit {a.unitNumber}
                          </td>
                          <td style={{ fontWeight: 600 }}>{a.dueDate}</td>
                          <td>
                            <span className="badge badge-red">
                              {a.daysOverdue} days overdue
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            AED {parseFloat(a.amountDue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                            AED {parseFloat(a.outstandingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
