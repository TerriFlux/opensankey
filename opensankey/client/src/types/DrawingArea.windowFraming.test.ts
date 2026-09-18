import * as d3 from '../d3Modules'

import { Class_ApplicationData } from './ApplicationData'
import type { Class_DrawingArea } from './DrawingArea'

// ==================================================================================================
// OS#388 — Un changement de la LARGEUR RÉSERVÉE du fenêtrage (barre latérale ouverte/fermée/
// redimensionnée, colonne tableur/doc) ne doit PAS reconstruire la zone de dessin.
//
// L'ancien chemin était `areaAutoFit() + app_data.draw()` : `draw()` fait unDraw + _initDraw +
// drawElements, donc détruit et recrée tout le SVG (nœuds, flux, libellés), et il est enveloppé
// dans le toast d'attente (500 ms avant exécution + 1 000 ms d'affichage). Sur un diagramme de
// quelques centaines d'éléments, un simple Ctrl+B bloquait l'appli plusieurs secondes — alors
// qu'en caméra libre le seul travail nécessaire est la mise à jour du chrome de la zone (cadre
// de viewport, découpe, grille, barres de défilement), qui se cale sur `window_fitting_width`.
//
// ⚠️ Ce qu'il faut mesurer, c'est bien la RECONSTRUCTION (unDraw / drawElements), pas le fait
// qu'« il se passe quelque chose » : le chrome, lui, DOIT être rafraîchi — sans quoi le cadre et
// les barres de défilement resteraient calés sur l'ancienne largeur.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Diagramme minimal DÉJÀ DESSINÉ (il faut un #draw_zoom pour qu'il y ait un chrome à rafraîchir). */
function buildDrawnApp() {
  const app = new Class_ApplicationData(false)
  const drawing_area = app.drawing_area
  const { sankey } = drawing_area
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  source.setPosXY(0, 0)
  cible.setPosXY(300, 0)
  sankey.addNewLink(source, cible)
  drawing_area.draw()
  return { app, drawing_area }
}

