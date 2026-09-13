// ==================================================================================================
// OS#1254 — partie PURE du générateur de légende : contenu (computeLegendItems),
// layout (layoutLegendItems) et texte d'échelle (computeScaleText).
//
// Module volontairement limité à legendIds comme dépendance : il est testable
// sans DOM et sans tirer le graphe d'imports du cœur (ElementsAttributesConfig
// → Element → ... est cyclique et ne supporte pas d'être chargé par cette
// porte d'entrée sous jest — cf. le même piège dans Element.copyAttrFrom.test).
// La partie modèle/DOM (Class_LegendConfig, regenerateLegend) vit dans
// LegendGenerator.ts, qui ré-exporte tout ce module.
// ==================================================================================================

import { LEGEND_CHILD_PREFIX } from './legendIds'
import { applyTemplate } from './LabelTemplate'

// ITEMS (pur) ========================================================================

export type Type_LegendItem = {
  id: string        // id complet du conteneur ('legend-...')
  text: string
  bold?: boolean
  // Pastille de couleur (entrée de tag) : la forme du conteneur sert de carré coloré
  swatch_color?: string
  // Référence au tag pour le survol → surbrillance (résolue au moment de l'événement)
  tag_group_id?: string
  tag_id?: string
  // Vrai en tête de groupe : en layout horizontal, force un retour à la ligne
  starts_group?: boolean
  // Vrai pour les items qui occupent leur propre ligne même en horizontal
  // (titres de groupe, lignes d'info, échelle...) — seules les entrées de tag
  // s'enchaînent sur une ligne.
  own_line?: boolean
  // Id du cadre de BLOC ('legend-block-<groupe>') qui regroupe le titre et les
  // entrées d'un même groupe de tags : déplacer le bloc déplace tout le groupe.
  block_id?: string
  // Échelle : la forme de la zone est un trait vertical fin dont la hauteur
  // matérialise l'échelle (ex-barre draggable de l'ancienne légende).
  scale_bar?: boolean
  // sa#532 — entrée de tag NON SÉLECTIONNÉ : l'étiquette existe dans le groupe mais
  // ses porteurs sont masqués. L'entrée est présente dans le MODÈLE pour que la
  // légende puisse un jour servir de porte de retour (clic = resélectionner) ;
  // c'est `renderableLegendItems` qui décide si elle est rendue, et le ticket qui
  // posera le clic qui décidera de SON aspect (grisé, barré...).
  dimmed?: boolean
}

// Hauteur de la barre d'échelle en px MONDE : le texte affiche scale/2 et
// scaleValueToPx projette [0, scale] sur [0, 100] px, donc la barre doit faire
// exactement 100/2 = 50 px monde pour matérialiser la valeur affichée — quelle
// que soit la police de la légende (et sans compensation de police, qui ne
// s'applique qu'aux textes, pas aux épaisseurs de flux).
export const SCALE_BAR_HEIGHT_PX = 50

// Drapeaux d'environnement calculés par l'appelant (certains viennent du DOM ou
// de l'état applicatif) pour garder computeLegendItems pur et testable.
export type Type_LegendEnv = {
  // Libellé « données collectées / calculées » (déjà traduit) ; undefined = pas de ligne
  data_type_label?: string
  // Le diagramme affiche des valeurs à intervalle (« * ») → ligne d'explication
  has_interval_values?: boolean
  // Libellés traduits
  t_free_value?: string
  t_dashed_links?: string
  t_scale?: string
}

