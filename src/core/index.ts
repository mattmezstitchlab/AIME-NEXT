/** Le cœur d'AIME NEXT : TypeScript pur, sans interface. Tout le reste passe par ces exports. */
import './registre/blocs';

export * from './modele/schemas';
export { nouvelId } from './modele/ids';
export { projetVide, contenuDe, personnesDe, blocsQuiMontrent } from './modele/projet';
export { ouvrir, type Ouverture } from './modele/migrations';
export * from './grille/grille';
export { declarer, obtenir, exiger, liste, reglages, type DefinitionBloc, type Palier, type Famille } from './registre/registre';
export { appliquer, CommandeRefusee, type Commande, type Resultat } from './commandes/commandes';
export { Historique, REGROUPEMENT_MS } from './commandes/historique';
export { creerMagasin, type Magasin } from './magasin';
