/**
 * L'application : « Mes projets » puis le Constructeur. La Page Zéro et Le Monde AIME arrivent à l'étape 4.
 * Adresses : #/ (mes projets), #/projet/<id>.
 */
import { useEffect, useState } from 'react';
import { nouvelId, projetVide, type Projet } from '../core';
import { ouvrirDepot, type Depot, type Resume } from '../stockage/depot';
import { importer } from '../stockage/archive';
import { demoLeaEtMarc } from '../demo/lea-et-marc';
import { Constructeur } from '../editeur/Constructeur';

function route(): { ecran: 'accueil' } | { ecran: 'projet'; id: string } {
  const m = /^#\/projet\/([a-z0-9][a-z0-9_-]{2,63})$/.exec(location.hash);
  return m ? { ecran: 'projet', id: m[1]! } : { ecran: 'accueil' };
}

export function App() {
  const [depot, setDepot] = useState<Depot | null>(null);
  const [erreur, setErreur] = useState('');
  const [r, setR] = useState(route);
  useEffect(() => { ouvrirDepot().then(setDepot, () => setErreur('Ce navigateur refuse le stockage local : les projets ne peuvent pas être enregistrés ici (navigation privée ?).')); }, []);
  useEffect(() => { const f = () => setR(route()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  if (erreur) return <main className="m-page"><p className="m-erreur" role="alert">{erreur}</p></main>;
  if (!depot) return <main className="m-page"><p role="status">Ouverture de vos projets…</p></main>;
  return r.ecran === 'projet' ? <OuvrirProjet key={r.id} id={r.id} depot={depot} /> : <Accueil depot={depot} />;
}

function OuvrirProjet({ id, depot }: { id: string; depot: Depot }) {
  const [etat, setEtat] = useState<{ projet: Projet; medias: Map<string, Blob> } | { erreur: string } | null>(null);
  useEffect(() => {
    let vivant = true;
    (async () => {
      const r = await depot.charger(id);
      if (!vivant) return;
      if (!r.ok) { setEtat({ erreur: r.raison }); return; }
      setEtat({ projet: r.projet, medias: await depot.mediasDuProjet(id) });
    })();
    return () => { vivant = false; };
  }, [id, depot]);
  if (!etat) return <main className="m-page"><p role="status">Ouverture du projet…</p></main>;
  if ('erreur' in etat) return <main className="m-page"><p className="m-erreur" role="alert">{etat.erreur}</p><a className="a-btn" href="#/">← Mes projets</a></main>;
  return <Constructeur initial={etat.projet} medias={etat.medias} depot={depot} retour={() => { location.hash = '#/'; }} />;
}

function Accueil({ depot }: { depot: Depot }) {
  const [projets, setProjets] = useState<Resume[] | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { depot.lister().then(setProjets, () => setProjets([])); }, [depot]);

  const creer = async (p: Projet, medias?: Map<string, Blob>) => {
    await depot.enregistrer(p);
    if (medias) for (const [id, b] of medias) await depot.mettreMedia(p.id, id, b);
    location.hash = `#/projet/${p.id}`;
  };
  const importerFichier = async (f: File) => {
    const r = importer(await f.text());
    if (!r.ok) { setMessage(`Import impossible : ${r.raison}`); return; }
    const existe = (await depot.lister()).some(x => x.id === r.projet.id);
    const projet = existe ? { ...r.projet, id: nouvelId('p') } : r.projet;
    if (!r.ignores.length) { await creer(projet, r.medias); return; }
    // ce qui n'a pas pu être repris est dit avant d'ouvrir, jamais passé sous silence
    await depot.enregistrer(projet);
    for (const [id, b] of r.medias) await depot.mettreMedia(projet.id, id, b);
    setProjets(await depot.lister());
    setMessage(`« ${projet.titre} » est importé. Blocs d'AIMESTUDIO non repris (pas encore dans AIME NEXT) : ${r.ignores.join(', ')}.`);
  };

  return (
    <main className="m-page">
      <header className="m-tete">
        <p className="m-marque">AIME <span>NEXT</span></p>
        <h1>Mes projets</h1>
        <p className="m-dit">Vos projets sont enregistrés dans ce navigateur. Exportez-les (.aime) pour les garder ailleurs.</p>
      </header>
      <div className="m-actions">
        <button type="button" className="a-btn a-fort" onClick={() => creer(projetVide('Nouveau projet'))}>Nouveau projet</button>
        <button type="button" className="a-btn" onClick={() => creer({ ...demoLeaEtMarc(new Date()), id: nouvelId('p'), titre: 'Léa & Marc (démonstration)' })}>Essayer la démonstration</button>
        <label className="a-btn m-fichier">Importer un fichier
          <input type="file" accept=".aime,.json,application/json" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importerFichier(f); }} />
        </label>
      </div>
      {message && <p className="m-erreur" role="alert">{message}</p>}
      {projets === null ? <p role="status">Lecture…</p> : projets.length === 0 ? <p className="m-dit">Aucun projet pour l'instant.</p> : (
        <ul className="m-liste">
          {projets.map(p => <li key={p.id}><a href={`#/projet/${p.id}`}><b>{p.titre}</b><span>Modifié le {new Date(p.modifieLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span></a></li>)}
        </ul>
      )}
      <p className="m-note">La Page Zéro et Le Monde AIME rejoindront ce Constructeur à l'étape suivante.</p>
    </main>
  );
}
