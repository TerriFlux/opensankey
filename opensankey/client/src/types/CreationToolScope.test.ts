import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID } from './MenuConfig'
import { toolAppliesToActiveWindow, activeWindowRepresentation } from './CreationToolScope'

/**
 * os#1401 - UN OUTIL NE S ARME QUE LA OU SON GESTE EXISTE.
 *
 * Les outils de creation etaient gouvernes par un seul booleen global de mode publication :
 * rien ne regardait la fenetre active de la grande zone, et un outil pouvait etre arme pendant
 * que le tableur occupait l ecran. Le griser ne suffit pas - un bouton grise dont l action
 * reste atteignable autrement est un garde-fou en trompe-l oeil. Ces tests figent le REFUS DU
 * MODELE, celui que la colonne d outils ne fait que refleter.
 */

const withSpreadsheetActive = (app: Class_ApplicationData) => {
  const mc = app.menu_configuration
  mc.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)
  mc.main_zone_active_id = MAIN_ZONE_SPREADSHEET_ID
}

/**
 * Une zone de dessin NEUVE demarre en mode edition, donc avec l outil flux implicitement arme
 * (cf. `_mode` et `_edition_tool`) ; l application, elle, retombe en selection des qu un
 * document est lu (`setToModeEdition(false)`). On part donc de l etat d apres chargement,
 * sinon les tests mesureraient cet heritage plutot que la regle.
 */
const freshApp = (): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.setToModeEdition(false)
  return app
}

describe('os#1401 la portee dun outil suit la fenetre active', () => {

  it('sans rien toucher, la fenetre active est le canevas et les outils sappliquent', () => {
    const app = freshApp()
    expect(activeWindowRepresentation(app)).toBe(MAIN_ZONE_CANVAS_ID)
    expect(toolAppliesToActiveWindow(app, 'node')).toBe(true)
    expect(toolAppliesToActiveWindow(app, 'link')).toBe(true)
    expect(toolAppliesToActiveWindow(app, 'text_zone')).toBe(true)
    expect(toolAppliesToActiveWindow(app, 'line')).toBe(true)
    expect(toolAppliesToActiveWindow(app, 'selection')).toBe(true)
    expect(toolAppliesToActiveWindow(app, 'style_paint')).toBe(true)
  })

  it('le tableur en fenetre active, aucun geste de dessin ne sapplique', () => {
    const app = freshApp()
    withSpreadsheetActive(app)
    expect(activeWindowRepresentation(app)).toBe(MAIN_ZONE_SPREADSHEET_ID)
    expect(toolAppliesToActiveWindow(app, 'node')).toBe(false)
    expect(toolAppliesToActiveWindow(app, 'style_paint')).toBe(false)
  })

  it('setCreationTool REFUSE darmer un outil que la fenetre active ne peut pas servir', () => {
    const app = freshApp()
    withSpreadsheetActive(app)
    app.drawing_area.setCreationTool('node')
    expect(app.drawing_area.active_creation_tool).toBeNull()
    app.drawing_area.setCreationTool('text_zone', true)
    expect(app.drawing_area.active_creation_tool).toBeNull()
    expect(app.drawing_area.tool_sticky).toBe(false)
  })

  it('desarmer reste permis depuis une fenetre qui ne dessine pas', () => {
    // La sortie ne produit rien : la refuser enfermerait dans un outil arme avant le
    // changement de fenetre.
    const app = freshApp()
    app.drawing_area.setCreationTool('node')
    expect(app.drawing_area.active_creation_tool).toBe('node')
    withSpreadsheetActive(app)
    app.drawing_area.setCreationTool(null)
    expect(app.drawing_area.active_creation_tool).toBeNull()
  })

  it('un outil arme est relache quand la fenetre active cesse de pouvoir le servir', () => {
    const app = freshApp()
    app.drawing_area.setCreationTool('link')
    withSpreadsheetActive(app)
    app.drawing_area.releaseCreationToolOutOfScope()
    expect(app.drawing_area.active_creation_tool).toBeNull()
  })

  it('la recette : le tableur pris comme fenetre PRINCIPALE suffit a fermer les outils', () => {
    // Sans avoir touche la fenetre : `main_zone_active_id` retombe sur la fenetre principale
    // quand aucune na ete designee. Cest le cas de la recette de l issue.
    const app = freshApp()
    const mc = app.menu_configuration
    mc.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)
    mc.makeMainZoneOccupantMain(MAIN_ZONE_SPREADSHEET_ID)
    expect(activeWindowRepresentation(app)).toBe(MAIN_ZONE_SPREADSHEET_ID)
    app.drawing_area.setCreationTool('node')
    expect(app.drawing_area.active_creation_tool).toBeNull()
  })

  it('le mode edition herite du demarrage est relache lui aussi', () => {
    // Une zone de dessin neuve est en mode edition : sans ce relachement, ouvrir un document
    // sur le tableur montrerait le bouton flux allume au-dessus dune grille de cellules.
    const app = new Class_ApplicationData(false)
    expect(app.drawing_area.active_creation_tool).toBe('link')
    withSpreadsheetActive(app)
    app.drawing_area.releaseCreationToolOutOfScope()
    expect(app.drawing_area.active_creation_tool).toBeNull()
  })

  it('revenir au canevas rend les outils armables', () => {
    const app = freshApp()
    withSpreadsheetActive(app)
    app.menu_configuration.activateMainZoneCanvas()
    app.drawing_area.setCreationTool('node')
    expect(app.drawing_area.active_creation_tool).toBe('node')
  })

  it('sans grande zone, rien nest refuse', () => {
    // Le viewer embarque et le plateau unitaire montent une application sans fenetre : le
    // refus ne vaut que contre une fenetre CONNUE dont la nature ne sert pas le geste.
    const app = freshApp()
    jest.spyOn(app.menu_configuration, 'main_zone_active_id', 'get').mockReturnValue(null)
    expect(activeWindowRepresentation(app)).toBeNull()
    expect(toolAppliesToActiveWindow(app, 'node')).toBe(true)
  })
})
