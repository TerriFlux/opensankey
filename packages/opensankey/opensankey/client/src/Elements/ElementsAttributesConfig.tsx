// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { TFunction } from 'i18next'
import { useMemo } from 'react'
import { Class_ApplicationData } from '../types/ApplicationData'
import { Type_Position } from '../types/Utils'
import { Class_ElementStyle } from './Element'
import { Class_LinkElement } from './Link'
import { UnitType } from './LinkValues'
import { Class_NodeBase } from './NodeBase'

// Types spécifiques
export type Type_Shape = 'ellipse' | 'rect' | 'bezier_outline' | 'bezier_path' | 'capsule' | 'capsule_h'
export type Type_TextHPos = 'left' | 'middle' | 'right'
export type Type_TextVPos = 'top' | 'middle' | 'bottom'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
// Alignement de la pile d'ancres des flux le long d'un côté du nœud.
// 'center' = comportement historique (pile centrée sur le côté).
export type Type_AnchorAlignVertical = 'top' | 'center' | 'bottom'
export type Type_AnchorAlignHorizontal = 'left' | 'center' | 'right'
export const default_anchor_align_vertical: Type_AnchorAlignVertical = 'center'
export const default_anchor_align_horizontal: Type_AnchorAlignHorizontal = 'center'
// Orientation des hachures de remplissage d'un nœud ('none' = pas de hachure).
export type Type_HatchOrientation = 'none' | 'vertical' | 'horizontal' | 'diagonal' | 'antidiagonal'
export const default_hatch_orientation: Type_HatchOrientation = 'none'
export type Type_VerticalAlignment = 'left' | 'right'
export type Type_ExtremityPosition = 'top' | 'bottom' | 'left' | 'right'
export const default_position_type = 'absolute'
export const default_auto_x = false
export const default_auto_y = false
export const default_dx = 200
export const default_dy = 50
export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
// Ancrage de droiture d'un flux (#665, refonte multi-ancrage). 'none' = libre (flux non
// contraint). 'source'/'target' = l'accroche aval/amont s'aligne sur l'autre (déplace le
// nœud opposé). 'highest'/'lowest' = les deux accroches s'alignent sur la plus haute / la
// plus basse. 'absolute' (réservé, 2e passe) = la position propre du flux place les nœuds.
export type Type_StraightMode = 'none' | 'source' | 'target' | 'highest' | 'lowest' | 'absolute'
export type Type_PathLabelHPosition = 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'top' | 'middle' | 'bottom'
export type Type_customisable_style_attr = keyof typeof ALL_ATTRIBUTES_CONFIG
export const default_grey_color = 'grey'
export const default_black_color = 'black'
export const default_background_color = '#f2f2f2'
export const default_grid_color = '#d3d3d3'
export const default_element_color = '#a9a9a9'
export const default_element_color_source = 'auto'
export const default_font = 'Arial,sans-serif'
export const font_families = [
  'Andale Mono,monospace',
  'Apple Chancery,cursive',
  'Arial,sans-serif',
  'Avanta Garde,sans-serif',
  'Baskerville,serif',
  'Big Caslon,serif',
  'Bodoni MT,serif',
  'Book Antiqua,serif',
  'Bookman,serif',
  'Bradley Hand,cursive',
  'Brush Script MT,cursive',
  'Brush Script Std,cursive',
  'Calibri,sans-serif',
  'Calisto MT,serif',
  'Cambria,serif',
  'Candara,sans-serif',
  'Century Gothic,sans-serif',
  'Comic Sans MS,cursive',
  'Comic Sans,cursive',
  'Consolas,monospace',
  'Coronet script,cursive',
  'Courier New,monospace',
  'Courier,monospace',
  'Didot,serif',
  'Florence,cursive',
  'Franklin Gothic Medium,sans-serif',
  'Futara,sans-serif',
  'Garamond,serif',
  'Geneva,sans-serif',
  'Georgia,serif',
  'Gill Sans,sans-serif',
  'Goudy Old Style,serif',
  'Helvetica,sans-serif',
  'Hoefler Text,serif',
  'Lucida Bright,serif',
  'Lucida Console,monospace',
  'Lucida Sans Typewriter,monospace',
  'Lucida Sans,sans-serif',
  'Lucidatypewriter,monospace',
  'Monaco,monospace',
  'New Century Schoolbook,serif',
  'Noto,sans-serif',
  'Optima,sans-serif',
  'Palatino,serif',
  'Parkavenue,cursive',
  'Perpetua,serif',
  'Rockwell Extra Bold,serif',
  'Rockwell,serif',
  'Segoe UI,sans-serif',
  'Snell Roundhan,cursive',
  'Times New Roman,serif',
  'Trebuchet MS,sans-serif',
  'URW Chancery,cursive',
  'Verdana,sans-serif',
  'Zapf Chancery,cursive',
]
export const default_stick_to_drawing = true
export const default_masked = true
export const default_display_legend_scale = false
export const default_legend_police = 16
export const default_legend_bg_border = false
export const default_legend_bg_color = default_element_color
export const default_legend_bg_opacity = 0
export const default_legend_show_dataTags = true
export const default_legend_show_constraints = false
export const default_width = 180
export const default_info_link_value_void = false
export const default_legend_position_x = 300
export const default_legend_position_y = 50
// Titre du diagramme : zone de texte (Class_ContainerElement) marquée is_title.
export const default_title_source = 'custom'
export const default_title_font_size = 24
export const default_title_bold = true
export const default_title_text = 'Titre'
export const default_title_id = 'drawing_title'
export const initial_show_structure = 'free_value'
export const default_grid_size = 50
export const default_grid_visible = true
export const default_scale = 50
export const default_DA_marging = 50

// Paper format types and constants
export type Type_PaperFormat = 'free' | 'A3' | 'A4' | 'A5'
export type Type_PaperOrientation = 'landscape' | 'portrait'
export type Type_ExportDPI = 150 | 300
export const default_export_dpi: Type_ExportDPI = 150

// Paper dimensions in mm (portrait orientation: width < height)
export const PAPER_DIMENSIONS_MM: Record<Exclude<Type_PaperFormat, 'free'>, { width: number; height: number }> = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
}

export const default_paper_format: Type_PaperFormat = 'free'
export const default_paper_orientation: Type_PaperOrientation = 'landscape'
export const default_margin_mm = 10

// Target font sizes per paper format (in CSS px)
export const PAPER_TARGET_FONT_SIZES: Record<Exclude<Type_PaperFormat, 'free'>, {
  node_name: number
  node_value: number
  link_name: number
  link_value: number
}> = {
  A3: { node_name: 24, node_value: 20, link_name: 18, link_value: 18 },
  A4: { node_name: 18, node_value: 16, link_name: 14, link_value: 14 },
  A5: { node_name: 14, node_value: 12, link_name: 11, link_value: 11 },
}

// Types d'actions disponibles
export type BaseActionType =
  | 'drawElements'
  | 'drawShape'
  | 'drawNameLabel'
  | 'drawValueLabel'
  | 'drawStockBox'
  | 'drawFO'
  | 'drawImage'
  | 'drawIcon'
  | 'applyPosition'

export type NodeBaseActionType = BaseActionType
export type LinkBaseActionType = BaseActionType | 'drawArrow' | 'drawControlPoint' | 'drawWithNodes'

// Interface pour la configuration d'un attribut
export interface AttributeConfig<T> {
  default: T
  type: () => T
  category: string
  labels: { en: string; fr: string; es: string; de: string; it: string }
  tooltips: { en: string; fr: string; es: string; de: string; it: string }
  callback?: string
  setter?: string
  actions?: (BaseActionType | NodeBaseActionType | LinkBaseActionType)[]
}
export type ConfigType = Record<string, AttributeConfig<unknown>>

export type ExtractConfigValue<T> = T extends AttributeConfig<infer V> ? V : never

export type ShapePrefix =
  | 'shape'
  | 'name_label_background'
  | 'value_label_background'
  | 'stock_label_background'

export type LabelPrefix =
  | 'value_label'
  | 'name_label'
  | 'icon'
  | 'stock_label'
/**
 * Fonction générique pour vérifier si une valeur est indéterminée
 * (différente entre plusieurs éléments)
 * 
 * @example
 * // Avec préfixe
 * const isColorIndeterminate = isConfigValueIndeterminate(
 *   selectedElements,
 *   BASE_SHAPE_CONFIG,
 *   'color',
 *   'shape'
 * )
 * 
 * @example
 * // Sans préfixe
 * const isIconColorIndeterminate = isConfigValueIndeterminate(
 *   selectedElements,
 *   ICON_CONFIG,
 *   'icon_color'
 * )
 */
export const isConfigValueIndeterminate = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>(
    elements: ElementsType,
    config: CONFIG,
    configKey: K,
    prefix: string
  ): boolean => {
  if (elements.length === 0) return false

  const fullKey = prefix ? `${prefix}_${String(configKey)}` : String(configKey)
  const firstValue = Reflect.get(elements[0], fullKey)

  return !elements.every(el => Reflect.get(el, fullKey) === firstValue)
}

// ✅ Fonctions spécialisées simplifiées (optionnelles, pour garder l'API existante)
export const isShapeValueIndeterminate = (
  elements: ElementsType,
  prefix: ShapePrefix,
  configKey: keyof typeof BASE_SHAPE_CONFIG
) => isConfigValueIndeterminate(elements, BASE_SHAPE_CONFIG, configKey, prefix)

export const isNodeShapeSpecificValueIndeterminate = (
  elements: Class_NodeBase[] | Class_ElementStyle[],
  configKey: keyof typeof NODE_SHAPE_SPECIFIC_CONFIG
) => isConfigValueIndeterminate(elements, NODE_SHAPE_SPECIFIC_CONFIG, configKey, 'shape')

export const isLinkShapeSpecificValueIndeterminate = (
  elements: Class_LinkElement[] | Class_ElementStyle[],
  configKey: keyof typeof LINK_SHAPE_SPECIFIC_CONFIG
) => isConfigValueIndeterminate(elements, LINK_SHAPE_SPECIFIC_CONFIG, configKey, 'shape')

// export const isNameLabelValueIndeterminate = (
//   elements: ElementsType,
//   configKey: keyof typeof NAME_LABEL_CONFIG
// ) => isConfigValueIndeterminate(elements, NAME_LABEL_CONFIG, configKey, 'name_label')

export const isValueLabelIndeterminate = (
  elements: ElementsType,
  configKey: keyof typeof VALUE_LABEL_CONFIG
) => isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, configKey, 'value_label')

export const isLinkLabelSpecificValueIndeterminate = (
  elements: Class_LinkElement[] | Class_ElementStyle[],
  prefix: 'name_label' | 'value_label',
  configKey: keyof typeof LINKS_LABEL_SPECIFIC_CONFIG
) => isConfigValueIndeterminate(elements, LINKS_LABEL_SPECIFIC_CONFIG, configKey, prefix)

/**
 * Construit la clé d'attribut complète pour un shape
 * 
 * @example
 * getShapeAttributeKey('shape', 'color') // 'shape_color'
 * getShapeAttributeKey('name_label_background', 'visible') // 'name_label_background_visible'
 */
export function getShapeAttributeKey<
  T extends typeof BASE_SHAPE_CONFIG,
  P extends ShapePrefix,
  K extends keyof T
>(
  prefix: P,
  configKey: K
): `${P}_${string & K}` {
  return `${prefix}_${String(configKey)}` as `${P}_${string & K}`
}

export function getNodeShapeAttributeKey<
  T extends typeof NODE_SHAPE_SPECIFIC_CONFIG,
  P extends ShapePrefix,
  K extends keyof T
>(
  prefix: P,
  configKey: K
): `${P}_${string & K}` {
  return `${prefix}_${String(configKey)}` as `${P}_${string & K}`
}

export function getLinkShapeAttributeKey<
  T extends typeof LINK_SHAPE_SPECIFIC_CONFIG,
  P extends ShapePrefix,
  K extends keyof T
>(
  prefix: P,
  configKey: K
): `${P}_${string & K}` {
  return `${prefix}_${String(configKey)}` as `${P}_${string & K}`
}

export function getLabelAttributeKey<
  T extends typeof BASE_LABEL_CONFIG,
  P extends LabelPrefix,
  K extends keyof T
>(
  prefix: P,
  configKey: K
): `${P}_${string & K}` {
  return `${prefix}_${String(configKey)}` as `${P}_${string & K}`
}

export function getLinkLabelAttributeKey<
  T extends typeof LINKS_LABEL_SPECIFIC_CONFIG,
  P extends LabelPrefix,
  K extends keyof T
>(
  prefix: P,
  configKey: K
): `${P}_${string & K}` {
  return `${prefix}_${String(configKey)}` as `${P}_${string & K}`
}

// ==================================================================================================
// HELPER POUR CRÉER DES CONFIGS AVEC PRÉFIXES
// ==================================================================================================
// eslint-disable-next-line
type ConfigWithPrefix<T extends Record<string, AttributeConfig<any>>, P extends string> = {
  [K in keyof T as P extends '' ? K : `${P}_${string & K}`]: T[K]
}