// Sous-ensemble du modèle utilisé par le calcul du contenu (structurellement
// compatible avec Class_Sankey — permet un mock trivial dans les tests).
type Type_TagForLegend = {
  id: string, name: string, display_name: string, color: string,
  // sa#532 — état de sélection : une entrée de tag non sélectionné est émise
  // `dimmed` (cf. Type_LegendItem). Optionnel pour garder les mocks triviaux ;
  // absent = traité comme sélectionné (les listes `selected_tags_list` que les
  // tests passaient déjà ne portent que des tags sélectionnés).
  is_selected?: boolean,
  // OS#1314 — jeton {Unit} du gabarit d'entrée : unité référencée par le tag
  // (groupes « de type unité », registre d'unités OS#1286). Absent ailleurs.
  // `label` = ce qui est écrit sur le diagramme (Class_Unit.label : display_name
  // s'il est posé, sinon le symbole canonique). `name` reste la référence.
  resolved_unit?: { unit: { name: string, label: string } }
}
type Type_TagGroupForLegend = {
  id: string
  name: string
  // Mise en forme pilotée par le groupe — voir tagGroupCarriesFormatting().
  use_colors: boolean
  // #533 — terme à venir du prédicat « ce groupe porte une mise en forme » :
  // le socle de format (#537) posera sur les classes Proto un porteur de style
  // (`Type_StylePatch`) qui couvrira l'opacité, puis la bordure et la hachure.
  // Aucune classe ne l'expose aujourd'hui : le champ reste `undefined`, et le
  // prédicat se réduit donc EXACTEMENT à `use_colors`. Rien ne peut l'allumer
  // par accident — il n'est ni lu ni écrit par la persistance, et le
  // rétro-portage de `Legacy.tsx` (`backfillTagGroupUseColors`) ne dérive de
  // `show_legend` que `use_colors`.
  has_style_patch?: boolean
  selected_tags_list: Type_TagForLegend[]
  // sa#532 — TOUTES les étiquettes du groupe, sélectionnées ou non. Optionnel :
  // absent, le calcul retombe sur `selected_tags_list` (comportement d'avant
  // sa#532), ce qui garde les mocks des tests antérieurs valides.
  tags_list?: Type_TagForLegend[]
}
export type Type_SankeyForLegend = {
  node_taggs_list: Type_TagGroupForLegend[]
  flux_taggs_list: Type_TagGroupForLegend[]
  data_taggs_list: (Type_TagGroupForLegend & { is_unit?: boolean })[]
  // Syntaxe méthode (bivariante) : permet de passer les vrais éléments dont
  // hasGivenTag attend un Class_Tag, tout en gardant un mock trivial en test.
  visible_nodes_list: { hasGivenTag(t: Type_TagForLegend): boolean }[]
  visible_links_list: { hasGivenTag(t: Type_TagForLegend): boolean, valueCurrent?: number | null | undefined }[]
  // sa#532 — éléments du diagramme SANS le filtre de visibilité. Un tag non
  // sélectionné rend ses porteurs invisibles (Link.are_related_flux_tags_selected,
  // Node.are_related_node_tags_selected) : le chercher dans les listes `visible_*`
  // ne le trouverait JAMAIS, et aucune entrée atténuée ne serait produite. C'est
  // sur ces listes-ci qu'on vérifie qu'une étiquette désélectionnée a bien un
  // porteur (sinon c'est une étiquette morte du fichier, pas une porte de retour).
  nodes_list?: { hasGivenTag(t: Type_TagForLegend): boolean }[]
  links_list?: { hasGivenTag(t: Type_TagForLegend): boolean }[]
}

export type Type_LegendConfigValues = {
  masked: boolean
  managed: boolean
  police: number
  bg_border: boolean
  bg_color: string
  bg_opacity: number
  horizontal: boolean
  width: number
  display_scale: boolean
  scale_unit: string
  scale_ratio: number
  show_dataTags: boolean
  show_constraints: boolean
  show_data_type: boolean
  info_link_value_void: boolean
  // OS#1314 — gabarit du texte des ENTRÉES de tag (jetons {Name}, {Unit},
  // {Group}). Vide = comportement historique (le nom long du tag seul).
  entry_template: string
}

// Id stable et sûr pour un id HTML à partir d'un id de tag/groupe
function slug(s: string): string {
  return s.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
}

