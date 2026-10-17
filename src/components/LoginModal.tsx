import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  User, 
  ArrowRight, 
  Wifi, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  UserCheck
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { createOtpWhatsAppUrl } from '../utils/whatsapp';

export const LoginModal: React.FC = () => {
  const { 
    isLoginModalOpen, 
    closeLoginModal, 
    loginWithOtp, 
    sendOtpToOperator, 
    currentUser, 
    settings,
    operators 
  } = useISP();

  const [phoneNumber, setPhoneNumber] = useState(
    currentUser?.phone || (settings.phone ? settings.phone.replace(/\D/g, '') : '9876512340')
  );

  const cleanDigits = phoneNumber.replace(/\D/g, '');
  const matchedOperator = operators.find(op => 
    op.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10))
  );

  const [adminName, setAdminName] = useState(
    matchedOperator ? matchedOperator.name : (currentUser?.name || 'Rajesh Kumar')
  );

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [whatsappSentUrl, setWhatsappSentUrl] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  React.useEffect(() => {
    if (matchedOperator) {
      setAdminName(matchedOperator.name);
    }
  }, [matchedOperator]);

  if (!isLoginModalOpen) return null;

  const handleSendWhatsAppOtp = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setIsSendingOtp(true);

    const resolvedName = matchedOperator ? matchedOperator.name : (adminName.trim() || 'Administrator');
    const res = sendOtpToOperator(digits, resolvedName);

    const waUrl = createOtpWhatsAppUrl(digits, res.otp, settings.ispName);
    setWhatsappSentUrl(waUrl);

    // Open WhatsApp in a new tab/window
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSendingOtp(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!otpCode.trim()) {
      setError('Please enter the 4-digit OTP received via WhatsApp');
      return;
    }

    const resolvedName = matchedOperator ? matchedOperator.name : (adminName.trim() || 'Administrator');
    const preferredRole = matchedOperator ? matchedOperator.role : 'admin';

    const result = loginWithOtp(digits, otpCode.trim(), resolvedName, preferredRole);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check OTP.');
    }
  };

  const isMatchedCollector = matchedOperator && matchedOperator.role !== 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden my-6 transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-emerald-500/40 bg-slate-950 flex items-center justify-center shrink-0">
              <img 
                src="/vinsnetbill_logo.jpg" 
                alt="VinsNetBill Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sign In with WhatsApp OTP</h2>
              <p className="text-xs text-slate-300">VinsNetBill ISP Terminal</p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={closeLoginModal}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {whatsappSentUrl && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp Message Prepared</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  Valid 10m
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                A verification message was sent to your WhatsApp for <strong>+91 {phoneNumber}</strong>. Please enter the OTP code received below.
              </p>
              <a
                href={whatsappSentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Mobile Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Phone Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400 font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 12340"
                  value={phoneNumber}
                  onChange={e => {
                    setPhoneNumber(e.target.value);
                    setError(null);
                    setWhatsappSentUrl(null);
                  }}
                  className="w-full pl-12 pr-3 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {matchedOperator && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    Recognized: <strong>{matchedOperator.name}</strong> ({matchedOperator.role === 'admin' ? 'Administrator' : 'Cash Collector'})
                  </span>
                </div>
              )}
            </div>

            {/* 2. Admin Name (Only if new user or admin) */}
            {!isMatchedCollector && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={adminName}
                    onChange={e => {
                      setAdminName(e.target.value);
                      setError(null);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 3. OTP Code Input with Send OTP Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  WhatsApp Verification OTP *
                </label>
                <span className="text-[10px] text-slate-400">
                  Click Send OTP to open WhatsApp
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={e => {
                      setOtpCode(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendWhatsAppOtp}
                  disabled={isSendingOtp}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs disabled:opacity-60"
                  title="Send OTP via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isSendingOtp ? 'Opening...' : (whatsappSentUrl ? 'Resend' : 'Send via WhatsApp')}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors mt-2"
            >
              <span>
                {isMatchedCollector ? 'Verify OTP & Log In as Cash Collector' : 'Verify OTP & Log In as Admin'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
