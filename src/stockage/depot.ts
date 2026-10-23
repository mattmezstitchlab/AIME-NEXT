/**
 * Le seul stockage d'AIME NEXT : IndexedDB. Les projets et leurs médias (fichiers) survivent à l'actualisation
 * de la page. Tout projet relu repasse par `ouvrir` (validation et migration) : un enregistrement abîmé est
 * signalé, jamais affiché à moitié. Rien n'est effacé sans demande explicite.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Projet } from '../core/modele/schemas';
import { ouvrir } from '../core/modele/migrations';

export const NOM_BASE = 'aime-next';
const VERSION_BASE = 1;

interface Schema extends DBSchema {
  projets: { key: string; value: { id: string; titre: string; modifieLe: string; projet: Projet } };
  medias: { key: string; value: { id: string; projet: string; fichier: Blob }; indexes: { parProjet: string } };
}

export type Resume = { id: string; titre: string; modifieLe: string };

export type Depot = {
  enregistrer(p: Projet): Promise<void>;
  charger(id: string): Promise<{ ok: true; projet: Projet } | { ok: false; raison: string }>;
  lister(): Promise<Resume[]>;
  mettreMedia(projet: string, id: string, fichier: Blob): Promise<void>;
  lireMedia(id: string): Promise<Blob | undefined>;
  mediasDuProjet(projet: string): Promise<Map<string, Blob>>;
  fermer(): void;
};

export async function ouvrirDepot(nom = NOM_BASE): Promise<Depot> {
  const db: IDBPDatabase<Schema> = await openDB<Schema>(nom, VERSION_BASE, {
    upgrade(base) {
      // version 1 : création ; les versions suivantes n'ajoutent que des magasins ou des index
      if (!base.objectStoreNames.contains('projets')) base.createObjectStore('projets', { keyPath: 'id' });
      if (!base.objectStoreNames.contains('medias')) base.createObjectStore('medias', { keyPath: 'id' }).createIndex('parProjet', 'projet');
    },
  });
  return {
    async enregistrer(p) { await db.put('projets', { id: p.id, titre: p.titre, modifieLe: p.modifieLe, projet: p }); },
    async charger(id) {
      const e = await db.get('projets', id);
      if (!e) return { ok: false, raison: 'projet introuvable sur cet appareil' };
      const r = ouvrir(e.projet);
      return r.ok ? { ok: true, projet: r.projet } : { ok: false, raison: r.raison };
    },
    async lister() {
      const tous = await db.getAll('projets');
      return tous.map(({ id, titre, modifieLe }) => ({ id, titre, modifieLe })).sort((a, b) => b.modifieLe.localeCompare(a.modifieLe));
    },
    async mettreMedia(projet, id, fichier) { await db.put('medias', { id, projet, fichier }); },
    async lireMedia(id) { return (await db.get('medias', id))?.fichier; },
    async mediasDuProjet(projet) {
      const l = await db.getAllFromIndex('medias', 'parProjet', projet);
      return new Map(l.map(m => [m.id, m.fichier]));
    },
    fermer() { db.close(); },
  };
}
