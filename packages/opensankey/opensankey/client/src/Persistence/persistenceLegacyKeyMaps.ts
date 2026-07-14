// #246 — Tables de renommage des clés JSON legacy (0.91 → 0.92), source unique.
//
// Ces migrations sont les seules du lot qui soient de PURES traductions de clés : « la clé `curved`
// du fichier alimente l'attribut `shape_is_curved` ». Elles étaient recopiées à l'identique dans
// trois classes de persistance (flux, nœud, style) — la table du style étant une fusion des deux
// autres, avec les doublons commentés à la main. D'où ce module : une table par nature d'élément,
// composée de blocs partagés, pour qu'un renommage se corrige à UN seul endroit.
//
// Ce que le module NE fait PAS : appliquer les valeurs. Chaque classe garde sa propre boucle
// d'application, car elles ne se valent pas — le style écrit dans `_storage` en comparant au style
// par défaut, le nœud et le cadre comparent à la valeur courante de l'élément, le flux écrit sans
// comparer. Unifier ces boucles changerait le RÉSULTAT des chargements : ce n'est pas un
// déplacement de code, et ça sort de #246.
//
// ATTENTION — trois clés legacy n'ont pas le même sens selon l'élément qui les porte :
//
//   clé legacy             sur un FLUX                        sur un NŒUD
//   ---------------------- ---------------------------------- ---------------------------------
//   label_visible          value_label_is_visible             name_label_is_visible
//   font_family            value_label_font_family            name_label_font_family
//   scientific_precision   value_label_nb_significant_digits  value_label_significant_digits
//
// Un flux dont `font_family` atterrirait sur `name_label_font_family` perdrait silencieusement la
// police de son étiquette de valeur. C'est pourquoi il n'y a PAS de table unique : les blocs
// d'étiquette sont séparés (LINK_LABEL / NODE_LABEL) et composés par nature d'élément.
//
// Le cas du STYLE est ambigu par construction : Class_ElementStyle sert AUSSI BIEN aux styles de
// nœud qu'aux styles de flux, et une table ne peut porter qu'un sens par clé. Le comportement
// HISTORIQUE (celui que figent les goldens du corpus) tranche ainsi : sens NŒUD pour
// `label_visible`/`font_family`, sens FLUX pour `scientific_precision`. C'est incohérent pour un
// style de flux — mais le corriger changerait le chargement de fichiers existants ; ce serait une
// décision produit, pas un refactor. La bizarrerie est donc conservée telle quelle, et nommée.

import { ALL_ATTRIBUTES_CONFIG } from '../Elements/ElementsAttributesConfig'

