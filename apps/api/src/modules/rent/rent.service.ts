import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RentCharge, Payment, PaymentAllocation } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class RentService {
  private readonly logger = new Logger(RentService.name);

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly activityLogsService: ActivityLogsService
  ) {}

  private resolveCompanyId(companyId?: string): string {
    return (
      companyId ||
      this.dataStore.companies[0]?.id ||
      this.dataStore.workspaces[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  listCharges(
    companyId?: string,
    status?: string,
    propertyId?: string,
    tenantId?: string,
    from?: string,
    to?: string
  ): { data: any[] } {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    let list = this.dataStore.rentCharges.filter(
      (c) => (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) && !c.isDeleted
    );

    if (status) {
      list = list.filter((c) => c.status === status);
    }
    if (propertyId) {
      list = list.filter((c) => c.propertyId === propertyId);
    }
    if (tenantId) {
      list = list.filter((c) => c.tenantId === tenantId);
    }
    if (from) {
      list = list.filter((c) => c.dueDate >= from);
    }
    if (to) {
      list = list.filter((c) => c.dueDate <= to);
    }

    const today = new Date().toISOString().slice(0, 10);

    const enriched = list.map((c) => {
      const tenant = this.dataStore.tenants.find((t) => t.id === c.tenantId && !t.isDeleted);
      const property = this.dataStore.properties.find((p) => p.id === c.propertyId && !p.isDeleted);
      const unit = this.dataStore.units.find((u) => u.id === c.unitId && !u.isDeleted);

      let currentStatus = c.status;
      const outstanding = parseFloat(c.amount) - parseFloat(c.paidAmount);
      if (outstanding <= 0.001) {
        currentStatus = 'paid';
      } else if (c.dueDate < today && currentStatus !== 'voided') {
        currentStatus = 'overdue';
      }

      return {
        ...c,
        status: currentStatus,
        outstandingAmount: Math.max(0, outstanding).toFixed(2),
        tenantName: tenant?.fullName || 'Unknown Tenant',
        tenantPhone: tenant?.phoneNumber || '',
        propertyName: property?.name || 'Unknown Property',
        unitNumber: unit?.unitNumber || '',
      };
    });

    return { data: enriched };
  }

  createCharge(
    companyId: string | undefined,
    body: { leaseId: string; dueDate: string; amount: string; notes?: string }
  ): RentCharge {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const lease = this.dataStore.leases.find(
      (l) => l.id === body.leaseId && (l.companyId === effectiveCompanyId || (l as any).workspaceId === effectiveCompanyId) && !l.isDeleted
    );
    if (!lease) throw new BadRequestException('Lease not found in workspace.');

    const amt = parseFloat(body.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const newCharge: RentCharge = {
      id,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      leaseId: lease.id,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      periodStart: body.dueDate,
      periodEnd: body.dueDate,
      dueDate: body.dueDate,
      amount: amt.toFixed(2),
      paidAmount: '0.00',
      outstandingAmount: amt.toFixed(2),
      status: 'pending',
      notes: body.notes || '',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        Promise.resolve(
          client.from('rent_charges').insert({
            id: newCharge.id,
            company_id: newCharge.companyId,
            lease_id: newCharge.leaseId,
            property_id: newCharge.propertyId,
            unit_id: newCharge.unitId,
            tenant_id: newCharge.tenantId,
            period_start: newCharge.periodStart,
            period_end: newCharge.periodEnd,
            due_date: newCharge.dueDate,
            amount: parseFloat(newCharge.amount),
            paid_amount: parseFloat(newCharge.paidAmount),
            status: newCharge.status,
            is_deleted: false,
            created_at: newCharge.createdAt,
            updated_at: newCharge.updatedAt,
          })
        ).catch(() => {});
      }
    }

    this.dataStore.rentCharges.push(newCharge);
    this.dataStore.saveToFile();
    return newCharge;
  }

  updateCharge(id: string, companyId: string | undefined, body: Partial<RentCharge>): RentCharge {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.rentCharges.findIndex(
      (c) => c.id === id && (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) && !c.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Rent charge not found');

    this.dataStore.rentCharges[idx] = {
      ...this.dataStore.rentCharges[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();
    return this.dataStore.rentCharges[idx];
  }

  deleteCharge(id: string, companyId?: string): RentCharge {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.rentCharges.findIndex(
      (c) => c.id === id && (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) && !c.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Rent charge not found');

    const now = new Date().toISOString();
    const charge = this.dataStore.rentCharges[idx];
    charge.isDeleted = true;
    charge.deletedAt = now;
    charge.updatedAt = now;
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        void client.from('rent_charges').update({ is_deleted: true, deleted_at: now }).eq('id', id);
      }
    }

    return charge;
  }

  listPayments(companyId?: string, tenantId?: string, propertyId?: string, from?: string, to?: string): any[] {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    let list = this.dataStore.payments.filter(
      (p) => (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) && !p.isDeleted
    );

    if (tenantId) list = list.filter((p) => p.tenantId === tenantId);
    if (propertyId) list = list.filter((p) => p.propertyId === propertyId);
    if (from) list = list.filter((p) => p.paymentDate >= from);
    if (to) list = list.filter((p) => p.paymentDate <= to);

    return list.map((p) => {
      const tenant = this.dataStore.tenants.find((t) => t.id === p.tenantId && !t.isDeleted);
      const prop = this.dataStore.properties.find((pr) => pr.id === p.propertyId && !pr.isDeleted);
      const unit = this.dataStore.units.find((u) => u.id === p.unitId && !u.isDeleted);

      return {
        ...p,
        tenantName: tenant?.fullName || 'Tenant',
        propertyName: prop?.name || 'Property',
        unitNumber: unit?.unitNumber || '',
      };
    });
  }

  recordPayment(companyId: string | undefined, body: RecordPaymentDto): Payment {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const totalAmount = parseFloat(body.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const ws =
      this.dataStore.workspaces.find((w) => w.id === effectiveCompanyId && !w.isDeleted) ||
      this.dataStore.companies.find((c) => c.id === effectiveCompanyId && !c.isDeleted) ||
      this.dataStore.workspaces[0];

    const vatConfig = (ws as any)?.vatSettings || {
      enabled: true,
      defaultRate: 5.0,
      calculationMode: 'exclusive',
    };

    const effectiveVatRate =
      body.vatRate !== undefined
        ? body.vatRate
        : vatConfig.enabled
        ? vatConfig.defaultRate
        : 0;

    const subtotalAmt = body.subtotalAmount
      ? parseFloat(body.subtotalAmount)
      : totalAmount;

    let computedVat = 0;
    if (body.vatAmount) {
      computedVat = parseFloat(body.vatAmount);
    } else if (effectiveVatRate > 0) {
      computedVat = (subtotalAmt * effectiveVatRate) / 100;
    }

    const finalTotal = body.totalAmount
      ? parseFloat(body.totalAmount)
      : subtotalAmt + computedVat;

    const newPaymentId = randomUUID();
    const paymentAllocations: PaymentAllocation[] = [];

    if (body.allocations && body.allocations.length > 0) {
      let allocatedSum = 0;
      for (const alloc of body.allocations) {
        const allocAmt = parseFloat(alloc.amount);
        if (isNaN(allocAmt) || allocAmt <= 0) {
          throw new BadRequestException('Allocated amount must be positive.');
        }
        allocatedSum += allocAmt;

        const charge = this.dataStore.rentCharges.find(
          (c) =>
            c.id === alloc.rentChargeId &&
            (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) &&
            !c.isDeleted
        );
        if (!charge) throw new BadRequestException(`Charge ${alloc.rentChargeId} not found.`);

        const currentPaid = parseFloat(charge.paidAmount || '0');
        const chargeTotal = parseFloat(charge.amount);
        const outstanding = chargeTotal - currentPaid;

        if (allocAmt > outstanding + 0.01) {
          throw new BadRequestException(
            `Allocation of ${allocAmt} exceeds charge outstanding balance of ${outstanding.toFixed(2)}.`
          );
        }

        const updatedPaid = currentPaid + allocAmt;
        charge.paidAmount = updatedPaid.toFixed(2);
        charge.outstandingAmount = Math.max(0, chargeTotal - updatedPaid).toFixed(2);
        charge.status = updatedPaid >= chargeTotal - 0.01 ? 'paid' : 'partially_paid';
        charge.updatedAt = new Date().toISOString();

        const pa: PaymentAllocation = {
          id: randomUUID(),
          paymentId: newPaymentId,
          rentChargeId: charge.id,
          amount: allocAmt.toFixed(2),
          createdAt: new Date().toISOString(),
        };
        paymentAllocations.push(pa);
        this.dataStore.allocations.push(pa);
      }

      if (allocatedSum > totalAmount + 0.01) {
        throw new BadRequestException('Allocated amounts cannot exceed total payment.');
      }
    } else {
      const unpaidCharges = this.dataStore.rentCharges
        .filter(
          (c) =>
            c.tenantId === body.tenantId &&
            (c.companyId === effectiveCompanyId || (c as any).workspaceId === effectiveCompanyId) &&
            !c.isDeleted &&
            c.status !== 'paid' &&
            c.status !== 'voided'
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      let remainingPayment = totalAmount;
      for (const charge of unpaidCharges) {
        if (remainingPayment <= 0.01) break;
        const currentPaid = parseFloat(charge.paidAmount || '0');
        const chargeTotal = parseFloat(charge.amount);
        const outstanding = chargeTotal - currentPaid;
        const toAllocate = Math.min(remainingPayment, outstanding);

        const updatedPaid = currentPaid + toAllocate;
        charge.paidAmount = updatedPaid.toFixed(2);
        charge.outstandingAmount = Math.max(0, chargeTotal - updatedPaid).toFixed(2);
        charge.status = updatedPaid >= chargeTotal - 0.01 ? 'paid' : 'partially_paid';
        charge.updatedAt = new Date().toISOString();

        const pa: PaymentAllocation = {
          id: randomUUID(),
          paymentId: newPaymentId,
          rentChargeId: charge.id,
          amount: toAllocate.toFixed(2),
          createdAt: new Date().toISOString(),
        };
        paymentAllocations.push(pa);
        this.dataStore.allocations.push(pa);
        remainingPayment -= toAllocate;
      }
    }

    const newPayment: Payment = {
      id: newPaymentId,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      tenantId: body.tenantId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      amount: totalAmount.toFixed(2),
      currency: body.currency || 'AED',
      paymentDate: body.paymentDate || new Date().toISOString().slice(0, 10),
      paymentMethod: (body.paymentMethod as any) || 'bank_transfer',
      reference: body.reference || '',
      notes: body.notes || '',
      subtotalAmount: subtotalAmt.toFixed(2),
      vatRate: effectiveVatRate,
      vatAmount: computedVat.toFixed(2),
      totalAmount: finalTotal.toFixed(2),
      allocations: paymentAllocations,
      proofUrl: body.proofUrl || undefined,
      proofName: body.proofName || undefined,
      invoiceNumber: body.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        Promise.resolve(
          client.from('payments').insert({
            id: newPayment.id,
            company_id: newPayment.companyId,
            tenant_id: newPayment.tenantId,
            property_id: newPayment.propertyId,
            unit_id: newPayment.unitId,
            amount: parseFloat(newPayment.amount),
            currency: newPayment.currency,
            payment_date: newPayment.paymentDate,
            payment_method: newPayment.paymentMethod,
            reference: newPayment.reference,
            notes: newPayment.notes,
            is_deleted: false,
            created_at: newPayment.createdAt,
          })
        ).catch((err) => {
          this.logger.warn(`Failed to insert payment into Supabase: ${(err as Error).message}`);
        });
      }
    }

    this.dataStore.payments.unshift(newPayment);
    this.dataStore.saveToFile();

    void this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: newPayment.propertyId,
      collectionName: 'payments',
      recordId: newPayment.id,
      action: 'PAYMENT_RECORDED',
      newData: newPayment,
      actorName: 'Authorized User',
    });

    return newPayment;
  }

  updatePayment(id: string, companyId: string | undefined, body: Partial<Payment>): Payment {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.payments.findIndex(
      (p) => p.id === id && (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) && !p.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Payment not found');

    this.dataStore.payments[idx] = {
      ...this.dataStore.payments[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();
    return this.dataStore.payments[idx];
  }

  deletePayment(id: string, companyId?: string): Payment {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const idx = this.dataStore.payments.findIndex(
      (p) => p.id === id && (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) && !p.isDeleted
    );
    if (idx === -1) throw new NotFoundException('Payment not found');

    const now = new Date().toISOString();
    const payment = this.dataStore.payments[idx];
    payment.isDeleted = true;
    payment.deletedAt = now;
    payment.updatedAt = now;
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      const client = this.supabaseService.getClient();
      if (client) {
        void client.from('payments').update({ is_deleted: true, deleted_at: now }).eq('id', id);
      }
    }

    return payment;
  }
}
