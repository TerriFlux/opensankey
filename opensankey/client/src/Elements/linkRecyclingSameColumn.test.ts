import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * Flux de recyclage entre deux nœuds de la MÊME colonne (x égaux) : c'est le recyclage
 * ordinaire, il part vers l'avant (droite de la source) et revient par l'arrière (gauche de la
 * cible). Avec une comparaison `<=`, l'égalité le faisait partir à gauche — démo Déchets,
 * « Refus criblage » du site de compostage vers le centre d'incinération, vue agrégée.
 */
function study(x_source: number, x_target: number): Type_JSON {
  const node = (id: string, x: number, y: number) => ({
    idNode: id, name: id, display: true, tags: {}, dimensions: {},
    inputLinksId: [], outputLinksId: [], x, y
  })
  return {
    version: '0.8',
    nodes: {
      compostage: node('compostage', x_source, 800),
      incineration: node('incineration', x_target, 100)
    },
    links: {
      refus: {
        idLink: 'refus', idSource: 'compostage', idTarget: 'incineration',
        value: { value: 1, tags: {}, extension: {} },
        local: { recycling: true }
      }
    },
    nodeTags: {}, dataTags: {}, fluxTags: {}, levelTags: {}
  } as unknown as Type_JSON
}

function refus(x_source: number, x_target: number) {
  const app = new Class_ApplicationData(false)
  app.fromJSON(study(x_source, x_target) as never, {}, false)
  return app.drawing_area.sankey.links_list.find(l => l.source.id === 'compostage')!
}

it('meme colonne : le recyclage part a droite et revient par la gauche', () => {
  const link = refus(1473, 1473)
  expect(link.shape_is_recycling).toBe(true)
  expect(link.source_side).toBe('right')
  expect(link.target_side).toBe('left')
})

it('cible en arriere : meme sens', () => {
  const link = refus(1500, 1400)
  expect(link.source_side).toBe('right')
  expect(link.target_side).toBe('left')
})

it('cible strictement en avant : boucle inversee, inchangee', () => {
  const link = refus(1400, 1500)
  expect(link.source_side).toBe('left')
  expect(link.target_side).toBe('right')
})
