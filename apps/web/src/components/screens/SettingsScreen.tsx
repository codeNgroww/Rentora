'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Globe, Users, Building, Receipt, CheckCircle2, Percent, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export function SettingsScreen() {
  const { user, activeCompanyName } = useAuth();
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState<number>(5.0);
  const [trn, setTrn] = useState('');
  const [calculationMode, setCalculationMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getWorkspaceSettings();
        if (data?.vatSettings) {
          setVatEnabled(data.vatSettings.enabled ?? true);
          setVatRate(data.vatSettings.defaultRate !== undefined ? Number(data.vatSettings.defaultRate) : 5.0);
          setTrn(data.vatSettings.trn || '');
          setCalculationMode(data.vatSettings.calculationMode || 'exclusive');
        }
      } catch (err) {
        console.warn('Failed to load settings from API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveVat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      await api.updateWorkspaceSettings({
        vatSettings: {
          enabled: vatEnabled,
          defaultRate: Number(vatRate),
          trn,
          calculationMode,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save VAT settings');
    } finally {
      setSaving(false);
    }
  };

  // Preview calculation based on 10,000 AED
  const sampleRent = 10000;
  const sampleVat = vatEnabled ? (sampleRent * (vatRate || 0)) / 100 : 0;
  const sampleTotal = calculationMode === 'exclusive' ? sampleRent + sampleVat : sampleRent;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Workspace Administration & Settings
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Manage your UAE multi-tenant organization, tax & VAT master configuration, and role permissions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Master VAT Configuration Card */}
        <div className="card" style={{ gridColumn: '1 / -1', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="#166534" />
              <h3 className="card-title" style={{ color: '#166534' }}>Master VAT & Tax Configuration (UAE FTA)</h3>
            </div>
            <span className="badge badge-green" style={{ fontSize: '11px', padding: '4px 8px' }}>
              Default Rate: 5% (UAE Standard)
            </span>
          </div>

          <form onSubmit={handleSaveVat}>
            <div className="card-body">
              {saveSuccess && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Master VAT settings successfully saved and applied to all future rent payment calculations!</span>
                </div>
              )}

              {errorMsg && (
                <div
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                <strong>UAE Federal Tax Authority (FTA) Compliance:</strong> Under UAE Federal Decree-Law No. 8 of 2017 on Value Added Tax, the standard VAT rate is <strong>5.0%</strong>. This master setting automatically governs rent payment breakdowns, tenant tax invoices, and accounting exports.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Enable VAT on Rent Payments</span>
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => setVatEnabled(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#166534', cursor: 'pointer' }}
                    />
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Toggle whether VAT is automatically calculated and added to recorded tenant payments.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Default VAT Rate (%) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={vatRate}
                      disabled={!vatEnabled}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      required
                      style={{ paddingRight: '36px', fontWeight: 600 }}
                    />
                    <Percent size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    UAE standard default rate is 5.0%.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Tax Registration Number (TRN)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="15-digit UAE TRN (e.g. 100293849500003)"
                    value={trn}
                    onChange={(e) => setTrn(e.target.value)}
                    maxLength={15}
                  />
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    Printed on official payment receipts and tax invoices.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Calculation Mode</label>
                  <select
                    className="form-control"
                    value={calculationMode}
                    onChange={(e) => setCalculationMode(e.target.value as any)}
                  >
                    <option value="exclusive">Exclusive (VAT added on top of base rent)</option>
                    <option value="inclusive">Inclusive (VAT embedded within amount paid)</option>
                  </select>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    Determines how tax amounts are apportioned on receipts.
                  </div>
                </div>
              </div>

              {/* Dynamic Live Preview Box */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Live Calculation Preview (Sample: AED 10,000 Base Rent)
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d', marginTop: '4px' }}>
                    Base: <strong>AED 10,000.00</strong> + VAT ({vatEnabled ? `${vatRate}%` : 'Disabled'}):{' '}
                    <strong>AED {sampleVat.toFixed(2)}</strong> = Total Payable:{' '}
                    <strong style={{ fontSize: '14px', textDecoration: 'underline' }}>AED {sampleTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: '160px' }}
                >
                  {saving ? 'Saving Settings...' : 'Save VAT Configuration'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Organization Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Organization Profile</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input type="text" className="form-control" readOnly value={activeCompanyName || 'Rentora'} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <input type="text" className="form-control" readOnly value="AED (United Arab Emirates Dirham)" />
              </div>
              <div className="form-group">
                <label className="form-label">Time Zone</label>
                <input type="text" className="form-control" readOnly value="Asia/Dubai (GST +04:00)" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Emirate</label>
              <input type="text" className="form-control" readOnly value="Dubai" />
            </div>
          </div>
        </div>

        {/* Team Members & RBAC */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Authorized Team Members (RBAC)</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{user?.fullName || 'Active Administrator'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{user?.email || 'admin@rentora.ae'}</div>
                </div>
                <span className={`badge ${user?.role === 'super_admin' ? 'badge-purple' : 'badge-green'}`}>
                  {user?.role ? user.role.toUpperCase().replace('_', ' ') : 'ADMIN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

