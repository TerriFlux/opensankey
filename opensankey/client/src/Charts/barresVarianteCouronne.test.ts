// os#1511 (Julien, 14/10) — LES BARRES, VARIANTE DE LA COURONNE.
//
// « Les barres font n importe quoi. Pour moi c est une variante des couronnes, elle devrait avoir un
// comportement similaire, notamment l utilisation de la legende et des couleurs pour les labels ; et
// surtout ca devait etre des histogrammes cumules et pas a cote quand on fait du croise. »
//
// Le meme arbre que la couronne (`drawSunburstChart`, `layout: 'bars'`) : une barre par membre de la
// premiere dimension, empilee par la seconde, chaque membre de la seconde a SA couleur dans toutes les
// barres, la legende a cases de la couronne.

import { drawSunburstChart } from './SunburstChart'
import type { Type_SunburstNode, Type_SunburstTree } from './SunburstHierarchy'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const leaf = (parent: string, id: string, label: string, value: number, color: string): Type_SunburstNode => ({
  id: `${parent}/${id}`, label, value, declared: value, color, depth: 1, children: [],
  dimension_id: 'pays', palette: { index: 1, branch_id: id, depth: 0 }
})

const root = (id: string, label: string, kids: [string, string, number, string][]): Type_SunburstNode => {
  const children = kids.map(([kid, name, v, c]) => leaf(id, kid, name, v, c))
  const value = children.reduce((s, c) => s + c.value, 0)
  return {
    id, label, value, declared: value, color: null, depth: 0, children,
    dimension_id: 'filiere', palette: { index: 0, branch_id: id, depth: 0 }
  }
}

const TREE: Type_SunburstTree = {
  dimension_id: 'filiere',
  dimension_label: 'Filiere',
  roots: [
    root('ce', 'Cereales', [['fr', 'France', 60, '#1f77b4'], ['es', 'Espagne', 30, '#ff7f0e']]),
    root('la', 'Lait', [['fr', 'France', 20, '#1f77b4'], ['es', 'Espagne', 10, '#ff7f0e']])
  ],
  rings: [
    { dimension_id: 'filiere', dimension_label: 'Filiere', level_label: '', is_selected_level: true },
    { dimension_id: 'pays', dimension_label: 'Pays', level_label: '', is_selected_level: true }
  ],
  total: 120,
  mismatch_count: 0,
  is_truncated: false
}

afterEach(() => { document.body.innerHTML = '' })

const draw = () => {
  const el = sizedContainer()
  drawSunburstChart(el, TREE, {
    layout: 'bars',
    style: { color_source: 'model', legend_visible: true }
  })
  return el
}

describe('os#1511 les barres croisees sont une couronne depliee', () => {
  test('une barre par membre de la premiere dimension, empilee par la seconde', () => {
    const el = draw()
    const rects = Array.from(el.querySelectorAll('rect.sunburst_bar'))
    // 2 filieres x 2 pays : quatre segments, et pas de barre pour les totaux.
    expect(rects.map(r => r.getAttribute('data-part-id'))).toEqual(['ce/fr', 'ce/es', 'la/fr', 'la/es'])
    // Deux abscisses seulement : les segments d une filiere sont EMPILES, pas cote a cote.
    const xs = new Set(rects.map(r => r.getAttribute('x')))
    expect(xs.size).toBe(2)
    // Le segment du dessus pose sur celui du dessous.
    const [fr, es] = rects.slice(0, 2).map(r => ({ y: Number(r.getAttribute('y')), h: Number(r.getAttribute('height')) }))
    expect(Math.abs(es.y + es.h - fr.y)).toBeLessThan(0.01)
    // Les noms des barres sont ceux de la premiere dimension.
    expect(Array.from(el.querySelectorAll('text.sunburst_bar_name')).map(t => t.childNodes[0]?.textContent)).toEqual(['Cereales', 'Lait'])
  })

  test('un membre de la seconde dimension garde SA couleur dans toutes les barres', () => {
    const el = draw()
    const fill = (id: string) => el.querySelector(`rect[data-part-id="${id}"]`)?.getAttribute('fill')
    expect(fill('ce/fr')).toBe(fill('la/fr'))
    expect(fill('ce/es')).toBe(fill('la/es'))
    expect(fill('ce/fr')).not.toBe(fill('ce/es'))
  })

  test('la legende de la couronne : un bloc par dimension, pastilles aux couleurs des segments', () => {
    const el = draw()
    const text = el.textContent ?? ''
    expect(text).toContain('Pays')
    expect(text).toContain('France')
    expect(text).toContain('Espagne')
  })
})
