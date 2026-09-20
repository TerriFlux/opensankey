import { ALL_ATTRIBUTES_CONFIG, ExtractConfigValue, default_element_color } from './ElementsAttributesConfig'
// os#1458 — le TYPE seul : `Class_ElementStyle` vit dans `Element.tsx`, qui importe deja ce
// module. Un import de VALEUR refermerait le cycle que `elementInitCycle.test.ts` garde ; un
// import de type est efface a la compilation et n en cree aucun.
import type { Class_ElementStyle } from './Element'


type ElementStyleConfig = Partial<{
  [K in keyof typeof ALL_ATTRIBUTES_CONFIG]: ExtractConfigValue<typeof ALL_ATTRIBUTES_CONFIG[K]>
}>

interface ElementStyleConfigItem {
  name: string,
  config: ElementStyleConfig
}

// Définir toutes les clés de styles comme constantes
export const NodeStyle = 'NodeStyle' as const
export const LinkStyle = 'LinkStyle' as const
export const ContainerStyle = 'ContainerStyle' as const
export const NodeContainerStyle = 'NodeContainerStyle' as const
export const NodeLeftExtremityStyle = 'NodeLeftExtremityStyle' as const
export const NodeRightExtremityStyle = 'NodeRightExtremityStyle' as const
export const NodeProductStyle = 'NodeProductStyle' as const
export const NodeSectorStyle = 'NodeSectorStyle' as const
export const NodeImportExportCloseStyle = 'NodeImportExportCloseStyle' as const
export const NodeImportCloseStyle = 'NodeImportCloseStyle' as const
export const NodeExportCloseStyle = 'NodeExportCloseStyle' as const
export const NodeImportExportAboveBelowStyle = 'NodeImportExportAboveBelowStyle' as const
export const NodeImportAboveStyle = 'NodeImportAboveStyle' as const
export const NodeExportBelowStyle = 'NodeExportBelowStyle' as const
export const LinkImportExportCloseStyle = 'LinkImportExportCloseStyle' as const
export const LinkImportCloseStyle = 'LinkImportCloseStyle' as const
export const LinkExportCloseStyle = 'LinkExportCloseStyle' as const
export const LinkImportExportAboveBelowStyle = 'LinkImportExportAboveBelowStyle' as const
export const NodeUnitaryStyle = 'NodeUnitaryStyle' as const
export const SankeyUnitaryNodeStyle = 'SankeyUnitaryNodeStyle' as const
export const SankeyUnitaryNodeInputStyle = 'SankeyUnitaryNodeInputStyle' as const
export const SankeyUnitaryNodeOutputStyle = 'SankeyUnitaryNodeOutputStyle' as const
export const LinkInUnitaryStyle = 'LinkInUnitaryStyle' as const
export const LinkOutUnitaryStyle = 'LinkOutUnitaryStyle' as const
export const FigurePartStyle = 'FigurePartStyle' as const

// Type union de toutes les clés
export type ElementStyleKey =
  | typeof NodeStyle
  | typeof LinkStyle
  | typeof ContainerStyle
  | typeof NodeContainerStyle
  | typeof NodeLeftExtremityStyle
  | typeof NodeRightExtremityStyle
  | typeof NodeProductStyle
  | typeof NodeSectorStyle
  | typeof NodeImportExportCloseStyle
  | typeof NodeImportCloseStyle
  | typeof NodeExportCloseStyle
  | typeof NodeImportExportAboveBelowStyle
  | typeof NodeImportAboveStyle
  | typeof NodeExportBelowStyle
  | typeof LinkImportExportCloseStyle
  | typeof LinkImportCloseStyle
  | typeof LinkExportCloseStyle
  | typeof LinkImportExportAboveBelowStyle
  | typeof NodeUnitaryStyle
  | typeof SankeyUnitaryNodeStyle
  | typeof SankeyUnitaryNodeInputStyle
  | typeof SankeyUnitaryNodeOutputStyle
  | typeof LinkInUnitaryStyle
  | typeof LinkOutUnitaryStyle
  | typeof FigurePartStyle

export type ElementStyleConfigsDict = Record<ElementStyleKey, ElementStyleConfigItem>
export const elementStyleConfigs = {} as ElementStyleConfigsDict

