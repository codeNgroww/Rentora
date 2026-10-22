'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Lease, RentCharge, Payment, Tenant, Property, Unit } from '@rental-saas/contracts';
import {
  Printer,
  Download,
  X,
  FileCheck,
  Building,
  ExternalLink,
  Paperclip,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';

export interface InvoiceModalProps {
  mode: 'proforma' | 'paid';
  companyName?: string;
  lease?: Lease | null;
  charge?: RentCharge | null;
  payment?: Payment | null;
  tenant?: Tenant | null;
  property?: Property | null;
  unit?: Unit | null;
  units?: Unit[];
  installmentIndex?: number; // 1-based index
  onClose: () => void;
}

export function InvoiceModal({
  mode,
  companyName: propCompanyName,
  lease,
  charge,
  payment,
  tenant,
  property,
  unit,
  units = [],
  installmentIndex = 1,
  onClose,
}: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Dynamic company name & TRN from workspace settings
  const [companyName, setCompanyName] = useState<string>(propCompanyName || 'Rentora');
  const [trnNumber, setTrnNumber] = useState<string>('');

  useEffect(() => {
    async function fetchCompanyInfo() {
      if (propCompanyName) {
        setCompanyName(propCompanyName);
        return;
      }
      try {
        const ws = await api.getWorkspaceSettings();
        if (ws?.name) setCompanyName(ws.name);
        if (ws?.vatSettings?.trn) setTrnNumber(ws.vatSettings.trn);
      } catch (err) {
        // Ignored
      }
    }
    fetchCompanyInfo();
  }, [propCompanyName]);

  // For proforma mode with a lease, manage which installment is active (1 to N)
  const numCheques = lease?.numberOfCheques || lease?.cheques?.length || (charge?.installmentTotal) || 4;
  const [activeInstallment, setActiveInstallment] = useState<number>(
    charge?.installmentIndex || installmentIndex || 1
  );

  // Selected proof preview toggle
  const [showProofPreview, setShowProofPreview] = useState(false);

  // Calculate annual & installment amounts
  const annualRentNum = lease ? parseFloat(lease.annualRent || '0') : charge ? parseFloat(charge.amount || '0') * numCheques : 0;
  const vatRate = payment?.vatRate !== undefined ? payment.vatRate : 5.0;

  // Build installments array from lease cheques or generated schedule
  const installmentsList = lease?.cheques && lease.cheques.length > 0
    ? lease.cheques.map((c, idx) => {
        const total = parseFloat(c.amount || '0');
        const base = total / (1 + vatRate / 100);
        const vat = total - base;
        return {
          index: idx + 1,
          chequeNumber: c.chequeNumber || `CHQ-${1001 + idx}`,
          dueDate: c.dueDate,
          bankName: c.bankName || 'Emirates NBD',
          amountTotal: total,
          amountBase: base,
          amountVat: vat,
          invoiceNumber: c.proformaInvoiceNumber || `PI-${new Date(lease.startDate || '2026-01-01').getFullYear()}-${lease.id.slice(-4)}-${String(idx + 1).padStart(2, '0')}`,
          notes: c.notes || `Installment ${idx + 1} of ${lease.cheques?.length}`,
        };
      })
    : Array.from({ length: numCheques }).map((_, idx) => {
        const [sYear, sMonth, sDay] = (lease?.startDate || charge?.dueDate || '2026-01-01').split('-').map(Number);
        const monthsPer = Math.round(12 / numCheques);
        const d = new Date(sYear, sMonth - 1 + idx * monthsPer, sDay);
        const dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const total = annualRentNum > 0 ? annualRentNum / numCheques : charge ? parseFloat(charge.amount || '0') : 20000;
        const base = total / (1 + vatRate / 100);
        const vat = total - base;
        const leaseIdStr = lease?.id ? lease.id.slice(-4) : '2026';
        return {
          index: idx + 1,
          chequeNumber: `CHQ-${1001 + idx}`,
          dueDate,
          bankName: 'Emirates NBD',
          amountTotal: total,
          amountBase: base,
          amountVat: vat,
          invoiceNumber: charge?.invoiceNumber && idx + 1 === (charge.installmentIndex || 1)
            ? charge.invoiceNumber
            : `PI-${sYear}-${leaseIdStr}-${String(idx + 1).padStart(2, '0')}`,
          notes: `Installment ${idx + 1} of ${numCheques}`,
        };
      });

  const curInstallment = installmentsList[activeInstallment - 1] || installmentsList[0];

  // Specific values for Paid Mode
  const paidBaseAmt = payment?.subtotalAmount
    ? parseFloat(payment.subtotalAmount)
    : payment
    ? parseFloat(payment.amount) / (1 + vatRate / 100)
    : 0;
  const paidVatAmt = payment?.vatAmount
    ? parseFloat(payment.vatAmount)
    : payment
    ? parseFloat(payment.totalAmount || payment.amount) - paidBaseAmt
    : 0;
  const paidTotalAmt = payment
    ? parseFloat(payment.totalAmount || payment.amount)
    : 0;
  const paidInvoiceNo = payment?.invoiceNumber || (payment ? `INV-2026-${payment.id.slice(-5)}` : 'INV-2026-0001');

  // Match unit numbers
  const matchedUnitIds = lease?.unitIds && lease.unitIds.length > 0 ? lease.unitIds : [lease?.unitId || unit?.id || ''];
  const matchedUnits = units.filter((u) => matchedUnitIds.includes(u.id));
  const unitLabel = matchedUnits.length > 1
    ? `Units ${matchedUnits.map((u) => u.unitNumber).join(', ')} (${matchedUnits.length} Units)`
    : unit?.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit 101';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download this invoice');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${mode === 'paid' ? 'Tax Invoice & Receipt' : 'Proforma Invoice'} - ${companyName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #334155; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${invoiceRef.current.innerHTML}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '820px',
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Top Header & Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 22px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: mode === 'paid' ? '#15803d' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FileCheck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                {mode === 'paid'
                  ? `Payment Receipt — ${companyName}`
                  : `Proforma Invoice (Installment ${curInstallment?.index} of ${installmentsList.length}) — ${companyName}`}
              </h3>
              <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                {mode === 'paid'
                  ? `Receipt #${paidInvoiceNo}`
                  : `Invoice #${curInstallment?.invoiceNumber}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderColor: '#334155',
                padding: '5px 10px',
                fontSize: '12px',
              }}
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderColor: '#334155',
                padding: '5px 10px',
                fontSize: '12px',
              }}
            >
              <Download size={13} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Installment Switcher Tabs (For Proforma Mode with Multiple Installments) */}
        {mode === 'proforma' && installmentsList.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 22px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', alignSelf: 'center', marginRight: '6px' }}>
              Installments ({installmentsList.length} Cheques):
            </span>
            {installmentsList.map((inst) => {
              const isSelected = inst.index === activeInstallment;
              return (
                <button
                  key={inst.index}
                  onClick={() => setActiveInstallment(inst.index)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: `1px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Installment {inst.index}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                      color: isSelected ? '#ffffff' : '#64748b',
                    }}
                  >
                    AED {inst.amountTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Clean, Simple Printable Invoice Canvas */}
        <div
          ref={invoiceRef}
          id="invoice-print-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 36px',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          {/* PAID SEAL / STAMP ONLY FOR PAID MODE (NO SEAL ON PROFORMA) */}
          {mode === 'paid' && (
            <div
              style={{
                position: 'absolute',
                top: '100px',
                right: '40px',
                zIndex: 20,
                transform: 'rotate(-9deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '150px',
                  height: '150px',
                  border: '3.5px double #15803d',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#15803d',
                  padding: '8px',
                  backgroundColor: 'rgba(240, 253, 244, 0.5)',
                  boxShadow: '0 0 0 1px rgba(21, 128, 61, 0.2)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1px', marginBottom: '2px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {companyName.toUpperCase()}
                </div>
                <div style={{ fontSize: '7px', color: '#166534', letterSpacing: '0.8px', marginBottom: '3px' }}>
                  ★ DUBAI • UAE ★
                </div>
                <div
                  style={{
                    borderTop: '1.5px solid #15803d',
                    borderBottom: '1.5px solid #15803d',
                    padding: '2px 0',
                    width: '88%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '2px',
                      color: '#15803d',
                      fontFamily: 'Impact, Arial Black, sans-serif',
                    }}
                  >
                    PAID
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>
                    مـدفـوع
                  </div>
                </div>
                <div style={{ fontSize: '7.5px', fontWeight: 700, marginTop: '3px', color: '#166534' }}>
                  {payment?.paymentDate || '2026-10-02'}
                </div>
                <div style={{ fontSize: '7px', fontWeight: 800, color: '#15803d', letterSpacing: '0.6px' }}>
                  CLEARED & VERIFIED
                </div>
              </div>
            </div>
          )}

          {/* Simple Clean Header: Company Name & Document Info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '18px',
              marginBottom: '22px',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                {companyName}
              </h1>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                <div>Dubai Marina, Dubai, United Arab Emirates</div>
                <div>
                  <strong>Tax Registration No (TRN):</strong>{' '}
                  <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>
                    {trnNumber}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '200px' }}>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: mode === 'paid' ? '#15803d' : '#0f172a',
                  letterSpacing: '0.4px',
                  marginBottom: '6px',
                }}
              >
                {mode === 'paid' ? 'TAX INVOICE & RECEIPT' : 'PROFORMA INVOICE'}
              </div>

              <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.6' }}>
                <div>
                  <strong>Invoice No:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {mode === 'paid' ? paidInvoiceNo : curInstallment?.invoiceNumber}
                  </span>
                </div>
                <div>
                  <strong>Date:</strong> {mode === 'paid' ? (payment?.paymentDate || '2026-10-02') : (lease?.startDate || '2026-10-01')}
                </div>
                <div>
                  <strong>Due Date:</strong> {mode === 'paid' ? (payment?.paymentDate || '2026-10-02') : curInstallment?.dueDate}
                </div>
                {mode === 'paid' && payment?.reference && (
                  <div>
                    <strong>Payment Ref:</strong>{' '}
                    <span style={{ fontFamily: 'monospace' }}>{payment.reference}</span>
                  </div>
                )}
                {mode === 'proforma' && (
                  <div>
                    <strong>Cheque:</strong>{' '}
                    <span style={{ fontFamily: 'monospace' }}>{curInstallment?.chequeNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clean 2-Column Details: Tenant & Property */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              padding: '14px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '22px',
              fontSize: '12.5px',
            }}
          >
            {/* Bill To */}
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.6px', marginBottom: '4px' }}>
                Bill To
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                {tenant?.fullName || 'Tenant Name'}
              </div>
              <div style={{ color: '#475569', lineHeight: '1.5', fontSize: '12px' }}>
                <div>Phone: {tenant?.phoneNumber || '—'}</div>
                <div>Email: {tenant?.email || '—'}</div>
                {tenant?.emiratesId && <div>Emirates ID: {tenant.emiratesId}</div>}
              </div>
            </div>

            {/* Premises */}
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.6px', marginBottom: '4px' }}>
                Premises & Lease
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                {property?.name || 'Property'} • {unitLabel}
              </div>
              <div style={{ color: '#475569', lineHeight: '1.5', fontSize: '12px' }}>
                <div>Contract: {lease?.startDate || '2026-10-01'} to {lease?.endDate || '2027-09-30'}</div>
                {lease && (
                  <div>
                    Annual Rent: AED {parseFloat(lease.annualRent || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} ({lease.numberOfCheques || 4} Cheques)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simple Clean Line Items Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px',
              fontSize: '12.5px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#334155', width: '36px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Period / Cheque</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>Base (AED)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>VAT (5%)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>Total (AED)</th>
              </tr>
            </thead>
            <tbody>
              {mode === 'proforma' ? (
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>1</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      Rent Installment #{curInstallment?.index} of {installmentsList.length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {property?.name} ({unitLabel})
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', fontSize: '12px' }}>
                    <div>Due: {curInstallment?.dueDate}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0284c7' }}>
                      {curInstallment?.chequeNumber}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                    {curInstallment?.amountBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                    {curInstallment?.amountVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    AED {curInstallment?.amountTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ) : (
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>1</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      Rent Payment Collection
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {property?.name} ({unitLabel})
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', fontSize: '12px' }}>
                    <div>Cleared: {payment?.paymentDate || '2026-10-02'}</div>
                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                      {payment?.paymentMethod?.replace('_', ' ') || 'Cheque'}
                      {payment?.reference ? ` • ${payment.reference}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                    {paidBaseAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                    {paidVatAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    AED {paidTotalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Simple Totals Block */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '22px' }}>
            <div style={{ width: '280px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                <span>Subtotal (Base):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  AED {(mode === 'paid' ? paidBaseAmt : curInstallment?.amountBase || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                <span>VAT (5.00%):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  AED {(mode === 'paid' ? paidVatAmt : curInstallment?.amountVat || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  marginTop: '4px',
                  borderTop: '2px solid #0f172a',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: mode === 'paid' ? '#15803d' : '#0f172a',
                }}
              >
                <span>{mode === 'paid' ? 'Total Paid:' : 'Total Due:'}</span>
                <span>
                  AED {(mode === 'paid' ? paidTotalAmt : curInstallment?.amountTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Attached Proof of Payment (Only when attached on Paid Invoices) */}
          {mode === 'paid' && payment?.proofUrl && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 14px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={15} color="#15803d" />
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#166534' }}>
                    Payment Proof: <strong>{payment.proofName || 'receipt.pdf'}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProofPreview(!showProofPreview)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15803d',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ExternalLink size={12} />
                  <span>{showProofPreview ? 'Hide' : 'Preview'}</span>
                </button>
              </div>

              {showProofPreview && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  {payment.proofUrl.startsWith('data:image/') ? (
                    <img
                      src={payment.proofUrl}
                      alt="Payment Proof"
                      style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                  ) : (
                    <a
                      href={payment.proofUrl}
                      download={payment.proofName || 'proof'}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={13} />
                      <span>Download Attached Document</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Simple Clean Bank Instructions (Proforma Mode) */}
          {mode === 'proforma' && (
            <div
              style={{
                marginBottom: '22px',
                padding: '12px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#475569',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Settlement & Payment Details:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div>• Bank: Emirates NBD Bank PJSC</div>
                <div>• IBAN: AE03 0240 0011 2345 6789 001</div>
                <div>• Cheque Beneficiary: {companyName}</div>
                <div>• Quote Invoice No. {curInstallment?.invoiceNumber}</div>
              </div>
            </div>
          )}

          {/* Simple Clean Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <div>
              <div>Issued pursuant to UAE Federal Decree-Law No. (8) of 2017 on Value Added Tax.</div>
              <div>Subject to UAE Tenancy Law and contract terms.</div>
            </div>

            <div style={{ textAlign: 'center', width: '180px' }}>
              <div style={{ height: '28px', borderBottom: '1px solid #0f172a', marginBottom: '4px' }}>
                {mode === 'paid' && (
                  <span style={{ fontFamily: 'Brush Script MT, cursive, sans-serif', fontSize: '16px', color: '#15803d' }}>
                    Authorized
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{companyName}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 22px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            {mode === 'paid'
              ? 'Official payment receipt with cleared verification'
              : `Proforma installment ${curInstallment?.index} of ${installmentsList.length}`}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: mode === 'paid' ? '#15803d' : '#0284c7',
                borderColor: mode === 'paid' ? '#166534' : '#0369a1',
              }}
            >
              <Printer size={14} />
              <span>Print {mode === 'paid' ? 'Receipt' : 'Proforma Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
