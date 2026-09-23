// os#1502 — LA VALEUR COLLEE AU NOM PORTE SA PROPRE TYPOGRAPHIE.
//
// Julien, capture a l appui : « ces parametres pour la valeur ne marchent pas », puis « ni la
// police, ni bold, ni italique ».
//
// Le nom et la valeur partagent UN texte quand la valeur y est collee (os#1470), et ce texte
// portait la typographie du NOM : regler celle de la valeur etait un geste sans effet. Le commentaire
// du trace disait meme que c etait inevitable — « ils ne peuvent pas avoir deux polices » — et c est
// faux : un `tspan` porte sa police, sa graisse, son style et son encre. Ce qui manquait etait de
// savoir QUELLE LIGNE est la valeur.
//
// ⚠️ ET SEULEMENT CE QUE LA PART EN DIT : rien de dit, rien de pose. Une couronne enregistree garde
// le texte d hier, au pixel — c est le dernier cas de ce fichier.

import { drawDonutChart } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { buildParts } from '../Representations/parts/buildParts'
import { Class_ApplicationData } from '../types/ApplicationData'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

const STYLE = {
  ...DONUT_STYLE_DEFAULTS, name_label_is_visible: true, value_label_is_visible: true
}

/** Pose une cle que la classe ne declare pas en TypeScript mais qu elle porte a l execution. */
const setAttr = (part: object, key: string, value: unknown) => {
  (part as { [k: string]: unknown })[key] = value
}

/** Les `tspan` du secteur « Ble » : leur texte et les attributs qu ils portent en propre. */
const lignes = (reglages: { [key: string]: unknown }) => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  const figure = buildParts(doc, PARTS, undefined, 'donut')
  Object.entries(reglages).forEach(([k, v]) => setAttr(figure.by_id.a, k, v))
  const resolver = partAspectResolver(
    STYLE as never, figure.by_id as unknown as { [id: string]: Type_FigurePart }
  )
  const el = sizedContainer()
  drawDonutChart(el, PARTS, { style: STYLE as never, part_aspect: resolver })
  const out = Array.from(el.querySelectorAll('text.node_stats_pct tspan')).map(t => ({
    texte: t.textContent ?? '',
    taille: t.getAttribute('font-size'),
    graisse: t.getAttribute('font-weight'),
    style: t.getAttribute('font-style'),
    police: t.getAttribute('font-family')
  }))
  el.remove()
  figure.document.dispose()
  return out
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1502 la valeur dun secteur a sa propre typographie', () => {

  it('LA TAILLE de la valeur agit, et celle du nom ne bouge pas', () => {
    // Quatre lignes : deux secteurs, chacun son nom puis sa valeur (le bloc colle d os#1470).
    const av = lignes({ value_label_font_size: 31 })
    expect(av.map(l => l.texte)).toEqual(['Ble', '60%', 'Mais', '40%'])

    expect(av[1].taille).toBe('31')
    // DEUX CONTRE-VERIFICATIONS : le nom du meme secteur ne bouge pas — sans quoi poser la taille
    // sur TOUT le bloc passerait au vert —, et l autre secteur non plus : un reglage de part ne
    // vaut que pour elle.
    expect(av[0].taille).toBeNull()
    expect(av[3].taille).toBeNull()
  })

  it('LE GRAS ET L ITALIQUE aussi, et c est la plainte a la lettre', () => {
    const av = lignes({ value_label_bold: true, value_label_italic: true })

    expect(av[1].graisse).toBe('bold')
    expect(av[1].style).toBe('italic')
    expect(av[0].graisse).toBeNull()
    expect(av[3].graisse).toBeNull()
  })

  it('LA POLICE aussi', () => {
    const av = lignes({ value_label_font_family: 'Georgia' })

    expect(av[1].police).toBe('Georgia')
    expect(av[0].police).toBeNull()
  })

  it('RIEN DE DIT, RIEN DE POSE : une couronne enregistree ne bouge pas', () => {
    // LA GARANTIE. `null` chez d3 RETIRE l attribut : le bloc garde la typographie du nom, qui est
    // le dessin d hier.
    const av = lignes({})

    expect(av).toHaveLength(4)
    av.forEach(l => {
      expect([l.taille, l.graisse, l.style, l.police]).toEqual([null, null, null, null])
    })
  })
})
