'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Hash, ArrowRight, Copy, CheckCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Step = 'choose' | 'create' | 'join' | 'invite';

const DARK = {
  base: '#090d0a',
  surface: '#0f150f',
  card: '#131a13',
  border: '#1a2b1b',
  muted: '#2e4030',
  text: '#ffffff',
  textSub: '#5a7a5c',
  textDim: '#3a5a3c',
  accent: '#b5f54a',
  accentDim: 'rgba(181,245,74,0.08)',
  accentBorder: 'rgba(181,245,74,0.18)',
  green: '#10b981',
};

const EMOJIS = ['🛒', '🏠', '🍎', '🧹', '💊', '🐾', '👶', '🎉'];

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [listName, setListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🛒');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const inviteCode = generateInviteCode();

    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: `${selectedEmoji} ${listName}`, invite_code: inviteCode })
      .select()
      .single();

    if (householdError || !household) {
      setError('שגיאה ביצירת הרשימה. נסה שוב.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: household.id })
      .eq('id', user.id);

    if (profileError) {
      setError('שגיאה בעדכון הפרופיל. נסה שוב.');
      setLoading(false);
      return;
    }

    setCreatedInviteCode(inviteCode);
    setLoading(false);
    setStep('invite');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length < 6) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: household, error: lookupError } = await supabase
      .from('households')
      .select('id, name')
      .eq('invite_code', joinCode.trim())
      .single();

    if (lookupError || !household) {
      setError('קוד הזמנה לא נמצא. בדוק שוב.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: household.id })
      .eq('id', user.id);

    if (profileError) {
      setError('שגיאה בהצטרפות. נסה שוב.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const back = () => {
    if (step === 'choose') router.push('/login');
    else setStep('choose');
  };

  const stepLabel = step === 'invite' ? '2 / 2' : '1 / 2';

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100svh', background: DARK.base, color: DARK.text,
        fontFamily: "'Heebo', sans-serif", colorScheme: 'dark',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div aria-hidden style={{
        position: 'fixed', top: '-6rem', right: '-6rem',
        width: '22rem', height: '22rem', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(181,245,74,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <div
        className="page-top"
        style={{
          padding: '0 1rem 1.5rem', position: 'relative', zIndex: 1,
          borderBottom: `1px solid ${DARK.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={back}
            style={{
              background: DARK.card, border: `1px solid ${DARK.border}`,
              borderRadius: '0.75rem', padding: '0.5rem',
              color: DARK.textSub, cursor: 'pointer',
            }}
          >
            <ArrowRight size={20} />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: DARK.textDim }}>{stepLabel}</span>
        </div>

        <div className="animate-fade-up">
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: DARK.text, marginBottom: '0.375rem' }}>
            {step === 'choose' && 'בחר רשימה'}
            {step === 'create' && 'יצירת רשימה'}
            {step === 'join' && 'הצטרפות לרשימה'}
            {step === 'invite' && 'הזמן שותף'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: DARK.textSub }}>
            {step === 'choose' && 'צור רשימה חדשה או הצטרף לקיימת'}
            {step === 'create' && 'תן שם לרשימה המשותפת שלכם'}
            {step === 'join' && 'הכנס את קוד ההזמנה שקיבלת'}
            {step === 'invite' && 'שלח את הקוד לשותף שלך'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1.5rem 1rem', position: 'relative', zIndex: 1 }}>

        {/* CHOOSE */}
        {step === 'choose' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ChoiceCard
              icon={<Plus size={22} color={DARK.accent} />}
              iconBg={DARK.accentDim}
              iconBorder={DARK.accentBorder}
              title="צור רשימה חדשה"
              desc="פתח רשימה חדשה והזמן שותפים"
              onClick={() => setStep('create')}
              dark={DARK}
            />
            <ChoiceCard
              icon={<Hash size={22} color="#38bdf8" />}
              iconBg="rgba(56,189,248,0.08)"
              iconBorder="rgba(56,189,248,0.18)"
              title="הצטרף לרשימה קיימת"
              desc="הכנס קוד שקיבלת מהשותף שלך"
              onClick={() => setStep('join')}
              dark={DARK}
            />
          </div>
        )}

        {/* CREATE */}
        {step === 'create' && (
          <form onSubmit={handleCreate} className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <DarkField label="שם הרשימה" dark={DARK}>
              <input
                type="text"
                value={listName}
                onChange={e => setListName(e.target.value)}
                placeholder='למשל: "קניות שבועיות"'
                autoFocus
                required
                style={{
                  width: '100%', background: DARK.surface, border: `1.5px solid ${DARK.border}`,
                  color: DARK.text, borderRadius: '0.875rem', padding: '0.875rem 1rem',
                  fontSize: '1rem', outline: 'none', direction: 'rtl', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = DARK.accent)}
                onBlur={e => (e.target.style.borderColor = DARK.border)}
              />
            </DarkField>

            <DarkField label="אייקון לרשימה" dark={DARK}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
                      fontSize: '1.25rem', cursor: 'pointer', border: 'none',
                      background: selectedEmoji === emoji ? DARK.accentDim : DARK.surface,
                      outline: selectedEmoji === emoji ? `2px solid ${DARK.accent}` : `1px solid ${DARK.border}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DarkField>

            {error && <p style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !listName.trim()}
              style={{
                width: '100%', padding: '1rem', borderRadius: '1rem',
                background: DARK.accent, border: 'none', color: DARK.base,
                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                opacity: !listName.trim() ? 0.5 : 1, transition: 'opacity 0.2s',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Loader2 size={18} className="animate-spin" />יוצר...</span>
                : `${selectedEmoji} יצירת הרשימה`}
            </button>
          </form>
        )}

        {/* JOIN */}
        {step === 'join' && (
          <form onSubmit={handleJoin} className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <DarkField label="קוד הזמנה" dark={DARK}>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="ABCD12"
                autoFocus
                required
                maxLength={6}
                dir="ltr"
                style={{
                  width: '100%', background: DARK.surface, border: `1.5px solid ${DARK.border}`,
                  color: DARK.text, borderRadius: '0.875rem', padding: '1rem',
                  fontSize: '2rem', fontWeight: 900, letterSpacing: '0.3em',
                  outline: 'none', textAlign: 'center', boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
                onFocus={e => (e.target.style.borderColor = DARK.accent)}
                onBlur={e => (e.target.style.borderColor = DARK.border)}
              />
              <p style={{ fontSize: '0.78rem', color: DARK.textSub, textAlign: 'center', marginTop: '0.5rem' }}>
                הקוד מופיע בהגדרות הרשימה של השותף שלך
              </p>
            </DarkField>

            {error && <p style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || joinCode.length < 6}
              style={{
                width: '100%', padding: '1rem', borderRadius: '1rem',
                background: DARK.accent, border: 'none', color: DARK.base,
                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                opacity: joinCode.length < 6 ? 0.5 : 1, transition: 'opacity 0.2s',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Loader2 size={18} className="animate-spin" />מצטרף...</span>
                : 'הצטרפות לרשימה'}
            </button>
          </form>
        )}

        {/* INVITE */}
        {step === 'invite' && (
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`,
              borderRadius: '1.25rem', padding: '1.5rem', textAlign: 'center',
            }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{selectedEmoji}</p>
              <p style={{ fontWeight: 900, fontSize: '1.1rem', color: DARK.text, marginBottom: '0.25rem' }}>
                הרשימה נוצרה בהצלחה!
              </p>
              <p style={{ fontSize: '0.875rem', color: DARK.accent }}>&ldquo;{listName}&rdquo;</p>
            </div>

            <div style={{
              background: DARK.card, border: `1px solid ${DARK.border}`,
              borderRadius: '1.25rem', padding: '1.25rem',
            }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: DARK.textSub, marginBottom: '0.875rem' }}>
                שתף עם השותף שלך
              </p>
              <div style={{
                background: DARK.surface, border: `1px solid ${DARK.border}`,
                borderRadius: '0.875rem', padding: '1rem', textAlign: 'center', marginBottom: '0.875rem',
              }}>
                <p style={{ fontSize: '0.72rem', color: DARK.textSub, marginBottom: '0.375rem' }}>קוד הזמנה</p>
                <p style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.25em', color: DARK.accent, fontFamily: 'monospace' }}>
                  {createdInviteCode}
                </p>
              </div>
              <button
                onClick={copyCode}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: '0.875rem',
                  background: copied ? DARK.accentDim : DARK.accent,
                  border: copied ? `1px solid ${DARK.accentBorder}` : 'none',
                  color: copied ? DARK.accent : DARK.base,
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  fontFamily: "'Heebo', sans-serif", transition: 'all 0.2s',
                }}
              >
                {copied ? <CheckCheck size={18} /> : <Copy size={18} />}
                {copied ? 'הועתק!' : 'העתק קוד'}
              </button>
            </div>

            <button
              onClick={() => { router.push('/'); router.refresh(); }}
              style={{
                width: '100%', padding: '1rem', borderRadius: '1rem',
                background: 'none', border: `1px solid ${DARK.border}`,
                color: DARK.textSub, fontWeight: 600, fontSize: '0.95rem',
                cursor: 'pointer', fontFamily: "'Heebo', sans-serif",
              }}
            >
              המשך לרשימה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChoiceCard({ icon, iconBg, iconBorder, title, desc, onClick, dark }: {
  icon: React.ReactNode; iconBg: string; iconBorder: string;
  title: string; desc: string; onClick: () => void; dark: typeof DARK;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.125rem',
        borderRadius: '1.25rem', background: dark.card, border: `1px solid ${dark.border}`,
        cursor: 'pointer', textAlign: 'right', width: '100%',
        transition: 'border-color 0.2s', fontFamily: "'Heebo', sans-serif",
      }}
      onMouseOver={e => (e.currentTarget.style.borderColor = dark.accentBorder)}
      onMouseOut={e => (e.currentTarget.style.borderColor = dark.border)}
    >
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '0.875rem', flexShrink: 0,
        background: iconBg, border: `1px solid ${iconBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: dark.text, marginBottom: '0.25rem' }}>{title}</p>
        <p style={{ fontSize: '0.8rem', color: dark.textSub }}>{desc}</p>
      </div>
      <ArrowRight size={18} color={dark.textDim} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
    </button>
  );
}

function DarkField({ label, children, dark }: { label: string; children: React.ReactNode; dark: typeof DARK }) {
  return (
    <div style={{
      background: dark.card, border: `1px solid ${dark.border}`,
      borderRadius: '1.25rem', padding: '1rem',
    }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: dark.textSub, marginBottom: '0.625rem' }}>{label}</p>
      {children}
    </div>
  );
}
