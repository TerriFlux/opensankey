import { Class_ApplicationData } from '../types/ApplicationData'
import { MAIN_ZONE_CANVAS_ID, MAIN_ZONE_JSON_ID, MAIN_ZONE_SPREADSHEET_ID } from '../types/MenuConfig'
import { representation_registry } from './RepresentationRegistry'
import { registerBaseRepresentations } from './registerBaseRepresentations'
import { publishSpreadsheetZoom } from './SpreadsheetZoomBridge'
import {
  activeWindowZoom, activeZoomPercent, applyZoomStep, canZoomStep, resetZoomToNeutral,
  DEFAULT_ZOOM_STEP
} from './RepresentationZoom'

/**
 * os#1409 - LE ZOOM VISE LA FENETRE ACTIVE, PAS LE SEUL DIAGRAMME.
 *
 * Le controle de la colonne etait cable en dur sur `app_data.drawing_area`. Ces tests figent la
 * REGLE - a quelle capacite le geste s adresse -, pas son affichage : le composant n en est
 * qu un lecteur.
 */

const freshApp = (): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.setToModeEdition(false)
  return app
}

const withActiveWindow = (app: Class_ApplicationData, id: string) => {
  const mc = app.menu_configuration
  mc.showMainZoneOccupant(id)
  mc.main_zone_active_id = id
}

beforeEach(() => {
  representation_registry.clear()
  registerBaseRepresentations()
  publishSpreadsheetZoom(null)
})

afterEach(() => {
  representation_registry.clear()
  publishSpreadsheetZoom(null)
})

describe('os#1409 le zoom est une capacite declaree par la nature', () => {

  it('sans rien toucher, le geste vise le diagramme et sa transformation d3', () => {
    const app = freshApp()
    const target = activeWindowZoom(app)
    expect(target).not.toBeNull()
    expect(target?.representation_id).toBe(MAIN_ZONE_CANVAS_ID)
    const by_factor = jest.spyOn(app.drawing_area, 'zoomByFactor')
    applyZoomStep(target!, 1)
    // Le diagramme declare `scaleBy` : c est SON geste qui est appele, et non une composition
    // lecture puis ecriture. Cest la non-regression du lot.
    expect(by_factor).toHaveBeenCalledWith(DEFAULT_ZOOM_STEP)
    applyZoomStep(target!, -1)
    expect(by_factor).toHaveBeenCalledWith(1 / DEFAULT_ZOOM_STEP)
  })

  it('le clic sur le pourcentage repose lechelle neutre du diagramme, une page vide', () => {
    const app = freshApp()
    const to_scale = jest.spyOn(app.drawing_area, 'zoomToScale')
    resetZoomToNeutral(activeWindowZoom(app)!)
    expect(to_scale).toHaveBeenCalledWith(1)
  })

  it('sans grande zone, on retombe sur la zone de dessin', () => {
    // Le viewer MIT (os#1383) rend ce controle et na PAS de grande zone : lui retirer son zoom
    // serait une regression silencieuse.
    const app = freshApp()
    jest.spyOn(app.menu_configuration, 'main_zone_active_id', 'get').mockReturnValue(null)
    expect(activeWindowZoom(app)?.representation_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('le diagramme zoome meme quand le registre na pas ete peuple', () => {
    // Un viewer embarque nappelle jamais registerBaseRepresentations : il na pas de selecteur
    // de nature. Son zoom doit continuer de marcher.
    representation_registry.clear()
    const app = freshApp()
    const by_factor = jest.spyOn(app.drawing_area, 'zoomByFactor')
    applyZoomStep(activeWindowZoom(app)!, 1)
    expect(by_factor).toHaveBeenCalled()
  })

  it('une nature qui ne declare rien ne rend aucune cible, et le controle se grise', () => {
    const app = freshApp()
    withActiveWindow(app, MAIN_ZONE_JSON_ID)
    expect(activeWindowZoom(app)).toBeNull()
  })

  it('le tableur ne zoome que pendant que sa grille est montee', () => {
    const app = freshApp()
    withActiveWindow(app, MAIN_ZONE_SPREADSHEET_ID)
    // Pas de grille : personne a qui parler, donc pas de cible.
    expect(activeWindowZoom(app)).toBeNull()
    let ratio = 1
    publishSpreadsheetZoom({ getZoom: () => ratio, setZoom: (r) => { ratio = r } })
    const target = activeWindowZoom(app)
    expect(target?.representation_id).toBe(MAIN_ZONE_SPREADSHEET_ID)
    applyZoomStep(target!, 1)
    expect(ratio).toBeCloseTo(1.25)
    resetZoomToNeutral(target!)
    expect(ratio).toBe(1)
  })

  it('le pas se compose et se tient aux bornes de la nature', () => {
    const app = freshApp()
    withActiveWindow(app, MAIN_ZONE_SPREADSHEET_ID)
    let ratio = 3.9
    publishSpreadsheetZoom({ getZoom: () => ratio, setZoom: (r) => { ratio = r } })
    applyZoomStep(activeWindowZoom(app)!, 1)
    // 3,9 x 1,25 depasserait le maximum dUniver : le controle sy tient.
    expect(ratio).toBe(4)
    expect(canZoomStep(activeWindowZoom(app)!, 1)).toBe(false)
    expect(canZoomStep(activeWindowZoom(app)!, -1)).toBe(true)
  })

  it('le pourcentage est rapporte a lechelle neutre de la nature, pas a une definition unique', () => {
    const app = freshApp()
    withActiveWindow(app, MAIN_ZONE_SPREADSHEET_ID)
    publishSpreadsheetZoom({ getZoom: () => 1.5, setZoom: () => undefined })
    expect(activeZoomPercent(activeWindowZoom(app)!)).toBe(150)
  })
})
