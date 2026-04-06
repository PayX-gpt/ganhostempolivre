

## Plan: Reformulacao Completa da /tiktok/step-1

### Summary

Create a new dedicated component `TikTokStep1Landing.tsx` that replaces `Step1Intro` exclusively for the `/tiktok` funnel. This is a full landing page (not a simple quiz step) with 9 sections, floating social proof toasts, sticky bar, and countdown timer. The current `Step1Intro` remains untouched for the normal funnel.

### Architecture

- **New file**: `src/components/quiz/TikTokStep1Landing.tsx` — self-contained component with all 9 sections
- **Edit**: `src/components/quiz/TikTokQuizFunnel.tsx` — in `renderStep()` case `"step-1"`, render `TikTokStep1Landing` instead of `Step1Intro` (for variant A; variants B/C/D stay as-is or also use new component depending on preference)
- **No changes** to `Step1Intro.tsx`, `QuizUI.tsx`, or any other route

### Component Structure (TikTokStep1Landing.tsx)

Single file, ~600-700 lines. All sections inline, no sub-components needed. Props: `{ onNext: () => void }`.

**State:**
- `counter` (starts 36860, +1 every 28s)
- `timerSeconds` (starts 1080 = 18min, counts down, resets at 0)
- `slotsRemaining` (random 42-54, set once on mount)
- `activeToast` (index of current social proof notification)

**Sections implemented top-to-bottom:**

0. **Sticky Bar** — fixed top, z-50, bg `#1a1a1a`, counter + "Sistema aberto agora"
1. **Pre-headline** — bg `#c0392b`, white text urgency strip
2. **Hero** — badge pill, headline 32px mobile, subheadline 18px, social proof box with checkmarks, CTA #1, testimonial card (Marlene)
3. **Future Pacing** — two cards (without quiz / with quiz), CTA #2
4. **5 Bullets** — vertical cards with icons (Lucide: DollarSign, Smartphone, Clock, Shield, Ban), CTA #3
5. **Urgency** — dark bg, MM:SS timer (yellow, monospace), progress bar 83%, money calculation box, CTA #4
6. **3 Testimonials** — grid cards with stars, avatar placeholders (initials-based), badges, CTA #5
7. **Objections** — accordion/FAQ cards, CTA #6
8. **Final CTA** — gradient dark bg, emotional copy, large pulsing CTA #7
9. **Disclaimer footer** — dark bg, small legal text

**Floating toasts**: `useEffect` with 35-55s random interval, slide-in from left, 4s visible, hidden on screens < 400px.

### Styling Approach

- Inline Tailwind classes throughout (consistent with project patterns)
- Override the dark theme colors using explicit hex/rgb values where the spec demands light backgrounds (e.g., white cards, `#fafafa` sections) via inline `style` props or Tailwind arbitrary values like `bg-[#fafafa]`
- This page uses a **light color scheme** for most sections — will use `style={{ color, background }}` where needed since the global theme is dark
- Font sizes: min 18px body text (`text-lg`), 32px headlines mobile, buttons min h-14 (56px)
- All 7 CTA buttons call `onNext()`

### Key Design Decisions

- **Avatars**: Use colored initials circles (e.g., "MA" for Marlene Aparecida) instead of stock photos, per the no-stock-photos rule
- **Icons**: Lucide React only, no emojis in rendered UI — emoji characters in the spec will be replaced with Lucide icons (CheckCircle, AlertTriangle, Clock, etc.)
- **Timer**: Evergreen countdown from 18:00, monospace font, yellow `#f1c40f` on dark background
- **The page scrolls independently** — it's a long-form landing, not a quiz card

### Edit to TikTokQuizFunnel.tsx

In the `renderStep` switch, for `case "step-1"`:
- Default variant renders `<TikTokStep1Landing onNext={goNext} />` instead of `<Step1Intro>`
- Import added at top

Also: the TikTok funnel header (with progress bar and branding) should be **hidden** on step-1 since this landing page has its own sticky bar. Add a condition to hide the header when `step === 1`.

### Files Changed

| File | Change |
|------|--------|
| `src/components/quiz/TikTokStep1Landing.tsx` | **NEW** — Full landing page component |
| `src/components/quiz/TikTokQuizFunnel.tsx` | Import + render new component for step-1; hide header on step-1 |

No other files modified.

