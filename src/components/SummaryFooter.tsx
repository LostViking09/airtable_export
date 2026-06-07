import React from 'react';
import { formatOsszeg } from '../utils/format';

interface SummaryFooterProps {
  showSummary: boolean;
  onToggleSummary: () => void;
  showTipus: boolean;
  onToggleTipus: () => void;
  separateMunkadij: boolean;
  onToggleSeparateMunkadij: () => void;
  showFtSuffix: boolean;
  onToggleFtSuffix: () => void;
  hasMunkadij: boolean;
  mainTotalAmount: number;
  munkadijTotalAmount: number;
  totalAmount: number;
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
  hasMunkadij,
  mainTotalAmount,
  munkadijTotalAmount,
  totalAmount,
}) => {
  return (
    <footer className={`summary-section ${showSummary ? 'border-t border-gray-200' : ''} bg-[#f9fafb] px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4`} id="app-footer">
      
      {/* Toggle show/hide of totals & settings */}
      <div className="no-print flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-3 select-none w-full sm:w-auto">
        {/* Toggle show/hide of totals */}
        <div className="summary-toggle flex items-center gap-3">
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
          <span 
            className="text-xs font-semibold text-gray-600 cursor-pointer" 
            onClick={onToggleSummary}
          >
            Összesítés megjelenítése
          </span>
        </div>

        {/* Toggle Típus column */}
        <div className="tipus-toggle flex items-center gap-3">
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
          <span 
            className="text-xs font-semibold text-gray-600 cursor-pointer" 
            onClick={onToggleTipus}
          >
            Típus oszlop megjelenítése
          </span>
        </div>

        {/* Toggle separate Munkadíj */}
        <div className="munkadij-toggle flex items-center gap-3">
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
          <span 
            className="text-xs font-semibold text-gray-600 cursor-pointer" 
            onClick={onToggleSeparateMunkadij}
          >
            Munkadíj külön csoportosítása
          </span>
        </div>

        {/* Toggle Ft suffix */}
        <div className="ft-toggle flex items-center gap-3">
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
          <span 
            className="text-xs font-semibold text-gray-600 cursor-pointer" 
            onClick={onToggleFtSuffix}
          >
            "Ft" egység kijelzése
          </span>
        </div>
      </div>

      {/* Sum value and corresponding badges */}
      {showSummary && (
        <div className="flex flex-col sm:flex-row items-center flex-wrap gap-x-6 gap-y-3 justify-end w-full sm:w-auto text-right" id="totals-container">
          {separateMunkadij && hasMunkadij ? (
            <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium w-full sm:w-auto border-r-0 sm:border-r border-gray-200 pr-0 sm:pr-6 mr-0 sm:mr-1">
              <div className="flex justify-between sm:justify-end gap-4 whitespace-nowrap">
                <span>Egyéb tételek:</span>
                <span className="font-semibold font-mono text-gray-900">
                  {formatOsszeg(mainTotalAmount)}
                  {showFtSuffix && <span className="text-[10px] text-gray-400 font-normal ml-0.5">Ft</span>}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 whitespace-nowrap">
                <span>Munkadíj:</span>
                <span className="font-semibold font-mono text-gray-900">
                  {formatOsszeg(munkadijTotalAmount)}
                  {showFtSuffix && <span className="text-[10px] text-gray-400 font-normal ml-0.5">Ft</span>}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
            <div className="whitespace-nowrap">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2">
                {separateMunkadij && hasMunkadij ? 'Mindösszesen:' : 'Összesen:'}
              </span>
              <span className="text-2xl font-black font-mono text-gray-950">
                {formatOsszeg(totalAmount)}
                {showFtSuffix && <span className="text-sm font-bold text-gray-500 ml-1">Ft</span>}
              </span>
            </div>
            
            <div className="whitespace-nowrap">
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
        </div>
      )}
    </footer>
  );
};
