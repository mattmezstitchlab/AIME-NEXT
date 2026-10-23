/**
 * Toute modification d'un projet est une commande. Chaque commande appliquée renvoie son inverse :
 * c'est ce qui rend chaque geste annulable, testable et enregistrable. Aucune commande ne touche au DOM.
 * Le projet n'est jamais modifié en place : on renvoie un nouveau projet (les parties inchangées sont partagées).
 */
import { Bloc, Contenu, Media, type Place, type Projet } from '../modele/schemas';
import { exiger, reglages } from '../registre/registre';
import '../registre/blocs';
import { COLONNES } from '../grille/grille';

export type Commande =
  | { type: 'ajouterBloc'; page: string; bloc: Bloc; index?: number }
  | { type: 'supprimerBloc'; page: string; id: string }
  | { type: 'placerBloc'; page: string; id: string; place: Place }
  | { type: 'modifierBloc'; page: string; id: string; props?: Record<string, unknown>; forme?: string | null; verrous?: Bloc['verrous'] | null }
  | { type: 'ajouterContenu'; contenu: Contenu }
  | { type: 'remplacerContenu'; contenu: Contenu }
  | { type: 'supprimerContenu'; id: string }
  | { type: 'ajouterMedia'; media: Media }
  | { type: 'supprimerMedia'; id: string }
  | { type: 'renommerProjet'; titre: string }
  | { type: 'changerDesignSystem'; designSystem: string }
  | { type: 'lot'; commandes: Commande[] };

export class CommandeRefusee extends Error {
  constructor(message: string) { super(message); this.name = 'CommandeRefusee'; }
}

export type Resultat = { projet: Projet; inverse: Commande };

function refuser(m: string): never { throw new CommandeRefusee(m); }

function pageDe(p: Projet, pageId: string): { s: number; i: number } {
  for (let s = 0; s < p.supports.length; s++) {
    const i = p.supports[s]!.pages.findIndex(pg => pg.id === pageId);
    if (i >= 0) return { s, i };
  }
  return refuser(`page introuvable : ${pageId}`);
}

function avecBlocs(p: Projet, pageId: string, f: (blocs: Bloc[]) => Bloc[]): Projet {
  const { s, i } = pageDe(p, pageId);
  const supports = p.supports.map((sup, si) => si !== s ? sup : { ...sup, pages: sup.pages.map((pg, pi) => pi !== i ? pg : { ...pg, blocs: f(pg.blocs) }) });
  return { ...p, supports };
}

function blocDe(p: Projet, pageId: string, id: string): { bloc: Bloc; index: number } {
  const { s, i } = pageDe(p, pageId);
  const blocs = p.supports[s]!.pages[i]!.blocs;
  const index = blocs.findIndex(b => b.id === id);
  if (index < 0) refuser(`bloc introuvable : ${id}`);
  return { bloc: blocs[index]!, index };
}

function tousLesBlocs(p: Projet): Bloc[] {
  return p.supports.flatMap(s => s.pages.flatMap(pg => pg.blocs));
}

function utiliseContenu(p: Projet, id: string): boolean {
  return tousLesBlocs(p).some(b => b.source === id || (Array.isArray(b.props.personnes) && (b.props.personnes as unknown[]).includes(id)));
}

function verifierBloc(p: Projet, b: Bloc): Bloc {
  const bloc = Bloc.parse(b);
  const def = exiger(bloc.type);
  if (bloc.place.x + bloc.place.w > COLONNES) refuser(`bloc ${bloc.id} : hors de la grille`);
  if (bloc.source) {
    const c = p.contenus[bloc.source];
    if (!c) refuser(`bloc ${bloc.id} : contenu ${bloc.source} introuvable`);
    if (!def.accepte || !def.accepte.includes(c.type)) refuser(`un bloc ${def.nom} ne montre pas un contenu de type ${c.type}`);
  }
  if (bloc.forme && !def.formes.some(f => f.forme === bloc.forme)) refuser(`forme inconnue pour ${def.nom} : ${bloc.forme}`);
  return { ...bloc, props: reglages(bloc.type, bloc.props) };
}

