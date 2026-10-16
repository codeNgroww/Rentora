'use client';

import React, { useState } from 'react';
import { Property, Unit, Tenant, PaymentFrequency, Lease } from '@rental-saas/contracts';

interface AddLeaseModalProps {
  lease?: Lease | null;
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export interface EditableCheque {
  id: number;
  label: string;
  dueDate: string;
  amount: string;
  chequeNumber: string;
  bankName: string;
}

export function AddLeaseModal({
  lease,
  properties,
  units,
  tenants,
  onClose,
  onSubmit,
}: AddLeaseModalProps) {
  const [propertyId, setPropertyId] = useState(lease?.propertyId || properties[0]?.id || '');

  // Available units for the selected property (vacant units + units already in this lease if editing)
  const availableUnits = units.filter(
    (u) =>
      u.propertyId === propertyId &&
      (u.status === 'vacant' ||
        u.id === lease?.unitId ||
        (lease?.unitIds && lease.unitIds.includes(u.id)))
  );

  // Tenant can lease one or multiple units under their name
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(() => {
    if (lease?.unitIds && lease.unitIds.length > 0) return lease.unitIds;
    if (lease?.unitId) return [lease.unitId];
    return availableUnits[0] ? [availableUnits[0].id] : [];
  });

  const [tenantId, setTenantId] = useState(lease?.tenantId || tenants[0]?.id || '');
  const [startDate, setStartDate] = useState(lease?.startDate || '2026-11-01');
  const [endDate, setEndDate] = useState(lease?.endDate || '2027-10-31');
  const [annualRent, setAnnualRent] = useState(lease?.annualRent || '100000.00');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    lease?.paymentFrequency || 'quarterly'
  );
  const [numberOfCheques, setNumberOfCheques] = useState(lease?.numberOfCheques || 4);
  const [securityDeposit, setSecurityDeposit] = useState(lease?.securityDeposit || '5000.00');
  const [termsNotes, setTermsNotes] = useState(lease?.termsNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to generate default cheques based on frequency and dates
  const generateDefaultCheques = (
    start: string,
    totalRent: number,
    count: number
  ): EditableCheque[] => {
    const n = count > 0 ? count : 4;
    const installmentBase = totalRent > 0 ? totalRent / n : 0;
    const vatRate = 5;
    const withVat = installmentBase + (installmentBase * vatRate) / 100;
    const defaultAmount = withVat.toFixed(2);

    const [y, m, d] = (start || '2026-11-01').split('-').map(Number);
    const monthsPerInstallment = Math.max(1, Math.round(12 / n));

    return Array.from({ length: n }).map((_, i) => {
      const chargeDate = new Date(y, (m || 11) - 1 + i * monthsPerInstallment, d || 1);
      const dateStr = chargeDate.toISOString().slice(0, 10);
      const monthNum = i * monthsPerInstallment + 1;
      return {
        id: i + 1,
        label: `Cheque ${i + 1} (Month ${monthNum})`,
        dueDate: dateStr,
        amount: defaultAmount,
        chequeNumber: ``,
        bankName: ``,
      };
    });
  };

  // Editable Cheques state
  const [cheques, setCheques] = useState<EditableCheque[]>(() => {
    if (lease?.cheques && lease.cheques.length > 0) {
      return lease.cheques.map((c, i) => ({
        id: i + 1,
        label: `Cheque ${i + 1}`,
        dueDate: c.dueDate,
        amount: c.amount,
        chequeNumber: c.chequeNumber || '',
        bankName: c.bankName || '',
      }));
    }
    return generateDefaultCheques(
      lease?.startDate || '2026-11-01',
      parseFloat(lease?.annualRent || '100000.00'),
      lease?.numberOfCheques || 4
    );
  });

  const calculateYearlyEndDate = (startStr: string) => {
    if (!startStr) return '';
    const [y, m, d] = startStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setFullYear(date.getFullYear() + 1);
    date.setDate(date.getDate() - 1);
    const endY = date.getFullYear();
    const endM = String(date.getMonth() + 1).padStart(2, '0');
    const endD = String(date.getDate()).padStart(2, '0');
    return `${endY}-${endM}-${endD}`;
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setEndDate(calculateYearlyEndDate(val));
    // Update due dates for cheques proportionally if user hasn't heavily customized
    const r = parseFloat(annualRent) || 0;
    setCheques(generateDefaultCheques(val, r, numberOfCheques));
  };

  const handleAnnualRentChange = (val: string) => {
    setAnnualRent(val);
    const r = parseFloat(val) || 0;
    if (r > 0) {
      setSecurityDeposit(((r * 5) / 100).toFixed(2));
      setCheques(generateDefaultCheques(startDate, r, numberOfCheques));
    }
  };

  const handleNumberOfChequesChange = (count: number) => {
    const n = Math.max(1, Math.min(12, count || 1));
    setNumberOfCheques(n);
    const r = parseFloat(annualRent) || 0;
    setCheques(generateDefaultCheques(startDate, r, n));
  };

  const handleUpdateCheque = (index: number, field: keyof EditableCheque, value: string) => {
    setCheques((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetCheques = () => {
    const r = parseFloat(annualRent) || 0;
    setCheques(generateDefaultCheques(startDate, r, numberOfCheques));
  };

  const handleToggleUnit = (uId: string) => {
    let updated: string[];
    if (selectedUnitIds.includes(uId)) {
      if (selectedUnitIds.length === 1) {
        // Keep at least 1 unit selected
        return;
      }
      updated = selectedUnitIds.filter((id) => id !== uId);
    } else {
      updated = [...selectedUnitIds, uId];
    }
    setSelectedUnitIds(updated);

    // Auto-sum rent if multiple units selected
    const sumRent = updated.reduce((acc, id) => {
      const u = units.find((x) => x.id === id);
      return acc + (u ? parseFloat(u.marketRent || '0') : 0);
    }, 0);

    if (sumRent > 0) {
      setAnnualRent(sumRent.toFixed(2));
      setSecurityDeposit(((sumRent * 5) / 100).toFixed(2));
      setCheques(generateDefaultCheques(startDate, sumRent, numberOfCheques));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || selectedUnitIds.length === 0 || !tenantId || !startDate || !endDate || !annualRent) {
      setErrorMsg('Please select at least one unit and complete all required lease fields.');
      return;
    }

    const rentNum = parseFloat(annualRent) || 0;
    if (isNaN(rentNum) || rentNum <= 0) {
      setErrorMsg('Annual rent must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        propertyId,
        unitId: selectedUnitIds[0],
        unitIds: selectedUnitIds,
        tenantId,
        startDate,
        endDate,
        annualRent: rentNum.toFixed(2),
        paymentFrequency,
        numberOfCheques: Number(numberOfCheques),
        securityDeposit: parseFloat(securityDeposit || '0').toFixed(2),
        termsNotes: termsNotes || null,
        cheques: cheques.map((c) => ({
          chequeNumber: c.chequeNumber || undefined,
          dueDate: c.dueDate,
          amount: parseFloat(c.amount || '0').toFixed(2),
          bankName: c.bankName || undefined,
          notes: `${c.label} ${c.bankName ? `(${c.bankName})` : ''} ${c.chequeNumber ? `CHQ #${c.chequeNumber}` : ''}`.trim(),
        })),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (lease ? 'Failed to update lease contract' : 'Failed to create lease contract'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{lease ? 'Edit Lease Agreement' : 'Create Lease Agreement'}</h3>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Standard UAE Yearly Tenancy Agreement with Cheque PDC Schedule
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Property Selector */}
            <div className="form-group">
              <label className="form-label">Property *</label>
              <select
                className="form-control"
                value={propertyId}
                onChange={(e) => {
                  const newPropId = e.target.value;
                  setPropertyId(newPropId);
                  const newUnits = units.filter(
                    (u) => u.propertyId === newPropId && u.status === 'vacant'
                  );
                  setSelectedUnitIds(newUnits[0] ? [newUnits[0].id] : []);
                  if (newUnits[0]) {
                    const r = parseFloat(newUnits[0].marketRent || '0');
                    if (r > 0) {
                      setAnnualRent(r.toFixed(2));
                      setSecurityDeposit(((r * 5) / 100).toFixed(2));
                      setCheques(generateDefaultCheques(startDate, r, numberOfCheques));
                    }
                  }
                }}
                required
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.emirate})
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Unit Selector: One tenant can have multiple units under his name */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Leased Unit(s) * ({selectedUnitIds.length} selected)
                </label>
                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                  ✓ One tenant can lease multiple units
                </span>
              </div>

              <div
                style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  padding: '4px',
                }}
              >
                {availableUnits.length === 0 ? (
                  <div style={{ padding: '10px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                    No vacant units currently available in this property.
                  </div>
                ) : (
                  availableUnits.map((u) => {
                    const isSelected = selectedUnitIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleUnit(u.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          background: isSelected ? '#f0f9ff' : 'transparent',
                          border: isSelected ? '1px solid #bae6fd' : '1px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '2px',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled via parent div click
                            style={{ accentColor: '#0284c7', width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '13px', color: '#0f172a' }}>
                            Unit {u.unitNumber} {u.type === 'commercial' || u.isShop ? '• Commercial' : `• ${u.bedrooms} Bed`}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                          AED {parseFloat(u.marketRent).toLocaleString()} / yr
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedUnitIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedUnitIds.map((id) => {
                    const u = units.find((x) => x.id === id);
                    if (!u) return null;
                    return (
                      <span
                        key={id}
                        className="badge badge-blue"
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        Unit {u.unitNumber} ({u.type === 'commercial' || u.isShop ? 'Commercial' : `${u.bedrooms} Bed`})
                        {selectedUnitIds.length > 1 && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleToggleUnit(id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0369a1',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tenant Selector */}
            <div className="form-group">
              <label className="form-label">Tenant *</label>
              <select
                className="form-control"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.phoneNumber || t.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Dates */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Contract Start Date *</span>
                  <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>1-Year Term</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contract End Date * (1 Year)</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Annual Rent & Security Deposit */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Annual Rent (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  value={annualRent}
                  onChange={(e) => handleAnnualRentChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Security Deposit (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Cadence & Cheques Count */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Cadence (UAE Cheques)</label>
                <select
                  className="form-control"
                  value={paymentFrequency}
                  onChange={(e) => {
                    const freq = e.target.value as PaymentFrequency;
                    setPaymentFrequency(freq);
                    let count = 4;
                    if (freq === 'quarterly') count = 4;
                    else if (freq === 'semi-annual') count = 2;
                    else if (freq === 'annual') count = 1;
                    else if (freq === 'monthly') count = 12;
                    handleNumberOfChequesChange(count);
                  }}
                >
                  <option value="quarterly">Quarterly (Once Every 3 Months - 4 Cheques)</option>
                  <option value="semi-annual">Semi-Annual (Every 6 Months - 2 Cheques)</option>
                  <option value="annual">Single Annual Payment (1 Cheque)</option>
                  <option value="monthly">Monthly (12 Cheques)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Bank Cheques</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="form-control"
                  value={numberOfCheques}
                  onChange={(e) => handleNumberOfChequesChange(parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            {/* Live & Fully Editable Cheque Installment Schedule */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                    📅 1-Year Contract: Cheque Schedule ({numberOfCheques === 4 ? 'Once Every 3 Months' : `${numberOfCheques} Cheques`})
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Each cheque below is editable. Adjust amounts, due dates, cheque numbers, and bank details.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResetCheques}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    title="Reset to equal installments"
                  >
                    ↺ Reset Amounts
                  </button>
                  <span className="badge badge-green" style={{ fontSize: '11px' }}>
                    {cheques.length} Cheques • 5% VAT
                  </span>
                </div>
              </div>

              {/* Cheque Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '10px',
                }}
              >
                {cheques.map((chq, idx) => (
                  <div
                    key={chq.id}
                    style={{
                      background: '#ffffff',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>
                        {chq.label}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#166534',
                          fontWeight: 600,
                          background: '#dcfce7',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        PDC #{idx + 1}
                      </span>
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <label style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                        Amount (AED) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        style={{ fontSize: '12px', height: '30px', padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}
                        value={chq.amount}
                        onChange={(e) => handleUpdateCheque(idx, 'amount', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      <label style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                        Due Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ fontSize: '11px', height: '30px', padding: '4px 8px' }}
                        value={chq.dueDate}
                        onChange={(e) => handleUpdateCheque(idx, 'dueDate', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '1px' }}>
                          Cheque #
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10041"
                          className="form-control"
                          style={{ fontSize: '11px', height: '26px', padding: '3px 6px' }}
                          value={chq.chequeNumber}
                          onChange={(e) => handleUpdateCheque(idx, 'chequeNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '1px' }}>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ENBD"
                          className="form-control"
                          style={{ fontSize: '11px', height: '26px', padding: '3px 6px' }}
                          value={chq.bankName}
                          onChange={(e) => handleUpdateCheque(idx, 'bankName', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: '11.5px',
                }}
              >
                <span style={{ color: '#64748b' }}>
                  Total Scheduled ({cheques.length} Cheques):
                </span>
                <span style={{ fontWeight: 800, color: '#166534', fontSize: '13px' }}>
                  AED {cheques.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Terms & Contract Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Cheque banking details, Ejari/Tawtheeq registration notes..."
                value={termsNotes}
                onChange={(e) => setTermsNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || selectedUnitIds.length === 0}
            >
              {isSubmitting
                ? lease
                  ? 'Updating Lease...'
                  : 'Generating Lease...'
                : lease
                ? 'Save Lease Changes'
                : 'Save & Generate Charges'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
