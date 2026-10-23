/**
 * Le Monde AIME : la découverte qui devient création. On y manipule déjà les vrais blocs du Constructeur
 * (même rendu, mêmes formes) ; ce qu'on écrit ici devient le premier projet, sans changer d'outil.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { exiger, formePour, hauteurPour, nouvelId, projetVide, type Bloc, type Contenu, type Projet } from '../core';
import { demoLeaEtMarc } from '../demo/lea-et-marc';
import { RenduBloc } from '../rendu/Page';
import { variables } from '../design/systemes';
import type { Depot } from '../stockage/depot';
import { Orbe } from './Orbe';

const FACES = [
  { qui: 'Les mariés', voit: 'Tout : le programme, les réponses, le budget.' },
  { qui: 'Les invités', voit: 'L’heure, le lieu, le plan de table, leur réponse.' },
  { qui: 'Le traiteur', voit: 'Le nombre de couverts, les régimes, l’heure du dîner.' },
  { qui: 'La photographe', voit: 'Les moments clés et les personnes à ne pas manquer.' },
  { qui: 'La coordinatrice', voit: 'Le déroulé minute par minute, et ce qui bouge.' },
  { qui: 'Le musicien', voit: 'L’entrée, la première danse, la fin de soirée.' },
];

/** l'orientation du cube qui montre chaque face */
const ROTATIONS = ['rotateX(-12deg) rotateY(18deg)', 'rotateX(-12deg) rotateY(-72deg)', 'rotateX(-12deg) rotateY(-162deg)', 'rotateX(-12deg) rotateY(108deg)', 'rotateX(-78deg) rotateY(18deg)', 'rotateX(78deg) rotateY(18deg)'];

const bloc = (id: string, type: string, w: number, source?: string): Bloc => {
  const d = exiger(type);
  return { id, type, ...(source ? { source } : {}), place: { x: 0, y: 0, w, h: hauteurPour(d, w) }, props: d.props.parse({}) };
};

