/**
 * Annuler et rétablir. Repris d'atlasaime (useProjectHistory) : les gestes successifs sur la même cible,
 * à moins de 900 ms d'intervalle (une frappe, un glisser), comptent pour une seule étape.
 */
import type { Projet } from '../modele/schemas';
import { appliquer, type Commande } from './commandes';

export const REGROUPEMENT_MS = 900;
export const LIMITE = 200;

type Etape = { avant: Commande; apres: Commande; cle?: string; t: number };

export class Historique {
  private passe: Etape[] = [];
  private futur: Etape[] = [];

  /** Applique une commande, enregistre son inverse ; `cle` regroupe les gestes répétés sur une même cible. */
  executer(p: Projet, c: Commande, opts: { cle?: string; t?: number } = {}): Projet {
    const t = opts.t ?? Date.now();
    const r = appliquer(p, c);
    const der = this.passe[this.passe.length - 1];
    if (opts.cle && der && der.cle === opts.cle && t - der.t < REGROUPEMENT_MS) {
      der.apres = c; der.t = t; // on garde l'inverse le plus ancien : annuler revient avant le premier geste
    } else {
      this.passe.push({ avant: r.inverse, apres: c, cle: opts.cle, t });
      if (this.passe.length > LIMITE) this.passe.shift();
    }
    this.futur = [];
    return r.projet;
  }

  annuler(p: Projet): Projet | null {
    const e = this.passe.pop();
    if (!e) return null;
    const r = appliquer(p, e.avant);
    this.futur.push({ avant: r.inverse, apres: e.apres, t: e.t });
    return r.projet;
  }

  retablir(p: Projet): Projet | null {
    const e = this.futur.pop();
    if (!e) return null;
    const r = appliquer(p, e.avant);
    this.passe.push({ avant: r.inverse, apres: e.apres, t: e.t });
    return r.projet;
  }

  get peutAnnuler(): boolean { return this.passe.length > 0; }
  get peutRetablir(): boolean { return this.futur.length > 0; }
  vider(): void { this.passe = []; this.futur = []; }
}
