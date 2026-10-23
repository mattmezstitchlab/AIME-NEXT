/** Mise en forme française des dates, sans dépendance. Une date ISO « AAAA-MM-JJ » est lue à midi, heure locale. */
export const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function lireDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return isNaN(d.getTime()) ? null : d;
}

export function dateLongue(iso: string): string {
  const d = lireDate(iso);
  return d ? `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}` : iso;
}

/** Jours entiers entre aujourd'hui et la date ; négatif si elle est passée. */
export function joursAvant(iso: string, maintenant = new Date()): number | null {
  const d = lireDate(iso);
  if (!d) return null;
  const a = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 12);
  return Math.round((d.getTime() - a.getTime()) / 86_400_000);
}

/** Les semaines du mois de la date, lundi en premier ; null pour les cases hors du mois. */
export function semainesDuMois(iso: string): (number | null)[][] {
  const d = lireDate(iso);
  if (!d) return [];
  const premier = new Date(d.getFullYear(), d.getMonth(), 1);
  const nb = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const decalage = (premier.getDay() + 6) % 7;
  const cases: (number | null)[] = [...Array(decalage).fill(null), ...Array.from({ length: nb }, (_, i) => i + 1)];
  while (cases.length % 7) cases.push(null);
  const s: (number | null)[][] = [];
  for (let i = 0; i < cases.length; i += 7) s.push(cases.slice(i, i + 7));
  return s;
}

export function initiales(nom: string): string {
  return nom.split(/[\s&-]+/).filter(Boolean).slice(0, 2).map(m => m[0]!.toUpperCase()).join('');
}
