// src/utils/share.ts
import { Transaction } from '../types';
import { encryptData, decryptData, encryptAsymmetric, decryptAsymmetric } from './crypto';
import { parsePublicKey } from './x25519';

interface CompressedState {
  t: [string, string, string, string, number, string][]; // datum, kategoria, megnevezes, tipus, osszeg, id
  s: [boolean, boolean, boolean, boolean]; // showSummary, showTipus, separateMunkadij, showFtSuffix
  o: [string, number | null, (number | null)?]; // editMode ('none' | 'all' | 'empty'), defaultSajátAmount, defaultKülsősAmount
  c?: number; // correction (optional)
  ti?: string; // custom title (optional)
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export type EncryptionConfig = 
  | string // Legacy string password
  | {
      type: 'none';
    }
  | {
      type: 'password';
      password: string;
    }
  | {
      type: 'pubkey';
      recipientPublicKey: string;
    };

export async function compressShareState(
  transactions: Transaction[],
  settings: {
    showSummary: boolean;
    showTipus: boolean;
    separateMunkadij: boolean;
    showFtSuffix: boolean;
  },
  options: {
    editMode: 'none' | 'all' | 'empty';
    defaultSajátAmount: number | null;
    defaultKülsősAmount: number | null;
  },
  correction: number,
  customTitle?: string,
  encryption?: EncryptionConfig
): Promise<string> {
  const compressed: CompressedState = {
    t: transactions.map(t => [t.datum, t.kategoria, t.megnevezes, t.tipus || '', t.osszeg, t.id]),
    s: [settings.showSummary, settings.showTipus, settings.separateMunkadij, settings.showFtSuffix],
    o: [options.editMode, options.defaultSajátAmount, options.defaultKülsősAmount],
    c: correction,
    ti: customTitle || undefined
  };

  const jsonString = JSON.stringify(compressed);

  // Check encryption mode
  if (typeof encryption === 'string' && encryption.trim() !== '') {
    const { encryptedBuffer, salt, iv } = await encryptData(jsonString, encryption.trim());
    const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
    return 'e1_' + bufferToBase64Url(combined.buffer);
  } else if (encryption && typeof encryption === 'object') {
    if (encryption.type === 'password' && encryption.password.trim() !== '') {
      const { encryptedBuffer, salt, iv } = await encryptData(jsonString, encryption.password.trim());
      const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
      return 'e1_' + bufferToBase64Url(combined.buffer);
    } else if (encryption.type === 'pubkey' && encryption.recipientPublicKey.trim() !== '') {
      const pubKeyBytes = parsePublicKey(encryption.recipientPublicKey);
      if (!pubKeyBytes) {
        throw new Error('Érvénytelen címzett publikus kulcs formátum.');
      }
      const { encryptedBuffer, ephemeralPubKey, iv } = await encryptAsymmetric(jsonString, pubKeyBytes);
      const combined = new Uint8Array(ephemeralPubKey.length + iv.length + encryptedBuffer.byteLength);
      combined.set(ephemeralPubKey, 0);
      combined.set(iv, ephemeralPubKey.length);
      combined.set(new Uint8Array(encryptedBuffer), ephemeralPubKey.length + iv.length);
      return 'e2_' + bufferToBase64Url(combined.buffer);
    }
  }
  
  try {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([jsonString]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const buffer = await new Response(compressedStream).arrayBuffer();
      return 'z1_' + bufferToBase64Url(buffer);
    }
  } catch (e) {
    console.warn('CompressionStream failed or not supported, falling back to plain base64url:', e);
  }

  // Fallback: plain base64url of UTF-8 string
  const utf8Bytes = new TextEncoder().encode(jsonString);
  return 'p1_' + bufferToBase64Url(utf8Bytes.buffer);
}

export async function decompressShareState(hash: string, password?: string): Promise<{
  transactions: Transaction[];
  settings: {
    showSummary: boolean;
    showTipus: boolean;
    separateMunkadij: boolean;
    showFtSuffix: boolean;
  };
  options: {
    editMode: 'none' | 'all' | 'empty';
    defaultSajátAmount: number | null;
    defaultKülsősAmount: number | null;
  };
  correction: number;
  customTitle?: string;
} | null> {
  if (!hash) return null;
  
  const prefix = hash.slice(0, 3);
  const dataPart = hash.slice(3);
  
  let jsonString = '';
  
  try {
    const buffer = base64UrlToBuffer(dataPart);
    
    if (prefix === 'e1_') {
      if (!password) {
        throw new Error('Password required for encrypted share state');
      }
      const salt = new Uint8Array(buffer.slice(0, 16));
      const iv = new Uint8Array(buffer.slice(16, 28));
      const encryptedData = buffer.slice(28);
      jsonString = await decryptData(encryptedData, password, salt, iv);
    } else if (prefix === 'e2_') {
      if (!password) {
        throw new Error('Password required for asymmetric encrypted share state');
      }
      const ephemeralPubKey = new Uint8Array(buffer.slice(0, 32));
      const iv = new Uint8Array(buffer.slice(32, 44));
      const encryptedData = buffer.slice(44);
      jsonString = await decryptAsymmetric(encryptedData, ephemeralPubKey, iv, password);
    } else if (prefix === 'z1_') {
      if (typeof DecompressionStream !== 'undefined') {
        const decompressedStream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
        jsonString = await new Response(decompressedStream).text();
      } else {
        throw new Error('DecompressionStream not supported in this browser, but data is gzip-compressed.');
      }
    } else if (prefix === 'p1_') {
      jsonString = new TextDecoder().decode(buffer);
    } else {
      // Direct base64 fallback for legacy or alternative formats
      jsonString = new TextDecoder().decode(base64UrlToBuffer(hash));
    }

    const parsed = JSON.parse(jsonString) as CompressedState;
    if (!parsed || !Array.isArray(parsed.t)) return null;

    return {
      transactions: parsed.t.map(item => ({
        datum: item[0],
        kategoria: item[1],
        megnevezes: item[2],
        tipus: item[3],
        osszeg: item[4],
        id: item[5] || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9))
      })),
      settings: {
        showSummary: parsed.s[0],
        showTipus: parsed.s[1],
        separateMunkadij: parsed.s[2],
        showFtSuffix: parsed.s[3]
      },
      options: {
        editMode: parsed.o[0] as 'none' | 'all' | 'empty',
        defaultSajátAmount: parsed.o[1],
        defaultKülsősAmount: parsed.o.length > 2 ? (parsed.o[2] ?? null) : parsed.o[1]
      },
      correction: parsed.c ?? 0,
      customTitle: parsed.ti || ''
    };
  } catch (e) {
    console.error('Failed to decompress share state:', e);
    throw e;
  }
}
