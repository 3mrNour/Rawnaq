import crypto from 'crypto';
import { Shop } from './shop.model.js';
import { AppError } from '../../utils/AppError.js';

const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class KeyGenerationExhaustedError extends AppError {
  constructor() {
    super(500, 'Exhausted retries generating a unique license key');
  }
}

const generateRandomSegment = (length: number): string => {
  let segment = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    segment += ALLOWED_CHARS[randomBytes[i] % ALLOWED_CHARS.length];
  }
  return segment;
};

export const generateLicenseKey = async (): Promise<string> => {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const key = `RWNQ-${generateRandomSegment(4)}-${generateRandomSegment(4)}`;

    const exists = await Shop.exists({ licenseKey: key });
    if (!exists) {
      return key;
    }
  }

  throw new KeyGenerationExhaustedError();
};
