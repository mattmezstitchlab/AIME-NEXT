/**
 * Le Constructeur : une page au centre, le « + » pour ajouter, un panneau qui n'apparaît que sur sélection.
 * Enregistrement automatique sur cet appareil ; le statut affiché ne dit « enregistré » qu'après l'écriture réussie.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { creerMagasin, exiger, liste, nouvelId, type Bloc, type Commande, type Projet } from '../core';
import type { Depot } from '../stockage/depot';
import { exporter } from '../stockage/archive';
import { SYSTEMES } from '../design/systemes';
import { Page } from '../rendu/Page';
import { Scene } from './Scene';
import { Panneau } from './Panneau';
import { Fiche } from './Fiche';
import { preparerAjout } from './creation';
import { exporterHtml } from './exportHtml';
import { dansUnChamp, dimensions, heure, imageAcceptable, nomDeFichier, telecharger, useProjet } from '../app/outils';

const DESCRIPTIONS: Record<string, string> = {
  titre: 'Le nom de votre événement ou de votre page', texte: 'Un paragraphe', image: 'Une photo de cet appareil', bouton: 'Une action : répondre, réserver',
  date: 'Pastille, compte à rebours, calendrier ou frise selon sa largeur', lieu: 'Nom, carte ou itinéraire selon sa largeur',
  personnes: 'Avatars, équipe ou réseau selon sa largeur', programme: 'Les étapes de la journée',
};

export function Constructeur({ initial, medias, depot, retour }: { initial: Projet; medias: Map<string, Blob>; depot: Depot; retour: () => void }) {
  const magasin = useMemo(() => creerMagasin(initial), [initial]);
  const projet = useProjet(magasin);
  const page = projet.supports[0]!.pages[0]!;
  const [selection, choisir] = useState<string | null>(null);
  const [fiche, setFiche] = useState(false);
  const [menu, setMenu] = useState(false);
  const [apercu, setApercu] = useState<null | 'ordinateur' | 'tablette' | 'telephone'>(null);
  const [grille, setGrille] = useState(true);
  const [statut, setStatut] = useState('Enregistré sur cet appareil');
  const [annonce, setAnnonce] = useState('');
  const [urls, setUrls] = useState(() => new Map([...medias].map(([id, b]) => [id, URL.createObjectURL(b)])));
  const fichier = useRef<HTMLInputElement>(null);
  const cibleImage = useRef<Bloc | 'nouveau' | null>(null);

  const dire = useCallback((m: string) => { setAnnonce(''); requestAnimationFrame(() => setAnnonce(m)); }, []);
  useEffect(() => () => { for (const u of urls.values()) URL.revokeObjectURL(u); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* enregistrement automatique, 500 ms après le dernier geste */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = magasin.abonner(() => {
      setStatut('Modifications en cours…');
      clearTimeout(t);
      t = setTimeout(() => {
        depot.enregistrer(magasin.lire()).then(() => setStatut(`Enregistré à ${heure(new Date())}`), () => setStatut('Échec de l\'enregistrement : exportez le projet'));
      }, 500);
    });
    return () => { off(); clearTimeout(t); depot.enregistrer(magasin.lire()).catch(() => {}); };
  }, [magasin, depot]);

  /* annuler et rétablir au clavier ; dans un champ, le navigateur garde sa propre annulation */
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

  const executer = (c: Commande) => { const r = magasin.executer(c); if (!r.ok) dire(r.raison); return r.ok; };

  const ajouter = (type: string) => {
    setMenu(false);
    if (type === 'image') { cibleImage.current = 'nouveau'; fichier.current?.click(); return; }
    const { commande, bloc } = preparerAjout(magasin.lire(), page.id, type);
    if (executer(commande)) { choisir(bloc); setFiche(false); dire(`${exiger(type).nom} ajouté.`); setTimeout(() => (document.querySelector(`[data-bloc="${bloc}"]`) as HTMLElement | null)?.focus(), 30); }
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

  const x = { projet, urlMedia: (id: string) => urls.get(id), edition: true };
  const blocChoisi = selection ? page.blocs.find(b => b.id === selection) ?? null : null;

  return (
    <div className={`a-atelier${blocChoisi || fiche ? ' a-panneau-ouvert' : ''}`}>
      <header className="a-barre">
        <button type="button" className="a-btn" onClick={retour}>← Mes projets</button>
        <input className="a-titre" aria-label="Titre du projet" value={projet.titre} maxLength={200} onChange={e => e.target.value.trim() && magasin.executer({ type: 'renommerProjet', titre: e.target.value }, { cle: 'titre' })} />
        <span className="a-statut" role="status">{statut}</span>
        <span className="a-sep" />
        <button type="button" className="a-btn" disabled={!magasin.peutAnnuler()} onClick={() => magasin.annuler()} title="Ctrl Z">Annuler</button>
        <button type="button" className="a-btn" disabled={!magasin.peutRetablir()} onClick={() => magasin.retablir()} title="Ctrl Maj Z">Rétablir</button>
        <label className="a-ds"><span>Style</span>
          <select value={projet.style.designSystem} onChange={e => executer({ type: 'changerDesignSystem', designSystem: e.target.value })}>
            {SYSTEMES.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </label>
        <button type="button" className="a-btn" aria-pressed={grille} onClick={() => setGrille(g => !g)}>Grille</button>
        <button type="button" className="a-btn" aria-pressed={fiche} onClick={() => { setFiche(f => !f); choisir(null); }}>Vos informations</button>
        <button type="button" className="a-btn a-fort" onClick={() => setApercu('telephone')}>Aperçu</button>
        <details className="a-plus"><summary className="a-btn">Exporter</summary>
          <div className="a-menu">
            <button type="button" onClick={async e => { e.currentTarget.closest('details')?.removeAttribute('open'); try { telecharger(`${nomDeFichier(projet.titre)}.aime`, new Blob([await exporter(magasin.lire(), depot.lireMedia)], { type: 'application/json' })); dire('Projet exporté.'); } catch (e) { dire(e instanceof Error ? e.message : 'Export impossible'); } }}>Le projet (.aime), pour le rouvrir</button>
            <button type="button" onClick={async e => { e.currentTarget.closest('details')?.removeAttribute('open'); telecharger(`${nomDeFichier(projet.titre)}.html`, new Blob([await exporterHtml(magasin.lire(), page.id, depot.lireMedia)], { type: 'text/html' })); dire('Page exportée en HTML.'); }}>La page (.html), pour la publier</button>
          </div>
        </details>
      </header>

      <main className="a-scene" aria-label="Composition">
        <Scene page={page} magasin={magasin} x={x} designSystem={projet.style.designSystem} selection={selection} choisir={id => { choisir(id); if (id) setFiche(false); }} grilleVisible={grille} dire={dire} />
        {!page.blocs.length && <p className="a-vide">Touchez le « + » pour ajouter un premier bloc.</p>}
      </main>

      {blocChoisi && <Panneau projet={projet} pageId={page.id} bloc={blocChoisi} magasin={magasin} choisir={choisir} dire={dire} changerImage={b => { cibleImage.current = b; fichier.current?.click(); }} />}
      {fiche && !blocChoisi && <Fiche projet={projet} magasin={magasin} fermer={() => setFiche(false)} dire={dire} />}

      <div className="a-ajout">
        {menu && (
          <div className="a-menu-ajout" role="menu" aria-label="Ajouter un bloc">
            {liste().map(d => <button key={d.type} type="button" role="menuitem" onClick={() => ajouter(d.type)}><b>{d.nom}</b><span>{DESCRIPTIONS[d.type]}</span></button>)}
          </div>
        )}
        <button type="button" className="a-plus-btn" aria-expanded={menu} aria-label={menu ? 'Fermer' : 'Ajouter un bloc'} onClick={() => setMenu(m => !m)}><span aria-hidden="true">{menu ? '×' : '+'}</span></button>
      </div>

      <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void recevoirImage(f); }} />
      <p className="vh" aria-live="polite">{annonce}</p>
      {annonce && <p className="a-toast" aria-hidden="true" key={annonce}>{annonce}</p>}

      {apercu && (
        <div className="a-apercu" role="dialog" aria-modal="true" aria-label="Aperçu">
          <div className="a-apercu-barre">
            {(['ordinateur', 'tablette', 'telephone'] as const).map(a => <button key={a} type="button" className="a-btn" aria-pressed={apercu === a} onClick={() => setApercu(a)}>{a === 'telephone' ? 'Téléphone' : a === 'tablette' ? 'Tablette' : 'Ordinateur'}</button>)}
            <button type="button" className="a-btn a-fort" onClick={() => setApercu(null)} autoFocus>Revenir à l'édition</button>
          </div>
          <div className={`a-ecran a-${apercu}`}>
            <Page page={page} x={{ ...x, edition: false }} mise={apercu === 'telephone' ? 'colonne' : 'grille'} designSystem={projet.style.designSystem} />
          </div>
        </div>
      )}
    </div>
  );
}
