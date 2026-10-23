/**
 * Les champs qui modifient une information. Ils sont partagés par le panneau d'un bloc et par « Vos informations » :
 * corriger ici, c'est corriger partout où l'information est montrée.
 */
import { useId } from 'react';
import { blocsQuiMontrent, type Contenu, type Magasin } from '../core';

type Ev = Extract<Contenu, { type: 'evenement' }>;

export function Champ({ label, children, aide }: { label: string; children: (id: string) => React.ReactNode; aide?: string }) {
  const id = useId();
  return <div className="c-champ"><label htmlFor={id}>{label}</label>{children(id)}{aide && <small>{aide}</small>}</div>;
}

export function EditeurContenu({ contenu, magasin, dire }: { contenu: Contenu; magasin: Magasin; dire: (m: string) => void }) {
  const maj = (c: Contenu) => { const r = magasin.executer({ type: 'remplacerContenu', contenu: c }, { cle: `contenu:${c.id}` }); if (!r.ok) dire(r.raison); };
  switch (contenu.type) {
    case 'texte': return <Champ label="Texte">{id => <textarea id={id} rows={5} value={contenu.texte} onChange={e => maj({ ...contenu, texte: e.target.value })} />}</Champ>;
    case 'lieu': return <>
      <Champ label="Nom du lieu">{id => <input id={id} value={contenu.nom} maxLength={200} onChange={e => maj({ ...contenu, nom: e.target.value })} />}</Champ>
      <Champ label="Adresse">{id => <input id={id} value={contenu.adresse ?? ''} maxLength={400} onChange={e => { const { adresse: _a, ...reste } = contenu; maj(e.target.value ? { ...reste, adresse: e.target.value } : reste); }} />}</Champ>
    </>;
    case 'personne': return <>
      <Champ label="Nom">{id => <input id={id} value={contenu.nom} maxLength={120} onChange={e => maj({ ...contenu, nom: e.target.value })} />}</Champ>
      <Champ label="Rôle">{id => <input id={id} value={contenu.role ?? ''} maxLength={120} onChange={e => { const { role: _r, ...reste } = contenu; maj(e.target.value ? { ...reste, role: e.target.value } : reste); }} />}</Champ>
    </>;
    case 'image': return <Champ label="Texte alternatif" aide="Décrit l'image pour qui ne la voit pas.">{id => <input id={id} value={contenu.alt} maxLength={400} onChange={e => maj({ ...contenu, alt: e.target.value })} />}</Champ>;
    case 'evenement': return <EditeurEvenement ev={contenu} maj={maj} />;
  }
}

function EditeurEvenement({ ev, maj }: { ev: Ev; maj: (c: Contenu) => void }) {
  const etape = (i: number, k: 'heure' | 'titre' | 'detail', v: string) => maj({ ...ev, programme: ev.programme.map((e, j) => j !== i ? e : (k === 'detail' && !v ? { heure: e.heure, titre: e.titre } : { ...e, [k]: v })) });
  return <>
    <Champ label="Nom de l'événement">{id => <input id={id} value={ev.titre} maxLength={200} onChange={e => maj({ ...ev, titre: e.target.value })} />}</Champ>
    <Champ label="Date">{id => <input id={id} type="date" value={ev.debut.slice(0, 10)} onChange={e => e.target.value && maj({ ...ev, debut: e.target.value })} />}</Champ>
    <fieldset className="c-programme">
      <legend>Programme</legend>
      {ev.programme.map((e, i) => (
        <div key={i} className="c-etape">
          <input aria-label={`Étape ${i + 1} : heure`} value={e.heure} maxLength={20} onChange={x => etape(i, 'heure', x.target.value)} />
          <input aria-label={`Étape ${i + 1} : titre`} value={e.titre} maxLength={120} onChange={x => etape(i, 'titre', x.target.value)} />
          <input aria-label={`Étape ${i + 1} : précision`} value={e.detail ?? ''} maxLength={240} placeholder="précision" onChange={x => etape(i, 'detail', x.target.value)} />
          <button type="button" className="c-mini" aria-label={`Retirer l'étape ${i + 1}`} onClick={() => maj({ ...ev, programme: ev.programme.filter((_, j) => j !== i) })}>×</button>
        </div>
      ))}
      <button type="button" className="c-bouton" onClick={() => maj({ ...ev, programme: [...ev.programme, { heure: '', titre: 'Nouvelle étape' }] })}>Ajouter une étape</button>
    </fieldset>
  </>;
}

export function Partage({ magasin, id }: { magasin: Magasin; id: string }) {
  const n = blocsQuiMontrent(magasin.lire(), id).length;
  return <p className="c-partage">{n > 1 ? `Montré par ${n} blocs : tous suivent.` : n === 1 ? 'Montré par 1 bloc.' : 'Montré par aucun bloc.'}</p>;
}
