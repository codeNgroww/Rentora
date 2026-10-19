'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  FileText,
  Ban,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  PieChart,
  Building2,
  Home,
  Tag,
  Calendar,
  X,
} from 'lucide-react';
import { Expense, ExpenseCategory, Property, Unit } from '@rental-saas/contracts';
import { TimeframeFilter, isDateInRange } from '../../lib/dateFilters';

interface ExpensesScreenProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  properties: Property[];
  units: Unit[];
  period: string;
  timeframeFilter?: TimeframeFilter;
  onTimeframeChange?: (tf: TimeframeFilter) => void;
  onOpenAddModal: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => Promise<void>;
  onVoidExpense: (id: string, reason: string) => Promise<void>;
  onExportCsv: () => void;
}

export function ExpensesScreen({
  expenses,
  categories,
  properties,
  units,
  period,
  timeframeFilter,
  onTimeframeChange,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onVoidExpense,
  onExportCsv,
}: ExpensesScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [showVoided, setShowVoided] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  // Void Modal State
  const [voidingExpenseId, setVoidingExpenseId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);

  // Filter expenses
  const filtered = expenses.filter((e) => {
    if (timeframeFilter && !isDateInRange(e.expenseDate, timeframeFilter.startDate, timeframeFilter.endDate)) {
      return false;
    }
    if (!showVoided && e.status === 'voided') return false;
    if (selectedCategory !== 'all' && e.categoryId !== selectedCategory) return false;
    if (selectedProperty !== 'all' && e.propertyId !== selectedProperty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchRef = e.reference?.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      if (!matchDesc && !matchRef && !matchNotes) return false;
    }
    return true;
  });

  // Calculate KPIs
  const paidExpenses = filtered.filter((e) => e.status === 'paid');
  const totalPaidNum = paidExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const pendingNum = filtered
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Hardcoded revenue collected reference for October period for net income display
  const monthlyRevenue = 53750.0;
  const netIncome = monthlyRevenue - totalPaidNum;

  // Category breakdown
  const catTotals = new Map<string, number>();
  for (const exp of paidExpenses) {
    const cur = catTotals.get(exp.categoryId) || 0;
    catTotals.set(exp.categoryId, cur + parseFloat(exp.amount));
  }

  const categoryBreakdown = Array.from(catTotals.entries()).map(([catId, amount]) => {
    const cat = categories.find((c) => c.id === catId);
    return {
      id: catId,
      name: cat?.name || 'General',
      color: cat?.color || '#10b981',
      amount,
      percentage: totalPaidNum > 0 ? Math.round((amount / totalPaidNum) * 100) : 0,
    };
  });

  const handleConfirmVoid = async () => {
    if (!voidingExpenseId) return;
    setIsSubmittingVoid(true);
    try {
      await onVoidExpense(voidingExpenseId, voidReason || 'Voided by user request');
      setVoidingExpenseId(null);
      setVoidReason('');
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  return (
    <div>
      {/* Top Controls Bar */}
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
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Expense Records & Outflows</h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
            Showing operational expenditures for <strong>{timeframeFilter?.label || period}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button id="export-expenses-btn" className="btn btn-secondary btn-sm" onClick={onExportCsv}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button id="add-expense-screen-btn" className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
            <Plus size={14} />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">
            <span>Revenue Collected</span>
            <CheckCircle2 size={16} color="#15803d" />
          </div>
          <div className="kpi-value positive">
            AED {monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">Lease rent installments</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Total Expenses</span>
            <Clock size={16} color="#0284c7" />
          </div>
          <div className="kpi-value">
            AED {totalPaidNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            {pendingNum > 0 && `+ AED ${pendingNum.toFixed(2)} pending`}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Net Operating Income</span>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>AED</span>
          </div>
          <div className={`kpi-value ${netIncome >= 0 ? 'positive' : 'negative'}`}>
            AED {netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">Cash flow after expenses</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">
            <span>Total Entries</span>
            <FileText size={16} color="#64748b" />
          </div>
          <div className="kpi-value">{filtered.length}</div>
          <div className="kpi-subtext">{paidExpenses.length} paid, {filtered.length - paidExpenses.length} other</div>
        </div>
      </div>

      {/* By Category Horizontal Single-Line Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '115px' }}>
          <PieChart size={16} color="#4f46e5" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>By Category:</span>
        </div>

        {/* Horizontal Category Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid',
              borderColor: selectedCategory === 'all' ? '#4f46e5' : '#e2e8f0',
              background: selectedCategory === 'all' ? '#eef2ff' : '#f8fafc',
              color: selectedCategory === 'all' ? '#4338ca' : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <span>All Categories</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: selectedCategory === 'all' ? '#4338ca' : '#e2e8f0',
                color: selectedCategory === 'all' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '6px',
              }}
            >
              AED {totalPaidNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </button>

          {categoryBreakdown.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  border: '1px solid',
                  borderColor: isSelected ? cat.color : '#e2e8f0',
                  background: isSelected ? `${cat.color}15` : '#ffffff',
                  color: isSelected ? cat.color : '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                <span>{cat.name}</span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: isSelected ? cat.color : '#0f172a',
                  }}
                >
                  AED {cat.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  {cat.percentage}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Width Expense Records Table Card */}
      <div className="card" style={{ width: '100%' }}>
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <div>
            <h3 className="card-title">Expense Records</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Showing {filtered.length} of {expenses.length} recorded items
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={showVoided}
              onChange={(e) => setShowVoided(e.target.checked)}
            />
            <span>Show voided entries</span>
          </label>
        </div>

        <div className="card-body" style={{ padding: '20px' }}>
          {/* Filter controls */}
          <div className="filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
            <div className="search-input-wrap" style={{ flex: '1 1 280px' }}>
              <Search size={16} className="search-icon" />
              <input
                id="expenses-search-input"
                type="text"
                className="search-input"
                placeholder="Search description, invoice ref, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              id="filter-category-select"
              className="select-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              id="filter-property-select"
              className="select-filter"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expenses Table */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h4 className="empty-state-title">No expenses found</h4>
              <p className="empty-state-desc">
                No expense records match the selected filters for this timeframe.
              </p>
              <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
                + Add Expense
              </button>
            </div>
          ) : (
            <div className="table-responsive" style={{ border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ width: '110px', padding: '12px 16px' }}>Date</th>
                    <th style={{ width: '160px', padding: '12px 16px' }}>Category</th>
                    <th style={{ minWidth: '320px', padding: '12px 16px' }}>Description & Property</th>
                    <th style={{ width: '130px', padding: '12px 16px' }}>Paid Via</th>
                    <th style={{ width: '100px', padding: '12px 16px' }}>Status</th>
                    <th style={{ width: '140px', textAlign: 'right', padding: '12px 16px' }}>Amount</th>
                    <th style={{ width: '120px', textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp) => {
                    const cat = categories.find((c) => c.id === exp.categoryId);
                    const prop = properties.find((p) => p.id === exp.propertyId);
                    const unit = exp.unitId ? units.find((u) => u.id === exp.unitId) : null;
                    const isVoided = exp.status === 'voided';

                    return (
                      <tr key={exp.id} className={isVoided ? 'row-voided' : ''} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#334155', padding: '14px 16px' }}>
                          {exp.expenseDate}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className="badge"
                            style={{
                              background: `${cat?.color || '#10b981'}15`,
                              color: cat?.color || '#10b981',
                              border: `1px solid ${cat?.color || '#10b981'}30`,
                              fontWeight: 600,
                              fontSize: '11.5px',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat?.color || '#10b981' }} />
                            <span>{cat?.name || 'General'}</span>
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: isVoided ? '#94a3b8' : '#0f172a', fontSize: '13.5px' }}>
                            {exp.description}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {prop && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#64748b' }}>
                                <Building2 size={12} color="#94a3b8" />
                                <span>{prop.name}</span>
                              </span>
                            )}
                            {unit && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#64748b' }}>
                                <Home size={12} color="#94a3b8" />
                                <span>Unit {unit.unitNumber}</span>
                              </span>
                            )}
                            {exp.reference && (
                              <span style={{ fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                Ref: {exp.reference}
                              </span>
                            )}
                          </div>
                          {isVoided && exp.voidReason && (
                            <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', marginTop: '3px' }}>
                              Voided reason: {exp.voidReason}
                            </div>
                          )}
                        </td>
                        <td style={{ textTransform: 'capitalize', whiteSpace: 'nowrap', padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 500,
                              color: '#475569',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {exp.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', padding: '14px 16px' }}>
                          {isVoided ? (
                            <span className="badge badge-red" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              <Ban size={11} />
                              <span>Voided</span>
                            </span>
                          ) : exp.status === 'paid' ? (
                            <span className="badge badge-green" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              <CheckCircle2 size={11} />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="badge badge-yellow" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              <Clock size={11} />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', padding: '14px 16px' }}>
                          <span style={{ fontSize: '14px', color: isVoided ? '#94a3b8' : '#0f172a' }}>
                            AED {parseFloat(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '14px 16px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {!isVoided && onEditExpense && (
                              <button
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '5px 8px', borderRadius: '6px' }}
                                title="Edit expense"
                                onClick={() => onEditExpense(exp)}
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            {!isVoided && (
                              <button
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '5px 8px', color: '#ef4444', borderColor: '#fee2e2', borderRadius: '6px' }}
                                title="Void expense"
                                onClick={() => setVoidingExpenseId(exp.id)}
                              >
                                <Ban size={12} />
                              </button>
                            )}
                            {onDeleteExpense && (
                              <button
                                className="btn btn-sm"
                                style={{ padding: '5px 8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px' }}
                                title="Delete expense"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete expense: "${exp.description}"?`)) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                              >
                                <Trash2 size={12} />
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
          )}

          {/* Table summary footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12.5px', color: '#64748b' }}>
            <span>Showing {filtered.length} expense entries</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Total Paid: <strong style={{ color: '#0f172a' }}>AED {totalPaidNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
              {pendingNum > 0 && <span>Pending: <strong style={{ color: '#d97706' }}>AED {pendingNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      {/* Void Reason Modal */}
      {voidingExpenseId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Void Expense</h3>
              <button className="modal-close" onClick={() => setVoidingExpenseId(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                <AlertTriangle color="#ef4444" size={24} />
                <p style={{ fontSize: '13.5px', color: '#475569' }}>
                  Voiding this expense will retain it in the audit trail but exclude its amount from active financial totals.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Voiding *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Duplicate entry, incorrect amount, cancelled invoice"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setVoidingExpenseId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isSubmittingVoid}
                onClick={handleConfirmVoid}
              >
                {isSubmittingVoid ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
