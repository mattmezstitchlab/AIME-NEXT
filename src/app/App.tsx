/**
 * AIME tient sur une seule page. Elle s'ouvre sur le projet demandé (#/p/<id>), sinon sur le dernier projet
 * de cet appareil, sinon sur l'exemple « Léa & Marc », qui ne devient un projet qu'au premier geste.
 */
import { useEffect, useState } from 'react';
import { nouvelId, type Projet } from '../core';
import { ouvrirDepot, type Depot } from '../stockage/depot';
import { demoLeaEtMarc } from '../demo/lea-et-marc';
import { PageUnique } from './PageUnique';

type Ouvert = { projet: Projet; medias: Map<string, Blob>; enregistre: boolean };

function idDemande(): string | null {
  const m = /^#\/p\/([a-z0-9][a-z0-9_-]{2,63})$/.exec(location.hash);
  return m ? m[1]! : null;
}

async function ouvrirCourant(depot: Depot): Promise<Ouvert | { erreur: string }> {
  const demande = idDemande();
  const id = demande ?? (await depot.lister())[0]?.id;
  if (!id) return { projet: { ...demoLeaEtMarc(new Date()), id: nouvelId('p') }, medias: new Map(), enregistre: false };
  const r = await depot.charger(id);
  if (!r.ok) return { erreur: r.raison };
  if (!demande) history.replaceState(null, '', `#/p/${id}`);
  return { projet: r.projet, medias: await depot.mediasDuProjet(id), enregistre: true };
}

export function App() {
  const [depot, setDepot] = useState<Depot | null>(null);
  const [ouvert, setOuvert] = useState<Ouvert | { erreur: string } | null>(null);
  const [cle, setCle] = useState(0);

  useEffect(() => {
    ouvrirDepot().then(setDepot, () => setOuvert({ erreur: 'Ce navigateur refuse le stockage local : rien ne pourra être enregistré ici (navigation privée ?).' }));
  }, []);
  useEffect(() => {
    if (!depot) return;
    let vivant = true;
    ouvrirCourant(depot).then(o => { if (vivant) setOuvert(o); });
    return () => { vivant = false; };
  }, [depot, cle]);
  useEffect(() => {
    const f = () => { setOuvert(null); setCle(c => c + 1); scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  if (!ouvert || !depot) return <main className="m-page"><p role="status">{ouvert && 'erreur' in ouvert ? '' : 'Ouverture…'}</p>{ouvert && 'erreur' in ouvert && <p className="m-erreur" role="alert">{ouvert.erreur}</p>}</main>;
  if ('erreur' in ouvert) return <main className="m-page"><p className="m-erreur" role="alert">{ouvert.erreur}</p><a className="a-btn" href="#/" onClick={() => history.replaceState(null, '', '#/')}>Revenir à l’exemple</a></main>;
  return <PageUnique key={ouvert.projet.id + ':' + cle} initial={ouvert.projet} medias={ouvert.medias} depot={depot} enregistreAuDepart={ouvert.enregistre} />;
}
