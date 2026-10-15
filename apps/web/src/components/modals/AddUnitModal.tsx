'use client';

import React, { useState } from 'react';

interface AddUnitModalProps {
  propertyId: string;
  propertyName?: string;
  onClose: () => void;
  onSubmit: (propId: string, data: any) => Promise<void>;
}

export function AddUnitModal({
  propertyId,
  propertyName,
  onClose,
  onSubmit,
}: AddUnitModalProps) {
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [squareFeet, setSquareFeet] = useState('');
  const [marketRent, setMarketRent] = useState('');
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
        floor: floor || null,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        squareFeet: squareFeet ? parseFloat(squareFeet) : null,
        marketRent: rentNum.toFixed(2),
        status: 'vacant',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add Unit</h3>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 101, 2004, Villa 12"
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
                  placeholder="e.g. 1st Floor, Penthouse"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
            </div>

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
              {isSubmitting ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
