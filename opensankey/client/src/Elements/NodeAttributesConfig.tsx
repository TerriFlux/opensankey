// ==================================================================================================
// CONFIGURATION UNIFIÉE - ATTRIBUTS + TRADUCTIONS NOEUDS + ACTIONS
// Source unique de vérité pour types, valeurs par défaut, setters, labels, tooltips ET actions
// ==================================================================================================
import {
  default_element_color,
  default_font,
} from '../types/Utils'
import { UnitType } from './LinkValues'

// Types spécifiques
export type Type_Shape = 'ellipse' | 'rect' | 'arrow'
export type Type_TextHPos = 'left' | 'middle' | 'right' | 'dragged'
export type Type_TextVPos = 'top' | 'middle' | 'bottom' | 'dragged'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'

// Types d'actions disponibles
export type ActionType = 
  | 'drawShape'              // Redessiner la forme
  | 'drawNameLabel'          // Redessiner le label nom
  | 'drawValueLabel'         // Redessiner le label valeur
  | 'drawIllustration'       // Redessiner l'illustration
  | 'drawFO'                 // Redessiner le foreign object
  | 'drawIllustrationImage'  // Redessiner l'image
  | 'drawIllustrationIcon'   // Redessiner l'icône
  | 'updateLinksColor'       // Mettre à jour la couleur des liens
  | 'drawLinksArrow'         // Redessiner les flèches des liens
  | 'draw'                   // Redessiner complètement

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
export const NODES_ATTRIBUTES_CONFIG = {
  // =================== SHAPE ===================
  shape_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawShape'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Shape',
      fr: 'Forme'
    },
    tooltips: {
      en: 'Makes the selected node(s) visible or invisible',
      fr: 'Rend le/les noeud(s) selectionné(s) visible(s) ou invisible(s)'
    }
  } satisfies AttributeConfig<boolean>,
  orphan_node_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    actions: ['draw'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Orphans Visible',
      fr: 'Orphelins Visibles'
    },
    tooltips: {
      en: 'Visibility of Orphans Nodes without input or output flux',
      fr: 'Visibilité des Noeud orphelins sans flux entrants ni flux sortants'
    }
  } satisfies AttributeConfig<boolean>,
  shape_type: {
    default: 'rect' as Type_Shape,
    type: (() => 'rect') as (() => Type_Shape),
    category: 'shape' as const,
    actions: ['drawShape'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Shape of node',
      fr: 'Forme du noeud'
    },
    tooltips: {
      en: 'Choose a shape between rectangle or circle for the selected node(s)',
      fr: 'Choisir une Forme entre rectangle ou cercle pour le/les noeud(s) selectionné(s)'
    }
  } satisfies AttributeConfig<Type_Shape>,

  shape_min_width: {
    default: 40,
    type: (() => 40) as (() => number),
    category: 'shape' as const,
    actions: ['draw'] as ActionType[],  // 🆕 Redessiner complètement car ça affecte la taille
    
    labels: {
      en: 'Minimum width',
      fr: 'Largeur minimale'
    },
    tooltips: {
      en: 'Minimum width in pixels of the selected node(s)',
      fr: 'Largeur minimale en pixel du/des noeud(s) selectionné(s)'
    }
  } satisfies AttributeConfig<number>,

  shape_min_height: {
    default: 40,
    type: (() => 40) as (() => number),
    category: 'shape' as const,
    actions: ['draw'] as ActionType[],  // 🆕 Redessiner complètement car ça affecte la taille
    
    labels: {
      en: 'Minimum height',
      fr: 'Hauteur minimale'
    },
    tooltips: {
      en: 'Minimum height in pixels of the selected node(s)',
      fr: 'Hauteur minimale en pixel du/des noeud(s) selectionné(s)'
    }
  } satisfies AttributeConfig<number>,

  shape_color: {
    default: default_element_color,
    type: (() => default_element_color) as (() => string),
    category: 'shape' as const,
    actions: ['drawShape', 'updateLinksColor', 'drawLinksArrow'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Color',
      fr: 'Couleur'
    },
    tooltips: {
      en: 'Choose the color of the selected node(s)',
      fr: 'Choisir la couleur du/des noeud(s) selectionné(s)'
    }
  } satisfies AttributeConfig<string>,

  shape_opacity: {
    default: 0.85,
    type: (() => 0.85) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape', 'updateLinksColor', 'drawLinksArrow'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Opacity',
      fr: 'Opacité'
    },
    tooltips: {
      en: 'Opacity of the shape of the node',
      fr: 'Opacité de la forme du noeud'
    }
  } satisfies AttributeConfig<number>,

  shape_color_sustainable: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'shape' as const,
    actions: ['drawShape', 'updateLinksColor'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Static color',
      fr: 'Couleur fixe'
    },
    tooltips: {
      en: 'Keep the color of the node(s) if any flux or data filter is activated, otherwise node turns grey (default color)',
      fr: 'Garder la couleur du/des noeud(s) en cas de filtrage des flux ou données. Sinon le noeud reste en gris (couleur par defaut).'
    }
  } satisfies AttributeConfig<boolean>,

  // =================== SHAPE ARROW ===================
  shape_arrow_angle_factor: {
    default: 30,
    type: (() => 30) as (() => number),
    category: 'shape' as const,
    actions: ['drawShape'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Angle',
      fr: 'Inclinaison flÃ¨che'
    },
    tooltips: {
      en: 'Change the angle of node arrow',
      fr: 'Change l\'angle du noeud en forme de flÃ¨che'
    }
  } satisfies AttributeConfig<number>,

  shape_arrow_angle_direction: {
    default: 'right' as Type_Side,
    type: (() => 'right') as (() => Type_Side),
    category: 'shape' as const,
    actions: ['drawShape'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Angle orientation',
      fr: 'Orientation flÃ¨che'
    },
    tooltips: {
      en: 'Change the orientation of the node',
      fr: 'Change l\'orientation du noeud en forme de flÃ¨che'
    }
  } satisfies AttributeConfig<Type_Side>,

  // =================== NAME LABEL ===================
  name_label_is_visible: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Label',
      fr: 'Libellé'
    },
    tooltips: {
      en: 'Displays or not the label(s) attached to the selected node(s)',
      fr: 'Permet d\'afficher ou non le label accolé au(x) noeud(s) sélectionné(s)'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_font_family: {
    default: default_font,
    type: (() => default_font) as (() => string),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
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
    default: 14,
    type: (() => 14) as (() => number),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Color',
      fr: 'Couleur police'
    },
    tooltips: {
      en: 'Choose the color for the name label text',
      fr: 'Choisir la couleur pour le texte du libellé nom'
    }
  } satisfies AttributeConfig<string>,

  // =================== NAME LABEL POSITION ===================
  name_label_horiz: {
    default: 'middle' as Type_TextHPos,
    type: (() => 'middle') as (() => Type_TextHPos),
    setter: 'customNameLabelHoriz',  // 🆕 Setter spécial pour logique complexe
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Horizontal position',
      fr: 'Position horizontale'
    },
    tooltips: {
      en: 'Choose the horizontal position of the name label relative to the node',
      fr: 'Choisir la position horizontale du libellé nom par rapport au noeud'
    }
  } satisfies AttributeConfig<Type_TextHPos>,

  name_label_vert: {
    default: 'bottom' as Type_TextVPos,
    type: (() => 'bottom') as (() => Type_TextVPos),
    setter: 'customNameLabelVert',  // 🆕 Setter spécial pour logique complexe
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Vertical position',
      fr: 'Position verticale'
    },
    tooltips: {
      en: 'Choose the vertical position of the name label relative to the node',
      fr: 'Choisir la position verticale du libellé nom par rapport au noeud'
    }
  } satisfies AttributeConfig<Type_TextVPos>,

  name_label_background: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Background',
      fr: 'Fond'
    },
    tooltips: {
      en: 'Add a background to the label for a better visibility in case the label is in front of a link',
      fr: 'Permet d\'ajouter un fond au label pour qu\'il soit plus visible quand il est par-dessus un flux'
    }
  } satisfies AttributeConfig<boolean>,

  name_label_background_color: {
    default: '#ffffff',
    type: (() => '#ffffff') as (() => string),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Background color',
      fr: 'Couleur fond'
    },
    tooltips: {
      en: 'Choose the background color for the name label',
      fr: 'Choisir la couleur de fond pour le libellé nom'
    }
  } satisfies AttributeConfig<string>,

  name_label_horiz_shift: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Horizontal shift',
      fr: 'Décalage horizontal'
    },
    tooltips: {
      en: 'Horizontal shift from label anchor',
      fr: 'Décalage horizontal par rapport Ã  l\'ancre du label'
    }
  } satisfies AttributeConfig<number>,

  name_label_vert_shift: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Vertical shift',
      fr: 'Décalage vertical'
    },
    tooltips: {
      en: 'Vertical shift from label anchor',
      fr: 'Décalage vertical par rapport Ã  l\'ancre du label'
    }
  } satisfies AttributeConfig<number>,

  name_label_box_width: {
    default: 150,
    type: (() => 150) as (() => number),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Width',
      fr: 'Largeur'
    },
    tooltips: {
      en: 'Width of the text area (in pixels) for the label(s) of the selected node(s)',
      fr: 'Largeur de la zone de texte (en pixel) pour le label du/des noeud(s) sélectionné(s)'
    }
  } satisfies AttributeConfig<number>,

  name_label_separator: {
    default: '',
    type: (() => '') as (() => string),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Separator',
      fr: 'Séparateur'
    },
    tooltips: {
      en: 'Add a separator character for the name label',
      fr: 'Ajouter un caractÃ¨re séparateur pour le libellé nom'
    }
  } satisfies AttributeConfig<string>,

  name_label_separator_part: {
    default: 'after' as 'before' | 'after',
    type: (() => 'after') as (() => 'before' | 'after'),
    category: 'name_label' as const,
    actions: ['drawNameLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Separator position',
      fr: 'Position séparateur'
    },
    tooltips: {
      en: 'Position of the separator relative to the name label',
      fr: 'Position du séparateur par rapport au libellé nom'
    }
  } satisfies AttributeConfig<'before' | 'after'>,

  // =================== VALUE LABEL ===================
  value_label_is_visible: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Value',
      fr: 'Valeur'
    },
    tooltips: {
      en: 'Display or not the associated value with the selected node(s)',
      fr: 'Active l\'affichage de la valeur associée au(x) noeud(s) sélectionné(s)'
    }
  } satisfies AttributeConfig<boolean>,

  // =================== VALUE LABEL FONT ===================
  value_label_font_family: {
    default: default_font,
    type: (() => default_font) as (() => string),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    default: 14,
    type: (() => 14) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    default: 'middle' as Type_TextHPos,
    type: (() => 'middle') as (() => Type_TextHPos),
    setter: 'customValueLabelHoriz',  // 🆕 Setter spécial pour logique complexe
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Horizontal position',
      fr: 'Position horizontale'
    },
    tooltips: {
      en: 'Choose the horizontal position of the value label relative to the node',
      fr: 'Choisir la position horizontale du label de valeur par rapport au noeud'
    }
  } satisfies AttributeConfig<Type_TextHPos>,

  value_label_vert: {
    default: 'top' as Type_TextVPos,
    type: (() => 'top') as (() => Type_TextVPos),
    setter: 'customValueLabelVert',  // 🆕 Setter spécial pour logique complexe
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Vertical position',
      fr: 'Position verticale'
    },
    tooltips: {
      en: 'Choose the vertical position of the value label relative to the node',
      fr: 'Choisir la position verticale du label de valeur par rapport au noeud'
    }
  } satisfies AttributeConfig<Type_TextVPos>,

  value_label_background: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Background',
      fr: 'Fond'
    },
    tooltips: {
      en: 'Add a background to the value label for better visibility',
      fr: 'Ajouter un fond au label de valeur pour une meilleure visibilité'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_background_color: {
    default: '#ffffff',
    type: (() => '#ffffff') as (() => string),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Background color',
      fr: 'Couleur fond'
    },
    tooltips: {
      en: 'Choose the background color for the value label',
      fr: 'Choisir la couleur de fond pour le label de valeur'
    }
  } satisfies AttributeConfig<string>,

  value_label_horiz_shift: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Horizontal shift',
      fr: 'Décalage horizontal'
    },
    tooltips: {
      en: 'Horizontal shift from value label anchor',
      fr: 'Décalage horizontal par rapport Ã  l\'ancre du label de valeur'
    }
  } satisfies AttributeConfig<number>,

  value_label_vert_shift: {
    default: 0,
    type: (() => 0) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Vertical shift',
      fr: 'Décalage vertical'
    },
    tooltips: {
      en: 'Vertical shift from value label anchor',
      fr: 'Décalage vertical par rapport Ã  l\'ancre du label de valeur'
    }
  } satisfies AttributeConfig<number>,

  value_label_box_width: {
    default: 150,
    type: (() => 150) as (() => number),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Width',
      fr: 'Largeur'
    },
    tooltips: {
      en: 'Width of the text area for the value label',
      fr: 'Largeur de la zone de texte pour le label de valeur'
    }
  } satisfies AttributeConfig<number>,

  // =================== VALUE LABEL FORMATTING ===================
  value_label_scientific_notation: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Scientific notation',
      fr: 'Notation scientifique'
    },
    tooltips: {
      en: 'Activate or not the notation in scientific format for the display of the node\'s value',
      fr: 'Activer ou non la notation en format scientifique pour l\'affichage de la valeur du noeud'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_significant_digits: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit',
      fr: 'Unité, %, Ratio'
    },
    tooltips: {
      en: 'Display the unit of the node value',
      fr: 'Permet d\'afficher ou non l\'unité de la valeur du noeud'
    }
  } satisfies AttributeConfig<boolean>,

  value_label_unit_type: {
    default: 'unit_name',
    type: (() => 'unit_name') as (() => UnitType),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit type',
      fr: 'Type d\'unité'
    },
    tooltips: {
      en: 'Choose the type of unit to display',
      fr: 'Choisir le type d\'unité Ã  afficher'
    }
  } satisfies AttributeConfig<UnitType>,

  value_label_unit: {
    default: '',
    type: (() => '') as (() => string),
    category: 'value_label' as const,
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
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
    actions: ['drawValueLabel'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Unit factor',
      fr: 'Facteur d\'unité'
    },
    tooltips: {
      en: 'Factor of conversion for node unity',
      fr: 'Facteur de conversions de l\'unité du noeud'
    }
  } satisfies AttributeConfig<number>,

  // =================== OSP EXTENSIONS - ICON ===================
  icon_name: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'icon' as const,
    actions: ['drawIllustrationIcon'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Icon name',
      fr: 'Nom de l\'icÃ´ne'
    },
    tooltips: {
      en: 'Name of the icon to display',
      fr: 'Nom de l\'icÃ´ne Ã  afficher'
    }
  } satisfies AttributeConfig<string | undefined>,

  icon_color: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'icon' as const,
    actions: ['drawIllustrationIcon'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Icon color',
      fr: 'Couleur de l\'icÃ´ne'
    },
    tooltips: {
      en: 'Color of the icon',
      fr: 'Couleur de l\'icÃ´ne'
    }
  } satisfies AttributeConfig<string | undefined>,

  icon_visible: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'icon' as const,
    actions: ['drawIllustration'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Icon visible',
      fr: 'IcÃ´ne visible'
    },
    tooltips: {
      en: 'Display or hide the icon',
      fr: 'Afficher ou masquer l\'icÃ´ne'
    }
  } satisfies AttributeConfig<boolean>,

  icon_view_box: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'icon' as const,
    actions: ['drawIllustrationIcon'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Icon view box',
      fr: 'Zone de vue de l\'icÃ´ne'
    },
    tooltips: {
      en: 'SVG viewBox attribute for the icon',
      fr: 'Attribut viewBox SVG pour l\'icÃ´ne'
    }
  } satisfies AttributeConfig<string | undefined>,

  icon_color_sustainable: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'icon' as const,
    actions: ['drawIllustrationIcon'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Static icon color',
      fr: 'Couleur d\'icÃ´ne fixe'
    },
    tooltips: {
      en: 'Keep the icon color fixed regardless of filters',
      fr: 'Garder la couleur de l\'icÃ´ne fixe indépendamment des filtres'
    }
  } satisfies AttributeConfig<boolean>,

  // =================== OSP EXTENSIONS - FOREIGN OBJECT ===================
  has_fo: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'foreign_object' as const,
    actions: ['drawFO'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Has foreign object',
      fr: 'A un objet étranger'
    },
    tooltips: {
      en: 'Enable foreign object content for the node',
      fr: 'Activer le contenu d\'objet étranger pour le noeud'
    }
  } satisfies AttributeConfig<boolean>,

  is_fo_raw: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'foreign_object' as const,
    actions: ['drawFO'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Raw foreign object',
      fr: 'Objet étranger brut'
    },
    tooltips: {
      en: 'Use raw HTML content for foreign object',
      fr: 'Utiliser du contenu HTML brut pour l\'objet étranger'
    }
  } satisfies AttributeConfig<boolean>,

  fo_content: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'foreign_object' as const,
    actions: ['drawFO'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Foreign object content',
      fr: 'Contenu de l\'objet étranger'
    },
    tooltips: {
      en: 'HTML content for the foreign object',
      fr: 'Contenu HTML pour l\'objet étranger'
    }
  } satisfies AttributeConfig<string | undefined>,

  // =================== OSP EXTENSIONS - IMAGE ===================
  is_image: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'image' as const,
    actions: ['drawIllustration'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Is image',
      fr: 'Est une image'
    },
    tooltips: {
      en: 'Display the node as an image',
      fr: 'Afficher le noeud comme une image'
    }
  } satisfies AttributeConfig<boolean>,

  image_src: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'image' as const,
    actions: ['drawIllustrationImage'] as ActionType[],  // 🆕
    
    labels: {
      en: 'Image source',
      fr: 'Source de l\'image'
    },
    tooltips: {
      en: 'URL or path to the image source',
      fr: 'URL ou chemin vers la source de l\'image'
    }
  } satisfies AttributeConfig<string | undefined>,

  // =================== OSP EXTENSIONS - HYPERLINK ===================
  hyperlink: {
    default: undefined as string | undefined,
    type: (() => undefined) as (() => string | undefined),
    category: 'hyperlink' as const,
    actions: undefined, // Ajouté pour satisfaire le typage
    // Pas d'action car c'est utilisé lors du clic
    
    labels: {
      en: 'Hyperlink',
      fr: 'Lien hypertexte'
    },
    tooltips: {
      en: 'URL for the hyperlink associated with the node',
      fr: 'URL pour le lien hypertexte associé au noeud'
    }
  } satisfies AttributeConfig<string | undefined>
} as const

