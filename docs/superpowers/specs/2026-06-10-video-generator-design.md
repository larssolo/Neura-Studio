# Design: Video-generator (Kling 2.5 Turbo Pro · image-to-video)

**Dato:** 2026-06-10
**Status:** Godkendt af bruger (afventer spec-review)
**Område:** ny `server/video/kling.ts`, `server.ts`, ny `src/hooks/useVideoGeneration.ts`, ny `src/components/VideoPanel.tsx`, `src/hooks/useContentMachine.ts`, `src/App.tsx`
**Design-system:** `.interface-design/system.md`

## Problem / mål

Neura Studio har billede- og logo-generatorer, men ingen video. Brugeren vil have en video-generator
ved siden af billede-generatoren, i samme design, med så mange justeringsmuligheder som muligt, via
modellen `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`. Da kling er **image-to-video**, kræver
den et inputbillede — den kobles derfor til billede-generatoren.

## Beslutninger (godkendt)

- **Alle kling-parametre eksponeres:** prompt, negative_prompt, duration (5/10s), cfg_scale, samt det
  valgfrie slut-frame (tail_image_url).
- **Inputbillede:** default = det sidst genererede billede i Billede-panelet (`generatedImages.custom.url`);
  override = en indsat billede-URL. **Upload af egen fil = fast-follow** (kræver fal-storage-upload), ikke i denne cyklus.
- **Placering:** stacket i Assets-klyngen, lige under Billede-panelet.

## Verificeret kling-schema (fal-docs)

`fal-ai/kling-video/v2.5-turbo/pro/image-to-video` input:
| Felt | Type | Påkrævet | Default |
|---|---|---|---|
| `prompt` | string | ✓ | — |
| `image_url` | string | ✓ | — |
| `duration` | enum `"5"`\|`"10"` | nej | `"5"` |
| `negative_prompt` | string | nej | `"blur, distort, and low quality"` |
| `cfg_scale` | float (0–1) | nej | `0.5` |
| `tail_image_url` | string | nej | — |

Output: `result.data.video.url` (en `.mp4`-URL).

## Ikke-mål (YAGNI)

- Ingen fil-upload (fast-follow). Ingen AI-prompt-optimering for video nu. Ingen text-to-video.
- Ingen ændring af billede-/logo-/funnel-flows.
- Avatar-generatoren (`veed/fabric-1.0`) er en separat efterfølgende cyklus.

## Arkitektur

### Backend

**1. Ny adapter `server/video/kling.ts`.**
En ren input-builder + en generate-funktion (mirror af billede-adapterens mønster, så input-mappingen
kan unit-testes uden at mocke fal):
```ts
export interface VideoRequest {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  duration?: '5' | '10';
  cfgScale?: number;
  tailImageUrl?: string;
}

/** Ren mapping: VideoRequest → fal kling input-objekt. */
export function buildKlingInput(req: VideoRequest): Record<string, unknown> {
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    image_url: req.imageUrl,
    duration: req.duration ?? '5',
    cfg_scale: req.cfgScale ?? 0.5,
    negative_prompt: req.negativePrompt?.trim() ? req.negativePrompt : 'blur, distort, and low quality',
  };
  if (req.tailImageUrl?.trim()) input.tail_image_url = req.tailImageUrl;
  return input;
}

export async function generateVideo(req: VideoRequest): Promise<{ videoUrl: string }> { … }
```
`generateVideo` tjekker `FAL_KEY` (klar fejl hvis mangler), konfigurerer fal (genbrug af samme mønster
som `server/image/fal.ts`), kalder `fal.subscribe('fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
{ input: buildKlingInput(req) })`, og udtrækker `result?.data?.video?.url ?? result?.video?.url`
(fejl hvis ingen URL).

**2. Ny route `/api/generate-video` (`server.ts`).**
Validér at `prompt` og `imageUrl` er sat (ellers 400). Kald `generateVideo(...)`, returnér `{ videoUrl }`.
Catch → 500 med klar dansk fejlbesked (samme mønster som `/api/generate-image`).

### Frontend

