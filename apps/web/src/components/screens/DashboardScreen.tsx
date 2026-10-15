'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
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
  Clock,
} from 'lucide-react';
import { DashboardSummary } from '@rental-saas/contracts';

interface DashboardScreenProps {
  summary: DashboardSummary | null;
  onNavigate: (tab: string) => void;
}

export function DashboardScreen({ summary, onNavigate }: DashboardScreenProps) {
  const [hoveredQuarter, setHoveredQuarter] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  if (!summary) {
    return <div className="empty-state">Loading dashboard portfolio data...</div>;
  }

  const rentCollected = parseFloat(summary.rentCollected || '0');
  const rentOutstanding = parseFloat(summary.rentOutstanding || '0');
  const expensesPaid = parseFloat(summary.expensesPaid || '0');
  const netCashFlow = parseFloat(summary.netCashFlow || '0');

  // Quarterly financial data (Once every 3 months cheque payments for 1-year contracts)
  const quarterlyData = [
    { quarter: 'Q1 (Jan - Mar)', rent: 53750, expenses: 6600, net: 47150, chequesCleared: '100%' },
    { quarter: 'Q2 (Apr - Jun)', rent: 53750, expenses: 7200, net: 46550, chequesCleared: '100%' },
    { quarter: 'Q3 (Jul - Sep)', rent: 53750, expenses: 5800, net: 47950, chequesCleared: '100%' },
    { quarter: 'Q4 (Oct - Dec)', rent: rentCollected || 53750, expenses: expensesPaid || 6600, net: netCashFlow || 47150, chequesCleared: '85%' },
  ];

  // Donut chart segments for 3-month PDC cheques portfolio
  const totalChequesValue = 215000;
  const clearedChequesVal = 161250; // 75%
  const pendingChequesVal = 36250;  // 17%
  const overdueChequesVal = 17500;  // 8%

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
              <p style={{ fontSize: '13px', color: '#b45309' }}>
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
          <div className="kpi-subtext">Cheques cleared minus expenses</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Occupancy Rate</span>
            <Building2 size={16} color="#0284c7" />
          </div>
          <div className="kpi-value">{summary.occupancyRate}%</div>
          <div className="kpi-subtext">
            {summary.occupiedUnits} of {summary.totalUnits} units under 1-yr lease
          </div>
        </div>
      </div>

      {/* CHARTS ROW: Interactive SVG Financial & Cheque Status Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.85fr', gap: '24px', marginBottom: '24px' }}>
        {/* Chart 1: Quarterly Collections vs Expenses Bar Chart */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#4f46e5" />
              <h3 className="card-title">Quarterly Rent vs Expenses (Every 3 Months)</h3>
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

          <div className="card-body" style={{ padding: '20px 24px' }}>
            <div style={{ position: 'relative', width: '100%', height: '230px' }}>
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
                      <line x1="45" y1={y} x2={svgWidth - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="38" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                        {val === 0 ? '0' : `${val / 1000}k`}
                      </text>
                    </g>
                  );
                })}

                {/* Bar Groups */}
                {quarterlyData.map((d, i) => {
                  const groupX = 75 + i * 120;
                  const rentH = (d.rent / maxBarVal) * 160;
                  const expH = (d.expenses / maxBarVal) * 160;
                  const isHovered = hoveredQuarter === i;

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
                            x={groupX - 35}
                            y={svgHeight - 30 - rentH - 45}
                            width="122"
                            height="40"
                            rx="6"
                            fill="#0f172a"
                            opacity="0.95"
                          />
                          <text x={groupX + 26} y={svgHeight - 30 - rentH - 30} textAnchor="middle" fontSize="10" fill="#e2e8f0">
                            Rent: AED {d.rent.toLocaleString()}
                          </text>
                          <text x={groupX + 26} y={svgHeight - 30 - rentH - 16} textAnchor="middle" fontSize="10" fill="#38bdf8" fontWeight="700">
                            Net: AED {d.net.toLocaleString()}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
              <span>Cycle: <strong>1-Year Tenancy Contracts</strong></span>
              <span>Cadence: <strong>Once Every 3 Months (4 Cheques)</strong></span>
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>PDC Cheque Clearance Rate: <strong>94.2%</strong></span>
            </div>
          </div>
        </div>

        {/* Chart 2: 1-Year Cheques Clearance Status Donut Chart */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="#0284c7" />
              <h3 className="card-title">PDC Cheques Clearance</h3>
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '170px' }}>
              <svg width="170" height="170" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="13" />

                {/* Cleared Cheques (75% / 238.76 circum) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#166534"
                  strokeWidth="13"
                  strokeDasharray="179 239"
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Upcoming 3-Month PDCs (17% / 40.59) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="13"
                  strokeDasharray="41 239"
                  strokeDashoffset="-179"
                  transform="rotate(-90 50 50)"
                />

                {/* Arrears / Pending Cheques (8% / 19.1) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="13"
                  strokeDasharray="19 239"
                  strokeDashoffset="-220"
                  transform="rotate(-90 50 50)"
                />

                {/* Center Text Readout */}
                <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
                  75%
                </text>
                <text x="50" y="60" textAnchor="middle" fontSize="7.5" fill="#64748b" fontWeight="600">
                  CHEQUES CLEARED
                </text>
              </svg>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#166534' }} />
                  <span style={{ color: '#334155' }}>Cleared Bank Cheques</span>
                </div>
                <strong style={{ color: '#166534' }}>AED 161,250 (75%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }} />
                  <span style={{ color: '#334155' }}>Upcoming 3-Month PDCs</span>
                </div>
                <strong style={{ color: '#0284c7' }}>AED 36,250 (17%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
                  <span style={{ color: '#334155' }}>Pending / In Transit</span>
                </div>
                <strong style={{ color: '#dc2626' }}>AED 17,500 (8%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cheque Pipeline Bar (Every 3 Months Cheque Schedule) */}
      <div className="card" style={{ marginBottom: '24px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={18} color="#166534" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Quarterly Cheque Clearance Pipeline (Once Every 3 Months)
            </h4>
          </div>
          <span className="badge badge-green">4 Cheques per 1-Year Contract</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Q1 Cheques (Month 1)</span>
              <span className="badge badge-green" style={{ fontSize: '10px' }}>Cleared</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>AED 53,750.00</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Emirates NBD & ADCB cheques</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Q2 Cheques (Month 4)</span>
              <span className="badge badge-green" style={{ fontSize: '10px' }}>Cleared</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>AED 53,750.00</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Emirates Islamic & DIB cheques</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Q3 Cheques (Month 7)</span>
              <span className="badge badge-green" style={{ fontSize: '10px' }}>Cleared</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>AED 53,750.00</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Mashreq & FAB cheques</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', boxShadow: '0 2px 6px rgba(22,101,52,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Q4 Cheques (Month 10)</span>
              <span className="badge badge-yellow" style={{ fontSize: '10px' }}>In Clearance</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d' }}>AED 57,500.00</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>PDC Cheques maturing this quarter</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity & Expense Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions & Events</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('expenses')}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {summary.recentActivity.length === 0 ? (
              <div className="empty-state">No recent activity recorded.</div>
            ) : (
              summary.recentActivity.map((item) => (
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
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
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
                      style={{ fontSize: '10.5px' }}
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
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expense Breakdown</h3>
          </div>
          <div className="card-body">
            {summary.categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>
                No expenses logged in this period
              </div>
            ) : (
              summary.categoryBreakdown.map((cat) => (
                <div key={cat.categoryId} className="category-progress-item">
                  <div className="cat-prog-header">
                    <span style={{ color: '#0f172a' }}>{cat.categoryName}</span>
                    <span style={{ color: '#64748b' }}>
                      AED {parseFloat(cat.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="cat-bar-bg">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

