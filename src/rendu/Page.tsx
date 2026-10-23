/** Une page rendue : sur la grille (ordinateur, tablette) ou en colonne dans l'ordre de lecture (téléphone). */
import type { CSSProperties } from 'react';
import { exiger, formePour, ordreLecture, basDe, type Bloc, type Page as PageT } from '../core';
import { RENDUS, type ContexteRendu } from './blocs';
import { variables } from '../design/systemes';

export function RenduBloc({ bloc, x }: { bloc: Bloc; x: ContexteRendu }) {
  const def = exiger(bloc.type);
  const forme = formePour(def, bloc.place.w, bloc.forme).forme;
  const R = RENDUS[bloc.type];
  return R ? <>{R({ bloc, forme, x })}</> : <div className="r-vide">Bloc inconnu</div>;
}

export function placeCss(b: Bloc): CSSProperties {
  return { gridColumn: `${b.place.x + 1} / span ${b.place.w}`, gridRow: `${b.place.y + 1} / span ${b.place.h}`, zIndex: b.place.z ?? 1 };
}

/* En colonne, chaque bloc garde sa forme et prend la hauteur de son contenu ; une image garde une proportion de photo. */

export function Page({ page, x, mise, designSystem }: { page: PageT; x: ContexteRendu; mise: 'grille' | 'colonne'; designSystem: string }) {
  const style = variables(designSystem) as CSSProperties;
  if (mise === 'colonne') return (
    <div className="r-page r-colonne" style={style}>
      {ordreLecture(page.blocs).map(b => (
        <section key={b.id} className={`r-bloc r-${b.type}-bloc`} aria-label={exiger(b.type).nom}>
          <RenduBloc bloc={b} x={x} />
        </section>
      ))}
    </div>
  );
  return (
    <div className="r-page" style={style}>
      <div className="r-grille" style={{ gridTemplateRows: `repeat(${Math.max(basDe(page.blocs.map(b => b.place)), 1)}, var(--case))` }}>
        {ordreLecture(page.blocs).map(b => (
          <section key={b.id} className={`r-bloc r-${b.type}-bloc`} style={placeCss(b)} aria-label={exiger(b.type).nom}>
            <RenduBloc bloc={b} x={x} />
          </section>
        ))}
      </div>
    </div>
  );
}
