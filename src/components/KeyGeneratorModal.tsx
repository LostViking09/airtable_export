// src/components/KeyGeneratorModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Key, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { derivePublicKeyFromPassword } from '../utils/crypto';

interface KeyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyGeneratorModal: React.FC<KeyGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [isDeriving, setIsDeriving] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMatching = password.length > 0 && password === confirmPassword;
  const hasMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (!isMatching || !password.trim()) {
      setPublicKey('');
      return;
    }

    let isMounted = true;
    setIsDeriving(true);

    const timer = setTimeout(async () => {
      try {
        const pk = await derivePublicKeyFromPassword(password.trim());
        if (isMounted) {
          setPublicKey(pk);
          setIsDeriving(false);
        }
      } catch (err) {
        console.error('Hiba a kulcs származtatásakor:', err);
        if (isMounted) {
          setIsDeriving(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [password, confirmPassword, isMatching]);

  const handleCopy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Másolás sikertelen:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5" />
            <h2 className="text-lg font-bold tracking-tight">Saját fogadó kulcs generálása</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto min-h-0 space-y-5">
          
          <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <p>
              Válassz egy saját jelszót! A rendszer ebből legenerál egy nyilvános kulcsot (Public Key), amit átadhatsz a táblázat küldőjének. 
              <strong> A küldő soha nem látja a jelszavadat</strong>, de csak ezzel a jelszóval tudod majd feloldani a kapott linket.
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                1. Titkos jelszó megadása
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer flex items-center gap-1 select-none"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Elrejtés' : 'Megjelenítés'}</span>
              </button>
            </div>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Írd be a választott jelszót..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              2. Jelszó megerősítése (ellenőrzés)
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Írd be a jelszót újra..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  hasMismatch 
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400' 
                    : isMatching 
                    ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
              {isMatching && (
                <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              )}
            </div>

            {hasMismatch && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                A két beírt jelszó nem egyezik meg!
              </p>
            )}
            {password.length > 0 && confirmPassword.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Kérjük, gépeld be újra a jelszót az elírások elkerülése végett.
              </p>
            )}
          </div>

          {/* Generated Public Key Box */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Generált publikus kulcsod (Ezt küldd el a feladónak)
            </label>
            
            {isMatching && publicKey ? (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs text-gray-800 break-all bg-white border border-emerald-200 rounded-lg p-2.5 flex-1 select-all font-semibold">
                    {isDeriving ? 'Kulcs számítása...' : publicKey}
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={isDeriving || !publicKey}
                    className={`inline-flex items-center text-xs font-bold rounded-lg px-3.5 py-2.5 border transition-all cursor-pointer shadow-2xs shrink-0 select-none ${
                      copied
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {copied ? (
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
                <p className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  A kulcs készen áll! Másold ki, és küldd el a megosztónak.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-250 rounded-xl p-5 text-center text-xs text-gray-400">
                {hasMismatch
                  ? 'A kulcs generálásához javítsd a jelszó megerősítést.'
                  : 'Írd be a kívánt jelszót mindkét mezőbe a publikus kulcsod kiszámításához.'}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 bg-gray-150 rounded-lg transition-colors cursor-pointer"
          >
            Bezárás
          </button>
        </div>

      </div>
    </div>
  );
};
