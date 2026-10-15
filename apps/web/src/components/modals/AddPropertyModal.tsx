'use client';

import React, { useState } from 'react';
import { UAEEmirate, PropertyType } from '@rental-saas/contracts';

interface AddPropertyModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function AddPropertyModal({ onClose, onSubmit }: AddPropertyModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PropertyType>('residential');
  const [emirate, setEmirate] = useState<UAEEmirate>('Dubai');
  const [communityArea, setCommunityArea] = useState('');
  const [address, setAddress] = useState('');
  const [buildingReference, setBuildingReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Add Property / Building</h3>
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
              <label className="form-label">Property Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Marina Crown Tower, Downtown Residences"
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
                  <option value="residential">Residential Apartment</option>
                  <option value="apartment_building">Apartment Building / Tower</option>
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
                  placeholder="e.g. Dubai Marina, Business Bay, Corniche"
                  value={communityArea}
                  onChange={(e) => setCommunityArea(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Building / Plot Reference</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. BLDG-402, Plot 102"
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
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
