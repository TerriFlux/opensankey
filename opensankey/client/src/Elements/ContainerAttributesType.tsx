// ==================================================================================================
// ContainerAttributes.d.ts - Type definitions for Container Attributes
// ==================================================================================================
// Auto-generated type definitions based on CONTAINERS_ATTRIBUTES_CONFIG and translation files
// ==================================================================================================

import { Class_ContainerElement } from './TextZone'

// TYPES IMPORTS ===============================================================================

export type Type_VerticalAlignment = 'left' | 'right'
export type Type_ExtremityPosition = 'top' | 'bottom' | 'left' | 'right'

// ATTRIBUTE CONFIGURATION INTERFACE ===========================================================

interface AttributeConfig<T> {
  default: T
  type: () => T
  callback?: string
  setter?: string
}

// CONTENT ATTRIBUTES ==========================================================================

export interface IContentAttributes {
  /**
   * Titre interne
   * @default 'Text Zone'
   * @description Nom interne de la zone de texte
   */
  title: string

  /**
   * Contenu HTML
   * @default 'Text Label ...'
   * @description Contenu HTML de la zone de texte
   */
  content: string

  /**
   * Mode image
   * @default false
   * @description Afficher comme image au lieu de texte
   */
  is_image: boolean

  /**
   * Source de l'image
   * @default ''
   * @description Image encodée en base64 ou URL
   */
  image_src: string
}

// ORIENTATION ATTRIBUTES ======================================================================

export interface IOrientationAttributes {
  /**
   * Texte vertical
   * @default false
   * @description Orienter le texte verticalement
   */
  vertical_text: boolean

  /**
   * Alignement vertical
   * @default 'left'
   * @options 'left' | 'right'
   * @description Alignement quand le texte est vertical
   */
  vertical_alignment: Type_VerticalAlignment
}

// DIMENSIONS ATTRIBUTES =======================================================================

export interface IDimensionsAttributes {
  /**
   * Largeur
   * @default 100
   * @description Largeur de la zone de texte en pixels
   */
  label_width: number

  /**
   * Hauteur
   * @default 25
   * @description Hauteur de la zone de texte en pixels
   */
  label_height: number
}

// STYLE ATTRIBUTES ============================================================================

export interface IStyleAttributes {
  /**
   * Couleur de fond
   * @default 'white'
   * @description Couleur de fond de la zone de texte
   */
  color: string

  /**
   * Fond visible
   * @default true
   * @description Afficher ou masquer la couleur de fond
   */
  color_visible: boolean

  /**
   * Couleur de bordure
   * @default 'black'
   * @description Couleur de la bordure
   */
  color_border: string

  /**
   * Bordure transparente
   * @default false
   * @description Rendre la bordure transparente
   */
  transparent_border: boolean

  /**
   * Épaisseur de bordure
   * @default 1
   * @description Épaisseur de la bordure en pixels
   */
  thickness: number

  /**
   * Bordure en pointillés
   * @default false
   * @description Utiliser un style de bordure en pointillés
   */
  dashed: boolean

  /**
   * Opacité
   * @default 100
   * @range [0, 100]
   * @description Opacité du conteneur
   */
  opacity: number
}

// ATTACHMENT ATTRIBUTES =======================================================================

export interface IAttachmentAttributes {
  /**
   * Lié aux nœuds
   * @default false
   * @description Ajuster automatiquement la taille et position selon les nœuds attachés
   */
  tied_to_nodes: boolean

  /**
   * À l'extrémité
   * @default false
   * @description Positionner à l'extrémité des nœuds attachés au lieu de les entourer
   */
  at_extremity_of_attached_nodes: boolean

  /**
   * Position d'extrémité
   * @default 'top'
   * @options 'top' | 'bottom' | 'left' | 'right'
   * @description De quel côté positionner le conteneur
   */
  extremity_position: Type_ExtremityPosition
}

// MARGINS ATTRIBUTES ==========================================================================

export interface IMarginsAttributes {
  /**
   * Marge gauche
   * @default 50
   * @description Marge gauche depuis les nœuds attachés
   */
  margin_left: number

