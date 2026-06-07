import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useTransactions } from './hooks/useTransactions';
import { buildClipboardContent } from './utils/clipboard';
import { Header } from './components/Header';
import { ActionToolbar } from './components/ActionToolbar';
import { AddTransactionForm } from './components/AddTransactionForm';
import { TransactionTable } from './components/TransactionTable';
import { SummaryFooter } from './components/SummaryFooter';

export default function App() {
  const {
    transactions,
    fileName,
    showSummary,
    setShowSummary,
    setUserToggledSummary,
    showTipus,
    setShowTipus,
    showFtSuffix,
    setShowFtSuffix,
    separateMunkadij,
    setSeparateMunkadij,
    filteredTransactions,
    mainTransactions,
    munkadijTransactions,
    totalAmount,
    mainTotalAmount,
    munkadijTotalAmount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    processFile,
  } = useTransactions();

  const [copySuccess, setCopySuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

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

  return (
    <div 
      className="min-h-screen bg-[#f9fafb] p-0 md:py-8 flex flex-col justify-start"
      id="main-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File Dropping overlay indication */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 z-50 pointer-events-none flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm mx-auto">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-bounce" />
            <h3 className="font-semibold text-lg text-gray-800">Dobjon ide egy CSV fájlt!</h3>
            <p className="text-sm text-gray-500 mt-1">Az adatsor azonnal beolvasásra és kijelzésre kerül.</p>
          </div>
        </div>
      )}

      {/* Main app box matching "Sleek Interface viewport" */}
      <div className="viewport print-full flex flex-col flex-1 w-full max-w-5xl mx-auto bg-white border-x border-gray-200 md:rounded-xl md:shadow-md overflow-hidden relative" id="app-viewport">
        
        {/* Header Block */}
        <Header 
          fileName={fileName}
          copySuccess={copySuccess}
          onCopy={copyToClipboard}
          onPrint={handlePrint}
        />

        {/* Action Toolbar section */}
        <ActionToolbar 
          onFileSelected={handleFileSelected}
          showAddForm={showAddForm}
          onToggleAddForm={() => setShowAddForm(!showAddForm)}
          onClearAll={handleClearAll}
        />

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
            onSaveEdit={(id, updatedFields) => {
              updateTransaction(id, updatedFields);
              setEditingRowId(null);
            }}
            onCancelEdit={() => setEditingRowId(null)}
            onDelete={deleteTransaction}
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
          hasMunkadij={munkadijTransactions.length > 0}
          mainTotalAmount={mainTotalAmount}
          munkadijTotalAmount={munkadijTotalAmount}
          totalAmount={totalAmount}
        />

        {/* Custom Printing Footer Section (only visible on print medium) */}
        <div className="hidden print:block text-right text-xs text-gray-400 mt-4 pt-2 border-t border-gray-200">
          Készült: {new Date().toLocaleDateString('hu-HU')}
        </div>
      </div>
    </div>
  );
}
