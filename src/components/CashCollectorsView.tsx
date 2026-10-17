import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MapPin, 
  Target, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Send, 
  Search, 
  TrendingUp, 
  Receipt,
  UserCheck,
  Check,
  X,
  FileText
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { OperatorUser, OperatorRole } from '../types/isp';
import { createCollectorInviteWhatsAppUrl, createOtpWhatsAppUrl } from '../utils/whatsapp';

export const CashCollectorsView: React.FC = () => {
  const { 
    operators, 
    addOperator, 
    updateOperator, 
    deleteOperator, 
    sendOtpToOperator,
    currentUser, 
    isAdmin, 
    settings,
    payments,
    openCashierStatement
  } = useISP();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Notice states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<{ url: string; name: string; phone: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<OperatorRole>('collector');
  const [formArea, setFormArea] = useState('');
  const [formTarget, setFormTarget] = useState('15000');
  const [formAgency, setFormAgency] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormRole('collector');
    setFormArea('');
    setFormTarget('15000');
    setFormAgency('');
    setFormStatus('active');
    setFormError(null);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (op: OperatorUser) => {
    setEditingId(op.id);
    setFormName(op.name);
    setFormPhone(op.phone);
    setFormRole(op.role || 'collector');
    setFormArea(op.assignedArea || '');
    setFormTarget(op.dailyTarget ? String(op.dailyTarget) : '15000');
    setFormAgency(op.agency || '');
    setFormStatus(op.status || 'active');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveCollector = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Please enter the collector full name');
      return;
    }

    const cleanDigits = formPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile phone number');
      return;
    }

    if (editingId) {
      // Update existing collector
      updateOperator(editingId, {
        name: cleanName,
        phone: cleanDigits,
        role: formRole,
        assignedArea: formArea.trim() || undefined,
        dailyTarget: Number(formTarget) || 0,
        agency: formAgency.trim() || undefined,
        status: formStatus
      });

      setSuccessMessage(`Cash Collector "${cleanName}" details updated successfully!`);
      setIsFormOpen(false);
      resetForm();
    } else {
      // Check if phone already registered
      const existing = operators.find(op => op.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)));
      if (existing) {
        setFormError(`An operator with phone number +91 ${cleanDigits} already exists (${existing.name}).`);
        return;
      }

      // Add new operator
      const created = addOperator({
        name: cleanName,
        phone: cleanDigits,
        role: formRole,
        assignedArea: formArea.trim() || 'General Field Area',
        dailyTarget: Number(formTarget) || 15000,
        agency: formAgency.trim() || settings.ispName || 'VinsNetBill Field Desk',
        status: formStatus,
        pin: '1234'
      });

      // Prepare WhatsApp invite URL
      const inviteUrl = createCollectorInviteWhatsAppUrl(cleanDigits, cleanName, settings.ispName, formArea.trim());
      setLastInviteUrl({
        url: inviteUrl,
        name: cleanName,
        phone: cleanDigits
      });

      setSuccessMessage(`Cash Collector "${cleanName}" created successfully!`);
      setIsFormOpen(false);
      resetForm();
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove Cash Collector "${name}"? They will no longer be able to log in.`)) {
      deleteOperator(id);
      setSuccessMessage(`Cash Collector "${name}" removed.`);
    }
  };

  const handleSendWhatsAppInvite = (op: OperatorUser) => {
    const inviteUrl = createCollectorInviteWhatsAppUrl(op.phone, op.name, settings.ispName, op.assignedArea);
    window.open(inviteUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendWhatsAppOtp = (op: OperatorUser) => {
    const res = sendOtpToOperator(op.phone, op.name);
    const otpUrl = createOtpWhatsAppUrl(res.phone, res.otp, settings.ispName);
    window.open(otpUrl, '_blank', 'noopener,noreferrer');
    setSuccessMessage(`WhatsApp OTP message opened for ${op.name} (+91 ${res.phone}).`);
  };

  // Filtered operators (exclude master admin from list or show with distinct badge)
  const collectorsList = operators.filter(op => {
    if (statusFilter !== 'all' && (op.status || 'active') !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = op.name.toLowerCase().includes(q);
      const matchPhone = op.phone.includes(q);
      const matchArea = (op.assignedArea || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchArea;
    }
    return true;
  });

  // Calculate today's collections per collector
  const todayDateStr = new Date().toISOString().split('T')[0];
  const getTodayCollectedBy = (name: string) => {
    return payments
      .filter(p => p.date.startsWith(todayDateStr) && p.collectedBy?.toLowerCase().includes(name.toLowerCase()))
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const totalCollectors = operators.filter(op => op.role !== 'admin').length;
  const activeCount = operators.filter(op => op.role !== 'admin' && (op.status || 'active') === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Field Workforce Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cash Collectors & Field Agents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Register your cash collectors with mobile numbers, assign field zones, set collection targets, and dispatch login OTPs directly to their WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => openCashierStatement()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
            title="Generate custom date range statement for any individual cashier"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Custom Date Statement</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Cash Collector</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-0.5 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Direct WhatsApp Invite Banner after creating collector */}
      {lastInviteUrl && (
        <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl shadow-lg border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Send WhatsApp Welcome Invite to {lastInviteUrl.name}
              </h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Ready to dispatch welcome credentials and login access to +91 {lastInviteUrl.phone}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <a
              href={lastInviteUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open WhatsApp Message</span>
            </a>
            <button
              onClick={() => setLastInviteUrl(null)}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Collectors</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalCollectors}</div>
          <span className="text-[11px] text-slate-400">Registered staff</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Active on Duty</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{activeCount}</div>
          <span className="text-[11px] text-emerald-700/80 font-medium">Ready for collections</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Field Collection Desk</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {settings.currencySymbol}
            {payments
              .filter(p => p.date.startsWith(todayDateStr))
              .reduce((sum, p) => sum + p.amount, 0)
              .toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">Collected today</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">WhatsApp OTPs</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-emerald-700">Direct Link</span>
          </div>
          <span className="text-[11px] text-slate-400">wa.me integrated</span>
        </div>
      </div>

      {/* Create / Edit Cash Collector Form (Collapsible/Modal) */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-xl relative animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? 'Edit Cash Collector Details' : 'Create New Cash Collector Form'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingId ? 'Update collector profile and assigned area' : 'Add a new authorized cash receiver with phone number and OTP access'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveCollector} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collector Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone Number (+91) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used for WhatsApp OTP login verification
                </span>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Role *
                </label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as OperatorRole)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="collector">Cash Collector (Field Collection Agent)</option>
                  <option value="cashier">Cashier Desk (Counter Operator)</option>
                  <option value="field_agent">Field Technician / Collector</option>
                </select>
              </div>

              {/* Assigned Area / Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Area / Zone / Route
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Sector 14, Indiranagar, North Block"
                    value={formArea}
                    onChange={e => setFormArea(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Daily Collection Target */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Collection Target ({settings.currencySymbol})
                </label>
                <div className="relative">
                  <Target className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    placeholder="15000"
                    value={formTarget}
                    onChange={e => setFormTarget(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active (Can collect cash & print receipts)</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Create & Register Collector'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Section Header & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, or assigned area..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Collectors List */}
        <div className="divide-y divide-slate-100">
          {collectorsList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No cash collectors found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No collectors matching your search filter.' : 'Click "Create Cash Collector" above to add your first field collection agent.'}
              </p>
            </div>
          ) : (
            collectorsList.map(op => {
              const isOpAdmin = op.role === 'admin';
              const todayCollected = getTodayCollectedBy(op.name);
              const target = op.dailyTarget || 15000;
              const progressPct = Math.min(100, Math.round((todayCollected / target) * 100));

              return (
                <div key={op.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                      isOpAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}>
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{op.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isOpAdmin 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOpAdmin ? 'Administrator' : 'Cash Collector'}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          (op.status || 'active') === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {(op.status || 'active') === 'active' ? '● Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-sans">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          +91 {op.phone}
                        </span>
                        {op.assignedArea && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {op.assignedArea}
                          </span>
                        )}
                        {op.agency && (
                          <span className="text-slate-400">· {op.agency}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Collection Progress (for field collectors) */}
                  {!isOpAdmin && (
                    <div className="md:w-56 shrink-0 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Today's Cash:</span>
                        <span className="font-bold font-mono text-slate-900">
                          {settings.currencySymbol}{todayCollected.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>Target: {settings.currencySymbol}{target.toLocaleString()}</span>
                        <span>{progressPct}%</span>
                      </div>
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Send WhatsApp Invite */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppInvite(op)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                      title="Send WhatsApp Welcome & Login Invite"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Invite</span>
                    </button>

                    {/* Send OTP via WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppOtp(op)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                      title="Generate and send login OTP via WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send OTP</span>
                    </button>

                    {/* View Custom Date Cash Collection Statement */}
                    <button
                      type="button"
                      onClick={() => openCashierStatement(op.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                      title="View custom date cash collection statement for this cashier"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Statement</span>
                    </button>

                    {/* Edit */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleEdit(op)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit collector details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete (prevent deleting self) */}
                    {isAdmin && currentUser?.id !== op.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(op.id, op.name)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete collector"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
