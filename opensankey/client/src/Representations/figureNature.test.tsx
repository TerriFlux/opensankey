// os#1479 — « JE VEUX CE NOUVEAU GRAPHE » : ce que ca coute, vraiment.
//
// Julien : « ce que je veux ensuite, c est qu il soit possible de te dire *je veux ce nouveau
// graphe avec ces caracteristiques* et que tu l implementes de A a Z avec le mecanisme generique —
// les styles, les attributs, tout ca. »
//
// CE FICHIER EST LA REPONSE, ET IL EST ECRIT POUR ETRE RELU COMME UNE PREUVE. Une nature d essai
// est declaree ci-dessous, en entier, sous les yeux du lecteur : elle ne dit que ce qui lui est
// PROPRE — ce qu elle decompose, ce qu elle dessine, un reglage a elle. Puis on verifie qu elle a
// TOUT le reste sans avoir rien ecrit pour : le socle de 42 cles, les deux etages de style de part,
// les cinq gestes du cablage, la selection qui ouvre l inspecteur, la liberation.
//
// ⚠️ ET LES GARDES LA COUVRENT SANS QU ON LES ECRIVE. C est la moitie qui se serait perimee en
// premier : une liste de natures ecrite a la main dans un test ne signale jamais qu elle est
// incomplete — elle passe, elle ne teste simplement plus la nature nouvelle.

import React from 'react'
import { Class_Workspace } from '../types/Workspace'
import { MAIN_ZONE_CANVAS_ID } from '../types/MenuConfig'
import { BARS_STYLE_DEFAULTS } from '../Charts/figureChartStyle'
import { BarPartStyle, FigurePartStyle } from '../Elements/ElementStyle'
import { applyPartTextStyle } from '../Charts/figurePartText'
import { FIGURE_COMMON_HONOURS, figureCommonMisses } from './figureCommonHonours'
import { registerFigureNature, figureNatures } from './figureNature'
import { representation_registry, elementContext } from './RepresentationRegistry'
import {
  givePlainDrawingEnvironment, sizedContainer
} from '../Charts/figureDomHarness.test-utils'
import * as d3 from '../d3Modules'

givePlainDrawingEnvironment()

// ── LA NATURE D ESSAI, EN ENTIER ─────────────────────────────────────────────────────────────
//
// Elle dessine une pile de bandes horizontales, une par part. C est volontairement pauvre : ce
// qu on mesure ici n est pas la qualite du trace, c est CE QU IL A FALLU ECRIRE pour l avoir.

const ESSAI_ID = 'test.repr.bandes'

registerFigureNature({
  id: ESSAI_ID,
  nature: 'bandes',
  order: 999,
  label: () => 'Bandes',
  icon: <span>|||</span>,
  // CE QUI N A DE SENS QUE CHEZ ELLE : une bande est plus lisible avec un creux entre deux.
  own: { parts_max: { default: 8 } },
  // CE QU ELLE CHANGE AU SOCLE : elle nomme ses parts par defaut, la couronne non.
  socle: { name_label_is_visible: { default: true } },
  style: () => BARS_STYLE_DEFAULTS,
  parts: (ctx) => {
    const el = ctx.element as { id?: string } | null
    if (!el) return null
    return [
      { id: 'a', label: 'Ble', value: 6 },
      { id: 'b', label: 'Mais', value: 4 }
    ]
  },
  draw: (container, parts, wiring) => {
    const svg = d3.select(container).append('svg')
      .attr('width', 200).attr('height', 100)
    parts.forEach((part, i) => {
      const aspect = wiring.part_aspect(part.id)
      svg.append('rect')
        .attr('class', 'bande')
        .attr('data-part', part.id)
        .attr('x', 0).attr('y', i * 30).attr('width', (part.value ?? 0) * 10).attr('height', 24)
        .attr('fill', aspect.fill ?? '#4472C4')
        .on('click', () => wiring.on_part_select(part.id))
      const texte = svg.append('text')
        .attr('class', 'bande_label')
        .attr('x', 4).attr('y', i * 30 + 16)
        .text(part.label ?? '')
      applyPartTextStyle(texte, aspect.name, { font_size: 11, color: '#2D3748' })
    })
    return () => { container.innerHTML = '' }
  }
})

/** Un noeud regarde dans une vignette — le contexte ordinaire d une figure d element. */
const scene = () => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const noeud = source.drawing_area.sankey.addNewNode('n', 'Noeud')
  const window_id = source.menu_configuration.openMainZoneWindow(
    { kind: 'selection' }, MAIN_ZONE_CANVAS_ID
  )
  const ctx = { ...elementContext(source, noeud), window_id, pane_key: 'p1', options: {} }
  return { ws, source, noeud, ctx }
}

