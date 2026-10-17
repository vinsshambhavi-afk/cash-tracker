import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  MessageSquare, 
  Building, 
  CreditCard, 
  Check, 
  Download, 
  Sparkles, 
  Phone, 
  FileText,
  Users,
  KeyRound,
  Trash2,
  ShieldCheck,
  Send,
  UserCheck,
  ArrowRight,
  Database,
  Upload
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { DEFAULT_TEMPLATES } from '../utils/whatsapp';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDemoData, 
    customers, 
    payments,
    currentUser,
    operators,
    setAdminProfile,
    openClearSubscribers,
    clearAllPayments,
    isAdmin,
    setCurrentTab,
    openImportDatabase
  } = useISP();

  const [formData, setFormData] = useState(settings);
  const [adminNameInput, setAdminNameInput] = useState(currentUser?.name || (settings.activeCashier ? settings.activeCashier.replace(/\s*\(Admin\)/i, '') : 'Rajesh Kumar'));
  const [adminPhoneInput, setAdminPhoneInput] = useState(currentUser?.phone || (settings.phone ? settings.phone.replace(/\D/g, '') : '9876512340'));
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    'cashReceipt' | 'dueTodayReminder' | 'upcomingReminder' | 'overdueReminder' | 'suspensionReminder'
  >('cashReceipt');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminNameInput.trim()) {
      setAdminProfile(adminNameInput.trim(), adminPhoneInput.trim());
    }
    updateSettings({
      ...formData,
      activeCashier: `${adminNameInput.trim()} (Admin)`,
      phone: adminPhoneInput.trim() || formData.phone
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const insertVariable = (tag: string) => {
    const currentTemplate = formData.templates[activeTemplateTab];
    const newTemplate = currentTemplate + ` {{${tag}}}`;
    setFormData({
      ...formData,
      templates: {
        ...formData.templates,
        [activeTemplateTab]: newTemplate
      }
    });
  };

  const handleResetTemplate = () => {
    setFormData({
      ...formData,
      templates: {
        ...formData.templates,
        [activeTemplateTab]: DEFAULT_TEMPLATES[activeTemplateTab]
      }
    });
  };

  const handleExportAllJSON = () => {
    const backup = {
      settings: formData,
      customers,
      payments,
      operators,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vinsnetbill_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const availableTags = [
    'customer_name',
    'subscriber_id',
    'activation_number',
    'amount',
    'currency',
    'receipt_no',
    'payment_method',
    'payment_date',
    'valid_to',
    'due_date',
    'plan_name',
    'speed',
    'balance',
    'collected_by',
    'isp_name',
    'support_phone',
    'upi_id'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-600" />
            System Settings & Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your ISP business information, Administrator identity, and customize WhatsApp message templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedFeedback && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Changes Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business Profile, Cash Receivers & Data (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Administrator Profile Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-200/80 rounded-xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Administrator Profile</h3>
                <p className="text-[11px] text-slate-500">Configure your custom Admin name and mobile number</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrator Name *
                </label>
                <input
                  type="text"
                  value={adminNameInput}
                  onChange={e => setAdminNameInput(e.target.value)}
                  placeholder="Enter your Admin name (e.g. Rajesh Kumar)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Displayed on receipts, bills, and terminal header.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Admin Login Mobile Phone *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    value={adminPhoneInput}
                    onChange={e => setAdminPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 12340"
                    className="w-full pl-11 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cash Collectors & Field Staff Card */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-200/80 rounded-xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cash Collectors & Staff</h3>
                  <p className="text-[11px] text-slate-500">
                    {operators.filter(op => op.role !== 'admin').length} registered field agents
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('collectors')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
              >
                <span>Create & Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Register cash collectors with mobile numbers, assign field zones & collection routes, and dispatch instant login OTPs directly to their WhatsApp.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-emerald-600" />
              ISP Business Profile & Admin PIN
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ISP / Cable Network Name *
                </label>
                <input
                  type="text"
                  value={formData.ispName}
                  onChange={e => setFormData({ ...formData, ispName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Support Helpline *
                  </label>
                  <input
                    type="text"
                    value={formData.supportPhone}
                    onChange={e => setFormData({ ...formData, supportPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currencySymbol}
                    onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Master Admin Security PIN */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-1">
                <label className="block font-semibold text-indigo-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Master Administrator PIN *</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-normal">Used to authorize Admin actions</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.adminPin || '1234'}
                  onChange={e => setFormData({ ...formData, adminPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234"
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold tracking-widest text-indigo-950"
                />
                <span className="text-[10px] text-slate-500 block">
                  Required when switching from Cashier to Admin role.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Active Cashier / Collector Desk Label
                </label>
                <input
                  type="text"
                  value={formData.activeCashier}
                  onChange={e => setFormData({ ...formData, activeCashier: e.target.value })}
                  placeholder="e.g. Suresh (Counter 1)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  UPI ID (VPA) for Reminders
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GST / Tax Registration Number
                </label>
                <input
                  type="text"
                  value={formData.gstOrTaxNo}
                  onChange={e => setFormData({ ...formData, gstOrTaxNo: e.target.value })}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Address (Printed on Receipts)
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Clean Slate & Data Management */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Clean Slate & Data Operations
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <button
                type="button"
                onClick={openClearSubscribers}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/70 hover:bg-rose-100 font-semibold transition-colors"
                title="Wipe all subscribers so you can create your own subscribers"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Subscribers (Clean Slate)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete all recorded cash collections and receipts?')) {
                    clearAllPayments();
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear Payment Collection History</span>
              </button>

              <button
                type="button"
                onClick={openImportDatabase}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-bold transition-colors shadow-2xs"
                title="Restore or merge database from a JSON backup file"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Import Entire Database (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleExportAllJSON}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Backup Entire Database (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Restore default sample subscribers, payments and settings?')) {
                    resetToDemoData();
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Restore Sample Demo Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: WhatsApp Templates Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  WhatsApp Message Templates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format the exact text dispatched for cash receipts and reminders
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetTemplate}
                className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
              >
                Reset This Template
              </button>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTemplateTab('cashReceipt')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTemplateTab === 'cashReceipt'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🧾 Cash Received Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('dueTodayReminder')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTemplateTab === 'dueTodayReminder'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚡ Due Today
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('upcomingReminder')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTemplateTab === 'upcomingReminder'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📅 Upcoming (3 Days)
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('overdueReminder')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTemplateTab === 'overdueReminder'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚠️ Overdue Warning
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('suspensionReminder')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTemplateTab === 'suspensionReminder'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🛑 Suspension Notice
              </button>
            </div>

            {/* Variable Tag Helper Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-600">
                Click to insert dynamic variable tag into message:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertVariable(tag)}
                    className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded border border-slate-200 transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Editor Box */}
            <div>
              <textarea
                rows={14}
                value={formData.templates[activeTemplateTab]}
                onChange={e =>
                  setFormData({
                    ...formData,
                    templates: {
                      ...formData.templates,
                      [activeTemplateTab]: e.target.value
                    }
                  })
                }
                className="w-full font-mono text-xs leading-relaxed p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Supports WhatsApp markdown: *bold*, _italics_, ~strikethrough~</span>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
              >
                Save Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