export function appliquer(p: Projet, c: Commande): Resultat {
  switch (c.type) {
    case 'ajouterBloc': {
      const bloc = verifierBloc(p, c.bloc);
      if (tousLesBlocs(p).some(b => b.id === bloc.id)) refuser(`bloc ${bloc.id} déjà présent`);
      const projet = avecBlocs(p, c.page, blocs => {
        const n = [...blocs];
        n.splice(c.index ?? n.length, 0, bloc);
        return n;
      });
      return { projet, inverse: { type: 'supprimerBloc', page: c.page, id: bloc.id } };
    }
    case 'supprimerBloc': {
      const { bloc, index } = blocDe(p, c.page, c.id);
      return { projet: avecBlocs(p, c.page, blocs => blocs.filter(b => b.id !== c.id)), inverse: { type: 'ajouterBloc', page: c.page, bloc, index } };
    }
    case 'placerBloc': {
      const { bloc } = blocDe(p, c.page, c.id);
      const v = bloc.verrous ?? {};
      if (v.position && (c.place.x !== bloc.place.x || c.place.y !== bloc.place.y)) refuser('ce bloc est verrouillé : sa position ne change pas');
      if (v.taille && (c.place.w !== bloc.place.w || c.place.h !== bloc.place.h)) refuser('ce bloc est verrouillé : sa taille ne change pas');
      const nouveau = verifierBloc(p, { ...bloc, place: c.place });
      return { projet: avecBlocs(p, c.page, blocs => blocs.map(b => b.id === c.id ? nouveau : b)), inverse: { type: 'placerBloc', page: c.page, id: c.id, place: bloc.place } };
    }
    case 'modifierBloc': {
      const { bloc } = blocDe(p, c.page, c.id);
      if (bloc.verrous?.contenu && c.props) refuser('ce bloc est verrouillé : ses réglages ne changent pas');
      const suivant: Bloc = { ...bloc, props: c.props ? { ...bloc.props, ...c.props } : bloc.props };
      if (c.forme !== undefined) { if (c.forme === null) delete suivant.forme; else suivant.forme = c.forme; }
      if (c.verrous !== undefined) { if (c.verrous === null) delete suivant.verrous; else suivant.verrous = c.verrous; }
      const nouveau = verifierBloc(p, suivant);
      /* l'inverse ne rétablit que ce que la commande a changé : annuler un verrou ne touche pas aux réglages */
      const inverse: Commande = { type: 'modifierBloc', page: c.page, id: c.id };
      if (c.props) inverse.props = bloc.props;
      if (c.forme !== undefined) inverse.forme = bloc.forme ?? null;
      if (c.verrous !== undefined) inverse.verrous = bloc.verrous ?? null;
      return { projet: avecBlocs(p, c.page, blocs => blocs.map(b => b.id === c.id ? nouveau : b)), inverse };
    }
    case 'ajouterContenu': {
      const contenu = Contenu.parse(c.contenu);
      if (p.contenus[contenu.id]) refuser(`contenu ${contenu.id} déjà présent`);
      if (contenu.type === 'image' && !p.medias[contenu.media]) refuser(`média ${contenu.media} introuvable`);
      return { projet: { ...p, contenus: { ...p.contenus, [contenu.id]: contenu } }, inverse: { type: 'supprimerContenu', id: contenu.id } };
    }
    case 'remplacerContenu': {
      const contenu = Contenu.parse(c.contenu);
      const ancien = p.contenus[contenu.id] ?? refuser(`contenu introuvable : ${contenu.id}`);
      if (ancien.type !== contenu.type) refuser('un contenu ne change pas de type');
      if (contenu.type === 'image' && !p.medias[contenu.media]) refuser(`média ${contenu.media} introuvable`);
      return { projet: { ...p, contenus: { ...p.contenus, [contenu.id]: contenu } }, inverse: { type: 'remplacerContenu', contenu: ancien } };
    }
    case 'supprimerContenu': {
      const ancien = p.contenus[c.id] ?? refuser(`contenu introuvable : ${c.id}`);
      if (utiliseContenu(p, c.id)) refuser('ce contenu est encore montré par un bloc');
      const { [c.id]: _retire, ...reste } = p.contenus;
      return { projet: { ...p, contenus: reste }, inverse: { type: 'ajouterContenu', contenu: ancien } };
    }
    case 'ajouterMedia': {
      const media = Media.parse(c.media);
      if (p.medias[media.id]) refuser(`média ${media.id} déjà présent`);
      return { projet: { ...p, medias: { ...p.medias, [media.id]: media } }, inverse: { type: 'supprimerMedia', id: media.id } };
    }
    case 'supprimerMedia': {
      const ancien = p.medias[c.id] ?? refuser(`média introuvable : ${c.id}`);
      if (Object.values(p.contenus).some(x => x.type === 'image' && x.media === c.id)) refuser('ce média est encore utilisé');
      const { [c.id]: _retire, ...reste } = p.medias;
      return { projet: { ...p, medias: reste }, inverse: { type: 'ajouterMedia', media: ancien } };
    }
    case 'renommerProjet': {
      const titre = c.titre.trim().slice(0, 200);
      if (!titre) refuser('un projet a un titre');
      return { projet: { ...p, titre }, inverse: { type: 'renommerProjet', titre: p.titre } };
    }
    case 'changerDesignSystem': {
      if (!/^[a-z0-9-]{2,40}$/.test(c.designSystem)) refuser('Design System inconnu');
      return { projet: { ...p, style: { ...p.style, designSystem: c.designSystem } }, inverse: { type: 'changerDesignSystem', designSystem: p.style.designSystem } };
    }
    case 'lot': {
      let projet = p;
      const inverses: Commande[] = [];
      for (const sc of c.commandes) {
        const r = appliquer(projet, sc);
        projet = r.projet;
        inverses.unshift(r.inverse);
      }
      return { projet, inverse: { type: 'lot', commandes: inverses } };
    }
  }
}
