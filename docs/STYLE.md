# Le style AIME

Un seul style, complet, en deux modes : **sombre** (par défaut) et **clair**. Il est défini dans `src/design/systemes.ts` et ne produit que des variables CSS ; aucun bloc n'a de couleur ou de taille écrite en dur.

| Famille | Variables | Valeurs |
| --- | --- | --- |
| Couleurs | `--ds-fond`, `--ds-surface`, `--ds-surface2`, `--ds-trait`, `--ds-encre`, `--ds-doux` | sombre : #0A0A0C → #EDEDF0 ; clair : #FAFAF7 → #141418 |
| Accent | `--ds-c1`, `--ds-c1-texte`, `--ds-sur-c1`, `--ds-c1-survol`, `--ds-c2` | violet AIME (#8B7BFF en sombre, #5F4FD6 en clair), rose en second |
| Signature | `--ds-iris` | dégradé irisé, réservé aux repères d'identité : anneau de la pastille, ligne de la frise. Jamais sur du texte |
| Textes | `--t-1` à `--t-8` | 12, 14, 16 px puis tailles relatives à la largeur de la page, jusqu'à 112 px |
| Polices | `--ds-titre`, `--ds-texte` | Cal Sans (titres), Inter (texte) |
| Espacements | `--e-1` à `--e-7` | 4, 8, 12, 16, 24, 32, 48 px |
| Rayons | `--ds-rayon`, `--r-controle`, `--r-pastille` | 18, 12, 999 px |
| Ombre | `--ds-ombre` | discrète, adaptée au mode |

Contrastes vérifiés (WCAG AA) dans les deux modes ; le contrôle axe du parcours passe sur ordinateur et sur téléphone. Les animations respectent `prefers-reduced-motion`.

Les trois autres directions d'AIMESTUDIO (Minimal Clair, Éditorial Magazine, Pro Atelier) ne sont plus proposées. Un projet qui en nomme une s'affiche dans le style AIME.
