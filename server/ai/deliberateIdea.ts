/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateStructured } from './structured';
import { config } from './config';
import {
  buildTerritoryCritique,
  buildTerritorySharpen,
  type Brief,
  type Territory,
  type StrategyFoundation,
} from './prompts';
import { territoryCritiqueTool, sharpenedTerritoryTool } from './schemas';

/**
 * "ECD pres-test" — en server-side deliberation hvor strategen pres-tester én
 * kreativ rute, og den kreative direktør skærper den som svar.
 *
 * Pres-test (CSO) → Skærpning (ECD) → Re-vurdér (CSO, før/efter).
 */

export interface TerritoryCritique {
  distinctivenessScore: number;
  truthScore: number;
  elasticityScore: number;
  memorabilityScore: number;
  weaknesses: string[];
  provocations: string[];
  killCriterion: string;
  verdict: string;
}

export interface SharpenedTerritory {
  name: string;
  bigIdea: string;
  tagline: string;
  manifesto: string;
  strategicRoot: string;
  channelExpressions: Array<{ channel: string; idea: string }>;
  toneDescriptor: string;
  rationale: string;
  whatChanged: string[];
}

export interface IdeaDeliberateOptions {
  brief: Brief;
  territory: Territory;
  strategy?: StrategyFoundation | null;
  /** Gennemsnitlig score (0-100) hvor ruten anses for stærk nok til at springe skærpningen over. Standard 90. */
  goodEnoughThreshold?: number;
  signal?: AbortSignal;
  onUsage?: (u: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }) => void;
}

export interface IdeaDeliberateResult {
  critiqueBefore: TerritoryCritique;
  sharpened?: SharpenedTerritory;
  critiqueAfter?: TerritoryCritique;
  earlyStopped: boolean;
}

const DEFAULT_THRESHOLD = 90;

function scoreOf(c: TerritoryCritique): number {
  return (c.distinctivenessScore + c.truthScore + c.elasticityScore + c.memorabilityScore) / 4;
}

function ensureNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('Forespørgslen blev afbrudt.');
}

async function critique(
  brief: Brief,
  territory: Territory,
  strategy: StrategyFoundation | null | undefined,
  onUsage: IdeaDeliberateOptions['onUsage'],
  signal?: AbortSignal,
): Promise<TerritoryCritique> {
  const c = buildTerritoryCritique(brief, territory, strategy);
  return generateStructured<TerritoryCritique>({
    system: c.system,
    userContent: [{ type: 'text', text: c.user }],
    tool: territoryCritiqueTool,
    model: config.model,
    maxTokens: 4096,
    signal,
    onUsage,
  });
}

export async function runIdeaDeliberation(
  opts: IdeaDeliberateOptions,
): Promise<IdeaDeliberateResult> {
  const { brief, territory, strategy, signal, onUsage } = opts;
  const threshold = opts.goodEnoughThreshold ?? DEFAULT_THRESHOLD;

  ensureNotAborted(signal);

  // 1. Pres-test (CSO)
  const critiqueBefore = await critique(brief, territory, strategy, onUsage, signal);

  // Early-stop: ruten er allerede usædvanligt stærk.
  if (scoreOf(critiqueBefore) >= threshold) {
    return { critiqueBefore, earlyStopped: true };
  }

  // 2. Skærpning (ECD)
  ensureNotAborted(signal);
  const s = buildTerritorySharpen(brief, territory, critiqueBefore, strategy);
  const sharpened = await generateStructured<SharpenedTerritory>({
    system: s.system,
    userContent: [{ type: 'text', text: s.user }],
    tool: sharpenedTerritoryTool,
    model: config.creativeModel,
    maxTokens: config.maxTokens,
    signal,
    onUsage,
  });

  // 3. Re-vurdér den skærpede rute (før/efter)
  ensureNotAborted(signal);
  const critiqueAfter = await critique(brief, sharpened as unknown as Territory, strategy, onUsage, signal);

  return { critiqueBefore, sharpened, critiqueAfter, earlyStopped: false };
}
