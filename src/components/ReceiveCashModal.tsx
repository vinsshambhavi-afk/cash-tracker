import React, { useState, useEffect } from 'react';
import { X, Search, Check, Calendar, Banknote, QrCode, Building, CreditCard, AlertCircle } from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { PaymentMethod } from '../types/isp';

export const ReceiveCashModal: React.FC = () => {
  const {
    isReceiveCashOpen,
    closeReceiveCash,
    customers,
    preselectedCustomerId,
    settings,
    recordPayment,
  } = useISP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validTo, setValidTo] = useState<string>('');
  const [collectedBy, setCollectedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize selected customer and fields when modal opens
  useEffect(() => {
    if (!isReceiveCashOpen) return;

    setCollectedBy(settings.activeCashier);
    setError(null);
    setNotes('');

    const targetId = preselectedCustomerId || (customers.length > 0 ? customers[0].id : '');
    setSelectedCustomerId(targetId);
  }, [isReceiveCashOpen, preselectedCustomerId, settings.activeCashier, customers]);

  // When selectedCustomerId changes, calculate dates and amounts
  useEffect(() => {
    if (!selectedCustomerId) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    // Determine start date
    // If expired, renewal starts today, otherwise continues from current expiry
    const today = new Date().toISOString().split('T')[0];
    const customerExpiry = customer.expiryDate;
    const startDate = customerExpiry && customerExpiry > today ? customerExpiry : today;
    setValidFrom(startDate);

    // Calculate end date based on durationMonths
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + durationMonths);
    setValidTo(end.toISOString().split('T')[0]);

    // Amount = monthly fee * duration
    setAmount(customer.monthlyFee * durationMonths);
  }, [selectedCustomerId, durationMonths, customers]);

  if (!isReceiveCashOpen) return null;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filtered customer list for search
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.subscriberId.toLowerCase().includes(q) ||
      (c.activationNumber && c.activationNumber.toLowerCase().includes(q)) ||
      c.area.toLowerCase().includes(q)
    );
  });

  const handleDurationChange = (months: number) => {
    setDurationMonths(months);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCustomer) {
      setError('Please select a subscriber');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    try {
      recordPayment({
        customerId: selectedCustomerId,
        amount: Number(amount),
        method,
        validFrom,
        validTo,
        notes: notes.trim(),
        collectedBy: collectedBy.trim() || settings.activeCashier,
      });
      // Context will close this modal and open WhatsAppReceiptModal
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Receive Cash / Subscription Payment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record receipt, advance subscriber validity, and generate WhatsApp confirmation
            </p>
          </div>
          <button
            onClick={closeReceiveCash}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Subscriber Selector / Search */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Subscriber *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, phone, subscriber ID, or area..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Quick search suggestions if query exists */}
            {searchQuery && (
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-sm">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">No matching subscribers found</div>
                ) : (
                  filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setSearchQuery('');
                      }}
                      className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        c.id === selectedCustomerId ? 'bg-emerald-50/70 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="text-slate-900 font-medium">
                          {c.name} <span className="text-slate-400 font-mono">({c.subscriberId})</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {c.phone} · <span className="font-mono text-emerald-700">{c.activationNumber || 'No Act No'}</span> · {c.area}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-semibold text-slate-900">{settings.currencySymbol}{c.monthlyFee}</span>
                        <div className="text-[10px] text-slate-500">Exp: {c.expiryDate}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Customer Card */}
          {selectedCustomer && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-emerald-700 font-medium">{selectedCustomer.subscriberId}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-600">Act: {selectedCustomer.activationNumber || 'N/A'}</span>
                    <span>·</span>
                    <span>{selectedCustomer.phone}</span>
                    <span>·</span>
                    <span>{selectedCustomer.area}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500">Monthly Plan</span>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {settings.currencySymbol}{selectedCustomer.monthlyFee}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span>Speed: <strong className="text-slate-900">{selectedCustomer.speedMbps} Mbps</strong> ({selectedCustomer.connectionType})</span>
                <span>Current Expiry: <strong className="text-slate-900 tabular-nums">{selectedCustomer.expiryDate}</strong></span>
              </div>
            </div>
          )}

          {/* Payment Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recharge Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 6].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => handleDurationChange(m)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    durationMonths === m
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m} {m === 1 ? 'Month' : 'Months'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Cash', 'UPI', 'Bank Transfer', 'Card'] as PaymentMethod[]).map(m => {
                const isSelected = method === m;
                const isCash = m === 'Cash';
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? isCash 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                          : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m === 'Cash' && <Banknote className="w-4 h-4" />}
                    {m === 'UPI' && <QrCode className="w-4 h-4" />}
                    {m === 'Bank Transfer' && <Building className="w-4 h-4" />}
                    {m === 'Card' && <CreditCard className="w-4 h-4" />}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial Breakdown & Date Extensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Received ({settings.currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-500">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Collected By (Agent / Desk)
              </label>
              <input
                type="text"
                value={collectedBy}
                onChange={e => setCollectedBy(e.target.value)}
                placeholder="Cashier Name"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Validity Period Summary */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                New Validity Extension: <strong className="font-semibold">{validFrom}</strong> to <strong className="font-semibold text-emerald-800">{validTo}</strong>
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
              +{durationMonths * 30} Days
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Receipt Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received at door, customer requested evening collection, etc."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={closeReceiveCash}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Record & Open WhatsApp Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