export function Monde({ depot }: { depot: Depot }) {
  const [projet, setProjet] = useState<Projet>(() => demoLeaEtMarc(new Date()));
  const [largeur, setLargeur] = useState(3);
  const [face, setFace] = useState(0);
  const [message, setMessage] = useState('');
  const ev = projet.contenus['c-mariage'] as Extract<Contenu, { type: 'evenement' }>;
  const x = useMemo(() => ({ projet, urlMedia: () => undefined, edition: false }), [projet]);
  const style = variables(projet.style) as CSSProperties;
  const majEvenement = (champs: Partial<typeof ev>) => setProjet(p => ({ ...p, contenus: { ...p.contenus, 'c-mariage': { ...ev, ...champs } } }));
  const forme = formePour(exiger('date'), largeur).forme;
  const NOMS: Record<string, string> = { pastille: 'une pastille', compte: 'un compte à rebours', calendrier: 'un calendrier', frise: 'une frise du jour' };

  const creer = async (p: Projet) => {
    try {
      await depot.enregistrer(p);
      location.hash = `#/projet/${p.id}`;
    } catch { setMessage('Ce navigateur refuse l’enregistrement : essayez hors navigation privée.'); }
  };

  return (
    <div className="x-page m-monde">
      <header className="x-tete"><a className="x-marque" href="#/">AIME</a><nav aria-label="Navigation"><a href="#/monde" aria-current="page">Le Monde AIME</a><a href="#/projets">Mes projets</a></nav></header>

      <section className="w-ouverture">
        <p className="w-sur">Le Monde AIME</p>
        <h1>Une information. <em>Toutes ses formes.</em></h1>
        <p className="w-chapo">Vous écrivez une chose une fois. AIME la montre partout où elle compte, sous la forme qui convient à la place qu’on lui donne.</p>
      </section>

      <section className="w-chapitre" aria-labelledby="w-1">
        <div className="w-txt">
          <p className="w-num">01 · La forme suit la place</p>
          <h2 id="w-1">Agrandissez la date.</h2>
          <p>Le même bloc, la même date. Seule sa largeur change, et sa forme avec elle.</p>
          <label className="w-curseur">
            <span>Largeur : <b>{largeur}</b> colonne{largeur > 1 ? 's' : ''} sur 12, la date devient {NOMS[forme] ?? forme}.</span>
            <input type="range" min={1} max={12} value={largeur} onChange={e => setLargeur(Number(e.target.value))} />
          </label>
        </div>
        <div className="w-scene r-page" style={style}>
          <div className="w-piste">
            <div className="w-bloc r-bloc" style={{ width: `${(largeur / 12) * 100}%`, aspectRatio: `${largeur} / ${hauteurPour(exiger('date'), largeur)}` }}>
              <RenduBloc bloc={bloc('w-date', 'date', largeur, 'c-mariage')} x={x} />
            </div>
          </div>
        </div>
      </section>

      <section className="w-chapitre" aria-labelledby="w-2">
        <div className="w-txt">
          <p className="w-num">02 · Saisi une fois</p>
          <h2 id="w-2">Écrivez-le ici. Il change partout.</h2>
          <label className="w-champ"><span>Le nom de votre événement</span><input value={ev.titre} maxLength={120} onChange={e => majEvenement({ titre: e.target.value })} /></label>
          <label className="w-champ"><span>Sa date</span><input type="date" value={ev.debut} onChange={e => e.target.value && majEvenement({ debut: e.target.value })} /></label>
        </div>
        <div className="w-scene r-page w-trois" style={style}>
          <div className="r-bloc w-t"><RenduBloc bloc={bloc('w-titre', 'titre', 12, 'c-mariage')} x={x} /></div>
          <div className="r-bloc w-c"><RenduBloc bloc={bloc('w-compte', 'date', 5, 'c-mariage')} x={x} /></div>
          <div className="r-bloc w-p"><RenduBloc bloc={bloc('w-pastille', 'date', 3, 'c-mariage')} x={x} /></div>
        </div>
      </section>

      <section className="w-chapitre" aria-labelledby="w-3">
        <div className="w-txt">
          <p className="w-num">03 · Six perspectives</p>
          <h2 id="w-3">Un même jour, six regards.</h2>
          <p>Chacun voit ce qui le concerne, tiré de la même information. Aucune copie, aucun oubli.</p>
          <div className="w-faces" role="group" aria-label="Choisir une perspective">
            {FACES.map((f, i) => <button key={f.qui} type="button" className="x-btn" aria-pressed={face === i} onClick={() => setFace(i)}>{f.qui}</button>)}
          </div>
          <p className="w-voit" aria-live="polite"><b>{FACES[face]!.qui}</b> : {FACES[face]!.voit}</p>
        </div>
        <div className="w-cube-scene" aria-hidden="true">
          <div className="w-cube" style={{ transform: ROTATIONS[face] }}>
            {FACES.map((f, i) => <div key={f.qui} className={`w-face w-f${i}`}><span>{f.qui}</span></div>)}
          </div>
        </div>
      </section>

      <section className="w-fin" aria-labelledby="w-fin">
        <Orbe taille={88} />
        <h2 id="w-fin">À vous.</h2>
        <p>Votre projet commence avec ce que vous venez d’écrire. Vous pourrez tout changer.</p>
        <div className="z-actions">
          <button type="button" className="x-btn x-fort" onClick={() => creer({ ...projet, id: nouvelId('p'), titre: ev.titre || 'Mon projet' })}>Créer mon projet avec cet exemple</button>
          <button type="button" className="x-btn" onClick={() => creer(projetVide('Nouveau projet'))}>Partir d’une page vide</button>
        </div>
        {message && <p className="m-erreur" role="alert">{message}</p>}
      </section>
    </div>
  );
}
