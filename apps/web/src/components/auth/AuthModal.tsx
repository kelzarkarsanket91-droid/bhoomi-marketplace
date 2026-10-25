import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Phone, Mail, ArrowRight, RefreshCw, KeyRound, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiFetch } from '../../lib/api.js';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithTokens } = useAuth();

  const [step, setStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP' | 'REGISTER'>('REQUEST_OTP');
  const [target, setTarget] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Registration fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SELLER' | 'BROKER' | 'BUILDER'>('BUYER');
  const [consentToDpdp, setConsentToDpdp] = useState(false);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isAuthModalOpen) return null;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!target.trim()) {
      setError('Please provide a valid 10-digit mobile number or email.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<{ message: string; cooldownSeconds: number; devOtp?: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ target: target.trim() }),
      });

      setCooldown(res.cooldownSeconds || 60);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep('VERIFY_OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP. Please check the number or email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<{
        verified: boolean;
        isNewUser: boolean;
        user?: any;
        tokens?: any;
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ target: target.trim(), code: otpCode.trim() }),
      });

      if (res.isNewUser) {
        setStep('REGISTER');
      } else if (res.user && res.tokens) {
        loginWithTokens(res.user, res.tokens);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!consentToDpdp) {
      setError('You must accept the DPDP Act consent agreement to register.');
      return;
    }

    setError(null);
    setLoading(true);

    const isEmail = target.includes('@');
    const mobile = isEmail ? '+9198' + Math.floor(10000000 + Math.random() * 90000000) : target;
    const email = isEmail ? target : `user_${Date.now()}@bhoomi.in`;

    try {
      const res = await apiFetch<{ user: any; tokens: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          mobile,
          email,
          role,
          consentToDpdp: true,
        }),
      });

      loginWithTokens(res.user, res.tokens);
    } catch (err: any) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for instant testing of all 5 roles
  const handleQuickDemoLogin = async (demoTarget: string) => {
    setTarget(demoTarget);
    setError(null);
    setLoading(true);
    try {
      // Send OTP
      const sendRes = await apiFetch<{ devOtp?: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ target: demoTarget }),
      });

      const codeToUse = sendRes.devOtp || '123456';
      // Verify OTP
      const verifyRes = await apiFetch<{ user: any; tokens: any }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ target: demoTarget, code: codeToUse }),
      });

      if (verifyRes.user && verifyRes.tokens) {
        loginWithTokens(verifyRes.user, verifyRes.tokens);
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-white">
            {step === 'REQUEST_OTP' && 'Welcome to Bhoomi'}
            {step === 'VERIFY_OTP' && 'Verify 6-Digit OTP'}
            {step === 'REGISTER' && 'Complete Your Profile'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 'REQUEST_OTP' && 'Enter your mobile number or email to receive a secure login code'}
            {step === 'VERIFY_OTP' && `Code sent to ${target}`}
            {step === 'REGISTER' && 'Select your marketplace role and account details'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === 'REQUEST_OTP' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Mobile Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="+91 98220 11111 or name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm shadow-lg shadow-brand-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send 6-Digit Code'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Quick Demo Logins Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-2">
                One-Click Role Switcher Demo Accounts:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin@bhoomi.in')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-left flex items-center gap-1.5"
                >
                  👑 <span>Admin / Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('broker.nagpur@bhoomi.in')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-left flex items-center gap-1.5"
                >
                  🤝 <span>Broker / Dealer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('builder@bhoomi.in')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-left flex items-center gap-1.5"
                >
                  🏗️ <span>Builder / Developer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('seller.wardha@bhoomi.in')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-left flex items-center gap-1.5"
                >
                  🏡 <span>Direct Seller</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('buyer.vidarbha@bhoomi.in')}
                  className="col-span-2 p-2 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-medium text-center flex items-center justify-center gap-1.5"
                >
                  🔍 <span>Verified Buyer (Can switch to Seller)</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Enter 6-Digit OTP
                </label>
                <span className="text-xs text-brand-600 dark:text-brand-400 font-mono">
                  Expires in: {cooldown}s
                </span>
              </div>

              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
                autoFocus
              />

              {devOtpHint && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtpHint)}
                    className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800"
                  >
                    <span>Click to auto-fill OTP:</span>
                    <strong className="font-mono underline">{devOtpHint}</strong>
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm shadow-lg shadow-brand-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('REQUEST_OTP')}
                className="text-slate-500 hover:underline"
              >
                Change number/email
              </button>
              <button
                type="button"
                disabled={cooldown > 0}
                onClick={() => handleRequestOtp()}
                className="text-brand-600 dark:text-brand-400 font-semibold disabled:opacity-40 hover:underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: REGISTER NEW USER */}
        {step === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kulkarni"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Account Type & Role
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'BUYER', title: 'Buyer', desc: 'Can switch to Seller' },
                  { id: 'SELLER', title: 'Seller', desc: 'Can switch to Buyer' },
                  { id: 'BROKER', title: 'Broker / Dealer', desc: 'Permanent account' },
                  { id: 'BUILDER', title: 'Builder / Developer', desc: 'Permanent account' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    className={`p-2.5 text-left rounded-xl border transition ${
                      role === r.id
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* DPDP Consent Checkbox */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentToDpdp}
                  onChange={(e) => setConsentToDpdp(e.target.checked)}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-slate-600 dark:text-slate-300 leading-snug">
                  I agree to the Terms of Service and give explicit consent under the{' '}
                  <strong className="text-slate-900 dark:text-white">Digital Personal Data Protection Act, 2023</strong>{' '}
                  for Bhoomi to process my contact details.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !consentToDpdp}
              className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm shadow-lg shadow-brand-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
