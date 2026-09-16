import { legendGroupsByPriority, withTopPriority } from './tagGroupPriority'

describe('SA#551 — ordre de priorité des groupes', () => {
  it('ouvrir place le groupe en dernière position, la plus prioritaire', () => {
    expect(withTopPriority(['fiab', 'source', 'type'], 'source')).toEqual(['fiab', 'type', 'source'])
    expect(withTopPriority(['fiab', 'type'], 'type')).toEqual(['fiab', 'type'])
  })

  const g = (id: string) => ({ id })
  const ranks = (r: { [id: string]: number }) => (id: string) => r[id] ?? 0

  it('légende : le plus prioritaire en tête, dans chaque famille', () => {
    const nodes = [g('n1'), g('n2')]
    const flux = [g('f1'), g('f2'), g('f3')]
    expect(legendGroupsByPriority([nodes, flux], ranks({})).map(x => x.id)).toEqual(['n2', 'n1', 'f3', 'f2', 'f1'])
  })

  it('entre familles, le dernier ouvert passe en tête sans défaire l\'ordre de sa famille', () => {
    const nodes = [g('n1')]
    const flux = [g('f1'), g('f2')]
    expect(legendGroupsByPriority([nodes, flux], ranks({ f2: 1 })).map(x => x.id)).toEqual(['f2', 'n1', 'f1'])
    // Un rang d'ouverture ne double jamais un groupe plus prioritaire de sa famille
    expect(legendGroupsByPriority([nodes, flux], ranks({ f1: 2 })).map(x => x.id)).toEqual(['n1', 'f2', 'f1'])
  })
})
