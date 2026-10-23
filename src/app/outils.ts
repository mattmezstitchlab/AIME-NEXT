/** Petits outils d'interface : abonnement au magasin, téléchargement, lecture de fichiers. */
import { useSyncExternalStore } from 'react';
import type { Magasin, Projet } from '../core';

export function useProjet(m: Magasin): Projet {
  return useSyncExternalStore(m.abonner, m.lire, m.lire);
}

export function telecharger(nom: string, contenu: Blob): void {
  const url = URL.createObjectURL(contenu);
  const a = document.createElement('a');
  a.href = url; a.download = nom; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function nomDeFichier(titre: string): string {
  return (titre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projet').slice(0, 60);
}

export const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type TypeImage = (typeof TYPES_IMAGE)[number];
export const TAILLE_MAX_IMAGE = 25_000_000;

export function imageAcceptable(f: File): f is File & { type: TypeImage } {
  return (TYPES_IMAGE as readonly string[]).includes(f.type) && f.size <= TAILLE_MAX_IMAGE;
}

export async function dimensions(f: Blob): Promise<{ largeur?: number; hauteur?: number }> {
  try {
    const b = await createImageBitmap(f);
    const r = { largeur: b.width, hauteur: b.height };
    b.close();
    return r;
  } catch { return {}; }
}

export function heure(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Une saisie clavier dans un champ garde l'annulation native du navigateur. */
export function dansUnChamp(e: KeyboardEvent | React.KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}
