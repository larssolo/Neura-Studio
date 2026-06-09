# Proces-stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erstat de farve-spredte proces-knapper i `BriefForm` med én nummereret funnel-stepper bygget af slate + brand-orange, så rækkefølgen er tydelig og begge temaer er fuldt læsbare.

**Architecture:** Ny fokuseret komponent `ProcessStepper` ejer funnel-trinene ①–⑥ + den primære CTA. `BriefForm` komponerer den og en restylet "Værktøjer"-sektion (brainstorm, visuel udvikling, dyb tilstand, pin). Ingen ændring i hooks/backend — kun præsentation. Tre afledte status-booleans (`hasPressureTest`, `hasChannelMatrix`, `hasEffectiveness`) threades fra `App.tsx` så trin-status afspejler reel fremdrift.

**Tech Stack:** React 19, TypeScript, Tailwind 4, lucide-react, Vitest + Testing Library (jsdom).

**Design-system:** `.interface-design/system.md` — slate + brand-orange, borders-only, `rounded-lg`, `px-4 py-2.5`, `text-[11px]`/`text-xs`, `font-display` titler, `font-mono` meta.

---

## File Structure

- **Create** `src/components/ProcessStepper.tsx` — stepper-komponent (trin ①–⑥ + CTA). Ejer ingen state; ren præsentation af props.
- **Create** `src/components/ProcessStepper.test.tsx` — komponenttest (jsdom).
- **Modify** `src/components/BriefForm.tsx` — udskift knap-blokken med `<ProcessStepper>` + restylet Værktøjer-sektion; tilføj 3 nye props.
- **Modify** `src/App.tsx` — videregiv `hasPressureTest`/`hasChannelMatrix`/`hasEffectiveness` til `BriefForm`.
- **Modify** `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx` — versionsbump 1.17.0 → 1.18.0.

### Adfærd for låsning (afklaring)
- Trin **1–3** er altid aktive (sikre at køre når som helst).
- Trin **4 "Skærp idé"** er et rent status-trin (ingen handler i venstre kolonne — selve pressure-testen udløses i `FunnelPanels`). Vises nedtonet/låst indtil en idé er valgt, derefter "klar", og "done" når `hasPressureTest`.
- Trin **5–6** aktiveres når en idé er valgt (`hasSelectedTerritory`) — bevarer nuværende adfærd, hvor disse handlinger først dukkede op efter idé-valg. Låst = nedtonet, ikke-klikbar.

---

## Task 1: ProcessStepper-komponent (TDD)

