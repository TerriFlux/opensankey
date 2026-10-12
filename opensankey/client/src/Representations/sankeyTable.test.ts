import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { sankeyTableOf, tableFocusOf, tableGestureIds } from './sankeyTable'

// os#1526 — la selection du diagramme lue et ecrite en TABLEAU (celui de la couronne). 11/10/2026 :
// detail interne du modele commun (ex `DimensionTableCut`).
//
//   monde (racine unique)
//     europe  -> france, espagne
//     afrique -> maroc
//     oceanie (branche courte : feuille au niveau des regions)

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const dim = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const add = (nom: string, id: string, parent?: Class_DataTag) => {
    const m = dim.addTag(nom, id) as Class_DataTag
    if (parent) m.parent = parent
    return m
  }
  const monde = add('Monde', 'monde')
  const europe = add('Europe', 'europe', monde)
  const afrique = add('Afrique', 'afrique', monde)
  const oceanie = add('Oceanie', 'oceanie', monde)
  const france = add('France', 'france', europe)
  const espagne = add('Espagne', 'espagne', europe)
  const maroc = add('Maroc', 'maroc', afrique)
  dim.levels = ['monde', 'regions', 'pays']
  return { dim, monde, europe, afrique, oceanie, france, espagne, maroc }
}

const vue = (ids: string[], focus: string[] = []) => ({ shown: ids, hidden: [], focus })
const niveau = (dim: Class_DataTagGroup) => (d: number) => (dim.membersAtLevel(d) as Class_DataTag[]).map(m => m.id)
const zoomA = (t: ReturnType<typeof sankeyTableOf>, depth: number) => t.levels.find(l => l.depth === depth)?.zoom

describe('os#1526 — lire la selection en tableau', () => {
  test('une racine unique n a pas de colonne : la choisir, c est ne pas detailler', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(['monde']))
    expect(t.entry).toBe(1)
    expect(t.depths).toEqual([])
    expect(t.levels.every(l => l.zoom === undefined)).toBe(true)
  })

  test('un niveau entier : sa colonne, sans zoom', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(niveau(dim)(2)))
    expect(t.depths).toEqual([2])
    expect(t.mixed).toBe(false)
    expect(t.levels.every(l => l.zoom === undefined)).toBe(true)
  })

  test('les pays d europe : colonne des pays, zoom Europe au niveau des regions', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(['france', 'espagne']))
    expect(t.depths).toEqual([2])
    expect(zoomA(t, 1)).toEqual(['europe'])
    // Tous les pays d Europe : pas de zoom au niveau des pays.
    expect(zoomA(t, 2)).toBeUndefined()
  })

  test('une partie des pays d europe : zoom aux deux niveaux', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(['france']))
    expect(zoomA(t, 1)).toEqual(['europe'])
    expect(zoomA(t, 2)).toEqual(['france'])
    expect(tableFocusOf(dim, ['france'])).toEqual(['europe'])
  })

  test('deux niveaux a la fois : mixte, sans zoom ni portee', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(['france', 'espagne', 'afrique']))
    expect(t.mixed).toBe(true)
    expect(t.depths).toEqual([1, 2])
    expect(t.levels.every(l => l.zoom === undefined)).toBe(true)
    expect(tableFocusOf(dim, ['france', 'espagne', 'afrique'])).toEqual([])
  })

  test('les decoches ne comptent pas dans la lecture', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, { shown: ['france', 'espagne'], hidden: ['espagne'] })
    expect(zoomA(t, 2)).toEqual(['france'])
  })
})

describe('os#1526 — les gestes du tableau rendent une selection', () => {
  test('clic sur un en tete : tout le niveau, sous les zooms au dessus', () => {
    const { dim } = monter()
    // Regions entieres -> pays : tous les pays (Oceanie, feuille courte, y figure).
    expect(tableGestureIds(dim, vue(niveau(dim)(1)), { kind: 'level', depth: 2 }).sort()).toEqual(['espagne', 'france', 'maroc', 'oceanie'])
    // Pays d Europe -> regions : le zoom au niveau des regions n est pas au-dessus, il tombe.
    expect(tableGestureIds(dim, vue(['france', 'espagne']), { kind: 'level', depth: 1 }).sort()).toEqual(['afrique', 'europe', 'oceanie'])
  })

  test('reclic sur la colonne montree : plus de detail, la racine', () => {
    const { dim } = monter()
    expect(tableGestureIds(dim, vue(niveau(dim)(2)), { kind: 'level', depth: 2 })).toEqual(['monde'])
  })

  test('zoomer au dessus de la colonne garde la colonne', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(niveau(dim)(2)))
    expect([...(t.levels.find(l => l.depth === 1)?.chosen ?? [])].sort()).toEqual(['afrique', 'europe', 'oceanie'])
    expect(tableGestureIds(dim, vue(niveau(dim)(2)), { kind: 'zoom', depth: 1, ids: ['europe'] }).sort()).toEqual(['espagne', 'france'])
  })

  test('zoomer au niveau de la colonne choisit ces membres', () => {
    const { dim } = monter()
    const t = sankeyTableOf(dim, vue(['france', 'espagne']))
    expect([...(t.levels.find(l => l.depth === 2)?.offered ?? [])].sort()).toEqual(['espagne', 'france'])
    expect(tableGestureIds(dim, vue(['france', 'espagne']), { kind: 'zoom', depth: 2, ids: ['espagne'] })).toEqual(['espagne'])
  })

  test('tout cocher retire le zoom', () => {
    const { dim } = monter()
    expect(tableGestureIds(dim, vue(['france']), { kind: 'zoom', depth: 2, ids: ['france', 'espagne'] }).sort()).toEqual(['espagne', 'france'])
  })

  test('rien de coche : aucune selection rendue', () => {
    const { dim } = monter()
    expect(tableGestureIds(dim, vue(niveau(dim)(2)), { kind: 'zoom', depth: 1, ids: [] })).toEqual([])
  })

  test('effacer un zoom : ce zoom et ceux en dessous tombent, la colonne reste', () => {
    const { dim } = monter()
    expect(tableGestureIds(dim, vue(['france']), { kind: 'clear', depth: 1 }).sort()).toEqual(['espagne', 'france', 'maroc', 'oceanie'])
    expect(tableGestureIds(dim, vue(['france']), { kind: 'clear', depth: 2 }).sort()).toEqual(['espagne', 'france'])
  })

  test('effacer le zoom qui est la portee du diagramme : la portee redevient une part', () => {
    const { dim } = monter()
    // Portee Europe, colonne des pays : le X du zoom Europe rend les regions.
    expect(tableGestureIds(dim, vue(['france', 'espagne'], ['europe']), { kind: 'clear', depth: 1 }).sort()).toEqual(['afrique', 'europe', 'oceanie'])
  })
})
