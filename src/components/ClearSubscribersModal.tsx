import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, CheckSquare, Square, Users } from 'lucide-react';
import { useISP } from '../context/ISPContext';

export const ClearSubscribersModal: React.FC = () => {
  const { isClearSubscribersOpen, closeClearSubscribers, clearAllSubscribers, customers, payments } = useISP();
  const [alsoClearPayments, setAlsoClearPayments] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isClearSubscribersOpen) return null;

  const handleConfirm = () => {
    clearAllSubscribers(alsoClearPayments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">Clear All Subscribers</h3>
              <p className="text-[11px] text-rose-700">Clean slate for manual data entry</p>
            </div>
          </div>
          <button
            onClick={closeClearSubscribers}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Wipe Sample Subscriber Directory?</strong>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                This will remove all <strong className="font-semibold text-slate-900">{customers.length} subscribers</strong> currently registered in the system so you can add your own real broadband accounts from scratch.
              </p>
            </div>
          </div>

          <div 
            onClick={() => setAlsoClearPayments(!alsoClearPayments)}
            className="p-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
          >
            <div>
              <strong className="text-slate-800 block">Also Clear Payment Records ({payments.length} items)</strong>
              <span className="text-slate-500 text-[11px]">Reset collection logs and receipts to zero as well</span>
            </div>
            <div className="text-emerald-600 shrink-0 ml-3">
              {alsoClearPayments ? (
                <CheckSquare className="w-5 h-5 text-rose-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Type <span className="font-mono bg-slate-100 text-rose-700 px-1 py-0.5 rounded border border-slate-200 font-bold">CLEAR</span> to confirm:
            </label>
            <input
              type="text"
              placeholder="CLEAR"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value.toUpperCase())}
              className="w-full font-mono text-center tracking-widest text-sm uppercase py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={closeClearSubscribers}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={confirmText !== 'CLEAR'}
              onClick={handleConfirm}
              className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                confirmText === 'CLEAR'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm & Clear All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
