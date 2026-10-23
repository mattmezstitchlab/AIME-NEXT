/**
 * La Page Zéro : l'entrée. Une orbe, puis six étapes au défilement, du point au projet.
 * Elle sert à découvrir et à entrer, pas à travailler : deux actions seulement à la fin.
 */
import { useEffect, useRef } from 'react';
import { Orbe } from './Orbe';

const ETAPES = [
  { id: 'point', nom: 'Point', titre: 'Tout commence par une intention.', dit: 'Une idée, une date, un nom. Un seul point suffit pour commencer.' },
  { id: 'ligne', nom: 'Ligne', titre: 'Elle prend une direction.', dit: 'Le point s’étire dans le temps : avant, pendant, après.' },
  { id: 'relation', nom: 'Relation', titre: 'Elle relie des personnes.', dit: 'Ceux qui organisent, ceux qui viennent, ceux qui aident. Chacun voit ce qui le concerne.' },
  { id: 'grille', nom: 'Grille', titre: 'Elle trouve sa place.', dit: 'Douze colonnes, des cases carrées : un langage commun à toutes vos créations.' },
  { id: 'composition', nom: 'Composition', titre: 'Elle prend forme.', dit: 'Une même information devient pastille, compte à rebours, calendrier ou frise, selon la place qu’on lui donne.' },
  { id: 'projet', nom: 'Projet', titre: 'Elle devient votre projet.', dit: 'Saisi une fois, vu partout. Enregistré, retrouvé, partagé.' },
] as const;

function Figure({ id }: { id: (typeof ETAPES)[number]['id'] }) {
  return (
    <div className={`z-figure z-${id}`} aria-hidden="true">
      <span className="z-p z-p1" /><span className="z-p z-p2" /><span className="z-p z-p3" />
      <span className="z-l z-l1" /><span className="z-l z-l2" />
      {id === 'grille' || id === 'composition' || id === 'projet' ? <span className="z-g" /> : null}
      {id === 'composition' || id === 'projet' ? <><span className="z-b z-b1" /><span className="z-b z-b2" /><span className="z-b z-b3" /></> : null}
    </div>
  );
}

export function PageZero() {
  const racine = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = racine.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('z-vu', e.isIntersecting)), { threshold: 0.35 });
    el.querySelectorAll('.z-etape').forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <div className="x-page z-page" ref={racine}>
      <header className="x-tete"><a className="x-marque" href="#/">AIME</a><nav aria-label="Navigation"><a href="#/monde">Le Monde AIME</a><a href="#/projets">Mes projets</a></nav></header>
      <section className="z-heros" aria-labelledby="z-titre">
        <Orbe taille={180} />
        <h1 id="z-titre">AIME</h1>
        <p className="z-devise">Architecture Intelligente de la Mémoire Ensemble</p>
        <p className="z-indice">Faites défiler : du point au projet.</p>
      </section>
      <ol className="z-etapes">
        {ETAPES.map((e, i) => (
          <li key={e.id} className="z-etape">
            <Figure id={e.id} />
            <div className="z-texte">
              <p className="z-num">{String(i + 1).padStart(2, '0')} · {e.nom}</p>
              <h2>{e.titre}</h2>
              <p>{e.dit}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="z-fin" aria-labelledby="z-fin">
        <Orbe taille={96} />
        <h2 id="z-fin">Entrez dans Le Monde AIME.</h2>
        <div className="z-actions">
          <a className="x-btn x-fort" href="#/monde">Découvrir Le Monde AIME</a>
          <a className="x-btn" href="#/projets">Reprendre mon travail</a>
        </div>
      </section>
    </div>
  );
}
