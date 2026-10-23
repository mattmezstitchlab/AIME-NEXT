/**
 * La composition : la page sur la grille, avec sélection, glisser, poignée de taille et clavier.
 * Chaque geste passe par une commande ; un glisser en plusieurs pas compte pour une seule étape d'annulation.
 */
import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { basDe, exiger, formePour, ordreLecture, type Bloc, type Magasin, type Page, type Place } from '../core';
import { RenduBloc, placeCss } from '../rendu/Page';
import type { ContexteRendu } from '../rendu/blocs';
import { variables, type Apparence } from '../design/systemes';
import { deplacer, libre, memePlace, redimensionner } from './gestes';

type Geste = { id: string; mode: 'deplacer' | 'taille'; x0: number; y0: number; depart: Place; case: number; bouge: boolean };

export function Scene({ page, magasin, x, apparence, selection, choisir, grilleVisible, dire }: {
  page: Page; magasin: Magasin; x: ContexteRendu; apparence: Apparence; selection: string | null;
  choisir: (id: string | null) => void; grilleVisible: boolean; dire: (m: string) => void;
}) {
  const grille = useRef<HTMLDivElement>(null);
  const geste = useRef<Geste | null>(null);
  const rangees = Math.max(basDe(page.blocs.map(b => b.place)) + 6, 12);

  const placer = (b: Bloc, place: Place, cle: string) => {
    if (memePlace(place, b.place)) return;
    if (!libre(page.blocs, b.id, place)) return; // une place occupée n'est jamais prise : le bloc reste où il était
    const r = magasin.executer({ type: 'placerBloc', page: page.id, id: b.id, place }, { cle });
    if (!r.ok) dire(r.raison);
  };

  const debut = (e: PointerEvent, b: Bloc, mode: Geste['mode']) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const g = grille.current;
    if (!g) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    geste.current = { id: b.id, mode, x0: e.clientX, y0: e.clientY, depart: b.place, case: g.getBoundingClientRect().width / 12, bouge: false };
    choisir(b.id);
  };
  const suite = (e: PointerEvent) => {
    const g = geste.current;
    if (!g) return;
    const dx = Math.round((e.clientX - g.x0) / g.case), dy = Math.round((e.clientY - g.y0) / g.case);
    if (!dx && !dy) return;
    g.bouge = true;
    const b = magasin.lire().supports.flatMap(s => s.pages).find(p => p.id === page.id)?.blocs.find(o => o.id === g.id);
    if (!b) return;
    const depart = { ...b, place: g.depart };
    placer(b, g.mode === 'deplacer' ? deplacer(depart, dx, dy) : redimensionner(depart, dx, dy), `${g.mode}:${g.id}:${g.x0}`);
  };
  const fin = () => { geste.current = null; };

  const clavier = (e: KeyboardEvent, b: Bloc) => {
    const fleches: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const f = fleches[e.key];
    if (f) {
      e.preventDefault();
      const place = e.shiftKey ? redimensionner(b, f[0], f[1], true) : deplacer(b, f[0], f[1]);
      if (!libre(page.blocs, b.id, place)) { dire('La place est occupée.'); return; }
      placer(b, place, `clavier:${b.id}`);
      const def = exiger(b.type);
      dire(`${def.nom} : colonne ${place.x + 1}, rangée ${place.y + 1}, ${place.w} × ${place.h}, forme ${formePour(def, place.w, b.forme).forme}.`);
    } else if (e.key === 'Escape') { choisir(null); (e.currentTarget as HTMLElement).blur(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const r = magasin.executer({ type: 'supprimerBloc', page: page.id, id: b.id });
      if (r.ok) { choisir(null); dire('Bloc retiré. Ctrl Z pour l\'annuler.'); } else dire(r.raison);
    }
  };

  return (
    <div className="r-page e-page" style={variables(apparence) as CSSProperties} onPointerDown={() => choisir(null)}>
      <div ref={grille} className={`r-grille e-grille${grilleVisible ? ' e-repere' : ''}`} style={{ gridTemplateRows: `repeat(${rangees}, var(--case))` }}>
        {ordreLecture(page.blocs).map(b => {
          const def = exiger(b.type);
          const choisi = selection === b.id;
          const forme = formePour(def, b.place.w, b.forme).forme;
          return (
            <div key={b.id} data-bloc={b.id} className={`e-bloc${choisi ? ' e-choisi' : ''}${b.verrous?.position ? ' e-verrou' : ''}`} style={placeCss(b)}
              tabIndex={0} role="group" aria-roledescription="bloc" aria-label={`${def.nom}, forme ${forme}, ${b.place.w} colonnes sur ${b.place.h}`}
              onPointerDown={e => debut(e, b, 'deplacer')} onPointerMove={suite} onPointerUp={fin} onPointerCancel={fin}
              onFocus={() => choisir(b.id)} onKeyDown={e => clavier(e, b)}>
              <section className={`r-bloc r-${b.type}-bloc`}><RenduBloc bloc={b} x={x} /></section>
              {choisi && <span className="e-nom" aria-hidden="true">{def.nom} · {forme}</span>}
              {choisi && !b.verrous?.taille && (
                <span className="e-poignee" role="presentation" onPointerDown={e => debut(e, b, 'taille')} onPointerMove={suite} onPointerUp={fin} onPointerCancel={fin} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
