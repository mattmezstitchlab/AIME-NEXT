/**
 * La grille universelle : 12 colonnes, des cases carrées, des blocs placés en cases entières.
 * Fonctions pures : aucune ne connaît un type de bloc en particulier, seulement sa définition.
 */
import type { Place } from '../modele/schemas';
import type { DefinitionBloc, Palier } from '../registre/registre';

export const COLONNES = 12;

export type Rect = { x: number; y: number; w: number; h: number };

export function chevauche(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** La forme d'un bloc pour une largeur donnée : le plus grand palier atteint. */
export function palierPour(def: DefinitionBloc, w: number): Palier {
  let r = def.formes[0]!;
  for (const p of def.formes) if (w >= p.aPartirDe) r = p;
  return r;
}

/** Une forme choisie explicitement l'emporte ; sinon, elle suit la largeur. */
export function formePour(def: DefinitionBloc, w: number, choisie?: string): Palier {
  if (choisie) {
    const p = def.formes.find(f => f.forme === choisie);
    if (p) return p;
  }
  return palierPour(def, w);
}

export function hauteurPour(def: DefinitionBloc, w: number, choisie?: string): number {
  return Math.max(1, Math.round(w / formePour(def, w, choisie).proportion));
}

/** Ramène une place dans la grille, sans jamais produire de valeur hors bornes. */
export function contraindre(p: Rect, def?: DefinitionBloc): Place {
  const min = Math.max(1, def?.largeurMin ?? 1);
  const w = Math.min(COLONNES, Math.max(min, Math.round(p.w)));
  const h = Math.min(60, Math.max(1, Math.round(p.h)));
  const x = Math.min(COLONNES - w, Math.max(0, Math.round(p.x)));
  const y = Math.min(999, Math.max(0, Math.round(p.y)));
  return { x, y, w, h };
}

/** Première place libre, ligne par ligne, de gauche à droite. */
export function placeLibre(occupes: readonly Rect[], w: number, h: number): { x: number; y: number } {
  const ww = Math.min(COLONNES, Math.max(1, w));
  for (let y = 0; y < 999; y++) for (let x = 0; x <= COLONNES - ww; x++) {
    const t = { x, y, w: ww, h };
    if (!occupes.some(o => chevauche(t, o))) return { x, y };
  }
  return { x: 0, y: basDe(occupes) };
}

export function basDe(occupes: readonly Rect[]): number {
  return occupes.reduce((m, o) => Math.max(m, o.y + o.h), 0);
}

/** L'ordre de lecture (téléphone, lecteur d'écran) : de haut en bas, puis de gauche à droite. */
export function ordreLecture<T extends { place: Rect; id: string }>(blocs: readonly T[]): T[] {
  return [...blocs].sort((a, b) => a.place.y - b.place.y || a.place.x - b.place.x || a.id.localeCompare(b.id));
}
