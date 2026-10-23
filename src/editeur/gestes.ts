/** Les gestes sur la grille, en cases entières. Fonctions pures, partagées par la souris, le doigt et le clavier. */
import { chevauche, contraindre, exiger, hauteurPour, type Bloc, type Place } from '../core';

export function deplacer(b: Bloc, dx: number, dy: number): Place {
  return contraindre({ ...b.place, x: b.place.x + dx, y: b.place.y + dy }, exiger(b.type));
}

/** Redimensionner. Au clavier (`auto`), changer la largeur recalcule la hauteur selon la forme atteinte. */
export function redimensionner(b: Bloc, dw: number, dh: number, auto = false): Place {
  const def = exiger(b.type);
  const w = b.place.w + dw;
  const h = auto && dw !== 0 ? hauteurPour(def, Math.min(12, Math.max(1, w)), b.forme) : b.place.h + dh;
  return contraindre({ ...b.place, w, h }, def);
}

/** Une place est libre si elle ne recouvre aucun autre bloc de la page. */
export function libre(blocs: readonly Bloc[], id: string, p: Place): boolean {
  return !blocs.some(o => o.id !== id && chevauche(o.place, p));
}

export function memePlace(a: Place, b: Place): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}
