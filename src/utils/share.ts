import { Transaction } from '../types';

interface CompressedState {
  t: [string, string, string, string, number, string][]; // datum, kategoria, megnevezes, tipus, osszeg, id
  s: [boolean, boolean, boolean, boolean]; // showSummary, showTipus, separateMunkadij, showFtSuffix
  o: [string, number | null]; // editMode ('none' | 'all' | 'empty'), defaultAmount
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
    defaultAmount: number | null;
  }
): Promise<string> {
  const compressed: CompressedState = {
    t: transactions.map(t => [t.datum, t.kategoria, t.megnevezes, t.tipus || '', t.osszeg, t.id]),
    s: [settings.showSummary, settings.showTipus, settings.separateMunkadij, settings.showFtSuffix],
    o: [options.editMode, options.defaultAmount]
  };

  const jsonString = JSON.stringify(compressed);
  
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

export async function decompressShareState(hash: string): Promise<{
  transactions: Transaction[];
  settings: {
    showSummary: boolean;
    showTipus: boolean;
    separateMunkadij: boolean;
    showFtSuffix: boolean;
  };
  options: {
    editMode: 'none' | 'all' | 'empty';
    defaultAmount: number | null;
  };
} | null> {
  if (!hash) return null;
  
  const prefix = hash.slice(0, 3);
  const dataPart = hash.slice(3);
  
  let jsonString = '';
  
  try {
    const buffer = base64UrlToBuffer(dataPart);
    
    if (prefix === 'z1_') {
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
        defaultAmount: parsed.o[1]
      }
    };
  } catch (e) {
    console.error('Failed to decompress share state:', e);
    return null;
  }
}
