'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  DollarSign,
  DoorOpen,
  Car,
  Store,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Phone,
  User,
  Key,
} from 'lucide-react';
import { Property, Unit } from '@rental-saas/contracts';

interface BuildingViewProps {
  property: Property;
  units: Unit[];
  period: string; // e.g. "2026-10"
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onRecordPaymentForUnit?: (unit: Unit) => void;
  onEditUnit?: (unit: Unit) => void;
  onDeleteUnit?: (unitId: string) => void;
}

export function BuildingView({
  property,
  units,
  period,
  onPrevMonth,
  onNextMonth,
  onRecordPaymentForUnit,
  onEditUnit,
  onDeleteUnit,
}: BuildingViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const uniqueFloors = Array.from(new Set(units.map((u) => u.floor || '1st Floor')));
  const standardOrder = ['5th Floor', '4th Floor', '3rd Floor', '2nd Floor', '1st Floor', 'Ground Floor'];
  const floorOrder = standardOrder.filter((f) => uniqueFloors.includes(f));
  uniqueFloors.forEach((f) => {
    if (!floorOrder.includes(f)) floorOrder.push(f);
  });

  // Format period for display
  const formatPeriod = (ym: string) => {
    try {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  const periodShort = formatPeriod(period).replace(' ', ' ');

  // Compute filter counts
  const totalCount = units.length;
  const occupiedCount = units.filter((u) => u.status === 'occupied').length;
  const vacantCount = units.filter((u) => u.status === 'vacant').length;
  const paidCount = units.filter((u) => u.paymentStatus === 'paid').length;
  const partialCount = units.filter((u) => u.paymentStatus === 'partially_paid').length;
  const overdueCount = units.filter((u) => u.paymentStatus === 'overdue').length;
  const pendingCount = units.filter((u) => u.paymentStatus === 'pending').length;
  const hasPendingCount = overdueCount + partialCount + pendingCount;

  // Filter unit checker
  const isUnitVisible = (u: Unit) => {
    if (filterStatus === 'occupied' && u.status !== 'occupied') return false;
    if (filterStatus === 'vacant' && u.status !== 'vacant') return false;
    if (filterStatus === 'paid' && u.paymentStatus !== 'paid') return false;
    if (filterStatus === 'partial' && u.paymentStatus !== 'partially_paid') return false;
    if (filterStatus === 'overdue' && u.paymentStatus !== 'overdue') return false;
    if (filterStatus === 'pending' && u.paymentStatus !== 'pending') return false;
    if (filterStatus === 'has_pending' && u.paymentStatus !== 'overdue' && u.paymentStatus !== 'partially_paid' && u.paymentStatus !== 'pending') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchUnit = u.unitNumber.toLowerCase().includes(q);
      const matchTenant = u.currentTenantName?.toLowerCase().includes(q);
      if (!matchUnit && !matchTenant) return false;
    }
    return true;
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* 1. Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#064e3b', letterSpacing: '-0.5px' }}>
            Building View
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            Visual map of all {units.filter((u) => !u.isShop).length} rooms and{' '}
            {units.filter((u) => u.isShop).length || 1} shop for {periodShort} — click any unit for details.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Period selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '4px 6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <button
              onClick={onPrevMonth}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px',
                color: '#64748b',
                display: 'flex',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              <span>{formatPeriod(period)}</span>
              <Calendar size={14} color="#64748b" />
            </div>
            <button
              onClick={onNextMonth}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px',
                color: '#64748b',
                display: 'flex',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600, color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
            onClick={() => alert(`Rent collection cadence configured for ${property.name} at standard AED rates.`)}
          >
            <DollarSign size={14} />
            <span>Set rent for all rooms</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Pills Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'all' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'all' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            All ({totalCount})
          </button>

          <button
            onClick={() => setFilterStatus('occupied')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'occupied' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'occupied' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Occupied ({occupiedCount})
          </button>

          <button
            onClick={() => setFilterStatus('vacant')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'vacant' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'vacant' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Vacant ({vacantCount})
          </button>

          <button
            onClick={() => setFilterStatus('has_pending')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'has_pending' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'has_pending' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Has pending ({hasPendingCount})
          </button>

          <button
            onClick={() => setFilterStatus('paid')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'paid' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'paid' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Paid ({paidCount})
          </button>

          <button
            onClick={() => setFilterStatus('partial')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'partial' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'partial' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Partial ({partialCount})
          </button>

          <button
            onClick={() => setFilterStatus('overdue')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterStatus === 'overdue' ? '#4f46e5' : '#ffffff',
              color: filterStatus === 'overdue' ? '#ffffff' : '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Overdue ({overdueCount})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Room no, or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 34px',
              fontSize: '12.5px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 3. Legend Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12px',
          color: '#475569',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }} />
          <span>Paid</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }} />
          <span>Partially paid</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284c7', display: 'inline-block' }} />
          <span>Pending (not yet due)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }} />
          <span>Overdue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px dashed #94a3b8', background: '#f1f5f9', display: 'inline-block' }} />
          <span>Vacant</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '11.5px', marginLeft: 'auto' }}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>&ldquo;+Nm&rdquo;</span> = months of previous dues
        </div>
      </div>

      {/* 4. THE VISUAL BUILDING STRUCTURE */}
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Roof Canopy */}
        <div
          style={{
            background: 'linear-gradient(180deg, #4f46e5 0%, #312e81 100%)',
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
            padding: '16px 20px',
            textAlign: 'center',
            color: '#ffffff',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.2px' }}>
            {property.name}
          </div>
          <div style={{ fontSize: '11.5px', color: '#c7d2fe', fontWeight: 600 }}>
            {occupiedCount}/{totalCount} rooms occupied
          </div>
        </div>

        {/* Building Body Container */}
        <div
          style={{
            borderLeft: '4px solid #4f46e5',
            borderRight: '4px solid #4f46e5',
            background: '#eef2ff',
            padding: '10px 10px 0',
          }}
        >
          {floorOrder.map((floorName) => {
            const floorUnits = units.filter((u) => u.floor === floorName);
            if (floorUnits.length === 0) return null;

            // Extract floor number label: '5', '4', '3', '2', '1', 'G'
            const floorLabel = floorName.startsWith('Ground') ? 'G' : floorName.charAt(0);
            const floorSub = floorName.startsWith('Ground') ? 'GROUND' : 'FLOOR';

            return (
              <div
                key={floorName}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  marginBottom: '10px',
                  gap: '8px',
                }}
              >
                {/* Floor Badge on the left */}
                <div
                  style={{
                    width: '64px',
                    background: '#4f46e5',
                    color: '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    flexShrink: 0,
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
                  }}
                >
                  <span style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{floorLabel}</span>
                  <span style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.5px', color: '#86efac' }}>
                    {floorSub}
                  </span>
                </div>

                {/* Units on this floor */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: floorName.startsWith('Ground')
                      ? '1.8fr 1.1fr 1.1fr'
                      : 'repeat(6, 1fr)',
                    gap: '8px',
                    flex: 1,
                  }}
                >
                  {floorUnits.map((u) => {
                    const isVisible = isUnitVisible(u);
                    const isOverdue = u.paymentStatus === 'overdue';
                    const isPaid = u.paymentStatus === 'paid';
                    const isVacant = u.status === 'vacant';
                    const isPartial = u.paymentStatus === 'partially_paid';

                    // Dot color
                    const dotColor = isPaid
                      ? '#10b981'
                      : isOverdue
                      ? '#ef4444'
                      : isPartial
                      ? '#f59e0b'
                      : isVacant
                      ? '#94a3b8'
                      : '#0284c7';

                    // Card borders and backgrounds
                    const cardBg = isVacant
                      ? '#f1f5f9'
                      : isOverdue
                      ? '#fff5f5'
                      : isPartial
                      ? '#fffbeb'
                      : '#ffffff';

                    const cardBorder = isVacant
                      ? '1.5px dashed #cbd5e1'
                      : isOverdue
                      ? '1.5px solid #fecaca'
                      : isPartial
                      ? '1.5px solid #fde68a'
                      : '1.5px solid #bbf7d0';

                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUnit(u)}
                        style={{
                          background: cardBg,
                          border: cardBorder,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: isVisible ? 1 : 0.25,
                          transform: isVisible ? 'scale(1)' : 'scale(0.98)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          minHeight: '82px',
                        }}
                      >
                        {/* Red due badge on top right if +1m / +3m */}
                        {u.previousDuesMonths && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-4px',
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 4px rgba(239,68,68,0.4)',
                              zIndex: 10,
                            }}
                          >
                            +{u.previousDuesMonths}m
                          </div>
                        )}

                        {/* Top row: Unit # and status dot */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                            {u.isShop ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Store size={13} color="#166534" />
                                {u.unitNumber}
                              </span>
                            ) : (
                              u.unitNumber
                            )}
                          </span>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: dotColor,
                              display: 'inline-block',
                            }}
                          />
                        </div>

                        {/* Middle row: Two horizontal indicator bars */}
                        <div style={{ display: 'flex', gap: '3px', margin: '4px 0' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: isVacant ? '#e2e8f0' : isOverdue ? '#fee2e2' : isPartial ? '#fef3c7' : '#dcfce7',
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: isVacant ? '#e2e8f0' : isOverdue ? '#fee2e2' : isPartial ? '#fef3c7' : '#dcfce7',
                            }}
                          />
                        </div>

                        {/* Bottom: Tenant & Rent Status */}
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isVacant ? '#94a3b8' : '#334155',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {u.currentTenantName || 'Vacant'}
                          </div>

                          <div
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              marginTop: '1px',
                              color: isPaid
                                ? '#166534'
                                : isOverdue
                                ? '#dc2626'
                                : isPartial
                                ? '#b45309'
                                : '#64748b',
                            }}
                          >
                            {isPaid && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Check size={11} strokeWidth={3} />
                                <span>AED {parseFloat(u.paidAmount || u.marketRent).toLocaleString()}</span>
                              </span>
                            )}
                            {isOverdue && (
                              <span>Due AED {parseFloat(u.dueAmount || u.marketRent).toLocaleString()}</span>
                            )}
                            {isPartial && (
                              <span>Due AED {parseFloat(u.dueAmount || '9000').toLocaleString()}</span>
                            )}
                            {isVacant && (
                              <span>AED {parseFloat(u.marketRent).toLocaleString()}/mo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Ground Floor Extras: Entrance & Parking */}
                  {floorName.startsWith('Ground') && (
                    <>
                      {/* Entrance */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          color: '#475569',
                          padding: '10px',
                        }}
                      >
                        <DoorOpen size={24} color="#166534" />
                        <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Entrance</span>
                      </div>

                      {/* Parking */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1.5px dashed #cbd5e1',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          color: '#64748b',
                          padding: '10px',
                        }}
                      >
                        <Car size={22} color="#64748b" />
                        <span style={{ fontSize: '11.5px', fontWeight: 600 }}>P Parking</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Building Foundation Base */}
        <div
          style={{
            height: '18px',
            background: 'linear-gradient(180deg, #4f46e5 0%, #1e1b4b 100%)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
          }}
        />
      </div>

      {/* 5. Bottom Status Strip (4 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginTop: '28px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <span
            style={{
              background: '#dcfce7',
              color: '#166534',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check size={12} strokeWidth={3} /> Paid
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{paidCount}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>units in {periodShort}</span>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <span
            style={{
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            ◐ Partially Paid
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{partialCount}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>units in {periodShort}</span>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <span
            style={{
              background: '#e0f2fe',
              color: '#075985',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            ○ Pending
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{pendingCount}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>units in {periodShort}</span>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <span
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            ! Overdue
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{overdueCount}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>units in {periodShort}</span>
        </div>
      </div>

      {/* 6. Interactive Unit Details Modal */}
      {selectedUnit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#4f46e5" />
                <h3 className="modal-title">
                  {selectedUnit.isShop ? selectedUnit.unitNumber : `Unit ${selectedUnit.unitNumber}`} Details
                </h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedUnit(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Floor</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{selectedUnit.floor}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Status</div>
                  <span
                    className={`badge ${
                      selectedUnit.paymentStatus === 'paid'
                        ? 'badge-green'
                        : selectedUnit.paymentStatus === 'overdue'
                        ? 'badge-red'
                        : selectedUnit.status === 'vacant'
                        ? 'badge-blue'
                        : 'badge-yellow'
                    }`}
                  >
                    {selectedUnit.paymentStatus?.replace('_', ' ') || selectedUnit.status}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '2px' }}>Current Occupant / Tenant</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                  {selectedUnit.currentTenantName || 'Vacant — No active tenant'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Monthly Rent</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                    AED {parseFloat(selectedUnit.marketRent).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Outstanding Dues</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '14px',
                      color: selectedUnit.paymentStatus === 'overdue' ? '#dc2626' : '#166534',
                    }}
                  >
                    AED {parseFloat(selectedUnit.dueAmount || '0').toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedUnit.previousDuesMonths && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#991b1b',
                    marginBottom: '14px',
                  }}
                >
                  <strong>Notice:</strong> This unit has {selectedUnit.previousDuesMonths} month(s) of overdue rent arrears.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onDeleteUnit && (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                    onClick={() => {
                      const u = selectedUnit;
                      if (window.confirm(`Are you sure you want to delete Unit ${u.unitNumber}?`)) {
                        setSelectedUnit(null);
                        onDeleteUnit(u.id);
                      }
                    }}
                  >
                    Delete Unit
                  </button>
                )}
                {onEditUnit && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const u = selectedUnit;
                      setSelectedUnit(null);
                      onEditUnit(u);
                    }}
                  >
                    Edit Unit
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedUnit(null)}>
                  Close
                </button>
                {selectedUnit.status === 'occupied' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const u = selectedUnit;
                      setSelectedUnit(null);
                      if (onRecordPaymentForUnit) onRecordPaymentForUnit(u);
                    }}
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
