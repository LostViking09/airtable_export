import { Transaction } from '../types';

export function parseNumber(val: string): number {
  if (!val) return 0;
  // Strip all alphabetical characters (includes HUF, Ft, HUF, EUR, etc.) case-insensitive & Hungarian accents
  let cleaned = val.replace(/[a-zA-ZáéíóöőuúüűÁÉÍÓÖŐUÚÜŰ]/g, '');
  // Strip spaces, quotes, non-breaking spaces
  cleaned = cleaned.replace(/[\s"'\u00A0]/g, '');
  
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // dots are thousands, commas are decimals
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    // multiple dots are thousands separators (e.g. 1.234.567)
    cleaned = cleaned.replace(/\./g, '');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // single comma is decimal separator
    cleaned = cleaned.replace(',', '.');
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatOsszeg(num: number): string {
  const formatted = Math.abs(num).toLocaleString('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace(/\s/g, ' '); 
  return (num < 0 ? '-' : '') + formatted;
}

export function formatDatumWithDay(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.trim();
  
  // If already contains weekday info, returns original
  if (cleanStr.includes('(') && cleanStr.includes(')')) {
    return cleanStr;
  }

  const cleanNoSpaces = cleanStr.replace(/\s/g, '');
  const matches = cleanNoSpaces.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})\.?$/);
  if (matches) {
    const year = parseInt(matches[1], 10);
    const month = parseInt(matches[2], 10) - 1; 
    const day = parseInt(matches[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      const days = ['vas.', 'hétf.', 'kedd', 'szer.', 'csüt.', 'pént.', 'szomb.'];
      const dayName = days[date.getDay()];
      return `${year}.${String(month + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}. (${dayName})`;
    }
  }

  const altDate = new Date(cleanStr.replace(/\./g, '/'));
  if (!isNaN(altDate.getTime())) {
    const days = ['vas.', 'hétf.', 'kedd', 'szer.', 'csüt.', 'pént.', 'szomb.'];
    const dayName = days[altDate.getDay()];
    return `${cleanStr} (${dayName})`;
  }

  return cleanStr;
}

export function appendDayName(original: string, date: Date): string {
  const days = ['vas.', 'hétf.', 'kedd', 'szer.', 'csüt.', 'pént.', 'szomb.'];
  const dayName = days[date.getDay()];
  return `${original} (${dayName})`;
}

export function getTipusBadgeClasses(tipus: string, osszeg: number): string {
  const norm = (tipus || '').trim().toLowerCase();
  const baseClasses = 'inline-block whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium';
  
  if (norm === 'saját munkadíj') {
    return `${baseClasses} bg-indigo-100 text-indigo-900`;
  }
  if (norm === 'továbbhárított költség') {
    if (osszeg < 0) {
      return `${baseClasses} bg-emerald-100 text-emerald-900`;
    }
    return `${baseClasses} bg-sky-100 text-sky-900`;
  }
  if (norm === 'továbbhárított munkadíj') {
    return `${baseClasses} bg-amber-100 text-amber-900`;
  }
  if (norm.includes('eszközbérlés')) {
    return `${baseClasses} bg-teal-100 text-teal-900`;
  }
  return `${baseClasses} bg-neutral-100 text-neutral-800`;
}

export function formatTipusForHTML(tipus: string, osszeg: number): string {
  if (!tipus) return '';
  const norm = tipus.trim().toLowerCase();
  let bg = '#f3f4f6';
  let color = '#1f2937';
  
  if (norm === 'saját munkadíj') {
    bg = '#e0e7ff'; // indigo-100
    color = '#312e81'; // indigo-900
  } else if (norm === 'továbbhárított költség') {
    if (osszeg < 0) {
      bg = '#d1fae5'; // emerald-100
      color = '#064e3b'; // emerald-900
    } else {
      bg = '#e0f2fe'; // sky-100
      color = '#0c4a6e'; // sky-900
    }
  } else if (norm === 'továbbhárított munkadíj') {
    bg = '#fef3c7'; // amber-100
    color = '#78350f'; // amber-900
  } else if (norm.includes('eszközbérlés')) {
    bg = '#ccfbf1'; // teal-100
    color = '#115e59'; // teal-900
  }
  
  return `<span style="background-color: ${bg}; color: ${color}; border-radius: 9999px; padding: 2px 10px; font-weight: 500; font-size: 11px; display: inline-block; white-space: nowrap;">${tipus}</span>`;
}

export function formatDescriptionForHTML(desc: string): string {
  if (!desc) return '';
  const parts = desc.split(/(\[[^\]]+\])/);
  return parts.map(part => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const innerText = part.slice(1, -1);
      return `<span style="background-color: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px 6px; font-weight: 600; font-size: 11px; margin: 0 2px; display: inline-block;">[${innerText}]</span>`;
    }
    return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }).join('');
}

export interface TypeSummary {
  label: string;
  amount: number;
}

export function getTypeSummaries(transactions: Transaction[]): TypeSummary[] {
  const groups: { [key: string]: number } = {};
  
  transactions.forEach(t => {
    let rawType = (t.tipus || '').trim();
    if (!rawType) {
      rawType = 'Típus nélkül';
    }
    
    let key = rawType;
    const normalizedType = rawType.toLowerCase();
    if (normalizedType === 'továbbhárított költség') {
      key = t.osszeg < 0 ? 'Továbbhárított költség -' : 'Továbbhárított költség +';
    }
    
    groups[key] = (groups[key] || 0) + t.osszeg;
  });

  return Object.entries(groups)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => a.label.localeCompare(b.label, 'hu'));
}
