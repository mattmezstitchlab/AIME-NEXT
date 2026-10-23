import { describe, expect, test } from 'vitest';
import { appliquer, Projet, projetVide, type Commande } from '../src/core';
import { demoLeaEtMarc } from '../src/demo/lea-et-marc';
import { preparerAjout, preparerDuplication } from '../src/editeur/creation';
import { deplacer, libre, redimensionner } from '../src/editeur/gestes';

const PAGE = 'pg-accueil';
const blocs = (p: Projet) => p.supports[0]!.pages[0]!.blocs;

describe('le « + »', () => {
  test('un bloc Date montre l\'événement déjà saisi, sans en créer un autre', () => {
    const p = demoLeaEtMarc();
    const { commande, bloc } = preparerAjout(p, PAGE, 'date');
    const r = appliquer(p, commande).projet;
    expect(Object.keys(r.contenus).length).toBe(Object.keys(p.contenus).length);
    expect(blocs(r).find(b => b.id === bloc)!.source).toBe('c-mariage');
    expect(Projet.safeParse(r).success).toBe(true);
  });
  test('dans un projet vide, il crée l\'information nécessaire, et l\'annuler l\'enlève', () => {
    const p = projetVide('Vide');
    const pg = p.supports[0]!.pages[0]!.id;
    for (const type of ['titre', 'texte', 'bouton', 'date', 'lieu', 'personnes', 'programme']) {
      const { commande } = preparerAjout(p, pg, type, { maintenant: new Date('2026-10-23T12:00:00Z') });
      const r = appliquer(p, commande);
      expect(Projet.safeParse(r.projet).success, type).toBe(true);
      expect(appliquer(r.projet, r.inverse).projet).toEqual(p);
    }
  });
  test('le nouveau bloc se place sans recouvrir les autres', () => {
    let p = demoLeaEtMarc();
    for (let i = 0; i < 4; i++) p = appliquer(p, preparerAjout(p, PAGE, 'texte').commande).projet;
    const bs = blocs(p);
    for (const a of bs) for (const b of bs) if (a !== b) expect(libre([a], b.id, b.place), `${a.id} / ${b.id}`).toBe(true);
  });
  test('une image demande un fichier', () => {
    expect(() => preparerAjout(demoLeaEtMarc(), PAGE, 'image')).toThrow();
  });
  test('dupliquer montre la même information, sans la recopier', () => {
    const p = demoLeaEtMarc();
    const d = preparerDuplication(p, PAGE, 'b-compte')!;
    const r = appliquer(p, d.commande as Commande).projet;
    expect(blocs(r).find(b => b.id === d.bloc)!.source).toBe('c-mariage');
    expect(Object.keys(r.contenus)).toEqual(Object.keys(p.contenus));
  });
});

describe('gestes', () => {
  const p = demoLeaEtMarc();
  const b = (id: string) => blocs(p).find(x => x.id === id)!;
  test('déplacer reste dans la grille', () => {
    expect(deplacer(b('b-bouton'), 5, -10)).toEqual({ x: 8, y: 0, w: 4, h: 1 });
  });
  test('au clavier, élargir recalcule la hauteur selon la forme atteinte', () => {
    const pastille = b('b-pastille');            // 3 colonnes, pastille
    expect(redimensionner(pastille, 1, 0, true)).toEqual({ x: 0, y: 4, w: 4, h: 2 }); // compte à rebours : proportion 2
  });
  test('une place occupée est refusée', () => {
    expect(libre(blocs(p), 'b-mot', { x: 0, y: 9, w: 6, h: 3 })).toBe(false);
    expect(libre(blocs(p), 'b-mot', { x: 0, y: 19, w: 6, h: 3 })).toBe(true);
  });
});
