// ==================================================================================================
// CONFIGURATION UNIFIÉE - ATTRIBUTS CONTAINERS + TRADUCTIONS + ACTIONS
// Source unique de vérité pour types, valeurs par défaut, setters, labels, tooltips ET actions
// ==================================================================================================

import { Class_ContainerElement } from './TextZone'

// Types spécifiques
export type Type_VerticalAlignment = 'left' | 'right'
export type Type_ExtremityPosition = 'top' | 'bottom' | 'left' | 'right'

// Types d'actions disponibles
export type ActionType = 
  | 'draw'                   // Redessiner le container
  | 'drawContent'            // Redessiner uniquement le contenu
  | 'drawBorder'             // Redessiner uniquement la bordure
  | 'drawDragHandlers'       // Redessiner les poignées de redimensionnement
  | 'updateSizeAndPosition'  // Recalculer taille et position depuis les nœuds attachés

// Interface pour la configuration d'un attribut
interface AttributeConfig<T> {
  default: T
  type: () => T
  category: string
  labels: { en: string; fr: string }
  tooltips: { en: string; fr: string }
  callback?: string
  setter?: string
  actions?: ActionType[]
}

// Configuration unifiée avec TOUT au même endroit
export const CONTAINERS_ATTRIBUTES_CONFIG = {
  // =================== TEXT ORIENTATION ===================
  vertical_text: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'orientation' as const,
    actions: ['drawContent'] as ActionType[],
    
    labels: {
      en: 'Vertical text',
      fr: 'Texte vertical'
    },
    tooltips: {
      en: 'Orient text vertically',
      fr: 'Orienter le texte verticalement'
    }
  } satisfies AttributeConfig<boolean>,

  vertical_alignment: {
    default: 'left' as Type_VerticalAlignment,
    type: (() => 'left') as (() => Type_VerticalAlignment),
    category: 'orientation' as const,
    actions: ['drawContent'] as ActionType[],
    
    labels: {
      en: 'Vertical alignment',
      fr: 'Alignement vertical'
    },
    tooltips: {
      en: 'Alignment when text is vertical (left or right)',
      fr: 'Alignement quand le texte est vertical (gauche ou droite)'
    }
  } satisfies AttributeConfig<Type_VerticalAlignment>,

  // =================== DIMENSIONS ===================
  label_width: {
    default: 100,
    type: (() => 100) as (() => number),
    category: 'dimensions' as const,
    actions: ['draw', 'drawDragHandlers'] as ActionType[],
    
    labels: {
      en: 'Width',
      fr: 'Largeur'
    },
    tooltips: {
      en: 'Width of the text zone in pixels',
      fr: 'Largeur de la zone de texte en pixels'
    }
  } satisfies AttributeConfig<number>,

  label_height: {
    default: 25,
    type: (() => 25) as (() => number),
    category: 'dimensions' as const,
    actions: ['draw', 'drawDragHandlers'] as ActionType[],
    
    labels: {
      en: 'Height',
      fr: 'Hauteur'
    },
    tooltips: {
      en: 'Height of the text zone in pixels',
      fr: 'Hauteur de la zone de texte en pixels'
    }
  } satisfies AttributeConfig<number>,

  // =================== COLORS & STYLE ===================
  color: {
    default: 'white',
    type: (() => 'white') as (() => string),
    category: 'style' as const,
    actions: ['draw'] as ActionType[],
    
    labels: {
      en: 'Background color',
      fr: 'Couleur de fond'
    },
    tooltips: {
      en: 'Background color of the text zone',
      fr: 'Couleur de fond de la zone de texte'
    }
  } satisfies AttributeConfig<string>,

  color_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'style' as const,
    actions: ['draw'] as ActionType[],
    
    labels: {
      en: 'Background visible',
      fr: 'Fond visible'
    },
    tooltips: {
      en: 'Show or hide the background color',
      fr: 'Afficher ou masquer la couleur de fond'
    }
  } satisfies AttributeConfig<boolean>,

  color_border: {
    default: 'black',
    type: (() => 'black') as (() => string),
    category: 'style' as const,
    actions: ['drawBorder'] as ActionType[],
    
    labels: {
      en: 'Border color',
      fr: 'Couleur de bordure'
    },
    tooltips: {
      en: 'Color of the border',
      fr: 'Couleur de la bordure'
    }
  } satisfies AttributeConfig<string>,

  transparent_border: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'style' as const,
    actions: ['drawBorder'] as ActionType[],
    
    labels: {
      en: 'Transparent border',
      fr: 'Bordure transparente'
    },
    tooltips: {
      en: 'Make the border transparent',
      fr: 'Rendre la bordure transparente'
    }
  } satisfies AttributeConfig<boolean>,

  thickness: {
    default: 1,
    type: (() => 1) as (() => number),
    category: 'style' as const,
    actions: ['drawBorder'] as ActionType[],
    
    labels: {
      en: 'Border thickness',
      fr: 'Épaisseur de bordure'
    },
    tooltips: {
      en: 'Thickness of the border in pixels',
      fr: 'Épaisseur de la bordure en pixels'
    }
  } satisfies AttributeConfig<number>,

  dashed: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'style' as const,
    actions: ['drawBorder'] as ActionType[],
    
    labels: {
      en: 'Dashed border',
      fr: 'Bordure en pointillés'
    },
    tooltips: {
      en: 'Use a dashed border style',
      fr: 'Utiliser un style de bordure en pointillés'
    }
  } satisfies AttributeConfig<boolean>,

  opacity: {
    default: 100,
    type: (() => 100) as (() => number),
    category: 'style' as const,
    actions: ['draw'] as ActionType[],
    
    labels: {
      en: 'Opacity',
      fr: 'Opacité'
    },
    tooltips: {
      en: 'Opacity of the container (0-100)',
      fr: 'Opacité du conteneur (0-100)'
    }
  } satisfies AttributeConfig<number>,

  // =================== MARGINS ===================
  margin_left: {
    default: 50,
    type: (() => 50) as (() => number),
    category: 'margins' as const,
    actions: ['updateSizeAndPosition'] as ActionType[],
    
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
    actions: ['updateSizeAndPosition'] as ActionType[],
    
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
    actions: ['updateSizeAndPosition'] as ActionType[],
    
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
    actions: ['updateSizeAndPosition'] as ActionType[],
    
    labels: {
      en: 'Bottom margin',
      fr: 'Marge basse'
    },
    tooltips: {
      en: 'Bottom margin from attached nodes',
      fr: 'Marge basse depuis les nœuds attachés'
    }
  } satisfies AttributeConfig<number>,

} as const

