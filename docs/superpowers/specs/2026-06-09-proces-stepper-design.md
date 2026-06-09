# Design: Proces-stepper i venstre kolonne (BriefForm)

**Dato:** 2026-06-09
**Status:** Til godkendelse
**Område:** `src/components/BriefForm.tsx`, `src/index.css`
**Design-system:** `.interface-design/system.md`

## Problem

De primære proces-handlinger i venstre kolonne (`BriefForm`) lider af to fejl:

1. **Rod & uklar rækkefølge.** 6+ knapper bruger hver sin accentfarve (amber, sky, violet,
   emerald, indigo, orange). De står nogenlunde i flow-orden men kommunikerer ikke "trin 1 → 2 → 3".
   Extract bekræfter: 8 accent-hues bruges massivt, og brandfarven (`brand-orange`) drukner.

2. **Light-tema usynlighed.** Knapperne bruger hardcodede pastel-tekstfarver (`text-sky-100`,
   `text-violet-100`, …) på næsten-gennemsigtige tints (`from-amber-600/15`). Light-mode i
   `index.css` virker ved at *ommappe slate/zinc-ramperne* — men de faste accent-hues ommappes
   ikke, så lys tekst lander på lys baggrund og forsvinder.

## Mål

- Proces-knapperne præsenteres som én **nummereret stepper** i den rækkefølge processen faktisk
  forløber, med tydelig status pr. trin.
- Konsolidér til **slate + brand-orange** (de farver der allerede theme-swapper korrekt), så begge
  temaer virker uden tema-specifikke hacks.
- Ingen ændring af funktions-logik — kun præsentation og placering.

## Ikke-mål (YAGNI)

- Ingen ændringer i backend, hooks, eller selve generations-logikken.
- Ingen ny state-maskine. "Blød låsning" er rent visuelt (nedtoning + hint), knapper forbliver klikbare.
- Ingen ændring af CVI-scanneren, brief-felterne eller højre kolonne (`FunnelPanels`, `OutputWorkspace`).
- Ingen omdøbning af handlere eller props i `useContentMachine`.

## Design

### Struktur — nummereret proces-stepper

Stepper'en erstatter den nuværende stak af farvede knapper. Trinene følger funnel-logikken
fra CLAUDE.md (kulturel scan → strategi → stor idé → pressure-test → matrix → effekt):

```
PROCES
 ①  Skan kultur & marked          (valgfrit fundament)
 ②  Byg strategi-fundament
 ③  Find Den Store Idé
 ④  Skærp idé (pressure-test)     (klar når en idé er valgt)
 ⑤  Omni-channel matrix           (klar når en idé er valgt)
 ⑥  Effekt-lag (KPI & måling)     (klar når en idé er valgt)
 ─────────────────────────────────
 ⚡ GENERÉR INDHOLD               (primær CTA)
```

