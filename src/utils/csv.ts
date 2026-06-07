import { Transaction } from '../types';
import { parseNumber } from './format';

export function detectSeparator(row: string): string {
  const line = row.trim();
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

export function parseCSV(text: string): Transaction[] {
  const rows = text.split(/\r?\n/);
  if (rows.length === 0) return [];
  
  const headerLineIndex = rows.findIndex(r => r.trim().length > 0);
  if (headerLineIndex === -1) return [];
  
  const separator = detectSeparator(rows[headerLineIndex]);
  
  const splitRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = splitRow(rows[headerLineIndex]).map(h => h.trim().toLowerCase());
  
  let dateIdx = headers.findIndex(h => h.includes('dátum') || h.includes('date') || h.includes('idő') || h.includes('nap'));
  let catIdx = headers.findIndex(h => h.includes('kat') || h.includes('category') || h.includes('rendez'));
  let descIdx = headers.findIndex(h => h.includes('megnevez') || h.includes('leírás') || h.includes('desc') || h.includes('szöveg') || h.includes('nev') || h.includes('partner'));
  let tipusIdx = headers.findIndex(h => h.includes('típus') || h.includes('tipus') || h.includes('type') || h.includes('jelleg'));
  let amtIdx = headers.findIndex(h => h.includes('összeg') || h.includes('osszeg') || h.includes('amount') || h.includes('ár') || h.includes('rték') || h.includes('ft'));

  if (dateIdx === -1) dateIdx = 0;
  if (catIdx === -1) catIdx = headers.length > 1 ? 1 : 0;
  if (descIdx === -1) descIdx = headers.length > 2 ? 2 : 0;
  if (amtIdx === -1) amtIdx = headers.length > 3 ? headers.length - 1 : headers.length - 1;

  const list: Transaction[] = [];
  
  for (let i = headerLineIndex + 1; i < rows.length; i++) {
    const rowText = rows[i].trim();
    if (!rowText) continue;
    
    const columns = splitRow(rowText);
    if (columns.length < 2) continue;

    const datum = columns[dateIdx] || '';
    const kategoria = columns[catIdx] || '';
    const megnevezes = columns[descIdx] || '';
    const tipus = tipusIdx !== -1 ? (columns[tipusIdx] || '') : '';
    const osszeg = parseNumber(columns[amtIdx] || '0');

    list.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      datum,
      kategoria,
      megnevezes,
      tipus,
      osszeg,
    });
  }

  return list;
}
