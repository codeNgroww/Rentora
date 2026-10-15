'use client';

import React, { useState } from 'react';
import { CircleDollarSign, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { RentCharge, Payment, Tenant, Property, Unit } from '@rental-saas/contracts';

interface RentPaymentsScreenProps {
  charges: RentCharge[];
  payments: Payment[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  onOpenRecordPayment: () => void;
}

export function RentPaymentsScreen({
  charges,
  payments,
  tenants,
  properties,
  units,
  onOpenRecordPayment,
}: RentPaymentsScreenProps) {
  const [activeTab, setActiveTab] = useState<'charges' | 'payments'>('charges');

  const totalDue = charges.reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const totalPaid = charges.reduce((acc, c) => acc + parseFloat(c.paidAmount || '0'), 0);
  const totalOverdue = charges
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
            Rent Due & Charges ({charges.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('payments')}
          >
            Payment Receipts ({payments.length})
          </button>
        </div>

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
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => {
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
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
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
