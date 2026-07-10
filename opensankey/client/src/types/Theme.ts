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

/**
 * Le thème `stan`. Doit rester en phase avec `_stan_theme()` de
 * `server/stan_smfa.py`, qui le pose sur les diagrammes importés : celui-ci ne sert
 * qu'à la bascule manuelle depuis l'interface.
 *
 * Pas de palette : STAN n'attribue aucune couleur automatiquement. Le noir est son
 * défaut, et toute couleur y est un choix de l'utilisateur, posé sur l'élément.
 *
 * La silhouette de STAN — flux à angle droit — ne vient PAS d'ici. Elle tient au
 * placement des nœuds et à `shape_orientation` par flux, tous deux lus dans le
 * fichier à l'import. Un thème ne touche pas aux coordonnées.
 */
export const themeStan = (): Class_Theme => new Class_Theme({
  id: 'stan',
  palette: { colors: [], offset: 0, node_rule: 'none', link_rule: 'flow' },
  styles: {
    NodeStyle: {
      shape_type: 'rect',
      shape_color: '#ffffff',
      shape_border_visible: true,
      shape_border_color: '#000000',
      shape_border_thickness: 1,
      name_label_is_visible: true,
      name_label_inside_vert: true,
      name_label_inside_horiz: true,
      value_label_is_visible: false,
    },
    LinkStyle: {
      shape_color: '#000000',
      shape_color_rule: 'flow',
      shape_opacity: 1,
      shape_is_curved: false,
      shape_is_arrow: true,
      // Les pointes de flèche de STAN sont nettement plus allongées que notre défaut (10).
      shape_arrow_size: 25,
      // Le nom du flux vient de `value.text_value` : `Class_LinkElement.name` est un
      // getter calculé « source---cible », sans setter. Le défaut de
      // `name_label_text_source` étant déjà `custom`, il suffit de rendre le label visible.
      name_label_is_visible: true,
      name_label_color: '#000000',
      // STAN écrit le nom du flux SOUS son tracé, et la valeur dessus, dans l'ellipse.
      name_label_vert: 'bottom',
      name_label_on_path: false,
      value_label_is_visible: true,
      value_label_on_path: true,
      value_label_color: '#000000',
      // STAN écrit des entiers, jamais de décimales.
      value_label_custom_digit: true,
      value_label_nb_digit: 0,
      // L'ellipse blanche à liseré noir demande TROIS attributs, pas un : DrawLabel
      // ne peint que si `background_color_visible`, et n'utilise la couleur déclarée
      // que si `background_color_sustainable` l'est aussi — sinon il reprend celle de
      // l'élément, et l'ellipse blanche devient une ellipse de la couleur du flux.
      value_label_background_visible: true,
      value_label_background_type: 'ellipse',
      value_label_background_color_visible: true,
      value_label_background_color_sustainable: true,
      value_label_background_color: '#ffffff',
      value_label_background_opacity: 1,
      value_label_background_border_visible: true,
      value_label_background_border_color: '#000000',
      value_label_background_border_thickness: 1,
      // Sans marges, `rx = largeur_texte / 2` : l'ellipse est INSCRITE dans le rectangle
      // du texte et lui coupe les coins. Ces clés ne sont pas déclarées dans Element.tsx
      // (typage seul) mais existent bien dans ALL_ATTRIBUTES_CONFIG.
      value_label_background_margin_left: 8,
      value_label_background_margin_right: 8,
      value_label_background_margin_top: 3,
      value_label_background_margin_bottom: 3,
    },
  },
  globals: { couleur_fond_sankey: '#ffffff' },
})

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
