// src/utils/crypto.ts
import { x25519, getPublicKey, formatPublicKey } from './x25519';

const FIXED_SALT = new TextEncoder().encode('airtable_x25519_salt_2026_v1');

/**
 * Derives an AES-GCM encryption key from a given password and salt using PBKDF2 (for symmetric e1_).
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives a deterministic 32-byte X25519 private key from a password.
 */
export async function deriveX25519PrivateKey(password: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: FIXED_SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return new Uint8Array(bits);
}

/**
 * Computes the public key format (pub_...) for a given password.
 */
export async function derivePublicKeyFromPassword(password: string): Promise<string> {
  const privKey = await deriveX25519PrivateKey(password);
  const pubKeyBytes = getPublicKey(privKey);
  return formatPublicKey(pubKeyBytes);
}

/**
 * Derives an AES-GCM CryptoKey from an X25519 shared secret.
 */
async function deriveAesKeyFromSecret(sharedSecret: Uint8Array): Promise<CryptoKey> {
  const hash = await window.crypto.subtle.digest('SHA-256', sharedSecret as unknown as ArrayBuffer);
  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// ----------------------------------------------------
// SYMMETRIC ENCRYPTION (e1_)
// ----------------------------------------------------

export async function encryptData(text: string, password: string): Promise<{ encryptedBuffer: ArrayBuffer, salt: Uint8Array, iv: Uint8Array }> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    enc.encode(text)
  );

  return { encryptedBuffer, salt, iv };
}

export async function decryptData(encryptedBuffer: ArrayBuffer, password: string, salt: Uint8Array, iv: Uint8Array): Promise<string> {
  const key = await deriveKey(password, salt);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// ----------------------------------------------------
// ASYMMETRIC ECIES ENCRYPTION (e2_)
// ----------------------------------------------------

/**
 * Encrypts a string using recipient's public key (X25519 + AES-256-GCM).
 */
export async function encryptAsymmetric(
  text: string,
  recipientPublicKeyBytes: Uint8Array
): Promise<{ encryptedBuffer: ArrayBuffer, ephemeralPubKey: Uint8Array, iv: Uint8Array }> {
  const enc = new TextEncoder();
  const ephemeralPriv = window.crypto.getRandomValues(new Uint8Array(32));
  const ephemeralPubKey = getPublicKey(ephemeralPriv);

  const sharedSecret = x25519(ephemeralPriv, recipientPublicKeyBytes);
  const aesKey = await deriveAesKeyFromSecret(sharedSecret);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    aesKey,
    enc.encode(text)
  );

  return { encryptedBuffer, ephemeralPubKey, iv };
}

/**
 * Decrypts an asymmetric ciphertext using the recipient's password.
 */
export async function decryptAsymmetric(
  encryptedBuffer: ArrayBuffer,
  ephemeralPubKey: Uint8Array,
  iv: Uint8Array,
  password: string
): Promise<string> {
  const recipientPriv = await deriveX25519PrivateKey(password);
  const sharedSecret = x25519(recipientPriv, ephemeralPubKey);
  const aesKey = await deriveAesKeyFromSecret(sharedSecret);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    aesKey,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
