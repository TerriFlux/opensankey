// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1527 — LE MODÈLE DE LÉGENDE COMMUN aux couronnes et au Sankey (Julien, 10/10 : « la disposition de
// la légende pour les dataTags hiérarchiques doit être la même pour les couronnes et les Sankey : un
// modèle de légende commun »).
//
// Avant : une règle d'arbre commune (`legendHierarchy`), mais quatre rendus (couronne, sunburst, petits
// multiples en d3 ; colonne du Sankey en React) et l'export SVG, chacun avec ses mesures, ses en-têtes
// (avec ou sans pastille), sa police (14 px côté couronnes, 12 côté Sankey) et son ordre (ordre de
// l'arbre côté Sankey, ordre des secteurs côté couronne). Ici, UNE ligne de légende (`Type_LegendRow`),
// UNE fonction qui pose les lignes d'une dimension (`dimensionLegendRows`), UNE pastille
// (`legendSwatch`), et les mesures que tous les rendus lisent.
//
// Arbitrages de Julien (10/10) :
//  1. ORDRE = celui du DESSIN : l'appelant le donne (`order`) — le réglage `members_order` de la
//     dimension côté Sankey, l'ordre des secteurs dessinés côté couronne.
//  2. EN-TÊTE d'un ancêtre ouvert : GRAS, SANS PASTILLE, partout.
//  3. PASTILLE = la couleur DESSINÉE (secteur, bande).
//  4. TEXTE 12 px (`ui_text`) ; décoché : grisé à l'écran, absent des images exportées.
//
// Module PUR (aucun DOM, aucun modèle) : le rendu DOM est dans `legendRowsDom`, l'export dans
// `legendSvg`, la colonne React dans `SankeyLegendPanel`.

import { LEGEND_INDENT_EM, legendTreeRows } from './legendHierarchy'
import type { Type_LegendTreeAncestor } from './legendHierarchy'
import { LEGEND_SAMPLE_VALUE, type Type_LegendEntryFormat } from './legendTagStyle'
import { ui_ink, ui_ink_disabled, ui_ink_secondary, ui_ink_strong, ui_line_strong, ui_text } from '../css/uiTokens'

export { LEGEND_INDENT_EM, legendTreeRows, relativeIndents, sortByTreeRanks } from './legendHierarchy'
export type { Type_LegendTreeAncestor, Type_LegendTreeRow } from './legendHierarchy'

// MESURES COMMUNES ===================================================================================

/** La police des légendes à l'écran, en px (`ui_text`). */
export const LEGEND_FONT_PX = parseInt(ui_text, 10)
/** Côté de la pastille, en hauteurs de police. */
export const LEGEND_SWATCH_EM = 0.7
/** Écart entre case, pastille et texte. */
export const LEGEND_GAP = '0.35rem'
/** Marges d'une ligne (haut/bas, côtés), avant retrait. */
export const LEGEND_ROW_PAD_Y = '0.1rem'
export const LEGEND_ROW_PAD_X = '0.2rem'
/** Graisse d'un titre et d'un en-tête. */
export const LEGEND_HEADING_WEIGHT = 600
/** La teinte d'une ligne décochée : pastille, puis texte. */
export const LEGEND_UNCHECKED_SWATCH = ui_line_strong
export const LEGEND_UNCHECKED_INK = ui_ink_disabled
/** L'encre du texte de légende. */
export const LEGEND_INK = ui_ink_strong
/** Le décalage de la pastille pour rester en face de la première ligne du nom. */
export const LEGEND_SWATCH_TOP_EM = 0.15

/** Le retrait CSS d'une ligne de `indent` niveaux. */
export const legendRowPaddingLeft = (indent: number): string =>
  indent > 0 ? `calc(${LEGEND_ROW_PAD_X} + ${indent * LEGEND_INDENT_EM}em)` : LEGEND_ROW_PAD_X

// LA LIGNE ===========================================================================================

/** La pastille d'une ligne : une couleur, ou un format d'étiquette (bordure, pointillés, hachures, icône, valeur). */
export type Type_LegendRowSwatch = string | { color?: string, format: Type_LegendEntryFormat }

/**
 * UNE LIGNE DE LÉGENDE.
 *  - `title` : le nom d'une dimension ou d'un groupe ; gras, sans pastille.
 *  - `heading` : un ancêtre OUVERT d'une dimension à niveaux ; gras, sans pastille, sans case.
 *  - `entry` : une part dessinée (membre, étiquette) ; pastille, case éventuelle.
 *  - `others` : « Autres », toujours en dernier, sans retrait ni case.
 *  - `context` : une ligne de rappel (« Année : 2015 »).
 */
