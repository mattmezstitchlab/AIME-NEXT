/**
 * Le seul état de l'application : un projet, son historique, des abonnés.
 * L'interface (React, via useSyncExternalStore) s'y abonne ; elle ne garde aucune copie du projet.
 */
import type { Projet } from './modele/schemas';
import { CommandeRefusee, type Commande } from './commandes/commandes';
import { Historique } from './commandes/historique';

export type Magasin = {
  lire(): Projet;
  executer(c: Commande, opts?: { cle?: string }): { ok: true } | { ok: false; raison: string };
  annuler(): boolean;
  retablir(): boolean;
  peutAnnuler(): boolean;
  peutRetablir(): boolean;
  /** remplace le projet (ouverture d'un autre projet) et vide l'historique */
  charger(p: Projet): void;
  abonner(f: () => void): () => void;
};

export function creerMagasin(initial: Projet, horloge: () => Date = () => new Date()): Magasin {
  let projet = initial;
  const h = new Historique();
  const abonnes = new Set<() => void>();
  const notifier = () => { for (const f of abonnes) f(); };
  const dater = (p: Projet): Projet => ({ ...p, modifieLe: horloge().toISOString() });

  return {
    lire: () => projet,
    executer(c, opts = {}) {
      try {
        projet = dater(h.executer(projet, c, { cle: opts.cle, t: horloge().getTime() }));
        notifier();
        return { ok: true };
      } catch (e) {
        if (e instanceof CommandeRefusee) return { ok: false, raison: e.message };
        if (e instanceof Error && e.name === 'ZodError') return { ok: false, raison: 'valeur refusée' };
        throw e;
      }
    },
    annuler() { const p = h.annuler(projet); if (!p) return false; projet = dater(p); notifier(); return true; },
    retablir() { const p = h.retablir(projet); if (!p) return false; projet = dater(p); notifier(); return true; },
    peutAnnuler: () => h.peutAnnuler,
    peutRetablir: () => h.peutRetablir,
    charger(p) { projet = p; h.vider(); notifier(); },
    abonner(f) { abonnes.add(f); return () => { abonnes.delete(f); }; },
  };
}
