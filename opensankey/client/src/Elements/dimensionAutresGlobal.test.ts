import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from './LinkValues'
import { OTHERS_ID } from '../Algorithms/DimensionOthers'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — « AUTRES » D'UNE DIMENSION EN BANDES (regle arretee avec Julien le 01/10) :
//  - repli decide AU TOTAL sur les flux visibles (moins de 0,5 %, ou au-dela du 19e) ;
//  - exception : un membre replie au total reste en propre sur un flux ou il pese au moins 5 % ;
//  - la legende nomme ce qui est dessine en propre quelque part, puis « Autres ».

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const produit = sankey.addDataTagGroup('produit', 'Produit', false) as unknown as Class_DataTagGroup
  const ids = ['ble', 'orge', 'mais', 'colza', 'banane', 'kiwi', 'figue']
  const tags = Object.fromEntries(ids.map(id => [id, produit.addTag(id, id) as Class_DataTag]))
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  const c = sankey.addNewNodeWithName('C')
  const vers_b = sankey.addNewLink(a, b)
  const vers_c = sankey.addNewLink(a, c)
  const poser = (flux: typeof vers_b, id: string, nombre: number) => {
    produit.tags_list.forEach(t => t.setUnSelected())
    tags[id].setSelected()
    ;(flux.value as Class_LinkValue).valueData = nombre
  }
  // A -> B : le gros du diagramme ; kiwi et figue y sont minuscules.
  poser(vers_b, 'ble', 1000)
  poser(vers_b, 'orge', 300)
  poser(vers_b, 'mais', 300)
  poser(vers_b, 'colza', 300)
  poser(vers_b, 'kiwi', 3)
  poser(vers_b, 'figue', 2)
  // A -> C : petit flux, ou la banane pese 5 / 55 = 9 %, mais 0,26 % du total.
  poser(vers_c, 'ble', 50)
  poser(vers_c, 'banane', 5)
  produit.tags_list.forEach(t => t.setSelected())
  produit.banner = 'multi'
  return { sankey, produit, vers_b, vers_c }
}

const ids = (bandes: { id: string }[]) => bandes.map(b => b.id).sort()

describe('os#1511 — Autres au total, exception par flux', () => {
  test('repli decide au total : banane, kiwi, figue', () => {
    const { produit } = monter()
    expect([...produit.globalFoldedMembers()].sort()).toEqual(['banane', 'figue', 'kiwi'])
  })

  test('sur A -> B, kiwi et figue forment Autres', () => {
    const { vers_b } = monter()
    const bandes = vers_b.tagged_value_bands
    expect(ids(bandes)).toEqual([OTHERS_ID, 'ble', 'colza', 'mais', 'orge'].sort())
    expect(bandes.find(b => b.id === OTHERS_ID)?.folded?.map(f => f.id)).toEqual(['kiwi', 'figue'])
  })

  test('sur A -> C, la banane (9 % du flux) reste en propre : exception', () => {
    const { vers_c } = monter()
    expect(ids(vers_c.tagged_value_bands)).toEqual(['banane', 'ble'])
  })

  test('la legende nomme ce qui est dessine en propre, puis Autres', () => {
    const { produit } = monter()
    const dessin = produit.members_drawn_in_bands
    expect(dessin && [...dessin.members].sort()).toEqual(['banane', 'ble', 'colza', 'mais', 'orge'])
    expect(dessin?.has_others).toBe(true)
  })
})
