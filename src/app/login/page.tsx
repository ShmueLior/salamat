'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, phone },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.user && data.session) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: name,
            phone,
          });
          router.push('/onboarding');
          router.refresh();
        } else {
          setError('נשלח אימייל אישור. אנא אשר את כתובת האימייל שלך ואז התחבר.');
          setLoading(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message === 'Email not confirmed'
            ? 'יש לאשר את כתובת האימייל לפני ההתחברות'
            : 'אימייל או סיסמה שגויים');
          setLoading(false);
          return;
        }

        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('שגיאת חיבור. נסה שוב.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-base flex flex-col items-center justify-between relative overflow-hidden" dir="rtl">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #b5f54a 0%, transparent 70%)',
            top: '-8rem', right: '-6rem',
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
            bottom: '4rem', left: '-4rem',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col min-h-screen">
        {/* Logo area */}
        <div className="page-top pt-16 pb-12 text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #b5f54a 0%, #10b981 100%)' }}>
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-2">
            סל-מת
          </h1>
          <p className="text-base" style={{ color: '#6b8c6d' }}>
            קניות חכמות. ביחד.
          </p>
        </div>

        {/* Form card */}
        <div className="glass-dark rounded-3xl p-6 animate-fade-up delay-100">
          {/* Mode tabs */}
          <div className="flex rounded-2xl p-1 mb-6"
            style={{ background: 'rgba(15, 22, 15, 0.8)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: mode === m ? 'rgba(181, 245, 74, 0.12)' : 'transparent',
                  color: mode === m ? '#b5f54a' : '#4d6b4e',
                }}
              >
                {m === 'login' ? 'התחברות' : 'הרשמה'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (register only) */}
            {mode === 'register' && (
              <div className="animate-fade-up">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#6b8c6d' }}>
                  השם שלך
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ליאור שמואלי"
                  className="input-dark w-full rounded-2xl px-4 py-3.5 text-base"
                  required
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#6b8c6d' }}>
                כתובת אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-dark w-full rounded-2xl px-4 py-3.5 text-base"
                dir="ltr"
                required
              />
            </div>

            {/* Phone field (register only) */}
            {mode === 'register' && (
              <div className="animate-fade-up">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#6b8c6d' }}>
                  מספר טלפון
                </label>
                <div className="flex gap-2">
                  <div
                    className="flex items-center gap-1.5 px-3 py-3.5 rounded-2xl text-sm font-medium shrink-0"
                    style={{ background: 'rgba(31,45,32,0.6)', border: '1.5px solid #1f2d20', color: '#8a9d8b' }}
                  >
                    🇮🇱 +972
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="052-000-0000"
                    className="input-dark flex-1 rounded-2xl px-4 py-3.5 text-base"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#6b8c6d' }}>
                סיסמה
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 8 תווים"
                  className="input-dark w-full rounded-2xl px-4 py-3.5 text-base pl-12"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 transition-opacity"
                  style={{ color: '#4d6b4e' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode === 'login' && (
                <button
                  type="button"
                  className="text-xs mt-1.5 font-medium transition-colors"
                  style={{ color: '#34d399' }}
                >
                  שכחתי סיסמה
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-400 text-center animate-fade-in">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="shimmer-btn w-full py-4 rounded-2xl text-base font-bold transition-all duration-200 active:scale-95 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'login' ? 'מתחבר...' : 'יוצר חשבון...'}
                </span>
              ) : mode === 'login' ? 'כניסה' : 'יצירת חשבון'}
            </button>
          </form>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