elementStyleConfigs[NodeStyle] = {
  name: 'ElementStyle.NodeStyle',
  config: {
    'name_label_is_visible': true,
  }
}

elementStyleConfigs[LinkStyle] = {
  name: 'ElementStyle.LinkStyle',
  config: {
    'name_label_background_visible': false,
    'name_label_vert': 'top',
    'name_label_font_size': 20,
    'value_label_is_visible': true,
    'value_label_vert': 'middle',
    'value_label_font_size': 20,
    'value_label_box_width': 300
  }
}

elementStyleConfigs[ContainerStyle] = {
  name: 'ElementStyle.ContainerStyle',
  config: {
    'name_label_is_visible': true,
    'name_label_inside_vert': true,
    'name_label_vert': 'top',
    'shape_color': 'white',
    'shape_border_visible': true,
    'shape_border_radius': 5,
    'value_label_is_visible': false,
    'shape_min_height': 100,
    'shape_min_width': 100
  }
}

elementStyleConfigs[NodeContainerStyle] = {
  name: 'ElementStyle.NodeContainerStyle',
  config: {
    'shape_type': 'rect',
    'shape_color_visible': false,
    'shape_border_visible': true,
    'shape_border_color': 'black',
    'shape_border_thickness': 2,
    'shape_border_dashed': true,
    'shape_border_radius': 10,
    'name_label_is_visible': true,
    'name_label_horiz': 'middle',
    'name_label_vert': 'top',
    'name_label_inside_horiz': false,
    'name_label_inside_vert': false,
    'name_label_bold': true,
    'value_label_is_visible': false,
    'shape_margin_top': 10,
    'shape_margin_bottom': 10,
    'shape_margin_left': 5,
    'shape_margin_right': 5
  }
}

elementStyleConfigs[NodeLeftExtremityStyle] = {
  name: 'ElementStyle.NodeLeftExtremityStyle',
  config: {
    'name_label_horiz': 'left',
    'name_label_vert': 'middle'
  }
}

elementStyleConfigs[NodeRightExtremityStyle] = {
  name: 'ElementStyle.NodeRightExtremityStyle',
  config: {
    'name_label_horiz': 'right',
    'name_label_vert': 'middle'
  }
}

elementStyleConfigs[NodeProductStyle] = {
  name: 'ElementStyle.NodeProductStyle',
  config: { 'shape_type': 'ellipse' }
}

elementStyleConfigs[NodeSectorStyle] = {
  name: 'ElementStyle.NodeSectorStyle',
  config: { 'shape_type': 'rect' }
}

elementStyleConfigs[NodeImportExportCloseStyle] = {
  name: 'ElementStyle.NodeImportExportCloseStyle',
  config: {
    'name_label_is_visible': false,
    'shape_visible': false,
    'shape_min_width': 1,
    'name_label_box_width': 300,
    'name_label_separator': '',
    'name_label_separator_part': 'before',
    'shape_position_type': 'relative',
    'shape_position_dy': 20,
  }
}

elementStyleConfigs[NodeImportCloseStyle] = {
  name: 'ElementStyle.NodeImportCloseStyle',
  config: {
    'shape_position_dx': -100,
    'shape_position_dy': -50
  }
}

elementStyleConfigs[NodeExportCloseStyle] = {
  name: 'ElementStyle.NodeExportCloseStyle',
  config: {
    'name_label_vert': 'bottom',
    'shape_position_dx': 100,
    'shape_position_dy': 50,
    'shape_orientation': 'hv',
    'shape_starting_tangeant': 0.25,
    'shape_ending_tangeant': 1
  }
}

elementStyleConfigs[NodeImportExportAboveBelowStyle] = {
  name: 'ElementStyle.NodeImportExportAboveBelowStyle',
  config: {
    'shape_min_width': 40,
    'name_label_is_visible': true,
    'shape_visible': false,
    'shape_min_height': 1,
    'value_label_is_visible': true,
    'value_label_vert': 'middle',
    'name_label_vert': 'middle',
    'name_label_separator': '',
    'shape_position_type': 'parametric'
  }
}

