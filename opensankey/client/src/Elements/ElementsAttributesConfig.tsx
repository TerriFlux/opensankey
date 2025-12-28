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

import {
    default_element_color,
    default_element_color_source,
    default_font,
    getBooleanFromJSON,
    Type_JSON,
    Type_Position,
} from '../types/Utils'
import { Class_ElementStyle } from './Element'
import { Class_LinkElement } from './Link'
import { UnitType } from './LinkValues'
import { Class_NodeBase } from './NodeBase'

// Types spécifiques
export type Type_Shape = 'ellipse' | 'rect' | 'bezier_outline' | 'bezier_path'
export type Type_TextHPos = 'left' | 'middle' | 'right' | 'dragged'
export type Type_TextVPos = 'top' | 'middle' | 'bottom' | 'dragged'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
export type Type_VerticalAlignment = 'left' | 'right'
export type Type_ExtremityPosition = 'top' | 'bottom' | 'left' | 'right'
export const default_position_type = 'absolute'
export const default_auto_x = false
export const default_auto_y = false
export const default_dx = 200
export const default_dy = 50
export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_PathLabelHPosition = 'dragged' | 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'dragged' | 'top' | 'middle' | 'bottom'
export type Type_customisable_node_style_attr = keyof typeof NODES_ATTRIBUTES_CONFIG
export type Type_customisable_flow_style_attr = keyof typeof LINKS_ATTRIBUTES_CONFIG

// Types d'actions disponibles
export type BaseActionType =
    | 'drawElements'
    | 'drawShape'
    | 'drawNameLabel'
    | 'drawValueLabel'
    | 'drawIllustration'
    | 'drawFO'
    | 'drawIllustrationImage'
    | 'drawIllustrationIcon'

export type NodeBaseActionType = BaseActionType
export type LinkBaseActionType = BaseActionType | 'drawArrow' | 'drawControlPoint' | 'drawWithNodes'

// Interface pour la configuration d'un attribut
export interface AttributeConfig<T> {
    default: T
    type: () => T
    category: string
    labels: { en: string; fr: string }
    tooltips: { en: string; fr: string }
    callback?: string
    setter?: string
    actions?: (BaseActionType | NodeBaseActionType | LinkBaseActionType)[]
}

type ExtractConfigValue<T> = T extends AttributeConfig<infer V> ? V : never

export type ShapePrefix =
    | 'shape'
    | 'name_label_background'
    | 'value_label_background'

// Type pour mapper les attributs du config vers leurs valeurs
type ShapeValues<T extends typeof BASE_SHAPE_CONFIG> = {
    [K in keyof T]: ExtractConfigValue<T[K]>
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
 * const shapeValues = getShapeValues(element, 'shape', BASE_SHAPE_CONFIG)
 * // { visible: true, type: 'rect', color: '#fff', ... }
 * 
 * @example
 * // Pour background de name_label
 * const bgValues = getShapeValues(element, 'name_label_background', BASE_SHAPE_CONFIG)
 * // { visible: false, type: 'rect', color: '#ffffff', ... }
 * 
 */
export function getShapeValues<T extends typeof BASE_SHAPE_CONFIG>(
    element: Class_LinkElement | Class_NodeBase | Class_ElementStyle<typeof NODES_ATTRIBUTES_CONFIG> | Class_ElementStyle<typeof LINKS_ATTRIBUTES_CONFIG>,
    prefix: ShapePrefix,
    config: T
): ShapeValues<T> {
    const result = {} as any

    // Parcourir toutes les clés du config
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const fullKey = `${prefix}_${key}`
            const configEntry = config[key] as any  // Cast nécessaire pour accéder à .default

            // Récupérer la valeur depuis l'élément ou utiliser la valeur par défaut
            result[key] = Reflect.get(element, fullKey) ?? configEntry.default
        }
    }

    return result as ShapeValues<T>
}
/**
 * Vérifie si une valeur de shape est indéterminée (différente entre plusieurs éléments)
 * Similaire à isLabelValueIndeterminate
 * 
 * @example
 * const isColorIndeterminate = isShapeValueIndeterminate(
 *   selectedElements, 
 *   'shape', 
 *   'color',
 *   BASE_SHAPE_CONFIG
 * )
 */
export function isShapeValueIndeterminate<T extends typeof BASE_SHAPE_CONFIG>(
    elements: (Class_LinkElement | Class_NodeBase | Class_ElementStyle<typeof NODES_ATTRIBUTES_CONFIG> | Class_ElementStyle<typeof LINKS_ATTRIBUTES_CONFIG>)[],
    prefix: ShapePrefix,
    configKey: keyof T,
    config: T
): boolean {
    if (elements.length === 0) return false
    const fullKey = `${prefix}_${String(configKey)}`
    const firstValue = Reflect.get(elements[0], fullKey)
    return !elements.every(el => Reflect.get(el, fullKey) === firstValue)
}

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

export function getLabelValueAttributeKey<
    T extends typeof VALUE_LABEL_CONFIG,
    K extends keyof T
>(
    configKey: K
): `value_label_${string & K}` {
    return `value_label_${String(configKey)}` as `value_label_${string & K}`
}

export function isLabelValueIndeterminate<T extends typeof VALUE_LABEL_CONFIG>(
    elements: (Class_LinkElement | Class_NodeBase | Class_ElementStyle<typeof NODES_ATTRIBUTES_CONFIG> | Class_ElementStyle<typeof LINKS_ATTRIBUTES_CONFIG>)[],
    configKey: keyof T,
): boolean {
    if (elements.length === 0) return false
    const fullKey = `value_label_${String(configKey)}`
    const firstValue = Reflect.get(elements[0], fullKey)
    return !elements.every(el => Reflect.get(el, fullKey) === firstValue)
}

/**
 * Récupère la valeur par défaut d'un attribut de shape
 * 
 * @example
 * getShapeConfigDefault(BASE_SHAPE_CONFIG, 'opacity') // 0.85
 */
export function getShapeConfigDefault<T extends typeof BASE_SHAPE_CONFIG, K extends keyof T>(
    config: T,
    key: K
): ExtractConfigValue<T[K]> {
    //@ts-expect-error xxx
    return config[key].default
}

// ==================================================================================================
// HELPER POUR CRÉER DES CONFIGS AVEC PRÉFIXES
// ==================================================================================================

type ConfigWithPrefix<T extends Record<string, AttributeConfig<any>>, P extends string> = {
    [K in keyof T as `${P}_${string & K}`]: T[K]
}

