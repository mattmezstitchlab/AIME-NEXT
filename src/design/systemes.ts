/**
 * Les quatre directions d'AIME (aime-design-system 3.0, reprises d'AIMESTUDIO design/catalogue).
 * Un Design System change la présentation, jamais le contenu. Il ne produit que des variables CSS
 * tirées de cette table : aucune valeur venue d'un fichier n'entre dans le CSS.
 */
export type DesignSystem = {
  id: string; nom: string; mode: 'clair' | 'sombre';
  c1: string; c2: string; fond: string; encre: string;
  rayon: number; titre: string; texte: string; graisse: number; approche: string;
};

const INTER = '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

export const SYSTEMES: readonly DesignSystem[] = [
  { id: 'aime-original', nom: 'Original Iris', mode: 'sombre', c1: '#7866F2', c2: '#C46B8B', fond: '#08080A', encre: '#F5F5F7', rayon: 18, titre: 'Outfit, "Inter Tight", system-ui, sans-serif', texte: INTER, graisse: 600, approche: '-0.02em' },
  { id: 'aime-minimal', nom: 'Minimal Clair', mode: 'clair', c1: '#1B1B17', c2: '#D9CBB4', fond: '#F6F4EF', encre: '#151512', rayon: 4, titre: INTER, texte: INTER, graisse: 500, approche: '-0.045em' },
  { id: 'aime-editorial', nom: 'Éditorial Magazine', mode: 'clair', c1: '#99472C', c2: '#C9B79C', fond: '#F1E9DD', encre: '#241E18', rayon: 2, titre: '"Instrument Serif", Georgia, "Times New Roman", serif', texte: INTER, graisse: 400, approche: '-0.012em' },
  { id: 'aime-pro', nom: 'Pro Atelier', mode: 'sombre', c1: '#3F8EF4', c2: '#1C6E80', fond: '#071017', encre: '#EEF4F9', rayon: 10, titre: '"Space Grotesk", "Inter Tight", system-ui, sans-serif', texte: INTER, graisse: 600, approche: '-0.028em' },
];

export function systeme(id: string): DesignSystem {
  return SYSTEMES.find(s => s.id === id) ?? SYSTEMES[0]!;
}

/** Les variables CSS d'une page, à poser sur son conteneur. */
export function variables(id: string): Record<string, string> {
  const s = systeme(id);
  return {
    '--ds-c1': s.c1, '--ds-c2': s.c2, '--ds-fond': s.fond, '--ds-encre': s.encre,
    '--ds-surface': `color-mix(in srgb, ${s.encre} 6%, ${s.fond})`,
    '--ds-trait': `color-mix(in srgb, ${s.encre} 16%, ${s.fond})`,
    '--ds-doux': `color-mix(in srgb, ${s.encre} 74%, ${s.fond})`,
    '--ds-rayon': `${s.rayon}px`, '--ds-titre': s.titre, '--ds-texte': s.texte,
    '--ds-graisse': String(s.graisse), '--ds-approche': s.approche,
    'color-scheme': s.mode === 'sombre' ? 'dark' : 'light',
  };
}
