import React, { useState } from 'react';
import { 
  BellRing, 
  Search, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Filter, 
  HandCoins, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { Customer } from '../types/isp';
import { createWhatsAppUrl, generateReminderMessage } from '../utils/whatsapp';

type FilterTab = 'all' | 'due_today' | 'due_soon' | 'overdue' | 'suspended';

export const MonthlyRemindersView: React.FC = () => {
  const { customers, settings, logReminderSent, openReceiveCash } = useISP();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('due_today');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);

  // Queue Assistant State
  const [isQueueActive, setIsQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  // Distinct areas for filter dropdown
  const areas = Array.from(new Set(customers.map(c => c.area))).filter(Boolean);

  // Classify customers by renewal urgency
  const getCustomerCategory = (c: Customer): 'due_today' | 'due_soon' | 'overdue' | 'suspended' | 'active' => {
    const today = new Date().toISOString().split('T')[0];
    const expiry = c.expiryDate;

    if (!expiry) return 'active';
    if (c.status === 'suspended') return 'suspended';
    if (expiry < today) return 'overdue';
    if (expiry === today) return 'due_today';

    const diffDays = Math.ceil(
      (new Date(expiry).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 3) return 'due_soon';
    return 'active';
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(customer => {
    const category = getCustomerCategory(customer);

    // Tab filter
    if (activeFilter === 'due_today' && category !== 'due_today') return false;
    if (activeFilter === 'due_soon' && category !== 'due_soon') return false;
    if (activeFilter === 'overdue' && category !== 'overdue') return false;
    if (activeFilter === 'suspended' && category !== 'suspended') return false;
    if (activeFilter === 'all' && category === 'active') return false; // Show only customers needing renewal

    // Area filter
    if (selectedArea !== 'all' && customer.area !== selectedArea) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = customer.name.toLowerCase().includes(q);
      const matchPhone = customer.phone.includes(q);
      const matchId = customer.subscriberId.toLowerCase().includes(q);
      const matchActivation = customer.activationNumber && customer.activationNumber.toLowerCase().includes(q);
      const matchArea = customer.area.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId && !matchActivation && !matchArea) return false;
    }

    return true;
  });

  // Urgency Counts
  const counts = {
    due_today: customers.filter(c => getCustomerCategory(c) === 'due_today').length,
    due_soon: customers.filter(c => getCustomerCategory(c) === 'due_soon').length,
    overdue: customers.filter(c => getCustomerCategory(c) === 'overdue').length,
    suspended: customers.filter(c => getCustomerCategory(c) === 'suspended').length,
    all_pending: customers.filter(c => getCustomerCategory(c) !== 'active').length,
  };

  const determineReminderType = (c: Customer): 'upcoming' | 'due_today' | 'overdue' | 'suspension' => {
    const cat = getCustomerCategory(c);
    if (cat === 'due_today') return 'due_today';
    if (cat === 'due_soon') return 'upcoming';
    if (cat === 'overdue') return 'overdue';
    if (cat === 'suspended') return 'suspension';
    return 'due_today';
  };

  const handleSendReminder = (customer: Customer) => {
    const reminderType = determineReminderType(customer);
    const message = generateReminderMessage(customer, settings, reminderType);
    logReminderSent(customer.id, reminderType, message);

    const url = createWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async (customer: Customer) => {
    const reminderType = determineReminderType(customer);
    const message = generateReminderMessage(customer, settings, reminderType);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(customer.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Queue mode helpers
  const queueCustomers = filteredCustomers;
  const currentQueueCustomer = queueCustomers[queueIndex];

  const handleNextInQueue = () => {
    if (queueIndex < queueCustomers.length - 1) {
      setQueueIndex(queueIndex + 1);
    } else {
      setIsQueueActive(false);
      setQueueIndex(0);
    }
  };

  const handleSendAndAdvance = (customer: Customer) => {
    handleSendReminder(customer);
    handleNextInQueue();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-600" />
            Monthly Bill Reminders & Renewal WhatsApp Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Send targeted WhatsApp reminders for upcoming, due today, and overdue broadband subscriptions
          </p>
        </div>

        {filteredCustomers.length > 0 && !isQueueActive && (
          <button
            onClick={() => {
              setIsQueueActive(true);
              setQueueIndex(0);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Start Fast Reminder Dispatch ({filteredCustomers.length})</span>
          </button>
        )}
      </div>

      {/* Step-by-Step Queue Dispatch Assistant (when activated) */}
      {isQueueActive && currentQueueCustomer && (
        <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-lg border border-emerald-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-700 rounded-md">
                Queue {queueIndex + 1} of {queueCustomers.length}
              </span>
              <span className="text-xs text-emerald-200">Continuous Dispatch Mode</span>
            </div>
            <button
              onClick={() => setIsQueueActive(false)}
              className="text-xs text-emerald-300 hover:text-white underline underline-offset-2"
            >
              Exit Queue
            </button>
          </div>

          <div className="bg-emerald-950/60 rounded-lg p-4 border border-emerald-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <div className="text-base font-bold text-white">{currentQueueCustomer.name}</div>
              <div className="text-xs text-emerald-300 font-mono">
                {currentQueueCustomer.phone} · ID: {currentQueueCustomer.subscriberId}
              </div>
              <div className="text-xs text-emerald-400">
                {currentQueueCustomer.area} · {currentQueueCustomer.planName}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-emerald-300">Renewal Amount:</div>
              <div className="text-xl font-bold text-white tabular-nums">
                {settings.currencySymbol}{currentQueueCustomer.monthlyFee}
              </div>
              <div className="text-emerald-300">
                Expiry Date: <strong className="text-white">{currentQueueCustomer.expiryDate}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleNextInQueue}
                className="px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white border border-emerald-700 rounded-lg"
              >
                Skip
              </button>
              <button
                onClick={() => handleSendAndAdvance(currentQueueCustomer)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp & Next</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        {/* Urgency Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter('due_today')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'due_today'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due Today</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
              activeFilter === 'due_today' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {counts.due_today}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('due_soon')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'due_soon'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming (1-3 Days)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
              activeFilter === 'due_soon' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {counts.due_soon}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('overdue')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue Grace Period</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
              activeFilter === 'overdue' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {counts.overdue}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('suspended')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'suspended'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Suspension Warning</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
              activeFilter === 'suspended' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {counts.suspended}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Pending ({counts.all_pending})</span>
          </button>
        </div>

        {/* Secondary Filters: Area & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search subscribers by name, phone, subscriber ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Area:
            </span>
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white w-full sm:w-44"
            >
              <option value="all">All Service Areas</option>
              {areas.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Reminders Grid / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Clear! No Pending Reminders Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are no subscribers currently matching the "{activeFilter.replace('_', ' ')}" filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Showing {filteredCustomers.length} subscribers requiring renewal reminder</span>
            <span className="hidden sm:inline text-slate-400">1-click dispatches open WhatsApp with pre-composed text</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredCustomers.map(customer => {
              const category = getCustomerCategory(customer);
              const reminderType = determineReminderType(customer);
              const isCopied = copiedId === customer.id;

              return (
                <div 
                  key={customer.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Subscriber Information */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{customer.name}</span>
                      <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {customer.subscriberId}
                      </span>
                      {customer.activationNumber && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          Act: {customer.activationNumber}
                        </span>
                      )}
                      
                      {category === 'due_today' && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Due Today
                        </span>
                      )}
                      {category === 'due_soon' && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Expiring Soon
                        </span>
                      )}
                      {category === 'overdue' && (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Overdue
                        </span>
                      )}
                      {category === 'suspended' && (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          Suspended
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-mono text-slate-700">{customer.phone}</span>
                      <span>·</span>
                      <span>{customer.area}</span>
                      <span>·</span>
                      <span>{customer.planName} ({customer.speedMbps} Mbps)</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span>
                        Expiry Date: <strong className="font-mono text-slate-900 tabular-nums">{customer.expiryDate}</strong>
                      </span>
                      {customer.lastReminderSentAt && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                            <Check className="w-3 h-3" />
                            Reminded: {new Date(customer.lastReminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Due & Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right mr-2">
                      <span className="text-[11px] text-slate-500 font-medium block">Renewal Fee</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {settings.currencySymbol}{customer.monthlyFee}
                      </span>
                    </div>

                    {/* Preview Message Trigger */}
                    <button
                      onClick={() => setPreviewCustomer(customer)}
                      title="Preview WhatsApp text"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Copy Text Button */}
                    <button
                      onClick={() => handleCopyMessage(customer)}
                      title="Copy reminder text"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Quick Receive Cash (if paying now) */}
                    <button
                      onClick={() => openReceiveCash(customer.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                    >
                      <HandCoins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Collect Cash</span>
                    </button>

                    {/* 1-Click Send via WhatsApp */}
                    <button
                      onClick={() => handleSendReminder(customer)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA851] rounded-lg shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {previewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Reminder Preview for {previewCustomer.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">{previewCustomer.phone}</p>
              </div>
              <button
                onClick={() => setPreviewCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 bg-[#EFEAE2] overflow-y-auto max-h-96">
              <div className="bg-white p-3 rounded-lg shadow-xs border border-emerald-100/60 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                {generateReminderMessage(previewCustomer, settings, determineReminderType(previewCustomer))}
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewCustomer(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleSendReminder(previewCustomer);
                  setPreviewCustomer(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20BD5A] rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
