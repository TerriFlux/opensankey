import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import { scaleModelGeometry } from './DrawingAreaCamera'
import type { Type_JSON } from './Utils'

// OS#1300 — le bake « zoom 100% » scale la géométrie EN PLACE. Bug observé sur cartofob : les
// POSITIONS des nœuds ne bougeaient pas (diagramme étiré), alors que les zones de texte oui. Cause
// suspectée : nœuds ancrés par le CENTRE (node_pos_is_center) → position_x recalculée depuis le
// centre au draw, donc scaler position_x seul est écrasé ; il faut scaler le CENTRE. Ce test charge
// un vrai extrait de cartofob (352 nœuds center-anchored + 19 ZDT) et vérifie que scaleModelGeometry
// scale bien centres de nœuds, positions de ZDT, tailles et échelle des flux.

const FIXTURE = path.join(__dirname, '__fixtures__', 'cartofob_view.json.gz')

function loadFixture(): Type_JSON {
  const buf = fs.readFileSync(FIXTURE)
  return JSON.parse(zlib.gunzipSync(buf).toString('utf-8')) as Type_JSON
}

const R = 2

describe('OS#1300 — scaleModelGeometry (bake in-place) sur cartofob', () => {
  it('scale les CENTRES des nœuds, les positions des ZDT, tailles et user_scale', () => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(loadFixture() as never, {}, false)
    const da = app.drawing_area

    // Pré-requis du bake : passage en mode absolu (fige les positions).
    da.setAbsoluteMode()

    const nodes = da.sankey.nodes_list
    const conts = da.sankey.containers_list
    expect(nodes.length).toBeGreaterThan(100)
    expect(conts.length).toBeGreaterThan(0)

    // Snapshots AVANT.
    const node_centers_before = nodes.map(n => n.centerForPersistence())
    const cont_pos_before = conts.map(c => ({ x: c.position_x, y: c.position_y }))
    const scale_before = da.scale
    // Un nœud avec une largeur mini explicite (sinon défaut).
    const sample_node = nodes[0]
    const w_before = sample_node.shape_min_width

    scaleModelGeometry(da, R, false)

    // CENTRES des nœuds ×R (le vrai fix : sans ça, position revient à center−w/2 au draw).
    nodes.forEach((n, i) => {
      const c = n.centerForPersistence()
      expect(c.x).toBeCloseTo(node_centers_before[i].x * R, 3)
      expect(c.y).toBeCloseTo(node_centers_before[i].y * R, 3)
    })

    // Positions des ZDT ×R.
    conts.forEach((c, i) => {
      expect(c.position_x).toBeCloseTo(cont_pos_before[i].x * R, 3)
      expect(c.position_y).toBeCloseTo(cont_pos_before[i].y * R, 3)
    })

    // Taille de forme ×R et échelle des flux ÷R.
    expect(sample_node.shape_min_width).toBeCloseTo(w_before * R, 3)
    expect(da.scale).toBeCloseTo(scale_before / R, 3)
  })
})
