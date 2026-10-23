# Architecture

Le document de fondation (Claude Docs « AIME NEXT — Fondations ») décrit les choix et le plan. Ce fichier résume ce qui est en place.

| Dossier | Rôle | Dépend de |
| --- | --- | --- |
| `src/core/modele` | Schémas (Zod), identifiants, ouverture et migrations, import des projets AIMESTUDIO | — |
| `src/core/registre` | Déclaration des types de blocs : contenus acceptés, formes selon la largeur, réglages | modele |
| `src/core/grille` | Grille de 12 : collisions, place libre, contrainte, forme et hauteur, ordre de lecture | registre (types) |
| `src/core/commandes` | Commandes inversibles, historique avec regroupement | modele, registre, grille |
| `src/core/magasin.ts` | Le seul état, auquel l'interface s'abonne | commandes |
| `src/stockage` | IndexedDB (projets et médias), archive `.aime` | core |
| `src/demo` | Démonstration « Léa & Marc » | core |

## Formes selon la largeur (reprises d'AIMESTUDIO)

| Bloc | Paliers (colonnes → forme) |
| --- | --- |
| Date | 1 pastille · 4 compte à rebours · 6 calendrier · 9 frise |
| Lieu | 1 nom · 5 carte · 8 itinéraire |
| Personnes | 1 avatars · 5 équipe · 9 réseau |
| Programme | 1 liste · 9 ligne |
| Titre | 1 titre · 8 grand |

## Format d'un projet

`format: 'aime-projet'`, `version: 1`. Une version plus récente est refusée, jamais tronquée. Les migrations futures s'ajoutent dans `migrations.ts` (`migrations[n]` passe de n à n + 1).

## Le Constructeur (étape 3)

| Dossier | Rôle |
| --- | --- |
| `src/design` | Le style AIME (sombre et clair), traduit en variables CSS ; voir `docs/STYLE.md` |
| `src/rendu` | Un composant d'affichage par type de bloc ; la page en grille ou en colonne (téléphone) ; le même rendu pour l'édition, l'aperçu et l'export HTML |
| `src/editeur` | La scène (sélection, glisser, poignée, clavier), le « + », le panneau contextuel, « Vos informations », l'export HTML |
| `src/app` | « Mes projets », l'ouverture d'un projet, l'enregistrement automatique |

Gestes : glisser pour déplacer, poignée pour redimensionner ; au clavier, flèches pour déplacer, Maj + flèches pour redimensionner, Suppr pour retirer, Échap pour désélectionner ; Ctrl Z et Ctrl Maj Z partout hors des champs. Une place occupée n'est jamais prise : le bloc reste où il était.

Tests : `npm test` (cœur, « + », gestes, stockage) et `npm run parcours` (navigateur réel : glisser, onde, annuler, rechargement, aperçu, exports, téléphone).

## La page unique

AIME tient sur une seule page (`src/app/PageUnique.tsx`) :

1. **L'intention** : l'orbe, « Que préparez-vous ? », un nom et une date (`src/app/intention.ts`). Écrire modifie l'événement principal ; dans une page vide, la page se compose (événement, titre, compte à rebours). Les six étapes, du point au projet, sont calculées d'après le projet réel.
2. **La page** : la grille, éditable directement. Double-clic ou Entrée pour écrire dans un bloc (`src/editeur/Direct.tsx`) ; poignée pour agrandir, la forme suit ; « + » pour ajouter ; panneau seulement sur sélection.
3. **Comment ça marche** (`src/experiences/Decouvrir.tsx`) : le curseur de la date et le cube, montrés seulement tant que la page est l'exemple.

Ouverture : `#/p/<id>`, sinon le dernier projet de l'appareil, sinon l'exemple « Léa & Marc », qui n'est enregistré qu'au premier geste. Tout le reste (Mes projets, page vide, informations, mode, grille, exports, import) est dans un seul menu.

Sur téléphone : un premier toucher choisit un bloc (la page continue de défiler) ; on ne déplace qu'un bloc choisi. Pendant un glisser, la page défile près des bords.
