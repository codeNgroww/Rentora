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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { Property, Unit } from '@rental-saas/contracts';

@Controller()
export class PropertiesController {
  constructor(private readonly dataStore: DataStoreService) {}

  private getEffectiveWsId(wsId?: string): string {
    return wsId || this.dataStore.workspaces[0]?.id || 'w1111111-1111-4111-8111-111111111111';
  }

  @Get('properties')
  listProperties(
    @Headers('x-workspace-id') wsId?: string,
    @Query('search') search?: string,
    @Query('emirate') emirate?: string
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let list = this.dataStore.properties.filter(
      (p) => p.workspaceId === effectiveWsId && !p.isArchived
    );

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.emirate.toLowerCase().includes(q)
      );
    }

    if (emirate) {
      list = list.filter((p) => p.emirate === emirate);
    }

    // Attach unit count dynamically
    const enriched = list.map((p) => {
      const pUnits = this.dataStore.units.filter((u) => u.propertyId === p.id);
      const occupied = pUnits.filter((u) => u.status === 'occupied').length;
      return {
        ...p,
        totalUnits: pUnits.length,
        occupiedUnits: occupied,
        vacantUnits: pUnits.length - occupied,
      };
    });

    return {
      success: true,
      data: enriched,
    };
  }

  @Post('properties')
  createProperty(
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      name: string;
      type: any;
      address: string;
      emirate: any;
      communityArea?: string;
      buildingReference?: string;
      notes?: string;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    if (!body.name || !body.address || !body.emirate) {
      throw new BadRequestException('Property name, address, and emirate are required.');
    }

    const newProperty: Property = {
      id: `p-${Date.now()}`,
      workspaceId: effectiveWsId,
      name: body.name,
      type: body.type || 'residential',
      address: body.address,
      emirate: body.emirate,
      communityArea: body.communityArea || '',
      buildingReference: body.buildingReference || '',
      totalUnits: 0,
      notes: body.notes || '',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.properties.push(newProperty);

    // Record audit
    this.dataStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      workspaceId: effectiveWsId,
      actorId: 'system',
      actorName: 'Admin User',
      action: 'PROPERTY_CREATED',
      entity: 'Property',
      entityId: newProperty.id,
      timestamp: new Date().toISOString(),
      changes: { name: { before: null, after: newProperty.name } },
    });

    this.dataStore.saveToFile();

    return {
      success: true,
      data: newProperty,
    };
  }

  @Get('properties/:id')
  getProperty(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const prop = this.dataStore.properties.find(
      (p) => p.id === id && p.workspaceId === effectiveWsId
    );
    if (!prop) throw new NotFoundException('Property not found');

    const pUnits = this.dataStore.units.filter((u) => u.propertyId === id);
    return {
      success: true,
      data: {
        ...prop,
        units: pUnits,
      },
    };
  }

  @Patch('properties/:id')
  updateProperty(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<Property>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.properties.findIndex(
      (p) => p.id === id && p.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Property not found');

    this.dataStore.properties[idx] = {
      ...this.dataStore.properties[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();

    return {
      success: true,
      data: this.dataStore.properties[idx],
    };
  }

  @Get('properties/:id/units')
  listUnitsForProperty(@Param('id') propId: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const units = this.dataStore.units.filter(
      (u) => u.propertyId === propId && u.workspaceId === effectiveWsId
    );
    return {
      success: true,
      data: units,
    };
  }

  @Post('properties/:id/units')
  createUnit(
    @Param('id') propId: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body()
    body: {
      unitNumber: string;
      type?: 'residential' | 'commercial';
      isShop?: boolean;
      floor?: string;
      bedrooms?: number;
      bathrooms?: number;
      squareFeet?: number;
      marketRent: string;
      status?: any;
    }
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const prop = this.dataStore.properties.find(
      (p) => p.id === propId && p.workspaceId === effectiveWsId
    );
    if (!prop) throw new NotFoundException('Property not found');

    if (!body.unitNumber) {
      throw new BadRequestException('Unit number is required');
    }

    // Check duplicate unit number in this property
    const exists = this.dataStore.units.some(
      (u) => u.propertyId === propId && u.unitNumber.toLowerCase() === body.unitNumber.toLowerCase()
    );
    if (exists) {
      throw new BadRequestException(`Unit ${body.unitNumber} already exists in this property`);
    }

    const isCommercial = body.type === 'commercial' || body.isShop === true;
    const newUnit: Unit = {
      id: `u-${Date.now()}`,
      workspaceId: effectiveWsId,
      propertyId: propId,
      unitNumber: body.unitNumber,
      type: body.type || (body.isShop ? 'commercial' : 'residential'),
      isShop: isCommercial,
      floor: body.floor || '',
      bedrooms: isCommercial ? 0 : (body.bedrooms ?? 1),
      bathrooms: isCommercial ? 0 : (body.bathrooms ?? 1),
      squareFeet: body.squareFeet,
      marketRent: body.marketRent || '0.00',
      status: body.status || 'vacant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.units.push(newUnit);
    this.dataStore.saveToFile();
    return {
      success: true,
      data: newUnit,
    };
  }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.properties.findIndex(
      (p) => p.id === id && p.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Property not found');

    const deleted = this.dataStore.properties.splice(idx, 1)[0];
    // Also remove associated units
    this.dataStore.units = this.dataStore.units.filter((u) => u.propertyId !== id);
    this.dataStore.saveToFile();

    return {
      success: true,
      data: deleted,
    };
  }

  @Get('units')
  listAllUnits(@Headers('x-workspace-id') wsId?: string, @Query('propertyId') propId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    let units = this.dataStore.units.filter((u) => u.workspaceId === effectiveWsId);
    if (propId) {
      units = units.filter((u) => u.propertyId === propId);
    }

    const enriched = units.map((u) => {
      const prop = this.dataStore.properties.find((p) => p.id === u.propertyId);
      return {
        ...u,
        propertyName: prop?.name || 'Unknown Property',
      };
    });

    return {
      success: true,
      data: enriched,
    };
  }

  @Get('units/:id')
  getUnit(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const unit = this.dataStore.units.find(
      (u) => u.id === id && u.workspaceId === effectiveWsId
    );
    if (!unit) throw new NotFoundException('Unit not found');
    return {
      success: true,
      data: unit,
    };
  }

  @Patch('units/:id')
  updateUnit(
    @Param('id') id: string,
    @Headers('x-workspace-id') wsId: string | undefined,
    @Body() body: Partial<Unit>
  ) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.units.findIndex(
      (u) => u.id === id && u.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Unit not found');

    this.dataStore.units[idx] = {
      ...this.dataStore.units[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.saveToFile();

    return {
      success: true,
      data: this.dataStore.units[idx],
    };
  }

  @Delete('units/:id')
  deleteUnit(@Param('id') id: string, @Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = this.getEffectiveWsId(wsId);
    const idx = this.dataStore.units.findIndex(
      (u) => u.id === id && u.workspaceId === effectiveWsId
    );
    if (idx === -1) throw new NotFoundException('Unit not found');

    const deleted = this.dataStore.units.splice(idx, 1)[0];
    this.dataStore.saveToFile();

    return {
      success: true,
      data: deleted,
    };
  }
}
