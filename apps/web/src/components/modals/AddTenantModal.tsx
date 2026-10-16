'use client';

import React, { useState } from 'react';
import { Tenant } from '@rental-saas/contracts';

interface AddTenantModalProps {
  tenant?: Tenant | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function AddTenantModal({ tenant, onClose, onSubmit }: AddTenantModalProps) {
  const [fullName, setFullName] = useState(tenant?.fullName || '');
  const [email, setEmail] = useState(tenant?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(tenant?.phoneNumber || '');
  const [emiratesId, setEmiratesId] = useState(tenant?.emiratesId || '');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'whatsapp'>(
    tenant?.preferredContact || 'email'
  );
  const [notes, setNotes] = useState(tenant?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      setErrorMsg('Full name, email, and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName,
        email,
        phoneNumber,
        emiratesId: emiratesId || null,
        preferredContact,
        notes: notes || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (tenant ? 'Failed to update tenant profile' : 'Failed to create tenant profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{tenant ? 'Edit Tenant Profile' : 'New Tenant Profile'}</h3>
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
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Tariq Mansoor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Phone (UAE) *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+971 50 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Emirates ID (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="784-YYYY-XXXXXXX-Z"
                  value={emiratesId}
                  onChange={(e) => setEmiratesId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Contact</label>
                <select
                  className="form-control"
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as any)}
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Internal Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Employer, emergency contact, preferences..."
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
              {isSubmitting ? (tenant ? 'Updating...' : 'Saving...') : tenant ? 'Update Tenant' : 'Save Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
