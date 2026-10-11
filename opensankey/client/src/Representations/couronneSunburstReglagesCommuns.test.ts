// os#1527 (11/10/2026) — LA COURONNE ET SON MODE SUNBURST PARTAGENT LEURS RÉGLAGES.
//
// Julien : « le mode sunburst et couronne ne partagent pas les paramètres, par exemple sur le
// positionnement du libellé. Par ailleurs le mode sunburst devrait réduire la taille du centre,
// sinon ça fait des couronnes trop étroites. »
//
// Ce fichier tient les trois promesses du lot :
//   1. un réglage COMMUN posé dans un mode s'applique dans l'autre (une clé, deux lectures d'accord) ;
//   2. les anciennes clés doublons se relisent (`upgradeLegacyFigureKeys`) ;
//   3. le sunburst a SON trou, plus petit que celui de la couronne à plat.

import { couronneRingsStyle } from './couronneRingsStyle'
import { figureDrawsSunburst } from './couronneSunburstMode'
import { upgradeLegacyFigureKeys } from './figureLegacyKeys'
import { DONUT_ATTRIBUTES, BARS_ATTRIBUTES } from './analysisFigureAttributes'
import { DONUT_STYLE_DEFAULTS, figureChartStyleOf } from '../Charts/figureChartStyle'
import { drawDonutChart } from '../Charts/NodeStatsCharts'
import { drawSunburstChart } from '../Charts/SunburstChart'
import { givePlainDrawingEnvironment, sizedContainer, plainSunburstTree } from '../Charts/figureDomHarness.test-utils'

givePlainDrawingEnvironment()
afterEach(() => { document.body.innerHTML = '' })

type Bag = { [key: string]: unknown }

/** Les réglages effectifs d'une couronne neuve : ce que `Class_Figure.attributes` rend sans surcharge. */
const usine = (): Bag => {
  const out: Bag = {}
  Object.entries(DONUT_ATTRIBUTES).forEach(([k, a]) => { if (a.default !== undefined) out[k] = a.default })
  return out
}
/** Le sac tel que l'auteur l'a réglé, lu comme les deux tracés le lisent. */
const lu = (bag: Bag) => {
  const style = figureChartStyleOf(bag, DONUT_STYLE_DEFAULTS)
  return { style, rings: couronneRingsStyle(bag, style) }
}
const visible = (key: string, bag: Bag): boolean => {
  const ui = DONUT_ATTRIBUTES[key]?.ui as { visibleIf?: (o: Bag) => boolean } | undefined
  return ui?.visibleIf ? ui.visibleIf(bag) : true
}

const PARTS = [
  { id: 'a', label: 'Ble', value: 1 },
  { id: 'b', label: 'Mais', value: 1 },
  { id: 'c', label: 'Orge', value: 1 },
  { id: 'd', label: 'Avoine', value: 1 }
]

