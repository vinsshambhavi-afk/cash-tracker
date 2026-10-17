import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  HandCoins, 
  BellRing, 
  Filter, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Wifi, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  ReceiptText,
  Lock,
  ShieldCheck,
  Database
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { Customer, SubscriberStatus, ConnectionType } from '../types/isp';
import { createWhatsAppUrl, generateReminderMessage } from '../utils/whatsapp';

export const SubscribersView: React.FC = () => {
  const { 
    customers, 
    settings, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    openReceiveCash, 
    logReminderSent, 
    openImportModal,
    viewSubscriberReceipts,
    isAdmin,
    isCashier,
    switchRole,
    roleRestrictionToast,
    showRoleRestrictionNotice,
    clearRoleRestrictionNotice,
    openClearSubscribers,
    openAdminAuthModal,
    openImportDatabase
  } = useISP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for Add/Edit
  const [formData, setFormData] = useState<{
    subscriberId: string;
    activationNumber: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    area: string;
    planName: string;
    speedMbps: number;
    monthlyFee: number;
    billingDay: number;
    expiryDate: string;
    status: SubscriberStatus;
    connectionType: ConnectionType;
    ipAddress: string;
    balance: number;
  }>({
    subscriberId: '',
    activationNumber: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    planName: 'Fiber 100 Mbps',
    speedMbps: 100,
    monthlyFee: 699,
    billingDay: 1,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    connectionType: 'FTTH',
    ipAddress: '',
    balance: 0
  });

  const areas = Array.from(new Set(customers.map(c => c.area))).filter(Boolean);

  const filteredCustomers = customers.filter(customer => {
    if (statusFilter !== 'all' && customer.status !== statusFilter) return false;
    if (areaFilter !== 'all' && customer.area !== areaFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.phone.includes(q) ||
        customer.subscriberId.toLowerCase().includes(q) ||
        (customer.activationNumber && customer.activationNumber.toLowerCase().includes(q)) ||
        customer.area.toLowerCase().includes(q) ||
        customer.planName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) {
      showRoleRestrictionNotice('Add New Subscriber');
      return;
    }
    const nextSubId = `OPT-2026-${100 + customers.length + 1}`;
    const nextActNo = `ACT-${Math.floor(10000 + Math.random() * 90000)}-FTTH`;
    setFormData({
      subscriberId: nextSubId,
      activationNumber: nextActNo,
      name: '',
      phone: '',
      email: '',
      address: '',
      area: 'Sector 14',
      planName: 'Fiber 100 Mbps',
      speedMbps: 100,
      monthlyFee: 699,
      billingDay: 1,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      connectionType: 'FTTH',
      ipAddress: `192.168.10.${110 + customers.length}`,
      balance: 0
    });
    setEditingCustomer(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    if (!isAdmin) {
      showRoleRestrictionNotice(`Edit Subscriber (${customer.name})`);
      return;
    }
    setEditingCustomer(customer);
    setFormData({
      subscriberId: customer.subscriberId,
      activationNumber: customer.activationNumber || `ACT-${Math.floor(10000 + Math.random() * 90000)}-FTTH`,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address,
      area: customer.area,
      planName: customer.planName,
      speedMbps: customer.speedMbps,
      monthlyFee: customer.monthlyFee,
      billingDay: customer.billingDay,
      expiryDate: customer.expiryDate,
      status: customer.status,
      connectionType: customer.connectionType,
      ipAddress: customer.ipAddress || '',
      balance: customer.balance
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showRoleRestrictionNotice(editingCustomer ? 'Update Subscriber' : 'Create Subscriber');
      return;
    }
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        ...formData,
      });
    } else {
      addCustomer({
        ...formData,
      });
    }

    setIsAddModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) {
      showRoleRestrictionNotice(`Delete Subscriber (${name})`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete subscriber ${name}?`)) {
      deleteCustomer(id);
    }
  };

  const handleQuickReminder = (customer: Customer) => {
    const message = generateReminderMessage(customer, settings, 'due_today');
    logReminderSent(customer.id, 'due_today', message);
    const url = createWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Role Notice Banner */}
      {!isAdmin ? (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">Cashier / Collector Role Active</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 font-bold px-2 py-0.5 rounded">
                  View & Print Receipts Only
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Subscriber records are in read-only mode. You can collect payments, view account status, and print 80mm thermal receipts. Editing or deleting subscribers requires Admin privileges.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAdminAuthModal()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enter Admin PIN (Full Access)</span>
          </button>
        </div>
      ) : (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-indigo-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
            <span className="font-semibold text-slate-900">Admin Mode Active:</span>
            <span className="text-slate-600">Full administrative access to add, edit, and delete subscribers</span>
          </div>
          <button
            onClick={() => switchRole('cashier')}
            className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold underline underline-offset-2 transition-colors"
          >
            Switch to Cashier / Collector
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Subscribers Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage broadband accounts, connection speeds, monthly billing days, and renewal statuses
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {/* Clear All Subscribers Button */}
          {customers.length > 0 && (
            <button
              onClick={() => {
                if (!isAdmin) {
                  showRoleRestrictionNotice('Clear All Subscribers');
                  return;
                }
                openClearSubscribers();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors ${
                isAdmin
                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 hover:bg-slate-200/60'
              }`}
              title={isAdmin ? "Wipe all subscribers so you can start with a clean slate to add your own" : "Admin privileges required to clear subscribers"}
            >
              {isAdmin ? <Trash2 className="w-3.5 h-3.5 text-rose-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span>Clear All Subscribers</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!isAdmin) {
                showRoleRestrictionNotice('Import Subscribers');
                return;
              }
              openImportModal();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors ${
              isAdmin
                ? 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-300'
                : 'text-slate-400 bg-slate-100 border border-slate-200 hover:bg-slate-200/60'
            }`}
            title={isAdmin ? "Import Existing Subscribers" : "Admin role required to import subscribers (Click to see options)"}
          >
            {isAdmin ? <Upload className="w-4 h-4 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            <span>Import CSV</span>
            {!isAdmin && <span className="text-[10px] text-slate-400 font-normal">Admin</span>}
          </button>

          <button
            onClick={() => {
              if (!isAdmin) {
                showRoleRestrictionNotice('Import Entire Database');
                return;
              }
              openImportDatabase();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors ${
              isAdmin
                ? 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                : 'text-slate-400 bg-slate-100 border border-slate-200 hover:bg-slate-200/60'
            }`}
            title={isAdmin ? "Import Entire Database JSON (Subscribers, Payments, Staff & Settings)" : "Admin role required to import entire database"}
          >
            {isAdmin ? <Database className="w-4 h-4 text-indigo-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            <span>Import Entire Database</span>
            {!isAdmin && <span className="text-[10px] text-slate-400 font-normal">Admin</span>}
          </button>

          <button
            onClick={() => {
              if (!isAdmin) {
                showRoleRestrictionNotice('Add New Subscriber');
                return;
              }
              handleOpenAdd();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap ${
              isAdmin
                ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : 'text-slate-400 bg-slate-200 hover:bg-slate-300 border border-slate-300'
            }`}
            title={isAdmin ? "Add New Subscriber" : "Admin role required to add subscribers (Click to see options)"}
          >
            {isAdmin ? <Plus className="w-4 h-4 stroke-[2.5]" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            <span>Add New Subscriber</span>
            {!isAdmin && <span className="text-[10px] bg-slate-300 text-slate-600 px-1.5 py-0.2 rounded font-normal">Admin</span>}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, phone, subscriber ID, area..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Statuses ({customers.length})</option>
              <option value="active">Active</option>
              <option value="due_today">Due Today</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Area:</span>
            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Areas</option>
              {areas.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subscribers Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>Total {filteredCustomers.length} subscribers matched</span>
          <span className="font-mono">Quick collection or reminder from row</span>
        </div>

        {customers.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Subscriber Directory is Clean!</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All sample subscribers have been cleared. You are ready to create your own broadband subscribers one-by-one or import from a file.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (!isAdmin) {
                    showRoleRestrictionNotice('Add New Subscriber');
                    return;
                  }
                  handleOpenAdd();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Create First Subscriber</span>
              </button>
              <button
                onClick={() => {
                  if (!isAdmin) {
                    showRoleRestrictionNotice('Import Subscribers');
                    return;
                  }
                  openImportModal();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Import from Excel / CSV</span>
              </button>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No subscribers found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filters or adding a new subscriber</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Subscriber</th>
                  <th className="py-3 px-4">Contact & Area</th>
                  <th className="py-3 px-4">Plan & Speed</th>
                  <th className="py-3 px-4 text-right">Monthly Fee</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => {
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{customer.name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
                          <span className="text-emerald-700 font-semibold">{customer.subscriberId}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 font-medium">{customer.activationNumber || 'No Act No'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-mono text-slate-900">{customer.phone}</div>
                        <div className="text-[11px] text-slate-500">{customer.area} · {customer.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{customer.planName}</div>
                        <div className="text-[11px] text-slate-500">
                          {customer.speedMbps} Mbps · {customer.connectionType}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {settings.currencySymbol}{customer.monthlyFee}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 tabular-nums">
                        {customer.expiryDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {customer.status === 'active' && (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Active
                          </span>
                        )}
                        {customer.status === 'due_today' && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Due Today
                          </span>
                        )}
                        {customer.status === 'due_soon' && (
                          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Expiring Soon
                          </span>
                        )}
                        {customer.status === 'overdue' && (
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Overdue
                          </span>
                        )}
                        {customer.status === 'suspended' && (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openReceiveCash(customer.id)}
                            title="Collect Cash"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <HandCoins className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => viewSubscriberReceipts(customer.id)}
                            title="View Receipt History & 80mm Thermal Slips"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <ReceiptText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickReminder(customer)}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <BellRing className="w-4 h-4" />
                          </button>

                          {/* Edit: Full access for Admin, restricted prompt for Cashier */}
                          <button
                            onClick={() => {
                              if (!isAdmin) {
                                showRoleRestrictionNotice(`Edit Subscriber "${customer.name}"`);
                                return;
                              }
                              handleOpenEdit(customer);
                            }}
                            title={isAdmin ? "Edit Subscriber" : "Admin role required to edit subscriber (Click to switch)"}
                            className={`p-1.5 rounded transition-colors ${
                              isAdmin
                                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 cursor-not-allowed'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete: Full access for Admin, restricted prompt for Cashier */}
                          <button
                            onClick={() => {
                              if (!isAdmin) {
                                showRoleRestrictionNotice(`Delete Subscriber "${customer.name}"`);
                                return;
                              }
                              handleDelete(customer.id, customer.name);
                            }}
                            title={isAdmin ? "Delete Subscriber" : "Admin role required to delete subscriber (Click to switch)"}
                            className={`p-1.5 rounded transition-colors ${
                              isAdmin
                                ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                                : 'text-slate-300 hover:text-rose-300 hover:bg-rose-50/50 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Subscriber Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Edit Subscriber' : 'Add New Broadband Subscriber'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subscriber ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subscriberId}
                    onChange={e => setFormData({ ...formData, subscriberId: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activation Number (CAF / ONT Serial) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACT-49102-FTTH"
                    value={formData.activationNumber}
                    onChange={e => setFormData({ ...formData, activationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-semibold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Area / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sector 14, Downtown, etc."
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Installation Address
                  </label>
                  <input
                    type="text"
                    placeholder="Flat / House #, Building, Street"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.planName}
                    onChange={e => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Speed (Mbps) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.speedMbps}
                    onChange={e => setFormData({ ...formData, speedMbps: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Fee ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyFee}
                    onChange={e => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry / Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Connection Type
                  </label>
                  <select
                    value={formData.connectionType}
                    onChange={e => setFormData({ ...formData, connectionType: e.target.value as ConnectionType })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="FTTH">FTTH (Fiber to the Home)</option>
                    <option value="Fiber">Fiber Optical</option>
                    <option value="Wireless">Wireless / AirFiber</option>
                    <option value="Coaxial">Coaxial Cable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as SubscriberStatus })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="due_today">Due Today</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="overdue">Overdue</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                >
                  {editingCustomer ? 'Update Subscriber' : 'Create Subscriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Restriction Notice Modal */}
      {roleRestrictionToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900">
                    Administrator Privileges Required
                  </h3>
                  <div className="mt-1.5 p-2.5 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                    {roleRestrictionToast}
                  </div>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    You are currently in <strong>Cashier / Collector</strong> mode. This role allows viewing subscribers, collecting cash payments, and generating/printing 80mm thermal receipts only.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={clearRoleRestrictionNotice}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Keep Cashier Role
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearRoleRestrictionNotice();
                    openAdminAuthModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Enter Admin PIN & Unlock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