export function createConfigWithPrefix<
  // eslint-disable-next-line
  T extends Record<string, AttributeConfig<any>>,
  P extends string
>(
  baseConfig: T,
  prefix: P
): ConfigWithPrefix<T, P> {
  // eslint-disable-next-line
  const result: any = {}

  for (const [key, config] of Object.entries(baseConfig)) {
    const newKey = prefix ? `${prefix}_${key}` : key
    result[newKey] = {
      ...config,
      labels: {
        en: config.labels.en,
        fr: config.labels.fr,
        es: config.labels.es,
        de: config.labels.de,
        it: config.labels.it
      },
      tooltips: {
        en: config.tooltips.en,
        fr: config.tooltips.fr,
        es: config.tooltips.es,
        de: config.tooltips.de,
        it: config.tooltips.it
      }
    }
  }

  return result as ConfigWithPrefix<T, P>
}


type PrefixKeys<T extends Record<string, AttributeConfig<boolean | number | string>>, P extends string> = {
  [K in keyof T as P extends '' ? K : `${P}_${string & K}`]: T[K]
}

// type ConfigOverrides = {
//     [key: string]: {
//         default?: any
//         labels?: { en: string; fr: string }
//         tooltips?: { en: string; fr: string }
//         setter?:
//     }
// }
export type ConfigOverrides<T extends Record<string, AttributeConfig<unknown>>> = Partial<{
  [K in keyof T]: {
    default?: ExtractConfigValue<T[K]>
    category?: string
    labels?: { en: string; fr: string; es: string; de: string; it: string }
    tooltips?: { en: string; fr: string; es: string; de: string; it: string }
    callback?: string
    setter?: string
    actions?: (BaseActionType | NodeBaseActionType | LinkBaseActionType)[]
  }
}>
// eslint-disable-next-line
export function createConfigWithPrefixAndOverrides<T extends Record<string, AttributeConfig<any>>, P extends string>(
  baseConfig: T,
  prefix: P,
  category: string,
  actions: BaseActionType[],
  overrides?: ConfigOverrides<T>
): PrefixKeys<T, P> {
  // eslint-disable-next-line
  const result: any = {}

  for (const [key, config] of Object.entries(baseConfig)) {
    const newKey = prefix !== '' ? `${prefix}_${key}` : key
    const override = overrides?.[key] || {}

    result[newKey] = {
      ...config,
      default: override.default !== undefined ? override.default : config.default,
      type: override.default !== undefined
        // eslint-disable-next-line
        ? (() => override.default) as any
        : config.type,
      category: category,
      actions: actions,
      labels: override.labels || {
        en: config.labels.en,
        fr: config.labels.fr,
        es: config.labels.es,
        de: config.labels.de,
        it: config.labels.it
      },
      tooltips: override.tooltips || {
        en: config.tooltips.en,
        fr: config.tooltips.fr,
        es: config.tooltips.es,
        de: config.tooltips.de,
        it: config.tooltips.it
      }
    }
  }

  return result
}

export const BASE_SHAPE_CONFIG = {
  visible: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    // drawElements en plus de drawShape pour que toggler la visibilité d'un
    // fond de label rafraîchisse aussi le label (sinon le fond et ses
    // poignées de redimensionnement n'apparaissent/disparaissent pas).
    actions: ['drawShape', 'drawElements'] as BaseActionType[],
    labels: {
      en: 'Shape and background',
      fr: 'Forme et Fond',
      es: 'Forma y fondo',
      de: 'Form und Hintergrund',
      it: 'Forma e sfondo'
    },
    tooltips: {
      en: 'Show or hide the shape',
      fr: 'Afficher ou masquer la forme',
      es: 'Mostrar u ocultar la forma',
      de: 'Form anzeigen oder ausblenden',
      it: 'Mostra o nascondi la forma'
    }
  } satisfies AttributeConfig<boolean>,

  type: {
    default: 'rect' as Type_Shape,
    type: (() => 'rect') as (() => Type_Shape),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],
    labels: {
      en: 'Shape type',
      fr: 'Type de forme',
      es: 'Tipo de forma',
      de: 'Formtyp',
      it: 'Tipo di forma'
    },
    tooltips: {
      en: 'Choose a shape (rectangle, ellipse, capsule)',
      fr: 'Choisir une forme (rectangle, ellipse, capsule)',
      es: 'Elegir una forma (rectángulo, elipse, cápsula)',
      de: 'Eine Form wählen (Rechteck, Ellipse, Kapsel)',
      it: 'Scegliere una forma (rettangolo, ellisse, capsula)'
    }
  } satisfies AttributeConfig<Type_Shape>,

  min_width: {
    default: 40,
    type: (() => 40) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Minimum width',
      fr: 'Largeur minimale',
      es: 'Ancho mínimo',
      de: 'Minimale Breite',
      it: 'Larghezza minima'
    },
    tooltips: {
      en: 'Minimum width in pixels',
      fr: 'Largeur minimale en pixels',
      es: 'Ancho mínimo en píxeles',
      de: 'Minimale Breite in Pixeln',
      it: 'Larghezza minima in pixel'
    }
  } satisfies AttributeConfig<number>,

  min_height: {
    default: 40,
    type: (() => 40) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Minimum height',
      fr: 'Hauteur minimale',
      es: 'Altura mínima',
      de: 'Minimale Höhe',
      it: 'Altezza minima'
    },
    tooltips: {
      en: 'Minimum height in pixels',
      fr: 'Hauteur minimale en pixels',
      es: 'Altura mínima en píxeles',
      de: 'Minimale Höhe in Pixeln',
      it: 'Altezza minima in pixel'
    }
  } satisfies AttributeConfig<number>,

  width_locked: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    // drawElements (en plus de drawShape) pour que le toggle du fond et de la
    // largeur fixe redessine les labels : les poignées de redimensionnement
    // sont rendues dans drawGenericBackground, donc le label doit être redessiné.
    actions: ['drawShape', 'drawElements'] as BaseActionType[],
    labels: {
      en: 'Fixed width',
      fr: 'Largeur fixe',
      es: 'Ancho fijo',
      de: 'Feste Breite',
      it: 'Larghezza fissa'
    },
    tooltips: {
      en: 'Lock the background width to a fixed value instead of fitting the text',
      fr: 'Verrouiller la largeur du fond à une valeur fixe au lieu de s\'adapter au texte',
      es: 'Bloquear el ancho del fondo a un valor fijo en lugar de ajustarse al texto',
      de: 'Hintergrundbreite auf einen festen Wert sperren statt an den Text anzupassen',
      it: 'Bloccare la larghezza dello sfondo a un valore fisso invece di adattarsi al testo'
    }
  } satisfies AttributeConfig<boolean>,

  box_width: {
    default: 150,
    type: (() => 150) as (() => number),
    category: 'shape' as const,
    // drawElements pour que le label (et donc les poignées) soit redessiné.
    actions: ['drawShape', 'drawElements'] as BaseActionType[],
    labels: {
      en: 'Width',
      fr: 'Largeur',
      es: 'Ancho',
      de: 'Breite',
      it: 'Larghezza'
    },
    tooltips: {
      en: 'Fixed width of the background in pixels (when fixed width is enabled)',
      fr: 'Largeur fixe du fond en pixels (quand la largeur fixe est activée)',
      es: 'Ancho fijo del fondo en píxeles (cuando el ancho fijo está activado)',
      de: 'Feste Breite des Hintergrunds in Pixeln (wenn feste Breite aktiviert ist)',
      it: 'Larghezza fissa dello sfondo in pixel (quando la larghezza fissa è attiva)'
    }
  } satisfies AttributeConfig<number>,

  color_visible: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawShape', 'drawElements'] as BaseActionType[],
    labels: {
      en: 'Background',
      fr: 'Fond',
      es: 'Fondo',
      de: 'Hintergrund',
      it: 'Sfondo'
    },
    tooltips: {
      en: 'Show or hide the background color',
      fr: 'Afficher ou masquer la couleur de fond',
      es: 'Mostrar u ocultar el color de fondo',
      de: 'Hintergrundfarbe anzeigen oder ausblenden',
      it: 'Mostra o nascondi il colore di sfondo'
    }
  } satisfies AttributeConfig<boolean>,

  color: {
    default: default_element_color,
    type: (() => default_element_color) as (() => string),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Color',
      fr: 'Couleur',
      es: 'Color',
      de: 'Farbe',
      it: 'Colore'
    },
    tooltips: {
      en: 'Background color',
      fr: 'Couleur de fond',
      es: 'Color de fondo',
      de: 'Hintergrundfarbe',
      it: 'Colore di sfondo'
    }
  } satisfies AttributeConfig<string>,

  opacity: {
    default: 0.85,
    type: (() => 0.85) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Opacity',
      fr: 'Opacité',
      es: 'Opacidad',
      de: 'Deckkraft',
      it: 'Opacità'
    },
    tooltips: {
      en: 'Opacity of the shape',
      fr: 'Opacité de la forme',
      es: 'Opacidad de la forma',
      de: 'Deckkraft der Form',
      it: 'Opacità della forma'
    }
  } satisfies AttributeConfig<number>,

  color_sustainable: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Static color',
      fr: 'Couleur fixe',
      es: 'Color fijo',
      de: 'Feste Farbe',
      it: 'Colore fisso'
    },
    tooltips: {
      en: 'Keep the color fixed regardless of filters',
      fr: 'Garder la couleur fixe indépendamment des filtres',
      es: 'Mantener el color fijo independientemente de los filtros',
      de: 'Farbe unabhängig von Filtern beibehalten',
      it: 'Mantenere il colore fisso indipendentemente dai filtri'
    }
  } satisfies AttributeConfig<boolean>,

  border_visible: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],
    labels: {
      en: 'Border',
      fr: 'Bordure',
      es: 'Borde',
      de: 'Rahmen',
      it: 'Bordo'
    },
    tooltips: {
      en: 'Make the border transparent',
      fr: 'Rendre la bordure transparente',
      es: 'Hacer el borde transparente',
      de: 'Rahmen transparent machen',
      it: 'Rendere il bordo trasparente'
    }
  } satisfies AttributeConfig<boolean>,

  border_color: {
    default: 'black',
    type: (() => 'black') as (() => string),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],
    labels: {
      en: 'Color',
      fr: 'Couleur',
      es: 'Color',
      de: 'Farbe',
      it: 'Colore'
    },
    tooltips: {
      en: 'Color of the border',
      fr: 'Couleur de la bordure',
      es: 'Color del borde',
      de: 'Farbe des Rahmens',
      it: 'Colore del bordo'
    }
  } satisfies AttributeConfig<string>,
  border_color_sustainable: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Static color',
      fr: 'Couleur fixe',
      es: 'Color fijo',
      de: 'Feste Farbe',
      it: 'Colore fisso'
    },
    tooltips: {
      en: 'Keep the color fixed regardless of filters',
      fr: 'Garder la couleur fixe indépendamment des filtres',
      es: 'Mantener el color fijo independientemente de los filtros',
      de: 'Farbe unabhängig von Filtern beibehalten',
      it: 'Mantenere il colore fisso indipendentemente dai filtri'
    }
  } satisfies AttributeConfig<boolean>,

  border_thickness: {
    default: 1,
    type: (() => 1) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],
    labels: {
      en: 'Thickness',
      fr: 'Épaisseur',
      es: 'Grosor',
      de: 'Stärke',
      it: 'Spessore'
    },
    tooltips: {
      en: 'Thickness of the border in pixels',
      fr: 'Épaisseur de la bordure en pixels',
      es: 'Grosor del borde en píxeles',
      de: 'Stärke des Rahmens in Pixeln',
      it: 'Spessore del bordo in pixel'
    }
  } satisfies AttributeConfig<number>,

  border_dashed: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],
    labels: {
      en: 'Dashed',
      fr: 'Tiretés',
      es: 'Discontinuo',
      de: 'Gestrichelt',
      it: 'Tratteggiato'
    },
    tooltips: {
      en: 'Use a dashed border style',
      fr: 'Utiliser un style de bordure en pointillés',
      es: 'Usar un estilo de borde discontinuo',
      de: 'Gestrichelten Rahmenstil verwenden',
      it: 'Usare uno stile di bordo tratteggiato'
    }
  } satisfies AttributeConfig<boolean>,

  border_radius: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],
    labels: {
      en: 'Radius',
      fr: 'Rayon',
      es: 'Radio',
      de: 'Radius',
      it: 'Raggio'
    },
    tooltips: {
      en: 'Border radius in pixels',
      fr: 'Rayon de bordure en pixels',
      es: 'Radio del borde en píxeles',
      de: 'Rahmenradius in Pixeln',
      it: 'Raggio del bordo in pixel'
    }
  } satisfies AttributeConfig<number>,
  margin_left: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'Left',
      fr: 'Gauche',
      es: 'Izquierda',
      de: 'Links',
      it: 'Sinistra'
    },
    tooltips: {
      en: 'Left margin',
      fr: 'Marge gauche',
      es: 'Margen izquierdo',
      de: 'Linker Rand',
      it: 'Margine sinistro'
    }
  } satisfies AttributeConfig<number>,

  margin_right: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'Right',
      fr: 'Droite',
      es: 'Derecha',
      de: 'Rechts',
      it: 'Destra'
    },
    tooltips: {
      en: 'Right margin',
      fr: 'Marge droite',
      es: 'Margen derecho',
      de: 'Rechter Rand',
      it: 'Margine destro'
    }
  } satisfies AttributeConfig<number>,

  margin_top: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'Top',
      fr: 'Haute',
      es: 'Superior',
      de: 'Oben',
      it: 'Superiore'
    },
    tooltips: {
      en: 'Top margin',
      fr: 'Marge haute',
      es: 'Margen superior',
      de: 'Oberer Rand',
      it: 'Margine superiore'
    }
  } satisfies AttributeConfig<number>,

  margin_bottom: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'Bottom',
      fr: 'Basse',
      es: 'Inferior',
      de: 'Unten',
      it: 'Inferiore'
    },
    tooltips: {
      en: 'Bottom margin',
      fr: 'Marge basse',
      es: 'Margen inferior',
      de: 'Unterer Rand',
      it: 'Margine inferiore'
    }
  } satisfies AttributeConfig<number>,
} as const

