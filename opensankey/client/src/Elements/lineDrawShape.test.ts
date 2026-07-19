import * as d3 from '../d3Modules'
import { Class_ApplicationData } from '../types/ApplicationData'

// OS#1276b — régression rendu : la branche 'line' de NodeDrawShape.drawShape
// était court-circuitée par le fallback 'rect' (liste des formes de nœud pour
// les styles partagés nœuds/flux, cf. OS#1282) : une ligne libre se dessinait
// en RECTANGLE (la branche `else if ('line')` venait après le rect du fallback).
// On monte un <g> minimal en jsdom et on vérifie que le segment produit bien un
// <line.node_shape> — et surtout PAS de rect.

describe('OS#1276b — rendu de la ligne libre', () => {
  it('drawShape produit un <line.node_shape> entre les 2 extrémités (pas un rectangle)', () => {
    const app = new Class_ApplicationData(false)
    const cont = app.drawing_area.sankey.addNewDefaultContainer()
    cont.shape_type = 'line'
    cont.shape_min_width = 100
    cont.shape_min_height = 50
    cont.shape_line_flip = true
    cont.ensureLineEndpoints() // A=(0,50), B=(100,0)

    // Montage minimal : drawShape n'a besoin que de d3_selection (garde) et de
    // d3_selection_g_shape (cible des appends) — pas de DrawingArea montée.
    const svg = d3.select(document.body).append('svg')
    const root = svg.append('g')
    const g_shape = root.append('g')
    cont['d3_selection'] = root as never
    cont.d3_selection_g_shape = g_shape as never

    cont['_nodeDrawShape'].drawShape()

    expect(g_shape.selectAll('line.node_shape').size()).toBe(1)
    expect(g_shape.selectAll('rect.node_shape').size()).toBe(0)
    // Trait de préhension transparent présent lui aussi
    expect(g_shape.selectAll('line.node_line_hit').size()).toBe(1)
    const line = g_shape.select('line.node_shape')
    expect(+line.attr('x1')).toBe(0)
    expect(+line.attr('y1')).toBe(50)
    expect(+line.attr('x2')).toBe(100)
    expect(+line.attr('y2')).toBe(0)
    svg.remove()
  })
})
