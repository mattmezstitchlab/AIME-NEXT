/**
 * L'affichage des blocs : un composant par type, sans effet de bord. Il reçoit le bloc, le projet et la forme
 * déjà choisie par la grille ; il ne modifie rien. Le même rendu sert à l'édition, à l'aperçu et à l'export.
 */
import type { ReactNode } from 'react';
import { contenuDe, personnesDe, type Bloc, type Contenu, type Projet } from '../core';
import { dateLongue, initiales, joursAvant, lireDate, MOIS, semainesDuMois } from './formats';

export type ContexteRendu = { projet: Projet; urlMedia: (id: string) => string | undefined; edition: boolean; maintenant?: Date };
type Props = { bloc: Bloc; forme: string; x: ContexteRendu };
type Evenement = Extract<Contenu, { type: 'evenement' }>;

function vide(texte: string): ReactNode {
  return <div className="r-vide">{texte}</div>;
}
function evenementDe(x: ContexteRendu, b: Bloc): Evenement | undefined {
  const c = contenuDe(x.projet, b);
  return c && c.type === 'evenement' ? c : undefined;
}
const s = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);

function Titre({ bloc, forme, x }: Props) {
  const c = contenuDe(x.projet, bloc);
  const texte = c?.type === 'evenement' ? c.titre : c?.type === 'texte' ? c.texte : '';
  const N = bloc.props.niveau === 2 ? 'h2' : bloc.props.niveau === 3 ? 'h3' : 'h1';
  const sous = s(bloc.props.sousTitre);
  return (
    <div className={`r-titre a-${s(bloc.props.aligne, 'centre')} f-${forme}`}>
      {sous && <p className="r-sur">{sous}</p>}
      <N className="r-t">{texte || 'Votre titre'}</N>
      {c?.type === 'evenement' && <p className="r-meta">{dateLongue(c.debut)}</p>}
    </div>
  );
}