export const BASE_LABEL_CONFIG = {
  is_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Label',
      fr: 'Label',
      es: 'Etiqueta',
      de: 'Beschriftung',
      it: 'Etichetta'
    },
    tooltips: {
      en: 'Display or hide the label',
      fr: 'Afficher ou masquer le label',
      es: 'Mostrar u ocultar la etiqueta',
      de: 'Beschriftung anzeigen oder ausblenden',
      it: 'Mostra o nascondi l\'etichetta'
    }
  } satisfies AttributeConfig<boolean>,

  // Font
  font_family: {
    default: default_font,
    type: (() => default_font) as (() => string),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Font family',
      fr: 'Police de caractères',
      es: 'Familia de fuente',
      de: 'Schriftfamilie',
      it: 'Famiglia di caratteri'
    },
    tooltips: {
      en: 'Font family for the label',
      fr: 'Police de caractères pour le label',
      es: 'Familia de fuente para la etiqueta',
      de: 'Schriftfamilie für die Beschriftung',
      it: 'Famiglia di caratteri per l\'etichetta'
    }
  } satisfies AttributeConfig<string>,

  font_size: {
    default: 14,
    type: (() => 14) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Font size',
      fr: 'Taille de police',
      es: 'Tamaño de fuente',
      de: 'Schriftgröße',
      it: 'Dimensione del carattere'
    },
    tooltips: {
      en: 'Font size for the label',
      fr: 'Taille de police pour le label',
      es: 'Tamaño de fuente para la etiqueta',
      de: 'Schriftgröße für die Beschriftung',
      it: 'Dimensione del carattere per l\'etichetta'
    }
  } satisfies AttributeConfig<number>,

  uppercase: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Uppercase',
      fr: 'Majuscules',
      es: 'Mayúsculas',
      de: 'Großbuchstaben',
      it: 'Maiuscolo'
    },
    tooltips: {
      en: 'Display text in uppercase',
      fr: 'Afficher le texte en majuscules',
      es: 'Mostrar el texto en mayúsculas',
      de: 'Text in Großbuchstaben anzeigen',
      it: 'Visualizzare il testo in maiuscolo'
    }
  } satisfies AttributeConfig<boolean>,

  bold: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Bold',
      fr: 'Gras',
      es: 'Negrita',
      de: 'Fett',
      it: 'Grassetto'
    },
    tooltips: {
      en: 'Display text in bold',
      fr: 'Afficher le texte en gras',
      es: 'Mostrar el texto en negrita',
      de: 'Text fett anzeigen',
      it: 'Visualizzare il testo in grassetto'
    }
  } satisfies AttributeConfig<boolean>,

  italic: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Italic',
      fr: 'Italique',
      es: 'Cursiva',
      de: 'Kursiv',
      it: 'Corsivo'
    },
    tooltips: {
      en: 'Display text in italic',
      fr: 'Afficher le texte en italique',
      es: 'Mostrar el texto en cursiva',
      de: 'Text kursiv anzeigen',
      it: 'Visualizzare il testo in corsivo'
    }
  } satisfies AttributeConfig<boolean>,

  color: {
    default: 'black',
    type: (() => 'black') as (() => string),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Text color',
      fr: 'Couleur du texte',
      es: 'Color del texto',
      de: 'Textfarbe',
      it: 'Colore del testo'
    },
    tooltips: {
      en: 'Color of the text',
      fr: 'Couleur du texte',
      es: 'Color del texto',
      de: 'Farbe des Textes',
      it: 'Colore del testo'
    }
  } satisfies AttributeConfig<string>,

  // Position
  horiz: {
    default: 'middle' as Type_TextHPos,
    type: (() => 'middle') as (() => Type_TextHPos),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Horizontal position',
      fr: 'Position horizontale',
      es: 'Posición horizontal',
      de: 'Horizontale Position',
      it: 'Posizione orizzontale'
    },
    tooltips: {
      en: 'Horizontal position relative to the node',
      fr: 'Position horizontale par rapport au noeud',
      es: 'Posición horizontal respecto al nodo',
      de: 'Horizontale Position relativ zum Knoten',
      it: 'Posizione orizzontale rispetto al nodo'
    }
  } satisfies AttributeConfig<Type_TextHPos>,

  vert: {
    default: 'bottom' as Type_TextVPos,
    type: (() => 'bottom') as (() => Type_TextVPos),

    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Vertical position',
      fr: 'Position verticale',
      es: 'Posición vertical',
      de: 'Vertikale Position',
      it: 'Posizione verticale'
    },
    tooltips: {
      en: 'Vertical position relative to the node',
      fr: 'Position verticale par rapport au noeud',
      es: 'Posición vertical respecto al nodo',
      de: 'Vertikale Position relativ zum Knoten',
      it: 'Posizione verticale rispetto al nodo'
    }
  } satisfies AttributeConfig<Type_TextVPos>,

  horiz_shift: {
    default: 0,
    type: (() => 0) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Horizontal',
      fr: 'Horizontal',
      es: 'Horizontal',
      de: 'Horizontal',
      it: 'Orizzontale'
    },
    tooltips: {
      en: 'Horizontal shift from anchor point',
      fr: 'Décalage horizontal depuis le point d\'ancrage',
      es: 'Desplazamiento horizontal desde el punto de anclaje',
      de: 'Horizontale Verschiebung vom Ankerpunkt',
      it: 'Spostamento orizzontale dal punto di ancoraggio'
    }
  } satisfies AttributeConfig<number>,

  vert_shift: {
    default: 0,
    type: (() => 0) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Vertical',
      fr: 'Vertical',
      es: 'Vertical',
      de: 'Vertikal',
      it: 'Verticale'
    },
    tooltips: {
      en: 'Vertical shift from anchor point',
      fr: 'Décalage vertical depuis le point d\'ancrage',
      es: 'Desplazamiento vertical desde el punto de anclaje',
      de: 'Vertikale Verschiebung vom Ankerpunkt',
      it: 'Spostamento verticale dal punto di ancoraggio'
    }
  } satisfies AttributeConfig<number>,
  text_align: {
    default: 'left',
    type: (() => 'left') as (() => string),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Text alignment',
      fr: 'Text alignment',
      es: 'Alineación del texto',
      de: 'Textausrichtung',
      it: 'Allineamento del testo'
    },
    tooltips: {
      en: 'Text alignment',
      fr: 'Text alignment',
      es: 'Alineación del texto',
      de: 'Textausrichtung',
      it: 'Allineamento del testo'
    }
  } satisfies AttributeConfig<string>,
  box_width: {
    default: 150,
    type: (() => 150) as (() => number),
    category: '',
    // drawElements pour que les poignées de redimensionnement du label et le
    // fond (qui suit la largeur du label en mode unlocked) soient refresh
    // après modification depuis le menu.
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Width',
      fr: 'Largeur',
      es: 'Ancho',
      de: 'Breite',
      it: 'Larghezza'
    },
    tooltips: {
      en: 'Width of the text area in pixels',
      fr: 'Largeur de la zone de texte en pixels',
      es: 'Ancho del área de texto en píxeles',
      de: 'Breite des Textbereichs in Pixeln',
      it: 'Larghezza dell\'area di testo in pixel'
    }
  } satisfies AttributeConfig<number>,
  wrap_long_words: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Break long words',
      fr: 'Couper les mots longs',
      es: 'Cortar palabras largas',
      de: 'Lange Wörter umbrechen',
      it: 'Spezza parole lunghe'
    },
    tooltips: {
      en: 'Insert a hyphen to break words that exceed the label width',
      fr: 'Insérer un tiret pour couper les mots qui dépassent la largeur du label',
      es: 'Inserta un guion para cortar las palabras que exceden el ancho de la etiqueta',
      de: 'Bindestrich einfügen, um Wörter zu trennen, die die Beschriftungsbreite überschreiten',
      it: 'Inserisce un trattino per spezzare le parole che superano la larghezza dell\'etichetta'
    }
  } satisfies AttributeConfig<boolean>,

  vertical_text: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Vertical text',
      fr: 'Texte vertical',
      es: 'Texto vertical',
      de: 'Vertikaler Text',
      it: 'Testo verticale'
    },
    tooltips: {
      en: 'Orient text vertically',
      fr: 'Orienter le texte verticalement',
      es: 'Orientar el texto verticalmente',
      de: 'Text vertikal ausrichten',
      it: 'Orientare il testo verticalmente'
    }
  } satisfies AttributeConfig<boolean>,
  // Angle de rotation libre du texte, en degrés (−180..180). Remplace le toggle
  // `vertical_text` dans l'UI ; `vertical_text` est conservé pour la rétro-compat
  // (anciens fichiers) et interprété comme −90° tant que text_angle vaut 0.
  text_angle: {
    default: 0 as number,
    type: (() => 0) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Text angle',
      fr: 'Angle du texte',
      es: 'Ángulo del texto',
      de: 'Textwinkel',
      it: 'Angolo del testo'
    },
    tooltips: {
      en: 'Rotate the text by an angle (−180° to 180°)',
      fr: 'Pivoter le texte d\'un angle (−180° à 180°)',
      es: 'Girar el texto un ángulo (−180° a 180°)',
      de: 'Text um einen Winkel drehen (−180° bis 180°)',
      it: 'Ruotare il testo di un angolo (−180° a 180°)'
    }
  } satisfies AttributeConfig<number>,
  position_absolute: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'position_absolute',
      fr: 'position_absolute',
      es: 'position_absolute',
      de: 'position_absolute',
      it: 'position_absolute'
    },
    tooltips: {
      en: 'position_absolute',
      fr: 'position_absolute',
      es: 'position_absolute',
      de: 'position_absolute',
      it: 'position_absolute'
    }
  } satisfies AttributeConfig<boolean>,
  position_x: {
    default: 0 as number,
    type: (() => 0) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'position_x',
      fr: 'position_x',
      es: 'position_x',
      de: 'position_x',
      it: 'position_x'
    },
    tooltips: {
      en: 'position_x',
      fr: 'position_x',
      es: 'position_x',
      de: 'position_x',
      it: 'position_x'
    }
  } satisfies AttributeConfig<number>,
  position_y: {
    default: 0 as number,
    type: (() => 0) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'position_y',
      fr: 'position_y',
      es: 'position_y',
      de: 'position_y',
      it: 'position_y'
    },
    tooltips: {
      en: 'position_y',
      fr: 'position_y',
      es: 'position_y',
      de: 'position_y',
      it: 'position_y'
    }
  } satisfies AttributeConfig<number>,
  position_offset: {
    default: 0 as number,
    type: (() => 0) as (() => number),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'position_offset',
      fr: 'position_offset',
      es: 'position_offset',
      de: 'position_offset',
      it: 'position_offset'
    },
    tooltips: {
      en: 'position_offset',
      fr: 'position_offset',
      es: 'position_offset',
      de: 'position_offset',
      it: 'position_offset'
    }
  } satisfies AttributeConfig<number>,
  inside_horiz: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Inside horizontal',
      fr: 'Intérieur horizontal',
      es: 'Interior horizontal',
      de: 'Innen horizontal',
      it: 'Interno orizzontale'
    },
    tooltips: {
      en: 'Position label inside shape horizontally',
      fr: 'Positionner le label à l\'intérieur horizontal de la forme',
      es: 'Posicionar la etiqueta dentro de la forma horizontalmente',
      de: 'Beschriftung horizontal innerhalb der Form positionieren',
      it: 'Posizionare l\'etichetta all\'interno della forma orizzontalmente'
    }
  } satisfies AttributeConfig<boolean>,

  inside_vert: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Inside vertical',
      fr: 'Intérieur vertical',
      es: 'Interior vertical',
      de: 'Innen vertikal',
      it: 'Interno verticale'
    },
    tooltips: {
      en: 'Position label inside shape vertically',
      fr: 'Positionner le label à l\'intérieur vertical de la forme',
      es: 'Posicionar la etiqueta dentro de la forma verticalmente',
      de: 'Beschriftung vertikal innerhalb der Form positionieren',
      it: 'Posizionare l\'etichetta all\'interno della forma verticalmente'
    }
  } satisfies AttributeConfig<boolean>,
  icon_name: {
    default: '',
    type: (() => '') as (() => string),
    category: 'icon' as const,
    actions: ['drawIcon'] as BaseActionType[],
    labels: {
      en: 'Icon name',
      fr: 'Nom de l\'icône',
      es: 'Nombre del icono',
      de: 'Symbolname',
      it: 'Nome dell\'icona'
    },
    tooltips: {
      en: 'Name of the icon',
      fr: 'Nom de l\'icône',
      es: 'Nombre del icono',
      de: 'Name des Symbols',
      it: 'Nome dell\'icona'
    }
  } satisfies AttributeConfig<string>,
  view_box: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'icon' as const,
    actions: ['drawIcon'] as BaseActionType[],
    labels: {
      en: 'Icon viewBox',
      fr: 'ViewBox de l\'icône',
      es: 'ViewBox del icono',
      de: 'Symbol-ViewBox',
      it: 'ViewBox dell\'icona'
    },
    tooltips: {
      en: 'SVG viewBox attribute',
      fr: 'Attribut viewBox SVG',
      es: 'Atributo viewBox SVG',
      de: 'SVG-viewBox-Attribut',
      it: 'Attributo viewBox SVG'
    }
  } satisfies AttributeConfig<string | undefined>,

  color_sustainable: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'icon' as const,
    actions: ['drawIcon'] as BaseActionType[],
    labels: {
      en: 'Static icon color',
      fr: 'Couleur d\'icône fixe',
      es: 'Color de icono fijo',
      de: 'Feste Symbolfarbe',
      it: 'Colore icona fisso'
    },
    tooltips: {
      en: 'Keep icon color fixed',
      fr: 'Garder la couleur d\'icône fixe',
      es: 'Mantener el color del icono fijo',
      de: 'Symbolfarbe fest beibehalten',
      it: 'Mantenere il colore dell\'icona fisso'
    }
  } satisfies AttributeConfig<boolean>,
  has_fo: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'foreign_object' as const,
    actions: ['drawFO'] as BaseActionType[],
    labels: {
      en: 'Has rich text',
      fr: 'Rich Text',
      es: 'Texto enriquecido',
      de: 'Rich Text',
      it: 'Testo formattato'
    },
    tooltips: {
      en: 'Has rich text',
      fr: 'Rich Text',
      es: 'Tiene texto enriquecido',
      de: 'Hat Rich Text',
      it: 'Ha testo formattato'
    }
  } satisfies AttributeConfig<boolean>,
  fo_content: {
    default: '',
    type: (() => '') as (() => string),
    category: 'foreign_object' as const,
    actions: ['drawFO'] as BaseActionType[],
    labels: {
      en: 'Foreign object content',
      fr: 'Contenu de l\'objet étranger',
      es: 'Contenido del objeto externo',
      de: 'Fremdobjekt-Inhalt',
      it: 'Contenuto dell\'oggetto esterno'
    },
    tooltips: {
      en: 'HTML content',
      fr: 'Contenu HTML',
      es: 'Contenido HTML',
      de: 'HTML-Inhalt',
      it: 'Contenuto HTML'
    }
  } satisfies AttributeConfig<string>,
  // Image
  is_icon: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'image' as const,
    actions: ['drawIcon'] as BaseActionType[],
    labels: {
      en: 'Is icon',
      fr: 'Est un icon',
      es: 'Es un icono',
      de: 'Ist ein Symbol',
      it: 'È un\'icona'
    },
    tooltips: {
      en: 'Display as icon',
      fr: 'Afficher comme icon',
      es: 'Mostrar como icono',
      de: 'Als Symbol anzeigen',
      it: 'Visualizzare come icona'
    }
  } satisfies AttributeConfig<boolean>,
  // Image
  is_image: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'image' as const,
    actions: ['drawImage'] as BaseActionType[],
    labels: {
      en: 'Is image',
      fr: 'Est une image',
      es: 'Es una imagen',
      de: 'Ist ein Bild',
      it: 'È un\'immagine'
    },
    tooltips: {
      en: 'Display as image',
      fr: 'Afficher comme image',
      es: 'Mostrar como imagen',
      de: 'Als Bild anzeigen',
      it: 'Visualizzare come immagine'
    }
  } satisfies AttributeConfig<boolean>,
  is_value: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'image' as const,
    actions: ['drawImage'] as BaseActionType[],
    labels: {
      en: 'Is Value',
      fr: 'Est une Valeur',
      es: 'Es un valor',
      de: 'Ist ein Wert',
      it: 'È un valore'
    },
    tooltips: {
      en: 'Display as value',
      fr: 'Afficher comme Valeur',
      es: 'Mostrar como valor',
      de: 'Als Wert anzeigen',
      it: 'Visualizzare come valore'
    }
  } satisfies AttributeConfig<boolean>,
  image_src: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'image' as const,
    actions: ['drawImage'] as BaseActionType[],
    labels: {
      en: 'Image source',
      fr: 'Source de l\'image',
      es: 'Fuente de la imagen',
      de: 'Bildquelle',
      it: 'Sorgente dell\'immagine'
    },
    tooltips: {
      en: 'URL or path to image',
      fr: 'URL ou chemin vers l\'image',
      es: 'URL o ruta a la imagen',
      de: 'URL oder Pfad zum Bild',
      it: 'URL o percorso dell\'immagine'
    }
  } satisfies AttributeConfig<string | undefined>,
  // Formatting
  scientific_notation: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Scientific notation',
      fr: 'Notation scientifique',
      es: 'Notación científica',
      de: 'Wissenschaftliche Notation',
      it: 'Notazione scientifica'
    },
    tooltips: {
      en: 'Use scientific notation',
      fr: 'Utiliser la notation scientifique',
      es: 'Usar notación científica',
      de: 'Wissenschaftliche Notation verwenden',
      it: 'Usare la notazione scientifica'
    }
  } satisfies AttributeConfig<boolean>,

  significant_digits: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Significant digits',
      fr: 'Chiffres significatifs',
      es: 'Cifras significativas',
      de: 'Signifikante Stellen',
      it: 'Cifre significative'
    },
    tooltips: {
      en: 'Use significant digits',
      fr: 'Utiliser les chiffres significatifs',
      es: 'Usar cifras significativas',
      de: 'Signifikante Stellen verwenden',
      it: 'Usare le cifre significative'
    }
  } satisfies AttributeConfig<boolean>,

  nb_significant_digits: {
    default: 3,
    type: (() => 3) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Number of significant digits',
      fr: 'Nombre de chiffres significatifs',
      es: 'Número de cifras significativas',
      de: 'Anzahl signifikanter Stellen',
      it: 'Numero di cifre significative'
    },
    tooltips: {
      en: 'Number of significant digits',
      fr: 'Nombre de chiffres significatifs',
      es: 'Número de cifras significativas',
      de: 'Anzahl signifikanter Stellen',
      it: 'Numero di cifre significative'
    }
  } satisfies AttributeConfig<number>,

  custom_digit: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Nb digits',
      fr: 'Décimales',
      es: 'Decimales',
      de: 'Dezimalstellen',
      it: 'Decimali'
    },
    tooltips: {
      en: 'Use custom number of decimals',
      fr: 'Utiliser un nombre personnalisé de décimales',
      es: 'Usar un número personalizado de decimales',
      de: 'Benutzerdefinierte Anzahl von Dezimalstellen verwenden',
      it: 'Usare un numero personalizzato di decimali'
    }
  } satisfies AttributeConfig<boolean>,

  nb_digit: {
    default: 2,
    type: (() => 2) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Number of digits',
      fr: 'Nombre de décimales',
      es: 'Número de decimales',
      de: 'Anzahl der Dezimalstellen',
      it: 'Numero di decimali'
    },
    tooltips: {
      en: 'Number of decimal places',
      fr: 'Nombre de décimales',
      es: 'Número de decimales',
      de: 'Anzahl der Dezimalstellen',
      it: 'Numero di decimali'
    }
  } satisfies AttributeConfig<number>,

  in_out_display_mode: {
    default: 'both' as 'both' | 'in' | 'out',
    type: (() => 'both') as (() => 'both' | 'in' | 'out'),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'In/Out totals',
      fr: 'Totaux entrants/sortants',
      es: 'Totales entrantes/salientes',
      de: 'Eingangs-/Ausgangssummen',
      it: 'Totali in entrata/uscita'
    },
    tooltips: {
      en: 'When incoming total differs from outgoing: show both (in→out), only incoming, or only outgoing',
      fr: 'Quand le total entrant diffère du sortant : afficher les deux (entrant→sortant), uniquement l\'entrant, ou uniquement le sortant',
      es: 'Cuando el total entrante difiere del saliente: mostrar ambos (entrada→salida), solo entrante, o solo saliente',
      de: 'Wenn die Eingangssumme von der Ausgangssumme abweicht: beide anzeigen (Eingang→Ausgang), nur Eingang oder nur Ausgang',
      it: 'Quando il totale in entrata differisce da quello in uscita: mostrare entrambi (entrata→uscita), solo entrata o solo uscita'
    }
  } satisfies AttributeConfig<'both' | 'in' | 'out'>,

  // Units
  unit_visible: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Unit',
      fr: 'Unité',
      es: 'Unidad',
      de: 'Einheit',
      it: 'Unità'
    },
    tooltips: {
      en: 'Display the unit',
      fr: 'Afficher l\'unité',
      es: 'Mostrar la unidad',
      de: 'Einheit anzeigen',
      it: 'Visualizzare l\'unità'
    }
  } satisfies AttributeConfig<boolean>,

  unit_type: {
    default: 'unit_name',
    type: (() => 'unit_name') as (() => UnitType),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Unit type',
      fr: 'Type d\'unité',
      es: 'Tipo de unidad',
      de: 'Einheitentyp',
      it: 'Tipo di unità'
    },
    tooltips: {
      en: 'Type of unit to display',
      fr: 'Type d\'unité à afficher',
      es: 'Tipo de unidad a mostrar',
      de: 'Anzuzeigender Einheitentyp',
      it: 'Tipo di unità da visualizzare'
    }
  } satisfies AttributeConfig<UnitType>,

  unit: {
    default: '',
    type: (() => '') as (() => string),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Unit name',
      fr: 'Nom de l\'unité',
      es: 'Nombre de la unidad',
      de: 'Einheitenname',
      it: 'Nome dell\'unità'
    },
    tooltips: {
      en: 'Name of the unit',
      fr: 'Nom de l\'unité',
      es: 'Nombre de la unidad',
      de: 'Name der Einheit',
      it: 'Nome dell\'unità'
    }
  } satisfies AttributeConfig<string>,

  unit_factor: {
    default: 1,
    type: (() => 1) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as BaseActionType[],
    labels: {
      en: 'Factor',
      fr: 'Facteur',
      es: 'Factor',
      de: 'Faktor',
      it: 'Fattore'
    },
    tooltips: {
      en: 'Conversion factor for the unit',
      fr: 'Facteur de conversion pour l\'unité',
      es: 'Factor de conversión para la unidad',
      de: 'Umrechnungsfaktor für die Einheit',
      it: 'Fattore di conversione per l\'unità'
    }
  } satisfies AttributeConfig<number>
} as const

