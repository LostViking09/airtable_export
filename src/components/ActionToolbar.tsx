import React, { useRef } from 'react';
import { Upload, X, Plus, Trash } from 'lucide-react';

interface ActionToolbarProps {
  onFileSelected: (file: File) => void;
  showAddForm: boolean;
  onToggleAddForm: () => void;
  onClearAll: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onFileSelected,
  showAddForm,
  onToggleAddForm,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="no-print bg-gray-50 px-6 md:px-8 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Leftside action to read / upload file */}
      <div className="flex items-center gap-2">
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
          onClick={onToggleAddForm}
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
          onClick={onClearAll}
          className="inline-flex items-center text-xs bg-red-50 text-red-650 hover:text-red-800 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-100 transition-colors cursor-pointer shadow-2xs font-medium"
          title="Összes sor törlése a táblázatból"
        >
          <Trash className="w-3.5 h-3.5 mr-1.5" />
          Táblázat ürítése
        </button>
      </div>
    </div>
  );
};
