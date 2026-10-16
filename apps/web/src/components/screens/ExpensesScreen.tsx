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
} from 'lucide-react';
import { Expense, ExpenseCategory, Property, Unit } from '@rental-saas/contracts';

interface ExpensesScreenProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  properties: Property[];
  units: Unit[];
  period: string;
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
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('yearly')}
          >
            Yearly
          </button>
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

      {/* Main Grid: Left Table, Right Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Left Column: Filter & Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expense Records</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showVoided}
                onChange={(e) => setShowVoided(e.target.checked)}
              />
              <span>Show voided</span>
            </label>
          </div>

          <div className="card-body">
            {/* Filter controls */}
            <div className="filter-bar">
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input
                  id="expenses-search-input"
                  type="text"
                  className="search-input"
                  placeholder="Search description, reference, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                id="filter-category-select"
                className="select-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
                  No expense records match the selected filters. Add a new expense to get started.
                </p>
                <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
                  + Add Expense
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Paid Via</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((exp) => {
                      const cat = categories.find((c) => c.id === exp.categoryId);
                      const prop = properties.find((p) => p.id === exp.propertyId);
                      const unit = exp.unitId ? units.find((u) => u.id === exp.unitId) : null;
                      const isVoided = exp.status === 'voided';

                      return (
                        <tr key={exp.id} className={isVoided ? 'row-voided' : ''}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {exp.expenseDate}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: `${cat?.color || '#10b981'}18`,
                                color: cat?.color || '#10b981',
                                border: `1px solid ${cat?.color || '#10b981'}33`,
                              }}
                            >
                              {cat?.name || 'General'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.description}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {prop?.name} {unit ? `• Unit ${unit.unitNumber}` : ''}
                              {exp.reference ? ` • Ref: ${exp.reference}` : ''}
                            </div>
                            {isVoided && exp.voidReason && (
                              <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', marginTop: '2px' }}>
                                Voided: {exp.voidReason}
                              </div>
                            )}
                          </td>
                          <td style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>
                              {exp.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '14px', color: isVoided ? '#94a3b8' : '#0f172a' }}>
                              AED {parseFloat(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {!isVoided && onEditExpense && (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 7px' }}
                                  title="Edit expense"
                                  onClick={() => onEditExpense(exp)}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {!isVoided ? (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 7px', color: '#ef4444', borderColor: '#fee2e2' }}
                                  title="Void expense"
                                  onClick={() => setVoidingExpenseId(exp.id)}
                                >
                                  <Ban size={12} />
                                  <span>Void</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Voided</span>
                              )}
                              {onDeleteExpense && (
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '4px 7px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                                  title="Delete expense"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to permanently delete this expense: "${exp.description}"?`)) {
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
          </div>
        </div>

        {/* Right Column: Category Breakdown */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">By Category</h3>
            </div>
            <div className="card-body">
              {categoryBreakdown.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                  No category data for period
                </div>
              ) : (
                categoryBreakdown.map((cat) => (
                  <div key={cat.id} className="category-progress-item">
                    <div className="cat-prog-header">
                      <span style={{ color: '#0f172a' }}>{cat.name}</span>
                      <span style={{ color: '#64748b' }}>
                        AED {cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
