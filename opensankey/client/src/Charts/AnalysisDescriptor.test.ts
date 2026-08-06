import {
  deduceRepr,
  effectiveCompareSecondary,
  effectiveDecompose,
  isDescriptorEmpty,
  isFluxCompare,
  isGroupedCross,
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

// Issue #390 — SECOND axe de comparaison. « Comparer selon » était un sélecteur
// unique : on y mettait les flux OU un groupe de dataTags, jamais les deux. Le
// croisement « flux × millésime » n'était donc ni exprimable, ni représentable (le
// seul croisement disponible, `decompose × compare`, est EMPILÉ — or empiler
// suppose que les parts s'additionnent, ce qui est faux pour des rendements).
//
// La grammaire porte désormais `compare_secondary`, optionnel. Trois propriétés se
// jouent ici : la RÉTRO-COMPAT (sans le champ, rien ne bouge), les GARDE-FOUS du
// second axe (il n'existe que sous un premier, et deux axes flux ne se croisent
// pas), et la NEUTRALISATION de l'axe additif sous un croisement.

const dataTagCompare2: Type_CompareSpec = { data_tagg_id: 'tagg_scenario' }

describe('#390 — effectiveCompareSecondary : les garde-fous du second axe', () => {
  it('le second axe n’existe pas sans premier axe (sans abscisse, pas de grappes)', () => {
    expect(effectiveCompareSecondary({
      decompose: null, compare: null, compare_secondary: dataTagCompare
    })).toBeNull()
  })

  it('flux × flux ne se croise pas : la valeur d’un flux ne se lit pas par flux', () => {
    expect(effectiveCompareSecondary({
      decompose: null, compare: outputsCompare, compare_secondary: inputsCompare
    })).toBeNull()
  })

  it('flux × dataTag se croise (le cas d’usage : rendement par mode, par année)', () => {
    expect(effectiveCompareSecondary({
      decompose: null, compare: outputsCompare, compare_secondary: dataTagCompare
    })).toEqual(dataTagCompare)
  })

  it('dataTag × dataTag se croise aussi (millésime × scénario)', () => {
    expect(effectiveCompareSecondary({
      decompose: null, compare: dataTagCompare, compare_secondary: dataTagCompare2
    })).toEqual(dataTagCompare2)
  })

  it('RÉTRO-COMPAT : un descripteur sans le champ n’a pas de second axe', () => {
    expect(effectiveCompareSecondary({ decompose: null, compare: dataTagCompare })).toBeNull()
    expect(isGroupedCross({ decompose: null, compare: dataTagCompare })).toBe(false)
  })
})

describe('#390 — isGroupedCross : ce qui bascule sur les barres groupées', () => {
  it('deux axes de comparaison valides → croisement groupé', () => {
    expect(isGroupedCross({
      decompose: null, compare: outputsCompare, compare_secondary: dataTagCompare
    })).toBe(true)
  })

  it('un second axe écarté par les garde-fous ne bascule rien', () => {
    expect(isGroupedCross({
      decompose: null, compare: outputsCompare, compare_secondary: inputsCompare
    })).toBe(false)
  })

  it('`decompose × compare` reste un croisement EMPILÉ, pas groupé', () => {
    // Cas légitime : des flux qui composent bien un total, comparés par année.
    expect(isGroupedCross({ decompose: { kind: 'outputs' }, compare: dataTagCompare })).toBe(false)
  })
})

describe('#390 — l’axe additif est neutralisé par le croisement', () => {
  it('un croisement de deux comparaisons annule la décomposition', () => {
    const d: Type_AnalysisDescriptor = {
      decompose: { kind: 'outputs' },
      compare: dataTagCompare,
      compare_secondary: dataTagCompare2
    }
    // Sans neutralisation, l'extraction empilerait la décomposition du nœud SOUS
    // chaque barre du croisement — trois axes dans un graphique qui n'en tient deux.
    expect(effectiveDecompose(d)).toBeNull()
  })

  it('un second axe écarté laisse l’empilement intact', () => {
    const d: Type_AnalysisDescriptor = {
      decompose: { kind: 'outputs' },
      compare: dataTagCompare,
      compare_secondary: null
    }
    expect(effectiveDecompose(d)).toEqual({ kind: 'outputs' })
  })
})

describe('#390 — un croisement n’existe qu’en barres', () => {
  it('même un override « couronne » ne le replie pas (aucun axe n’est additif)', () => {
    expect(deduceRepr({
      decompose: null, compare: outputsCompare, compare_secondary: dataTagCompare, repr: 'donut'
    })).toBe('bars')
  })

  it('l’override reste honoré hors croisement (rétro-compat)', () => {
    expect(deduceRepr({ decompose: { kind: 'outputs' }, compare: null, repr: 'donut' })).toBe('donut')
  })
})
