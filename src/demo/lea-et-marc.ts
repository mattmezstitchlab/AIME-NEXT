/**
 * Démonstration : « Léa & Marc », un mariage fictif. Un seul événement, montré par plusieurs blocs
 * sous des formes différentes ; corriger la date une fois met à jour tous ces blocs.
 */
import { VERSION_PROJET, type Projet } from '../core/modele/schemas';
import '../core/registre/blocs';

export function demoLeaEtMarc(maintenant = new Date('2026-10-23T12:00:00Z')): Projet {
  const iso = maintenant.toISOString();
  return {
    format: 'aime-projet', version: VERSION_PROJET, id: 'p-demo-lea-et-marc', titre: 'Léa & Marc', creeLe: iso, modifieLe: iso,
    style: { designSystem: 'aime-original' }, medias: {}, relations: [],
    contenus: {
      'c-mariage': { id: 'c-mariage', type: 'evenement', titre: 'Léa & Marc', debut: '2027-06-14', lieu: 'c-chateau', programme: [
        { heure: '15:00', titre: 'Cérémonie', detail: 'à la chapelle' }, { heure: '16:30', titre: "Vin d'honneur", detail: 'sous la halle' },
        { heure: '19:30', titre: 'Dîner' }, { heure: '22:30', titre: 'Soirée' }] },
      'c-chateau': { id: 'c-chateau', type: 'lieu', nom: 'Château de la Frémoire', adresse: 'Vertou, Loire-Atlantique' },
      'c-mot': { id: 'c-mot', type: 'texte', texte: 'Nous serions si heureux de vous compter parmi nous ce jour-là.' },
      'c-lea': { id: 'c-lea', type: 'personne', nom: 'Léa', role: 'Mariée' },
      'c-marc': { id: 'c-marc', type: 'personne', nom: 'Marc', role: 'Marié' },
      'c-lucie': { id: 'c-lucie', type: 'personne', nom: 'Lucie', role: 'Témoin' },
    },
    supports: [{ id: 's-site', type: 'site', titre: 'Le site du mariage', pages: [{ id: 'pg-accueil', titre: 'Accueil', blocs: [
      { id: 'b-titre', type: 'titre', source: 'c-mariage', place: { x: 0, y: 0, w: 12, h: 4 }, props: { niveau: 1, aligne: 'centre', sousTitre: 'Nous nous marions' } },
      { id: 'b-pastille', type: 'date', source: 'c-mariage', place: { x: 0, y: 4, w: 3, h: 2 }, props: {} },
      { id: 'b-compte', type: 'date', source: 'c-mariage', place: { x: 3, y: 4, w: 5, h: 3 }, props: {} },
      { id: 'b-bouton', type: 'bouton', place: { x: 8, y: 4, w: 4, h: 1 }, props: { libelle: 'Je confirme ma venue', lien: '#reponse' } },
      { id: 'b-mot', type: 'texte', source: 'c-mot', place: { x: 0, y: 7, w: 6, h: 3 }, props: { aligne: 'gauche' } },
      { id: 'b-lieu', type: 'lieu', source: 'c-chateau', place: { x: 6, y: 7, w: 6, h: 4 }, props: {} },
      { id: 'b-programme', type: 'programme', source: 'c-mariage', place: { x: 0, y: 11, w: 6, h: 4 }, props: {} },
      { id: 'b-personnes', type: 'personnes', place: { x: 6, y: 11, w: 6, h: 4 }, props: { personnes: [] } },
      { id: 'b-frise', type: 'date', source: 'c-mariage', place: { x: 0, y: 15, w: 12, h: 4 }, props: {} },
    ] }] }],
  };
}
