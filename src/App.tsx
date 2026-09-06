// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Lock, KeyRound, ShieldCheck, Key } from 'lucide-react';
import { useTransactions } from './hooks/useTransactions';
import { buildClipboardContent } from './utils/clipboard';
import { Header } from './components/Header';
import { ActionToolbar } from './components/ActionToolbar';
import { AddTransactionForm } from './components/AddTransactionForm';
import { TransactionTable } from './components/TransactionTable';
import { SummaryFooter } from './components/SummaryFooter';
import { ShareModal } from './components/ShareModal';
import { KeyGeneratorModal } from './components/KeyGeneratorModal';

export default function App() {
  const {
    transactions,
    fileName,
    customTitle,
    setCustomTitle,
    showSummary,
    setShowSummary,
    setUserToggledSummary,
    showTipus,
    setShowTipus,
    showFtSuffix,
    setShowFtSuffix,
    separateMunkadij,
    setSeparateMunkadij,
    correction,
    setCorrection,
    filteredTransactions,
    mainTransactions,
    munkadijTransactions,
    totalAmount,
    mainTotalAmount,
    munkadijTotalAmount,
    typeSummaries,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    processFile,
    isShared,
    shareOptions,
    originalEmptyIds,
    originalAmounts,
    isLoadingShared,
    isPasswordRequired,
    unlockSharedData,
  } = useTransactions();

  // Sync document title with customTitle
  useEffect(() => {
    document.title = customTitle.trim() ? customTitle : 'Airtable Export';
  }, [customTitle]);

  const [copySuccess, setCopySuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Specific #keygen URL hash detection
  const [isKeyGenMode, setIsKeyGenMode] = useState(() => {
    return typeof window !== 'undefined' && (window.location.hash === '#keygen' || window.location.hash === '#kulcs');
  });
  const [isKeyGenModalOpen, setIsKeyGenModalOpen] = useState(() => {
    return typeof window !== 'undefined' && (window.location.hash === '#keygen' || window.location.hash === '#kulcs');
  });

  useEffect(() => {
    const handleHashChange = () => {
      const isKey = window.location.hash === '#keygen' || window.location.hash === '#kulcs';
      setIsKeyGenMode(isKey);
      if (isKey) {
        setIsKeyGenModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      const success = await processFile(file);
      if (success) {
        setShowAddForm(false);
      } else {
        alert('Nem sikerült értékelhető adatokat kiolvasni a CSV fájlból. Ellenőrizze a formátumot.');
      }
    }
  };

  const handleFileSelected = async (file: File) => {
    const success = await processFile(file);
    if (success) {
      setShowAddForm(false);
    } else {
      alert('Nem sikerült értékelhető adatokat kiolvasni a CSV fájlból. Ellenőrizze a formátumot.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Biztosan ki szeretné üríteni a teljes táblázatot?')) {
      clearAllTransactions();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    setPasswordError(false);
    const success = await unlockSharedData(passwordInput);
    setIsUnlocking(false);
    if (!success) {
      setPasswordError(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      const { tsvContent, htmlContent } = buildClipboardContent({
        showTipus,
        showFtSuffix,
        separateMunkadij,
        showSummary,
        transactions,
        mainTransactions,
        munkadijTransactions,
        totalAmount,
        mainTotalAmount,
        munkadijTotalAmount,
      });

      const textBlob = new Blob([tsvContent], { type: 'text/plain' });
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        });
        await navigator.clipboard.write([item]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        await navigator.clipboard.writeText(tsvContent);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Másolás sikertelen:', err);
      alert('Sikertelen másolás. Kérjük válassza ki a táblázatot manuálisan.');
    }
  };

  // If URL is explicitly #keygen, handle standalone mode
  if (isKeyGenMode) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
        {isKeyGenModalOpen ? (
          <KeyGeneratorModal 
            isOpen={true}
            onClose={() => {
              setIsKeyGenModalOpen(false);
            }}
          />
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-5">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">A kulcsgenerálás kész</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              A kapott publikus kulcsot küldje el a megosztó félnek. Amint megkapja a titkosított linket, a beállított jelszavával tudja majd megnyitni.
            </p>
            <div className="flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setIsKeyGenModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4" />
                Kulcs újragenerálása
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isPasswordRequired) {
    const isAsymmetric = typeof window !== 'undefined' && window.location.hash.startsWith('#share=e2_');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 flex flex-col items-center">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Jelszóval Védett Adatok</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            {isAsymmetric
              ? 'Ezt a táblázatot az Ön egyedi fogadó kulcsával titkosították. A megtekintéshez adja meg a kulcsához tartozó jelszavát.'
              : 'Ennek a megosztott linknek a tartalma AES-GCM titkosítással van védve. A tartalom megtekintéséhez adja meg a jelszót.'}
          </p>
          <form onSubmit={handleUnlock} className="w-full">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full pl-10 pr-3 py-2 border rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Titkosítási jelszó"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 font-medium">Helytelen jelszó vagy sérült adatok.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isUnlocking || !passwordInput}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Visszafejtés...
                </>
              ) : (
                'Visszafejtés'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#f9fafb] p-0 md:py-8 flex flex-col justify-start print:block"
      id="main-container"
      onDragOver={isShared ? undefined : handleDragOver}
      onDragLeave={isShared ? undefined : handleDragLeave}
      onDrop={isShared ? undefined : handleDrop}
    >
      {/* Loading overlay for shared view load */}
      {isLoadingShared && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-700">Megosztott táblázat betöltése...</p>
        </div>
      )}

      {/* File Dropping overlay indication */}
      {!isShared && isDragging && (
        <div className="fixed inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 z-50 pointer-events-none flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm mx-auto">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-bounce" />
            <h3 className="font-semibold text-lg text-gray-800">Dobjon ide egy CSV fájlt!</h3>
            <p className="text-sm text-gray-500 mt-1">Az adatsor azonnal beolvasásra és kijelzésre kerül.</p>
          </div>
        </div>
      )}

      {/* Main app box matching "Sleek Interface viewport" */}
      <div className="viewport print-full flex flex-col flex-1 w-full max-w-5xl mx-auto bg-white border-x border-gray-200 md:rounded-xl md:shadow-md overflow-hidden print:overflow-visible relative print:block" id="app-viewport">
        
        {/* Header Block */}
        <Header 
          fileName={fileName}
          copySuccess={copySuccess}
          onCopy={copyToClipboard}
          onPrint={handlePrint}
          isShared={isShared}
          onShare={() => setIsShareModalOpen(true)}
          customTitle={customTitle}
          onTitleChange={setCustomTitle}
        />

        {/* Action Toolbar section */}
        {!isShared && (
          <ActionToolbar 
            onFileSelected={handleFileSelected}
            showAddForm={showAddForm}
            onToggleAddForm={() => setShowAddForm(!showAddForm)}
            onClearAll={handleClearAll}
          />
        )}

        {/* Add Transaction expandable form */}
        {showAddForm && (
          <AddTransactionForm 
            transactions={transactions}
            onAdd={(newTx) => {
              addTransaction(newTx);
              setShowAddForm(false);
            }}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Print-only custom title */}
        {customTitle.trim() && (
          <div className="hidden print:block text-2xl font-bold text-gray-900 mb-4 px-6 md:px-8 print:px-0">
            {customTitle}
          </div>
        )}

        {/* Main Data Container */}
        <main className="table-container flex-1 bg-white" id="main-content">
          <TransactionTable 
            filteredTransactions={filteredTransactions}
            mainTransactions={mainTransactions}
            munkadijTransactions={munkadijTransactions}
            separateMunkadij={separateMunkadij}
            showTipus={showTipus}
            showFtSuffix={showFtSuffix}
            editingRowId={editingRowId}
            onStartEdit={(id) => setEditingRowId(id)}
            onSaveEdit={(id, updatedFields, dir) => {
              updateTransaction(id, updatedFields);
              
              if (dir) {
                const renderedList = separateMunkadij && munkadijTransactions.length > 0
                  ? [...mainTransactions, ...munkadijTransactions]
                  : filteredTransactions;
                  
                const index = renderedList.findIndex(t => t.id === id);
                if (index !== -1) {
                  const step = dir === 'next' ? 1 : -1;
                  let newIndex = index;
                  let found = false;
                  
                  const isRowEditable = (tx: typeof renderedList[0]) => {
                    if (!isShared) return true;
                    if (!shareOptions) return false;
                    if (shareOptions.editMode === 'none') return false;
                    if (shareOptions.editMode === 'all') return true;
                    if (shareOptions.editMode === 'empty') {
                      return originalEmptyIds ? originalEmptyIds.has(tx.id) : tx.osszeg === 0;
                    }
                    return false;
                  };
                  
                  while (true) {
                    newIndex += step;
                    if (newIndex < 0 || newIndex >= renderedList.length) {
                      break;
                    }
                    const candidate = renderedList[newIndex];
                    if (isRowEditable(candidate)) {
                      setEditingRowId(candidate.id);
                      found = true;
                      break;
                    }
                  }
                  
                  if (!found) {
                    setEditingRowId(null);
                  }
                } else {
                  setEditingRowId(null);
                }
              } else {
                setEditingRowId(null);
              }
            }}
            onCancelEdit={() => setEditingRowId(null)}
            onDelete={deleteTransaction}
            isShared={isShared}
            shareOptions={shareOptions}
            originalEmptyIds={originalEmptyIds}
            originalAmounts={originalAmounts}
          />

        </main>

        {/* Summary Footer bar matching sample */}
        <SummaryFooter 
          showSummary={showSummary}
          onToggleSummary={() => {
            setShowSummary(!showSummary);
            setUserToggledSummary(true);
          }}
          showTipus={showTipus}
          onToggleTipus={() => setShowTipus(!showTipus)}
          separateMunkadij={separateMunkadij}
          onToggleSeparateMunkadij={() => setSeparateMunkadij(!separateMunkadij)}
          showFtSuffix={showFtSuffix}
          onToggleFtSuffix={() => setShowFtSuffix(!showFtSuffix)}
          typeSummaries={typeSummaries}
          totalAmount={totalAmount}
          correction={correction}
          onCorrectionChange={setCorrection}
        />

        {/* Custom Printing Footer Section (only visible on print medium) */}
        <div className="hidden print:block text-right text-xs text-gray-400 mt-4 pt-2 border-t border-gray-200">
          Készült: {new Date().toLocaleDateString('hu-HU')}
        </div>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        transactions={transactions}
        settings={{
          showSummary,
          showTipus,
          separateMunkadij,
          showFtSuffix,
        }}
        correction={correction}
        customTitle={customTitle}
      />
    </div>
  );
}
