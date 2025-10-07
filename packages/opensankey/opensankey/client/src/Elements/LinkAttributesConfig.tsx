// ==================================================================================================
// CONFIGURATION UNIFIÉE - ATTRIBUTS + TRADUCTIONS + ACTIONS
// Source unique de vérité pour types, valeurs par défaut, setters, labels, tooltips ET actions
// ==================================================================================================
import {
  default_element_color,
  default_font,
  default_element_color_source,
} from '../types/Utils'
import { Class_LinkElement } from './Link'
import { UnitType } from './LinkValues'

// Types spécifiques
export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_PathLabelHPosition = 'dragged' | 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'dragged' | 'top' | 'middle' | 'bottom'

// Types d'actions disponibles
export type ActionType = 
  | 'drawElements'           // Redessiner tous les éléments
  | 'drawWithNodes'          // Redessiner avec les nœuds  
  | 'drawValue'              // Redessiner uniquement la valeur
  | 'drawLabel'              // Redessiner uniquement le label
  | 'drawPath'               // Redessiner uniquement le chemin
  | 'drawArrow'              // Redessiner uniquement la flèche
  | 'drawControlPoint'       // Redessiner les points de contrôle

// Interface pour la configuration d'un attribut
interface AttributeConfig<T> {
  default: T
  type: () => T
  category: string
  labels: { en: string; fr: string }
  tooltips: { en: string; fr: string }
  callback?: string
  setter?: string
  actions?: ActionType[]  // 🆕 Actions à exécuter lors du set
}

