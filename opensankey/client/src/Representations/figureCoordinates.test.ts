// os#1431 — LA TRADUCTION DOIT ETRE FIDELE DANS LES DEUX SENS, et les quatre regles du modele
// doivent tenir sans qu aucune surface les repete.
//
// Ce que ces tests protegent, au fond : le panneau de coordonnees ne change AUCUN format. Il lit un
// descripteur ecrit hier, le rend sous forme d etats de champs, et le reecrit tel qu il etait tant
// qu on n y touche pas. Un aller-retour infidele ferait deriver des fichiers a la seule ouverture
// du panneau — la faute qu on ne voit jamais au moment ou on la commet.

import type { Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'
import {
  applyCoordinates,
  coordFieldKey,
  coordinatesOf,
  partsFieldKey,
  seriesFieldKeys,
  setCoordState,
  type Type_FigureCoordinates
} from './figureCoordinates'

describe('les cles de champ', () => {
  test('separent les trois sortes, meme a identifiant identique', () => {
    expect(coordFieldKey({ kind: 'data_tagg', id: 'annee', name: 'Annee' })).toBe('dt:annee')
    expect(coordFieldKey({ kind: 'dimension', id: 'annee', name: 'Annee' })).toBe('dim:annee')
    expect(coordFieldKey({ kind: 'flows', side: 'outputs', name: 'Sorties' })).toBe('flows:outputs')
  })
})

describe('lire un descripteur', () => {
  test('une decomposition par sorties donne un champ flux en parts', () => {
    const coords = coordinatesOf({ decompose: { kind: 'outputs' }, compare: null }, null)
    expect(coords['flows:outputs']).toEqual({ mode: 'parts' })
    expect(partsFieldKey(coords)).toBe('flows:outputs')
  })

  test('le regroupement par etiquette de flux est la granularite du champ, pas un champ de plus', () => {
    const coords = coordinatesOf(
      { decompose: { kind: 'outputs', group_by_flux_tagg_id: 'essence' }, compare: null }, null)
    expect(coords['flows:outputs']).toEqual({ mode: 'parts', group_by_flux_tagg_id: 'essence' })
    expect(Object.keys(coords)).toHaveLength(1)
  })

  test('les deux axes de comparaison sont ordonnes par leur rang', () => {
    const coords = coordinatesOf({
      decompose: { kind: 'outputs' },
      compare: { data_tagg_id: 'annee' },
      compare_secondary: { data_tagg_id: 'scenario' }
    }, null)
    expect(seriesFieldKeys(coords)).toEqual(['dt:annee', 'dt:scenario'])
  })

  test('une epingle sur un groupe non deploye devient une coordonnee fixee', () => {
    const coords = coordinatesOf({ decompose: { kind: 'outputs' }, compare: null }, { annee: '2019' })
    expect(coords['dt:annee']).toEqual({ mode: 'fixed', value_id: '2019' })
  })

  // os#1420 arbitrait cette contradiction a la main, parce que l axe et l epingle vivaient dans
  // deux cartes. Un champ dans UN etat la rend impossible a ecrire.
  test('une epingle sur un groupe deploye est ignoree : un champ na quun etat', () => {
    const coords = coordinatesOf(
      { decompose: null, compare: { data_tagg_id: 'annee' } }, { annee: '2019' })
    expect(coords['dt:annee']).toEqual({ mode: 'series', rank: 1 })
  })

  // Le grisage d hier, vu de l autre bout : le descripteur PORTE une decomposition, le dessin ne la
  // lit pas. Le panneau ne doit pas la montrer, sinon il rejoue le reglage mort.
  test('une decomposition que le dessin nannule pas nest pas rendue', () => {
    const coords = coordinatesOf(
      { decompose: { kind: 'node_children', dimension_id: 'region' }, compare: { kind: 'outputs' } },
      null)
    expect(partsFieldKey(coords)).toBeNull()
    expect(coords['flows:outputs']).toEqual({ mode: 'series', rank: 1 })
  })

  test('un second axe invalide nest pas rendu non plus', () => {
    const coords = coordinatesOf(
      { decompose: null, compare: { kind: 'inputs' }, compare_secondary: { kind: 'outputs' } }, null)
    expect(seriesFieldKeys(coords)).toEqual(['flows:inputs'])
  })
})

describe('ecrire un descripteur', () => {
  test('une dimension deployee decompose en noeuds enfants sous un noeud, en flux enfants sous un flux', () => {
    const coords: Type_FigureCoordinates = { 'dim:region': { mode: 'parts' } }
    expect(applyCoordinates(coords, 'node').descriptor.decompose)
      .toEqual({ kind: 'node_children', dimension_id: 'region' })
    expect(applyCoordinates(coords, 'flux').descriptor.decompose)
      .toEqual({ kind: 'flux_children', dimension_id: 'region' })
  })

  test('les coordonnees fixees ressortent en epingles, les deployees non', () => {
    const coords: Type_FigureCoordinates = {
      'dt:annee': { mode: 'fixed', value_id: '2019' },
      'dt:scenario': { mode: 'series', rank: 1 }
    }
    expect(applyCoordinates(coords, 'node').pins).toEqual({ annee: '2019' })
  })

  test('ce que les coordonnees ne gouvernent pas survit', () => {
    const base: Type_AnalysisDescriptor = {
      decompose: { kind: 'inputs' }, compare: null, repr: 'bars', scale_mode: 'per_group',
      surfaces: { on_node: true }
    }
    const written = applyCoordinates({ 'flows:outputs': { mode: 'parts' } }, 'node', base).descriptor
    expect(written.repr).toBe('bars')
    expect(written.scale_mode).toBe('per_group')
    expect(written.surfaces).toEqual({ on_node: true })
    expect(written.decompose).toEqual({ kind: 'outputs' })
  })

  test('un descripteur sans second axe nen gagne pas un vide', () => {
    const written = applyCoordinates({ 'flows:outputs': { mode: 'parts' } }, 'node').descriptor
    expect('compare_secondary' in written).toBe(false)
  })
})

describe('aller-retour', () => {
  const cases: [string, Type_AnalysisDescriptor][] = [
    ['couronne des sorties', { decompose: { kind: 'outputs' }, compare: null }],
    ['sorties par essence', { decompose: { kind: 'outputs', group_by_flux_tagg_id: 'essence' }, compare: null }],
    ['empile : usages par annee', { decompose: { kind: 'outputs' }, compare: { data_tagg_id: 'annee' } }],
    ['une barre par flux', { decompose: null, compare: { kind: 'outputs' } }],
    ['croise annee x scenario', {
      decompose: { kind: 'node_children', dimension_id: 'region' },
      compare: { data_tagg_id: 'annee' },
      compare_secondary: { data_tagg_id: 'scenario' }
    }]
  ]
  test.each(cases)('%s se relit tel quel', (_name, descriptor) => {
    const back = applyCoordinates(coordinatesOf(descriptor, null), 'node', descriptor).descriptor
    expect(back.decompose).toEqual(descriptor.decompose)
    expect(back.compare).toEqual(descriptor.compare)
    expect(back.compare_secondary ?? null).toEqual(descriptor.compare_secondary ?? null)
  })
})

describe('les quatre regles du modele', () => {
  test('un seul champ en parts : le precedent rend la main', () => {
    const coords = setCoordState(
      { 'flows:outputs': { mode: 'parts' } }, 'dim:region', { mode: 'parts' })
    expect(partsFieldKey(coords)).toBe('dim:region')
    expect(coords['flows:outputs']).toBeUndefined()
  })

  test('au plus deux champs en series : le plus ancien rend la main et les rangs glissent', () => {
    let coords: Type_FigureCoordinates = {}
    coords = setCoordState(coords, 'dt:annee', { mode: 'series', rank: 1 })
    coords = setCoordState(coords, 'dt:scenario', { mode: 'series', rank: 1 })
    coords = setCoordState(coords, 'dt:unite', { mode: 'series', rank: 1 })
    expect(seriesFieldKeys(coords)).toEqual(['dt:scenario', 'dt:unite'])
    expect(coords['dt:scenario']).toEqual({ mode: 'series', rank: 1 })
    expect(coords['dt:unite']).toEqual({ mode: 'series', rank: 2 })
  })

  test('deux champs flux ne se juxtaposent pas', () => {
    const coords = setCoordState(
      { 'flows:inputs': { mode: 'series', rank: 1 } }, 'flows:outputs', { mode: 'series', rank: 1 })
    expect(seriesFieldKeys(coords)).toEqual(['flows:outputs'])
  })

  // La disparition du grisage : l autre champ ne reste pas affiche et mort, il REVIENT au diagramme.
  test('des flux juxtaposes rendent les parts au diagramme', () => {
    const coords = setCoordState(
      { 'dim:region': { mode: 'parts' } }, 'flows:outputs', { mode: 'series', rank: 1 })
    expect(partsFieldKey(coords)).toBeNull()
    expect(coords['flows:outputs']).toEqual({ mode: 'series', rank: 1 })
  })

  test('et reciproquement : poser des parts libere les flux juxtaposes', () => {
    const coords = setCoordState(
      { 'flows:outputs': { mode: 'series', rank: 1 } }, 'dim:region', { mode: 'parts' })
    expect(seriesFieldKeys(coords)).toEqual([])
    expect(partsFieldKey(coords)).toBe('dim:region')
  })

  test('une epingle ne se pose que sur un groupe detiquettes de donnees', () => {
    const coords = setCoordState({}, 'flows:outputs', { mode: 'fixed', value_id: 'x' })
    expect(coords['flows:outputs']).toBeUndefined()
  })

  test('rendre un champ au diagramme le sort du sac', () => {
    const coords = setCoordState({ 'dt:annee': { mode: 'fixed', value_id: '2019' } }, 'dt:annee', null)
    expect(coords).toEqual({})
  })
})
