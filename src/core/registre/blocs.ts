/**
 * Les huit blocs du MVP. Les paliers de Date, Lieu et Personnes reprennent ceux du constructeur
 * du Monde AIME d'AIMESTUDIO (FORMS dans aime/index.html) : mêmes largeurs, mêmes proportions.
 */
import { z } from 'zod';
import { declarer } from './registre';

const aligne = z.enum(['gauche', 'centre', 'droite']).default('gauche');
/** un lien ne mène qu'à une ancre, une page de ce site ou une adresse https */
export const Lien = z.string().max(500).regex(/^(#[\w-]*|\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/, 'lien refusé').default('#');
export const Cadrage = z.object({ x: z.number().min(0).max(100).default(50), y: z.number().min(0).max(100).default(50), zoom: z.number().min(100).max(230).default(100) });

export const TITRE = declarer({
  type: 'titre', nom: 'Titre', famille: 'contenu', accepte: ['evenement', 'texte'],
  formes: [{ aPartirDe: 1, forme: 'titre', proportion: 4 }, { aPartirDe: 8, forme: 'grand', proportion: 3 }],
  largeurDefaut: 12,
  props: z.object({ niveau: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1), aligne: aligne.default('centre'), sousTitre: z.string().max(200).default('') }),
});

export const TEXTE = declarer({
  type: 'texte', nom: 'Texte', famille: 'contenu', accepte: ['texte'],
  formes: [{ aPartirDe: 1, forme: 'texte', proportion: 2 }],
  largeurDefaut: 6,
  props: z.object({ aligne }),
});

export const IMAGE = declarer({
  type: 'image', nom: 'Image', famille: 'media', accepte: ['image'],
  formes: [{ aPartirDe: 1, forme: 'image', proportion: 1.5 }],
  largeurDefaut: 6,
  props: z.object({ cadrage: Cadrage.default({}), legende: z.string().max(300).default('') }),
});

export const BOUTON = declarer({
  type: 'bouton', nom: 'Bouton', famille: 'contenu',
  formes: [{ aPartirDe: 1, forme: 'bouton', proportion: 4 }],
  largeurDefaut: 4, largeurMin: 2,
  props: z.object({ libelle: z.string().min(1).max(60).default('Je réponds'), lien: Lien }),
});

export const DATE = declarer({
  type: 'date', nom: 'Date', famille: 'evenement', accepte: ['evenement'],
  formes: [
    { aPartirDe: 1, forme: 'pastille', proportion: 1.5 },
    { aPartirDe: 4, forme: 'compte', proportion: 2 },
    { aPartirDe: 6, forme: 'calendrier', proportion: 1.2 },
    { aPartirDe: 9, forme: 'frise', proportion: 3 },
  ],
  largeurDefaut: 6,
  props: z.object({}),
});

export const LIEU = declarer({
  type: 'lieu', nom: 'Lieu', famille: 'evenement', accepte: ['lieu'],
  formes: [
    { aPartirDe: 1, forme: 'nom', proportion: 4 },
    { aPartirDe: 5, forme: 'carte', proportion: 1.5 },
    { aPartirDe: 8, forme: 'itineraire', proportion: 2 },
  ],
  largeurDefaut: 6,
  props: z.object({}),
});

export const PERSONNES = declarer({
  type: 'personnes', nom: 'Personnes', famille: 'evenement',
  formes: [
    { aPartirDe: 1, forme: 'avatars', proportion: 3 },
    { aPartirDe: 5, forme: 'equipe', proportion: 1.5 },
    { aPartirDe: 9, forme: 'reseau', proportion: 2 },
  ],
  largeurDefaut: 6,
  /** les personnes montrées : toutes, ou une liste d'identifiants de contenus « personne » */
  props: z.object({ personnes: z.array(z.string()).max(200).default([]) }),
});

export const PROGRAMME = declarer({
  type: 'programme', nom: 'Programme', famille: 'evenement', accepte: ['evenement'],
  formes: [{ aPartirDe: 1, forme: 'liste', proportion: 1.5 }, { aPartirDe: 9, forme: 'ligne', proportion: 3 }],
  largeurDefaut: 6,
  props: z.object({}),
});
