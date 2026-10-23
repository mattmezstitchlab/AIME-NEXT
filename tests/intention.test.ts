import { describe, expect, test } from 'vitest';
import { appliquer, Projet, projetVide } from '../src/core';
import { demoLeaEtMarc } from '../src/demo/lea-et-marc';
import { commandeIntention, etapes, evenementPrincipal } from '../src/app/intention';

describe('l\'intention de la page unique', () => {
  test('écrire le nom change l\'événement et le titre du projet, sans rien dupliquer', () => {
    const p = demoLeaEtMarc();
    const r = appliquer(p, commandeIntention(p, 'pg-accueil', { titre: 'Inès & Sam' }));
    expect(evenementPrincipal(r.projet)!.titre).toBe('Inès & Sam');
    expect(r.projet.titre).toBe('Inès & Sam');
    expect(Object.keys(r.projet.contenus)).toEqual(Object.keys(p.contenus));
    expect(appliquer(r.projet, r.inverse).projet).toEqual(p);
  });
  test('dans une page vide, la page se compose : un événement, un titre, une date', () => {
    const p = projetVide('Vide');
    const pg = p.supports[0]!.pages[0]!.id;
    const r = appliquer(p, commandeIntention(p, pg, { titre: 'Les 30 ans de Lou' }, new Date('2026-10-23T12:00:00Z'))).projet;
    expect(Projet.safeParse(r).success).toBe(true);
    expect(r.supports[0]!.pages[0]!.blocs.map(b => b.type)).toEqual(['titre', 'date']);
    expect(evenementPrincipal(r)!.debut).toBe('2026-11-23');
  });
  test('les étapes ne sont cochées que si le projet les remplit vraiment', () => {
    const vide = projetVide('Vide');
    expect(etapes(vide, false).filter(e => e.fait).map(e => e.id)).toEqual([]);
    const demo = demoLeaEtMarc();
    expect(etapes(demo, false).filter(e => e.fait).map(e => e.id)).toEqual(['point', 'ligne', 'relation', 'grille', 'composition']);
    expect(etapes(demo, true).every(e => e.fait)).toBe(true);
  });
});
