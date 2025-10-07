// ==================================================================================================
// LinkAttributes.d.ts - Type definitions for Link Attributes
// ==================================================================================================
// Auto-generated type definitions based on LINKS_ATTRIBUTES_CONFIG and translation files
// ==================================================================================================

import { Class_LinkElement } from './Link'
import { Class_LinkValue } from './LinkValues'
import { Class_NodeElement } from './Node'

// TYPES IMPORTS ===============================================================================

export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
export type Type_PathLabelHPosition = 'dragged' | 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'dragged' | 'top' | 'middle' | 'bottom'

// ATTRIBUTE CONFIGURATION INTERFACE ===========================================================

interface AttributeConfig<T> {
  default: T
  type: () => T
  callback?: string
  setter?: string
}

// SHAPE ATTRIBUTES ============================================================================

export interface IShapeAttributes {
  /**
   * Scale locale du lien (surcharge l'échelle globale)
   * @default undefined
   * @description Définit une échelle locale pour l'épaisseur du flux, peut casser la cohérence proportionnelle
   */
  shape_local_link_scale: number | undefined

  /**
   * Indique si le lien est courbé
   * @default true
   * @description Représente le flux sous forme de courbe de Bézier
   */
  shape_is_curved: boolean

  /**
   * Type de forme du lien
   * @default 'bezier_path'
   * @options 'bezier_path' | 'bezier_outline' | 'arc_path' | 'arc_outline'
   * @description Type de rendu du lien (chemin ou contour, Bézier ou circulaire)
   */
  shape_shape: string

  /**
   * Courbure du lien
   * @default 0.5
   * @range [0, 1]
   * @description Intensité de la courbure pour les liens courbes
   */
  shape_curvature: number

  /**
   * Indique si le lien est en mode recyclage
   * @default false
   * @description Représente le flux avec un retour vers l'arrière
   */
  shape_is_recycling: boolean

  /**
   * Indique si le lien est structural
   * @default false
   * @description Représente le flux comme s'il n'avait pas de valeur
   */
  shape_is_structure: boolean
}

// ORIENTATION ATTRIBUTES ======================================================================

export interface IOrientationAttributes {
  /**
   * Orientation du lien
   * @default 'hh'
   * @description Orientation début/fin du lien (horizontal/vertical)
   */
  shape_orientation: Type_Orientation

  /**
   * Position de départ de la courbure
   * @default 0.05
   * @range [0, 1]
   * @description Ratio de la longueur du flux pour le point de départ des courbures
   */
  shape_starting_curve: number

  /**
   * Position de fin de la courbure
   * @default 0.05
   * @range [0, 1]
   * @description Ratio de la longueur du flux pour le point de fin des courbures
   */
  shape_ending_curve: number

  /**
   * Tangente de départ
   * @default 0.25
   * @description Paramétrage de la courbure de départ pour les courbes de Bézier
   */
  shape_starting_tangeant: number

  /**
   * Tangente de fin
   * @default 0.25
   * @description Paramétrage de la courbure de fin pour les courbes de Bézier
   */
  shape_ending_tangeant: number

  /**
   * Position du point de recyclage
   * @default 100
   * @description Position du point milieu pour les liens en recyclage
   */
  shape_middle_recycling: number
}

// ARROW ATTRIBUTES ============================================================================

export interface IArrowAttributes {
  /**
   * Indique si le lien a une flèche
   * @default true
   * @description Affiche une pointe de flèche à la fin du lien
   */
  shape_is_arrow: boolean

  /**
   * Taille de la flèche
   * @default 10
   * @description Largeur entre la fin du flux et le nœud (en pixels)
   */
  shape_arrow_size: number
}

// FILLING ATTRIBUTES ==========================================================================

export interface IFillingAttributes {
  /**
   * Indique si le lien est hachuré
   * @default false
   * @description Applique un effet de hachure au lien
   */
  shape_is_dashed: boolean

  /**
   * Couleur du lien
   * @default default_element_color
   * @description Couleur principale du lien
   */
  shape_color: string

