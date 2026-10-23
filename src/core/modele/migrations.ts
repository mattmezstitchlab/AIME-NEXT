/**
 * Ouvrir un projet, quelle que soit son origine : un projet AIME NEXT (validé, migré si besoin),
 * ou un projet exporté par le constructeur du Monde AIME d'AIMESTUDIO (« Exporter le projet », fichier .aime.json).
 * Rien n'est jamais inventé : ce qui ne peut pas être repris est listé dans le rapport.
 */
import { z } from 'zod';
import { Projet, VERSION_PROJET, type Bloc, type Contenu } from './schemas';
import { nouvelId } from './ids';
import { exiger } from '../registre/registre';
import '../registre/blocs';
import { contraindre, hauteurPour } from '../grille/grille';

export type Ouverture = { ok: true; projet: Projet; rapport: { origine: 'aime-next' | 'aimestudio'; repris: number; ignores: string[] } } | { ok: false; raison: string };

/** Les migrations de version : migrations[n] passe de la version n à n + 1. Vide tant qu'il n'existe qu'une version. */
const migrations: Record<number, (brut: Record<string, unknown>) => Record<string, unknown>> = {};

export function ouvrir(brut: unknown, maintenant = new Date()): Ouverture {
  if (!brut || typeof brut !== 'object') return { ok: false, raison: 'ce fichier ne contient pas de projet' };
  const o = brut as Record<string, unknown>;
  if (o.format === 'aime-projet') {
    let v = typeof o.version === 'number' ? o.version : 0;
    if (v > VERSION_PROJET) return { ok: false, raison: `projet créé par une version plus récente (${v})` };
    let x: Record<string, unknown> = o;
    while (v < VERSION_PROJET) {
      const m = migrations[v];
      if (!m) return { ok: false, raison: `version ${v} inconnue` };
      x = m(x); v++;
    }
    const r = Projet.safeParse(x);
    if (!r.success) return { ok: false, raison: 'projet invalide : ' + r.error.issues.slice(0, 3).map(i => i.message).join(' ; ') };
    return { ok: true, projet: r.data, rapport: { origine: 'aime-next', repris: compter(r.data), ignores: [] } };
  }
  if (o.P && typeof o.P === 'object' && Array.isArray(o.blocks)) return depuisAimestudio(o, maintenant);
  return { ok: false, raison: 'format de fichier inconnu' };
}

function compter(p: Projet): number { return p.supports.reduce((n, s) => n + s.pages.reduce((m, pg) => m + pg.blocs.length, 0), 0); }

/* ---------- le constructeur du Monde AIME (AIMESTUDIO) ---------- */
const Ancien = z.object({
  preset: z.string().optional(),
  P: z.object({
    title: z.string().default(''), sub: z.string().default(''), iso: z.string().default(''), place: z.string().default(''),
    text: z.string().default(''), quote: z.string().default(''), cta: z.string().default(''),
    prog: z.array(z.array(z.string())).default([]), people: z.array(z.array(z.string())).default([]),
  }).passthrough(),
  blocks: z.array(z.object({ k: z.string(), x: z.number(), y: z.number().optional(), w: z.number() }).passthrough()),
});

/** type d'AIMESTUDIO → [type AIME NEXT, contenu montré, forme imposée] */
const CORRESPONDANCES: Record<string, [string, 'evenement' | 'lieu' | 'texte' | 'citation' | null, string?]> = {
  hero: ['titre', 'evenement'], texte: ['texte', 'texte'], citation: ['texte', 'citation'],
  bouton: ['bouton', null], rsvp: ['bouton', null],
  'i-date': ['date', 'evenement'], compte: ['date', 'evenement', 'compte'], agenda: ['date', 'evenement', 'calendrier'],
  'i-lieu': ['lieu', 'lieu'], lieu: ['lieu', 'lieu', 'carte'],
  'i-gens': ['personnes', null], programme: ['programme', 'evenement'],
};

function depuisAimestudio(o: Record<string, unknown>, maintenant: Date): Ouverture {
  const r = Ancien.safeParse(o);
  if (!r.success) return { ok: false, raison: 'export AIMESTUDIO illisible' };
  const { P, blocks } = r.data;
  const iso = maintenant.toISOString();
  const contenus: Record<string, Contenu> = {};
  const ajouter = (c: Contenu) => { contenus[c.id] = c; return c.id; };

  const lieu = P.place ? ajouter({ id: nouvelId('c'), type: 'lieu', nom: P.place.slice(0, 200) }) : undefined;
  const debut = /^\d{4}-\d{2}-\d{2}$/.test(P.iso) ? P.iso : iso.slice(0, 10);
  const evenement = ajouter({
    id: nouvelId('c'), type: 'evenement', titre: (P.title || 'Mon événement').slice(0, 200), debut, ...(lieu ? { lieu } : {}),
    programme: P.prog.slice(0, 60).map(e => ({ heure: (e[0] ?? '').slice(0, 20), titre: (e[1] ?? '').slice(0, 120), ...(e[2] ? { detail: e[2].slice(0, 240) } : {}) })),
  });
  const texte = P.text ? ajouter({ id: nouvelId('c'), type: 'texte', texte: P.text }) : undefined;
  const citation = P.quote ? ajouter({ id: nouvelId('c'), type: 'texte', texte: P.quote }) : undefined;
  for (const pe of P.people.slice(0, 200)) if (pe[0]) ajouter({ id: nouvelId('c'), type: 'personne', nom: pe[0].slice(0, 120), ...(pe[1] ? { role: pe[1].slice(0, 120) } : {}) });

  const sources: Record<string, string | undefined> = { evenement, lieu, texte, citation };
  const blocs: Bloc[] = [];
  const ignores: string[] = [];
  for (const a of blocks) {
    const m = CORRESPONDANCES[a.k];
    if (!m) { ignores.push(a.k); continue; }
    const [type, quoi, forme] = m;
    const source = quoi ? sources[quoi] : undefined;
    if (quoi && !source) { ignores.push(a.k); continue; }
    const def = exiger(type);
    const w = Math.max(def.largeurMin ?? 1, Math.min(12, Math.round(a.w)));
    const place = contraindre({ x: a.x, y: a.y ?? 0, w, h: hauteurPour(def, w, forme) }, def);
    const props: Record<string, unknown> = type === 'titre' ? { sousTitre: P.sub.slice(0, 200) } : type === 'bouton' ? { libelle: (P.cta || 'Je réponds').slice(0, 60) } : {};
    blocs.push({ id: nouvelId('b'), type, ...(source ? { source } : {}), place, ...(forme ? { forme } : {}), props: def.props.parse(props) });
  }
  const titre = (P.title || 'Projet importé').slice(0, 200);
  const projet = Projet.safeParse({
    format: 'aime-projet', version: VERSION_PROJET, id: nouvelId('p'), titre, creeLe: iso, modifieLe: iso,
    contenus, medias: {}, relations: [], style: { designSystem: 'original-iris' },
    supports: [{ id: nouvelId('s'), type: 'site', titre, pages: [{ id: nouvelId('pg'), titre: 'Accueil', blocs }] }],
  });
  if (!projet.success) return { ok: false, raison: 'conversion impossible : ' + projet.error.issues[0]?.message };
  return { ok: true, projet: projet.data, rapport: { origine: 'aimestudio', repris: blocs.length, ignores } };
}