function createLabelConfig(prefix: string, category: string, drawAction: BaseActionType) {
  const visibility_string_fr = prefix === 'name_label' ? 'Libellé' : prefix === 'value_label' ? 'Valeur' : prefix === 'stock_label' ? 'Stock' : 'Icône'
  const visibility_string_en = prefix === 'name_label' ? 'Label' : prefix === 'value_label' ? 'Value' : prefix === 'stock_label' ? 'Stock' : 'Icon'


  return {
    // ✅ Réutilisation de BASE_LABEL_CONFIG avec overrides
    ...createConfigWithPrefixAndOverrides(
      BASE_LABEL_CONFIG,
      '', // Pas de prefix ici car NAME_LABEL_CONFIG/VALUE_LABEL_CONFIG ajouteront leur prefix après
      category,
      [drawAction],
      {
        // ✅ Surcharges spécifiques au prefix
        is_visible: {
          default: prefix === 'name_label' ? true : false,
          labels: {
            en: visibility_string_en,
            fr: visibility_string_fr,
            es: prefix === 'name_label' ? 'Etiqueta' : prefix === 'value_label' ? 'Valor' : prefix === 'stock_label' ? 'Stock' : 'Icono',
            de: prefix === 'name_label' ? 'Beschriftung' : prefix === 'value_label' ? 'Wert' : prefix === 'stock_label' ? 'Stock' : 'Symbol',
            it: prefix === 'name_label' ? 'Etichetta' : prefix === 'value_label' ? 'Valore' : prefix === 'stock_label' ? 'Stock' : 'Icona'
          }
        },
        horiz: {
          setter: prefix === 'name_label' ? 'customNameLabelHoriz' : 'customValueLabelHoriz',
        },
        vert: {
          default: (prefix === 'name_label' ? 'bottom' : prefix === 'stock_label' ? 'bottom' : 'top') as Type_TextVPos,
          setter: prefix === 'name_label' ? 'customNameLabelVert' : 'customValueLabelVert',
        },
        inside_vert: {
          default: prefix === 'stock_label' ? true : false,
        }
      }
    ),

    // ✅ Réutilisation de BASE_SHAPE_CONFIG avec préfixe "background" et overrides
    ...createConfigWithPrefixAndOverrides(
      BASE_SHAPE_CONFIG,
      'background' as const,
      category,
      [drawAction],
      {
        visible: {
          labels: {
            en: 'Background',
            fr: 'Fond',
            es: 'Fondo',
            de: 'Hintergrund',
            it: 'Sfondo'
          },
          tooltips: {
            en: 'Show background for better visibility',
            fr: 'Afficher le fond pour une meilleure visibilité',
            es: 'Mostrar el fondo para mejor visibilidad',
            de: 'Hintergrund für bessere Sichtbarkeit anzeigen',
            it: 'Mostrare lo sfondo per una migliore visibilità'
          }
        },
        color_visible: {
          default: (prefix === 'name_label' || prefix === 'stock_label') ? true : false,
          labels: {
            en: 'Background',
            fr: 'Fond',
            es: 'Fondo',
            de: 'Hintergrund',
            it: 'Sfondo'
          },
          tooltips: {
            en: 'Background color',
            fr: 'Couleur de fond',
            es: 'Color de fondo',
            de: 'Hintergrundfarbe',
            it: 'Colore di sfondo'
          }
        },
        color: {
          default: '#ffffff',
          labels: {
            en: 'Background',
            fr: 'Fond',
            es: 'Fondo',
            de: 'Hintergrund',
            it: 'Sfondo'
          },
          tooltips: {
            en: 'Background color',
            fr: 'Couleur de fond',
            es: 'Color de fondo',
            de: 'Hintergrundfarbe',
            it: 'Colore di sfondo'
          }
        },
        color_sustainable: {
          default: true,
        },
        opacity: {
          default: 0.55,
        },
        border_radius: {
          default: 4,
        },
        border_visible: {
          default: prefix === 'stock_label' ? true : false,
        },
        border_dashed: {
          default: prefix === 'stock_label' ? true : false,
        },
        margin_left: {
          category: category,
        },
      }
    ),
  } as const
}
const NAME_LABEL_BASE_CONFIG = createLabelConfig('name_label', 'name_label', 'drawNameLabel')

