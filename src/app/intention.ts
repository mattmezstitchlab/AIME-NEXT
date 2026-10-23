/**
 * L'intention en haut de la page unique : un nom et une date. Fonctions pures, testées.
 * Écrire son intention modifie l'événement principal ; s'il n'existe pas encore, la page se compose :
 * l'événement est créé avec un titre et un compte à rebours.
 */
import { exiger, hauteurPour, nouvelId, placeLibre, type Bloc, type Commande, type Contenu, type Projet } from '../core';
import { dansUnMois } from '../editeur/creation';

export type Evenement = Extract<Contenu, { type: 'evenement' }>;

export function evenementPrincipal(p: Projet): Evenement | undefined {
  return Object.values(p.contenus).find((c): c is Evenement => c.type === 'evenement');
}

export function commandeIntention(p: Projet, pageId: string, champs: { titre?: string; debut?: string }, maintenant = new Date()): Commande {
  const ev = evenementPrincipal(p);
  const cmds: Commande[] = [];
  if (ev) {
    cmds.push({ type: 'remplacerContenu', contenu: { ...ev, ...champs } });
  } else {
    const nouveau: Evenement = { id: nouvelId('c'), type: 'evenement', titre: champs.titre ?? '', debut: champs.debut ?? dansUnMois(maintenant), programme: [] };
    cmds.push({ type: 'ajouterContenu', contenu: nouveau });
    const page = p.supports.flatMap(s => s.pages).find(pg => pg.id === pageId);
    const occupes = [...(page?.blocs ?? []).map(b => b.place)];
    for (const [type, w] of [['titre', 12], ['date', 6]] as const) {
      const def = exiger(type), h = hauteurPour(def, w), { x, y } = placeLibre(occupes, w, h);
      const b: Bloc = { id: nouvelId('b'), type, source: nouveau.id, place: { x, y, w, h }, props: def.props.parse({}) };
      occupes.push(b.place);
      cmds.push({ type: 'ajouterBloc', page: pageId, bloc: b });
    }
  }
  if (champs.titre !== undefined && champs.titre.trim()) cmds.push({ type: 'renommerProjet', titre: champs.titre });
  return { type: 'lot', commandes: cmds };
}

export type Etape = { id: string; nom: string; fait: boolean; aide: string };

/** Les six étapes, du point au projet, calculées d'après le projet réel : rien n'est coché pour faire joli. */
export function etapes(p: Projet, enregistre: boolean): Etape[] {
  const ev = evenementPrincipal(p);
  const blocs = p.supports.flatMap(s => s.pages.flatMap(pg => pg.blocs));
  const types = new Set(blocs.map(b => b.type));
  return [
    { id: 'point', nom: 'Point', fait: !!ev?.titre.trim(), aide: 'Écrivez ce que vous préparez.' },
    { id: 'ligne', nom: 'Ligne', fait: !!ev?.debut, aide: 'Choisissez une date.' },
    { id: 'relation', nom: 'Relation', fait: Object.values(p.contenus).some(c => c.type === 'personne'), aide: 'Ajoutez des personnes avec le « + ».' },
    { id: 'grille', nom: 'Grille', fait: blocs.length > 0, aide: 'Placez un premier bloc.' },
    { id: 'composition', nom: 'Composition', fait: types.size >= 3, aide: 'Associez au moins trois sortes de blocs.' },
    { id: 'projet', nom: 'Projet', fait: enregistre, aide: 'Modifiez quoi que ce soit : votre projet est enregistré.' },
  ];
}
