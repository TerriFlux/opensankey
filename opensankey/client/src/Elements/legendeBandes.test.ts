import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { computeLegendItems, legendTagGroupsOrder } from './legendItems'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — CONTROLE : une dimension EN BANDES garde sa legende, une dimension EN NOEUDS non.
function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  pays.levels = ['monde', 'regions']
  pays.use_colors = true
  const source = sankey.addNewNodeWithName('A')
  const cible = sankey.addNewNodeWithName('B')
  sankey.addNewLink(source, cible)
  pays.tags_list.forEach(t => t.setUnSelected())
  europe.setSelected(); afrique.setSelected()
  return { app, sankey, pays, cible }
}

// os#1511, 30/09 — LE RAPPEL DES DATA TAGS NE REPETE PLUS CE QUI EST DEJA DIT. Julien : « on a
// toujours doublon : on a la liste avec les couleurs, et c est repris en dessous. »

// Le rappel ne s ecrit que si le reglage est allume : sans lui, les tests ci-dessous passeraient
// pour la mauvaise raison — le bloc entier serait saute.
const RAPPEL_ALLUME = { show_dataTags: true } as never   // 2e argument : la CONFIGURATION

describe('os#1511 — le rappel des dataTags ne double pas le bloc de couleurs', () => {
  test('un groupe QUI PORTE DES COULEURS n a pas de ligne de rappel', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const items = computeLegendItems(
      m.sankey as never, RAPPEL_ALLUME, {} as never)
    const rappels = items.filter(i => typeof i.text === 'string' && i.text.startsWith('Pays : '))
    expect(rappels).toHaveLength(0)
  })

  test('un groupe SANS couleurs garde son rappel : c est le seul endroit qui le nomme', () => {
    const m = monter()
    m.pays.use_colors = false
    const items = computeLegendItems(
      m.sankey as never, RAPPEL_ALLUME, {} as never)
    const rappels = items.filter(i => typeof i.text === 'string' && i.text.startsWith('Pays : '))
    expect(rappels).toHaveLength(1)
  })

  test('une dimension DESSINEE EN NOEUDS n a pas de rappel non plus', () => {
    const m = monter()
    m.pays.use_colors = false
    m.cible.driving_dimension = m.pays
    const items = computeLegendItems(
      m.sankey as never, RAPPEL_ALLUME, {} as never)
    // Ses membres sont des noeuds NOMMES sur le diagramme : le rappel les reecrirait pour rien.
    expect(items.filter(i => typeof i.text === 'string' && i.text.startsWith('Pays : ')))
      .toHaveLength(0)
  })
})

describe('os#1511 — la legende suit le mode d affichage', () => {
  test('EN BANDES : la dimension est dans la legende', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const groupes = legendTagGroupsOrder(m.sankey as never).map(g => g.id)
    expect(groupes).toContain('pays')
  })

  test('EN NOEUDS : elle en sort', () => {
    const m = monter()
    m.cible.driving_dimension = m.pays
    const groupes = legendTagGroupsOrder(m.sankey as never).map(g => g.id)
    expect(groupes).not.toContain('pays')
  })

  test('EN BANDES, les entrees de ses membres sont bien emises', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const items = computeLegendItems(
      m.sankey as never, m.app.drawing_area.legend as never, {} as never)
    const textes = items.map(i => i.text)
    expect(textes).toContain('Pays')
    expect(textes.join(' | ')).toContain('Europe')
  })
})
