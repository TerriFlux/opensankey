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

// Axe non-additif : la valeur du sujet pour chaque tag d'un groupe de data tags.
export interface Type_CompareSpec { data_tagg_id: string }

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
