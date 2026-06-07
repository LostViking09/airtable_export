import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Transaction } from '../types';
import { TransactionRow } from './TransactionRow';

interface TransactionTableProps {
  filteredTransactions: Transaction[];
  mainTransactions: Transaction[];
  munkadijTransactions: Transaction[];
  separateMunkadij: boolean;
  showTipus: boolean;
  showFtSuffix: boolean;
  editingRowId: string | null;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, updatedFields: Omit<Transaction, 'id'>) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  filteredTransactions,
  mainTransactions,
  munkadijTransactions,
  separateMunkadij,
  showTipus,
  showFtSuffix,
  editingRowId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  const renderRows = (list: Transaction[], listOffset = 0) => {
    return list.map((tx, idx) => {
      const isLastRow = idx === list.length - 1;
      const hasDateChange = !isLastRow && (tx.datum.trim() !== list[idx + 1].datum.trim());
      
      return (
        <TransactionRow
          key={tx.id}
          tx={tx}
          idx={idx}
          listOffset={listOffset}
          hasDateChange={hasDateChange}
          showTipus={showTipus}
          showFtSuffix={showFtSuffix}
          isEditing={editingRowId === tx.id}
          onStartEdit={() => onStartEdit(tx.id)}
          onSaveEdit={(updatedFields) => onSaveEdit(tx.id, updatedFields)}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(tx.id)}
        />
      );
    });
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="py-20 text-center px-4 max-w-sm mx-auto">
        <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3.5" />
        <h3 className="font-semibold text-gray-700">Nincs megjeleníthető tranzakció</h3>
        <p className="text-xs text-gray-500 mt-1">
          A táblázat jelenleg teljesen üres. Töltsön be egy CSV fájlt vagy rögzítsen új sorokat!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-100">
            <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Dátum</th>
            <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Rendezvény</th>
            <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Megnevezés</th>
            {showTipus && <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4">Típus</th>}
            <th className="text-right font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4 whitespace-nowrap amount-header">Összeg {showFtSuffix ? '(Ft)' : ''}</th>
            <th className="no-print text-center font-semibold text-[11px] uppercase tracking-wider text-gray-500 px-6 py-4 w-24">Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {separateMunkadij && munkadijTransactions.length > 0 ? (
            <>
              {renderRows(mainTransactions)}
              <tr className="bg-gray-50/50 print:bg-white no-print-height">
                <td 
                  colSpan={showTipus ? 6 : 5} 
                  className="p-0 h-3 border-t-4 border-double border-gray-300 print:border-gray-500"
                ></td>
              </tr>
              {renderRows(munkadijTransactions, mainTransactions.length)}
            </>
          ) : (
            renderRows(filteredTransactions)
          )}
        </tbody>
      </table>
    </div>
  );
};