// Reprend les 6 lignes du tableau des contraintes de l'ancienne légende
// (drawInfoConstraintLink) sous forme de simples lignes de texte.
const CONSTRAINT_ROWS = [
  { symbol: '→↕ x%', description: '% ∑ entrées source' },
  { symbol: '↕→ %x', description: '% ∑ sorties source' },
  { symbol: 'x% ↕→', description: '% ∑ entrées destination' },
  { symbol: 'x% →↕', description: '% ∑ sorties destination' },
  { symbol: '↑→ x%', description: '% flux parent (source)' },
  { symbol: 'x% ↑→', description: '% flux parent (destination)' }
]

/**
 * OS#1314 — texte d'une entrée de tag : le nom long du tag (historique), ou le
 * gabarit d'entrée interpolé s'il est renseigné (« {Name} [{Unit}] », gabarit
 * d'entrée d'e!Sankey). Un jeton inconnu reste tel quel (cf. applyTemplate).
 */
export function legendEntryText(
  tag: Type_TagForLegend,
  tag_group: Type_TagGroupForLegend,
  entry_template: string
): string {
  if (!entry_template) return tag.display_name
  return applyTemplate(entry_template, token => {
    switch (token) {
    case 'Name':
    case 'EntryName': return tag.display_name
    case 'Unit':
    case 'UnitName': return tag.resolved_unit?.unit.label ?? ''
    case 'Group':
    case 'GroupName': return tag_group.name
    }
    return null
  })
}

/**
 * #533 — « ce groupe porte une mise en forme » : prédicat d'apparition d'un
 * groupe de tags dans la légende.
 *
 * La légende ne montrait que les groupes pilotant la COULEUR. Porter une
 * information par un autre attribut (l'opacité de la fiabilité, puis la
 * bordure, la hachure) l'aurait donc mécaniquement retirée de la légende —
 * c'est-à-dire exactement ce qu'on veut y lire.
 *
 * Le prédicat est volontairement STRUCTUREL et posé ici, pas sur les classes :
 * `Class_DataTagGroup` n'hérite pas de `Class_TagGroup` (il étend
 * `Class_ProtoTagGroup`), `_use_colors` y existe en double avec deux getters et
 * deux sérialisations — une méthode écrite contre `Class_TagGroup` raterait en
 * silence tous les groupes de data tags.
 *
 * Aujourd'hui aucune classe n'expose `has_style_patch` : le prédicat vaut
 * exactement `use_colors`, et aucun diagramme existant ne change d'aspect.
 * C'est lui, et non plus `use_colors`, que filtre computeLegendItems ci-dessous
 * (dont l'en-tête est laissé mot pour mot : il est prolongé par sa#532, et le
 * retoucher ferait de deux tickets parallèles un arbitrage de fusion).
 */
export function tagGroupCarriesFormatting(tag_group: Type_TagGroupForLegend): boolean {
  return tag_group.use_colors || tag_group.has_style_patch === true
}

/**
 * Contenu de la légende : la même logique de filtrage que l'ancienne
 * drawTagDisplayed() — groupes avec use_colors, tags sélectionnés portés par au
 * moins un élément visible (ou data tags, toujours montrés).
 *
 * sa#532 — les étiquettes NON SÉLECTIONNÉES d'un groupe de nodeTags / fluxTags
 * sont désormais émises elles aussi, marquées `dimmed`. Sans elles, désélectionner
 * une étiquette supprimait son entrée : la légende était une porte à sens unique,
 * et le clic-pour-masquer que prépare le chantier aurait marché au premier clic
 * puis plus jamais. Ce qui est RENDU ne change pas pour autant — c'est
 * `renderableLegendItems` qui tranche, et il écarte les atténuées pour l'instant.
 *
 * Les dataTags gardent `selected_tags_list` : leur sélection n'est pas un
 * masquage mais un choix de dimension (`checkSelectionCoherence` resélectionne
 * d'office si elle tombe à zéro — TagGroup.tsx). Une entrée « atténuée » y
 * signifierait « masqué, cliquez pour rétablir », ce qui serait faux : mesuré sur
 * le corpus, cela ajouterait par exemple les 17 unités inactives du groupe
 * `unite` de « Détail des modes de production ».
 */
