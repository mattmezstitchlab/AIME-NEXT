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
import { Direct } from './Direct';

type Geste = { id: string; mode: 'deplacer' | 'taille'; x0: number; y0: number; sy0: number; depart: Place; case: number; bouge: boolean; dernier: { x: number; y: number }; defile?: ReturnType<typeof setInterval> };
/** près du haut ou du bas de l'écran, la page défile pendant qu'on glisse */
const BORD = 64;

export function Scene({ page, magasin, x, apparence, selection, choisir, grilleVisible, dire, direct, ouvrirDirect, fermerDirect }: {
  page: Page; magasin: Magasin; x: ContexteRendu; apparence: Apparence; selection: string | null;
  choisir: (id: string | null) => void; grilleVisible: boolean; dire: (m: string) => void;
  /** le bloc dans lequel on écrit directement, s'il y en a un */
  direct: string | null; ouvrirDirect: (id: string) => void; fermerDirect: () => void;
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
    if (direct === b.id) return;
    // au doigt, un premier toucher sélectionne seulement : la page continue de défiler
    if (mode === 'deplacer' && e.pointerType !== 'mouse' && selection !== b.id) { choisir(b.id); return; }
    const g = grille.current;
    if (!g) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    geste.current = { id: b.id, mode, x0: e.clientX, y0: e.clientY, sy0: scrollY, depart: b.place, case: g.getBoundingClientRect().width / 12, bouge: false, dernier: { x: e.clientX, y: e.clientY } };
    choisir(b.id);
  };
  const appliquerGeste = (g: Geste) => {
    const dx = Math.round((g.dernier.x - g.x0) / g.case), dy = Math.round((g.dernier.y + scrollY - g.sy0 - g.y0) / g.case);
    if (!dx && !dy) return;
    g.bouge = true;
    const b = magasin.lire().supports.flatMap(s => s.pages).find(p => p.id === page.id)?.blocs.find(o => o.id === g.id);
    if (!b) return;
    const depart = { ...b, place: g.depart };
    placer(b, g.mode === 'deplacer' ? deplacer(depart, dx, dy) : redimensionner(depart, dx, dy), `${g.mode}:${g.id}:${g.x0}`);
  };
  const suite = (e: PointerEvent) => {
    const g = geste.current;
    if (!g) return;
    g.dernier = { x: e.clientX, y: e.clientY };
    appliquerGeste(g);
    const sens = e.clientY > innerHeight - BORD ? 1 : e.clientY < BORD + 60 ? -1 : 0;
    if (sens && !g.defile) g.defile = setInterval(() => { scrollBy(0, sens * 14); if (geste.current === g) appliquerGeste(g); }, 30);
    if (!sens && g.defile) { clearInterval(g.defile); delete g.defile; }
  };
  const fin = () => { const g = geste.current; if (g?.defile) clearInterval(g.defile); geste.current = null; };

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
    } else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); ouvrirDirect(b.id); }
    else if (e.key === 'Escape') { choisir(null); (e.currentTarget as HTMLElement).blur(); }
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
              tabIndex={0} role="group" aria-roledescription="bloc" aria-label={`${def.nom}, forme ${forme}, ${b.place.w} colonnes sur ${b.place.h}. Entrée pour écrire.`}
              onPointerDown={e => debut(e, b, 'deplacer')} onPointerMove={suite} onPointerUp={fin} onPointerCancel={fin}
              onFocus={() => choisir(b.id)} onKeyDown={e => { if (direct !== b.id) clavier(e, b); }} onDoubleClick={() => ouvrirDirect(b.id)}>
              <section className={`r-bloc r-${b.type}-bloc${direct === b.id ? ' e-direct' : ''}`}>
                {direct === b.id
                  ? <Direct bloc={b} projet={x.projet} pageId={page.id} magasin={magasin} fermer={fermerDirect} dire={dire} />
                  : <RenduBloc bloc={b} x={x} />}
              </section>
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
