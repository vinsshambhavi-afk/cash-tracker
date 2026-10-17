import React, { useState } from 'react';
import { X, Printer, Send, Copy, Check, Download, Share2 } from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { createWhatsAppUrl, generateReceiptMessage } from '../utils/whatsapp';

export const ThermalReceiptModal: React.FC = () => {
  const { activeThermalReceipt, closeThermalReceipt, triggerPrintReceipt, settings, markPaymentWhatsAppSent } = useISP();
  const [copied, setCopied] = useState(false);

  if (!activeThermalReceipt) return null;

  const { payment, customer } = activeThermalReceipt;

  const handlePrint = () => {
    triggerPrintReceipt(payment, customer);
  };

  const handleCopyText = async () => {
    const text = generateReceiptMessage(payment, customer, settings);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsApp = () => {
    markPaymentWhatsAppSent(payment.id);
    const msg = generateReceiptMessage(payment, customer, settings);
    const url = createWhatsAppUrl(customer.phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={closeThermalReceipt}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-6 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Thermal 80mm Receipt Slip</h3>
              <p className="text-[11px] text-slate-500">POS-80 standard formatting for {customer.name}</p>
            </div>
          </div>
          <button
            onClick={closeThermalReceipt}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header Banner */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-xs">
          <span className="text-emerald-900 font-medium">Receipt: <span className="font-mono font-bold">{payment.receiptNo}</span></span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 80mm</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-medium transition-colors"
              title="Dispatch via WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleCopyText}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors"
              title="Copy receipt text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Scrollable Visual Thermal Receipt Slip (80mm width paper preview) */}
        <div className="p-6 bg-slate-100/80 flex justify-center max-h-[65vh] overflow-y-auto">
          <div className="w-[320px] bg-white border border-slate-300 shadow-md p-4 font-mono text-[11px] leading-tight text-slate-900 selection:bg-emerald-100">
            {/* Top Paper Tear Line */}
            <div className="text-center text-[10px] text-slate-400 select-none pb-2 border-b border-dashed border-slate-300">
              - - - - - - - - - 80mm THERMAL SLIP - - - - - - - - -
            </div>

            {/* ISP Header */}
            <div className="text-center py-2.5 border-b border-slate-900">
              <div className="text-sm font-extrabold uppercase tracking-wide">{settings.ispName}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{settings.tagline}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{settings.address}</div>
              <div className="text-[10px] text-slate-800 font-semibold mt-0.5">
                Helpline: {settings.supportPhone || settings.phone}
              </div>
              {settings.gstOrTaxNo && (
                <div className="text-[10px] text-slate-700 mt-0.5">GSTIN: {settings.gstOrTaxNo}</div>
              )}
            </div>

            {/* Title */}
            <div className="text-center py-1.5 font-bold uppercase tracking-wider text-xs border-b border-slate-900 bg-slate-50">
              CASH COLLECTION RECEIPT
            </div>

            {/* Receipt Meta */}
            <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-600">Receipt No:</span>
                <span className="font-bold text-slate-900">{payment.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date & Time:</span>
                <span className="tabular-nums">{new Date(payment.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cashier:</span>
                <span className="truncate max-w-[170px] font-medium">{payment.collectedBy}</span>
              </div>
            </div>

            {/* Subscriber Info */}
            <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-600">Subscriber:</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sub ID:</span>
                <span className="font-bold text-slate-900">{customer.subscriberId}</span>
              </div>
              <div className="flex justify-between bg-emerald-50/70 px-1 py-0.5 -mx-1 rounded">
                <span className="text-emerald-900 font-semibold">Activation No:</span>
                <span className="font-bold text-emerald-900">{customer.activationNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mobile No:</span>
                <span className="tabular-nums">{customer.phone}</span>
              </div>
              {customer.area && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Area/Zone:</span>
                  <span className="truncate max-w-[170px]">{customer.area}</span>
                </div>
              )}
            </div>

            {/* Itemized Service Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <div className="text-[10px] font-bold text-slate-700 uppercase mb-1.5 flex justify-between">
                <span>ITEMIZED CHARGES</span>
                <span>AMOUNT</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between font-semibold">
                    <span>1. {customer.planName}</span>
                    <span>{settings.currencySymbol}{payment.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pl-3">
                    Speed: {customer.speedMbps} Mbps FTTH
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 pl-3">
                  Service Period: {payment.validFrom} to {payment.validTo}
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-dotted border-slate-200">
                  <span>Net Base Plan</span>
                  <span>{settings.currencySymbol}{payment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Taxes (GST/VAT)</span>
                  <span>Included</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="py-2.5 border-b border-slate-900 space-y-1">
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>TOTAL CASH RECEIVED:</span>
                <span className="text-emerald-800">{settings.currencySymbol}{payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-800">CASH (Physical Drawer)</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Validity Extended Till:</span>
                <span className="font-bold text-emerald-800">{payment.validTo}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Account Balance:</span>
                <span>{settings.currencySymbol}0.00 (Cleared)</span>
              </div>
            </div>

            {/* Barcode Simulation */}
            <div className="py-3 text-center">
              <div className="inline-block tracking-widest font-mono text-base font-bold select-none text-slate-800">
                ||| | |||| | ||||| || | |||| ||
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 tracking-wider font-mono">
                *{payment.receiptNo}*
              </div>
            </div>

            {/* Footer Notes */}
            <div className="pt-2 text-[10px] text-center space-y-1 text-slate-600 border-t border-dashed border-slate-300">
              <p className="italic">{settings.receiptFooter || 'Thank you for your prompt payment!'}</p>
              <p className="font-bold text-slate-900">*** KEEP SLIP FOR YOUR RECORDS ***</p>
              <div className="text-[9px] text-slate-400 select-none pt-2">
                [ ✂ - - - - - - - - - TEAR HERE - - - - - - - - - ]
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+P</kbd> or click Print
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={closeThermalReceipt}
              className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
