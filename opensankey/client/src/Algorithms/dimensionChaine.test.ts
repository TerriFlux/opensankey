import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { disaggregateDimensionNodes, isGeneratedMemberLink, isGeneratedMemberNode } from './DimensionDisaggregation'

// jest 27 / jsdom n expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511, 30/09 — PLUSIEURS NOEUDS D UNE MEME CHAINE PORTENT LA MEME DIMENSION.
//
// Julien : « il faut l idee que plusieurs noeuds le long d une chaine puissent porter le dataTag.
// On peut suivre orge tout le long, ou mais tout le long. Sauf pour les noeuds qui n ont pas de
// distinction, qui eux restent uniques. Il faut relaxer ce que je disais : un meme dataTag peut
// avoir plusieurs noeuds qui se desagregent. »
//
// C est l inverse de ce qu il avait demande la veille (« une dimension ne peut avoir qu un noeud
// qui la represente »), et le modele ne l a jamais interdit — seule l interface le faisait.
//
// CE QUE CES TESTS ETABLISSENT, et qui n allait PAS de soi : sur une chaine, la desagregation ne
// CROISE pas, elle SUIT. Le produit cartesien vaut pour DEUX dimensions (les filieres a gauche,
// les pays a droite) ; sur UNE SEULE dimension aux deux bouts, il fabriquerait « orge -> mais »,
// un flux qui n existe pas dans le cube. Seule la diagonale a un sens.
//
//   Collecte --> Transformation --> Usages        (orge 100, mais 60 sur chaque maillon)
//
// LE NOM D UN MEMBRE PORTE CELUI DE SON AXE des que plusieurs noeuds partagent la dimension
// (os#1511, !742, session voisine) : « Collecte - Orge » et non « Orge » trois fois. C est
// exactement sur une chaine que cette regle se justifie — sans elle, six noeuds s appelleraient
// Orge ou Mais et le dessin deviendrait illisible.

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
  const transfo = sankey.addNewNodeWithName('Transformation')
  const usages = sankey.addNewNodeWithName('Usages')
  const amont = sankey.addNewLink(collecte, transfo)
  const aval = sankey.addNewLink(transfo, usages)

  const poser = (id: string, amont_kt: number, aval_kt: number) => {
    cereale.tags_list.forEach(t => t.setUnSelected())
    ;(cereale.tags_dict[id] as Class_DataTag).setSelected()
    ;(amont.value as Class_LinkValue).valueData = amont_kt
    ;(aval.value as Class_LinkValue).valueData = aval_kt
  }
  poser('orge', 100, 100)
  poser('mais', 60, 60)
  cereale.selectAllAtLevel(1)
  return { sankey, cereale, collecte, transfo, usages, amont, aval }
}

const fluxEngendres = (m: ReturnType<typeof monter>) =>
  m.sankey.links_list.filter(isGeneratedMemberLink)
    .map(l => `${l.source.name}->${l.target.name}=${l.value?.valueData}`).sort()

describe('os#1511 — plusieurs noeuds portent la MEME dimension, le long d une chaine', () => {
  test('les trois maillons se desagregent, chacun en deux noeuds', () => {
    const m = monter()
    m.collecte.driving_dimension = m.cereale
    m.transfo.driving_dimension = m.cereale
    m.usages.driving_dimension = m.cereale
    disaggregateDimensionNodes(m.sankey)
    const noms = m.sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()
    expect(noms).toEqual([
      'Collecte - Mais', 'Collecte - Orge',
      'Transformation - Mais', 'Transformation - Orge',
      'Usages - Mais', 'Usages - Orge',
    ])
  })

  test('LA CHAINE SE SUIT, elle ne se croise pas : pas d orge vers mais', () => {
    const m = monter()
    m.collecte.driving_dimension = m.cereale
    m.transfo.driving_dimension = m.cereale
    m.usages.driving_dimension = m.cereale
    disaggregateDimensionNodes(m.sankey)
    // Quatre flux, pas huit : chaque membre se relie a LUI-MEME d un maillon a l autre.
    expect(fluxEngendres(m)).toEqual([
      'Collecte - Mais->Transformation - Mais=60',
      'Collecte - Orge->Transformation - Orge=100',
      'Transformation - Mais->Usages - Mais=60',
      'Transformation - Orge->Usages - Orge=100',
    ])
  })

  test('les totaux ne bougent pas : on suit la meme matiere de bout en bout', () => {
    const m = monter()
    m.collecte.driving_dimension = m.cereale
    m.transfo.driving_dimension = m.cereale
    m.usages.driving_dimension = m.cereale
    disaggregateDimensionNodes(m.sankey)
    const total = m.sankey.links_list.filter(isGeneratedMemberLink)
      .reduce((t, l) => t + (l.value?.valueData ?? 0), 0)
    // 160 sur chacun des deux maillons.
    expect(total).toBe(320)
  })

  test('un maillon SANS distinction reste unique, et la chaine passe au travers', () => {
    const m = monter()
    // « Sauf pour les noeuds qui n ont pas de distinction, qui eux restent uniques. »
    m.collecte.driving_dimension = m.cereale
    m.usages.driving_dimension = m.cereale
    disaggregateDimensionNodes(m.sankey)
    // La Transformation ne se decoupe pas : elle recoit les deux cereales et les redistribue.
    expect(m.transfo.is_visible).toBe(true)
    expect(fluxEngendres(m)).toEqual([
      'Collecte - Mais->Transformation=60',
      'Collecte - Orge->Transformation=100',
      'Transformation->Usages - Mais=60',
      'Transformation->Usages - Orge=100',
    ])
  })
})
