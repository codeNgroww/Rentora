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

export function AddLeaseModal({
  lease,
  properties,
  units,
  tenants,
  onClose,
  onSubmit,
}: AddLeaseModalProps) {
  const [propertyId, setPropertyId] = useState(lease?.propertyId || properties[0]?.id || '');
  const availableUnits = units.filter(
    (u) => u.propertyId === propertyId && (u.status === 'vacant' || u.id === lease?.unitId)
  );

  const [unitId, setUnitId] = useState(lease?.unitId || availableUnits[0]?.id || '');
  const [tenantId, setTenantId] = useState(lease?.tenantId || tenants[0]?.id || '');
  const [startDate, setStartDate] = useState(lease?.startDate || '2026-11-01');
  const [endDate, setEndDate] = useState(lease?.endDate || '2027-10-31');
  const [annualRent, setAnnualRent] = useState(lease?.annualRent || '85000.00');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    lease?.paymentFrequency || 'quarterly'
  );
  const [numberOfCheques, setNumberOfCheques] = useState(lease?.numberOfCheques || 4);
  const [securityDeposit, setSecurityDeposit] = useState(lease?.securityDeposit || '4250.00');
  const [termsNotes, setTermsNotes] = useState(lease?.termsNotes || '');
  const [status, setStatus] = useState(lease?.status || 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
  };

  const rentNum = parseFloat(annualRent) || 0;
  const numCheques = numberOfCheques || 4;
  const installmentAmount = rentNum > 0 ? (rentNum / numCheques).toFixed(2) : '0.00';
  const vatRate = 5;
  const vatPerInstallment = ((parseFloat(installmentAmount) * vatRate) / 100).toFixed(2);
  const totalPerCheque = (parseFloat(installmentAmount) + parseFloat(vatPerInstallment)).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !unitId || !tenantId || !startDate || !endDate || !annualRent) {
      setErrorMsg('Please complete all required lease fields.');
      return;
    }

    if (isNaN(rentNum) || rentNum <= 0) {
      setErrorMsg('Annual rent must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        propertyId,
        unitId,
        tenantId,
        startDate,
        endDate,
        annualRent: rentNum.toFixed(2),
        paymentFrequency,
        numberOfCheques: Number(numberOfCheques),
        securityDeposit: parseFloat(securityDeposit || '0').toFixed(2),
        termsNotes: termsNotes || null,
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
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{lease ? 'Edit Lease Agreement' : 'Create Lease Agreement'}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Property *</label>
                <select
                  className="form-control"
                  value={propertyId}
                  onChange={(e) => {
                    setPropertyId(e.target.value);
                    const newUnits = units.filter(
                      (u) => u.propertyId === e.target.value && u.status === 'vacant'
                    );
                    setUnitId(newUnits[0]?.id || '');
                  }}
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vacant Unit *</label>
                <select
                  className="form-control"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                >
                  {availableUnits.length === 0 ? (
                    <option value="">No vacant units in this property</option>
                  ) : (
                    availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unitNumber} ({u.bedrooms} Bed, AED {u.marketRent})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

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
                    {t.fullName} ({t.phoneNumber})
                  </option>
                ))}
              </select>
            </div>

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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Annual Rent (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  value={annualRent}
                  onChange={(e) => setAnnualRent(e.target.value)}
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Cadence (UAE Cheques)</label>
                <select
                  className="form-control"
                  value={paymentFrequency}
                  onChange={(e) => {
                    const freq = e.target.value as PaymentFrequency;
                    setPaymentFrequency(freq);
                    if (freq === 'quarterly') setNumberOfCheques(4);
                    else if (freq === 'semi-annual') setNumberOfCheques(2);
                    else if (freq === 'annual') setNumberOfCheques(1);
                    else if (freq === 'monthly') setNumberOfCheques(12);
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
                  onChange={(e) => setNumberOfCheques(parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            {/* Live 3-Months Cheque Installment Schedule Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                  📅 1-Year Contract: Cheque Schedule (Once Every 3 Months)
                </span>
                <span className="badge badge-green" style={{ fontSize: '10px' }}>
                  {numCheques} Cheques • 5% VAT
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Cheque 1 (Month 1)</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>AED {totalPerCheque}</div>
                  <div style={{ fontSize: '10px', color: '#15803d' }}>Due: {startDate}</div>
                </div>

                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Cheque 2 (Month 4)</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>AED {totalPerCheque}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>+3 Months PDC</div>
                </div>

                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Cheque 3 (Month 7)</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>AED {totalPerCheque}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>+6 Months PDC</div>
                </div>

                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Cheque 4 (Month 10)</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>AED {totalPerCheque}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>+9 Months PDC</div>
                </div>
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
              disabled={isSubmitting || !unitId}
            >
              {isSubmitting ? (lease ? 'Updating Lease...' : 'Generating Lease...') : lease ? 'Save Lease Changes' : 'Save & Generate Charges'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
