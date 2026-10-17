import React, { useState } from 'react';
import { ISPProvider } from './context/ISPContext';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CashRegisterView } from './components/CashRegisterView';
import { MonthlyRemindersView } from './components/MonthlyRemindersView';
import { SubscribersView } from './components/SubscribersView';
import { ReceiptsView } from './components/ReceiptsView';
import { SettingsView } from './components/SettingsView';
import { ReceiveCashModal } from './components/ReceiveCashModal';
import { WhatsAppReceiptModal } from './components/WhatsAppReceiptModal';
import { PrintReceipt } from './components/PrintReceipt';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { LoginModal } from './components/LoginModal';
import { ImportSubscribersModal } from './components/ImportSubscribersModal';

import { LoginPage } from './components/LoginPage';
import { CashCollectorsView } from './components/CashCollectorsView';
import { ClearSubscribersModal } from './components/ClearSubscribersModal';
import { CashierStatementModal } from './components/CashierStatementModal';
import { ImportDatabaseModal } from './components/ImportDatabaseModal';
import { useISP } from './context/ISPContext';

function AppContent() {
  const { 
    currentUser, 
    currentTab, 
    setCurrentTab,
    isCashierStatementOpen,
    closeCashierStatement,
    cashierStatementInitialId
  } = useISP();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'collections' && <CashRegisterView />}
        {currentTab === 'reminders' && <MonthlyRemindersView />}
        {currentTab === 'subscribers' && <SubscribersView />}
        {currentTab === 'collectors' && <CashCollectorsView />}
        {currentTab === 'receipts' && <ReceiptsView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Action Modals, Security Modals & Print Component */}
      <ReceiveCashModal />
      <WhatsAppReceiptModal />
      <ThermalReceiptModal />
      <PrintReceipt />
      <LoginModal />
      <ImportSubscribersModal />
      <ImportDatabaseModal />
      <ClearSubscribersModal />
      <CashierStatementModal 
        isOpen={isCashierStatementOpen} 
        onClose={closeCashierStatement} 
        initialOperatorId={cashierStatementInitialId} 
      />

      {/* Quiet, Human Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span>VinsNetBill ISP Management Platform</span>
            <span className="mx-2">·</span>
            <span>Broadband Cash Collection & WhatsApp Billing Assistant</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Thermal 80mm Ready</span>
            <span>·</span>
            <span>Direct wa.me Dispatches</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ISPProvider>
      <AppContent />
    </ISPProvider>
  );
}