// Configuration unifiée avec TOUT au même endroit
export const LINKS_ATTRIBUTES_CONFIG = {
  // =================== SHAPE SCALE ===================
  shape_local_link_scale: {
    default: undefined as number | undefined,
    type: (() => undefined) as (() => number | undefined),
    callback: 'updateLinkAndSourceTarget',
    category: 'shape' as const,
    actions: ['drawWithNodes'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Link scale',
      fr: 'Échelle du flux'
    },
    tooltips: {
      en: 'Define a local scale for this flow, which can break the coherence of flow thickness proportionality',
      fr: 'Définie une échelle local pour l\'épaisseur du flux, cela peut casser la cohérence du diagramme'
    }
  } satisfies AttributeConfig<number | undefined>,

  // =================== SHAPE TYPE ===================
  shape_is_curved: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Curved',
      fr: 'Courbe'
    },
    tooltips: {
      en: 'Represents the selected link(s) as Bezier curve(s)',
      fr: 'Représente le/les flux sélectionné(s) sous forme de courbe(s) de Bezier'
    }
  } satisfies AttributeConfig<boolean>,

  shape_shape: {
    default: 'bezier_path',
    type: (() => 'bezier_path') as (() => string),
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Type',
      fr: 'Type'
    },
    tooltips: {
      en: 'Choose the shape type for the link',
      fr: 'Choisir le type de forme pour le flux'
    }
  } satisfies AttributeConfig<string>,

  shape_curvature: {
    default: 0.5,
    type: (() => 0.5) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Curvature',
      fr: 'Courbure'
    },
    tooltips: {
      en: 'Adjust the curvature of the link',
      fr: 'Ajuster la courbure du flux'
    }
  } satisfies AttributeConfig<number>,

  shape_is_recycling: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    setter: 'customShapeIsRecycling',  // 🆕 Setter spécial pour logique complexe
    actions: ['drawWithNodes', 'drawControlPoint'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Recycling',
      fr: 'Recyclage'
    },
    tooltips: {
      en: 'Represents the selected link(s) as recycling with a backward turn',
      fr: 'Représente le/les flux sélectionné(s) sous forme de recyclage avec un retour vers l\'arrière'
    }
  } satisfies AttributeConfig<boolean>,

  shape_is_structure: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawWithNodes', 'drawControlPoint'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Structure',
      fr: 'Structure'
    },
    tooltips: {
      en: 'Represents the selected link(s) as if they didn\'t have values',
      fr: 'Représente le/les flux sélectionné(s) comme si ils n\'avaient pas de valeur'
    }
  } satisfies AttributeConfig<boolean>,

  // =================== SHAPE ORIENTATION ===================
  shape_orientation: {
    default: 'hh' as Type_Orientation,
    type: (() => 'hh') as (() => Type_Orientation),
    callback: 'updateLinkAndSourceTarget',
    setter: 'customShapeOrientation',
    category: 'shape' as const,
    actions: ['drawWithNodes'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Orientation',
      fr: 'Orientation'
    },
    tooltips: {
      en: 'Choose the orientation of the link start and end points',
      fr: 'Choisir l\'orientation des points de départ et d\'arrivée du flux'
    }
  } satisfies AttributeConfig<Type_Orientation>,

  shape_starting_curve: {
    default: 0.05,
    type: (() => 0.05) as (() => number),
    setter: 'customStartingCurve',  // 🆕
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],
    
    labels: {
      en: 'Starting curve position',
      fr: 'Position départ courbure'
    },
    tooltips: {
      en: 'Position of the starting point of curvature as ratio of link length',
      fr: 'Permet d\'affiner la position du départ des courbures du/des flux sélectionné(s). Cette valeur est un ratio (%) relatif à la longueur du flux à partir du point de départ.',
    }
  } satisfies AttributeConfig<number>,

  shape_ending_curve: {
    default: 0.05,
    type: (() => 0.05) as (() => number),
    setter: 'customEndingCurve',  // 🆕
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],
    
    labels: {
      en: 'Ending curve position',
      fr: 'Position fin courbure'
    },
    tooltips: {
      en: 'Position of the ending point of curvature as ratio of link length',
      fr: 'Permet d\'affiner la position de fin des courbures du/des flux sélectionné(s). Cette valeur est un ratio (%) relatif à la longueur du flux à partir du point de départ.',
    }
  } satisfies AttributeConfig<number>,

  shape_starting_tangeant: {
    default: 0.25,
    type: (() => 0.25) as (() => number),
    setter: 'customStartingTangeant',  // 🆕
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],
    
    labels: {
      en: 'Starting tangeant',
      fr: 'Courbure de départ'
    },
    tooltips: {
      en: 'Setting the radius of the starting curvature for Bezier curves',
      fr: 'Paramétrage de la courbure de départ dans le cas ou le/les flux sélectionné(s) sont sous forme de courbe(s) de Bezier',
    }
  } satisfies AttributeConfig<number>,

  shape_ending_tangeant: {
    default: 0.25,
    type: (() => 0.25) as (() => number),
    setter: 'customEndingTangeant',  // 🆕
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],
    
    labels: {
      en: 'Ending tangeant',
      fr: 'Courbure de fin'
    },
    tooltips: {
      en: 'Setting the radius of the ending curvature for Bezier curves',
      fr: 'Paramétrage de la courbure de fin dans le cas ou le/les flux sélectionné(s) sont sous forme de courbe(s) de Bezier',
    }
  } satisfies AttributeConfig<number>,

  shape_middle_recycling: {
    default: 100,
    type: (() => 100) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements', 'drawControlPoint'] as ActionType[],  // 🆕 Ajouté !
    
    labels: {
      en: 'Recycling position',
      fr: 'Position point de recyclage'
    },
    tooltips: {
      en: 'Position of the recycling point',
      fr: 'Position du point de recyclage'
    }
  } satisfies AttributeConfig<number>,

  // =================== SHAPE ARROW ===================
  shape_is_arrow: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Arrow',
      fr: 'Flèche'
    },
    tooltips: {
      en: 'Represents the selected link(s) with an arrow tip at the end',
      fr: 'Représente le/les flux sélectionné(s) avec une pointe de flèche à la fin'
    }
  } satisfies AttributeConfig<boolean>,

  shape_arrow_size: {
    default: 10,
    type: (() => 10) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Arrow size',
      fr: 'Taille flèche'
    },
    tooltips: {
      en: 'Change the size of the arrow (from the end of the link to the node)',
      fr: 'Modifie la taille de la flèche (largeur entre la fin du flux et le noeud)'
    }
  } satisfies AttributeConfig<number>,

  // =================== SHAPE FILLING ===================
  shape_is_dashed: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Dashed',
      fr: 'Hachuré'
    },
    tooltips: {
      en: 'Applies a hatch effect on the selected link(s)',
      fr: 'Applique un effet de hachure sur le/les flux sélectionné(s)'
    }
  } satisfies AttributeConfig<boolean>,

  shape_color: {
    default: default_element_color,
    type: (() => default_element_color) as (() => string),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Color',
      fr: 'Couleur'
    },
    tooltips: {
      en: 'Choose the color for the selected link(s)',
      fr: 'Choisir la couleur pour le/les flux sélectionné(s)'
    }
  } satisfies AttributeConfig<string>,

  shape_color_rule: {
    default: default_element_color_source,
    type: (() => default_element_color_source) as (() => 'flow' | 'source' | 'target' | 'gradient' | 'auto'),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Color rule',
      fr: 'Règle couleur'
    },
    tooltips: {
      en: 'Choose what rule defines flow color',
      fr: 'Choisir la règle qui définie la couleur du flux'
    }
  } satisfies AttributeConfig<'flow' | 'source' | 'target' | 'gradient' | 'auto'>,

  shape_opacity: {
    default: 0.85,
    type: (() => 0.85) as (() => number),
    category: 'shape' as const,
    actions: ['drawElements'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Opacity',
      fr: 'Opacité'
    },
    tooltips: {
      en: 'Adjust the opacity of the selected link(s)',
      fr: 'Ajuster l\'opacité du/des flux sélectionné(s)'
    }
  } satisfies AttributeConfig<number>,

  // =================== VALUE LABEL ===================
  value_label_is_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Value',
      fr: 'Valeur'
    },
    tooltips: {
      en: 'Display or not the label (data / text) associated to the selected link(s)',
      fr: 'Permet d\'afficher ou non le label (donnée / texte) associé au(x) flux sélectionné(s)'
    }
  } satisfies AttributeConfig<boolean>,

  // =================== VALUE LABEL FONT ===================
  value_label_font_family: {
    default: default_font,
    type: (() => default_font) as (() => string),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Font family',
      fr: 'Style de police'
    },
    tooltips: {
      en: 'Choose the font family for the value label',
      fr: 'Choisir la famille de police pour le label de valeur'
    }
  } satisfies AttributeConfig<string>,

  value_label_font_size: {
    default: 20,
    type: (() => 20) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Font size',
      fr: 'Taille police'
    },
    tooltips: {
      en: 'Change the font size for the value label',
      fr: 'Modifier la taille de police pour le label de valeur'
    }
  } satisfies AttributeConfig<number>,

  value_label_uppercase: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Uppercase',
      fr: 'Majuscule'
    },
    tooltips: {
      en: 'Apply uppercase style to the value label',
      fr: 'Appliquer le style majuscule au label de valeur'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_bold: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Bold',
      fr: 'Gras'
    },
    tooltips: {
      en: 'Apply bold style to the value label',
      fr: 'Appliquer le style gras au label de valeur'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_italic: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Italic',
      fr: 'Italique'
    },
    tooltips: {
      en: 'Apply italic style to the value label',
      fr: 'Appliquer le style italique au label de valeur'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_color: {
    default: 'black',
    type: (() => 'black') as (() => string),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Color',
      fr: 'Couleur police'
    },
    tooltips: {
      en: 'Choose the color for the value label text',
      fr: 'Choisir la couleur pour le texte du label de valeur'
    }
  } satisfies AttributeConfig<string>,

  // =================== VALUE LABEL POSITION ===================
  value_label_horiz: {
    default: 'middle' as Type_PathLabelHPosition,
    type: (() => 'middle') as (() => Type_PathLabelHPosition),
    setter: 'customValueLabelHoriz',
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Horizontal position',
      fr: 'Position horizontale'
    },
    tooltips: {
      en: 'Choose the horizontal position of the value label along the link',
      fr: 'Choisir la position horizontale du label de valeur le long du flux'
    }
  } satisfies AttributeConfig<Type_PathLabelHPosition>,

  value_label_vert: {
    default: 'middle' as Type_PathLabelVPosition,
    type: (() => 'middle') as (() => Type_PathLabelVPosition),
    setter: 'customValueLabelVert',
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Vertical position',
      fr: 'Position verticale'
    },
    tooltips: {
      en: 'Choose the vertical position of the value label relative to the link',
      fr: 'Choisir la position verticale du label de valeur par rapport au flux'
    }
  } satisfies AttributeConfig<Type_PathLabelVPosition>,

  value_label_on_path: {
    default: true,
    type: (() => true) as (() => boolean),
    setter: 'customValueLabelOnPath',  // 🆕
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],
    
    labels: {
      en: 'Follow path',
      fr: 'Orienter suivant l\'axe du flux'
    },
    tooltips: {
      en: 'Allows to orient the label following the shape of the link',
      fr: 'Permet d\'orienter le texte du label en suivant la forme du flux'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_pos_auto: {
    default: true,
    type: (() => true) as (() => boolean),
    setter: 'customValueLabelPosAuto',  // 🆕
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],
    
    labels: {
      en: 'Auto position',
      fr: 'Position verticale ajustée'
    },
    tooltips: {
      en: 'Automatically adjust the vertical position of the label',
      fr: 'Ajuster automatiquement la position verticale du label'
    }
  } satisfies AttributeConfig<boolean>,

  // =================== VALUE LABEL FORMATTING ===================
  value_label_scientific_notation: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Scientific notation',
      fr: 'Notation scientifique'
    },
    tooltips: {
      en: 'Activate or not the notation in scientific format for the display of the link\'s data',
      fr: 'Activer ou non la notation en format scientifique pour l\'affichage de la valeur du flux'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_significant_digits: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Significant digits',
      fr: 'Chiffres significatifs'
    },
    tooltips: {
      en: 'Use significant digits for number formatting',
      fr: 'Utiliser les chiffres significatifs pour le formatage des nombres'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_nb_significant_digits: {
    default: 3,
    type: (() => 3) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Number of significant digits',
      fr: 'Nombre de chiffres significatifs'
    },
    tooltips: {
      en: 'Maximum number of significant digits',
      fr: 'Nombre maximum de chiffres significatifs'
    }
  } satisfies AttributeConfig<number>,

  value_label_custom_digit: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'value_label' as const,
    setter: 'customValueLabelCustomDigit',  // 🆕 Logique spéciale
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Digits',
      fr: 'Décimales'
    },
    tooltips: {
      en: 'Use custom number of decimal places',
      fr: 'Utiliser un nombre personnalisé de décimales'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_nb_digit: {
    default: 2,
    type: (() => 2) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Number of digits',
      fr: 'Nombre de décimales'
    },
    tooltips: {
      en: 'Maximum number of decimal places',
      fr: 'Nombre maximum de décimales'
    }
  } satisfies AttributeConfig<number>,

  // =================== VALUE LABEL UNITS ===================
  value_label_unit_visible: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit',
      fr: 'Unité, %, Ratio'
    },
    tooltips: {
      en: 'Display the unit of the links',
      fr: 'Permet d\'afficher ou non l\'unité du flux'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_unit_type: {
    default: 'unit_name',
    type: (() => 'unit_name') as (() => UnitType),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit type',
      fr: 'Type d\'unité'
    },
    tooltips: {
      en: 'Choose the type of unit to display',
      fr: 'Choisir le type d\'unité à afficher'
    }
  } satisfies AttributeConfig<UnitType>,

  value_label_unit: {
    default: '',
    type: (() => '') as (() => string),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit name',
      fr: 'Nom de l\'unité'
    },
    tooltips: {
      en: 'Choose the name of the unit',
      fr: 'Choisir le nom de l\'unité'
    }
  } satisfies AttributeConfig<string>,

  value_label_unit_factor: {
    default: 1,
    type: (() => 1) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValue'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit factor',
      fr: 'Facteur d\'unité'
    },
    tooltips: {
      en: 'Factor of conversion for link unity',
      fr: 'Facteur de conversions de l\'unité du flux'
    }
  } satisfies AttributeConfig<number>,

  // =================== NAME LABEL ===================
  name_label_is_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Label',
      fr: 'Libellé'
    },
    tooltips: {
      en: 'Display or not the name label of the selected link(s)',
      fr: 'Permet d\'afficher ou non le libellé nom du/des flux sélectionné(s)'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_font_family: {
    default: default_font,
    type: (() => default_font) as (() => string),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Font family',
      fr: 'Style de police'
    },
    tooltips: {
      en: 'Choose the font family for the name label',
      fr: 'Choisir la famille de police pour le libellé nom'
    }
  } satisfies AttributeConfig<string>,

  name_label_font_size: {
    default: 20,
    type: (() => 20) as (() => number),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Font size',
      fr: 'Taille police'
    },
    tooltips: {
      en: 'Change the font size for the name label',
      fr: 'Modifier la taille de police pour le libellé nom'
    }
  } satisfies AttributeConfig<number>,

  name_label_uppercase: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Uppercase',
      fr: 'Majuscule'
    },
    tooltips: {
      en: 'Apply uppercase style to the name label',
      fr: 'Appliquer le style majuscule au libellé nom'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_bold: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Bold',
      fr: 'Gras'
    },
    tooltips: {
      en: 'Apply bold style to the name label',
      fr: 'Appliquer le style gras au libellé nom'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_italic: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Italic',
      fr: 'Italique'
    },
    tooltips: {
      en: 'Apply italic style to the name label',
      fr: 'Appliquer le style italique au libellé nom'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_color: {
    default: 'black',
    type: (() => 'black') as (() => string),
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Color',
      fr: 'Couleur police'
    },
    tooltips: {
      en: 'Choose the color for the name label text',
      fr: 'Choisir la couleur pour le texte du libellé nom'
    }
  } satisfies AttributeConfig<string>,

  name_label_horiz: {
    default: 'middle' as Type_PathLabelHPosition,
    type: (() => 'middle') as (() => Type_PathLabelHPosition),
    setter: 'customNameLabelHoriz',  // 🆕
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],
    
    labels: {
      en: 'Horizontal position',
      fr: 'Position horizontale'
    },
    tooltips: {
      en: 'Choose the horizontal position of the name label along the link',
      fr: 'Choisir la position horizontale du libellé nom le long du flux'
    }
  } satisfies AttributeConfig<Type_PathLabelHPosition>,

  name_label_vert: {
    default: 'top' as Type_PathLabelVPosition,
    type: (() => 'top') as (() => Type_PathLabelVPosition),
    setter: 'customNameLabelVert',  // 🆕
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],
    
    labels: {
      en: 'Vertical position',
      fr: 'Position verticale'
    },
    tooltips: {
      en: 'Choose the vertical position of the name label relative to the link',
      fr: 'Choisir la position verticale du libellé nom par rapport au flux'
    }
  } satisfies AttributeConfig<Type_PathLabelVPosition>,

  name_label_on_path: {
    default: true,
    type: (() => true) as (() => boolean),
    setter: 'customNameLabelOnPath',  // 🆕
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],
    
    labels: {
      en: 'Follow path',
      fr: 'Orienter suivant l\'axe du flux'
    },
    tooltips: {
      en: 'Allows to orient the name label following the shape of the link',
      fr: 'Permet d\'orienter le libellé nom en suivant la forme du flux'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_pos_auto: {
    default: true,
    type: (() => true) as (() => boolean),
    setter: 'customNameLabelPosAuto',  // 🆕
    category: 'name_label' as const,
    actions: ['drawLabel'] as ActionType[],
    
    labels: {
      en: 'Auto position',
      fr: 'Position verticale ajustée'
    },
    tooltips: {
      en: 'Automatically adjust the vertical position of the name label',
      fr: 'Ajuster automatiquement la position verticale du libellé nom'
    }
  } satisfies AttributeConfig<boolean>,

} as const

