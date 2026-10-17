import React, { useState } from 'react';
import { 
  Wifi, 
  ArrowRight, 
  ShieldCheck, 
  Send,
  User,
  AlertCircle,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { useISP } from '../context/ISPContext';
import { createOtpWhatsAppUrl } from '../utils/whatsapp';

export const LoginPage: React.FC = () => {
  const { 
    loginWithOtp,
    sendOtpToOperator, 
    settings, 
    customers,
    operators 
  } = useISP();

  const [phoneNumber, setPhoneNumber] = useState(
    settings.phone ? settings.phone.replace(/\D/g, '') : '9876512340'
  );

  // Check if phone matches any known operator (Admin or Cash Collector)
  const cleanDigits = phoneNumber.replace(/\D/g, '');
  const matchedOperator = operators.find(op => 
    op.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10))
  );

  const [adminName, setAdminName] = useState(
    matchedOperator ? matchedOperator.name : (settings.activeCashier ? settings.activeCashier.replace(/\s*\(Admin\)/i, '') : 'Rajesh Kumar')
  );

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [whatsappSentUrl, setWhatsappSentUrl] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Update name if matched operator changes
  React.useEffect(() => {
    if (matchedOperator) {
      setAdminName(matchedOperator.name);
    }
  }, [matchedOperator]);

  const handleSendWhatsAppOtp = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number');
      return;
    }
    setError(null);
    setIsSendingOtp(true);

    const resolvedName = matchedOperator ? matchedOperator.name : (adminName.trim() || 'Administrator');
    const res = sendOtpToOperator(digits, resolvedName);

    // Prepare WhatsApp URL - user requested WhatsApp message instead of auto OTP showing on screen
    const waUrl = createOtpWhatsAppUrl(digits, res.otp, settings.ispName);
    setWhatsappSentUrl(waUrl);

    // Open WhatsApp in a new tab/window for the user to view their OTP code
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSendingOtp(false);
    }, 400);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number');
      return;
    }

    if (!otpCode.trim()) {
      setError('Please enter the 4-digit OTP code received on WhatsApp (or click "Send OTP via WhatsApp")');
      return;
    }

    const resolvedName = matchedOperator ? matchedOperator.name : (adminName.trim() || 'Administrator');
    const preferredRole = matchedOperator ? matchedOperator.role : 'admin';

    const result = loginWithOtp(digits, otpCode.trim(), resolvedName, preferredRole);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify OTP.');
    }
  };

  const isMatchedCollector = matchedOperator && matchedOperator.role !== 'admin';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background subtle mesh decoration */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px), radial-gradient(#0284C7 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px'
        }}
      />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-3xl px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Broadband Cash Billing & Collections Terminal
          </div>
          <div className="flex items-center justify-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-950 bg-slate-950 flex items-center justify-center shrink-0">
              <img 
                src="/vinsnetbill_logo.jpg" 
                alt="VinsNetBill Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
                <span>VinsNet</span><span className="text-emerald-500 font-black">Bill</span>
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                ISP Broadband Terminal
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            {settings.ispName} · Secure Sign In via WhatsApp OTP
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column (5 cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-7 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  ISP Portal Access
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Cash Terminal & Admin Login
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Sign in with your mobile phone number and WhatsApp verification code.
                </p>
              </div>

              <div className="space-y-3.5 pt-1 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-900/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-200 block">WhatsApp OTP Delivery</strong>
                    <span className="text-slate-400 text-[11px]">
                      Click "Send OTP via WhatsApp" to receive your one-time verification message on your phone.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-200 block">Create Your Own Admin</strong>
                    <span className="text-slate-400 text-[11px]">
                      Enter your preferred Admin name to customize bills, thermal receipts & operator branding.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-900/60 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-200 block">Cash Collectors Access</strong>
                    <span className="text-slate-400 text-[11px]">
                      Cash collectors registered by Admin can sign in using their registered mobile number.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Subscribers: <strong className="text-slate-300 font-mono">{customers.length}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3" /> Ready
              </span>
            </div>
          </div>

          {/* Right Form Column (7 cols) - Clean Mobile Number + Admin Name + WhatsApp OTP */}
          <div className="md:col-span-7 p-7 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Sign In to VinsNetBill</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your mobile number to receive your verification code via WhatsApp.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* WhatsApp message status banner (NOT auto-showing OTP) */}
              {whatsappSentUrl && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp OTP Message Prepared</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                      Valid 10m
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    We sent a verification code to your WhatsApp for <strong>+91 {phoneNumber}</strong>. Please check your WhatsApp and enter the code below.
                  </p>
                  <div className="pt-1">
                    <a
                      href={whatsappSentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open WhatsApp to View Code</span>
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
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

                {/* 2. Admin / User Name */}
                {!isMatchedCollector && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Admin / Name *
                      </label>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        Create / Set your own Admin Name
                      </span>
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your Admin name (e.g. Rajesh Kumar)"
                        value={adminName}
                        onChange={e => {
                          setAdminName(e.target.value);
                          setError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      This name will appear on printed thermal receipts, bills, and reports.
                    </span>
                  </div>
                )}

                {/* 3. Send OTP via WhatsApp + OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      WhatsApp One-Time Password (OTP) *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Enter 4-digit code
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          placeholder="Enter 4-digit OTP"
                          value={otpCode}
                          onChange={e => {
                            setOtpCode(e.target.value.replace(/\D/g, ''));
                            setError(null);
                          }}
                          className="w-full pl-9 pr-3 py-2.5 text-base font-mono tracking-widest bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendWhatsAppOtp}
                        disabled={isSendingOtp}
                        className="px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs disabled:opacity-60"
                        title="Send OTP message to WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isSendingOtp ? 'Opening...' : (whatsappSentUrl ? 'Resend WhatsApp' : 'Send OTP via WhatsApp')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors mt-2"
                >
                  <span>
                    {isMatchedCollector 
                      ? 'Verify OTP & Log In as Cash Collector' 
                      : 'Verify OTP & Log In as Admin'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
