import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_Tag } from '../../../types/Tag'
import { installJsdomRenderStubs, resetHost } from '../../../Persistence/renderFingerprint'
import { SankeyLegendPanel } from './SankeyLegendPanel'

// os#1527 — le panneau de legende du diagramme : une case par etiquette qui se coche, une pastille par
// entree, le fond regle dans le menu Legende ; decocher passe par le geste de la legende dessinee.

installJsdomRenderStubs()
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Type_GestureProgress = { indicator: unknown }
const gestureProgress = (app: Class_ApplicationData) =>
  (app as unknown as { _views_reader: { gesture_progress: Type_GestureProgress } })._views_reader.gesture_progress

function makeApp() {
  resetHost()
  const app = new Class_ApplicationData(false)
  gestureProgress(app).indicator = undefined
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b).valueCurrent = 100
  const fiab = sankey.addNodeTagGroup('fiab', 'Fiabilite', false)
  fiab.use_colors = true
  const full = fiab.addTag('Full', 'full') as Class_Tag
  const indic = fiab.addTag('Indicative', 'indic') as Class_Tag
  a.addTag(full)
  b.addTag(indic)
  app.drawing_area.legend.masked = false
  app.drawing_area.draw()
  return { app, indic }
}

describe('os#1527 panneau de legende du diagramme', () => {
  test('cases et pastilles ; decocher masque l etiquette, la ligne reste decochee', () => {
    const { app, indic } = makeApp()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    act(() => { root.render(<SankeyLegendPanel app_data={app} />) })
    const row = host.querySelector('[data-legend-id="legend-tag-fiab-indic"]') as HTMLElement
    expect(row).not.toBeNull()
    const box = row.querySelector('input[type=checkbox]') as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(row.querySelector('svg rect')).not.toBeNull()
    // Simple clic CONFIRMÉ (la ligne se renomme aussi au double-clic) : 250 ms.
    jest.useFakeTimers()
    act(() => { row.click(); jest.advanceTimersByTime(300) })
    jest.useRealTimers()
    expect(indic.is_selected).toBe(false)
    const after = host.querySelector('[data-legend-id="legend-tag-fiab-indic"] input[type=checkbox]') as HTMLInputElement
    expect(after.checked).toBe(false)
    act(() => { root.unmount() })
    host.remove()
  })

  test('le fond regle dans le menu Legende est celui du panneau', () => {
    const { app } = makeApp()
    app.drawing_area.legend.legend_bg_color = '#ff0000'
    app.drawing_area.legend.legend_bg_opacity = 100
    app.drawing_area.legend.legend_bg_border = true
    const host = document.createElement('div')
    const root = createRoot(host)
    act(() => { root.render(<SankeyLegendPanel app_data={app} />) })
    const panel = host.querySelector('.sankey_legend_panel') as HTMLElement
    expect(panel.style.background).toContain('rgb(255, 0, 0)')
    expect(panel.style.border).toContain('1px solid')
    act(() => { root.unmount() })
  })
})