// Export du type pour les attributs
export type AttributeKey = keyof typeof CONTAINERS_ATTRIBUTES_CONFIG

// Génération automatique des types à partir de la config
export type ContainerAttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof CONTAINERS_ATTRIBUTES_CONFIG[K]['type']>
}

// Classe de base TypeScript pour éviter les erreurs de typage
export class ContainerAttributeTypeScript {
  vertical_text!: boolean
  vertical_alignment!: Type_VerticalAlignment
  label_width!: number
  label_height!: number
  color!: string
  color_visible!: boolean
  color_border!: string
  transparent_border!: boolean
  thickness!: number
  dashed!: boolean
  opacity!: number
  margin_left!: number
  margin_right!: number
  margin_top!: number
  margin_bottom!: number
}

// ==================================================================================================
// GÉNÉRATEUR DE SETTERS AUTOMATIQUE
// ==================================================================================================

/**
 * Génère automatiquement les setters/getters pour une instance avec les actions configurées
 * Cette classe permet d'utiliser les actions définies dans CONTAINERS_ATTRIBUTES_CONFIG
 */
export class ContainerSetterGenerator {
  /**
   * Génère automatiquement les setters pour une classe ContainerElement
   * Override les propriétés héritées de ContainerAttributeTypeScript
   * 
   * @param instance - Instance qui recevra les setters/getters
   * @param attributes - Objet contenant les valeurs des attributs
   * @param getMethod - Méthode pour récupérer un attribut (ex: instance._attributes)
   */
  static generateSetters(instance: Class_ContainerElement) {
    (Object.keys(CONTAINERS_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      const config = CONTAINERS_ATTRIBUTES_CONFIG[key]
      
      Object.defineProperty(instance, key, {
        get: () => instance.getContainerProperty(key),
        set: (value: ContainerAttributeTypes[typeof key]) => {
          // 1. Setter personnalisé si défini
          //@ts-expect-error xxx
          if (config.setter && typeof instance[config.setter] === 'function') {
            //@ts-expect-error xxx
            instance[config.setter](value)
          } else {
            // 2. Setter standard
            //@ts-expect-error xxx
            instance.attributes[key] = value
          }

          // 3. Callback spécifique si défini
          //@ts-expect-error xxx
          if (config.callback && typeof instance[config.callback] === 'function') {
            //@ts-expect-error xxx
            instance[config.callback]()
            return
          }

          // 4. Actions automatiques basées sur la configuration
          if (config.actions) {
            config.actions.forEach(action => {
              if (typeof instance[action] === 'function') {
                instance[action]()
              }
            })
          } 
        },
        enumerable: true,
        configurable: true  // 🆕 Important pour pouvoir override !
      })
    })
  }
}