elementStyleConfigs[NodeImportAboveStyle] = {
  name: 'ElementStyle.NodeImportAboveStyle',
  config: {
    'name_label_horiz': 'left',
    'value_label_horiz': 'left',
    'value_label_horiz_shift': 40,
    'shape_position_dx': -200,
    'shape_position_dy': 20,
    'shape_orientation': 'vh',
    'shape_starting_tangeant': 1,
    'shape_ending_tangeant': 0.25
  }
}

elementStyleConfigs[NodeExportBelowStyle] = {
  name: 'ElementStyle.NodeExportBelowStyle',
  config: {
    'name_label_horiz': 'right',
    'value_label_horiz': 'right',
    'value_label_horiz_shift': -40,
    'shape_position_dx': 200,
    'shape_position_dy': 20
  }
}

elementStyleConfigs[LinkImportExportCloseStyle] = {
  name: 'ElementStyle.LinkImportExportCloseStyle',
  config: {
    'value_label_is_visible': false,
  }
}

elementStyleConfigs[LinkImportCloseStyle] = {
  name: 'ElementStyle.LinkImportCloseStyle',
  config: {
    // Ne pas reintroduire 'shape_is_arrow': false : le flux d'import garde la pointe
    // par defaut (is_arrow), comme son symetrique LinkExportCloseStyle.
    'shape_orientation': 'vh',
    'shape_ending_tangeant': 1
  }
}

elementStyleConfigs[LinkExportCloseStyle] = {
  name: 'ElementStyle.LinkExportCloseStyle',
  config: {
    'shape_orientation': 'hv',
    'shape_starting_tangeant': 1
  }
}

elementStyleConfigs[LinkImportExportAboveBelowStyle] = {
  name: 'ElementStyle.LinkImportExportAboveBelowStyle',
  config: {
    'shape_starting_curve': 0.25,
    'shape_starting_tangeant': 0.50,
    'shape_ending_tangeant': 0.50,
    'shape_ending_curve': 0.25,
    'value_label_is_visible': false,
    'value_label_on_path': true
  }
}

elementStyleConfigs[SankeyUnitaryNodeStyle] = {
  name: 'ElementStyle.SankeyUnitaryNodeStyle',
  config: {
    name_label_text_align: 'middle',
    name_label_horiz: 'middle',
    name_label_vert: 'bottom',
    name_label_font_size: 20,

    // Couleur figée par le style unitaire : on force shape_color_sustainable pour
    // que getShapeColorToUse() retourne shape_color en ignorant la colormap des
    // tags. Combiné au resetAttributes() de updateUnitaryStyles (qui vide les
    // overrides locaux), le board unitaire affiche toujours la même couleur.
    shape_color: default_element_color,
    shape_color_sustainable: true,

    // Pas de valeur sur le nœud : les valeurs s'affichent sur les flux. Sans ça, si
    // le style de base du modèle (conservé par removeAllStyles) active la valeur,
    // elle réapparaît sur les nœuds du board unitaire.
    value_label_is_visible: false,

    shape_min_width: 100,
    shape_color_visible: false,
    shape_border_visible: true,
    shape_border_color: 'black',
    shape_border_thickness: 3,
    shape_border_dashed: true,
    name_label_bold: true,
    name_label_uppercase: true,
    name_label_box_width: 150,
    name_label_background_visible: false,

    shape_position_dx: 250
  }
}

elementStyleConfigs[SankeyUnitaryNodeInputStyle] = {
  name: 'ElementStyle.SankeyUnitaryNodeInputStyle',
  config: {
    name_label_horiz: 'left',
    name_label_vert: 'middle',
    name_label_text_align: 'right',
    name_label_font_size: 20,
    shape_color: default_element_color,
    shape_color_sustainable: true,
    value_label_is_visible: false,
    shape_min_width: 1,
    shape_min_height: 1,
    shape_visible: false,
    name_label_box_width: 150,
    shape_position_dx: 250,
    shape_position_dy: 25
  }
}

