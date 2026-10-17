import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  Check, 
  AlertCircle, 
  Database, 
  Users, 
  ReceiptText, 
  ShieldCheck, 
  Building, 
  RefreshCw, 
  ArrowRight,
  AlertTriangle,
  FileCode,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { DatabaseBackup, ImportDatabaseResult } from '../types/isp';

export const ImportDatabaseModal: React.FC = () => {
  const { 
    isImportDatabaseOpen, 
    closeImportDatabase, 
    importEntireDatabase, 
    settings,
    customers,
    payments,
    operators
  } = useISP();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawJsonText, setRawJsonText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedBackup, setParsedBackup] = useState<DatabaseBackup | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportDatabaseResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isImportDatabaseOpen) return null;

  // Validate and parse raw JSON text
  const inspectAndSetJson = (text: string, fileName?: string) => {
    setParseError(null);
    setImportResult(null);

    if (!text.trim()) {
      setParsedBackup(null);
      return;
    }

    try {
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid JSON format: root element must be a database object.');
      }

      // Check if it's our standard backup or has recognizable tables
      const hasCustomers = Array.isArray(data.customers);
      const hasPayments = Array.isArray(data.payments);
      const hasOperators = Array.isArray(data.operators);
      const hasSettings = data.settings && typeof data.settings === 'object';

      if (!hasCustomers && !hasPayments && !hasOperators && !hasSettings) {
        throw new Error(
          'Unrecognized backup structure. JSON must contain at least one of: "customers", "payments", "operators", or "settings".'
        );
      }

      setParsedBackup(data as DatabaseBackup);
      if (fileName) setSelectedFileName(fileName);
    } catch (err: any) {
      setParsedBackup(null);
      setParseError(err?.message || 'Failed to parse JSON file.');
    }
  };

  // Handle file selection from local device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setRawJsonText(content);
      inspectAndSetJson(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Failed to read the selected file from disk.');
    };
    reader.readAsText(file);
  };

  // Trigger Import
  const handleExecuteImport = () => {
    if (!parsedBackup) return;

    setIsProcessing(true);
    try {
      const result = importEntireDatabase(parsedBackup, importMode);
      setImportResult(result);
    } catch (err: any) {
      setImportResult({
        success: false,
        importedCustomersCount: 0,
        importedPaymentsCount: 0,
        importedOperatorsCount: 0,
        importedSettings: false,
        message: err?.message || 'An error occurred during database import.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setRawJsonText('');
    setSelectedFileName(null);
    setParsedBackup(null);
    setParseError(null);
    setImportResult(null);
    closeImportDatabase();
  };

  // Generate Sample JSON template for user reference
  const handleDownloadSampleTemplate = () => {
    const sampleBackup: DatabaseBackup = {
      version: 'vinsnetbill_v1',
      exportedAt: new Date().toISOString(),
      settings: {
        ispName: 'VinsNetBill Broadband',
        tagline: 'High Speed Gigabit Optical Fiber Network',
        phone: '+91 98765 12340',
        supportPhone: '+91 98765 99999',
        email: 'support@vinsnetbill.com',
        address: 'Main Boulevard, Tech Park Sector 12',
        gstOrTaxNo: '07AAAAA0000A1Z5',
        currencySymbol: '₹',
        upiId: 'vinsnetbill@okhdfcbank',
        activeCashier: 'Rajesh Kumar (Field Desk)',
        receiptFooter: 'Thank you for choosing VinsNetBill Broadband!',
        templates: settings.templates
      },
      customers: customers.slice(0, 3),
      payments: payments.slice(0, 3),
      operators: operators.slice(0, 2)
    };

    const blob = new Blob([JSON.stringify(sampleBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vinsnetbill_sample_database_template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculated backup statistics
  const backupStats = parsedBackup ? {
    subscribersCount: Array.isArray(parsedBackup.customers) ? parsedBackup.customers.length : 0,
    paymentsCount: Array.isArray(parsedBackup.payments) ? parsedBackup.payments.length : 0,
    totalRevenue: Array.isArray(parsedBackup.payments) 
      ? parsedBackup.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
      : 0,
    operatorsCount: Array.isArray(parsedBackup.operators) ? parsedBackup.operators.length : 0,
    ispName: parsedBackup.settings?.ispName || 'Not specified in backup',
    exportedAt: parsedBackup.exportedAt 
      ? new Date(parsedBackup.exportedAt).toLocaleString()
      : 'Unknown date'
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-sans">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Database className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  Database Management
                </span>
                <span className="text-xs text-slate-400">JSON Full Restore</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Import Entire Database
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Success Result View */}
          {importResult?.success ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Database Imported Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-700 mt-1 max-w-md mx-auto">
                  {importResult.message}
                </p>
              </div>

              {/* Statistics of imported items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subscribers</span>
                  <strong className="text-lg text-emerald-900">{importResult.importedCustomersCount}</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payments</span>
                  <strong className="text-lg text-emerald-900">{importResult.importedPaymentsCount}</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Collectors</span>
                  <strong className="text-lg text-emerald-900">{importResult.importedOperatorsCount}</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Settings</span>
                  <strong className="text-lg text-emerald-900">{importResult.importedSettings ? 'Updated' : 'Kept'}</strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Description & Sample Template Download */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                <div className="space-y-0.5">
                  <strong className="text-slate-800 font-semibold block">
                    Restore or Migrate Your ISP Billing Database
                  </strong>
                  <span className="text-slate-500">
                    Import subscribers ledger, cash collections, receipt history, staff/collectors, and billing settings in a single step.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium shadow-2xs shrink-0 transition-colors"
                  title="Download sample JSON file to see structure"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sample JSON Template</span>
                </button>
              </div>

              {/* Error Alert */}
              {parseError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Error Reading Database:</strong>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Tab Selector: Upload File vs Paste JSON */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Backup File (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'paste'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Paste JSON Text</span>
                </button>
              </div>

              {/* Tab 1: Upload File */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center mx-auto mb-3 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {selectedFileName ? (
                        <span className="text-emerald-700 font-mono">{selectedFileName}</span>
                      ) : (
                        <span>Click to browse or drop your <strong className="text-emerald-700 font-mono">.json</strong> backup file</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Accepts standard VinsNetBill JSON database backups or custom formatted exports
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste JSON Text */}
              {activeTab === 'paste' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Paste raw JSON string
                  </label>
                  <textarea
                    rows={8}
                    value={rawJsonText}
                    onChange={e => {
                      setRawJsonText(e.target.value);
                      inspectAndSetJson(e.target.value);
                    }}
                    placeholder='{"settings": {...}, "customers": [...], "payments": [...], "operators": [...]}'
                    className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Live Inspection & Data Verification Preview */}
              {parsedBackup && backupStats && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Verified Backup Contents
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Exported: <strong className="text-slate-700">{backupStats.exportedAt}</strong>
                    </span>
                  </div>

                  {/* Detected Table Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold">Subscribers</span>
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {backupStats.subscribersCount}
                      </div>
                      <span className="text-[10px] text-slate-400">Ledger accounts</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                        <ReceiptText className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-semibold">Payments</span>
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {backupStats.paymentsCount}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {settings.currencySymbol}{backupStats.totalRevenue.toLocaleString()} rev
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold">Staff & Agents</span>
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {backupStats.operatorsCount}
                      </div>
                      <span className="text-[10px] text-slate-400">Cash collectors</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                        <Building className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold">ISP Profile</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate" title={backupStats.ispName}>
                        {backupStats.ispName}
                      </div>
                      <span className="text-[10px] text-slate-400">Settings included</span>
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Choose Import Strategy:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          importMode === 'replace'
                            ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">
                            Full Restore (Replace Database)
                          </strong>
                          <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                            Replaces current records with this backup. Ideal for disaster recovery or whole system transfers.
                          </span>
                        </div>
                      </label>

                      <label 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          importMode === 'merge'
                            ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">
                            Smart Merge (Append & Update)
                          </strong>
                          <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                            Retains current data, updates matching subscribers/payments, and appends all new records.
                          </span>
                        </div>
                      </label>
                    </div>

                    {importMode === 'replace' && (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg text-amber-900 text-[11px] mt-2 border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Notice: Current subscribers and receipts will be overwritten by this backup.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult?.success && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!parsedBackup || isProcessing}
              onClick={handleExecuteImport}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs ${
                parsedBackup && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing Database...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    Confirm & {importMode === 'replace' ? 'Restore Full Database' : 'Merge Database'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
