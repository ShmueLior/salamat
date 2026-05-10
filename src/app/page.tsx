'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Camera, Check, Trash2, ShoppingBag, BarChart2, Settings, Search, X, Loader2 } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  qty: number;
  unit: string;
  done: boolean;
  addedBy: string;
}

type NavTab = 'list' | 'scan' | 'history' | 'settings';

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

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('list');
  const [newItem, setNewItem] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const toggle = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));

  const remove = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const add = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    await new Promise(r => setTimeout(r, 300));
    setItems(prev => [{
      id: Date.now().toString(),
      name: newItem.trim(),
      qty: 1,
      unit: 'יח׳',
      done: false,
      addedBy: 'אני',
    }, ...prev]);
    setNewItem('');
    setAdding(false);
    setShowAdd(false);
  };

  const pending = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  const progress = items.length > 0 ? Math.round((done.length / items.length) * 100) : 0;
  const visible = searchQuery ? items.filter(i => i.name.includes(searchQuery)) : items;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100svh',
        background: DARK.base,
        color: DARK.text,
        fontFamily: "'Heebo', sans-serif",
        colorScheme: 'dark',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Ambient glow — top right */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: '-6rem', right: '-6rem',
          width: '22rem', height: '22rem', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(181,245,74,0.07) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* ── HEADER ── */}
      <header
        className="page-top"
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: `${DARK.base}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${DARK.border}`,
          padding: '0 1rem 1rem',
        }}
      >
        {showSearch ? (
          <div className="flex items-center gap-2 pt-2 animate-fade-in">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש..."
              style={{
                flex: 1, background: DARK.card, border: `1.5px solid ${DARK.border}`,
                color: DARK.text, borderRadius: '1rem', padding: '0.75rem 1rem',
                fontSize: '1rem', outline: 'none', direction: 'rtl',
              }}
              onFocus={e => (e.target.style.borderColor = DARK.accent)}
              onBlur={e => (e.target.style.borderColor = DARK.border)}
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              style={{
                background: DARK.card, border: `1px solid ${DARK.border}`,
                borderRadius: '0.875rem', padding: '0.75rem',
                color: DARK.textSub, cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2">
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: DARK.textSub, letterSpacing: '0.04em' }}>
                הרשימה שלנו
              </p>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: DARK.text, lineHeight: 1.2 }}>
                קניות שבועיות 🛒
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  background: DARK.card, border: `1px solid ${DARK.border}`,
                  borderRadius: '0.875rem', padding: '0.625rem',
                  color: DARK.textSub, cursor: 'pointer',
                }}
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => router.push('/login')}
                style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '0.875rem',
                  background: 'linear-gradient(135deg, #b5f54a, #34d399)',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 900, fontSize: '0.9rem', color: DARK.base,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ל
              </button>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {!showSearch && items.length > 0 && (
          <div style={{ marginTop: '0.875rem' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.72rem', color: DARK.textSub, fontWeight: 600 }}>
                {done.length} מתוך {items.length} פריטים
              </span>
              <span style={{ fontSize: '0.72rem', color: DARK.accent, fontWeight: 900 }}>{progress}%</span>
            </div>
            <div style={{ height: '3px', background: DARK.muted, borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', width: `${progress}%`,
                  background: `linear-gradient(90deg, ${DARK.green}, ${DARK.accent})`,
                  borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: '1.25rem 1rem', paddingBottom: '6rem', position: 'relative', zIndex: 1 }}>

        {activeTab === 'list' && (
          <>
            {/* Quick actions */}
            {!showSearch && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}
                className="animate-fade-up">
                <button
                  onClick={() => setActiveTab('scan')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem', borderRadius: '1.25rem',
                    background: DARK.card, border: `1px solid ${DARK.border}`,
                    cursor: 'pointer', textAlign: 'right',
                  }}
                >
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', flexShrink: 0,
                    background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: DARK.accent,
                  }}>
                    <Camera size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: DARK.text }}>סרוק קבלה</p>
                    <p style={{ fontSize: '0.72rem', color: DARK.textSub }}>AI חכם</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem', borderRadius: '1.25rem',
                    background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`,
                    cursor: 'pointer', textAlign: 'right',
                  }}
                >
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', flexShrink: 0,
                    background: DARK.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: DARK.base,
                  }}>
                    <Plus size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: DARK.accent }}>הוסף פריט</p>
                    <p style={{ fontSize: '0.72rem', color: DARK.textSub }}>מהיר</p>
                  </div>
                </button>
              </div>
            )}

            {/* Add item form */}
            {showAdd && (
              <div
                className="animate-scale-in"
                style={{
                  marginBottom: '1.25rem',
                  background: DARK.card, border: `1px solid ${DARK.accentBorder}`,
                  borderRadius: '1.25rem', padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    autoFocus
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && add()}
                    placeholder="שם הפריט..."
                    style={{
                      flex: 1, background: DARK.surface, border: `1.5px solid ${DARK.border}`,
                      color: DARK.text, borderRadius: '0.875rem', padding: '0.75rem 1rem',
                      fontSize: '1rem', outline: 'none', direction: 'rtl',
                    }}
                    onFocus={e => (e.target.style.borderColor = DARK.accent)}
                    onBlur={e => (e.target.style.borderColor = DARK.border)}
                  />
                  <button
                    onClick={add}
                    disabled={adding || !newItem.trim()}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: '0.875rem',
                      background: DARK.accent, border: 'none', color: DARK.base,
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                      opacity: !newItem.trim() ? 0.5 : 1,
                    }}
                  >
                    {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  </button>
                  <button
                    onClick={() => { setShowAdd(false); setNewItem(''); }}
                    style={{
                      padding: '0.75rem', borderRadius: '0.875rem',
                      background: DARK.surface, border: `1px solid ${DARK.border}`,
                      color: DARK.textSub, cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {items.length === 0 && !showAdd && (
              <div className="animate-fade-up" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <div style={{
                  width: '5rem', height: '5rem', borderRadius: '1.5rem', margin: '0 auto 1.5rem',
                  background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                }}>
                  🛒
                </div>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: DARK.text, marginBottom: '0.5rem' }}>
                  הרשימה ריקה
                </p>
                <p style={{ fontSize: '0.9rem', color: DARK.textSub, marginBottom: '2rem' }}>
                  הוסף את הפריט הראשון שלך
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem 1.5rem', borderRadius: '1rem',
                    background: DARK.accent, border: 'none', color: DARK.base,
                    fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  }}
                >
                  <Plus size={18} />
                  הוסף פריט
                </button>
              </div>
            )}

            {/* Pending items */}
            {(searchQuery ? visible.filter(i => !i.done) : pending).length > 0 && (
              <section style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: DARK.textSub, marginBottom: '0.625rem', paddingRight: '0.25rem' }}>
                  לקנות · {searchQuery ? visible.filter(i => !i.done).length : pending.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(searchQuery ? visible.filter(i => !i.done) : pending).map((item, idx) => (
                    <ItemCard key={item.id} item={item} onToggle={toggle} onDelete={remove} delay={idx * 40} dark={DARK} />
                  ))}
                </div>
              </section>
            )}

            {/* Done items */}
            {(searchQuery ? visible.filter(i => i.done) : done).length > 0 && (
              <section>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: DARK.textSub, marginBottom: '0.625rem', paddingRight: '0.25rem' }}>
                  נלקח · {searchQuery ? visible.filter(i => i.done).length : done.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.5 }}>
                  {(searchQuery ? visible.filter(i => i.done) : done).map((item, idx) => (
                    <ItemCard key={item.id} item={item} onToggle={toggle} onDelete={remove} delay={idx * 40} dark={DARK} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'scan' && <DarkPlaceholder emoji="📷" title="סריקת קבלות" desc="AI ינתח את הקבלה ויוסיף פריטים ומחירים אוטומטית" dark={DARK} />}
        {activeTab === 'history' && <DarkPlaceholder emoji="📊" title="היסטוריית מחירים" desc="עקוב אחרי מחירים לאורך זמן וגלה מגמות" dark={DARK} />}
        {activeTab === 'settings' && <SettingsTab dark={DARK} onLogout={() => {
          document.cookie = 'auth_token=; path=/; max-age=0';
          document.cookie = 'household_id=; path=/; max-age=0';
          window.location.href = '/login';
        }} />}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: `${DARK.surface}f0`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${DARK.border}`,
        paddingTop: '0.625rem',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        display: 'flex', justifyContent: 'space-around', zIndex: 20,
      }}>
        {([
          { id: 'list' as NavTab, Icon: ShoppingBag, label: 'רשימה', badge: pending.length },
          { id: 'scan' as NavTab, Icon: Camera, label: 'סריקה' },
          { id: 'history' as NavTab, Icon: BarChart2, label: 'מחירים' },
          { id: 'settings' as NavTab, Icon: Settings, label: 'הגדרות' },
        ]).map(({ id, Icon, label, badge }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={active ? DARK.accent : DARK.textDim}
                />
                {badge && badge > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', left: '-6px',
                    minWidth: '16px', height: '16px', borderRadius: '99px',
                    background: DARK.accent, color: DARK.base,
                    fontSize: '10px', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500, color: active ? DARK.accent : DARK.textDim }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ItemCard({
  item, onToggle, onDelete, delay, dark,
}: {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  delay: number;
  dark: typeof DARK;
}) {
  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem', borderRadius: '1rem',
        background: dark.card, border: `1px solid ${dark.border}`,
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => onToggle(item.id)}
        style={{
          flexShrink: 0, width: '1.625rem', height: '1.625rem', borderRadius: '50%',
          border: `2px solid ${item.done ? dark.green : dark.muted}`,
          background: item.done ? dark.green : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {item.done && <Check size={13} color={dark.base} strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: '0.95rem', color: item.done ? dark.textSub : dark.text,
          textDecoration: item.done ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.name}
        </p>
        <p style={{ fontSize: '0.72rem', color: dark.textSub, marginTop: '0.125rem' }}>
          {item.qty} {item.unit} · {item.addedBy}
        </p>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        style={{
          flexShrink: 0, padding: '0.375rem', borderRadius: '0.5rem',
          background: 'none', border: 'none', color: dark.textDim,
          cursor: 'pointer', transition: 'color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
        onMouseOut={e => (e.currentTarget.style.color = dark.textDim)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function SettingsTab({ dark, onLogout }: { dark: typeof DARK; onLogout: () => void }) {
  const rows = [
    { label: 'משק הבית', value: 'קניות שבועיות', emoji: '🏠' },
    { label: 'קוד הזמנה', value: 'ABC123', emoji: '🔗' },
    { label: 'שפה', value: 'עברית', emoji: '🌐' },
    { label: 'התראות', value: 'מופעל', emoji: '🔔' },
  ];

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: '1.25rem', overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: i < rows.length - 1 ? `1px solid ${dark.border}` : 'none',
          }}>
            <span style={{ fontSize: '0.875rem', color: dark.textSub }}>{row.emoji} {row.label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: dark.text }}>{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onLogout}
        style={{
          width: '100%', padding: '1rem', borderRadius: '1rem', marginTop: '0.5rem',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontWeight: 700, fontSize: '0.95rem',
          cursor: 'pointer', fontFamily: "'Heebo', sans-serif",
        }}
      >
        התנתקות
      </button>
    </div>
  );
}

function DarkPlaceholder({ emoji, title, desc, dark }: { emoji: string; title: string; desc: string; dark: typeof DARK }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{
        width: '4.5rem', height: '4.5rem', borderRadius: '1.25rem', margin: '0 auto 1.25rem',
        background: dark.accentDim, border: `1px solid ${dark.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
      }}>
        {emoji}
      </div>
      <p style={{ fontSize: '1.15rem', fontWeight: 900, color: dark.text, marginBottom: '0.5rem' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: dark.textSub, maxWidth: '18rem', margin: '0 auto 1.5rem' }}>{desc}</p>
      <span style={{
        display: 'inline-block', padding: '0.375rem 0.875rem', borderRadius: '99px',
        background: dark.accentDim, border: `1px solid ${dark.accentBorder}`,
        fontSize: '0.75rem', fontWeight: 600, color: dark.accent,
      }}>
        בקרוב
      </span>
    </div>
  );
}