**Files:**
- Create: `src/components/ProcessStepper.tsx`
- Test: `src/components/ProcessStepper.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ProcessStepper.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessStepper } from './ProcessStepper';

const baseProps = {
  isGenerating: false, deepMode: false, generationStep: '',
  isScanning: false, isGeneratingStrategy: false, isGeneratingCampaign: false,
  isGeneratingMatrix: false, isGeneratingEffectiveness: false,
  hasCulturalIntel: false, hasStrategy: false, hasSelectedTerritory: false,
  hasPressureTest: false, hasChannelMatrix: false, hasEffectiveness: false,
  onCulturalScan: () => {}, onGenerateStrategy: () => {}, onGenerateBigIdea: () => {},
  onGenerateChannelMatrix: () => {}, onGenerateEffectiveness: () => {}, onGenerateAll: () => {},
};

describe('ProcessStepper', () => {
  it('renders all funnel steps and the primary CTA', () => {
    render(<ProcessStepper {...baseProps} />);
    expect(screen.getByText('Skan kultur & marked')).toBeTruthy();
    expect(screen.getByText('Byg strategi-fundament')).toBeTruthy();
    expect(screen.getByText('Find Den Store Idé')).toBeTruthy();
    expect(screen.getByText('Skærp idé')).toBeTruthy();
    expect(screen.getByText('Omni-channel matrix')).toBeTruthy();
    expect(screen.getByText('Effekt-lag')).toBeTruthy();
    expect(screen.getByText('Generér indhold')).toBeTruthy();
  });

  it('fires the matching handler when an active step is clicked', () => {
    const onGenerateStrategy = vi.fn();
    render(<ProcessStepper {...baseProps} onGenerateStrategy={onGenerateStrategy} />);
    fireEvent.click(screen.getByText('Byg strategi-fundament'));
    expect(onGenerateStrategy).toHaveBeenCalledOnce();
  });

  it('switches the CTA label in deep mode', () => {
    const { rerender } = render(<ProcessStepper {...baseProps} deepMode={false} />);
    expect(screen.getByText('Generér indhold')).toBeTruthy();
    rerender(<ProcessStepper {...baseProps} deepMode={true} />);
    expect(screen.getByText('Kør redaktionsmøde')).toBeTruthy();
  });

  it('derives step status from progress flags', () => {
    render(<ProcessStepper {...baseProps} hasCulturalIntel={true} hasSelectedTerritory={true} />);
    const dataStatus = (label: string) =>
      screen.getByText(label).closest('[data-status]')?.getAttribute('data-status');
    expect(dataStatus('Skan kultur & marked')).toBe('done');   // har intel
    expect(dataStatus('Omni-channel matrix')).toBe('ready');    // idé valgt → klar
    expect(dataStatus('Byg strategi-fundament')).toBe('ready'); // altid kørbar
  });

  it('locks territory-dependent steps until an idea is selected', () => {
    const onGenerateChannelMatrix = vi.fn();
    render(<ProcessStepper {...baseProps} hasSelectedTerritory={false} onGenerateChannelMatrix={onGenerateChannelMatrix} />);
    expect(screen.getByText('Omni-channel matrix').closest('[data-status]')?.getAttribute('data-status')).toBe('locked');
    fireEvent.click(screen.getByText('Omni-channel matrix'));
    expect(onGenerateChannelMatrix).not.toHaveBeenCalled(); // låst → ikke-klikbar
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProcessStepper`
Expected: FAIL — `Failed to resolve import "./ProcessStepper"` (komponenten findes ikke endnu).

- [ ] **Step 3: Write the component**

Create `src/components/ProcessStepper.tsx`:

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Compass, Gauge, Layers, Loader2, Radio, Rocket, Sparkles, Swords, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type StepStatus = 'done' | 'ready' | 'locked';

interface ProcessStepperProps {
  isGenerating: boolean;
  deepMode: boolean;
  generationStep: string;
  isScanning: boolean;
  isGeneratingStrategy: boolean;
  isGeneratingCampaign: boolean;
  isGeneratingMatrix: boolean;
  isGeneratingEffectiveness: boolean;
  hasCulturalIntel: boolean;
  hasStrategy: boolean;
  hasSelectedTerritory: boolean;
  hasPressureTest: boolean;
  hasChannelMatrix: boolean;
  hasEffectiveness: boolean;
  onCulturalScan: () => void;
  onGenerateStrategy: () => void;
  onGenerateBigIdea: () => void;
  onGenerateChannelMatrix: () => void;
  onGenerateEffectiveness: () => void;
  onGenerateAll: () => void;
}

interface Step {
  n: number;
  title: string;
  hint: string;
  Icon: LucideIcon;
  status: StepStatus;
  busy: boolean;
  onClick?: () => void;
}

const dotClass: Record<StepStatus, string> = {
  done: 'bg-emerald-500',
  ready: 'bg-brand-orange-500',
  locked: 'bg-slate-600',
};

