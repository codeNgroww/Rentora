import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { RentCharge, Payment, PaymentAllocation } from '@rental-saas/contracts';

@Controller()
export class RentController {
  constructor(private readonly dataStore: DataStoreService) {}

  private getEffectiveWsId(wsId?: string): string {
    return wsId || this.dataStore.workspaces[0]?.id || 'w1111111-1111-4111-8111-111111111111';
  }

  @Get('rent-charges')
  listCharges(
    @Headers('x-workspace-id') wsId?: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let list = this.dataStore.rentCharges.filter((c) => c.workspaceId === effectiveWsId);

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

    // Dynamic enrichment with tenant & property & overdue evaluation
    const enriched = list.map((c) => {
      const tenant = this.dataStore.tenants.find((t) => t.id === c.tenantId);
      const property = this.dataStore.properties.find((p) => p.id === c.propertyId);
      const unit = this.dataStore.units.find((u) => u.id === c.unitId);

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

    return {
      success: true,
      data: enriched,
    };
  }

  @Post('rent-charges')
  createCharge(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      leaseId: string;
      dueDate: string;
      amount: string;
      notes?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const lease = this.dataStore.leases.find(
      (l) => l.id === body.leaseId && l.workspaceId === effectiveWsId
    );
    if (!lease) throw new BadRequestException('Lease not found in workspace.');

    const amt = parseFloat(body.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const newCharge: RentCharge = {
      id: `rc-${Date.now()}`,
      workspaceId: effectiveWsId,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.rentCharges.push(newCharge);
    this.dataStore.saveToFile();
    return {
      success: true,
      data: newCharge,
    };
  }

  @Patch('rent-charges/:id')
  updateCharge(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<RentCharge>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.rentCharges.findIndex(
      (c) => c.id === id && c.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Rent charge not found');

    this.dataStore.rentCharges[idx] = {
      ...this.dataStore.rentCharges[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();

    return {
      success: true,
      data: this.dataStore.rentCharges[idx],
    };
  }

  @Delete('rent-charges/:id')
  deleteCharge(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.rentCharges.findIndex(
      (c) => c.id === id && c.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Rent charge not found');

    const deleted = this.dataStore.rentCharges.splice(idx, 1)[0];
    this.dataStore.saveToFile();

    return {
      success: true,
      data: deleted,
    };
  }

  @Get('payments')
  listPayments(
    @Headers('x-workspace-id') wsId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let list = this.dataStore.payments.filter((p) => p.workspaceId === effectiveWsId);

    if (tenantId) list = list.filter((p) => p.tenantId === tenantId);
    if (propertyId) list = list.filter((p) => p.propertyId === propertyId);
    if (from) list = list.filter((p) => p.paymentDate >= from);
    if (to) list = list.filter((p) => p.paymentDate <= to);

    // Enrich with tenant & unit
    const enriched = list.map((p) => {
      const tenant = this.dataStore.tenants.find((t) => t.id === p.tenantId);
      const prop = this.dataStore.properties.find((pr) => pr.id === p.propertyId);
      const unit = this.dataStore.units.find((u) => u.id === p.unitId);

      return {
        ...p,
        tenantName: tenant?.fullName || 'Tenant',
        propertyName: prop?.name || 'Property',
        unitNumber: unit?.unitNumber || '',
      };
    });

    return {
      success: true,
      data: enriched,
    };
  }

  @Post('payments')
  recordPayment(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
      body: {
      tenantId: string;
      propertyId: string;
      unitId: string;
      amount: string;
      currency?: string;
      paymentDate: string;
      paymentMethod?: any;
      reference?: string;
      notes?: string;
      subtotalAmount?: string;
      vatRate?: number;
      vatAmount?: string;
      totalAmount?: string;
      allocations?: Array<{ rentChargeId: string; amount: string }>;
      proofUrl?: string;
      proofName?: string;
      invoiceNumber?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const totalAmount = parseFloat(body.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const ws =
      this.dataStore.workspaces.find((w) => w.id === effectiveWsId) ||
      this.dataStore.workspaces[0];
    const vatConfig = ws?.vatSettings || {
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

    const newPaymentId = `pay-${Date.now()}`;
    const paymentAllocations: PaymentAllocation[] = [];

    // If explicit allocations provided, validate total <= payment amount
    if (body.allocations && body.allocations.length > 0) {
      let allocatedSum = 0;
      for (const alloc of body.allocations) {
        const allocAmt = parseFloat(alloc.amount);
        if (isNaN(allocAmt) || allocAmt <= 0) {
          throw new BadRequestException('Allocated amount must be positive.');
        }
        allocatedSum += allocAmt;

        const charge = this.dataStore.rentCharges.find(
          (c) => c.id === alloc.rentChargeId && c.workspaceId === effectiveWsId
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

        // Apply allocation
        const updatedPaid = currentPaid + allocAmt;
        charge.paidAmount = updatedPaid.toFixed(2);
        charge.outstandingAmount = Math.max(0, chargeTotal - updatedPaid).toFixed(2);
        charge.status = updatedPaid >= chargeTotal - 0.01 ? 'paid' : 'partially_paid';
        charge.updatedAt = new Date().toISOString();

        const pa: PaymentAllocation = {
          id: `pa-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
      // Auto-allocate to oldest unpaid charge for this tenant
      const unpaidCharges = this.dataStore.rentCharges
        .filter(
          (c) =>
            c.tenantId === body.tenantId &&
            c.workspaceId === effectiveWsId &&
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
          id: `pa-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
      workspaceId: effectiveWsId,
      tenantId: body.tenantId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      amount: totalAmount.toFixed(2),
      currency: body.currency || 'AED',
      paymentDate: body.paymentDate || new Date().toISOString().slice(0, 10),
      paymentMethod: body.paymentMethod || 'bank_transfer',
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
      createdAt: new Date().toISOString(),
    };

    this.dataStore.payments.unshift(newPayment);

    // Audit log
    this.dataStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      workspaceId: effectiveWsId,
      actorId: 'system',
      actorName: 'Authorized User',
      action: 'PAYMENT_RECORDED',
      entity: 'Payment',
      entityId: newPayment.id,
      timestamp: new Date().toISOString(),
      changes: {
        amount: { before: null, after: newPayment.amount },
        tenantId: { before: null, after: newPayment.tenantId },
      },
    });

    this.dataStore.saveToFile();

    return {
      success: true,
      data: newPayment,
    };
  }

  @Patch('payments/:id')
  updatePayment(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<Payment>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.payments.findIndex(
      (p) => p.id === id && p.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Payment not found');

    this.dataStore.payments[idx] = {
      ...this.dataStore.payments[idx],
      ...body,
    };
    this.dataStore.saveToFile();

    return {
      success: true,
      data: this.dataStore.payments[idx],
    };
  }

  @Delete('payments/:id')
  deletePayment(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.payments.findIndex(
      (p) => p.id === id && p.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Payment not found');

    const deleted = this.dataStore.payments.splice(idx, 1)[0];
    this.dataStore.saveToFile();

    return {
      success: true,
      data: deleted,
    };
  }
}
