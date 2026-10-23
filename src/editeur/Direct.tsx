/**
 * L'écriture directe dans un bloc : on écrit sur la page, pas dans un panneau.
 * Chaque frappe est une commande regroupée (une seule étape d'annulation par saisie).
 * Les blocs à plusieurs champs (programme, personnes, image) gardent le panneau.
 */
import { useEffect, useRef } from 'react';
import { contenuDe, exiger, type Bloc, type Commande, type Magasin, type Projet } from '../core';

export const DIRECTS = new Set(['titre', 'texte', 'bouton', 'lieu', 'date']);

export function Direct({ bloc, projet, pageId, magasin, fermer, dire }: {
  bloc: Bloc; projet: Projet; pageId: string; magasin: Magasin; fermer: () => void; dire: (m: string) => void;
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => { const e = ref.current; if (e) { e.focus(); if (e.type !== 'date') e.select(); } }, []);
  const exe = (c: Commande) => { const r = magasin.executer(c, { cle: `direct:${bloc.id}` }); if (!r.ok) dire(r.raison); };
  const c = contenuDe(projet, bloc);
  const clavier = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape' || (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement))) { e.preventDefault(); fermer(); }
  };
  const commun = { ref, onKeyDown: clavier, onBlur: fermer, onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), className: 'd-champ' };
  const nom = exiger(bloc.type).nom;

  if (bloc.type === 'titre' && c && (c.type === 'evenement' || c.type === 'texte')) {
    const v = c.type === 'evenement' ? c.titre : c.texte;
    return <div className={`r-titre a-${String(bloc.props.aligne ?? 'centre')} d-zone`}>
      <input {...commun} className="r-t d-champ" aria-label={`${nom} : écrire`} value={v} maxLength={200}
        onChange={e => exe({ type: 'remplacerContenu', contenu: c.type === 'evenement' ? { ...c, titre: e.target.value } : { ...c, texte: e.target.value } })} />
    </div>;
  }
  if (bloc.type === 'texte' && c?.type === 'texte') return (
    <div className="r-texte d-zone"><textarea {...commun} aria-label="Texte : écrire" value={c.texte} onChange={e => exe({ type: 'remplacerContenu', contenu: { ...c, texte: e.target.value } })} /></div>
  );
  if (bloc.type === 'bouton') return (
    <div className="r-bouton d-zone"><input {...commun} className="r-btn d-champ" aria-label="Libellé du bouton" value={String(bloc.props.libelle ?? '')} maxLength={60}
      onChange={e => e.target.value && exe({ type: 'modifierBloc', page: pageId, id: bloc.id, props: { libelle: e.target.value } })} /></div>
  );
  if (bloc.type === 'lieu' && c?.type === 'lieu') return (
    <div className="r-lieu-nom d-zone"><input {...commun} aria-label="Nom du lieu" value={c.nom} maxLength={200} onChange={e => exe({ type: 'remplacerContenu', contenu: { ...c, nom: e.target.value } })} /></div>
  );
  if (bloc.type === 'date' && c?.type === 'evenement') return (
    <div className="d-zone d-date"><label>Date<input {...commun} type="date" value={c.debut.slice(0, 10)} onChange={e => e.target.value && exe({ type: 'remplacerContenu', contenu: { ...c, debut: e.target.value } })} /></label></div>
  );
  return null;
}
