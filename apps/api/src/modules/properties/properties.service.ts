import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Property, Unit } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CreateUnitDto } from './dto/create-unit.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly activityLogsService: ActivityLogsService
  ) {}

  private resolveCompanyId(companyId?: string): string {
    return companyId || this.dataStore.companies[0]?.id || this.dataStore.workspaces[0]?.id || 'c1111111-1111-4111-8111-111111111111';
  }

  async listProperties(companyId?: string, search?: string, emirate?: string): Promise<any[]> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        let query = client
          ?.from('properties')
          .select('*, units(*)')
          .eq('company_id', effectiveCompanyId)
          .eq('is_archived', false)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (emirate) {
          query = query.eq('emirate', emirate);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data
            .filter((p: any) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                p.name?.toLowerCase().includes(q) ||
                p.address?.toLowerCase().includes(q) ||
                p.emirate?.toLowerCase().includes(q)
              );
            })
            .map((p: any) => {
              const units = (p.units || []).filter((u: any) => !u.is_deleted);
              const occupied = units.filter((u: any) => u.status === 'occupied').length;
              return {
                id: p.id,
                propertyId: p.id,
                companyId: p.company_id,
                workspaceId: p.company_id,
                name: p.name,
                type: p.type,
                address: p.address,
                emirate: p.emirate,
                communityArea: p.community_area,
                buildingReference: p.building_reference,
                totalUnits: units.length,
                occupiedUnits: occupied,
                vacantUnits: units.length - occupied,
                notes: p.notes,
                isArchived: p.is_archived,
                isDeleted: p.is_deleted ?? false,
                deletedAt: p.deleted_at || null,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
              };
            });
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch properties from Supabase: ${(err as Error).message}`);
      }
    }

    // Fallback to DataStore
    let list = this.dataStore.properties.filter(
      (p) => (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) && !p.isArchived && !p.isDeleted
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

    return list.map((p) => {
      const pUnits = this.dataStore.units.filter((u) => u.propertyId === p.id && !u.isDeleted);
      const occupied = pUnits.filter((u) => u.status === 'occupied').length;
      return {
        ...p,
        totalUnits: pUnits.length,
        occupiedUnits: occupied,
        vacantUnits: pUnits.length - occupied,
      };
    });
  }

  async createProperty(dto: CreatePropertyDto, companyId?: string): Promise<Property> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const id = randomUUID();
    const now = new Date().toISOString();

    const newProperty: Property = {
      id,
      propertyId: id,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      name: dto.name,
      type: dto.type || 'residential',
      address: dto.address,
      emirate: dto.emirate,
      communityArea: dto.communityArea || '',
      buildingReference: dto.buildingReference || '',
      totalUnits: 0,
      notes: dto.notes || '',
      isArchived: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Auto-generate units if numberOfFloors and unitsPerFloor provided
    const generatedUnits: Unit[] = [];
    if (dto.numberOfFloors && dto.unitsPerFloor && dto.numberOfFloors > 0 && dto.unitsPerFloor > 0) {
      for (let floor = 1; floor <= dto.numberOfFloors; floor++) {
        for (let unitNum = 1; unitNum <= dto.unitsPerFloor; unitNum++) {
          const formattedNumber = `${floor}${unitNum.toString().padStart(2, '0')}`;
          generatedUnits.push({
            id: randomUUID(),
            companyId: effectiveCompanyId,
            workspaceId: effectiveCompanyId,
            propertyId: id,
            unitNumber: formattedNumber,
            floor: `${floor}`,
            type: 'residential',
            bedrooms: 1,
            bathrooms: 1,
            squareFeet: 850,
            marketRent: '0.00',
            status: 'vacant',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      newProperty.totalUnits = generatedUnits.length;
    }

    // Attempt Supabase insert
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { error: propErr } = await client?.from('properties').insert({
          id: newProperty.id,
          company_id: newProperty.companyId,
          name: newProperty.name,
          type: newProperty.type,
          address: newProperty.address,
          emirate: newProperty.emirate,
          community_area: newProperty.communityArea,
          building_reference: newProperty.buildingReference,
          total_units: newProperty.totalUnits,
          notes: newProperty.notes,
          is_archived: newProperty.isArchived,
          is_deleted: false,
          created_at: newProperty.createdAt,
          updated_at: newProperty.updatedAt,
        }) || {};

        if (propErr) {
          this.logger.error(`Supabase property insert error: ${propErr.message}`);
        } else if (generatedUnits.length > 0) {
          await client?.from('units').insert(
            generatedUnits.map((u) => ({
              id: u.id,
              company_id: u.companyId,
              property_id: u.propertyId,
              unit_number: u.unitNumber,
              type: u.type,
              floor: u.floor,
              bedrooms: u.bedrooms,
              bathrooms: u.bathrooms,
              square_feet: u.squareFeet,
              market_rent: parseFloat(u.marketRent || '0'),
              status: u.status,
              is_deleted: false,
              created_at: u.createdAt,
              updated_at: u.updatedAt,
            }))
          );
        }
      } catch (err) {
        this.logger.warn(`Failed to persist property to Supabase: ${(err as Error).message}`);
      }
    }

    // Keep DataStore in sync
    this.dataStore.properties.push(newProperty);
    if (generatedUnits.length > 0) {
      this.dataStore.units.push(...generatedUnits);
    }
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: newProperty.id,
      collectionName: 'properties',
      recordId: newProperty.id,
      action: 'CREATE',
      newData: newProperty,
      actorName: 'Admin User',
    });

    return newProperty;
  }

  async getProperty(id: string, companyId?: string): Promise<Property & { units?: Unit[] }> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          ?.from('properties')
          .select('*, units(*)')
          .eq('id', id)
          .eq('is_deleted', false)
          .maybeSingle() || {};

        if (!error && data) {
          const units: Unit[] = (data.units || [])
            .filter((u: any) => !u.is_deleted)
            .map((u: any) => ({
              id: u.id,
              companyId: u.company_id,
              workspaceId: u.company_id,
              propertyId: u.property_id,
              unitNumber: u.unit_number,
              type: u.type,
              floor: u.floor,
              bedrooms: u.bedrooms,
              bathrooms: Number(u.bathrooms),
              squareFeet: u.square_feet ? Number(u.square_feet) : undefined,
              marketRent: String(u.market_rent),
              status: u.status,
              isDeleted: u.is_deleted ?? false,
              deletedAt: u.deleted_at || null,
              createdAt: u.created_at,
              updatedAt: u.updated_at,
            }));

          return {
            id: data.id,
            propertyId: data.id,
            companyId: data.company_id,
            workspaceId: data.company_id,
            name: data.name,
            type: data.type,
            address: data.address,
            emirate: data.emirate,
            communityArea: data.community_area,
            buildingReference: data.building_reference,
            totalUnits: units.length,
            notes: data.notes,
            isArchived: data.is_archived,
            isDeleted: data.is_deleted ?? false,
            deletedAt: data.deleted_at || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            units,
          };
        }
      } catch (err) {
        this.logger.warn(`Failed to get property from Supabase: ${(err as Error).message}`);
      }
    }

    const prop = this.dataStore.properties.find(
      (p) => p.id === id && (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId) && !p.isDeleted
    );
    if (!prop) throw new NotFoundException('Property not found');

    const pUnits = this.dataStore.units.filter((u) => u.propertyId === id && !u.isDeleted);
    return {
      ...prop,
      units: pUnits,
    };
  }

  async updateProperty(id: string, updates: Partial<Property>, companyId?: string): Promise<Property> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const existing = await this.getProperty(id, effectiveCompanyId);
    const oldData = { ...existing };

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('properties').update({
          name: updates.name ?? existing.name,
          type: updates.type ?? existing.type,
          address: updates.address ?? existing.address,
          emirate: updates.emirate ?? existing.emirate,
          community_area: updates.communityArea ?? existing.communityArea,
          building_reference: updates.buildingReference ?? existing.buildingReference,
          notes: updates.notes ?? existing.notes,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to update property in Supabase: ${(err as Error).message}`);
      }
    }

    const idx = this.dataStore.properties.findIndex(
      (p) => p.id === id && (p.companyId === effectiveCompanyId || (p as any).workspaceId === effectiveCompanyId)
    );
    if (idx !== -1) {
      this.dataStore.properties[idx] = {
        ...this.dataStore.properties[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.dataStore.saveToFile();
    }

    const updated = this.dataStore.properties[idx] || existing;
    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: id,
      collectionName: 'properties',
      recordId: id,
      action: 'UPDATE',
      oldData,
      newData: updated,
      actorName: 'Admin User',
    });

    return updated;
  }

  async deleteProperty(id: string, companyId?: string): Promise<Property> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const prop = await this.getProperty(id, effectiveCompanyId);
    const now = new Date().toISOString();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('properties').update({ is_deleted: true, deleted_at: now }).eq('id', id);
        await client?.from('units').update({ is_deleted: true, deleted_at: now }).eq('property_id', id);
      } catch (err) {
        this.logger.warn(`Failed to soft delete property from Supabase: ${(err as Error).message}`);
      }
    }

    prop.isDeleted = true;
    prop.deletedAt = now;
    prop.updatedAt = now;

    this.dataStore.properties.forEach((p) => {
      if (p.id === id) {
        p.isDeleted = true;
        p.deletedAt = now;
        p.updatedAt = now;
      }
    });

    this.dataStore.units.forEach((u) => {
      if (u.propertyId === id) {
        u.isDeleted = true;
        u.deletedAt = now;
        u.updatedAt = now;
      }
    });
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: id,
      collectionName: 'properties',
      recordId: id,
      action: 'DELETE',
      oldData: prop,
      actorName: 'Admin User',
    });

    return prop;
  }

  // --- Units Sub-Service Operations ---

  async listUnitsForProperty(propertyId: string, companyId?: string): Promise<Unit[]> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          ?.from('units')
          .select('*')
          .eq('property_id', propertyId)
          .eq('is_deleted', false)
          .order('unit_number', { ascending: true });

        if (!error && data) {
          return data.map((u: any) => ({
            id: u.id,
            companyId: u.company_id,
            workspaceId: u.company_id,
            propertyId: u.property_id,
            unitNumber: u.unit_number,
            type: u.type,
            floor: u.floor,
            bedrooms: u.bedrooms,
            bathrooms: Number(u.bathrooms),
            squareFeet: u.square_feet ? Number(u.square_feet) : undefined,
            marketRent: String(u.market_rent),
            status: u.status,
            isDeleted: u.is_deleted ?? false,
            deletedAt: u.deleted_at || null,
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          }));
        }
      } catch (err) {
        this.logger.warn(`Failed to list units from Supabase: ${(err as Error).message}`);
      }
    }

    return this.dataStore.units.filter(
      (u) => u.propertyId === propertyId && (u.companyId === effectiveCompanyId || (u as any).workspaceId === effectiveCompanyId) && !u.isDeleted
    );
  }

  async listAllUnits(companyId?: string, propertyId?: string): Promise<any[]> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        let query = client
          ?.from('units')
          .select('*, properties(name)')
          .eq('company_id', effectiveCompanyId)
          .eq('is_deleted', false);

        if (propertyId) {
          query = query.eq('property_id', propertyId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((u: any) => ({
            id: u.id,
            companyId: u.company_id,
            workspaceId: u.company_id,
            propertyId: u.property_id,
            propertyName: u.properties?.name || 'Unknown Property',
            unitNumber: u.unit_number,
            type: u.type,
            floor: u.floor,
            bedrooms: u.bedrooms,
            bathrooms: Number(u.bathrooms),
            squareFeet: u.square_feet ? Number(u.square_feet) : undefined,
            marketRent: String(u.market_rent),
            status: u.status,
            isDeleted: u.is_deleted ?? false,
            deletedAt: u.deleted_at || null,
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          }));
        }
      } catch (err) {
        this.logger.warn(`Failed to list all units from Supabase: ${(err as Error).message}`);
      }
    }

    let units = this.dataStore.units.filter(
      (u) => (u.companyId === effectiveCompanyId || (u as any).workspaceId === effectiveCompanyId) && !u.isDeleted
    );
    if (propertyId) {
      units = units.filter((u) => u.propertyId === propertyId);
    }

    return units.map((u) => {
      const prop = this.dataStore.properties.find((p) => p.id === u.propertyId && !p.isDeleted);
      return {
        ...u,
        propertyName: prop?.name || 'Unknown Property',
      };
    });
  }

  async createUnit(propertyId: string, dto: CreateUnitDto, companyId?: string): Promise<Unit> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    await this.getProperty(propertyId, effectiveCompanyId);

    const exists = this.dataStore.units.some(
      (u) => u.propertyId === propertyId && u.unitNumber.toLowerCase() === dto.unitNumber.toLowerCase() && !u.isDeleted
    );
    if (exists) {
      throw new BadRequestException(`Unit ${dto.unitNumber} already exists in this property`);
    }

    const isCommercial = dto.type === 'commercial' || dto.isShop === true;
    const isParking = dto.type === 'parking';
    const now = new Date().toISOString();
    const id = randomUUID();

    const newUnit: Unit = {
      id,
      companyId: effectiveCompanyId,
      workspaceId: effectiveCompanyId,
      propertyId,
      unitNumber: dto.unitNumber,
      type: dto.type || (dto.isShop ? 'commercial' : 'residential'),
      isShop: isCommercial,
      floor: dto.floor || '',
      bedrooms: isCommercial || isParking ? 0 : (dto.bedrooms ?? 1),
      bathrooms: isCommercial || isParking ? 0 : (dto.bathrooms ?? 1),
      squareFeet: dto.squareFeet,
      marketRent: dto.marketRent || '0.00',
      status: dto.status || 'vacant',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('units').insert({
          id: newUnit.id,
          company_id: newUnit.companyId,
          property_id: newUnit.propertyId,
          unit_number: newUnit.unitNumber,
          type: newUnit.type,
          floor: newUnit.floor,
          bedrooms: newUnit.bedrooms,
          bathrooms: newUnit.bathrooms,
          square_feet: newUnit.squareFeet,
          market_rent: parseFloat(newUnit.marketRent || '0'),
          status: newUnit.status,
          is_deleted: false,
          created_at: newUnit.createdAt,
          updated_at: newUnit.updatedAt,
        });
      } catch (err) {
        this.logger.warn(`Failed to insert unit into Supabase: ${(err as Error).message}`);
      }
    }

    this.dataStore.units.push(newUnit);
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId,
      collectionName: 'units',
      recordId: newUnit.id,
      action: 'CREATE',
      newData: newUnit,
      actorName: 'Admin User',
    });

    return newUnit;
  }

  async getUnit(id: string, companyId?: string): Promise<Unit> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client?.from('units').select('*').eq('id', id).eq('is_deleted', false).maybeSingle() || {};
        if (!error && data) {
          return {
            id: data.id,
            companyId: data.company_id,
            workspaceId: data.company_id,
            propertyId: data.property_id,
            unitNumber: data.unit_number,
            type: data.type,
            floor: data.floor,
            bedrooms: data.bedrooms,
            bathrooms: Number(data.bathrooms),
            squareFeet: data.square_feet ? Number(data.square_feet) : undefined,
            marketRent: String(data.market_rent),
            status: data.status,
            isDeleted: data.is_deleted ?? false,
            deletedAt: data.deleted_at || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        this.logger.warn(`Failed to get unit from Supabase: ${(err as Error).message}`);
      }
    }

    const unit = this.dataStore.units.find(
      (u) => u.id === id && (u.companyId === effectiveCompanyId || (u as any).workspaceId === effectiveCompanyId) && !u.isDeleted
    );
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async updateUnit(id: string, updates: Partial<Unit>, companyId?: string): Promise<Unit> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const existing = await this.getUnit(id, effectiveCompanyId);
    const oldData = { ...existing };

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('units').update({
          unit_number: updates.unitNumber ?? existing.unitNumber,
          type: updates.type ?? existing.type,
          floor: updates.floor ?? existing.floor,
          bedrooms: updates.bedrooms ?? existing.bedrooms,
          bathrooms: updates.bathrooms ?? existing.bathrooms,
          square_feet: updates.squareFeet ?? existing.squareFeet,
          market_rent: updates.marketRent ? parseFloat(updates.marketRent) : parseFloat(existing.marketRent || '0'),
          status: updates.status ?? existing.status,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to update unit in Supabase: ${(err as Error).message}`);
      }
    }

    const idx = this.dataStore.units.findIndex(
      (u) => u.id === id && (u.companyId === effectiveCompanyId || (u as any).workspaceId === effectiveCompanyId)
    );
    if (idx !== -1) {
      this.dataStore.units[idx] = {
        ...this.dataStore.units[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.dataStore.saveToFile();
    }

    const updated = this.dataStore.units[idx] || existing;
    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: existing.propertyId,
      collectionName: 'units',
      recordId: id,
      action: 'UPDATE',
      oldData,
      newData: updated,
      actorName: 'Admin User',
    });

    return updated;
  }

  async deleteUnit(id: string, companyId?: string): Promise<Unit> {
    const effectiveCompanyId = this.resolveCompanyId(companyId);
    const unit = await this.getUnit(id, effectiveCompanyId);
    const now = new Date().toISOString();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('units').update({ is_deleted: true, deleted_at: now }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to soft delete unit from Supabase: ${(err as Error).message}`);
      }
    }

    unit.isDeleted = true;
    unit.deletedAt = now;
    unit.updatedAt = now;

    this.dataStore.units.forEach((u) => {
      if (u.id === id) {
        u.isDeleted = true;
        u.deletedAt = now;
        u.updatedAt = now;
      }
    });
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId: effectiveCompanyId,
      propertyId: unit.propertyId,
      collectionName: 'units',
      recordId: id,
      action: 'DELETE',
      oldData: unit,
      actorName: 'Admin User',
    });

    return unit;
  }
}