elementStyleConfigs[SankeyUnitaryNodeOutputStyle] = {
  name: 'ElementStyle.SankeyUnitaryNodeOutputStyle',
  config: {
    name_label_horiz: 'right',
    name_label_vert: 'middle',
    name_label_font_size: 20,
    shape_color: default_element_color,
    shape_color_sustainable: true,
    value_label_is_visible: false,
    shape_min_width: 1,
    shape_min_height: 1,
    shape_visible: false,
    name_label_box_width: 150,
    shape_position_dx: 250,
    shape_position_dy: 25
  }
} as const

elementStyleConfigs[LinkInUnitaryStyle] = {
  name: 'ElementStyle.LinkInUnitaryStyle',
  config: {
    shape_orientation: 'hh',
    // Couleur reprise du nœud (uniforme via SankeyUnitaryNode*Style) plutôt que de
    // la colormap des tags : évite que le flux ressorte d'une couleur de tag.
    shape_color_rule: 'source',
    shape_is_arrow: false,
    // Style auto-contenu : le socle 'default' étant remis à l'usine pour le board
    // unitaire (value_label masquée par défaut), c'est au style de flux d'activer
    // l'affichage du % sur chaque flux.
    value_label_is_visible: true,
    // Pas de nom de flux sur le board unitaire (le défaut usine de name_label est
    // visible=true) : on n'y affiche que le %.
    name_label_is_visible: false,
    value_label_color: 'black',
    value_label_font_size: 20,
    value_label_bold: true,
    value_label_horiz: 'left',
    value_label_vert: 'middle',
    value_label_on_path: false,
    value_label_pos_auto: false,
    value_label_unit_visible: true,
    value_label_unit_type: '%ID',
    value_label_significant_digits: true,
    value_label_nb_significant_digits: 3,
    value_label_scientific_notation: false,
    value_label_background_visible: true,
    value_label_background_color_visible: true,
    value_label_background_color: 'white',
    value_label_custom_digit: true,
    value_label_nb_digit: 0
  }
} as const

elementStyleConfigs[LinkOutUnitaryStyle] = {
  name: 'ElementStyle.LinkOutUnitaryStyle',
  config: {
    shape_orientation: 'hh',
    // Couleur reprise du nœud (uniforme via SankeyUnitaryNode*Style) plutôt que de
    // la colormap des tags : évite que le flux ressorte d'une couleur de tag.
    shape_color_rule: 'source',
    // Style auto-contenu : le socle 'default' étant remis à l'usine pour le board
    // unitaire (value_label masquée par défaut), c'est au style de flux d'activer
    // l'affichage du % sur chaque flux.
    value_label_is_visible: true,
    // Pas de nom de flux sur le board unitaire (le défaut usine de name_label est
    // visible=true) : on n'y affiche que le %.
    name_label_is_visible: false,
    value_label_font_size: 20,
    value_label_color: 'black',
    value_label_bold: true,
    value_label_horiz: 'right',
    value_label_vert: 'middle',
    value_label_on_path: false,
    value_label_pos_auto: false,
    value_label_unit_visible: true,
    value_label_unit_type: '%OS',
    value_label_significant_digits: true,
    value_label_scientific_notation: false,
    value_label_nb_significant_digits: 3,
    value_label_background_visible: true,
    value_label_background_color_visible: true,
    value_label_background_color: 'white',
    value_label_custom_digit: true,
    value_label_nb_digit: 0
  }
} as const


