/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProjectBrief, BrandSurfaceOutput, CampaignPlatform, CampaignTerritory, StrategyFoundation, ChannelMatrix, CulturalScanResult, EffectivenessFramework } from '../types';

const KEY = 'brand_surface_session';

export interface SavedSession {
  brief?: ProjectBrief;
  output?: BrandSurfaceOutput | null;
  revisions?: Record<string, string[]>;
  activeCompareIndex?: Record<string, number | null>;
  generatedImages?: Record<string, { url: string; loading: boolean; error: string | null; aspectRatio: string }>;
  cviFileName?: string | null;
  activeTab?: string;
  lockedSections?: string[];
  campaignPlatform?: CampaignPlatform | null;
  selectedTerritory?: CampaignTerritory | null;
  strategy?: StrategyFoundation | null;
  channelMatrix?: ChannelMatrix | null;
  culturalIntel?: CulturalScanResult | null;
  effectiveness?: EffectivenessFramework | null;
  /** "client|project" fingerprint fra det brief funnel-data blev genereret for — bruges til stale-detektion. */
  funnelBriefKey?: string | null;
}

/** Persistér den aktuelle arbejds-session (så intet går tabt ved refresh). */
export function saveSession(s: SavedSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota/privatliv — ignorér stille */
  }
}

/** Hent en gemt session. Nulstiller transiente loading-flag på billeder. */
export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedSession;
    if (s.generatedImages) {
      for (const k of Object.keys(s.generatedImages)) {
        if (s.generatedImages[k]) s.generatedImages[k].loading = false;
      }
    }
    return s;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignorér */
  }
}
