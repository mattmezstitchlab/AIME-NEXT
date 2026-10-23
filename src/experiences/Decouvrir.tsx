/**
 * Ce qu'on montre la première fois, sous la page d'exemple : la forme qui suit la place (un curseur)
 * et les six regards (le cube, en image). Disparaît dès que la page devient un projet à soi.
 */
import { useState, type CSSProperties } from 'react';
import { exiger, formePour, hauteurPour, type Bloc } from '../core';
import { demoLeaEtMarc } from '../demo/lea-et-marc';
import { RenduBloc } from '../rendu/Page';
import { variables, type Apparence } from '../design/systemes';

const REGARDS = ['Les mariés', 'Les invités', 'Le traiteur', 'La photographe', 'La coordinatrice', 'Le musicien'];
const NOMS: Record<string, string> = { pastille: 'une pastille', compte: 'un compte à rebours', calendrier: 'un calendrier', frise: 'une frise du jour' };

export function Decouvrir({ apparence }: { apparence: Apparence }) {
  const [largeur, setLargeur] = useState(3);
  const projet = demoLeaEtMarc(new Date());
  const def = exiger('date');
  const b: Bloc = { id: 'b-decouvrir', type: 'date', source: 'c-mariage', place: { x: 0, y: 0, w: largeur, h: hauteurPour(def, largeur) }, props: {} };
  const forme = formePour(def, largeur).forme;
  return (
    <section className="u-decouvrir" aria-labelledby="u-dec">
      <div className="w-chapitre">
        <div className="w-txt">
          <p className="w-num">Comment ça marche</p>
          <h2 id="u-dec">La forme suit la place.</h2>
          <p>Le même bloc, la même date. Agrandissez-le : il change de forme. Sur votre page, c'est pareil : tirez la poignée d'un bloc.</p>
          <label className="w-curseur">
            <span>Largeur : <b>{largeur}</b> colonne{largeur > 1 ? 's' : ''} sur 12, la date devient {NOMS[forme] ?? forme}.</span>
            <input type="range" min={1} max={12} value={largeur} onChange={e => setLargeur(Number(e.target.value))} />
          </label>
        </div>
        <div className="w-scene r-page" style={variables(apparence) as CSSProperties}>
          <div className="w-piste">
            <div className="w-bloc r-bloc" style={{ width: `${(largeur / 12) * 100}%`, aspectRatio: `${largeur} / ${hauteurPour(def, largeur)}` }}>
              <RenduBloc bloc={b} x={{ projet, urlMedia: () => undefined, edition: false }} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-chapitre">
        <div className="w-txt">
          <p className="w-num">Six regards</p>
          <h2>Un même jour, vu par chacun.</h2>
          <p>Les mariés voient tout, les invités l'heure et le lieu, le traiteur le nombre de couverts. Chacun lit la même information, sans copie ni oubli.</p>
        </div>
        <div className="w-cube-scene" aria-hidden="true">
          <div className="w-cube w-tourne">{REGARDS.map((r, i) => <div key={r} className={`w-face w-f${i}`}><span>{r}</span></div>)}</div>
        </div>
      </div>
    </section>
  );
}
