'use client';

import React, { useRef, useState } from 'react';
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
import { RentoraLogo } from '../RentoraLogo';

export interface InvoiceModalProps {
  mode: 'proforma' | 'paid';
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

  // For proforma mode with a lease, manage which installment is active (1 to N)
  const numCheques = lease?.numberOfCheques || lease?.cheques?.length || (charge?.installmentTotal) || 4;
  const [activeInstallment, setActiveInstallment] = useState<number>(
    charge?.installmentIndex || installmentIndex || 1
  );

  // Selected proof preview modal
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
        <title>${mode === 'paid' ? 'Tax Invoice & Receipt' : 'Proforma Invoice'} - ${tenant?.fullName || 'Tenant'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; font-size: 12px; }
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
          maxWidth: '850px',
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Top Header & Action Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: mode === 'paid' ? '#15803d' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                {mode === 'paid' ? 'Official Tax Invoice & Receipt' : `Proforma Invoice — Installment ${curInstallment?.index} of ${installmentsList.length}`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {mode === 'paid'
                  ? `Receipt #${paidInvoiceNo} • Verified & Cleared`
                  : `Invoice #${curInstallment?.invoiceNumber} • UAE FTA VAT 5% Included`}
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
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderColor: '#334155',
                padding: '6px 12px',
                fontSize: '12px',
              }}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderColor: '#334155',
                padding: '6px 12px',
                fontSize: '12px',
              }}
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Installment Switcher Tabs (For Proforma Mode with Multiple Installments) */}
        {mode === 'proforma' && installmentsList.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '10px 24px',
              backgroundColor: '#f1f5f9',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', alignSelf: 'center', marginRight: '6px' }}>
              Select Installment ({installmentsList.length} Cheques):
            </span>
            {installmentsList.map((inst) => {
              const isSelected = inst.index === activeInstallment;
              return (
                <button
                  key={inst.index}
                  onClick={() => setActiveInstallment(inst.index)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: `1px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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

        {/* Printable Invoice Canvas */}
        <div
          ref={invoiceRef}
          id="invoice-print-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '36px 40px',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          {/* PAID SEAL / STAMP (For Paid Mode) */}
          {mode === 'paid' && (
            <div
              style={{
                position: 'absolute',
                top: '120px',
                right: '48px',
                zIndex: 20,
                transform: 'rotate(-10deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '170px',
                  height: '170px',
                  border: '4px double #15803d',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#15803d',
                  padding: '10px',
                  backgroundColor: 'rgba(240, 253, 244, 0.45)',
                  boxShadow: '0 0 0 1px rgba(21, 128, 61, 0.25), inset 0 0 0 2px rgba(21, 128, 61, 0.2)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: '8.5px', fontWeight: 800, letterSpacing: '1.2px', marginBottom: '2px' }}>
                  RENTORA REAL ESTATE
                </div>
                <div style={{ fontSize: '7.5px', color: '#166534', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  ★ DUBAI • UAE ★
                </div>
                <div
                  style={{
                    borderTop: '1.5px solid #15803d',
                    borderBottom: '1.5px solid #15803d',
                    padding: '3px 0',
                    width: '90%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '2.5px',
                      color: '#15803d',
                      fontFamily: 'Impact, Arial Black, sans-serif',
                    }}
                  >
                    PAID
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', marginTop: '1px' }}>
                    مـدفـوع
                  </div>
                </div>
                <div style={{ fontSize: '8px', fontWeight: 700, marginTop: '4px', color: '#166534' }}>
                  {payment?.paymentDate || '2026-10-02'}
                </div>
                <div style={{ fontSize: '7.5px', fontWeight: 800, color: '#15803d', letterSpacing: '0.8px' }}>
                  CLEARED & VERIFIED
                </div>
              </div>
            </div>
          )}

          {/* PROFORMA WATERMARK (For Proforma Mode) */}
          {mode === 'proforma' && (
            <div
              style={{
                position: 'absolute',
                top: '120px',
                right: '48px',
                zIndex: 20,
                transform: 'rotate(-8deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  border: '3px dashed #0284c7',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  color: '#0284c7',
                  backgroundColor: 'rgba(240, 249, 255, 0.6)',
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1.5px', lineHeight: 1.1 }}>
                  PROFORMA
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', marginTop: '2px' }}>
                  PENDING CLEARANCE • فاتورة مبدئية
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: 600, marginTop: '3px', color: '#0369a1' }}>
                  DUE: {curInstallment?.dueDate}
                </div>
              </div>
            </div>
          )}

          {/* Document Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '20px',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <RentoraLogo size={32} showText={false} variant="dark" />
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                  RENTORA
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>
                  REAL ESTATE MANAGEMENT L.L.C
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.6' }}>
                <div>Floor 14, Marina Plaza, Dubai Marina, Dubai, UAE</div>
                <div>PO Box 34102 • Tel: +971 4 456 7890 • Email: billing@rentora.ae</div>
                <div>
                  <strong>Tax Registration Number (TRN):</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>
                    100234567890001
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: mode === 'paid' ? '#15803d' : '#0284c7',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                }}
              >
                {mode === 'paid' ? 'TAX INVOICE & RECEIPT' : 'PROFORMA TAX INVOICE'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                {mode === 'paid' ? 'فاتورة ضريبية وسند قبض' : 'فاتورة ضريبية شكلية (مبدئية)'}
              </div>

              <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: '1.7' }}>
                <div>
                  <strong>Invoice No:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {mode === 'paid' ? paidInvoiceNo : curInstallment?.invoiceNumber}
                  </span>
                </div>
                <div>
                  <strong>Issue Date:</strong> {mode === 'paid' ? (payment?.paymentDate || '2026-10-02') : (lease?.startDate || '2026-10-01')}
                </div>
                <div>
                  <strong>Due Date:</strong> {mode === 'paid' ? (payment?.paymentDate || '2026-10-02') : curInstallment?.dueDate}
                </div>
                {mode === 'paid' && payment?.reference && (
                  <div>
                    <strong>Payment Ref / Cheque:</strong>{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{payment.reference}</span>
                  </div>
                )}
                {mode === 'proforma' && (
                  <div>
                    <strong>Cheque No:</strong>{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{curInstallment?.chequeNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill-To & Property Details Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '12.5px',
            }}
          >
            {/* Left: Tenant Details */}
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.8px', marginBottom: '6px' }}>
                Billed To (Tenant)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                {tenant?.fullName || 'Tenant Full Name'}
              </div>
              <div style={{ color: '#475569', lineHeight: '1.6' }}>
                <div>Phone: {tenant?.phoneNumber || '+971 50 123 4567'}</div>
                <div>Email: {tenant?.email || 'tenant@rentora.ae'}</div>
                {tenant?.emiratesId && <div>Emirates ID: {tenant.emiratesId}</div>}
              </div>
            </div>

            {/* Right: Property & Lease Details */}
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.8px', marginBottom: '6px' }}>
                Premises & Tenancy Contract
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                {property?.name || 'Property'} • {unitLabel}
              </div>
              <div style={{ color: '#475569', lineHeight: '1.6' }}>
                <div>Building Type: {property?.type === 'commercial' ? 'Commercial' : 'Residential'}</div>
                <div>Contract Term: {lease?.startDate || '2026-10-01'} to {lease?.endDate || '2027-09-30'}</div>
                {lease && (
                  <div>
                    Payment Cadence: {lease.numberOfCheques || 4} Cheques / Year (AED {parseFloat(lease.annualRent || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} Annual)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Line Items Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '24px',
              fontSize: '12.5px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>#</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item Description</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Period / Cheque Details</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Base Rent (AED)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>VAT (5%)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total (AED)</th>
              </tr>
            </thead>
            <tbody>
              {mode === 'proforma' ? (
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>1</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      Rent Installment #{curInstallment?.index} of {installmentsList.length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Tenancy at {property?.name || 'Building'} ({unitLabel})
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div>Due: {curInstallment?.dueDate}</div>
                    <div style={{ fontSize: '11px', color: '#0284c7', fontFamily: 'monospace' }}>
                      {curInstallment?.chequeNumber} ({curInstallment?.bankName})
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                    {curInstallment?.amountBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>
                    {curInstallment?.amountVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    AED {curInstallment?.amountTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ) : (
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>1</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      Rent Payment Collection
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Premises: {property?.name || 'Property'} ({unitLabel})
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div>Cleared Date: {payment?.paymentDate || '2026-10-02'}</div>
                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                      Method: {payment?.paymentMethod?.replace('_', ' ') || 'Cheque'}
                      {payment?.reference ? ` (${payment.reference})` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                    {paidBaseAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>
                    {paidVatAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    AED {paidTotalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals & Breakdown Card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
            <div
              style={{
                width: '320px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '14px 18px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#475569' }}>
                <span>Subtotal (Base Rent):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  AED {(mode === 'paid' ? paidBaseAmt : curInstallment?.amountBase || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#475569' }}>
                <span>UAE VAT (5.00%):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  AED {(mode === 'paid' ? paidVatAmt : curInstallment?.amountVat || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '2px solid #0f172a',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: mode === 'paid' ? '#15803d' : '#0f172a',
                }}
              >
                <span>{mode === 'paid' ? 'Total Amount Paid:' : 'Total Amount Due:'}</span>
                <span>
                  AED {(mode === 'paid' ? paidTotalAmt : curInstallment?.amountTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* ATTACHED PAYMENT PROOF SECTION (For Paid Invoices with Proof) */}
          {mode === 'paid' && payment?.proofUrl && (
            <div
              style={{
                marginBottom: '24px',
                padding: '14px 18px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={16} color="#15803d" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                    Attached Proof of Payment
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontWeight: 600,
                    }}
                  >
                    Verified & Stored
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProofPreview(!showProofPreview)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ExternalLink size={13} />
                  <span>{showProofPreview ? 'Hide Attachment' : 'View Attachment'}</span>
                </button>
              </div>

              <div style={{ fontSize: '12px', color: '#166534', marginBottom: showProofPreview ? '12px' : '0' }}>
                File: <strong>{payment.proofName || 'Payment_Proof_Receipt.pdf'}</strong>
              </div>

              {showProofPreview && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  {payment.proofUrl.startsWith('data:image/') ? (
                    <img
                      src={payment.proofUrl}
                      alt="Payment Proof"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '280px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                  ) : (
                    <div style={{ padding: '20px', color: '#475569' }}>
                      <FileText size={36} color="#0284c7" style={{ marginBottom: '8px' }} />
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{payment.proofName || 'Payment Proof Document'}</div>
                      <a
                        href={payment.proofUrl}
                        download={payment.proofName || 'payment_proof'}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={13} />
                        <span>Download Document</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Instructions / Landlord Bank Details (For Proforma Mode) */}
          {mode === 'proforma' && (
            <div
              style={{
                marginBottom: '24px',
                padding: '14px 18px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="#0284c7" />
                <span>Cheque Clearance & Bank Transfer Settlement Instructions:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#475569' }}>
                <div><strong>Bank Name:</strong> Emirates NBD Bank PJSC</div>
                <div><strong>Account Title:</strong> Rentora Real Estate LLC - Escrow</div>
                <div><strong>IBAN:</strong> AE03 0240 0011 2345 6789 001</div>
                <div><strong>SWIFT / BIC:</strong> EBILAEAD</div>
                <div><strong>Cheque Beneficiary:</strong> Rentora Real Estate LLC</div>
                <div><strong>Note:</strong> Quote Invoice No. {curInstallment?.invoiceNumber} on transfer</div>
              </div>
            </div>
          )}

          {/* Footer & Signature Block */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '20px',
              marginTop: '10px',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <div style={{ maxWidth: '420px', lineHeight: '1.5' }}>
              <div><strong>UAE Tax Invoice Notice:</strong> Issued pursuant to UAE Federal Decree-Law No. (8) of 2017 on Value Added Tax.</div>
              <div>Subject to Dubai Tenancy Law No. 26 of 2007 and applicable amendments. All cheques deposited subject to realization.</div>
            </div>

            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ height: '36px', borderBottom: '1px solid #0f172a', marginBottom: '6px' }}>
                {mode === 'paid' && (
                  <span style={{ fontFamily: 'Brush Script MT, cursive, sans-serif', fontSize: '18px', color: '#15803d' }}>
                    Authorized Billing Signatory
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Authorized Signatory</div>
              <div style={{ fontSize: '10px' }}>Rentora Real Estate Management</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {mode === 'paid'
              ? 'Official payment receipt generated with authentic PAID verification seal'
              : `Proforma Invoice ${curInstallment?.index} of ${installmentsList.length} ready for printing & tenant dispatch`}
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
                gap: '6px',
                backgroundColor: mode === 'paid' ? '#15803d' : '#0284c7',
                borderColor: mode === 'paid' ? '#166534' : '#0369a1',
              }}
            >
              <Printer size={15} />
              <span>Print {mode === 'paid' ? 'Official Receipt' : 'Proforma Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
