// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation for the purposes of the Software.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1421 — LE PLACEMENT : une figure, un hôte, un cadre (NOTE-FIGURES.md §6).
//
// On règle une figure dans une fenêtre (l'atelier), puis on la POSE : « cette figure est le dessin
// du nœud sur le diagramme ». Un placement est un LIEN, pas une copie : rerégler la figure dans la
// fenêtre change ce que le nœud montre. Précédents : l'objet incorporé d'Office, le composant Figma.
// Embryon dans le code : `Type_AnalysisSurfaces { on_node }` (OS#1278), un booléen sur le nœud qui
// faisait RECALCULER une couronne depuis l'attribut du nœud — un placement en dur, sans figure.
//
// Ce que ce fichier pose :
//   - le TYPE d'un placement, porté par l'HÔTE (aujourd'hui : un nœud, dans son attribut
//     `figure_placements`) et qui CITE une figure par son identifiant de document ;
//   - les helpers PURS de lecture et d'écriture de la liste de placements d'un élément.
//
// Ce qu'il ne pose pas : le registre des figures par identifiant (Class_MenuConfig : `figureById`,
// `figureIdOf`, `placeFigureOnNode`, `unplaceFigureFromNode`, `nodePlacedFigure`, `figuresToJSON`),
// ni le rendu (NodeDrawShape lit le placement, le hook `draw_node_analysis_overlay` reçoit le sac
// EFFECTIF de la figure et non plus l'attribut du nœud).
//
// LA VALIDITÉ VOYAGE AVEC LA FIGURE, pas avec l'hôte (arbitrage 16/09) : poser une couronne sur
// un nœud ne la rend pas valide ; c'est `isAvailable` de sa nature, sur le sujet, qui décide, et
// une figure invalide ne se dessine pas plutôt que de se dessiner fausse.
//
// Le CADRE est aujourd'hui toujours `'bounds'` : la boîte du nœud, marges comprises, ce que le
// rendu faisait déjà (`Type_NodeChartGeom`). Un cadre libre (décalage, taille) viendra avec le
// canevas comme hôte ; on ne l'invente pas d'avance, mais on lui laisse sa place dans le type.

/** Les hôtes qui savent porter une figure. `'node'` seul aujourd'hui ; `'tooltip'`, `'canvas'`, `'page'` demain. */
export type Type_FigurePlacementHost = 'node'

export type Type_FigurePlacement = {
  /** L'identifiant de DOCUMENT de la figure citée (registre `figures`, Class_MenuConfig). */
  figure: string
  host: Type_FigurePlacementHost
  /** `'bounds'` : la boîte de l'hôte. Seule valeur aujourd'hui. */
  frame: 'bounds'
}

/** L'attribut d'un nœud qui porte ses placements. Déclaré dans `ANALYSIS_CONFIG` (ElementsAttributesConfig). */
export const FIGURE_PLACEMENTS_ATTR = 'figure_placements'

const isPlacement = (v: unknown): v is Type_FigurePlacement =>
  !!v && typeof v === 'object' && !Array.isArray(v) &&
  typeof (v as { figure?: unknown }).figure === 'string' && (v as { figure: string }).figure !== '' &&
  (v as { host?: unknown }).host === 'node'

/** Les placements d'un élément, tels qu'il les porte ; liste vide si rien ou malformé. */
export const readFigurePlacements = (
  element: { getElementProperty: (k: string) => unknown }
): Type_FigurePlacement[] => {
  const raw = element.getElementProperty(FIGURE_PLACEMENTS_ATTR)
  if (!Array.isArray(raw)) return []
  return raw.filter(isPlacement).map(p => ({ figure: p.figure, host: p.host, frame: 'bounds' as const }))
}

/**
 * La liste, un placement posé ou REMPLACÉ : UN SEUL placement par hôte. L'hôte `'node'` est le
 * nœud lui-même, qui ne dessine qu'une figure à la fois ; poser B sur un nœud qui porte A
 * remplace A — c'est ce que `nodePlacementFigureId` promet en ne rendant qu'un identifiant, et un
 * filtre sur (figure, hôte) seul laissait `[A, B]` avec A toujours dessinée (relecture du lot 5J).
 */
export const withFigurePlacement = (
  list: Type_FigurePlacement[], placement: Type_FigurePlacement
): Type_FigurePlacement[] => [
  ...list.filter(p => p.host !== placement.host),
  { ...placement }
]

/** La liste, une figure retirée de tous ses hôtes. */
export const withoutFigure = (list: Type_FigurePlacement[], figure_id: string): Type_FigurePlacement[] =>
  list.filter(p => p.figure !== figure_id)

/** L'identifiant de la figure posée SUR le nœud (hôte 'node'), ou `null`. Une seule par nœud. */
export const nodePlacementFigureId = (list: Type_FigurePlacement[]): string | null =>
  list.find(p => p.host === 'node')?.figure ?? null
