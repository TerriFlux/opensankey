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
import { resolveValueUnit } from '../Elements/ValueFormatting'

/** L'unité du diagramme, ou `''`. Le premier flux fait foi. */
export const figureUnitOf = (sankey: { links_list?: Class_LinkElement[] } | null | undefined): string => {
  const link = sankey?.links_list?.[0]
  return link ? resolveValueUnit(link) : ''
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