export function createConfigWithPrefix<
    T extends Record<string, AttributeConfig<any>>,
    P extends string
>(
    baseConfig: T,
    prefix: P
): ConfigWithPrefix<T, P> {
    const result: any = {}

    for (const [key, config] of Object.entries(baseConfig)) {
        const newKey = prefix ? `${prefix}_${key}` : key
        result[newKey] = {
            ...config,
            labels: {
                en: config.labels.en,
                fr: config.labels.fr
            },
            tooltips: {
                en: config.tooltips.en,
                fr: config.tooltips.fr
            }
        }
    }

    return result as ConfigWithPrefix<T, P>
}


type PrefixKeys<T extends Record<string, any>, P extends string> = {
    [K in keyof T as `${P}_${string & K}`]: T[K]
}

type ConfigOverrides = {
    [key: string]: {
        default?: any
        labels?: { en: string; fr: string }
        tooltips?: { en: string; fr: string }
    }
}

export function createConfigWithPrefixAndOverrides<T extends Record<string, AttributeConfig<any>>, P extends string>(
    baseConfig: T,
    prefix: P,
    category: string,
    actions: BaseActionType[],
    overrides?: ConfigOverrides
): PrefixKeys<T, P> {
    const result: any = {}

    for (const [key, config] of Object.entries(baseConfig)) {
        const newKey = prefix ? `${prefix}_${key}` : key
        const override = overrides?.[key] || {}

        result[newKey] = {
            ...config,
            default: override.default !== undefined ? override.default : config.default,
            type: override.default !== undefined
                ? (() => override.default) as any
                : config.type,
            category: category,
            actions: actions,
            labels: override.labels || {
                en: config.labels.en,
                fr: config.labels.fr
            },
            tooltips: override.tooltips || {
                en: config.tooltips.en,
                fr: config.tooltips.fr
            }
        }
    }

    return result
}
// BASE_SHAPE_CONFIG - Configuration de base pour une forme
// ==================================================================================================

export const BASE_SHAPE_CONFIG = {
    visible: {
        default: true as boolean,
        type: (() => true) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Shape (Base)',
            fr: 'Forme (Base)'
        },
        tooltips: {
            en: 'Show or hide the shape',
            fr: 'Afficher ou masquer la forme'
        }
    } satisfies AttributeConfig<boolean>,

    type: {
        default: 'rect' as Type_Shape,
        type: (() => 'rect') as (() => Type_Shape),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Shape type',
            fr: 'Type de forme'
        },
        tooltips: {
            en: 'Choose a shape (rectangle, ellipse, arrow)',
            fr: 'Choisir une forme (rectangle, ellipse, flèche)'
        }
    } satisfies AttributeConfig<Type_Shape>,

    min_width: {
        default: 40,
        type: (() => 40) as (() => number),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Minimum width',
            fr: 'Largeur minimale'
        },
        tooltips: {
            en: 'Minimum width in pixels',
            fr: 'Largeur minimale en pixels'
        }
    } satisfies AttributeConfig<number>,

    min_height: {
        default: 40,
        type: (() => 40) as (() => number),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Minimum height',
            fr: 'Hauteur minimale'
        },
        tooltips: {
            en: 'Minimum height in pixels',
            fr: 'Hauteur minimale en pixels'
        }
    } satisfies AttributeConfig<number>,

    color_visible: {
        default: true as boolean,
        type: (() => true) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Background',
            fr: 'Fond'
        },
        tooltips: {
            en: 'Show or hide the background color',
            fr: 'Afficher ou masquer la couleur de fond'
        }
    } satisfies AttributeConfig<boolean>,

    color: {
        default: default_element_color,
        type: (() => default_element_color) as (() => string),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Color',
            fr: 'Couleur'
        },
        tooltips: {
            en: 'Background color',
            fr: 'Couleur de fond'
        }
    } satisfies AttributeConfig<string>,

    opacity: {
        default: 0.85,
        type: (() => 0.85) as (() => number),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Opacity',
            fr: 'Opacité'
        },
        tooltips: {
            en: 'Opacity of the shape',
            fr: 'Opacité de la forme'
        }
    } satisfies AttributeConfig<number>,

    color_sustainable: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Static color',
            fr: 'Couleur fixe'
        },
        tooltips: {
            en: 'Keep the color fixed regardless of filters',
            fr: 'Garder la couleur fixe indépendamment des filtres'
        }
    } satisfies AttributeConfig<boolean>,

    border_visible: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Border',
            fr: 'Bordure'
        },
        tooltips: {
            en: 'Make the border transparent',
            fr: 'Rendre la bordure transparente'
        }
    } satisfies AttributeConfig<boolean>,

    border_color: {
        default: 'black',
        type: (() => 'black') as (() => string),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Color',
            fr: 'Couleur'
        },
        tooltips: {
            en: 'Color of the border',
            fr: 'Couleur de la bordure'
        }
    } satisfies AttributeConfig<string>,

    border_thickness: {
        default: 1,
        type: (() => 1) as (() => number),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Thickness',
            fr: 'Épaisseur'
        },
        tooltips: {
            en: 'Thickness of the border in pixels',
            fr: 'Épaisseur de la bordure en pixels'
        }
    } satisfies AttributeConfig<number>,

    border_dashed: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Dashed',
            fr: 'Tiretés'
        },
        tooltips: {
            en: 'Use a dashed border style',
            fr: 'Utiliser un style de bordure en pointillés'
        }
    } satisfies AttributeConfig<boolean>,

    border_radius: {
        default: 0,
        type: (() => 0) as (() => number),
        category: 'shape' as const,
        actions: ['drawShape'] as BaseActionType[],
        labels: {
            en: 'Radius',
            fr: 'Rayon'
        },
        tooltips: {
            en: 'Border radius in pixels',
            fr: 'Rayon de bordure en pixels'
        }
    } satisfies AttributeConfig<number>
} as const

// LABEL_CONFIG - Configuration de base pour un label (nom ou valeur)
// ==================================================================================================

