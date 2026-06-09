# Neura Studio — Design System

Extracted from the existing codebase (`src/components/**`) on 2026-06-09 via `interface-design:extract`.
This is the source of truth for visual craft and consistency. New UI must conform; existing
divergence (notably the accent-color sprawl) should converge toward this over time.

## Direction

Dense, professional creative-tool UI. Dark-first with a high-contrast light theme.
Borders-driven depth, monospace meta labels, tight type scale. One brand accent.

## Spacing — base 4px

| Token | Value | Use |
|---|---|---|
| 1 | 4px | icon ↔ label gaps (`space-x-1`) |
| 1.5 | 6px | dense inline gaps (`space-x-1.5`, the workhorse) |
| 2 | 8px | standard gap, stack rhythm (`space-y-2`, `gap-2`) |
| 3 | 12px | button padding-x, card stacks (`px-3`, `space-y-3`) |
| 4 | 16px | card padding, section gaps (`p-4`, `gap-4`) |
| 5 | 20px | larger card padding (`p-5`) |

**Button padding:** `px-4 py-2.5` (secondary), `py-3.5` (primary CTA).
**Card padding:** `p-4` standard, `p-5` roomy.

## Radius

| Token | Use |
|---|---|
| `rounded-lg` | **Default** — buttons, inputs, list items (130× in codebase) |
| `rounded-xl` | Cards, panels, primary CTA |
| `rounded-full` | Badges, pills, toggle knobs, status dots |
| `rounded-md` | Small chips |

## Depth — borders, not shadows

798 borders vs. 36 shadows in the codebase → **depth is expressed with 1px borders**, never elevation.
- Resting surface: `border border-slate-800` on `bg-slate-900`
- Hover: lift the border (`hover:border-slate-700`), not a shadow
- `shadow-sm` only on the primary CTA for a subtle anchor. Avoid `shadow-md`+.

## Typography

| Family | Var | Use |
|---|---|---|
| JetBrains Mono | `font-mono` | Labels, meta, status, eyebrows (dominant — 291×) |
| DM Sans | `font-sans` | Body, inputs, descriptions |
| Lora (serif) | `font-display` | Headings, button titles, brand moments |

**Scale is tight and small:** `text-[11px]` is the workhorse (336×), `text-xs` for body,
`text-[10px]` for dense meta, `text-sm`+ reserved for headings. Don't introduce large text in tool chrome.

## Color

### Surfaces & ink — use slate, it theme-swaps automatically
The light theme works by **remapping the slate (and zinc) ramps** in `.light-mode` (`src/index.css`).
So anything built from `bg-slate-*`, `text-slate-*`, `border-slate-*` is automatically legible in
**both** themes. This is the safe palette.

- Surface: `bg-slate-900` / `bg-slate-950` (cards), ink `text-slate-100` / `text-slate-300`
- Borders: `border-slate-800`, hover `border-slate-700`
- Muted text: `text-slate-400` / `text-slate-500`

### Accent — ONE brand color
- `brand-orange` (`--color-brand-orange-500: #f26522`, `-600: #e04f0d`) is **the** accent.
- Primary CTA: filled `bg-brand-orange-600 hover:bg-brand-orange-500 text-white`.
- Accents on surfaces: orange border/text on a slate surface, e.g. `border-brand-orange-500/40 text-brand-orange-400`.

### ⚠️ Anti-pattern — accent-color sprawl (the thing we are fixing)
The codebase currently uses **8 accent hues** heavily: amber (145×), emerald (136×), violet (92×),
orange (54×), sky (47×), rose (24×), indigo (22×). These:
1. Drown the actual brand color (`brand-orange`, 89×).
2. **Break in light mode** — they use hardcoded pastel text (`text-sky-100`, `text-violet-100`, …)
   on near-transparent tints (`from-amber-600/15`); neither is remapped by `.light-mode`, so light
   text lands on a light background and disappears.

**Rule going forward:** build from **slate + brand-orange only**. Use status semantics (below) for the
rare cases that need a non-brand hue, and even then prefer slate-derived neutrals. Never use
`text-{hue}-100/200` light pastels as primary text.

### Status semantics (sparingly)
For genuine state signals only — not decoration:
- Done / success: `emerald-500` dot or icon (icon/dot only, not large fills)
- Active / ready: `brand-orange-500`
- Locked / muted: `slate-500` / `slate-600`

## Component patterns

### Secondary button
```
px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900
text-slate-200 font-display font-semibold text-xs
hover:border-slate-700 hover:text-white transition-all
flex items-center justify-center gap-2
disabled:opacity-60 disabled:cursor-not-allowed
```

### Primary CTA
```
w-full py-3.5 px-4 rounded-xl shadow-sm
bg-brand-orange-600 hover:bg-brand-orange-500 active:scale-[0.98]
text-white font-display font-bold text-sm
flex items-center justify-center gap-2
```

### Card / panel
```
p-4 rounded-xl border border-slate-800 bg-slate-900
```

### Status dot (stepper)
```
w-2 h-2 rounded-full
done → bg-emerald-500 · ready → bg-brand-orange-500 · locked → bg-slate-600
```

### Eyebrow / section label
```
text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400
```