export function computeLegendItems(
  sankey: Type_SankeyForLegend,
  config: Type_LegendConfigValues,
  env: Type_LegendEnv = {},
  scale_text?: string
): Type_LegendItem[] {
  const items: Type_LegendItem[] = []

  // Ligne « données collectées / calculées »
  if (config.show_data_type && env.data_type_label) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'data-type', text: env.data_type_label, bold: true, starts_group: true, own_line: true })
  }

  // Groupes de tags porteurs d'une mise en forme (#533)
  const all_taggs = [...sankey.node_taggs_list, ...sankey.flux_taggs_list, ...sankey.data_taggs_list]
  const data_taggs = sankey.data_taggs_list as Type_TagGroupForLegend[]
  all_taggs
    .filter(tagGroupCarriesFormatting)
    .forEach(tag_group => {
      const is_data_tagg = data_taggs.includes(tag_group)
      // sa#532 — sur un dataTag on reste sur les tags sélectionnés (voir l'en-tête) ;
      // ailleurs on parcourt TOUTES les étiquettes du groupe. L'ordre relatif des
      // sélectionnées est celui de `tags_list`, donc celui de `selected_tags_list`
      // d'avant : le contenu rendu est inchangé au tag près.
      const candidate_tags = is_data_tagg
        ? tag_group.selected_tags_list
        : (tag_group.tags_list ?? tag_group.selected_tags_list)
      const displayed_tags = candidate_tags.filter(tag => {
        if (is_data_tagg) return true
        if (tag.is_selected === false) {
          // Étiquette masquée : ses porteurs sont invisibles PAR SA FAUTE, donc on
          // la cherche parmi tous les éléments du diagramme. Listes absentes (mock,
          // appelant historique) → on la retient, faute de pouvoir la réfuter.
          if (sankey.nodes_list === undefined && sankey.links_list === undefined) return true
          return (sankey.nodes_list ?? []).some(n => n.hasGivenTag(tag)) ||
            (sankey.links_list ?? []).some(f => f.hasGivenTag(tag))
        }
        return sankey.visible_nodes_list.some(n => n.hasGivenTag(tag)) ||
          sankey.visible_links_list.some(f => f.hasGivenTag(tag))
      })
      if (displayed_tags.length === 0) return
      const block_id = LEGEND_CHILD_PREFIX + 'block-' + slug(tag_group.id)
      items.push({
        id: LEGEND_CHILD_PREFIX + 'group-' + slug(tag_group.id),
        text: tag_group.name,
        bold: true,
        starts_group: true,
        own_line: true,
        block_id
      })
      displayed_tags.forEach(tag => {
        const item: Type_LegendItem = {
          id: LEGEND_CHILD_PREFIX + 'tag-' + slug(tag_group.id) + '-' + slug(tag.id),
          text: legendEntryText(tag, tag_group, config.entry_template),
          swatch_color: tag.color,
          tag_group_id: tag_group.id,
          tag_id: tag.id,
          block_id
        }
        // sa#532 — drapeau posé seulement quand il vaut quelque chose, pour que les
        // entrées ordinaires restent structurellement identiques à avant.
        if (tag.is_selected === false) item.dimmed = true
        items.push(item)
      })
    })

  // Rappel des data tags sélectionnés par groupe
  if (config.show_dataTags) {
    data_taggs.forEach(tag_group => {
      items.push({
        id: LEGEND_CHILD_PREFIX + 'datatag-' + slug(tag_group.id),
        text: tag_group.name + ' : ' + tag_group.selected_tags_list.map(t => t.display_name).join(', '),
        starts_group: true,
        own_line: true
      })
    })
  }

  // Explication des valeurs à intervalle (« * »)
  if (env.has_interval_values && env.t_free_value) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'info-interval', text: '* ' + env.t_free_value, starts_group: true, own_line: true })
  }

  // Explication des flux pointillés (valeur indéterminée)
  const has_dashed = sankey.visible_links_list.some(l => l.valueCurrent == null)
  if (has_dashed && config.info_link_value_void && env.t_dashed_links) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'info-dashed', text: env.t_dashed_links, starts_group: true, own_line: true })
  }

  // Échelle
  if (config.display_scale && scale_text) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'scale', text: scale_text, starts_group: true, own_line: true, scale_bar: true })
  }

  // Tableau des contraintes → simples lignes « symbole : description »
  if (config.show_constraints) {
    CONSTRAINT_ROWS.forEach((row, i) => {
      items.push({
        id: LEGEND_CHILD_PREFIX + 'constraint-' + i,
        text: row.symbol + ' : ' + row.description,
        starts_group: i === 0,
        own_line: true
      })
    })
  }

  return items
}