> **Note om trin ④ "Skærp idé":** selve pressure-test-handlingen (`handleSharpenIdea`) udløses i
> dag fra `FunnelPanels` (højre kolonne) når brugeren har valgt et territorium. I stepper'en vises
> ④ derfor som et *status-/navigations-trin*: det markeres "klar" når `hasSelectedTerritory` er sandt,
> og fungerer som visuel reference i flowet. Det tilføjer ikke en ny handler. (Hvis det føles
> forvirrende ved review, kan ④ udelades fra stepper'en og høre rent til højre kolonne.)

### Hvert trin — ensartet række

| Element | Stil (fra system.md) |
|---|---|
| Nummer-chip | `rounded-full` slate-chip; orange når trinnet er "klar nu" |
| Titel | `font-display font-semibold text-xs` |
| Undertekst | `text-[11px] text-slate-500` (kort hint) |
| Status-dot | `w-2 h-2 rounded-full` — done `emerald-500` · klar `brand-orange-500` · låst `slate-600` |
| Container | `px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900`, hover `border-slate-700` |

**Status pr. trin** afledes af eksisterende state (ingen ny state):

| Trin | Done (✓) når | Klar (●) når |
|---|---|---|
| ① Skan kultur | `hasCulturalIntel` | altid |
| ② Strategi | `hasStrategy` | altid |
| ③ Stor idé | `hasSelectedTerritory` | altid |
| ④ Skærp idé | `pressureTest` findes | `hasSelectedTerritory` |
| ⑤ Matrix | `channelMatrix` findes | `hasSelectedTerritory` |
| ⑥ Effekt-lag | `effectiveness` findes | `hasSelectedTerritory` |

Låst (○) = "klar når"-betingelsen ikke er opfyldt: trinnet nedtones (`opacity-60`) og får et
hint i underteksten ("kræver en valgt idé"), men forbliver klikbart (blød låsning).

### CTA

"Generér indhold" beholder sin nuværende fyldte orange knap (`bg-brand-orange-600 … rounded-xl
shadow-sm py-3.5`) som visuelt omdrejningspunkt — den er allerede on-system. Deep-mode-varianten
("Kør redaktionsmøde") bevares.

### Sekundære handlinger → "Værktøjer"-sektion

Under CTA'en, adskilt med en eyebrow-label (`text-[11px] font-mono font-bold uppercase tracking-wider
text-slate-400`). Alle som ensartede sekundære knapper (slate + border, ingen accent-hues):

```
── VÆRKTØJER ──
 ▸ Brainstorm idéer
 ▸ Visuel udvikling · Redaktion
 ▸ Dyb tilstand · Redaktionsmøde   (toggle — beholder sin on/off-stil i orange)
 ▸ Pin job til genveje & presets
```

CVI-scanneren bliver hvor den er (hører til brief-input øverst).

### Light-tema fix

Roden løses ved at **fjerne hardcodede accent-pastel-klasser** fra disse knapper og bygge dem af
`slate-*` + `brand-orange-*`, der allerede ommappes i `.light-mode`. Forventet nettoresultat:
ingen nye `.light-mode`-regler nødvendige for stepper'en. Hvis enkelte kanttilfælde stadig brister,
tilføjes målrettede regler i `index.css` (sidste udvej, ikke første).

## Komponent-afgrænsning

Stepper'en udtrækkes som en fokuseret underkomponent for at holde `BriefForm.tsx` (i dag ~41 KB)
læsbar:

- **`ProcessStepper`** (ny, `src/components/ProcessStepper.tsx`) — modtager status-flags og
  handlere som props; ejer ingen state. Ét klart formål: vis funnel-trinene + status.
- **`ToolsSection`** (ny, lille — evt. inline i BriefForm hvis triviel) — de sekundære handlinger.
- `BriefForm` beholder brief-felter, CVI-scanner, presets og komponerer de to ovenstående.

Props til `ProcessStepper` er de samme flags/handlere `BriefForm` allerede modtager fra `App.tsx`
(`handleCulturalScan`, `isScanning`, `hasCulturalIntel`, `handleGenerateStrategy`, `hasStrategy`,
`handleGenerateBigIdea`, `hasSelectedTerritory`, `handleGenerateChannelMatrix`,
`handleGenerateEffectiveness`, `handleGenerateAll`, `isGenerating`, `deepMode`, `generationStep`, …).
Ingen ny data flyttes op eller ned.

## Test & verifikation

- `npm run lint` (tsc) skal være grøn.
- `npm test` — eksisterende suite skal fortsat passere (ingen logik ændres).
- **Manuel:** Skift mellem dark/light tema og bekræft at alle trin + sekundære knapper er fuldt
  læsbare i begge. Bekræft at status-dots opdaterer korrekt når man kører kultur-scan → strategi →
  stor idé → vælger territorium.
- Versionsbump: minor (UI-feature) → `1.17.0` → `1.18.0` i de tre steder (package.json,
  AppHeader subtitle, App.tsx footer) jf. CLAUDE.md.

## Åbne spørgsmål

1. Skal trin ④ "Skærp idé" med i stepper'en (som status-trin) eller udelades helt? (Default: med, som status-trin.)
