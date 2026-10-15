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

const root = (id: string, label: string, color: string, kids: [string, string, number, string][]): Type_SunburstNode => {
  const children = kids.map(([kid, name, v, c]) => leaf(id, kid, name, v, c))
  const value = children.reduce((s, c) => s + c.value, 0)
  return {
    id, label, value, declared: value, color, depth: 0, children,
    dimension_id: 'filiere', palette: { index: 0, branch_id: id, depth: 0 }
  }
}

const TREE: Type_SunburstTree = {
  dimension_id: 'filiere',
  dimension_label: 'Filiere',
  roots: [
    root('ce', 'Cereales', '#2ca02c', [['fr', 'France', 60, '#1f77b4'], ['es', 'Espagne', 30, '#ff7f0e']]),
    root('la', 'Lait', '#d62728', [['fr', 'France', 20, '#1f77b4'], ['es', 'Espagne', 10, '#ff7f0e']])
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

  test('les couleurs sont celles des membres du Sankey, pas celles du sunburst', () => {
    // Julien, 14/10 : « la legende ne suit pas la couleur des datatags hierarchiques du Sankey ».
    const el = draw()
    expect(el.querySelector('rect[data-part-id="ce/fr"]')?.getAttribute('fill')).toBe('#1f77b4')
    expect(el.querySelector('rect[data-part-id="ce/es"]')?.getAttribute('fill')).toBe('#ff7f0e')
    // La premiere dimension aussi : la pastille de Cereales est son vert, pas un gris de famille.
    const pastilles = Array.from(el.querySelectorAll('.legend_swatch_holder')).map(h => h.innerHTML).join(' ')
    expect(pastilles).toContain('#2ca02c')
    expect(pastilles).toContain('#1f77b4')
  })

  test('trois dimensions : les segments sont la seconde, la troisieme se somme dedans', () => {
    // Julien, 15/10 : « toujours vert ». Filiere vegetale x filiere animale x postes : les feuilles
    // etaient les postes (un seul, vert) ; les segments sont la filiere animale.
    const poste = (parent: string): Type_SunburstNode => ({
      id: `${parent}/elevage`, label: 'Elevage', value: 0, declared: 0, color: '#008080', depth: 2, children: [],
      dimension_id: 'poste', palette: { index: 2, branch_id: 'elevage', depth: 0 }
    })
    const tree: Type_SunburstTree = {
      ...TREE,
      roots: TREE.roots.map(r => ({
        ...r,
        children: r.children.map(c => ({ ...c, children: [{ ...poste(c.id), value: c.value, declared: c.value }] }))
      })),
      rings: [...TREE.rings, { dimension_id: 'poste', dimension_label: 'Postes', level_label: '', is_selected_level: true }]
    }
    const el = sizedContainer()
    drawSunburstChart(el, tree, { layout: 'bars', style: { color_source: 'model', legend_visible: true } })
    const rects = Array.from(el.querySelectorAll('rect.sunburst_bar'))
    expect(rects.map(r => r.getAttribute('data-part-id'))).toEqual(['ce/fr', 'ce/es', 'la/fr', 'la/es'])
    expect(rects.map(r => r.getAttribute('fill'))).toEqual(['#1f77b4', '#ff7f0e', '#1f77b4', '#ff7f0e'])
  })

  test('les barres vont de la plus grande a la plus petite', () => {
    // Julien, 15/10 : « l ordre des barres devrait etre du plus grand au plus petit ».
    const el = sizedContainer()
    drawSunburstChart(el, { ...TREE, roots: [...TREE.roots].reverse() }, { layout: 'bars', style: { color_source: 'model' } })
    const noms = Array.from(el.querySelectorAll('text.sunburst_bar_name')).map(t => t.childNodes[0]?.textContent)
    expect(noms).toEqual(['Cereales', 'Lait'])
  })

  test('dans une barre, le segment le plus grand est en bas', () => {
    // Julien, 15/10 : « pareil verticalement, la plus grande en bas ».
    const el = sizedContainer()
    const inverse = { ...TREE, roots: TREE.roots.map(r => ({ ...r, children: [...r.children].reverse() })) }
    drawSunburstChart(el, inverse, { layout: 'bars', style: { color_source: 'model' } })
    const segs = Array.from(el.querySelectorAll('rect.sunburst_bar'))
      .filter(r => (r.getAttribute('data-part-id') ?? '').startsWith('ce/'))
      .map(r => ({ id: r.getAttribute('data-part-id'), y: Number(r.getAttribute('y')) }))
    // France (60) sous Espagne (30) : plus bas a l ecran = y plus grand.
    const fr = segs.find(s => s.id === 'ce/fr')
    const es = segs.find(s => s.id === 'ce/es')
    expect((fr?.y ?? 0) > (es?.y ?? 0)).toBe(true)
  })
})

