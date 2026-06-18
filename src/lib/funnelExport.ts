/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import type { ProjectBrief } from '../types';
import type { FunnelDoc, FunnelSection } from './funnelDoc';
import { downloadTextFile, slugify } from './exportMarkdown';

export type ArchiveFormat = 'html' | 'markdown' | 'docx' | 'print';

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function docTitle(doc: FunnelDoc, brief?: ProjectBrief): string {
  const ctx = [brief?.client, brief?.project].filter(Boolean).join(' — ');
  return ctx ? `${doc.title} · ${ctx}` : doc.title;
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

function sectionToHtml(section: FunnelSection): string {
  const body = section.blocks
    .map((block) => {
      if (block.type === 'p') return `<p>${esc(block.text)}</p>`;
      if (block.type === 'bullets') {
        return `<ul>${block.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
      }
      return `<dl>${block.pairs
        .map((pr) => `<dt>${esc(pr.key)}</dt><dd>${esc(pr.value)}</dd>`)
        .join('')}</dl>`;
    })
    .join('');
  return `<section><h2>${esc(section.heading)}</h2>${body}</section>`;
}

export function funnelDocToHtml(doc: FunnelDoc, brief?: ProjectBrief): string {
  const title = docTitle(doc, brief);
  const sections = doc.sections.map(sectionToHtml).join('\n');

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.7; padding: 2rem 1rem; }
    .wrapper { max-width: 800px; margin: 0 auto; }
    header { border-bottom: 1px solid #f97316; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
    header h1 { font-size: 1.6rem; color: #f97316; margin-bottom: 0.4rem; }
    header p { font-size: 0.8rem; color: #64748b; }
    section { margin-bottom: 2.5rem; }
    h2 { font-size: 0.7rem; font-family: monospace; color: #f97316; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 0.75rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.4rem; }
    p { color: #cbd5e1; font-size: 0.93rem; margin-bottom: 0.6rem; }
    ul { list-style: none; padding: 0; margin-bottom: 0.6rem; }
    ul li { padding: 0.3rem 0 0.3rem 1.2rem; position: relative; font-size: 0.9rem; color: #cbd5e1; }
    ul li::before { content: '—'; position: absolute; left: 0; color: #f97316; }
    dl { display: grid; grid-template-columns: minmax(5rem, 11rem) 1fr; gap: 0.5rem 1.2rem; margin-bottom: 0.8rem; }
    dt { font-family: monospace; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; padding-top: 0.25rem; overflow-wrap: break-word; }
    dd { color: #cbd5e1; font-size: 0.9rem; min-width: 0; overflow-wrap: break-word; }
    @media print { body { background: #fff; color: #1e293b; } p, dd, ul li { color: #334155; } }
    @media (max-width: 600px) { dl { grid-template-columns: 1fr; } dt { padding-top: 0.75rem; } }
  `.trim();

  const date = new Date().toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${css}</style>
</head>
<body>
<div class="wrapper">
<header>
  <h1>${esc(title)}</h1>
  <p>${doc.subtitle ? `${esc(doc.subtitle)} · ` : ''}Arkiveret ${date} · Neura Studio</p>
</header>
${sections}
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export function funnelDocToMarkdown(doc: FunnelDoc, brief?: ProjectBrief): string {
  const lines: string[] = [`# ${docTitle(doc, brief)}`];
  if (doc.subtitle) lines.push(`\n_${doc.subtitle}_`);

  for (const section of doc.sections) {
    lines.push(`\n## ${section.heading}\n`);
    for (const block of section.blocks) {
      if (block.type === 'p') {
        lines.push(block.text);
      } else if (block.type === 'bullets') {
        block.items.forEach((i) => lines.push(`- ${i}`));
      } else {
        block.pairs.forEach((pr) => lines.push(`**${pr.key}:** ${pr.value}`));
      }
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

export function funnelDocToDocx(doc: FunnelDoc, brief?: ProjectBrief): Document {
  const children: Paragraph[] = [
    new Paragraph({ text: docTitle(doc, brief), heading: HeadingLevel.TITLE }),
  ];
  if (doc.subtitle) children.push(new Paragraph({ children: [new TextRun({ text: doc.subtitle, italics: true })] }));

  for (const section of doc.sections) {
    children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2 }));
    for (const block of section.blocks) {
      if (block.type === 'p') {
        children.push(new Paragraph({ children: [new TextRun(block.text || '')] }));
      } else if (block.type === 'bullets') {
        block.items.forEach((i) => children.push(new Paragraph({ text: i, bullet: { level: 0 } })));
      } else {
        block.pairs.forEach((pr) =>
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${pr.key}: `, bold: true }), new TextRun(pr.value || '')],
            }),
          ),
        );
      }
    }
  }

  return new Document({ sections: [{ children }] });
}

// ---------------------------------------------------------------------------
// Download / print
// ---------------------------------------------------------------------------

export async function downloadFunnelDoc(
  doc: FunnelDoc,
  brief: ProjectBrief | undefined,
  format: Exclude<ArchiveFormat, 'print'>,
): Promise<void> {
  const slug = slugify(`${brief?.client || 'neura'}-${doc.title}`);
  if (format === 'html') {
    downloadTextFile(`${slug}.html`, funnelDocToHtml(doc, brief), 'text/html');
  } else if (format === 'markdown') {
    downloadTextFile(`${slug}.md`, funnelDocToMarkdown(doc, brief), 'text/markdown');
  } else {
    const blob = await Packer.toBlob(funnelDocToDocx(doc, brief));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/** Åbn dokumentet som HTML i et nyt vindue og udløs print-dialogen (gem som PDF). */
export function printFunnelDoc(doc: FunnelDoc, brief?: ProjectBrief): void {
  const html = funnelDocToHtml(doc, brief);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  // Lille forsinkelse så stylesheet er anvendt før print-dialogen åbner.
  setTimeout(() => w.print(), 250);
}
