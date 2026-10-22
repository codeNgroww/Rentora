import { Global, Module } from '@nestjs/common';
import { DataStoreService } from './data-store.service';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [DataStoreService, SupabaseService],
  exports: [DataStoreService, SupabaseService],
})
export class DatabaseModule {}
