'use client';

import React, { useState } from 'react';
import { CircleDollarSign, Plus, AlertCircle, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import { RentCharge, Payment, Tenant, Property, Unit } from '@rental-saas/contracts';
import { TimeframeFilter, isDateInRange } from '../../lib/dateFilters';
import { TimeframeFilterBar } from '../TimeframeFilterBar';

interface RentPaymentsScreenProps {
  charges: RentCharge[];
  payments: Payment[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  timeframeFilter?: TimeframeFilter;
  onTimeframeChange?: (tf: TimeframeFilter) => void;
  onOpenRecordPayment: () => void;
  onEditCharge?: (charge: RentCharge) => void;
  onDeleteCharge?: (id: string) => Promise<void>;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (id: string) => Promise<void>;
}

export function RentPaymentsScreen({
  charges,
  payments,
  tenants,
  properties,
  units,
  timeframeFilter,
  onTimeframeChange,
  onOpenRecordPayment,
  onEditCharge,
  onDeleteCharge,
  onEditPayment,
  onDeletePayment,
}: RentPaymentsScreenProps) {
  const [activeTab, setActiveTab] = useState<'charges' | 'payments'>('charges');

  const filteredCharges = timeframeFilter
    ? charges.filter((c) => isDateInRange(c.dueDate, timeframeFilter.startDate, timeframeFilter.endDate))
    : charges;

  const filteredPayments = timeframeFilter
    ? payments.filter((p) => isDateInRange(p.paymentDate, timeframeFilter.startDate, timeframeFilter.endDate))
    : payments;

  const totalDue = filteredCharges.reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const totalPaid = filteredCharges.reduce((acc, c) => acc + parseFloat(c.paidAmount || '0'), 0);
  const totalOverdue = filteredCharges
    .filter((c) => c.status === 'overdue')
    .reduce((acc, c) => acc + parseFloat(c.outstandingAmount || '0'), 0);

  return (
    <div>
      {/* Top Controls */}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'charges' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('charges')}
          >
            Rent Due & Charges ({filteredCharges.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('payments')}
          >
            Payment Receipts ({filteredPayments.length})
          </button>
        </div>

        {timeframeFilter && onTimeframeChange && (
          <TimeframeFilterBar filter={timeframeFilter} onChange={onTimeframeChange} />
        )}

        <button id="record-rent-payment-btn" className="btn btn-primary btn-sm" onClick={onOpenRecordPayment}>
          <Plus size={14} />
          <span>+ Record Rent Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">
            <span>Total Rent Billed</span>
            <CircleDollarSign size={16} color="#0284c7" />
          </div>
          <div className="kpi-value">
            AED {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Collected to Date</span>
            <CheckCircle size={16} color="#15803d" />
          </div>
          <div className="kpi-value positive">
            AED {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Overdue Arrears</span>
            <AlertCircle size={16} color="#dc2626" />
          </div>
          <div className="kpi-value negative">
            AED {totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Charges Tab */}
      {activeTab === 'charges' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Rent Obligations & Due Dates</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Tenant</th>
                    <th>Property & Unit</th>
                    <th>Installment Amount</th>
                    <th>Paid</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCharges.map((c) => {
                    const tenant = tenants.find((t) => t.id === c.tenantId);
                    const prop = properties.find((p) => p.id === c.propertyId);
                    const unit = units.find((u) => u.id === c.unitId);

                    const statusClass =
                      c.status === 'paid'
                        ? 'badge-green'
                        : c.status === 'overdue'
                        ? 'badge-red'
                        : 'badge-yellow';

                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.dueDate}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {tenant?.fullName || 'Tenant'}
                        </td>
                        <td>
                          {prop?.name} {unit ? `• Unit ${unit.unitNumber}` : ''}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          AED {parseFloat(c.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ color: '#15803d', fontWeight: 600 }}>
                          AED {parseFloat(c.paidAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: 700, color: parseFloat(c.outstandingAmount || '0') > 0 ? '#dc2626' : '#64748b' }}>
                          AED {parseFloat(c.outstandingAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`}>{c.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {onEditCharge && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px' }}
                                title="Edit Charge"
                                onClick={() => onEditCharge(c)}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {onDeleteCharge && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', color: '#dc2626' }}
                                title="Delete Charge"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this rent charge record?')) {
                                    onDeleteCharge(c.id);
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recorded Rent Payments</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tenant</th>
                    <th>Method</th>
                    <th>Reference #</th>
                    <th>Amount Paid</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const tenant = tenants.find((t) => t.id === p.tenantId);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.paymentDate}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {tenant?.fullName || 'Tenant'}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {p.paymentMethod.replace('_', ' ')}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12.5px' }}>
                            {p.reference || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#15803d' }}>
                            AED {parseFloat(p.totalAmount || p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          {p.vatAmount && parseFloat(p.vatAmount) > 0 ? (
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                              Base: AED {parseFloat(p.subtotalAmount || p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} + {p.vatRate ?? 5}% VAT (AED {parseFloat(p.vatAmount).toFixed(2)})
                            </div>
                          ) : null}
                        </td>
                        <td style={{ fontSize: '12px', color: '#475569' }}>
                          {p.notes || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {onEditPayment && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px' }}
                                title="Edit Payment"
                                onClick={() => onEditPayment(p)}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {onDeletePayment && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', color: '#dc2626' }}
                                title="Delete Payment"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this payment record? This will adjust charge balances.')) {
                                    onDeletePayment(p.id);
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
