// Parcours réel de la page unique d'AIME NEXT dans Chromium : exemple, intention, écriture directe, glisser,
// forme qui suit la taille, onde, annuler, enregistrement au premier geste, rechargement, aperçu, téléphone.
const { chromium } = require('playwright'); const fs = require('fs');
const O = (process.env.SORTIE || require('os').tmpdir()) + '/'; const B = process.env.BASE || 'http://localhost:4173/';
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const p = await c.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  await p.goto(B, { waitUntil: 'networkidle' }); await p.waitForSelector('.e-bloc'); await p.waitForTimeout(400);
  ok(/Que préparez-vous/.test(await p.textContent('h1')) && !!(await p.$('.u-exemple')), 'une seule page : l\'intention et l\'exemple');
  ok((await p.$$('.e-bloc')).length === 9 && !!(await p.$('.u-decouvrir')), 'l\'exemple se compose dessous, « Comment ça marche » en bas');
  ok(p.url() === B || p.url() === B + '#/', 'l\'exemple n\'est pas enregistré : pas d\'adresse de projet');
  await p.screenshot({ path: O + '1-page.png' });
  // l'intention : écrire le nom change le titre de la page
  await p.fill('.u-champs input >> nth=0', 'Inès & Sam'); await p.waitForTimeout(700);
  ok(/Inès & Sam/.test(await p.textContent('.e-bloc .r-t')), 'intention : le nom apparaît dans le titre de la page');
  ok(/#\/p\/p-/.test(p.url()) && !(await p.$('.u-exemple')) && !(await p.$('.u-decouvrir')), 'premier geste : l\'exemple devient votre projet (adresse, plus d\'exemple)');
  ok((await p.$$('.u-etapes li.u-fait')).length >= 5, 'les étapes du point au projet suivent le projet réel');
  // écriture directe dans le texte
  await p.dblclick('[data-bloc="b-mot"]'); await p.waitForSelector('[data-bloc="b-mot"] textarea');
  await p.fill('[data-bloc="b-mot"] textarea', 'Venez comme vous êtes.'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(/Venez comme vous êtes/.test(await p.textContent('[data-bloc="b-mot"]')), 'écriture directe : le texte s\'écrit sur la page');
  // écriture directe dans une date : toutes les formes suivent
  await p.click('.a-scene', { position: { x: 4, y: 4 } });
  await p.focus('[data-bloc="b-pastille"]'); await p.keyboard.press('Enter'); await p.waitForSelector('[data-bloc="b-pastille"] input[type=date]');
  await p.fill('[data-bloc="b-pastille"] input[type=date]', '2027-09-18'); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok(/18 septembre 2027/.test(await p.textContent('.r-frise .r-meta')) && /18/.test(await p.textContent('.r-pastille')), 'l\'onde : la date changée dans un bloc change la frise et la pastille');
  // glisser et forme qui suit la taille (poignée)
  await p.$eval('[data-bloc="b-mot"]', e => e.scrollIntoView({ block: 'start' })); await p.evaluate(() => scrollBy(0, -80)); await p.waitForTimeout(150);
  const mot = await p.$('[data-bloc="b-mot"]'); const bb = await mot.boundingBox(); const cell = await p.$eval('.e-grille', e => e.getBoundingClientRect().width / 12);
  await p.mouse.move(bb.x + 40, bb.y + 20); await p.mouse.down(); await p.mouse.move(bb.x + 40, bb.y + 20 + cell * 12, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(250);
  const rang = Number(await p.$eval('[data-bloc="b-mot"]', e => getComputedStyle(e).gridRowStart));
  ok(rang >= 20, 'glisser (la page défile avec le bloc) : le texte passe sous la frise, rangée ' + rang);
  await p.click('[data-bloc="b-pastille"]'); await p.waitForSelector('[data-bloc="b-pastille"] .e-poignee');
  const pg = await (await p.$('[data-bloc="b-pastille"] .e-poignee')).boundingBox();
  await p.mouse.move(pg.x + pg.width / 2, pg.y + pg.height / 2); await p.mouse.down(); await p.mouse.move(pg.x + pg.width / 2 - cell * 2, pg.y + pg.height / 2 - cell, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(200);
  ok(/forme pastille/.test(await p.getAttribute('[data-bloc="b-pastille"]', 'aria-label')), 'poignée : la pastille reste pastille quand on la réduit');
  // annuler / rétablir
  await p.click('.a-scene', { position: { x: 4, y: 4 } }); await p.keyboard.press('Control+z'); await p.waitForTimeout(150);
  ok(await p.$eval('[data-bloc="b-pastille"]', e => getComputedStyle(e).gridColumnEnd) === 'span 3', 'Ctrl Z : la taille revient');
  // « + »
  await p.click('.a-plus-btn'); await p.click('.a-menu-ajout button:has-text("Lieu")'); await p.waitForTimeout(300);
  ok((await p.$$('.e-bloc')).length === 10 && !!(await p.$('.c-panneau h2:has-text("Lieu")')), '« + » Lieu : ajouté, panneau ouvert');
  // mode clair par le menu
  await p.click('summary:has-text("Menu")'); await p.click('text=Passer en clair'); await p.waitForTimeout(200);
  ok((await p.$eval('.e-page', e => getComputedStyle(e).backgroundColor)) === 'rgb(250, 250, 247)', 'menu : mode clair');
  await p.screenshot({ path: O + '2-projet.png' });
  // enregistrement et rechargement
  await p.waitForFunction(() => /Enregistré à/.test(document.querySelector('.a-statut').textContent), null, { timeout: 5000 }).catch(() => {});
  const url = p.url(); await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.e-bloc'); await p.waitForTimeout(400);
  ok(p.url() === url && (await p.$$('.e-bloc')).length === 10 && /Venez comme vous êtes/.test(await p.textContent('[data-bloc="b-mot"]')) && (await p.inputValue('.u-champs input >> nth=0')) === 'Inès & Sam', 'rechargement : tout est retrouvé');
  // sans adresse, on revient sur le dernier projet
  await p.goto(B, { waitUntil: 'networkidle' }); await p.waitForSelector('.e-bloc'); await p.waitForTimeout(300);
  ok(p.url() === url, 'revenir sur le site rouvre le dernier projet');
  // Mes projets
  await p.click('summary:has-text("Menu")'); await p.click('text=Mes projets'); await p.waitForSelector('.u-projets');
  ok(/Inès & Sam/.test(await p.textContent('.u-projets')), 'Mes projets : le projet est listé'); await p.click('.u-projets .c-mini');
  // aperçu téléphone
  await p.click('text=Aperçu'); await p.waitForSelector('.a-telephone .r-colonne'); await p.screenshot({ path: O + '3-apercu.png' });
  ok(true, 'aperçu téléphone : lecture en colonne'); await p.click('text=Revenir à la page');
  // export .aime
  await p.click('summary:has-text("Menu")');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=Exporter le projet (.aime)')]);
  await dl.saveAs(O + 'export.aime'); const j = JSON.parse(fs.readFileSync(O + 'export.aime', 'utf8'));
  ok(j.format === 'aime-archive' && j.projet.titre === 'Inès & Sam', 'export .aime');
  ok(!err.length, 'aucune erreur JavaScript ' + err.slice(0, 3).join(' | '));
  // téléphone : défiler sans déplacer, toucher pour choisir
  const t = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await t.newPage();
  await q.goto(B, { waitUntil: 'networkidle' }); await q.waitForSelector('.e-bloc'); await q.waitForTimeout(400);
  ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'téléphone : pas de défilement horizontal de la page');
  await q.screenshot({ path: O + '4-tel.png', fullPage: true });
  await q.tap('[data-bloc="b-lieu"]'); await q.waitForTimeout(300);
  ok(!!(await q.$('.c-panneau')) && !(await q.$('.a-ajout:visible')), 'téléphone : un toucher choisit le bloc, le panneau s\'ouvre en feuille');
  await b.close();
  console.log(process.exitCode ? 'parcours : échec' : 'parcours : tout est vert');
})();
