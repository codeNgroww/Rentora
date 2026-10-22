import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Workspace, WorkspaceMember } from '@rental-saas/contracts';
import { DataStoreService } from '../../database/data-store.service';

@Injectable()
export class WorkspacesService {
  constructor(private readonly dataStore: DataStoreService) {}

  private resolveWsId(wsId?: string): string {
    return (
      wsId ||
      this.dataStore.workspaces[0]?.id ||
      this.dataStore.companies[0]?.id ||
      'c1111111-1111-4111-8111-111111111111'
    );
  }

  listWorkspaces(userId?: string): Workspace[] {
    const effectiveUserId = userId || 'a1111111-1111-4111-8111-111111111111';
    const memberWsIds = this.dataStore.members
      .filter((m) => m.userId === effectiveUserId)
      .map((m) => m.workspaceId);

    return this.dataStore.workspaces.filter(
      (w) => memberWsIds.includes(w.id) || w.ownerId === effectiveUserId
    );
  }

  createWorkspace(body: { name: string; defaultCurrency?: string; timeZone?: string }, userId?: string): Workspace {
    const effectiveUserId = userId || 'a1111111-1111-4111-8111-111111111111';
    const id = randomUUID();
    const now = new Date().toISOString();

    const newWs: Workspace = {
      id,
      name: body.name,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      defaultCurrency: body.defaultCurrency || 'AED',
      timeZone: body.timeZone || 'Asia/Dubai',
      ownerId: effectiveUserId,
      createdAt: now,
      updatedAt: now,
    };

    this.dataStore.workspaces.push(newWs);

    const member: WorkspaceMember = {
      id: randomUUID(),
      workspaceId: newWs.id,
      userId: effectiveUserId,
      userEmail: 'user@example.com',
      userName: 'Workspace Owner',
      role: 'owner',
      status: 'active',
      createdAt: now,
    };
    this.dataStore.members.push(member);
    this.dataStore.saveToFile();

    return newWs;
  }

  listMembers(wsId?: string): WorkspaceMember[] {
    const effectiveWsId = this.resolveWsId(wsId);
    return this.dataStore.members.filter((m) => m.workspaceId === effectiveWsId);
  }

  getSettings(wsId?: string): any {
    const effectiveWsId = this.resolveWsId(wsId);
    const ws =
      this.dataStore.workspaces.find((w) => w.id === effectiveWsId) ||
      this.dataStore.workspaces[0];

    const vatSettings = ws?.vatSettings || {
      enabled: true,
      defaultRate: 5.0,
      trn: '100293849500003',
      calculationMode: 'exclusive',
    };

    return {
      workspaceId: ws?.id,
      name: ws?.name,
      defaultCurrency: ws?.defaultCurrency || 'AED',
      timeZone: ws?.timeZone || 'Asia/Dubai',
      vatSettings,
    };
  }

  updateSettings(
    body: {
      name?: string;
      defaultCurrency?: string;
      timeZone?: string;
      vatSettings?: {
        enabled?: boolean;
        defaultRate?: number;
        trn?: string;
        calculationMode?: 'exclusive' | 'inclusive';
      };
    },
    wsId?: string
  ): any {
    const effectiveWsId = this.resolveWsId(wsId);
    const ws =
      this.dataStore.workspaces.find((w) => w.id === effectiveWsId) ||
      this.dataStore.workspaces[0];

    if (ws) {
      if (body.name) ws.name = body.name;
      if (body.defaultCurrency) ws.defaultCurrency = body.defaultCurrency;
      if (body.timeZone) ws.timeZone = body.timeZone;
      if (body.vatSettings) {
        ws.vatSettings = {
          enabled:
            body.vatSettings.enabled !== undefined
              ? body.vatSettings.enabled
              : (ws.vatSettings?.enabled ?? true),
          defaultRate:
            body.vatSettings.defaultRate !== undefined
              ? Number(body.vatSettings.defaultRate)
              : (ws.vatSettings?.defaultRate ?? 5.0),
          trn:
            body.vatSettings.trn !== undefined
              ? body.vatSettings.trn
              : ws.vatSettings?.trn,
          calculationMode:
            body.vatSettings.calculationMode ||
            ws.vatSettings?.calculationMode ||
            'exclusive',
        };
      }
      ws.updatedAt = new Date().toISOString();

      // Sync vatSettings with corresponding company if present
      const comp = this.dataStore.companies.find((c) => c.id === effectiveWsId) || this.dataStore.companies[0];
      if (comp) {
        (comp as any).vatSettings = ws.vatSettings;
      }

      this.dataStore.saveToFile();
    }

    return ws;
  }
}
