# SalAmat (סל-מת) — Project Memory

Smart household shopping list PWA with AI receipt scanning and price tracking.

---

## What is SalAmat?

**סל-מת** = סל (basket/list) + מת (smart, modern Hebrew slang)

Shared shopping list PWA for households with:
- Real-time synced list via Supabase Realtime
- AI receipt scanning (Gemini 2.5 Flash) — parses Hebrew receipts → JSON items + prices
- Price history tracking — compare prices over time, identify trends
- Push notifications for list updates
- Bilingual ready (Hebrew + English), RTL-first design
- Mobile-first, installable via "Add to Home Screen" (iOS Safari + Android Chrome)
- Deployed: https://salamat.vercel.app (pending)
- GitHub: https://github.com/ShmueLior/salamat

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| Routing | Next.js built-in routing |
| Icons | Lucide React |
| Backend/DB | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth (email/password, no OAuth yet) |
| AI | Google Gemini 2.5-flash (receipt parsing) |
| Push | Web Push API + VAPID keys |
| PWA | next-pwa (injectManifest strategy) |
| Serverless | Vercel Functions (app/api/) |
| Cron | Vercel Cron Jobs (vercel.json) |
| Fonts | Heebo (body) + Fraunces (display) from Google Fonts |

---

## Environment Variables

### Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

### Backend (Vercel Env)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VAPID_PRIVATE_KEY=your-vapid-private-key
CRON_SECRET=your-cron-secret

---

## File Structure

src/
  app/
    page.tsx                # Dashboard (demo UI with RTL + Heebo)
    layout.tsx              # Root layout (PWA meta, RTL, dir=rtl)
  lib/
    supabase.ts             # Supabase client
    gemini.ts               # Receipt parsing
    push.ts                 # Push notifications
  types/
    index.ts                # Types
  components/
    ShoppingList.tsx
    ReceiptScanner.tsx

public/
  manifest.json             # PWA manifest (Hebrew, RTL)
  icons/                    # Generated app icons

---

## Pending / Next Steps

- [ ] Initialize Supabase project + schema
- [ ] Build /scan page (receipt upload + Gemini)
- [ ] Build /history page (price tracking)
- [ ] Build /settings page
- [ ] Test PWA on iOS/Android
- [ ] Deploy to Vercel

---

## Dev Commands

npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
node generate-icons.mjs   # Regenerate icons
