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
import { SuperAdminScreen } from '../components/screens/SuperAdminScreen';
import { BottomNav } from '../components/BottomNav';

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
import { TimeframeFilter, getMonthlyRange } from '../lib/dateFilters';

import { AuthScreen } from '../components/screens/AuthScreen';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { RentoraLogo } from '../components/RentoraLogo';

function AppContent() {
  const { isAuthenticated, isLoading: isAuthLoading, activeCompanyId, activeCompanyName, isSuperAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [period, setPeriod] = useState<string>('2026-10');
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>(getMonthlyRange(2026, 10));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  // Load initial data with timeframe filtering
  const loadData = async (tf: TimeframeFilter = timeframeFilter) => {
    setIsLoading(true);
    try {
      const from = tf.startDate;
      const to = tf.endDate;

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
        api.getDashboard(period, from, to).catch(() => null),
        api.getExpenses({ from, to }).catch(() => []),
        api.getCategories().catch(() => []),
        api.getProperties().catch(() => []),
        api.getUnits().catch(() => []),
        api.getTenants().catch(() => []),
        api.getLeases().catch(() => []),
        api.getRentCharges({ from, to }).catch(() => []),
        api.getPayments({ from, to }).catch(() => []),
        api.getVendors().catch(() => []),
        api.getFinancialSummary(from, to).catch(() => null),
        api.getRentArrears().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getActivityLogs().catch(() => api.getAuditLogs()).catch(() => []),
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
    if (isAuthenticated) {
      loadData(timeframeFilter);
    }
  }, [timeframeFilter, activeCompanyId, isAuthenticated]);

  useEffect(() => {
    if (isSuperAdmin && currentTab !== 'super-admin' && currentTab !== 'audit') {
      setCurrentTab('super-admin');
    }
  }, [isSuperAdmin, currentTab]);

  const handleTimeframeChange = (tf: TimeframeFilter) => {
    setTimeframeFilter(tf);
    const padM = String(tf.month).padStart(2, '0');
    setPeriod(`${tf.year}-${padM}`);
  };

  // Period navigation
  const handlePrevMonth = () => {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newY = date.getFullYear();
    const newM = date.getMonth() + 1;
    setPeriod(`${newY}-${String(newM).padStart(2, '0')}`);
    setTimeframeFilter(getMonthlyRange(newY, newM));
  };

  const handleNextMonth = () => {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newY = date.getFullYear();
    const newM = date.getMonth() + 1;
    setPeriod(`${newY}-${String(newM).padStart(2, '0')}`);
    setTimeframeFilter(getMonthlyRange(newY, newM));
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
    const { generatedUnits, numberOfFloors, unitsPerFloor, ...propertyPayload } = data;
    const createdProperty = await api.createProperty(propertyPayload);

    if (createdProperty?.id && generatedUnits && generatedUnits.length > 0) {
      await Promise.all(
        generatedUnits.map((u: any) =>
          api.createUnit(createdProperty.id, {
            unitNumber: u.unitNumber,
            type: u.type,
            isShop: u.type === 'commercial',
            floor: u.floor,
            bedrooms: u.type === 'residential' ? (u.bedrooms ?? 1) : 0,
            bathrooms: u.type === 'residential' ? (u.bathrooms ?? 1) : 0,
            squareFeet: u.squareFeet || (u.type === 'parking' ? 150 : u.type === 'commercial' ? 600 : 850),
            marketRent: u.marketRent || (u.type === 'parking' ? '500.00' : '5000.00'),
            status: 'vacant',
          })
        )
      );
    }
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
    } else if (type === 'arrears') {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Tenant,Phone,Property,Unit,Due Date,Days Overdue,Total Billed (AED),Outstanding Balance (AED)\n';
      rentArrears.forEach((a) => {
        csvContent += `"${a.tenantName}","${a.tenantPhone || ''}","${a.propertyName}","${a.unitNumber}","${a.dueDate}","${a.daysOverdue}","${a.amountDue}","${a.outstandingBalance}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rent_arrears_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === 'financials') {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Property,Occupied Units,Total Units,Rental Income (AED),Operating Expenses (AED),Net Cash Flow (AED)\n';
      reportSummary?.propertiesSummary.forEach((p) => {
        csvContent += `"${p.propertyName}","${p.occupiedUnits}","${p.totalUnits}","${p.income}","${p.expenses}","${p.net}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `financial_performance_${period}.csv`);
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
        return 'Activity Logs (Audit Trail)';
      case 'super-admin':
        return 'Super Admin Company Management';
      case 'settings':
        return 'Company Administration';
      default:
        return 'Rental Manager';
    }
  };

  if (isAuthLoading) {
    return (
      <div className="auth-loading-screen">
        <RentoraLogo size={52} showText={true} textSize={26} variant="light" />
        <div className="auth-spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Validating secure session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation (with Mobile Drawer Support) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        arrearsCount={rentArrears.length}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        companyName={activeCompanyName}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <TopBar
          title={getPageTitle()}
          period={period}
          timeframeFilter={timeframeFilter}
          onTimeframeChange={handleTimeframeChange}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onNavigateToTab={setCurrentTab}
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
                  timeframeFilter={timeframeFilter}
                  onTimeframeChange={handleTimeframeChange}
                />
              )}

              {currentTab === 'expenses' && (
                <ExpensesScreen
                  expenses={expenses}
                  categories={categories}
                  properties={properties}
                  units={units}
                  period={period}
                  revenueCollected={parseFloat(dashboardSummary?.rentCollected || '0')}
                  timeframeFilter={timeframeFilter}
                  onTimeframeChange={handleTimeframeChange}
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
                  timeframeFilter={timeframeFilter}
                  onTimeframeChange={handleTimeframeChange}
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
                  timeframeFilter={timeframeFilter}
                  onTimeframeChange={handleTimeframeChange}
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
                  timeframeFilter={timeframeFilter}
                  onTimeframeChange={handleTimeframeChange}
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

              {currentTab === 'super-admin' && (
                <SuperAdminScreen
                  onCompanySelect={() => {
                    loadData();
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile-Friendly Fixed Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        arrearsCount={rentArrears.length}
      />

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

      {/* Single Record Payment Modal */}
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

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