export type Type_LegendRow = {
  key: string
  kind: 'title' | 'heading' | 'entry' | 'others' | 'context'
  label: string
  /** Retrait en niveaux (× `LEGEND_INDENT_EM`). */
  indent: number
  swatch?: Type_LegendRowSwatch
  /** Présent : la ligne a une case (cochée = dessinée). */
  checked?: boolean
  /** Le membre que la ligne désigne. */
  target?: { dimension_id: string, member_id: string }
  /** Info-bulle de la case. */
  hint?: string
  /** Définition (info-bulle de la ligne). */
  description?: string
}

/** Un membre de dimension, vu par la légende : son identifiant et son parent. */
export type Type_LegendMember = { id: string, parent?: Type_LegendMember }

const depthOf = (m: Type_LegendMember): number => {
  let depth = 0
  for (let p = m.parent; p !== undefined; p = p.parent) depth++
  return depth
}

/**
 * Les ancêtres OUVERTS d'un membre, du plus haut au plus proche : ceux qui ne sont pas plus haut que le
 * moins profond des membres listés (`min_depth`). Au-dessus, ce sont des niveaux que la légende ne
 * déplie pas (« Tous produits ») : ils ne s'écrivent pas.
 */
export const openLegendAncestors = <M extends Type_LegendMember>(member: M, min_depth: number): M[] => {
  const out: M[] = []
  let depth = depthOf(member)
  for (let p = member.parent; p !== undefined && --depth >= min_depth; p = p.parent) out.unshift(p as M)
  return out
}

export type Type_DimensionLegendOptions<M extends Type_LegendMember> = {
  /** Les membres à lister (dessinés, ou décochés gardés à leur place). */
  listed: readonly M[]
  /** Le nom d'un membre (ou d'un ancêtre en en-tête), déjà dans la langue. */
  labelOf: (member: M) => string
  /** La couleur DESSINÉE d'un membre (secteur, bande) ; absente : à poser par le tracé. */
  colorOf?: (member: M) => Type_LegendRowSwatch | undefined
  /** Cochée = dessinée ; absent : pas de case. */
  checkedOf?: (member: M) => boolean | undefined
  /** L'ORDRE DU DESSIN (arbitrage 1) ; absent : l'ordre reçu. */
  order?: (members: M[]) => M[]
  /** Clé d'une entrée ; défaut `<dimension>/<membre>`. */
  keyOf?: (member: M) => string
  /** Clé d'un en-tête, d'après la ROUTE de l'ancêtre (deux routes, deux en-têtes). */
  headingKeyOf?: (route: string[]) => string
  descriptionOf?: (member: M) => string | undefined
  hintOf?: (member: M) => string | undefined
  /** Les ancêtres qu'on peut écrire en en-tête (portée de la figure) ; défaut : tous les ouverts. */
  inScope?: (ancestor: M) => boolean
  /** Arbre : défaut, dès qu'un membre listé a un parent. */
  hierarchical?: boolean
  /** « Autres », en dernier. */
  others?: { label: string, swatch?: Type_LegendRowSwatch, key?: string }
  /** Le titre de la dimension, en tête. */
  title?: { label: string, key?: string, description?: string }
}

/**
 * LES LIGNES D'UNE DIMENSION, la seule fonction qui les pose — pour la couronne comme pour le Sankey :
 * titre, puis les membres dans l'ordre du dessin, chaque ancêtre ouvert en en-tête (gras, sans
 * pastille) à la place de son premier membre, ses membres un cran plus loin (retraits RELATIFS au moins
 * profond), « Autres » en dernier sans retrait.
 */
