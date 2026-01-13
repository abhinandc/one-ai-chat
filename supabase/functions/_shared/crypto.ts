/**
 * Cryptographic Utilities for Edge Functions
 *
 * Provides AES-256-GCM encryption and decryption for sensitive data
 * like credentials stored in EdgeVault.
 */

/**
 * Generate a random encryption key.
 * In production, this should be stored securely in environment variables.
 */
function getEncryptionKey(): Uint8Array {
  const keyString = Deno.env.get('EDGE_VAULT_ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('Missing EDGE_VAULT_ENCRYPTION_KEY environment variable');
  }

  // Key should be 32 bytes (256 bits) for AES-256
  // If provided as hex, decode it
  if (keyString.length === 64) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(keyString.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  // If provided as base64, decode it
  try {
    const decoded = atob(keyString);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    if (bytes.length !== 32) {
      throw new Error('Key must be 32 bytes');
    }
    return bytes;
  } catch {
    throw new Error('Invalid EDGE_VAULT_ENCRYPTION_KEY format. Must be 64 hex chars or 32-byte base64.');
  }
}

/**
 * Encrypt data using AES-256-GCM.
 * Returns a base64-encoded string containing: IV (12 bytes) + ciphertext + auth tag
 */
export async function encrypt(plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const keyData = getEncryptionKey();

  // Generate a random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data that was encrypted with the encrypt function.
 * Expects a base64-encoded string containing: IV (12 bytes) + ciphertext + auth tag
 */
export async function decrypt(encrypted: string): Promise<string> {
  const keyData = getEncryptionKey();

  // Decode from base64
  const combined = new Uint8Array(
    atob(encrypted).split('').map((c) => c.charCodeAt(0))
  );

  // Extract IV and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the data
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

/**
 * Hash a password or secret using SHA-256.
 * Returns a hex string.
 */
export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
