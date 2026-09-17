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

import { LEGEND_CHILD_PREFIX, legendDataTagZoneId, legendSlug as slug } from './legendIds'
import { applyTemplate } from './LabelTemplate'
import { LINK_DASH_GAP, LINK_DASH_LENGTH } from './linkDash'
import { untaggedDefaultsStyle } from './tagStyles'
import {
  LEGEND_SAMPLE_SWATCH_EM, legendEntryFormat, legendEntryHasSwatch,
  Type_LegendEntryFormat, Type_StyleForLegend
} from './legendTagStyle'

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
  // #542 — DÉFINITION de l'étiquette (entrée) ou du groupe (titre), déjà résolue
  // dans la langue courante. Posée seulement quand elle porte du texte : c'est le
  // générateur qui la recopie dans le texte libre de la zone, lu au survol par le
  // bloc INFOS de la présentation.
  description?: string
  // SA#545 — parties de l'entrée que définit le style de l'étiquette (nom, carré,
  // valeur d'exemple), cf. legendTagStyle.ts. Posé seulement quand le groupe
  // fonctionne par styles d'étiquette ET que le style définit quelque chose : les
  // entrées ordinaires restent structurellement identiques à avant.
  format?: Type_LegendEntryFormat
  // SA#550 — ligne d'un groupe ÉPINGLÉ fermé, en bas de légende : le bloc se rend sans
  // aucune entrée d'étiquette.
  pinned?: boolean
  // SA#550 — texte enveloppé à la largeur de la légende, même en disposition horizontale
  // (description d'un groupe épinglé : jusqu'à 677 caractères sur le Lait).
  wrap?: boolean
  // SA#550 — nom du groupe épinglé, en tête de `text` : souligné, suivi de « : » et de la
  // description, toute la ligne en italique (retours du test local du 2026-09-15).
  pinned_name?: string
  // SA#552 — ligne de rappel d'une dimension dont la tranche se CHOISIT depuis la légende :
  // groupe d'au moins deux étiquettes. Une dimension à étiquette unique (Territoire, Filière)
  // ne promet rien : ni main, ni flèche, ni info-bulle, ni liste.
  dimension_choice?: boolean
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
  // SA#552 — info-bulle de la ligne de rappel d'une dimension : elle se modifie au clic
  t_dimension_change?: string
  // SA#553 — valeur par défaut (usine) d'un paramètre de mise en forme : celle que prend
  // l'étiquette générée « Sans [groupe] » pour les paramètres que règlent les autres étiquettes.
  // Absente (mocks), ces paramètres ne sont pas montrés sur son entrée.
  default_value?: (k: string) => unknown
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
  // #542 — `Class_ProtoTag.description` : définition résolue dans la langue
  // courante ('' sans définition). Optionnel pour garder les mocks triviaux.
  description?: string
  // SA#545 — `Class_ProtoTag.style_id` (SA#541) : id du style nommé que l'étiquette
  // impose. Absent = aucun style.
  style_id?: string
  // SA#553 — étiquette générée « Sans [nom du groupe] » : ses porteurs se calculent
  // (`hasGivenTag` des éléments), elle n'a pas de couleur propre.
  is_untagged?: boolean
}
type Type_TagGroupForLegend = {
  id: string
  name: string
  // #542 — `Class_ProtoTagGroup.description`, même contrat que sur l'étiquette.
  description?: string
  // Mise en forme pilotée par le groupe — voir tagGroupCarriesFormatting().
  use_colors: boolean
  // #533 — second terme du prédicat « ce groupe porte une mise en forme ».
  // Exposé par `Class_ProtoTagGroup.has_style_patch` : vrai dès que le porteur
  // de style du socle de format (#537, `style_patch`) n'est pas vide. Il n'est
  // pas persisté en tant que tel — il dérive de `style_patch`, écrit seulement
  // quand il porte quelque chose : aucun fichier existant ne l'allume.
  has_style_patch?: boolean
  // SA#545 — `Class_TagGroup.uses_tag_styles` (SA#541) : « le groupe ou une de ses
  // étiquettes porte un style utilisable ». Absent sur les groupes de data tags, qui
  // n'ont pas de styles d'étiquette.
  uses_tag_styles?: boolean
  // SA#550 — `Class_ProtoTagGroup.pinned_in_legend` (socle #537) : le groupe reste en bas
  // de la légende même quand il ne met rien en forme. Absent = non épinglé.
  pinned_in_legend?: boolean
  selected_tags_list: Type_TagForLegend[]
  // sa#532 — TOUTES les étiquettes du groupe, sélectionnées ou non. Optionnel :
  // absent, le calcul retombe sur `selected_tags_list` (comportement d'avant
  // sa#532), ce qui garde les mocks des tests antérieurs valides.
  tags_list?: Type_TagForLegend[]
  // SA#553 — `tags_list` suivie de l'étiquette générée « Sans [nom du groupe] » (groupes
  // de nœuds et de flux). Absent = pas d'étiquette générée (mocks, groupes de données).
  tags_list_with_untagged?: Type_TagForLegend[]
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
  // SA#545 — styles nommés (`Class_Sankey.styles_dict`), lus pour mettre en forme les
  // entrées des groupes à styles d'étiquette. Optionnel : absent, aucune entrée n'est
  // mise en forme (mocks des tests antérieurs).
  styles_dict?: { [style_id: string]: Type_StyleForLegend & { is_default_style?: boolean } }
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
  // SA#549 — les étiquettes masquées sont RENDUES, rayées (cf. renderableLegendItems).
  // Optionnel pour garder les configurations des tests antérieurs valides.
  show_hidden_tags?: boolean
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
 * #542 — définition d'une étiquette ou d'un groupe, telle que la légende la
 * porte : `undefined` quand elle est absente ou blanche, pour que les entrées
 * sans définition restent structurellement identiques à avant.
 */
function definitionOf(owner: { description?: string }): string | undefined {
  const description = owner.description
  return typeof description === 'string' && description.trim() !== '' ? description : undefined
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
 * `has_style_patch` est exposé par `Class_ProtoTagGroup` (raccord du #537) :
 * faux tant que le groupe ne porte aucun patch de mise en forme, si bien
 * qu'aucun diagramme existant ne change d'aspect.
 * C'est lui, et non plus `use_colors`, que filtre computeLegendItems ci-dessous
 * (dont l'en-tête est laissé mot pour mot : il est prolongé par sa#532, et le
 * retoucher ferait de deux tickets parallèles un arbitrage de fusion).
 */
export function tagGroupCarriesFormatting(tag_group: Type_TagGroupForLegend): boolean {
  return tag_group.use_colors || tag_group.has_style_patch === true
}

/**
 * SA#550 — groupes qui s'affichent en bas de la légende : épinglés et FERMÉS, c'est-à-dire
 * qui ne mettent rien en forme (tagGroupCarriesFormatting). Un groupe épinglé qui met en
 * forme garde sa place et ses entrées ordinaires — l'ouvrir en tête relève du #551.
 * Ordre : celui des listes de groupes (nœuds, flux, données), comme les autres blocs.
 *
 * Ni entrée d'étiquette ni info-bulle : le nom et la définition sont écrits en toutes
 * lettres. Aucun fichier existant n'épingle de groupe : aucune légende ne change.
 */
export function pinnedLegendGroups(tag_groups: Type_TagGroupForLegend[]): Type_TagGroupForLegend[] {
  return tag_groups.filter(g => g.pinned_in_legend === true && !tagGroupCarriesFormatting(g))
}

/**
 * SA#545 — couleur du carré de l'entrée de l'étiquette générée (SA#553) quand son style définit
 * la forme sans en fixer la couleur : elle n'a pas de couleur propre. Valeur de
 * `default_element_color` (ElementsAttributesConfig), recopiée pour garder ce module feuille.
 */
const UNTAGGED_SWATCH_COLOR = '#a9a9a9'

/**
 * SA#545 — style nommé qu'impose un id, s'il est utilisable. Même règle que la cascade
 * (Element.resolveTagStyleLayers) : un id inconnu ou le style `default` — pré-rempli de TOUS les
 * défauts usine, il définirait chaque partie de chaque entrée — ne sont jamais des styles.
 */
function usableStyle(sankey: Type_SankeyForLegend, style_id: string | undefined): Type_StyleForLegend | undefined {
  if (!style_id) return undefined
  const style = sankey.styles_dict?.[style_id]
  return (style !== undefined && style.is_default_style !== true) ? style : undefined
}

// SA#553 — style de l'entrée de l'étiquette générée « Sans [groupe] » : le sien, complété des valeurs
// par défaut des paramètres que règlent les styles des autres étiquettes du groupe (même règle que la
// cascade, `tagStyles.untaggedDefaultsStyle`).
function untaggedEntryStyle(
  sankey: Type_SankeyForLegend,
  tag_group: Type_TagGroupForLegend,
  own_style: Type_StyleForLegend | undefined,
  env: Type_LegendEnv
): Type_StyleForLegend | undefined {
  const default_value = env.default_value
  const tag_styles = (tag_group.tags_list ?? tag_group.selected_tags_list)
    .map(tag => usableStyle(sankey, tag.style_id))
    .filter((style): style is Type_StyleForLegend => style !== undefined)
  if (default_value === undefined || tag_styles.length === 0) return own_style
  const defaults = untaggedDefaultsStyle(tag_styles, default_value)
  return {
    getElementProperty: (k: string) => own_style?.getElementProperty(k) ?? defaults.getElementProperty(k)
  }
}

/**
 * SA#545 — pose sur une entrée les parties que définit le style. Rien de défini : l'entrée reste
 * son nom seul (ni `format` ni carré). Le carré garde `fallback_color` quand le style définit la
 * forme sans sa couleur, ou la seule valeur (carré alors transparent au rendu).
 */
function applyTagStyleFormat(item: Type_LegendItem, style: Type_StyleForLegend | undefined, fallback_color: string) {
  const format = legendEntryFormat(style)
  if (Object.keys(format).length === 0) return
  item.format = format
  if (legendEntryHasSwatch(format)) item.swatch_color = format.swatch?.color ?? fallback_color
}

// SA#553 — l'entrée « sans étiquette » du #545 n'existe plus : c'est désormais l'entrée ordinaire de
// l'étiquette générée « Sans [nom du groupe] », que composent les règles de `computeLegendItems`.

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
      // SA#545 — groupe qui fonctionne par styles d'étiquette : ses entrées prennent la forme
      // du style de leur étiquette. Même condition que la cascade (Element.resolveTagStyleLayers) :
      // sans son interrupteur (`use_colors`), un groupe n'impose aucun style.
      const styled = !is_data_tagg && tag_group.use_colors && tag_group.uses_tag_styles === true
      // sa#532 — sur un dataTag on reste sur les tags sélectionnés (voir l'en-tête) ;
      // ailleurs on parcourt TOUTES les étiquettes du groupe. L'ordre relatif des
      // sélectionnées est celui de `tags_list`, donc celui de `selected_tags_list`
      // d'avant : le contenu rendu est inchangé au tag près.
      // SA#553 — l'étiquette générée « Sans [groupe] » est une entrée ordinaire, en dernier, des
      // seuls groupes à styles : un groupe qui colore par couleur d'étiquette la laisse hors de sa
      // légende (elle n'a pas de couleur, et ses porteurs gardent la leur).
      const all_tags = styled
        ? (tag_group.tags_list_with_untagged ?? tag_group.tags_list)
        : tag_group.tags_list
      const candidate_tags = is_data_tagg
        ? tag_group.selected_tags_list
        : (all_tags ?? tag_group.selected_tags_list)
      const displayed_tags = candidate_tags.filter(tag => {
        if (is_data_tagg) return true
        // SA#549 — réglage « étiquettes masquées » allumé : une étiquette SÉLECTIONNÉE dont
        // les porteurs sont masqués par une autre étiquette garde elle aussi son entrée.
        // Sinon masquer « Indicative » retirait « Eau » et 5 sources de la légende du Lait :
        // tout ce qui suit remontait d'une ligne, et le reclic tombait sur l'entrée voisine
        // (retour du test local). Réglage éteint : contenu inchangé.
        if (tag.is_selected === false || config.show_hidden_tags === true) {
          // Étiquette masquée : ses porteurs sont invisibles PAR SA FAUTE, donc on
          // la cherche parmi tous les éléments du diagramme. Listes absentes (mock,
          // appelant historique) → on la retient, faute de pouvoir la réfuter.
          if (tag.is_selected !== false && sankey.nodes_list === undefined && sankey.links_list === undefined) {
            return sankey.visible_nodes_list.some(n => n.hasGivenTag(tag)) ||
              sankey.visible_links_list.some(f => f.hasGivenTag(tag))
          }
          if (sankey.nodes_list === undefined && sankey.links_list === undefined) return true
          return (sankey.nodes_list ?? []).some(n => n.hasGivenTag(tag)) ||
            (sankey.links_list ?? []).some(f => f.hasGivenTag(tag))
        }
        return sankey.visible_nodes_list.some(n => n.hasGivenTag(tag)) ||
          sankey.visible_links_list.some(f => f.hasGivenTag(tag))
      })
      if (displayed_tags.length === 0) return
      const block_id = LEGEND_CHILD_PREFIX + 'block-' + slug(tag_group.id)
      const title: Type_LegendItem = {
        id: LEGEND_CHILD_PREFIX + 'group-' + slug(tag_group.id),
        text: tag_group.name,
        bold: true,
        starts_group: true,
        own_line: true,
        block_id
      }
      const group_description = definitionOf(tag_group)
      if (group_description !== undefined) title.description = group_description
      items.push(title)
      displayed_tags.forEach(tag => {
        const item: Type_LegendItem = {
          id: LEGEND_CHILD_PREFIX + 'tag-' + slug(tag_group.id) + '-' + slug(tag.id),
          text: legendEntryText(tag, tag_group, config.entry_template),
          tag_group_id: tag_group.id,
          tag_id: tag.id,
          block_id
        }
        if (styled) {
          // SA#545 — le carré n'existe que si le style définit la forme ou la valeur.
          const own_style = usableStyle(sankey, tag.style_id)
          if (tag.is_untagged) {
            // SA#553 — même style que dans la cascade (tagStyles.tagStyleLayers) : le sien, complété
            // des valeurs par défaut des paramètres que règlent les autres étiquettes du groupe.
            applyTagStyleFormat(item, untaggedEntryStyle(sankey, tag_group, own_style, env), UNTAGGED_SWATCH_COLOR)
          } else {
            applyTagStyleFormat(item, own_style, tag.color)
          }
        } else {
          item.swatch_color = tag.color
        }
        // sa#532 — drapeau posé seulement quand il vaut quelque chose, pour que les
        // entrées ordinaires restent structurellement identiques à avant.
        if (tag.is_selected === false) item.dimmed = true
        const tag_description = definitionOf(tag)
        if (tag_description !== undefined) item.description = tag_description
        items.push(item)
      })
    })

  // Rappel des data tags sélectionnés par groupe
  if (config.show_dataTags) {
    data_taggs.forEach(tag_group => {
      const item: Type_LegendItem = {
        // SA#552 — id partagé avec le clic qui ouvre la liste de la dimension
        id: legendDataTagZoneId(tag_group.id),
        text: tag_group.name + ' : ' + tag_group.selected_tags_list.map(t => t.display_name).join(', '),
        starts_group: true,
        own_line: true
      }
      // SA#552 — tranche modifiable depuis la légende : au moins deux étiquettes. Alors seulement,
      // info-bulle « cliquer pour modifier », lue au survol comme une définition (#542).
      if ((tag_group.tags_list ?? tag_group.selected_tags_list).length > 1) {
        item.dimension_choice = true
        if (env.t_dimension_change) item.description = env.t_dimension_change
      }
      items.push(item)
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

  // SA#550 — groupes épinglés FERMÉS, tout en bas : une ligne « Nom : description »,
  // enveloppée, le nom mis en valeur au rendu (`pinned_name`).
  pinnedLegendGroups(all_taggs).forEach(tag_group => {
    const description = definitionOf(tag_group)
    items.push({
      id: LEGEND_CHILD_PREFIX + 'group-' + slug(tag_group.id),
      text: description === undefined ? tag_group.name : tag_group.name + ' : ' + description,
      starts_group: true,
      own_line: true,
      block_id: LEGEND_CHILD_PREFIX + 'block-' + slug(tag_group.id),
      pinned: true,
      wrap: true,
      pinned_name: tag_group.name
    })
  })

  return items
}

/**
 * sa#532 — ce que le générateur de zones doit réellement poser sur le diagramme.
 *
 * SA#549 — les entrées atténuées (étiquettes masquées) sont rendues, rayées, quand le
 * réglage de légende `show_hidden_tags` est allumé : cliquer une entrée masque ses
 * éléments, et l'entrée rayée reste là pour les rétablir. Le réglage est ÉTEINT par
 * défaut, et absent de tous les fichiers existants : leurs légendes sont inchangées
 * (mesure du sa#532 : jusqu'à +8 lignes sur un diagramme vivant, +80 sur une archive
 * Metabol'Heat). Le premier clic dans une légende l'allume — sans quoi l'entrée
 * cliquée disparaîtrait, et la légende redeviendrait une porte à sens unique.
 *
 * Réglage éteint : écarte les entrées atténuées, puis les titres de groupe et cadres
 * de bloc restés sans aucune entrée — un groupe entièrement désélectionné n'émettait
 * AUCUN item avant sa#532 (`displayed_tags.length === 0`), il ne doit pas se mettre
 * à afficher un titre orphelin.
 */
export function renderableLegendItems(items: Type_LegendItem[], show_hidden_tags: boolean = false): Type_LegendItem[] {
  if (show_hidden_tags) return items
  const kept = items.filter(i => !i.dimmed)
  const blocks_with_entry = new Set(
    kept.filter(i => (i.tag_id !== undefined || i.pinned === true) && i.block_id !== undefined)
      .map(i => i.block_id as string)
  )
  return kept.filter(i => i.block_id === undefined || blocks_with_entry.has(i.block_id))
}

/**
 * SA#545 — largeur (px monde, police effective) du carré d'une entrée : une pastille
 * carrée, ou un carré élargi quand il porte la valeur d'exemple.
 */
export function legendSwatchWidth(item: Type_LegendItem, police: number): number {
  const base = item.format?.value !== undefined ? police * LEGEND_SAMPLE_SWATCH_EM : police
  // Flux « Hachuré » : les tirets gardent la taille du diagramme, c'est le carré qui s'élargit
  // pour en montrer au moins deux vides — un seul ne se lit pas comme des hachures (retour du
  // test local du 2026-09-15).
  return item.format?.swatch?.link_dashed === true ? Math.max(base, LEGEND_DASHED_SWATCH_MIN_WIDTH) : base
}

/** Trait, vide, trait, vide, trait : la plus petite largeur qui montre deux vides entiers. */
export const LEGEND_DASHED_SWATCH_MIN_WIDTH = 2 * (LINK_DASH_LENGTH + LINK_DASH_GAP) + LINK_DASH_LENGTH

/**
 * SA#545 — id de la zone générée qui écrit la valeur d'exemple dans le carré d'une
 * entrée, ou `undefined` si l'entrée n'en a pas. Préfixe `sample-` : aucune autre
 * famille d'ids de légende ne l'emploie.
 */
export function legendSampleZoneId(item: Type_LegendItem): string | undefined {
  if (item.format?.value === undefined) return undefined
  return LEGEND_CHILD_PREFIX + 'sample-' + item.id.slice(LEGEND_CHILD_PREFIX.length)
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
 * SA#550 — nombre de lignes d'une zone enveloppée (`wrap`) : celui qu'a MESURÉ le rendu
 * s'il est connu (`line_counts`, relevé par le générateur sur le texte dessiné — la
 * césure réelle mesure les glyphes), sinon l'estimation sans DOM.
 */
export function legendWrappedLineCount(
  item: Type_LegendItem,
  config: Type_LegendConfigValues,
  line_counts?: Map<string, number>
): number {
  const measured = line_counts?.get(item.id)
  if (measured !== undefined && measured > 0) return measured
  const wrap_width = Math.max(config.width, 4 * config.police)
  return Math.max(1, Math.ceil(estimateTextWidth(item.text, config.police) / wrap_width))
}

/**
 * SA#550 — hauteur de la forme d'ancrage d'une zone enveloppée sur `n_lines` lignes : le
 * libellé y est centré, la rangée fait `n_lines` interlignes, et la marge du haut reste
 * celle d'une ligne seule (forme d'une `police` de haut dans une rangée de 1,5 `police`).
 */
export function legendWrappedShapeHeight(n_lines: number, police: number): number {
  return (1.5 * n_lines - 0.5) * police
}

/**
 * Positions relatives (px monde, origine = coin haut-gauche du contenu) des
 * zones générées. Vertical par défaut ; en horizontal les entrées d'un même
 * groupe se suivent sur une ligne, chaque groupe repart à la ligne.
 *
 * SA#550 — `line_counts` : lignes mesurées des zones enveloppées (`wrap`), cf.
 * legendWrappedLineCount.
 */
export function layoutLegendItems(
  items: Type_LegendItem[],
  config: Type_LegendConfigValues,
  line_counts?: Map<string, number>
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
    if (item.wrap === true) {
      // SA#550 — seule sur sa ligne et enveloppée, dans les deux dispositions
      if (x > 0) {
        x = 0
        y += line_height
      }
      positions.push({ id: item.id, x: 0, y })
      y += legendWrappedLineCount(item, config, line_counts) * line_height
      return
    }
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
        const swatch = item.swatch_color !== undefined ? legendSwatchWidth(item, police) + 5 : 0
        x += swatch + estimateTextWidth(item.text, police) + 14
      }
    } else {
      positions.push({ id: item.id, x: 0, y })
      if (item.scale_bar) {
        y += bar_row_height
      } else {
        // Estimation du nombre de lignes après retour à la ligne (box_width)
        const swatch = item.swatch_color !== undefined ? legendSwatchWidth(item, police) + 5 : 0
        const n_lines = Math.max(1, Math.ceil(estimateTextWidth(item.text, police) / Math.max(wrap_width - swatch, police)))
        y += n_lines * line_height
      }
    }
  })
  return positions
}
