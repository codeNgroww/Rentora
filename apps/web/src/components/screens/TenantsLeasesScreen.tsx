'use client';

import React, { useState } from 'react';
import { Users, FileText, Plus, Phone, Mail, Calendar, ShieldCheck, Edit2, Trash2 } from 'lucide-react';
import { Tenant, Lease, Property, Unit } from '@rental-saas/contracts';
import { TenancyContractModal } from '../modals/TenancyContractModal';

interface TenantsLeasesScreenProps {
  tenants: Tenant[];
  leases: Lease[];
  properties: Property[];
  units: Unit[];
  onOpenAddTenant: () => void;
  onEditTenant?: (tenant: Tenant) => void;
  onDeleteTenant?: (id: string) => Promise<void>;
  onOpenAddLease: () => void;
  onEditLease?: (lease: Lease) => void;
  onDeleteLease?: (id: string) => Promise<void>;
}

export function TenantsLeasesScreen({
  tenants,
  leases,
  properties,
  units,
  onOpenAddTenant,
  onEditTenant,
  onDeleteTenant,
  onOpenAddLease,
  onEditLease,
  onDeleteLease,
}: TenantsLeasesScreenProps) {
  const [activeTab, setActiveTab] = useState<'leases' | 'tenants'>('leases');
  const [selectedContractLease, setSelectedContractLease] = useState<Lease | null>(null);

  const activeContractLease = selectedContractLease || (leases.length > 0 ? leases[0] : null);
  const contractTenant = tenants.find((t) => t.id === activeContractLease?.tenantId);
  const contractProp = properties.find((p) => p.id === activeContractLease?.propertyId);
  const contractUnit = units.find((u) => u.id === activeContractLease?.unitId);

  return (
    <div>
      {/* Top Header & Tab Switcher */}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'leases' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('leases')}
          >
            <FileText size={14} />
            <span>Active Leases ({leases.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'tenants' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tenants')}
          >
            <Users size={14} />
            <span>Tenant Directory ({tenants.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {leases.length > 0 && (
            <button
              id="generate-contract-header-btn"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600, borderColor: '#bbf7d0', background: '#f0fdf4' }}
              onClick={() => setSelectedContractLease(leases[0])}
            >
              <FileText size={14} color="#166534" />
              <span>Generate Contract</span>
            </button>
          )}
          <button id="add-tenant-btn" className="btn btn-secondary btn-sm" onClick={onOpenAddTenant}>
            <Plus size={14} />
            <span>+ Add Tenant</span>
          </button>
          <button id="add-lease-btn" className="btn btn-primary btn-sm" onClick={onOpenAddLease}>
            <Plus size={14} />
            <span>+ Create Lease</span>
          </button>
        </div>
      </div>

      {/* Leases View */}
      {activeTab === 'leases' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Lease Agreements</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Standard UAE residential & commercial tenancies
            </span>
          </div>
          <div className="card-body">
            {leases.length === 0 ? (
              <div className="empty-state">
                <FileText size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <h4 className="empty-state-title">No leases recorded</h4>
                <p className="empty-state-desc">
                  Create a new lease to assign a tenant to an available unit and generate rent schedules.
                </p>
                <button className="btn btn-primary btn-sm" onClick={onOpenAddLease}>
                  + Create Lease
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Property & Unit</th>
                      <th>Lease Period</th>
                      <th>Annual Rent</th>
                      <th>Cheques</th>
                      <th>Deposit</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leases.map((l) => {
                      const tenant = tenants.find((t) => t.id === l.tenantId);
                      const prop = properties.find((p) => p.id === l.propertyId);
                      const unitIds = l.unitIds && l.unitIds.length > 0 ? l.unitIds : [l.unitId];
                      const matchedUnits = units.filter((u) => unitIds.includes(u.id));
                      const unitLabel =
                        matchedUnits.length > 1
                          ? `Units ${matchedUnits.map((u) => u.unitNumber).join(', ')} (${matchedUnits.length} Units)`
                          : `Unit ${matchedUnits[0]?.unitNumber || l.unitId}`;

                      const statusClass =
                        l.status === 'active'
                          ? 'badge-green'
                          : l.status === 'expiring'
                          ? 'badge-yellow'
                          : 'badge-blue';

                      return (
                        <tr key={l.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {tenant?.fullName || 'Tenant'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {tenant?.phoneNumber}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{prop?.name}</div>
                            <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600 }}>
                              {unitLabel}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                              {l.startDate} to {l.endDate}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 600 }}>
                              1-Year Contract
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            AED {parseFloat(l.annualRent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                              {l.numberOfCheques || 4} Cheques
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Every 3 Months
                            </div>
                          </td>
                          <td>
                            AED {parseFloat(l.securityDeposit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span className={`badge ${statusClass}`}>{l.status}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '11.5px',
                                  padding: '5px 8px',
                                  borderColor: '#bbf7d0',
                                  color: '#166534',
                                  background: '#f0fdf4',
                                  fontWeight: 600,
                                }}
                                onClick={() => setSelectedContractLease(l)}
                                title="Generate official 1-year Ejari tenancy contract"
                              >
                                <FileText size={13} color="#166534" />
                                <span>Contract</span>
                              </button>
                              {onEditLease && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '5px 8px', fontSize: '11.5px' }}
                                  title="Edit Lease"
                                  onClick={() => onEditLease(l)}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {onDeleteLease && (
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '5px 8px', fontSize: '11.5px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                                  title="Delete Lease"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete this lease for ${tenant?.fullName || 'tenant'}? Associated rent charges will also be removed.`)) {
                                      onDeleteLease(l.id);
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
      )}

      {/* Tenants View */}
      {activeTab === 'tenants' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tenant Directory</h3>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddTenant}>
              + Add Tenant
            </button>
          </div>
          <div className="card-body">
            {tenants.length === 0 ? (
              <div className="empty-state">No tenants found</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant & Rented Units</th>
                      <th>Contact Info</th>
                      <th>Emirates ID</th>
                      <th>Preferred Channel</th>
                      <th>Internal Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => {
                      const tenantLeases = leases.filter((l) => l.tenantId === t.id && l.status === 'active');
                      const leasedUnitIds = Array.from(
                        new Set(
                          tenantLeases.flatMap((l) =>
                            l.unitIds && l.unitIds.length > 0 ? l.unitIds : [l.unitId]
                          )
                        )
                      );
                      const tenantUnits = units.filter((u) => leasedUnitIds.includes(u.id));

                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.fullName}</div>
                            {tenantUnits.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {tenantUnits.map((tu) => (
                                  <span
                                    key={tu.id}
                                    className="badge badge-blue"
                                    style={{ fontSize: '10.5px', padding: '1px 6px' }}
                                    title={`Unit ${tu.unitNumber} (${tu.type === 'commercial' || tu.isShop ? 'Commercial' : `${tu.bedrooms} Bed`})`}
                                  >
                                    Unit {tu.unitNumber} {tu.type === 'commercial' || tu.isShop ? '• Commercial' : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>No active units</span>
                            )}
                          </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} color="#64748b" />
                            <span>{t.phoneNumber}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                            <Mail size={12} color="#64748b" />
                            <span>{t.email}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {t.emiratesId || 'Not provided'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-blue">{t.preferredContact}</span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#475569' }}>
                          {t.notes || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {onEditTenant && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11.5px' }}
                                title="Edit Tenant"
                                onClick={() => onEditTenant(t)}
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            {onDeleteTenant && (
                              <button
                                className="btn btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11.5px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                                title="Delete Tenant"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${t.fullName}?`)) {
                                    onDeleteTenant(t.id);
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
      )}

      {/* Tenancy Contract Generation Modal */}
      {selectedContractLease && (
        <TenancyContractModal
          lease={selectedContractLease}
          tenant={contractTenant}
          property={contractProp}
          unit={contractUnit}
          onClose={() => setSelectedContractLease(null)}
        />
      )}
    </div>
  );
}
