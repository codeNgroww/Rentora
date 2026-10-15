'use client';

import React, { useState } from 'react';
import { History, Shield, Clock, ArrowRight, Code, CheckCircle, AlertTriangle, FileText, User, DollarSign } from 'lucide-react';
import { AuditLogItem, Tenant, Property, Unit } from '@rental-saas/contracts';

interface AuditScreenProps {
  logs: AuditLogItem[];
  tenants?: Tenant[];
  properties?: Property[];
  units?: Unit[];
}

export function AuditScreen({ logs, tenants = [], properties = [], units = [] }: AuditScreenProps) {
  const [expandedRawLogs, setExpandedRawLogs] = useState<Record<string, boolean>>({});

  const toggleRaw = (id: string) => {
    setExpandedRawLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to translate field names to plain English
  const formatFieldName = (key: string): string => {
    const map: Record<string, string> = {
      amount: 'Amount',
      tenantId: 'Tenant',
      propertyId: 'Property',
      unitId: 'Unit Number',
      status: 'Status',
      description: 'Description',
      reason: 'Reason for Cancellation',
      paymentMethod: 'Payment Method',
      annualRent: 'Annual Rent',
      securityDeposit: 'Security Deposit',
      notes: 'Notes',
      vatAmount: 'VAT (5%)',
      totalAmount: 'Total Amount',
    };
    return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  };

  // Helper to format values nicely
  const formatValue = (key: string, val: any): string => {
    if (val === null || val === undefined) return 'None';
    if (key === 'tenantId') {
      const tenant = tenants.find((t) => t.id === val);
      return tenant ? tenant.fullName : `Tenant (${val})`;
    }
    if (key === 'propertyId') {
      const prop = properties.find((p) => p.id === val);
      return prop ? prop.name : `Property (${val})`;
    }
    if (key === 'unitId') {
      const unit = units.find((u) => u.id === val);
      return unit ? `Unit ${unit.unitNumber}` : `Unit (${val})`;
    }
    if (['amount', 'annualRent', 'securityDeposit', 'totalAmount', 'vatAmount', 'subtotalAmount'].includes(key)) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        return `AED ${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
    }
    if (key === 'status') {
      return String(val).toUpperCase();
    }
    if (key === 'paymentMethod') {
      return String(val).replace('_', ' ').toUpperCase();
    }
    return String(val);
  };

  // Generate a plain English headline for the common man
  const getHumanHeadline = (log: AuditLogItem): { text: string; icon: string } => {
    const changes = log.changes || {};
    const amountVal = changes.amount?.after || changes.amount?.before;
    const descVal = changes.description?.after;
    const reasonVal = changes.reason?.after || changes.reason?.before;

    if (log.action.includes('PAYMENT_RECORDED')) {
      const tenantName = changes.tenantId?.after ? formatValue('tenantId', changes.tenantId.after) : '';
      const amtStr = amountVal ? formatValue('amount', amountVal) : '';
      return {
        text: `Recorded rent payment of ${amtStr}${tenantName ? ` for ${tenantName}` : ''}`,
        icon: '💰',
      };
    }

    if (log.action.includes('EXPENSE_CREATED')) {
      const amtStr = amountVal ? formatValue('amount', amountVal) : '';
      return {
        text: `Created new expense${descVal ? ` "${descVal}"` : ''}${amtStr ? ` for ${amtStr}` : ''}`,
        icon: '📄',
      };
    }

    if (log.action.includes('EXPENSE_VOIDED') || log.action.includes('VOID')) {
      return {
        text: `Cancelled / voided expense${reasonVal ? ` (Reason: ${reasonVal})` : ''}`,
        icon: '🚫',
      };
    }

    if (log.action.includes('LEASE')) {
      return {
        text: `Issued 1-year tenancy contract agreement`,
        icon: '📑',
      };
    }

    return {
      text: `${log.action.replace(/_/g, ' ')} on ${log.entity}`,
      icon: 'ℹ️',
    };
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Security & Financial Audit Trail
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Clear, transparent history of all actions, payments, and expenses.
        </p>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Activity & Change History</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Plain English explanation of who made changes and what was updated.
            </p>
          </div>
          <span className="badge badge-green" style={{ fontSize: '11px' }}>
            {logs.length} Logged Events
          </span>
        </div>

        <div className="card-body">
          {logs.length === 0 ? (
            <div className="empty-state">No audit logs recorded yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>Date & Time</th>
                    <th style={{ width: '150px' }}>User / Actor</th>
                    <th style={{ width: '150px' }}>Action Type</th>
                    <th>Change Details (Plain English)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const headline = getHumanHeadline(log);
                    const changes = log.changes || {};
                    const changeEntries = Object.entries(changes);
                    const isRawOpen = expandedRawLogs[log.id];

                    return (
                      <tr key={log.id} style={{ verticalAlign: 'top' }}>
                        {/* Timestamp */}
                        <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {log.timestamp.slice(0, 10)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {log.timestamp.slice(11, 19)} UTC
                          </div>
                        </td>

                        {/* Actor */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                            {log.actorName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {log.entity} #{log.entityId.slice(0, 8)}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td>
                          <span
                            className={`badge ${
                              log.action.includes('VOID')
                                ? 'badge-red'
                                : log.action.includes('PAYMENT')
                                ? 'badge-green'
                                : 'badge-blue'
                            }`}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Human Understandable Change Details */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Summary Headline */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 600,
                                fontSize: '13px',
                                color: '#0f172a',
                              }}
                            >
                              <span>{headline.icon}</span>
                              <span>{headline.text}</span>
                            </div>

                            {/* Clean Human-Friendly Key-Value Pills */}
                            {changeEntries.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                }}
                              >
                                {changeEntries.map(([field, delta]: [string, any]) => {
                                  const label = formatFieldName(field);
                                  const beforeStr = delta?.before !== null && delta?.before !== undefined ? formatValue(field, delta.before) : null;
                                  const afterStr = delta?.after !== null && delta?.after !== undefined ? formatValue(field, delta.after) : null;

                                  // If updated from old to new
                                  if (beforeStr && afterStr && beforeStr !== afterStr) {
                                    return (
                                      <div
                                        key={field}
                                        style={{
                                          fontSize: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          padding: '3px 8px',
                                        }}
                                      >
                                        <span style={{ color: '#64748b' }}>{label}:</span>
                                        <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{beforeStr}</span>
                                        <ArrowRight size={12} color="#166534" />
                                        <strong style={{ color: '#166534' }}>{afterStr}</strong>
                                      </div>
                                    );
                                  }

                                  // If new field set
                                  if (afterStr) {
                                    return (
                                      <div
                                        key={field}
                                        style={{
                                          fontSize: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          padding: '3px 8px',
                                        }}
                                      >
                                        <span style={{ color: '#64748b' }}>{label}:</span>
                                        <strong style={{ color: '#0f172a' }}>{afterStr}</strong>
                                      </div>
                                    );
                                  }

                                  return null;
                                })}
                              </div>
                            )}

                            {/* Optional Technical Raw JSON view */}
                            <div>
                              <button
                                type="button"
                                onClick={() => toggleRaw(log.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#64748b',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Code size={11} />
                                <span>{isRawOpen ? 'Hide raw JSON data' : 'View raw technical data'}</span>
                              </button>

                              {isRawOpen && (
                                <pre
                                  style={{
                                    fontSize: '11px',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    marginTop: '6px',
                                    maxWidth: '480px',
                                    overflowX: 'auto',
                                  }}
                                >
                                  {JSON.stringify(log.changes || {}, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
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
  );
}

