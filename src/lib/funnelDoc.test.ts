import { describe, it, expect } from 'vitest';
import {
  culturalToDoc,
  strategyToDoc,
  channelMatrixToDoc,
  funnelDocToPlainText,
  funnelDocCacheKey,
  bundleFunnelDocs,
} from './funnelDoc';
import type {
  CulturalScanResult,
  StrategyFoundation,
  ChannelMatrix,
} from '../types';

const intel = {
  groundingNarrative: 'Et kulturelt billede.',
  openingQuestion: 'Hvad nu hvis?',
  trends: [{ trend: 'Trend A', relevance: 'Relevant', actionableAngle: 'Vinkel' }],
  competitorSignals: [{ brand: 'Acme', signal: 'Lancerede X', takeaway: 'Pas på' }],
  culturalMoments: [{ moment: 'Debat', opportunity: 'Mulighed' }],
  timingContext: 'Nu er tiden.',
  searchedAt: '2026-06-17T10:00:00.000Z',
} as CulturalScanResult;

describe('culturalToDoc', () => {
  it('maps a cultural scan into a titled document with sections', () => {
    const doc = culturalToDoc(intel);
    expect(doc.kind).toBe('cultural');
    expect(doc.title).toBe('Kulturel Antenne');
    expect(doc.subtitle).toContain('Scannet');
    const text = funnelDocToPlainText(doc);
    expect(text).toContain('Et kulturelt billede.');
    expect(text).toContain('Trend A');
    expect(text).toContain('Acme');
    expect(text).toContain('Debat');
  });
});

describe('strategyToDoc', () => {
  it('includes the single-minded proposition and reasons to believe', () => {
    const strategy = {
      audienceTruth: 'Sandhed',
      tension: 'Spænding',
      competitiveContext: 'Kontekst',
      singleMindedProposition: 'SMP her',
      reasonsToBelieve: ['Grund 1', 'Grund 2'],
      desiredResponse: 'Respons',
      springboards: [{ title: 'Spring', insight: 'Indsigt' }],
      strategicSummary: 'Resumé',
    } as StrategyFoundation;
    const text = funnelDocToPlainText(strategyToDoc(strategy));
    expect(text).toContain('SMP her');
    expect(text).toContain('Grund 1');
    expect(text).toContain('Spring');
  });
});

describe('channelMatrixToDoc', () => {
  it('creates one section per channel', () => {
    const matrix = {
      channels: [
        {
          channel: 'LinkedIn', format: 'Post', headline: 'H', keyMessage: 'K',
          script: [{ label: 'Hook', content: 'Hej' }], productionNotes: 'N', cta: 'C',
        },
      ],
    } as ChannelMatrix;
    const doc = channelMatrixToDoc(matrix);
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].heading).toBe('LinkedIn');
  });
});

describe('bundleFunnelDocs', () => {
  it('merges multiple docs with title dividers preserving all content', () => {
    const a = culturalToDoc(intel);
    const b = strategyToDoc({
      audienceTruth: 'S', tension: 'T', competitiveContext: 'C',
      singleMindedProposition: 'SMP unik', reasonsToBelieve: [], desiredResponse: 'R',
      springboards: [], strategicSummary: 'Resumé',
    } as StrategyFoundation);
    const bundle = bundleFunnelDocs([a, b], 'Hele forløbet');
    expect(bundle.kind).toBe('bundle');
    expect(bundle.title).toBe('Hele forløbet');
    const text = funnelDocToPlainText(bundle);
    expect(text).toContain('▸ Kulturel Antenne');
    expect(text).toContain('▸ Strategi-fundament');
    expect(text).toContain('Et kulturelt billede.');
    expect(text).toContain('SMP unik');
  });
});

describe('funnelDocCacheKey', () => {
  it('changes when content changes', () => {
    const a = funnelDocCacheKey(culturalToDoc(intel));
    const b = funnelDocCacheKey(culturalToDoc({ ...intel, groundingNarrative: 'Et helt andet og længere billede.' }));
    expect(a).not.toBe(b);
    expect(a.startsWith('cultural:')).toBe(true);
  });
});
