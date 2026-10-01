import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { isGeneratedMemberLink } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511, 30/09 — LA SELECTION SURVIT AU REBATI DES NOEUDS DE MEMBRE.
//
// Julien : « quand je clique dans la couronne pour desagreger Cereales transformees, ca desagrege
// dans le diagramme mais ca ferme la couronne ». La couronne portait sur un flux ENGENDRE ; le
// rebati refait tous les engendres, la selection perdait son flux et la fenetre qui la suit se
// fermait.

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const cereale = sankey.addDataTagGroup('cereale', 'Cereale', false) as unknown as Class_DataTagGroup
  const toutes = cereale.addTag('Toutes', 'toutes') as Class_DataTag
  const orge = cereale.addTag('Orge', 'orge') as Class_DataTag
  const mais = cereale.addTag('Mais', 'mais') as Class_DataTag
  orge.parent = toutes
  mais.parent = toutes
  cereale.levels = ['ensemble', 'cereales']
  const collecte = sankey.addNewNodeWithName('Collecte')
  const usages = sankey.addNewNodeWithName('Usages')
  const flux = sankey.addNewLink(collecte, usages)
  const poser = (m: Class_DataTag, v: number) => {
    cereale.tags_list.forEach(t => t.setUnSelected())
    m.setSelected()
    ;(flux.value as Class_LinkValue).valueData = v
  }
  poser(orge, 100)
  poser(mais, 60)
  cereale.selectAllAtLevel(1)
  collecte.driving_dimension = cereale
  app.drawing_area.rebuildDimensionNodes()
  return { app, sankey, cereale, flux }
}

describe('os#1511 — la selection survit au rebati des noeuds de membre', () => {
  test('un flux engendre refait sous le meme identifiant reste selectionne', () => {
    const { app, sankey } = monter()
    const engendre = sankey.links_list.find(isGeneratedMemberLink)
    expect(engendre).toBeDefined()
    app.drawing_area.addElementToSelection(engendre!)
    app.drawing_area.rebuildDimensionNodes()
    const apres = app.drawing_area.selected_links_list
    expect(apres.map(l => l.id)).toEqual([engendre!.id])
    // C est le NOUVEL objet, celui du graphe, et non l ancien supprime.
    expect(apres[0]).toBe(sankey.links_dict[engendre!.id])
  })

  test('un flux engendre qui disparait cede la place a son flux d origine', () => {
    const { app, sankey, cereale, flux } = monter()
    const engendre = sankey.links_list.find(isGeneratedMemberLink)
    app.drawing_area.addElementToSelection(engendre!)
    cereale.selectAllAtLevel(0)
    app.drawing_area.rebuildDimensionNodes()
    expect(app.drawing_area.selected_links_list.map(l => l.id)).toEqual([flux.id])
  })
})