export function dimensionLegendRows<M extends Type_LegendMember>(
  dim: { id: string },
  opts: Type_DimensionLegendOptions<M>
): Type_LegendRow[] {
  const ordered = opts.order ? opts.order([...opts.listed]) : [...opts.listed]
  const hierarchical = opts.hierarchical ?? ordered.some(m => m.parent !== undefined)
  const min_depth = hierarchical && ordered.length > 0 ? Math.min(...ordered.map(depthOf)) : 0
  const by_id = new Map<string, M>()
  const inScope = opts.inScope ?? (() => true)
  const tree = legendTreeRows(ordered, (m): Type_LegendTreeAncestor[] | undefined => {
    if (!hierarchical) return undefined
    return openLegendAncestors(m, min_depth).filter(inScope).map(a => {
      by_id.set(a.id, a)
      return { id: a.id, label: opts.labelOf(a) }
    })
  })
  const keyOf = opts.keyOf ?? ((m: M) => `${dim.id}/${m.id}`)
  const headingKeyOf = opts.headingKeyOf ?? ((route: string[]) => `${dim.id}/heading/${route.join('/')}`)
  const rows: Type_LegendRow[] = []
  if (opts.title !== undefined) {
    const title: Type_LegendRow = { key: opts.title.key ?? `${dim.id}/title`, kind: 'title', label: opts.title.label, indent: 0 }
    if (opts.title.description !== undefined) title.description = opts.title.description
    rows.push(title)
  }
  tree.forEach(r => {
    if (r.kind === 'heading') {
      const route = r.key.split('\u0000')
      const ancestor = by_id.get(route[route.length - 1])
      const heading: Type_LegendRow = { key: headingKeyOf(route), kind: 'heading', label: r.label, indent: r.indent }
      if (ancestor !== undefined) {
        heading.target = { dimension_id: dim.id, member_id: ancestor.id }
        const description = opts.descriptionOf?.(ancestor)
        if (description !== undefined) heading.description = description
      }
      rows.push(heading)
      return
    }
    const m = r.entry
    const row: Type_LegendRow = {
      key: keyOf(m), kind: 'entry', label: opts.labelOf(m), indent: r.indent,
      target: { dimension_id: dim.id, member_id: m.id }
    }
    const swatch = opts.colorOf?.(m)
    if (swatch !== undefined) row.swatch = swatch
    const checked = opts.checkedOf?.(m)
    if (checked !== undefined) row.checked = checked
    const description = opts.descriptionOf?.(m)
    if (description !== undefined) row.description = description
    const hint = opts.hintOf?.(m)
    if (hint !== undefined) row.hint = hint
    rows.push(row)
  })
  if (opts.others !== undefined) {
    const others: Type_LegendRow = { key: opts.others.key ?? `${dim.id}/__others__`, kind: 'others', label: opts.others.label, indent: 0 }
    if (opts.others.swatch !== undefined) others.swatch = opts.others.swatch
    rows.push(others)
  }
  return rows
}

/**
 * Les lignes d'une liste de PARTS (couronne à un anneau, petits multiples) : même règle d'arbre, mais
 * les ancêtres sont ceux que la décomposition a posés sur chaque part (`ancestorsOf`). L'ordre est
 * celui reçu (l'ordre des secteurs) ; `isOthers` reste en dernier.
 */
export function partLegendRows<T>(
  parts: readonly T[],
  opts: {
    keyOf: (part: T) => string
    labelOf: (part: T) => string
    ancestorsOf?: (part: T) => readonly Type_LegendTreeAncestor[] | undefined
    isOthers?: (part: T) => boolean
    swatchOf?: (part: T) => Type_LegendRowSwatch | undefined
    checkedOf?: (part: T) => boolean | undefined
  }
): { row: Type_LegendRow, part?: T }[] {
  const isOthers = opts.isOthers ?? (() => false)
  return legendTreeRows(parts, part => opts.ancestorsOf?.(part), isOthers).map(r => {
    if (r.kind === 'heading') {
      return { row: { key: `heading/${r.key.split('\u0000').join('/')}`, kind: 'heading', label: r.label, indent: r.indent } }
    }
    const part = r.entry
    const row: Type_LegendRow = {
      key: opts.keyOf(part), kind: isOthers(part) ? 'others' : 'entry', label: opts.labelOf(part), indent: r.indent
    }
    const swatch = opts.swatchOf?.(part)
    if (swatch !== undefined) row.swatch = swatch
    const checked = isOthers(part) ? undefined : opts.checkedOf?.(part)
    if (checked !== undefined) row.checked = checked
    return { row, part }
  })
}

/**
 * RANGE des lignes d'arbre dans l'ordre du DESSIN (arbitrage 1), sans casser l'arbre : un en-tête et
 * ses lignes plus retirées forment un sous-arbre, et les sous-arbres frères se rangent par le plus
 * petit rang de leurs entrées (`rankOf`). Une entrée sans rang (non dessinée : décochée) garde sa place
 * derrière son frère précédent — décocher ne la déplace pas. « Autres » reste en dernier.
 */