function createLabelConfig(prefix: string, category: string, drawAction: BaseActionType) {
    const visibility_string_fr = prefix === 'name_label' ? 'Label' : 'Valeur'
    const visibility_string_en = prefix === 'value_label' ? 'Label' : 'Value'
    return {
        // Visibility
        is_visible: {
            default: prefix === 'name_label' ? true : false,
            type: (() => (prefix === 'name_label' ? true : false)) as (() => boolean),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: visibility_string_en,
                fr: visibility_string_fr
            },
            tooltips: {
                en: 'Display or hide the label',
                fr: 'Afficher ou masquer le label'
            }
        } satisfies AttributeConfig<boolean>,

        // Font
        font_family: {
            default: default_font,
            type: (() => default_font) as (() => string),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Font family',
                fr: 'Police de caractères'
            },
            tooltips: {
                en: 'Font family for the label',
                fr: 'Police de caractères pour le label'
            }
        } satisfies AttributeConfig<string>,

        font_size: {
            default: 14,
            type: (() => 14) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Font size',
                fr: 'Taille de police'
            },
            tooltips: {
                en: 'Font size for the label',
                fr: 'Taille de police pour le label'
            }
        } satisfies AttributeConfig<number>,

        uppercase: {
            default: false as boolean,
            type: (() => false) as (() => boolean),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Uppercase',
                fr: 'Majuscules'
            },
            tooltips: {
                en: 'Display text in uppercase',
                fr: 'Afficher le texte en majuscules'
            }
        } satisfies AttributeConfig<boolean>,

        bold: {
            default: false as boolean,
            type: (() => false) as (() => boolean),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Bold',
                fr: 'Gras'
            },
            tooltips: {
                en: 'Display text in bold',
                fr: 'Afficher le texte en gras'
            }
        } satisfies AttributeConfig<boolean>,

        italic: {
            default: false as boolean,
            type: (() => false) as (() => boolean),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Italic',
                fr: 'Italique'
            },
            tooltips: {
                en: 'Display text in italic',
                fr: 'Afficher le texte en italique'
            }
        } satisfies AttributeConfig<boolean>,

        color: {
            default: 'black',
            type: (() => 'black') as (() => string),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Text color',
                fr: 'Couleur du texte'
            },
            tooltips: {
                en: 'Color of the text',
                fr: 'Couleur du texte'
            }
        } satisfies AttributeConfig<string>,

        // Position
        horiz: {
            default: 'middle' as Type_TextHPos,
            type: (() => 'middle') as (() => Type_TextHPos),
            setter: prefix === 'name_label' ? 'customNameLabelHoriz' : 'customValueLabelHoriz',
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Horizontal position',
                fr: 'Position horizontale'
            },
            tooltips: {
                en: 'Horizontal position relative to the node',
                fr: 'Position horizontale par rapport au noeud'
            }
        } satisfies AttributeConfig<Type_TextHPos>,

        vert: {
            default: (prefix === 'name_label' ? 'bottom' : 'top') as Type_TextVPos,
            type: (() => (prefix === 'name_label' ? 'bottom' : 'top')) as (() => Type_TextVPos),
            setter: prefix === 'name_label' ? 'customNameLabelVert' : 'customValueLabelVert',
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Vertical position',
                fr: 'Position verticale'
            },
            tooltips: {
                en: 'Vertical position relative to the node',
                fr: 'Position verticale par rapport au noeud'
            }
        } satisfies AttributeConfig<Type_TextVPos>,

        horiz_shift: {
            default: 0,
            type: (() => 0) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Horizontal shift',
                fr: 'Décalage horizontal'
            },
            tooltips: {
                en: 'Horizontal shift from anchor point',
                fr: 'Décalage horizontal depuis le point d\'ancrage'
            }
        } satisfies AttributeConfig<number>,

        vert_shift: {
            default: 0,
            type: (() => 0) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Vertical shift',
                fr: 'Décalage vertical'
            },
            tooltips: {
                en: 'Vertical shift from anchor point',
                fr: 'Décalage vertical depuis le point d\'ancrage'
            }
        } satisfies AttributeConfig<number>,

        box_width: {
            default: 150,
            type: (() => 150) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Box width',
                fr: 'Largeur de la zone'
            },
            tooltips: {
                en: 'Width of the text area in pixels',
                fr: 'Largeur de la zone de texte en pixels'
            }
        } satisfies AttributeConfig<number>,

        vertical_text: {
            default: false as boolean,
            type: (() => false) as (() => boolean),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Vertical text',
                fr: 'Texte vertical'
            },
            tooltips: {
                en: 'Orient text vertically',
                fr: 'Orienter le texte verticalement'
            }
        } satisfies AttributeConfig<boolean>,
        position_x: {
            default: 0 as number,
            type: (() => 0) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'position_x',
                fr: 'position_x'
            },
            tooltips: {
                en: 'position_x',
                fr: 'position_x'
            }
        } satisfies AttributeConfig<number>,
        position_y: {
            default: 0 as number,
            type: (() => 0) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'position_y',
                fr: 'position_y'
            },
            tooltips: {
                en: 'position_y',
                fr: 'position_y'
            }
        } satisfies AttributeConfig<number>,
        position_offset: {
            default: 0 as number,
            type: (() => 0) as (() => number),
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'position_offset',
                fr: 'position_offset'
            },
            tooltips: {
                en: 'position_offset',
                fr: 'position_offset'
            }
        } satisfies AttributeConfig<number>,
        // ✅ RÉUTILISATION de BASE_SHAPE_CONFIG avec préfixe "background" et overrides
        ...createConfigWithPrefixAndOverrides(
            BASE_SHAPE_CONFIG,
            'background' as const,
            category,
            [drawAction],
            {
                // Surcharge des valeurs par défaut pour le background
                visible: {
                    default: prefix === 'name_label' ? true : false,
                    labels: {
                        en: 'Background',
                        fr: 'Fond'
                    },
                    tooltips: {
                        en: 'Show background for better visibility',
                        fr: 'Afficher le fond pour une meilleure visibilité'
                    }
                },
                color: {
                    default: '#ffffff',
                    labels: {
                        en: 'Background color',
                        fr: 'Couleur de fond'
                    },
                    tooltips: {
                        en: 'Background color',
                        fr: 'Couleur de fond'
                    }
                },
                opacity: {
                    default: 0.55,  // ✅ Surcharge de 0.85 → 0.55
                },
                border_radius: {
                    default: 4
                }
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
            fr: 'Séparateur'
        },
        tooltips: {
            en: 'Separator character',
            fr: 'Caractère séparateur'
        }
    } satisfies AttributeConfig<string>,

    separator_part: {
        default: 'after' as 'before' | 'after',
        type: (() => 'after') as (() => 'before' | 'after'),
        category: 'name_label' as const,
        actions: ['drawNameLabel'] as BaseActionType[],
        labels: {
            en: 'Separator position',
            fr: 'Position du séparateur'
        },
        tooltips: {
            en: 'Position of the separator',
            fr: 'Position du séparateur'
        }
    } satisfies AttributeConfig<'before' | 'after'>,
} as const

