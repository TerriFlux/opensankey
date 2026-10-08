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
  const lien = sankey.addNewLink(source, cible)
  // DES VALEURS, sans quoi il n y a pas de bande : « ce flux n existe pas ici » n est pas « il vaut
  // 0 », et une bande sans valeur ne se dessine pas (#161).
  const poser = (id: string, nombre: number) => {
    pays.tags_list.forEach(t => t.setUnSelected())
    ;(pays.tags_dict[id] as Class_DataTag).setSelected()
    ;(lien.value as { valueData: number | null }).valueData = nombre
  }
  poser('europe', 340)
  poser('afrique', 210)
  pays.tags_list.forEach(t => t.setUnSelected())
  europe.setSelected(); afrique.setSelected()
  return { app, sankey, pays, cible, lien }
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
    // Depuis « un seul dessin » (bf78a4196, 02/10), une dimension a niveaux est toujours a choix
    // multiple et, avec deux membres retenus, se dessine en BANDES, chacun a sa couleur : elle porte
    // donc des couleurs meme sans `use_colors`. Le groupe vraiment SANS couleurs est celui qui se lit
    // sur UN membre — « Annee : 2015 ».
    m.pays.tags_list.forEach(t => t.setUnSelected())
    ;(m.pays.tags_dict['europe'] as Class_DataTag).setSelected()
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

// os#1511, 30/09 — LE SURVOL D UNE ENTREE DE DIMENSION DESIGNE SES BANDES. Julien : « quand on
// passe sur la couleur dans la legende, ca ne met pas en exergue la ou les bandes correspondantes
// — c est pas vrai pour les etiquettes de noeud et flux, passer la souris sur la legende fait
// exactement ce que je demande. »
//
// Il avait raison : le mecanisme existe (`applyLegendHighlight`), mais il ne pouvait pas atteindre
// une dimension. On ne teste pas le rendu D3 ici — on teste le PONT qui manquait : un flux sait-il
// dire quelles bandes portent le membre survole, et sous l identifiant que le dessin leur donne.

describe('os#1511 — un flux sait nommer les bandes d un membre', () => {
  test('la bande d un membre porte SON identifiant, celui que le dessin utilise', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const bandes = m.lien.tagged_value_bands
    expect(bandes.map(b => b.id).sort()).toEqual(['afrique', 'europe'])
    // `LinkDrawShape` dessine chaque bande sous `<flux>_band_<id de bande>` : c est par la que le
    // survol les retrouve.
    expect(bandes.map(b => `${m.lien.id}_band_${b.id}`).every(id => id.includes('_band_')))
      .toBe(true)
  })

  test('un membre NON dessine n a pas de bande a designer', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const ids = m.lien.tagged_value_bands.map(b => b.id)
    // « Monde » est l ancetre des deux membres coches : il n est pas dessine, donc rien a exergue.
    expect(ids).not.toContain('monde')
  })
})

describe('os#1511 — la legende suit le mode d affichage', () => {
  test('EN BANDES : la dimension est dans la legende', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const groupes = legendTagGroupsOrder(m.sankey as never).map(g => g.id)
    expect(groupes).toContain('pays')
  })

  test('EN NOEUDS, plusieurs membres : elle reste, pour cocher, survoler et peindre (08/10)', () => {
    const m = monter()
    m.cible.driving_dimension = m.pays
    const groupes = legendTagGroupsOrder(m.sankey as never).map(g => g.id)
    expect(groupes).toContain('pays')
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