function Texte({ bloc, x }: Props) {
  const c = contenuDe(x.projet, bloc);
  if (!c || c.type !== 'texte') return vide('Choisissez un texte dans « Vos informations ».');
  return <div className={`r-texte a-${s(bloc.props.aligne, 'gauche')}`}>{c.texte.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>;
}

function Image({ bloc, x }: Props) {
  const c = contenuDe(x.projet, bloc);
  if (!c || c.type !== 'image') return vide('Ajoutez une image.');
  const url = x.urlMedia(c.media);
  const cad = (bloc.props.cadrage ?? {}) as { x?: number; y?: number; zoom?: number };
  const legende = s(bloc.props.legende);
  return (
    <figure className="r-image">
      {url
        ? <img src={url} alt={c.alt} style={{ objectPosition: `${cad.x ?? 50}% ${cad.y ?? 50}%`, transform: `scale(${(cad.zoom ?? 100) / 100})`, transformOrigin: `${cad.x ?? 50}% ${cad.y ?? 50}%` }} />
        : <div className="r-vide" role="img" aria-label={c.alt || 'Image'}>Image absente de cet appareil</div>}
      {legende && <figcaption>{legende}</figcaption>}
    </figure>
  );
}

function Bouton({ bloc, x }: Props) {
  const libelle = s(bloc.props.libelle, 'Je réponds');
  const lien = s(bloc.props.lien, '#');
  return <div className="r-bouton">{x.edition ? <span className="r-btn">{libelle}</span> : <a className="r-btn" href={lien} {...(lien.startsWith('https://') ? { rel: 'noopener', target: '_blank' } : {})}>{libelle}</a>}</div>;
}

function DateBloc({ bloc, forme, x }: Props) {
  const ev = evenementDe(x, bloc);
  if (!ev) return vide('Choisissez un événement.');
  const d = lireDate(ev.debut);
  if (!d) return vide('Date à préciser.');
  if (forme === 'pastille') return (
    <div className="r-pastille"><b>{d.getDate()}</b><span>{MOIS[d.getMonth()]!.slice(0, 4)}.</span><small>{d.getFullYear()}</small></div>
  );
  if (forme === 'compte') {
    const j = joursAvant(ev.debut, x.maintenant) ?? 0;
    return (
      <div className="r-compte">
        <b>{Math.abs(j)}</b>
        <span>{j > 1 ? 'jours avant le grand jour' : j === 1 ? 'jour avant le grand jour' : j === 0 ? "c'est aujourd'hui" : j === -1 ? 'jour depuis' : 'jours depuis'}</span>
        <small>{dateLongue(ev.debut)}</small>
      </div>
    );
  }
  if (forme === 'calendrier') return (
    <div className="r-calendrier">
      <p>{MOIS[d.getMonth()]} {d.getFullYear()}</p>
      <table><thead><tr>{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => <th key={i} scope="col">{j}</th>)}</tr></thead>
        <tbody>{semainesDuMois(ev.debut).map((sem, i) => <tr key={i}>{sem.map((n, k) => <td key={k} className={n === d.getDate() ? 'r-jour' : undefined} {...(n === d.getDate() ? { 'aria-current': 'date' as const } : {})}>{n ?? ''}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  return (
    <div className="r-frise">
      <p className="r-meta">{dateLongue(ev.debut)}</p>
      <ol>{ev.programme.length ? ev.programme.map((e, i) => <li key={i}><b>{e.heure}</b><span>{e.titre}</span></li>) : <li><span>{ev.titre}</span></li>}</ol>
    </div>
  );
}

function Lieu({ bloc, forme, x }: Props) {
  const c = contenuDe(x.projet, bloc);
  if (!c || c.type !== 'lieu') return vide('Choisissez un lieu.');
  const q = encodeURIComponent([c.nom, c.adresse].filter(Boolean).join(', '));
  const lien = (href: string, t: string) => x.edition ? <span className="r-lien">{t}</span> : <a className="r-lien" href={href} target="_blank" rel="noopener">{t}</a>;
  if (forme === 'nom') return <div className="r-lieu-nom"><span aria-hidden="true">◉</span> {c.nom}</div>;
  return (
    <div className={`r-lieu f-${forme}`}>
      <div className="r-plan" aria-hidden="true"><i /><i /><i /><b /></div>
      <div className="r-lieu-t"><b>{c.nom}</b>{c.adresse && <span>{c.adresse}</span>}
        <p>{lien(`https://www.openstreetmap.org/search?query=${q}`, 'Voir sur une carte')}{forme === 'itineraire' && <> · {lien(`https://www.google.com/maps/dir/?api=1&destination=${q}`, 'Itinéraire')}</>}</p>
      </div>
    </div>
  );
}

function Personnes({ bloc, forme, x }: Props) {
  const l = personnesDe(x.projet, bloc);
  if (!l.length) return vide('Ajoutez des personnes dans « Vos informations ».');
  if (forme === 'avatars') return <ul className="r-avatars" aria-label="Personnes">{l.map(p => <li key={p.id} title={p.nom}><span aria-hidden="true">{initiales(p.nom)}</span><span className="vh">{p.nom}</span></li>)}</ul>;
  if (forme === 'equipe') return <ul className="r-equipe">{l.map(p => <li key={p.id}><span aria-hidden="true">{initiales(p.nom)}</span><b>{p.nom}</b>{p.role && <small>{p.role}</small>}</li>)}</ul>;
  const n = l.length;
  return (
    <div className="r-reseau">
      <svg viewBox="0 0 200 120" role="img" aria-label={`Réseau de ${n} personnes`}>
        {l.map((p, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return <line key={p.id} x1="100" y1="60" x2={100 + Math.cos(a) * 70} y2={60 + Math.sin(a) * 42} />; })}
        <circle cx="100" cy="60" r="7" className="r-centre" />
        {l.map((p, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; const cx = 100 + Math.cos(a) * 70, cy = 60 + Math.sin(a) * 42; return <g key={p.id}><circle cx={cx} cy={cy} r="11" /><text x={cx} y={cy + 3.5} textAnchor="middle">{initiales(p.nom)}</text></g>; })}
      </svg>
      <ul className="vh">{l.map(p => <li key={p.id}>{p.nom}{p.role ? `, ${p.role}` : ''}</li>)}</ul>
    </div>
  );
}

function Programme({ bloc, forme, x }: Props) {
  const ev = evenementDe(x, bloc);
  if (!ev) return vide('Choisissez un événement.');
  if (!ev.programme.length) return vide('Ajoutez les étapes du programme.');
  return <ol className={`r-programme f-${forme}`}>{ev.programme.map((e, i) => <li key={i}><b>{e.heure}</b><span>{e.titre}</span>{e.detail && <small>{e.detail}</small>}</li>)}</ol>;
}

export const RENDUS: Record<string, (p: Props) => ReactNode> = {
  titre: Titre, texte: Texte, image: Image, bouton: Bouton, date: DateBloc, lieu: Lieu, personnes: Personnes, programme: Programme,
};
