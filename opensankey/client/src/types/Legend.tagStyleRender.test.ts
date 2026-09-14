import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

/**
 * SA#545 — légende mise en forme par les styles d'étiquette, sur de vraies classes dessinées (jsdom).
 *
 * Deux défauts du test local du 2026-09-14, qu'aucun test pur ne pouvait voir :
 *  - ORDRE Z. Une zone que la légende crée en se régénérant SEULE (valeur d'exemple, entrée « sans
 *    étiquette », entrée d'une étiquette qui prend un style) est inscrite au FOND de l'ordre des
 *    éléments. Le cadre et les blocs de la légende n'étaient renvoyés derrière leurs zones qu'au
 *    dessin complet du diagramme : au premier geste qui réappliquait l'ordre Z, la zone passait
 *    SOUS le cadre — dont la forme remplie, même transparente, capte la souris : plus de
 *    surbrillance ni d'info-bulle au survol — et la valeur d'exemple passait sous son carré.
 *  - SURVOL. Le titre d'un groupe ne mettait rien en évidence.
 */

installJsdomRenderStubs()

function makeLegend() {
  const host = resetHost()
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewNodeWithName('C')
  const d = sankey.addNewNodeWithName('D')
  sankey.addNewLink(a, b).valueCurrent = 100
  const makeStyle = (name: string, attrs: { [k: string]: string | number | boolean }): Class_ElementStyle => {
    const style = sankey.addNewDefaultElementStyle()
    style.name = name
    Object.entries(attrs).forEach(([k, v]) => { (style as unknown as { [k: string]: unknown })[k] = v })
    return style
  }
  const fiab = sankey.addNodeTagGroup('fiab', 'Fiabilite', false)
  fiab.use_colors = true
  const full = fiab.addTag('Full', 'full') as Class_Tag
  const col = fiab.addTag('Col', 'col') as Class_Tag
  a.addTag(full)
  b.addTag(col)
  d.addTag(col)
  app.drawing_area.legend.masked = false
  app.drawing_area.draw()
  // Geste de l'utilisateur APRÈS le dessin : poser des styles ne régénère que la légende.
  full.style_id = makeStyle('F', { shape_color: '#ff0000', value_label_bold: true }).id
  fiab.style_id = makeStyle('G', { shape_color: '#999999' }).id
  app.drawing_area.legend.draw()
  return { host, app }
}

function zone(host: HTMLElement, app: Class_ApplicationData, id: string): Element {
  const container = app.drawing_area.sankey.containers_dict[id]
  expect(container).toBeDefined()
  const g = host.querySelector('#' + container.svg_group)
  expect(g).not.toBeNull()
  return g as Element
}

/** Noms des nœuds atténués pendant le survol de la zone. */
function dimmedWhileHovering(host: HTMLElement, app: Class_ApplicationData, id: string): string[] {
  const g = zone(host, app, id)
  g.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  const dimmed = app.drawing_area.sankey.nodes_list
    .filter(n => host.querySelector('#' + n.svg_group)?.getAttribute('opacity') === '0.1')
    .map(n => n.name)
    .sort()
  g.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
  return dimmed
}

describe('SA#545 — ordre Z de la légende après une régénération seule', () => {
  it('cadre et bloc restent derrière toutes les zones, la valeur d\'exemple devant son carré', () => {
    const { host, app } = makeLegend()
    // N'importe quel geste qui réapplique l'ordre Z (ajout d'un nœud, barre d'outils…)
    app.drawing_area.orderElementOnDA()
    // Dans le DOM, un <g> placé plus loin est peint PAR-DESSUS
    const all = Array.from(host.querySelectorAll('g[id]'))
    const depth = (id: string) => all.indexOf(zone(host, app, id))
    const members = [
      'legend-group-fiab', 'legend-tag-fiab-full', 'legend-tag-fiab-col',
      'legend-untagged-fiab', 'legend-sample-tag-fiab-full'
    ]
    members.forEach(id => {
      expect(depth(id)).toBeGreaterThan(depth('legend'))
      expect(depth(id)).toBeGreaterThan(depth('legend-block-fiab'))
    })
    expect(depth('legend-sample-tag-fiab-full')).toBeGreaterThan(depth('legend-tag-fiab-full'))
  })
})

describe('SA#545 — survol des zones de la légende', () => {
  it('entrée d\'étiquette : ses porteurs (et les extrémités de leurs flux) restent en évidence', () => {
    const { host, app } = makeLegend()
    expect(dimmedWhileHovering(host, app, 'legend-tag-fiab-full')).toEqual(['C', 'D'])
  })

  it('valeur d\'exemple : même surbrillance que son entrée', () => {
    const { host, app } = makeLegend()
    expect(dimmedWhileHovering(host, app, 'legend-sample-tag-fiab-full')).toEqual(['C', 'D'])
  })

  it('titre de groupe : les porteurs de l\'une quelconque de ses étiquettes', () => {
    const { host, app } = makeLegend()
    expect(dimmedWhileHovering(host, app, 'legend-group-fiab')).toEqual(['C'])
  })

  it('« sans étiquette » : les éléments du groupe qui n\'en portent aucune', () => {
    const { host, app } = makeLegend()
    expect(dimmedWhileHovering(host, app, 'legend-untagged-fiab')).toEqual(['A', 'B', 'D'])
  })
})
