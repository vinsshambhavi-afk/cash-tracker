import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Banknote, 
  QrCode, 
  Users, 
  Search, 
  Download, 
  Printer, 
  Send, 
  MessageSquare, 
  ChevronDown, 
  Check, 
  X, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Sparkles,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { PaymentRecord, OperatorUser } from '../types/isp';
import { createCashierStatementWhatsAppUrl } from '../utils/whatsapp';

interface CashierStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOperatorId?: string | null;
}

type DatePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom' | 'all';

export const CashierStatementModal: React.FC<CashierStatementModalProps> = ({
  isOpen,
  onClose,
  initialOperatorId
}) => {
  const { 
    operators, 
    payments, 
    customers, 
    currentUser, 
    isAdmin, 
    settings,
    openReceiptModal,
    openThermalReceipt
  } = useISP();

  // If cashier is logged in (not admin), lock to their profile
  const defaultOperatorId = initialOperatorId || (currentUser?.role !== 'admin' ? (currentUser?.id || 'rajesh-admin') : (operators[0]?.id || 'rajesh-admin'));
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(defaultOperatorId);

  // Sync if initialOperatorId changes
  React.useEffect(() => {
    if (initialOperatorId) {
      setSelectedOperatorId(initialOperatorId);
    } else if (currentUser && currentUser.role !== 'admin') {
      setSelectedOperatorId(currentUser.id);
    }
  }, [initialOperatorId, currentUser]);

  // Date Range Filter States
  const [preset, setPreset] = useState<DatePreset>('thisMonth');
  
  // Default date ranges in YYYY-MM-DD
  const todayIso = new Date().toISOString().split('T')[0];
  const firstDayOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonthIso);
  const [endDate, setEndDate] = useState<string>(todayIso);

  // Method and search filter
  const [methodFilter, setMethodFilter] = useState<'All' | 'Cash' | 'UPI' | 'Bank Transfer'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'itemized' | 'daily'>('itemized');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');

  // Selected operator object
  const selectedOperator = useMemo(() => {
    return operators.find(op => op.id === selectedOperatorId) || operators[0];
  }, [operators, selectedOperatorId]);

  // Set WhatsApp receiver phone to operator's phone or admin support
  React.useEffect(() => {
    if (selectedOperator?.phone) {
      setWhatsAppPhone(selectedOperator.phone);
    }
  }, [selectedOperator]);

  // Handle Preset Changes
  const applyPreset = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const now = new Date();
    
    if (newPreset === 'today') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (newPreset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (newPreset === 'last7') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 6);
      setStartDate(d7.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === 'thisMonth') {
      const fdm = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(fdm);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === 'lastMonth') {
      const lmFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lmLast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(lmFirst);
      setEndDate(lmLast);
    } else if (newPreset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2099-12-31');
    }
  };

  // Filter payments for this specific cashier and date range
  const { filteredPayments, cashierTotal, cashTotal, upiTotal, otherTotal, dailySummaries } = useMemo(() => {
    if (!selectedOperator) {
      return { 
        filteredPayments: [], 
        cashierTotal: 0, 
        cashTotal: 0, 
        upiTotal: 0, 
        otherTotal: 0, 
        dailySummaries: [] 
      };
    }

    const opName = selectedOperator.name.toLowerCase();

    // 1. Filter by cashier collector name match
    const cashierPayments = payments.filter(p => {
      const collectedByLower = (p.collectedBy || '').toLowerCase();
      // Match by full name or first name
      return collectedByLower.includes(opName) || opName.includes(collectedByLower);
    });

    // 2. Filter by Date range
    const inDateRange = cashierPayments.filter(p => {
      if (preset === 'all') return true;
      const pDate = p.date.split('T')[0];
      return pDate >= startDate && pDate <= endDate;
    });

    // Compute Totals for the cashier in this range
    const cTotal = inDateRange.reduce((acc, p) => acc + p.amount, 0);
    const cashT = inDateRange.filter(p => p.method === 'Cash').reduce((acc, p) => acc + p.amount, 0);
    const upiT = inDateRange.filter(p => p.method === 'UPI').reduce((acc, p) => acc + p.amount, 0);
    const otherT = inDateRange.filter(p => p.method !== 'Cash' && p.method !== 'UPI').reduce((acc, p) => acc + p.amount, 0);

    // Group by Day for Daily breakdown
    const dayMap: Record<string, { date: string; cash: number; upi: number; other: number; total: number; count: number }> = {};
    inDateRange.forEach(p => {
      const day = p.date.split('T')[0];
      if (!dayMap[day]) {
        dayMap[day] = { date: day, cash: 0, upi: 0, other: 0, total: 0, count: 0 };
      }
      dayMap[day].count += 1;
      dayMap[day].total += p.amount;
      if (p.method === 'Cash') dayMap[day].cash += p.amount;
      else if (p.method === 'UPI') dayMap[day].upi += p.amount;
      else dayMap[day].other += p.amount;
    });

    const summaries = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));

    // 3. Further filter by method and search for itemized view
    const itemized = inDateRange.filter(p => {
      if (methodFilter !== 'All' && p.method !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cust = customers.find(c => c.id === p.customerId);
        const custName = (cust?.name || '').toLowerCase();
        const subId = (cust?.subscriberId || '').toLowerCase();
        const receiptNo = (p.receiptNo || '').toLowerCase();
        return custName.includes(q) || subId.includes(q) || receiptNo.includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      filteredPayments: itemized,
      cashierTotal: cTotal,
      cashTotal: cashT,
      upiTotal: upiT,
      otherTotal: otherT,
      dailySummaries: summaries
    };
  }, [payments, selectedOperator, startDate, endDate, preset, methodFilter, searchQuery, customers]);

  if (!isOpen) return null;

  // Format date range text for reports
  const periodText = preset === 'all' 
    ? 'All Historical Records' 
    : `${startDate} to ${endDate}`;

  // Target progress if configured on operator (dailyTarget * 30 days)
  const targetAmount = (selectedOperator?.dailyTarget ? selectedOperator.dailyTarget * 30 : 0);
  const targetPct = targetAmount > 0 ? Math.min(100, Math.round((cashierTotal / targetAmount) * 100)) : 0;

  // Generate WhatsApp Share Statement URL
  const handleShareWhatsApp = () => {
    if (!selectedOperator) return;
    const url = createCashierStatementWhatsAppUrl(
      whatsAppPhone || selectedOperator.phone,
      {
        cashierName: selectedOperator.name,
        cashierPhone: selectedOperator.phone,
        ispName: settings.ispName || 'VinsNetBill ISP',
        periodText: periodText,
        totalAmount: cashierTotal,
        cashAmount: cashTotal,
        upiAmount: upiTotal,
        otherAmount: otherTotal,
        receiptCount: dailySummaries.reduce((a, b) => a + b.count, 0),
        cashReceiptCount: filteredPayments.filter(p => p.method === 'Cash').length,
        currencySymbol: settings.currencySymbol || '₹'
      }
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = ['Receipt No', 'Date', 'Time', 'Customer Name', 'Subscriber ID', 'Plan', 'Payment Mode', 'Amount', 'Collected By'];
    const rows = filteredPayments.map(p => {
      const cust = customers.find(c => c.id === p.customerId);
      const dateObj = new Date(p.date);
      return [
        p.receiptNo,
        dateObj.toLocaleDateString('en-IN'),
        dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${(cust?.name || 'Customer').replace(/"/g, '""')}"`,
        cust?.subscriberId || '',
        `"${(cust?.planName || '').replace(/"/g, '""')}"`,
        p.method,
        p.amount,
        `"${p.collectedBy.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VinsNetBill-Statement-${selectedOperator?.name.replace(/\s+/g, '_')}-${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handover Statement Report
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-sans">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-emerald-500/30 bg-slate-950 shrink-0 flex items-center justify-center">
              <img 
                src="/vinsnetbill_logo.jpg" 
                alt="VinsNetBill Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  Cash Collection Statement
                </span>
                <span className="text-xs text-slate-400">Custom Date Range</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {selectedOperator?.name || 'Cashier'} Collection Summary
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Send formatted statement via WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print Handover Report */}
            <button
              type="button"
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              title="Print formal handover document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              title="Export statement to CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* 1. Cashier Selector (Dropdown if admin, badge if cashier) */}
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Cashier / Collector
              </label>
              {isAdmin ? (
                <div className="relative">
                  <select
                    value={selectedOperatorId}
                    onChange={e => setSelectedOperatorId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none shadow-2xs pr-8"
                  >
                    {operators.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.role === 'admin' ? 'Admin' : 'Cash Collector'}) {op.assignedArea ? `· ${op.assignedArea}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 shadow-2xs">
                  <span>{selectedOperator?.name}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                    My Statement
                  </span>
                </div>
              )}
            </div>

            {/* 2. Date Presets */}
            <div className="md:col-span-8 flex flex-col justify-end">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'last7', label: 'Last 7 Days' },
                    { id: 'thisMonth', label: 'This Month' },
                    { id: 'lastMonth', label: 'Last Month' },
                    { id: 'all', label: 'All Time' },
                    { id: 'custom', label: 'Custom' }
                  ] as const
                ).map(btn => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => applyPreset(btn.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      preset === btn.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Date Inputs (Always visible or editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80 items-center">
            <div className="sm:col-span-6 flex items-center gap-2">
              <div className="flex-1">
                <span className="text-[11px] text-slate-500 block mb-0.5">From Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="pt-4 text-slate-400">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-slate-500 block mb-0.5">To Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="sm:col-span-6 flex items-center justify-between gap-3 pt-3 sm:pt-0">
              <div className="text-xs text-slate-600">
                Period: <strong className="text-slate-900 font-semibold">{periodText}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Total Receipts: <strong className="text-emerald-700 font-bold">{filteredPayments.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Key Metrics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Collected */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Total Collected</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-950 tabular-nums">
                {settings.currencySymbol}{cashierTotal.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                {dailySummaries.reduce((a, b) => a + b.count, 0)} bills generated
              </div>
            </div>

            {/* Cash in Hand */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Cash Collected</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {settings.currencySymbol}{cashTotal.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Physical cash to be handed over
              </div>
            </div>

            {/* UPI Digital Collected */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>UPI / QR Digital</span>
                <QrCode className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {settings.currencySymbol}{upiTotal.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Direct to company bank UPI
              </div>
            </div>

            {/* Performance Target / Average Ticket */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Monthly Target</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {targetAmount > 0 ? `${targetPct}%` : 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {targetAmount > 0 
                  ? `Goal: ${settings.currencySymbol}${targetAmount.toLocaleString()}` 
                  : `Avg: ${settings.currencySymbol}${filteredPayments.length > 0 ? Math.round(cashierTotal / filteredPayments.length) : 0}/bill`}
              </div>
            </div>
          </div>

          {/* Sub Navigation: Itemized Receipts vs Daily Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('itemized')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'itemized'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Itemized Receipts ({filteredPayments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'daily'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Daily Summary Breakdown ({dailySummaries.length} days)
              </button>
            </div>

            {/* Search and Method Filters */}
            {activeTab === 'itemized' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search receipt #, subscriber..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={methodFilter}
                  onChange={e => setMethodFilter(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="All">All Modes</option>
                  <option value="Cash">Cash Only</option>
                  <option value="UPI">UPI Only</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: Itemized Table */}
          {activeTab === 'itemized' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Subscriber Name & ID</th>
                      <th className="py-2.5 px-3">Plan / Validity</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Receipt Slips</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No collections found for this date range</p>
                          <p className="text-xs text-slate-400 mt-1">Try selecting "This Month" or "All Time" to view past collections.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map(p => {
                        const cust = customers.find(c => c.id === p.customerId);
                        const dateObj = new Date(p.date);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-medium text-slate-900">
                                {dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                              {p.receiptNo}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 truncate max-w-[160px]">
                                {cust?.name || 'Customer'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {cust?.subscriberId} · {cust?.phone}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-800 truncate max-w-[140px] font-medium">
                                {cust?.planName || 'Broadband'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {cust?.speedMbps ? `${cust.speedMbps} Mbps · ` : ''}{cust?.monthlyFee ? `${settings.currencySymbol}${cust.monthlyFee}/mo` : 'Active'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {p.method === 'Cash' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Banknote className="w-3 h-3" /> Cash
                                </span>
                              ) : p.method === 'UPI' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                  <QrCode className="w-3 h-3" /> UPI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                  Bank
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 tabular-nums">
                              {settings.currencySymbol}{p.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => cust && openReceiptModal(p, cust)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                                  title="View Receipt Details"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cust && openThermalReceipt(p, cust)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold transition-colors"
                                  title="Print 80mm Thermal Slip"
                                >
                                  Thermal
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Daily Breakdown Summary */}
          {activeTab === 'daily' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-center">Receipts Count</th>
                    <th className="py-2.5 px-4 text-right">Physical Cash</th>
                    <th className="py-2.5 px-4 text-right">UPI Digital</th>
                    <th className="py-2.5 px-4 text-right">Other</th>
                    <th className="py-2.5 px-4 text-right font-bold text-slate-900">Day Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailySummaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No daily records in this date range.
                      </td>
                    </tr>
                  ) : (
                    dailySummaries.map(d => (
                      <tr key={d.date} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            {d.count} bills
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                          {settings.currencySymbol}{d.cash.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-purple-700">
                          {settings.currencySymbol}{d.upi.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                          {settings.currencySymbol}{d.other.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {settings.currencySymbol}{d.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td className="py-3 px-4">Period Grand Total</td>
                    <td className="py-3 px-4 text-center">
                      {dailySummaries.reduce((a, b) => a + b.count, 0)} bills
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800">
                      {settings.currencySymbol}{cashTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-purple-800">
                      {settings.currencySymbol}{upiTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {settings.currencySymbol}{otherTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-lg font-black text-emerald-950">
                      {settings.currencySymbol}{cashierTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{selectedOperator?.name}</span>
            <span>·</span>
            <span>Mobile: <strong className="text-slate-800 font-mono">+91 {selectedOperator?.phone}</strong></span>
            {selectedOperator?.assignedArea && (
              <>
                <span>·</span>
                <span>Area: <strong className="text-slate-800">{selectedOperator.assignedArea}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp Statement</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Printable Cashier Handover Statement (Formatted for Print) */}
      <div id="printable-statement" className="hidden print:block font-sans text-black p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">{settings.ispName || 'VinsNetBill Broadband'}</h1>
            <p className="text-xs text-slate-700">{settings.tagline}</p>
            <p className="text-xs text-slate-600">{settings.address}</p>
            <p className="text-xs font-semibold">Support: {settings.supportPhone || settings.phone}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold uppercase tracking-wide">CASHIER HANDOVER STATEMENT</div>
            <div className="text-xs text-slate-600">Generated: {new Date().toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-900 mt-1">Period: {periodText}</div>
          </div>
        </div>

        {/* Cashier Info Card */}
        <div className="bg-slate-100 p-3 rounded mb-4 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block">Cashier Name:</span>
            <strong className="text-sm">{selectedOperator?.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Mobile Number:</span>
            <strong>+91 {selectedOperator?.phone}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Area / Agency:</span>
            <strong>{selectedOperator?.assignedArea || selectedOperator?.agency || 'All Zones'}</strong>
          </div>
        </div>

        {/* Collection Totals Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div className="border border-slate-300 p-2 rounded">
            <div className="text-[10px] uppercase text-slate-500">Total Collected</div>
            <div className="text-lg font-black">{settings.currencySymbol}{cashierTotal.toLocaleString()}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded">
            <div className="text-[10px] uppercase text-slate-500">Physical Cash</div>
            <div className="text-lg font-bold">{settings.currencySymbol}{cashTotal.toLocaleString()}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded">
            <div className="text-[10px] uppercase text-slate-500">UPI Digital</div>
            <div className="text-lg font-bold">{settings.currencySymbol}{upiTotal.toLocaleString()}</div>
          </div>
          <div className="border border-slate-300 p-2 rounded">
            <div className="text-[10px] uppercase text-slate-500">Total Bills</div>
            <div className="text-lg font-bold">{filteredPayments.length}</div>
          </div>
        </div>

        {/* Daily Breakdown for Handover */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-1">Daily Reconciliation</h3>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-200">
                <th className="p-1.5 border">Date</th>
                <th className="p-1.5 border text-center">Bills</th>
                <th className="p-1.5 border text-right">Cash Amount</th>
                <th className="p-1.5 border text-right">UPI Amount</th>
                <th className="p-1.5 border text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {dailySummaries.map(d => (
                <tr key={d.date}>
                  <td className="p-1.5 border">{d.date}</td>
                  <td className="p-1.5 border text-center">{d.count}</td>
                  <td className="p-1.5 border text-right">{settings.currencySymbol}{d.cash.toLocaleString()}</td>
                  <td className="p-1.5 border text-right">{settings.currencySymbol}{d.upi.toLocaleString()}</td>
                  <td className="p-1.5 border text-right font-bold">{settings.currencySymbol}{d.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Handover Sign-off */}
        <div className="grid grid-cols-2 gap-12 pt-12 text-xs border-t border-slate-400 mt-8">
          <div>
            <div className="border-b border-black w-48 mb-1"></div>
            <p className="font-semibold">Cashier Signature</p>
            <p className="text-[10px] text-slate-500">{selectedOperator?.name} (+91 {selectedOperator?.phone})</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="border-b border-black w-48 mb-1"></div>
            <p className="font-semibold">Authorized Admin / Receiver Signature</p>
            <p className="text-[10px] text-slate-500">Verified & Reconciled</p>
          </div>
        </div>
      </div>
    </div>
  );
};
