// Parcours réel du Constructeur AIME NEXT dans Chromium : démonstration, glisser, taille, onde, annuler, rechargement, aperçu, export.
const { chromium } = require('playwright'); const fs = require('fs');
const O = (process.env.SORTIE || require('os').tmpdir()) + '/'; const B = process.env.BASE || 'http://localhost:4173/';
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const p = await c.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  await p.goto(B, { waitUntil: 'networkidle' });
  ok(/AIME/.test(await p.textContent('h1')) && (await p.$$('.z-etape')).length === 6, 'Page Zéro : l\'orbe et les six étapes');
  await p.click('text=Découvrir Le Monde AIME'); await p.waitForSelector('.w-curseur input');
  await p.fill('.w-curseur input', '9'); await p.waitForTimeout(400);
  ok(!!(await p.$('.w-piste .r-frise')), 'Le Monde AIME : à 9 colonnes, la date devient une frise');
  await p.fill('.w-champ input >> nth=0', 'Inès & Sam'); await p.waitForTimeout(200);
  ok(/Inès & Sam/.test(await p.textContent('.w-trois .r-t')), 'Le Monde AIME : le nom écrit une fois apparaît dans le titre');
  await p.click('.w-faces button >> nth=2'); ok(/traiteur/i.test(await p.textContent('.w-voit')), 'Le Monde AIME : la perspective du traiteur');
  await p.screenshot({ path: O + '0-monde.png' });
  await p.click('text=Créer mon projet avec cet exemple'); await p.waitForSelector('.e-bloc'); await p.waitForTimeout(400);
  ok(/Inès & Sam/.test(await p.inputValue('.a-titre')) && /Inès & Sam/.test(await p.textContent('.e-bloc .r-t')), 'la découverte devient le projet : « Inès & Sam » dans le Constructeur');
  await p.goto(B + '#/projets', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  ok(/Mes projets/.test(await p.textContent('h1')), 'Mes projets');
  await p.click('text=Essayer la démonstration'); await p.waitForSelector('.e-bloc'); await p.waitForTimeout(600);
  ok((await p.$$('.e-bloc')).length === 9, 'démonstration : 9 blocs');
  await p.screenshot({ path: O + '1-constructeur.png' });
  // formes : la date en pastille, compte à rebours, frise
  ok(!!(await p.$('.r-pastille')) && !!(await p.$('.r-compte')) && !!(await p.$('.r-frise')), 'la même date sous trois formes');
  // glisser le texte d'une rangée vers le bas
  const mot = await p.$('[data-bloc="b-mot"]'); const bb = await mot.boundingBox(); const cell = (await p.$eval('.e-grille', e => e.getBoundingClientRect().width / 12));
  await p.mouse.move(bb.x + 40, bb.y + 20); await p.mouse.down(); await p.mouse.move(bb.x + 40, bb.y + 20 + cell * 12, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
  const y = await p.$eval('[data-bloc="b-mot"]', e => getComputedStyle(e).gridRowStart);
  ok(y === '20', 'glisser : le texte saute sous la frise, rangée 20 (était 8) — obtenu ' + y);
  await p.mouse.move(bb.x + 40, bb.y + 20 + cell * 12); await p.mouse.down(); await p.mouse.move(bb.x + 40, bb.y + 20 + cell * 8, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(200);
  ok(await p.$eval('[data-bloc="b-mot"]', e => getComputedStyle(e).gridRowStart) === '20', 'glisser sur la frise : refusé, le bloc reste à sa place');
  // redimensionner la pastille au clavier : elle devient compte à rebours puis calendrier
  await p.focus('[data-bloc="b-pastille"]');
  for (let i = 0; i < 1; i++) await p.keyboard.press('Shift+ArrowRight');
  ok(/forme compte|forme pastille/.test(await p.getAttribute('[data-bloc="b-pastille"]', 'aria-label')), 'Maj + flèche : la largeur change');
  await p.screenshot({ path: O + '2-selection.png' });
  // l'onde : changer la date dans « Vos informations »
  await p.keyboard.press('Escape'); await p.click('text=Vos informations'); await p.waitForSelector('.c-panneau input[type=date]');
  const avant = await p.textContent('.r-pastille');
  await p.fill('.c-panneau input[type=date]', '2027-09-18'); await p.waitForTimeout(300);
  const apres = await p.textContent('.r-pastille'); const frise = await p.textContent('.r-frise .r-meta'); const titre = await p.textContent('.r-titre .r-meta');
  ok(avant !== apres && /18/.test(apres) && /18 septembre 2027/.test(frise) && /18 septembre 2027/.test(titre), `l'onde : pastille, frise et titre suivent (${apres.trim()} · ${frise})`);
  ok(/Montré par 5 blocs/.test(await p.textContent('.c-panneau')), 'Vos informations : « montré par 5 blocs »');
  await p.screenshot({ path: O + '3-informations.png' });
  // annuler la date au clavier hors champ
  await p.click('.a-scene', { position: { x: 5, y: 5 } }); await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  ok(/14 juin 2027/.test(await p.textContent('.r-frise .r-meta')), 'Ctrl Z : la date revient au 14 juin');
  await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(200);
  ok(/18 septembre 2027/.test(await p.textContent('.r-frise .r-meta')), 'Ctrl Maj Z : rétablie');
  // ajouter un bloc Lieu par le +
  await p.click('.a-plus-btn'); await p.click('.a-menu-ajout button:has-text("Lieu")'); await p.waitForTimeout(300);
  ok((await p.$$('.e-bloc')).length === 10 && !!(await p.$('.c-panneau h2:has-text("Lieu")')), '« + » Lieu : ajouté, sélectionné, panneau ouvert');
  ok((await p.$$('.c-panneau .c-partage')).length === 1 && /Montré par 2 blocs/.test(await p.textContent('.c-panneau .c-partage')), 'le nouveau Lieu montre le château déjà saisi (2 blocs)');
  // Design System
  ok((await p.$eval('.e-page', e => getComputedStyle(e).backgroundColor)) === 'rgb(10, 10, 12)', 'style AIME, mode sombre par défaut');
  await p.click('.a-mode button:has-text("Clair")'); await p.waitForTimeout(200);
  ok((await p.$eval('.e-page', e => getComputedStyle(e).backgroundColor)) === 'rgb(250, 250, 247)', 'style AIME, mode clair');
  await p.screenshot({ path: O + '4-clair.png' });
  // enregistrement puis rechargement
  await p.waitForFunction(() => /Enregistré à/.test(document.querySelector('.a-statut').textContent), null, { timeout: 5000 }).catch(() => {});
  ok(/Enregistré à/.test(await p.textContent('.a-statut')), 'statut : ' + await p.textContent('.a-statut'));
  const url = p.url(); await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.e-bloc'); await p.waitForTimeout(400);
  ok(p.url() === url && (await p.$$('.e-bloc')).length === 10 && /18 septembre 2027/.test(await p.textContent('.r-frise .r-meta')) && (await p.$eval('.e-page', e => getComputedStyle(e).backgroundColor)) === 'rgb(250, 250, 247)', 'rechargement : 10 blocs, date et mode retrouvés');
  // aperçu téléphone
  await p.click('text=Aperçu'); await p.waitForSelector('.a-telephone'); await p.waitForTimeout(300);
  ok(!!(await p.$('.a-telephone .r-colonne')), 'aperçu téléphone : lecture en colonne');
  await p.screenshot({ path: O + '5-apercu-tel.png' });
  await p.click('text=Revenir à l\'édition');
  // export .aime
  await p.click('summary:has-text("Exporter")');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=Le projet (.aime)')]);
  const chemin = O + 'export.aime'; await dl.saveAs(chemin); const j = JSON.parse(fs.readFileSync(chemin, 'utf8'));
  ok(j.format === 'aime-archive' && j.projet.supports[0].pages[0].blocs.length === 10, 'export .aime : archive complète');
  const [dl2] = await Promise.all([p.waitForEvent('download'), (async () => { await p.click('summary:has-text("Exporter")'); await p.click('text=La page (.html)'); })()]);
  await dl2.saveAs(O + 'export.html'); ok(/<title>Léa &amp; Marc/.test(fs.readFileSync(O + 'export.html', 'utf8')), 'export HTML');
  ok(!err.length, 'aucune erreur JavaScript ' + err.slice(0, 3).join(' | '));
  // téléphone : le constructeur lui-même
  const t = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await t.newPage();
  await q.goto(B, { waitUntil: 'networkidle' });
  ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'téléphone : Page Zéro sans défilement horizontal');
  await q.goto(B + '#/monde', { waitUntil: 'networkidle' }); await q.waitForTimeout(300);
  ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'téléphone : Le Monde AIME sans défilement horizontal');
  await q.screenshot({ path: O + '8-tel-monde.png', fullPage: true });
  await q.goto(B + '#/projets', { waitUntil: 'networkidle' }); await q.click('text=Essayer la démonstration'); await q.waitForSelector('.e-bloc'); await q.waitForTimeout(500);
  ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'téléphone : pas de défilement horizontal');
  await q.screenshot({ path: O + '6-tel-constructeur.png' });
  await q.tap('[data-bloc="b-lieu"]'); await q.waitForTimeout(300); await q.screenshot({ path: O + '7-tel-panneau.png' });
  ok(!!(await q.$('.c-panneau')), 'téléphone : le panneau s\'ouvre en feuille');
  await b.close();
  if (process.exitCode) console.log('parcours : échec'); else console.log('parcours : tout est vert');
})();
