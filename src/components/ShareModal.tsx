import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Settings, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { compressShareState } from '../utils/share';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  settings: {
    showSummary: boolean;
    showTipus: boolean;
    separateMunkadij: boolean;
    showFtSuffix: boolean;
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
}) => {
  const [editMode, setEditMode] = useState<'none' | 'all' | 'empty'>('empty');
  const [useDefaultAmount, setUseDefaultAmount] = useState(true);
  const [defaultAmount, setDefaultAmount] = useState<number>(50000);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);
    compressShareState(transactions, settings, {
      editMode,
      defaultAmount: useDefaultAmount ? defaultAmount : null,
    })
      .then((compressed) => {
        const baseUrl = window.location.origin + window.location.pathname;
        setShareUrl(`${baseUrl}#share=${compressed}`);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Hiba a megosztási URL generálása során:', err);
        setIsGenerating(false);
      });
  }, [isOpen, transactions, settings, editMode, useDefaultAmount, defaultAmount]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Másolás sikertelen:', err);
      alert('Nem sikerült vágólapra másolni a linket. Jelölje ki és másolja manuálisan.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5" />
            <h2 className="text-lg font-bold tracking-tight">Táblázat megosztása</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Info notification */}
          <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              A megosztott linken keresztül elérhető nézet teljesen biztonságos: az adatok csak az URL-ben tárolódnak, így nem kerülnek külső adatbázisba.
            </p>
          </div>

          {/* View settings indicator */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Jelenlegi nézet beállítások (megőrizve)</h3>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 grid grid-cols-2 gap-2 text-xs font-medium text-gray-650">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${settings.showSummary ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span>Összesítés: {settings.showSummary ? 'Igen' : 'Nem'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${settings.showTipus ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span>Típus oszlop: {settings.showTipus ? 'Igen' : 'Nem'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${settings.separateMunkadij ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span>Munkadíj külön: {settings.separateMunkadij ? 'Igen' : 'Nem'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${settings.showFtSuffix ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span>Ft egység: {settings.showFtSuffix ? 'Igen' : 'Nem'}</span>
              </div>
            </div>
          </div>

          {/* Editmode selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Összegek szerkeszthetősége</h3>
            <div className="space-y-2.5">
              <label className={`flex items-start gap-3 border rounded-xl p-3.5 cursor-pointer transition-all ${
                editMode === 'none' 
                  ? 'border-blue-500 bg-blue-50/20' 
                  : 'border-gray-250 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="editMode" 
                  value="none"
                  checked={editMode === 'none'}
                  onChange={() => setEditMode('none')}
                  className="mt-0.5" 
                />
                <div>
                  <div className="text-sm font-semibold text-gray-800">Nem szerkeszthető</div>
                  <p className="text-xs text-gray-500 mt-0.5">A megosztott táblázat teljesen írásvédett, csak megtekintésre alkalmas.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 border rounded-xl p-3.5 cursor-pointer transition-all ${
                editMode === 'all' 
                  ? 'border-blue-500 bg-blue-50/20' 
                  : 'border-gray-250 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="editMode" 
                  value="all"
                  checked={editMode === 'all'}
                  onChange={() => setEditMode('all')}
                  className="mt-0.5" 
                />
                <div>
                  <div className="text-sm font-semibold text-gray-800">Minden összeg szerkeszthető</div>
                  <p className="text-xs text-gray-500 mt-0.5">A felhasználó bármelyik sor összeg cellájára kattintva átírhatja az összeget.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 border rounded-xl p-3.5 cursor-pointer transition-all ${
                editMode === 'empty' 
                  ? 'border-blue-500 bg-blue-50/20' 
                  : 'border-gray-250 hover:bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  name="editMode" 
                  value="empty"
                  checked={editMode === 'empty'}
                  onChange={() => setEditMode('empty')}
                  className="mt-0.5" 
                />
                <div>
                  <div className="text-sm font-semibold text-gray-800">Csak a megosztáskor üres összegek szerkeszthetők</div>
                  <p className="text-xs text-gray-500 mt-0.5">Csak a jelenleg üres (0) összegek lesznek módosíthatók. A már megadott összegek zároltak.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Default amount setup */}
          {editMode !== 'none' && (
            <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={useDefaultAmount}
                  onChange={(e) => setUseDefaultAmount(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-xs font-semibold text-gray-750">
                  Alapértelmezett összeg felkínálása üres mező szerkesztésekor
                </span>
              </label>
              
              {useDefaultAmount && (
                <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-150 pl-6">
                  <div className="relative w-36 shrink-0">
                    <input 
                      type="number"
                      value={defaultAmount || ''}
                      onChange={(e) => setDefaultAmount(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold font-mono text-right pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold select-none">Ft</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Szerkesztéskor ez az érték jelenik meg előre beírva, így elegendő egy Entert ütni a mentéshez.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer (Copy link block) */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-450">Megosztási link</h4>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={isGenerating ? 'Generálás...' : shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 select-all focus:outline-none"
            />
            
            <button 
              onClick={handleCopy}
              disabled={isGenerating || !shareUrl}
              className={`inline-flex items-center text-xs font-bold rounded-lg px-4 py-2 border transition-all cursor-pointer shadow-2xs shrink-0 select-none ${
                copySuccess 
                  ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 animate-in zoom-in duration-100" />
                  Másolva!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Másolás
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
