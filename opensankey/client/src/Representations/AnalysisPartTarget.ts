// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1399 — LA CIBLE D'UNE PART DE COURONNE (et d'une barre d'histogramme).
//
// C'est LE cas qui a imposé qu'une nature RÉSOLVE sa cible d'élément au lieu de la déclarer une
// fois pour toutes : selon l'axe de décomposition, une part est un FLUX, un NŒUD enfant ou un TAG.
// Une couronne décomposée par flux et la même décomposée par dimension ne visent donc pas le même
// objet, alors que ce sont le même dessin, la même entrée de registre et le même sujet.
//
// Module PUR : aucune dépendance React ni D3, et rien qui lise le DOM — il traduit un élément déjà
// désigné (`Type_RepresentationTarget`) et un descripteur en une cible partagée. La nature de la
// part vient d'`analysisPartKind` (OS, avec le descripteur) : couronne et histogramme montrent le
// même axe, ils ne sauraient en tirer deux réponses différentes.

import type { Type_RepresentationTarget } from './RepresentationContextMenu'
import {
  elementTarget, type Type_WindowTarget
} from './WindowTarget'
import {
  analysisPartKind, type Type_AnalysisDescriptor
} from '../Charts/AnalysisDescriptor'

/**
 * Les `data-repr-kind` qui désignent une PART dans les figures d'analyse : le secteur d'une
 * couronne, la barre (ou le segment empilé) d'un histogramme. Le fond, la légende et tout ce qui
 * n'est pas dans cette liste ne désignent rien du modèle — on parle alors de la figure entière.
 *
 * Déclarés ici, et non dans chaque moteur de dessin, pour la raison qui a fait naître
 * `REPR_KIND_ATTR` : deux chaînes écrites en dur de part et d'autre divergeraient un jour sans que
 * rien ne le signale, et le clic répondrait « la figure » là où on a cliqué une part.
 */
export const ANALYSIS_PART_KINDS: readonly string[] = ['slice', 'bar']

/**
 * La cible de l'élément pointé dans une couronne ou un histogramme.
 *
 * Rend `null` quand le geste ne vise aucune part (le fond, une légende) ou quand la part n'a pas
 * d'homologue identifiable dans le modèle : c'est alors de la FIGURE qu'on parle, et c'est
 * `resolveRepresentationElementTarget` qui le dit — pas ce module, qui ne connaît que les parts.
 */
export const analysisPartTarget = (
  target: Type_RepresentationTarget,
  descriptor: Type_AnalysisDescriptor | null | undefined
): Type_WindowTarget | null => {
  if (!descriptor) return null
  if (!ANALYSIS_PART_KINDS.includes(target.kind)) return null
  const kind = analysisPartKind(descriptor)
  if (!kind) return null
  // Sans identifiant, il reste la NATURE de la part : l'auteur a bien cliqué un flux, même si le
  // moteur ne l'a pas étiqueté. Les commandes qui ont besoin de l'objet lui-même le verront à
  // `id: null` et s'abstiendront, plutôt que d'agir sur un objet qu'on n'a pas su nommer.
  return elementTarget(kind, target.id)
}
