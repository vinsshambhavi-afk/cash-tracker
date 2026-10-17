import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Search, 
  Download, 
  Printer, 
  Send, 
  Copy, 
  Check, 
  Banknote, 
  QrCode,
  Calendar,
  Building,
  User,
  Users,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  FileText,
  Clock,
  Sparkles,
  Wifi,
  Phone,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { Customer, PaymentRecord } from '../types/isp';
import { generateReceiptMessage } from '../utils/whatsapp';

export const ReceiptsView: React.FC = () => {
  const { 
    payments, 
    customers, 
    settings, 
    openReceiptModal, 
    triggerPrintReceipt, 
    openThermalReceipt,
    selectedReceiptSubscriberId,
    setSelectedReceiptSubscriberId,
    openReceiveCash,
    openCashierStatement
  } = useISP();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Cash' | 'UPI' | 'Bank Transfer'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'last30'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  // Selected subscriber object if any
  const selectedSubscriber = useMemo(() => {
    if (!selectedReceiptSubscriberId) return null;
    return customers.find(c => c.id === selectedReceiptSubscriberId) || null;
  }, [customers, selectedReceiptSubscriberId]);

  // Date ranges
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Filtering payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Subscriber filter
      if (selectedReceiptSubscriberId && p.customerId !== selectedReceiptSubscriberId) {
        return false;
      }

      // Method filter
      if (methodFilter !== 'all' && p.method !== methodFilter) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today' && !p.date.startsWith(todayStr)) {
        return false;
      }
      if (dateFilter === 'month' && !p.date.startsWith(currentMonthPrefix)) {
        return false;
      }
      if (dateFilter === 'last30' && p.date < thirtyDaysAgo) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const customer = customers.find(c => c.id === p.customerId);
        const actNo = customer?.activationNumber || '';
        return (
          p.receiptNo.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.subscriberId.toLowerCase().includes(q) ||
          p.customerPhone.includes(q) ||
          p.collectedBy.toLowerCase().includes(q) ||
          actNo.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [payments, selectedReceiptSubscriberId, methodFilter, dateFilter, searchQuery, todayStr, currentMonthPrefix, thirtyDaysAgo, customers]);

  // Itemized Cash Collections Metrics
  const cashPayments = useMemo(() => payments.filter(p => p.method === 'Cash'), [payments]);
  const totalCashCollected = useMemo(() => cashPayments.reduce((sum, p) => sum + p.amount, 0), [cashPayments]);
  const totalOverallCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const cashSharePercent = totalOverallCollected > 0 ? Math.round((totalCashCollected / totalOverallCollected) * 100) : 0;
  const avgCashPayment = cashPayments.length > 0 ? Math.round(totalCashCollected / cashPayments.length) : 0;

  // Selected subscriber's cash collections
  const selectedSubCashStats = useMemo(() => {
    if (!selectedSubscriber) return null;
    const subPayments = payments.filter(p => p.customerId === selectedSubscriber.id);
    const subCash = subPayments.filter(p => p.method === 'Cash');
    const totalCash = subCash.reduce((sum, p) => sum + p.amount, 0);
    const totalAll = subPayments.reduce((sum, p) => sum + p.amount, 0);
    const latestPayment = subPayments[0] || null;
    return {
      subPayments,
      totalCash,
      totalAll,
      cashCount: subCash.length,
      allCount: subPayments.length,
      latestPayment
    };
  }, [selectedSubscriber, payments]);

  // Itemized Revenue by Plan (Cash collections)
  const cashByPlan = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    cashPayments.forEach(p => {
      const cust = customers.find(c => c.id === p.customerId);
      const plan = cust?.planName || 'Standard Fiber';
      if (!map[plan]) map[plan] = { count: 0, amount: 0 };
      map[plan].count += 1;
      map[plan].amount += p.amount;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [cashPayments, customers]);

  const handleCopyText = async (payment: PaymentRecord) => {
    const customer = customers.find(c => c.id === payment.customerId) || {
      id: payment.customerId,
      subscriberId: payment.subscriberId,
      activationNumber: 'ACT-00000-FTTH',
      name: payment.customerName,
      phone: payment.customerPhone,
      address: '',
      area: '',
      planName: 'Broadband Plan',
      speedMbps: 100,
      monthlyFee: payment.amount,
      billingDay: 1,
      expiryDate: payment.validTo,
      status: 'active' as const,
      balance: 0,
      connectionType: 'FTTH' as const,
      createdAt: ''
    };
    const msg = generateReceiptMessage(payment, customer, settings);
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedId(payment.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Receipt No',
      'Date Time',
      'Subscriber ID',
      'Activation No',
      'Customer Name',
      'Phone',
      'Payment Mode',
      'Amount',
      'Valid From',
      'Valid To',
      'Collected By',
      'WhatsApp Status'
    ];
    const rows = filteredPayments.map(p => {
      const cust = customers.find(c => c.id === p.customerId);
      return [
        p.receiptNo,
        `"${new Date(p.date).toLocaleString()}"`,
        p.subscriberId,
        cust?.activationNumber || '',
        `"${p.customerName.replace(/"/g, '""')}"`,
        p.customerPhone,
        p.method,
        p.amount,
        p.validFrom,
        p.validTo,
        `"${p.collectedBy.replace(/"/g, '""')}"`,
        p.whatsappSent ? 'Dispatched' : 'Pending'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VinsNetBill-Receipt-History-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-600" />
            <span>Receipt History & Cash Collections</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit itemized cash & digital receipts, filter by subscriber, and print 80mm thermal slips
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openCashierStatement()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-2xs transition-colors"
            title="Open Cashier Custom Date Statement"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cashier Statement</span>
          </button>

          {selectedSubscriber && selectedSubCashStats?.latestPayment && (
            <button
              onClick={() => openThermalReceipt(selectedSubCashStats.latestPayment!, selectedSubscriber)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm Thermal Slip</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Subscriber Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Select Subscriber for Itemized Receipts & 80mm Printing:</span>
          </div>

          {selectedReceiptSubscriberId && (
            <button
              onClick={() => setSelectedReceiptSubscriberId(null)}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All Subscribers</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={selectedReceiptSubscriberId || ''}
              onChange={e => setSelectedReceiptSubscriberId(e.target.value ? e.target.value : null)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            >
              <option value="">All Subscribers (Showing all {payments.length} receipts)</option>
              {customers.map(c => {
                const subPayCount = payments.filter(p => p.customerId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.subscriberId} (Act: {c.activationNumber || 'N/A'}) · {c.phone} · {c.area} [{subPayCount} receipts]
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick-Pill Shortcut for Recent Subscribers */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Recent:</span>
            {customers.slice(0, 4).map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedReceiptSubscriberId(c.id)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] transition-colors whitespace-nowrap ${
                  selectedReceiptSubscriberId === c.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c.name.split(' ')[0]} ({c.subscriberId.split('-').pop()})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Subscriber Dossier Card (Displayed when a subscriber is selected) */}
      {selectedSubscriber && selectedSubCashStats && (
        <div className="bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100 pb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {selectedSubscriber.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedSubscriber.name}</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    selectedSubscriber.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : selectedSubscriber.status === 'due_today'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedSubscriber.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1 font-mono">
                  <span>ID: <strong className="text-slate-900">{selectedSubscriber.subscriberId}</strong></span>
                  <span>·</span>
                  <span className="text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded font-semibold">
                    Activation No: {selectedSubscriber.activationNumber || 'N/A'}
                  </span>
                  <span>·</span>
                  <span>📞 {selectedSubscriber.phone}</span>
                </div>
              </div>
            </div>

            {/* Subscriber Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedSubCashStats.latestPayment && (
                <>
                  <button
                    onClick={() => openThermalReceipt(selectedSubCashStats.latestPayment!, selectedSubscriber)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    title="Preview full 80mm thermal receipt before printing"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>80mm Preview</span>
                  </button>

                  <button
                    onClick={() => triggerPrintReceipt(selectedSubCashStats.latestPayment!, selectedSubscriber)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    title="Send straight to thermal printer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Thermal (80mm)</span>
                  </button>
                </>
              )}

              <button
                onClick={() => openReceiveCash(selectedSubscriber.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Receive Cash</span>
              </button>
            </div>
          </div>

          {/* Subscriber Itemized Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Plan & Speed</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                {selectedSubscriber.planName}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {selectedSubscriber.speedMbps} Mbps FTTH
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Total Cash Collected</span>
              <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block tabular-nums">
                {settings.currencySymbol}{selectedSubCashStats.totalCash.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedSubCashStats.cashCount} cash payments
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Validity Expiry</span>
              <span className="font-bold text-slate-900 mt-0.5 block tabular-nums">
                {selectedSubscriber.expiryDate}
              </span>
              <span className="text-[11px] text-slate-500">
                Monthly Fee: {settings.currencySymbol}{selectedSubscriber.monthlyFee}
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Latest Receipt</span>
              {selectedSubCashStats.latestPayment ? (
                <>
                  <span className="font-mono font-bold text-emerald-800 mt-0.5 block truncate">
                    {selectedSubCashStats.latestPayment.receiptNo}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(selectedSubCashStats.latestPayment.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 mt-0.5 block">No receipts yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Itemized Cash Collections Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cash Collected */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Cash Collections</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{totalCashCollected.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">{cashPayments.length} receipts</span>
            <span>·</span>
            <span>{cashSharePercent}% of total revenue</span>
          </div>
        </div>

        {/* Card 2: Cash Handover & Avg */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Average Cash Receipt</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{avgCashPayment.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            Cashier: <span className="font-semibold text-slate-700">{settings.activeCashier}</span>
          </div>
        </div>

        {/* Card 3: Itemized Plan Revenue (Cash) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Top Cash Plan</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {cashByPlan[0]?.[0] || 'Broadband Plans'}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {cashByPlan[0] ? `${settings.currencySymbol}${cashByPlan[0][1].amount.toLocaleString()} (${cashByPlan[0][1].count} renewals)` : 'No collections'}
          </div>
        </div>

        {/* Card 4: Thermal 80mm Readiness */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Thermal Printing</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>80mm POS Ready</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Formatted for Epson, Xprinter & TVS rolls
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by receipt #, customer name, phone, activation #..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs">
          {/* Mode Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setMethodFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                methodFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({payments.length})
            </button>
            <button
              onClick={() => setMethodFilter('Cash')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                methodFilter === 'Cash' ? 'bg-emerald-600 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash Only ({cashPayments.length})</span>
            </button>
            <button
              onClick={() => setMethodFilter('UPI')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                methodFilter === 'UPI' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI</span>
            </button>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="last30">Last 30 Days</option>
            </select>
          </div>

          {(searchQuery || methodFilter !== 'all' || dateFilter !== 'all' || selectedReceiptSubscriberId) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setMethodFilter('all');
                setDateFilter('all');
                setSelectedReceiptSubscriberId(null);
              }}
              className="text-slate-500 hover:text-rose-600 p-1.5 rounded"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Receipts Table with Itemized Cash Information */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{filteredPayments.length} receipts listed</span>
            {selectedSubscriber && (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-medium">
                Filtered: {selectedSubscriber.name}
              </span>
            )}
            {methodFilter === 'Cash' && (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Cash Only
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-slate-400">Click receipt to view itemized breakdown or print 80mm slip</span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No matching receipts found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Subscriber & Activation</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Itemized Service Period</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4">Collector</th>
                  <th className="py-3 px-4 text-center">WhatsApp</th>
                  <th className="py-3 px-4 text-right">Thermal 80mm & Actions</th>
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
                    planName: 'Broadband Plan',
                    speedMbps: 100,
                    monthlyFee: payment.amount,
                    billingDay: 1,
                    expiryDate: payment.validTo,
                    status: 'active' as const,
                    balance: 0,
                    connectionType: 'FTTH' as const,
                    createdAt: ''
                  };
                  const isCopied = copiedId === payment.id;
                  const isExpanded = expandedPaymentId === payment.id;
                  const isCurrentSubscriber = selectedReceiptSubscriberId === customer.id;

                  return (
                    <React.Fragment key={payment.id}>
                      <tr 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isExpanded ? 'bg-emerald-50/30' : ''
                        } ${isCurrentSubscriber ? 'bg-emerald-50/20' : ''}`}
                      >
                        {/* Receipt No */}
                        <td className="py-3.5 px-4 font-mono font-semibold">
                          <button
                            onClick={() => openThermalReceipt(payment, customer)}
                            className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5 text-left"
                            title="Click to view 80mm Thermal Receipt Slip"
                          >
                            <span>{payment.receiptNo}</span>
                          </button>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                          <div>{new Date(payment.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[10px] text-slate-400">{new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>

                        {/* Subscriber & Activation */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{payment.customerName}</span>
                            <button
                              onClick={() => setSelectedReceiptSubscriberId(customer.id)}
                              className="text-[10px] text-slate-400 hover:text-emerald-700 hover:underline"
                              title="Filter to this subscriber"
                            >
                              [Filter]
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>{payment.subscriberId}</span>
                            <span className="mx-1 text-slate-300">·</span>
                            <span className="text-emerald-800 font-semibold">{customer.activationNumber || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
                            payment.method === 'Cash' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-sky-50 text-sky-800 border border-sky-200'
                          }`}>
                            {payment.method === 'Cash' ? <Banknote className="w-3.5 h-3.5 text-emerald-600" /> : <QrCode className="w-3.5 h-3.5 text-sky-600" />}
                            <span>{payment.method}</span>
                          </span>
                        </td>

                        {/* Itemized Service Period */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 truncate max-w-[170px]">
                            {customer.planName} ({customer.speedMbps} Mbps)
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            {payment.validFrom} → {payment.validTo}
                          </div>
                        </td>

                        {/* Amount Received */}
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums text-sm">
                          {settings.currencySymbol}{payment.amount.toLocaleString()}
                        </td>

                        {/* Collector */}
                        <td className="py-3.5 px-4 text-slate-600 truncate max-w-[120px]">
                          {payment.collectedBy}
                        </td>

                        {/* WhatsApp Status */}
                        <td className="py-3.5 px-4 text-center">
                          {payment.whatsappSent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Not Sent
                            </span>
                          )}
                        </td>

                        {/* Actions: Thermal 80mm Print & Dispatch */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Instant Thermal 80mm Print */}
                            <button
                              onClick={() => triggerPrintReceipt(payment, customer)}
                              title="Print 80mm Thermal Receipt Slip"
                              className="p-1.5 text-slate-700 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors border border-slate-200 hover:border-emerald-600"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* View 80mm Preview Modal */}
                            <button
                              onClick={() => openThermalReceipt(payment, customer)}
                              title="Preview 80mm Thermal Receipt"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Dispatch Modal */}
                            <button
                              onClick={() => openReceiptModal(payment, customer)}
                              title="Send WhatsApp Receipt"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-600" />
                            </button>

                            {/* Copy Receipt Text */}
                            <button
                              onClick={() => handleCopyText(payment)}
                              title="Copy receipt message"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {/* Expand Itemized Breakdown */}
                            <button
                              onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                              title="Toggle itemized bill breakdown"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Itemized Cash Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={9} className="p-4 pl-12">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">Itemized Cash Collection Breakdown</span>
                                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                                    {payment.receiptNo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <button
                                    onClick={() => triggerPrintReceipt(payment, customer)}
                                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Thermal Slip (80mm)</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Bill Line Items */}
                                <div className="space-y-1.5 md:col-span-2">
                                  <div className="flex justify-between font-semibold text-slate-800 border-b border-slate-100 pb-1">
                                    <span>Description / Line Item</span>
                                    <span>Amount</span>
                                  </div>
                                  <div className="flex justify-between text-slate-700">
                                    <span>1. Broadband Internet Subscription ({customer.planName} - {customer.speedMbps} Mbps)</span>
                                    <span className="font-mono font-medium">{settings.currencySymbol}{payment.amount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-500 text-[11px] pl-3">
                                    <span>Service Duration: {payment.validFrom} to {payment.validTo} (Extended)</span>
                                    <span>1 Month</span>
                                  </div>
                                  <div className="flex justify-between text-slate-500 text-[11px] pl-3">
                                    <span>Taxes (GST/Composite Scheme)</span>
                                    <span>₹0.00 (Included)</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                                    <span>Total Cash Received:</span>
                                    <span className="text-emerald-700 font-mono text-sm">{settings.currencySymbol}{payment.amount.toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Subscriber & Terminal Dossier */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1 text-[11px]">
                                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Terminal Data</div>
                                  <div>Subscriber: <strong className="text-slate-900">{customer.name}</strong></div>
                                  <div>ID: <span className="font-mono">{customer.subscriberId}</span></div>
                                  <div>Activation No: <span className="font-mono font-bold text-emerald-800">{customer.activationNumber || 'N/A'}</span></div>
                                  <div>Cashier: <span>{payment.collectedBy}</span></div>
                                  <div>Payment Mode: <strong className="text-emerald-700">CASH</strong></div>
                                  {payment.notes && <div className="italic text-slate-500 mt-1">Note: {payment.notes}</div>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