export function sortLegendRowsByDrawing(
  rows: readonly Type_LegendRow[], rankOf: (row: Type_LegendRow) => number | undefined
): Type_LegendRow[] {
  type Node = { row: Type_LegendRow, children: Node[], rank: number }
  const tail = rows.filter(r => r.kind === 'others' || r.kind === 'context')
  const head = rows.filter(r => r.kind === 'title')
  const body = rows.filter(r => r.kind === 'heading' || r.kind === 'entry')
  const root: Node[] = []
  const stack: Node[] = []
  body.forEach(row => {
    const node: Node = { row, children: [], rank: Infinity }
    while (stack.length > 0 && stack[stack.length - 1].row.indent >= row.indent) stack.pop()
    ;(stack.length > 0 ? stack[stack.length - 1].children : root).push(node)
    if (row.kind === 'heading') stack.push(node)
  })
  const rankNode = (node: Node): number => {
    const own = node.row.kind === 'entry' ? rankOf(node.row) : undefined
    const children = node.children.map(rankNode)
    node.rank = Math.min(own ?? Infinity, ...children)
    return node.rank
  }
  const order = (nodes: Node[]): Node[] => {
    // Un frère DÉCOCHÉ sans rang hérite de celui qui le précède : il reste derrière lui. Un frère sans
    // rang parce qu'il n'a RIEN à dessiner (valeur nulle, toujours coché) va à la fin — Julien, 10/10 :
    // « Viande chevaline » sans secteur restait en tête.
    let previous = -Infinity
    const keyed = nodes.map((node, i) => {
      const r = Number.isFinite(node.rank) ? node.rank
        : node.row.checked === false ? previous
          : Infinity
      if (Number.isFinite(r)) previous = r
      return { node, r, i }
    })
    keyed.sort((a, b) => a.r - b.r || a.i - b.i)
    return keyed.map(k => k.node)
  }
  const out: Type_LegendRow[] = [...head]
  const walk = (nodes: Node[]) => order(nodes).forEach(node => { out.push(node.row); walk(node.children) })
  root.forEach(rankNode)
  walk(root)
  return [...out, ...tail]
}

// LA PASTILLE ========================================================================================

// Les hachures d'un nœud (`shape_hatch`), dans l'orientation du style.
const HATCH_ANGLE: { [k: string]: number } = { vertical: 0, horizontal: 90, diagonal: 45, antidiagonal: -45 }

const esc = (s: string): string => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const num = (v: number): string => String(Math.round(v * 100) / 100)

export type Type_LegendSwatchOptions = {
  /** Ligne décochée : pastille grise (`LEGEND_UNCHECKED_SWATCH`). */
  unchecked?: boolean
  /** Identifiant du motif de hachures (unique dans le document). */
  pattern_id?: string
  /** Tracé d'une icône du catalogue du diagramme, par son nom. */
  iconPath?: (icon_name: string) => string | undefined
}

/** Une pastille : sa taille et son dessin SVG à (x, y). */
export type Type_LegendSwatch = { w: number, h: number, svg: (x: number, y: number) => string }

/**
 * LA PASTILLE, une seule fonction pour l'écran (couronnes, colonne du Sankey) et l'image exportée :
 * carré de côté `h` aux coins de 2/14 h, de la couleur dessinée ; un format d'étiquette y ajoute
 * bordure, pointillés, hachures, icône ou valeur d'exemple (alors élargie). `undefined` : rien à
 * montrer (ni couleur ni icône).
 */
