'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const languages = ['English', 'Español', 'Deutsch', 'Türkçe', 'فارسی'];

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [langIndex, setLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % languages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    const { error } = await supabase.from('waitlist').insert([{ email }]);

    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setEmail('');
    }
  };

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
