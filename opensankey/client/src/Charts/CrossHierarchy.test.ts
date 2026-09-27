// LA COURONNE CROISEE : un secteur est une CASE (produit, partenaire), sa valeur le flux entre les
// deux, et la case s ouvre par l un ou l autre axe (os#1509).
//
// Julien, 25/09/2026 : « partir de Produits agricoles et diviser soit par pays soit par type de
// cereales, car ces flux ne representent pas des niveaux de desagregation par pays ou par type ».
//
// Le decor : un sujet P decoupe en A et B (axe « prod »), des partenaires Monde > Europe (FR, BE) et
// Asie (axe « geo »), et un flux pour CHAQUE paire de niveaux, comme dans le fichier SOCLE :
//   Monde -> P 100 = Europe 70 + Asie 30 ; Europe = FR 40 + BE 30 ; P = A 60 + B 40, etc.

import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../Persistence/persistenceMigrations'
import type { Type_JSON } from '../types/Utils'
import type { Class_NodeElement } from '../Elements/Node'
import { FOLLOWING_NAVIGATION } from './FigureNavigation'
import {
  buildCrossTree, crossAxesOf, crossExpandedDownToLevels, crossExpansionEntry, crossFrontier,
  crossIsOffered, crossLevelsShown, crossOpeningAt
} from './CrossHierarchy'
import type { Class_LinkElement } from '../Elements/Link'
import { analysisHierarchyTree, buildAnalysisChartData } from './AnalysisChartData'
import type { Type_ChartSubject } from './AnalysisChartData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const CELLS: [string, string, number][] = [
  ['Monde', 'P', 100], ['Monde', 'A', 60], ['Monde', 'B', 40],
  ['Europe', 'P', 70], ['Europe', 'A', 45], ['Europe', 'B', 25],
  ['Asie', 'P', 30], ['Asie', 'A', 15], ['Asie', 'B', 15],
  ['FR', 'P', 40], ['FR', 'A', 30], ['FR', 'B', 10],
  ['BE', 'P', 30], ['BE', 'A', 15], ['BE', 'B', 15]
]
const linkId = (q: string, p: string) => `${q}_${p}`

const file = (): Type_JSON => {
  const links: { [id: string]: unknown } = {}
  CELLS.forEach(([q, p, v]) => {
    links[linkId(q, p)] = { idLink: linkId(q, p), idSource: q, idTarget: p, value: { value: v } }
  })
  return {
    version: '1.3.0',
    format_version: CURRENT_FORMAT_VERSION,
    nodes: {
      P: { idNode: 'P', name: 'Produits', tags: { prod: ['tout'] } },
      A: { idNode: 'A', name: 'A', tags: { prod: ['produit'] }, dimensions: { prod: { parent_name: 'P' } } },
      B: { idNode: 'B', name: 'B', tags: { prod: ['produit'] }, dimensions: { prod: { parent_name: 'P' } } },
      Monde: { idNode: 'Monde', name: 'Monde', tags: { geo: ['monde'] } },
      Europe: { idNode: 'Europe', name: 'Europe', tags: { geo: ['region'] }, dimensions: { geo: { parent_name: 'Monde' } } },
      Asie: { idNode: 'Asie', name: 'Asie', tags: { geo: ['region'] }, dimensions: { geo: { parent_name: 'Monde' } } },
      FR: { idNode: 'FR', name: 'France', tags: { geo: ['pays'] }, dimensions: { geo: { parent_name: 'Europe' } } },
      BE: { idNode: 'BE', name: 'Belgique', tags: { geo: ['pays'] }, dimensions: { geo: { parent_name: 'Europe' } } }
    },
    links,
    levelTags: {
      prod: {
        group_name: 'Produits', banner: 'one', activated: true, siblings: [],
        tags: { tout: { name: 'Tout', selected: true }, produit: { name: 'Produit', selected: false } }
      },
      geo: {
        group_name: 'Partenaires', banner: 'one', activated: true, siblings: [],
        tags: {
          monde: { name: 'Monde', selected: true }, region: { name: 'Region', selected: false },
          pays: { name: 'Pays', selected: false }
        }
      }
    }
  } as unknown as Type_JSON
}

