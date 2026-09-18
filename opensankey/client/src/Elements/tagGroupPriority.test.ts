import { legendGroupsByPriority } from './tagGroupPriority'

describe('SA#551 — ordre de priorite des groupes', () => {
  const g = (id: string) => ({ id })

  it('legende : le plus prioritaire (le plus bas de la liste) en tete, famille par famille', () => {
    const nodes = [g('n1'), g('n2')]
    const flux = [g('f1'), g('f2'), g('f3')]
    expect(legendGroupsByPriority([nodes, flux]).map(x => x.id)).toEqual(['n2', 'n1', 'f3', 'f2', 'f1'])
  })

  it('une famille vide ne change rien', () => {
    expect(legendGroupsByPriority([[], [g('f1')]]).map(x => x.id)).toEqual(['f1'])
  })
})
