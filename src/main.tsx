/**
 * Point d'entrée. Étape 1–2 : le cœur seul. Cette page affiche, en lecture, ce que le cœur sait déjà faire
 * avec la démonstration ; le Constructeur arrive à l'étape 3.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { exiger, formePour, ordreLecture } from './core';
import { demoLeaEtMarc } from './demo/lea-et-marc';

function Socle() {
  const p = demoLeaEtMarc();
  const blocs = ordreLecture(p.supports[0]!.pages[0]!.blocs);
  return (
    <main style={{ font: '16px/1.5 system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '32px 16px', color: '#EDEDF0', background: '#0A0A0C', minHeight: '100vh' }}>
      <h1 style={{ fontWeight: 600 }}>AIME NEXT · le cœur</h1>
      <p>Démonstration « {p.titre} » : {blocs.length} blocs, une seule fiche d'informations. Le Constructeur arrive à l'étape suivante.</p>
      <ol>
        {blocs.map(b => {
          const d = exiger(b.type);
          return <li key={b.id}>{d.nom} · {b.place.w} colonnes · forme « {formePour(d, b.place.w, b.forme).forme} »</li>;
        })}
      </ol>
    </main>
  );
}

createRoot(document.getElementById('racine')!).render(<StrictMode><Socle /></StrictMode>);