  /**
   * Règle de couleur
   * @default default_element_color_source
   * @options 'flow' | 'source' | 'target'
   * @description Définit quelle règle détermine la couleur du flux
   */
  shape_color_rule: string

  /**
   * Opacité du lien
   * @default 0.85
   * @range [0, 1]
   * @description Niveau de transparence du lien
   */
  shape_opacity: number
}

// LABEL BASE ATTRIBUTES =======================================================================

interface IBaseLabelAttributes {
  /**
   * Police du label
   * @default default_font
   * @description Style de police utilisé pour le texte
   */
  font_family: string

  /**
   * Taille de police
   * @default 20
   * @description Taille de la police en pixels
   */
  font_size: number

  /**
   * Texte en majuscules
   * @default false
   * @description Convertit le texte en majuscules
   */
  uppercase: boolean

  /**
   * Texte en gras
   * @default false
   * @description Applique le style gras au texte
   */
  bold: boolean

  /**
   * Texte en italique
   * @default false
   * @description Applique le style italique au texte
   */
  italic: boolean

  /**
   * Couleur du texte
   * @default 'black'
   * @description Couleur du texte du label
   */
  color: string

  /**
   * Position horizontale
   * @default 'middle'
   * @description Position horizontale du label sur le lien
   */
  horiz: Type_PathLabelHPosition

  /**
   * Position verticale
   * @default 'middle' | 'top'
   * @description Position verticale du label par rapport au lien
   */
  vert: Type_PathLabelVPosition

  /**
   * Orientation le long du chemin
   * @default true
   * @description Oriente le texte suivant la forme du flux
   */
  on_path: boolean

  /**
   * Position automatique
   * @default false
   * @description Active le positionnement automatique pour éviter les chevauchements
   */
  pos_auto: boolean
}

// VALUE LABEL ATTRIBUTES ======================================================================

export interface IValueLabelAttributes extends IBaseLabelAttributes {
  /**
   * Visibilité du label de valeur
   * @default true
   * @description Affiche ou masque le label de valeur du lien
   */
  value_label_is_visible: boolean

  /**
   * Police du label de valeur
   * @inherit font_family
   */
  value_label_font_family: string

  /**
   * Taille de police du label de valeur
   * @inherit font_size
   */
  value_label_font_size: number

  /**
   * Majuscules pour le label de valeur
   * @inherit uppercase
   */
  value_label_uppercase: boolean

  /**
   * Gras pour le label de valeur
   * @inherit bold
   */
  value_label_bold: boolean

  /**
   * Italique pour le label de valeur
   * @inherit italic
   */
  value_label_italic: boolean

  /**
   * Couleur du label de valeur
   * @inherit color
   */
  value_label_color: string

  /**
   * Position horizontale du label de valeur
   * @inherit horiz
   */
  value_label_horiz: Type_PathLabelHPosition

  /**
   * Position verticale du label de valeur
   * @inherit vert
   */
  value_label_vert: Type_PathLabelVPosition

  /**
   * Orientation le long du chemin pour la valeur
   * @inherit on_path
   */
  value_label_on_path: boolean

  /**
   * Position automatique pour la valeur
   * @inherit pos_auto
   */
  value_label_pos_auto: boolean

  /**
   * Valeur en pourcentage d'entrée
   * @default false
   * @description Affiche la valeur en % des flux d'entrée du nœud source
   */
  value_label_percent_input: boolean

  /**
   * Valeur en pourcentage de sortie
   * @default false
   * @description Affiche la valeur en % des flux de sortie du nœud source
   */
  value_label_percent_output: boolean

  /**
   * Notation scientifique
   * @default false
   * @description Active la notation scientifique pour l'affichage des valeurs
   */
  value_label_scientific_notation: boolean

  /**
   * Chiffres significatifs
   * @default false
   * @description Active l'affichage avec un nombre fixe de chiffres significatifs
   */
  value_label_significant_digits: boolean

  /**
   * Nombre de chiffres significatifs
   * @default 3
   * @description Nombre maximum de chiffres significatifs à afficher
   */
  value_label_nb_significant_digits: number

