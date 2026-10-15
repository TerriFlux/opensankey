// os#1531 (Julien, 15/10) — UNE FIGURE POSEE DANS LE DIAGRAMME, RATTACHEE A SON ELEMENT.
//
// La zone figure cite une figure du document et son sujet ; elle se relit telle quelle, le menage
// d avant l ecriture garde sa figure, la figure se monte par le crochet des representations, et le
// trait d attache suit le noeud quand il bouge.

import * as d3 from '../d3Modules'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'
import { Class_FigureZoneElement, figure_zone_hooks } from './FigureZone'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

/** Le groupe SVG de la zone, sans zone de dessin montee (cf. lineDrawShape.test). */
const monter = (zone: Class_FigureZoneElement) => {
  const svg = d3.select(document.body).append('svg')
  const root = svg.append('g')
  zone['d3_selection'] = root as never
  return root
}

const scene = () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const node = sankey.addNewNodeWithName('Matiere vegetale')
  node.setPosXY(100, 100)
  const figure_id = app.menu_configuration.promoteStandaloneFigure('osp.repr.bars', {})
  const zone = sankey.addNewFigureZone('figure_z', 'Figure', figure_id, { kind: 'node', id: node.id })
  zone.setPosXY(400, 80)
  zone.shape_min_width = 200
  zone.shape_min_height = 150
  return { app, sankey, node, zone, figure_id }
}

afterEach(() => {
  document.body.innerHTML = ''
  delete figure_zone_hooks.mount
})

describe('os#1531 figure posee dans le diagramme', () => {
  test('la zone se relit telle quelle : sa classe, sa figure, son sujet', () => {
    const { app, zone, figure_id, node } = scene()
    const json = app.toJSON() as Type_JSON
    const entry = (json.labels as Type_JSON)[zone.id] as Type_JSON
    expect(entry.figure_zone).toEqual({ figure: figure_id, subject: { kind: 'node', id: node.id } })
    // Le menage d avant l ecriture garde la figure : seule la zone la cite.
    expect(Object.keys((json.figures ?? {}) as Type_JSON)).toContain(figure_id)

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    const zone2 = app2.drawing_area.sankey.containers_dict[zone.id]
    expect(zone2).toBeInstanceOf(Class_FigureZoneElement)
    expect((zone2 as Class_FigureZoneElement).figure_id).toBe(figure_id)
    expect((zone2 as Class_FigureZoneElement).subject).toEqual({ kind: 'node', id: node.id })
  })

  test('la figure se monte par le crochet des representations, dans un foreignObject a la taille de la zone', () => {
    const { zone } = scene()
    const vus: HTMLElement[] = []
    figure_zone_hooks.mount = (_z, host) => { vus.push(host); return { cleanup: () => undefined } }
    const g = monter(zone)
    zone.drawFigure()
    expect(vus).toHaveLength(1)
    const fo = g.select('foreignObject.figure_zone_fo')
    expect(fo.attr('width')).toBe('200')
    expect(fo.attr('height')).toBe('150')
    // Redessinee sans changement : la figure n est pas remontee.
    zone.drawFigure()
    expect(vus).toHaveLength(1)
  })

  test('le trait d attache va du bord de la zone au noeud, et le suit quand il bouge', () => {
    const { zone, node } = scene()
    const g = monter(zone)
    zone.drawLeader()
    const line = () => g.select('.figure_zone_leader line')
    expect(line().empty()).toBe(false)
    // Le bout cote zone est sur son bord gauche (le noeud est a gauche).
    expect(Number(line().attr('x1'))).toBe(0)
    const x2_avant = Number(line().attr('x2'))
    node.setPosXY(50, 100)
    zone.drawLeader()
    expect(Number(line().attr('x2'))).toBeLessThan(x2_avant)
  })
})
