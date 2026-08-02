import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  allowedOrigins: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ].map((o) => o.replace(/\/$/, '')),
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-in-production-32'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production-32'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'NFT Certificates <noreply@nftcerts.com>',
  },
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretApiKey: process.env.PINATA_SECRET_API_KEY || '',
    jwt: process.env.PINATA_JWT || '',
    gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
  },
  blockchain: {
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    privateKey: process.env.PRIVATE_KEY || '',
    contractAddress: process.env.CERTIFICATE_NFT_ADDRESS || '',
    chainId: parseInt(process.env.CHAIN_ID || '80002', 10),
    explorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://amoy.polygonscan.com',
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@nftcerts.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  },
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
};
