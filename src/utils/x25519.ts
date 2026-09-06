// src/utils/x25519.ts
// RFC 7748 compliant X25519 scalar multiplication in pure JavaScript using BigInt

const P = 2n ** 255n - 19n;
const A24 = 121665n; // (486662 - 2) / 4

function mod(n: bigint, m: bigint = P): bigint {
  const result = n % m;
  return result >= 0n ? result : result + m;
}

function modPow(base: bigint, exp: bigint, modulus: bigint = P): bigint {
  let res = 1n;
  let b = mod(base, modulus);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) res = mod(res * b, modulus);
    b = mod(b * b, modulus);
    e >>= 1n;
  }
  return res;
}

function modInverse(n: bigint, p: bigint = P): bigint {
  return modPow(n, p - 2n, p);
}

function decodeLittleEndian(bytes: Uint8Array): bigint {
  let res = 0n;
  for (let i = 0; i < bytes.length; i++) {
    res |= BigInt(bytes[i]) << BigInt(8 * i);
  }
  return res;
}

function encodeLittleEndian(num: bigint, length = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  let n = num;
  for (let i = 0; i < length; i++) {
    bytes[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return bytes;
}

/**
 * RFC 7748 X25519 function.
 * Computes scalar * u-coordinate.
 */
export function x25519(scalar: Uint8Array, uCoordinate: Uint8Array): Uint8Array {
  const kBytes = new Uint8Array(scalar);
  kBytes[0] &= 248;
  kBytes[31] &= 127;
  kBytes[31] |= 64;

  const k = decodeLittleEndian(kBytes);
  const u = decodeLittleEndian(uCoordinate) % P;

  let x1 = u;
  let x2 = 1n;
  let z2 = 0n;
  let x3 = u;
  let z3 = 1n;
  let swap = 0n;

  for (let t = 254; t >= 0; t--) {
    const kt = (k >> BigInt(t)) & 1n;
    swap ^= kt;
    if (swap) {
      const tx = x2; x2 = x3; x3 = tx;
      const tz = z2; z2 = z3; z3 = tz;
    }
    swap = kt;

    const A = mod(x2 + z2);
    const AA = mod(A * A);
    const B = mod(x2 - z2);
    const BB = mod(B * B);
    const E = mod(AA - BB);
    const C = mod(x3 + z3);
    const D = mod(x3 - z3);
    const DA = mod(D * A);
    const CB = mod(C * B);
    
    x3 = mod(modPow(DA + CB, 2n));
    z3 = mod(x1 * modPow(DA - CB, 2n));
    x2 = mod(AA * BB);
    z2 = mod(E * (AA + mod(A24 * E)));
  }

  if (swap) {
    const tx = x2; x2 = x3; x3 = tx;
    const tz = z2; z2 = z3; z3 = tz;
  }

  const result = mod(x2 * modInverse(z2));
  return encodeLittleEndian(result, 32);
}

/**
 * Base point for X25519 (u = 9).
 */
const BASE_POINT = new Uint8Array(32);
BASE_POINT[0] = 9;

/**
 * Computes the public key for a 32-byte private key.
 */
export function getPublicKey(privateKey: Uint8Array): Uint8Array {
  return x25519(privateKey, BASE_POINT);
}

/**
 * Helper to convert Uint8Array to base64url.
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Helper to convert base64url to Uint8Array.
 */
export function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Formats a 32-byte public key as a user-friendly string (e.g. pub_...).
 */
export function formatPublicKey(pubKeyBytes: Uint8Array): string {
  return 'pub_' + bytesToBase64Url(pubKeyBytes);
}

/**
 * Parses a user-friendly public key string (e.g. pub_...).
 */
export function parsePublicKey(formattedKey: string): Uint8Array | null {
  try {
    const cleanKey = formattedKey.trim();
    if (!cleanKey.startsWith('pub_')) return null;
    const bytes = base64UrlToBytes(cleanKey.slice(4));
    if (bytes.length !== 32) return null;
    return bytes;
  } catch {
    return null;
  }
}
