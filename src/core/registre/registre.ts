/**
 * Le registre des blocs : chaque type est déclaré une fois, et rien d'autre ne connaît son fonctionnement.
 * Ici, seulement ce qui ne dépend pas de l'affichage : contenus acceptés, formes selon la largeur, réglages.
 * L'affichage (React) s'enregistre à part, dans src/rendu, sous le même nom de type.
 */
import type { z } from 'zod';
import type { TypeContenu } from '../modele/schemas';

/** La métamorphose : à partir de `aPartirDe` colonnes, le bloc prend `forme`, avec la proportion largeur / hauteur donnée. */
export type Palier = { aPartirDe: number; forme: string; proportion: number };

export type Famille = 'contenu' | 'media' | 'composition' | 'evenement' | 'module';

export type DefinitionBloc = {
  type: string;
  nom: string;
  famille: Famille;
  /** contenus que ce bloc peut montrer ; absent : le bloc porte ses propres réglages (un bouton) */
  accepte?: readonly TypeContenu[];
  /** au moins un palier ; le premier doit commencer à 1 colonne */
  formes: readonly Palier[];
  largeurDefaut: number;
  largeurMin?: number;
  props: z.ZodType<Record<string, unknown>>;
};

const definitions = new Map<string, DefinitionBloc>();

export function declarer(def: DefinitionBloc): DefinitionBloc {
  if (definitions.has(def.type)) throw new Error(`type de bloc déjà déclaré : ${def.type}`);
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(def.type)) throw new Error(`nom de type invalide : ${def.type}`);
  if (!def.formes.length || def.formes[0]!.aPartirDe !== 1) throw new Error(`${def.type} : le premier palier commence à 1 colonne`);
  for (let i = 1; i < def.formes.length; i++) if (def.formes[i]!.aPartirDe <= def.formes[i - 1]!.aPartirDe) throw new Error(`${def.type} : paliers non croissants`);
  if (def.largeurDefaut < 1 || def.largeurDefaut > 12) throw new Error(`${def.type} : largeur par défaut hors grille`);
  definitions.set(def.type, def);
  return def;
}

export function obtenir(type: string): DefinitionBloc | undefined {
  return definitions.get(type);
}

export function exiger(type: string): DefinitionBloc {
  const d = definitions.get(type);
  if (!d) throw new Error(`type de bloc inconnu : ${type}`);
  return d;
}

export function liste(): DefinitionBloc[] {
  return [...definitions.values()];
}

/** Réglages complets d'un bloc : valeurs par défaut du type, puis ce qui est enregistré. Refuse ce qui ne passe pas le schéma. */
export function reglages(type: string, props: Record<string, unknown> = {}): Record<string, unknown> {
  return exiger(type).props.parse(props);
}
