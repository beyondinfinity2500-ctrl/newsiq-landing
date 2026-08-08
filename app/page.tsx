'use client';

import React, { useState } from 'react';
import JsonLd from '@/components/JsonLd';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <JsonLd />

      {/* Header with Custom Vector Logo */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 py-4 px-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <svg width="170" height="40" viewBox="0 0 600 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="105" fill="#FFFFFF" fontWeight="900" fontSize="105" fontFamily="Inter, sans-serif" letterSpacing="-2">news</text>
            <text x="270" y="105" fill="#007BFF" fontWeight="900" fontSize="105" fontFamily="Inter, sans-serif">i</text>
            <g transform="translate(310, 5)">
              <circle cx="50" cy="50" r="40" stroke="#007BFF" strokeWidth="16" fill="none" />
              <rect x="75" y="75" width="18" height="38" rx="4" fill="#007BFF" transform="rotate(-45 75 75)" />
            </g>
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            v1.0 Beta Waitlist
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AI Market Intelligence Terminal
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Global Micro-News Analysis:<br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            The Foresight That Creates Wealth
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
          Stay ahead of high-impact global events before they hit mainstream markets with real-time AI financial analysis.
        </p>

        {/* Subscription Form */}
        <div className="w-full max-w-md mb-8">
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              aria-label="Email address"
              placeholder="Enter your professional email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {status === 'loading' ? 'Processing...' : 'Get Early Access'}
            </button>
          </form>

          {status === 'success' && (
            <p className="text-emerald-400 text-sm mt-3 font-medium">Registration successful! Welcome to the waitlist.</p>
          )}
          {status === 'error' && (
            <p className="text-rose-400 text-sm mt-3 font-medium">An error occurred. Please try again.</p>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-14">
          Early Access Members Receive 50% Off Lifetime Pro Tier • Zero Spam
        </p>

        {/* Supported Payment Logos */}
        <div className="pt-8 border-t border-slate-800/80 w-full max-w-lg">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Supported Payment Gateways</p>
          <div className="flex flex-wrap justify-center items-center gap-4 font-bold text-xs select-none">
            <span className="text-[#003087] bg-white px-3 py-1.5 rounded font-extrabold shadow-sm">PayPal</span>
            <span className="text-[#1A1F71] bg-white px-3 py-1.5 rounded italic font-black shadow-sm">VISA</span>
            <span className="text-[#EB001B] bg-white px-3 py-1.5 rounded font-black shadow-sm">mastercard</span>
            <span className="text-[#4285F4] bg-white px-3 py-1.5 rounded font-bold shadow-sm">Google Pay</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} NEWSiQ.top — All rights reserved.
      </footer>
    </div>
  );
}
