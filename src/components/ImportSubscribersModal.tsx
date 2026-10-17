import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  Check, 
  AlertCircle, 
  FileSpreadsheet, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { Customer, ConnectionType, SubscriberStatus } from '../types/isp';

interface ParsedRow {
  subscriberId: string;
  activationNumber: string;
  name: string;
  phone: string;
  area: string;
  address: string;
  planName: string;
  speedMbps: number;
  monthlyFee: number;
  expiryDate: string;
  connectionType: ConnectionType;
  isValid: boolean;
  errors: string[];
}

const SAMPLE_CSV_CONTENT = `Subscriber ID,Activation Number,Customer Name,Phone,Area,Address,Plan Name,Speed Mbps,Monthly Fee,Expiry Date,Connection Type
OPT-2026-201,ACT-38912-FTTH,Sunita Rao,9812345678,Sector 14,Flat 102 Green Heights,Fiber Blast 100 Mbps,100,699,2026-10-11,FTTH
OPT-2026-202,ACT-77401-FTTH,Harish Singhania,9823456789,Downtown West,Shop 12 Market Complex,GigaPro 200 Mbps,200,999,2026-10-12,FTTH
OPT-2026-203,ACT-55192-FIB,Geeta Venkatesh,9834567890,Green Glen,Villa 4 Sunrise Enclave,Commercial SOHO 300 Mbps,300,1499,2026-10-15,Fiber
OPT-2026-204,ACT-88123-WIR,Tariq Mansoori,9845678901,Sector 14,House 44 Street 3,Starter 50 Mbps,50,499,2026-10-08,Wireless`;

export const ImportSubscribersModal: React.FC = () => {
  const { isImportModalOpen, closeImportModal, importSubscribers, settings } = useISP();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [rawText, setRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  if (!isImportModalOpen) return null;

  // Simple CSV / TSV parser
  const parseData = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Determine if first row is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('subscriber') || 
                      firstLineLower.includes('name') || 
                      firstLineLower.includes('phone') ||
                      firstLineLower.includes('activation');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: ParsedRow[] = dataLines.map((line, index) => {
      // Split by comma or tab
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

      // Expected columns:
      // 0: subscriberId
      // 1: activationNumber
      // 2: name
      // 3: phone
      // 4: area
      // 5: address
      // 6: planName
      // 7: speedMbps
      // 8: monthlyFee
      // 9: expiryDate
      // 10: connectionType

      const subscriberId = parts[0] || `OPT-IMP-${100 + index + 1}`;
      const activationNumber = parts[1] || `ACT-${Math.floor(10000 + Math.random() * 90000)}-FTTH`;
      const name = parts[2] || parts[1] || `Subscriber ${index + 1}`;
      const phone = (parts[3] || parts[2] || '').replace(/\D/g, '');
      const area = parts[4] || 'Sector 14';
      const address = parts[5] || '';
      const planName = parts[6] || 'Fiber 100 Mbps';
      const speedMbps = Number(parts[7]) || 100;
      const monthlyFee = Number(parts[8]) || 699;
      const expiryDate = parts[9] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const connectionType: ConnectionType = (parts[10] as ConnectionType) || 'FTTH';

      const errors: string[] = [];
      if (!name) errors.push('Name missing');
      if (!phone || phone.length < 10) errors.push('Invalid phone');
      if (monthlyFee <= 0) errors.push('Invalid fee');

      return {
        subscriberId,
        activationNumber,
        name,
        phone,
        area,
        address,
        planName,
        speedMbps,
        monthlyFee,
        expiryDate,
        connectionType,
        isValid: errors.length === 0,
        errors
      };
    });

    setParsedRows(rows);
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    parseData(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setRawText(content);
      parseData(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_CSV_CONTENT);
    parseData(SAMPLE_CSV_CONTENT);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ISP_Subscribers_Activation_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    const toImport: Omit<Customer, 'id' | 'createdAt'>[] = validRows.map(r => {
      let status: SubscriberStatus = 'active';
      if (r.expiryDate < today) status = 'overdue';
      else if (r.expiryDate === today) status = 'due_today';

      return {
        subscriberId: r.subscriberId,
        activationNumber: r.activationNumber,
        name: r.name,
        phone: r.phone,
        area: r.area,
        address: r.address,
        planName: r.planName,
        speedMbps: r.speedMbps,
        monthlyFee: r.monthlyFee,
        billingDay: new Date(r.expiryDate).getDate() || 1,
        expiryDate: r.expiryDate,
        status,
        balance: 0,
        connectionType: r.connectionType,
      };
    });

    const count = importSubscribers(toImport);
    setImportSuccessCount(count);

    setTimeout(() => {
      setImportSuccessCount(null);
      closeImportModal();
      setRawText('');
      setParsedRows([]);
    }, 1500);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden my-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Import Existing Subscribers & Activation Numbers
              </h2>
              <p className="text-xs text-slate-500">
                Bulk upload from Excel or CSV with CAF activation serials, plans, and due dates
              </p>
            </div>
          </div>
          <button
            onClick={closeImportModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {importSuccessCount !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>Successfully imported {importSuccessCount} subscribers with activation numbers!</span>
            </div>
          )}

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'paste' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Copy & Paste Rows
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'upload' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Upload CSV File
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fill Sample Data</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>

          {/* Input Area */}
          {activeTab === 'paste' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste CSV or Tab-Separated Spreadsheet Rows:
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={e => handleTextChange(e.target.value)}
                placeholder={`Subscriber ID,Activation Number,Name,Phone,Area,Address,Plan,Speed,Fee,Expiry,Connection\nOPT-2026-301,ACT-99012-FTTH,Rahul Sharma,9876543210,Sector 14,Flat 2B,Fiber 100 Mbps,100,699,2026-10-15,FTTH`}
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Order: Subscriber ID, Activation Number, Customer Name, Phone Number, Area, Address, Plan, Speed, Monthly Fee, Expiry Date, Connection Type
              </span>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3 bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Select a CSV spreadsheet from your computer
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports UTF-8 CSV exports from Excel, Tally, or legacy ISP software
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
              />
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Detected {parsedRows.length} Rows ({validCount} Valid)
                </span>
                <span className="text-emerald-700">
                  Ready to import into database
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Subscriber ID</th>
                      <th className="py-2 px-3">Activation No</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Area</th>
                      <th className="py-2 px-3">Plan</th>
                      <th className="py-2 px-3 text-right">Fee</th>
                      <th className="py-2 px-3">Expiry</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.subscriberId}</td>
                        <td className="py-2 px-3 text-emerald-700 font-semibold">{r.activationNumber}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 text-slate-700">{r.phone}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{r.area}</td>
                        <td className="py-2 px-3 font-sans text-slate-700">{r.planName}</td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900">
                          {settings.currencySymbol}{r.monthlyFee}
                        </td>
                        <td className="py-2 px-3 text-slate-600 tabular-nums">{r.expiryDate}</td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-bold">✓</span>
                          ) : (
                            <span className="text-rose-600 text-[10px] font-sans">
                              {r.errors.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Each subscriber will receive an activation profile in the database
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeImportModal}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={validCount === 0}
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Import {validCount} Subscribers</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
