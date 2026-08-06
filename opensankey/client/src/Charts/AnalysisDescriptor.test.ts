import {
  deduceRepr,
  effectiveDecompose,
  isDescriptorEmpty,
  isFluxCompare,
  Type_AnalysisDescriptor,
  Type_CompareSpec
} from './AnalysisDescriptor'

// Issue #389 — « Comparer selon » ne proposait que des groupes de dataTags. Or
// comparer les rendements (kt/ha) des flux sortants d'un nœud n'est PAS une
// décomposition : des rendements ne sont pas les parts d'un tout, les sommer n'a
// pas de sens, et `decompose: {kind:'outputs'}` les envoyait en couronne.
//
// L'axe de comparaison accepte désormais aussi `{kind:'inputs'|'outputs'}` — une
// barre par flux. Deux propriétés se jouent ici :
//   1. RÉTRO-COMPAT : le membre dataTag n'a pas de discriminant obligatoire, donc
//      les descripteurs déjà enregistrés (`{data_tagg_id}` nu) restent valides et
//      ne sont PAS pris pour une comparaison selon les flux (aucune migration).
//   2. NEUTRALISATION : comparer selon les flux rend l'axe additif sans objet
//      (chaque barre est déjà un flux) → `effectiveDecompose` renvoie null, ce qui
//      envoie le rendu sur « une barre par série » au lieu de l'histogramme empilé.

const dataTagCompare: Type_CompareSpec = { data_tagg_id: 'tagg_annee' }
const outputsCompare: Type_CompareSpec = { kind: 'outputs' }
const inputsCompare: Type_CompareSpec = { kind: 'inputs' }

describe('#389 — isFluxCompare : reconnaître l’axe « flux d’un nœud »', () => {
  it('un axe flux sortants / entrants est reconnu', () => {
    expect(isFluxCompare(outputsCompare)).toBe(true)
    expect(isFluxCompare(inputsCompare)).toBe(true)
  })

  it('un axe dataTag PERSISTÉ AVANT #389 (sans discriminant) n’est pas un axe flux', () => {
    expect(isFluxCompare(dataTagCompare)).toBe(false)
  })

  it('un axe dataTag explicitement discriminé n’est pas non plus un axe flux', () => {
    expect(isFluxCompare({ kind: 'data_tag', data_tagg_id: 'tagg_annee' })).toBe(false)
  })

  it('absence d’axe (null / undefined) → false, jamais d’exception', () => {
    expect(isFluxCompare(null)).toBe(false)
    expect(isFluxCompare(undefined)).toBe(false)
  })
})

describe('#389 — effectiveDecompose : l’axe additif est neutralisé par l’axe flux', () => {
  it('comparer selon les flux annule la décomposition (chaque barre EST un flux)', () => {
    const d: Type_AnalysisDescriptor = {
      decompose: { kind: 'outputs' },
      compare: outputsCompare
    }
    expect(effectiveDecompose(d)).toBeNull()
  })

  it('comparer selon un dataTag laisse le croisement intact (histogramme empilé)', () => {
    const d: Type_AnalysisDescriptor = {
      decompose: { kind: 'outputs' },
      compare: dataTagCompare
    }
    expect(effectiveDecompose(d)).toEqual({ kind: 'outputs' })
  })

  it('sans axe de comparaison, la décomposition est rendue telle quelle', () => {
    const d: Type_AnalysisDescriptor = {
      decompose: { kind: 'node_children', dimension_id: 'dim_1' },
      compare: null
    }
    expect(effectiveDecompose(d)).toEqual({ kind: 'node_children', dimension_id: 'dim_1' })
  })
})

describe('#389 — un descripteur « comparer selon les flux » reste un descripteur plein', () => {
  it('il n’est pas vide (il doit être persisté et publiable sur les surfaces)', () => {
    expect(isDescriptorEmpty({ decompose: null, compare: outputsCompare })).toBe(false)
  })

  it('il se rend en barres, jamais en couronne (des rendements ne sont pas des parts)', () => {
    expect(deduceRepr({ decompose: null, compare: outputsCompare })).toBe('bars')
  })
})
