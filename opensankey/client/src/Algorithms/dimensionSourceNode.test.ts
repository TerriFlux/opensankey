import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import {
  disaggregateDimensionNodes, isGeneratedMemberLink, isGeneratedMemberNode
} from './DimensionDisaggregation'

// jest 27 / jsdom n expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — DIAGNOSTIC : le noeud d axe en SOURCE. Julien, 29/09 : « si je selectionne le noeud
// qui represente France (la source) ca marche pas, ca n affiche que le noeud (oleagineux par
// exemple) mais pas le flux et le noeud d arrive. »

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as unknown as Class_DataTagGroup
  const tous = filiere.addTag('Tous produits', 'tous-produits') as Class_DataTag
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const oleagineux = filiere.addTag('Oleagineux', 'oleagineux') as Class_DataTag
  cereales.parent = tous
  oleagineux.parent = tous
  filiere.levels = ['ensemble', 'filieres']
  filiere.banner = 'one'

  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  pays.levels = ['monde', 'regions']
  pays.banner = 'one'

  const france = sankey.addNewNodeWithName('France')
  const partenaires = sankey.addNewNodeWithName('Partenaires')
  const flux = sankey.addNewLink(france, partenaires)

  const poser = (f: string, p: string, n: number) => {
    filiere.tags_list.forEach(t => t.setUnSelected())
    ;(filiere.tags_dict[f] as Class_DataTag).setSelected()
    pays.tags_list.forEach(t => t.setUnSelected())
    ;(pays.tags_dict[p] as Class_DataTag).setSelected()
    ;(flux.value as Class_LinkValue).valueData = n
  }
  poser('cereales', 'europe', 100)
  poser('cereales', 'afrique', 200)
  poser('oleagineux', 'europe', 30)
  poser('oleagineux', 'afrique', 40)

  filiere.selectAllAtLevel(0)
  pays.selectAllAtLevel(0)
  return { app, sankey, filiere, pays, france, partenaires, flux, oleagineux, cereales }
}

describe('os#1511 — un noeud d axe en SOURCE se decoupe comme un noeud d axe en cible', () => {
  test('la CIBLE attachee : le flux et le noeud de depart sont bien la (temoin)', () => {
    const m = monter()
    m.partenaires.driving_dimension = m.pays
    m.pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres.map(l => l.target.name).sort()).toEqual(['Afrique', 'Europe'])
    expect(engendres.every(l => l.source.name === 'France')).toBe(true)
    expect(engendres.reduce((t, l) => t + (l.value?.valueData ?? 0), 0)).toBe(370)
  })

  test('la SOURCE attachee : un flux part de chaque membre vers la cible', () => {
    const m = monter()
    m.france.driving_dimension = m.filiere
    m.filiere.selectAllAtLevel(1)
    disaggregateDimensionNodes(m.sankey)
    const noeuds = m.sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()
    expect(noeuds).toEqual(['Cereales', 'Oleagineux'])
    const engendres = m.sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres.map(l => l.source.name).sort()).toEqual(['Cereales', 'Oleagineux'])
    expect(engendres.every(l => l.target.name === 'Partenaires')).toBe(true)
    expect(engendres.reduce((t, l) => t + (l.value?.valueData ?? 0), 0)).toBe(370)
  })

  test('la SOURCE attachee : les flux engendres sont VISIBLES, et la cible aussi', () => {
    const m = monter()
    m.france.driving_dimension = m.filiere
    m.filiere.selectAllAtLevel(1)
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres.length).toBeGreaterThan(0)
    expect(engendres.filter(l => l.is_visible).map(l => l.source.name).sort())
      .toEqual(['Cereales', 'Oleagineux'])
    expect(m.partenaires.is_visible).toBe(true)
  })

  // LE DEFAUT EXACT DE JULIEN (29/09). Une SEULE dimension se dessine en noeuds a la fois : le
  // selecteur detache donc ce qui l etait sur une autre dimension. Le noeud detache avait ete
  // masque quand il etait axe, et plus rien ne le rendait — son flux existait, avec la bonne
  // valeur, mais pointait vers une cible invisible. A l ecran : le noeud engendre, tout seul.
  test('detacher un axe le REND au dessin, avec ses flux', () => {
    const m = monter()
    // 1) l etat du fichier : la CIBLE porte l axe, et se masque derriere ses membres.
    m.partenaires.driving_dimension = m.pays
    m.pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(m.sankey)
    expect(m.partenaires.is_visible).toBe(false)

    // 2) le geste : on attache la SOURCE a l autre dimension, ce qui detache la cible.
    m.partenaires.setDrivingDimensionId(undefined)
    m.france.driving_dimension = m.filiere
    m.filiere.tags_list.forEach(t => t.setUnSelected())
    m.oleagineux.setSelected()
    disaggregateDimensionNodes(m.sankey)

    // 3) ce que le dessin doit montrer : Oleagineux -> Partenaires, les deux visibles.
    expect(m.partenaires.is_visible).toBe(true)
    const engendres = m.sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres).toHaveLength(1)
    expect(engendres[0].is_visible).toBe(true)
    expect(engendres[0].source.name).toBe('Oleagineux')
    expect(engendres[0].target.name).toBe('Partenaires')
    expect(engendres[0].value?.valueData).toBe(70)
    // Et il ne reste aucun noeud de l axe precedent.
    expect(m.sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name)).toEqual(['Oleagineux'])
  })

  test('detacher un axe SANS en attacher un autre rend tout le diagramme', () => {
    const m = monter()
    m.partenaires.driving_dimension = m.pays
    m.pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(m.sankey)
    m.partenaires.setDrivingDimensionId(undefined)
    disaggregateDimensionNodes(m.sankey)
    expect(m.partenaires.is_visible).toBe(true)
    expect(m.france.is_visible).toBe(true)
    expect(m.flux.is_visible).toBe(true)
    expect(m.sankey.nodes_list.filter(isGeneratedMemberNode)).toHaveLength(0)
  })

  test('un SEUL membre choisi sur la source : un noeud, un flux', () => {
    const m = monter()
    m.france.driving_dimension = m.filiere
    m.filiere.tags_list.forEach(t => t.setUnSelected())
    m.oleagineux.setSelected()
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres).toHaveLength(1)
    expect(engendres[0].source.name).toBe('Oleagineux')
    expect(engendres[0].target.name).toBe('Partenaires')
    expect(engendres[0].value?.valueData).toBe(70)
    expect(engendres[0].is_visible).toBe(true)
  })
})
