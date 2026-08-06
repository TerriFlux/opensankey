import { Class_ApplicationData } from './ApplicationData'

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

  it('zone jamais dessinée : ne jette pas', () => {
    const app = new Class_ApplicationData(false)
    expect(() => app.refreshWindowFraming()).not.toThrow()
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
