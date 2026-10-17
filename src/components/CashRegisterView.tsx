import React, { useState } from 'react';
import { 
  HandCoins, 
  Banknote, 
  QrCode, 
  TrendingUp, 
  Calendar, 
  Download, 
  Search, 
  Printer, 
  Send, 
  Check, 
  Calculator, 
  Plus, 
  ReceiptText,
  DollarSign
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { Customer, PaymentRecord } from '../types/isp';

export const CashRegisterView: React.FC = () => {
  const { payments, customers, settings, openReceiveCash, openReceiptModal, triggerPrintReceipt, openThermalReceipt } = useISP();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | 'Cash' | 'UPI' | 'Bank Transfer'>('All');
  const [showDenominations, setShowDenominations] = useState(false);

  // Cash denomination counts for physical drawer reconciliation
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0
  });

  // Calculate today's date in local ISO
  const todayStr = new Date().toISOString().split('T')[0];

  // Payments today
  const todayPayments = payments.filter(p => p.date.startsWith(todayStr));

  const todayCashTotal = todayPayments
    .filter(p => p.method === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayUpiTotal = todayPayments
    .filter(p => p.method === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  // Total month to date
  const currentMonthPrefix = todayStr.substring(0, 7);
  const mtdTotal = payments
    .filter(p => p.date.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculated physical cash in drawer
  const physicalCashTotal = Object.entries(denominations).reduce(
    (sum, [note, count]) => sum + Number(note) * count,
    0
  );

  const cashDiscrepancy = physicalCashTotal - todayCashTotal;

  // Filtered payments list
  const filteredPayments = payments.filter(payment => {
    if (methodFilter !== 'All' && payment.method !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        payment.receiptNo.toLowerCase().includes(q) ||
        payment.customerName.toLowerCase().includes(q) ||
        payment.subscriberId.toLowerCase().includes(q) ||
        payment.customerPhone.includes(q)
      );
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Subscriber ID', 'Customer Name', 'Phone', 'Amount', 'Method', 'Valid From', 'Valid To', 'Collected By', 'Notes'];
    const rows = filteredPayments.map(p => [
      p.receiptNo,
      new Date(p.date).toLocaleString(),
      p.subscriberId,
      `"${p.customerName.replace(/"/g, '""')}"`,
      p.customerPhone,
      p.amount,
      p.method,
      p.validFrom,
      p.validTo,
      `"${p.collectedBy.replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISP_Collections_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-600" />
            Cash Register & Daily Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time cash drawer collections, digital UPI receipts, and daily reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowDenominations(!showDenominations)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>{showDenominations ? 'Hide Cash Drawer' : 'Reconcile Cash Drawer'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => openReceiveCash()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Receive Cash</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Cash Collected */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Cash in Hand (Today)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{todayCashTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {todayPayments.filter(p => p.method === 'Cash').length} cash receipts collected today
          </div>
        </div>

        {/* Today's UPI / Online */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">UPI / Digital (Today)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{todayUpiTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {todayPayments.filter(p => p.method !== 'Cash').length} digital transactions
          </div>
        </div>

        {/* Total Today */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Daily Collection</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{todayTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {todayPayments.length} total payments today
          </div>
        </div>

        {/* Month to Date */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Month to Date (MTD)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{mtdTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Active Cashier: {settings.activeCashier}
          </div>
        </div>
      </div>

      {/* Cash Reconciliation Drawer Panel (Collapsible) */}
      {showDenominations && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Physical Cash Drawer Reconciliation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Count physical notes in the register to match against today's cash collections
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Total In Drawer</span>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {settings.currencySymbol}{physicalCashTotal.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[500, 200, 100, 50, 20, 10].map(denom => (
              <div key={denom} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{settings.currencySymbol}{denom}</span>
                  <span className="font-mono text-slate-500 text-[11px] tabular-nums">
                    = {settings.currencySymbol}{(denom * (denominations[denom] || 0)).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0 notes"
                  value={denominations[denom] || ''}
                  onChange={e =>
                    setDenominations(prev => ({
                      ...prev,
                      [denom]: Math.max(0, parseInt(e.target.value) || 0)
                    }))
                  }
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-center font-mono tabular-nums"
                />
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span>Expected Cash from Receipts: <strong className="tabular-nums font-semibold">{settings.currencySymbol}{todayCashTotal.toLocaleString()}</strong></span>
              <span>·</span>
              <span>Counted Cash: <strong className="tabular-nums font-semibold">{settings.currencySymbol}{physicalCashTotal.toLocaleString()}</strong></span>
            </div>

            <div>
              {cashDiscrepancy === 0 && physicalCashTotal > 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Cash Drawer Balanced Perfectly!
                </span>
              ) : cashDiscrepancy !== 0 && physicalCashTotal > 0 ? (
                <span className={`font-semibold tabular-nums ${cashDiscrepancy > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                  Variance: {cashDiscrepancy > 0 ? '+' : ''}{settings.currencySymbol}{cashDiscrepancy.toLocaleString()} ({cashDiscrepancy > 0 ? 'Surplus' : 'Shortage'})
                </span>
              ) : (
                <span className="text-slate-400">Enter note counts to verify drawer balance</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by receipt #, customer name, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs self-stretch sm:self-auto overflow-x-auto">
            {(['All', 'Cash', 'UPI', 'Bank Transfer'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMethodFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  methodFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ReceiptText className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">No payment receipts found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Subscriber</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Collector</th>
                  <th className="py-3 px-4 text-center">WhatsApp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(payment => {
                  const customer: Customer = customers.find(c => c.id === payment.customerId) || {
                    id: payment.customerId,
                    subscriberId: payment.subscriberId,
                    activationNumber: 'ACT-00000-FTTH',
                    name: payment.customerName,
                    phone: payment.customerPhone,
                    address: '',
                    area: '',
                    planName: 'Broadband',
                    speedMbps: 100,
                    monthlyFee: payment.amount,
                    billingDay: 1,
                    expiryDate: payment.validTo,
                    status: 'active' as const,
                    balance: 0,
                    connectionType: 'FTTH' as const,
                    createdAt: ''
                  };

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                        {payment.receiptNo}
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {new Date(payment.date).toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                        {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{payment.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {payment.subscriberId} · {payment.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          payment.method === 'Cash' ? 'text-emerald-700' : 'text-sky-700'
                        }`}>
                          {payment.method === 'Cash' ? <Banknote className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                          {payment.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {settings.currencySymbol}{payment.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 tabular-nums">
                        {payment.validTo}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[120px]">
                        {payment.collectedBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {payment.whatsappSent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3" /> Sent
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => triggerPrintReceipt(payment, customer)}
                              title="Print 80mm Thermal Receipt Slip"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openReceiptModal(payment, customer)}
                              title="Open WhatsApp Receipt & Print"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