const entree = (id: string = ESSAI_ID) => {
  const found = representation_registry.get(id)
  if (!found) throw new Error(`la nature « ${id} » ne s est pas enregistree`)
  return found
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1479 une nature declaree recoit le mecanisme entier', () => {

  it('elle SERT LE SOCLE sans avoir nomme une seule de ses 42 cles', () => {
    // LE POINT DU LOT. La nature ci-dessus ne cite `name_label_is_visible` que pour en changer la
    // valeur d usine ; elle n a nomme ni la typographie du titre, ni la legende, ni le format des
    // valeurs, ni les zones de texte — et elle les sert toutes.
    const attributes = entree().attributes as { [k: string]: unknown } | undefined

    expect(figureCommonMisses(attributes)).toEqual([])
    expect(FIGURE_COMMON_HONOURS.length).toBeGreaterThan(40)
  })

  it('ce qu elle change au socle est une SURCHARGE, pas un remplacement', () => {
    // Nommer une cle du socle ne peut pas la faire disparaitre : c est ce qui rend la garantie
    // ci-dessus impossible a contourner par megarde.
    const attributes = entree().attributes as {
      [k: string]: { default?: unknown } | undefined
    }
    expect(attributes['name_label_is_visible']?.default).toBe(true)
    // Et ce qui lui est propre est la, a cote.
    expect(attributes['parts_max']?.default).toBe(8)
  })

  it('LE GARDE DU SOCLE LA BALAIE, sans qu on l ait inscrite nulle part', () => {
    // La partie qui se serait perimee en premier. Un test qui porte sa liste de natures ne signale
    // jamais qu elle est incomplete : il passe, il ne teste simplement plus la nature nouvelle.
    const noms = figureNatures().map(n => n.nature)
    expect(noms).toContain('bandes')
    figureNatures().forEach(n => {
      // Les attributs tels que LE REGISTRE les a recus — donc socle compris.
      const misses = figureCommonMisses(entree(n.id).attributes as never)
      expect([n.nature, misses]).toEqual([n.nature, []])
    })
  })

  it('elle DESSINE, et ses parts sont reglables une par une', () => {
    // De bout en bout : le cablage construit les parts, le trace lit leur aspect, et un reglage
    // pose sur UNE part arrive jusqu au DOM.
    const { ctx } = scene()
    const el = sizedContainer()

    const teardown = entree().draw?.(el, ctx)

    expect(el.querySelectorAll('rect.bande').length).toBe(2)
    expect(el.querySelectorAll('text.bande_label').length).toBe(2)
    if (typeof teardown === 'function') teardown()
  })

  it('un reglage pose sur une part SE VOIT au redessin suivant', () => {
    // La chaine entiere, celle qui a coute trois allers-retours a l ecran sur l icone : le reglage
    // est pose sur l ELEMENT, et c est le DOM qu on interroge.
    const { ctx } = scene()
    const premier = sizedContainer()
    const t1 = entree().draw?.(premier, ctx)
    if (typeof t1 === 'function') t1()

    // L auteur regle la couleur du premier secteur, comme il le ferait dans l inspecteur.
    const parts = figurePartsOfScene(ctx)
    parts['a'].shape_color = '#00FF00'

    const second = sizedContainer()
    const t2 = entree().draw?.(second, ctx)

    const bande = second.querySelector('rect.bande[data-part="a"]')
    expect(bande?.getAttribute('fill')).toBe('#00FF00')
    if (typeof t2 === 'function') t2()
  })

  it('TOUCHER UNE PART la selectionne, et l inspecteur le sait', () => {
    // Les gestes 3 et 4 du cablage (os#1475), que la nature n a pas ecrits : elle a seulement
    // branche `on_part_select` sur son clic.
    const { ws, ctx } = scene()
    const el = sizedContainer()
    const teardown = entree().draw?.(el, ctx)
    ctx.app_data.menu_configuration.inspector_focus_is_representation = true

    const bande = el.querySelector('rect.bande[data-part="b"]') as SVGRectElement
    bande.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    const selection = ws.active!.drawing_area.selected_elements_list
    expect(selection.length).toBe(1)
    expect(selection[0].id).toBe('b')
    expect(ctx.app_data.menu_configuration.inspector_focus_is_representation).toBe(false)
    if (typeof teardown === 'function') teardown()
  })

  it('LES DEUX ETAGES DE STYLE sont semes a partir du seul nom de la nature', () => {
    // os#1462. La nature d essai n a declare aucun style : elle s en tient a l etage generique, ce
    // qui est legitime et permet d en ajouter une a la fois.
    const { ctx } = scene()
    const el = sizedContainer()
    const teardown = entree().draw?.(el, ctx)

    // Le style GENERIQUE est seme dans le document de parts, et sa simple presence dans
    // `styles_list` est ce que le selecteur de styles de l inspecteur lit.
    const sankey = figurePartsOfScene(ctx)['a'].drawing_area.sankey
    expect(sankey.styles_list.map((st: { id: string }) => st.id)).toContain(FigurePartStyle)
    // Et PAS ceux des autres natures : offrir « Part de barres » dans la liste d une figure de
    // bandes serait un reglage sans effet, la pire chose a proposer a un auteur (os#1462).
    expect(sankey.styles_list.map((st: { id: string }) => st.id)).not.toContain(BarPartStyle)
    if (typeof teardown === 'function') teardown()
  })
})

// ── Aides de lecture ─────────────────────────────────────────────────────────────────────────

/** Les parts que le depot tient pour cette vignette (cf. `figurePartsRegistry`). */
function figurePartsOfScene(ctx: { window_id?: string, pane_key?: string }) {
  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  const { figurePartsOf } = require('./parts/figurePartsRegistry')
  const held = figurePartsOf(ctx.window_id, ctx.pane_key)
  if (!held) throw new Error('aucun jeu de parts tenu pour cette vignette')
  return held.by_id
}
