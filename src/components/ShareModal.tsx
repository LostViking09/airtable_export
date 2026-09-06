// src/components/ShareModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, AlertCircle, Shield, Key, Lock, Unlock, Link, Bookmark, Trash2, UserCheck, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { compressShareState, EncryptionConfig } from '../utils/share';
import { parseNumber, handleAmountInputChange } from '../utils/format';
import { parsePublicKey } from '../utils/x25519';

export interface SavedRecipient {
  id: string;
  name: string;
  publicKey: string;
  createdAt: number;
}

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
  correction: number;
  customTitle: string;
}

const STORAGE_KEY_SAVED_RECIPIENTS = 'airtable_saved_recipients_v1';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
  correction,
  customTitle,
}) => {
  const [editMode, setEditMode] = useState<'none' | 'all' | 'empty'>(() => {
    return (localStorage.getItem('share_editMode') as 'none' | 'all' | 'empty') || 'empty';
  });
  const [useDefaultAmount, setUseDefaultAmount] = useState<boolean>(() => {
    const stored = localStorage.getItem('share_useDefaultAmount');
    return stored !== null ? stored === 'true' : true;
  });
  const [defaultSajátAmount, setDefaultSajátAmount] = useState<string>(() => {
    return localStorage.getItem('share_defaultSajátAmount') || '50 000';
  });
  const [defaultKülsősAmount, setDefaultKülsősAmount] = useState<string>(() => {
    return localStorage.getItem('share_defaultKülsősAmount') || '35 000';
  });

  const [cryptoType, setCryptoType] = useState<'none' | 'password' | 'pubkey'>('none');
  const [password, setPassword] = useState('');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');

  // Saved recipients (persisted in localStorage)
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_RECIPIENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newRecipientName, setNewRecipientName] = useState('');
  const [isSavingRecipient, setIsSavingRecipient] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');

  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [keygenCopied, setKeygenCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('share_editMode', editMode);
  }, [editMode]);

  useEffect(() => {
    localStorage.setItem('share_useDefaultAmount', String(useDefaultAmount));
  }, [useDefaultAmount]);

  useEffect(() => {
    localStorage.setItem('share_defaultSajátAmount', defaultSajátAmount);
  }, [defaultSajátAmount]);

  useEffect(() => {
    localStorage.setItem('share_defaultKülsősAmount', defaultKülsősAmount);
  }, [defaultKülsősAmount]);

  const saveRecipientsList = (list: SavedRecipient[]) => {
    setSavedRecipients(list);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_RECIPIENTS, JSON.stringify(list));
    } catch (e) {
      console.error('Nem sikerült elmenteni a címzetteket a localStorage-be:', e);
    }
  };

  const handleSaveCurrentKey = () => {
    const cleanKey = recipientPublicKey.trim();
    const cleanName = newRecipientName.trim();
    if (!cleanKey || !cleanName) return;

    if (!parsePublicKey(cleanKey)) {
      alert('Érvénytelen publikus kulcs formátum! Nem menthető.');
      return;
    }

    const newRecipient: SavedRecipient = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: cleanName,
      publicKey: cleanKey,
      createdAt: Date.now()
    };

    const updated = [newRecipient, ...savedRecipients.filter(r => r.publicKey !== cleanKey)];
    saveRecipientsList(updated);
    setSelectedRecipientId(newRecipient.id);
    setNewRecipientName('');
    setIsSavingRecipient(false);
  };

  const handleDeleteRecipient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRecipients.filter(r => r.id !== id);
    saveRecipientsList(updated);
    if (selectedRecipientId === id) {
      setSelectedRecipientId('');
    }
  };

  const handleSelectRecipient = (id: string) => {
    setSelectedRecipientId(id);
    const found = savedRecipients.find(r => r.id === id);
    if (found) {
      setRecipientPublicKey(found.publicKey);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);

    let encryptionConfig: EncryptionConfig | undefined = undefined;

    if (cryptoType === 'password') {
      if (!password.trim()) {
        setShareUrl('');
        setErrorMsg('Kérjük, adjon meg egy jelszót a titkosításhoz!');
        return;
      }
      encryptionConfig = {
        type: 'password',
        password: password.trim()
      };
    } else if (cryptoType === 'pubkey') {
      const cleanKey = recipientPublicKey.trim();
      if (!cleanKey) {
        setShareUrl('');
        setErrorMsg('Kérjük, válasszon vagy másoljon be egy címzett publikus kulcsot (pub_...)!');
        return;
      }
      const parsed = parsePublicKey(cleanKey);
      if (!parsed) {
        setShareUrl('');
        setErrorMsg('Érvénytelen publikus kulcs formátum! A kulcsnak pub_ kezdetűnek kell lennie.');
        return;
      }
      encryptionConfig = {
        type: 'pubkey',
        recipientPublicKey: cleanKey
      };
    }

    setIsGenerating(true);
    compressShareState(
      transactions,
      settings,
      {
        editMode,
        defaultSajátAmount: useDefaultAmount ? parseNumber(defaultSajátAmount) : null,
        defaultKülsősAmount: useDefaultAmount ? parseNumber(defaultKülsősAmount) : null,
      },
      correction,
      customTitle,
      encryptionConfig
    )
      .then((compressed) => {
        const baseUrl = window.location.origin + window.location.pathname;
        setShareUrl(`${baseUrl}#share=${compressed}`);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Hiba a megosztási URL generálása során:', err);
        setErrorMsg('Hiba történt a link generálásakor.');
        setIsGenerating(false);
      });
  }, [
    isOpen,
    transactions,
    settings,
    editMode,
    useDefaultAmount,
    defaultSajátAmount,
    defaultKülsősAmount,
    correction,
    customTitle,
    cryptoType,
    password,
    recipientPublicKey
  ]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Másolás sikertelen:', err);
      alert('Nem sikerült vágólapra másolni a linket. Jelölje ki és másolja manuálisan.');
    }
  };

  const handleCopyKeygenLink = async () => {
    try {
      const keygenUrl = `${window.location.origin}${window.location.pathname}#keygen`;
      await navigator.clipboard.writeText(keygenUrl);
      setKeygenCopied(true);
      setTimeout(() => setKeygenCopied(false), 2000);
    } catch (err) {
      console.error('Kulcskérő link másolása sikertelen:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between text-white shrink-0">
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
        <div className="p-6 flex-1 overflow-y-auto min-h-0 space-y-6">
          
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
                <span>Külsős munkadíj külön: {settings.separateMunkadij ? 'Igen' : 'Nem'}</span>
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
                <div className="space-y-3 pl-6 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-gray-650">Saját munkadíj:</span>
                    <div className="relative w-36 shrink-0">
                      <input 
                        type="text"
                        value={defaultSajátAmount}
                        onChange={(e) => handleAmountInputChange(e.target.value, e.target.selectionStart || 0, setDefaultSajátAmount, e.target)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold font-mono text-right pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold select-none">Ft</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-gray-650">Külsős munkadíj:</span>
                    <div className="relative w-36 shrink-0">
                      <input 
                        type="text"
                        value={defaultKülsősAmount}
                        onChange={(e) => handleAmountInputChange(e.target.value, e.target.selectionStart || 0, setDefaultKülsősAmount, e.target)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold font-mono text-right pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold select-none">Ft</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Szerkesztéskor a sor típusának megfelelő érték jelenik meg előre beírva, így elegendő egy Entert ütni a mentéshez.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Encryption Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              Titkosítás és biztonság
            </h3>

            {/* Encryption Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCryptoType('none')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cryptoType === 'none'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Unlock className="w-3.5 h-3.5 text-gray-400" />
                <span>Nincs</span>
              </button>

              <button
                type="button"
                onClick={() => setCryptoType('password')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cryptoType === 'password'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-blue-500" />
                <span>Közös jelszó</span>
              </button>

              <button
                type="button"
                onClick={() => setCryptoType('pubkey')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cryptoType === 'pubkey'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                <span>Címzett kulcsa</span>
              </button>
            </div>

            {/* Password mode details */}
            {cryptoType === 'password' && (
              <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-4 space-y-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-gray-750">
                  Megosztási jelszó megadása
                </label>
                <input 
                  type="text"
                  placeholder="Írjon be egy jelszót..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  A linket AES-GCM titkosítással látjuk el. A jelszót külön el kell küldenie a fogadó félnek.
                </p>
              </div>
            )}

            {/* Recipient public key details */}
            {cryptoType === 'pubkey' && (
              <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150">
                
                {/* Saved recipients selector */}
                {savedRecipients.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Mentett címzettek ({savedRecipients.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {savedRecipients.map((rec) => {
                        const isSelected = selectedRecipientId === rec.id || recipientPublicKey === rec.publicKey;
                        return (
                          <div 
                            key={rec.id}
                            onClick={() => handleSelectRecipient(rec.id)}
                            className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span className="truncate max-w-[140px]">{rec.name}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRecipient(rec.id, e)}
                              className={`p-0.5 rounded hover:bg-black/10 transition-colors ${
                                isSelected ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-rose-600'
                              }`}
                              title="Címzett törlése a mentett listából"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Public key input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-750">
                      Címzett publikus kulcsa (Public Key)
                    </label>
                    {recipientPublicKey.trim() && !isSavingRecipient && (
                      <button
                        type="button"
                        onClick={() => setIsSavingRecipient(true)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Bookmark className="w-3 h-3" />
                        Kulcs mentése névvel
                      </button>
                    )}
                  </div>

                  <input 
                    type="text"
                    placeholder="Illessze be a címzett kulcsát (pl. pub_...)"
                    value={recipientPublicKey}
                    onChange={(e) => {
                      setRecipientPublicKey(e.target.value);
                      setSelectedRecipientId('');
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Save key form */}
                {isSavingRecipient && (
                  <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-750">Címzett elmentése a névjegyzékbe</span>
                      <button 
                        type="button" 
                        onClick={() => setIsSavingRecipient(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Név / Megnevezés (pl. Kovács János - Könyvelés)"
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCurrentKey}
                        disabled={!newRecipientName.trim()}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                      >
                        Mentés
                      </button>
                    </div>
                  </div>
                )}

                {/* Keygen link helper for the sender to send to recipient */}
                <div className="bg-white border border-emerald-100 rounded-lg p-3 space-y-2">
                  <div className="text-[11px] font-semibold text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-emerald-600" />
                      Nincs még kulcsa a címzettnek?
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKeygenLink}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {keygenCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Link másolva!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Kulcskérő link másolása
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Küldje el a címzettnek a kulcskérő linket (<code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">#keygen</code>), ahol ő megadja a saját jelszavát és visszaküldi a kapott kulcsot.
                  </p>
                </div>

                <p className="text-xs text-gray-650">
                  <strong>Zero-Knowledge védelem:</strong> A címzett saját jelszót választ a gépén. Ön a címzett jelszavát soha nem látja, mégis csak ő tudja feloldani a linket a saját jelszavával.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer (Copy link block) */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 space-y-2.5 shrink-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-450">Megosztási link</h4>
          
          {errorMsg ? (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{errorMsg}</span>
            </div>
          ) : (
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
          )}
        </div>

      </div>
    </div>
  );
};
