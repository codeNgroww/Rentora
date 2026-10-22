import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ActivityLogItem, ActivityAction } from '@rental-saas/contracts';
import { SupabaseService } from '../../database/supabase.service';

export interface LogMutationParams {
  companyId: string;
  propertyId?: string | null;
  collectionName: string;
  recordId: string;
  action: ActivityAction;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);
  private memoryLogs: ActivityLogItem[] = [];

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Universal logging plugin method called upon any collection mutation
   */
  async log(params: LogMutationParams): Promise<ActivityLogItem> {
    const diff = this.calculateDiff(params.oldData, params.newData);
    const now = new Date().toISOString();
    const actorId = params.actorId || '00000000-0000-0000-0000-000000000000';
    const actorName = params.actorName || 'Admin User';

    const item: ActivityLogItem = {
      id: this.generateUuid(),
      companyId: params.companyId,
      workspaceId: params.companyId,
      propertyId: params.propertyId || null,
      collectionName: params.collectionName,
      recordId: params.recordId,
      action: params.action,
      oldData: params.oldData || null,
      newData: params.newData || null,
      diff,
      actorId,
      actorName,
      actorEmail: params.actorEmail,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: now,
    };

    // Keep in local cache
    this.memoryLogs.unshift(item);
    if (this.memoryLogs.length > 500) {
      this.memoryLogs.pop();
    }

    // Attempt persistent insert into Supabase activity_logs table
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.from('activity_logs').insert({
          id: item.id,
          company_id: item.companyId,
          property_id: item.propertyId,
          collection_name: item.collectionName,
          record_id: item.recordId,
          action: item.action,
          old_data: item.oldData,
          new_data: item.newData,
          diff: item.diff,
          actor_id: item.actorId,
          actor_name: item.actorName,
          actor_email: item.actorEmail,
          ip_address: item.ipAddress,
          user_agent: item.userAgent,
          created_by: item.createdBy,
          updated_by: item.updatedBy,
          created_at: item.createdAt,
          updated_at: item.createdAt,
        });
      } catch (err) {
        this.logger.warn(`Failed to insert activity log into Supabase: ${(err as Error).message}`);
      }
    }

    return item;
  }

  /**
   * Retrieve activity logs with multi-tenant filtering
   */
  async listLogs(filter: {
    companyId: string;
    propertyId?: string;
    collectionName?: string;
    action?: ActivityAction;
    limit?: number;
  }): Promise<ActivityLogItem[]> {
    // If Supabase is connected, query live table
    if (this.supabaseService.isReady()) {
      try {
        const client = this.supabaseService.getClient();
        let query = client
          ?.from('activity_logs')
          .select('*')
          .eq('company_id', filter.companyId)
          .order('created_at', { ascending: false })
          .limit(filter.limit || 50);

        if (filter.propertyId) {
          query = query?.eq('property_id', filter.propertyId);
        }
        if (filter.collectionName) {
          query = query?.eq('collection_name', filter.collectionName);
        }
        if (filter.action) {
          query = query?.eq('action', filter.action);
        }

        const { data, error } = await query!;
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            companyId: d.company_id,
            workspaceId: d.company_id,
            propertyId: d.property_id,
            collectionName: d.collection_name,
            recordId: d.record_id,
            action: d.action,
            oldData: d.old_data,
            newData: d.new_data,
            diff: d.diff,
            actorId: d.actor_id,
            actorName: d.actor_name,
            actorEmail: d.actor_email,
            ipAddress: d.ip_address,
            userAgent: d.user_agent,
            createdBy: d.created_by,
            updatedBy: d.updated_by,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch logs from Supabase: ${(err as Error).message}`);
      }
    }

    // In-memory filtered fallback
    return this.memoryLogs
      .filter((l) => l.companyId === filter.companyId)
      .filter((l) => !filter.propertyId || l.propertyId === filter.propertyId)
      .filter((l) => !filter.collectionName || l.collectionName === filter.collectionName)
      .filter((l) => !filter.action || l.action === filter.action)
      .slice(0, filter.limit || 50);
  }

  private calculateDiff(
    oldData?: Record<string, any> | null,
    newData?: Record<string, any> | null
  ): Record<string, { from: any; to: any }> | null {
    if (!oldData || !newData) return null;
    const diff: Record<string, { from: any; to: any }> = {};
    const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of keys) {
      if (['updatedAt', 'updated_at', 'createdAt', 'created_at'].includes(key)) continue;
      const oldVal = oldData[key];
      const newVal = newData[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff[key] = { from: oldVal, to: newVal };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  private generateUuid(): string {
    return randomUUID();
  }
}

