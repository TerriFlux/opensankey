import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import { LINK_DASH_GAP, LINK_DASH_LENGTH } from '../Elements/linkDash'

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
  // SA#553 — le style « des éléments sans étiquette » est celui de l'étiquette générée ; le poser par
  // le groupe reste possible (même réglage).
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
      'legend-tag-fiab-fiab__untagged', 'legend-sample-tag-fiab-full'
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

  // SA#551 (2026-09-18) — un TITRE de groupe ne met plus rien en surbrillance : il ouvre la pop-up
  // du groupe, et seule une étiquette désigne des éléments (arbitrage d'Alexandre).
  it('titre de groupe : plus aucune surbrillance', () => {
    const { host, app } = makeLegend()
    expect(dimmedWhileHovering(host, app, 'legend-group-fiab')).toEqual([])
  })

  it('étiquette générée « Sans Fiabilite » : les éléments du groupe qui n\'en portent aucune', () => {
    const { host, app } = makeLegend()
    expect(dimmedWhileHovering(host, app, 'legend-tag-fiab-fiab__untagged')).toEqual(['A', 'B', 'D'])
  })
})

describe('SA#545 — le carré reproduit les hachures et l\'icône du diagramme', () => {
  function legendWith(full_attrs: { [k: string]: string | number | boolean }, col_attrs: { [k: string]: string | number | boolean }) {
    const host = resetHost()
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const a = sankey.addNewNodeWithName('A')
    const b = sankey.addNewNodeWithName('B')
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
    app.drawing_area.legend.masked = false
    app.drawing_area.draw()
    full.style_id = makeStyle('F', full_attrs).id
    col.style_id = makeStyle('C', col_attrs).id
    app.drawing_area.legend.draw()
    return { host, app, full, col }
  }

  const swatchFill = (host: HTMLElement, app: Class_ApplicationData, id: string) =>
    zone(host, app, id).querySelector('.node_shape')?.getAttribute('fill') ?? ''

  it('flux « Hachuré » : les tirets du tracé de flux (trait plein, puis vide)', () => {
    const { host, app } = legendWith({ shape_color: '#ff0000', shape_is_dashed: true }, { shape_color: '#00ff00' })
    expect(swatchFill(host, app, 'legend-tag-fiab-full')).toBe('url(#legend-dash-legend-tag-fiab-full)')
    const pattern = document.getElementById('legend-dash-legend-tag-fiab-full')
    expect(pattern?.getAttribute('width')).toBe(String(LINK_DASH_LENGTH + LINK_DASH_GAP))
    expect(pattern?.querySelector('rect')?.getAttribute('width')).toBe(String(LINK_DASH_LENGTH))
    expect(pattern?.querySelector('rect')?.getAttribute('fill')).toBe('#ff0000')
    // Le carré sans hachure reste plein
    expect(swatchFill(host, app, 'legend-tag-fiab-col')).toBe('#00ff00')
  })

  it('hachures de nœud : le motif du nœud, dans l\'orientation du style', () => {
    const { host, app } = legendWith({ shape_color: '#ff0000', shape_hatch: 'horizontal' }, { shape_color: '#00ff00' })
    expect(swatchFill(host, app, 'legend-tag-fiab-full')).toBe('url(#hatch-legend-tag-fiab-full)')
    expect(document.getElementById('hatch-legend-tag-fiab-full')?.getAttribute('patternTransform')).toBe('rotate(90)')
  })

  it('image du style : dessinée dans le carré, qui apparaît même sans couleur', () => {
    const src = 'data:image/png;base64,AAAA'
    const { host, app } = legendWith({ icon_is_visible: true, icon_is_image: true, icon_image_src: src }, { shape_color: '#00ff00' })
    const image = zone(host, app, 'legend-tag-fiab-full').querySelector('image')
    expect(image).not.toBeNull()
    expect(image?.getAttribute('xlink:href') ?? image?.getAttribute('href')).toBe(src)
  })

  it('retirer les styles retire tirets et image du carré', () => {
    const { host, app, full, col } = legendWith(
      { shape_color: '#ff0000', shape_is_dashed: true, icon_is_visible: true, icon_is_image: true, icon_image_src: 'data:x' },
      { shape_color: '#00ff00', shape_hatch: 'diagonal' }
    )
    full.style_id = undefined
    col.style_id = undefined
    app.drawing_area.legend.draw()
    ;['legend-tag-fiab-full', 'legend-tag-fiab-col'].forEach(id => {
      expect(swatchFill(host, app, id)).not.toMatch(/^url\(/)
      expect(zone(host, app, id).querySelector('image')).toBeNull()
    })
  })
})