  /**
   * Marge droite
   * @default 50
   * @description Marge droite depuis les nœuds attachés
   */
  margin_right: number

  /**
   * Marge haute
   * @default 50
   * @description Marge haute depuis les nœuds attachés
   */
  margin_top: number

  /**
   * Marge basse
   * @default 50
   * @description Marge basse depuis les nœuds attachés
   */
  margin_bottom: number
}

// MAIN INTERFACES =============================================================================

/**
 * Interface complète pour tous les attributs de containers
 * Combine tous les groupes d'attributs
 */
export interface IContainerAttributes extends 
  IContentAttributes,
  IOrientationAttributes,
  IDimensionsAttributes,
  IStyleAttributes,
  IAttachmentAttributes,
  IMarginsAttributes {}

/**
 * Type pour les clés d'attributs personnalisables
 */
export type Type_customisable_container_attr = keyof IContainerAttributes

/**
 * Interface pour la configuration des attributs
 */
export type IContainerAttributesConfig = {
  [K in keyof IContainerAttributes]: AttributeConfig<IContainerAttributes[K]>
}

// CLASS TYPE DEFINITIONS ======================================================================

/**
 * Interface pour la classe de base des attributs de containers
 */
export interface IContainerAttributeClass {
  // Getters/Setters pour le contenu
  title: string
  content: string
  is_image: boolean
  image_src: string

  // Getters/Setters pour l'orientation
  vertical_text: boolean
  vertical_alignment: Type_VerticalAlignment

  // Getters/Setters pour les dimensions
  label_width: number
  label_height: number

  // Getters/Setters pour le style
  color: string
  color_visible: boolean
  color_border: string
  transparent_border: boolean
  thickness: number
  dashed: boolean
  opacity: number

  // Getters/Setters pour l'attachement
  tied_to_nodes: boolean
  at_extremity_of_attached_nodes: boolean
  extremity_position: Type_ExtremityPosition

  // Getters/Setters pour les marges
  margin_left: number
  margin_right: number
  margin_top: number
  margin_bottom: number

  // Méthodes utilitaires
  delete_attribute(key: keyof IContainerAttributes): void
  toJSON(): Record<string, string | number | boolean | undefined>
  fromJSON(json: Record<string, string | number | boolean | undefined>): void
  copyFrom(element: IContainerAttributeClass): void
}

/**
 * Interface pour la classe de style de containers
 */
export interface IContainerStyleClass extends IContainerAttributeClass {
  readonly id: string
  name: string
  readonly customisable_attribute: { [K in keyof IContainerAttributes]: boolean }
  
  delete(): void
  addReference(ref: Class_ContainerElement): void
  removeReference(ref: Class_ContainerElement): void
}

// TRANSLATION MAPPINGS ========================================================================

/**
 * Correspondances pour la traduction des attributs
 */
export interface IAttributeTranslations {
  // Attributs de contenu
  title: {
    fr: 'Titre'
    en: 'Title'
    tooltip_fr: 'Nom interne de la zone de texte'
    tooltip_en: 'Internal name of the text zone'
  }
  
  content: {
    fr: 'Contenu'
    en: 'Content'
    tooltip_fr: 'Contenu HTML de la zone de texte'
    tooltip_en: 'HTML content of the text zone'
  }
  
  vertical_text: {
    fr: 'Texte vertical'
    en: 'Vertical text'
    tooltip_fr: 'Orienter le texte verticalement'
    tooltip_en: 'Orient text vertically'
  }
  
  color: {
    fr: 'Couleur de fond'
    en: 'Background color'
    tooltip_fr: 'Couleur de fond de la zone de texte'
    tooltip_en: 'Background color of the text zone'
  }
  
  tied_to_nodes: {
    fr: 'Lié aux nœuds'
    en: 'Tied to nodes'
    tooltip_fr: 'Ajuster automatiquement la taille et position'
    tooltip_en: 'Automatically adjust size and position'
  }
}

declare const CONTAINERS_ATTRIBUTES_CONFIG: IContainerAttributesConfig

export { CONTAINERS_ATTRIBUTES_CONFIG }
