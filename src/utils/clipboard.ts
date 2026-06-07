import { Transaction } from '../types';
import { 
  formatOsszeg, 
  formatDatumWithDay, 
  formatDescriptionForHTML, 
  formatTipusForHTML 
} from './format';

interface ClipboardOptions {
  showTipus: boolean;
  showFtSuffix: boolean;
  separateMunkadij: boolean;
  showSummary: boolean;
  transactions: Transaction[];
  mainTransactions: Transaction[];
  munkadijTransactions: Transaction[];
  totalAmount: number;
  mainTotalAmount: number;
  munkadijTotalAmount: number;
}

export function buildClipboardContent(options: ClipboardOptions) {
  const {
    showTipus,
    showFtSuffix,
    separateMunkadij,
    showSummary,
    transactions,
    mainTransactions,
    munkadijTransactions,
    totalAmount,
    mainTotalAmount,
    munkadijTotalAmount,
  } = options;

  // Build header row conditionally
  const headerRow = showTipus 
    ? ['Dátum', 'Rendezvény', 'Megnevezés', 'Típus', showFtSuffix ? 'Összeg (Ft)' : 'Összeg']
    : ['Dátum', 'Rendezvény', 'Megnevezés', showFtSuffix ? 'Összeg (Ft)' : 'Összeg'];

  const formatRow = (t: Transaction) => {
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
  };

  let tsvContent = '';
  if (separateMunkadij && munkadijTransactions.length > 0) {
    const tsvRows = [headerRow.join('\t')];
    mainTransactions.forEach(t => tsvRows.push(formatRow(t).join('\t')));
    tsvRows.push('');
    munkadijTransactions.forEach(t => tsvRows.push(formatRow(t).join('\t')));
    tsvContent = tsvRows.join('\n');
  } else {
    const tsvRows = [headerRow.join('\t'), ...transactions.map(t => formatRow(t).join('\t'))];
    tsvContent = tsvRows.join('\n');
  }
  
  let badgeHtml = '';
  if (totalAmount > 0) {
    badgeHtml = `<span style="color: #b45309; font-weight: bold;">Botond tartozik</span>`;
  } else if (totalAmount < 0) {
    badgeHtml = `<span style="color: #1d4ed8; font-weight: bold;">Partner tartozik</span>`;
  } else {
    badgeHtml = `<span style="color: #15803d; font-weight: bold;">Kiegyenlítve</span>`;
  }

  const colSpanNum = showTipus ? 4 : 3;
  const colSpanTotal = showTipus ? 5 : 4;

  const renderRowsHTML = (list: Transaction[]) => {
    return list.map((t, idx) => {
      const isLastRow = idx === list.length - 1;
      const hasDateChange = !isLastRow && (t.datum.trim() !== list[idx + 1].datum.trim());
      const borderBottomStyle = hasDateChange ? 'border-bottom: 1.5px solid #bfdbfe;' : 'border-bottom: 1px solid #e5e7eb;';
      return `
      <tr style="background-color: ${idx % 2 === 1 ? '#fcfcfd' : '#ffffff'};">
        <td style="padding: 12px 14px; font-size: 13px; color: #374151; border: 1px solid #e5e7eb; ${borderBottomStyle}">${formatDatumWithDay(t.datum)}</td>
        <td style="padding: 12px 14px; font-size: 13px; font-weight: bold; color: #111827; border: 1px solid #e5e7eb; ${borderBottomStyle}">${t.kategoria}</td>
        <td style="padding: 12px 14px; font-size: 13px; color: #374151; border: 1px solid #e5e7eb; ${borderBottomStyle}">${formatDescriptionForHTML(t.megnevezes)}</td>
        ${showTipus ? `<td style="padding: 12px 14px; font-size: 13px; border: 1px solid #e5e7eb; ${borderBottomStyle}">${formatTipusForHTML(t.tipus, t.osszeg)}</td>` : ''}
        <td style="padding: 12px 14px; font-size: 13px; font-family: monospace; text-align: right; font-weight: 600; color: ${t.osszeg < 0 ? '#059669' : '#111827'}; border: 1px solid #e5e7eb; white-space: nowrap; ${borderBottomStyle}">
          ${t.osszeg === 0 ? '<span style="color: #9ca3af;">-</span>' : (formatOsszeg(t.osszeg) + (showFtSuffix ? ' <span style="color: #9ca3af; font-size: 11px;">Ft</span>' : ''))}
        </td>
      </tr>
    `;}).join('');
  };

  let tbodyHtml = '';
  if (separateMunkadij && munkadijTransactions.length > 0) {
    tbodyHtml = `
      ${renderRowsHTML(mainTransactions)}
      <tr style="background-color: #f9fafb;">
        <td colspan="${colSpanTotal}" style="padding: 0; height: 12px; border-top: 4px double #9ca3af; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: none;"></td>
      </tr>
      ${renderRowsHTML(munkadijTransactions)}
    `;
  } else {
    tbodyHtml = renderRowsHTML(transactions);
  }

  let tfootHtml = '';
  if (showSummary) {
    if (separateMunkadij && munkadijTransactions.length > 0) {
      tfootHtml = `
        <tfoot>
          <tr style="background-color: #f9fafb; border-top: 2px solid #e5e7eb;">
            <td colspan="${colSpanNum}" style="padding: 10px 16px; text-align: right; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; white-space: nowrap;">Egyéb tételek összesen:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-family: monospace; text-align: right; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; white-space: nowrap;">
              ${formatOsszeg(mainTotalAmount)}${showFtSuffix ? ' Ft' : ''}
            </td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td colspan="${colSpanNum}" style="padding: 10px 16px; text-align: right; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; white-space: nowrap;">Munkadíj összesen:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-family: monospace; text-align: right; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; white-space: nowrap;">
              ${formatOsszeg(munkadijTotalAmount)}${showFtSuffix ? ' Ft' : ''}
            </td>
          </tr>
          <tr style="background-color: #f9fafb; border-top: 1.5px solid #d1d5db;">
            <td colspan="${colSpanNum}" style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: bold; color: #111827; border: 1px solid #e5e7eb; white-space: nowrap;">Mindösszesen:</td>
            <td style="padding: 14px 16px; font-size: 18px; font-family: monospace; text-align: right; font-weight: 900; color: #111827; border: 1px solid #e5e7eb; white-space: nowrap;">
              ${formatOsszeg(totalAmount)}${showFtSuffix ? ' Ft' : ''}
            </td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td colspan="${colSpanNum}" style="padding: 10px 16px; text-align: right; font-size: 13px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb; white-space: nowrap;">Állapot:</td>
            <td style="padding: 10px 16px; text-align: right; border: 1px solid #e5e7eb; white-space: nowrap;">
              ${badgeHtml}
            </td>
          </tr>
        </tfoot>
      `;
    } else {
      tfootHtml = `
        <tfoot>
          <tr style="background-color: #f9fafb; border-top: 2px solid #e5e7eb;">
            <td colspan="${colSpanNum}" style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb; white-space: nowrap;">Összesen:</td>
            <td style="padding: 14px 16px; font-size: 18px; font-family: monospace; text-align: right; font-weight: 900; color: #111827; border: 1px solid #e5e7eb; white-space: nowrap;">
              ${formatOsszeg(totalAmount)}${showFtSuffix ? ' Ft' : ''}
            </td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td colspan="${colSpanNum}" style="padding: 10px 16px; text-align: right; font-size: 13px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb; white-space: nowrap;">Állapot:</td>
            <td style="padding: 10px 16px; text-align: right; border: 1px solid #e5e7eb; white-space: nowrap;">
              ${badgeHtml}
            </td>
          </tr>
        </tfoot>
      `;
    }
  }

  const htmlContent = `
    <table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Dátum</th>
          <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Rendezvény</th>
          <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Megnevezés</th>
          ${showTipus ? `<th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb;">Típus</th>` : ''}
          <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border: 1px solid #e5e7eb; white-space: nowrap;">Összeg ${showFtSuffix ? '(Ft)' : ''}</th>
        </tr>
      </thead>
      <tbody>
        ${tbodyHtml}
      </tbody>
      ${tfootHtml}
    </table>
  `;

  return { tsvContent, htmlContent };
}
