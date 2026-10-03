import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { apercuMixte, niveauDeLaSelection } from './DimensionCut'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1522 — L APERCU D UNE COUPE IRREGULIERE.
//
//   produits > cereales > (ble, mais)
//   produits > lait > (beurre, fromage)

const monter = () => {
  const app = new Class_ApplicationData(false)
  const dim = app.drawing_area.sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const m: { [id: string]: Class_DataTag } = {}
  ;[['produits', undefined], ['cereales', 'produits'], ['ble', 'cereales'], ['mais', 'cereales'],
    ['lait', 'produits'], ['beurre', 'lait'], ['fromage', 'lait']].forEach(([id, parent]) => {
    m[id as string] = dim.addTag(id as string, id as string) as Class_DataTag
    if (parent) m[id as string].parent = m[parent]
  })
  dim.levels = ['0 - Tous', '1 - Filieres', '2 - Produits']
  return dim
}

describe('os#1522 — apercu Mixte', () => {
  test('une coupe d un seul niveau n a pas d apercu', () => {
    const dim = monter()
    expect(apercuMixte(dim, new Set(['cereales', 'lait']))).toBeNull()
    expect(apercuMixte(dim, new Set(['ble', 'mais', 'beurre', 'fromage']))).toBeNull()
  })

  test('cereales depliee, lait non : niveau des filieres, cereales depliee', () => {
    const dim = monter()
    const choisis = new Set(['ble', 'mais', 'lait'])
    expect(niveauDeLaSelection(dim, choisis)).toBeNull()
    const apercu = apercuMixte(dim, choisis)
    expect(apercu?.niveau).toBe(1)
    expect(apercu?.deplies.map(m => m.id)).toEqual(['cereales'])
  })
})
