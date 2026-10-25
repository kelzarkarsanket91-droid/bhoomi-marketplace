import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  jwtSecret: process.env.JWT_SECRET || 'bhoomi_super_secret_jwt_access_key_2026_nagpur_wardha',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'bhoomi_super_secret_jwt_refresh_key_2026_nagpur_wardha',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // 32-byte hexadecimal key for AES-256-GCM (64 hex characters)
  encryptionKeyHex:
    process.env.ENCRYPTION_KEY ||
    'a7f8e32c91b54d6023e4f7192837465a1029384756abcdef1234567890abcdef',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  otpProvider: process.env.OTP_PROVIDER || 'console',
  otpExpirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || '60', 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