export const NAME_LABEL_CONFIG = {
  ...NAME_LABEL_BASE_CONFIG,

  separator: {
    default: '',
    type: (() => '') as (() => string),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as BaseActionType[],
    labels: {
      en: 'Separator',
      fr: 'Séparateur',
      es: 'Separador',
      de: 'Trennzeichen',
      it: 'Separatore'
    },
    tooltips: {
      en: 'Separator character',
      fr: 'Caractère séparateur',
      es: 'Carácter separador',
      de: 'Trennzeichen',
      it: 'Carattere separatore'
    }
  } satisfies AttributeConfig<string>,

  separator_part: {
    default: 'after' as 'before' | 'after',
    type: (() => 'after') as (() => 'before' | 'after'),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as BaseActionType[],
    labels: {
      en: 'Separator position',
      fr: 'Position du séparateur',
      es: 'Posición del separador',
      de: 'Position des Trennzeichens',
      it: 'Posizione del separatore'
    },
    tooltips: {
      en: 'Position of the separator',
      fr: 'Position du séparateur',
      es: 'Posición del separador',
      de: 'Position des Trennzeichens',
      it: 'Posizione del separatore'
    }
  } satisfies AttributeConfig<'before' | 'after'>,
} as const

const VALUE_LABEL_BASE_CONFIG = createLabelConfig('value_label', 'value_label', 'drawValueLabel')
export const ICON_LABEL_BASE_CONFIG = createLabelConfig('icon', 'icon', 'drawIcon')

const STOCK_LABEL_BASE_CONFIG = createLabelConfig('stock_label', 'stock_label', 'drawStockBox')
export const STOCK_LABEL_CONFIG = {
  ...STOCK_LABEL_BASE_CONFIG,

  box_width: {
    default: 150,
    type: (() => 150) as (() => number),
    category: 'stock_label' as const,
    actions: ['drawStockBox'] as BaseActionType[],
    labels: {
      en: 'Box width (px)',
      fr: 'Largeur boite (px)',
      es: 'Ancho de caja (px)',
      de: 'Kastenbreite (px)',
      it: 'Larghezza riquadro (px)'
    },
    tooltips: {
      en: 'Wrap width of the stock label box, in screen px',
      fr: 'Largeur de retour à la ligne de la boite de stock, en px écran',
      es: 'Ancho de ajuste de la caja de stock, en px de pantalla',
      de: 'Umbruchbreite des Stock-Kastens, in Bildschirm-px',
      it: 'Larghezza di a capo del riquadro stock, in px schermo'
    }
  } satisfies AttributeConfig<number>,
} as const

export const VALUE_LABEL_CONFIG = {
  ...VALUE_LABEL_BASE_CONFIG,

  stick_to_label: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel', 'drawNameLabel'] as BaseActionType[],
    labels: {
      en: 'Stick to label',
      fr: 'Coller au libellé',
      es: 'Pegar a la etiqueta',
      de: 'An Beschriftung haften',
      it: 'Attaccare all\'etichetta'
    },
    tooltips: {
      en: 'Position the value relative to the node label instead of the shape. Background of the label (if visible) covers both label and value.',
      fr: 'Positionner la valeur par rapport au libellé du nœud au lieu de la forme. Le fond du libellé (s\'il est visible) englobe libellé et valeur.',
      es: 'Posicionar el valor respecto a la etiqueta del nodo en lugar de la forma. El fondo de la etiqueta (si está visible) cubre etiqueta y valor.',
      de: 'Wert relativ zur Knotenbeschriftung statt zur Form positionieren. Hintergrund der Beschriftung (falls sichtbar) umfasst Beschriftung und Wert.',
      it: 'Posizionare il valore rispetto all\'etichetta del nodo invece della forma. Lo sfondo dell\'etichetta (se visibile) copre etichetta e valore.'
    }
  } satisfies AttributeConfig<boolean>,
} as const

export const HYPER_LINK_CONFIG = {
  // Hyperlink
  hyperlink: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'hyperlink' as const,
    actions: undefined,
    labels: {
      en: 'Hyperlink',
      fr: 'Lien hypertexte',
      es: 'Hipervínculo',
      de: 'Hyperlink',
      it: 'Collegamento ipertestuale'
    },
    tooltips: {
      en: 'URL for hyperlink',
      fr: 'URL pour lien hypertexte',
      es: 'URL para hipervínculo',
      de: 'URL für Hyperlink',
      it: 'URL per collegamento ipertestuale'
    }
  } satisfies AttributeConfig<string | undefined>
} as const

export type LabelValues<T extends typeof BASE_LABEL_CONFIG> = {
  -readonly [K in keyof T]: ExtractConfigValue<T[K]>
}
export type ValueLabelValues<T extends typeof VALUE_LABEL_CONFIG> = {
  -readonly [K in keyof T]: ExtractConfigValue<T[K]>
}
export type ShapeValues<T extends typeof BASE_SHAPE_CONFIG> = {
  -readonly [K in keyof T]: ExtractConfigValue<T[K]>
}
export type ShapeAttributeTypes = {
  -readonly [K in keyof typeof BASE_SHAPE_CONFIG]: ReturnType<typeof BASE_SHAPE_CONFIG[K]['type']>
}
export type NameLabelAttributeTypes = {
  -readonly [K in keyof typeof NAME_LABEL_CONFIG]: ReturnType<typeof NAME_LABEL_CONFIG[K]['type']>
}
export type ValueLabelAttributeTypes = {
  -readonly [K in keyof typeof VALUE_LABEL_CONFIG]: ReturnType<typeof VALUE_LABEL_CONFIG[K]['type']>
}
export type IconLabelAttributeTypes = {
  -readonly [K in keyof typeof ICON_LABEL_BASE_CONFIG]: ReturnType<typeof ICON_LABEL_BASE_CONFIG[K]['type']>
}
export type StockLabelAttributeTypes = {
  -readonly [K in keyof typeof STOCK_LABEL_CONFIG]: ReturnType<typeof STOCK_LABEL_CONFIG[K]['type']>
}
export type NodeShapeSpecificValues = {
  -readonly [K in keyof typeof NODE_SHAPE_SPECIFIC_CONFIG]: ExtractConfigValue<typeof NODE_SHAPE_SPECIFIC_CONFIG[K]>
}
export type NodeShapeSpecificAttributeTypes = {
  [K in keyof typeof NODE_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof NODE_SHAPE_SPECIFIC_CONFIG[K]['type']>
}
export type LinkShapeSpecificValues = {
  -readonly [K in keyof typeof LINK_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof LINK_SHAPE_SPECIFIC_CONFIG[K]['type']>
}
export type LinkLabelSpecificValues = {
  -readonly [K in keyof typeof LINKS_LABEL_SPECIFIC_CONFIG]: ReturnType<typeof LINKS_LABEL_SPECIFIC_CONFIG[K]['type']>
}

/**
 * Extrait les valeurs des attributs de shape depuis un élément
 * Similaire à getLabelValues mais pour les configs de forme (BASE_SHAPE_CONFIG)
 * 
 * @param element - L'élément depuis lequel extraire les valeurs
 * @param prefix - Le préfixe des attributs ('shape', 'name_label_background', 'value_label_background')
 * @param config - La configuration de base (BASE_SHAPE_CONFIG)
 * @returns Un objet avec les valeurs extraites sans le préfixe
 * 
 * @example
 * // Pour shape
 * const shapeValues = getShapeValue(element, 'shape', BASE_SHAPE_CONFIG)
 * // { visible: true, type: 'rect', color: '#fff', ... }
 * 
 * @example
 * // Pour background de name_label
 * const bgValues = getShapeValue(element, 'name_label_background', BASE_SHAPE_CONFIG)
 * // { visible: false, type: 'rect', color: '#ffffff', ... }
 * 
 */
export function getShapeValue<T extends typeof BASE_SHAPE_CONFIG>(
  element: Class_LinkElement | Class_NodeBase | Class_ElementStyle,
  prefix: ShapePrefix,
  config: T
) {
  const result = {} as ShapeValues<T>

  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: boolean | number | string) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}

export function getLabelValues<T extends typeof BASE_LABEL_CONFIG>(
  element: Class_LinkElement | Class_NodeBase | Class_ElementStyle,
  prefix: 'name_label' | 'value_label',
  config: T
): LabelValues<T> {
  const result = {} as LabelValues<T>

  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: number | boolean | string) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}

export function getValueLabelValues(
  element: Class_LinkElement | Class_NodeBase | Class_ElementStyle,
  prefix: 'name_label' | 'value_label' | 'icon'
) {
  const result = {} as ValueLabelAttributeTypes
  const config = VALUE_LABEL_CONFIG
  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: number | string | boolean) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}

export function getNameLabelValues(
  element: Class_LinkElement | Class_NodeBase | Class_ElementStyle,
  prefix: 'name_label' | 'value_label' | 'stock_label'
) {
  const result = {} as NameLabelAttributeTypes
  const config = VALUE_LABEL_CONFIG
  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: boolean | number | string) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}
/**
 * Extrait les valeurs des attributs de shape spécifiques aux nodes
 * Inclut margin_left, margin_right, margin_top, margin_bottom, position_type, position_dx, position_dy
 */
export function getNodeShapeSpecificValues(
  element: Class_NodeBase | Class_ElementStyle, prefix: ShapePrefix
) {
  const result = {} as NodeShapeSpecificValues
  const config = NODE_SHAPE_SPECIFIC_CONFIG
  //const prefix = 'shape'

  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: boolean | number | string) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}

/**
 * Extrait les valeurs des attributs de shape spécifiques aux links
 * Inclut local_link_scale, is_curved, curvature, is_recycling, orientation, etc.
 */
export const getLinkShapeSpecificValue = (
  element: Class_LinkElement | Class_ElementStyle,
) => {
  const result = {} as LinkShapeSpecificValues
  const config = LINK_SHAPE_SPECIFIC_CONFIG
  const prefix = 'shape'

  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: boolean | number | string) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}
