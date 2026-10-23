/** Le panneau d'un bloc sélectionné : sa forme, ce qu'il montre, ses réglages, ses actions. Il n'apparaît que sur sélection. */
import { contenuDe, exiger, formePour, type Bloc, type Contenu, type Magasin, type Projet } from '../core';
import { Champ, EditeurContenu, Partage } from './Champs';
import { preparerDuplication } from './creation';

const NOMS_CONTENU: Record<Contenu['type'], string> = { evenement: 'Événement', lieu: 'Lieu', texte: 'Texte', personne: 'Personne', image: 'Image' };
function libelle(c: Contenu): string {
  const t = c.type === 'evenement' ? c.titre : c.type === 'lieu' || c.type === 'personne' ? c.nom : c.type === 'texte' ? c.texte : c.alt || 'Image';
  return `${NOMS_CONTENU[c.type]} · ${t.slice(0, 40) || 'sans titre'}`;
}

export function Panneau({ projet, pageId, bloc, magasin, choisir, dire, changerImage }: {
  projet: Projet; pageId: string; bloc: Bloc; magasin: Magasin; choisir: (id: string | null) => void; dire: (m: string) => void;
  changerImage: (bloc: Bloc) => void;
}) {
  const def = exiger(bloc.type);
  const forme = formePour(def, bloc.place.w, bloc.forme).forme;
  const c = contenuDe(projet, bloc);
  const exe = (cmd: Parameters<Magasin['executer']>[0], cle?: string) => { const r = magasin.executer(cmd, cle ? { cle } : {}); if (!r.ok) dire(r.raison); return r.ok; };
  const props = (p: Record<string, unknown>, cle?: string) => exe({ type: 'modifierBloc', page: pageId, id: bloc.id, props: p }, cle);
  const compatibles = def.accepte ? Object.values(projet.contenus).filter(x => def.accepte!.includes(x.type)) : [];
  const s = (k: string, d = '') => (typeof bloc.props[k] === 'string' ? (bloc.props[k] as string) : d);

  return (
    <aside className="c-panneau" aria-label={`Réglages du bloc ${def.nom}`}>
      <header className="c-tete"><h2>{def.nom}{def.formes.length > 1 && <small className="c-forme"> · {forme}</small>}</h2><button type="button" className="c-mini" aria-label="Fermer les réglages" onClick={() => choisir(null)}>×</button></header>

      {compatibles.length > 1 && (
        <Champ label="Montre">{id => (
          <select id={id} value={bloc.source ?? ''} onChange={e => {
            const b = magasin.lire().supports.flatMap(x => x.pages).find(p => p.id === pageId)?.blocs.find(x => x.id === bloc.id);
            if (!b) return;
            exe({ type: 'lot', commandes: [{ type: 'supprimerBloc', page: pageId, id: b.id }, { type: 'ajouterBloc', page: pageId, bloc: { ...b, source: e.target.value } }] });
          }}>
            {compatibles.map(x => <option key={x.id} value={x.id}>{libelle(x)}</option>)}
          </select>
        )}</Champ>
      )}

      {c && <div className="c-groupe"><h3>L'information</h3><EditeurContenu contenu={c} magasin={magasin} dire={dire} /><Partage magasin={magasin} id={c.id} /></div>}

      <div className="c-groupe"><h3>Présentation</h3>
        {bloc.type === 'titre' && <>
          <Champ label="Surtitre">{id => <input id={id} value={s('sousTitre')} maxLength={200} onChange={e => props({ sousTitre: e.target.value }, `props:${bloc.id}`)} />}</Champ>
          <Champ label="Niveau">{id => <select id={id} value={String(bloc.props.niveau ?? 1)} onChange={e => props({ niveau: Number(e.target.value) })}><option value="1">Titre principal</option><option value="2">Titre de section</option><option value="3">Petit titre</option></select>}</Champ>
        </>}
        {(bloc.type === 'titre' || bloc.type === 'texte') && (
          <Champ label="Alignement">{id => <select id={id} value={s('aligne', bloc.type === 'titre' ? 'centre' : 'gauche')} onChange={e => props({ aligne: e.target.value })}><option value="gauche">À gauche</option><option value="centre">Centré</option><option value="droite">À droite</option></select>}</Champ>
        )}
        {bloc.type === 'bouton' && <>
          <Champ label="Libellé">{id => <input id={id} value={s('libelle')} maxLength={60} onChange={e => e.target.value && props({ libelle: e.target.value }, `props:${bloc.id}`)} />}</Champ>
          <Champ label="Lien" aide="Une ancre (#reponse), une page (/infos) ou une adresse https.">{id => <input id={id} defaultValue={s('lien', '#')} onBlur={e => props({ lien: e.target.value.trim() || '#' })} />}</Champ>
        </>}
        {bloc.type === 'image' && <>
          <button type="button" className="c-bouton" onClick={() => changerImage(bloc)}>Remplacer l'image</button>
          <Champ label="Légende">{id => <input id={id} value={s('legende')} maxLength={300} onChange={e => props({ legende: e.target.value }, `props:${bloc.id}`)} />}</Champ>
          {(['x', 'y', 'zoom'] as const).map(k => {
            const cad = (bloc.props.cadrage ?? {}) as Record<string, number>;
            const [min, max, nom] = k === 'zoom' ? [100, 230, 'Zoom'] : [0, 100, k === 'x' ? 'Cadrage horizontal' : 'Cadrage vertical'];
            return <Champ key={k} label={nom}>{id => <input id={id} type="range" min={min} max={max} value={cad[k] ?? (k === 'zoom' ? 100 : 50)} onChange={e => props({ cadrage: { x: 50, y: 50, zoom: 100, ...cad, [k]: Number(e.target.value) } }, `cadrage:${bloc.id}`)} />}</Champ>;
          })}
        </>}
        {bloc.type === 'personnes' && (
          <fieldset className="c-liste"><legend>Personnes montrées</legend>
            <small>Aucune cochée : toutes les personnes du projet.</small>
            {Object.values(projet.contenus).filter(x => x.type === 'personne').map(x => {
              const liste = Array.isArray(bloc.props.personnes) ? (bloc.props.personnes as string[]) : [];
              return <label key={x.id} className="c-coche"><input type="checkbox" checked={liste.includes(x.id)} onChange={e => props({ personnes: e.target.checked ? [...liste, x.id] : liste.filter(i => i !== x.id) })} />{x.type === 'personne' ? x.nom : ''}</label>;
            })}
          </fieldset>
        )}
        <p className="c-info">{bloc.place.w} colonnes × {bloc.place.h} rangées. Agrandissez le bloc pour changer sa forme. Flèches : déplacer ; Maj + flèches : redimensionner ; Entrée : écrire.</p>
      </div>

      <div className="c-groupe"><h3>Verrous</h3>
        <label className="c-coche"><input type="checkbox" checked={!!bloc.verrous?.position} onChange={e => exe({ type: 'modifierBloc', page: pageId, id: bloc.id, verrous: { ...bloc.verrous, position: e.target.checked } })} />Position verrouillée</label>
        <label className="c-coche"><input type="checkbox" checked={!!bloc.verrous?.taille} onChange={e => exe({ type: 'modifierBloc', page: pageId, id: bloc.id, verrous: { ...bloc.verrous, taille: e.target.checked } })} />Taille verrouillée</label>
      </div>

      <div className="c-actions">
        <button type="button" className="c-bouton" onClick={() => { const d = preparerDuplication(magasin.lire(), pageId, bloc.id); if (d && exe(d.commande)) choisir(d.bloc); }}>Dupliquer</button>
        <button type="button" className="c-bouton c-danger" onClick={() => { if (exe({ type: 'supprimerBloc', page: pageId, id: bloc.id })) { choisir(null); dire('Bloc retiré. « Annuler » le remet.'); } }}>Retirer le bloc</button>
      </div>
    </aside>
  );
}
