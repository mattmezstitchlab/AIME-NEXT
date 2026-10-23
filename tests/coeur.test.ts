import { describe, expect, test } from 'vitest';
import {
  Projet, appliquer, blocsQuiMontrent, contraindre, creerMagasin, exiger, formePour, hauteurPour, liste, ordreLecture,
  ouvrir, placeLibre, projetVide, Historique, REGROUPEMENT_MS, type Bloc, type Commande, type Contenu,
} from '../src/core';
import { demoLeaEtMarc } from '../src/demo/lea-et-marc';

const PAGE = 'pg-accueil';
const blocs = (p: Projet) => p.supports[0]!.pages[0]!.blocs;
const bloc = (p: Projet, id: string) => blocs(p).find(b => b.id === id)!;

describe('modèle', () => {
  test('la démonstration est un projet valide', () => {
    const r = Projet.safeParse(demoLeaEtMarc());
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true);
  });
  test('un projet vide est valide', () => {
    expect(Projet.safeParse(projetVide('Essai')).success).toBe(true);
  });
  test('refuse un bloc qui montre un contenu absent, un bloc en double, une place hors grille', () => {
    const p = demoLeaEtMarc();
    const casse = structuredClone(p);
    blocs(casse)[1]!.source = 'c-absent';
    expect(Projet.safeParse(casse).success).toBe(false);
    const double = structuredClone(p);
    blocs(double).push({ ...blocs(double)[0]! });
    expect(Projet.safeParse(double).success).toBe(false);
    const dehors = structuredClone(p);
    blocs(dehors)[0]!.place = { x: 6, y: 0, w: 12, h: 2 };
    expect(Projet.safeParse(dehors).success).toBe(false);
  });
});

describe('registre et métamorphose', () => {
  test('huit blocs au MVP, chacun avec un premier palier à 1 colonne', () => {
    expect(liste().map(d => d.type).sort()).toEqual(['bouton', 'date', 'image', 'lieu', 'personnes', 'programme', 'texte', 'titre']);
    for (const d of liste()) expect(d.formes[0]!.aPartirDe).toBe(1);
  });
  test('la forme suit la largeur, comme dans le constructeur du Monde AIME', () => {
    const date = exiger('date');
    expect([1, 3, 4, 5, 6, 8, 9, 12].map(w => formePour(date, w).forme)).toEqual(['pastille', 'pastille', 'compte', 'compte', 'calendrier', 'calendrier', 'frise', 'frise']);
    expect([1, 5, 8].map(w => formePour(exiger('lieu'), w).forme)).toEqual(['nom', 'carte', 'itineraire']);
    expect([1, 5, 9].map(w => formePour(exiger('personnes'), w).forme)).toEqual(['avatars', 'equipe', 'reseau']);
  });
  test('une forme choisie l\'emporte ; la hauteur suit la proportion de la forme', () => {
    expect(formePour(exiger('date'), 12, 'pastille').forme).toBe('pastille');
    expect(hauteurPour(exiger('date'), 12)).toBe(4);
    expect(hauteurPour(exiger('date'), 3)).toBe(2);
  });
  test('un bouton refuse un lien javascript:', () => {
    const p = demoLeaEtMarc();
    expect(() => appliquer(p, { type: 'modifierBloc', page: PAGE, id: 'b-bouton', props: { lien: 'javascript:alert(1)' } })).toThrow();
    expect(() => appliquer(p, { type: 'modifierBloc', page: PAGE, id: 'b-bouton', props: { lien: '//ailleurs.com' } })).toThrow();
    expect(() => appliquer(p, { type: 'modifierBloc', page: PAGE, id: 'b-bouton', props: { lien: 'https://lemondeaime.com' } })).not.toThrow();
  });
});

describe('grille', () => {
  test('place libre, contrainte et ordre de lecture', () => {
    const occ = [{ x: 0, y: 0, w: 12, h: 2 }, { x: 0, y: 2, w: 6, h: 2 }];
    expect(placeLibre(occ, 6, 2)).toEqual({ x: 6, y: 2 });
    expect(placeLibre(occ, 12, 1)).toEqual({ x: 0, y: 4 });
    expect(contraindre({ x: 10.4, y: -3, w: 6, h: 0 })).toEqual({ x: 6, y: 0, w: 6, h: 1 });
    const ord = ordreLecture(blocs(demoLeaEtMarc())).map(b => b.id);
    expect(ord.slice(0, 4)).toEqual(['b-titre', 'b-pastille', 'b-compte', 'b-bouton']);
  });
});

