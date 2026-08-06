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
  // Force la représentation ; sinon déduite (cf. deduceRepr).
  repr?: 'donut' | 'bars'
  surfaces?: Type_AnalysisSurfaces
}

// Décomposition EFFECTIVE (#389) : l'axe additif est SANS OBJET quand on compare
// selon les flux — chaque barre est déjà un flux, la décomposer répéterait la même
// décomposition du nœud sous chacune. Point de vérité unique, consommé par
// l'extraction, le rendu et l'inspecteur (qui grise le sélecteur en conséquence).
export const effectiveDecompose = (d: Type_AnalysisDescriptor): Type_DecomposeSpec | null =>
  isFluxCompare(d.compare) ? null : d.decompose

// Représentation déduite : comparer = axe non-additif → jamais de couronne (une
// couronne « 2019/2020 » est un mensonge visuel) ; décomposer seul → couronne.
export const deduceRepr = (d: Type_AnalysisDescriptor): 'donut' | 'bars' => {
  if (d.repr) return d.repr
  return d.compare ? 'bars' : 'donut'
}

// Un descripteur est-il « vide » (aucun axe) ? Sert à ne pas persister un
// descripteur sans contenu.
export const isDescriptorEmpty = (d: Type_AnalysisDescriptor | undefined): boolean =>
  !d || (!d.decompose && !d.compare)