export const legendSwatch = (
  swatch: Type_LegendRowSwatch | undefined, h: number, options: Type_LegendSwatchOptions = {}
): Type_LegendSwatch | undefined => {
  if (swatch === undefined) return undefined
  const format = typeof swatch === 'string' ? undefined : swatch.format
  const base_color = typeof swatch === 'string' ? swatch : (format?.swatch?.color ?? swatch.color)
  const unchecked = options.unchecked === true
  const fmt = format?.swatch
  const color = unchecked ? LEGEND_UNCHECKED_SWATCH : base_color
  const icon = format?.icon
  if (color === undefined && icon === undefined) return undefined
  const has_value = format?.value !== undefined
  // Élargie quand elle porte la valeur d'exemple (30 × 14), ou des tirets de flux (deux vides entiers).
  const w = has_value ? h * 30 / 14 : (fmt?.link_dashed === true ? h * 2 : h)
  const border = fmt?.border_visible === true
  const dashed = fmt?.border_dashed === true || fmt?.link_dashed === true
  const hatch = fmt?.hatch !== undefined && fmt.hatch !== 'none' ? HATCH_ANGLE[fmt.hatch] : undefined
  // SA#551 — opacité sans couleur : un damier sous le carré dit « transparence », pas « gris ».
  const checker = !unchecked && fmt?.opacity !== undefined && fmt.color === undefined
  const ink = unchecked ? LEGEND_UNCHECKED_INK : ui_ink
  const unit = h / 14
  const pattern_id = options.pattern_id ?? 'legend_hatch'
  return {
    w, h,
    svg: (x, y) => {
      const parts: string[] = []
      if (checker) {
        const cell = num(3.5 * unit)
        const checker_id = `${pattern_id}_checker`
        parts.push(`<defs><pattern id="${checker_id}" width="${num(7 * unit)}" height="${num(7 * unit)}" patternUnits="userSpaceOnUse">` +
          `<rect width="${num(7 * unit)}" height="${num(7 * unit)}" fill="#ffffff"/>` +
          `<rect width="${cell}" height="${cell}" fill="#c8c8c8"/>` +
          `<rect x="${cell}" y="${cell}" width="${cell}" height="${cell}" fill="#c8c8c8"/></pattern></defs>`)
        parts.push(`<rect x="${num(x + 0.5 * unit)}" y="${num(y + 0.5 * unit)}" width="${num(w - unit)}" height="${num(h - unit)}" rx="${num(2 * unit)}" fill="url(#${checker_id})"/>`)
      }
      if (hatch !== undefined) {
        parts.push(`<defs><pattern id="${pattern_id}" width="${num(3 * unit)}" height="${num(3 * unit)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${hatch})">` +
          `<rect width="${num(3 * unit)}" height="${num(3 * unit)}" fill="${esc(color ?? 'none')}"/>` +
          `<line x1="0" y1="0" x2="0" y2="${num(3 * unit)}" stroke="${ink}" stroke-width="${num(unit)}"/></pattern></defs>`)
      }
      const stroke = border || dashed ? esc(fmt?.border_color ?? ui_ink_secondary) : 'none'
      const stroke_w = border ? Math.min(3, fmt?.border_thickness ?? 1) * unit : unit
      parts.push(`<rect x="${num(x + 0.5 * unit)}" y="${num(y + 0.5 * unit)}" width="${num(w - unit)}" height="${num(h - unit)}" rx="${num(2 * unit)}"` +
        ` fill="${hatch !== undefined ? `url(#${pattern_id})` : esc(color ?? 'none')}"` +
        ` fill-opacity="${unchecked ? 1 : (fmt?.opacity ?? 1)}" stroke="${stroke}" stroke-width="${num(stroke_w)}"` +
        (dashed ? ` stroke-dasharray="${num(3 * unit)} ${num(2 * unit)}"` : '') + '/>')
      if (icon?.is_image === true && icon.image_src !== undefined) {
        parts.push(`<image href="${esc(icon.image_src)}" x="${num(x + unit)}" y="${num(y + unit)}" width="${num(h - 2 * unit)}" height="${num(h - 2 * unit)}"/>`)
      } else if (icon !== undefined && icon.icon_name) {
        const d = options.iconPath?.(icon.icon_name)
        if (d) {
          parts.push(`<svg x="${num(x + unit)}" y="${num(y + unit)}" width="${num(h - 2 * unit)}" height="${num(h - 2 * unit)}" viewBox="${esc(icon.view_box || '0 0 24 24')}">` +
            `<path d="${esc(d)}" fill="${esc(unchecked ? LEGEND_UNCHECKED_INK : (icon.color ?? ink))}"/></svg>`)
        }
      }
      const value = format?.value
      if (value !== undefined) {
        const sample = value.uppercase === true ? LEGEND_SAMPLE_VALUE.toLocaleUpperCase() : LEGEND_SAMPLE_VALUE
        parts.push(`<text x="${num(x + w / 2)}" y="${num(y + h / 2 + 3.2 * unit)}" text-anchor="middle" font-size="${num(9 * unit)}"` +
          ` fill="${esc(value.color ?? ui_ink_strong)}" font-weight="${value.bold === true ? 700 : 400}"` +
          (value.italic === true ? ' font-style="italic"' : '') +
          (value.font_family ? ` font-family="${esc(value.font_family)}"` : '') + `>${esc(sample)}</text>`)
      }
      return parts.join('')
    }
  }
}

/**
 * La pastille À L'ÉCRAN : un `<svg>` de `LEGEND_SWATCH_EM` em de haut (élargi s'il le faut), en
 * chaîne — le rendu DOM des couronnes et la colonne React l'insèrent tels quels. Vide : pas de pastille.
 */
export const legendSwatchMarkup = (swatch: Type_LegendRowSwatch | undefined, options: Type_LegendSwatchOptions = {}): string => {
  const s = legendSwatch(swatch, 14, options)
  if (s === undefined) return ''
  return `<svg class="legend_swatch" width="${num(LEGEND_SWATCH_EM * s.w / s.h)}em" height="${LEGEND_SWATCH_EM}em"` +
    ` viewBox="0 0 ${num(s.w)} ${num(s.h)}" aria-hidden="true" style="flex:0 0 auto;margin-top:${LEGEND_SWATCH_TOP_EM}em">${s.svg(0, 0)}</svg>`
}