// ==================================================================================================
// GÉNÉRATEUR AUTOMATIQUE DE SETTERS
// ==================================================================================================

export class LinkSetterGenerator {
  /**
   * Génère automatiquement les setters pour une classe LinkElement
   * Override les propriétés héritées de LinkAttributeTypeScript
   */
  static generateSetters(instance: Class_LinkElement) {
    (Object.keys(LINKS_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      const config = LINKS_ATTRIBUTES_CONFIG[key]
      
      Object.defineProperty(instance, key, {
        get: () => instance.getLinkProperty(key),
        set: (value: AttributeTypes[typeof key]) => {
          // 1. Setter personnalisé si défini
          //@ts-expect-error xxx
          if (config.setter && typeof instance[config.setter] === 'function') {
            //@ts-expect-error xxx
            instance[config.setter](value)
          } else {
            //@ts-expect-error xxx
            (instance._display.attributes)[key] = value
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

// Export des types générés automatiquement
export type AttributeKey = keyof typeof LINKS_ATTRIBUTES_CONFIG
export type AttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG[K]['type']>
}

// Génération automatique de l'interface pour toutes les propriétés
type ILinkAttributesBase = {
  [K in AttributeKey]: AttributeTypes[K]
}
export abstract class LinkAttributeTypeScript implements ILinkAttributesBase {
  // =================== DÉCLARATIONS AUTOMATIQUES GÉNÉRÉES ===================
  // Ces déclarations sont générées automatiquement à partir de NODES_ATTRIBUTES_CONFIG
  
  shape_local_link_scale!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_local_link_scale']['type']>
  shape_is_curved!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_curved']['type']>
  shape_shape!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_shape']['type']>
  shape_curvature!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_curvature']['type']>
  shape_is_recycling!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_recycling']['type']>
  shape_is_structure!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_structure']['type']>
  shape_orientation!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_orientation']['type']>
  shape_starting_curve!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_starting_curve']['type']>
  shape_ending_curve!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_ending_curve']['type']>
  shape_starting_tangeant!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_starting_tangeant']['type']>
  shape_ending_tangeant!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_ending_tangeant']['type']>
  shape_middle_recycling!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_middle_recycling']['type']>
  shape_is_arrow!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_arrow']['type']>
  shape_arrow_size!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_arrow_size']['type']>
  shape_is_dashed!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_dashed']['type']>
  shape_color!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_color']['type']>
  shape_color_rule!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_color_rule']['type']>
  shape_opacity!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_opacity']['type']>

  value_label_is_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_is_visible']['type']>
  value_label_font_family!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_font_family']['type']>
  value_label_font_size!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_font_size']['type']>
  value_label_uppercase!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_uppercase']['type']>
  value_label_bold!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_bold']['type']>
  value_label_italic!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_italic']['type']>
  value_label_color!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_color']['type']>
  value_label_horiz!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_horiz']['type']>
  value_label_vert!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_vert']['type']>
  value_label_on_path!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_on_path']['type']>
  value_label_pos_auto!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_pos_auto']['type']>
  value_label_scientific_notation!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_scientific_notation']['type']>
  value_label_significant_digits!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_significant_digits']['type']>
  value_label_nb_significant_digits!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_significant_digits']['type']>
  value_label_custom_digit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_custom_digit']['type']>
  value_label_nb_digit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_digit']['type']>
  value_label_unit_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_visible']['type']>
  value_label_unit_type!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_type']['type']>
  value_label_unit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit']['type']>
  value_label_unit_factor!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_factor']['type']>
  
  name_label_is_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_is_visible']['type']>
  name_label_font_family!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_font_family']['type']>
  name_label_font_size!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_font_size']['type']>
  name_label_uppercase!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_uppercase']['type']>
  name_label_bold!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_bold']['type']>
  name_label_italic!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_italic']['type']>
  name_label_color!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_color']['type']>
  name_label_horiz!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_horiz']['type']>
  name_label_vert!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_vert']['type']>
  name_label_on_path!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_on_path']['type']>
  name_label_pos_auto!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_pos_auto']['type']>
}