export const getLinkLabelSpecificValue = (
  element: Class_LinkElement | Class_ElementStyle,
  prefix: 'name_label' | 'value_label' | 'icon'
) => {
  const result = {} as LinkLabelSpecificValues
  const config = LINKS_LABEL_SPECIFIC_CONFIG

  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = `${prefix}_${key}`

      Object.defineProperty(result, key, {
        get: () => {
          //@ts-expect-error xxx
          return Reflect.get(element, fullKey) ?? config[key].default
        },
        set: (value: boolean | number | string) => {
          Reflect.set(element, fullKey, value)
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}

export type HyperLinkConfigReturn = typeof HYPER_LINK_CONFIG

export const NODE_SHAPE_SPECIFIC_CONFIG = {
  // =================== MARGINS ===================

  position_type: {
    default: default_position_type,
    type: (() => default_position_type) as (() => Type_Position),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'x',
      fr: 'x',
      es: 'x',
      de: 'x',
      it: 'x'
    },
    tooltips: {
      en: 'x',
      fr: 'x',
      es: 'x',
      de: 'x',
      it: 'x'
    }
  } satisfies AttributeConfig<Type_Position>,
  position_dx: {
    default: 200,
    type: (() => 200) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'Horizontal',
      fr: 'Horizontal',
      es: 'Horizontal',
      de: 'Horizontal',
      it: 'Orizzontale'
    },
    tooltips: {
      en: 'x',
      fr: 'x',
      es: 'x',
      de: 'x',
      it: 'x'
    }
  } satisfies AttributeConfig<number>,
  position_dy: {
    default: 50,
    type: (() => 50) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as BaseActionType[],

    labels: {
      en: 'Vertical',
      fr: 'Vertical',
      es: 'Vertical',
      de: 'Vertikal',
      it: 'Verticale'
    },
    tooltips: {
      en: 'x',
      fr: 'x',
      es: 'x',
      de: 'x',
      it: 'x'
    }
  } satisfies AttributeConfig<number>,
  // =================== ALIGNEMENT DES ANCRES DE FLUX ===================
  anchor_align_vertical: {
    default: default_anchor_align_vertical,
    type: (() => default_anchor_align_vertical) as (() => Type_AnchorAlignVertical),
    category: 'shape' as const,
    actions: ['applyPosition'] as BaseActionType[],
    labels: {
      en: 'Anchors (vertical sides)',
      fr: 'Ancres (côtés verticaux)',
      es: 'Anclas (lados verticales)',
      de: 'Anker (vertikale Seiten)',
      it: 'Ancore (lati verticali)'
    },
    tooltips: {
      en: 'Vertical alignment of link anchors on the left/right sides of the node (top / center / bottom).',
      fr: 'Alignement vertical des ancres de flux sur les côtés gauche/droite du nœud (haut / centre / bas).',
      es: 'Alineación vertical de las anclas de flujo en los lados izquierdo/derecho del nodo (arriba / centro / abajo).',
      de: 'Vertikale Ausrichtung der Flussanker an den linken/rechten Seiten des Knotens (oben / Mitte / unten).',
      it: 'Allineamento verticale delle ancore di flusso sui lati sinistro/destro del nodo (alto / centro / basso).'
    }
  } satisfies AttributeConfig<Type_AnchorAlignVertical>,
  anchor_align_horizontal: {
    default: default_anchor_align_horizontal,
    type: (() => default_anchor_align_horizontal) as (() => Type_AnchorAlignHorizontal),
    category: 'shape' as const,
    actions: ['applyPosition'] as BaseActionType[],
    labels: {
      en: 'Anchors (horizontal sides)',
      fr: 'Ancres (côtés horizontaux)',
      es: 'Anclas (lados horizontales)',
      de: 'Anker (horizontale Seiten)',
      it: 'Ancore (lati orizzontali)'
    },
    tooltips: {
      en: 'Horizontal alignment of link anchors on the top/bottom sides of the node (left / center / right).',
      fr: 'Alignement horizontal des ancres de flux sur les côtés haut/bas du nœud (gauche / centre / droite).',
      es: 'Alineación horizontal de las anclas de flujo en los lados superior/inferior del nodo (izquierda / centro / derecha).',
      de: 'Horizontale Ausrichtung der Flussanker an den oberen/unteren Seiten des Knotens (links / Mitte / rechts).',
      it: 'Allineamento orizzontale delle ancore di flusso sui lati superiore/inferiore del nodo (sinistra / centro / destra).'
    }
  } satisfies AttributeConfig<Type_AnchorAlignHorizontal>,
  // =================== AUTRES ATTRIBUTS ===================
  orphan_node_visible: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Orphans',
      fr: 'Orphelins',
      es: 'Huérfanos',
      de: 'Verwaiste',
      it: 'Orfani'
    },
    tooltips: {
      en: 'Visibility of orphan nodes',
      fr: 'Visibilité des noeuds orphelins',
      es: 'Visibilidad de los nodos huérfanos',
      de: 'Sichtbarkeit verwaister Knoten',
      it: 'Visibilità dei nodi orfani'
    }
  } satisfies AttributeConfig<boolean>,
  position_u_locked: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: [] as BaseActionType[],
    labels: {
      en: 'Lock column',
      fr: 'Verrouiller la colonne',
      es: 'Bloquear columna',
      de: 'Spalte sperren',
      it: 'Blocca colonna'
    },
    tooltips: {
      en: 'When locked, autosankey compute will keep this node\'s column index (u) instead of recomputing it.',
      fr: 'Si verrouillé, le calcul autosankey conserve l\'index de colonne (u) de ce nœud au lieu de le recalculer.',
      es: 'Si está bloqueado, el cálculo autosankey conservará el índice de columna (u) de este nodo en lugar de recalcularlo.',
      de: 'Wenn gesperrt, behält die Autosankey-Berechnung den Spaltenindex (u) dieses Knotens bei, anstatt ihn neu zu berechnen.',
      it: 'Se bloccato, il calcolo autosankey manterrà l\'indice di colonna (u) di questo nodo invece di ricalcolarlo.'
    }
  } satisfies AttributeConfig<boolean>,
  position_v_locked: {
    default: false as boolean,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: [] as BaseActionType[],
    labels: {
      en: 'Lock row',
      fr: 'Verrouiller la ligne',
      es: 'Bloquear fila',
      de: 'Zeile sperren',
      it: 'Blocca riga'
    },
    tooltips: {
      en: 'When locked, autosankey compute preserves the relative vertical order (v) of this node within its column instead of recomputing it.',
      fr: 'Si verrouillé, le calcul autosankey conserve l\'ordre vertical relatif (v) de ce nœud dans sa colonne au lieu de le recalculer.',
      es: 'Si está bloqueado, el cálculo autosankey conserva el orden vertical relativo (v) de este nodo dentro de su columna en lugar de recalcularlo.',
      de: 'Wenn gesperrt, behält die Autosankey-Berechnung die relative vertikale Reihenfolge (v) dieses Knotens innerhalb seiner Spalte bei, anstatt sie neu zu berechnen.',
      it: 'Se bloccato, il calcolo autosankey preserva l\'ordine verticale relativo (v) di questo nodo nella sua colonna invece di ricalcolarlo.'
    }
  } satisfies AttributeConfig<boolean>,
  hatch: {
    default: default_hatch_orientation,
    type: (() => default_hatch_orientation) as (() => Type_HatchOrientation),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Hatching',
      fr: 'Hachures',
      es: 'Rayado',
      de: 'Schraffur',
      it: 'Tratteggio'
    },
    tooltips: {
      en: 'Fill the selected node(s) with a hatch pattern (none / vertical / horizontal / diagonal / anti-diagonal)',
      fr: 'Remplit le/les nœud(s) sélectionné(s) avec un motif de hachures (aucune / verticale / horizontale / diagonale / anti-diagonale)',
      es: 'Rellena el/los nodo(s) seleccionado(s) con un patrón de rayado (ninguno / vertical / horizontal / diagonal / anti-diagonal)',
      de: 'Füllt den/die ausgewählten Knoten mit einem Schraffurmuster (keine / vertikal / horizontal / diagonal / anti-diagonal)',
      it: 'Riempie il/i nodo/i selezionato/i con un motivo tratteggiato (nessuno / verticale / orizzontale / diagonale / anti-diagonale)'
    }
  } satisfies AttributeConfig<Type_HatchOrientation>,
} as const

