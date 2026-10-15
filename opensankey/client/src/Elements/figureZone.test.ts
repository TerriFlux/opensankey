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

  test('la figure est un vrai SVG du diagramme : le SVG que trace la figure passe dans la zone', () => {
    // Julien, 15/10 : « il ne faut pas une image, il faut un vrai SVG ».
    const { zone } = scene()
    let montages = 0
    figure_zone_hooks.mount = (_z, host) => {
      montages++
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'trace')
      host.appendChild(svg)
      return { cleanup: () => undefined }
    }
    const g = monter(zone)
    zone.drawFigure()
    expect(montages).toBe(1)
    // Aucun foreignObject : un cadre <svg> a la taille de la zone, qui porte le SVG trace.
    expect(g.select('foreignObject').empty()).toBe(true)
    const cadre = g.select('svg.figure_zone_svg')
    expect(cadre.attr('width')).toBe('200')
    expect(cadre.attr('height')).toBe('150')
    expect(cadre.select('svg.trace').empty()).toBe(false)
    // Redessinee sans changement : la figure n est pas remontee.
    zone.drawFigure()
    expect(montages).toBe(1)
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

  test('un appui sur la figure remonte a la zone (on la saisit partout), sans atteindre le dessin', () => {
    // Julien, 15/10 : « qu on puisse draguer l element ». Le zoom propre de la figure avalait l appui.
    const { zone } = scene()
    let barre: SVGRectElement | null = null
    figure_zone_hooks.mount = (_z, host) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      barre = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      svg.appendChild(barre)
      host.appendChild(svg)
      return { cleanup: () => undefined }
    }
    const g = monter(zone)
    zone.drawFigure()
    const vus: string[] = []
    ;(g.node() as SVGGElement).addEventListener('mousedown', () => vus.push('zone'))
    ;(barre as unknown as SVGRectElement).addEventListener('mousedown', () => vus.push('dessin'))
    ;(barre as unknown as SVGRectElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(vus).toEqual(['zone'])
  })

  test('la figure se dessine a largeur fixe puis s etire a la zone : son texte grandit avec elle', () => {
    // Julien, 15/10 : « comment rendre ca visible ? ».
    const { zone } = scene()
    let montages = 0
    figure_zone_hooks.mount = () => { montages++; return { cleanup: () => undefined } }
    const g = monter(zone)
    zone.drawFigure()
    expect(g.select('svg.figure_zone_svg').attr('viewBox')).toBe(`0 0 420 ${Math.round(420 * 150 / 200)}`)
    // Agrandie a la meme proportion : etiree, pas remontee.
    const sac = zone.attributes as unknown as { [k: string]: unknown }
    sac['shape_min_width'] = 400
    sac['shape_min_height'] = 300
    zone.drawFigure()
    expect(montages).toBe(1)
    expect(g.select('svg.figure_zone_svg').attr('width')).toBe('400')
  })
})