describe('OS#388 — rafraîchissement du fenêtrage', () => {

  it('en caméra libre : rafraîchit le chrome sans reconstruire le SVG', () => {
    const { app, drawing_area } = buildDrawnApp()
    expect(drawing_area.auto_fit_mode).toBe('none')

    const un_draw = jest.spyOn(drawing_area, 'unDraw')
    const draw_elements = jest.spyOn(drawing_area, 'drawElements')
    const draw_grid = jest.spyOn(drawing_area, 'drawGrid')

    app.refreshWindowFraming()

    expect(un_draw).not.toHaveBeenCalled()
    expect(draw_elements).not.toHaveBeenCalled()
    expect(draw_grid).toHaveBeenCalled()
  })

  it('contre-épreuve : draw() reconstruit bien tout le SVG', () => {
    const { drawing_area } = buildDrawnApp()

    const un_draw = jest.spyOn(drawing_area, 'unDraw')
    const draw_elements = jest.spyOn(drawing_area, 'drawElements')

    drawing_area.draw()

    expect(un_draw).toHaveBeenCalled()
    expect(draw_elements).toHaveBeenCalled()
  })

  it('ne passe pas par le toast d\'attente (un geste de fenêtrage est instantané)', () => {
    const { app } = buildDrawnApp()
    const send_toast = jest.spyOn(app, 'sendWaitingToast')

    app.refreshWindowFraming()

    expect(send_toast).not.toHaveBeenCalled()
  })

  it('en mode de cadrage automatique : re-fit par areaAutoFit, toujours sans reconstruction', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.auto_fit_mode = 'width'

    const area_auto_fit = jest.spyOn(drawing_area, 'areaAutoFit')
    const un_draw = jest.spyOn(drawing_area, 'unDraw')
    const draw_elements = jest.spyOn(drawing_area, 'drawElements')

    app.refreshWindowFraming()

    expect(area_auto_fit).toHaveBeenCalled()
    expect(un_draw).not.toHaveBeenCalled()
    expect(draw_elements).not.toHaveBeenCalled()
  })

  // ⚠️ Les deux régimes ci-dessous sont ceux ou l'ancien couple `areaAutoFit() + draw()`
  // faisait, lui, un vrai recadrage : un raccourci « chrome seul » les aurait laisses
  // sans aucun ajustement (page a cheval sous la barre laterale, contenu verrouille
  // debordant de la zone retrecie).

  it('mode papier AVEC cadrage automatique : recale la page, sans reconstruction', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.paper_format = 'A4'
    drawing_area.auto_fit_mode = 'full'
    expect(drawing_area.is_paper_mode).toBe(true)

    const area_auto_fit = jest.spyOn(drawing_area, 'areaAutoFit')
    const draw_elements = jest.spyOn(drawing_area, 'drawElements')

    app.refreshWindowFraming()

    // Argument explicite obligatoire : un appel generique serait re-route vers
    // applyAutoFitMode -> recenter, qui sort sans rien faire en mode papier.
    expect(area_auto_fit).toHaveBeenCalled()
    expect(area_auto_fit.mock.calls[0].slice(0, 3)).toEqual([undefined, true, false])
    expect(draw_elements).not.toHaveBeenCalled()
  })

  it('mode papier SANS cadrage automatique : la camera n\'est pas reprise', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.paper_format = 'A4'
    expect(drawing_area.auto_fit_mode).toBe('none')

    const area_auto_fit = jest.spyOn(drawing_area, 'areaAutoFit')
    const draw_grid = jest.spyOn(drawing_area, 'drawGrid')

    app.refreshWindowFraming()

    // La camera appartient a l'utilisateur en mode 'none' : un geste de fenetrage
    // met a jour le chrome, il ne recentre pas la page.
    expect(area_auto_fit).not.toHaveBeenCalled()
    expect(draw_grid).toHaveBeenCalled()
  })

  it('taille verrouillée AVEC cadrage automatique : rejoue le cadrage figé, sans reconstruction', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.size_locked = true
    drawing_area.auto_fit_mode = 'full'

    const un_draw = jest.spyOn(drawing_area, 'unDraw')
    const draw_elements = jest.spyOn(drawing_area, 'drawElements')
    const draw_grid = jest.spyOn(drawing_area, 'drawGrid')

    expect(() => app.refreshWindowFraming()).not.toThrow()

    expect(un_draw).not.toHaveBeenCalled()
    expect(draw_elements).not.toHaveBeenCalled()
    expect(draw_grid).toHaveBeenCalled()
  })

  // ⚠️ `size_locked` est pose dans des fichiers d'etude EXISTANTS sans que leur auteur
  // l'ait jamais regle : le regime doit rester invisible tant qu'aucun cadrage n'est
  // demande. Son dezoom de secours (_lockedContentOverflows) vise un changement de
  // CONTENU — un dataTag plus grand que celui de reference — pas un geste de fenetrage.
  // Declenche a l'ouverture de la barre laterale, il retrecissait le diagramme (« ca
  // s'adapte ») ET supprimait la barre de defilement attendue, puisque plus rien ne
  // depassait. D'ou l'ordre des tests dans refreshWindowFraming : 'none' d'ABORD.
  it('taille verrouillée SANS cadrage automatique : aucun recadrage', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.size_locked = true
    expect(drawing_area.auto_fit_mode).toBe('none')

    const area_auto_fit = jest.spyOn(drawing_area, 'areaAutoFit')
    const set_camera = jest.spyOn(drawing_area, 'setCamera')
    const draw_grid = jest.spyOn(drawing_area, 'drawGrid')

    app.refreshWindowFraming()

    expect(area_auto_fit).not.toHaveBeenCalled()
    expect(set_camera).not.toHaveBeenCalled()
    expect(draw_grid).toHaveBeenCalled()
  })

  // ⚠️ Le recadrage automatique n'est PAS une fonction pure de la place disponible :
  // la reserve de debordement des libelles se calcule sur le zoom COURANT. Une
  // REDUCTION de la zone converge du premier coup, un AGRANDISSEMENT non — d'ou un
  // cliquet (l'echelle perdait ~5 % par cycle ouverture/fermeture de la barre sur un
  // diagramme reel en police verrouillee, et n'y revenait jamais). On itere donc
  // jusqu'au point fixe. Ne PAS juger ce comportement au nombre de passes attendu
  // « en vrai » : ce qui est verifie ici, c'est la boucle — elle s'arrete des que
  // l'echelle est stable, et elle est bornee quand elle ne l'est pas.

  it('cadrage automatique : une seule passe quand l\'echelle est deja stable', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.auto_fit_mode = 'full'

    const area_auto_fit = jest.spyOn(drawing_area, 'areaAutoFit').mockImplementation(() => { /* echelle inchangee */ })

    app.refreshWindowFraming()

    expect(area_auto_fit).toHaveBeenCalledTimes(1)
  })

  it('cadrage automatique : itere, et reste borne si l\'echelle ne se stabilise pas', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.auto_fit_mode = 'full'

    // Echelle qui bouge a chaque passe : la boucle doit s'arreter d'elle-meme.
    const moving = drawing_area as unknown as { _k_fit: number }
    moving._k_fit = 1
    const area_auto_fit = jest.spyOn(drawing_area, 'areaAutoFit')
      .mockImplementation(() => { moving._k_fit *= 0.5 })

    app.refreshWindowFraming()

    expect(area_auto_fit.mock.calls.length).toBeGreaterThan(1)
    expect(area_auto_fit.mock.calls.length).toBeLessThanOrEqual(4)
  })

  it('zone jamais dessinée : ne jette pas', () => {
    const app = new Class_ApplicationData(false)
    expect(() => app.refreshWindowFraming()).not.toThrow()
  })
})

