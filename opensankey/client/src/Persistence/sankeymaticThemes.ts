// ==================================================================================================
// Thèmes de couleur SankeyMATIC — portage de la section « Color Theme handling »
// de `build/sankeymatic.js` (https://github.com/nowthis/sankeymatic).
//
// Copyright (c) 2014-2024, Steve Bogart, <sbogart@sankeymatic.com>
//
// ISC (Internet Software Consortium) License:
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS.
//
// IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING
// FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
// NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION
// WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
//
// Les quatre palettes reproduisent celles de d3-scale-chromatic (ISC,
// Copyright 2010-2023 Mike Bostock) : schemeCategory10, schemeTableau10,
// schemeDark2, schemeSet3. Elles sont recopiées ici plutôt qu'importées afin
// que ce module — comme ./sankeymaticLayout — reste sans dépendance : d3 est
// distribué en ESM pur, que la configuration jest du paquet ne transpile pas.
//
// Adaptations TypeScript : Copyright (c) 2026 TerriFlux (licence MIT du projet).
// ==================================================================================================

/** Les quatre palettes de `node theme a|b|c|d`, dans l'ordre de SankeyMATIC. */
export const PALETTES: { [key: string]: readonly string[] } = {
  // schemeCategory10
  a: [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  ],
  // schemeTableau10
  b: [
    '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
    '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
  ],
  // schemeDark2
  c: [
    '#1b9e77', '#d95f02', '#7570b3', '#e7298a',
    '#66a61e', '#e6ab02', '#a6761d', '#666666',
  ],
  // schemeSet3
  d: [
    '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
    '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f',
  ],
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** Copie du tableau de couleurs, tournée de `offset` crans (`themeoffset <clé> <n>`). */
export const rotateColors = (colors: readonly string[], offset: number): string[] => {
  const goodOffset = clamp(offset, 0, colors.length)
  return colors.slice(goodOffset).concat(colors.slice(0, goodOffset))
}

/**
 * Fabrique l'assignateur de couleurs de nœuds d'un diagramme.
 *
 * Reproduit le `d3.scaleOrdinal` de SankeyMATIC : la clé n'est pas le nom complet
 * du nœud mais son PREMIER mot (sensible à la casse), si bien que « Player 1 » et
 * « Player 1: » partagent leur couleur. Les couleurs sont distribuées dans l'ordre
 * de première demande, puis cyclent.
 *
 * Le picker est À ÉTAT : deux appels dans un ordre différent ne donnent pas les
 * mêmes couleurs. L'appelant est responsable de la stabilité de cet ordre.
 * `colors` ne doit pas être vide.
 */
export const makeNodeColorPicker = (
  colors: readonly string[],
  offset: number
): ((name: string) => string) => {
  const rotated = rotateColors(colors, offset)
  const assigned = new Map<string, string>()
  return (name: string): string => {
    // Premier fragment non blanc du nom (ou une valeur de repli si le nom est vide).
    const key = (name.match(/^\s*(\S+)/) ?? [null, 'name-is-blank'])[1] as string
    let color = assigned.get(key)
    if (color === undefined) {
      color = rotated[assigned.size % rotated.length]
      assigned.set(key, color)
    }
    return color
  }
}
