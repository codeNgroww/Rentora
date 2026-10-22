import { Controller, Get, Post, Patch, Body, Headers, Optional, Inject } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  private readonly workspacesService: WorkspacesService;

  constructor(
    @Optional() @Inject(WorkspacesService) serviceOrStore?: WorkspacesService | DataStoreService
  ) {
    if (serviceOrStore instanceof DataStoreService) {
      this.workspacesService = new WorkspacesService(serviceOrStore);
    } else if (serviceOrStore) {
      this.workspacesService = serviceOrStore;
    } else {
      const ds = new DataStoreService();
      ds.onModuleInit();
      this.workspacesService = new WorkspacesService(ds);
    }
  }

  @Get()
  listWorkspaces(@Headers('x-user-id') userId?: string) {
    const data = this.workspacesService.listWorkspaces(userId);
    return {
      success: true,
      data,
    };
  }

  @Post()
  createWorkspace(
    @Body() body: { name: string; defaultCurrency?: string; timeZone?: string },
    @Headers('x-user-id') userId?: string
  ) {
    const data = this.workspacesService.createWorkspace(body, userId);
    return {
      success: true,
      data,
    };
  }

  @Get('members')
  listMembers(@Headers('x-workspace-id') wsId?: string) {
    const data = this.workspacesService.listMembers(wsId);
    return {
      success: true,
      data,
    };
  }

  @Get('settings')
  getSettings(@Headers('x-workspace-id') wsId?: string) {
    const data = this.workspacesService.getSettings(wsId);
    return {
      success: true,
      data,
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
    const data = this.workspacesService.updateSettings(body, wsId);
    return {
      success: true,
      data,
    };
  }
}
