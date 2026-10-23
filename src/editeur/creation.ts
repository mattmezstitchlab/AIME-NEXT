/**
 * Ce que fait le « + » : préparer la commande qui ajoute un bloc, en réutilisant les informations existantes.
 * Un bloc Date montre l'événement déjà saisi ; il n'en crée un que s'il n'y en a aucun. Fonctions pures, testées.
 */
import { exiger, hauteurPour, nouvelId, placeLibre, type Bloc, type Commande, type Contenu, type Projet } from '../core';

export function dansUnMois(maintenant = new Date()): string {
  const d = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, maintenant.getDate(), 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function premier<T extends Contenu['type']>(p: Projet, type: T): Extract<Contenu, { type: T }> | undefined {
  return Object.values(p.contenus).find((c): c is Extract<Contenu, { type: T }> => c.type === type);
}

/** La commande d'ajout et l'identifiant du nouveau bloc. Pour une image, passer le contenu image déjà prêt. */
export function preparerAjout(p: Projet, pageId: string, type: string, opts: { image?: { contenu: Contenu; commandes: Commande[] }; maintenant?: Date } = {}): { commande: Commande; bloc: string } {
  const def = exiger(type);
  const page = p.supports.flatMap(s => s.pages).find(pg => pg.id === pageId);
  if (!page) throw new Error('page introuvable');
  const avant: Commande[] = [];
  let source: string | undefined;
  const creer = (c: Contenu) => { avant.push({ type: 'ajouterContenu', contenu: c }); return c.id; };
  const evenement = () => premier(p, 'evenement')?.id ?? creer({ id: nouvelId('c'), type: 'evenement', titre: 'Mon événement', debut: dansUnMois(opts.maintenant), programme: [] });

  switch (type) {
    case 'titre': source = premier(p, 'evenement')?.id ?? premier(p, 'texte')?.id ?? evenement(); break;
    case 'date': case 'programme': source = evenement(); break;
    case 'lieu': source = premier(p, 'lieu')?.id ?? creer({ id: nouvelId('c'), type: 'lieu', nom: 'Le lieu' }); break;
    case 'texte': source = creer({ id: nouvelId('c'), type: 'texte', texte: 'Écrivez ici.' }); break;
    case 'personnes': if (!premier(p, 'personne')) creer({ id: nouvelId('c'), type: 'personne', nom: 'Une personne' }); break;
    case 'image':
      if (!opts.image) throw new Error('une image est nécessaire');
      avant.push(...opts.image.commandes);
      source = opts.image.contenu.id;
      break;
  }
  const w = def.largeurDefaut, h = hauteurPour(def, w);
  const { x, y } = placeLibre(page.blocs.map(b => b.place), w, h);
  const bloc: Bloc = { id: nouvelId('b'), type, ...(source ? { source } : {}), place: { x, y, w, h }, props: {} };
  return { commande: { type: 'lot', commandes: [...avant, { type: 'ajouterBloc', page: pageId, bloc }] }, bloc: bloc.id };
}

/** Dupliquer : même contenu montré (pas de copie de l'information), placé à la première place libre. */
export function preparerDuplication(p: Projet, pageId: string, id: string): { commande: Commande; bloc: string } | null {
  const page = p.supports.flatMap(s => s.pages).find(pg => pg.id === pageId);
  const b = page?.blocs.find(x => x.id === id);
  if (!page || !b) return null;
  const { x, y } = placeLibre(page.blocs.map(o => o.place), b.place.w, b.place.h);
  const copie: Bloc = { ...structuredClone(b), id: nouvelId('b'), place: { ...b.place, x, y } };
  delete copie.verrous;
  return { commande: { type: 'ajouterBloc', page: pageId, bloc: copie }, bloc: copie.id };
}