const loadApp = () => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(file())) as never, {}, false)
  app.drawing_area.bypass_redraws = true
  return app
}
const nodeOf = (app: Class_ApplicationData, id: string) =>
  app.drawing_area.sankey.nodes_dict[id] as Class_NodeElement

const spec = (first: 'self' | 'other') => ({ kind: 'flux_cross' as const, side: 'inputs' as const, first })

const childIds = (children: { id: string }[]) => children.map(c => c.id)
const valuesOf = (children: { id: string, value: number }[]) =>
  Object.fromEntries(children.map(c => [c.id, c.value]))

describe('la couronne croisee', () => {

  test('le croisement est offert du cote ou les noeuds d en face portent une hierarchie', () => {
    const app = loadApp()
    expect(crossIsOffered(nodeOf(app, 'P'), 'inputs')).toBe(true)
    expect(crossIsOffered(nodeOf(app, 'P'), 'outputs')).toBe(false)
  })

  test('la racine est la case (sujet, sommet d en face), et le premier anneau suit l axe choisi', () => {
    const app = loadApp()
    const by_other = buildCrossTree(nodeOf(app, 'P'), spec('other'))
    expect(by_other).not.toBeNull()
    const root = by_other!.tree.roots[0]
    expect(by_other!.tree.roots).toHaveLength(1)
    expect(root.id).toBe(linkId('Monde', 'P'))
    expect(root.value).toBe(100)
    // Par les noeuds d en face : Monde devient Europe et Asie.
    expect(valuesOf(root.children)).toEqual({ [linkId('Europe', 'P')]: 70, [linkId('Asie', 'P')]: 30 })
    expect(root.children.map(c => c.label)).toEqual(['Europe', 'Asie'])

    // Par le sujet : Produits devient A et B, Monde reste.
    const by_self = buildCrossTree(nodeOf(app, 'P'), spec('self'))!
    expect(valuesOf(by_self.tree.roots[0].children)).toEqual({ [linkId('Monde', 'A')]: 60, [linkId('Monde', 'B')]: 40 })
  })

  test('une case ouverte descend par l axe de la figure, une case fermee reste une feuille', () => {
    const app = loadApp()
    const opened = new Set([linkId('Europe', 'P')])
    const cross = buildCrossTree(nodeOf(app, 'P'), spec('other'), FOLLOWING_NAVIGATION, opened)!
    const root = cross.tree.roots[0]
    const europe = root.children.find(c => c.id === linkId('Europe', 'P'))!
    const asie = root.children.find(c => c.id === linkId('Asie', 'P'))!
    expect(valuesOf(europe.children)).toEqual({ [linkId('FR', 'P')]: 40, [linkId('BE', 'P')]: 30 })
    expect(asie.children).toEqual([])
    // Asie n a plus d enfant en face mais le sujet en a : elle peut encore s ouvrir.
    expect(cross.expandable.has(asie.id)).toBe(true)
    // La frontiere a plat : FR, BE et Asie, qui somment au sujet.
    const frontier = crossFrontier(cross)
    expect(frontier.map(p => p.id).sort()).toEqual([linkId('Asie', 'P'), linkId('BE', 'P'), linkId('FR', 'P')].sort())
    expect(frontier.reduce((s, p) => s + p.value, 0)).toBe(100)
    expect(frontier.find(p => p.id === linkId('FR', 'P'))!.path).toEqual([linkId('Monde', 'P'), linkId('Europe', 'P'), linkId('FR', 'P')])
  })

  test('l entree precise l axe : Europe ouverte par le sujet donne A et B en Europe', () => {
    const app = loadApp()
    const opened = new Set([crossExpansionEntry(linkId('Europe', 'P'), 'self')])
    const cross = buildCrossTree(nodeOf(app, 'P'), spec('other'), FOLLOWING_NAVIGATION, opened)!
    const europe = cross.tree.roots[0].children.find(c => c.id === linkId('Europe', 'P'))!
    expect(valuesOf(europe.children)).toEqual({ [linkId('Europe', 'A')]: 45, [linkId('Europe', 'B')]: 25 })
  })

  test('quand le premier axe n a plus d enfants, l autre prend le relais', () => {
    const app = loadApp()
    // France n a pas d enfant en face : la case (P, France) s ouvre par les produits.
    const opened = new Set([linkId('Europe', 'P'), linkId('FR', 'P')])
    const cross = buildCrossTree(nodeOf(app, 'P'), spec('other'), FOLLOWING_NAVIGATION, opened)!
    const europe = cross.tree.roots[0].children.find(c => c.id === linkId('Europe', 'P'))!
    const fr = europe.children.find(c => c.id === linkId('FR', 'P'))!
    expect(valuesOf(fr.children)).toEqual({ [linkId('FR', 'A')]: 30, [linkId('FR', 'B')]: 10 })
    // (A, France) n a plus rien a ouvrir d aucun cote.
    expect(cross.expandable.has(linkId('FR', 'A'))).toBe(false)
    expect(childIds(fr.children)).toHaveLength(2)
    expect(cross.tree.mismatch_count).toBe(0)
  })

  test('un niveau par axe ecrit l ensemble des cases ouvertes, et l ensemble redit ses niveaux', () => {
    const app = loadApp()
    const P = nodeOf(app, 'P')
    expect(crossAxesOf(P, 'inputs')).toEqual({ self: 'prod', other: 'geo' })
    // Rien : aucune entree, la racine s ouvre comme d habitude.
    expect(crossExpandedDownToLevels(P, spec('other'), { self: 0, other: 0 }).size).toBe(0)
    // Deux crans en face : Monde par regions, Europe par pays ; Asie n a pas d enfant en face et
    // le sujet n est pas demande.
    const two_other = crossExpandedDownToLevels(P, spec('other'), { self: 0, other: 2 })
    expect([...two_other].sort()).toEqual([
      crossExpansionEntry(linkId('Monde', 'P'), 'other'), crossExpansionEntry(linkId('Europe', 'P'), 'other')
    ].sort())
    // Un cran en face puis un cran par le sujet : Europe et Asie s ouvrent par les produits.
    const one_one = crossExpandedDownToLevels(P, spec('other'), { self: 1, other: 1 })
    expect([...one_one].sort()).toEqual([
      crossExpansionEntry(linkId('Monde', 'P'), 'other'),
      crossExpansionEntry(linkId('Europe', 'P'), 'self'), crossExpansionEntry(linkId('Asie', 'P'), 'self')
    ].sort())
    const tree = buildCrossTree(P, spec('other'), FOLLOWING_NAVIGATION, one_one)!.tree
    const asie = tree.roots[0].children.find(c => c.id === linkId('Asie', 'P'))!
    expect(valuesOf(asie.children)).toEqual({ [linkId('Asie', 'A')]: 15, [linkId('Asie', 'B')]: 15 })
    // L ensemble redit ses niveaux, et ne dit rien d un ensemble retouche a la main.
    const max = { self: 1, other: 2 }
    expect(crossLevelsShown(one_one, P, spec('other'), max)).toEqual({ self: 1, other: 1 })
    expect(crossLevelsShown(two_other, P, spec('other'), max)).toEqual({ self: 0, other: 2 })
    expect(crossLevelsShown(new Set([linkId('Asie', 'P')]), P, spec('other'), max)).toBeNull()
  })

  test('chaque case porte les branches de premier rang de ses deux axes', () => {
    const app = loadApp()
    const opened = new Set([crossExpansionEntry(linkId('Europe', 'P'), 'self')])
    const tree = buildCrossTree(nodeOf(app, 'P'), spec('other'), FOLLOWING_NAVIGATION, opened)!.tree
    const root = tree.roots[0]
    expect(root.axis_branches).toEqual({})
    const europe = root.children.find(c => c.id === linkId('Europe', 'P'))!
    expect(europe.axis_branches?.other?.id).toBe('Europe')
    expect(europe.axis_branches?.self).toBeUndefined()
    const europe_a = europe.children.find(c => c.id === linkId('Europe', 'A'))!
    expect(europe_a.axis_branches?.other?.id).toBe('Europe')
    expect(europe_a.axis_branches?.self?.id).toBe('A')
  })

  test('la couronne lit le croisement par ses deux chemins, arbre et frontiere', () => {
    const app = loadApp()
    const subject = { kind: 'node', node: nodeOf(app, 'P') } as unknown as Type_ChartSubject
    const descriptor = { decompose: spec('other'), compare: null }
    const tree = analysisHierarchyTree(subject, descriptor)
    expect(tree?.roots[0].id).toBe(linkId('Monde', 'P'))
    const parts = buildAnalysisChartData(subject, descriptor, FOLLOWING_NAVIGATION, {}, new Set()).series[0]?.parts ?? []
    expect(parts.map(p => p.id).sort()).toEqual([linkId('Asie', 'P'), linkId('Europe', 'P')].sort())
    expect(parts.every(p => p.has_children === true)).toBe(true)
  })
})

