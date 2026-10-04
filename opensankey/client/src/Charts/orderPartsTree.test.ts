import { orderParts } from './NodeStatsCharts'

// 30/09/2026 — UNE COURONNE DEPLIEE SE TRIE EN ARBRE, comme ses anneaux. Julien : « la couronne
// reorganise tout dans l ordre croissant, mais quand on desagrege ce n est pas ce qu on veut ».
//
//   racine
//     cereales (40)  -> ble 30, mais 10
//     lait 25
//     viande (35)    -> boeuf 5, porc 30

const part = (label: string, value: number, path: string[], parent_label?: string) =>
  ({ id: label, label, value, path, parent_label })

const parts = [
  part('ble', 30, ['r', 'cereales', 'ble'], 'cereales'),
  part('mais', 10, ['r', 'cereales', 'mais'], 'cereales'),
  part('lait', 25, ['r', 'lait']),
  part('boeuf', 5, ['r', 'viande', 'boeuf'], 'viande'),
  part('porc', 30, ['r', 'viande', 'porc'], 'viande')
]

describe('orderParts sur une couronne depliee', () => {
  test('croissant : les enfants d un meme parent restent cote a cote, les groupes par leur total', () => {
    expect(orderParts(parts, 'value_asc').map(p => p.label))
      .toEqual(['lait', 'boeuf', 'porc', 'mais', 'ble'])
  })

  test('decroissant par categorie : meme regle, a l envers', () => {
    expect(orderParts(parts, 'value_desc_grouped').map(p => p.label))
      .toEqual(['ble', 'mais', 'porc', 'boeuf', 'lait'])
  })

  // 04/10/2026 — Jean-Yves : « par defaut, decroissant toutes categories confondues ».
  test('decroissant (le defaut) : toutes categories confondues', () => {
    expect(orderParts(parts, 'value_desc').map(p => p.label))
      .toEqual(['ble', 'porc', 'lait', 'mais', 'boeuf'])
  })

  test('par nom : les groupes par le nom de leur parent', () => {
    expect(orderParts(parts, 'name').map(p => p.label))
      .toEqual(['ble', 'mais', 'lait', 'boeuf', 'porc'])
  })

  test('une couronne a un seul cran se trie comme avant', () => {
    const flat = [part('a', 3, ['r', 'a']), part('b', 1, ['r', 'b']), part('c', 2, ['r', 'c'])]
    expect(orderParts(flat, 'value_asc').map(p => p.label)).toEqual(['b', 'c', 'a'])
  })
})
