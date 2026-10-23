/** Export d'une page en un seul fichier HTML autonome : grille sur grand écran, colonne sur téléphone, images incluses. */
import { renderToStaticMarkup } from 'react-dom/server';
import type { Projet } from '../core';
import { Page } from '../rendu/Page';
import CSS from '../rendu/rendu.css?raw';

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

async function enDataUrl(b: Blob): Promise<string> {
  return await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => ko(r.error); r.readAsDataURL(b); });
}

export async function exporterHtml(projet: Projet, pageId: string, lireMedia: (id: string) => Promise<Blob | undefined>): Promise<string> {
  const page = projet.supports.flatMap(s => s.pages).find(p => p.id === pageId);
  if (!page) throw new Error('page introuvable');
  const urls = new Map<string, string>();
  for (const m of Object.values(projet.medias)) { const b = await lireMedia(m.id); if (b) urls.set(m.id, await enDataUrl(b)); }
  const x = { projet, urlMedia: (id: string) => urls.get(id), edition: false };
  const grille = renderToStaticMarkup(<Page page={page} x={x} mise="grille" designSystem={projet.style.designSystem} />);
  const colonne = renderToStaticMarkup(<Page page={page} x={x} mise="colonne" designSystem={projet.style.designSystem} />);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(projet.titre)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Outfit:wght@400..700&family=Instrument+Serif&family=Space+Grotesk:wght@400..700&display=swap">
<style>body{margin:0}${CSS}.x-colonne{display:none}@media (max-width:700px){.x-grille{display:none}.x-colonne{display:block}}</style></head>
<body><main><div class="x-grille">${grille}</div><div class="x-colonne">${colonne}</div></main></body></html>`;
}
