/**
 * Le modèle canonique d'un projet AIME : la seule source de vérité.
 * Les schémas valident à l'ouverture, à l'import et après chaque migration.
 * Règle : un bloc ne contient pas l'information, il la montre (champ `source`).
 */
import { z } from 'zod';

export const VERSION_PROJET = 1 as const;

export const Id = z.string().regex(/^[a-z0-9][a-z0-9_-]{2,63}$/, 'identifiant invalide');
export const DateISO = z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, 'date ISO attendue');
const Texte = (max: number) => z.string().max(max);

/* ---------- contenus : saisis une fois, montrés partout ---------- */
export const Etape = z.object({ heure: Texte(20), titre: Texte(120), detail: Texte(240).optional() });

export const ContenuTexte = z.object({ id: Id, type: z.literal('texte'), texte: Texte(20000) });
export const ContenuEvenement = z.object({
  id: Id, type: z.literal('evenement'), titre: Texte(200), debut: DateISO,
  lieu: Id.optional(), programme: z.array(Etape).max(60).default([]),
});
export const ContenuLieu = z.object({ id: Id, type: z.literal('lieu'), nom: Texte(200), adresse: Texte(400).optional() });
export const ContenuPersonne = z.object({ id: Id, type: z.literal('personne'), nom: Texte(120), role: Texte(120).optional(), timbre: Id.optional() });
export const ContenuImage = z.object({ id: Id, type: z.literal('image'), media: Id, alt: Texte(400).default('') });

export const Contenu = z.discriminatedUnion('type', [ContenuTexte, ContenuEvenement, ContenuLieu, ContenuPersonne, ContenuImage]);
export type Contenu = z.infer<typeof Contenu>;
export type TypeContenu = Contenu['type'];

/* ---------- médias : références vers le stockage local, jamais d'adresse libre ---------- */
export const Media = z.object({
  id: Id, nom: Texte(200), mime: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  taille: z.number().int().nonnegative().max(25_000_000), largeur: z.number().int().positive().optional(), hauteur: z.number().int().positive().optional(),
});
export type Media = z.infer<typeof Media>;

/* ---------- blocs : une vue d'un contenu, placée sur la grille de 12 ---------- */
export const Place = z.object({
  x: z.number().int().min(0).max(11), y: z.number().int().min(0).max(999),
  w: z.number().int().min(1).max(12), h: z.number().int().min(1).max(60), z: z.number().int().min(0).max(99).optional(),
}).refine(p => p.x + p.w <= 12, 'le bloc dépasse la grille');
export type Place = z.infer<typeof Place>;

export const Verrous = z.object({ position: z.boolean().optional(), taille: z.boolean().optional(), contenu: z.boolean().optional() });

export const Bloc = z.object({
  id: Id, type: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/), source: Id.optional(), place: Place,
  forme: z.string().max(32).optional(), props: z.record(z.unknown()).default({}), verrous: Verrous.optional(),
});
export type Bloc = z.infer<typeof Bloc>;

export const Page = z.object({ id: Id, titre: Texte(200), blocs: z.array(Bloc).max(400) });
export type Page = z.infer<typeof Page>;

export const Support = z.object({ id: Id, type: z.enum(['site', 'document', 'publication']), titre: Texte(200), pages: z.array(Page).min(1).max(200) });
export type Support = z.infer<typeof Support>;

export const Relation = z.object({ de: Id, vers: Id, nature: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/) });

export const Projet = z.object({
  format: z.literal('aime-projet'), version: z.literal(VERSION_PROJET),
  id: Id, titre: Texte(200), creeLe: DateISO, modifieLe: DateISO,
  contenus: z.record(Id, Contenu), medias: z.record(Id, Media).default({}),
  supports: z.array(Support).min(1).max(20), relations: z.array(Relation).max(2000).default([]),
  style: z.object({ designSystem: z.string().regex(/^[a-z0-9-]{2,40}$/) }),
}).superRefine((p, ctx) => {
  for (const [cle, c] of Object.entries(p.contenus)) if (c.id !== cle) ctx.addIssue({ code: 'custom', message: `contenu ${cle} : identifiant différent de sa clé` });
  for (const [cle, m] of Object.entries(p.medias)) if (m.id !== cle) ctx.addIssue({ code: 'custom', message: `média ${cle} : identifiant différent de sa clé` });
  const vus = new Set<string>();
  for (const s of p.supports) for (const pg of s.pages) for (const b of pg.blocs) {
    if (vus.has(b.id)) ctx.addIssue({ code: 'custom', message: `bloc ${b.id} en double` });
    vus.add(b.id);
    if (b.source && !p.contenus[b.source]) ctx.addIssue({ code: 'custom', message: `bloc ${b.id} : contenu ${b.source} introuvable` });
  }
  for (const c of Object.values(p.contenus)) if (c.type === 'image' && !p.medias[c.media]) ctx.addIssue({ code: 'custom', message: `image ${c.id} : média ${c.media} introuvable` });
});
export type Projet = z.infer<typeof Projet>;