// ==================================================================================================
// os#1429 — LA CASE CHANGE DE TAILLE, LE REGARD SUIT, L'ECHELLE NON.
//
// Constate par Julien : on ouvre une fenetre a cote, la grande zone se retrecit, et le Sankey
// reste ou il etait — une bonne moitie passe derriere la fenetre qui vient de naitre. Son
// diagnostic, « il manque un draw », designe le bon endroit mais pas la bonne cause : en mode
// 'none', DESSINER NE RECADRE PAS (cf. _drawBody, qui y reapplique la camera telle quelle). Un
// draw de plus n'aurait rien deplace.
//
// Ce que ces cas figent est la DISTINCTION qui rend le geste acceptable la ou un recadrage ne
// le serait pas : on TRANSLATE de la moitie de la variation, on ne remet pas a l'echelle. Le
// point qui etait au centre y reste, `k` ne bouge pas, et refermer rend la vue d'avant.
//
// Le `k` absent de la formule n'est pas un oubli : le point monde au centre vaut
// ((W/2 - x)/k, (H/2 - y)/k), et l'y maintenir apres passage a W' donne x' = x + (W' - W)/2.
// Une variation de case se rend en pixels d'ecran, a tout zoom.
// ==================================================================================================

describe('os#1429 — le diagramme se replace quand sa case change de taille', () => {

  // Les cas d'au-dessus se contentent d'une selection d3, meme VIDE : ils comptent des appels.
  // Ici on lit la camera, donc il faut le vrai noeud SVG, donc les deux protheses que jsdom
  // n'offre pas et sans lesquelles le dessin s'arrete avant de le poser (memes que
  // DrawingArea.domIds.test.ts).
  beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => ({ font: '', measureText: (t: string) => ({ width: 8 * t.length }) })
    })
    ;(SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox =
      () => ({ x: 0, y: 0, width: 50, height: 10 }) as DOMRect
  })

  // Et le conteneur d'accueil : sans lui la selection d3 est VIDE, son `node()` est null, et il
  // n'y a aucune camera a lire. Les cas d'au-dessus s'en passaient sans le savoir.
  beforeEach(() => { document.body.innerHTML = '<div id="sankey_app"></div>' })

  const camera = (da: Class_DrawingArea) => d3.zoomTransform(da.d3_selection_zoom_area!.node()!)

  /**
   * Un diagramme dessine, avec un PREMIER fenetrage deja passe. Il est indispensable : c'est lui
   * qui releve la taille de depart. Sans point de comparaison on ne bouge rien, et c'est voulu —
   * une zone toute neuve n'a pas « varie », elle vient de naitre.
   */
  const buildFramedApp = () => {
    const built = buildDrawnApp()
    // Une camera POSEE, et non celle du cadrage d'arrivee : jsdom ne met rien en page, le
    // cadrage initial y rend des NaN. Ce qu'on mesure est une DIFFERENCE, elle demande donc
    // seulement un point de depart connu — et le poser rend la mesure independante du cadrage.
    built.drawing_area.setCamera(d3.zoomIdentity.translate(100, 50).scale(2))
    built.app.refreshWindowFraming()
    return built
  }

  it('la case retrecit : la camera translate de la moitie, sans toucher a l echelle', () => {
    const { app, drawing_area } = buildFramedApp()
    expect(drawing_area.auto_fit_mode).toBe('none')
    const avant = camera(drawing_area)

    app.menu_configuration.panels.setMode('config', 'sidebar')
    const reserve = app.menu_configuration.panels.getSidebarReservedPx()
    expect(reserve).toBeGreaterThan(0)

    app.refreshWindowFraming()

    const apres = camera(drawing_area)
    expect(apres.k).toBe(avant.k)
    expect(apres.x).toBeCloseTo(avant.x - reserve / 2, 3)
    // Rien n'a bouge en hauteur : on ne translate que de ce qui a varie.
    expect(apres.y).toBeCloseTo(avant.y, 3)
  })

  it('refermer rend exactement la vue d avant : la translation est sa propre reciproque', () => {
    const { app, drawing_area } = buildFramedApp()
    const depart = camera(drawing_area)

    app.menu_configuration.panels.setMode('config', 'sidebar')
    app.refreshWindowFraming()
    expect(camera(drawing_area).x).not.toBeCloseTo(depart.x, 3)

    // Le panneau quitte la barre laterale pour la pop-up : il ne reserve plus rien, la case
    // reprend sa largeur. C'est le retour en arriere du geste, vu par la zone de dessin.
    app.menu_configuration.panels.setMode('config', 'popup')
    expect(app.menu_configuration.panels.getSidebarReservedPx()).toBe(0)
    app.refreshWindowFraming()

    const retour = camera(drawing_area)
    expect(retour.k).toBe(depart.k)
    expect(retour.x).toBeCloseTo(depart.x, 3)
    expect(retour.y).toBeCloseTo(depart.y, 3)
  })

  it('une case inchangee ne deplace rien, meme fenetree plusieurs fois', () => {
    // Un re-rendu de React suffit a repasser par la : bouger pour rien ferait vibrer le dessin.
    const { app, drawing_area } = buildFramedApp()
    const avant = camera(drawing_area)
    const set_camera = jest.spyOn(drawing_area, 'setCamera')

    app.refreshWindowFraming()
    app.refreshWindowFraming()

    expect(set_camera).not.toHaveBeenCalled()
    expect(camera(drawing_area).x).toBeCloseTo(avant.x, 3)
  })

  it('le tout premier fenetrage ne bouge rien : il n y a pas de case d avant', () => {
    const { app, drawing_area } = buildDrawnApp()
    const set_camera = jest.spyOn(drawing_area, 'setCamera')

    app.refreshWindowFraming()

    expect(set_camera).not.toHaveBeenCalled()
  })
})

