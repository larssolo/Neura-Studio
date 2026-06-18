import { describe, it, expect } from 'vitest';
import { funnelDocToHtml, funnelDocToMarkdown, funnelDocToDocx } from './funnelExport';
import type { FunnelDoc } from './funnelDoc';

const doc: FunnelDoc = {
  kind: 'cultural',
  title: 'Kulturel Antenne',
  subtitle: 'Scannet 17/6 2026',
  sections: [
    { heading: 'Kulturelt billede', blocks: [{ type: 'p', text: 'Et billede.' }] },
    { heading: 'Trends', blocks: [{ type: 'bullets', items: ['Trend A', 'Trend B'] }] },
    {
      heading: 'Detaljer',
      blocks: [{ type: 'kv', pairs: [{ key: 'Brand', value: 'Acme' }] }],
    },
  ],
};

describe('funnelDocToHtml', () => {
  it('produces a valid, self-contained HTML document', () => {
    const html = funnelDocToHtml(doc, { client: 'Acme', project: 'Launch' } as any);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Kulturel Antenne');
    expect(html).toContain('Et billede.');
    expect(html).toContain('<li>Trend A</li>');
    expect(html).toContain('<dt>Brand</dt>');
  });

  it('escapes HTML special characters', () => {
    const unsafe: FunnelDoc = {
      ...doc,
      sections: [{ heading: 'X', blocks: [{ type: 'p', text: '<script>alert(1)</script>' }] }],
    };
    const html = funnelDocToHtml(unsafe);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('funnelDocToMarkdown', () => {
  it('renders headings, bullets and key-value pairs', () => {
    const md = funnelDocToMarkdown(doc);
    expect(md).toContain('# Kulturel Antenne');
    expect(md).toContain('## Trends');
    expect(md).toContain('- Trend A');
    expect(md).toContain('**Brand:** Acme');
  });
});

describe('funnelDocToDocx', () => {
  it('builds a docx Document without throwing', () => {
    const document = funnelDocToDocx(doc);
    expect(document).toBeTruthy();
  });
});
