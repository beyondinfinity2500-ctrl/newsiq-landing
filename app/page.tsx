'use client';

import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      // شبیه‌سازی یا فراخوانی API ثبت نام
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>NEWSiQ | Global News & Deep Financial Intelligence</title>
        <meta name="description" content="Stay ahead of high-impact global events before they hit mainstream markets with AI-driven market impact analysis." />
        <meta property="og:title" content="NEWSiQ | Global Micro-News Platform" />
        <meta property="og:description" content="AI-powered global micro-news analysis and real-time market foresight." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://newsiq.top" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
        {/* Header */}
        <header className="w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur py-4 px-6 flex justify-center items-center">
          <div className="flex items-center space-x-1">
            <svg width="180" height="45" viewBox="0 0 600 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="110" fill="#FFFFFF" fontWeight="900" fontSize="110" fontFamily="Inter, sans-serif" letterSpacing="-2">NEWS</text>
              <text x="310" y="110" fill="#007BFF" fontWeight="900" fontSize="110" fontFamily="Inter, sans-serif">i</text>
              <g transform="translate(350, 10)">
                <circle cx="50" cy="50" r="40" stroke="#007BFF" strokeWidth="16" fill="none" />
                <rect x="75" y="75" width="18" height="40" rx="4" fill="#007BFF" transform="rotate(-45 75 75)" />
              </g>
            </svg>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
          <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-6 border border-blue-500/20">
            Global Intelligence Platform • Early Access
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Smart Global News Analysis:<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              The Foresight That Creates Wealth
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Stay ahead of high-impact global events before they hit mainstream markets with real-time AI financial intelligence.
          </p>

          {/* Subscription Form */}
          <div className="w-full max-w-md mb-8">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 whitespace-nowrap"
              >
                {status === 'loading' ? 'Joining...' : 'Get Early Access'}
              </button>
            </form>

            {status === 'success' && (
              <p className="text-emerald-400 text-sm mt-3">Success! You are on the early access list.</p>
            )}
            {status === 'error' && (
              <p className="text-rose-400 text-sm mt-3">Something went wrong. Please try again.</p>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-12">
            Get Early Access &amp; 50% Off at Launch • No Spam Guaranteed
          </p>

          {/* Payment Methods */}
          <div className="pt-8 border-t border-slate-800/80 w-full max-w-lg">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Supported Payment Gateways</p>
            <div className="flex flex-wrap justify-center items-center gap-6 font-bold text-sm">
              <span className="text-[#003087] bg-white/90 px-3 py-1 rounded shadow-sm">PayPal</span>
              <span className="text-[#1A1F71] bg-white/90 px-3 py-1 rounded shadow-sm italic font-extrabold">VISA</span>
              <span className="text-[#EB001B] bg-white/90 px-3 py-1 rounded shadow-sm">mastercard</span>
              <span className="text-[#4285F4] bg-white/90 px-3 py-1 rounded shadow-sm">Google Pay</span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} NEWSiQ.top — All rights reserved.
        </footer>
      </div>
    </>
  );
}
n };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl text-center z-10 space-y-8">
        <div className="inline-block px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 text-xs text-neutral-400 tracking-wide uppercase">
          Global Intelligence Platform • <span className="text-blue-400 transition-all">{languages[langIndex]}</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-100 leading-tight">
          Smart Global News Analysis: <br />
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            The Foresight That Creates Wealth
          </span>
        </h1>

        <p className="text-base md:text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Stay ahead of high-impact global events before they hit mainstream markets.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {status === 'loading' ? 'Joining...' : 'Get Early Access & 50% Off'}
          </button>
        </form>

        {status === 'success' && (
          <p className="text-emerald-400 text-sm">You are on the list! We will notify you at launch.</p>
        )}
        {status === 'error' && (
          <p className="text-rose-500 text-sm">Something went wrong. Please try again.</p>
        )}

        <div className="pt-8 border-t border-neutral-900 text-xs text-neutral-500">
          🌐 Global Coverage | Accessible in Your Language at Launch
        </div>
      </div>
    </main>
  );
}
