import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  public client: SupabaseClient | null = null;
  private isConnected = false;

  onModuleInit() {
    this.initClient();
  }

  private initClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('dummy_')) {
      this.logger.warn(
        '[SupabaseService] Real Supabase credentials not provided in .env. Initializing in fallback/local mode.'
      );
      return;
    }

    try {
      this.client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.isConnected = true;
      this.logger.log(`[SupabaseService] Connected to Supabase at: ${supabaseUrl}`);
    } catch (error) {
      this.logger.error('[SupabaseService] Error initializing Supabase client:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}
