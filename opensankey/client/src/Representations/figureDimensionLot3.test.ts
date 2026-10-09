import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import { buildDimensionMatrix, matrixInputOfPlan } from '../Charts/DimensionMatrix'
import type { Type_DimensionMatrix } from '../Charts/DimensionMatrix'
import { drawDimensionMatrixTable } from '../Charts/DimensionMatrixTable'
import { chooseLegendDimensionTag } from '../components/panels/presentation/legendDimensionChoice'
import { couronneGesturesOf, type Type_CouronneGestures } from './couronneGestures'
import { COURONNE_KEY } from './couronneState'
import { fromFigure, planFor } from './dimensionViewState'
import type { Type_MatrixPlan } from './dimensionViewState'

// 09/10/2026 — os#1511, rationalisation, lot 3 : UN ECRIVAIN (les gestes gardent les variantes des
// autres representations), UN GESTE DECOCHER (legende du Sankey comprise), les DECOCHES du tableau.

type Bag = { [k: string]: unknown }

const monter = (options: Bag, reader: 'couronne' | 'matrix' = 'couronne') => {
  const s = monterSocle()
  const app = s.app as unknown as { runHeavyGesture: (w: () => void) => void }
  app.runHeavyGesture = (w: () => void) => w()
  const box = { options }
  const g = (): Type_CouronneGestures => couronneGesturesOf({
    app: s.app, options: box.options, declared: ['filiere', 'pays'], write: o => { box.options = o }, reader
  }) as Type_CouronneGestures
  return { s, box, g }
}
const det = { descriptor: descripteur('filiere', 'pays'), coordinates_linked: false }
const ouverts = { ...det, dimension_opening: { filiere: ['produits'], pays: ['monde'] } }

describe('os#1511 lot 3 — un seul ecrivain', () => {
  test('un geste de couronne garde la variante Sankey choisie dans la meme fenetre', () => {
    const m = monter(ouverts)
    m.g().showLevel('pays', 1)
    const bag = m.box.options[COURONNE_KEY] as { dims: { [id: string]: Bag } }
    bag.dims.filiere.variants = { sankey: 'nodes' }
    m.g().showLevel('pays', 2)
    const after = m.box.options[COURONNE_KEY] as { dims: { [id: string]: Bag } }
    expect(after.dims.filiere.variants).toMatchObject({ sankey: 'nodes' })
    expect(fromFigure(m.box.options, undefined, m.s.sankey).dims.filiere.variants.sankey).toBe('nodes')
  })
})

describe('os#1511 lot 3 — decocher depuis la legende du Sankey', () => {
  test('decocher garde le membre en decoche, le recocher le rend', () => {
    const m = monter(ouverts)
    m.s.filiere.banner = 'multi'
    chooseLegendDimensionTag(m.s.app, m.s.filiere, 'lait')
    expect(m.s.filiere.hidden_ids).toEqual(['lait'])
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['cereales', 'viande'])
    chooseLegendDimensionTag(m.s.app, m.s.filiere, 'lait')
    expect(m.s.filiere.hidden_ids).toEqual([])
    expect(m.s.filiere.selected_tags_list.map(t => t.id).sort()).toEqual(['cereales', 'lait', 'viande'])
  })
})

describe('os#1511 lot 3 — les decoches du tableau croise', () => {
  const tableau = (options: Bag, m: ReturnType<typeof monter>): Type_DimensionMatrix => {
    const view = fromFigure(options, undefined, m.s.sankey, ['filiere', 'pays'], 'matrix')
    const plan = planFor(view, 'matrix', m.s.sankey).plan as Type_MatrixPlan
    const input = matrixInputOfPlan(plan, m.s.sankey)
    return buildDimensionMatrix({ kind: 'link', link: m.s.lien }, { linked: false, dims: [], dividing: [], opened: new Set<string>() },
      { data_tags: null }, { axes: { rows: input.rows, columns: input.columns }, coordinates: input.coordinates, total_label: 'Total' }
    ) as Type_DimensionMatrix
  }
  test('un decoche garde sa ligne, grisee, hors du Total ; sa case le rend', () => {
    const m = monter({ ...ouverts, dimension_opening: { filiere: ['produits'] } }, 'matrix')
    const avant = tableau(m.box.options, m)
    const total = (mx: Type_DimensionMatrix) => mx.rows[mx.rows.length - 1].cells[0] as number
    const lait = (mx: Type_DimensionMatrix) => mx.rows.find(r => r.member_id === 'lait')
    m.g().toggleHidden('filiere', 'lait', false)
    const apres = tableau(m.box.options, m)
    expect(lait(apres)).toMatchObject({ hidden: true })
    expect(total(apres)).toBeCloseTo(total(avant) - (lait(avant)?.cells[0] as number))
    // La case du tableau dessine l etat, et la cocher rappelle le geste.
    const host = document.createElement('div')
    const coches: [string, boolean][] = []
    drawDimensionMatrixTable(host, apres, {
      format: v => String(v), format_share: v => String(v), title: 'T', unit: '',
      labels: { expand: '+', collapse: '-', export_xlsx: 'x', export_csv: 'c', empty: 'vide' },
      on_toggle: () => undefined, on_export: () => undefined, on_sort: () => undefined, sort_label: 'Trier',
      on_check: (id, checked) => coches.push([id, checked])
    })
    const box = host.querySelector('tr[data-member-id="lait"] input.dimension_matrix_check') as HTMLInputElement
    expect(box.checked).toBe(false)
    box.checked = true
    box.dispatchEvent(new Event('change'))
    expect(coches).toEqual([['lait', true]])
    m.g().toggleHidden('filiere', 'lait', true)
    expect(lait(tableau(m.box.options, m))?.hidden).toBeUndefined()
  })
})
