import * as d3 from '../d3Modules'

import { Class_ApplicationData } from './ApplicationData'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

// ==================================================================================================
// #588 — En police verrouillée, la taille d'un libellé compense le zoom (1/k). Tous les libellés
// étaient redessinés deux fois de plus à chaque dessin complet : une fois tout de suite (dessinés à
// k=1 sur le SVG neuf, puis recalés), une fois 120 ms plus tard (la caméra reposée déclenchait le
// recalage différé) — et une fois après chaque simple déplacement de la vue. Le recalage n'a lieu
// d'être que si l'ÉCHELLE change.
// ==================================================================================================

installJsdomRenderStubs()

function buildDrawnApp() {
  resetHost()
  const app = new Class_ApplicationData(false)
  const drawing_area = app.drawing_area
  const { sankey } = drawing_area
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  source.setPosXY(0, 0)
  cible.setPosXY(300, 0)
  sankey.addNewLink(source, cible)
  drawing_area.draw()
  // Sans mise en page (jsdom), le cadrage d'arrivée ne sait rien mesurer : caméra explicite.
  drawing_area.setCamera(d3.zoomIdentity)
  return { app, drawing_area }
}

type Type_WithRefresh = { _refreshLabelsForFitZoom: () => void }

function nameLabelFontSize(): string | null {
  return document.querySelector('[id$="name_label_text_source"]')?.getAttribute('font-size') ?? null
}

describe('#588 — recalage des libellés seulement quand l\'échelle change', () => {
  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  it('caméra libre : un dessin complet dessine les libellés d\'emblée à la bonne taille, sans recalage', () => {
    const { drawing_area } = buildDrawnApp()
    expect(drawing_area.auto_fit_mode).toBe('none')
    expect(drawing_area.font_size_locked).toBe(true)
    drawing_area.setCamera(d3.zoomIdentity.scale(0.5))
    jest.runOnlyPendingTimers()
    const font_size_at_half = nameLabelFontSize()

    const refresh = jest.spyOn(drawing_area as unknown as Type_WithRefresh, '_refreshLabelsForFitZoom')
    drawing_area.draw()
    jest.runOnlyPendingTimers()

    expect(refresh).not.toHaveBeenCalled()
    expect(drawing_area.getZoomScale()).toBe(0.5)
    expect(nameLabelFontSize()).toBe(font_size_at_half)
  })

  it('un déplacement de la vue ne recale pas les libellés', () => {
    const { drawing_area } = buildDrawnApp()
    jest.runOnlyPendingTimers()
    const refresh = jest.spyOn(drawing_area as unknown as Type_WithRefresh, '_refreshLabelsForFitZoom')

    drawing_area.setCamera(d3.zoomIdentity.translate(40, 10))
    jest.runOnlyPendingTimers()

    expect(refresh).not.toHaveBeenCalled()
  })

  it('un zoom recale les libellés, une fois', () => {
    const { drawing_area } = buildDrawnApp()
    jest.runOnlyPendingTimers()
    const before = nameLabelFontSize()
    const refresh = jest.spyOn(drawing_area as unknown as Type_WithRefresh, '_refreshLabelsForFitZoom')

    drawing_area.setCamera(d3.zoomIdentity.scale(2))
    drawing_area.setCamera(d3.zoomIdentity.scale(3))
    jest.runOnlyPendingTimers()

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(nameLabelFontSize()).not.toBe(before)
  })

  it('un aller-retour d\'échelle avant l\'échéance recale quand même (des libellés ont pu être dessinés entre-temps)', () => {
    const { drawing_area } = buildDrawnApp()
    jest.runOnlyPendingTimers()
    const refresh = jest.spyOn(drawing_area as unknown as Type_WithRefresh, '_refreshLabelsForFitZoom')
    drawing_area.setCamera(d3.zoomIdentity.scale(2))
    drawing_area.setCamera(d3.zoomIdentity)
    jest.runOnlyPendingTimers()

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