describe('commandes : chaque geste a son inverse', () => {
  const gestes: Commande[] = [
    { type: 'placerBloc', page: PAGE, id: 'b-compte', place: { x: 3, y: 4, w: 9, h: 3 } },
    { type: 'modifierBloc', page: PAGE, id: 'b-titre', props: { aligne: 'gauche' } },
    { type: 'modifierBloc', page: PAGE, id: 'b-frise', forme: 'calendrier' },
    { type: 'supprimerBloc', page: PAGE, id: 'b-mot' },
    { type: 'ajouterBloc', page: PAGE, bloc: { id: 'b-nouveau', type: 'texte', source: 'c-mot', place: { x: 0, y: 19, w: 6, h: 3 }, props: {} } },
    { type: 'remplacerContenu', contenu: { id: 'c-chateau', type: 'lieu', nom: 'Domaine des Ormes' } },
    { type: 'ajouterContenu', contenu: { id: 'c-sam', type: 'personne', nom: 'Sam' } },
    { type: 'renommerProjet', titre: 'Léa et Marc, 2027' },
    { type: 'changerDesignSystem', designSystem: 'aime-editorial' },
    { type: 'changerMode', mode: 'clair' },
    { type: 'lot', commandes: [{ type: 'supprimerBloc', page: PAGE, id: 'b-bouton' }, { type: 'supprimerBloc', page: PAGE, id: 'b-lieu' }] },
  ];
  for (const g of gestes) test(`${g.type} puis son inverse redonne le projet d'origine`, () => {
    const p = demoLeaEtMarc();
    const r = appliquer(p, g);
    expect(r.projet).not.toEqual(p);
    expect(Projet.safeParse(r.projet).success).toBe(true);
    expect(appliquer(r.projet, r.inverse).projet).toEqual(p);
  });

  test('refus explicites, projet inchangé', () => {
    const p = demoLeaEtMarc();
    expect(() => appliquer(p, { type: 'supprimerContenu', id: 'c-mariage' })).toThrow(/encore montré/);
    expect(() => appliquer(p, { type: 'ajouterBloc', page: PAGE, bloc: { id: 'b-x', type: 'date', source: 'c-mot', place: { x: 0, y: 30, w: 4, h: 2 }, props: {} } })).toThrow(/ne montre pas/);
    expect(() => appliquer(p, { type: 'ajouterBloc', page: PAGE, bloc: { id: 'b-y', type: 'inconnu', place: { x: 0, y: 30, w: 4, h: 2 }, props: {} } })).toThrow(/inconnu/);
    expect(() => appliquer(p, { type: 'remplacerContenu', contenu: { id: 'c-mot', type: 'lieu', nom: 'x' } as Contenu })).toThrow(/type/);
    expect(p).toEqual(demoLeaEtMarc());
  });

  test('un bloc verrouillé garde sa place ; annuler le verrou ne touche pas aux réglages', () => {
    let p = demoLeaEtMarc();
    const r = appliquer(p, { type: 'modifierBloc', page: PAGE, id: 'b-lieu', verrous: { position: true, taille: true } });
    p = r.projet;
    expect(() => appliquer(p, { type: 'placerBloc', page: PAGE, id: 'b-lieu', place: { x: 0, y: 7, w: 6, h: 4 } })).toThrow(/verrouillé/);
    expect(appliquer(p, r.inverse).projet).toEqual(demoLeaEtMarc());
  });
});

describe('l\'onde : saisi une fois, vu partout', () => {
  test('changer la date une fois change tous les blocs qui la montrent', () => {
    const m = creerMagasin(demoLeaEtMarc(), () => new Date('2026-10-24T10:00:00Z'));
    const ev = m.lire().contenus['c-mariage']!;
    expect(blocsQuiMontrent(m.lire(), 'c-mariage').map(b => b.id).sort()).toEqual(['b-compte', 'b-frise', 'b-pastille', 'b-programme', 'b-titre']);
    expect(m.executer({ type: 'remplacerContenu', contenu: { ...ev, debut: '2027-07-03' } as Contenu }).ok).toBe(true);
    for (const b of blocsQuiMontrent(m.lire(), 'c-mariage')) {
      const c = m.lire().contenus[b.source!]!;
      expect(c.type === 'evenement' && c.debut).toBe('2027-07-03');
    }
    expect(m.lire().modifieLe).toBe('2026-10-24T10:00:00.000Z');
  });
  test('les personnes sont montrées sans être recopiées', () => {
    const p = demoLeaEtMarc();
    expect(blocsQuiMontrent(p, 'c-lucie').map(b => b.id)).toEqual(['b-personnes']);
  });
});