  /**
   * Décimales personnalisées
   * @default true
   * @description Active l'affichage avec un nombre fixe de décimales
   */
  value_label_custom_digit: boolean

  /**
   * Nombre de décimales
   * @default 2
   * @description Nombre maximum de décimales à afficher
   */
  value_label_nb_digit: number

  /**
   * Visibilité de l'unité
   * @default false
   * @description Affiche l'unité avec la valeur
   */
  value_label_unit_visible: boolean

  /**
   * Nom de l'unité
   * @default ''
   * @description Texte de l'unité à afficher
   */
  value_label_unit: string

  /**
   * Facteur d'unité
   * @default 1
   * @description Facteur de conversion pour l'affichage de l'unité
   */
  value_label_unit_factor: number
}

// NAME LABEL ATTRIBUTES =======================================================================

export interface INameLabelAttributes extends IBaseLabelAttributes {
  /**
   * Visibilité du label de nom
   * @default true
   * @description Affiche ou masque le nom/texte du lien
   */
  name_label_is_visible: boolean

  /**
   * Police du label de nom
   * @inherit font_family
   */
  name_label_font_family: string

  /**
   * Taille de police du label de nom
   * @inherit font_size
   */
  name_label_font_size: number

  /**
   * Majuscules pour le label de nom
   * @inherit uppercase
   */
  name_label_uppercase: boolean

  /**
   * Gras pour le label de nom
   * @inherit bold
   */
  name_label_bold: boolean

  /**
   * Italique pour le label de nom
   * @inherit italic
   */
  name_label_italic: boolean

  /**
   * Couleur du label de nom
   * @inherit color
   */
  name_label_color: string

  /**
   * Position horizontale du label de nom
   * @inherit horiz
   * @default 'middle'
   */
  name_label_horiz: Type_PathLabelHPosition

  /**
   * Position verticale du label de nom
   * @inherit vert
   * @default 'top'
   */
  name_label_vert: Type_PathLabelVPosition

  /**
   * Orientation le long du chemin pour le nom
   * @inherit on_path
   */
  name_label_on_path: boolean

  /**
   * Position automatique pour le nom
   * @inherit pos_auto
   */
  name_label_pos_auto: boolean
}

// MAIN INTERFACES =============================================================================

/**
 * Interface complète pour tous les attributs de liens
 * Combine tous les groupes d'attributs
 */
export interface ILinkAttributes extends 
  IShapeAttributes,
  IOrientationAttributes, 
  IArrowAttributes,
  IFillingAttributes,
  IValueLabelAttributes,
  INameLabelAttributes {}

/**
 * Type pour les clés d'attributs personnalisables
 */
export type Type_customisable_flow_style_attr = keyof ILinkAttributes

/**
 * Interface pour la configuration des attributs
 */
export type ILinkAttributesConfig ={
  [K in keyof ILinkAttributes]: AttributeConfig<ILinkAttributes[K]>
}

// CLASS TYPE DEFINITIONS ======================================================================

/**
 * Interface pour la classe de base des attributs de liens
 */
export interface ILinkAttributeClass {
  // Getters/Setters pour les attributs de forme
  shape_local_link_scale: number | undefined
  shape_is_curved: boolean
  shape_shape: string
  shape_curvature: number
  shape_is_recycling: boolean
  shape_is_structure: boolean

  // Getters/Setters pour l'orientation
  shape_orientation: Type_Orientation
  shape_starting_curve: number
  shape_ending_curve: number
  shape_starting_tangeant: number
  shape_ending_tangeant: number
  shape_middle_recycling: number

  // Getters/Setters pour les flèches
  shape_is_arrow: boolean
  shape_arrow_size: number

  // Getters/Setters pour le remplissage
  shape_is_dashed: boolean
  shape_color: string
  shape_color_rule: string
  shape_opacity: number