// ==================================================================================================
// GéNéRATEUR AUTOMATIQUE DE SETTERS
// ==================================================================================================

export class NodeSetterGenerator {
  /**
   * GénÃ¨re automatiquement les setters pour une classe NodeElement
   * Override les propriétés héritées de NodeAttributeTypeScript
   */
  static generateSetters(instance: any) {
    (Object.keys(NODES_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      const config = NODES_ATTRIBUTES_CONFIG[key]
      
      Object.defineProperty(instance, key, {
        get: () => instance.getStyleProperty(key),
        set: (value: any) => {
          // 1. Setter personnalisé si défini
          //@ts-expect-error xxx
          if (config.setter && typeof instance[config.setter] === 'function') {
            //@ts-expect-error xxx
            instance[config.setter](value)
          } else {
            // 2. Setter standard
            instance._display.attributes[key] = value
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
          } else {
            // 5. Action par défaut si aucune action spécifiée
            if (typeof instance.update === 'function') {
              instance.update()
            }
          }
        },
        enumerable: true,
        configurable: true  // 🆕 Important pour pouvoir override !
      })
    })
  }
}

// Export des types générés automatiquement
export type AttributeKey = keyof typeof NODES_ATTRIBUTES_CONFIG
export type AttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof NODES_ATTRIBUTES_CONFIG[K]['type']>
}