// os#1448 — LE STYLE DES PARTS D'UNE FIGURE : « pour éditer globalement on le fait par les styles »
// (Julien, 20/09). Une part de couronne ou de barre est un élément
// (`Representations/parts/PartElement`) ; sans un style à elle, l'onglet Styles de l'inspecteur
// n'avait rien à régler et il fallait lui laisser une seconde barre d'onglets.
//
// CE QUE CETTE AMORCE PORTE, ET RIEN D'AUTRE : les valeurs d'usine D'UNE FIGURE là où elles
// diffèrent de celles d'un nœud. C'est la même doctrine que `Representations/sunburstAttributes`
// (« elle ne dit que ce en quoi une clé diffère chez elle ») et la même que les cinq styles
// unitaires : neuf clés déclarées, pas un instantané du style par défaut.
//
// ⚠️ NE PAS SEMER CE STYLE PAR `copyFrom(default_style)`. Un style interne n'est PAS pré-rempli
// (cf. `Class_ElementStyle`, branche `is_deletable`) : son sac ne contient que ces neuf clés, et
// tout le reste — polices, couleurs, encadrés — se résout par la cascade
// `élément → styles → sankey.default_style`. Copier le style par défaut figerait chaque clé et
// l'inspecteur montrerait un liséré de surcharge partout.
//
// ET CETTE AMORCE NE PEUT PAS CHANGER L'ASPECT D'UNE COURONNE ENREGISTRÉE, par construction : le
// tracé n'écoute une part que sur ce qu'elle DIT (`isAttributeOverloaded`, cf.
// `Charts/SunburstChart.sunburstPartStyle`), et `Class_PartElement` ne tient pour « dit » que ce
// qu'un style de part porte AU-DELÀ de son amorce (cf. `Representations/parts/partStyle`). Les
// neuf valeurs ci-dessous sont donc muettes tant que personne ne les touche ; elles ne servent
// qu'à l'ŒIL — que l'inspecteur montre dix points et un liséré blanc, c'est-à-dire ce que la
// figure dessine vraiment, et non les quatorze points d'un nœud.
elementStyleConfigs[FigurePartStyle] = {
  name: 'ElementStyle.FigurePartStyle',
  config: {
    // Forme : une part est opaque et cernée de blanc — les anneaux se séparent par un vide clair,
    // là où un nœud est translucide et cerné de noir.
    shape_opacity: 1,
    shape_border_visible: true,
    shape_border_color: '#ffffff',

    // Libellé : dix points, et « là où ça tient » plutôt que « toujours » — une part trop étroite
    // ne porte pas son nom, alors qu'un nœud garde le sien quoi qu'il arrive.
    name_label_font_size: 10,
    name_label_prune_if_unfitting: true,

    // Valeur : quatre chiffres significatifs, et pas d'arrondi à deux décimales — une figure
    // compare des ordres de grandeur, un nœud affiche une quantité.
    value_label_significant_digits: true,
    value_label_nb_significant_digits: 4,
    value_label_custom_digit: false,
    value_label_nb_digit: 0
  }
} as const

export const base_styles: readonly ElementStyleKey[] = [NodeStyle, LinkStyle, ContainerStyle, NodeContainerStyle, NodeLeftExtremityStyle, NodeRightExtremityStyle] as const
// Styles STRUCTURELS : (re)attachés à la construction de l'élément selon son type
// (NodeStyle->Node, LinkStyle->Link, ContainerStyle->TextZone). Eux seuls ne sont pas
// persistés (sinon accumulation au round-trip, SA#230).
// À NE PAS confondre avec base_styles, qui inclut en plus les styles d'extrémité ET
// NodeContainerStyle : ceux-ci sont appliqués par une ACTION (utilisateur, autolayout, ou
// passage en mode englobant), jamais à la construction, donc doivent être persistés
// (régression SA#232 : extrémités perdues au chargement).
// NodeContainerStyle en particulier n'est posé que par NodeDimension.setContainerMode(),
// c.-à-d. pour un parent de dimension englobante. Un nœud-cadre purement esthétique (aucune
// dimension enfant, style posé à la main) n'a donc AUCUN chemin de réattache : le filtrer
// le perdait au chargement — fond de forme redevenu visible, bord pointillé disparu — et,
// le filtre agissant aussi à l'écriture, la référence disparaissait définitivement du
// fichier au premier réenregistrement.
export const structural_styles: readonly ElementStyleKey[] = [NodeStyle, LinkStyle, ContainerStyle] as const
export const product_sector_styles: readonly ElementStyleKey[] = [NodeProductStyle, NodeSectorStyle] as const
export const node_exchanges_style: readonly ElementStyleKey[] = [
  NodeExportBelowStyle, NodeExportCloseStyle, NodeImportAboveStyle, NodeImportCloseStyle,
  NodeImportExportAboveBelowStyle, NodeImportExportCloseStyle, LinkImportExportAboveBelowStyle,
  LinkImportExportCloseStyle, LinkImportCloseStyle, LinkExportCloseStyle
] as const
export const node_unitary_styles: readonly ElementStyleKey[] = [
  SankeyUnitaryNodeOutputStyle, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeStyle,
  LinkInUnitaryStyle, LinkOutUnitaryStyle
] as const
// os#1448 — les styles que le document de parts d'une figure crée. Une liste d'un seul élément
// aujourd'hui : les barres ajouteront le leur quand elles auront leurs parts, et le geste de semis
// (`Representations/parts/partStyle.seedPartStyles`) n'aura pas à changer.
export const figure_part_styles: readonly ElementStyleKey[] = [FigurePartStyle] as const

