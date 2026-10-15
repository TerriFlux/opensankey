import { buildFluxMatrix } from './FluxMatrix'
import { MATRIX_SORT_LABEL } from './DimensionMatrix'

const m = (id: string) => ({ id, label: id })
const OPTS = { row_label: 'Sources', column_label: 'Cibles', total_label: 'Total' }

describe('buildFluxMatrix — os#1530', () => {
  it('croise les sources et les cibles, somme les doublons, laisse vide ce qui n a pas de flux', () => {
    const matrix = buildFluxMatrix([
      { row: m('Wages'), col: m('Housing'), value: 420 },
      { row: m('Wages'), col: m('Food'), value: 300 },
      { row: m('Other'), col: m('Food'), value: 100 },
      { row: m('Other'), col: m('Food'), value: 50 },
    ], OPTS)
    expect(matrix.columns.map(c => c.label)).toEqual(['Housing', 'Food', 'Total'])
    // Tri par defaut : Total decroissant, la ligne Total en dernier.
    expect(matrix.rows.map(r => r.label)).toEqual(['Wages', 'Other', 'Total'])
    expect(matrix.rows[0].cells).toEqual([420, 300, 720])
    expect(matrix.rows[1].cells).toEqual([null, 150, 150])
    expect(matrix.rows[2].cells).toEqual([420, 450, 870])
    expect(matrix.rows[2].kind).toBe('total')
    expect(matrix.row_dimension.label).toBe('Sources')
  })

  it('trie par une colonne ou par le libelle', () => {
    const cells = [
      { row: m('B'), col: m('X'), value: 1 },
      { row: m('A'), col: m('X'), value: 5 },
      { row: m('C'), col: m('X'), value: 3 },
    ]
    expect(buildFluxMatrix(cells, { ...OPTS, sort: { key: 'c:X', dir: 'asc' } }).rows.map(r => r.label))
      .toEqual(['B', 'C', 'A', 'Total'])
    expect(buildFluxMatrix(cells, { ...OPTS, sort: { key: MATRIX_SORT_LABEL, dir: 'asc' } }).rows.map(r => r.label))
      .toEqual(['A', 'B', 'C', 'Total'])
    // Une cle inconnue retombe sur le Total.
    expect(buildFluxMatrix(cells, { ...OPTS, sort: { key: 'c:nope', dir: 'desc' } }).sort.key).toBe('c:__total__')
  })

  it('une somme d absences reste absente', () => {
    const matrix = buildFluxMatrix([{ row: m('A'), col: m('X'), value: null }], OPTS)
    expect(matrix.rows[0].cells).toEqual([null, null])
    expect(matrix.rows[1].cells).toEqual([null, null])
  })
})