// Helper pour obtenir la valeur par défaut d'un attribut
export function getDefaultValue<K extends AttributeKey>(key: K): AttributeTypes[K] {
  return NODES_ATTRIBUTES_CONFIG[key].default as AttributeTypes[K]
}

// Helper pour obtenir le label d'un attribut
export function getLabel(key: AttributeKey, lang: 'en' | 'fr'): string {
  return NODES_ATTRIBUTES_CONFIG[key].labels[lang]
}

// Helper pour obtenir le tooltip d'un attribut
export function getTooltip(key: AttributeKey, lang: 'en' | 'fr'): string {
  return NODES_ATTRIBUTES_CONFIG[key].tooltips[lang]
}

// Helper pour obtenir tous les attributs d'une catégorie
export function getAttributesByCategory(category: string): AttributeKey[] {
  return Object.keys(NODES_ATTRIBUTES_CONFIG).filter(
    key => NODES_ATTRIBUTES_CONFIG[key as AttributeKey].category === category
  ) as AttributeKey[]
}

// Categories disponibles
export const AVAILABLE_CATEGORIES = [
  'shape',
  'name_label', 
  'value_label',
  'icon',
  'foreign_object',
  'image',
  'hyperlink'
] as const

export type CategoryType = typeof AVAILABLE_CATEGORIES[number]

