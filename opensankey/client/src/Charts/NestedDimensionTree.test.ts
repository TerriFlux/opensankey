import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import {
  DETACHED_ENTRY, buildNestedDimensionTree, isDetachedOpening, memberPathSectorId, memberSectorId, parseMemberSectorId,
  parseMemberSectorPath
} from './DataDimensionHierarchy'
import type { Type_SunburstNode } from './SunburstHierarchy'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// 30/09/2026 — DIMENSIONS EMBOITEES, calees sur le diagramme (Julien : « cale-toi sur ce qui est
// fait pour le diagramme »). Chaque dimension a sa coupe ; racine fermee = niveau « ensemble », elle
// ne decoupe pas ; les dimensions qui decoupent s emboitent dans l ordre.
//
//   filiere : produits > cereales > (ble, mais)          pays : monde > (fr, de)
//   ble/fr = 10, ble/de = 20, mais/fr = 5, mais/de = 7

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = filiere.addTag('Produits', 'produits') as Class_DataTag
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const ble = filiere.addTag('Ble', 'ble') as Class_DataTag
  const mais = filiere.addTag('Mais', 'mais') as Class_DataTag
  cereales.parent = produits
  ble.parent = cereales
  mais.parent = cereales
  filiere.levels = ['produits', 'filieres', 'produit']
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const fr = pays.addTag('France', 'fr') as Class_DataTag
  const de = pays.addTag('Allemagne', 'de') as Class_DataTag
  fr.parent = monde
  de.parent = monde
  pays.levels = ['monde', 'pays']
  const lien = sankey.addNewLink(sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B'))
  const poser = (a: Class_DataTag, b: Class_DataTag, v: number) => {
    ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
    a.setSelected()
    b.setSelected()
    ;(lien.value as Class_LinkValue).valueData = v
  }
  poser(ble, fr, 10)
  poser(ble, de, 20)
  poser(mais, fr, 5)
  poser(mais, de, 7)
  ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
  produits.setSelected()
  monde.setSelected()
  return { lien: lien as Class_LinkElement, filiere, pays, produits, cereales, ble, mais, monde, fr, de }
}

const arbre = (m: ReturnType<typeof monter>, expanded: string[]) => buildNestedDimensionTree(
  { kind: 'link', link: m.lien }, [m.filiere, m.pays], { data_tags: null }, { expanded: new Set(expanded), max_depth: 8 }
)

const chercher = (noeud: Type_SunburstNode, id: string): Type_SunburstNode | undefined =>
  noeud.id === id ? noeud : noeud.children.map(c => chercher(c, id)).find(Boolean)

describe('os#1511 — dimensions emboitees', () => {
  test('un secteur emboite porte la coordonnee entiere, et se relit', () => {
    const id = memberPathSectorId([
      { dimension_id: 'filiere', member_id: 'ble' }, { dimension_id: 'pays', member_id: 'fr' }
    ])
    expect(parseMemberSectorPath(id)).toEqual([
      { dimension_id: 'filiere', member_id: 'ble' }, { dimension_id: 'pays', member_id: 'fr' }
    ])
    expect(parseMemberSectorId(id)).toEqual({ dimension_id: 'pays', member_id: 'fr' })
  })

  const P = (id: string) => memberSectorId('filiere', id)
  const G = (id: string) => memberSectorId('pays', id)

  test('figure neuve : la premiere dimension decoupe d un cran, sans anneau Tous produits', () => {
    const m = monter()
    const racine = arbre(m, [])?.roots[0] as Type_SunburstNode
    expect(racine.value).toBe(42)
    expect(racine.children.map(c => c.id)).toEqual([P('cereales')])
    expect(racine.children[0].children).toEqual([])
  })

  test('la geographie seule : filiere a ensemble, pays ouverts', () => {
    const m = monter()
    const racine = arbre(m, [G('monde')])?.roots[0] as Type_SunburstNode
    expect(racine.children.map(c => [c.label, c.value])).toEqual([['France', 15], ['Allemagne', 27]])
    expect(racine.children[0].id).toBe(G('fr'))
  })

  test('rien ne decoupe : un seul secteur, le tout', () => {
    const m = monter()
    const racine = arbre(m, [G('x_rien')])?.roots[0] as Type_SunburstNode
    expect(racine.children.map(c => [c.label, c.value])).toEqual([['Produits', 42]])
  })

  test('les deux : chaque produit se decoupe par pays, totaux inchanges, deux palettes', () => {
    const m = monter()
    const racine = arbre(m, [P('produits'), P('cereales'), G('monde')])?.roots[0] as Type_SunburstNode
    const ble = chercher(racine, P('ble')) as Type_SunburstNode
    expect(ble.value).toBe(30)
    expect(ble.children.map(c => [c.label, c.value])).toEqual([['France', 10], ['Allemagne', 20]])
    expect(racine.value).toBe(42)
    expect(ble.palette?.index).toBe(0)
    expect(ble.children[0].palette).toEqual({ index: 1, branch_id: 'fr', depth: 0 })
  })

  // 30/09/2026 — COORDONNEES LIEES AU DIAGRAMME : ses coupes font foi.
  const lie = (m: ReturnType<typeof monter>) => buildNestedDimensionTree(
    { kind: 'link', link: m.lien }, [m.filiere, m.pays], { data_tags: null }, { expanded: new Set(), linked: true, max_depth: 8 }
  )?.roots[0] as Type_SunburstNode

  test('liee, un membre par dimension dans le diagramme : un seul secteur, ce membre', () => {
    const m = monter()
    expect(lie(m).children.map(c => [c.label, c.value])).toEqual([['Produits', 42]])
  })

  test('liee, le diagramme montre deux pays : la couronne les decoupe', () => {
    const m = monter()
    m.pays.selectMembers([m.fr.id, m.de.id])
    expect(lie(m).children.map(c => [c.label, c.value])).toEqual([['France', 15], ['Allemagne', 27]])
  })

  test('une figure est detachee si elle le dit, ou si elle porte deja une coupe propre', () => {
    expect(isDetachedOpening([])).toBe(false)
    expect(isDetachedOpening([DETACHED_ENTRY])).toBe(true)
    expect(isDetachedOpening([P('produits')])).toBe(true)
  })
})