const VALUE_LABEL_BASE_CONFIG = createLabelConfig('value_label', 'value_label', 'drawValueLabel')

export const VALUE_LABEL_CONFIG = {
    ...VALUE_LABEL_BASE_CONFIG,

    // Formatting
    scientific_notation: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Scientific notation',
            fr: 'Notation scientifique'
        },
        tooltips: {
            en: 'Use scientific notation',
            fr: 'Utiliser la notation scientifique'
        }
    } satisfies AttributeConfig<boolean>,

    significant_digits: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Significant digits',
            fr: 'Chiffres significatifs'
        },
        tooltips: {
            en: 'Use significant digits',
            fr: 'Utiliser les chiffres significatifs'
        }
    } satisfies AttributeConfig<boolean>,

    nb_significant_digits: {
        default: 3,
        type: (() => 3) as (() => number),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Number of significant digits',
            fr: 'Nombre de chiffres significatifs'
        },
        tooltips: {
            en: 'Number of significant digits',
            fr: 'Nombre de chiffres significatifs'
        }
    } satisfies AttributeConfig<number>,

    custom_digit: {
        default: true as boolean,
        type: (() => true) as (() => boolean),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Custom digits',
            fr: 'Décimales personnalisées'
        },
        tooltips: {
            en: 'Use custom number of decimals',
            fr: 'Utiliser un nombre personnalisé de décimales'
        }
    } satisfies AttributeConfig<boolean>,

    nb_digit: {
        default: 2,
        type: (() => 2) as (() => number),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Number of digits',
            fr: 'Nombre de décimales'
        },
        tooltips: {
            en: 'Number of decimal places',
            fr: 'Nombre de décimales'
        }
    } satisfies AttributeConfig<number>,

    // Units
    unit_visible: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Unit visible',
            fr: 'Unité visible'
        },
        tooltips: {
            en: 'Display the unit',
            fr: 'Afficher l\'unité'
        }
    } satisfies AttributeConfig<boolean>,

    unit_type: {
        default: 'unit_name',
        type: (() => 'unit_name') as (() => UnitType),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Unit type',
            fr: 'Type d\'unité'
        },
        tooltips: {
            en: 'Type of unit to display',
            fr: 'Type d\'unité à afficher'
        }
    } satisfies AttributeConfig<UnitType>,

    unit: {
        default: '',
        type: (() => '') as (() => string),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Unit name',
            fr: 'Nom de l\'unité'
        },
        tooltips: {
            en: 'Name of the unit',
            fr: 'Nom de l\'unité'
        }
    } satisfies AttributeConfig<string>,

    unit_factor: {
        default: 1,
        type: (() => 1) as (() => number),
        category: 'value_label' as const,
        actions: ['drawValueLabel'] as BaseActionType[],
        labels: {
            en: 'Unit factor',
            fr: 'Facteur d\'unité'
        },
        tooltips: {
            en: 'Conversion factor for the unit',
            fr: 'Facteur de conversion pour l\'unité'
        }
    } satisfies AttributeConfig<number>,
} as const

export const ICON_CONFIG = {
    // Icon
    icon_name: {
        default: undefined as string | undefined,
        type: (() => undefined) as (() => string | undefined),
        category: 'icon' as const,
        actions: ['drawIllustrationIcon'] as BaseActionType[],
        labels: {
            en: 'Icon name',
            fr: 'Nom de l\'icône'
        },
        tooltips: {
            en: 'Name of the icon',
            fr: 'Nom de l\'icône'
        }
    } satisfies AttributeConfig<string | undefined>,

    icon_color: {
        default: undefined as string | undefined,
        type: (() => undefined) as (() => string | undefined),
        category: 'icon' as const,
        actions: ['drawIllustrationIcon'] as BaseActionType[],
        labels: {
            en: 'Icon color',
            fr: 'Couleur de l\'icône'
        },
        tooltips: {
            en: 'Color of the icon',
            fr: 'Couleur de l\'icône'
        }
    } satisfies AttributeConfig<string | undefined>,

    icon_visible: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'icon' as const,
        actions: ['drawIllustration'] as BaseActionType[],
        labels: {
            en: 'Icon visible',
            fr: 'Icône visible'
        },
        tooltips: {
            en: 'Display or hide the icon',
            fr: 'Afficher ou masquer l\'icône'
        }
    } satisfies AttributeConfig<boolean>,

    icon_view_box: {
        default: undefined as string | undefined,
        type: (() => undefined) as (() => string | undefined),
        category: 'icon' as const,
        actions: ['drawIllustrationIcon'] as BaseActionType[],
        labels: {
            en: 'Icon viewBox',
            fr: 'ViewBox de l\'icône'
        },
        tooltips: {
            en: 'SVG viewBox attribute',
            fr: 'Attribut viewBox SVG'
        }
    } satisfies AttributeConfig<string | undefined>,

    icon_color_sustainable: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'icon' as const,
        actions: ['drawIllustrationIcon'] as BaseActionType[],
        labels: {
            en: 'Static icon color',
            fr: 'Couleur d\'icône fixe'
        },
        tooltips: {
            en: 'Keep icon color fixed',
            fr: 'Garder la couleur d\'icône fixe'
        }
    } satisfies AttributeConfig<boolean>
} as const


export const RICH_TEXT_CONFIG = {
    // Foreign Object
    has_fo: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'foreign_object' as const,
        actions: ['drawFO'] as BaseActionType[],
        labels: {
            en: 'Has foreign object',
            fr: 'A un objet étranger'
        },
        tooltips: {
            en: 'Enable foreign object',
            fr: 'Activer l\'objet étranger'
        }
    } satisfies AttributeConfig<boolean>,

    is_fo_raw: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'foreign_object' as const,
        actions: ['drawFO'] as BaseActionType[],
        labels: {
            en: 'Raw foreign object',
            fr: 'Objet étranger brut'
        },
        tooltips: {
            en: 'Use raw HTML',
            fr: 'Utiliser HTML brut'
        }
    } satisfies AttributeConfig<boolean>,

    fo_content: {
        default: undefined as string | undefined,
        type: (() => undefined) as (() => string | undefined),
        category: 'foreign_object' as const,
        actions: ['drawFO'] as BaseActionType[],
        labels: {
            en: 'Foreign object content',
            fr: 'Contenu de l\'objet étranger'
        },
        tooltips: {
            en: 'HTML content',
            fr: 'Contenu HTML'
        }
    } satisfies AttributeConfig<string | undefined>
} as const

