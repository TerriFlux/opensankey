import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_NodeElement } from './Node'

/**
 * sa#568 — UN GLISSER SUR UN SEUL AXE S'ANNULE.
 *
 * La fin d'un glisser n'inscrivait son annulation (et ne réorganisait l'ordre des flux) que si le
 * nœud avait bougé en x ET en y. Un nœud aimanté sur une ligne, ou réordonné dans sa colonne, ne
 * bouge que sur un axe : « annuler » ne le défaisait pas (recette d'Alexandre, 03/10 : annuler
 * s'applique à toutes les actions, dont le déplacement d'un nœud).
 */

type Type_Handler = {
  handleMouseDragStart: (e: unknown) => void
  handleMouseDrag: (e: unknown) => void
  handleMouseDragEnd: (e: unknown) => void
}

const dragEvent = (node: Class_NodeElement, dx: number, dy: number) => ({
  dx, dy, x: node.position_x + dx, y: node.position_y + dy, subject: node,
  sourceEvent: new MouseEvent('mousemove', { clientX: node.position_x + dx, clientY: node.position_y + dy })
})

/** Glisse `node` de `steps` pas de (dx, dy), comme d3 le fait : début, mouvements, fin. */
const drag = (node: Class_NodeElement, dx: number, dy: number, steps = 5) => {
  const handler = (node as unknown as { _nodeEventsHandler: Type_Handler })._nodeEventsHandler
  handler.handleMouseDragStart(dragEvent(node, 0, 0))
  for (let i = 0; i < steps; i++) handler.handleMouseDrag(dragEvent(node, dx, dy))
  handler.handleMouseDragEnd(dragEvent(node, 0, 0))
}

const makeApp = () => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNode('a', 'A')
  const b = sankey.addNewNode('b', 'B')
  sankey.addNewLinkWithId('l_ab', a, b)
  a.setPosXY(100, 100)
  a.settleCenterAnchor()
  b.setPosXY(400, 100)
  b.settleCenterAnchor()
  // Le glisser ne déplace qu'en mode sélection.
  app.drawing_area.setToModeEdition(false)
  return { app, a }
}

describe('sa#568 un glisser sur un seul axe s\'annule', () => {
  it('horizontal', () => {
    const { app, a } = makeApp()
    drag(a, 20, 0)
    expect(a.position_x).toBe(200)
    expect(a.position_y).toBe(100)
    expect(app.history.can_undo).toBe(true)
    app.history.applyUndo()
    expect(a.position_x).toBe(100)
  })

  it('vertical', () => {
    const { app, a } = makeApp()
    drag(a, 0, 30)
    expect(a.position_y).toBe(250)
    expect(app.history.can_undo).toBe(true)
    app.history.applyUndo()
    expect(a.position_y).toBe(100)
  })
})