describe('un reglage commun pose dans un mode vaut dans l autre', () => {
  it('l orientation du libelle posee en couronne s ecrit pareil en sunburst', () => {
    const bag = { ...usine(), levels_display: 'in_place', name_label_orientation: 'radial' }
    expect(lu(bag).style.name_label_orientation).toBe('radial')
    // Le meme sac, passe en sunburst : rien n'a ete reecrit, et le disque tourne pareil.
    expect(lu({ ...bag, levels_display: 'rings' }).rings.label_orientation).toBe('radial')
  })

  it('et reciproquement : posee en sunburst, la couronne a plat la dessine', () => {
    const bag = { ...usine(), levels_display: 'rings', name_label_orientation: 'tangential' }
    expect(lu(bag).rings.label_orientation).toBe('tangential')
    const { style } = lu({ ...bag, levels_display: 'in_place' })
    const el = sizedContainer()
    drawDonutChart(el, PARTS, { style: { ...style, labels_small: 'show' } })
    const transforms = Array.from(el.querySelectorAll('text.node_stats_pct')).map(t => t.getAttribute('transform') ?? '')
    expect(transforms.length).toBeGreaterThan(0)
    // Le long de l'arc : chaque etiquette pivote, aucune ne reste droite.
    transforms.forEach(t => expect(t).toMatch(/rotate\(/))
  })

  it('une couronne neuve ecrit droit dans les deux modes : un seul defaut, annonce une fois', () => {
    expect(DONUT_ATTRIBUTES['name_label_orientation']?.default).toBe('horizontal')
    expect(lu({ ...usine(), levels_display: 'rings' }).rings.label_orientation).toBe('horizontal')
    expect(lu({ ...usine() }).style.name_label_orientation).toBe('horizontal')
  })

  it('la sortie des etiquettes : « Detacher » vaut dans les deux modes', () => {
    const bag = { ...usine(), labels_small: 'radial' }
    expect(lu(bag).style.labels_small).toBe('radial')
    expect(lu({ ...bag, levels_display: 'rings' }).rings.labels_small).toBe('radial')
  })

  it('« Masquer si ca depasse » decoche ne fait plus tout ecrire tronque en sunburst', () => {
    // Avant : decoche (le defaut) donnait `labels_mode: 'always'` au disque — tout s'ecrivait, coupe
    // de points de suspension, et rien ne se detachait. La regle de la couronne decide maintenant.
    const { rings } = lu({ ...usine(), levels_display: 'rings', name_label_prune_if_unfitting: false })
    expect(rings.labels_mode).toBe('fit')
    expect(rings.labels_small).toBe('detach')
  })

  it('police, valeur et legende : la meme lecture des deux cotes', () => {
    const bag = {
      ...usine(), levels_display: 'rings', name_label_font_size: 19, name_label_bold: true,
      value_label_percent: 'total', legend_position: 'bottom', legend_width: 300, parts_group_under: 4
    }
    const { style, rings } = lu(bag)
    expect(rings.font_size).toBe(style.name_label_font_size)
    expect(rings.bold).toBe(true)
    expect(rings.label_percent).toBe('total')
    expect(rings.legend_position).toBe('bottom')
    expect(rings.legend_width).toBe(300)
    expect(rings.others_threshold).toBe(4)
  })
})

describe('les anciennes cles se relisent', () => {
  const couronne = (k: string) => k in DONUT_ATTRIBUTES
  const barres = (k: string) => k in BARS_ATTRIBUTES

  it('l ancien « dehors » de figure devient « Detacher » sur une couronne', () => {
    expect(upgradeLegacyFigureKeys({ name_label_callout: true }, couronne)).toEqual({ labels_small: 'detach' })
    expect(upgradeLegacyFigureKeys({ name_label_callout: false }, couronne)).toEqual({})
    // Un choix deja pose l'emporte.
    expect(upgradeLegacyFigureKeys({ name_label_callout: true, labels_small: 'hide' }, couronne))
      .toEqual({ labels_small: 'hide' })
  })

  it('mais pas sur des barres, ou la cle garde son sens', () => {
    const bag = { name_label_callout: true }
    expect(upgradeLegacyFigureKeys(bag, barres)).toBe(bag)
  })

  it('un trou regle sur une figure enregistree en sunburst devient le trou du sunburst', () => {
    expect(upgradeLegacyFigureKeys({ levels_display: 'rings', centre_hole: 40 }, couronne))
      .toEqual({ levels_display: 'rings', centre_hole: 40, centre_hole_rings: 40 })
    // En place, le trou reste celui de la couronne, et rien ne s'ajoute.
    const flat = { levels_display: 'in_place', centre_hole: 40 }
    expect(upgradeLegacyFigureKeys(flat, couronne)).toBe(flat)
  })

  it('la couronne n offre plus le doublon', () => {
    expect(visible('name_label_callout', { ...usine(), name_label_is_visible: true })).toBe(false)
  })
})

describe('le sunburst a un centre plus petit que la couronne', () => {
  it('par defaut, 25 % du rayon contre 55 %', () => {
    const { style, rings } = lu({ ...usine(), levels_display: 'rings' })
    expect(rings.centre_hole).toBe(25)
    expect(style.centre_hole).toBe(55)
    expect(rings.centre_hole as number).toBeLessThan(style.centre_hole)
  })

  it('une couronne emboitee en place garde le trou de la couronne', () => {
    expect(lu({ ...usine(), levels_display: 'in_place' }).rings.centre_hole).toBe(55)
  })

  it('chaque trou ne s offre que dans son mode', () => {
    const rings = { ...usine(), levels_display: 'rings' }
    const flat = { ...usine(), levels_display: 'in_place' }
    expect(visible('centre_hole_rings', rings)).toBe(true)
    expect(visible('centre_hole', rings)).toBe(false)
    expect(visible('centre_hole_rings', flat)).toBe(false)
    expect(visible('centre_hole', flat)).toBe(true)
    // Une seule dimension en sunburst suffit.
    expect(figureDrawsSunburst({ levels_display: 'in_place', levels_display_by: { pays: 'rings' } })).toBe(true)
  })

  it('le disque dessine bien un trou plus petit', () => {
    const rayonDuTrou = (bag: Bag): number => {
      const el = sizedContainer(500)
      drawSunburstChart(el, plainSunburstTree(PARTS), { style: lu(bag).rings })
      const r = Math.max(...Array.from(el.querySelectorAll('circle')).map(c => Number(c.getAttribute('r') ?? 0)))
      el.remove()
      return r
    }
    const sunburst = rayonDuTrou({ ...usine(), levels_display: 'rings' })
    const emboitee = rayonDuTrou({ ...usine(), levels_display: 'in_place' })
    expect(sunburst).toBeGreaterThan(0)
    expect(sunburst).toBeLessThan(emboitee * 0.6)
  })
})
