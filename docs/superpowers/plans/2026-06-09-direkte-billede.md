# Direkte billede-generering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj en selvstændig billede-indgang (skriv prompt → vælg format → generér) der ikke kræver funnel'en, placeret sammen med logo-panelet som en "Assets"-klynge.

**Architecture:** Genbrug af eksisterende motor — `/api/generate-image` og `useImageGeneration` understøtter allerede vilkårlige prompts. Vi tilføjer ét nyt billede-slot (`custom`), en ny `ImagePanel`-komponent (editerbar prompt-textarea + genbrug af `ImageGenCard`), og wirer den ind i højre kolonne over `LogoPanel`. Ingen backend-ændring, ingen funnel-påvirkning.

**Tech Stack:** React 19, TypeScript, Tailwind 4, lucide-react, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-06-09-direkte-billede-design.md`. **Design-system:** `.interface-design/system.md` (slate + brand-orange, borders-only, `rounded-lg/xl`, `text-[11px]`/`text-xs`).

---

## File Structure

- **Modify** `src/hooks/useImageGeneration.ts` — udvid `GeneratedImageKey` med `'custom'` + initial-state.
- **Modify** `src/components/ImageGenCard.tsx` — tilføj valgfri `disabled?: boolean` på generér-knappen (bagudkompatibelt).
- **Create** `src/components/ImagePanel.tsx` — editerbar prompt + genbrug af `ImageGenCard`; kalder `onGenerate(prompt)`.
- **Create** `src/components/ImagePanel.test.tsx` — komponenttest (jsdom).
- **Modify** `src/App.tsx` — render `ImagePanel` over `LogoPanel` under en "Assets"-overskrift.
- **Modify** `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx`, `package-lock.json` — versionsbump 1.18.0 → 1.19.0.

---

## Task 1: Nyt `custom`-slot i useImageGeneration

**Files:**
- Modify: `src/hooks/useImageGeneration.ts`

- [ ] **Step 1: Udvid key-typen**

Find (linje ~9):
```ts
export type GeneratedImageKey = 'hero' | 'detail' | 'abstract';
```
Ret til:
```ts
export type GeneratedImageKey = 'hero' | 'detail' | 'abstract' | 'custom';
```

- [ ] **Step 2: Tilføj initial-state for slottet**

Find initialiseringen (linje ~21-24):
```ts
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({
    hero: { url: '', loading: false, error: null, aspectRatio: '16:9' },
    detail: { url: '', loading: false, error: null, aspectRatio: '1:1' },
    abstract: { url: '', loading: false, error: null, aspectRatio: '16:9' }
  });
```
Ret til (tilføj `custom`):
```ts
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({
    hero: { url: '', loading: false, error: null, aspectRatio: '16:9' },
    detail: { url: '', loading: false, error: null, aspectRatio: '1:1' },
    abstract: { url: '', loading: false, error: null, aspectRatio: '16:9' },
    custom: { url: '', loading: false, error: null, aspectRatio: '1:1' }
  });
