import React, { useState, useEffect } from 'react';
import { Check, X, Edit3, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { 
  formatDatumWithDay, 
  formatOsszeg, 
  getTipusBadgeClasses, 
  parseNumber 
} from '../utils/format';

interface TransactionRowProps {
  tx: Transaction;
  idx: number;
  listOffset: number;
  hasDateChange: boolean;
  showTipus: boolean;
  showFtSuffix: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (updatedFields: Omit<Transaction, 'id'>) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  tx,
  idx,
  listOffset,
  hasDateChange,
  showTipus,
  showFtSuffix,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  // Local edit states
  const [editDate, setEditDate] = useState(tx.datum);
  const [editCategory, setEditCategory] = useState(tx.kategoria);
  const [editDescription, setEditDescription] = useState(tx.megnevezes);
  const [editTipus, setEditTipus] = useState(tx.tipus || '');
  const [editAmount, setEditAmount] = useState(tx.osszeg.toString());

  // Reset local states when edit starts or tx changes
  useEffect(() => {
    if (isEditing) {
      setEditDate(tx.datum);
      setEditCategory(tx.kategoria);
      setEditDescription(tx.megnevezes);
      setEditTipus(tx.tipus || '');
      setEditAmount(tx.osszeg.toString());
    }
  }, [isEditing, tx]);

  const handleSave = () => {
    if (!editDate || !editCategory || !editDescription || !editAmount) {
      alert('A mezők nem lehetnek üresek!');
      return;
    }
    onSaveEdit({
      datum: editDate,
      kategoria: editCategory,
      megnevezes: editDescription,
      tipus: editTipus,
      osszeg: parseNumber(editAmount),
    });
  };

  const renderDescriptionWithBrackets = (desc: string) => {
    if (!desc) return '';
    const parts = desc.split(/(\[[^\]]+\])/);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const innerText = part.slice(1, -1);
            return (
              <span 
                key={index} 
                className="bg-gray-100 text-gray-800 border border-gray-200 rounded-md px-1.5 py-0.5 text-xs font-semibold inline-block mx-0.5"
              >
                [{innerText}]
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <tr className={`${(idx + listOffset) % 2 === 1 ? 'bg-[#fcfcfd]' : 'bg-white'} ${hasDateChange ? 'date-separator' : ''}`}>
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
              onClick={handleSave}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              title="Mentés"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEdit}
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
                <span className={getTipusBadgeClasses(tx.tipus, tx.osszeg)}>
                  {tx.tipus}
                </span>
              ) : (
                <span className="text-gray-350 select-none font-light">-</span>
              )}
            </td>
          )}
          <td className={`px-6 py-3.5 text-sm amount-cell text-right ${tx.osszeg < 0 ? 'neg font-bold' : 'text-gray-900 font-bold'} font-mono whitespace-nowrap`}>
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
                onClick={onStartEdit}
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Sor szerkesztése"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
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
};
