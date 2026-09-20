import { analysisPartTarget } from './AnalysisPartTarget'
import type { Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'

/**
 * os#1399 - LA COURONNE, ET POURQUOI UNE NATURE RESOUT SA CIBLE.
 *
 * Le meme secteur, dans la meme figure, sur le meme sujet : ce qu on vient de cliquer change de
 * NATURE avec l axe de decomposition. C est ce que `decomposeSubject` fabrique - une part par
 * flux, par noeud enfant ou par tag -, et c est ce qui interdit a une entree de registre de
 * declarer sa cible d element une fois pour toutes.
 */

// Le secteur cliquable d une couronne, tel que l etiquetage `data-*` le designe.
const slice = { kind: 'slice', id: 'part_1' }

const withDecompose = (decompose: Type_AnalysisDescriptor['decompose']): Type_AnalysisDescriptor =>
  ({ decompose, compare: null })

describe('la cible d une part de couronne suit l axe de decomposition', () => {
  it('decomposer par flux sortants : la part est un FLUX', () => {
    expect(analysisPartTarget(slice, withDecompose({ kind: 'outputs' })))
      .toEqual({ kind: 'link', count: 1, id: 'part_1', representation_id: null })
  })

  it('decomposer par flux entrants groupes par etiquettes : la part est un TAG', () => {
    expect(analysisPartTarget(
      slice, withDecompose({ kind: 'inputs', group_by_flux_tagg_id: 'produit' })
    )).toMatchObject({ kind: 'tag', id: 'part_1' })
  })

  it('decomposer par une dimension : la part est un NOEUD enfant', () => {
    expect(analysisPartTarget(
      slice, withDecompose({ kind: 'node_children', dimension_id: 'especes' })
    )).toMatchObject({ kind: 'node', id: 'part_1' })
  })

  it('decomposer un flux en flux enfants : la part est un FLUX', () => {
    expect(analysisPartTarget(
      slice, withDecompose({ kind: 'flux_children', dimension_id: 'especes' })
    )).toMatchObject({ kind: 'link', id: 'part_1' })
  })

  it('les trois axes ne donnent pas la meme reponse pour le meme secteur', () => {
    const kinds = [
      { kind: 'outputs' } as const,
      { kind: 'inputs', group_by_flux_tagg_id: 'produit' } as const,
      { kind: 'node_children', dimension_id: 'especes' } as const
    ].map(spec => analysisPartTarget(slice, withDecompose(spec))?.kind)
    expect(kinds).toEqual(['link', 'tag', 'node'])
  })
})

describe('la cible d une barre quand il n y a pas d axe additif', () => {
  it('comparer selon les flux : la barre est un FLUX', () => {
    // #389 - une barre par flux, l axe additif etant alors sans objet.
    expect(analysisPartTarget(
      { kind: 'bar', id: 'flux_7' },
      { decompose: { kind: 'outputs' }, compare: { kind: 'inputs' } }
    )).toMatchObject({ kind: 'link', id: 'flux_7' })
  })

  it('comparer selon un groupe d etiquettes de donnees : la barre est un TAG', () => {
    expect(analysisPartTarget(
      { kind: 'bar', id: 'annee_2020' },
      { decompose: null, compare: { data_tagg_id: 'annees' } }
    )).toMatchObject({ kind: 'tag', id: 'annee_2020' })
  })
})

describe('ce qui n est pas une part ne designe rien du modele', () => {
  it('le fond ne resout pas : c est de la figure qu on parle', () => {
    expect(analysisPartTarget({ kind: 'background', id: null }, withDecompose({ kind: 'outputs' })))
      .toBeNull()
  })

  it('un descripteur sans aucun axe ne resout pas', () => {
    expect(analysisPartTarget(slice, { decompose: null, compare: null })).toBeNull()
    expect(analysisPartTarget(slice, null)).toBeNull()
  })

  it('une part sans identifiant garde sa nature, sans objet a viser', () => {
    // Le moteur n a pas etiquete l objet : l auteur a bien clique un flux, mais on ne sait pas
    // lequel. Mieux vaut le dire que de rendre une cible qui pretend viser quelque chose.
    expect(analysisPartTarget({ kind: 'slice', id: null }, withDecompose({ kind: 'outputs' })))
      .toEqual({ kind: 'link', count: 1, id: null, representation_id: null })
  })
})
