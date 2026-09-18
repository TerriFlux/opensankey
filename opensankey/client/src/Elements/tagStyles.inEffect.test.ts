import { layerOwnersInEffect } from './tagStyles'

describe('SA#551 — couches en vigueur', () => {
  type S = { keys: string[] }
  const layer = (owner: string, keys: string[]) => ({ style: { keys } as S, owner, from_group: false })
  const owners = (layers: ReturnType<typeof layer>[]) => [...layerOwnersInEffect(layers, s => s.keys)].sort()

  it('une couche dont tous les paramètres sont redéfinis plus haut n\'est pas en vigueur', () => {
    // de la moins à la plus prioritaire
    expect(owners([layer('methode', ['shape_color']), layer('source', ['shape_color'])])).toEqual(['source'])
  })

  it('des paramètres différents : les deux sont en vigueur', () => {
    expect(owners([layer('fiabilite', ['shape_opacity']), layer('source', ['shape_color'])])).toEqual(['fiabilite', 'source'])
  })

  it('un seul paramètre encore visible suffit', () => {
    expect(owners([layer('type', ['shape_color', 'shape_border_visible']), layer('source', ['shape_color'])]))
      .toEqual(['source', 'type'])
  })
})
