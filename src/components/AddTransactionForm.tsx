import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Transaction } from '../types';
import { parseNumber, handleAmountInputChange } from '../utils/format';

interface AddTransactionFormProps {
  transactions: Transaction[];
  onAdd: (tx: {
    datum: string;
    kategoria: string;
    megnevezes: string;
    tipus: string;
    osszeg: number;
  }) => void;
  onClose: () => void;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  transactions,
  onAdd,
  onClose,
}) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newCategory || !newDescription || !newAmount) {
      alert('Kérjük töltsön ki minden mezőt a hozzáadáshoz!');
      return;
    }

    const parsedAmt = parseNumber(newAmount);
    onAdd({
      datum: newDate,
      kategoria: newCategory,
      megnevezes: newDescription,
      tipus: newTipus,
      osszeg: parsedAmt
    });

    // Clear inputs
    setNewCategory('');
    setNewDescription('');
    setNewTipus('');
    setNewAmount('');
  };

  const categories = Array.from(new Set(transactions.map(t => t.kategoria))).filter(Boolean);
  const types = Array.from(new Set(transactions.map(t => t.tipus))).filter(Boolean);

  return (
    <form 
      onSubmit={handleSubmit}
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
            {categories.map(c => (
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
            {types.map(tp => (
              <option key={tp} value={tp} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Összeg (Ft) <span className="text-[10px] text-gray-400 font-normal">(Negatív a partner)</span>
          </label>
          <input 
            type="text"
            value={newAmount}
            onChange={(e) => handleAmountInputChange(e.target.value, e.target.selectionStart || 0, setNewAmount, e.target)}
            placeholder="pl. 4 200 vagy -12 000"
            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm font-mono"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
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
  );
};