  // Getters/Setters pour les labels de valeur
  value_label_is_visible: boolean
  value_label_font_family: string
  value_label_font_size: number
  value_label_uppercase: boolean
  value_label_bold: boolean
  value_label_italic: boolean
  value_label_color: string
  value_label_horiz: Type_PathLabelHPosition
  value_label_vert: Type_PathLabelVPosition
  value_label_on_path: boolean
  value_label_pos_auto: boolean
  value_label_percent_input: boolean
  value_label_percent_output: boolean
  value_label_scientific_notation: boolean
  value_label_significant_digits: boolean
  value_label_nb_significant_digits: number
  value_label_custom_digit: boolean
  value_label_nb_digit: number
  value_label_unit_visible: boolean
  value_label_unit: string
  value_label_unit_factor: number

  // Getters/Setters pour les labels de nom
  name_label_is_visible: boolean
  name_label_font_family: string
  name_label_font_size: number
  name_label_uppercase: boolean
  name_label_bold: boolean
  name_label_italic: boolean
  name_label_color: string
  name_label_horiz: Type_PathLabelHPosition
  name_label_vert: Type_PathLabelVPosition
  name_label_on_path: boolean
  name_label_pos_auto: boolean

  // Méthodes utilitaires
  delete_attribute(key: keyof ILinkAttributes): void
  toJSON(): Record<string, string | number | boolean | undefined>
  fromJSON(json: Record<string, string | number | boolean | undefined >): void
  copyFrom(element: ILinkAttributeClass): void
}

/**
 * Interface pour la classe de style de liens
 */
export interface ILinkStyleClass extends ILinkAttributeClass {
  readonly id: string
  name: string
  readonly customisable_attribute: { [K in keyof ILinkAttributes]: boolean }
  
  delete(): void
  addReference(ref: Class_NodeElement | Class_LinkElement | Class_LinkValue): void
  removeReference(ref: Class_NodeElement | Class_LinkElement | Class_LinkValue): void
}

// TRANSLATION MAPPINGS ========================================================================

/**
 * Correspondances pour la traduction des attributs
 */
export interface IAttributeTranslations {
  // Attributs de forme
  shape_local_link_scale: {
    fr: 'Échelle du flux'
    en: 'Flux Scale'
    tooltip_fr: 'Définit une échelle locale pour l\'épaisseur du flux'
    tooltip_en: 'Define a local scale for flow thickness'
  }
  
  shape_is_curved: {
    fr: 'Courbe'
    en: 'Curved'
    tooltip_fr: 'Représente le flux sous forme de courbe de Bézier'
    tooltip_en: 'Represents the flow as a Bezier curve'
  }
  
  shape_orientation: {
    fr: 'Orientation'
    en: 'Orientation'
    tooltip_fr: 'Orientation début/fin du lien'
    tooltip_en: 'Start/end orientation of the link'
  }
  
  shape_is_arrow: {
    fr: 'Flèche'
    en: 'Arrow'
    tooltip_fr: 'Affiche une pointe de flèche à la fin'
    tooltip_en: 'Shows an arrow tip at the end'
  }
  
  shape_color: {
    fr: 'Couleur'
    en: 'Color'
    tooltip_fr: 'Couleur principale du lien'
    tooltip_en: 'Main color of the link'
  }
  
  // Labels de valeur
  value_label_is_visible: {
    fr: 'Valeur'
    en: 'Value'
    tooltip_fr: 'Affiche ou masque le label de valeur'
    tooltip_en: 'Shows or hides the value label'
  }
  
  value_label_scientific_notation: {
    fr: 'Notation scientifique'
    en: 'Scientific notation'
    tooltip_fr: 'Active la notation scientifique'
    tooltip_en: 'Enables scientific notation'
  }
  
  // Labels de nom
  name_label_is_visible: {
    fr: 'Nom'
    en: 'Name'
    tooltip_fr: 'Affiche ou masque le nom du lien'
    tooltip_en: 'Shows or hides the link name'
  }
}
declare const LINKS_ATTRIBUTES_CONFIG: ILinkAttributesConfig

export { LINKS_ATTRIBUTES_CONFIG }