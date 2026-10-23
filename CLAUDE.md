# AIME NEXT — consignes pour les agents

- Langue : français partout (code, commentaires, messages, documentation).
- Une seule page : on y découvre et on y crée (l'intention en haut, la page qui se compose et s'édite dessous). Pas de Bureau, pas de fenêtres, pas de studio par discipline, pas de Carte postale, pas d'écran supplémentaire sans validation de Matt.
- Toute modification d'un projet passe par une commande (`src/core/commandes`) ; chaque commande a son inverse. Jamais de mutation directe.
- Un seul état (`src/core/magasin.ts`), un seul stockage (IndexedDB, `src/stockage`), un seul rendu.
- Un bloc ne contient pas l'information : il la montre (`source` → `contenus`). Un nouveau type de bloc se déclare dans le registre, rien d'autre ne change.
- `src/core` est du TypeScript pur, sans React ni DOM, testé sous Node.
- Aucune adresse libre : liens filtrés (`Lien` dans `registre/blocs.ts`), médias stockés localement.
- Ne jamais afficher un bouton qui ne fait rien. Une démonstration est dite démonstration.
- Avant de pousser : `npm run verify` (types, tests, construction). Une branche par étape, PR vers `main`, aucune fusion sans validation de Matt.
- Les anciens dépôts (AIMESTUDIO, POINTZERO, RIPPLECIRCLE…) ne sont jamais modifiés depuis ce projet.