describe('OS#388 — en caméra libre, un panneau se SUPERPOSE au diagramme', () => {

  // Le chrome (cadre de viewport, découpe, fond, grille) suit `chrome_fitting_*`, la zone
  // CADRÉE suit `window_fitting_*`. Les deux ne coïncident qu'en cadrage automatique : en
  // caméra libre, ouvrir un panneau ne doit pas raboter la zone de dessin — sinon le
  // diagramme paraît se réajuster tout seul alors que la caméra appartient a l'utilisateur.

  it('caméra libre : la zone cadrée se réduit, le chrome ne bouge pas', () => {
    const { app, drawing_area } = buildDrawnApp()
    expect(drawing_area.auto_fit_mode).toBe('none')
    const chrome_avant = drawing_area.chrome_fitting_width
    const zone_avant = drawing_area.window_fitting_width

    app.menu_configuration.panels.setMode('config', 'sidebar')
    const reserve = app.menu_configuration.panels.getSidebarReservedPx()
    expect(reserve).toBeGreaterThan(0)

    expect(drawing_area.window_fitting_width).toBe(zone_avant - reserve)
    expect(drawing_area.chrome_fitting_width).toBe(chrome_avant)
  })

  it('cadrage automatique : le chrome épouse la zone cadrée', () => {
    const { app, drawing_area } = buildDrawnApp()
    drawing_area.auto_fit_mode = 'full'

    app.menu_configuration.panels.setMode('config', 'sidebar')
    expect(app.menu_configuration.panels.getSidebarReservedPx()).toBeGreaterThan(0)

    expect(drawing_area.chrome_fitting_width).toBe(drawing_area.window_fitting_width)
  })

  it('la colonne d\'outils, permanente, n\'est jamais rendue au chrome', () => {
    const { app, drawing_area } = buildDrawnApp()
    app.menu_configuration.tools_column_enabled = true
    const tools = app.menu_configuration.getToolsColumnWidthPx()
    expect(tools).toBeGreaterThan(0)

    // Aucun panneau ouvert : rien à rendre, chrome == zone cadrée (outils déjà retranchés
    // des deux côtés). Les rendre ferait dessiner sous les boutons.
    expect(drawing_area.panel_reserve_right).toBe(0)
    expect(drawing_area.chrome_fitting_width).toBe(drawing_area.window_fitting_width)
  })
})

