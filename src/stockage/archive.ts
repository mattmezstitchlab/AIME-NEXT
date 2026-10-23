/**
 * Le fichier .aime : un projet et ses médias dans un seul fichier, indépendant de toute publication.
 * Exporter puis importer redonne un projet identique, médias compris.
 */
import { z } from 'zod';
import type { Projet } from '../core/modele/schemas';
import { ouvrir } from '../core/modele/migrations';

const Archive = z.object({
  format: z.literal('aime-archive'), version: z.literal(1),
  projet: z.unknown(),
  medias: z.record(z.object({ mime: z.string().max(40), base64: z.string() })).default({}),
});

async function versBase64(b: Blob): Promise<string> {
  const octets = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(s);
}

function depuisBase64(b64: string, mime: string): Blob {
  const s = atob(b64);
  const octets = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) octets[i] = s.charCodeAt(i);
  return new Blob([octets], { type: mime });
}

export async function exporter(p: Projet, lireMedia: (id: string) => Promise<Blob | undefined>): Promise<string> {
  const medias: Record<string, { mime: string; base64: string }> = {};
  for (const m of Object.values(p.medias)) {
    const b = await lireMedia(m.id);
    if (!b) throw new Error(`média manquant sur cet appareil : ${m.nom}`);
    medias[m.id] = { mime: m.mime, base64: await versBase64(b) };
  }
  return JSON.stringify({ format: 'aime-archive', version: 1, projet: p, medias });
}

export type Import = { ok: true; projet: Projet; medias: Map<string, Blob>; origine: string; ignores: string[] } | { ok: false; raison: string };

/** Accepte une archive .aime, un projet AIME NEXT seul, ou un export du constructeur d'AIMESTUDIO. */
export function importer(texte: string): Import {
  let brut: unknown;
  try { brut = JSON.parse(texte); } catch { return { ok: false, raison: 'fichier illisible' }; }
  const a = Archive.safeParse(brut);
  const r = ouvrir(a.success ? a.data.projet : brut);
  if (!r.ok) return r;
  const medias = new Map<string, Blob>();
  if (a.success) {
    for (const m of Object.values(r.projet.medias)) {
      const f = a.data.medias[m.id];
      if (!f) return { ok: false, raison: `média absent de l'archive : ${m.nom}` };
      medias.set(m.id, depuisBase64(f.base64, m.mime));
    }
  }
  return { ok: true, projet: r.projet, medias, origine: r.rapport.origine, ignores: r.rapport.ignores };
}