// ── L'HÔTE DE STYLES ─────────────────────────────────────────────────────────────────────────
//
// os#1458 — CE QUI DÉTIENT UNE FAMILLE DE STYLES NOMMÉS.
//
// Julien : « un nœud, un flux, une ZDT, une part sont des éléments avec des attributs, et ces
// attributs peuvent être gérés par une cascade de styles ; ce mécanisme doit être général. Et le
// graphe a aussi des attributs, et je crois qu'on pourra dire aussi que le workspace a des
// attributs. » Puis : « normalement, avec la factorisation, tout devient simple. »
//
// L'INVENTAIRE A MONTRÉ QUE LE MÉCANISME EXISTE DÉJÀ DEUX FOIS, et qu'il est le même : une figure
// porte sa surcharge propre et ses styles nommés comme un élément, et résout par la MÊME cascade
// (`Class_ProtoElement.getElementProperty`, cf. l'en-tête de `Representations/Figure.ts`). Ce qui
// n'était pas général, ce sont deux choses seulement :
//  - OÙ vivent les styles : `Class_Sankey._styles` d'un côté, `Class_FigureNature._styles` de
//    l'autre ;
//  - l'INTERFACE : l'éditeur de styles (famille, liste, « + », renommage) sait déjà recevoir ses
//    attributs et ses catégories en paramètre, mais lisait `sankey.styles_list` EN DUR.
//
// Cette interface-ci est la couture. Elle ne décrit rien de neuf : c'est très exactement ce que
// l'éditeur consommait déjà du Sankey, nommé. `Class_Sankey` la satisfait sans une ligne de plus ;
// la nature d'une figure la satisfera au lot suivant ; l'espace de travail le jour où ses réglages
// deviendront des attributs.
//
// LE CRITÈRE DE RÉUSSITE EST SOUSTRACTIF : une nature de plus ne doit coûter AUCUNE ligne
// d'interface. Si on se met à écrire des `if` par nature, la factorisation n'a pas eu lieu.

export interface Type_StyleHost {
  /** Les styles de la famille, dans l'ordre d'affichage. */
  readonly styles_list: Class_ElementStyle[]
  /** Les mêmes, par identifiant. */
  readonly styles_dict: { [id: string]: Class_ElementStyle }
  /** Crée un style vide, nommé par défaut, et le rend. */
  addNewDefaultElementStyle(): Class_ElementStyle
  /** Retire un style de la famille ; ce qui le suivait retombe sur la cascade. */
  deleteElementStyle(style: Class_ElementStyle): void
  /**
   * Assigne ou retire ce style à ce que l'auteur a sélectionné.
   *
   * `targets` est la CIBLE EXPLICITE, et elle n'est pas une commodité : un Sankey connaît sa
   * sélection et la lit lui-même (c'est ce qu'il a toujours fait) ; une nature de figure, elle,
   * ne sait pas quelle figure est active — elle décrit une sorte, pas un objet à l'écran. Le seul
   * qui le sache est l'appelant, qui tient déjà la liste de ce qu'il édite.
   *
   * Absent : l'hôte se débrouille avec ce qu'il sait. C'est ce qui permet au Sankey de satisfaire
   * cette interface sans une ligne de plus.
   */
  switchElementStyle(style: Class_ElementStyle, add: boolean, targets?: unknown[]): void
  /** Rend au style ses valeurs d'usine, sans le supprimer. */
  resetAttrStyle(style: Class_ElementStyle): void
  /** Retire UNE clé posée sur ce style ; elle repasse à ce dont elle hérite. */
  deleteLocalAttrStyle(style: Class_ElementStyle, key: string): void
}