/**
 * sa#532 — les entrées atténuées sont-elles RENDUES ?
 *
 * `false` tant que rien ne permet de les réactiver : une entrée grise que le clic
 * n'atteint pas n'informerait de rien et allongerait la légende pour rien —
 * mesuré sur le corpus, la légende de « Vue d'ensemble du métabolisme
 * énergétique » (Metabol'Heat) passerait de 4 à 84 lignes, dont 80 grises.
 *
 * Le ticket qui posera le clic sur une entrée de légende met ceci à `true`, décide
 * de l'aspect des atténuées, et tranche le PLAFOND que ce chiffrage impose (les
 * groupes colorés du corpus vont jusqu'à 84 étiquettes ; aucun au-delà de 200 —
 * les groupes à 449/494/577 de Fruits et légumes ne portent pas la couleur et
 * n'entrent donc pas dans la légende).
 */
export const RENDER_DIMMED_LEGEND_ENTRIES: boolean = false

/**
 * sa#532 — ce que le générateur de zones doit réellement poser sur le diagramme.
 *
 * Écarte les entrées atténuées, puis les titres de groupe et cadres de bloc restés
 * sans aucune entrée : un groupe entièrement désélectionné n'émettait AUCUN item
 * avant sa#532 (`displayed_tags.length === 0`), il ne doit pas se mettre à afficher
 * un titre orphelin.
 */
export function renderableLegendItems(items: Type_LegendItem[]): Type_LegendItem[] {
  if (RENDER_DIMMED_LEGEND_ENTRIES) return items
  const kept = items.filter(i => !i.dimmed)
  const blocks_with_entry = new Set(
    kept.filter(i => i.tag_id !== undefined && i.block_id !== undefined).map(i => i.block_id as string)
  )
  return kept.filter(i => i.block_id === undefined || blocks_with_entry.has(i.block_id))
}

/**
 * Texte de l'échelle (reprend la logique de l'ancien drawSankeyScale, sans la
 * barre draggable) : échelle du dessin / 2, éventuellement remplacée par celle
 * du porteur effectif, divisée par le ratio utilisateur.
 *
 * sa#283 — porteur généralisé (même règle que ScaleResolution, sans contexte de
 * valeur) : du DERNIER groupe de dataTags au premier, un groupe d'unité porte par
 * son premier tag sélectionné (comportement historique de cette légende), un
 * groupe ordinaire par son UNIQUE tag sélectionné à échelle propre (`own_scale`).
 * `data_taggs` doit être donné dans l'ordre de `taggs_order`. Fichier legacy
 * (échelles d'unité seules) : résultat strictement identique.
 */
