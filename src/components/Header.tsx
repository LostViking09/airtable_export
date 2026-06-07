import React from 'react';
import { FileSpreadsheet, Check, Copy, Printer, Share2 } from 'lucide-react';

interface HeaderProps {
  fileName: string;
  copySuccess: boolean;
  onCopy: () => void;
  onPrint: () => void;
  isShared?: boolean;
  onShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  copySuccess,
  onCopy,
  onPrint,
  isShared = false,
  onShare,
}) => {
  return (
    <header className="header no-print border-b border-gray-200 bg-white px-6 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="app-header">
      <div className="header-title">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          Airtable Export
          {isShared && (
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider select-none">
              Megosztott nézet
            </span>
          )}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Adatforrás: <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded italic">{fileName}</span>
        </p>
      </div>
      
      <div className="actions flex flex-wrap gap-2.5 w-full sm:w-auto">
        {!isShared && (
          <button 
            id="share-table-btn"
            onClick={onShare}
            className="btn flex-1 sm:flex-initial text-sm cursor-pointer border border-gray-300 rounded-lg bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium inline-flex items-center justify-center transition-all shadow-2xs hover:border-blue-400 hover:text-blue-600"
            title="Megosztási link generálása a jelenlegi táblázathoz és beállításokhoz"
          >
            <Share2 className="w-4 h-4 text-blue-600 mr-2" />
            Megosztás
          </button>
        )}

        <button 
          id="copy-to-clipboard-btn"
          onClick={onCopy}
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
          onClick={onPrint}
          className="btn-primary flex-1 sm:flex-initial text-sm cursor-pointer bg-blue-600 border border-blue-600 rounded-lg px-4 py-2 text-white font-medium inline-flex items-center justify-center transition-all shadow-2xs hover:bg-blue-700 hover:border-blue-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          Nyomtatás / PDF
        </button>
      </div>
    </header>
  );
};

