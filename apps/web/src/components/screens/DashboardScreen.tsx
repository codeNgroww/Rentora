'use client';

import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  TrendingUp,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { DashboardSummary } from '@rental-saas/contracts';
import { INITIAL_DASHBOARD_SUMMARY } from '../../lib/mockData';

interface DashboardScreenProps {
  summary: DashboardSummary | null;
  onNavigate: (tab: string) => void;
}

export function DashboardScreen({ summary, onNavigate }: DashboardScreenProps) {
  const [hoveredQuarter, setHoveredQuarter] = useState<number | null>(null);

  // Fallback gracefully so dashboard never hangs on empty loading screen
  const activeSummary = summary || INITIAL_DASHBOARD_SUMMARY;

  const rentCollected = parseFloat(activeSummary.rentCollected || '0');
  const rentOutstanding = parseFloat(activeSummary.rentOutstanding || '0');
  const expensesPaid = parseFloat(activeSummary.expensesPaid || '0');
  const netCashFlow = parseFloat(activeSummary.netCashFlow || '0');

  // Quarterly financial data (Once every 3 months cheque payments for 1-year contracts)
  const quarterlyData = [
    { quarter: 'Q1 (Jan - Mar)', rent: 53750, expenses: 6600, net: 47150, chequesCleared: '100%' },
    { quarter: 'Q2 (Apr - Jun)', rent: 53750, expenses: 7200, net: 46550, chequesCleared: '100%' },
    { quarter: 'Q3 (Jul - Sep)', rent: 53750, expenses: 5800, net: 47950, chequesCleared: '100%' },
    { quarter: 'Q4 (Oct - Dec)', rent: rentCollected || 53750, expenses: expensesPaid || 6600, net: netCashFlow || 47150, chequesCleared: '85%' },
  ];

  // SVG dimensions for Bar Chart
  const svgWidth = 560;
  const svgHeight = 220;
  const maxBarVal = 70000;

  return (
    <div>
      {/* Alert banner if rent is outstanding */}
      {rentOutstanding > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle color="#d97706" size={20} />
            <div>
              <span style={{ fontWeight: 700, color: '#92400e', fontSize: '14px' }}>
                Attention: Rent Cheques Pending
              </span>
              <p style={{ fontSize: '13px', color: '#b45309', margin: '2px 0 0 0' }}>
                You have AED {rentOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                in pending or overdue quarterly rent cheques.
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('rent')}>
            Review Cheques & Arrears
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">
            <span>Rent Collected</span>
            <Wallet size={16} color="#15803d" />
          </div>
          <div className="kpi-value positive">
            AED {rentCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <ArrowUpRight size={14} color="#15803d" />
            <span>Quarterly cheque collections</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Expenses Paid</span>
            <Receipt size={16} color="#dc2626" />
          </div>
          <div className="kpi-value">
            AED {expensesPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <ArrowDownRight size={14} color="#dc2626" />
            <span>Operating expenses</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Net Cash Flow</span>
            <TrendingUp size={16} color="#10b981" />
          </div>
          <div className={`kpi-value ${netCashFlow >= 0 ? 'positive' : 'negative'}`}>
            AED {netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <ArrowUpRight size={14} color="#10b981" />
            <span>Cheques cleared minus expenses</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Occupancy Rate</span>
            <Building2 size={16} color="#0284c7" />
          </div>
          <div className="kpi-value">{activeSummary.occupancyRate}%</div>
          <div className="kpi-subtext">
            <CheckCircle2 size={14} color="#0284c7" />
            <span>{activeSummary.occupiedUnits} of {activeSummary.totalUnits} units under 1-yr lease</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: Interactive SVG Financial & Cheque Status Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.85fr', gap: '24px', marginBottom: '24px', alignItems: 'stretch' }}>
        {/* Chart 1: Quarterly Collections vs Expenses Bar Chart */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#4f46e5" />
              <h3 className="card-title" style={{ margin: 0 }}>Quarterly Rent vs Expenses (Every 3 Months)</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#4f46e5', borderRadius: '2px' }} />
                Rent Cheques
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }} />
                Expenses
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#0284c7', borderRadius: '2px' }} />
                Net Margin
              </span>
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', width: '100%', height: '220px' }}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0, 20000, 40000, 60000].map((val, idx) => {
                  const y = svgHeight - 30 - (val / maxBarVal) * 160;
                  return (
                    <g key={idx}>
                      <line x1="45" y1={y} x2={svgWidth - 15} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="38" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                        {val === 0 ? '0' : `${val / 1000}k`}
                      </text>
                    </g>
                  );
                })}

                {/* Bar Groups: Symmetrically distributed across chart width */}
                {quarterlyData.map((d, i) => {
                  // groupX symmetrically distributes the 4 quarters between x=58 and x=530
                  const groupX = 58 + i * 140;
                  const rentH = (d.rent / maxBarVal) * 160;
                  const expH = (d.expenses / maxBarVal) * 160;
                  const isHovered = hoveredQuarter === i;

                  // Tooltip safe X positioning to avoid overflow
                  const tooltipX = Math.min(svgWidth - 126, Math.max(8, groupX + 26 - 61));

                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredQuarter(i)}
                      onMouseLeave={() => setHoveredQuarter(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Rent Bar */}
                      <rect
                        x={groupX}
                        y={svgHeight - 30 - rentH}
                        width="24"
                        height={rentH}
                        rx="4"
                        fill="url(#rentGradient)"
                        opacity={isHovered ? 1 : 0.9}
                      />
                      {/* Expense Bar */}
                      <rect
                        x={groupX + 28}
                        y={svgHeight - 30 - expH}
                        width="24"
                        height={expH}
                        rx="4"
                        fill="url(#expGradient)"
                        opacity={isHovered ? 1 : 0.85}
                      />

                      {/* Net Margin Marker Dot */}
                      <circle
                        cx={groupX + 26}
                        cy={svgHeight - 30 - ((d.net) / maxBarVal) * 160}
                        r={isHovered ? 5 : 4}
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />

                      {/* X-Axis Label */}
                      <text
                        x={groupX + 26}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        fontSize="11.5"
                        fontWeight={isHovered ? '700' : '600'}
                        fill={isHovered ? '#4f46e5' : '#475569'}
                      >
                        Q{i + 1}
                      </text>

                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <g>
                          <rect
                            x={tooltipX}
                            y={svgHeight - 30 - rentH - 45}
                            width="122"
                            height="40"
                            rx="6"
                            fill="#0f172a"
                            opacity="0.95"
                          />
                          <text x={tooltipX + 61} y={svgHeight - 30 - rentH - 30} textAnchor="middle" fontSize="10" fill="#e2e8f0">
                            Rent: AED {d.rent.toLocaleString()}
                          </text>
                          <text x={tooltipX + 61} y={svgHeight - 30 - rentH - 16} textAnchor="middle" fontSize="10" fill="#38bdf8" fontWeight="700">
                            Net: AED {d.net.toLocaleString()}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
              <span>Cycle: <strong style={{ color: '#0f172a' }}>1-Year Tenancy Contracts</strong></span>
              <span>Cadence: <strong style={{ color: '#0f172a' }}>Once Every 3 Months (4 Cheques)</strong></span>
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>PDC Clearance: <strong style={{ color: '#4f46e5' }}>94.2%</strong></span>
            </div>
          </div>
        </div>

        {/* Chart 2: 1-Year Cheques Clearance Status Donut Chart */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="#0284c7" />
              <h3 className="card-title" style={{ margin: 0 }}>PDC Cheques Clearance</h3>
            </div>
            <span className="badge badge-indigo" style={{ fontSize: '10.5px' }}>4-Cheque Cycle</span>
          </div>

          <div className="card-body" style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Center Donut Chart with clean, non-overlapping typography */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '175px' }}>
              <svg width="175" height="175" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="10" />

                {/* Cleared Cheques (75% / 238.76 circum) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#166534"
                  strokeWidth="10"
                  strokeDasharray="179 239"
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Upcoming 3-Month PDCs (17% / 40.59) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="10"
                  strokeDasharray="41 239"
                  strokeDashoffset="-179"
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />

                {/* Arrears / Pending Cheques (8% / 19.1) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="10"
                  strokeDasharray="19 239"
                  strokeDashoffset="-220"
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />

                {/* Center Text Readout: Perfectly fitted inside inner hole */}
                <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f172a">
                  75%
                </text>
                <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="700" letterSpacing="0.8">
                  CLEARED
                </text>
              </svg>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534', flexShrink: 0 }} />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Cleared Bank Cheques</span>
                </div>
                <strong style={{ color: '#166534' }}>AED 161,250 (75%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', flexShrink: 0 }} />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Upcoming 3-Month PDCs</span>
                </div>
                <strong style={{ color: '#0284c7' }}>AED 36,250 (17%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Pending / In Transit</span>
                </div>
                <strong style={{ color: '#dc2626' }}>AED 17,500 (8%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cheque Pipeline Bar (Every 3 Months Cheque Schedule) */}
      <div className="card" style={{ marginBottom: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={18} color="#4f46e5" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Quarterly Cheque Clearance Pipeline (Once Every 3 Months)
            </h4>
          </div>
          <span className="badge badge-indigo" style={{ fontSize: '11px' }}>4 Cheques per 1-Year Contract</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Q1 Cheques (Month 1)</span>
              <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>Cleared</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>AED 53,750.00</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>Emirates NBD & ADCB</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Q2 Cheques (Month 4)</span>
              <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>Cleared</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>AED 53,750.00</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>Emirates Islamic & DIB</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Q3 Cheques (Month 7)</span>
              <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>Cleared</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>AED 53,750.00</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>Mashreq & FAB</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>Q4 Cheques (Month 10)</span>
              <span className="badge badge-yellow" style={{ fontSize: '10px', padding: '2px 8px' }}>In Clearance</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#4f46e5' }}>AED 57,500.00</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>PDC cheques maturing</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity & Expense Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '24px', alignItems: 'stretch' }}>
        {/* Recent Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Transactions & Events</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('expenses')}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: '8px 16px', flex: 1 }}>
            {activeSummary.recentActivity.length === 0 ? (
              <div className="empty-state">No recent activity recorded.</div>
            ) : (
              activeSummary.recentActivity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 8px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {item.subtitle} • {item.date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13.5px',
                        color: item.amount?.startsWith('+') ? '#15803d' : '#0f172a',
                      }}
                    >
                      {item.amount}
                    </div>
                    <span
                      className={`badge ${item.status === 'success' || item.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}
                      style={{ fontSize: '10px', marginTop: '3px', display: 'inline-block' }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Expense Breakdown</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('expenses')}>
              Details
            </button>
          </div>
          <div className="card-body" style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {activeSummary.categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>
                No expenses logged in this period
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeSummary.categoryBreakdown.map((cat) => (
                  <div key={cat.categoryId} className="category-progress-item" style={{ marginBottom: 0 }}>
                    <div className="cat-prog-header" style={{ marginBottom: '6px' }}>
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '13px' }}>{cat.categoryName}</span>
                      <span style={{ color: '#475569', fontWeight: 600, fontSize: '12.5px' }}>
                        AED {parseFloat(cat.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="cat-bar-bg" style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        className="cat-bar-fill"
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                          backgroundColor: cat.color,
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Anchored summary footer matching the bottom of Recent Activity */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Total Operating Expenses</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                AED {expensesPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