function StepRow({ step, isGenerating }: { step: Step; isGenerating: boolean }) {
  const interactive = !!step.onClick && step.status !== 'locked';
  const muted = step.status === 'locked';
  const className =
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-left transition-all ` +
    `${interactive ? 'hover:border-slate-700 cursor-pointer' : 'cursor-default'} ` +
    `${muted ? 'opacity-60' : ''} disabled:opacity-60 disabled:cursor-not-allowed`;

  const inner = (
    <>
      <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-mono font-bold ${
        muted ? 'border-slate-800 text-slate-600' : 'border-brand-orange-500/40 text-brand-orange-400'
      }`}>{step.n}</span>
      <step.Icon className={`w-4 h-4 shrink-0 ${muted ? 'text-slate-600' : 'text-slate-400'}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-display font-semibold text-slate-200">{step.title}</span>
        <span className="block text-[11px] text-slate-500 leading-tight truncate">{step.hint}</span>
      </span>
      {step.busy
        ? <Loader2 className="w-4 h-4 shrink-0 text-brand-orange-400 animate-spin" />
        : <span className={`shrink-0 w-2 h-2 rounded-full ${dotClass[step.status]}`} />}
    </>
  );

  if (interactive) {
    return (
      <button type="button" data-status={step.status} onClick={step.onClick} disabled={isGenerating} className={className}>
        {inner}
      </button>
    );
  }
  return <div data-status={step.status} className={className}>{inner}</div>;
}

export function ProcessStepper(props: ProcessStepperProps) {
  const {
    isGenerating, deepMode, generationStep,
    isScanning, isGeneratingStrategy, isGeneratingCampaign,
    isGeneratingMatrix, isGeneratingEffectiveness,
    hasCulturalIntel, hasStrategy, hasSelectedTerritory,
    hasPressureTest, hasChannelMatrix, hasEffectiveness,
    onCulturalScan, onGenerateStrategy, onGenerateBigIdea,
    onGenerateChannelMatrix, onGenerateEffectiveness, onGenerateAll,
  } = props;

  const territoryStatus = (done: boolean): StepStatus =>
    done ? 'done' : hasSelectedTerritory ? 'ready' : 'locked';

  const steps: Step[] = [
    { n: 1, title: 'Skan kultur & marked', hint: 'Live trends & konkurrenter (valgfrit)', Icon: Radio,
      status: hasCulturalIntel ? 'done' : 'ready', busy: isScanning, onClick: onCulturalScan },
    { n: 2, title: 'Byg strategi-fundament', hint: 'Indsigt · spænding · løfte', Icon: Compass,
      status: hasStrategy ? 'done' : 'ready', busy: isGeneratingStrategy, onClick: onGenerateStrategy },
    { n: 3, title: 'Find Den Store Idé', hint: 'Tre kampagne-platforme', Icon: Rocket,
      status: hasSelectedTerritory ? 'done' : 'ready', busy: isGeneratingCampaign, onClick: onGenerateBigIdea },
    { n: 4, title: 'Skærp idé', hint: hasSelectedTerritory ? 'Pressure-test i højre panel' : 'Kræver en valgt idé', Icon: Swords,
      status: hasPressureTest ? 'done' : hasSelectedTerritory ? 'ready' : 'locked', busy: false },
    { n: 5, title: 'Omni-channel matrix', hint: hasSelectedTerritory ? 'Skalér til alle kanaler' : 'Kræver en valgt idé', Icon: Layers,
      status: territoryStatus(hasChannelMatrix), busy: isGeneratingMatrix, onClick: onGenerateChannelMatrix },
    { n: 6, title: 'Effekt-lag', hint: hasSelectedTerritory ? 'KPI & måleplan' : 'Kræver en valgt idé', Icon: Gauge,
      status: territoryStatus(hasEffectiveness), busy: isGeneratingEffectiveness, onClick: onGenerateEffectiveness },
  ];

  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-sm space-y-2">
      <span className="block text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400 mb-1">Proces</span>

      {steps.map((step) => <StepRow key={step.n} step={step} isGenerating={isGenerating} />)}

      <button
        type="button"
        onClick={onGenerateAll}
        disabled={isGenerating}
        id="generate_all_btn"
        className={`w-full mt-1 py-3.5 px-4 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm ${
          isGenerating ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-brand-orange-600 hover:bg-brand-orange-500 cursor-pointer'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>{generationStep || 'Arbejder...'}</span>
          </>
        ) : deepMode ? (
          <>
            <Users className="w-5 h-5 text-white" />
            <span>Kør redaktionsmøde</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-white" />
            <span>Generér indhold</span>
          </>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ProcessStepper`
Expected: PASS — alle 5 tests grønne.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: ingen fejl (komponenten er endnu ikke importeret, men står ren).

- [ ] **Step 6: Commit**

```bash
git add src/components/ProcessStepper.tsx src/components/ProcessStepper.test.tsx
git commit -m "feat: ProcessStepper-komponent (nummereret funnel-stepper)"
```

---

## Task 2: Threading af status-booleans i App.tsx

**Files:**
- Modify: `src/App.tsx` (BriefForm-kaldet, omkring linje 138-177)

- [ ] **Step 1: Tilføj de tre nye props til BriefForm-kaldet**

I `src/App.tsx`, find `<BriefForm` og tilføj disse tre linjer blandt de eksisterende props (f.eks. lige efter `hasSelectedTerritory={!!selectedTerritory}`):

```tsx
            hasPressureTest={!!pressureTest}
            hasChannelMatrix={!!channelMatrix}
            hasEffectiveness={!!effectiveness}
```

`pressureTest`, `channelMatrix` og `effectiveness` er allerede destruktureret fra `useContentMachine()` øverst i `App.tsx` (linje ~58-62), så ingen ny import er nødvendig.

- [ ] **Step 2: Run lint (forventet fejl indtil Task 3)**

Run: `npm run lint`
Expected: FAIL — `Property 'hasPressureTest' does not exist on type 'BriefFormProps'`. Dette er forventet; Task 3 tilføjer dem til interfacet. (Hvis du kører Task 2 og 3 samlet, springes denne fejl over.)

- [ ] **Step 3: Commit (sammen med Task 3)**

Commit foretages efter Task 3, så træet er konsistent.

---

## Task 3: Indsæt ProcessStepper + Værktøjer-sektion i BriefForm

**Files:**
- Modify: `src/components/BriefForm.tsx`

> Læs filen før redigering — linjenumre kan have flyttet sig. Anker på kommentarerne, ikke linjenumre.

- [ ] **Step 1: Tilføj de 3 nye props til interface + import af ProcessStepper**

Tilføj import øverst i `src/components/BriefForm.tsx` (efter de eksisterende imports, ~linje 12):

```tsx
import { ProcessStepper } from './ProcessStepper';
```

Tilføj de tre felter til `interface BriefFormProps` (efter `hasSelectedTerritory: boolean;`):

```tsx
  hasPressureTest: boolean;
  hasChannelMatrix: boolean;
  hasEffectiveness: boolean;
```

Tilføj dem til destruktureringen i funktionssignaturen (efter `handleGenerateBigIdea, isGeneratingCampaign, hasSelectedTerritory,`):

```tsx
  hasPressureTest, hasChannelMatrix, hasEffectiveness,
```

- [ ] **Step 2: Udskift knap-blokken med ProcessStepper + Værktøjer**

Find blokken der starter ved kommentaren `{/* DEEP MODE TOGGLE (REDAKTIONSMØDE) */}` og slutter ved den afsluttende `</button>` for `{/* PIN TO PRESETS BUTTON */}` (det er hele stakken: deep mode toggle, cultural antenna, cultural intel-indikator, strategy, big idea, strategy-indikator, brainstorm, territory-indikator + matrix + effectiveness, generate-all, visual development, pin).

Erstat **hele den blok** med:

```tsx
            {/* PROCES-STEPPER (funnel i rækkefølge) */}
            <ProcessStepper
              isGenerating={isGenerating}
              deepMode={deepMode}
              generationStep={generationStep}
              isScanning={isScanning}
              isGeneratingStrategy={isGeneratingStrategy}
              isGeneratingCampaign={isGeneratingCampaign}
              isGeneratingMatrix={isGeneratingMatrix}
              isGeneratingEffectiveness={isGeneratingEffectiveness}
              hasCulturalIntel={hasCulturalIntel}
              hasStrategy={hasStrategy}
              hasSelectedTerritory={hasSelectedTerritory}
              hasPressureTest={hasPressureTest}
              hasChannelMatrix={hasChannelMatrix}
              hasEffectiveness={hasEffectiveness}
              onCulturalScan={handleCulturalScan}
              onGenerateStrategy={handleGenerateStrategy}
              onGenerateBigIdea={handleGenerateBigIdea}
              onGenerateChannelMatrix={handleGenerateChannelMatrix}
              onGenerateEffectiveness={handleGenerateEffectiveness}
              onGenerateAll={handleGenerateAll}
            />

            {/* VÆRKTØJER */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">Værktøjer</span>

              <button
                type="button"
                onClick={handleBrainstorm}
                disabled={isGenerating || isBrainstorming}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:text-white font-display font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                title="Generer kreative idéer og vinkler for dette brief — uden at forpligte sig til fuld generering"
              >
                {isBrainstorming
                  ? <Loader2 className="w-4 h-4 text-brand-orange-400 animate-spin shrink-0" />
                  : <Lightbulb className="w-4 h-4 text-brand-orange-400 shrink-0" />}
                <span>{isBrainstorming ? 'Brainstormer idéer...' : 'Brainstorm kreative idéer'}</span>
              </button>

              <button
                type="button"
                onClick={handleVisualDevelop}
                disabled={isGenerating || isVisualDeveloping}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:text-white font-display font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                title="Lad art director-redaktionen udvikle de visuelle idéer og billedprompts ud fra briefet"
              >
                <Palette className="w-4 h-4 text-brand-orange-400 shrink-0" />
                <span>Visuel udvikling · Redaktion</span>
              </button>

              <button
                type="button"
                onClick={() => setDeepMode(v => !v)}
                disabled={isGenerating}
                aria-pressed={deepMode}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-all text-left ${
                  deepMode ? 'bg-brand-orange-600/10 border-brand-orange-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                } ${isGenerating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Lader flere AI-roller kritisere og forbedre hinanden for et mere gennemarbejdet resultat"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Users className={`w-4 h-4 shrink-0 ${deepMode ? 'text-brand-orange-500' : 'text-slate-500'}`} />
                  <span className="min-w-0 text-left">
                    <span className="block text-[11px] font-mono font-bold text-slate-200">Dyb tilstand · Redaktionsmøde</span>
                    <span className="block text-[11px] text-slate-500 leading-tight truncate">Flere AI-roller forbedrer hinanden (langsommere, dyrere)</span>
                  </span>
                </span>
                <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${deepMode ? 'bg-brand-orange-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${deepMode ? 'translate-x-4' : ''}`} />
                </span>
              </button>

              <button
                type="button"
                onClick={handlePinCurrentBrief}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-800 bg-slate-900 text-slate-350 hover:border-slate-700 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Pin dette brief til dine genveje/presets"
              >
                <Pin className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" />
                <span>PIN JOB TIL GENVEJE & PRESETS</span>
              </button>
            </div>
```

- [ ] **Step 3: Fjern nu-ubrugte ikon-imports**

Efter udskiftningen bruger `BriefForm` ikke længere flere lucide-ikoner direkte (de bor nu i `ProcessStepper`). Kør lint for at finde dem (TS6133 "declared but never read") og fjern de ubrugte fra import-listen i linje 7-11. **Behold** dem der stadig bruges i Værktøjer-sektionen og resten af BriefForm: `Lightbulb`, `Palette`, `Users`, `Pin`, `Loader2`, samt alle der bruges i brief-felterne/CVI-scanneren (`Check`, `ChevronRight`, `FileText`, `Fingerprint`, `RotateCcw`, `ShieldCheck`, `Target`, `Trash2`, `UploadCloud`, `Wallet`, `AlertTriangle` osv. — lad lint afgøre). Sandsynlige fjern-kandidater: `Compass`, `Gauge`, `Layers`, `Radio`, `Rocket`, `Sparkles`, `Swords`.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS — ingen type- eller ubrugt-import-fejl.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: PASS — alle tests grønne (104 eksisterende + 5 nye = 109).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/BriefForm.tsx
git commit -m "feat: erstat proces-knapper med ProcessStepper + Værktøjer-sektion"
```

---

## Task 4: Versionsbump 1.17.0 → 1.18.0

**Files:**
- Modify: `package.json` (linje 4)
- Modify: `src/components/AppHeader.tsx` (header-undertitlen `v1.17.0`)
- Modify: `src/App.tsx` (footer-taglinen `· v1.17.0`)

- [ ] **Step 1: Find de tre versionssteder**

Run: `grep -rn "1\.17\.0" package.json src/App.tsx src/components/AppHeader.tsx`
Expected: tre hits (ét pr. fil).

- [ ] **Step 2: Ret alle tre til 1.18.0**

- `package.json`: `"version": "1.18.0"`
- `src/components/AppHeader.tsx`: undertitel-span `v1.18.0`
- `src/App.tsx`: footer `· v1.18.0`

- [ ] **Step 3: Verificér**

Run: `grep -rn "1\.1[78]\.0" package.json src/App.tsx src/components/AppHeader.tsx`
Expected: tre hits, alle `1.18.0`, ingen `1.17.0` tilbage.

- [ ] **Step 4: Commit**

```bash
git add package.json src/App.tsx src/components/AppHeader.tsx
git commit -m "chore: bump version til 1.18.0"
```

---

## Task 5: Verifikation (lint, test, manuelt tema-tjek)

**Files:** ingen ændringer — kun verifikation.

- [ ] **Step 1: Lint + fuld testsuite**

Run: `npm run lint && npm test`
Expected: begge grønne; 109 tests passerer.

- [ ] **Step 2: Start dev-server**

Run: `npm run dev` (kører på http://localhost:3000)

- [ ] **Step 3: Manuelt tema-tjek (kernen i opgaven)**

Bekræft i browseren:
1. **Dark tema:** Proces-stepper viser ①–⑥ + CTA i ensartet stil; ingen regnbue. Værktøjer-sektion nedenunder.
2. **Skift til light tema** (tema-toggle i header). Bekræft at **alle** trin-titler, hints, numre, status-dots og Værktøjer-knapper er fuldt læsbare — intet forsvinder på lys baggrund.
3. **Status-flow:** Klik "Skan kultur & marked" → trin ① får ✓ (grøn dot). Byg strategi → ② ✓. Find Den Store Idé og vælg et territorium i højre panel → ③ ✓, og trin ④–⑥ skifter fra låst (grå) til klar (orange dot).
4. **CTA:** Slå "Dyb tilstand" til i Værktøjer → CTA-teksten skifter til "Kør redaktionsmøde".

- [ ] **Step 4: Stop dev-server**

Run: `pkill -f "tsx server.ts"`

---

## Self-Review (udført ved skrivning)

- **Spec coverage:** Stepper-struktur (Task 1), light-tema-fix via slate+orange (Task 1/3), Værktøjer-sektion (Task 3), komponent-udtræk (Task 1), versionsbump (Task 4), test+manuel verifikation (Task 5). ✅
- **Afvigelse fra spec:** Trin 5–6 er "låst & ikke-klikbar" indtil idé valgt (bevarer nuværende adfærd hvor de var betinget renderet), i stedet for blødt-klikbar. Trin 1–4 følger blød model. Dokumenteret i "Adfærd for låsning".
- **Type-konsistens:** `ProcessStepperProps`-felter matcher props sendt fra `BriefForm` (Task 3) og booleans threadet fra `App` (Task 2). `hasPressureTest`/`hasChannelMatrix`/`hasEffectiveness` defineret konsistent i alle tre filer.
- **Ingen placeholders:** alle steps har konkret kode/kommandoer.