describe('OS#388 — cas 2 : changer de menu ancré ne change pas la réserve', () => {

  it('la somme est constante alors que les deux réserves par panneau s\'inversent', () => {
    const app = new Class_ApplicationData(false)
    const menu_configuration = app.menu_configuration
    const { panels } = menu_configuration

    panels.setMode('config', 'sidebar')
    const reserve_config = menu_configuration.panels.getSidebarReservedPx()
    expect(reserve_config).toBeGreaterThan(0)
    expect(menu_configuration.getConfigPanelPinnedReservedPx()).toBe(reserve_config)
    expect(menu_configuration.getFilterPanelPinnedReservedPx()).toBe(0)

    // Le filtre prend la barre latérale : la config en est éjectée.
    panels.setMode('filter', 'sidebar')

    // Les deux réserves PAR PANNEAU s'inversent — c'est ce qui faisait se déclencher
    // l'effet de MainZoneTabs pour rien (les suivre séparément n'a plus d'objet depuis
    // qu'OS#300 a donné à la barre latérale une largeur unique et partagée).
    expect(menu_configuration.getConfigPanelPinnedReservedPx()).toBe(0)
    expect(menu_configuration.getFilterPanelPinnedReservedPx()).toBe(reserve_config)

    // La seule grandeur qui compte pour le fenêtrage, elle, n'a pas bougé.
    expect(panels.getSidebarReservedPx()).toBe(reserve_config)
    expect(menu_configuration.getRightChromeReservedPx()).toBe(
      menu_configuration.getToolsColumnWidthPx() + reserve_config)
  })
})
