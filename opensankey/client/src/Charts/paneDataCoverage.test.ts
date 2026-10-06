// sa#594 — CE QUE COUVRENT LES COORDONNEES COCHEES D'UN VOLET.
//
// Retours d'Alexandre : le selecteur d'unites ne propose que les unites ou la selection a des
// donnees ; une unite cochee n'est jamais remplacee par une autre (le noeud non couvert se cache) ;
// sans unite cochee, un noeud que l'unite du diagramme ne couvre pas se lit dans la sienne.

import type { Class_DataTag } from '../types/Tag'
import {
  availableDataTags, candidateCoordinates, deployedCoordinates, firstCoveredCoordinates, hasCheckedDataTags
} from './paneDataCoverage'

const tag = (id: string) => ({ id } as unknown as Class_DataTag)
const annees = ['2019', '2023'].map(tag)
const unites = ['kt', 'ktmg', 'ktms'].map(tag)
const sankey = {
  data_taggs_list: [
    { id: 'annee', is_unit: false, tags_list: annees, selected_tags_list: [annees[1]] },
    { id: 'unite', is_unit: true, tags_list: unites, selected_tags_list: [unites[0]] }
  ]
}
/** Un flux qui n'a de valeur qu'aux coordonnees listees (« annee/unite »). */
const flux = (...coords: string[]) => ({
  valueForDataTags: (tags: Class_DataTag[]) => coords.includes(tags.map(t => t.id).join('/')) ? 1 : null
})
const ids = (tags: Class_DataTag[] | null) => tags === null ? null : tags.map(t => t.id)

describe('sa#594 — coordonnees couvertes', () => {
  it('essaie les etiquettes cochees dans l ordre du groupe', () => {
    const combos = candidateCoordinates(sankey, { unite: ['ktms', 'kt'] }, null, false)
    expect(combos?.map(ids)).toEqual([['2023', 'kt'], ['2023', 'ktms']])
  })

  it('sans unite cochee, retombe sur la premiere unite ou le noeud a des donnees', () => {
    const fourrage = [flux('2023/ktms')]
    expect(ids(firstCoveredCoordinates(sankey, fourrage, {}, null))).toEqual(['2023', 'ktms'])
  })

  it('une unite cochee n est jamais remplacee : le noeud non couvert n a pas de coordonnees', () => {
    const oeufs = [flux('2023/kt')]
    expect(firstCoveredCoordinates(sankey, oeufs, { unite: ['ktmg'] }, null)).toBeNull()
    expect(ids(firstCoveredCoordinates(sankey, oeufs, { unite: ['ktmg', 'kt'] }, null))).toEqual(['2023', 'kt'])
  })

  it('ne propose que les unites ou la selection a des donnees, toutes annees confondues', () => {
    const lait_oeufs = [flux('2019/ktmg'), flux('2023/kt')]
    expect(availableDataTags(sankey, lait_oeufs, 'unite', {})).toEqual(['kt', 'ktmg'])
    // L'annee cochee restreint ce qui est propose.
    expect(availableDataTags(sankey, lait_oeufs, 'unite', { annee: ['2023'] })).toEqual(['kt'])
  })

  it('sa#607 — des flux qui valent tous 0 ne couvrent pas leurs coordonnees', () => {
    const epeautre = [0, 0].map(() => ({
      valueForDataTags: (tags: Class_DataTag[]) => tags[0].id === '2019' ? 0 : 1
    }))
    expect(firstCoveredCoordinates(sankey, epeautre, { annee: ['2019'], unite: ['kt'] }, null)).toBeNull()
    expect(ids(firstCoveredCoordinates(sankey, epeautre, { annee: ['2023'], unite: ['kt'] }, null))).toEqual(['2023', 'kt'])
    expect(availableDataTags(sankey, epeautre, 'annee', { unite: ['kt'] })).toEqual(['2023'])
    // Un seul flux non nul suffit.
    const mixte = [...epeautre, flux('2019/kt')]
    expect(ids(firstCoveredCoordinates(sankey, mixte, { annee: ['2019'], unite: ['kt'] }, null))).toEqual(['2019', 'kt'])
  })

  it('sait dire si un volet a coche quelque chose', () => {
    expect(hasCheckedDataTags({})).toBe(false)
    expect(hasCheckedDataTags({ unite: [] })).toBe(false)
    expect(hasCheckedDataTags({ unite: ['kt'] })).toBe(true)
  })
})

describe('sa#596 — coordonnees deployees', () => {
  const tri = {
    data_taggs_list: [
      { id: 'annee', is_unit: false, tags_list: ['2015', '2019', '2023'].map(tag), selected_tags_list: [tag('2023')] },
      { id: 'unite', is_unit: true, tags_list: unites, selected_tags_list: [unites[0]] }
    ]
  }

  it('une valeur cochee par groupe : rien n est deploye', () => {
    expect(deployedCoordinates(tri, {})).toEqual([])
    expect(deployedCoordinates(tri, { annee: ['2015'], unite: ['kt'] })).toEqual([])
  })

  it('trois annees cochees : une coordonnee par annee, dans l ordre du groupe', () => {
    expect(deployedCoordinates(tri, { annee: ['2023', '2015', '2019'], unite: ['kt'] }))
      .toEqual([{ annee: '2015' }, { annee: '2019' }, { annee: '2023' }])
  })

  it('deux unites cochees : une coordonnee par unite', () => {
    expect(deployedCoordinates(tri, { unite: ['ktmg', 'kt'] })).toEqual([{ unite: 'kt' }, { unite: 'ktmg' }])
  })

  it('annees et unites : leur produit, l annee variant le plus lentement', () => {
    expect(deployedCoordinates(tri, { annee: ['2015', '2023'], unite: ['kt', 'ktmg'] })).toEqual([
      { annee: '2015', unite: 'kt' }, { annee: '2015', unite: 'ktmg' },
      { annee: '2023', unite: 'kt' }, { annee: '2023', unite: 'ktmg' }
    ])
  })

  it('une etiquette cochee disparue du groupe ne compte pas', () => {
    expect(deployedCoordinates(tri, { annee: ['2015', '1990'] })).toEqual([])
  })
})
