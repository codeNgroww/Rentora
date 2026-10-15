'use client';

import React, { useState, useEffect } from 'react';
import { Tenant, Property, Unit, RentCharge, VatSettings } from '@rental-saas/contracts';
import { api } from '../../lib/api';
import { Receipt, Percent } from 'lucide-react';

interface RecordPaymentModalProps {
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  charges: RentCharge[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function RecordPaymentModal({
  tenants,
  properties,
  units,
  charges,
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '');
  const [amount, setAmount] = useState('21250.00');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cheque');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Master VAT settings (defaulting to 5% UAE standard)
  const [vatSettings, setVatSettings] = useState<VatSettings>({
    enabled: true,
    defaultRate: 5.0,
    calculationMode: 'exclusive',
  });
  const [applyVat, setApplyVat] = useState(true);

  useEffect(() => {
    async function fetchVatSettings() {
      try {
        const ws = await api.getWorkspaceSettings();
        if (ws?.vatSettings) {
          setVatSettings(ws.vatSettings);
          setApplyVat(ws.vatSettings.enabled ?? true);
        }
      } catch (err) {
        console.warn('Using default 5% VAT settings');
      }
    }
    fetchVatSettings();
  }, []);

  // Find tenant charges
  const tenantPendingCharges = charges.filter(
    (c) => c.tenantId === tenantId && c.status !== 'paid' && c.status !== 'voided'
  );

  const selectedCharge = tenantPendingCharges[0];
  const propertyId = selectedCharge?.propertyId || properties[0]?.id;
  const unitId = selectedCharge?.unitId || units[0]?.id;

  // Live VAT calculations
  const baseAmt = parseFloat(amount) || 0;
  const activeRate = applyVat ? (vatSettings.defaultRate !== undefined ? Number(vatSettings.defaultRate) : 5.0) : 0;
  const vatAmount = (baseAmt * activeRate) / 100;
  const totalAmount = baseAmt + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(baseAmt) || baseAmt <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        tenantId,
        propertyId,
        unitId,
        amount: baseAmt.toFixed(2),
        paymentDate,
        paymentMethod,
        reference: reference || null,
        notes: notes || null,
        subtotalAmount: baseAmt.toFixed(2),
        vatRate: activeRate,
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record rent payment');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Record Rent Payment</h3>
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

            <div className="form-group">
              <label className="form-label">Select Tenant *</label>
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

            {selectedCharge && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#166534',
                }}
              >
                <strong>Outstanding Installment:</strong> AED{' '}
                {parseFloat(selectedCharge.outstandingAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                due on {selectedCharge.dueDate}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Amount (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tax & VAT Breakdown Card */}
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
                  marginBottom: '10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    style={{ accentColor: '#166534', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Apply Master VAT ({vatSettings.defaultRate ?? 5}%)</span>
                </label>

                <span className="badge badge-green" style={{ fontSize: '10.5px' }}>
                  {applyVat ? `${vatSettings.defaultRate ?? 5}% FTA Standard` : 'VAT Exempt / Off'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#475569',
                  paddingTop: '6px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <span>Base Rent: <strong>AED {baseAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                <span>VAT ({activeRate}%): <strong>AED {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                <span style={{ color: '#166534', fontWeight: 700, fontSize: '13px' }}>
                  Total: AED {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>


            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Channel</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cheque">UAE Bank Cheque</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cheque / Reference #</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CHQ-9901, TRF-881"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Deposit Details & Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Deposited to corporate account Emirates NBD..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Allocating...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
