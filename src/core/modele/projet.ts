/** Créer un projet vide et lire les contenus montrés par un bloc. */
import { VERSION_PROJET, type Bloc, type Contenu, type Projet } from './schemas';
import { nouvelId } from './ids';

export function projetVide(titre = 'Nouveau projet', maintenant = new Date()): Projet {
  const iso = maintenant.toISOString();
  return {
    format: 'aime-projet', version: VERSION_PROJET, id: nouvelId('p'), titre, creeLe: iso, modifieLe: iso,
    contenus: {}, medias: {}, relations: [], style: { designSystem: 'aime-original' },
    supports: [{ id: nouvelId('s'), type: 'site', titre, pages: [{ id: nouvelId('pg'), titre: 'Accueil', blocs: [] }] }],
  };
}

/** Le contenu montré par un bloc, s'il en a un. */
export function contenuDe(p: Projet, b: Bloc): Contenu | undefined {
  return b.source ? p.contenus[b.source] : undefined;
}

/** Les personnes montrées par un bloc Personnes : sa liste, ou toutes les personnes du projet. */
export function personnesDe(p: Projet, b: Bloc): Extract<Contenu, { type: 'personne' }>[] {
  const toutes = Object.values(p.contenus).filter((c): c is Extract<Contenu, { type: 'personne' }> => c.type === 'personne');
  const choix = Array.isArray(b.props.personnes) ? (b.props.personnes as string[]) : [];
  return choix.length ? choix.map(id => toutes.find(c => c.id === id)).filter((c): c is Extract<Contenu, { type: 'personne' }> => !!c) : toutes;
}

/** Les blocs qui montrent un contenu : ce que « l'onde » met à jour quand on le corrige. */
export function blocsQuiMontrent(p: Projet, contenuId: string): Bloc[] {
  return p.supports.flatMap(s => s.pages.flatMap(pg => pg.blocs)).filter(b => b.source === contenuId || (b.type === 'personnes' && personnesDe(p, b).some(c => c.id === contenuId)));
}
