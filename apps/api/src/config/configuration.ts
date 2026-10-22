export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  supabase: {
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
    jwtSecret?: string;
  };
  database: {
    url?: string;
    directUrl?: string;
  };
  storage: {
    bucketDocs: string;
    bucketProofs: string;
  };
  dataDir: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  storage: {
    bucketDocs: process.env.SUPABASE_STORAGE_BUCKET_DOCS || 'company-documents',
    bucketProofs: process.env.SUPABASE_STORAGE_BUCKET_PROOFS || 'payment-proofs',
  },
  dataDir: process.env.DATA_DIR || process.cwd() + '/data',
});
