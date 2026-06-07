import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { formatOsszeg, TypeSummary, parseNumber, formatInputAmount, handleAmountInputChange } from '../utils/format';

interface SummaryFooterProps {
  showSummary: boolean;
  onToggleSummary: () => void;
  showTipus: boolean;
  onToggleTipus: () => void;
  separateMunkadij: boolean;
  onToggleSeparateMunkadij: () => void;
  showFtSuffix: boolean;
  onToggleFtSuffix: () => void;
  typeSummaries: TypeSummary[];
  totalAmount: number;
  correction: number;
  onCorrectionChange: (val: number) => void;
}

export const SummaryFooter: React.FC<SummaryFooterProps> = ({
  showSummary,
  onToggleSummary,
  showTipus,
  onToggleTipus,
  separateMunkadij,
  onToggleSeparateMunkadij,
  showFtSuffix,
  onToggleFtSuffix,
  typeSummaries,
  totalAmount,
  correction,
  onCorrectionChange,
}) => {
  const [localCorrection, setLocalCorrection] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalCorrection(correction === 0 ? '' : formatInputAmount(correction.toString()));
  }, [correction]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <footer className={`summary-section ${showSummary ? 'border-t border-gray-200' : ''} bg-[#f9fafb] px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4`} id="app-footer">
      
      {/* Settings dropdown trigger */}
      <div className="no-print relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none shadow-2xs ${
            isDropdownOpen 
              ? 'bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-500' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
          title="Nézet beállítások"
        >
          <Settings className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-90 text-blue-600' : 'text-gray-500'}`} />
          <span>Beállítások</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72 flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1.5 mb-0.5">
              Nézet beállítások
            </div>

            {/* Toggle show/hide of totals */}
            <div className="summary-toggle flex items-center justify-between gap-3">
              <span 
                className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none" 
                onClick={onToggleSummary}
              >
                Összesítés megjelenítése
              </span>
              <button
                type="button"
                id="summary-toggle-btn"
                onClick={onToggleSummary}
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
            </div>

            {/* Toggle Típus column */}
            <div className="tipus-toggle flex items-center justify-between gap-3">
              <span 
                className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none" 
                onClick={onToggleTipus}
              >
                Típus oszlop megjelenítése
              </span>
              <button
                type="button"
                id="tipus-toggle-btn"
                onClick={onToggleTipus}
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
            </div>

            {/* Toggle separate Munkadíj */}
            <div className="munkadij-toggle flex items-center justify-between gap-3">
              <span 
                className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none" 
                onClick={onToggleSeparateMunkadij}
              >
                Külsős munkadíj külön
              </span>
              <button
                type="button"
                id="munkadij-toggle-btn"
                onClick={onToggleSeparateMunkadij}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{ backgroundColor: separateMunkadij ? '#2563eb' : '#d1d5db' }}
                role="switch"
                aria-checked={separateMunkadij}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                  style={{ transform: separateMunkadij ? 'translateX(16px)' : 'translateX(0px)' }}
                />
              </button>
            </div>

            {/* Toggle Ft suffix */}
            <div className="ft-toggle flex items-center justify-between gap-3">
              <span 
                className="text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none" 
                onClick={onToggleFtSuffix}
              >
                "Ft" egység kijelzése
              </span>
              <button
                type="button"
                id="ft-toggle-btn"
                onClick={onToggleFtSuffix}
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
            </div>
          </div>
        )}
      </div>

      {/* Sum value and corresponding badges */}
      {showSummary && (
        <div className="flex flex-col sm:flex-row items-center flex-wrap gap-x-6 gap-y-3 justify-end w-full sm:w-auto text-right" id="totals-container">
          {typeSummaries.length > 0 ? (
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[auto_auto] gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 pr-0 sm:pr-6 mr-0 sm:mr-1">
              {typeSummaries.map((summary) => (
                <React.Fragment key={summary.label}>
                  <span className="text-left sm:text-right">{summary.label}:</span>
                  <span className="font-semibold font-mono text-gray-900 text-right">
                    {formatOsszeg(summary.amount)}
                    {showFtSuffix && <span className="text-[10px] text-gray-400 font-normal ml-0.5">Ft</span>}
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : null}
          
          {/* Correction input section */}
          <div className={`flex items-center gap-2 text-xs font-medium text-gray-500 ${correction === 0 ? 'no-print' : ''}`} id="correction-container">
            <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">Korrekció:</span>
            <div className="relative w-28 no-print">
              <input
                type="text"
                value={localCorrection}
                onChange={(e) => {
                  handleAmountInputChange(
                    e.target.value,
                    e.target.selectionStart || 0,
                    (val) => {
                      setLocalCorrection(val);
                      onCorrectionChange(parseNumber(val));
                    },
                    e.target
                  );
                }}
                placeholder="0"
                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold font-mono text-right pr-6 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold select-none">Ft</span>
            </div>
            {correction !== 0 && (
              <span className="hidden print:inline font-semibold font-mono text-gray-900 whitespace-nowrap">
                {correction > 0 ? `+${formatOsszeg(correction)}` : formatOsszeg(correction)}
                {showFtSuffix && <span className="text-[10px] text-gray-400 font-normal ml-0.5">Ft</span>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
            <div className="whitespace-nowrap">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2">
                {typeSummaries.length > 0 ? 'Mindösszesen:' : 'Összesen:'}
              </span>
              <span className="text-2xl font-black font-mono text-gray-950">
                {formatOsszeg(totalAmount)}
                {showFtSuffix && <span className="text-sm font-bold text-gray-500 ml-1">Ft</span>}
              </span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
