import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import {
  coupeChoisirNiveau, coupeEffacerZoom, coupeZoomer, listeDuZoom, lireCoupe, niveauDEntree
} from './DimensionTableCut'

// os#1526 — la selection du diagramme lue et ecrite en TABLEAU (celui de la couronne).
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

const ids = (xs: Class_DataTag[] | undefined) => (xs ?? []).map(m => m.id)

describe('os#1526 — lire la selection en tableau', () => {
  test('une racine unique n a pas de colonne : la choisir, c est ne pas detailler', () => {
    const { dim, monde } = monter()
    expect(niveauDEntree(dim)).toBe(1)
    const c = lireCoupe(dim, [monde])
    expect(c.colonnes).toEqual([])
    expect(c.zooms.size).toBe(0)
  })

  test('un niveau entier : sa colonne, sans zoom', () => {
    const { dim } = monter()
    const c = lireCoupe(dim, dim.membersAtLevel(2) as Class_DataTag[])
    expect(c.colonnes).toEqual([2])
    expect(c.mixte).toBe(false)
    expect(c.zooms.size).toBe(0)
  })

  test('les pays d europe : colonne des pays, zoom Europe au niveau des regions', () => {
    const { dim, france, espagne } = monter()
    const c = lireCoupe(dim, [france, espagne])
    expect(c.colonnes).toEqual([2])
    expect(ids(c.zooms.get(1))).toEqual(['europe'])
    // Tous les pays d Europe : pas de zoom au niveau des pays.
    expect(c.zooms.has(2)).toBe(false)
  })

  test('une partie des pays d europe : zoom aux deux niveaux', () => {
    const { dim, france } = monter()
    const c = lireCoupe(dim, [france])
    expect(ids(c.zooms.get(1))).toEqual(['europe'])
    expect(ids(c.zooms.get(2))).toEqual(['france'])
  })

  test('deux niveaux a la fois : mixte, sans zoom', () => {
    const { dim, france, espagne, afrique } = monter()
    const c = lireCoupe(dim, [france, espagne, afrique])
    expect(c.mixte).toBe(true)
    expect(c.colonnes).toEqual([1, 2])
    expect(c.zooms.size).toBe(0)
  })
})

describe('os#1526 — les gestes du tableau rendent une selection', () => {
  test('clic sur un en tete : tout le niveau, sous les zooms au dessus', () => {
    const { dim, france, espagne } = monter()
    // Regions entieres -> pays : tous les pays (Oceanie, feuille courte, y figure).
    const toutes = lireCoupe(dim, dim.membersAtLevel(1) as Class_DataTag[])
    expect(coupeChoisirNiveau(dim, toutes, 2).sort()).toEqual(['espagne', 'france', 'maroc', 'oceanie'])
    // Pays d Europe -> regions : le zoom au niveau des regions n est pas au-dessus, il tombe.
    const europe = lireCoupe(dim, [france, espagne])
    expect(coupeChoisirNiveau(dim, europe, 1).sort()).toEqual(['afrique', 'europe', 'oceanie'])
  })

  test('reclic sur la colonne montree : plus de detail, la racine', () => {
    const { dim } = monter()
    const c = lireCoupe(dim, dim.membersAtLevel(2) as Class_DataTag[])
    expect(coupeChoisirNiveau(dim, c, 2)).toEqual(['monde'])
  })

  test('zoomer au dessus de la colonne garde la colonne', () => {
    const { dim } = monter()
    const c = lireCoupe(dim, dim.membersAtLevel(2) as Class_DataTag[])
    expect(listeDuZoom(dim, c, 1).coches.sort()).toEqual(['afrique', 'europe', 'oceanie'])
    expect(coupeZoomer(dim, c, 1, ['europe']).sort()).toEqual(['espagne', 'france'])
  })

  test('zoomer au niveau de la colonne choisit ces membres', () => {
    const { dim, france, espagne } = monter()
    const c = lireCoupe(dim, [france, espagne])
    expect(listeDuZoom(dim, c, 2).membres.map(m => m.id).sort()).toEqual(['espagne', 'france'])
    expect(coupeZoomer(dim, c, 2, ['espagne'])).toEqual(['espagne'])
  })

  test('tout cocher retire le zoom', () => {
    const { dim, france } = monter()
    const c = lireCoupe(dim, [france])
    expect(coupeZoomer(dim, c, 2, ['france', 'espagne']).sort()).toEqual(['espagne', 'france'])
  })

  test('rien de coche : aucune selection rendue', () => {
    const { dim } = monter()
    const c = lireCoupe(dim, dim.membersAtLevel(2) as Class_DataTag[])
    expect(coupeZoomer(dim, c, 1, [])).toEqual([])
  })

  test('effacer un zoom : ce zoom et ceux en dessous tombent, la colonne reste', () => {
    const { dim, france } = monter()
    const c = lireCoupe(dim, [france])
    expect(coupeEffacerZoom(dim, c, 1).sort()).toEqual(['espagne', 'france', 'maroc', 'oceanie'])
    expect(coupeEffacerZoom(dim, c, 2).sort()).toEqual(['espagne', 'france'])
  })
})
