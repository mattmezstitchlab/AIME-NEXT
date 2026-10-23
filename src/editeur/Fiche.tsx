/** « Vos informations » : chaque information saisie une fois, et combien de blocs la montrent. */
import { blocsQuiMontrent, nouvelId, type Contenu, type Magasin, type Projet } from '../core';
import { EditeurContenu, Partage } from './Champs';

const GROUPES: [Contenu['type'], string][] = [['evenement', 'Événement'], ['lieu', 'Lieux'], ['personne', 'Personnes'], ['texte', 'Textes'], ['image', 'Images']];

export function Fiche({ projet, magasin, fermer, dire }: { projet: Projet; magasin: Magasin; fermer: () => void; dire: (m: string) => void }) {
  const ajouter = (c: Contenu) => { const r = magasin.executer({ type: 'ajouterContenu', contenu: c }); if (!r.ok) dire(r.raison); };
  const tous = Object.values(projet.contenus);
  return (
    <aside className="c-panneau" aria-label="Vos informations">
      <header className="c-tete"><h2>Vos informations</h2><button type="button" className="c-mini" aria-label="Fermer" onClick={fermer}>×</button></header>
      <p className="c-info">Corrigez une information ici : tous les blocs qui la montrent suivent.</p>
      {GROUPES.map(([type, nom]) => {
        const l = tous.filter(c => c.type === type);
        if (!l.length && type !== 'personne' && type !== 'texte') return null;
        return (
          <div key={type} className="c-groupe"><h3>{nom}</h3>
            {l.map(c => (
              <div key={c.id} className="c-fiche">
                <EditeurContenu contenu={c} magasin={magasin} dire={dire} />
                <div className="c-ligne"><Partage magasin={magasin} id={c.id} />
                  {blocsQuiMontrent(projet, c.id).length === 0 && <button type="button" className="c-lien" onClick={() => { const r = magasin.executer({ type: 'supprimerContenu', id: c.id }); if (!r.ok) dire(r.raison); }}>Supprimer</button>}
                </div>
              </div>
            ))}
            {type === 'personne' && <button type="button" className="c-bouton" onClick={() => ajouter({ id: nouvelId('c'), type: 'personne', nom: 'Nouvelle personne' })}>Ajouter une personne</button>}
            {type === 'texte' && <button type="button" className="c-bouton" onClick={() => ajouter({ id: nouvelId('c'), type: 'texte', texte: 'Écrivez ici.' })}>Ajouter un texte</button>}
          </div>
        );
      })}
    </aside>
  );
}