// Génération automatique de l'interface pour toutes les propriétés
type INodeAttributesBase = {
  [K in AttributeKey]: AttributeTypes[K]
}
export abstract class NodeAttributeTypeScript implements INodeAttributesBase {
  // =================== DéCLARATIONS AUTOMATIQUES GéNéRéES ===================
  // Ces déclarations sont générées automatiquement à  partir de NODES_ATTRIBUTES_CONFIG
  
  // Shape attributes
  shape_visible!: AttributeTypes['shape_visible']
  orphan_node_visible!: AttributeTypes['orphan_node_visible']
  shape_type!: AttributeTypes['shape_type']
  shape_arrow_angle_factor!: AttributeTypes['shape_arrow_angle_factor']
  shape_arrow_angle_direction!: AttributeTypes['shape_arrow_angle_direction']
  shape_min_width!: AttributeTypes['shape_min_width']
  shape_min_height!: AttributeTypes['shape_min_height']
  shape_color!: AttributeTypes['shape_color']
  shape_opacity!: AttributeTypes['shape_opacity']
  shape_color_sustainable!: AttributeTypes['shape_color_sustainable']

  // Name label attributes
  name_label_is_visible!: AttributeTypes['name_label_is_visible']
  name_label_font_family!: AttributeTypes['name_label_font_family']
  name_label_font_size!: AttributeTypes['name_label_font_size']
  name_label_uppercase!: AttributeTypes['name_label_uppercase']
  name_label_bold!: AttributeTypes['name_label_bold']
  name_label_italic!: AttributeTypes['name_label_italic']
  name_label_color!: AttributeTypes['name_label_color']
  name_label_horiz!: AttributeTypes['name_label_horiz']
  name_label_vert!: AttributeTypes['name_label_vert']
  name_label_background!: AttributeTypes['name_label_background']
  name_label_background_color!: AttributeTypes['name_label_background_color']
  name_label_horiz_shift!: AttributeTypes['name_label_horiz_shift']
  name_label_vert_shift!: AttributeTypes['name_label_vert_shift']
  name_label_box_width!: AttributeTypes['name_label_box_width']
  name_label_separator!: AttributeTypes['name_label_separator']
  name_label_separator_part!: AttributeTypes['name_label_separator_part']

