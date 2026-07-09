// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
//
// Un THÈME regroupe ce qui fait l'identité visuelle d'un logiciel de Sankey :
// une palette et sa règle d'affectation, un patch de styles, et quelques globaux.
// Cf. NOTE-THEMES.md à la racine du dépôt pour la conception et ses justifications.
//
// Points de conception qui ne se devinent pas à la lecture :
//
//   - Un thème s'applique en écrivant son patch dans le `_storage` des styles
//     `NodeStyle` / `LinkStyle`. Ces deux-là sont créés `is_deletable = true`
//     (Sankey.create_internal_style), donc NON pré-remplis des défauts usine —
//     contrairement au style `default`, qui l'est (Element.tsx:1279-1283) et qui
//     rendrait inatteignable tout maillon branché sous lui. C'est la raison pour
//     laquelle le thème n'est PAS un maillon de la cascade de résolution.
//
//   - La couleur de nœud ne peut pas passer par les styles : elle dépend du nom
//     du nœud. Elle est résolue dans Node.getShapeColorToUse() via `nodeColor()`.
//
//   - La couleur de flux, elle, passe par `shape_color_rule`, une règle déjà
//     vivante dans Link.getShapeColorToUse().

import { PALETTES, makeNodeColorPicker } from '../Persistence/sankeymaticThemes'

// Recopié de `default_background_color` (Elements/ElementsAttributesConfig) plutôt
// qu'importé : ce module y tirerait tout d3, distribué en ESM pur, que la config
// jest du paquet ne transpile pas — et `Theme` doit rester testable seul.
const OPENSANKEY_BACKGROUND = '#f2f2f2'

/** Comment le thème choisit la couleur d'un nœud. */
export type Type_NodeColorRule =
  /** Aucune palette : la couleur vient du style ou du nœud. */
  | 'none'
  /** Colormap du premier groupe de tags actif — comportement historique d'OpenSankey. */
  | 'by-tag'
  /** Palette indexée par le premier mot du nom — comportement de SankeyMATIC. */
  | 'by-name-first-word'

/** Reprend les valeurs de l'attribut `shape_color_rule` : un thème ne peut rien demander de neuf. */
export type Type_LinkColorRule = 'flow' | 'source' | 'target' | 'gradient' | 'auto'

export interface Type_ThemePalette {
  /** Vide pour les thèmes sans palette (`opensankey`, `stan`). */
  colors: readonly string[]
  /** Rotation de la palette (le `themeoffset` de SankeyMATIC). */
  offset: number
  node_rule: Type_NodeColorRule
  link_rule: Type_LinkColorRule
}

/** Patch d'attributs, aux noms d'attributs MODERNES (clés de ALL_ATTRIBUTES_CONFIG). */
export type Type_StylePatch = { [attribute: string]: string | number | boolean }

export interface Type_ThemeJSON {
  id: string
  palette: Type_ThemePalette
  styles: { [style_id: string]: Type_StylePatch }
  globals: { couleur_fond_sankey?: string }
}

/** Un thème appliqué à un diagramme. Objet de valeur : immuable et sans cache. */
export class Class_Theme {
  public readonly id: string
  public readonly palette: Type_ThemePalette
  public readonly styles: { [style_id: string]: Type_StylePatch }
  public readonly globals: { couleur_fond_sankey?: string }

  constructor(json: Type_ThemeJSON) {
    this.id = json.id
    this.palette = json.palette
    this.styles = json.styles
    this.globals = json.globals
  }

  /**
   * Fabrique un assignateur de couleurs de nœuds, ou `null` si le thème ne se
   * prononce pas sur les couleurs — auquel cas l'appelant poursuit sa cascade.
   *
   * Le picker est À ÉTAT : ses teintes dépendent de l'ordre des demandes. C'est
   * pourquoi il est fabriqué à la demande et non porté par le thème : c'est à
   * l'appelant (`Sankey.themeNodeColor`) de fixer un ordre stable, et de sauter
   * les nœuds qui portent une couleur explicite pour qu'ils ne consomment pas de
   * teinte — deux choses qu'un thème, seul, ne peut pas savoir.
   */
  public makeNodeColorPicker(): ((node_name: string) => string) | null {
    if (this.palette.node_rule !== 'by-name-first-word') return null
    if (this.palette.colors.length === 0) return null
    return makeNodeColorPicker(this.palette.colors, this.palette.offset)
  }

  public toJSON(): Type_ThemeJSON {
    return {
      id: this.id,
      palette: { ...this.palette, colors: [...this.palette.colors] },
      styles: this.styles,
      globals: this.globals,
    }
  }
}

/**
 * Thème historique d'OpenSankey. Son patch de styles est VIDE, et c'est le point :
 * `applyTheme` remet les styles de base à zéro, ce qui laisse les défauts usine
 * reprendre la main. Son `node_rule: 'by-tag'` décrit le comportement existant
 * plutôt qu'il ne le change.
 *
 * L'introduire ne doit produire strictement aucun changement d'apparence — c'est le
 * test de non-régression de l'étape 1 de NOTE-THEMES.md. Le fond, lui, est déclaré :
 * sans quoi une bascule vers `sankeymatic` (fond blanc) puis retour ne restaurerait
 * pas le gris d'OpenSankey. `loadTheme` n'applique pas les globaux, donc les fichiers
 * existants ne sont pas touchés.
 */
export const themeOpenSankey = (): Class_Theme => new Class_Theme({
  id: 'opensankey',
  palette: { colors: [], offset: 0, node_rule: 'by-tag', link_rule: 'auto' },
  styles: {},
  globals: { couleur_fond_sankey: OPENSANKEY_BACKGROUND },
})

export const DEFAULT_THEME_ID = 'opensankey'

/** Reconstruit un thème depuis le JSON d'un diagramme. Absence ⇒ `opensankey`. */
export const themeFromJSON = (json: unknown): Class_Theme => {
  if (!json || typeof json !== 'object') return themeOpenSankey()
  const j = json as Partial<Type_ThemeJSON>
  if (!j.id || !j.palette) return themeOpenSankey()
  return new Class_Theme({
    id: j.id,
    palette: {
      colors: Array.isArray(j.palette.colors) ? j.palette.colors : [],
      offset: Number(j.palette.offset) || 0,
      node_rule: j.palette.node_rule ?? 'none',
      link_rule: j.palette.link_rule ?? 'auto',
    },
    styles: j.styles ?? {},
    globals: j.globals ?? {},
  })
}

/** Le nom du thème SankeyMATIC parmi les quatre palettes `node theme a|b|c|d`. */
export const themeSankeymaticPalette = (
  theme_key: string,
  offset: number,
  link_rule: Type_LinkColorRule
): Type_ThemePalette => {
  const colors = PALETTES[theme_key.toLowerCase()] ?? []
  return {
    colors,
    offset,
    node_rule: colors.length > 0 ? 'by-name-first-word' : 'none',
    link_rule,
  }
}
