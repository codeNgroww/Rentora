'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { DashboardScreen } from '../components/screens/DashboardScreen';
import { ExpensesScreen } from '../components/screens/ExpensesScreen';
import { PropertiesScreen } from '../components/screens/PropertiesScreen';
import { TenantsLeasesScreen } from '../components/screens/TenantsLeasesScreen';
import { RentPaymentsScreen } from '../components/screens/RentPaymentsScreen';
import { ReportsScreen } from '../components/screens/ReportsScreen';
import { AuditScreen } from '../components/screens/AuditScreen';
import { SettingsScreen } from '../components/screens/SettingsScreen';

import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddPropertyModal } from '../components/modals/AddPropertyModal';
import { AddUnitModal } from '../components/modals/AddUnitModal';
import { AddTenantModal } from '../components/modals/AddTenantModal';
import { AddLeaseModal } from '../components/modals/AddLeaseModal';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';

import { api } from '../lib/api';
import {
  DashboardSummary,
  Expense,
  ExpenseCategory,
  Property,
  Unit,
  Tenant,
  Lease,
  RentCharge,
  Payment,
  Vendor,
  FinancialReportSummary,
  RentArrearsItem,
  NotificationItem,
  AuditLogItem,
} from '@rental-saas/contracts';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [period, setPeriod] = useState<string>('2026-10');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Data states
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [rentCharges, setRentCharges] = useState<RentCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [reportSummary, setReportSummary] = useState<FinancialReportSummary | null>(null);
  const [rentArrears, setRentArrears] = useState<RentArrearsItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Modal visibility & Editing states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [addUnitPropId, setAddUnitPropId] = useState('');

  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [isAddLeaseOpen, setIsAddLeaseOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        dashData,
        expData,
        catData,
        propData,
        unitData,
        tenantData,
        leaseData,
        chargeData,
        payData,
        vendorData,
        repSummary,
        arrearsData,
        notifData,
        auditData,
      ] = await Promise.all([
        api.getDashboard(period).catch(() => null),
        api.getExpenses().catch(() => []),
        api.getCategories().catch(() => []),
        api.getProperties().catch(() => []),
        api.getUnits().catch(() => []),
        api.getTenants().catch(() => []),
        api.getLeases().catch(() => []),
        api.getRentCharges().catch(() => []),
        api.getPayments().catch(() => []),
        api.getVendors().catch(() => []),
        api.getFinancialSummary().catch(() => null),
        api.getRentArrears().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getAuditLogs().catch(() => []),
      ]);

      if (dashData) setDashboardSummary(dashData);
      setExpenses(expData);
      setCategories(catData);
      setProperties(propData);
      setUnits(unitData);
      setTenants(tenantData);
      setLeases(leaseData);
      setRentCharges(chargeData);
      setPayments(payData);
      setVendors(vendorData);
      if (repSummary) setReportSummary(repSummary);
      setRentArrears(arrearsData);
      setNotifications(notifData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  // Period navigation
  const handlePrevMonth = () => {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setPeriod(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setPeriod(`${newY}-${newM}`);
  };

  // Expenses Actions
  const handleAddExpense = async (data: any) => {
    await api.createExpense(data);
    await loadData();
  };

  const handleUpdateExpense = async (id: string, data: any) => {
    await api.updateExpense(id, data);
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    await loadData();
  };

  const handleVoidExpense = async (id: string, reason: string) => {
    await api.voidExpense(id, reason);
    await loadData();
  };

  // Property Actions
  const handleAddProperty = async (data: any) => {
    await api.createProperty(data);
    await loadData();
  };

  const handleUpdateProperty = async (id: string, data: any) => {
    await api.updateProperty(id, data);
    await loadData();
  };

  const handleDeleteProperty = async (id: string) => {
    await api.deleteProperty(id);
    await loadData();
  };

  // Unit Actions
  const handleAddUnit = async (propId: string, data: any) => {
    await api.createUnit(propId, data);
    await loadData();
  };

  const handleUpdateUnit = async (id: string, data: any) => {
    await api.updateUnit(id, data);
    await loadData();
  };

  const handleDeleteUnit = async (id: string) => {
    await api.deleteUnit(id);
    await loadData();
  };

  // Tenant Actions
  const handleAddTenant = async (data: any) => {
    await api.createTenant(data);
    await loadData();
  };

  const handleUpdateTenant = async (id: string, data: any) => {
    await api.updateTenant(id, data);
    await loadData();
  };

  const handleDeleteTenant = async (id: string) => {
    await api.deleteTenant(id);
    await loadData();
  };

  // Lease Actions
  const handleAddLease = async (data: any) => {
    await api.createLease(data);
    await loadData();
  };

  const handleUpdateLease = async (id: string, data: any) => {
    await api.updateLease(id, data);
    await loadData();
  };

  const handleDeleteLease = async (id: string) => {
    await api.deleteLease(id);
    await loadData();
  };

  // Rent & Payment Actions
  const handleRecordPayment = async (data: any) => {
    await api.recordPayment(data);
    await loadData();
  };

  const handleEditCharge = async (charge: RentCharge) => {
    const newAmount = prompt('Enter updated installment amount (AED):', charge.amount);
    if (newAmount === null) return;
    const newDate = prompt('Enter updated due date (YYYY-MM-DD):', charge.dueDate);
    if (newDate === null) return;
    await api.updateRentCharge(charge.id, { amount: newAmount, dueDate: newDate });
    await loadData();
  };

  const handleDeleteCharge = async (id: string) => {
    await api.deleteRentCharge(id);
    await loadData();
  };

  const handleEditPayment = async (payment: Payment) => {
    const newRef = prompt('Enter payment reference #:', payment.reference || '');
    if (newRef === null) return;
    const newNotes = prompt('Enter payment notes:', payment.notes || '');
    if (newNotes === null) return;
    await api.updatePayment(payment.id, { reference: newRef, notes: newNotes });
    await loadData();
  };

  const handleDeletePayment = async (id: string) => {
    await api.deletePayment(id);
    await loadData();
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleExportCsv = (type = 'expenses') => {
    if (type === 'expenses') {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Date,Property,Category,Description,Paid Via,Amount (AED),Status\n';
      expenses.forEach((e) => {
        const cat = categories.find((c) => c.id === e.categoryId)?.name || '';
        const prop = properties.find((p) => p.id === e.propertyId)?.name || '';
        csvContent += `"${e.expenseDate}","${prop}","${cat}","${e.description}","${e.paymentMethod}","${e.amount}","${e.status}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `expenses_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Portfolio Overview';
      case 'properties':
        return 'Properties & Units';
      case 'tenants':
        return 'Tenants & Leases';
      case 'expenses':
        return 'Expenses Management';
      case 'rent':
        return 'Rent & Collections';
      case 'reports':
        return 'Financial Reports';
      case 'audit':
        return 'Audit Logs';
      case 'settings':
        return 'Workspace Administration';
      default:
        return 'Rental Manager';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        arrearsCount={rentArrears.length}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <TopBar
          title={getPageTitle()}
          period={period}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onOpenAddExpense={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
        />

        <main className="content-body">
          {isLoading && !dashboardSummary ? (
            <div className="empty-state">Loading portfolio records...</div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardScreen
                  summary={dashboardSummary}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'expenses' && (
                <ExpensesScreen
                  expenses={expenses}
                  categories={categories}
                  properties={properties}
                  units={units}
                  period={period}
                  onOpenAddModal={() => {
                    setEditingExpense(null);
                    setIsAddExpenseOpen(true);
                  }}
                  onEditExpense={(expense) => setEditingExpense(expense)}
                  onDeleteExpense={handleDeleteExpense}
                  onVoidExpense={handleVoidExpense}
                  onExportCsv={() => handleExportCsv('expenses')}
                />
              )}

              {currentTab === 'properties' && (
                <PropertiesScreen
                  properties={properties}
                  units={units}
                  period={period}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onOpenAddProperty={() => {
                    setEditingProperty(null);
                    setIsAddPropertyOpen(true);
                  }}
                  onEditProperty={(prop) => setEditingProperty(prop)}
                  onDeleteProperty={handleDeleteProperty}
                  onOpenAddUnit={(propId) => {
                    setEditingUnit(null);
                    setAddUnitPropId(propId);
                    setIsAddUnitOpen(true);
                  }}
                  onEditUnit={(unit) => {
                    setEditingUnit(unit);
                    setAddUnitPropId(unit.propertyId);
                    setIsAddUnitOpen(true);
                  }}
                  onDeleteUnit={handleDeleteUnit}
                  onRecordPaymentForUnit={(u) => {
                    setIsRecordPaymentOpen(true);
                  }}
                />
              )}

              {currentTab === 'tenants' && (
                <TenantsLeasesScreen
                  tenants={tenants}
                  leases={leases}
                  properties={properties}
                  units={units}
                  onOpenAddTenant={() => {
                    setEditingTenant(null);
                    setIsAddTenantOpen(true);
                  }}
                  onEditTenant={(tenant) => setEditingTenant(tenant)}
                  onDeleteTenant={handleDeleteTenant}
                  onOpenAddLease={() => {
                    setEditingLease(null);
                    setIsAddLeaseOpen(true);
                  }}
                  onEditLease={(lease) => setEditingLease(lease)}
                  onDeleteLease={handleDeleteLease}
                />
              )}

              {currentTab === 'rent' && (
                <RentPaymentsScreen
                  charges={rentCharges}
                  payments={payments}
                  tenants={tenants}
                  properties={properties}
                  units={units}
                  onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
                  onEditCharge={handleEditCharge}
                  onDeleteCharge={handleDeleteCharge}
                  onEditPayment={handleEditPayment}
                  onDeletePayment={handleDeletePayment}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsScreen
                  summary={reportSummary}
                  arrears={rentArrears}
                  onExportCsv={handleExportCsv}
                />
              )}

              {currentTab === 'audit' && (
                <AuditScreen
                  logs={auditLogs}
                  tenants={tenants}
                  properties={properties}
                  units={units}
                />
              )}

              {currentTab === 'settings' && <SettingsScreen />}
            </>
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      {(isAddExpenseOpen || editingExpense) && (
        <AddExpenseModal
          expense={editingExpense}
          categories={categories}
          properties={properties}
          units={units}
          vendors={vendors}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setEditingExpense(null);
          }}
          onSubmit={async (data) => {
            if (editingExpense) {
              await handleUpdateExpense(editingExpense.id, data);
            } else {
              await handleAddExpense(data);
            }
          }}
        />
      )}

      {(isAddPropertyOpen || editingProperty) && (
        <AddPropertyModal
          property={editingProperty}
          onClose={() => {
            setIsAddPropertyOpen(false);
            setEditingProperty(null);
          }}
          onSubmit={async (data) => {
            if (editingProperty) {
              await handleUpdateProperty(editingProperty.id, data);
            } else {
              await handleAddProperty(data);
            }
          }}
        />
      )}

      {(isAddUnitOpen || editingUnit) && (
        <AddUnitModal
          unit={editingUnit}
          propertyId={addUnitPropId || editingUnit?.propertyId || ''}
          propertyName={
            properties.find((p) => p.id === (addUnitPropId || editingUnit?.propertyId))?.name
          }
          onClose={() => {
            setIsAddUnitOpen(false);
            setEditingUnit(null);
          }}
          onSubmit={async (propId, data) => {
            if (editingUnit) {
              await handleUpdateUnit(editingUnit.id, data);
            } else {
              await handleAddUnit(propId, data);
            }
          }}
        />
      )}

      {(isAddTenantOpen || editingTenant) && (
        <AddTenantModal
          tenant={editingTenant}
          onClose={() => {
            setIsAddTenantOpen(false);
            setEditingTenant(null);
          }}
          onSubmit={async (data) => {
            if (editingTenant) {
              await handleUpdateTenant(editingTenant.id, data);
            } else {
              await handleAddTenant(data);
            }
          }}
        />
      )}

      {(isAddLeaseOpen || editingLease) && (
        <AddLeaseModal
          lease={editingLease}
          properties={properties}
          units={units}
          tenants={tenants}
          onClose={() => {
            setIsAddLeaseOpen(false);
            setEditingLease(null);
          }}
          onSubmit={async (data) => {
            if (editingLease) {
              await handleUpdateLease(editingLease.id, data);
            } else {
              await handleAddLease(data);
            }
          }}
        />
      )}

      {isRecordPaymentOpen && (
        <RecordPaymentModal
          tenants={tenants}
          properties={properties}
          units={units}
          charges={rentCharges}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSubmit={handleRecordPayment}
        />
      )}

      {isRecordPaymentOpen && (
        <RecordPaymentModal
          tenants={tenants}
          properties={properties}
          units={units}
          charges={rentCharges}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSubmit={handleRecordPayment}
        />
      )}
    </div>
  );
}
