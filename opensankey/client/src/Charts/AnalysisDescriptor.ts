// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// Descripteur SÉRIALISABLE d'un graphique d'analyse (OS#1278). Donnée PURE (ids +
// enums, aucune classe du modèle) : c'est pour ça qu'il vit dans OS, où il peut
// devenir un attribut de style (ALL_ATTRIBUTES_CONFIG) porté par nœuds et flux et
// hérité par la cascade. La LOGIQUE d'extraction (lecture du modèle) reste en OS+
// (AnalysisChartData), qui importe ce type.
//
// Un même descripteur pilote les quatre surfaces : inspecteur, info-bulle, camembert
// sur le nœud, zone sur le canevas.

// Axe additif (les parts somment au total). `inputs`/`outputs` (sujet nœud) : un
// secteur par flux, regroupables par fluxTag. `node_children` (sujet nœud) : total
// des nœuds enfants le long d'une dimension. `flux_children` (sujet flux) : les flux
// enfant-à-enfant le long d'une dimension de nœud partagée source/cible.
export type Type_DecomposeSpec =
  | { kind: 'inputs' | 'outputs', group_by_flux_tagg_id?: string }
  | { kind: 'node_children', dimension_id: string }
  | { kind: 'flux_children', dimension_id: string }

// Axe non-additif : la valeur du sujet pour chaque tag d'un groupe de data tags,
// OU (#389) pour chacun des flux entrants / sortants d'un nœud — une barre par
// flux, libellée par le nœud d'en face. Comparer selon les flux N'EST PAS
// décomposer selon les flux : des rendements (kt/ha) ne s'additionnent pas, ils se
// juxtaposent ; c'est pour ça que cet axe est ici et pas dans Type_DecomposeSpec.
//
// Le membre « data tags » n'a pas de discriminant OBLIGATOIRE : les descripteurs
// persistés avant #389 s'écrivent `{ data_tagg_id }` tout court et restent valides
// tels quels — aucune migration de fichier n'est requise.
export type Type_CompareSpec =
  | { kind?: 'data_tag', data_tagg_id: string }
  | { kind: 'inputs' | 'outputs' }

// L'axe de comparaison porte-t-il sur les flux d'un nœud (#389) ? Prédicat partagé
// par l'extraction, le rendu et l'inspecteur : c'est lui qui distingue les deux
// membres de l'union — un test `'data_tagg_id' in spec` serait faux dès qu'un
// descripteur ancien traîne un champ résiduel.
export const isFluxCompare = (
  spec: Type_CompareSpec | null | undefined
): spec is { kind: 'inputs' | 'outputs' } =>
  !!spec && (spec.kind === 'inputs' || spec.kind === 'outputs')

// Surfaces où le graphique est publié (au-delà de l'inspecteur, toujours dispo).
export interface Type_AnalysisSurfaces {
  tooltip?: boolean
  on_node?: boolean
}

export interface Type_AnalysisDescriptor {
  decompose: Type_DecomposeSpec | null
  compare: Type_CompareSpec | null
  // SECOND axe de comparaison (#390) — OPTIONNEL : un descripteur qui ne le porte
  // pas garde exactement le comportement d'avant (aucune migration de fichier).
  // Renseigné, il croise deux axes NON ADDITIFS : une grappe par valeur du 1er axe
  // (abscisse), une barre par valeur du 2nd (séries) — barres GROUPÉES, jamais
  // empilées. L'ordre des deux champs est signifiant : c'est lui qui décide qui est
  // l'abscisse et qui est la série.
  compare_secondary?: Type_CompareSpec | null
  // Force la représentation ; sinon déduite (cf. deduceRepr).
  repr?: 'donut' | 'bars'
  surfaces?: Type_AnalysisSurfaces
}

// Second axe de comparaison EFFECTIF (#390). Deux garde-fous, portés ici pour que
// l'extraction, le rendu et l'inspecteur en héritent :
//   - il n'existe que SOUS un premier axe (sans abscisse, pas de grappes) ;
//   - deux axes « flux » ne se croisent pas — les flux entrants d'un nœud ne se
//     lisent pas « par flux sortant », la cellule du croisement n'existe pas.
export const effectiveCompareSecondary = (d: Type_AnalysisDescriptor): Type_CompareSpec | null => {
  const secondary = d.compare_secondary ?? null
  if (!secondary || !d.compare) return null
  if (isFluxCompare(d.compare) && isFluxCompare(secondary)) return null
  return secondary
}

// Croisement de deux axes de comparaison (#390) → barres GROUPÉES. Aucun des deux
// n'étant additif, leurs barres ne s'empilent jamais ENTRE ELLES : ce serait un
// mensonge visuel. Cela n'interdit pas l'axe additif — chaque barre reste empilée
// de sa propre décomposition, exactement comme dans `decompose × compare`.
export const isGroupedCross = (d: Type_AnalysisDescriptor): boolean =>
  !!d.compare && !!effectiveCompareSecondary(d)

// Décomposition EFFECTIVE (#389, étendue par #390) : l'axe additif est SANS OBJET
// dès que L'UN des deux axes de comparaison porte sur les flux — chaque barre est
// alors déjà un flux, la décomposer répéterait la même décomposition du nœud sous
// chacune.
//
// Le croisement de deux axes, à lui seul, ne neutralise RIEN : « décomposer par flux
// sortants × comparer selon l'année × comparer selon l'unité » est un cas légitime —
// une grappe par année, une barre par unité, chaque barre empilée par ses flux. Les
// trois axes coexistent parce que le premier, lui, est additif.
//
// Point de vérité unique, consommé par l'extraction, le rendu et l'inspecteur (qui
// grise le sélecteur en conséquence).
export const effectiveDecompose = (d: Type_AnalysisDescriptor): Type_DecomposeSpec | null =>
  (isFluxCompare(d.compare) || isFluxCompare(effectiveCompareSecondary(d)))
    ? null
    : d.decompose

// Représentation déduite : comparer = axe non-additif → jamais de couronne (une
// couronne « 2019/2020 » est un mensonge visuel) ; décomposer seul → couronne. Un
// croisement de deux axes de comparaison (#390) ne se replie sur AUCUN override :
// il n'existe qu'en barres groupées.
export const deduceRepr = (d: Type_AnalysisDescriptor): 'donut' | 'bars' => {
  if (isGroupedCross(d)) return 'bars'
  if (d.repr) return d.repr
  return d.compare ? 'bars' : 'donut'
}

// Un descripteur est-il « vide » (aucun axe) ? Sert à ne pas persister un
// descripteur sans contenu.
export const isDescriptorEmpty = (d: Type_AnalysisDescriptor | undefined): boolean =>
  !d || (!d.decompose && !d.compare)
