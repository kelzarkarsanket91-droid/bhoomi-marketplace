import crypto from 'crypto';
import { config } from '../config/env.js';

// Derive 32-byte key from encryptionKeyHex
const getEncryptionKey = (): Buffer => {
  const keyBuffer = Buffer.from(config.encryptionKeyHex, 'hex');
  if (keyBuffer.length !== 32) {
    // If not exact 32 bytes, hash with SHA-256 to guarantee 32 bytes
    return crypto.createHash('sha256').update(config.encryptionKeyHex).digest();
  }
  return keyBuffer;
};

/**
 * Encrypts sensitive PII (Aadhaar, PAN) using AES-256-GCM.
 * Output format: "cipherTextHex:ivHex:authTagHex"
 */
export function encryptData(plainText: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for AES-GCM
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${encrypted}:${iv.toString('hex')}:${authTag}`;
}

/**
 * Decrypts AES-256-GCM encrypted payload.
 */
export function decryptData(encryptedString: string): string {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [cipherTextHex, ivHex, authTagHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masks 12-digit Aadhaar number: "XXXX-XXXX-1234"
 */
export function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Masks 10-character PAN number: "ABCDE****F"
 */
export function maskPan(pan: string): string {
  const clean = pan.trim().toUpperCase();
  if (clean.length < 10) return 'XXXXXXXXXX';
  const first5 = clean.slice(0, 5);
  const lastChar = clean.slice(-1);
  return `${first5}****${lastChar}`;
}

/**
 * Securely hashes OTP codes using SHA-256 with server-side salt.
 */
export function hashOtpCode(code: string, salt: string = 'bhoomi_otp_salt'): string {
  return crypto.createHmac('sha256', salt).update(code.trim()).digest('hex');
}

/**
 * Constant-time comparison of OTP hashes to prevent timing attacks.
 */
export function verifyOtpCode(providedCode: string, storedHash: string, salt: string = 'bhoomi_otp_salt'): boolean {
  const providedHash = hashOtpCode(providedCode, salt);
  if (providedHash.length !== storedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));
}
