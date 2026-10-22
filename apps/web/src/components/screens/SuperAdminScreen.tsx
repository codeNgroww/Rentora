'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Edit2,
  Trash2,
  Key,
  Copy,
  Check,
  RefreshCw,
  X,
  Users,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { Company, CreateCompanyDto, UpdateCompanyDto, CompanyUser, UserRole, UAEEmirate } from '@rental-saas/contracts';
import { api } from '../../lib/api';

interface SuperAdminScreenProps {
  onCompanySelect?: (company: Company) => void;
}

export function SuperAdminScreen({ onCompanySelect }: SuperAdminScreenProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Company for Actions
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateCompanyDto>({
    name: '',
    tradeLicenseNo: '',
    trn: '',
    emirate: 'Dubai',
    address: '',
    status: 'active',
    pocName: '',
    pocEmail: '',
    pocPhone: '',
  });

  // Role Authorization Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    userName: string;
    userEmail: string;
    role: UserRole;
    phone: string;
    password: string;
  }>({
    userName: '',
    userEmail: '',
    role: 'manager',
    phone: '',
    password: '',
  });

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetSuccessData, setResetSuccessData] = useState<{ email: string; password: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState<CreateCompanyDto>({
    name: '',
    tradeLicenseNo: '',
    trn: '',
    emirate: 'Dubai',
    address: '',
    defaultCurrency: 'AED',
    poc: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSuperAdminCompanies();
      setCompanies(data);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Handle Create Company
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Company Name is required.');
      return;
    }
    if (!formData.poc.email.trim() || !formData.poc.fullName.trim()) {
      setErrorMsg('POC Name and POC Email are required.');
      return;
    }

    setIsActionLoading(true);
    try {
      const created = await api.createCompany(formData);
      setSuccessMsg(`Company "${created.name}" and POC account provisioned successfully!`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        tradeLicenseNo: '',
        trn: '',
        emirate: 'Dubai',
        address: '',
        defaultCurrency: 'AED',
        poc: {
          fullName: '',
          email: '',
          password: '',
          phone: '',
        },
      });
      await loadCompanies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create company.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (comp: Company) => {
    setSelectedCompany(comp);
    setEditFormData({
      name: comp.name || '',
      tradeLicenseNo: comp.tradeLicenseNo || '',
      trn: comp.trn || '',
      emirate: comp.emirate || 'Dubai',
      address: comp.address || '',
      status: comp.status === 'suspended' ? 'suspended' : 'active',
      pocName: comp.pocName || '',
      pocEmail: comp.pocEmail || '',
      pocPhone: comp.pocPhone || '',
    });
    setErrorMsg('');
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setErrorMsg('');
    setIsActionLoading(true);

    try {
      const updated = await api.updateCompany(selectedCompany.id, editFormData);
      setSuccessMsg(`Company "${updated.name}" updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedCompany(null);
      await loadCompanies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update company.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Role Authorization Modal
  const openRoleAuthModal = async (comp: Company) => {
    setSelectedCompany(comp);
    setErrorMsg('');
    setIsRoleModalOpen(true);
    setIsAddUserOpen(false);
    setIsLoadingUsers(true);
    try {
      const users = await api.getCompanyUsers(comp.id);
      setCompanyUsers(users);
    } catch {
      setCompanyUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Update a User's Role
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!selectedCompany) return;
    try {
      await api.updateCompanyUserRole(selectedCompany.id, userId, newRole);
      setCompanyUsers(prev =>
        prev.map(u => (u.id === userId || u.userId === userId ? { ...u, role: newRole } : u))
      );
      setSuccessMsg('User role updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role.');
    }
  };

  // Authorize New User for Company
  const handleAddCompanyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    if (!newUserForm.userName.trim() || !newUserForm.userEmail.trim()) {
      setErrorMsg('User Name and Email are required.');
      return;
    }

    setIsActionLoading(true);
    try {
      await api.createCompanyUser(selectedCompany.id, {
        userName: newUserForm.userName,
        userEmail: newUserForm.userEmail,
        role: newUserForm.role,
        phone: newUserForm.phone,
        password: newUserForm.password || 'password123',
      });
      const updatedList = await api.getCompanyUsers(selectedCompany.id);
      setCompanyUsers(updatedList);
      setIsAddUserOpen(false);
      setNewUserForm({
        userName: '',
        userEmail: '',
        role: 'manager',
        phone: '',
        password: '',
      });
      setSuccessMsg(`User ${newUserForm.userName} authorized as ${newUserForm.role}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authorize user.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Revoke User Access
  const handleDeleteCompanyUser = async (userId: string) => {
    if (!selectedCompany) return;
    try {
      await api.deleteCompanyUser(selectedCompany.id, userId);
      setCompanyUsers(prev => prev.filter(u => u.id !== userId && u.userId !== userId));
      setSuccessMsg('User access revoked successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke access.');
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (comp: Company) => {
    setSelectedCompany(comp);
    setNewPasswordVal(`Rentora@${Math.floor(100000 + Math.random() * 900000)}`);
    setResetSuccessData(null);
    setCopiedPassword(false);
    setErrorMsg('');
    setIsResetModalOpen(true);
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setErrorMsg('');
    setIsActionLoading(true);

    try {
      await api.resetCompanyPassword(selectedCompany.id, newPasswordVal);
      setResetSuccessData({
        email: selectedCompany.pocEmail,
        password: newPasswordVal,
      });
      setSuccessMsg(`Password for ${selectedCompany.pocName} (${selectedCompany.pocEmail}) reset successfully.`);
      await loadCompanies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetSuccessData?.password) {
      navigator.clipboard.writeText(resetSuccessData.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2500);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (comp: Company) => {
    setSelectedCompany(comp);
    setErrorMsg('');
    setIsDeleteModalOpen(true);
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return;
    setErrorMsg('');
    setIsActionLoading(true);

    try {
      await api.deleteCompany(selectedCompany.id);
      setSuccessMsg(`Company "${selectedCompany.name}" and associated records deleted permanently.`);
      setIsDeleteModalOpen(false);
      setSelectedCompany(null);
      await loadCompanies();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete company.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.pocEmail && c.pocEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.trn && c.trn.includes(searchQuery))
  );

  return (
    <div className="screen-container">
      {/* Header Banner */}
      <div
        className="kpi-card"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          marginBottom: '24px',
          padding: '24px 28px',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={24} color="#818cf8" />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe' }}>
                Platform Governance & Tenant Control
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Super Admin Console
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#cbd5e1', maxWidth: '640px' }}>
              Full governance authority: create, update, delete tenant companies, manage role authorizations per company, and reset account credentials.
            </p>
          </div>
          <button
            id="superadmin-onboard-btn"
            type="button"
            className="btn btn-primary"
            style={{
              backgroundColor: '#4f46e5',
              padding: '11px 22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>+ Onboard New Company</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search & Statistics Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search company, TRN, or POC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13.5px', color: '#64748b' }}>
          <div>
            Active Tenants: <strong style={{ color: '#0f172a' }}>{companies.filter(c => c.status !== 'suspended').length}</strong>
          </div>
          <div>
            Total Provisioned: <strong style={{ color: '#0f172a' }}>{companies.length}</strong>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadCompanies}
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Companies Grid / Table */}
      {isLoading ? (
        <div className="empty-state">Loading tenant companies...</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="empty-state">
          <Building size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
          <h3>No companies found</h3>
          <p>Get started by onboarding your first client company.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Trade License / TRN</th>
                <th>Primary POC Info</th>
                <th>Emirate</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Super Admin Authority</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {c.id}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>License: {c.tradeLicenseNo || 'N/A'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>TRN: {c.trn || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.pocName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4f46e5' }}>
                      <Mail size={12} />
                      <span>{c.pocEmail}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                      <Phone size={12} />
                      <span>{c.pocPhone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-subtle">{c.emirate || 'Dubai'}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.status === 'suspended' ? 'badge-red' : 'badge-green'
                      }`}
                    >
                      {c.status ? c.status.toUpperCase() : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-AE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {/* Edit Company */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => openEditModal(c)}
                        title="Update company information"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Role Authorization */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#eef2ff', borderColor: '#c7d2fe', color: '#4338ca' }}
                        onClick={() => openRoleAuthModal(c)}
                        title="Manage role authorizations for this company"
                      >
                        <Users size={13} />
                        <span>Roles</span>
                      </button>

                      {/* Reset Password */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => openResetPasswordModal(c)}
                        title="Reset account credentials"
                      >
                        <Key size={13} color="#f59e0b" />
                        <span>Password</span>
                      </button>

                      {/* Delete Company */}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => openDeleteModal(c)}
                        title="Permanently delete company"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Authorization Modal */}
      {isRoleModalOpen && selectedCompany && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#4f46e5" />
                <span>Role Authorization: {selectedCompany.name}</span>
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsRoleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ color: '#0f172a' }}><strong>Company:</strong> {selectedCompany.name}</div>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  Super Admin can assign, modify, or revoke role authorizations (`Company Admin`, `Property Manager`, `Accountant`) for this tenant account.
                </div>
              </div>

              {/* Add User Toggle Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Authorized Team Members ({companyUsers.length})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddUserOpen(!isAddUserOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={14} />
                  <span>{isAddUserOpen ? 'Close Form' : '+ Authorize New User'}</span>
                </button>
              </div>

              {/* Add User Form Drawer */}
              {isAddUserOpen && (
                <form
                  onSubmit={handleAddCompanyUser}
                  style={{
                    background: '#f1f5f9',
                    padding: '16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5', marginBottom: '10px' }}>
                    Authorize New Staff Member
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tariq Mansoor"
                        className="form-control"
                        value={newUserForm.userName}
                        onChange={(e) => setNewUserForm({ ...newUserForm, userName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Corporate Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="tariq@company.ae"
                        className="form-control"
                        value={newUserForm.userEmail}
                        onChange={(e) => setNewUserForm({ ...newUserForm, userEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Assigned Role *</label>
                      <select
                        className="form-control"
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                      >
                        <option value="admin">Company Admin (Full Authority)</option>
                        <option value="manager">Property Manager (Ops & Leases)</option>
                        <option value="accountant">Financial Accountant (P&L & Taxes)</option>
                        <option value="hr">Human Resources (HR Staff)</option>
                        <option value="viewer">Viewer (Read-Only Access)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temporary Password</label>
                      <input
                        type="password"
                        placeholder="Min 6 characters (default: password123)"
                        className="form-control"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsAddUserOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? 'Saving...' : 'Grant Role Authorization'}
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              {isLoadingUsers ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                  Loading authorized team...
                </div>
              ) : companyUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  No extra staff members provisioned yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>Email</th>
                        <th>Role Authorization</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyUsers.map((u) => {
                        const isPoc = u.userEmail.toLowerCase() === selectedCompany.pocEmail.toLowerCase();
                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.userName}</div>
                              {isPoc && (
                                <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                  PRIMARY POC
                                </span>
                              )}
                            </td>
                            <td style={{ color: '#64748b' }}>{u.userEmail}</td>
                            <td>
                              <select
                                className="form-control"
                                style={{ padding: '4px 8px', fontSize: '12px', height: '32px' }}
                                value={u.role || 'manager'}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                              >
                                <option value="admin">Company Admin</option>
                                <option value="manager">Property Manager</option>
                                <option value="accountant">Financial Accountant</option>
                                <option value="hr">Human Resources</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {!isPoc ? (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                  onClick={() => handleDeleteCompanyUser(u.id)}
                                  title="Revoke access"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Protected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsRoleModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Company Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={20} color="#4f46e5" />
                <span>Onboard New Tenant Company</span>
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="form-section-title" style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5', marginBottom: '12px', textTransform: 'uppercase' }}>
                  1. Company Legal Information
                </div>

                <div className="form-group">
                  <label className="form-label">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al Futtaim Real Estate LLC"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Trade License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 582910"
                      className="form-control"
                      value={formData.tradeLicenseNo}
                      onChange={(e) =>
                        setFormData({ ...formData, tradeLicenseNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax Registration Number (TRN)</label>
                    <input
                      type="text"
                      placeholder="15-digit FTA TRN"
                      className="form-control"
                      value={formData.trn}
                      onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Emirate</label>
                    <select
                      className="form-control"
                      value={formData.emirate}
                      onChange={(e) =>
                        setFormData({ ...formData, emirate: e.target.value as any })
                      }
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
                  <div className="form-group">
                    <label className="form-label">Default Currency</label>
                    <input
                      type="text"
                      disabled
                      className="form-control"
                      value="AED (Dirhams)"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Head Office Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Floor 14, Marina Plaza, Dubai Marina"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-section-title" style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5', marginTop: '20px', marginBottom: '12px', textTransform: 'uppercase' }}>
                  2. Company Point of Contact (POC) & Admin Login
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">POC Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full Name"
                      className="form-control"
                      value={formData.poc.fullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, fullName: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">POC Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +971 50 123 4567"
                      className="form-control"
                      value={formData.poc.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, phone: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">POC Email Address (Login) *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. sultan@alreemproperties.ae"
                      className="form-control"
                      value={formData.poc.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, email: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temporary Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 8 characters"
                      className="form-control"
                      value={formData.poc.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, password: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Provisioning...' : 'Provision Company & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && selectedCompany && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="#4f46e5" />
                <span>Edit Company: {selectedCompany.name}</span>
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Trade License Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.tradeLicenseNo}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, tradeLicenseNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax Registration Number (TRN)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.trn}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, trn: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Emirate</label>
                    <select
                      className="form-control"
                      value={editFormData.emirate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, emirate: e.target.value as any })
                      }
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
                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-control"
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, status: e.target.value as any })
                      }
                    >
                      <option value="active">Active (Full Access)</option>
                      <option value="suspended">Suspended (Locked)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Office Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.address}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, address: e.target.value })
                    }
                  />
                </div>

                <div className="form-section-title" style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5', marginTop: '18px', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Point of Contact Details
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">POC Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.pocName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, pocName: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">POC Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.pocPhone}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, pocPhone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">POC Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editFormData.pocEmail}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, pocEmail: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Saving...' : 'Save Company Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedCompany && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#f59e0b" />
                <span>Reset Password: {selectedCompany.name}</span>
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsResetModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div><strong>Account POC:</strong> {selectedCompany.pocName}</div>
                  <div style={{ color: '#4f46e5', marginTop: '2px' }}>
                    <strong>Login Email:</strong> {selectedCompany.pocEmail}
                  </div>
                </div>

                {!resetSuccessData ? (
                  <>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">New Password *</label>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4f46e5',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            setNewPasswordVal(
                              `Rentora@${Math.floor(100000 + Math.random() * 900000)}`
                            )
                          }
                        >
                          Generate New
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={newPasswordVal}
                        onChange={(e) => setNewPasswordVal(e.target.value)}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        This will update the company POC password in Supabase Auth immediately.
                      </span>
                    </div>

                    <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsResetModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isActionLoading}
                        style={{ backgroundColor: '#f59e0b', borderColor: '#d97706' }}
                      >
                        {isActionLoading ? 'Resetting...' : 'Confirm Password Reset'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: '#ecfdf5', borderRadius: '50%', color: '#10b981', marginBottom: '12px' }}>
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      Password Reset Successfully!
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      Share these credentials with the company POC:
                    </p>

                    <div
                      style={{
                        background: '#f1f5f9',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {resetSuccessData.password}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleCopyPassword}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {copiedPassword ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedPassword ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setIsResetModalOpen(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCompany && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ borderBottomColor: '#fee2e2' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
                <Trash2 size={20} color="#ef4444" />
                <span>Delete Company Account</span>
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                }}
              >
                <strong>Warning: Permanent Multi-Tenant Purge</strong>
                <p style={{ marginTop: '4px', margin: 0 }}>
                  Deleting <strong>{selectedCompany.name}</strong> will permanently remove all associated company properties, units, tenant leases, and POC credentials.
                </p>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b' }}>
                <div>Company ID: <code>{selectedCompany.id}</code></div>
                <div style={{ marginTop: '4px' }}>POC: {selectedCompany.pocName} ({selectedCompany.pocEmail})</div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTopColor: '#f1f5f9' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isActionLoading}
                onClick={handleDeleteConfirm}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={16} />
                <span>{isActionLoading ? 'Deleting...' : 'Permanently Delete Company'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
