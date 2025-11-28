import crypto from 'crypto';

/**
 * Secure encryption service for user-provided API keys
 * Uses AES-256-CBC with a unique IV for each encryption
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // 16 bytes for AES
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Get the master encryption key from environment variables
 * Throws error if key is not set or invalid
 */
function getMasterKey(): Buffer {
  const masterKey = process.env.SECRET_MASTER_ENCRYPTION_KEY;
  
  if (!masterKey) {
    throw new Error('SECRET_MASTER_ENCRYPTION_KEY environment variable is not set');
  }

  // Ensure key is exactly 32 bytes (256 bits) for AES-256
  const keyBuffer = Buffer.from(masterKey, 'utf8');
  
  if (keyBuffer.length !== KEY_LENGTH) {
    // If key is not 32 bytes, derive a 32-byte key using SHA-256
    return crypto.createHash('sha256').update(masterKey).digest();
  }
  
  return keyBuffer;
}

/**
 * Encrypts a plaintext string (e.g., API key) using AES-256-CBC
 * Returns an object with the encrypted data and IV (both base64 encoded)
 */
export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  try {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return {
      encrypted,
      iv: iv.toString('base64'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an encrypted string using AES-256-CBC
 * Requires the encrypted data and IV (both base64 encoded)
 */
export function decrypt(encrypted: string, ivBase64: string): string {
  try {
    const masterKey = getMasterKey();
    const iv = Buffer.from(ivBase64, 'base64');
    
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Masks an API key for display purposes
 * Shows first 7 characters and last 4 characters, masks the middle
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 11) {
    return '****';
  }
  const start = apiKey.substring(0, 7);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}${'*'.repeat(Math.max(0, apiKey.length - 11))}${end}`;
}