**3. Ny hook `src/hooks/useVideoGeneration.ts`** (selvstændigt domæne, som `useImageGeneration`):
```ts
type VideoState = { url: string; loading: boolean; error: string | null };
```
- `videoResult: VideoState` state (default tomt).
- `handleGenerateVideo(params: { imageUrl; prompt; negativePrompt; duration; cfgScale; tailImageUrl })`
  → POST `/api/generate-video`; sætter loading/error/url. Bruger `httpErrorMessage`-helperen.
- `setVideoResult` eksponeres (til evt. session-rydning senere).

**4. Ny komponent `src/components/VideoPanel.tsx`.** Ejer kun lokal form-state; afhænger af injicerede
props. Props:
```ts
interface VideoPanelProps {
  generatedImageUrl: string;            // = generatedImages.custom.url ('' hvis intet)
  video: VideoState;
  onGenerate: (params: VideoParams) => void;
}
```
Indhold (system-stil, slate + brand-orange):
- **Input-kilde:** to-knap-toggle "Brug genereret billede" / "Indsæt URL". Når "genereret billede" er
  valgt men `generatedImageUrl` er tomt → hint "Generér først et billede ovenfor". URL-felt vises ved
  "Indsæt URL". Den effektive `imageUrl` = valgt kilde.
- **prompt** (textarea, påkrævet), **negative_prompt** (textarea, default-placeholder),
  **duration** (5s/10s segmenteret toggle), **cfg_scale** (range-slider 0–1, vis værdi),
  **slut-frame** (valgfri URL-input).
- **Generér video**-knap (brand-orange CTA), deaktiveret hvis `!prompt.trim() || !effektivImageUrl || video.loading`.
  Spinner mens `video.loading`.
- **Resultat:** `<video controls src={video.url}>` + download-link, eller fejlboks med "Prøv igen"
  (mirror af `ImageGenCard`'s fejl/loading-mønster).

**5. `src/hooks/useContentMachine.ts`** komponerer `useVideoGeneration()` og surfacer
`videoResult`, `setVideoResult`, `handleGenerateVideo` i sit return (som de øvrige domæne-hooks).

**6. `src/App.tsx`** rendrer `<VideoPanel … />` i Assets-klyngen mellem `ImagePanel` og `LogoPanel`,
med `generatedImageUrl={generatedImages.custom.url}`, `video={videoResult}`,
`onGenerate={handleGenerateVideo}`. Tilføj `videoResult.loading` til `WorkingOverlay`s `show` + en
title-gren "Genererer video".

## Datastrøm

VideoPanel (effektiv imageUrl + prompt + params) → `handleGenerateVideo` → POST `/api/generate-video`
→ `generateVideo` → fal kling → `data.video.url` → `videoResult.url` → `<video>`-afspiller.
Helt adskilt fra billede-/funnel-state; læser kun `generatedImages.custom.url` som default-input.

## Fejlhåndtering

- Manglende `prompt`/`imageUrl` på backend → 400. Manglende FAL_KEY → klar fejl. Ingen video-URL → fejl.
- Frontend: fejl vises i panelets fejlboks; generér-knap re-aktiveres. Kling kan tage ~1–3 min →
  loading-spinner + tekst "Genererer video (kan tage et par minutter)…".

## Test

- `server/video/kling.test.ts`: `buildKlingInput` mapper params korrekt (default duration '5',
  default cfg 0.5, default negative_prompt, tail_image_url kun når sat); `generateVideo` fejler klart
  uden FAL_KEY (mirror af `provider.test.ts`-mønstret).
- `src/components/VideoPanel.test.tsx`: input-kilde-skift; generér-knap deaktiveret uden prompt eller
  uden billede; klik kalder `onGenerate` med korrekte params (inkl. den effektive imageUrl).
- `npm run lint` + `npm test` grønne.
- Manuel: generér et billede → lav en 5s-video af det; test URL-input og 10s + cfg-justering.

## Versionsbump

Minor → `1.20.0` → `1.21.0` (package.json, AppHeader, App.tsx footer, package-lock).

## Åbne spørgsmål

Ingen blokerende. Upload bevidst udskudt til fast-follow. Eksakt fal output-sti bekræftet
(`data.video.url`).