export const IMAGE_CONFIG = {
    // Image
    is_image: {
        default: false as boolean,
        type: (() => false) as (() => boolean),
        category: 'image' as const,
        actions: ['drawIllustration'] as BaseActionType[],
        labels: {
            en: 'Is image',
            fr: 'Est une image'
        },
        tooltips: {
            en: 'Display as image',
            fr: 'Afficher comme image'
        }
    } satisfies AttributeConfig<boolean>,

    image_src: {
        default: undefined as string | undefined,
        type: (() => undefined) as (() => string | undefined),
        category: 'image' as const,
        actions: ['drawIllustrationImage'] as BaseActionType[],
        labels: {
            en: 'Image source',
            fr: 'Source de l\'image'
        },
        tooltips: {
            en: 'URL or path to image',
            fr: 'URL ou chemin vers l\'image'
        }
    } satisfies AttributeConfig<string | undefined>
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
            fr: 'Lien hypertexte'
        },
        tooltips: {
            en: 'URL for hyperlink',
            fr: 'URL pour lien hypertexte'
        }
    } satisfies AttributeConfig<string | undefined>
} as const

export type ValueLabelConfigReturn = typeof VALUE_LABEL_CONFIG
export type LabelConfigReturn = ReturnType<typeof createLabelConfig>
// Type pour mapper tous les attributs du config vers leurs valeurs
type LabelValues<T extends LabelConfigReturn> = {
    [K in keyof T]: ExtractConfigValue<T[K]>
}

export function getLabelValues<T extends LabelConfigReturn>(
    element: Class_LinkElement | Class_NodeBase | Class_ElementStyle<typeof NODES_ATTRIBUTES_CONFIG> | Class_ElementStyle<typeof LINKS_ATTRIBUTES_CONFIG>,
    prefix: 'name_' | 'value_',
    config: T
): LabelValues<T> {
    const result = {} as any

    // Parcourir toutes les clés du config
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const fullKey = `${prefix}label_${key}`
            const configEntry = config[key] as any  // Cast nécessaire pour accéder à .default

            // Récupérer la valeur depuis l'élément ou utiliser la valeur par défaut
            result[key] = Reflect.get(element, fullKey) ?? configEntry.default
        }
    }

    return result as LabelValues<T>
}
export type IconConfigReturn = typeof ICON_CONFIG
export type RichTextConfigReturn = typeof RICH_TEXT_CONFIG
export type ImageConfigReturn = typeof IMAGE_CONFIG
export type HyperLinkConfigReturn = typeof HYPER_LINK_CONFIG


// Type pour les attributs de forme (inféré de BASE_SHAPE_CONFIG)
export type ShapeAttributeTypes = {
    [K in keyof typeof BASE_SHAPE_CONFIG]: ReturnType<typeof BASE_SHAPE_CONFIG[K]['type']>
}

// Type pour les attributs de label nom (inféré de NAME_LABEL_CONFIG)
export type NameLabelAttributeTypes = {
    [K in keyof typeof NAME_LABEL_CONFIG]: ReturnType<typeof NAME_LABEL_CONFIG[K]['type']>
}

// Type pour les attributs de label valeur (inféré de VALUE_LABEL_CONFIG)
export type ValueLabelAttributeTypes = {
    [K in keyof typeof VALUE_LABEL_CONFIG]: ReturnType<typeof VALUE_LABEL_CONFIG[K]['type']>
}

// Type pour les attributs d'icône
export type IconAttributeTypes = {
    name: string | undefined
    color: string | undefined
    visible: boolean
    view_box: string | undefined
    color_sustainable: boolean
}

// Type pour les attributs de foreign object
export type ForeignObjectAttributeTypes = {
    has_fo: boolean
    is_fo_raw: boolean
    fo_content: string | undefined
}

// Type pour les attributs d'image
export type ImageAttributeTypes = {
    is_image: boolean
    image_src: string | undefined
}

const NODE_SHAPE_SPECIFIC_CONFIG = {
  // =================== MARGINS ===================
  margin_left: {
    default: 50,
    type: (() => 50) as (() => number),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'Left margin',
      fr: 'Marge gauche'
    },
    tooltips: {
      en: 'Left margin from attached nodes',
      fr: 'Marge gauche depuis les nœuds attachés'
    }
  } satisfies AttributeConfig<number>,

  margin_right: {
    default: 50,
    type: (() => 50) as (() => number),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'Right margin',
      fr: 'Marge droite'
    },
    tooltips: {
      en: 'Right margin from attached nodes',
      fr: 'Marge droite depuis les nœuds attachés'
    }
  } satisfies AttributeConfig<number>,

  margin_top: {
    default: 50,
    type: (() => 50) as (() => number),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'Top margin',
      fr: 'Marge haute'
    },
    tooltips: {
      en: 'Top margin from attached nodes',
      fr: 'Marge haute depuis les nœuds attachés'
    }
  } satisfies AttributeConfig<number>,

  margin_bottom: {
    default: 50,
    type: (() => 50) as (() => number),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'Bottom margin',
      fr: 'Marge basse'
    },
    tooltips: {
      en: 'Bottom margin from attached nodes',
      fr: 'Marge basse depuis les nœuds attachés'
    }
  } satisfies AttributeConfig<number>,
  position_type: {
    default: default_position_type,
    type: (() => default_position_type) as (() => Type_Position),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'x',
      fr: 'x'
    },
    tooltips: {
      en: 'x',
      fr: 'x'
    }
  } satisfies AttributeConfig<Type_Position>,
  position_dx: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'x',
      fr: 'x'
    },
    tooltips: {
      en: 'x',
      fr: 'x'
    }
  } satisfies AttributeConfig<number>,
  position_dy: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'margins' as const,
    actions: ['drawShape'] as BaseActionType[],
    
    labels: {
      en: 'x',
      fr: 'x'
    },
    tooltips: {
      en: 'x',
      fr: 'x'
    }
  } satisfies AttributeConfig<number>

} as const

