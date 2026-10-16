'use client';

import React from 'react';
import { Download, FileSpreadsheet, Building2, AlertTriangle } from 'lucide-react';
import { FinancialReportSummary, RentArrearsItem } from '@rental-saas/contracts';
import { TimeframeFilter } from '../../lib/dateFilters';
import { TimeframeFilterBar } from '../TimeframeFilterBar';

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
  return (
    <div>
      {/* Top Header */}
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
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Financial Reports & Portfolio Statements
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Auditable cash flow, property profitability, and rent arrears reports.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {timeframeFilter && onTimeframeChange && (
            <TimeframeFilterBar filter={timeframeFilter} onChange={onTimeframeChange} />
          )}
          <button
            id="export-financial-csv-btn"
            className="btn btn-secondary btn-sm"
            onClick={() => onExportCsv('expenses')}
          >
            <Download size={14} />
            <span>Export Expenses CSV</span>
          </button>
        </div>
      </div>

      {/* Property Profitability Statement Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Property-Level Financial Performance ({summary?.periodLabel || timeframeFilter?.label || '2026'})
          </h3>
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

      {/* Rent Arrears Aging Report */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Rent Arrears & Aging Report</h3>
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
  );
}