```
(`GeneratedImages = Record<GeneratedImageKey, GeneratedImageState>`, så typen kræver nu `custom`. `handleGenerateImage`/`handleAspectChange` er allerede generiske og behøver ingen ændring.)

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: clean (exit 0). Hvis der er fejl om manglende `custom` et sted, betyder det at et eksisterende sted konstruerer et `GeneratedImages`-objekt uden `custom` — søg `Record<GeneratedImageKey` / hardcodede `{ hero:`-objekter og rapportér før du fortsætter. (Forventning: ingen — kun hook'en konstruerer det.)

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: alle 112 tests passerer fortsat.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useImageGeneration.ts
git commit -m "feat: tilføj custom-slot til billedgenerering (uafhængigt af funnel)"
```

---

## Task 2: `disabled`-prop på ImageGenCard + ny ImagePanel (TDD)

**Files:**
- Modify: `src/components/ImageGenCard.tsx`
- Create: `src/components/ImagePanel.tsx`
- Test: `src/components/ImagePanel.test.tsx`

- [ ] **Step 1: Tilføj valgfri `disabled` til ImageGenCard**

I `src/components/ImageGenCard.tsx`, tilføj til `interface Props` (efter `onGenerate: () => void;`):
```ts
  /** Deaktiverer generér-knappen (fx når prompten er tom). Default: false. */
  disabled?: boolean;
```
Tilføj `disabled = false` til destruktureringen i funktionssignaturen (efter `onGenerate,`):
```ts
  onGenerate,
  disabled = false,
```
Erstat empty-state generér-knappen (i dag linje ~137-143):
```tsx
          <button
            onClick={onGenerate}
            className="w-full py-2 bg-brand-orange-600 hover:bg-brand-orange-500 rounded-lg text-white font-medium text-[11px] shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Generer billede</span>
          </button>
```
med:
```tsx
          <button
            onClick={onGenerate}
            disabled={disabled}
            className={`w-full py-2 rounded-lg text-white font-medium text-[11px] shadow-sm transition-all flex items-center justify-center space-x-1.5 ${
              disabled ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-brand-orange-600 hover:bg-brand-orange-500 cursor-pointer'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Generer billede</span>
          </button>
```
(Eksisterende brugere — `PromptsTab`, `VisualDevPanel` — sender ikke `disabled`, så de er uændrede.)

- [ ] **Step 2: Write the failing test**

Create `src/components/ImagePanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePanel } from './ImagePanel';

const baseImage = { url: '', loading: false, error: null, aspectRatio: '1:1' };

describe('ImagePanel', () => {
  it('renders the prompt textarea', () => {
    render(<ImagePanel image={baseImage} onGenerate={() => {}} onAspectChange={() => {}} />);
    expect(screen.getByPlaceholderText('Beskriv billedet du vil generere…')).toBeTruthy();
  });

  it('does not call onGenerate when the prompt is empty (button disabled)', () => {
    const onGenerate = vi.fn();
    render(<ImagePanel image={baseImage} onGenerate={onGenerate} onAspectChange={() => {}} />);
    fireEvent.click(screen.getByText('Generer billede'));
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('calls onGenerate with the typed prompt', () => {
    const onGenerate = vi.fn();
    render(<ImagePanel image={baseImage} onGenerate={onGenerate} onAspectChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Beskriv billedet du vil generere…'), { target: { value: 'en rød kat' } });
    fireEvent.click(screen.getByText('Generer billede'));
    expect(onGenerate).toHaveBeenCalledWith('en rød kat');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- ImagePanel`
Expected: FAIL — `Failed to resolve import "./ImagePanel"`.

- [ ] **Step 4: Create the ImagePanel component**

Create `src/components/ImagePanel.tsx`:
```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ImageGenCard, type ImageGenState } from './ImageGenCard';

interface ImagePanelProps {
  image: ImageGenState;
  onGenerate: (prompt: string) => void;
  onAspectChange: (ratio: string) => void;
}

export function ImagePanel({ image, onGenerate, onAspectChange }: ImagePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const trimmed = prompt.trim();

  const handleCopy = () => {
    if (!trimmed) return;
    navigator.clipboard?.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
      <span className="block text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">Billede</span>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Beskriv billedet du vil generere…"
        rows={3}
        className="w-full bg-slate-900 border border-slate-800 focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 transition-all font-sans resize-y"
      />

      <ImageGenCard
        label="Dit billede"
        footer="Genereres direkte fra din prompt — ingen funnel nødvendig."
        alt="Genereret billede"
        ratios={['1:1', '16:9', '9:16', '4:3']}
        promptText={trimmed || '—'}
        image={image}
        downloadBase="neura_billede"
        copied={copied}
        onCopy={handleCopy}
        onAspectChange={onAspectChange}
        onGenerate={() => { if (trimmed) onGenerate(prompt); }}
        disabled={!trimmed}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- ImagePanel`
Expected: PASS — 3/3.

- [ ] **Step 6: Run lint + full suite**

Run: `npm run lint && npm test`
Expected: clean; alle tests grønne (115 = 112 + 3).

- [ ] **Step 7: Commit**

```bash
git add src/components/ImageGenCard.tsx src/components/ImagePanel.tsx src/components/ImagePanel.test.tsx
git commit -m "feat: ImagePanel — direkte billede fra prompt (genbruger ImageGenCard)"
```

---

## Task 3: Wire ImagePanel ind i App.tsx (Assets-klynge)

**Files:**
- Modify: `src/App.tsx`

> Læs filen før redigering — anker på kommentaren `{/* LOGO GENERATOR PANEL */}`.

- [ ] **Step 1: Tilføj import**

Øverst i `src/App.tsx`, efter de andre komponent-imports (fx efter `import { LogoPanel } from './components/LogoPanel';`):
```tsx
import { ImagePanel } from './components/ImagePanel';
```

- [ ] **Step 2: Pak LogoPanel ind i en Assets-gruppe med ImagePanel over**

Find blokken (i dag linje ~315-326):
```tsx
            {/* LOGO GENERATOR PANEL */}
            <LogoPanel
              brief={brief}
              logoResult={logoResult}
              isGeneratingLogo={isGeneratingLogo}
              handleGenerateLogo={handleGenerateLogo}
              isOptimizingLogoPrompt={isOptimizingLogoPrompt}
              handleOptimizeLogoPrompt={handleOptimizeLogoPrompt}
              onClearResult={() => setLogoResult(null)}
              copiedKey={copiedKey}
              onCopy={handleCopyToClipboard}
            />
```
Erstat med:
```tsx
            {/* ASSET GENERATORS (uafhængige af funnel) */}
            <div className="space-y-3">
              <span className="block text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">Assets · kræver ikke funnel</span>

              <ImagePanel
                image={generatedImages.custom}
                onGenerate={(p) => handleGenerateImage('custom', p)}
                onAspectChange={(r) => handleAspectChange('custom', r)}
              />

              <LogoPanel
                brief={brief}
                logoResult={logoResult}
                isGeneratingLogo={isGeneratingLogo}
                handleGenerateLogo={handleGenerateLogo}
                isOptimizingLogoPrompt={isOptimizingLogoPrompt}
                handleOptimizeLogoPrompt={handleOptimizeLogoPrompt}
                onClearResult={() => setLogoResult(null)}
                copiedKey={copiedKey}
                onCopy={handleCopyToClipboard}
              />
            </div>
```
(`generatedImages`, `handleGenerateImage`, `handleAspectChange` er allerede destruktureret i `App.tsx` på linje 43/91/92. `generatedImages.custom` er typet efter Task 1.)

- [ ] **Step 3: Run lint + full suite**

Run: `npm run lint && npm test`
Expected: clean; 115 tests grønne.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: placér ImagePanel + LogoPanel i en Assets-klynge i højre kolonne"
```

---

## Task 4: Versionsbump 1.18.0 → 1.19.0

**Files:**
- Modify: `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx`, `package-lock.json`

- [ ] **Step 1: Find versionsstederne**

Run: `grep -rn "1\.18\.0" package.json src/App.tsx src/components/AppHeader.tsx`
Expected: tre hits (ét pr. fil).

- [ ] **Step 2: Ret de tre kilde-steder til 1.19.0**

- `package.json`: `"version": "1.19.0",`
- `src/components/AppHeader.tsx`: `<span>v1.19.0</span>`
- `src/App.tsx` (footer): `&middot; v1.19.0`

- [ ] **Step 3: Synk lockfilen**

Run: `npm install --package-lock-only`
Derefter verificér: `grep -m1 '"version"' package-lock.json` → `"version": "1.19.0",`

- [ ] **Step 4: Verificér + commit**

Run: `grep -rn "1\.1[89]\.0" package.json src/App.tsx src/components/AppHeader.tsx` → alle `1.19.0`, ingen `1.18.0`.
```bash
git add package.json src/App.tsx src/components/AppHeader.tsx package-lock.json
git commit -m "chore: bump version til 1.19.0"
```

---

## Task 5: Verifikation (lint, test, manuelt)

**Files:** ingen ændringer.

- [ ] **Step 1: Lint + fuld testsuite**

Run: `npm run lint && npm test`
Expected: begge grønne; 115 tests passerer.

- [ ] **Step 2: Start dev-server**

Run: `npm run dev` (http://localhost:3000)

- [ ] **Step 3: Manuelt tjek (kernen i opgaven)**

Uden at køre funnel'en:
1. Find "Assets · kræver ikke funnel"-sektionen i højre kolonne (over Logo).
2. I Billede-panelet: generér-knappen er **deaktiveret** med tom prompt.
3. Skriv en prompt → knappen bliver aktiv → klik → billede genereres og vises; vælg et andet format og regenerér (hover → RotateCcw); download virker.
4. Bekræft at funnel-billederne (hero/detail/abstract i PromptsTab/Visuel udvikling) er **upåvirkede**.
5. Skift dark/light tema → panelet er fuldt læsbart i begge.

- [ ] **Step 4: Stop dev-server**

Run: `pkill -f "tsx server.ts"`

---

## Self-Review (udført ved skrivning)

- **Spec coverage:** custom-slot (Task 1), ImagePanel + ImageGenCard-genbrug + disabled-når-tom (Task 2), App-placering under Assets-overskrift over Logo (Task 3), lokal copy (Task 2, `handleCopy` i ImagePanel), versionsbump (Task 4), test + manuel (Task 5). Session-gendannelse kræver ingen ændring (dokumenteret i spec). ✅
- **Type-konsistens:** `GeneratedImageKey` udvides i Task 1 og bruges i Task 3 (`generatedImages.custom`, `handleGenerateImage('custom', …)`). `ImageGenState` importeres fra `ImageGenCard` i ImagePanel. `disabled?: boolean` defineret i Task 2 og brugt i ImagePanel samme task.
- **Ingen placeholders:** alle steps har konkret kode/kommandoer.
- **YAGNI:** ingen prompt-prefill/AI-optimering; ingen backend-ændring; genbrug af ImageGenCard frem for duplikeret preview-kode.