export const LINK_SHAPE_SPECIFIC_CONFIG = {

  // Attributs spécifiques aux liens (pas dans BASE_SHAPE_CONFIG)
  local_link_scale: {
    default: undefined as number | undefined,
    type: (() => undefined) as (() => number | undefined),
    callback: 'updateLinkAndSourceTarget',
    category: 'shape' as const,
    actions: ['drawWithNodes'] as LinkBaseActionType[],
    labels: {
      en: 'Scale Multiplier',
      fr: 'Facteur d\'échelle',
      es: 'Factor de escala',
      de: 'Skalierungsfaktor',
      it: 'Fattore di scala'
    },
    tooltips: {
      en: 'Define a local scaling factor that will be multiplied by the multiplier specified for this flow.',
      fr: 'Définissez un facteur d\'échelle local qui sera multiplié par le multiplicateur spécifié pour ce flux.',
      es: 'Definir un factor de escala local que se multiplicará por el multiplicador especificado para este flujo.',
      de: 'Definieren Sie einen lokalen Skalierungsfaktor, der mit dem für diesen Fluss angegebenen Multiplikator multipliziert wird.',
      it: 'Definire un fattore di scala locale che verrà moltiplicato per il moltiplicatore specificato per questo flusso.'
    }
  } satisfies AttributeConfig<number | undefined>,

  is_curved: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
    labels: {
      en: 'Curved',
      fr: 'Courbe',
      es: 'Curvo',
      de: 'Gebogen',
      it: 'Curvo'
    },
    tooltips: {
      en: 'Represents the selected link(s) as Bezier curve(s)',
      fr: 'Représente le/les flux sélectionné(s) sous forme de courbe(s) de Bezier',
      es: 'Representa el/los flujo(s) seleccionado(s) como curva(s) de Bezier',
      de: 'Stellt den/die ausgewählten Fluss/Flüsse als Bezier-Kurve(n) dar',
      it: 'Rappresenta il/i flusso/i selezionato/i come curva/e di Bezier'
    }
  } satisfies AttributeConfig<boolean>,

  curvature: {
    default: 0.5,
    type: (() => 0.5) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Curvature',
      fr: 'Courbure',
      es: 'Curvatura',
      de: 'Krümmung',
      it: 'Curvatura'
    },
    tooltips: {
      en: 'Adjust the curvature of the link',
      fr: 'Ajuster la courbure du flux',
      es: 'Ajustar la curvatura del flujo',
      de: 'Krümmung des Flusses anpassen',
      it: 'Regolare la curvatura del flusso'
    }
  } satisfies AttributeConfig<number>,

  is_recycling: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    setter: 'customShapeIsRecycling',
    actions: ['drawWithNodes', 'drawElements', 'drawControlPoint'] as LinkBaseActionType[],
    labels: {
      en: 'Recycling',
      fr: 'Recyclage',
      es: 'Reciclaje',
      de: 'Recycling',
      it: 'Riciclaggio'
    },
    tooltips: {
      en: 'Represents the selected link(s) as recycling with a backward turn',
      fr: 'Représente le/les flux sélectionné(s) sous forme de recyclage avec un retour vers l\'arrière',
      es: 'Representa el/los flujo(s) seleccionado(s) como reciclaje con un retorno hacia atrás',
      de: 'Stellt den/die ausgewählten Fluss/Flüsse als Recycling mit einer Rückwärtskurve dar',
      it: 'Rappresenta il/i flusso/i selezionato/i come riciclaggio con un ritorno all\'indietro'
    }
  } satisfies AttributeConfig<boolean>,

  is_recycling_locked: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawWithNodes'] as LinkBaseActionType[],
    labels: {
      en: 'Recycling locked',
      fr: 'Recyclage verrouillé',
      es: 'Reciclaje bloqueado',
      de: 'Recycling gesperrt',
      it: 'Riciclaggio bloccato'
    },
    tooltips: {
      en: 'When locked, autosankey keeps the user-set recycling status (on or off) instead of recomputing it via cycle detection',
      fr: 'Si verrouillé, le calcul autosankey conserve le statut recyclage défini par l\'utilisateur (forcé recyclage ou forcé non-recyclage) au lieu de le recalculer via la détection de cycles',
      es: 'Si está bloqueado, el cálculo autosankey conserva el estado de reciclaje definido por el usuario (forzado o no) en lugar de recalcularlo mediante la detección de ciclos',
      de: 'Wenn gesperrt, behält die Autosankey-Berechnung den vom Benutzer festgelegten Recycling-Status bei, anstatt ihn über die Zykluserkennung neu zu berechnen',
      it: 'Se bloccato, il calcolo autosankey conserva lo stato di riciclaggio definito dall\'utente invece di ricalcolarlo tramite il rilevamento di cicli'
    }
  } satisfies AttributeConfig<boolean>,

  is_structure: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawWithNodes', 'drawControlPoint'] as LinkBaseActionType[],
    labels: {
      en: 'Structure',
      fr: 'Structure',
      es: 'Estructura',
      de: 'Struktur',
      it: 'Struttura'
    },
    tooltips: {
      en: 'Represents the selected link(s) as if they didn\'t have values',
      fr: 'Représente le/les flux sélectionné(s) comme si ils n\'avaient pas de valeur',
      es: 'Representa el/los flujo(s) seleccionado(s) como si no tuvieran valores',
      de: 'Stellt den/die ausgewählten Fluss/Flüsse dar, als ob sie keine Werte hätten',
      it: 'Rappresenta il/i flusso/i selezionato/i come se non avessero valori'
    }
  } satisfies AttributeConfig<boolean>,

  must_stay_straight: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawWithNodes', 'drawElements'] as LinkBaseActionType[],
    labels: {
      en: 'Keep straight',
      fr: 'Garder droit',
      es: 'Mantener recto',
      de: 'Gerade halten',
      it: 'Mantieni dritto'
    },
    tooltips: {
      en: 'Keep this flow exactly horizontal across all data tags (only vertical gaps adapt). Set via right-click "Straighten flow".',
      fr: 'Garder ce flux exactement horizontal pour tous les tags de données (seuls les écarts verticaux s\'adaptent). Activé via clic droit « Rendre droit ».',
      es: 'Mantener este flujo exactamente horizontal en todas las etiquetas de datos (solo se adaptan los espacios verticales). Activado con clic derecho «Enderezar flujo».',
      de: 'Diesen Fluss über alle Daten-Tags hinweg exakt horizontal halten (nur vertikale Abstände passen sich an). Über Rechtsklick „Fluss begradigen" aktiviert.',
      it: 'Mantieni questo flusso esattamente orizzontale per tutti i tag di dati (solo gli spazi verticali si adattano). Attivato con clic destro «Raddrizza flusso».'
    }
  } satisfies AttributeConfig<boolean>,

  straight_include_children: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawWithNodes', 'drawElements'] as LinkBaseActionType[],
    labels: {
      en: 'Keep disaggregated flows straight',
      fr: 'Garder droit les flux désagrégés',
      es: 'Mantener rectos los flujos desagregados',
      de: 'Disaggregierte Flüsse gerade halten',
      it: 'Mantieni dritti i flussi disaggregati'
    },
    tooltips: {
      en: 'Also keep the child flows straight (between the disaggregated children of the source and target), so straightness survives disaggregation.',
      fr: 'Garder aussi droits les flux enfants (entre les descendants désagrégés de la source et de la cible), pour que la droiture survive à la désagrégation.',
      es: 'Mantener rectos también los flujos hijos (entre los descendientes desagregados del origen y del destino), para que la rectitud sobreviva a la desagregación.',
      de: 'Auch die untergeordneten Flüsse gerade halten (zwischen den disaggregierten Kindknoten von Quelle und Ziel), damit die Geradheit die Disaggregation überlebt.',
      it: 'Mantieni dritti anche i flussi figli (tra i discendenti disaggregati di origine e destinazione), così la rettitudine sopravvive alla disaggregazione.'
    }
  } satisfies AttributeConfig<boolean>,

  straight_mode: {
    default: 'none' as Type_StraightMode,
    type: (() => 'none') as (() => Type_StraightMode),
    category: 'shape' as const,
    actions: ['drawWithNodes', 'drawElements'] as LinkBaseActionType[],
    labels: {
      en: 'Straightness anchor',
      fr: 'Ancrage de droiture',
      es: 'Anclaje de rectitud',
      de: 'Geradheits-Anker',
      it: 'Ancoraggio rettitudine'
    },
    tooltips: {
      en: 'Where this flow is kept straight: none (free), aligned to source, aligned to target, highest or lowest of the two. Set via right-click "Straightness".',
      fr: 'Où ce flux est gardé droit : aucun (libre), en face de la source, en face de la destination, le plus haut ou le plus bas des deux. Activé via clic droit « Rectitude ».',
      es: 'Dónde se mantiene recto este flujo: ninguno (libre), alineado al origen, alineado al destino, el más alto o el más bajo de los dos. Activado con clic derecho «Rectitud».',
      de: 'Wo dieser Fluss gerade gehalten wird: keine (frei), an Quelle ausgerichtet, an Ziel ausgerichtet, höchster oder niedrigster der beiden. Über Rechtsklick „Geradheit" aktiviert.',
      it: 'Dove questo flusso è mantenuto dritto: nessuno (libero), allineato all\'origine, allineato alla destinazione, il più alto o il più basso dei due. Attivato con clic destro «Rettitudine».'
    }
  } satisfies AttributeConfig<Type_StraightMode>,

  is_reference_flux: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    // Pas d'action au set : le redraw est piloté par le handler (setReferenceFlux) ; poser
    // le marqueur ne doit pas déclencher de dessin (notamment pendant le nettoyage de l'ancien).
    actions: [] as BaseActionType[],
    labels: {
      en: 'Reference flow',
      fr: 'Flux de référence',
      es: 'Flujo de referencia',
      de: 'Referenzfluss',
      it: 'Flusso di riferimento'
    },
    tooltips: {
      en: 'In proportional / adapted-scale mode, anchor the diagram on this flow. Set via right-click "Set as reference flow".',
      fr: 'En mode proportionnel / échelle adaptée, ancrer le diagramme sur ce flux. Activé via clic droit « Définir comme flux de référence ».',
      es: 'En modo proporcional / escala adaptada, anclar el diagrama en este flujo. Activado con clic derecho «Definir como flujo de referencia».',
      de: 'Im proportionalen / angepassten Maßstab-Modus das Diagramm an diesem Fluss verankern. Über Rechtsklick „Als Referenzfluss festlegen" aktiviert.',
      it: 'In modalità proporzionale / scala adattata, ancorare il diagramma a questo flusso. Attivato con clic destro «Imposta come flusso di riferimento».'
    }
  } satisfies AttributeConfig<boolean>,

  show_as_path_locked: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Lock stroke rendering',
      fr: 'Verrouiller le rendu en trait',
      es: 'Bloquear renderizado en trazo',
      de: 'Strich-Darstellung sperren',
      it: 'Blocca il rendering a tratto'
    },
    tooltips: {
      en: 'Force this flow to always render as a stroked path, even when thick and short. By default a thick, short flow auto-switches to a filled shape so the stroke does not overlap itself at sharp turns.',
      fr: 'Force ce flux à toujours être tracé en trait (chemin), même épais et court. Par défaut un flux épais et court bascule automatiquement en forme pleine pour éviter que le trait ne se chevauche dans les coudes serrés.',
      es: 'Obliga a este flujo a representarse siempre como trazo, incluso grueso y corto. Por defecto un flujo grueso y corto cambia automáticamente a forma rellena para que el trazo no se solape en las curvas cerradas.',
      de: 'Erzwingt, dass dieser Fluss immer als Strich gezeichnet wird, auch wenn dick und kurz. Standardmäßig wechselt ein dicker, kurzer Fluss automatisch zu einer gefüllten Form, damit sich der Strich an engen Kurven nicht selbst überlappt.',
      it: 'Forza questo flusso a essere sempre disegnato come tratto, anche se spesso e corto. Per impostazione predefinita un flusso spesso e corto passa automaticamente a forma piena affinché il tratto non si sovrapponga nelle curve strette.'
    }
  } satisfies AttributeConfig<boolean>,

  orientation: {
    default: 'hh' as Type_Orientation,
    type: (() => 'hh') as (() => Type_Orientation),
    callback: 'updateLinkAndSourceTarget',
    setter: 'customShapeOrientation',
    category: 'shape' as const,
    actions: ['drawWithNodes'] as LinkBaseActionType[],
    labels: {
      en: 'Orientation',
      fr: 'Orientation',
      es: 'Orientación',
      de: 'Orientierung',
      it: 'Orientamento'
    },
    tooltips: {
      en: 'Choose the orientation of the link start and end points',
      fr: 'Choisir l\'orientation des points de départ et d\'arrivée du flux',
      es: 'Elegir la orientación de los puntos de inicio y fin del flujo',
      de: 'Orientierung der Start- und Endpunkte des Flusses wählen',
      it: 'Scegliere l\'orientamento dei punti di partenza e di arrivo del flusso'
    }
  } satisfies AttributeConfig<Type_Orientation>,

  starting_curve: {
    default: 0.05,
    type: (() => 0.05) as (() => number),
    setter: 'customStartingCurve',
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
    labels: {
      en: 'Start',
      fr: 'Départ',
      es: 'Inicio',
      de: 'Start',
      it: 'Inizio'
    },
    tooltips: {
      en: 'Position of the starting point of curvature as ratio of link length',
      fr: 'Permet d\'affiner la position du départ des courbures du/des flux sélectionné(s). Cette valeur est un ratio (%) relatif à la longueur du flux à partir du point de départ.',
      es: 'Posición del punto de inicio de la curvatura como ratio de la longitud del flujo',
      de: 'Position des Startpunkts der Krümmung als Verhältnis der Flusslänge',
      it: 'Posizione del punto di inizio della curvatura come rapporto della lunghezza del flusso',
    }
  } satisfies AttributeConfig<number>,

  ending_curve: {
    default: 0.05,
    type: (() => 0.05) as (() => number),
    setter: 'customEndingCurve',
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
    labels: {
      en: 'End',
      fr: 'Arrivée',
      es: 'Fin',
      de: 'Ende',
      it: 'Fine'
    },
    tooltips: {
      en: 'Position of the ending point of curvature as ratio of link length',
      fr: 'Permet d\'affiner la position de fin des courbures du/des flux sélectionné(s). Cette valeur est un ratio (%) relatif à la longueur du flux à partir du point de départ.',
      es: 'Posición del punto final de la curvatura como ratio de la longitud del flujo',
      de: 'Position des Endpunkts der Krümmung als Verhältnis der Flusslänge',
      it: 'Posizione del punto finale della curvatura come rapporto della lunghezza del flusso',
    }
  } satisfies AttributeConfig<number>,

  starting_tangeant: {
    default: 0.25,
    type: (() => 0.25) as (() => number),
    setter: 'customStartingTangeant',
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
    labels: {
      en: 'Start',
      fr: 'Départ',
      es: 'Inicio',
      de: 'Start',
      it: 'Inizio'
    },
    tooltips: {
      en: 'Setting the radius of the starting curvature for Bezier curves',
      fr: 'Paramétrage de la courbure de départ dans le cas ou le/les flux sélectionné(s) sont sous forme de courbe(s) de Bezier',
      es: 'Configurar el radio de la curvatura de inicio para curvas de Bezier',
      de: 'Einstellung des Radius der Startkrümmung für Bezier-Kurven',
      it: 'Impostazione del raggio della curvatura iniziale per le curve di Bezier',
    }
  } satisfies AttributeConfig<number>,

  ending_tangeant: {
    default: 0.25,
    type: (() => 0.25) as (() => number),
    setter: 'customEndingTangeant',
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
    labels: {
      en: 'End',
      fr: 'Arrivée',
      es: 'Fin',
      de: 'Ende',
      it: 'Fine'
    },
    tooltips: {
      en: 'Setting the radius of the ending curvature for Bezier curves',
      fr: 'Paramétrage de la courbure de fin dans le cas ou le/les flux sélectionné(s) sont sous forme de courbe(s) de Bezier',
      es: 'Configurar el radio de la curvatura final para curvas de Bezier',
      de: 'Einstellung des Radius der Endkrümmung für Bezier-Kurven',
      it: 'Impostazione del raggio della curvatura finale per le curve di Bezier',
    }
  } satisfies AttributeConfig<number>,

  middle_recycling: {
    default: 100,
    type: (() => 100) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
    labels: {
      en: 'Recycling position',
      fr: 'Position point de recyclage',
      es: 'Posición del punto de reciclaje',
      de: 'Recycling-Position',
      it: 'Posizione del punto di riciclaggio'
    },
    tooltips: {
      en: 'Position of the recycling point',
      fr: 'Position du point de recyclage',
      es: 'Posición del punto de reciclaje',
      de: 'Position des Recycling-Punkts',
      it: 'Posizione del punto di riciclaggio'
    }
  } satisfies AttributeConfig<number>,

  is_arrow: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Arrow',
      fr: 'Flèche',
      es: 'Flecha',
      de: 'Pfeil',
      it: 'Freccia'
    },
    tooltips: {
      en: 'Represents the selected link(s) with an arrow tip at the end',
      fr: 'Représente le/les flux sélectionné(s) avec une pointe de flèche à la fin',
      es: 'Representa el/los flujo(s) seleccionado(s) con una punta de flecha al final',
      de: 'Stellt den/die ausgewählten Fluss/Flüsse mit einer Pfeilspitze am Ende dar',
      it: 'Rappresenta il/i flusso/i selezionato/i con una punta di freccia alla fine'
    }
  } satisfies AttributeConfig<boolean>,

  is_arrow_reversed: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Reverse arrow',
      fr: 'Inverser la flèche',
      es: 'Invertir flecha',
      de: 'Pfeil umkehren',
      it: 'Inverti freccia'
    },
    tooltips: {
      en: 'Draw the arrow tip on the source side instead of the target side (graphical only, the data flow direction is unchanged)',
      fr: 'Dessine la pointe de flèche du côté source au lieu du côté cible (purement graphique, le sens du flux dans les données reste inchangé)',
      es: 'Dibuja la punta de flecha en el lado de origen en lugar del lado de destino (solo gráfico, el sentido del flujo no cambia)',
      de: 'Zeichnet die Pfeilspitze auf der Quellseite statt auf der Zielseite (rein grafisch, die Flussrichtung in den Daten bleibt unverändert)',
      it: 'Disegna la punta della freccia sul lato sorgente invece che sul lato destinazione (solo grafico, il senso del flusso non cambia)'
    }
  } satisfies AttributeConfig<boolean>,

  arrow_size: {
    default: 10,
    type: (() => 10) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Size',
      fr: 'Taille',
      es: 'Tamaño',
      de: 'Größe',
      it: 'Dimensione'
    },
    tooltips: {
      en: 'Change the size of the arrow (from the end of the link to the node)',
      fr: 'Modifie la taille de la flèche (largeur entre la fin du flux et le noeud)',
      es: 'Cambiar el tamaño de la flecha (desde el final del flujo al nodo)',
      de: 'Größe des Pfeils ändern (vom Ende des Flusses zum Knoten)',
      it: 'Cambiare la dimensione della freccia (dalla fine del flusso al nodo)'
    }
  } satisfies AttributeConfig<number>,

  is_dashed: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Dashed',
      fr: 'Hachuré',
      es: 'Discontinuo',
      de: 'Gestrichelt',
      it: 'Tratteggiato'
    },
    tooltips: {
      en: 'Applies a hatch effect on the selected link(s)',
      fr: 'Applique un effet de hachure sur le/les flux sélectionné(s)',
      es: 'Aplica un efecto de rayado en el/los flujo(s) seleccionado(s)',
      de: 'Wendet einen Schraffureffekt auf den/die ausgewählten Fluss/Flüsse an',
      it: 'Applica un effetto tratteggiato sul/sui flusso/i selezionato/i'
    }
  } satisfies AttributeConfig<boolean>,

  color_rule: {
    default: default_element_color_source,
    type: (() => default_element_color_source) as (() => 'flow' | 'source' | 'target' | 'gradient' | 'auto'),
    category: 'shape' as const,
    actions: ['drawElements'] as BaseActionType[],
    labels: {
      en: 'Color',
      fr: 'Couleur',
      es: 'Color',
      de: 'Farbe',
      it: 'Colore'
    },
    tooltips: {
      en: 'Choose what rule defines flow color',
      fr: 'Choisir la règle qui définie la couleur du flux',
      es: 'Elegir qué regla define el color del flujo',
      de: 'Wählen, welche Regel die Flussfarbe bestimmt',
      it: 'Scegliere quale regola definisce il colore del flusso'
    }
  } satisfies AttributeConfig<'flow' | 'source' | 'target' | 'gradient' | 'auto'>,
} as const

