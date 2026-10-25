import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export interface UploadedFileResult {
  url: string;
  signedUrl: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      } catch {
        // Safe fallback
      }
    }
  }

  /**
   * Generates a signed URL with HMAC expiration signature for secure asset access.
   */
  generateSignedUrl(assetPath: string, expiresInMinutes: number = 60): string {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    const secret = process.env.JWT_SECRET || 'bhoomi_signed_secret';
    const payload = `${assetPath}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return `${assetPath}?expires=${expiresAt}&signature=${signature}`;
  }

  /**
   * Verifies the authenticity and expiration of a signed URL.
   */
  verifySignedUrl(assetPath: string, expires: string, signature: string): boolean {
    const expiresAt = parseInt(expires, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }

    const secret = process.env.JWT_SECRET || 'bhoomi_signed_secret';
    const expected = crypto.createHmac('sha256', secret).update(`${assetPath}:${expiresAt}`).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

export const storageService = new StorageService();