  // Value label attributes
  value_label_is_visible!: AttributeTypes['value_label_is_visible']
  value_label_font_family!: AttributeTypes['value_label_font_family']
  value_label_font_size!: AttributeTypes['value_label_font_size']
  value_label_uppercase!: AttributeTypes['value_label_uppercase']
  value_label_bold!: AttributeTypes['value_label_bold']
  value_label_italic!: AttributeTypes['value_label_italic']
  value_label_color!: AttributeTypes['value_label_color']
  value_label_horiz!: AttributeTypes['value_label_horiz']
  value_label_vert!: AttributeTypes['value_label_vert']
  value_label_background!: AttributeTypes['value_label_background']
  value_label_background_color!: AttributeTypes['value_label_background_color']
  value_label_horiz_shift!: AttributeTypes['value_label_horiz_shift']
  value_label_vert_shift!: AttributeTypes['value_label_vert_shift']
  value_label_box_width!: AttributeTypes['value_label_box_width']
  value_label_scientific_notation!: AttributeTypes['value_label_scientific_notation']
  value_label_significant_digits!: AttributeTypes['value_label_significant_digits']
  value_label_nb_significant_digits!: AttributeTypes['value_label_nb_significant_digits']
  value_label_custom_digit!: AttributeTypes['value_label_custom_digit']
  value_label_nb_digit!: AttributeTypes['value_label_nb_digit']
  value_label_unit_type!: AttributeTypes['value_label_unit_type']
  value_label_unit_visible!: AttributeTypes['value_label_unit_visible']
  value_label_unit!: AttributeTypes['value_label_unit']
  value_label_unit_factor!: AttributeTypes['value_label_unit_factor']

  //Icon attributes
  icon_name!: AttributeTypes['icon_name']
  icon_color!: AttributeTypes['icon_color']
  icon_visible!: AttributeTypes['icon_visible']
  icon_view_box!: AttributeTypes['icon_view_box']
  icon_color_sustainable!: AttributeTypes['icon_color_sustainable']

  //Foreign Object attributes
  has_fo!: AttributeTypes['has_fo']
  is_fo_raw!: AttributeTypes['is_fo_raw']
  fo_content!: AttributeTypes['fo_content']

  //Image attributes
  is_image!: AttributeTypes['is_image']
  image_src!: AttributeTypes['image_src']

  // OSP Extensions - Hyperlink attribute
  hyperlink!: AttributeTypes['hyperlink']
}