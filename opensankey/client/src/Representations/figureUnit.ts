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

// os#1425 — L'UNITÉ QU'UNE FIGURE ÉCRIT À CÔTÉ DE SES VALEURS.
//
// Lue sur un flux représentatif, comme partout ailleurs (`resolveValueUnit`, Elements) : la figure
// écrit la même unité que les étiquettes du dessin, ou aucune quand le diagramme n'en montre pas —
// une seule unité, une seule décision. Un seul endroit pour toutes les figures : la couronne, le
// sunburst et les barres ne doivent pas pouvoir diverger sur ce qu'elles appellent « l'unité ».

import type { Class_LinkElement } from '../Elements/Link'
import { resolveValueUnit, resolveValueUnitFactor } from '../Elements/ValueFormatting'

/** L'unité du diagramme, ou `''`. Le premier flux fait foi. */
export const figureUnitOf = (sankey: { links_list?: Class_LinkElement[] } | null | undefined): string => {
  const link = sankey?.links_list?.[0]
  return link ? resolveValueUnit(link) : ''
}

/**
 * 30/09/2026 — LE FACTEUR QUI VA AVEC LE SYMBOLE, lu sur le MÊME flux représentatif : un symbole
 * sans son facteur écrit « 59 320 Mt » là où le dessin dit « 59.32 Mt » (os#1511).
 */
export const figureUnitFactorOf = (sankey: { links_list?: Class_LinkElement[] } | null | undefined): number => {
  const link = sankey?.links_list?.[0]
  return link ? resolveValueUnitFactor(link) : 1
}

/** Le facteur pour un NŒUD, sur le même flux que `figureUnitOfNode`. */
export const figureUnitFactorOfNode = (node: {
  input_links_list?: Class_LinkElement[]
  output_links_list?: Class_LinkElement[]
  sankey?: { links_list?: Class_LinkElement[] }
}): number => {
  const link = node.input_links_list?.[0] ?? node.output_links_list?.[0]
  return link ? resolveValueUnitFactor(link) : figureUnitFactorOf(node.sankey)
}

/** L'unité pour un NŒUD : ses propres flux d'abord, le diagramme à défaut. */
export const figureUnitOfNode = (node: {
  input_links_list?: Class_LinkElement[]
  output_links_list?: Class_LinkElement[]
  sankey?: { links_list?: Class_LinkElement[] }
}): string => {
  const link = node.input_links_list?.[0] ?? node.output_links_list?.[0]
  return link ? resolveValueUnit(link) : figureUnitOf(node.sankey)
}