export const LINKS_LABEL_SPECIFIC_CONFIG = {
  on_path: {
    default: true,
    type: (() => true) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Follow path',
      fr: 'Orienter suivant l\'axe du flux',
      es: 'Seguir el trazado',
      de: 'Pfad folgen',
      it: 'Seguire il percorso'
    },
    tooltips: {
      en: 'Orient the label following the shape of the link',
      fr: 'Orienter le texte en suivant la forme du flux',
      es: 'Orientar la etiqueta siguiendo la forma del flujo',
      de: 'Beschriftung entlang der Form des Flusses ausrichten',
      it: 'Orientare l\'etichetta seguendo la forma del flusso'
    }
  } satisfies AttributeConfig<boolean>,

  pos_auto: {
    default: true,
    type: (() => true) as (() => boolean),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Auto position',
      fr: 'Position verticale ajustée',
      es: 'Posición automática',
      de: 'Automatische Position',
      it: 'Posizione automatica'
    },
    tooltips: {
      en: 'Automatically adjust the vertical position',
      fr: 'Ajuster automatiquement la position verticale',
      es: 'Ajustar automáticamente la posición vertical',
      de: 'Vertikale Position automatisch anpassen',
      it: 'Regolare automaticamente la posizione verticale'
    }
  } satisfies AttributeConfig<boolean>,

  // Source du texte du label de flux. 'custom' = comportement actuel (texte saisi
  // via text_value). 'none' masque, 'source'/'target' affichent le nom du nœud
  // amont/aval, 'source_target' affiche "source → target".
  // Stocké aussi sur value_label par symétrie de createLinkLabelSpecificConfig
  // mais ignoré côté valeur.
  text_source: {
    default: 'custom' as 'custom' | 'none' | 'flow' | 'source' | 'target' | 'source_target',
    type: (() => 'custom') as (() => string),
    category: '',
    actions: [] as BaseActionType[],
    labels: {
      en: 'Label content',
      fr: 'Contenu du label',
      es: 'Contenido de la etiqueta',
      de: 'Beschriftungstext',
      it: 'Contenuto etichetta'
    },
    tooltips: {
      en: 'Pick what the link label displays: typed text, nothing, source/target node name, or source → target',
      fr: 'Choisir ce qu\'affiche le label du flux : texte saisi, rien, nom du nœud source/destination, ou source → destination',
      es: 'Elegir lo que muestra la etiqueta: texto, nada, nombre del nodo origen/destino, o origen → destino',
      de: 'Wählen, was die Beschriftung anzeigt: Text, nichts, Name des Quell-/Zielknotens oder Quelle → Ziel',
      it: 'Scegli cosa mostra l\'etichetta: testo, nulla, nome del nodo sorgente/destinazione, o sorgente → destinazione'
    }
  } satisfies AttributeConfig<string>,
} as const

const createLinkLabelSpecificConfig = <P extends string>(prefix: P, category: string, drawAction: BaseActionType) => {
  return createConfigWithPrefixAndOverrides(
    LINKS_LABEL_SPECIFIC_CONFIG,
    prefix,
    category,
    [drawAction],
    {
      on_path: {
        setter: prefix === 'value_label' ? 'customValueLabelOnPath' : 'customNameLabelOnPath',
        category: category,
        actions: [drawAction] as BaseActionType[],
      },

      pos_auto: {
        setter: prefix === 'value_label' ? 'customValueLabelPosAuto' : 'customNameLabelPosAuto',
        category: category,
        actions: [drawAction] as BaseActionType[],
      },
    })
}

export const ALL_ATTRIBUTES_CONFIG = {
  ...createConfigWithPrefix(BASE_SHAPE_CONFIG, 'shape'),
  ...createConfigWithPrefix(NODE_SHAPE_SPECIFIC_CONFIG, 'shape'),
  ...createConfigWithPrefix(LINK_SHAPE_SPECIFIC_CONFIG, 'shape' as const),

  ...createConfigWithPrefix(NAME_LABEL_CONFIG, 'name_label'),
  ...createLinkLabelSpecificConfig('name_label' as const, 'name_label', 'drawNameLabel'),

  ...createConfigWithPrefix(VALUE_LABEL_CONFIG, 'value_label'),
  ...createLinkLabelSpecificConfig('value_label' as const, 'value_label', 'drawValueLabel'),

  ...createConfigWithPrefix(STOCK_LABEL_CONFIG, 'stock_label'),

  ...createConfigWithPrefixAndOverrides(ICON_LABEL_BASE_CONFIG, 'icon',
    'icon',
    ['drawIcon'],
    {
      is_icon: {
        default: true,
      },
      box_width: {
        default: 50,
      }
    }),
  ...HYPER_LINK_CONFIG,
} as const

export type ElementsType = Class_LinkElement[] | Class_NodeBase[] | Class_ElementStyle[]
// Hook pour extraire la logique commune des composants ElementAttr*

export const useElementAttributeConfig = <
  _CONFIG extends Record<string, AttributeConfig<unknown>>
>(app_data: Class_ApplicationData, elements: ElementsType): {
  menu_for_style: boolean
  t: TFunction
} => {
  return useMemo(() => {
    const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)

    return {
      menu_for_style,
      t: app_data.t
    } as {
      menu_for_style: boolean
      t: TFunction
    }
  }, [app_data, elements])
}

export function updateElements<
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>(
  data: Class_ApplicationData,
  elements: (Class_LinkElement |
    Class_NodeBase |
    Class_ElementStyle)[],
  config: CONFIG,
  prefix: string,
  key: K,
  value: ExtractConfigValue<CONFIG[K]>,
  refreshParentComponent: () => void
) {
  const fullKey = prefix ? `${prefix}_${String(key)}` : String(key)
  // Create a dict of old val for each elements 
  const dict_old_val: { [id: string]: ExtractConfigValue<CONFIG[K]> } = {}
  elements.forEach(element => {
    dict_old_val[element.id] = Reflect.get(element, fullKey)
  })

  // Original function
  const _updateElements = () => {
    elements.forEach(element => {
      Reflect.set(element, fullKey, value)
    })
    refreshParentComponent()
  }

  // Undo function
  const inv_updateElements = () => {
    elements.forEach(element => Reflect.set(element, fullKey, dict_old_val[element.id])
    )
    refreshParentComponent()
  }

  data.history.saveUndo(inv_updateElements)
  data.history.saveRedo(_updateElements)
  _updateElements()
}
/**
 * Fonction générique pour créer des proxies getter/setter sur des attributs d'éléments
 */

export function getConfigValues<
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  ELEMENTS extends ElementsType
>(
  elements: ELEMENTS,
  config: CONFIG,
  prefix: string = '',
  refreshParentComponent: () => void
): {
    -readonly [K in keyof CONFIG]: ExtractConfigValue<CONFIG[K]>
  } {
  const result = {} as {
    -readonly [K in keyof CONFIG]: ExtractConfigValue<CONFIG[K]>
  }

  // Créer des getters/setters pour chaque propriété
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const fullKey = prefix ? `${prefix}_${key}` : key
      const configKey = key as keyof CONFIG

      Object.defineProperty(result, key, {
        get: () => {
          return (elements.length > 0 && Reflect.get(elements[0], fullKey)) ?? config[configKey].default
        },
        set: (value: ExtractConfigValue<CONFIG[typeof configKey]>) => {
          if (elements.length == 0) return
          updateElements(
            elements[0].drawing_area.application_data,
            elements,
            config,
            prefix,
            configKey,
            value,
            refreshParentComponent
          )
        },
        enumerable: true,
        configurable: true
      })
    }
  }

  return result
}
// ✅ Fonctions spécialisées simplifiées (optionnelles, pour garder l'API existante)

export const getElementsLabelValues = (
  elements: ElementsType,
  prefix: 'name_label' | 'value_label' | 'icon' | 'stock_label',
  refreshParentComponent: () => void
) => getConfigValues(elements, BASE_LABEL_CONFIG, prefix, refreshParentComponent)

export const getElementsValueLabelValues = (
  elements: ElementsType,
  prefix: 'name_label' | 'value_label',
  refreshParentComponent: () => void
) => getConfigValues(elements, VALUE_LABEL_CONFIG, prefix, refreshParentComponent)

export const getElementsNameLabelValues = (
  elements: Class_NodeBase[] | Class_ElementStyle[],
  prefix: 'name_label' | 'value_label' | 'icon',
  refreshParentComponent: () => void
) => getConfigValues(elements, NAME_LABEL_CONFIG, prefix, refreshParentComponent)

export const getLinksLabelValues = (
  elements: Class_LinkElement[] | Class_ElementStyle[],
  prefix: 'name_label' | 'value_label' | 'icon',
  refreshParentComponent: () => void
) => getConfigValues(elements, LINKS_LABEL_SPECIFIC_CONFIG, prefix, refreshParentComponent)

export const getShapeValues = (
  elements: ElementsType,
  prefix: ShapePrefix,
  refreshParentComponent: () => void
) => getConfigValues(elements, BASE_SHAPE_CONFIG, prefix, refreshParentComponent)

export const getLinkShapeValues = (
  elements: ElementsType,
  refreshParentComponent: () => void
) => getConfigValues(elements, LINK_SHAPE_SPECIFIC_CONFIG, 'shape', refreshParentComponent)

export const getNodeShapeValues = (
  elements: ElementsType,
  refreshParentComponent: () => void
) => getConfigValues(elements, NODE_SHAPE_SPECIFIC_CONFIG, 'shape', refreshParentComponent)

export const getIconValues = (
  elements: ElementsType,
  refreshParentComponent: () => void
) => getConfigValues(elements, ICON_LABEL_BASE_CONFIG, 'icon', refreshParentComponent)


