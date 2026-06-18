/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CulturalScanResult,
  StrategyFoundation,
  CampaignPlatform,
  CampaignTerritory,
  IdeaDeliberationResult,
  TerritoryCritique,
  ChannelMatrix,
  EffectivenessFramework,
  BrainstormResult,
  VisualDevResult,
} from '../types';

/**
 * Fælles dokument-model for funnel-paneler. De 8 funnel-resultater har vidt
 * forskellige former; her normaliseres alt til én struktur, så arkivering
 * (HTML/Word/Markdown/print) og AI-resumé kan deles på tværs af paneltyper.
 */

export type FunnelBlock =
  | { type: 'p'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'kv'; pairs: Array<{ key: string; value: string }> };

export interface FunnelSection {
  heading: string;
  blocks: FunnelBlock[];
}

export interface FunnelDoc {
  kind: string;
  title: string;
  subtitle?: string;
  sections: FunnelSection[];
}

// ---------------------------------------------------------------------------
// Små helpers til at bygge sektioner kompakt
// ---------------------------------------------------------------------------

function p(text: string): FunnelBlock {
  return { type: 'p', text };
}
function bullets(items: string[]): FunnelBlock {
  return { type: 'bullets', items: items.filter(Boolean) };
}
function kv(pairs: Array<{ key: string; value: string }>): FunnelBlock {
  return { type: 'kv', pairs: pairs.filter((x) => x.value) };
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Serializers — én pr. paneltype
// ---------------------------------------------------------------------------

export function culturalToDoc(intel: CulturalScanResult): FunnelDoc {
  const sections: FunnelSection[] = [];

  sections.push({ heading: 'Kulturelt billede', blocks: [p(intel.groundingNarrative)] });

  if (intel.openingQuestion) {
    sections.push({ heading: 'Strategisk åbningsspørgsmål', blocks: [p(intel.openingQuestion)] });
  }
  if (intel.trends?.length) {
    sections.push({
      heading: `Aktuelle trends · ${intel.trends.length}`,
      blocks: intel.trends.map((t) =>
        kv([
          { key: t.trend, value: t.relevance },
          { key: 'Mulighed', value: t.actionableAngle },
        ]),
      ),
    });
  }
  if (intel.competitorSignals?.length) {
    sections.push({
      heading: `Konkurrent-signaler · ${intel.competitorSignals.length}`,
      blocks: intel.competitorSignals.map((c) =>
        kv([
          { key: c.brand, value: c.signal },
          { key: 'Takeaway', value: c.takeaway },
        ]),
      ),
    });
  }
  if (intel.culturalMoments?.length) {
    sections.push({
      heading: `Kulturelle øjeblikke · ${intel.culturalMoments.length}`,
      blocks: intel.culturalMoments.map((m) =>
        kv([
          { key: m.moment, value: m.opportunity },
        ]),
      ),
    });
  }
  if (intel.timingContext) {
    sections.push({ heading: 'Timing', blocks: [p(intel.timingContext)] });
  }

  return {
    kind: 'cultural',
    title: 'Kulturel Antenne',
    subtitle: intel.searchedAt ? `Scannet ${formatDate(intel.searchedAt)}` : undefined,
    sections,
  };
}

export function strategyToDoc(strategy: StrategyFoundation): FunnelDoc {
  const sections: FunnelSection[] = [];

  if (strategy.strategicSummary) {
    sections.push({ heading: 'Strategisk resumé', blocks: [p(strategy.strategicSummary)] });
  }
  sections.push({
    heading: 'Fundament',
    blocks: [
      kv([
        { key: 'Målgruppe-sandhed', value: strategy.audienceTruth },
        { key: 'Spænding', value: strategy.tension },
        { key: 'Konkurrence-kontekst', value: strategy.competitiveContext },
        { key: 'Single-minded proposition', value: strategy.singleMindedProposition },
        { key: 'Ønsket respons', value: strategy.desiredResponse },
      ]),
    ],
  });
  if (strategy.reasonsToBelieve?.length) {
    sections.push({ heading: 'Reasons to believe', blocks: [bullets(strategy.reasonsToBelieve)] });
  }
  if (strategy.springboards?.length) {
    sections.push({
      heading: `Springbrætter · ${strategy.springboards.length}`,
      blocks: strategy.springboards.map((s) => kv([{ key: s.title, value: s.insight }])),
    });
  }

  return { kind: 'strategy', title: 'Strategi-fundament', sections };
}

function territoryBlocks(t: CampaignTerritory): FunnelBlock[] {
  const blocks: FunnelBlock[] = [
    kv([
      { key: 'Stor idé', value: t.bigIdea },
      { key: 'Tagline', value: t.tagline },
      { key: 'Strategisk rod', value: t.strategicRoot },
      { key: 'Tone', value: t.toneDescriptor },
    ]),
  ];
  if (t.manifesto) blocks.push(p(t.manifesto));
  if (t.rationale) blocks.push(kv([{ key: 'Rationale', value: t.rationale }]));
  if (t.channelExpressions?.length) {
    blocks.push(bullets(t.channelExpressions.map((c) => `${c.channel}: ${c.idea}`)));
  }
  return blocks;
}

export function bigIdeaToDoc(platform: CampaignPlatform): FunnelDoc {
  const sections: FunnelSection[] = (platform.territories || []).map((t) => ({
    heading: t.name,
    blocks: territoryBlocks(t),
  }));
  return { kind: 'bigIdea', title: 'Den Store Idé', sections };
}

function critiqueBlocks(c: TerritoryCritique): FunnelBlock[] {
  const blocks: FunnelBlock[] = [
    kv([
      { key: 'Distinkthed', value: String(c.distinctivenessScore) },
      { key: 'Sandhed', value: String(c.truthScore) },
      { key: 'Elasticitet', value: String(c.elasticityScore) },
      { key: 'Memorabilitet', value: String(c.memorabilityScore) },
      { key: 'Dom', value: c.verdict },
      { key: 'Kill-kriterium', value: c.killCriterion },
    ]),
  ];
  if (c.weaknesses?.length) blocks.push(bullets(c.weaknesses.map((w) => `Svaghed: ${w}`)));
  if (c.provocations?.length) blocks.push(bullets(c.provocations.map((x) => `Provokation: ${x}`)));
  return blocks;
}

export function pressureTestToDoc(
  original: CampaignTerritory,
  result: IdeaDeliberationResult,
): FunnelDoc {
  const sections: FunnelSection[] = [];
  sections.push({ heading: `Original rute: ${original.name}`, blocks: territoryBlocks(original) });
  sections.push({ heading: 'Pres-test (før)', blocks: critiqueBlocks(result.critiqueBefore) });

  if (result.sharpened) {
    const s = result.sharpened;
    const blocks = territoryBlocks(s as unknown as CampaignTerritory);
    if (s.whatChanged?.length) blocks.push(bullets(s.whatChanged.map((w) => `Ændret: ${w}`)));
    sections.push({ heading: `Skærpet rute: ${s.name}`, blocks });
  }
  if (result.critiqueAfter) {
    sections.push({ heading: 'Re-vurdering (efter)', blocks: critiqueBlocks(result.critiqueAfter) });
  }

  return { kind: 'pressureTest', title: 'ECD Pres-test', sections };
}

export function channelMatrixToDoc(matrix: ChannelMatrix): FunnelDoc {
  const sections: FunnelSection[] = (matrix.channels || []).map((a) => {
    const blocks: FunnelBlock[] = [
      kv([
        { key: 'Format', value: a.format },
        { key: 'Overskrift', value: a.headline },
        { key: 'Nøglebudskab', value: a.keyMessage },
        { key: 'CTA', value: a.cta },
        { key: 'Produktionsnoter', value: a.productionNotes },
      ]),
    ];
    if (a.script?.length) {
      blocks.push(bullets(a.script.map((b) => `${b.label}: ${b.content}`)));
    }
    return { heading: a.channel, blocks };
  });
  return { kind: 'channelMatrix', title: 'Omni-channel Matrix', sections };
}

export function effectivenessToDoc(f: EffectivenessFramework): FunnelDoc {
  const sections: FunnelSection[] = [];

  if (f.businessObjective) {
    sections.push({ heading: 'Forretningsmål', blocks: [p(f.businessObjective)] });
  }
  if (f.objectives?.length) {
    sections.push({
      heading: 'Mål-hierarki',
      blocks: f.objectives.map((o) =>
        kv([
          { key: o.level, value: o.objective },
          { key: 'KPI', value: o.kpi },
          { key: 'Mål', value: o.target },
          { key: 'Benchmark', value: o.benchmark },
          { key: 'Metode', value: o.measurementMethod },
        ]),
      ),
    });
  }
  if (f.channelKpis?.length) {
    sections.push({
      heading: 'Kanal-KPI’er',
      blocks: f.channelKpis.map((c) =>
        kv([
          { key: c.channel, value: c.primaryMetric },
          { key: 'Mål', value: c.target },
          { key: 'Værktøj', value: c.measurementTool },
        ]),
      ),
    });
  }
  if (f.balance) {
    sections.push({
      heading: 'Balance (Binet & Field)',
      blocks: [
        kv([
          { key: 'Kort sigt (aktivering)', value: f.balance.shortTermActivation },
          { key: 'Langt sigt (brand)', value: f.balance.longTermBrand },
          { key: 'Anbefalet split', value: f.balance.recommendedSplit },
        ]),
      ],
    });
  }
  if (f.leadingIndicators?.length) {
    sections.push({ heading: 'Leading indicators', blocks: [bullets(f.leadingIndicators)] });
  }
  if (f.laggingIndicators?.length) {
    sections.push({ heading: 'Lagging indicators', blocks: [bullets(f.laggingIndicators)] });
  }
  if (f.successScenario) {
    sections.push({ heading: 'Succes-scenarie', blocks: [p(f.successScenario)] });
  }
  if (f.risks?.length) {
    sections.push({ heading: 'Risici', blocks: [bullets(f.risks)] });
  }
  if (f.measurementCadence) {
    sections.push({ heading: 'Måle-kadence', blocks: [p(f.measurementCadence)] });
  }

  return { kind: 'effectiveness', title: 'Effekt-lag', sections };
}

export function brainstormToDoc(result: BrainstormResult): FunnelDoc {
  const sections: FunnelSection[] = [];

  if (result.projectCore) {
    sections.push({ heading: 'Projektets kerne', blocks: [p(result.projectCore)] });
  }
  if (result.boldQuestion) {
    sections.push({ heading: 'Modigt spørgsmål', blocks: [p(result.boldQuestion)] });
  }
  if (result.angles?.length) {
    sections.push({
      heading: `Vinkler · ${result.angles.length}`,
      blocks: result.angles.map((a) =>
        kv([
          { key: a.title, value: a.headline },
          { key: 'LinkedIn-krog', value: a.linkedinHook },
          { key: 'Begrundelse', value: a.reasoning },
        ]),
      ),
    });
  }
  if (result.keyDifferentiators?.length) {
    sections.push({ heading: 'Differentiatorer', blocks: [bullets(result.keyDifferentiators)] });
  }
  if (result.audienceInsights?.length) {
    sections.push({ heading: 'Målgruppe-indsigter', blocks: [bullets(result.audienceInsights)] });
  }
  if (result.briefGaps?.length) {
    sections.push({ heading: 'Huller i briefet', blocks: [bullets(result.briefGaps)] });
  }

  return { kind: 'brainstorm', title: 'Brainstorm', sections };
}

export function visualToDoc(result: VisualDevResult): FunnelDoc {
  const sections: FunnelSection[] = [];
  const c = result.concept;

  if (c?.visualConcept) {
    sections.push({ heading: 'Visuelt koncept', blocks: [p(c.visualConcept)] });
  }
  if (c?.moodKeywords?.length) {
    sections.push({ heading: 'Mood-keywords', blocks: [bullets(c.moodKeywords)] });
  }
  if (c?.imagePrompts) {
    sections.push({
      heading: 'Billed-prompts (engelsk)',
      blocks: [
        kv([
          { key: 'Hero', value: c.imagePrompts.hero || '' },
          { key: 'Detail', value: c.imagePrompts.detail || '' },
          { key: 'Abstract', value: c.imagePrompts.abstract || '' },
        ]),
      ],
    });
  }
  if (result.critiqueAfter?.overallReview || result.critiqueBefore?.overallReview) {
    const review = result.critiqueAfter?.overallReview || result.critiqueBefore.overallReview;
    sections.push({ heading: 'Art director-vurdering', blocks: [p(review)] });
  }

  return { kind: 'visual', title: 'Visuel Udvikling', sections };
}

// ---------------------------------------------------------------------------
// Flad tekst (til AI-resumé-endpointet)
// ---------------------------------------------------------------------------

export function funnelDocToPlainText(doc: FunnelDoc): string {
  const lines: string[] = [doc.title];
  if (doc.subtitle) lines.push(doc.subtitle);
  for (const section of doc.sections) {
    lines.push('', section.heading);
    for (const block of section.blocks) {
      if (block.type === 'p') {
        lines.push(block.text);
      } else if (block.type === 'bullets') {
        block.items.forEach((i) => lines.push(`- ${i}`));
      } else {
        block.pairs.forEach((pr) => lines.push(`${pr.key}: ${pr.value}`));
      }
    }
  }
  return lines.join('\n');
}

/** Stabil cache-nøgle der invalideres hvis indholdet ændrer sig (fx ved regenerering). */
export function funnelDocCacheKey(doc: FunnelDoc): string {
  const text = funnelDocToPlainText(doc);
  return `${doc.kind}:${text.length}`;
}

/**
 * Bundt flere funnel-dokumenter til ét samlet dokument ("hele forløbet").
 * Hvert kilde-dokuments titel bliver en visuel adskiller-sektion, efterfulgt
 * af dets egne sektioner — så hele casen kan arkiveres som ét dokument.
 */
export function bundleFunnelDocs(docs: FunnelDoc[], title: string): FunnelDoc {
  const sections: FunnelSection[] = [];
  for (const doc of docs) {
    sections.push({
      heading: `▸ ${doc.title}`,
      blocks: doc.subtitle ? [{ type: 'p', text: doc.subtitle }] : [],
    });
    sections.push(...doc.sections);
  }
  return { kind: 'bundle', title, sections };
}
