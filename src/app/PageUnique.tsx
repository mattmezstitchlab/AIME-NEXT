/**
 * La page unique d'AIME : on découvre et on crée au même endroit.
 * En haut, l'intention (un nom, une date) ; dessous, la page qui se compose et s'édite directement.
 * Tant que rien n'est modifié, c'est un exemple qui n'est enregistré nulle part ; au premier geste, il devient votre projet.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { creerMagasin, exiger, liste, nouvelId, projetVide, type Bloc, type Projet } from '../core';
import type { Depot, Resume } from '../stockage/depot';
import { exporter, importer } from '../stockage/archive';
import { modeDe } from '../design/systemes';
import { Page } from '../rendu/Page';
import { Scene } from '../editeur/Scene';
import { Panneau } from '../editeur/Panneau';
import { Fiche } from '../editeur/Fiche';
import { DIRECTS } from '../editeur/Direct';
import { preparerAjout } from '../editeur/creation';
import { exporterHtml } from '../editeur/exportHtml';
import { Orbe } from '../experiences/Orbe';
import { Decouvrir } from '../experiences/Decouvrir';
import { commandeIntention, etapes, evenementPrincipal } from './intention';
import { dansUnChamp, dimensions, heure, imageAcceptable, nomDeFichier, telecharger, useProjet } from './outils';

const DESCRIPTIONS: Record<string, string> = {
  titre: 'Le nom de votre événement ou de votre page', texte: 'Un paragraphe', image: 'Une photo de cet appareil', bouton: 'Une action : répondre, réserver',
  date: 'Pastille, compte à rebours, calendrier ou frise selon sa largeur', lieu: 'Nom, carte ou itinéraire selon sa largeur',
  personnes: 'Avatars, équipe ou réseau selon sa largeur', programme: 'Les étapes de la journée',
};

export function PageUnique({ initial, medias, depot, enregistreAuDepart }: { initial: Projet; medias: Map<string, Blob>; depot: Depot; enregistreAuDepart: boolean }) {
  const magasin = useMemo(() => creerMagasin(initial), [initial]);
  const projet = useProjet(magasin);
  const page = projet.supports[0]!.pages[0]!;
  const [enregistre, setEnregistre] = useState(enregistreAuDepart);
  const [selection, setSelection] = useState<string | null>(null);
  const [direct, setDirect] = useState<string | null>(null);
  const [fiche, setFiche] = useState(false);
  const [menuAjout, setMenuAjout] = useState(false);
  const [apercu, setApercu] = useState<null | 'ordinateur' | 'tablette' | 'telephone'>(null);
  const [projets, setProjets] = useState<Resume[] | null>(null);
  const [grille, setGrille] = useState(true);
  const [statut, setStatut] = useState(enregistreAuDepart ? 'Enregistré sur cet appareil' : 'Exemple : rien n’est enregistré tant que vous ne modifiez rien');
  const [annonce, setAnnonce] = useState('');
  const [urls, setUrls] = useState(() => new Map([...medias].map(([id, b]) => [id, URL.createObjectURL(b)])));
  const fichier = useRef<HTMLInputElement>(null);
  const fichierProjet = useRef<HTMLInputElement>(null);
  const cibleImage = useRef<Bloc | 'nouveau' | null>(null);

  const dire = useCallback((m: string) => { setAnnonce(''); requestAnimationFrame(() => setAnnonce(m)); }, []);
  const choisir = (id: string | null) => { setSelection(id); if (id !== direct) setDirect(null); if (id) setFiche(false); };
  useEffect(() => () => { for (const u of urls.values()) URL.revokeObjectURL(u); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* enregistrement automatique ; le premier geste fait de l'exemple votre projet */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = magasin.abonner(() => {
      setStatut('Modifications en cours…');
      clearTimeout(t);
      t = setTimeout(() => {
        const p = magasin.lire();
        depot.enregistrer(p).then(() => {
          setEnregistre(true); setStatut(`Enregistré à ${heure(new Date())}`);
          if (location.hash !== `#/p/${p.id}`) history.replaceState(null, '', `#/p/${p.id}`);
        }, () => setStatut('Échec de l’enregistrement : exportez le projet'));
      }, 500);
    });
    return () => { off(); clearTimeout(t); if (magasin.peutAnnuler()) depot.enregistrer(magasin.lire()).catch(() => {}); };
  }, [magasin, depot]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || dansUnChamp(e)) return;
      const z = e.key.toLowerCase() === 'z', y = e.key.toLowerCase() === 'y';
      if (z && !e.shiftKey) { e.preventDefault(); if (magasin.annuler()) dire('Geste annulé.'); }
      else if ((z && e.shiftKey) || y) { e.preventDefault(); if (magasin.retablir()) dire('Geste rétabli.'); }
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [magasin, dire]);

  const executer = (c: Parameters<typeof magasin.executer>[0], cle?: string) => { const r = magasin.executer(c, cle ? { cle } : {}); if (!r.ok) dire(r.raison); return r.ok; };

  const ajouter = (type: string) => {
    setMenuAjout(false);
    if (type === 'image') { cibleImage.current = 'nouveau'; fichier.current?.click(); return; }
    const { commande, bloc } = preparerAjout(magasin.lire(), page.id, type);
    if (executer(commande)) {
      choisir(bloc); dire(`${exiger(type).nom} ajouté.`);
      setTimeout(() => { const el = document.querySelector(`[data-bloc="${bloc}"]`) as HTMLElement | null; el?.scrollIntoView({ block: 'center', behavior: 'smooth' }); el?.focus({ preventScroll: true }); }, 30);
    }
  };

  const recevoirImage = async (f: File) => {
    if (!imageAcceptable(f)) { dire('Image refusée : JPEG, PNG, WebP ou GIF, 25 Mo au plus.'); return; }
    const id = nouvelId('m');
    await depot.mettreMedia(projet.id, id, f);
    setUrls(u => new Map(u).set(id, URL.createObjectURL(f)));
    const media = { id, nom: f.name.slice(0, 200) || 'image', mime: f.type, taille: f.size, ...(await dimensions(f)) };
    const cible = cibleImage.current;
    if (cible && cible !== 'nouveau' && cible.source) {
      const ancien = magasin.lire().contenus[cible.source];
      if (ancien?.type === 'image') executer({ type: 'lot', commandes: [{ type: 'ajouterMedia', media }, { type: 'remplacerContenu', contenu: { ...ancien, media: id } }] });
      return;
    }
    const contenu = { id: nouvelId('c'), type: 'image' as const, media: id, alt: '' };
    const { commande, bloc } = preparerAjout(magasin.lire(), page.id, 'image', { image: { contenu, commandes: [{ type: 'ajouterMedia', media }, { type: 'ajouterContenu', contenu }] } });
    if (executer(commande)) { choisir(bloc); dire('Image ajoutée. Décrivez-la dans le panneau (texte alternatif).'); }
  };

  const ouvrirDirect = (id: string) => {
    const b = page.blocs.find(x => x.id === id);
    if (!b) return;
    setSelection(id);
    if (DIRECTS.has(b.type)) setDirect(id);
    else setTimeout(() => (document.querySelector('.c-panneau input, .c-panneau textarea, .c-panneau select, .c-panneau button') as HTMLElement | null)?.focus(), 30);
  };

  const fermerMenu = (e: React.MouseEvent) => e.currentTarget.closest('details')?.removeAttribute('open');
  const ouvrirProjets = async () => setProjets(await depot.lister());
  const importerFichier = async (f: File) => {
    const r = importer(await f.text());
    if (!r.ok) { dire(`Import impossible : ${r.raison}`); return; }
    const existe = (await depot.lister()).some(x => x.id === r.projet.id);
    const p = existe ? { ...r.projet, id: nouvelId('p') } : r.projet;
    await depot.enregistrer(p);
    for (const [id, b] of r.medias) await depot.mettreMedia(p.id, id, b);
    location.hash = `#/p/${p.id}`;
    if (r.ignores.length) setTimeout(() => dire(`Blocs d’AIMESTUDIO non repris : ${r.ignores.join(', ')}.`), 300);
  };

  const ev = evenementPrincipal(projet);
  const etat = etapes(projet, enregistre);
  const x = { projet, urlMedia: (id: string) => urls.get(id), edition: true };
  const blocChoisi = selection ? page.blocs.find(b => b.id === selection) ?? null : null;
  const mode = modeDe(projet.style);

  return (
    <div className={`u-page${blocChoisi || fiche ? ' a-panneau-ouvert' : ''}`}>
      <header className="u-barre">
        <a className="u-marque" href="#/" onClick={e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }}><Orbe taille={22} /> AIME</a>
        <span className="a-statut" role="status">{statut}</span>
        <span className="a-sep" />
        <button type="button" className="a-btn" disabled={!magasin.peutAnnuler()} onClick={() => magasin.annuler()} title="Ctrl Z">Annuler</button>
        <button type="button" className="a-btn" disabled={!magasin.peutRetablir()} onClick={() => magasin.retablir()} title="Ctrl Maj Z">Rétablir</button>
        <button type="button" className="a-btn a-fort" onClick={() => setApercu('telephone')}>Aperçu</button>
        <details className="a-plus"><summary className="a-btn" aria-label="Plus d’actions">Menu</summary>
          <div className="a-menu">
            <button type="button" onClick={e => { fermerMenu(e); void ouvrirProjets(); }}>Mes projets</button>
            <button type="button" onClick={async e => { fermerMenu(e); const p = projetVide('Nouveau projet'); await depot.enregistrer(p); location.hash = `#/p/${p.id}`; }}>Nouvelle page vide</button>
            <button type="button" onClick={e => { fermerMenu(e); setFiche(true); setSelection(null); setDirect(null); }}>Toutes les informations</button>
            <button type="button" onClick={e => { fermerMenu(e); executer({ type: 'changerMode', mode: mode === 'sombre' ? 'clair' : 'sombre' }); }}>{mode === 'sombre' ? 'Passer en clair' : 'Passer en sombre'}</button>
            <button type="button" onClick={e => { fermerMenu(e); setGrille(g => !g); }}>{grille ? 'Masquer la grille' : 'Afficher la grille'}</button>
            <button type="button" onClick={async e => { fermerMenu(e); try { telecharger(`${nomDeFichier(projet.titre)}.aime`, new Blob([await exporter(magasin.lire(), depot.lireMedia)], { type: 'application/json' })); dire('Projet exporté.'); } catch (err) { dire(err instanceof Error ? err.message : 'Export impossible'); } }}>Exporter le projet (.aime)</button>
            <button type="button" onClick={async e => { fermerMenu(e); telecharger(`${nomDeFichier(projet.titre)}.html`, new Blob([await exporterHtml(magasin.lire(), page.id, depot.lireMedia)], { type: 'text/html' })); dire('Page exportée en HTML.'); }}>Exporter la page (.html)</button>
            <button type="button" onClick={e => { fermerMenu(e); fichierProjet.current?.click(); }}>Importer un fichier</button>
          </div>
        </details>
      </header>

      <section className="u-intention" aria-labelledby="u-titre">
        <Orbe taille={120} />
        <h1 id="u-titre">Que préparez-vous ?</h1>
        {!enregistre && <p className="u-exemple">Ceci est un exemple. Écrivez le vôtre : la page devient la vôtre.</p>}
        <div className="u-champs">
          <label><span>Le nom</span><input value={ev?.titre ?? ''} placeholder="Le mariage de Léa et Marc, les 30 ans de Lou…" maxLength={200}
            onChange={e => executer(commandeIntention(magasin.lire(), page.id, { titre: e.target.value }), 'intention')} /></label>
          <label><span>La date</span><input type="date" value={ev?.debut.slice(0, 10) ?? ''}
            onChange={e => e.target.value && executer(commandeIntention(magasin.lire(), page.id, { debut: e.target.value }), 'intention-date')} /></label>
        </div>
        <ol className="u-etapes" aria-label="Du point au projet">
          {etat.map((s, i) => <li key={s.id} className={s.fait ? 'u-fait' : undefined}><b>{String(i + 1).padStart(2, '0')}</b> {s.nom}<span className="vh">{s.fait ? ' : fait' : ` : à faire. ${s.aide}`}</span></li>)}
        </ol>
        {etat.find(s => !s.fait) && <p className="u-suite">{etat.find(s => !s.fait)!.aide}</p>}
      </section>

      <main className="a-scene u-scene" aria-label="Votre page">
        <Scene page={page} magasin={magasin} x={x} apparence={projet.style} selection={selection} choisir={choisir} grilleVisible={grille} dire={dire}
          direct={direct} ouvrirDirect={ouvrirDirect} fermerDirect={() => setDirect(null)} />
        {!page.blocs.length && <p className="a-vide">Écrivez un nom en haut, ou touchez le « + ».</p>}
        <p className="u-astuce">Double-cliquez sur un bloc (ou Entrée) pour écrire dedans ; tirez sa poignée pour l’agrandir, sa forme suit.</p>
      </main>

      {!enregistre && <Decouvrir apparence={projet.style} />}

      {blocChoisi && <Panneau projet={projet} pageId={page.id} bloc={blocChoisi} magasin={magasin} choisir={choisir} dire={dire} changerImage={b => { cibleImage.current = b; fichier.current?.click(); }} />}
      {fiche && !blocChoisi && <Fiche projet={projet} magasin={magasin} fermer={() => setFiche(false)} dire={dire} />}

      <div className="a-ajout">
        {menuAjout && (
          <div className="a-menu-ajout" role="menu" aria-label="Ajouter un bloc">
            {liste().map(d => <button key={d.type} type="button" role="menuitem" onClick={() => ajouter(d.type)}><b>{d.nom}</b><span>{DESCRIPTIONS[d.type]}</span></button>)}
          </div>
        )}
        <button type="button" className="a-plus-btn" aria-expanded={menuAjout} aria-label={menuAjout ? 'Fermer' : 'Ajouter un bloc'} onClick={() => setMenuAjout(m => !m)}><span aria-hidden="true">{menuAjout ? '×' : '+'}</span></button>
      </div>

      <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void recevoirImage(f); }} />
      <input ref={fichierProjet} type="file" accept=".aime,.json,application/json" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importerFichier(f); }} />
      <p className="vh" aria-live="polite">{annonce}</p>
      {annonce && <p className="a-toast" aria-hidden="true" key={annonce}>{annonce}</p>}

      {projets && (
        <div className="a-apercu" role="dialog" aria-modal="true" aria-label="Mes projets">
          <div className="u-projets">
            <header className="c-tete"><h2>Mes projets</h2><button type="button" className="c-mini" aria-label="Fermer" onClick={() => setProjets(null)} autoFocus>×</button></header>
            <p className="c-info">Enregistrés dans ce navigateur. Exportez-les (.aime) pour les garder ailleurs.</p>
            {projets.length === 0 ? <p className="c-info">Aucun projet enregistré pour l’instant.</p> : (
              <ul className="m-liste">{projets.map(p => <li key={p.id}><a href={`#/p/${p.id}`} onClick={() => setProjets(null)} aria-current={p.id === projet.id ? 'page' : undefined}><b>{p.titre}</b><span>Modifié le {new Date(p.modifieLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span></a></li>)}</ul>
            )}
          </div>
        </div>
      )}

      {apercu && (
        <div className="a-apercu" role="dialog" aria-modal="true" aria-label="Aperçu">
          <div className="a-apercu-barre">
            {(['ordinateur', 'tablette', 'telephone'] as const).map(a => <button key={a} type="button" className="a-btn" aria-pressed={apercu === a} onClick={() => setApercu(a)}>{a === 'telephone' ? 'Téléphone' : a === 'tablette' ? 'Tablette' : 'Ordinateur'}</button>)}
            <button type="button" className="a-btn a-fort" onClick={() => setApercu(null)} autoFocus>Revenir à la page</button>
          </div>
          <div className={`a-ecran a-${apercu}`}>
            <Page page={page} x={{ ...x, edition: false }} mise={apercu === 'telephone' ? 'colonne' : 'grille'} apparence={projet.style} />
          </div>
        </div>
      )}
    </div>
  );
}
