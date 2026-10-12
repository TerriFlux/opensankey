import { monterSocle } from '../Charts/__fixtures__/couronneSocle'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_DataTag } from '../types/Tag'
import { applyDimensionCarriers, applyDimensionDrawing } from '../components/ui/dimensionDrawingHost'

// 12/10/2026 — os#1511 : UNE COLONNE D EXTREMITE DONT LA DIMENSION PASSE EN BANDES S EFFACE (Julien :
// « on a 3 dimensions et 3 colonnes ; si une des dimensions est en bandes, une des colonnes devrait
// disparaitre »). Extremites seulement ; jamais si le diagramme se vide ; revenir en noeuds la rend.

const monter = (avecC: boolean) => {
  const s = monterSocle()
  const sankey = s.sankey
  const noeud = (name: string) => sankey.nodes_list.find(n => n.name === name) as Class_NodeElement
  const A = noeud('A')
  const B = noeud('B')
  let C: Class_NodeElement | undefined
  let BC: Class_LinkElement | undefined
  if (avecC) {
    C = sankey.addNewNodeWithName('C') as Class_NodeElement
    BC = sankey.addNewLink(B, C) as Class_LinkElement
    // Le meme cube que A -> B : les deux flux portent toutes les dimensions.
    const lien = BC
    ;['ble', 'mais', 'lait_cru', 'beurre', 'viande'].forEach((f, i) => ['fr', 'es', 'br', 'us', 'cn'].forEach((p, j) => {
      ;[s.filiere, s.pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
      ;(s.filiere.tags_dict[f] as Class_DataTag).setSelected()
      ;(s.pays.tags_dict[p] as Class_DataTag).setSelected()
      ;(lien.value as Class_LinkValue).valueData = 10 * (i + 1) + (j + 1)
    }))
    s.filiere.selectMembers(['cereales', 'lait', 'viande'])
  }
  s.pays.selectMembers(['europe', 'ameriques', 'asie'])
  return { s, A, B, C, BC, da: s.app.drawing_area }
}
const visibles = (m: ReturnType<typeof monter>) => m.da.sankey.nodes_list.filter(n => n.is_visible).map(n => n.id).sort()

describe('os#1511 — colonne d extremite en bandes', () => {
  test('passer en bandes efface la colonne d extremite qui portait la dimension, et ses flux', () => {
    const m = monter(true)
    m.A.driving_dimension = m.s.filiere
    ;(m.C as Class_NodeElement).driving_dimension = m.s.pays
    m.da.rebuildDimensionNodes()
    expect(visibles(m)).toContain('C--par--europe')
    applyDimensionDrawing(m.s.app, m.s.pays, 'multi')
    expect(m.s.pays.draws_bands).toBe(true)
    expect(m.s.pays.parked_carrier_ids).toEqual(['C'])
    expect(visibles(m)).toEqual(['A--par--cereales', 'A--par--lait', 'A--par--viande', 'B'])
    expect((m.BC as Class_LinkElement).is_visible).toBe(false)
    // Le fichier garde la mise de cote.
    expect((m.s.pays.toJSON() as { parked_carriers?: string[] }).parked_carriers).toEqual(['C'])
    // Annuler rend la colonne en noeuds.
    m.s.app.history.applyUndo()
    expect(visibles(m)).toContain('C--par--europe')
    // Revenir en noeuds la rend aussi, et vide la mise de cote.
    m.s.app.history.applyRedo()
    expect(visibles(m)).not.toContain('C')
    applyDimensionCarriers(m.s.app, m.s.pays, ['C'])
    expect(m.s.pays.parked_carrier_ids).toEqual([])
    expect(visibles(m)).toContain('C--par--asie')
  })

  test('un noeud du milieu reste', () => {
    const m = monter(true)
    m.B.driving_dimension = m.s.pays
    m.da.rebuildDimensionNodes()
    applyDimensionDrawing(m.s.app, m.s.pays, 'multi')
    expect(m.s.pays.parked_carrier_ids).toEqual(['B'])
    expect(visibles(m)).toEqual(['A', 'B', 'C'])
  })

  test('jamais si le diagramme se vide : le seul flux reste', () => {
    const m = monter(false)
    m.B.driving_dimension = m.s.pays
    m.da.rebuildDimensionNodes()
    applyDimensionDrawing(m.s.app, m.s.pays, 'multi')
    expect(visibles(m)).toEqual(['A', 'B'])
  })

  test('un membre a la fois ne dessine pas de bandes : la colonne reste', () => {
    const m = monter(true)
    ;(m.C as Class_NodeElement).driving_dimension = m.s.pays
    m.da.rebuildDimensionNodes()
    applyDimensionDrawing(m.s.app, m.s.pays, 'one')
    expect(visibles(m)).toEqual(['A', 'B', 'C'])
  })
})
