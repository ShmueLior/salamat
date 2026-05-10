'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Camera, Check, Trash2, ShoppingBag, BarChart2, Settings, Search, X, Loader2, Copy, CheckCheck, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  added_by_name: string;
  photo_url?: string;
}

interface HouseholdInfo {
  id: string;
  name: string;
  invite_code: string;
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
  const [items, setItems] = useState<Item[]>([]);
  const [household, setHousehold] = useState<HouseholdInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<NavTab>('list');
  const [newItem, setNewItem] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) return;
    setDisplayName(profile.display_name || '');

    const { data: hh } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .eq('id', profile.household_id)
      .single();

    if (hh) setHousehold(hh);

    const { data: dbItems } = await supabase
      .from('shopping_items')
      .select('id, name, quantity, unit, checked, added_by, photo_url')
      .eq('household_id', profile.household_id)
      .order('created_at', { ascending: false });

    if (dbItems) {
      setItems(dbItems.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity ?? 1,
        unit: i.unit ?? 'יח׳',
        checked: i.checked ?? false,
        added_by_name: i.added_by === user.id ? 'אני' : 'שותף',
        photo_url: i.photo_url ?? undefined,
      })));
    }
    setLoadingItems(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File, householdId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${householdId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('item-photos').upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('item-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const closeAdd = () => {
    setShowAdd(false);
    setNewItem('');
    clearImage();
  };

  const add = async () => {
    if (!newItem.trim() || !household || !userId) return;
    setAdding(true);

    let photoUrl: string | undefined;
    if (selectedImage) {
      photoUrl = await uploadImage(selectedImage, household.id) ?? undefined;
    }

    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        household_id: household.id,
        name: newItem.trim(),
        quantity: 1,
        unit: 'יח׳',
        checked: false,
        added_by: userId,
        photo_url: photoUrl ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      setItems(prev => [{
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        checked: false,
        added_by_name: 'אני',
        photo_url: data.photo_url ?? undefined,
      }, ...prev]);
    }
    setAdding(false);
    closeAdd();
  };

  const toggle = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newChecked = !item.checked;
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: newChecked } : i));
    await supabase.from('shopping_items').update({ checked: newChecked }).eq('id', id);
  };

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('shopping_items').delete().eq('id', id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const pending = items.filter(i => !i.checked);
  const done = items.filter(i => i.checked);
  const progress = items.length > 0 ? Math.round((done.length / items.length) * 100) : 0;
  const visible = searchQuery ? items.filter(i => i.name.includes(searchQuery)) : items;
  const householdDisplayName = household?.name ?? 'הרשימה שלנו';
  const initials = displayName ? displayName[0] : '?';

  return (
    <div dir="rtl" style={{ minHeight: '100svh', background: DARK.base, color: DARK.text, fontFamily: "'Heebo', sans-serif", colorScheme: 'dark', display: 'flex', flexDirection: 'column' }}>
      <div aria-hidden style={{ position: 'fixed', top: '-6rem', right: '-6rem', width: '22rem', height: '22rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(181,245,74,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '2.5rem', height: '2.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="תמונת פריט"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '1rem', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* HEADER */}
      <header className="page-top" style={{ position: 'sticky', top: 0, zIndex: 10, background: `${DARK.base}ee`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${DARK.border}`, padding: '0 1rem 1rem' }}>
        {showSearch ? (
          <div className="flex items-center gap-2 pt-2 animate-fade-in">
            <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="חיפוש..."
              style={{ flex: 1, background: DARK.card, border: `1.5px solid ${DARK.border}`, color: DARK.text, borderRadius: '1rem', padding: '0.75rem 1rem', fontSize: '1rem', outline: 'none', direction: 'rtl' }}
              onFocus={e => (e.target.style.borderColor = DARK.accent)} onBlur={e => (e.target.style.borderColor = DARK.border)} />
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              style={{ background: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: '0.875rem', padding: '0.75rem', color: DARK.textSub, cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2">
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: DARK.textSub, letterSpacing: '0.04em' }}>הרשימה שלנו</p>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: DARK.text, lineHeight: 1.2 }}>{householdDisplayName}</h1>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowSearch(true)} style={{ background: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: '0.875rem', padding: '0.625rem', color: DARK.textSub, cursor: 'pointer' }}>
                <Search size={20} />
              </button>
              <button onClick={() => setActiveTab('settings')} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.875rem', background: 'linear-gradient(135deg, #b5f54a, #34d399)', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.9rem', color: DARK.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {initials}
              </button>
            </div>
          </div>
        )}

        {!showSearch && items.length > 0 && (
          <div style={{ marginTop: '0.875rem' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.72rem', color: DARK.textSub, fontWeight: 600 }}>{done.length} מתוך {items.length} פריטים</span>
              <span style={{ fontSize: '0.72rem', color: DARK.accent, fontWeight: 900 }}>{progress}%</span>
            </div>
            <div style={{ height: '3px', background: DARK.muted, borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${DARK.green}, ${DARK.accent})`, borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '1.25rem 1rem', paddingBottom: '6rem', position: 'relative', zIndex: 1 }}>
        {activeTab === 'list' && (
          <>
            {!showSearch && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }} className="animate-fade-up">
                <button onClick={() => setActiveTab('scan')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '1.25rem', background: DARK.card, border: `1px solid ${DARK.border}`, cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', flexShrink: 0, background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK.accent }}>
                    <Camera size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: DARK.text }}>סרוק קבלה</p>
                    <p style={{ fontSize: '0.72rem', color: DARK.textSub }}>AI חכם</p>
                  </div>
                </button>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '1.25rem', background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`, cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', flexShrink: 0, background: DARK.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK.base }}>
                    <Plus size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: DARK.accent }}>הוסף פריט</p>
                    <p style={{ fontSize: '0.72rem', color: DARK.textSub }}>מהיר</p>
                  </div>
                </button>
              </div>
            )}

            {/* ADD ITEM FORM */}
            {showAdd && (
              <div className="animate-scale-in" style={{ marginBottom: '1.25rem', background: DARK.card, border: `1px solid ${DARK.accentBorder}`, borderRadius: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Name row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    autoFocus type="text" value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !selectedImage && add()}
                    placeholder="שם הפריט..."
                    style={{ flex: 1, background: DARK.surface, border: `1.5px solid ${DARK.border}`, color: DARK.text, borderRadius: '0.875rem', padding: '0.75rem 1rem', fontSize: '1rem', outline: 'none', direction: 'rtl' }}
                    onFocus={e => (e.target.style.borderColor = DARK.accent)}
                    onBlur={e => (e.target.style.borderColor = DARK.border)}
                  />
                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="הוסף תמונה"
                    style={{ padding: '0.75rem', borderRadius: '0.875rem', background: imagePreview ? DARK.accentDim : DARK.surface, border: `1px solid ${imagePreview ? DARK.accentBorder : DARK.border}`, color: imagePreview ? DARK.accent : DARK.textSub, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <ImageIcon size={18} />
                  </button>
                  {/* Add button */}
                  <button onClick={add} disabled={adding || !newItem.trim()}
                    style={{ padding: '0.75rem 1rem', borderRadius: '0.875rem', background: DARK.accent, border: 'none', color: DARK.base, fontWeight: 700, cursor: 'pointer', opacity: !newItem.trim() ? 0.5 : 1, flexShrink: 0 }}>
                    {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  </button>
                  {/* Close button */}
                  <button onClick={closeAdd} style={{ padding: '0.75rem', borderRadius: '0.875rem', background: DARK.surface, border: `1px solid ${DARK.border}`, color: DARK.textSub, cursor: 'pointer', flexShrink: 0 }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="animate-scale-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: DARK.surface, borderRadius: '0.875rem', border: `1px solid ${DARK.border}` }}>
                    <img src={imagePreview} alt="preview" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.625rem', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: DARK.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedImage?.name}</p>
                      <p style={{ fontSize: '0.72rem', color: DARK.textSub }}>תמונה תצורף לפריט</p>
                    </div>
                    <button onClick={clearImage} style={{ padding: '0.375rem', background: 'none', border: 'none', color: DARK.textDim, cursor: 'pointer', flexShrink: 0 }}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {loadingItems && (
              <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <Loader2 size={32} color={DARK.accent} className="animate-spin" style={{ margin: '0 auto' }} />
              </div>
            )}

            {!loadingItems && items.length === 0 && !showAdd && (
              <div className="animate-fade-up" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <div style={{ width: '5rem', height: '5rem', borderRadius: '1.5rem', margin: '0 auto 1.5rem', background: DARK.accentDim, border: `1px solid ${DARK.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🛒</div>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: DARK.text, marginBottom: '0.5rem' }}>הרשימה ריקה</p>
                <p style={{ fontSize: '0.9rem', color: DARK.textSub, marginBottom: '2rem' }}>הוסף את הפריט הראשון שלך</p>
                <button onClick={() => setShowAdd(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '1rem', background: DARK.accent, border: 'none', color: DARK.base, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                  <Plus size={18} /> הוסף פריט
                </button>
              </div>
            )}

            {(searchQuery ? visible.filter(i => !i.checked) : pending).length > 0 && (
              <section style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: DARK.textSub, marginBottom: '0.625rem', paddingRight: '0.25rem' }}>
                  לקנות · {searchQuery ? visible.filter(i => !i.checked).length : pending.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(searchQuery ? visible.filter(i => !i.checked) : pending).map((item, idx) => (
                    <ItemCard key={item.id} item={item} onToggle={toggle} onDelete={remove} onImageClick={setLightboxUrl} delay={idx * 40} dark={DARK} />
                  ))}
                </div>
              </section>
            )}

            {(searchQuery ? visible.filter(i => i.checked) : done).length > 0 && (
              <section>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: DARK.textSub, marginBottom: '0.625rem', paddingRight: '0.25rem' }}>
                  נלקח · {searchQuery ? visible.filter(i => i.checked).length : done.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.5 }}>
                  {(searchQuery ? visible.filter(i => i.checked) : done).map((item, idx) => (
                    <ItemCard key={item.id} item={item} onToggle={toggle} onDelete={remove} onImageClick={setLightboxUrl} delay={idx * 40} dark={DARK} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'scan' && <DarkPlaceholder emoji="📷" title="סריקת קבלות" desc="AI ינתח את הקבלה ויוסיף פריטים ומחירים אוטומטית" dark={DARK} />}
        {activeTab === 'history' && <DarkPlaceholder emoji="📊" title="היסטוריית מחירים" desc="עקוב אחרי מחירים לאורך זמן וגלה מגמות" dark={DARK} />}
        {activeTab === 'settings' && <SettingsTab dark={DARK} displayName={displayName} household={household} onLogout={logout} />}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: `${DARK.surface}f0`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: `1px solid ${DARK.border}`, paddingTop: '0.625rem', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 20 }}>
        {([
          { id: 'list' as NavTab, Icon: ShoppingBag, label: 'רשימה', badge: pending.length },
          { id: 'scan' as NavTab, Icon: Camera, label: 'סריקה' },
          { id: 'history' as NavTab, Icon: BarChart2, label: 'מחירים' },
          { id: 'settings' as NavTab, Icon: Settings, label: 'הגדרות' },
        ]).map(({ id, Icon, label, badge }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 1rem', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} color={active ? DARK.accent : DARK.textDim} />
                {badge && badge > 0 ? (
                  <span style={{ position: 'absolute', top: '-6px', left: '-6px', minWidth: '16px', height: '16px', borderRadius: '99px', background: DARK.accent, color: DARK.base, fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {badge}
                  </span>
                ) : null}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500, color: active ? DARK.accent : DARK.textDim }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ItemCard({ item, onToggle, onDelete, onImageClick, delay, dark }: {
  item: Item; onToggle: (id: string) => void; onDelete: (id: string) => void;
  onImageClick: (url: string) => void; delay: number; dark: typeof DARK;
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms`, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '1rem', background: dark.card, border: `1px solid ${dark.border}` }}>
      {/* Checkbox */}
      <button onClick={() => onToggle(item.id)}
        style={{ flexShrink: 0, width: '1.625rem', height: '1.625rem', borderRadius: '50%', border: `2px solid ${item.checked ? dark.green : dark.muted}`, background: item.checked ? dark.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
        {item.checked && <Check size={13} color={dark.base} strokeWidth={3} />}
      </button>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: item.checked ? dark.textSub : dark.text, textDecoration: item.checked ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </p>
        <p style={{ fontSize: '0.72rem', color: dark.textSub, marginTop: '0.125rem' }}>
          {item.quantity} {item.unit} · {item.added_by_name}
        </p>
      </div>

      {/* Photo thumbnail */}
      {item.photo_url && (
        <button
          onClick={() => onImageClick(item.photo_url!)}
          style={{ flexShrink: 0, width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem', overflow: 'hidden', border: `1.5px solid ${dark.border}`, cursor: 'pointer', padding: 0, background: 'none' }}
        >
          <img src={item.photo_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
      )}

      {/* Delete */}
      <button onClick={() => onDelete(item.id)}
        style={{ flexShrink: 0, padding: '0.375rem', borderRadius: '0.5rem', background: 'none', border: 'none', color: dark.textDim, cursor: 'pointer', transition: 'color 0.15s' }}
        onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
        onMouseOut={e => (e.currentTarget.style.color = dark.textDim)}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function SettingsTab({ dark, displayName, household, onLogout }: {
  dark: typeof DARK; displayName: string; household: HouseholdInfo | null; onLogout: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    if (!household?.invite_code) return;
    await navigator.clipboard.writeText(household.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: '1.25rem', overflow: 'hidden' }}>
        {[{ label: 'שם', value: displayName || '—', emoji: '👤' }, { label: 'רשימה', value: household?.name ?? '—', emoji: '🏠' }].map((row, i, arr) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: i < arr.length - 1 ? `1px solid ${dark.border}` : 'none' }}>
            <span style={{ fontSize: '0.875rem', color: dark.textSub }}>{row.emoji} {row.label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: dark.text }}>{row.value}</span>
          </div>
        ))}
      </div>

      {household && (
        <div style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: '1.25rem', padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: dark.textSub, marginBottom: '0.75rem' }}>🔗 קוד הזמנה</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.2em', color: dark.accent, fontFamily: 'monospace', flex: 1 }}>{household.invite_code}</p>
            <button onClick={copyCode} style={{ padding: '0.625rem 1rem', borderRadius: '0.875rem', background: copied ? dark.accentDim : dark.accent, border: copied ? `1px solid ${dark.accentBorder}` : 'none', color: copied ? dark.accent : dark.base, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: "'Heebo', sans-serif", transition: 'all 0.2s' }}>
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              {copied ? 'הועתק' : 'העתק'}
            </button>
          </div>
        </div>
      )}

      <button onClick={onLogout} style={{ width: '100%', padding: '1rem', borderRadius: '1rem', marginTop: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Heebo', sans-serif" }}>
        התנתקות
      </button>
    </div>
  );
}

function DarkPlaceholder({ emoji, title, desc, dark }: { emoji: string; title: string; desc: string; dark: typeof DARK }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '1.25rem', margin: '0 auto 1.25rem', background: dark.accentDim, border: `1px solid ${dark.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>{emoji}</div>
      <p style={{ fontSize: '1.15rem', fontWeight: 900, color: dark.text, marginBottom: '0.5rem' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: dark.textSub, maxWidth: '18rem', margin: '0 auto 1.5rem' }}>{desc}</p>
      <span style={{ display: 'inline-block', padding: '0.375rem 0.875rem', borderRadius: '99px', background: dark.accentDim, border: `1px solid ${dark.accentBorder}`, fontSize: '0.75rem', fontWeight: 600, color: dark.accent }}>בקרוב</span>
    </div>
  );
}