export function computeScaleText(
  drawing_area_scale: number,
  data_taggs: {
    is_unit?: boolean
    selected_tags_list: { name: string, scale?: number, is_selected?: boolean, own_scale?: number }[]
  }[],
  config: Type_LegendConfigValues,
  t_scale: string
): string {
  let scale = drawing_area_scale / 2
  let unit = ''
  for (let i = data_taggs.length - 1; i >= 0; i--) {
    const tagg = data_taggs[i]
    if (tagg.is_unit) {
      const selected_unit = tagg.selected_tags_list.find(t => t.is_selected)
      if (selected_unit?.scale !== undefined) {
        scale = selected_unit.scale / 2
        break
      }
    } else {
      const scaled_selected = tagg.selected_tags_list.filter(t => t.is_selected && t.own_scale !== undefined && t.own_scale > 0)
      if (scaled_selected.length === 1) {
        scale = (scaled_selected[0].own_scale as number) / 2
        break
      }
    }
  }
  // Libellé d'unité : celui du tag d'unité sélectionné, comme toujours (le porteur
  // généralisé change l'ÉCHELLE affichée, pas l'unité dans laquelle elle s'exprime).
  const unit_tagg = data_taggs.find(tagg => tagg.is_unit)
  if (unit_tagg) {
    const selected_unit = unit_tagg.selected_tags_list.find(t => t.is_selected)
    unit = selected_unit ? ' ' + selected_unit.name : ''
  }
  scale = scale / config.scale_ratio
  if (config.scale_unit !== '') unit = ' ' + config.scale_unit
  const abs_scale = Math.abs(scale)
  let formatted: string
  if (abs_scale >= 1) formatted = String(Number(scale.toFixed(2)))
  else if (abs_scale > 0) formatted = String(Number(scale.toPrecision(3)))
  else formatted = '0'
  return t_scale + ' : ' + formatted + unit
}

// LAYOUT (pur) =======================================================================

export type Type_LegendItemPosition = { id: string, x: number, y: number }

// Estimation de largeur de texte sans DOM (moyenne ~0.55 em par caractère)
function estimateTextWidth(text: string, font_size: number): number {
  return text.length * font_size * 0.55
}

/**
 * Positions relatives (px monde, origine = coin haut-gauche du contenu) des
 * zones générées. Vertical par défaut ; en horizontal les entrées d'un même
 * groupe se suivent sur une ligne, chaque groupe repart à la ligne.
 */
export function layoutLegendItems(
  items: Type_LegendItem[],
  config: Type_LegendConfigValues
): Type_LegendItemPosition[] {
  const positions: Type_LegendItemPosition[] = []
  const police = config.police
  const line_height = police * 1.5
  const wrap_width = Math.max(config.width, 4 * police)
  let x = 0
  let y = 0
  items.forEach(item => {
    // Hauteur de rangée : une barre d'échelle occupe sa hauteur propre
    const bar_row_height = SCALE_BAR_HEIGHT_PX + 0.5 * police
    if (config.horizontal) {
      if ((item.starts_group || item.own_line) && x > 0) {
        x = 0
        y += line_height
      }
      positions.push({ id: item.id, x, y })
      if (item.own_line) {
        // Titres de groupe / lignes d'info : seuls sur leur ligne, seules les
        // entrées de tag s'enchaînent horizontalement.
        x = 0
        y += item.scale_bar ? bar_row_height : line_height
      } else {
        const swatch = item.swatch_color !== undefined ? police + 5 : 0
        x += swatch + estimateTextWidth(item.text, police) + 14
      }
    } else {
      positions.push({ id: item.id, x: 0, y })
      if (item.scale_bar) {
        y += bar_row_height
      } else {
        // Estimation du nombre de lignes après retour à la ligne (box_width)
        const swatch = item.swatch_color !== undefined ? police + 5 : 0
        const n_lines = Math.max(1, Math.ceil(estimateTextWidth(item.text, police) / Math.max(wrap_width - swatch, police)))
        y += n_lines * line_height
      }
    }
  })
  return positions
}