describe('historique et magasin', () => {
  test('annuler, rétablir, et une nouvelle action efface le futur', () => {
    const m = creerMagasin(demoLeaEtMarc());
    const ini = m.lire();
    m.executer({ type: 'placerBloc', page: PAGE, id: 'b-compte', place: { x: 3, y: 4, w: 9, h: 3 } });
    m.executer({ type: 'renommerProjet', titre: 'Autre titre' });
    expect(m.annuler()).toBe(true); expect(m.lire().titre).toBe('Léa & Marc');
    expect(m.annuler()).toBe(true); expect(bloc(m.lire(), 'b-compte').place).toEqual(bloc(ini, 'b-compte').place);
    expect(m.annuler()).toBe(false);
    expect(m.retablir()).toBe(true); expect(bloc(m.lire(), 'b-compte').place.w).toBe(9);
    m.executer({ type: 'renommerProjet', titre: 'Encore' });
    expect(m.peutRetablir()).toBe(false);
  });
  test('un glisser en plusieurs pas compte pour une seule étape', () => {
    const h = new Historique();
    let p = demoLeaEtMarc();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) p = h.executer(p, { type: 'placerBloc', page: PAGE, id: 'b-mot', place: { x: 0, y: 7 + i, w: 6, h: 3 } }, { cle: 'glisser:b-mot', t: t0 + i * 100 });
    p = h.executer(p, { type: 'placerBloc', page: PAGE, id: 'b-mot', place: { x: 0, y: 30, w: 6, h: 3 } }, { cle: 'glisser:b-mot', t: t0 + 400 + REGROUPEMENT_MS });
    p = h.annuler(p)!; expect(bloc(p, 'b-mot').place.y).toBe(11);
    p = h.annuler(p)!; expect(bloc(p, 'b-mot').place.y).toBe(7);
    expect(h.peutAnnuler).toBe(false);
  });
  test('une commande refusée ne change rien et le dit', () => {
    const m = creerMagasin(demoLeaEtMarc());
    const avant = m.lire();
    const r = m.executer({ type: 'supprimerContenu', id: 'c-mariage' });
    expect(r.ok).toBe(false);
    expect(m.lire()).toBe(avant);
    expect(m.peutAnnuler()).toBe(false);
  });
});

describe('ouvrir : versions et projets historiques', () => {
  test('un projet AIME NEXT se rouvre à l\'identique', () => {
    const p = demoLeaEtMarc();
    const r = ouvrir(JSON.parse(JSON.stringify(p)));
    expect(r.ok && r.projet).toEqual(p);
  });
  test('une version plus récente est refusée, pas tronquée', () => {
    const r = ouvrir({ ...demoLeaEtMarc(), version: 2 });
    expect(r.ok).toBe(false);
  });
  test('un export du constructeur d\'AIMESTUDIO s\'ouvre, et ce qui n\'est pas repris est listé', () => {
    // forme exacte de « Exporter le projet » dans aime/index.html d'AIMESTUDIO
    const ancien = {
      preset: 'maries',
      P: { title: 'Léa & Marc', sub: 'Nous nous marions', date: '14 juin 2027', iso: '2027-06-14', place: 'Château de la Frémoire', who: 'Léa & Marc',
        text: 'Nous serions si heureux de vous compter parmi nous ce jour-là.', quote: 'Le plus beau jour, c\'est avec vous.', cta: 'Je confirme ma venue',
        prog: [['15:00', 'Cérémonie', 'à la chapelle'], ['19:30', 'Dîner']], people: [['Léa', 'Mariée'], ['Marc', 'Marié']] },
      blocks: [{ k: 'hero', x: 0, y: 0, w: 12 }, { k: 'compte', x: 0, y: 4, w: 6 }, { k: 'rsvp', x: 6, y: 4, w: 6 }, { k: 'programme', x: 0, y: 7, w: 6 },
        { k: 'lieu', x: 6, y: 7, w: 6 }, { k: 'cadeaux', x: 0, y: 11, w: 4 }, { k: 'galerie', x: 4, y: 11, w: 4 }],
    };
    const r = ouvrir(ancien);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rapport.origine).toBe('aimestudio');
    expect(r.rapport.repris).toBe(5);
    expect(r.rapport.ignores).toEqual(['cadeaux', 'galerie']);
    const bs: Bloc[] = blocs(r.projet);
    expect(bs.map(b => b.type)).toEqual(['titre', 'date', 'bouton', 'programme', 'lieu']);
    expect(bs[1]!.forme).toBe('compte');
    const ev = Object.values(r.projet.contenus).find(c => c.type === 'evenement');
    expect(ev && ev.type === 'evenement' && ev.debut).toBe('2027-06-14');
    expect(Projet.safeParse(r.projet).success).toBe(true);
  });
  test('un fichier quelconque est refusé', () => {
    expect(ouvrir({ bonjour: 1 }).ok).toBe(false);
    expect(ouvrir(null).ok).toBe(false);
  });
});
