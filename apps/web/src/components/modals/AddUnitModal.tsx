'use client';

import React, { useState } from 'react';
import { Unit, UnitType } from '@rental-saas/contracts';

interface AddUnitModalProps {
  propertyId: string;
  propertyName?: string;
  unit?: Unit | null;
  onClose: () => void;
  onSubmit: (propId: string, data: any) => Promise<void>;
}

export function AddUnitModal({
  propertyId,
  propertyName,
  unit,
  onClose,
  onSubmit,
}: AddUnitModalProps) {
  const [unitType, setUnitType] = useState<UnitType>(
    unit?.type || (unit?.isShop ? 'commercial' : 'residential')
  );
  const [unitNumber, setUnitNumber] = useState(unit?.unitNumber || '');
  const [floor, setFloor] = useState(unit?.floor || '');
  const [bedrooms, setBedrooms] = useState(unit?.bedrooms ?? 1);
  const [bathrooms, setBathrooms] = useState(unit?.bathrooms ?? 1);
  const [squareFeet, setSquareFeet] = useState(unit?.squareFeet ? String(unit.squareFeet) : '');
  const [marketRent, setMarketRent] = useState(unit?.marketRent || '');
  const [status, setStatus] = useState(unit?.status || 'vacant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      setErrorMsg('Unit number is required.');
      return;
    }

    const rentNum = parseFloat(marketRent) || 0;
    setIsSubmitting(true);
    try {
      await onSubmit(propertyId, {
        unitNumber,
        type: unitType,
        isShop: unitType === 'commercial',
        floor: floor || null,
        bedrooms: (unitType === 'commercial' || unitType === 'parking') ? 0 : Number(bedrooms),
        bathrooms: (unitType === 'commercial' || unitType === 'parking') ? 0 : Number(bathrooms),
        squareFeet: squareFeet ? parseFloat(squareFeet) : null,
        marketRent: rentNum.toFixed(2),
        status,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (unit ? 'Failed to update unit' : 'Failed to add unit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{unit ? 'Edit Unit' : 'Add Unit'}</h3>
            <p style={{ fontSize: '11px', color: '#64748b' }}>For {propertyName || 'Property'}</p>
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

            {/* Unit Type Selection */}
            <div className="form-group">
              <label className="form-label">Unit Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: unitType === 'residential' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: unitType === 'residential' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: unitType === 'residential' ? '#0369a1' : '#475569',
                  }}
                >
                  <input
                    type="radio"
                    name="unitType"
                    value="residential"
                    checked={unitType === 'residential'}
                    onChange={() => setUnitType('residential')}
                    style={{ accentColor: '#0284c7' }}
                  />
                  <span>Residential</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: unitType === 'commercial' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: unitType === 'commercial' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: unitType === 'commercial' ? '#0369a1' : '#475569',
                  }}
                >
                  <input
                    type="radio"
                    name="unitType"
                    value="commercial"
                    checked={unitType === 'commercial'}
                    onChange={() => setUnitType('commercial')}
                    style={{ accentColor: '#0284c7' }}
                  />
                  <span>Commercial</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: unitType === 'parking' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: unitType === 'parking' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: unitType === 'parking' ? '#0369a1' : '#475569',
                  }}
                >
                  <input
                    type="radio"
                    name="unitType"
                    value="parking"
                    checked={unitType === 'parking'}
                    onChange={() => setUnitType('parking')}
                    style={{ accentColor: '#0284c7' }}
                  />
                  <span>Parking</span>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    unitType === 'parking'
                      ? 'e.g. P-01, Bay 12, P-101'
                      : unitType === 'commercial'
                      ? 'e.g. Shop 1, Office 204'
                      : 'e.g. 101, 2004, Villa 12'
                  }
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Floor / Level</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ground Floor, 1st Floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
            </div>

            {/* If Commercial, bedroom and bathroom are NOT asked */}
            {unitType === 'residential' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Size (Sq Ft)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="e.g. 950"
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Annual Market Rent (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="e.g. 85000.00"
                  value={marketRent}
                  onChange={(e) => setMarketRent(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (unit ? 'Saving...' : 'Adding...') : unit ? 'Save Changes' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
