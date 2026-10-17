import React, { useState } from 'react';
import { 
  Wifi, 
  Plus, 
  ReceiptText, 
  BellRing, 
  Users, 
  HandCoins, 
  Settings as SettingsIcon, 
  BarChart3, 
  ChevronDown, 
  RefreshCw, 
  LogOut,
  ShieldCheck,
  Check,
  Receipt,
  UserCheck,
  Database
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { NavTab } from '../types/isp';

export type { NavTab };

interface HeaderProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { 
    openReceiveCash, 
    customers, 
    currentUser, 
    openLoginModal, 
    logout,
    isAdmin,
    openImportDatabase
  } = useISP();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Calculate urgent reminders count for indicator
  const todayDueCount = customers.filter(c => c.status === 'due_today' || c.status === 'overdue').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single Brand Wordmark & Logo */}
          <div 
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-slate-900/10 shadow-sm shrink-0 bg-slate-950 flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src="/vinsnetbill_logo.jpg" 
                alt="VinsNetBill Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap leading-tight flex items-center">
                <span>VinsNet</span><span className="text-emerald-600 font-black">Bill</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-0.5">
                ISP Platform
              </span>
            </div>
          </div>

          {/* Zone 2: 4-5 Clean single-line nav tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('collections')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'collections'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HandCoins className="w-4 h-4 text-slate-500" />
              <span>Cash Register</span>
            </button>

            <button
              onClick={() => setCurrentTab('reminders')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors relative ${
                currentTab === 'reminders'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BellRing className="w-4 h-4 text-slate-500" />
              <span>Reminders</span>
              {todayDueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] font-semibold bg-amber-500 text-white rounded-full tabular-nums">
                  {todayDueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('subscribers')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'subscribers'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Subscribers</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('collectors')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  currentTab === 'collectors'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Cash Collectors</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('receipts')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'receipts'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ReceiptText className="w-4 h-4 text-slate-500" />
              <span>Receipt History</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'settings'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Zone 3: Role Switcher Control + Profile Dropdown + Primary Action */}
          {/* Zone 3: Role Badge + Cash Receiver Management + Profile Dropdown + Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Authenticated Role Status Badge */}
            <div className="hidden sm:flex items-center gap-2">
              {isAdmin ? (
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200/90 text-indigo-950 text-xs font-semibold shadow-2xs"
                  title="Administrator privileges: Full access to add, edit, delete subscribers, settings & cash receivers"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                  <span>Admin</span>
                  <span className="text-[10px] bg-indigo-200/70 text-indigo-800 font-bold px-1.5 py-0.2 rounded">Master</span>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/90 text-emerald-950 text-xs font-semibold shadow-2xs"
                  title="Cashier / Collector privileges: Record payments and print thermal receipts only"
                >
                  <Receipt className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>Cashier Desk</span>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Read-Only</span>
                </div>
              )}
            </div>

            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  title="Operator profile & session"
                >
                  <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[11px] ${
                    isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="font-semibold text-slate-900 max-w-[120px] truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {isAdmin ? 'Admin' : 'Cash Collector'}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 divide-y divide-slate-100"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <div className="p-3 bg-slate-50/70">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{currentUser.name}</div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">+91 {currentUser.phone}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isAdmin ? 'Admin' : 'Cash Collector'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{currentUser.agency || 'ISP Desk'}</div>
                    </div>

                    <div className="p-1">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            openImportDatabase();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg text-left transition-colors font-semibold"
                        >
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Import Entire Database (JSON)</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          openLoginModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Switch Account / Sign In with WhatsApp OTP</span>
                      </button>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => {
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg text-left font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Log Out of VinsNetBill</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => openReceiveCash()}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Receive Cash</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Subnav with compact role indicator */}
        <div className="lg:hidden flex items-center justify-between gap-2 py-2 border-t border-slate-100 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('collections')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'collections' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setCurrentTab('reminders')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 ${
                currentTab === 'reminders' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Reminders
              {todayDueCount > 0 && <span className="text-[10px] bg-amber-500 text-white px-1.5 rounded-full">{todayDueCount}</span>}
            </button>
            <button
              onClick={() => setCurrentTab('subscribers')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'subscribers' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Subscribers
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentTab('collectors')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
                  currentTab === 'collectors' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Collectors
              </button>
            )}
            <button
              onClick={() => setCurrentTab('receipts')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'receipts' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Receipts
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Settings
            </button>
          </div>

          <div className="shrink-0 pl-2 border-l border-slate-200">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border ${
                isAdmin 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>{isAdmin ? '👑 Admin' : '🧾 Collector'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
