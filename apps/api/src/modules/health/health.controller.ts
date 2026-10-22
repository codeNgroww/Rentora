import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { DataStoreService } from '../../database/data-store.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly dataStore: DataStoreService
  ) {}

  @Get()
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        supabaseConnected: this.supabaseService.isReady(),
        dataStoreCompanies: this.dataStore.companies.length,
        dataStoreProperties: this.dataStore.properties.length,
        dataStoreUnits: this.dataStore.units.length,
      },
    };
  }
}
