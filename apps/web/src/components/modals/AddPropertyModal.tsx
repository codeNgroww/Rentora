'use client';

import React, { useState, useMemo } from 'react';
import { UAEEmirate, PropertyType, Property, UnitType } from '@rental-saas/contracts';
import { Layers, CheckCircle2, Building2, Car, Store, Home } from 'lucide-react';

interface AddPropertyModalProps {
  property?: Property | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

function getFloorName(floorNum: number): string {
  const j = floorNum % 10;
  const k = floorNum % 100;
  if (j === 1 && k !== 11) return `${floorNum}st Floor`;
  if (j === 2 && k !== 12) return `${floorNum}nd Floor`;
  if (j === 3 && k !== 13) return `${floorNum}rd Floor`;
  return `${floorNum}th Floor`;
}

export function AddPropertyModal({ property, onClose, onSubmit }: AddPropertyModalProps) {
  const [name, setName] = useState(property?.name || '');
  const [type, setType] = useState<PropertyType>(property?.type || 'apartment_building');
  const [emirate, setEmirate] = useState<UAEEmirate>(property?.emirate || 'Dubai');
  const [communityArea, setCommunityArea] = useState(property?.communityArea || '');
  const [address, setAddress] = useState(property?.address || '');
  const [buildingReference, setBuildingReference] = useState(property?.buildingReference || '');
  const [notes, setNotes] = useState(property?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generation configuration for new property
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [numberOfFloors, setNumberOfFloors] = useState<number>(5);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(3);
  const [defaultUnitType, setDefaultUnitType] = useState<UnitType>('residential');
  const [defaultRent, setDefaultRent] = useState<string>('5000');
  const [showUnitCustomizer, setShowUnitCustomizer] = useState<boolean>(false);
  const [customUnitTypes, setCustomUnitTypes] = useState<Record<string, UnitType>>({});

  // Compute auto-generated units list based on entered floors and units per floor
  const generatedUnits = useMemo(() => {
    if (!autoGenerate || numberOfFloors < 1 || unitsPerFloor < 1) return [];
    const list: Array<{
      unitNumber: string;
      floor: string;
      type: UnitType;
      marketRent: string;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
    }> = [];

    const padDigits = unitsPerFloor >= 100 ? 3 : 2;

    for (let f = 1; f <= numberOfFloors; f++) {
      const floorName = getFloorName(f);
      for (let u = 1; u <= unitsPerFloor; u++) {
        const uNum = `${f}${u.toString().padStart(padDigits, '0')}`;
        const uType = customUnitTypes[uNum] || defaultUnitType;
        const rentAmount = defaultRent ? parseFloat(defaultRent).toFixed(2) : uType === 'parking' ? '500.00' : '5000.00';
        list.push({
          unitNumber: uNum,
          floor: floorName,
          type: uType,
          marketRent: rentAmount,
          bedrooms: uType === 'residential' ? 1 : 0,
          bathrooms: uType === 'residential' ? 1 : 0,
          squareFeet: uType === 'parking' ? 150 : uType === 'commercial' ? 600 : 850,
        });
      }
    }
    return list;
  }, [autoGenerate, numberOfFloors, unitsPerFloor, defaultUnitType, defaultRent, customUnitTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !emirate) {
      setErrorMsg('Property name, address, and emirate are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        type,
        emirate,
        communityArea: communityArea || null,
        address,
        buildingReference: buildingReference || null,
        notes: notes || null,
        numberOfFloors: !property && autoGenerate ? numberOfFloors : undefined,
        unitsPerFloor: !property && autoGenerate ? unitsPerFloor : undefined,
        generatedUnits: !property && autoGenerate ? generatedUnits : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (property ? 'Failed to update property' : 'Failed to create property'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--primary)" />
            <h3 className="modal-title">{property ? 'Edit Property / Building' : 'Add Property / Building'}</h3>
          </div>
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
              <label className="form-label">Property / Building Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Armada Tower, Marina Crown, Downtown Residences"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value as PropertyType)}
                >
                  <option value="apartment_building">Apartment Building / Tower</option>
                  <option value="residential">Residential Apartment</option>
                  <option value="villa">Villa / Townhouse</option>
                  <option value="commercial">Commercial / Office</option>
                  <option value="mixed_use">Mixed Use</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">UAE Emirate *</label>
                <select
                  className="form-control"
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value as UAEEmirate)}
                >
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  <option value="Fujairah">Fujairah</option>
                  <option value="Umm Al-Quwain">Umm Al-Quwain</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Community / Area</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Jumeirah Lake Towers, Business Bay, Marina"
                  value={communityArea}
                  onChange={(e) => setCommunityArea(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Building / Plot Reference</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ARM-TWR-1, Plot 393-214"
                  value={buildingReference}
                  onChange={(e) => setBuildingReference(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Street Address *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Street name, landmark, building number"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* Auto-generation of units for new property */}
            {!property && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#15803d',
                      }}
                    >
                      <Layers size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Auto-Generate Units by Floor
                      </h4>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                        Auto-creates units (e.g. 5 floors, 3 units each = 101–103 ... 501–503)
                      </p>
                    </div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoGenerate}
                      onChange={(e) => setAutoGenerate(e.target.checked)}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span>Enable Auto-Creation</span>
                  </label>
                </div>

                {autoGenerate && (
                  <>
                    <div className="form-row" style={{ marginBottom: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>
                          Number of Floors *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="form-control"
                          value={numberOfFloors}
                          onChange={(e) => setNumberOfFloors(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>
                          Units per Floor *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          className="form-control"
                          value={unitsPerFloor}
                          onChange={(e) => setUnitsPerFloor(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row" style={{ marginBottom: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>
                          Default Unit Type
                        </label>
                        <select
                          className="form-control"
                          value={defaultUnitType}
                          onChange={(e) => setDefaultUnitType(e.target.value as UnitType)}
                        >
                          <option value="residential">Residential (Apartment / Flat)</option>
                          <option value="commercial">Commercial (Office / Retail Shop)</option>
                          <option value="parking">Parking Space</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>
                          Default Market Rent (AED / mo)
                        </label>
                        <input
                          type="number"
                          step="50"
                          className="form-control"
                          placeholder="e.g. 5000"
                          value={defaultRent}
                          onChange={(e) => setDefaultRent(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <CheckCircle2 size={15} color="#16a34a" />
                          {numberOfFloors * unitsPerFloor} Total Units Will Be Created
                        </span>

                        <button
                          type="button"
                          onClick={() => setShowUnitCustomizer(!showUnitCustomizer)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '11.5px',
                            color: '#0284c7',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          {showUnitCustomizer ? 'Hide unit details' : 'Preview & customize units'}
                        </button>
                      </div>

                      {/* Floor by floor range summary */}
                      <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
                        {numberOfFloors <= 6 ? (
                          Array.from({ length: numberOfFloors }).map((_, idx) => {
                            const f = idx + 1;
                            const padDigits = unitsPerFloor >= 100 ? 3 : 2;
                            const startU = `${f}${1..toString().padStart(padDigits, '0')}`;
                            const endU = `${f}${unitsPerFloor.toString().padStart(padDigits, '0')}`;
                            return (
                              <div key={f} style={{ display: 'flex', gap: '8px' }}>
                                <strong style={{ color: '#0f172a', minWidth: '70px' }}>Floor {f}:</strong>
                                <span>Units {unitsPerFloor === 1 ? startU : `${startU} – ${endU}`}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div>
                            <div>
                              <strong>Floor 1:</strong> Units 101 – 1{unitsPerFloor.toString().padStart(2, '0')}
                            </div>
                            <div>
                              <strong>Floor 2:</strong> Units 201 – 2{unitsPerFloor.toString().padStart(2, '0')}
                            </div>
                            <div style={{ color: '#94a3b8' }}>...</div>
                            <div>
                              <strong>Floor {numberOfFloors}:</strong> Units {numberOfFloors}01 –{' '}
                              {numberOfFloors}
                              {unitsPerFloor.toString().padStart(2, '0')}
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#64748b',
                          borderTop: '1px dashed #e2e8f0',
                          paddingTop: '6px',
                        }}
                      >
                        💡 All units will be editable anytime after creation with Residential, Commercial, and Parking types.
                      </div>

                      {/* Expandable unit customizer table */}
                      {showUnitCustomizer && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                          <div
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#0f172a',
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Customize individual unit types:</span>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                              ({generatedUnits.length} units)
                            </span>
                          </div>

                          <div
                            style={{
                              maxHeight: '190px',
                              overflowY: 'auto',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                              gap: '6px',
                              paddingRight: '4px',
                            }}
                          >
                            {generatedUnits.map((u) => {
                              const currentType = customUnitTypes[u.unitNumber] || defaultUnitType;
                              return (
                                <div
                                  key={u.unitNumber}
                                  style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    background:
                                      currentType === 'parking'
                                        ? '#f8fafc'
                                        : currentType === 'commercial'
                                        ? '#f0fdf4'
                                        : '#ffffff',
                                    fontSize: '11px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    <strong style={{ color: '#0f172a' }}>Unit {u.unitNumber}</strong>
                                    {currentType === 'parking' ? (
                                      <Car size={11} color="#64748b" />
                                    ) : currentType === 'commercial' ? (
                                      <Store size={11} color="#166534" />
                                    ) : (
                                      <Home size={11} color="#0284c7" />
                                    )}
                                  </div>
                                  <select
                                    value={currentType}
                                    onChange={(e) => {
                                      setCustomUnitTypes((prev) => ({
                                        ...prev,
                                        [u.unitNumber]: e.target.value as UnitType,
                                      }));
                                    }}
                                    style={{
                                      fontSize: '10.5px',
                                      width: '100%',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      border: '1px solid #cbd5e1',
                                      background: '#ffffff',
                                    }}
                                  >
                                    <option value="residential">Residential</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="parking">Parking</option>
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Key access details, concierge contact, etc."
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
              {isSubmitting
                ? property
                  ? 'Saving...'
                  : 'Creating...'
                : property
                ? 'Save Changes'
                : autoGenerate && generatedUnits.length > 0
                ? `Create Property & ${generatedUnits.length} Units`
                : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
