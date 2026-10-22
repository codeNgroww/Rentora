import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  Company,
  User,
  CompanyUser,
  UserRole,
} from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';
import { SupabaseService } from '../../database/supabase.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly activityLogsService: ActivityLogsService
  ) {}

  async listCompanies(): Promise<Company[]> {
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          ?.from('companies')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const companies: Company[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            tradeLicenseNo: d.trade_license_no,
            trn: d.trn,
            pocName: d.poc_name,
            pocEmail: d.poc_email,
            pocPhone: d.poc_phone,
            emirate: d.emirate,
            address: d.address,
            currency: d.currency || 'AED',
            timeZone: d.time_zone || 'Asia/Dubai',
            status: d.status || 'active',
            isDeleted: d.is_deleted ?? false,
            deletedAt: d.deleted_at || null,
            createdBy: d.created_by,
            updatedBy: d.updated_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));

          return companies;
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch companies from Supabase, falling back to DataStore: ${(err as Error).message}`);
      }
    }

    return this.dataStore.companies.filter((c) => !c.isDeleted);
  }

  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const newCompany: Company = {
      id,
      name: dto.name,
      tradeLicenseNo: dto.tradeLicenseNo || 'TL-2026-0001',
      trn: dto.trn || '100293849500003',
      pocName: dto.poc.fullName,
      pocEmail: dto.poc.email,
      pocPhone: dto.poc.phone,
      address: dto.address || 'Dubai Marina, UAE',
      emirate: dto.emirate || 'Dubai',
      currency: dto.defaultCurrency || 'AED',
      timeZone: 'Asia/Dubai',
      status: 'active',
      isDeleted: false,
      createdBy: '00000000-0000-0000-0000-000000000001',
      updatedBy: '00000000-0000-0000-0000-000000000001',
      createdAt: now,
      updatedAt: now,
    };

    // Auto-create Admin user for company POC
    const adminUserId = randomUUID();
    const adminUser: User = {
      id: adminUserId,
      companyId: id,
      workspaceId: id,
      userId: adminUserId,
      fullName: dto.poc.fullName,
      userName: dto.poc.fullName,
      email: dto.poc.email.toLowerCase(),
      userEmail: dto.poc.email.toLowerCase(),
      phoneNumber: dto.poc.phone,
      userPhone: dto.poc.phone,
      role: 'admin',
      status: 'active',
      isDeleted: false,
      createdBy: '00000000-0000-0000-0000-000000000001',
      createdAt: now,
      updatedAt: now,
    };

    // Attempt Supabase insert
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();

        // 1. If password provided, provision Auth user
        if (dto.poc.password) {
          await client?.auth.admin.createUser({
            email: dto.poc.email,
            password: dto.poc.password,
            user_metadata: {
              fullName: dto.poc.fullName,
              companyId: id,
              role: 'admin',
            },
            email_confirm: true,
          });
        }

        // 2. Insert Company record into Supabase
        const { error: insertError } = await client?.from('companies').insert({
          id: newCompany.id,
          name: newCompany.name,
          trade_license_no: newCompany.tradeLicenseNo,
          trn: newCompany.trn,
          poc_name: newCompany.pocName,
          poc_email: newCompany.pocEmail,
          poc_phone: newCompany.pocPhone,
          emirate: newCompany.emirate,
          address: newCompany.address,
          currency: newCompany.currency,
          time_zone: newCompany.timeZone,
          status: newCompany.status,
          is_deleted: false,
          created_by: newCompany.createdBy,
          updated_by: newCompany.updatedBy,
          created_at: newCompany.createdAt,
          updated_at: newCompany.updatedAt,
        }) || {};

        if (insertError) {
          this.logger.error(`Failed to insert company into Supabase: ${insertError.message}`);
        } else {
          this.logger.log(`[SuperAdminService] Persisted company ${newCompany.name} (${newCompany.id}) to Supabase`);
        }

        // 3. Insert default Admin User into users table
        const { error: userError } = await client?.from('users').insert({
          id: adminUser.id,
          company_id: adminUser.companyId,
          user_id: adminUser.userId,
          user_name: adminUser.fullName,
          user_email: adminUser.email,
          user_phone: adminUser.phoneNumber,
          role: 'admin',
          status: 'active',
          is_deleted: false,
          created_by: adminUser.createdBy,
          created_at: adminUser.createdAt,
          updated_at: adminUser.updatedAt,
        }) || {};

        if (userError) {
          this.logger.warn(`Failed to insert default admin user into Supabase users table: ${userError.message}`);
        } else {
          this.logger.log(`[SuperAdminService] Persisted default admin user for company ${newCompany.name}`);
        }
      } catch (err) {
        this.logger.error(`Error persisting company to Supabase: ${(err as Error).message}`);
      }
    }

    // Keep DataStore in sync
    this.dataStore.companies.unshift(newCompany);
    this.dataStore.users.push(adminUser);
    this.dataStore.saveToFile();

    // Log in universal activity logs
    await this.activityLogsService.log({
      companyId: newCompany.id,
      collectionName: 'companies',
      recordId: newCompany.id,
      action: 'CREATE',
      newData: newCompany,
      actorName: 'Super Admin',
    });

    await this.activityLogsService.log({
      companyId: newCompany.id,
      collectionName: 'users',
      recordId: adminUser.id,
      action: 'ROLE_AUTHORIZATION_CREATE',
      newData: adminUser,
      actorName: 'Super Admin',
    });

    return newCompany;
  }

  async getCompany(id: string): Promise<Company> {
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          ?.from('companies')
          .select('*')
          .eq('id', id)
          .eq('is_deleted', false)
          .maybeSingle() || {};
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            tradeLicenseNo: data.trade_license_no,
            trn: data.trn,
            pocName: data.poc_name,
            pocEmail: data.poc_email,
            pocPhone: data.poc_phone,
            emirate: data.emirate,
            address: data.address,
            currency: data.currency || 'AED',
            timeZone: data.time_zone || 'Asia/Dubai',
            status: data.status || 'active',
            isDeleted: data.is_deleted ?? false,
            deletedAt: data.deleted_at || null,
            createdBy: data.created_by,
            updatedBy: data.updated_by,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch company from Supabase: ${(err as Error).message}`);
      }
    }

    const comp = this.dataStore.companies.find((c) => c.id === id && !c.isDeleted);
    if (!comp) {
      throw new NotFoundException(`Company with id ${id} not found`);
    }
    return comp;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const comp = await this.getCompany(id);
    const oldData = { ...comp };

    if (dto.name) comp.name = dto.name;
    if (dto.tradeLicenseNo) comp.tradeLicenseNo = dto.tradeLicenseNo;
    if (dto.trn) comp.trn = dto.trn;
    if (dto.emirate) comp.emirate = dto.emirate;
    if (dto.address) comp.address = dto.address;
    if (dto.status) comp.status = dto.status;
    if (dto.pocName) comp.pocName = dto.pocName;
    if (dto.pocEmail) comp.pocEmail = dto.pocEmail;
    if (dto.pocPhone) comp.pocPhone = dto.pocPhone;
    comp.updatedAt = new Date().toISOString();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('companies').update({
          name: comp.name,
          trade_license_no: comp.tradeLicenseNo,
          trn: comp.trn,
          emirate: comp.emirate,
          address: comp.address,
          status: comp.status,
          poc_name: comp.pocName,
          poc_email: comp.pocEmail,
          poc_phone: comp.pocPhone,
          updated_at: comp.updatedAt,
        }).eq('id', id);
      } catch (err) {
        this.logger.warn(`Failed to update company in Supabase: ${(err as Error).message}`);
      }
    }

    const localIdx = this.dataStore.companies.findIndex((c) => c.id === id);
    if (localIdx !== -1) {
      this.dataStore.companies[localIdx] = comp;
      this.dataStore.saveToFile();
    }

    await this.activityLogsService.log({
      companyId: comp.id,
      collectionName: 'companies',
      recordId: comp.id,
      action: 'UPDATE',
      oldData,
      newData: comp,
      actorName: 'Super Admin',
    });

    return comp;
  }

  async deleteCompany(id: string): Promise<Company> {
    const comp = await this.getCompany(id);
    const now = new Date().toISOString();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('companies').update({ is_deleted: true, deleted_at: now }).eq('id', id);
        await client?.from('users').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('properties').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('units').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('tenants').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('leases').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('expenses').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('rent_charges').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
        await client?.from('payments').update({ is_deleted: true, deleted_at: now }).eq('company_id', id);
      } catch (err) {
        this.logger.warn(`Failed to soft delete company from Supabase: ${(err as Error).message}`);
      }
    }

    comp.isDeleted = true;
    comp.deletedAt = now;

    // Soft delete child records in DataStore
    this.dataStore.users.forEach((u) => {
      if (u.companyId === id) {
        u.isDeleted = true;
        u.deletedAt = now;
      }
    });
    this.dataStore.properties.forEach((p) => {
      if (p.companyId === id) {
        p.isDeleted = true;
        p.deletedAt = now;
      }
    });
    this.dataStore.units.forEach((u) => {
      if (u.companyId === id) {
        u.isDeleted = true;
        u.deletedAt = now;
      }
    });
    this.dataStore.tenants.forEach((t) => {
      if (t.companyId === id) {
        t.isDeleted = true;
        t.deletedAt = now;
      }
    });
    this.dataStore.leases.forEach((l) => {
      if (l.companyId === id) {
        l.isDeleted = true;
        l.deletedAt = now;
      }
    });
    this.dataStore.expenses.forEach((e) => {
      if (e.companyId === id) {
        e.isDeleted = true;
        e.deletedAt = now;
      }
    });
    this.dataStore.rentCharges.forEach((r) => {
      if (r.companyId === id) {
        r.isDeleted = true;
        r.deletedAt = now;
      }
    });
    this.dataStore.payments.forEach((p) => {
      if (p.companyId === id) {
        p.isDeleted = true;
        p.deletedAt = now;
      }
    });
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId: id,
      collectionName: 'companies',
      recordId: id,
      action: 'DELETE',
      oldData: comp,
      actorName: 'Super Admin',
    });

    return comp;
  }

  async resetPassword(id: string, customPassword?: string): Promise<{ newPassword: string; company: Company }> {
    const comp = await this.getCompany(id);
    const newPassword =
      customPassword?.trim() || `Rentora@${Math.floor(1000 + Math.random() * 9000)}`;

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        if (comp.pocEmail) {
          const { data: userList } = await client?.auth.admin.listUsers() || {};
          const targetUser = userList?.users?.find(
            (u: any) => u.email?.toLowerCase() === comp.pocEmail?.toLowerCase()
          );

          if (targetUser) {
            await client?.auth.admin.updateUserById(targetUser.id, {
              password: newPassword,
            });
          } else {
            await client?.auth.admin.createUser({
              email: comp.pocEmail,
              password: newPassword,
              user_metadata: {
                fullName: comp.pocName,
                companyId: comp.id,
                role: 'admin',
              },
              email_confirm: true,
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to reset password in Supabase: ${(err as Error).message}`);
      }
    }

    await this.activityLogsService.log({
      companyId: comp.id,
      collectionName: 'auth_credentials',
      recordId: comp.id,
      action: 'PASSWORD_RESET',
      newData: {
        companyId: comp.id,
        pocEmail: comp.pocEmail,
        resetTimestamp: new Date().toISOString(),
      },
      actorName: 'Super Admin',
    });

    return { newPassword, company: comp };
  }

  async getCompanyUsers(companyId: string): Promise<User[]> {
    await this.getCompany(companyId);

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          ?.from('users')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            companyId: d.company_id,
            workspaceId: d.company_id,
            userId: d.user_id || d.id,
            fullName: d.user_name || d.full_name,
            userName: d.user_name || d.full_name,
            email: d.user_email || d.email,
            userEmail: d.user_email || d.email,
            phoneNumber: d.user_phone || d.phone_number,
            userPhone: d.user_phone || d.phone_number,
            role: d.role,
            status: d.status || 'active',
            isDeleted: d.is_deleted ?? false,
            deletedAt: d.deleted_at || null,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch users from Supabase: ${(err as Error).message}`);
      }
    }

    let users = this.dataStore.users.filter(
      (u) => u.companyId === companyId && !u.isDeleted
    );
    if (users.length === 0) {
      const comp = this.dataStore.companies.find((c) => c.id === companyId && !c.isDeleted);
      if (comp?.pocEmail) {
        const pocUser: User = {
          id: randomUUID(),
          companyId: comp.id,
          workspaceId: comp.id,
          userId: randomUUID(),
          userName: comp.pocName || 'Company POC Admin',
          fullName: comp.pocName || 'Company POC Admin',
          userEmail: comp.pocEmail.toLowerCase(),
          email: comp.pocEmail.toLowerCase(),
          role: 'admin',
          status: 'active',
          isDeleted: false,
          createdAt: comp.createdAt,
        };
        this.dataStore.users.push(pocUser);
        this.dataStore.saveToFile();
        users = [pocUser];
      }
    }

    return users;
  }

  async createCompanyUser(
    companyId: string,
    body: { userName?: string; fullName?: string; userEmail?: string; email?: string; role: UserRole; phone?: string; password?: string }
  ): Promise<User> {
    await this.getCompany(companyId);
    const email = (body.userEmail || body.email || '').trim().toLowerCase();
    const fullName = (body.userName || body.fullName || '').trim();
    const role = body.role || 'manager';
    const now = new Date().toISOString();
    const userId = randomUUID();

    const newUser: User = {
      id: userId,
      companyId,
      workspaceId: companyId,
      userId,
      userName: fullName,
      fullName,
      userEmail: email,
      email,
      phoneNumber: body.phone,
      userPhone: body.phone,
      role,
      status: 'active',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: '00000000-0000-0000-0000-000000000001',
    };

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.auth.admin.createUser({
          email,
          password: body.password || `Rentora@${Math.floor(1000 + Math.random() * 9000)}`,
          user_metadata: {
            fullName: newUser.fullName,
            companyId,
            role: newUser.role,
          },
          email_confirm: true,
        });

        await client?.from('users').insert({
          id: newUser.id,
          company_id: companyId,
          user_id: newUser.userId,
          user_name: newUser.fullName,
          user_email: newUser.email,
          user_phone: newUser.phoneNumber,
          role: newUser.role,
          status: 'active',
          is_deleted: false,
          created_by: newUser.createdBy,
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt,
        });
      } catch (err) {
        this.logger.warn(`Failed to provision user in Supabase: ${(err as Error).message}`);
      }
    }

    this.dataStore.users.push(newUser);
    this.dataStore.saveToFile();

    await this.activityLogsService.log({
      companyId,
      collectionName: 'users',
      recordId: newUser.id,
      action: 'ROLE_AUTHORIZATION_CREATE',
      newData: { ...newUser, authorizedRole: newUser.role },
      actorName: 'Super Admin',
    });

    return newUser;
  }

  async updateCompanyUserRole(companyId: string, userId: string, role: UserRole): Promise<User> {
    const user = this.dataStore.users.find(
      (u) => (u.id === userId || u.userId === userId) && u.companyId === companyId && !u.isDeleted
    );
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found for company ${companyId}`);
    }

    const oldRole = user.role;
    user.role = role;
    user.updatedAt = new Date().toISOString();
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client
          ?.from('users')
          .update({ role, updated_at: user.updatedAt })
          .or(`id.eq.${userId},user_id.eq.${userId}`);
      } catch (err) {
        this.logger.warn(`Failed to update user role in Supabase: ${(err as Error).message}`);
      }
    }

    await this.activityLogsService.log({
      companyId,
      collectionName: 'users',
      recordId: user.id,
      action: 'ROLE_AUTHORIZATION_CHANGE',
      oldData: { userId: user.id, role: oldRole },
      newData: { userId: user.id, role: user.role },
      actorName: 'Super Admin',
    });

    return user;
  }

  async deleteCompanyUser(companyId: string, userId: string): Promise<User> {
    const user = this.dataStore.users.find(
      (u) => (u.id === userId || u.userId === userId) && u.companyId === companyId && !u.isDeleted
    );
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found for company ${companyId}`);
    }

    const now = new Date().toISOString();
    user.isDeleted = true;
    user.deletedAt = now;
    user.updatedAt = now;
    this.dataStore.saveToFile();

    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client
          ?.from('users')
          .update({ is_deleted: true, deleted_at: now, updated_at: now })
          .or(`id.eq.${userId},user_id.eq.${userId}`);
      } catch (err) {
        this.logger.warn(`Failed to soft delete user in Supabase: ${(err as Error).message}`);
      }
    }

    await this.activityLogsService.log({
      companyId,
      collectionName: 'users',
      recordId: user.id,
      action: 'ROLE_AUTHORIZATION_REVOKE',
      oldData: user,
      actorName: 'Super Admin',
    });

    return user;
  }
}
