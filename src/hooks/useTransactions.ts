import { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { parseCSV } from '../utils/csv';
import { parseNumber, getTypeSummaries } from '../utils/format';
import { decompressShareState } from '../utils/share';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fileName, setFileName] = useState<string>('Nincs betöltött fájl');
  
  const isSharedUrl = typeof window !== 'undefined' && window.location.hash.startsWith('#share=');

  // Settings/UI states
  const [showSummary, setShowSummary] = useState(() => {
    if (isSharedUrl) return true;
    const stored = localStorage.getItem('view_showSummary');
    return stored !== null ? stored === 'true' : true;
  });
  const [userToggledSummary, setUserToggledSummary] = useState(() => {
    if (isSharedUrl) return true;
    const stored = localStorage.getItem('view_userToggledSummary');
    return stored !== null ? stored === 'true' : false;
  });
  const [showTipus, setShowTipus] = useState(() => {
    if (isSharedUrl) return true;
    const stored = localStorage.getItem('view_showTipus');
    return stored !== null ? stored === 'true' : true;
  });
  const [showFtSuffix, setShowFtSuffix] = useState(() => {
    if (isSharedUrl) return true;
    const stored = localStorage.getItem('view_showFtSuffix');
    return stored !== null ? stored === 'true' : true;
  });
  const [separateMunkadij, setSeparateMunkadij] = useState(() => {
    if (isSharedUrl) return true;
    const stored = localStorage.getItem('view_separateMunkadij');
    return stored !== null ? stored === 'true' : true;
  });
  const [correction, setCorrection] = useState<number>(0);

  // Shared view states
  const [isShared, setIsShared] = useState(false);
  const [shareOptions, setShareOptions] = useState<{
    editMode: 'none' | 'all' | 'empty';
    defaultSajátAmount: number | null;
    defaultKülsősAmount: number | null;
  }>({ editMode: 'none', defaultSajátAmount: null, defaultKülsősAmount: null });
  const [originalEmptyIds, setOriginalEmptyIds] = useState<Set<string>>(new Set());
  const [originalAmounts, setOriginalAmounts] = useState<Record<string, number>>({});
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  // Save Settings/UI states to localStorage if NOT a shared URL
  useEffect(() => {
    if (!isShared && !window.location.hash.startsWith('#share=')) {
      localStorage.setItem('view_showSummary', String(showSummary));
    }
  }, [showSummary, isShared]);

  useEffect(() => {
    if (!isShared && !window.location.hash.startsWith('#share=')) {
      localStorage.setItem('view_userToggledSummary', String(userToggledSummary));
    }
  }, [userToggledSummary, isShared]);

  useEffect(() => {
    if (!isShared && !window.location.hash.startsWith('#share=')) {
      localStorage.setItem('view_showTipus', String(showTipus));
    }
  }, [showTipus, isShared]);

  useEffect(() => {
    if (!isShared && !window.location.hash.startsWith('#share=')) {
      localStorage.setItem('view_showFtSuffix', String(showFtSuffix));
    }
  }, [showFtSuffix, isShared]);

  useEffect(() => {
    if (!isShared && !window.location.hash.startsWith('#share=')) {
      localStorage.setItem('view_separateMunkadij', String(separateMunkadij));
    }
  }, [separateMunkadij, isShared]);

  // Load shared state from hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      const shareData = hash.slice(7);
      if (shareData) {
        setIsLoadingShared(true);
        decompressShareState(shareData).then(decoded => {
          if (decoded) {
            setTransactions(decoded.transactions);
            setFileName('Megosztott táblázat');
            setShowSummary(decoded.settings.showSummary);
            setShowTipus(decoded.settings.showTipus);
            setSeparateMunkadij(decoded.settings.separateMunkadij);
            setShowFtSuffix(decoded.settings.showFtSuffix);
            setCorrection(decoded.correction);
            
            // Prevent auto-summary override
            setUserToggledSummary(true);
            
            setIsShared(true);
            setShareOptions(decoded.options);
            
            // Track empty IDs and meglévő amounts at load time
            const emptyIds = new Set<string>();
            const amounts: Record<string, number> = {};
            decoded.transactions.forEach(t => {
              amounts[t.id] = t.osszeg;
              if (t.osszeg === 0) {
                emptyIds.add(t.id);
              }
            });
            setOriginalEmptyIds(emptyIds);
            setOriginalAmounts(amounts);
          }
          setIsLoadingShared(false);
        }).catch(err => {
          console.error('Failed to load shared state:', err);
          setIsLoadingShared(false);
        });
      }
    }
  }, []);

  // Automatically control summary visibility based on empty/zero amounts unless user manually toggled it
  useEffect(() => {
    if (!userToggledSummary && transactions.length > 0) {
      const hasZeroAmount = transactions.some(t => t.osszeg === 0);
      setShowSummary(!hasZeroAmount);
    }
  }, [transactions, userToggledSummary]);

  // Derived states
  const filteredTransactions = transactions;

  const mainTransactions = useMemo(() => {
    if (!separateMunkadij) return filteredTransactions;
    return filteredTransactions.filter(t => t.tipus?.trim().toLowerCase() !== 'továbbhárított munkadíj');
  }, [filteredTransactions, separateMunkadij]);

  const munkadijTransactions = useMemo(() => {
    if (!separateMunkadij) return [];
    return filteredTransactions.filter(t => t.tipus?.trim().toLowerCase() === 'továbbhárított munkadíj');
  }, [filteredTransactions, separateMunkadij]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.osszeg, 0) + correction;
  }, [filteredTransactions, correction]);

  const mainTotalAmount = useMemo(() => {
    return mainTransactions.reduce((acc, t) => acc + t.osszeg, 0);
  }, [mainTransactions]);

  const munkadijTotalAmount = useMemo(() => {
    return munkadijTransactions.reduce((acc, t) => acc + t.osszeg, 0);
  }, [munkadijTransactions]);

  const typeSummaries = useMemo(() => {
    return getTypeSummaries(filteredTransactions);
  }, [filteredTransactions]);

  // CRUD actions
  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      ...newTx
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const updateTransaction = (id: string, updatedFields: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedFields
        };
      }
      return t;
    }));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearAllTransactions = () => {
    setTransactions([]);
    setFileName('Üres táblázat');
  };

  const processFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
            setTransactions(parsed);
            setFileName(file.name);
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });
  };

  return {
    transactions,
    fileName,
    showSummary,
    setShowSummary,
    userToggledSummary,
    setUserToggledSummary,
    showTipus,
    setShowTipus,
    showFtSuffix,
    setShowFtSuffix,
    separateMunkadij,
    setSeparateMunkadij,
    correction,
    setCorrection,
    
    // Derived
    filteredTransactions,
    mainTransactions,
    munkadijTransactions,
    totalAmount,
    mainTotalAmount,
    munkadijTotalAmount,
    typeSummaries,

    // Shared state
    isShared,
    shareOptions,
    originalEmptyIds,
    originalAmounts,
    isLoadingShared,

    // Actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    processFile
  };
}
export type UseTransactionsReturn = ReturnType<typeof useTransactions>;