// ── 27/09/2026 — CE QUE LE DIAGRAMME DOIT DEPLIER QUAND ON OUVRE UNE CASE ────────────────────
//
// Julien : « quand on est en mode le croisement des flux entrants et qu on a le deplie dans le
// diagramme, ca ne marche pas. »
//
// Il avait raison, et le code le disait en toutes lettres : « une case est un flux du document,
// pas un noeud : le diagramme n a rien a deplier pour elle ». C etait vrai de la CASE et faux de
// l AXE — ouvrir une case par un axe remplace l un de ses deux bouts par ses enfants, et ce
// bout-la est un NOEUD que le diagramme sait desagreger.
//
// Le reglage « Le clic sur une part, en plus » restait donc offert en croise sans rien faire : un
// bouton mort. Le harnais des « bites » ne le voit pas — il n interroge pas le croisement.
describe('l axe ouvert designe un noeud que le diagramme sait deplier', () => {

  const lien = (app: Class_ApplicationData, id: string) =>
    app.drawing_area.sankey.links_dict[id] as Class_LinkElement

  test('LE CAS DE JULIEN : ouvrir par l axe d en face deplie le PARTENAIRE', () => {
    // La case (Europe, P) ouverte par l axe « other » montre France et Belgique : c est donc
    // EUROPE que le diagramme doit desagreger, pas le flux ni le produit.
    const app = loadApp()

    const ouverture = crossOpeningAt(lien(app, 'Europe_P'), 'other', 'inputs')

    expect(ouverture?.node.id).toBe('Europe')
    expect(['FR', 'BE']).toContain(ouverture?.first_child.id)
  })

  test('ET PAR L AXE DU SUJET, c est le PRODUIT — l autre bout de la meme case', () => {
    // alt+clic ouvre par l autre axe : la meme case montre alors A et B. Les deux bouts d une case
    // sont deux noeuds, et l axe dit lequel on ouvre.
    const app = loadApp()

    const ouverture = crossOpeningAt(lien(app, 'Europe_P'), 'self', 'inputs')

    expect(ouverture?.node.id).toBe('P')
    expect(['A', 'B']).toContain(ouverture?.first_child.id)
  })

  test('UN BOUT SANS ENFANTS NE DEPLIE RIEN, et le dit', () => {
    // LA CONTRE-VERIFICATION : « A » est une feuille de l axe produit. Rendre un noeud quand meme
    // ferait desagreger au hasard — on rend `null`, et l appelant s arrete.
    const app = loadApp()

    expect(crossOpeningAt(lien(app, 'Europe_A'), 'self', 'inputs')).toBeNull()
  })

  test('LA MEME REGLE QUE LE TRACE : le bout ouvert est celui dont la figure montre les enfants', () => {
    // Le garde-fou qui compte. Si `crossOpeningAt` et `cellsAlong` choisissaient deux noeuds
    // differents, le diagramme deplierait autre chose que la figure — un decalage qu on ne verrait
    // qu a l ecran, et par intermittence.
    const app = loadApp()
    const cross = buildCrossTree(
      nodeOf(app, 'P'), spec('other'), FOLLOWING_NAVIGATION,
      new Set([crossExpansionEntry('Europe_P', 'other')])
    )
    const sous_europe = crossFrontier(cross!)
      .filter(s => s.parent_label === 'Europe')
      .map(s => s.label)

    const ouverture = crossOpeningAt(lien(app, 'Europe_P'), 'other', 'inputs')

    expect(sous_europe.length).toBeGreaterThan(0)
    expect(sous_europe).toContain(ouverture!.first_child.name)
  })
})