export type NodeShapeSpecificAttributeTypes = {
    [K in keyof typeof NODE_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof NODE_SHAPE_SPECIFIC_CONFIG[K]['type']>
}

export const NODES_ATTRIBUTES_CONFIG = {
    // =================== SHAPE (avec prefix "shape_") ===================
    ...createConfigWithPrefix(BASE_SHAPE_CONFIG, 'shape'),
    ...NODE_SHAPE_SPECIFIC_CONFIG,
    // =================== NAME LABEL (avec prefix "name_label_") ===================
    ...createConfigWithPrefix(NAME_LABEL_CONFIG, 'name_label'),

    // =================== VALUE LABEL (avec prefix "value_label_") ===================
    ...createConfigWithPrefix(VALUE_LABEL_CONFIG, 'value_label'),

    ...ICON_CONFIG,
    ...RICH_TEXT_CONFIG,
    ...IMAGE_CONFIG,
    ...HYPER_LINK_CONFIG,
    // =================== AUTRES ATTRIBUTS ===================
    orphan_node_visible: {
        default: true as boolean,
        type: (() => true) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Orphans visible',
            fr: 'Orphelins visibles'
        },
        tooltips: {
            en: 'Visibility of orphan nodes',
            fr: 'Visibilité des noeuds orphelins'
        }
    } satisfies AttributeConfig<boolean>,

} as const

export abstract class AttributeMappings {
  abstract getToJsonMapping(): { [key: string]: string }
  abstract getFromJsonMapping(): { [key: string]: NodeAttributeKey | LinkAttributeKey }
}
export class NodeAttributeMappings extends AttributeMappings {
  // Mapping principal: attribut interne -> clé JSON
  private readonly MAIN_MAPPING: { [key: string]: string } = {
    // Shape mappings
    shape_type: 'shape',
    shape_min_width: 'node_width',
    shape_min_height: 'node_height',
    shape_color: 'color',
    shape_opacity: 'opacity',
    shape_color_sustainable: 'colorSustainable',
    // Icon attributes
    'iconName': 'icon_name',
    'iconColor': 'icon_color',
    'iconVisible': 'icon_visible',
    'iconViewBox': 'icon_view_box',
    'iconColorSustainable': 'icon_color_sustainable',
    
    // Foreign Object attributes
    'has_FO': 'has_fo',
    'is_FO_raw': 'is_fo_raw',
    'FO_content': 'fo_content',
    
    // Image attributes
    'is_image': 'is_image',
    'image_src': 'image_src',
    
    // Hyperlink attribute
    'hyperlink': 'hyperlink'
  }

