'use client';

import React, { useRef } from 'react';
import { Lease, Tenant, Property, Unit } from '@rental-saas/contracts';
import { Printer, Download, X, Shield, FileCheck, CheckCircle2 } from 'lucide-react';
import { RentoraLogo } from '../RentoraLogo';
import { useAuth } from '../../lib/AuthContext';

interface TenancyContractModalProps {
  lease: Lease;
  tenant: Tenant | undefined;
  property: Property | undefined;
  unit: Unit | undefined;
  onClose: () => void;
}

export function TenancyContractModal({
  lease,
  tenant,
  property,
  unit,
  onClose,
}: TenancyContractModalProps) {
  const contractRef = useRef<HTMLDivElement>(null);
  const { activeCompanyName, user } = useAuth();
  const landlordCompany = activeCompanyName || 'Rentora';
  const landlordRepresentative = user?.fullName || 'Authorized Signatory';

  const rentNum = parseFloat(lease.annualRent) || 0;
  const vatRate = 5.0; // 5% UAE standard VAT
  const vatAmount = (rentNum * vatRate) / 100;
  const totalAnnualWithVat = rentNum + vatAmount;

  const numCheques = lease.numberOfCheques || 4;
  const chequeBase = rentNum / numCheques;
  const chequeVat = (chequeBase * vatRate) / 100;
  const chequeTotal = chequeBase + chequeVat;

  // Generate or use saved cheques schedule
  const [startYear, startMonth, startDay] = (lease.startDate || '2026-01-01').split('-').map(Number);
  const chequeSchedule =
    lease.cheques && lease.cheques.length > 0
      ? lease.cheques.map((c, i) => {
          const totalAmt = parseFloat(c.amount) || 0;
          const baseAmt = totalAmt / (1 + vatRate / 100);
          const vatAmt = totalAmt - baseAmt;
          return {
            chequeNumber: c.chequeNumber || `CHQ-${String(1001 + i)}`,
            bankName: c.bankName,
            dueDate: c.dueDate,
            installmentIndex: i + 1,
            monthPeriod: `Installment #${i + 1}`,
            base: baseAmt,
            vat: vatAmt,
            total: totalAmt,
          };
        })
      : Array.from({ length: numCheques }).map((_, i) => {
          const monthsPerCheque = Math.round(12 / numCheques);
          const date = new Date(startYear, startMonth - 1 + i * monthsPerCheque, startDay);
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return {
            chequeNumber: `CHQ-${y}-${String(1001 + i)}`,
            bankName: undefined,
            dueDate: `${y}-${m}-${d}`,
            installmentIndex: i + 1,
            monthPeriod: `Month ${i * monthsPerCheque + 1} to ${i * monthsPerCheque + monthsPerCheque}`,
            base: chequeBase,
            vat: chequeVat,
            total: chequeTotal,
          };
        });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!contractRef.current) return;
    const contractHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tenancy Contract - ${tenant?.fullName || 'Tenant'} - Unit ${unit?.unitNumber || ''}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #166534; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: bold; color: #166534; margin: 0; }
          .subtitle { font-size: 13px; color: #475569; margin: 4px 0 0; }
          .section { margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; }
          .section-title { font-size: 14px; font-weight: bold; color: #166534; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; }
          .signature-box { display: flex; justify-content: space-between; margin-top: 40px; }
          .sign-col { width: 45%; border-top: 1px solid #000; padding-top: 8px; text-align: center; }
        </style>
      </head>
      <body>
        ${contractRef.current.innerHTML}
      </body>
      </html>
    `;
    const blob = new Blob([contractHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tenancy_Contract_${tenant?.fullName?.replace(/\s+/g, '_') || 'Tenant'}_Unit_${unit?.unitNumber || '101'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '920px',
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            background: '#0f172a',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={20} color="#4ade80" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Official UAE Unified Tenancy Contract (Ejari Standard)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#334155', color: '#fff', border: 'none' }}
            >
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} />
              <span>Download Contract</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px',
            background: '#ffffff',
          }}
        >
          <div ref={contractRef} id="printable-contract-document">
            {/* Document Header */}
            <div
              style={{
                textAlign: 'center',
                borderBottom: '2px solid #4f46e5',
                paddingBottom: '18px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RentoraLogo size={36} showText={true} textSize={16} variant="dark" />
                </div>

                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '15px',
                      padding: '4px 14px',
                      borderRadius: '4px',
                      letterSpacing: '1px',
                    }}
                  >
                    UNIFIED TENANCY CONTRACT
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', marginTop: '4px' }}>
                    عقد الإيجار الموحد (دولة الإمارات العربية المتحدة)
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                  <strong>Contract Reg #:</strong> EJARI-{lease.id.toUpperCase()}<br />
                  <strong>Issue Date:</strong> {lease.startDate}<br />
                  <strong>Jurisdiction:</strong> Dubai Courts & RDC
                </div>
              </div>
            </div>

            {/* Quick Badge Summary */}
            <div
              style={{
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                borderRadius: '8px',
                padding: '12px 18px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12.5px',
              }}
            >
              <div>
                <span style={{ color: '#4f46e5', fontWeight: 600 }}>Contract Term:</span>{' '}
                <strong>1 Year (Yearly Basis)</strong>
              </div>
              <div>
                <span style={{ color: '#4f46e5', fontWeight: 600 }}>Period:</span>{' '}
                <strong>{lease.startDate} to {lease.endDate}</strong>
              </div>
              <div>
                <span style={{ color: '#4f46e5', fontWeight: 600 }}>Payment Method:</span>{' '}
                <strong>Bank Cheques (Once Every 3 Months)</strong>
              </div>
              <div>
                <span style={{ color: '#4f46e5', fontWeight: 600 }}>Cheques Count:</span>{' '}
                <strong>{numCheques} Post-Dated Cheques</strong>
              </div>
            </div>

            {/* Parties: Landlord & Tenant Two Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Landlord / Lessor */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                  1. LESSOR / LANDLORD (الطرف الأول - المؤجر)
                </div>
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', width: '38%', padding: '4px 0' }}>Company / Name:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{landlordCompany}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Trade License / TRN:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>Verified FTA Tax Registered</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Represented By:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{landlordRepresentative}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Contact Phone:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{user?.phoneNumber || '+971 4 000 0000'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Official Email:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{user?.email || 'leasing@rentora.ae'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tenant / Lessee */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                  2. LESSEE / TENANT (الطرف الثاني - المستأجر)
                </div>
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', width: '38%', padding: '4px 0' }}>Full Legal Name:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{tenant?.fullName || 'Valued Tenant'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Emirates ID #:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{tenant?.emiratesId || '784-1988-1234567-1'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Passport #:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{tenant?.passportNumber || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Mobile Phone:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{tenant?.phoneNumber || '+971 50 000 0000'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '4px 0' }}>Email Address:</td>
                      <td style={{ fontWeight: 600, padding: '4px 0' }}>{tenant?.email || 'tenant@example.com'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leased Premises Description */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#166534', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                3. LEASED PREMISES SPECIFICATIONS (بيانات العقار المؤجر)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Building Name:</span><br />
                  <strong>{property?.name || 'Marina Crown Tower'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Unit Number & Floor:</span><br />
                  <strong>Unit {unit?.unitNumber || '101'} ({unit?.floor || '10th Floor'})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Premise Type / Size:</span><br />
                  <strong>{unit?.bedrooms || 2} Bedrooms ({unit?.squareFeet || 950} Sq. Ft)</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Community & Emirate:</span><br />
                  <strong>{property?.communityArea || 'Dubai Marina'}, {property?.emirate || 'Dubai'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>DEWA Premise Number:</span><br />
                  <strong>992817201</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Permitted Usage:</span><br />
                  <strong>Residential Tenancy Only</strong>
                </div>
              </div>
            </div>

            {/* Financial Value & Cheque Payment Schedule */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#4f46e5' }}>
                  4. RENT, VAT, AND CHEQUE PAYMENT SCHEDULE (الأجرة وجدول الدفعات)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Cadence: <strong>Once Every 3 Months (Quarterly)</strong>
                </div>
              </div>

              {/* Annual Summary Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Annual Base Rent:</span><br />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                    AED {rentNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>UAE VAT (5% FTA):</span><br />
                  <strong style={{ fontSize: '13.5px', color: '#4f46e5' }}>
                    AED {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Total Annual Payable:</span><br />
                  <strong style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'underline' }}>
                    AED {totalAnnualWithVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Security Deposit:</span><br />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                    AED {parseFloat(lease.securityDeposit || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Itemized 4 Quarterly Cheques Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Installment</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Cadence</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Cheque Due Date</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Cheque Reference</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Base Rent</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>VAT (5%)</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Total Cheque Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chequeSchedule.map((c) => (
                    <tr key={c.installmentIndex}>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                        Cheque #{c.installmentIndex}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', color: '#475569' }}>
                        Every 3 Months
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#4f46e5' }}>
                        {c.dueDate}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                        {c.bankName ? `${c.bankName} - ` : ''}{c.chequeNumber}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>
                        AED {c.base.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', color: '#4f46e5' }}>
                        AED {c.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#4f46e5' }}>
                        AED {c.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Standard Legal Clauses */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '24px', fontSize: '11.5px', color: '#334155', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#166534', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                5. STANDARD TERMS & LEGAL CONDITIONS (الشروط والأحكام العامة)
              </div>
              <ol style={{ paddingLeft: '18px', margin: 0 }}>
                <li>
                  <strong>Contract Period:</strong> The tenancy term is strictly 1 year starting from {lease.startDate} and terminating on {lease.endDate}.
                </li>
                <li>
                  <strong>Rent Payment Terms:</strong> Rent is payable strictly once every 3 months through signed post-dated UAE bank cheques as itemized above.
                </li>
                <li>
                  <strong>Cheque Clearance:</strong> All issued bank cheques must be honored upon presentation. Dishonored cheques are enforceable under UAE Commercial Code and Federal Penal Code.
                </li>
                <li>
                  <strong>Maintenance & Repairs:</strong> Landlord is responsible for major structural repairs and MEP systems. Minor repairs under AED 500 are the tenant's responsibility.
                </li>
                <li>
                  <strong>Contract Renewal / Eviction:</strong> In compliance with Dubai Law No. 26 of 2007, both parties agree to give at least 90 days prior written notice before contract expiry for renewal or terms modification.
                </li>
              </ol>
            </div>

            {/* Signatures & Seal Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '28px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'cursive', fontSize: '18px', color: '#4f46e5' }}>{landlordRepresentative}</span>
                </div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '11.5px', fontWeight: 600 }}>
                  First Party (Landlord / Lessor)<br />
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>{landlordCompany}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'cursive', fontSize: '18px', color: '#0284c7' }}>
                    {tenant?.fullName || 'Tenant'}
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '11.5px', fontWeight: 600 }}>
                  Second Party (Tenant / Lessee)<br />
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Emirates ID: {tenant?.emiratesId || 'Verified'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      border: '2px solid #4f46e5',
                      borderRadius: '50%',
                      width: '46px',
                      height: '46px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#4f46e5',
                      textAlign: 'center',
                      lineHeight: 1.1,
                    }}
                  >
                    EJARI<br />SEAL
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '11.5px', fontWeight: 600 }}>
                  Ejari Registration Attestation<br />
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Dubai Land Department</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
