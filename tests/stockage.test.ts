import 'fake-indexeddb/auto';
import { describe, expect, test } from 'vitest';
import { ouvrirDepot } from '../src/stockage/depot';
import { exporter, importer } from '../src/stockage/archive';
import { appliquer, projetVide, type Projet } from '../src/core';
import { demoLeaEtMarc } from '../src/demo/lea-et-marc';

let n = 0;
const base = () => `essai-${++n}`;

function avecImage(): { projet: Projet; fichier: Blob } {
  const fichier = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3, 250, 0, 255])], { type: 'image/png' });
  let p = demoLeaEtMarc();
  p = appliquer(p, { type: 'ajouterMedia', media: { id: 'm-photo', nom: 'photo.png', mime: 'image/png', taille: fichier.size } }).projet;
  p = appliquer(p, { type: 'ajouterContenu', contenu: { id: 'c-photo', type: 'image', media: 'm-photo', alt: 'Les mariés sous la halle' } }).projet;
  p = appliquer(p, { type: 'ajouterBloc', page: 'pg-accueil', bloc: { id: 'b-photo', type: 'image', source: 'c-photo', place: { x: 6, y: 15, w: 6, h: 4 }, props: {} } }).projet;
  return { projet: p, fichier };
}

describe('dépôt IndexedDB', () => {
  test('enregistrer puis rouvrir redonne le projet à l\'identique, médias compris', async () => {
    const nom = base();
    const { projet, fichier } = avecImage();
    const d = await ouvrirDepot(nom);
    await d.enregistrer(projet);
    await d.mettreMedia(projet.id, 'm-photo', fichier);
    d.fermer();
    // une « actualisation de la page » : nouvelle connexion à la même base
    const d2 = await ouvrirDepot(nom);
    const r = await d2.charger(projet.id);
    expect(r.ok && r.projet).toEqual(projet);
    const m = await d2.lireMedia('m-photo');
    expect(new Uint8Array(await m!.arrayBuffer())).toEqual(new Uint8Array(await fichier.arrayBuffer()));
    d2.fermer();
  });
  test('la liste des projets, le plus récent d\'abord', async () => {
    const d = await ouvrirDepot(base());
    const a = { ...projetVide('Ancien'), modifieLe: '2026-01-01T00:00:00.000Z' };
    const b = { ...projetVide('Récent'), modifieLe: '2026-10-23T00:00:00.000Z' };
    await d.enregistrer(a); await d.enregistrer(b);
    expect((await d.lister()).map(x => x.titre)).toEqual(['Récent', 'Ancien']);
    d.fermer();
  });
  test('un enregistrement abîmé est signalé, pas affiché à moitié', async () => {
    const d = await ouvrirDepot(base());
    const p = demoLeaEtMarc();
    const casse = structuredClone(p);
    casse.supports[0]!.pages[0]!.blocs[0]!.source = 'c-absent';
    await d.enregistrer(casse);
    const r = await d.charger(p.id);
    expect(r.ok).toBe(false);
    d.fermer();
  });
});

describe('archive .aime', () => {
  test('exporter puis importer redonne le projet et ses médias', async () => {
    const { projet, fichier } = avecImage();
    const texte = await exporter(projet, async id => (id === 'm-photo' ? fichier : undefined));
    const r = importer(texte);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.projet).toEqual(projet);
    expect(new Uint8Array(await r.medias.get('m-photo')!.arrayBuffer())).toEqual(new Uint8Array(await fichier.arrayBuffer()));
  });
  test('un média manquant empêche l\'export au lieu de produire une archive incomplète', async () => {
    const { projet } = avecImage();
    await expect(exporter(projet, async () => undefined)).rejects.toThrow(/média manquant/);
  });
  test('un fichier illisible est refusé', () => {
    expect(importer('pas du json').ok).toBe(false);
  });
});