  // Mapping legacy: ancienne clé JSON -> attribut interne
  private readonly LEGACY_MAPPING: { [key: string]: string } = {
    // Name label legacy
    'label_visible': 'name_label_is_visible',
    'font_family': 'name_label_font_family',
    'font_size': 'name_label_font_size',
    'uppercase': 'name_label_uppercase',
    'bold': 'name_label_bold',
    'italic': 'name_label_italic',
    'label_color': 'name_label_color',
    'label_horiz': 'name_label_horiz',
    'label_vert': 'name_label_vert',
    'label_background': 'name_label_background',
    'label_background_color': 'name_label_background_color',
    'label_box_width': 'name_label_box_width',

    // Value label legacy
    'show_value': 'value_label_is_visible',
    'value_font_size': 'value_label_font_size',
    'label_horiz_valeur': 'value_label_horiz',
    'label_vert_valeur': 'value_label_vert',
    'to_precision': 'value_label_scientific_notation',
    'scientific_precision': 'value_label_significant_digits',
    'nb_scientific_precision': 'value_label_nb_significant_digits',
    'custom_digit': 'value_label_custom_digit',
    'nb_digit': 'value_label_nb_digit',
    'label_unit_visible': 'value_label_unit_visible',
    'label_unit': 'value_label_unit',
    'label_unit_factor': 'value_label_unit_factor',

    // Shape legacy (fusion avec MAIN_MAPPING)
    'shape': 'shape_type',
    'node_width': 'shape_min_width',
    'node_height': 'shape_min_height',
    'color': 'shape_color',
    'opacity': 'shape_opacity',
    'colorSustainable': 'shape_color_sustainable',
  }

  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  public getToJsonMapping(): { [key: string]: string } {
    return { ...this.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  public getFromJsonMapping() {
    return { ...this.LEGACY_MAPPING } as unknown as { [key: string]: NodeAttributeKey }
  }
}

export class LinkAttributeMappings extends AttributeMappings {
  private readonly LEGACY_MAPPING: { [key: string]: LinkAttributeKey } = {
      'user_scale': 'shape_local_link_scale',
      'curved': 'shape_is_curved',
      'curvature': 'shape_curvature',
      'recycling': 'shape_is_recycling',
      'is_structur': 'shape_is_structure',
      'orientation': 'shape_orientation',
      'left_horiz_shift': 'shape_starting_curve',
      'right_horiz_shift': 'shape_ending_curve',
      'starting_tangeant': 'shape_starting_tangeant',
      'ending_tangeant': 'shape_ending_tangeant',
      'vert_shift': 'shape_middle_recycling',
      'arrow': 'shape_is_arrow',
      'arrow_size': 'shape_arrow_size',
      'dashed': 'shape_is_dashed',
      'color': 'shape_color',
      'color_rule': 'shape_color_rule',
      'opacity': 'shape_opacity',
    }

private readonly MAIN_MAPPING: { [key: string]: string } = {
      shape_local_link_scale: 'user_scale',
      shape_is_curved: 'curved',
      shape_type: 'shape_type',
      shape_curvature: 'curvature',
      shape_is_recycling: 'recycling',
      shape_is_structure: 'is_structur',
      shape_orientation: 'orientation',
      shape_starting_curve: 'left_horiz_shift',
      shape_ending_curve: 'right_horiz_shift',
      shape_starting_tangeant: 'starting_tangeant',
      shape_ending_tangeant: 'ending_tangeant',
      shape_middle_recycling: 'vert_shift',
      shape_is_arrow: 'arrow',
      shape_arrow_size: 'arrow_size',
      shape_is_dashed: 'dashed',
      shape_color: 'color',
      shape_color_rule: 'color_rule',
      shape_opacity: 'opacity',
    }
  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  public getToJsonMapping(): { [key: string]: string } {
    return { ...this.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  public  getFromJsonMapping() {
    return { ...this.LEGACY_MAPPING } as unknown as { [key: string]: NodeAttributeKey }
  }


  protected fromLegacyJSON(json_local_object: Type_JSON) {
    if (json_local_object['version'] === undefined) {
      // Mapping legacy simplifié
      const legacyMapping: { [key: string]: string } = {
        'label_visible': 'value_label_is_visible',
        'font_family': 'value_label_font_family',
        'label_font_size': 'value_label_font_size',
        'text_color': 'value_label_color',
        'label_position': 'value_label_horiz',
        'orthogonal_label_position': 'value_label_vert',
        'label_on_path': 'value_label_on_path',
        'label_pos_auto': 'value_label_pos_auto',
        'to_precision': 'value_label_scientific_notation',
        'scientific_precision': 'value_label_significant_digits',
        'nb_scientific_precision': 'value_label_nb_significant_digits',
        'custom_digit': 'value_label_custom_digit',
        'nb_digit': 'value_label_nb_digit',
        'label_unit_visible': 'value_label_unit_visible',
        'label_unit': 'value_label_unit',
        'label_unit_factor': 'value_label_unit_factor',
        'font_size': 'name_label_font_size',
        'uppercase': 'name_label_uppercase',
        'bold': 'name_label_bold',
        'italic': 'name_label_italic',
        'label_color': 'name_label_color',
        'label_horiz': 'name_label_horiz',
        'label_vert': 'name_label_vert'
      }
      const was_gradient = getBooleanFromJSON(json_local_object, 'gradient', false) as boolean
      if (was_gradient) {
        json_local_object['shape_color_rule'] = 'gradient'
      }
      Object.entries(legacyMapping).forEach(([oldKey, newKey]) => {
        if (json_local_object[oldKey] !== undefined) {
          //@ts-expect-error xxx
          this[newKey as AttributeKey] = json_local_object[oldKey]
        }
      })
    }
  }
}

//Export des types (inchangé)
export type NodeAttributeKey = keyof typeof NODES_ATTRIBUTES_CONFIG
export type NodeAttributeTypes = {
    [K in NodeAttributeKey]: ReturnType<typeof NODES_ATTRIBUTES_CONFIG[K]['type']>
}

export function getDefaultValue<K extends NodeAttributeKey>(key: K): NodeAttributeTypes[K] {
    return NODES_ATTRIBUTES_CONFIG[key].default as NodeAttributeTypes[K]
}

export function getLabel(key: NodeAttributeKey, lang: 'en' | 'fr'): string {
    return NODES_ATTRIBUTES_CONFIG[key].labels[lang]
}

export function getTooltip(key: NodeAttributeKey, lang: 'en' | 'fr'): string {
    return NODES_ATTRIBUTES_CONFIG[key].tooltips[lang]
}

// export function getAttributesByCategory(category: string): NodeAttributeKey[] {
//     return Object.keys(NODES_ATTRIBUTES_CONFIG).filter(
//         key => NODES_ATTRIBUTES_CONFIG[key as NodeAttributeKey].category === category
//     ) as NodeAttributeKey[]
// }

// ==================================================================================================
// LINKS_ATTRIBUTES_CONFIG - Configuration complète des attributs des liens
// ==================================================================================================


const LINK_SHAPE_SPECIFIC_CONFIG = {

    // Attributs spécifiques aux liens (pas dans BASE_SHAPE_CONFIG)
    local_link_scale: {
        default: undefined as number | undefined,
        type: (() => undefined) as (() => number | undefined),
        callback: 'updateLinkAndSourceTarget',
        category: 'shape' as const,
        actions: ['drawWithNodes'] as LinkBaseActionType[],
        labels: {
            en: 'Scale Multiplier',
            fr: 'Multiplicateur Échelle'
        },
        tooltips: {
            en: 'Define a local scaling factor that will be multiplied by the multiplier specified for this flow.',
            fr: 'Définissez un facteur d\'échelle local qui sera multiplié par le multiplicateur spécifié pour ce flux.'
        }
    } satisfies AttributeConfig<number | undefined>,

    is_curved: {
        default: true,
        type: (() => true) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
        labels: {
            en: 'Curved',
            fr: 'Courbe'
        },
        tooltips: {
            en: 'Represents the selected link(s) as Bezier curve(s)',
            fr: 'Représente le/les flux sélectionné(s) sous forme de courbe(s) de Bezier'
        }
    } satisfies AttributeConfig<boolean>,

    curvature: {
        default: 0.5,
        type: (() => 0.5) as (() => number),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Curvature',
            fr: 'Courbure'
        },
        tooltips: {
            en: 'Adjust the curvature of the link',
            fr: 'Ajuster la courbure du flux'
        }
    } satisfies AttributeConfig<number>,

    is_recycling: {
        default: false,
        type: (() => false) as (() => boolean),
        category: 'shape' as const,
        setter: 'customShapeIsRecycling',
        actions: ['drawWithNodes', 'drawControlPoint'] as LinkBaseActionType[],
        labels: {
            en: 'Recycling',
            fr: 'Recyclage'
        },
        tooltips: {
            en: 'Represents the selected link(s) as recycling with a backward turn',
            fr: 'Représente le/les flux sélectionné(s) sous forme de recyclage avec un retour vers l\'arrière'
        }
    } satisfies AttributeConfig<boolean>,

    is_structure: {
        default: false,
        type: (() => false) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawWithNodes', 'drawControlPoint'] as LinkBaseActionType[],
        labels: {
            en: 'Structure',
            fr: 'Structure'
        },
        tooltips: {
            en: 'Represents the selected link(s) as if they didn\'t have values',
            fr: 'Représente le/les flux sélectionné(s) comme si ils n\'avaient pas de valeur'
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
            fr: 'Orientation'
        },
        tooltips: {
            en: 'Choose the orientation of the link start and end points',
            fr: 'Choisir l\'orientation des points de départ et d\'arrivée du flux'
        }
    } satisfies AttributeConfig<Type_Orientation>,

    starting_curve: {
        default: 0.05,
        type: (() => 0.05) as (() => number),
        setter: 'customStartingCurve',
        category: 'shape' as const,
        actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
        labels: {
            en: 'Starting curve position',
            fr: 'Position départ courbure'
        },
        tooltips: {
            en: 'Position of the starting point of curvature as ratio of link length',
            fr: 'Permet d\'affiner la position du départ des courbures du/des flux sélectionné(s). Cette valeur est un ratio (%) relatif à la longueur du flux à partir du point de départ.',
        }
    } satisfies AttributeConfig<number>,

    ending_curve: {
        default: 0.05,
        type: (() => 0.05) as (() => number),
        setter: 'customEndingCurve',
        category: 'shape' as const,
        actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
        labels: {
            en: 'Ending curve position',
            fr: 'Position fin courbure'
        },
        tooltips: {
            en: 'Position of the ending point of curvature as ratio of link length',
            fr: 'Permet d\'affiner la position de fin des courbures du/des flux sélectionné(s). Cette valeur est un ratio (%) relatif à la longueur du flux à partir du point de départ.',
        }
    } satisfies AttributeConfig<number>,

    starting_tangeant: {
        default: 0.25,
        type: (() => 0.25) as (() => number),
        setter: 'customStartingTangeant',
        category: 'shape' as const,
        actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
        labels: {
            en: 'Starting tangeant',
            fr: 'Courbure de départ'
        },
        tooltips: {
            en: 'Setting the radius of the starting curvature for Bezier curves',
            fr: 'Paramétrage de la courbure de départ dans le cas ou le/les flux sélectionné(s) sont sous forme de courbe(s) de Bezier',
        }
    } satisfies AttributeConfig<number>,

    ending_tangeant: {
        default: 0.25,
        type: (() => 0.25) as (() => number),
        setter: 'customEndingTangeant',
        category: 'shape' as const,
        actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
        labels: {
            en: 'Ending tangeant',
            fr: 'Courbure de fin'
        },
        tooltips: {
            en: 'Setting the radius of the ending curvature for Bezier curves',
            fr: 'Paramétrage de la courbure de fin dans le cas ou le/les flux sélectionné(s) sont sous forme de courbe(s) de Bezier',
        }
    } satisfies AttributeConfig<number>,

    middle_recycling: {
        default: 100,
        type: (() => 100) as (() => number),
        category: 'shape' as const,
        actions: ['drawElements', 'drawControlPoint'] as BaseActionType[],
        labels: {
            en: 'Recycling position',
            fr: 'Position point de recyclage'
        },
        tooltips: {
            en: 'Position of the recycling point',
            fr: 'Position du point de recyclage'
        }
    } satisfies AttributeConfig<number>,

    is_arrow: {
        default: true,
        type: (() => true) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Arrow',
            fr: 'Flèche'
        },
        tooltips: {
            en: 'Represents the selected link(s) with an arrow tip at the end',
            fr: 'Représente le/les flux sélectionné(s) avec une pointe de flèche à la fin'
        }
    } satisfies AttributeConfig<boolean>,

    arrow_size: {
        default: 10,
        type: (() => 10) as (() => number),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Size',
            fr: 'Taille'
        },
        tooltips: {
            en: 'Change the size of the arrow (from the end of the link to the node)',
            fr: 'Modifie la taille de la flèche (largeur entre la fin du flux et le noeud)'
        }
    } satisfies AttributeConfig<number>,

    is_dashed: {
        default: false,
        type: (() => false) as (() => boolean),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Dashed',
            fr: 'Hachuré'
        },
        tooltips: {
            en: 'Applies a hatch effect on the selected link(s)',
            fr: 'Applique un effet de hachure sur le/les flux sélectionné(s)'
        }
    } satisfies AttributeConfig<boolean>,

