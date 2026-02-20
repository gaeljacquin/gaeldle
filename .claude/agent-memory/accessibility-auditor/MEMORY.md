# Accessibility Auditor Memory — Gaeldle

## Project Architecture (Accessibility-Relevant)

- Next.js app at `apps/web/`; custom components in `components/` and `views/`
- Third-party UI primitives at `components/ui/` — DO NOT audit these files
- Design tokens in `apps/web/app/globals.css` using CSS custom properties / HSL
- Tailwind CSS with a custom theme; `cn()` utility in `lib/utils.ts`
- Dark mode via `.dark` class (next-themes)

## Color Token Resolved Values (Light / Dark)

| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `hsl(171 77% 37%)` ≈ `#14916a` | `hsl(171 77% 45%)` ≈ `#18b382` |
| `--destructive` | `hsl(0 72% 50%)` ≈ `#dc2626` | `hsl(0 62% 30%)` ≈ `#7f1d1d` |
| `--secondary` | `hsl(240 5% 33%)` ≈ `#4d4d57` | `hsl(240 5% 15%)` ≈ `#222226` |
| `--background` | `hsl(240 4% 95%)` ≈ `#f2f2f4` | `hsl(240 10% 4%)` ≈ `#090910` |
| `--card` | `hsl(0 0% 98%)` ≈ `#fafafa` | `hsl(240 10% 6%)` ≈ `#0f0f14` |
| `--muted-foreground` | `hsl(240 5% 33%)` | `hsl(240 5% 65%)` |

**Dark mode primary fails contrast with white text:** `#18b382` on white = ~3.4:1. FAIL.

## Known Hardcoded Non-Token Colors (Out of Theme System)

- `bg-slate-700 text-slate-100` — Spec grid header row (SpecificationsGrid HeaderRow)
- `text-slate-700` — Year direction arrows in ReleaseDateCell (fails dark mode)
- `bg-sky-400 / bg-sky-500 text-white` — IGDB sync button in GameDetails (FAILS)
- `bg-purple-600 / bg-purple-400 text-white` — AI Generate button in GameDetails (purple-400 FAILS)
- `text-green-600` — "Correct!" result text (light mode: passes on white bg ~4.5:1 borderline)

## Recurring Violation Patterns

1. **Color-only status communication** — green/yellow/red used without icons or sr-only text. Affects: SpecificationsGrid cells, TimelineCard banners, Timeline2Card banners.
2. **Missing `aria-expanded`** — Sidebar Games toggle button; no ARIA state on open/closed submenus.
3. **Custom combobox without ARIA pattern** — GameSearch uses a floating dropdown but lacks `role="combobox"`, `role="listbox"`, `aria-expanded`, etc.
4. **Progress indicators without ARIA** — Attempts dots, Clarity bar, HoldToReveal progress bar — none use `role="progressbar"` / `aria-valuenow`.
5. **Hold-to-reveal keyboard inaccessibility** — Only mouse/touch events; no keyboard equivalent.

## Screen-Reader Text (sr-only) — Established Pattern

The project uses `<span className="sr-only">` for visually hidden text (confirmed in `theme-toggle.tsx`). This is the correct pattern for this codebase. When recommending sr-only additions, use this exact class.

## Scope Exclusions

- `apps/web/components/ui/**` — third-party, do not audit
- Auth handler pages (`/handler/**`) — third-party Stack Auth
- `dev-mode-toggle.tsx` — production-invisible, low priority

## Key Files for Future Audits

- `apps/web/app/globals.css` — All design token values
- `apps/web/components/specifications-grid.tsx` — Most complex color-semantic component
- `apps/web/components/timeline-card.tsx` + `timeline-2-card.tsx` — Color-coded game cards
- `apps/web/views/game-details.tsx` — Hardcoded non-token colors (sky, purple)

See: `color-contrast.md` for full contrast table (link pending).
