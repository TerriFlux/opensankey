import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_NodeElement } from '../Elements/Node'
import { isGeneratedMemberNode } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 08/10 : « le link_idx (output ou input links) ne semble pas respecte ». Les flux
// engendres d un noeud suivent l ordre des flux de son axe, tel que l auteur l a regle.

test('les flux d un noeud engendre suivent l ordre des flux de son axe', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as unknown as Class_DataTagGroup
  const ce = filiere.addTag('Cereales', 'ce') as Class_DataTag
  const la = filiere.addTag('Lait', 'la') as Class_DataTag
  const mp = sankey.addNewNodeWithName('MP')
  const emplois = sankey.addNewNodeWithName('Emplois')
  const transfo = sankey.addNewNodeWithName('Transformation')
  const vers_emplois = sankey.addNewLink(mp, emplois)
  const vers_transfo = sankey.addNewLink(mp, transfo)
  ;[vers_emplois, vers_transfo].forEach(flux => [ce, la].forEach((m, i) => {
    filiere.tags_list.forEach(t => t.setUnSelected())
    m.setSelected()
    ;(flux.value as Class_LinkValue).valueData = 10 + i
  }))
  filiere.tags_list.forEach(t => t.setSelected())
  // L auteur met Transformation AVANT Emplois.
  mp.applyLinksOrder([vers_transfo.id, vers_emplois.id])
  mp.driving_dimension = filiere
  app.drawing_area.rebuildDimensionNodes()
  sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => n.id.startsWith(mp.id)).forEach(n => {
    const cibles = (n as Class_NodeElement).links_order.map(l => l.target.name)
    expect(cibles).toEqual(['Transformation', 'Emplois'])
  })
})