    color_rule: {
        default: default_element_color_source,
        type: (() => default_element_color_source) as (() => 'flow' | 'source' | 'target' | 'gradient' | 'auto'),
        category: 'shape' as const,
        actions: ['drawElements'] as BaseActionType[],
        labels: {
            en: 'Color rule',
            fr: 'Règle couleur'
        },
        tooltips: {
            en: 'Choose what rule defines flow color',
            fr: 'Choisir la règle qui définie la couleur du flux'
        }
    } satisfies AttributeConfig<'flow' | 'source' | 'target' | 'gradient' | 'auto'>,
} as const

function createLinkLabelSpecificConfig(prefix: string, category: string, drawAction: BaseActionType) {
    return {
        on_path: {
            default: true,
            type: (() => true) as (() => boolean),
            setter: prefix === 'value_label' ? 'customValueLabelOnPath' : 'customNameLabelOnPath',
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Follow path',
                fr: 'Orienter suivant l\'axe du flux'
            },
            tooltips: {
                en: 'Orient the label following the shape of the link',
                fr: 'Orienter le texte en suivant la forme du flux'
            }
        } satisfies AttributeConfig<boolean>,

        pos_auto: {
            default: true,
            type: (() => true) as (() => boolean),
            setter: prefix === 'value_label' ? 'customValueLabelPosAuto' : 'customNameLabelPosAuto',
            category: category,
            actions: [drawAction] as BaseActionType[],
            labels: {
                en: 'Auto position',
                fr: 'Position verticale ajustée'
            },
            tooltips: {
                en: 'Automatically adjust the vertical position',
                fr: 'Ajuster automatiquement la position verticale'
            }
        } satisfies AttributeConfig<boolean>,
    } as const
}
export type LinkLabelSpecificConfigReturn = ReturnType<typeof createLinkLabelSpecificConfig>
export type LinkLabelSpecificAttributeTypes = {
    [K in keyof LinkLabelSpecificConfigReturn]: ReturnType<LinkLabelSpecificConfigReturn[K]['type']>
}

export const LINKS_ATTRIBUTES_CONFIG = {
    // ✅ RÉUTILISATION de BASE_SHAPE_CONFIG (color, opacity, type)
    ...createConfigWithPrefixAndOverrides(
        BASE_SHAPE_CONFIG,
        'shape' as const,
        'shape',
        ['drawElements'] as BaseActionType[],
        {
            // Overrides pour les liens
            type: {
                default: 'bezier_path',
                labels: {
                    en: 'Type',
                    fr: 'Type'
                },
                tooltips: {
                    en: 'Choose the shape type for the link',
                    fr: 'Choisir le type de forme pour le flux'
                }
            }
        }
    ),

    // ✅ ATTRIBUTS SPÉCIFIQUES AUX LIENS
    ...createConfigWithPrefix(LINK_SHAPE_SPECIFIC_CONFIG, 'shape' as const),

    // =================== NAME LABEL (avec prefix "name_label_") ===================
    ...createConfigWithPrefix(NAME_LABEL_CONFIG, 'name_label'),
    ...createConfigWithPrefix(createLinkLabelSpecificConfig('name_label', 'name_label', 'drawNameLabel'), 'name_label'),

    // =================== VALUE LABEL (avec prefix "value_label_") ===================
    ...createConfigWithPrefix(VALUE_LABEL_CONFIG, 'value_label'),
    ...createConfigWithPrefix(createLinkLabelSpecificConfig('value_label', 'value_label', 'drawValueLabel'), 'value_label'),

    ...ICON_CONFIG,
    ...RICH_TEXT_CONFIG,
    ...IMAGE_CONFIG,
    ...HYPER_LINK_CONFIG,
} as const

export type LinkAttributeKey = keyof typeof LINKS_ATTRIBUTES_CONFIG

export type LinkShapeAttributeTypes = {
    [K in keyof typeof LINK_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof LINK_SHAPE_SPECIFIC_CONFIG[K]['type']>
}
export type LinkAttributeTypes = {
    [K in LinkAttributeKey]: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG[K]['type']>
}
