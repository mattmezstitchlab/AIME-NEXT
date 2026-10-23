/**
 * Le style AIME : un seul style, complet, en deux modes (sombre par défaut, clair).
 * Il fixe les couleurs, l'échelle des textes, les espacements, les rayons, les ombres et les états.
 * Un style change la présentation, jamais le contenu. Il ne produit que des variables CSS tirées de cette table :
 * aucune valeur venue d'un fichier n'entre dans le CSS.
 *
 * Les trois autres directions d'AIMESTUDIO (Minimal Clair, Éditorial Magazine, Pro Atelier) ne sont plus proposées.
 * Un projet qui les nomme encore s'affiche dans le style AIME.
 */
export type Mode = 'sombre' | 'clair';
export type Apparence = { designSystem: string; mode?: Mode | undefined };

type Palette = {
  fond: string; surface: string; surface2: string; trait: string; encre: string; doux: string;
  accent: string; accentTexte: string; surAccent: string; rose: string; ombre: string;
};

/** Les contrastes ont été vérifiés (WCAG AA) : encre, doux et accentTexte sur fond et sur surface ; surAccent sur accent. */
export const PALETTES: Record<Mode, Palette> = {
  sombre: {
    fond: '#0A0A0C', surface: '#131318', surface2: '#1C1C23', trait: '#2B2B35', encre: '#EDEDF0', doux: '#A9A9B6',
    accent: '#8B7BFF', accentTexte: '#A99BFF', surAccent: '#0A0A0C', rose: '#FB7185',
    ombre: '0 1px 0 rgba(255,255,255,.04) inset, 0 12px 32px rgba(0,0,0,.35)',
  },
  clair: {
    fond: '#FAFAF7', surface: '#F1F0EC', surface2: '#E8E6E0', trait: '#D6D3CB', encre: '#141418', doux: '#55555F',
    accent: '#5F4FD6', accentTexte: '#4F3FC4', surAccent: '#FFFFFF', rose: '#C2416B',
    ombre: '0 1px 2px rgba(20,20,24,.06), 0 10px 28px rgba(20,20,24,.08)',
  },
};

export const STYLE_AIME = {
  id: 'aime-original', nom: 'AIME',
  titre: '"Cal Sans", Outfit, "Inter Variable", Inter, system-ui, sans-serif',
  texte: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  /** la signature irisée : réservée aux repères d'identité (frise, anneaux, centre du réseau), jamais au texte */
  iris: 'conic-gradient(from 200deg, #FB7185, #F59E0B, #7C5CFF, #22D3EE, #FB7185)',
} as const;

export const MODE_PAR_DEFAUT: Mode = 'sombre';

export function modeDe(a: Apparence): Mode {
  return a.mode ?? MODE_PAR_DEFAUT;
}

/** Les variables CSS d'une page, à poser sur son conteneur. */
export function variables(a: Apparence): Record<string, string> {
  const m = modeDe(a), c = PALETTES[m];
  return {
    // couleurs
    '--ds-fond': c.fond, '--ds-surface': c.surface, '--ds-surface2': c.surface2, '--ds-trait': c.trait,
    '--ds-encre': c.encre, '--ds-doux': c.doux, '--ds-c1': c.accent, '--ds-c1-texte': c.accentTexte, '--ds-sur-c1': c.surAccent,
    '--ds-c2': c.rose, '--ds-iris': STYLE_AIME.iris, '--ds-ombre': c.ombre,
    '--ds-c1-survol': `color-mix(in srgb, ${c.accent} 86%, ${c.encre})`,
    // typographie : une échelle, relative à la largeur de la page (unités de conteneur)
    '--ds-titre': STYLE_AIME.titre, '--ds-texte': STYLE_AIME.texte, '--ds-graisse': '600', '--ds-approche': '-0.02em',
    '--t-1': '12px', '--t-2': '14px', '--t-3': '16px', '--t-4': 'clamp(17px, 1.6cqw, 20px)', '--t-5': 'clamp(20px, 2.4cqw, 30px)',
    '--t-6': 'clamp(26px, 4cqw, 48px)', '--t-7': 'clamp(34px, 6cqw, 80px)', '--t-8': 'clamp(42px, 8cqw, 112px)',
    // espacements et rayons
    '--e-1': '4px', '--e-2': '8px', '--e-3': '12px', '--e-4': '16px', '--e-5': '24px', '--e-6': '32px', '--e-7': '48px',
    '--ds-rayon': '18px', '--r-controle': '12px', '--r-pastille': '999px',
    'color-scheme': m === 'sombre' ? 'dark' : 'light',
  };
}
