import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Info,
  CheckCircle2,
  Trash
} from 'lucide-react';

interface Transaction {
  id: string;
  datum: string;
  kategoria: string;
  megnevezes: string;
  tipus: string;
  osszeg: number;
}

function detectSeparator(row: string): string {
  const line = row.trim();
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

function parseNumber(val: string): number {
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

function parseCSV(text: string): Transaction[] {
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

function formatOsszeg(num: number): string {
  const formatted = Math.abs(num).toLocaleString('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace(/\s/g, ' '); 
  return (num < 0 ? '-' : '') + formatted;
}

function formatDatumWithDay(dateStr: string): string {
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

function appendDayName(original: string, date: Date): string {
  const days = ['vas.', 'hétf.', 'kedd', 'szer.', 'csüt.', 'pént.', 'szomb.'];
  const dayName = days[date.getDay()];
  return `${original} (${dayName})`;
}

function renderDescriptionWithBrackets(desc: string) {
  if (!desc) return '';
  const parts = desc.split(/(\[[^\]]+\])/);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const innerText = part.slice(1, -1);
          return (
            <span key={index} className="bg-gray-100 text-gray-800 border border-gray-200 rounded-md px-1.5 py-0.5 text-xs font-semibold inline-block mx-0.5">
              [{innerText}]
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function formatDescriptionForHTML(desc: string): string {
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

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fileName, setFileName] = useState<string>('Nincs betöltött fájl');
  const [showSummary, setShowSummary] = useState(true);
  const [showTipus, setShowTipus] = useState(true);
  const [showFtSuffix, setShowFtSuffix] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New row input states
  const [newDate, setNewDate] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  });
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTipus, setNewTipus] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Inline editing row states
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTipus, setEditTipus] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // File upload input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Directly map filteredTransactions to transactions since search/filtering is removed
  const filteredTransactions = transactions;

  // Calculate sum of active transactions
  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.osszeg, 0);
  }, [filteredTransactions]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          setTransactions(parsed);
          setFileName(file.name);
          setShowAddForm(false);
        } else {
          alert('Nem sikerült értékelhető adatokat kiolvasni a CSV fájlból. Ellenőrizze a formátumot.');
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Delete all rows
  const handleClearAll = () => {
    if (window.confirm('Biztosan ki szeretné üríteni a teljes táblázatot?')) {
      setTransactions([]);
      setFileName('Üres táblázat');
    }
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };

  // Copy structured table formatting to clipboard (plain-text tsv + rich HTML table + totals & debt badges)
  const copyToClipboard = async () => {
    try {
      // Build header row conditionally
      const headerRow = showTipus 
        ? ['Dátum', 'Rendezvény', 'Megnevezés', 'Típus', showFtSuffix ? 'Összeg (Ft)' : 'Összeg']
        : ['Dátum', 'Rendezvény', 'Megnevezés', showFtSuffix ? 'Összeg (Ft)' : 'Összeg'];

      const bodyRows = filteredTransactions.map(t => {
        const amtStr = t.osszeg === 0 ? '-' : (formatOsszeg(t.osszeg) + (showFtSuffix ? ' Ft' : ''));
        return showTipus ? [
          formatDatumWithDay(t.datum),
          t.kategoria,
          t.megnevezes,
          t.tipus || '',
          amtStr
        ] : [
          formatDatumWithDay(t.datum),
          t.kategoria,
          t.megnevezes,
          amtStr
        ];
      });

      const tsvContent = [headerRow, ...bodyRows].map(r => r.join('\t')).join('\n');
      
      let badgeHtml = '';
      if (totalAmount > 0) {
        badgeHtml = `<span style="color: #b45309; font-weight: bold;">Botond tartozik</span>`;
      } else if (totalAmount < 0) {
        badgeHtml = `<span style="color: #1d4ed8; font-weight: bold;">Partner tartozik</span>`;
      } else {
        badgeHtml = `<span style="color: #15803d; font-weight: bold;">Kiegyenlítve</span>`;
      }

      const colSpanNum = showTipus ? 4 : 3;

      const htmlContent = `
        <table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Dátum</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Rendezvény</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Megnevezés</th>
              ${showTipus ? `<th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Típus</th>` : ''}
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Összeg ${showFtSuffix ? '(Ft)' : ''}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map((t, idx) => `
              <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 1 ? '#fcfcfd' : '#ffffff'};">
                <td style="padding: 12px 14px; font-size: 13px; color: #374151; border: 1px solid #e5e7eb;">${formatDatumWithDay(t.datum)}</td>
                <td style="padding: 12px 14px; font-size: 13px; font-weight: bold; color: #111827; border: 1px solid #e5e7eb;">${t.kategoria}</td>
                <td style="padding: 12px 14px; font-size: 13px; color: #374151; border: 1px solid #e5e7eb;">${formatDescriptionForHTML(t.megnevezes)}</td>
                ${showTipus ? `<td style="padding: 12px 14px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb;">${t.tipus || ''}</td>` : ''}
                <td style="padding: 12px 14px; font-size: 13px; font-family: monospace; text-align: right; font-weight: 600; color: ${t.osszeg < 0 ? '#059669' : '#111827'}; border: 1px solid #e5e7eb;">
                  ${t.osszeg === 0 ? '<span style="color: #9ca3af;">-</span>' : (formatOsszeg(t.osszeg) + (showFtSuffix ? ' <span style="color: #9ca3af; font-size: 11px;">Ft</span>' : ''))}
                </td>
              </tr>
            `).join('')}
          </tbody>
          ${showSummary ? `
            <tfoot>
              <tr style="background-color: #f9fafb; border-top: 2px solid #e5e7eb;">
                <td colspan="${colSpanNum}" style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Összesen:</td>
                <td style="padding: 14px 16px; font-size: 18px; font-family: monospace; text-align: right; font-weight: 900; color: #111827; border: 1px solid #e5e7eb;">
                  ${formatOsszeg(totalAmount)}${showFtSuffix ? ' Ft' : ''}
                </td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td colspan="${colSpanNum}" style="padding: 10px 16px; text-align: right; font-size: 13px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Állapot:</td>
                <td style="padding: 10px 16px; text-align: right; border: 1px solid #e5e7eb;">
                  ${badgeHtml}
                </td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
      `;

      const textBlob = new Blob([tsvContent], { type: 'text/plain' });
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        });
        await navigator.clipboard.write([item]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        await navigator.clipboard.writeText(tsvContent);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Másolás sikertelen:', err);
      alert('Sikertelen másolás. Kérjük válassza ki a táblázatot manuálisan.');
    }
  };

  // Export current list to CSV file
  const handleExportCSV = () => {
    const header = showTipus 
      ? ['Dátum', 'Rendezvény', 'Megnevezés', 'Típus', showFtSuffix ? 'Összeg (Ft)' : 'Összeg']
      : ['Dátum', 'Rendezvény', 'Megnevezés', showFtSuffix ? 'Összeg (Ft)' : 'Összeg'];
    const delimiter = ';';
    const csvRows = [
      header.join(delimiter),
      ...transactions.map(t => {
        return (showTipus ? [
          t.datum,
          t.kategoria,
          t.megnevezes,
          t.tipus || '',
          t.osszeg
        ] : [
          t.datum,
          t.kategoria,
          t.megnevezes,
          t.osszeg
        ]).join(delimiter);
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add new single row
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newCategory || !newDescription || !newAmount) {
      alert('Kérjük töltsön ki minden mezőt a hozzáadáshoz!');
      return;
    }

    const parsedAmt = parseNumber(newAmount);
    const newTx: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      datum: newDate,
      kategoria: newCategory,
      megnevezes: newDescription,
      tipus: newTipus,
      osszeg: parsedAmt
    };

    setTransactions(prev => [newTx, ...prev]);
    
    // Clear inputs with default helpers
    setNewCategory('');
    setNewDescription('');
    setNewTipus('');
    setNewAmount('');
    setShowAddForm(false);
  };

  // Start inline editing
  const startEdit = (t: Transaction) => {
    setEditingRowId(t.id);
    setEditDate(t.datum);
    setEditCategory(t.kategoria);
    setEditDescription(t.megnevezes);
    setEditTipus(t.tipus || '');
    setEditAmount(t.osszeg.toString());
  };

  // Save inline edits
  const saveEdit = (id: string) => {
    if (!editDate || !editCategory || !editDescription || !editAmount) {
      alert('A mezők nem lehetnek üresek!');
      return;
    }
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          datum: editDate,
          kategoria: editCategory,
          megnevezes: editDescription,
          tipus: editTipus,
          osszeg: parseNumber(editAmount)
        };
      }
      return t;
    }));
    setEditingRowId(null);
  };

  // Delete single row
  const deleteRow = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div 
      className="min-h-screen bg-[#f9fafb] p-0 md:py-8 flex flex-col justify-start"
      id="main-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File Dropping overlay indication */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 z-50 pointer-events-none flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm mx-auto">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-bounce" />
            <h3 className="font-semibold text-lg text-gray-800">Dobjon ide egy CSV fájlt!</h3>
            <p className="text-sm text-gray-500 mt-1">Az adatsor azonnal beolvasásra és kijelzésre kerül.</p>
          </div>
        </div>
      )}

      {/* Main app box matching "Sleek Interface viewport" */}
      <div className="viewport print-full flex flex-col flex-1 w-full max-w-5xl mx-auto bg-white border-x border-gray-200 md:rounded-xl md:shadow-md overflow-hidden relative" id="app-viewport">
        
        {/* Header Block */}
        <header className="header no-print border-b border-gray-200 bg-white px-6 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="app-header">
          <div className="header-title">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              Tranzakció Kezelő
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Adatforrás: <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded italic">{fileName}</span>
            </p>
          </div>
          
          <div className="actions flex flex-wrap gap-2.5 w-full sm:w-auto">
            <button 
              id="copy-to-clipboard-btn"
              onClick={copyToClipboard}
              className="btn flex-1 sm:flex-initial text-sm cursor-pointer border border-gray-300 rounded-lg bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium inline-flex items-center justify-center transition-all shadow-2xs hover:border-gray-400"
              title="Formázott másolás Excel / Word / Email beillesztéshez"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 mr-2" />
                  <span className="text-emerald-700">Kimásolva!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500 mr-2" />
                  Másolás táblázatként
                </>
              )}
            </button>
            
            <button 
              id="print-table-btn"
              onClick={handlePrint}
              className="btn-primary flex-1 sm:flex-initial text-sm cursor-pointer bg-blue-600 border border-blue-600 rounded-lg px-4 py-2 text-white font-medium inline-flex items-center justify-center transition-all shadow-2xs hover:bg-blue-700 hover:border-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Nyomtatás / PDF
            </button>
          </div>
        </header>

        {/* Action Toolbar section */}
        <div className="no-print bg-gray-50 px-6 md:px-8 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Leftside action to read / upload file */}
          <div className="flex items-center gap-2">
            {/* Hidden upload field */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden" 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center text-xs bg-white text-gray-700 hover:text-blue-600 border border-gray-300 rounded-lg px-3.5 py-2 hover:bg-blue-50 transition-colors cursor-pointer font-medium shadow-2xs"
              title="CSV Fájl kiválasztása beolvasáshoz"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              CSV Fájl Beolvasása
            </button>
          </div>

          {/* Rightside controls (Add, Reset, Clear) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`inline-flex items-center text-xs rounded-lg px-3.5 py-2 font-semibold transition-colors cursor-pointer shadow-2xs ${
                showAddForm 
                  ? 'bg-amber-100 text-amber-850 border border-amber-300 hover:bg-amber-200' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Mégse
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Új sor rögzítése
                </>
              )}
            </button>

            <button
              onClick={handleClearAll}
              className="inline-flex items-center text-xs bg-red-50 text-red-650 hover:text-red-800 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-100 transition-colors cursor-pointer shadow-2xs font-medium"
              title="Összes sor törlése a táblázatból"
            >
              <Trash className="w-3.5 h-3.5 mr-1.5" />
              Táblázat ürítése
            </button>
          </div>
        </div>

        {/* Add Transaction expandable form */}
        {showAddForm && (
          <form 
            onSubmit={handleAddTransaction}
            className="no-print bg-indigo-50/50 p-5 md:p-6 border-b border-indigo-100/80 animate-fadeIn"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-900 mb-3.5 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Új tranzakció rögzítése
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dátum</label>
                <input 
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="YYYY.MM.DD"
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm font-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rendezvény</label>
                <input 
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="pl. Konferencia / Megbeszélés"
                  list="existing-categories"
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                  required
                />
                <datalist id="existing-categories">
                  {Array.from(new Set(transactions.map(t => t.kategoria))).filter(Boolean).map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Megnevezés</label>
                <input 
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="pl. Napi melegebéd fizetés"
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Típus</label>
                <input 
                  type="text"
                  value={newTipus}
                  onChange={(e) => setNewTipus(e.target.value)}
                  placeholder="pl. Költség vagy Bevétel"
                  list="existing-types"
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <datalist id="existing-types">
                  {Array.from(new Set(transactions.map(t => t.tipus))).filter(Boolean).map(tp => (
                    <option key={tp} value={tp} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Összeg (Ft) <span className="text-[10px] text-gray-400 font-normal">(Negatív a partner)</span></label>
                <input 
                  type="text"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="pl. 4200 vagy -12000"
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Hozzáadás
              </button>
            </div>
          </form>
        )}

        {/* Main Data Container */}
        <main className="table-container flex-1 bg-white" id="main-content">
          {filteredTransactions.length === 0 ? (
            <div className="py-20 text-center px-4 max-w-sm mx-auto">
              <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3.5" />
              <h3 className="font-semibold text-gray-700">Nincs megjeleníthető tranzakció</h3>
              <p className="text-xs text-gray-500 mt-1">
                A táblázat jelenleg teljesen üres. Töltsön be egy CSV fájlt vagy rögzítsen új sorokat!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Dátum</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Rendezvény</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Megnevezés</th>
                    {showTipus && <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Típus</th>}
                    <th className="text-right font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Összeg {showFtSuffix ? '(Ft)' : ''}</th>
                    <th className="no-print text-center font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4 w-24">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx, idx) => {
                    const isEditing = editingRowId === tx.id;
                    return (
                      <tr key={tx.id} className={idx % 2 === 1 ? 'bg-[#fcfcfd]' : 'bg-white'}>
                        {isEditing ? (
                          <>
                            {/* Datum editing */}
                            <td className="px-4 py-2 text-sm">
                              <input 
                                type="text"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                              />
                            </td>
                            {/* Category editing */}
                            <td className="px-4 py-2 text-sm">
                              <input 
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                              />
                            </td>
                            {/* Description editing */}
                            <td className="px-4 py-2 text-sm">
                              <input 
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                              />
                            </td>
                            {/* Tipus editing */}
                            {showTipus && (
                              <td className="px-4 py-2 text-sm">
                                <input 
                                  type="text"
                                  value={editTipus}
                                  onChange={(e) => setEditTipus(e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                                />
                              </td>
                            )}
                            {/* Amount editing */}
                            <td className="px-4 py-2 text-sm">
                              <input 
                                type="text"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-right font-mono font-medium"
                              />
                            </td>
                            {/* Inline Edit actions */}
                            <td className="px-4 py-2 text-center flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => saveEdit(tx.id)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                title="Mentés"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="p-1 rounded text-gray-500 hover:bg-gray-100 cursor-pointer"
                                title="Mégse"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Standard output rows */}
                            <td className="px-6 py-3.5 text-sm text-gray-700 whitespace-nowrap">{formatDatumWithDay(tx.datum)}</td>
                            <td className="px-6 py-3.5 text-sm text-gray-700">
                              <span className="bg-gray-100 text-gray-700 rounded-md px-2.5 py-1 text-xs font-semibold">
                                {tx.kategoria}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-sm text-gray-800 font-medium">
                              {renderDescriptionWithBrackets(tx.megnevezes)}
                            </td>
                            {showTipus && (
                              <td className="px-6 py-3.5 text-sm text-gray-600 font-normal">
                                {tx.tipus ? (
                                  <span className="bg-neutral-100 text-neutral-700 rounded-md px-2 py-0.5 text-xs font-medium">
                                    {tx.tipus}
                                  </span>
                                ) : (
                                  <span className="text-gray-350 select-none font-light">-</span>
                                )}
                              </td>
                            )}
                            <td className={`px-6 py-3.5 text-sm amount-cell text-right ${tx.osszeg < 0 ? 'neg font-bold' : 'text-gray-900 font-bold'} font-mono`}>
                              {tx.osszeg === 0 ? (
                                <span className="text-gray-300 font-normal select-none">-</span>
                              ) : (
                                <>
                                  {formatOsszeg(tx.osszeg)} {showFtSuffix && <span className="text-gray-400 font-normal text-xs ml-0.5">Ft</span>}
                                </>
                              )}
                            </td>
                            {/* Row specific delete and edit btn */}
                            <td className="no-print px-6 py-3.5 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => startEdit(tx)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Sor szerkesztése"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteRow(tx.id)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Sor törlése"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Custom Printing Header Section (only visible on print medium) */}
        <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-4">
          <div className="flex justify-between items-baseline">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tranzakció Kezelő Jelentés</h1>
              <p className="text-xs text-gray-500 mt-1">Forrásfájl: {fileName}</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              Készült: {new Date().toLocaleDateString('hu-HU')}
            </div>
          </div>
        </div>

        {/* Summary Footer bar matching sample */}
        <footer className={`summary-section ${showSummary ? 'border-t border-gray-200' : ''} bg-[#f9fafb] px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4`} id="app-footer">
          
          {/* Toggle show/hide of totals & settings */}
          <div className="no-print flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-3 select-none w-full sm:w-auto">
            {/* Toggle show/hide of totals */}
            <div className="summary-toggle flex items-center gap-3">
              <button
                type="button"
                id="summary-toggle-btn"
                onClick={() => setShowSummary(!showSummary)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{ backgroundColor: showSummary ? '#2563eb' : '#d1d5db' }}
                role="switch"
                aria-checked={showSummary}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                  style={{ transform: showSummary ? 'translateX(16px)' : 'translateX(0px)' }}
                />
              </button>
              <span className="text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => setShowSummary(!showSummary)}>
                Összesítés megjelenítése
              </span>
            </div>

            {/* Toggle Típus column */}
            <div className="tipus-toggle flex items-center gap-3">
              <button
                type="button"
                id="tipus-toggle-btn"
                onClick={() => setShowTipus(!showTipus)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{ backgroundColor: showTipus ? '#2563eb' : '#d1d5db' }}
                role="switch"
                aria-checked={showTipus}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                  style={{ transform: showTipus ? 'translateX(16px)' : 'translateX(0px)' }}
                />
              </button>
              <span className="text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => setShowTipus(!showTipus)}>
                Típus oszlop megjelenítése
              </span>
            </div>

            {/* Toggle Ft suffix */}
            <div className="ft-toggle flex items-center gap-3">
              <button
                type="button"
                id="ft-toggle-btn"
                onClick={() => setShowFtSuffix(!showFtSuffix)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{ backgroundColor: showFtSuffix ? '#2563eb' : '#d1d5db' }}
                role="switch"
                aria-checked={showFtSuffix}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                  style={{ transform: showFtSuffix ? 'translateX(16px)' : 'translateX(0px)' }}
                />
              </button>
              <span className="text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => setShowFtSuffix(!showFtSuffix)}>
                "Ft" egység kijelzése
              </span>
            </div>
          </div>

          {/* Sum value and corresponding badges */}
          {showSummary && (
            <div className="flex items-center flex-wrap gap-5 justify-end w-full sm:w-auto" id="totals-container">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2">Összesen:</span>
                <span className="text-2xl font-black font-mono text-gray-950">
                  {formatOsszeg(totalAmount)}
                  {showFtSuffix && <span className="text-sm font-bold text-gray-500 ml-1">Ft</span>}
                </span>
              </div>
              
              <div>
                {totalAmount > 0 ? (
                  <span className="badge bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold" id="badge-debt-botond">
                    Botond tartozik
                  </span>
                ) : totalAmount < 0 ? (
                  <span className="badge bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-bold" id="badge-debt-partner">
                    Partner tartozik
                  </span>
                ) : (
                  <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold" id="badge-debt-settled">
                    Kiegyenlítve
                  </span>
                )}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