export type Type_LegacyKeyMap = { [legacy_key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG }

/** Forme et géométrie — même sens pour tous les éléments. */
const SHAPE_KEYS: Type_LegacyKeyMap = {
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
  'color': 'shape_color',
  'color_rule': 'shape_color_rule',
  'opacity': 'shape_opacity'
}

/** Étiquette de VALEUR — clés au sens identique partout (les 3 ambiguës sont hors de ce bloc). */
const VALUE_LABEL_KEYS: Type_LegacyKeyMap = {
  'label_font_size': 'value_label_font_size',
  'text_color': 'value_label_color',
  'label_position': 'value_label_horiz',
  'orthogonal_label_position': 'value_label_vert',
  'label_on_path': 'value_label_on_path',
  'label_pos_auto': 'value_label_pos_auto',
  'custom_digit': 'value_label_custom_digit',
  'nb_digit': 'value_label_nb_digit',
  'label_unit_visible': 'value_label_unit_visible',
  'label_unit': 'value_label_unit',
  'label_unit_factor': 'value_label_unit_factor'
}

/** Étiquette de NOM — clés au sens identique partout. */
const NAME_LABEL_KEYS: Type_LegacyKeyMap = {
  'font_size': 'name_label_font_size',
  'uppercase': 'name_label_uppercase',
  'bold': 'name_label_bold',
  'italic': 'name_label_italic',
  'label_color': 'name_label_color',
  'label_horiz': 'name_label_horiz',
  'label_vert': 'name_label_vert'
}

/**
 * FLUX (bloc `local`). Sur un flux, les clés ambiguës visent l'étiquette de VALEUR : c'est elle qui
 * porte l'information affichée sur le tracé.
 */
export const LINK_LOCAL_KEY_MAP: Type_LegacyKeyMap = {
  ...SHAPE_KEYS,
  'dashed': 'shape_is_dashed',
  ...VALUE_LABEL_KEYS,
  ...NAME_LABEL_KEYS,
  // Ambiguës — sens FLUX
  'label_visible': 'value_label_is_visible',
  'font_family': 'value_label_font_family',
  'to_precision': 'value_label_scientific_notation',
  'scientific_precision': 'value_label_nb_significant_digits'
}

/**
 * NŒUD (bloc `local`). Sur un nœud, les clés ambiguës visent l'étiquette de NOM, et la valeur a ses
 * propres clés (`show_value`, `value_font_size`, `label_*_valeur`).
 */
export const NODE_LOCAL_KEY_MAP: Type_LegacyKeyMap = {
  ...NAME_LABEL_KEYS,
  // Ambiguës — sens NŒUD
  'label_visible': 'name_label_is_visible',
  'font_family': 'name_label_font_family',
  'scientific_precision': 'value_label_significant_digits',
  // Étiquette de nom, spécifique nœud
  'label_background': 'name_label_background_visible',
  'label_background_color': 'name_label_background_color',
  'label_box_width': 'name_label_box_width',
  // Étiquette de valeur, spécifique nœud
  'show_value': 'value_label_is_visible',
  'value_font_size': 'value_label_font_size',
  'label_horiz_valeur': 'value_label_horiz',
  'label_vert_valeur': 'value_label_vert',
  'nb_scientific_precision': 'value_label_nb_significant_digits',
  'custom_digit': 'value_label_custom_digit',
  'nb_digit': 'value_label_nb_digit',
  'label_unit_visible': 'value_label_unit_visible',
  'label_unit': 'value_label_unit',
  'label_unit_factor': 'value_label_unit_factor',
  // Forme, spécifique nœud
  'shape': 'shape_type',
  'node_width': 'shape_min_width',
  'node_height': 'shape_min_height',
  'color': 'shape_color',
  'opacity': 'shape_opacity',
  'colorSustainable': 'shape_color_sustainable'
}

/** NŒUD (racine du JSON) : l'icône, portée hors du bloc `local`. */
export const NODE_ICON_KEY_MAP: Type_LegacyKeyMap = {
  'iconName': 'icon_icon_name',
  'iconColor': 'icon_color',
  'iconVisible': 'icon_is_visible',
  'iconViewBox': 'icon_view_box',
  'iconColorSustainable': 'icon_color_sustainable',
  'is_image': 'icon_is_image',
  'image_src': 'icon_image_src'
}

/** CADRE / zone de texte. */
export const CONTAINER_KEY_MAP: Type_LegacyKeyMap = {
  'label_height': 'shape_min_height',
  'label_width': 'shape_min_width',
  'content': 'name_label_fo_content'
}

/**
 * STYLE. Une seule classe (Class_ElementStyle) sert les styles de nœud ET de flux : la table ne
 * peut porter qu'un sens par clé ambiguë. On FIGE le tranchage historique (sens nœud pour
 * `label_visible`/`font_family`, sens flux pour `scientific_precision`), quitte à ce qu'il soit
 * incohérent pour un style de flux — le corriger changerait le chargement de fichiers existants.
 * Les clés `dashed` et `thickness` visent ici la BORDURE (et non le tracé, comme sur un flux).
 */
export const STYLE_KEY_MAP: Type_LegacyKeyMap = {
  ...SHAPE_KEYS,
  ...VALUE_LABEL_KEYS,
  ...NAME_LABEL_KEYS,
  // Ambiguës — tranchage historique
  'label_visible': 'name_label_is_visible',
  'font_family': 'name_label_font_family',
  'scientific_precision': 'value_label_nb_significant_digits',
  // Étiquette de nom
  'label_background': 'name_label_background_visible',
  'label_background_color': 'name_label_background_color',
  'label_box_width': 'name_label_box_width',
  // Étiquette de valeur
  'show_value': 'value_label_is_visible',
  'value_font_size': 'value_label_font_size',
  'label_horiz_valeur': 'value_label_horiz',
  'label_vert_valeur': 'value_label_vert',
  'value_label_background': 'value_label_background_color_visible',
  // Forme
  'shape': 'shape_type',
  'node_width': 'shape_min_width',
  'node_height': 'shape_min_height',
  'colorSustainable': 'shape_color_sustainable',
  'dashed': 'shape_border_dashed',
  'thickness': 'shape_border_thickness'
}
