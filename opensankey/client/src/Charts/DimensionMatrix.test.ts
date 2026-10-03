import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import { dataCutOf } from './DataDimensionHierarchy'
import {
  buildDimensionMatrix, dimensionMatrixCsv, MATRIX_SORT_LABEL, matrixDecimals, matrixNumberFormatter, nextMatrixSort
} from './DimensionMatrix'
import type { Type_DimensionMatrix } from './DimensionMatrix'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1519 — LE TABLEAU CROISE, sur le cube des tests de la couronne :
//
//   filiere : produits > cereales > (ble, mais)          pays : monde > (fr, de)
//   ble/fr = 10, ble/de = 20, mais/fr = 5, mais/de = 7

function monter(valeurs: [string, string, number][] = [['ble', 'fr', 10], ['ble', 'de', 20], ['mais', 'fr', 5], ['mais', 'de', 7]]) {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = filiere.addTag('Produits', 'produits') as Class_DataTag
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const ble = filiere.addTag('Ble', 'ble') as Class_DataTag
  const mais = filiere.addTag('Mais', 'mais') as Class_DataTag
  cereales.parent = produits
  ble.parent = cereales
  mais.parent = cereales
  filiere.levels = ['produits', 'filieres', 'produit']
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const fr = pays.addTag('France', 'fr') as Class_DataTag
  const de = pays.addTag('Allemagne', 'de') as Class_DataTag
  fr.parent = monde
  de.parent = monde
  pays.levels = ['monde', 'pays']
  const lien = sankey.addNewLink(sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B'))
  valeurs.forEach(([a, b, v]) => {
    ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
    ;(filiere.tags_dict[a] as Class_DataTag).setSelected()
    ;(pays.tags_dict[b] as Class_DataTag).setSelected()
    ;(lien.value as Class_LinkValue).valueData = v
  })
  ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
  produits.setSelected()
  monde.setSelected()
  return { lien: lien as Class_LinkElement }
}

/** Une figure DETACHEE, ouverte comme on le demande. */
const matrice = (
  m: ReturnType<typeof monter>, ouverts: { [dim: string]: string[] }, toggles?: Map<string, boolean>
): Type_DimensionMatrix => buildDimensionMatrix(
  { kind: 'link', link: m.lien },
  dataCutOf(m.lien.sankey, ['filiere', 'pays'], { linked: false, opened: ouverts }),
  { data_tags: null },
  { row_toggles: toggles, residual_label: 'Non reparti', total_label: 'Total', value_label: 'Valeur', share_label: 'Part' }
) as Type_DimensionMatrix

const lignes = (mx: Type_DimensionMatrix) => mx.rows.map(r => [r.label, r.depth, ...r.cells])

describe('os#1519 — tableau croise', () => {
  test('deux dimensions : filieres en lignes avec sous-total, pays en colonnes, et les totaux', () => {
    const mx = matrice(monter(), { filiere: ['produits', 'cereales'], pays: ['monde'] })
    expect(mx.columns.map(c => c.label)).toEqual(['France', 'Allemagne', 'Total'])
    expect(lignes(mx)).toEqual([
      ['Cereales', 0, 15, 27, 42],
      ['Ble', 1, 10, 20, 30],
      ['Mais', 1, 5, 7, 12],
      ['Total', 0, 15, 27, 42]
    ])
    expect(mx.rows[0].expanded).toBe(true)
    expect(mx.rows.find(r => r.kind === 'residual')).toBeUndefined()
  })

  test('le parent declare plus que ses enfants : l ecart se montre en ligne non reparti, colonne par colonne', () => {
    const mx = matrice(
      monter([['ble', 'fr', 10], ['ble', 'de', 20], ['mais', 'fr', 5], ['mais', 'de', 7], ['cereales', 'fr', 20], ['cereales', 'de', 27]]),
      { filiere: ['produits', 'cereales'], pays: ['monde'] }
    )
    expect(lignes(mx)[0]).toEqual(['Cereales', 0, 20, 27, 47])
    const residuel = mx.rows.find(r => r.kind === 'residual')
    expect(residuel?.label).toBe('Non reparti')
    expect(residuel?.cells).toEqual([5, null, 5])
  })

  test('une cellule sans valeur reste vide, elle ne vaut pas zero', () => {
    const mx = matrice(monter([['ble', 'fr', 10], ['ble', 'de', 20], ['mais', 'fr', 5]]), { filiere: ['produits', 'cereales'], pays: ['monde'] })
    expect(lignes(mx).find(l => l[0] === 'Mais')).toEqual(['Mais', 1, 5, null, 5])
  })

  test('une seule dimension decoupe : une colonne de valeurs et la part du total', () => {
    const mx = matrice(monter(), { filiere: ['produits', 'cereales'] })
    expect(mx.columns.map(c => c.label)).toEqual(['Valeur', 'Part'])
    const ble = mx.rows.find(r => r.label === 'Ble')
    expect(ble?.cells[0]).toBe(30)
    expect(ble?.cells[1]).toBeCloseTo(30 / 42, 6)
    expect(mx.rows[mx.rows.length - 1].cells).toEqual([42, 1])
  })

  test('le moins referme une ligne : ses enfants disparaissent, le total ne bouge pas', () => {
    const mx = matrice(monter(), { filiere: ['produits', 'cereales'], pays: ['monde'] }, new Map([['cereales', false]]))
    expect(lignes(mx)).toEqual([['Cereales', 0, 15, 27, 42], ['Total', 0, 15, 27, 42]])
    expect(mx.rows[0].expanded).toBe(false)
    expect(mx.rows[0].has_children).toBe(true)
  })

  test('le tri : Total decroissant par defaut, puis une colonne, puis le libelle', () => {
    const m = monter()
    const ordre = (sort?: { key: string, dir: 'asc' | 'desc' }) => buildDimensionMatrix(
      { kind: 'link', link: m.lien },
      dataCutOf(m.lien.sankey, ['filiere', 'pays'], { linked: false, opened: { filiere: ['produits', 'cereales'], pays: ['monde'] } }),
      { data_tags: null }, { sort }
    )?.rows.filter(r => r.depth === 1).map(r => r.label)
    expect(ordre()).toEqual(['Ble', 'Mais'])
    expect(ordre({ key: 'c:fr', dir: 'asc' })).toEqual(['Mais', 'Ble'])
    expect(ordre({ key: MATRIX_SORT_LABEL, dir: 'desc' })).toEqual(['Mais', 'Ble'])
    expect(nextMatrixSort({ key: 'c:__total__', dir: 'desc' }, 'c:__total__')).toEqual({ key: 'c:__total__', dir: 'asc' })
    expect(nextMatrixSort({ key: 'c:__total__', dir: 'desc' }, MATRIX_SORT_LABEL)).toEqual({ key: MATRIX_SORT_LABEL, dir: 'asc' })
  })

  test('les nombres : des decimales fixes qui gardent cinq chiffres au total, et moins de la resolution', () => {
    expect(matrixDecimals(59.317)).toBe(3)
    expect(matrixDecimals(59317)).toBe(0)
    expect(matrixDecimals(0.42)).toBe(4)
    const f = matrixNumberFormatter(3, 'fr')
    expect(f(2.13)).toBe('2,130')
    expect(f(0)).toBe('0,000')
    expect(f(0.000003)).toBe('< 0,001')
  })

  test('le CSV : point-virgule, virgule decimale, unite dans l en-tete, retrait des sous-niveaux', () => {
    const mx = matrice(monter(), { filiere: ['produits', 'cereales'], pays: ['monde'] })
    const csv = dimensionMatrixCsv(mx, { decimal: ',', factor: 10, unit: 'Mt' }).split('\r\n')
    expect(csv[0]).toBe('Filiere;France (Mt);Allemagne (Mt);Total (Mt)')
    expect(csv[2]).toBe('  Ble;1;2;3')
    expect(csv[1]).toBe('Cereales;1,5;2,7;4,2')
  })
})
