import { Controller, Get, Post, Patch, Body, Headers } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { Workspace, WorkspaceMember } from '@rental-saas/contracts';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get()
  listWorkspaces(@Headers('x-user-id') userId?: string) {
    // If user header provided, filter workspaces where user is a member
    const effectiveUserId = userId || 'a1111111-1111-4111-8111-111111111111';
    const memberWsIds = this.dataStore.members
      .filter((m) => m.userId === effectiveUserId)
      .map((m) => m.workspaceId);

    const result = this.dataStore.workspaces.filter(
      (w) => memberWsIds.includes(w.id) || w.ownerId === effectiveUserId
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post()
  createWorkspace(
    @Body() body: { name: string; defaultCurrency?: string; timeZone?: string },
    @Headers('x-user-id') userId?: string
  ) {
    const effectiveUserId = userId || 'a1111111-1111-4111-8111-111111111111';
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: body.name,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      defaultCurrency: body.defaultCurrency || 'AED',
      timeZone: body.timeZone || 'Asia/Dubai',
      ownerId: effectiveUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.workspaces.push(newWs);

    // Add owner as workspace member
    const member: WorkspaceMember = {
      id: `m-${Date.now()}`,
      workspaceId: newWs.id,
      userId: effectiveUserId,
      userEmail: 'user@example.com',
      userName: 'Workspace Owner',
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.dataStore.members.push(member);
    this.dataStore.saveToFile();

    return {
      success: true,
      data: newWs,
    };
  }

  @Get('members')
  listMembers(@Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = wsId || this.dataStore.workspaces[0]?.id;
    const members = this.dataStore.members.filter((m) => m.workspaceId === effectiveWsId);
    return {
      success: true,
      data: members,
    };
  }

  @Get('settings')
  getSettings(@Headers('x-workspace-id') wsId?: string) {
    const effectiveWsId = wsId || this.dataStore.workspaces[0]?.id;
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
      success: true,
      data: {
        workspaceId: ws?.id,
        name: ws?.name,
        defaultCurrency: ws?.defaultCurrency || 'AED',
        timeZone: ws?.timeZone || 'Asia/Dubai',
        vatSettings,
      },
    };
  }

  @Patch('settings')
  updateSettings(
    @Body()
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
    @Headers('x-workspace-id') wsId?: string
  ) {
    const effectiveWsId = wsId || this.dataStore.workspaces[0]?.id;
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
      this.dataStore.saveToFile();
    }

    return {
      success: true,
      data: ws,
    };
  }
}
