import React, { useState } from 'react';
import { X, Send, Copy, Printer, Check, MessageSquare, Phone, Calendar, ArrowRight, Share2 } from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { createWhatsAppUrl, generateReceiptMessage } from '../utils/whatsapp';

export const WhatsAppReceiptModal: React.FC = () => {
  const { activeReceiptModal, closeReceiptModal, settings, markPaymentWhatsAppSent } = useISP();
  const [copied, setCopied] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');

  if (!activeReceiptModal) return null;

  const { payment, customer } = activeReceiptModal;

  // Generate base message if not yet customized
  const defaultMsg = generateReceiptMessage(payment, customer, settings);
  const currentMsg = isCustomizing ? customMessage : defaultMsg;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSendWhatsApp = () => {
    markPaymentWhatsAppSent(payment.id);
    const url = createWhatsAppUrl(customer.phone, currentMsg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden my-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Payment Recorded Successfully</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-semibold">
                  {payment.receiptNo}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send instant WhatsApp receipt to customer or print physical slip
              </p>
            </div>
          </div>
          <button
            onClick={closeReceiptModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view of Details & WhatsApp Preview */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Transaction Summary (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Customer & Plan
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{customer.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  ID: <span className="font-mono font-medium text-slate-900">{customer.subscriberId}</span> · Act: <span className="font-mono font-medium text-emerald-800">{customer.activationNumber || 'N/A'}</span> · {customer.area}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Amount Received</span>
                  <div className="text-lg font-bold text-emerald-700 tabular-nums">
                    {settings.currencySymbol}{payment.amount}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Payment Mode</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {payment.method}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium text-slate-900">{customer.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valid From:</span>
                  <span className="font-mono text-slate-800">{payment.validFrom}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Expiry:</span>
                  <span className="font-mono font-semibold text-emerald-700">{payment.validTo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received By:</span>
                  <span className="text-slate-800">{payment.collectedBy}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Print / Receipt */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Thermal Receipt (80mm)</span>
              </button>

              <button
                onClick={() => {
                  if (!isCustomizing) {
                    setCustomMessage(defaultMsg);
                    setIsCustomizing(true);
                  } else {
                    setIsCustomizing(false);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800 text-center py-1 underline underline-offset-2 transition-colors"
              >
                {isCustomizing ? 'Reset to default format' : 'Customize receipt message text'}
              </button>
            </div>
          </div>

          {/* Right Column: Realistic WhatsApp Chat Bubble Preview (7 cols) */}
          <div className="md:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                WhatsApp Message Preview
              </span>
              <span className="text-[11px] text-slate-500">
                To: <strong className="font-mono text-slate-800">{customer.phone}</strong>
              </span>
            </div>

            {/* WhatsApp Phone Mockup Container */}
            <div className="flex-1 bg-[#EFEAE2] border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
              {/* WhatsApp background subtle doodle pattern overlay */}
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />

              {/* Chat Bubble */}
              <div className="relative z-10 self-end max-w-full bg-white rounded-lg rounded-tr-none p-3 shadow-xs border border-emerald-100/60 text-xs">
                {isCustomizing ? (
                  <textarea
                    rows={12}
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    className="w-full font-mono text-[11px] leading-relaxed p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none bg-emerald-50/20"
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-[12px] select-text">
                    {currentMsg}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400 font-mono">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sky-600 font-bold">✓✓</span>
                </div>
              </div>

              {/* Bottom Send & Copy Toolbar */}
              <div className="relative z-10 mt-4 pt-3 border-t border-slate-300/60 flex items-center justify-between gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA851] rounded-lg shadow-sm transition-colors"
                >
                  <Send className="w-4 h-4 stroke-[2.2]" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Clicking "Send via WhatsApp" opens WhatsApp Web/Mobile with pre-filled message</span>
          <button
            onClick={closeReceiptModal}
            className="px-3 py-1 font-medium text-slate-700 hover:text-slate-900 rounded hover:bg-slate-200/50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
