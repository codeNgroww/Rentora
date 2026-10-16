'use client';

import React, { useState } from 'react';
import { Building2, Plus, MapPin, Home, Key, Layers, Grid, Eye, Edit2, Trash2 } from 'lucide-react';
import { Property, Unit } from '@rental-saas/contracts';
import { BuildingView } from '../BuildingView';

interface PropertiesScreenProps {
  properties: Property[];
  units: Unit[];
  period: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenAddProperty: () => void;
  onEditProperty?: (property: Property) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onOpenAddUnit: (propId: string) => void;
  onEditUnit?: (unit: Unit) => void;
  onDeleteUnit?: (unitId: string) => void;
  onRecordPaymentForUnit?: (unit: Unit) => void;
}

export function PropertiesScreen({
  properties,
  units,
  period,
  onPrevMonth,
  onNextMonth,
  onOpenAddProperty,
  onEditProperty,
  onDeleteProperty,
  onOpenAddUnit,
  onEditUnit,
  onDeleteUnit,
  onRecordPaymentForUnit,
}: PropertiesScreenProps) {
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  const [displayMode, setDisplayMode] = useState<'building' | 'grid'>('building');

  React.useEffect(() => {
    if (!selectedPropId && properties.length > 0) {
      setSelectedPropId(properties[0].id);
    }
  }, [properties, selectedPropId]);

  const activeProp = properties.find((p) => p.id === selectedPropId) || properties[0];
  const propUnits = units.filter((u) => u.propertyId === activeProp?.id);

  return (
    <div>
      {/* Top Property Selector & View Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Left: Property Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
            Property:
          </span>
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPropId(p.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: selectedPropId === p.id ? 700 : 500,
                border: '1px solid',
                borderColor: selectedPropId === p.id ? '#166534' : '#e2e8f0',
                background: selectedPropId === p.id ? '#f0fdf4' : '#ffffff',
                color: selectedPropId === p.id ? '#166534' : '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Building2 size={15} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Right: View mode toggle & Add Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              onClick={() => setDisplayMode('building')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                background: displayMode === 'building' ? '#ffffff' : 'transparent',
                color: displayMode === 'building' ? '#166534' : '#64748b',
                boxShadow: displayMode === 'building' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
              }}
            >
              <Eye size={14} />
              <span>Building View</span>
            </button>

            <button
              onClick={() => setDisplayMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                background: displayMode === 'grid' ? '#ffffff' : 'transparent',
                color: displayMode === 'grid' ? '#166534' : '#64748b',
                boxShadow: displayMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
              }}
            >
              <Grid size={14} />
              <span>Units Table</span>
            </button>
          </div>

          <button id="add-property-btn" className="btn btn-primary btn-sm" onClick={onOpenAddProperty}>
            <Plus size={14} />
            <span>+ Add Property</span>
          </button>
        </div>
      </div>

      {/* Render Mode: Building View vs Traditional Grid */}
      {displayMode === 'building' && activeProp && (
        <BuildingView
          property={activeProp}
          units={propUnits}
          period={period}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onRecordPaymentForUnit={onRecordPaymentForUnit}
          onEditUnit={onEditUnit}
          onDeleteUnit={onDeleteUnit}
        />
      )}

      {displayMode === 'grid' && activeProp && (
        <div>
          {/* Property Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}
          >
            {properties.map((prop) => {
              const isSelected = prop.id === activeProp?.id;
              const pUnits = units.filter((u) => u.propertyId === prop.id);
              const occupied = pUnits.filter((u) => u.status === 'occupied').length;

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedPropId(prop.id)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : '#e2e8f0',
                    borderWidth: isSelected ? '2px' : '1px',
                    boxShadow: isSelected ? '0 4px 14px var(--primary-glow)' : 'none',
                    marginBottom: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {prop.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <MapPin size={12} color="#64748b" />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {prop.communityArea || prop.address}, {prop.emirate}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-green" style={{ fontSize: '10.5px' }}>
                        {prop.emirate}
                      </span>
                      {onEditProperty && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 7px', fontSize: '11px' }}
                          title="Edit Property"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProperty(prop);
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {onDeleteProperty && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ padding: '3px 7px', fontSize: '11px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                          title="Delete Property"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete ${prop.name}? All units will be deleted as well.`)) {
                              onDeleteProperty(prop.id);
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className="card-body"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: isSelected ? '#f0fdf4' : 'transparent',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                        Units Occupied
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        {occupied} / {pUnits.length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                        Occupancy
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d' }}>
                        {pUnits.length > 0 ? Math.round((occupied / pUnits.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unit Listing */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Units for {activeProp.name}</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  {activeProp.address} • Building Ref: {activeProp.buildingReference || 'N/A'}
                </p>
              </div>
              <button
                id="add-unit-btn"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAddUnit(activeProp.id)}
              >
                <Plus size={14} />
                <span>+ Add Unit to Property</span>
              </button>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit #</th>
                      <th>Floor</th>
                      <th>Bed / Bath</th>
                      <th>Tenant</th>
                      <th>Market Rent</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propUnits.map((u) => {
                      const statusClass =
                        u.paymentStatus === 'paid'
                          ? 'badge-green'
                          : u.paymentStatus === 'overdue'
                          ? 'badge-red'
                          : u.status === 'vacant'
                          ? 'badge-blue'
                          : 'badge-yellow';

                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Key size={14} color="var(--primary)" />
                              <span>{u.unitNumber}</span>
                            </div>
                          </td>
                          <td>{u.floor || 'Ground'}</td>
                          <td>
                            {u.bedrooms} Bed • {u.bathrooms} Bath
                          </td>
                          <td style={{ fontWeight: 600 }}>{u.currentTenantName || '—'}</td>
                          <td style={{ fontWeight: 600 }}>
                            AED {parseFloat(u.marketRent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span className={`badge ${statusClass}`}>
                              {u.paymentStatus || u.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {onEditUnit && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '11.5px' }}
                                  title="Edit Unit"
                                  onClick={() => onEditUnit(u)}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {onDeleteUnit && (
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '11.5px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                                  title="Delete Unit"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete Unit ${u.unitNumber}?`)) {
                                      onDeleteUnit(u.id);
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
