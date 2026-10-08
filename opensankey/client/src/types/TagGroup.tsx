import colormap from 'colormap'
import i18next from 'i18next'
import { Type_LangMap, normalizeLang, parseLangMap, parseStylePatch, resolveLangMap, serializeLangMap, serializeStylePatch } from '../Persistence/persistenceMigrations'
import type { Type_StylePatch } from './Theme'
import { Class_LinkElement } from '../Elements/Link'
import { Class_ElementValue, Class_ElementTaggedValue } from '../Elements/LinkValues'
import { Class_NodeElement } from '../Elements/Node'
import { Class_Sankey } from './Sankey'
import { tag_banner_type, Class_ProtoTag, Class_Tag, Class_NodeTag, Class_FluxTag, Class_DataTag, Class_LevelTag, Class_ViewTag, untaggedTagId } from './Tag'
import { Type_JSON, getStringFromJSON, getBooleanFromJSON, getStringListFromJSON, getStringOrUndefinedFromJSON } from './Utils'
import { Type_PositionMode, isPositionMode } from './PublishOptions'
import { Type_AssignmentRule, Type_RuleMeasurable, parseAssignmentRule, resolveRuleTag, serializeAssignmentRule } from './TagAssignmentRule'
import { Type_MembersOrder, MEMBERS_ORDERS, DEFAULT_MEMBERS_ORDER } from '../Algorithms/DimensionMemberOrder'
import { foldSmallParts } from '../Algorithms/DimensionOthers'
import {
  Type_HierarchicalPaletteParams, Type_PaletteNode, computeHierarchicalColors, default_hierarchical_palette_params
} from '../Algorithms/HierarchicalPalette'

/**
 * os#1516 — RECETTE de palette d'une dimension. C'est elle qui fait foi : les couleurs des membres
 * en DÉCOULENT (et restent écrites dans chaque membre, pour les versions antérieures et le viewer).
 * `locks` : couleurs choisies à la main, que le recalcul respecte. `frozen` : plus de recalcul
 * automatique quand la structure change (couleurs déjà publiées ou imprimées).
 */
/**
 * os#1511 — COMMENT UNE DIMENSION SE DESSINE (cf. `Class_DataTagGroup.drawing`) : un membre à la
 * fois, plusieurs en bandes, plusieurs en nœuds (un nœud la porte), ou rien de tout cela.
 */
export type Type_DimensionDrawing = 'one' | 'multi' | 'nodes' | 'other'

export type Type_DimensionPalette = {
  params: Type_HierarchicalPaletteParams
  locks: { [tag_id: string]: string }
  frozen: boolean
}

const copyPalette = (palette: Type_DimensionPalette): Type_DimensionPalette => ({
  params: { ...palette.params }, locks: { ...palette.locks }, frozen: palette.frozen
})

const parsePalette = (raw: unknown): Type_DimensionPalette | undefined => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const json = raw as Type_JSON
  const params = { ...default_hierarchical_palette_params }
  const raw_params = json['params']
  if (typeof raw_params === 'object' && raw_params !== null) {
    (Object.keys(params) as (keyof Type_HierarchicalPaletteParams)[]).forEach(key => {
      const value = (raw_params as Type_JSON)[key]
      if (typeof value === 'number' && Number.isFinite(value)) params[key] = value
    })
  }
  const locks: { [tag_id: string]: string } = {}
  const raw_locks = json['locks']
  if (typeof raw_locks === 'object' && raw_locks !== null) {
    Object.entries(raw_locks as Type_JSON).forEach(([id, color]) => {
      if (typeof color === 'string' && color !== '') locks[id] = color
    })
  }
  return { params, locks, frozen: json['frozen'] === true }
}

// #486 - separateurs de la feuille Etiquettes du format Excel. Le « / » separe les
// groupes antagonistes declares sur une meme ligne, le « : » les etiquettes d'un
// groupe : un libelle qui contient l'un des deux (« m3 / kt produit ») rendait la
// feuille illisible. L'utilisateur peut desormais choisir les siens, groupe par
// groupe ; ils ne servent qu'a la lecture et a l'ecriture Excel, jamais a
// l'affichage. Le front les PORTE (et ne les perd pas a l'enregistrement), sans
// quoi un aller-retour par l'application reecrirait la feuille avec les defauts.
export const DEFAULT_TAGS_SEPARATOR = ':'
export const DEFAULT_ANTAGONISTS_SEPARATOR = '/'

// #527 - cles de groupe d'etiquettes que le front sait lire et reecrire, toutes
// sous-classes confondues. TOUT le reste traverse le front a l'identique
// (passthrough), au lieu d'etre detruit au premier aller-retour : c'est le cas
// de « Palette visible » (`show_legend`) et « Palette de couleur » (`colormap`),
// que le parser ecrit mais que le front ne modelise pas.
// A completer — et seulement alors — le jour ou le front apprend a lire une de
// ces cles : une cle a la fois connue et dans le sac serait ecrite deux fois.
const KNOWN_TAGG_JSON_KEYS = new Set([
  'name', 'group_name', 'banner', 'tags', 'tags_order',
  'tags_separator', 'antagonists_separator',
  'use_colors',
  'carries_values', 'has_own_scales', 'is_unit_type', 'is_additive',
  'is_unit', 'is_sequence', 'propagate_structure', 'position_mode',
  'activated', 'siblings', 'linked_tag_group',
  'view_mode', 'full_view_label',
  // #537 - le front MODELISE desormais ces trois cles (cf. la meme note dans
  // Tag.tsx) : les laisser au sac ferait resurgir une valeur effacee.
  'description', 'style_patch', 'pinned_in_legend',
  // SA#541 - style nomme impose aux elements sans etiquette du groupe.
  'style_id',
  // SA#553 - etiquette generee « Sans [nom du groupe] », modelisee
  'untagged_tag',
  // SA#580 - groupe de flux attribue par regles, modelise
  'assignment_rule',
  // os#1511 - hierarchie de la dimension, modelisee : hors du sac, une dimension rendue plate
  // ressortirait avec ses anciens niveaux. os#1516 - recette de palette, modelisee.
  // `current_level` n'est plus ecrit (le niveau courant se deduit de la selection) : il reste
  // ici pour qu'un ancien fichier ne le traine pas dans le sac.
  'levels', 'current_level', 'palette',
  // os#1517 / os#1511 — barre du haut, un diagramme par membre, ordre des membres : écrits
  // seulement hors défaut, donc à tenir HORS du sac, sinon une valeur remise au défaut ressortait
  // au prochain enregistrement. `bands_by_value` / `nodes_by_value` sont relus (ancien format de
  // `members_order`) puis abandonnés.
  'topbar', 'member_bands', 'paints_flows', 'members_order', 'bands_by_value', 'nodes_by_value',
  // os#1511 — la portée (zoom) partagée par les fenêtres liées, écrite seulement quand elle est posée.
  'focus',
  // os#1511 — les décochés partagés par les fenêtres liées, écrits seulement quand il y en a.
  'hidden_members',
])

/**
 * os#1511 — Nom par défaut d'une profondeur que l'auteur n'a pas nommée : « Niveau 3 » (langue
 * active ; repli français hors application, où i18next n'est pas initialisé et rendrait la clé).
 */
export const defaultLevelName = (index: number): string => {
  const cle = 'Tags.hierarchy.level_default'
  const texte = i18next.t(cle) as unknown
  const mot = (typeof texte === 'string' && texte !== '' && texte !== cle) ? texte : 'Niveau'
  return `${mot} ${index + 1}`
}

// CLASS PROTO TAGGROUP *****************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */

export abstract class Class_ProtoTagGroup {

  // PRIVATE ATTRIBUTES =================================================================
  // Name
  private _id: string
  // OS#1299 — nom multilingue { langue -> nom } (cf. Class_ProtoTag) : le
  // getter/setter name résout/écrit la langue active de l'app.
  private _name_map: Type_LangMap

  // List of tags
  private _tag_count: number = 0
  private _tags_order: string[] = []

  // Type of banner
  private _banner: tag_banner_type = 'one'

  // os#1517 — LA BARRE DU HAUT EST UN RÉGLAGE À PART, pas une valeur de `banner`.
  //
  // Julien, 30/09 : « il faut pouvoir dire que c'est en topbar indépendamment des autres options,
  // pareil pour frise en mode mono, et après bande ou nœud c'est encore autre chose. Là on met
  // tout dans un seul sélecteur, ça va pas. » `banner` répond à COMBIEN et SOUS QUELLE FORME (un
  // membre, en frise, en bandes) ; ceci répond à OÙ le choix se fait. Une dimension peut donc être
  // en barre du haut ET en bandes, ou en nœuds.
  //
  // Compatibilité : `banner: 'topbar'` des fichiers existants se lit « un membre » + barre du haut,
  // et ce cas s'écrit encore `banner: 'topbar'` (en plus de `topbar: true`) pour qu'un viewer
  // publié antérieur le montre toujours en haut.
  private _in_topbar: boolean = false

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_TagGroup
   */
  private _is_currently_deleted = false

  // #486 - separateurs Excel choisis par l'utilisateur. undefined = non declare,
  // donc defaut du format : on garde la distinction pour n'ecrire la cle que
  // quand elle a ete demandee (fichiers existants inchanges).
  private _tags_separator: string | undefined = undefined
  private _antagonists_separator: string | undefined = undefined

  // #537 - DEFINITION du groupe (« ce que decrit cette dimension »), destinee a
  // l'info-bulle de legende et au bloc juxtapose aux groupes epingles. Distincte
  // du nom : cf. la note de `Class_ProtoTag._description_map`.
  private _description_map: Type_LangMap = {}

  // #537 - mise en forme portee par le GROUPE : { attribut moderne -> valeur },
  // meme forme que les patchs de theme (Type_StylePatch). Patch vide = cle
  // absente = comportement d'avant. C'est l'interrupteur par groupe, ferme par
  // defaut, de l'opacite de fiabilite (vague 2) : le groupe declare ce qu'il
  // pilote, chaque etiquette porte sa valeur dans SON patch.
  private _style_patch: Type_StylePatch = {}

  // SA#541 - id du STYLE NOMME impose aux elements qui ne portent AUCUNE etiquette
  // du groupe (valeurs « non qualifiees » : 26,5 % des valeurs SOCLE). undefined = aucun.
  private _style_id: string | undefined = undefined
  private _uses_tag_styles: boolean = false
  private _uses_tag_styles_epoch: number = -1

  // #537 - groupe EPINGLE en legende (« Source », « Methode » toujours visibles
  // en bas). Pose des maintenant, pendant qu'on touche au format, pour que les
  // tickets d'affichage qui suivent consomment un format fige.
  private _pinned_in_legend: boolean = false

  // #527 - sac des cles JSON que le front ne modelise pas, reemises telles
  // quelles. Sans lui, un attribut de groupe d'etiquettes (« Palette de
  // couleur », « Palette visible », ou tout attribut pose par un ticket a
  // venir) est detruit des que le diagramme repasse par le navigateur : le
  // parser a beau le conserver, le front reconstruit le JSON de zero.
  private _json_extras: Type_JSON = {}

  // PROTECTED ATTRIBUTES ===============================================================
  protected abstract _tags: { [id: string]: Class_ProtoTag; };

  protected _ref_sankey: Class_Sankey

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string, sankey: Class_Sankey) {
    this._id = id
    this._name_map = { [normalizeLang(i18next.language)]: name }
    this._ref_sankey = sankey
  }

  // CLEANING METHODS ===================================================================
  /**
   * Define deletion behavior
   * @memberof Class_ProtoTagGroup
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // SA#541 - le groupe et ses etiquettes emportent leurs styles
      this._ref_sankey.tagStylesConfigUpdated?.()
      // Delete all tags properly
      Object.values(this._tags)
        .forEach(tag => {
          tag.delete()
        })
      this._tags = {}
      this._tags_order = []
      // Garbage collection will do the rest ...
    }
  }

  // COPY METHODS =======================================================================
  public copyFrom(
    tagg_to_copy: Class_ProtoTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    this._copyFrom(tagg_to_copy, matching_tags_id)
  }

  protected _copyFrom(
    tagg_to_copy: Class_ProtoTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    const revert_matching_id: { [id: string]: string; } = {}
    Object.entries(matching_tags_id).forEach(([k, v]) => revert_matching_id[v] = k)
    // Common attributes
    // Map complète (pas la string résolue) : les traductions survivent à la copie.
    this._name_map = { ...tagg_to_copy._name_map }
    this._banner = tagg_to_copy._banner
    this._in_topbar = tagg_to_copy._in_topbar
    this._tag_count = tagg_to_copy._tag_count
    // #486 - les separateurs suivent le groupe : sans cette ligne, un updateFrom
    // (fusion de mise en page, duplication) les perdrait silencieusement et le
    // prochain export Excel casserait les libelles qui contiennent « / ».
    this._tags_separator = tagg_to_copy._tags_separator
    this._antagonists_separator = tagg_to_copy._antagonists_separator
    // #527 - meme raison que pour les separateurs ci-dessus : sans cette ligne,
    // une fusion de mise en page ou une duplication perdrait silencieusement
    // les attributs que le front ne modelise pas.
    this._json_extras = { ...tagg_to_copy._json_extras }
    // #537 - meme raison : sans ces lignes, une duplication de groupe ou un
    // updateFrom rendrait un groupe defini et epingle en groupe muet, en
    // silence. Maps et patchs sont CLONES : deux groupes qui partageraient la
    // meme reference se mutueraient l'un l'autre.
    this._description_map = { ...tagg_to_copy._description_map }
    this._style_patch = { ...tagg_to_copy._style_patch }
    this._pinned_in_legend = tagg_to_copy._pinned_in_legend
    // SA#541 - meme raison : le style des elements sans etiquette suit le groupe.
    if (this._style_id !== tagg_to_copy._style_id) {
      this._style_id = tagg_to_copy._style_id
      this._ref_sankey.tagStylesConfigUpdated?.()
    }
    // tagg_to_copy._tags_order holds the SOURCE group's tag ids. When the two
    // groups were matched by name but carry different tag ids (e.g. updateFrom
    // a JSON whose tags were renamed), copying the order verbatim would leave
    // this group's tags_order pointing at ids absent from its tags_dict. Since
    // tags_list is derived from tags_order, that empties tags_list and the sync
    // loops below run on nothing, orphaning every tag. Translate source ids back
    // to this group's ids via revert_matching_id so the order stays resolvable.
    this._tags_order = tagg_to_copy._tags_order.map(id => revert_matching_id[id] ?? id)

    // Synchro current tags
    this.tags_list
      .forEach(tag => {
        // Delete tags not present in new layout but present in curr
        if (!((matching_tags_id[tag.id] ?? tag.id) in tagg_to_copy.tags_dict))
          this.removeTag(tag)


        // Transfer tags attr present in new layout and in curr
        else
          tag.copyFrom(tagg_to_copy.tags_dict[(matching_tags_id[tag.id] ?? tag.id)])
      })

    // Add missing tags
    tagg_to_copy.tags_list
      .forEach(tag => {
        if (!((revert_matching_id[tag.id] ?? tag.id) in this.tags_dict))
          this.addTag(tag.name, tag.id).copyFrom(tag)
      })
  }

  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Create empty structs
    const json_object = {} as Type_JSON
    this._toJSON(json_object, kwargs)
    return json_object
  }

  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    // #527 - le sac d'abord : une cle que le front connait est ensuite reecrite
    // par sa valeur courante (ici ou dans une sous-classe), une cle inconnue
    // ressort intacte. L'ordre est le filet : il rend impossible qu'un attribut
    // perime du sac prenne le pas sur l'etat reel du diagramme.
    Object.assign(json_object, this._json_extras)
    // Fill group attributes
    // OS#1299 — string si monolingue (format historique), map { fr, en, ... } sinon.
    json_object['name'] = serializeLangMap(this._name_map) ?? ''
    // os#1517 — « un membre, en barre du haut » s'écrit comme avant, pour les viewers antérieurs ;
    // les autres combinaisons portent la barre du haut dans sa propre clé.
    json_object['banner'] = (this._in_topbar && this._banner === 'one') ? 'topbar' : this._banner
    if (this._in_topbar) json_object['topbar'] = true
    json_object['tags_order'] = this._tags_order
    // #486 - ecrits seulement quand ils s'ecartent du defaut : un diagramme qui
    // n'en declare pas produit exactement le meme JSON qu'avant.
    if (this._tags_separator !== undefined) json_object['tags_separator'] = this._tags_separator
    if (this._antagonists_separator !== undefined) json_object['antagonists_separator'] = this._antagonists_separator
    // #537 - meme regle d'ecriture conditionnelle que les separateurs ci-dessus :
    // un groupe qui ne declare rien produit exactement le meme JSON qu'avant.
    const description = serializeLangMap(this._description_map)
    if (description !== undefined) json_object['description'] = description
    const style_patch = serializeStylePatch(this._style_patch)
    if (style_patch !== undefined) json_object['style_patch'] = style_patch
    if (this._pinned_in_legend) json_object['pinned_in_legend'] = true
    // SA#541 - meme ecriture conditionnelle
    if (this._style_id !== undefined) json_object['style_id'] = this._style_id
    // Update tags infos
    const json_object_tags = {} as Type_JSON
    this.tags_list
      .forEach(tag => {
        json_object_tags[tag.id] = tag.toJSON()
      })
    json_object['tags'] = json_object_tags
  }

  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    this._fromJSON(json_object, kwargs)
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // #527 - memorise ce que le front ne modelise pas, pour le reemettre tel
    // quel. Les cles connues sont ecartees : certaines ne sont ecrites que
    // lorsqu'elles s'ecartent du defaut (separateurs, drapeaux de fusion), et
    // les garder ici figerait un ancien etat que l'utilisateur vient de changer.
    this._json_extras = {}
    Object.keys(json_object)
      .filter(key => !KNOWN_TAGG_JSON_KEYS.has(key))
      .forEach(key => { this._json_extras[key] = json_object[key] })
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    // Read group attributes
    // OS#1299 — accepte la string historique (rangée sous la langue déclarée du
    // fichier) ou la map { langue -> nom }.
    if (json_object['name'] !== undefined) {
      this._name_map = parseLangMap(
        json_object['name'],
        this._ref_sankey.drawing_area.application_data.language
      )
    }
    // Les fichiers d'avant 0.9 portent des bannières hors catalogue (« level » sur
    // les groupes de niveaux) : le tiroir de filtres ne rend que les valeurs du
    // type, une valeur inconnue y produit une carte vide (ni sélecteur ni action).
    // Hors catalogue → on garde le défaut du groupe.
    // #486 - cle absente (fichier anterieur) = defaut du format : on laisse
    // undefined plutot que de figer ':' / '/', pour ne pas transformer un fichier
    // muet en fichier qui declare les defauts.
    const tags_sep_read = getStringOrUndefinedFromJSON(json_object, 'tags_separator')
    if (tags_sep_read !== undefined && tags_sep_read !== '') this._tags_separator = tags_sep_read
    const anta_sep_read = getStringOrUndefinedFromJSON(json_object, 'antagonists_separator')
    if (anta_sep_read !== undefined && anta_sep_read !== '') this._antagonists_separator = anta_sep_read
    const banner_read = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
    const valid_banners: tag_banner_type[] = ['none', 'one', 'multi', 'sequence', 'topbar']
    if (valid_banners.includes(banner_read)) this.banner = banner_read
    // os#1517 — clé présente seulement quand elle vaut vrai ; absente, on ne touche à rien
    // (`fromJSON` sert aussi aux mises à jour partielles).
    if (json_object['topbar'] === true) this._in_topbar = true
    else if (json_object['topbar'] === false) this._in_topbar = false
    // #537 - cle absente = defaut du format. On n'ecrase que si la cle est
    // presente : `fromJSON` sert aussi aux mises a jour partielles, ou un JSON
    // muet ne doit rien effacer.
    if (json_object['description'] !== undefined) {
      this._description_map = parseLangMap(
        json_object['description'],
        this._ref_sankey.drawing_area.application_data.language
      )
    }
    if (json_object['style_patch'] !== undefined) {
      this._style_patch = parseStylePatch(json_object['style_patch'])
    }
    this._pinned_in_legend = getBooleanFromJSON(json_object, 'pinned_in_legend', this._pinned_in_legend)
    // SA#541 - cle absente = aucun style ; chaine vide ou non-chaine = aucun style.
    if (json_object['style_id'] !== undefined) {
      const style_id = json_object['style_id']
      this._style_id = (typeof style_id === 'string' && style_id !== '') ? style_id : undefined
      this._ref_sankey.tagStylesConfigUpdated?.()
    }
    // Create new tags & read their attributes
    const matching_tags_id: { [_: string]: string; } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: string; } : {}
    Object.entries(json_object['tags'])
      .forEach(([_, tag_json]) => {
        // Get or Create tag
        const tag_id = matching_tags_id[_] ?? _
        const tag = this._tags[_] ?? this.addTag(tag_id, tag_id) // Tag will be renamed in fromJSON method

        // Update tag with json
        tag.fromJSON(tag_json as Type_JSON)
      })
    // Read tags order (or rebuild from dict keys)
    const saved_order = getStringListFromJSON(json_object, 'tags_order', [])
    if (saved_order.length > 0) {
      // Use saved order, append any tags not in saved order
      this._tags_order = saved_order.filter(id => id in this._tags)
      Object.keys(this._tags).forEach(id => {
        if (!this._tags_order.includes(id)) this._tags_order.push(id)
      })
    } else {
      // Legacy: no saved order, use dict key order
      this._tags_order = Object.keys(this._tags)
    }

    // #537 - les attributs poses par ce ticket n'ont PAS d'equivalent de cette
    // auto-coloration, et c'est une decision explicite : une definition ne se
    // devine pas, et un patch de mise en forme fabrique d'office allumerait
    // l'interrupteur par groupe sur tous les fichiers existants (arbitrage A5 :
    // ferme par defaut, cle absente = comportement d'avant). Leur defaut est
    // donc « vide », ici comme a la declaration.
    const nb_tags = Object.values(this._tags).length
    if (Object.values(this._tags).filter(tag => tag.color != '').length == 0) {
      // if tags has no colors they are generated from the defaut color map
      const colors = colormap({
        colormap: 'jet',
        nshades: Math.max(11, nb_tags),
        format: 'hex',
        alpha: 1
      })
      let step = 1
      if (nb_tags < 11) {
        // colormap is sampled uniformly between the first index and the last
        step = Math.round(11 / nb_tags)
      }
      Object.values(this._tags).forEach((tag, i) => tag.color = colors[i * step])
    }
  }

  private fromLegacyJSON(json_object: Type_JSON) {
    if (json_object['group_name'] !== undefined) {
      this._name_map = parseLangMap(
        json_object['group_name'],
        this._ref_sankey.drawing_area.application_data.language
      )
    }
  }

  // PUBLIC GETTERS / SETTERS ===========================================================
  /**
   * #537 - Definition du groupe, resolue pour la langue active (repli
   * en->fr->premiere disponible). Destinee a l'info-bulle : JAMAIS affichee a la
   * place du nom du groupe.
   */
  public get description() { return resolveLangMap(this._description_map ?? {}, i18next.language) }
  public set description(value: string) {
    const lang = normalizeLang(i18next.language)
    if (!this._description_map) this._description_map = {}
    // Vider dans une langue alors que d'autres existent = supprimer la traduction.
    if (value === '' && Object.keys(this._description_map).some(l => l !== lang)) delete this._description_map[lang]
    else this._description_map[lang] = value
  }

  /** Map complete { langue -> definition } — pour l'edition multilingue. Copie. */
  public get description_map(): Type_LangMap { return { ...this._description_map } }
  public set description_map(value: Type_LangMap) { this._description_map = { ...value } }

  /**
   * #537 - Mise en forme portee par le groupe. Copie en lecture comme en
   * ecriture : un appelant qui garderait la reference muterait le groupe sans
   * passer par le setter.
   */
  public get style_patch(): Type_StylePatch { return { ...this._style_patch } }
  public set style_patch(value: Type_StylePatch) { this._style_patch = { ...value } }

  /**
   * SA#541 - Style nomme impose aux elements qui ne portent AUCUNE etiquette du
   * groupe (id de la liste des Styles). Il touche potentiellement tous les
   * elements de la famille : on les redessine tous.
   */
  // SA#553 - le style des elements sans etiquette est desormais celui de l'ETIQUETTE GENEREE du
  // groupe : groupe et etiquette generee sont deux portes vers le meme reglage (la cascade et la
  // legende lisent le groupe, le menu l'etiquette). `_style_id` ne sert plus qu'aux groupes sans
  // etiquette generee.
  public get style_id(): string | undefined {
    const untagged = this.untagged_tag
    return untagged ? untagged.style_id : this._style_id
  }
  public set style_id(value: string | undefined) {
    const untagged = this.untagged_tag
    if (untagged) {
      untagged.style_id = value
      return
    }
    const next = value === '' ? undefined : value
    if (this._style_id === next) return
    this._style_id = next
    this._ref_sankey.tagStylesConfigUpdated?.()
    this._ref_sankey.nodes_list.forEach(node => node.draw())
    this._ref_sankey.links_list.forEach(link => link.draw())
  }

  /**
   * SA#541 - Le groupe fonctionne-t-il par STYLES (lui ou une de ses etiquettes impose un style
   * existant) ? La coloration historique par couleur d'etiquette ne s'applique alors plus : la
   * couleur vient du style, et le menu n'affiche plus de couleur d'etiquette. Faux pour tous les
   * fichiers existants. Memorise sur l'epoque de configuration des styles d'etiquette.
   */
  public get uses_tag_styles(): boolean {
    const epoch = this._ref_sankey.tag_styles_config_epoch
    if (this._uses_tag_styles_epoch !== epoch) {
      const styles = this._ref_sankey.styles_dict
      const usable = (id: string | undefined) =>
        id !== undefined && styles[id] !== undefined && !styles[id].is_default_style
      this._uses_tag_styles = usable(this.style_id) || this.tags_list.some(tag => usable(tag.style_id))
      this._uses_tag_styles_epoch = epoch
    }
    return this._uses_tag_styles
  }

  /**
   * Raccord du #537 au predicat de legende du #533 (`tagGroupCarriesFormatting`,
   * Elements/legendItems.ts), qui lit un booleen `has_style_patch` : les deux
   * tickets, menes en parallele, s'etaient promis cette interface chacun avec
   * son propre nom (`style_patch` ici). Sans ce getter, un groupe portant une
   * mise en forme autre que la couleur n'entrait jamais en legende.
   *
   * Pose sur la classe COMMUNE : `Class_DataTagGroup` n'herite pas de
   * `Class_TagGroup`, un getter pose plus bas raterait les groupes de donnees.
   * Patch vide = false : aucun fichier existant ne change d'aspect.
   */
  public get has_style_patch(): boolean { return Object.keys(this._style_patch).length > 0 }

  /**
   * SA#553 - Etiquette generee « Sans [nom du groupe] », ou undefined pour les groupes qui n'en
   * ont pas (donnees, niveaux, vues, flux « de type unite »). Elle n'est PAS dans `tags_list`.
   */
  public get untagged_tag(): Class_ProtoTag | undefined { return undefined }

  /** SA#553 - Etiquettes du groupe suivies de son etiquette generee : ce que montrent menus, filtres et legende. */
  public get tags_list_with_untagged(): Class_ProtoTag[] {
    const untagged = this.untagged_tag
    return untagged ? [...this.tags_list, untagged] : this.tags_list
  }

  /** SA#553 - Redessine les elements de la famille du groupe (porteurs possibles de son etiquette generee). */
  public drawFamilyElements(): void { }

  /**
   * SA#580 - Le groupe attribue-t-il ses etiquettes par regles (cf. `TagAssignmentRule.ts`) ?
   * Seuls les groupes de flux le peuvent ; ici, jamais.
   */
  public get is_rule_based(): boolean { return false }

  /** SA#580 - Etiquette que la regle du groupe attribue a une valeur, undefined sans regle ni grandeur. */
  public ruleTagFor(_value: Type_RuleMeasurable): Class_ProtoTag | undefined { return undefined }

  /**
   * SA#553 - Retire et rend le style de groupe lu (ancien format du #541), pour le reporter sur
   * l'etiquette generee.
   */
  protected takeGroupStyleId(): string | undefined {
    const style_id = this._style_id
    this._style_id = undefined
    return style_id
  }

  /** #537 - Groupe epingle en bas de legende (Source, Methode). */
  public get pinned_in_legend(): boolean { return this._pinned_in_legend }
  public set pinned_in_legend(value: boolean) { this._pinned_in_legend = value }

  /**
   * #486 - Separateur effectif entre les etiquettes de ce groupe dans le format
   * Excel (colonne Etiquettes, et colonnes portant le nom du groupe). ':' par defaut.
   */
  public get tags_separator(): string {
    return this._tags_separator ?? DEFAULT_TAGS_SEPARATOR
  }

  public set tags_separator(value: string) {
    // Vide = revenir au defaut du format, pas figer une chaine vide (qui ferait
    // eclater chaque libelle caractere par caractere a la relecture).
    this._tags_separator = (value === '') ? undefined : value
  }

  /**
   * #486 - Separateur effectif entre groupes antagonistes declares sur une meme
   * ligne de la feuille Etiquettes. '/' par defaut.
   */
  public get antagonists_separator(): string {
    return this._antagonists_separator ?? DEFAULT_ANTAGONISTS_SEPARATOR
  }

  public set antagonists_separator(value: string) {
    this._antagonists_separator = (value === '') ? undefined : value
  }

  // PUBLIC METHODS =====================================================================
  public addTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = this.createTag(name, id)
    this._tags[tag.id] = tag
    this._tag_count = this._tag_count + 1
    if (!this._tags_order.includes(tag.id))
      this._tags_order.push(tag.id)
    return tag
  }

  public addDefaultTag() {
    const n = String(this._tag_count)
    const name = 'Etiquette ' + n
    return this.addTag(name)
  }

  public removeTag(_: Class_ProtoTag) {
    if (this._tags[_.id] !== undefined) {
      _.delete()
      delete this._tags[_.id]
      const idx = this._tags_order.indexOf(_.id)
      if (idx >= 0) this._tags_order.splice(idx, 1)
    }
  }

  public selectTagsFromId(
    id: string
  ) {
    // SA#553 - l'etiquette generee se choisit comme les autres : la choisir deselectionne toutes
    // les etiquettes du groupe. Choisir une etiquette ordinaire la laisse en l'etat — comme avant
    // elle, les elements sans etiquette restent visibles — sauf a l'annulation, qui rend l'etat
    // exact d'avant le geste.
    const untagged = this.untagged_tag
    const _selectTagsFromId = (_: string, untagged_selected?: boolean) => {
      this.tags_list
        .forEach(tag => {
          if (tag.id === _) {
            tag.setSelected()
          }
          else {
            tag.setUnSelected()
          }
        })
      if (untagged) {
        if (untagged.id === _ || untagged_selected === true) untagged.setSelected(false)
        else if (untagged_selected === false) untagged.setUnSelected(false)
      }
      // sa#283 — vues contextuelles : overlay appliqué APRÈS le basculement des tags,
      // AVANT le redraw d'updateTagsReferences (slot optionnel enregistré par OSP).
      this._ref_sankey.drawing_area.application_data.after_tag_selection_change?.()
      this.updateTagsReferences()
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToTags()
    }

    const old_selected = this.selected_tags_list.length > 0
      ? this.selected_tags_list[0].id
      : ((untagged?.is_selected) ? untagged.id : '')
    const old_untagged_selected = untagged?.is_selected
    this._ref_sankey.drawing_area.application_data.history.saveUndo(() => _selectTagsFromId(old_selected, old_untagged_selected))
    this._ref_sankey.drawing_area.application_data.history.saveRedo(() => _selectTagsFromId(id))
    _selectTagsFromId(id)
  }

  /**
   * @param include_untagged SA#553 - vrai quand `ids` dit AUSSI l'etat de l'etiquette generee
   * (filtres a choix multiple, qui la listent) ; faux pour les appelants historiques, qui ne la
   * connaissent pas et la laissent en l'etat.
   */
  public selectTagsFromIds(
    ids: string[],
    include_untagged: boolean = false
  ) {
    this.tags_list
      .forEach(tag => {
        if (ids.includes(tag.id)) {
          tag.setSelected(false)
        }
        else {
          tag.setUnSelected(false)
        }
      })
    const untagged = this.untagged_tag
    if (untagged && include_untagged) {
      if (ids.includes(untagged.id)) untagged.setSelected(false)
      else untagged.setUnSelected(false)
    }
    // sa#283 — vues contextuelles : même point d'accrochage que selectTagsFromId.
    this._ref_sankey.drawing_area.application_data.after_tag_selection_change?.()
    this.updateTagsReferences()
  }

  public abstract updateTagsReferences(): void;

  public moveTagUp(id: string) {
    const idx = this._tags_order.indexOf(id)
    if (idx > 0) {
      this._tags_order.splice(idx, 1)
      this._tags_order.splice(idx - 1, 0, id)
      // SA#541 - l'ordre des etiquettes departage les styles d'etiquette
      this._ref_sankey.tagStylesUpdated?.()
    }
  }

  public moveTagDown(id: string) {
    const idx = this._tags_order.indexOf(id)
    if (idx >= 0 && idx < this._tags_order.length - 1) {
      this._tags_order.splice(idx, 1)
      this._tags_order.splice(idx + 1, 0, id)
      // SA#541 - l'ordre des etiquettes departage les styles d'etiquette
      this._ref_sankey.tagStylesUpdated?.()
    }
  }

  public get tags_order() { return this._tags_order }

  // PROTECTED METHODS ==================================================================
  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_ProtoTag;

  // GETTERS ============================================================================
  /**
   * Id of tag group
   * @readonly
   * @type {string}
   * @memberof Class_ProtoTagGroup
   */
  public get id(): string { return this._id }

  /**
   * Name of tag group (!= id)
   * @type {string}
   * @memberof Class_ProtoTagGroup
   */
  public get name(): string { return resolveLangMap(this._name_map ?? {}, i18next.language) }

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_ProtoTag }}
   * @memberof Class_ProtoTagGroup
   */
  public abstract get tags_dict(): { [_: string]: Class_ProtoTag; };

  /**
  * Return list tag from the current group
  * @readonly
  * @memberof Class_ProtoTagGroup
  */
  public get tags_list(): Class_ProtoTag[] {
    if (this.tags_order.length > 0)
      return this.tags_order
        .filter(id => id in this.tags_dict)
        .map(id => this.tags_dict[id])
    return Object.values(this.tags_dict)
  }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public abstract get selected_tags_list(): Class_ProtoTag[];

  /**
   * True if tag group has tags
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public get has_tags() { return this.tags_list.length > 0 }

  /**
   * True if tag group has tags selected
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public get has_selected_tags() { return this.selected_tags_list.length > 0 }

  public get first_selected_tags() {
    if (this.has_tags)
      if (this.has_selected_tags)
        return this.selected_tags_list[0]

      else
        return this.tags_list[0]

    else
      return undefined
  }

  public get banner(): tag_banner_type { return this._banner }

  /** os#1517 — le choix se fait-il dans la barre du haut ? Indépendant de `banner`. */
  public get in_topbar(): boolean { return this._in_topbar }
  public set in_topbar(value: boolean) { this._in_topbar = value }

  // SETTERS ============================================================================
  public set name(value: string) {
    const lang = normalizeLang(i18next.language)
    if (!this._name_map) this._name_map = {}
    // Vider dans une langue alors que d'autres existent = supprimer la traduction.
    if (value === '' && Object.keys(this._name_map).some(l => l !== lang)) delete this._name_map[lang]
    else this._name_map[lang] = value
  }
  /**
   * os#1517 — `topbar` n'est plus une forme : l'écrire (ancien code, ancien fichier) pose « un
   * membre à la fois » ET la barre du haut. `banner` ne vaut donc jamais `'topbar'` en mémoire.
   */
  public set banner(value: tag_banner_type) {
    if (value === 'topbar') {
      this._banner = this.admissibleBanner('one')
      this._in_topbar = true
      return
    }
    this._banner = this.admissibleBanner(value)
  }

  /** La bannière que ce groupe accepte pour `value` (cf. `Class_DataTagGroup` : dimension additive). */
  protected admissibleBanner(value: tag_banner_type): tag_banner_type { return value }
}
// CLASS TAGGROUP ***********************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */

export abstract class Class_TagGroup extends Class_ProtoTagGroup {

  // PROTECTED ATTRIBUTES ===============================================================
  protected abstract _tags: { [_: string]: Class_Tag; };

  // PRIVATE ATTRIBUTES =================================================================
  // Display attributes
  private _use_colors: boolean = false

  // SA#553 - etiquette generee, creee a la premiere demande (cf. `untagged_tag`)
  private _untagged_tag: Class_Tag | undefined = undefined

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: Class_Sankey
  ) {
    super(id, name, sankey)
    // Default banner as multi
    this.banner = 'multi'
  }

  // CLEANING METHODS ==================================================================
  // COPY METHODS =====================================================================
  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['use_colors'] = this._use_colors
    // SA#553 - ecriture conditionnelle : rien de saisi, pas de cle
    const untagged_json = this.untaggedTagObject().toUntaggedJSON()
    if (untagged_json !== undefined) json_object['untagged_tag'] = untagged_json
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._use_colors = getBooleanFromJSON(json_object, 'use_colors', this._use_colors)
    // SA#553 - etat de l'etiquette generee. Un JSON de groupe complet (qui porte ses etiquettes)
    // le decrit entierement, cle absente = etat par defaut ; une mise a jour partielle muette
    // n'y touche pas.
    const untagged = this.untaggedTagObject()
    if (json_object['untagged_tag'] !== undefined || json_object['tags'] !== undefined) {
      untagged.fromUntaggedJSON(json_object['untagged_tag'] as Type_JSON | undefined)
    }
    // SA#553 - le style de groupe du #541 (fichiers crees depuis le 2026-09-14) devient celui de
    // l'etiquette generee : il ne s'ecrit plus sur le groupe.
    if (this.supports_untagged_tag) {
      const group_style_id = this.takeGroupStyleId()
      if (group_style_id !== undefined && untagged.style_id === undefined) untagged.adoptStyleId(group_style_id)
    }
    // SA#541 - l'interrupteur allume ou eteint les styles d'etiquette du groupe
    this._ref_sankey.tagStylesConfigUpdated?.()
  }

  protected _copyFrom(
    tagg_to_copy: Class_TagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    this._use_colors = tagg_to_copy.use_colors
    // SA#553 - nom, definition, style et selection de l'etiquette generee suivent le groupe
    this.untaggedTagObject().copyFrom(tagg_to_copy.untaggedTagObject())
    // SA#541 - l'interrupteur allume ou eteint les styles d'etiquette du groupe
    this._ref_sankey.tagStylesConfigUpdated?.()
  }

  // SA#553 - ETIQUETTE GENEREE =========================================================

  /** Le groupe a-t-il une etiquette generee ? Faux pour les niveaux et les vues. */
  protected get supports_untagged_tag(): boolean { return true }

  protected abstract createUntaggedTag(id: string): Class_Tag

  /** L'objet etiquette generee, qu'elle s'applique ou non a ce groupe (son etat se persiste). */
  public untaggedTagObject(): Class_Tag {
    if (this._untagged_tag === undefined) {
      this._untagged_tag = this.createUntaggedTag(untaggedTagId(this.id))
      this._untagged_tag.markAsUntagged()
    }
    return this._untagged_tag
  }

  public get untagged_tag(): Class_Tag | undefined {
    return this.supports_untagged_tag ? this.untaggedTagObject() : undefined
  }

  public get tags_list_with_untagged(): Class_Tag[] {
    const untagged = this.untagged_tag
    return untagged ? [...this.tags_list, untagged] : this.tags_list
  }

  /** Elements de la famille du groupe : les noeuds pour un groupe de noeuds, les flux sinon. */
  protected abstract familyElements(): (Class_NodeElement | Class_LinkElement)[]

  public drawFamilyElements(): void {
    this.familyElements().forEach(element => element.draw())
  }

  // PUBLIC METHODS =====================================================================
  public updateTagsReferences(): void {
    // SA#580 - groupe attribue par regles : ses etiquettes n'ont aucune reference (le port se
    // calcule), n'importe quel flux peut en porter une. On les redessine tous — sans quoi
    // l'interrupteur « Style » ne recolorait rien (vu au test local du 2026-10-02).
    if (this.is_rule_based) {
      this.drawFamilyElements()
      return
    }
    const ref_updated: (Class_NodeElement | Class_LinkElement | Class_ElementValue | Class_ElementTaggedValue)[] = []
    Object.values(this._tags)
      .forEach(tag => {
        tag.references
          .forEach(ref => {
            if (ref_updated.indexOf(ref) < 0) {
              ref.draw()
              ref_updated.push(ref)
            }
          })
      })
    // SA#553 - porteurs de l'etiquette generee : ils n'ont pas de reference, et leur visibilite
    // depend de sa selection. Seuls les elements sans etiquette du groupe sont concernes.
    const untagged = this.untagged_tag
    if (untagged) {
      this.familyElements()
        .filter(element => element.hasGivenTag(untagged))
        .forEach(element => element.draw())
    }
    //this._ref_sankey.drawing_area.checkAndUpdateAreaSize()
  }

  // PROTECTED METHODS ==================================================================
  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_Tag;

  // GETTER =============================================================================
  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_TagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return ordered list of tags from the current group
   * @type {Class_Tag[]}
   * @memberof Class_TagGroup
   */
  public get tags_list(): Class_Tag[] {
    if (this.tags_order.length > 0)
      return this.tags_order
        .filter(id => id in this.tags_dict)
        .map(id => this.tags_dict[id])
    return Object.values(this.tags_dict)
  }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_TagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }

  public get use_colors(): boolean { return this._use_colors }

  // SETTER =============================================================================
  public set use_colors(value: boolean) {
    // Avoid useless updates
    if (this._use_colors !== value) {
      this._use_colors = value
      // SA#541 - l'interrupteur « Appliquer les styles associes » allume ou eteint aussi les
      // styles d'etiquette du groupe, qui touchent potentiellement tous les elements (style
      // du groupe pour les elements sans etiquette). Les signaux d'epoque sont appeles en
      // `?.()` dans tout ce fichier : ce ne sont que des invalidations de cache, et des tests
      // unitaires construisent des groupes sur un diagramme simule qui ne les porte pas.
      this._ref_sankey.tagStylesConfigUpdated?.()
      if (this.uses_tag_styles) {
        this._ref_sankey.nodes_list.forEach(node => node.draw())
        this._ref_sankey.links_list.forEach(link => link.draw())
      }
      this.updateTagsReferences()
    }
  }
}
// CLASS NODETAGGROUP *******************************************************************
/**
 * Class that define a Node TagGroup object
 * @export
 * @class Class_TagGroup
 */

export class Class_NodeTagGroup extends Class_TagGroup {

  // PROTECTED ATTRIBUTES ===============================================================
  protected _tags: { [_: string]: Class_NodeTag; }

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: Class_Sankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Init dict of tags
    this._tags = {}
    // Create a first default tag
    if (with_a_tag) this.addTag('Etiquette 0')
  }

  // PUBLIC METHODS =====================================================================
  /**
   * #374 — Les références d'un Class_NodeTag sont les nœuds SEULS, alors que la
   * couleur d'un flux en dérive : en règle 'auto' (comme en 'source' / 'target' /
   * 'gradient'), Class_LinkElement.getShapeColorToUse() lit les tags des nœuds
   * source/cible filtrés sur `tag.group.use_colors`. Redessiner les seules
   * références laissait donc les flux avec leur couleur précédente jusqu'au geste
   * suivant qui forçait leur redessin (changement de dataTag, décochage d'une
   * étiquette…). On étend le redessin aux flux incidents des nœuds référencés,
   * ce qui couvre d'un coup les trois chemins d'écriture de `use_colors`
   * (interrupteur du bandeau, level tagg, undo/redo) ainsi que la sélection
   * d'étiquettes. Le coût reste borné par le nombre de flux du diagramme —
   * moins que le redessin complet que fait déjà Class_DataTagGroup.
   * @memberof Class_NodeTagGroup
   */
  public updateTagsReferences(): void {
    super.updateTagsReferences()
    const links_drawn: { [_: string]: boolean } = {}
    Object.values(this._tags)
      .forEach(tag => {
        tag.references
          .forEach(ref => {
            if (!(ref instanceof Class_NodeElement)) return
            ref.input_links_list
              .concat(ref.output_links_list)
              .forEach(link => {
                if (!links_drawn[link.id]) {
                  links_drawn[link.id] = true
                  link.draw()
                }
              })
          })
      })
  }

  // PROTECTED METHODS ==================================================================
  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_NodeTag(name, this, this._ref_sankey, id)
    tag.setSelected()
    return tag
  }

  // SA#553 - etiquette generee : un Class_NodeTag, sans signal a la creation (cf. markAsUntagged)
  protected createUntaggedTag(id: string) {
    return new Class_NodeTag('', this, this._ref_sankey, id)
  }

  protected familyElements() { return this._ref_sankey.nodes_list }

}
// CLASS FLUXTAGGROUP *******************************************************************
/**
 * Class that define a Flux TagGroup object
 * @export
 * @class Class_TagGroup
 */

export class Class_FluxTagGroup extends Class_TagGroup {

  // #284 — concept unifié (NOTE-FUSION-TAGS.md §3) : un groupe de tags de flux
  // est soit une dimension (ex-dataTag, structure l'arbre de valeurs), soit un
  // groupe optionnel (annote/partitionne les feuilles). Le flag est porté par
  // la classe (pas de bascule dynamique en phase 1).
  public get is_dimension(): boolean { return false }

  // #285 (§3.0ter) — un groupe libre est soit PORTEUR DE VALEURS (chaque
  // valeur du flux est attachée à un tag du groupe — dataTag-light, épars),
  // soit pure étiquette (annotation du flux entier). Porté par les
  // conversions (dimension→annotation, fusion de flux parallèles) ou réglé
  // dans l'éditeur de groupes.
  private _carries_values: boolean = false

  // §3.0ter — échelles DIFFÉRENTES par tag (cas jeu d'unités kWh/t/€) : la
  // colonne échelle et l'usage des échelles propres ne s'activent que si le
  // groupe le déclare — sinon tous les tags suivent l'échelle du dessin.
  private _has_own_scales: boolean = false

  // OS#1286 (fusion) — groupe « de type unité » : chaque tag porte alors une
  // référence d'unité du registre du diagramme (Class_FluxTag.unit_ref) au lieu
  // d'une échelle libre. Remplace les anciens data_taggs is_unit. Implique
  // carries_values ; la largeur de bande dérive du coefficient de l'unité.
  private _is_unit_type: boolean = false

  // #285 — groupe porteur ADDITIF : les valeurs coordonnées s'additionnent, la
  // valeur du flux = leur SOMME (le total, accessible) et le détail apparaît en
  // bandes. Opposé au cas « unité » (is_unit_type) où les valeurs sont non
  // additives (kWh/t/€) et la valeur affichée = celle du tag sélectionné.
  // Défaut true : un groupe porteur non-unité est additif (rétro-compat : les
  // fichiers fusion existants deviennent additifs).
  private _is_additive: boolean = true

  // SA#580 — groupe « attribué par règles » (cf. `TagAssignmentRule.ts`) : ses étiquettes se
  // calculent sur la valeur affichée de chaque flux, elles ne s'affectent pas. undefined = groupe
  // ordinaire. Écrit seulement s'il est posé.
  private _assignment_rule: Type_AssignmentRule | undefined = undefined

  public get assignment_rule(): Type_AssignmentRule | undefined { return this._assignment_rule }
  public set assignment_rule(_: Type_AssignmentRule | undefined) {
    this._assignment_rule = _
    this.ruleConfigUpdated()
  }

  public override get is_rule_based(): boolean { return this._assignment_rule !== undefined }

  /** SA#580 — étiquette de la tranche où tombe la grandeur de la valeur (cf. `resolveRuleTag`). */
  public override ruleTagFor(value: Type_RuleMeasurable): Class_FluxTag | undefined {
    if (this._assignment_rule === undefined) return undefined
    return resolveRuleTag(value.ruleQuantity(this._assignment_rule.quantity), this.tags_list as Class_FluxTag[])
  }

  /**
   * SA#580 — la règle ou un seuil a changé : chaque flux peut changer d'étiquette. Les mémoires de
   * visibilité (empreinte des étiquettes de flux) et de style (époques du #541) sont périmées, et
   * tous les flux comme la légende sont à redessiner — sans relancer le calcul du bilan.
   * Signaux en `?.()` : des tests construisent des groupes sur un diagramme simulé.
   */
  public ruleConfigUpdated(): void {
    this._ref_sankey.fluxTagsUpdated?.()
    this._ref_sankey.tagStylesConfigUpdated?.()
    this._ref_sankey.links_list?.forEach(link => link.draw())
    this._ref_sankey.drawing_area?.legend?.draw()
  }

  public get carries_values(): boolean { return this._carries_values }
  public set carries_values(_: boolean) { this._carries_values = _ }

  public get has_own_scales(): boolean { return this._has_own_scales }
  public set has_own_scales(_: boolean) { this._has_own_scales = _ }

  public get is_unit_type(): boolean { return this._is_unit_type }
  public set is_unit_type(_: boolean) { this._is_unit_type = _ }

  public get is_additive(): boolean { return this._is_additive }
  public set is_additive(_: boolean) { this._is_additive = _ }

  /** True si ce groupe porteur additionne ses valeurs (total = somme) — additif
   *  ET pas de type unité. Base commune pour valueCurrent et l'affichage. */
  public get is_additive_carrier(): boolean {
    return this._carries_values && this._is_additive && !this._is_unit_type
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    if (this._carries_values) json_object['carries_values'] = true
    if (this._has_own_scales) json_object['has_own_scales'] = true
    if (this._is_unit_type) json_object['is_unit_type'] = true
    // Défaut true → on ne sérialise que l'exception (non additif sans être unité).
    if (!this._is_additive) json_object['is_additive'] = false
    // SA#580 — écriture conditionnelle : un groupe ordinaire produit le même JSON qu'avant
    const assignment_rule = serializeAssignmentRule(this._assignment_rule)
    if (assignment_rule !== undefined) json_object['assignment_rule'] = assignment_rule
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._carries_values = getBooleanFromJSON(json_object, 'carries_values', this._carries_values)
    this._has_own_scales = getBooleanFromJSON(json_object, 'has_own_scales', this._has_own_scales)
    this._is_unit_type = getBooleanFromJSON(json_object, 'is_unit_type', this._is_unit_type)
    this._is_additive = getBooleanFromJSON(json_object, 'is_additive', this._is_additive)
    // SA#580 — un JSON de groupe complet (qui porte ses étiquettes) décrit entièrement la règle,
    // clé absente = groupe ordinaire ; une mise à jour partielle muette n'y touche pas. Posée
    // sans signal : les flux ne sont pas encore lus, rien n'est à redessiner.
    if (json_object['assignment_rule'] !== undefined || json_object['tags'] !== undefined) {
      this._assignment_rule = parseAssignmentRule(json_object['assignment_rule'])
    }
  }

  // #528 — ces quatre drapeaux sont serialises (ci-dessus) mais n'etaient pas
  // recopies : une duplication de groupe, une fusion de mise en page
  // (updateFrom) ou une copie de diagramme rendait un groupe « porteur de
  // valeurs / de type unite / non additif » en simple groupe d'annotation, en
  // silence. Comme au #385, la liste des etiquettes paraissait correcte sous le
  // defaut : seule la valeur des reglages le montrait.
  protected _copyFrom(
    tagg_to_copy: Class_FluxTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    this._carries_values = tagg_to_copy._carries_values
    this._has_own_scales = tagg_to_copy._has_own_scales
    this._is_unit_type = tagg_to_copy._is_unit_type
    this._is_additive = tagg_to_copy._is_additive
    // SA#580 — comme ces drapeaux (#528) : une copie de groupe perdrait sa règle en silence
    this._assignment_rule = parseAssignmentRule(serializeAssignmentRule(tagg_to_copy._assignment_rule))
  }

  // PROTECTED ATTRIBUTES ===============================================================
  protected _tags: { [_: string]: Class_FluxTag; }

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: Class_Sankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Init dict of tags
    this._tags = {}
    // Create a first default tag
    if (with_a_tag) this.addTag('Etiquette 0')
  }

  // PROTECTED METHODS ==================================================================
  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_FluxTag(name, this, this._ref_sankey, id)
    tag.setSelected()
    return tag
  }

  // SA#553 - etiquette generee : un Class_FluxTag, sans signal a la creation (cf. markAsUntagged)
  protected createUntaggedTag(id: string) {
    return new Class_FluxTag('', this, this._ref_sankey, id)
  }

  protected familyElements() { return this._ref_sankey.links_list }

  // SA#553 - un groupe « de type unite » decrit une dimension, que toute valeur porte
  protected get supports_untagged_tag(): boolean { return !this._is_unit_type }

}
// CLASS DATATAGGROUP *******************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */

export class Class_DataTagGroup extends Class_ProtoTagGroup {

  // #284 — pendant dimension du concept unifié (cf. Class_FluxTagGroup.is_dimension)
  public get is_dimension(): boolean { return true }

  // PRIVATE ATTRIBUTES =================================================================
  // Display attributes
  private _use_colors: boolean = false

  private _is_unit = false

  // #161 — when false, the diagram structure is not propagated across this
  // group's tags: a flux absent for a tag does not exist there. Default true
  // (legacy). Mirrors the parser's TagGroup.propagate_structure.
  private _propagate_structure = true

  // #370 — Mode d'affichage (absolu / proportionnel / échelle adaptée) PROPRE à cette
  // dimension : « comment le diagramme doit réagir quand on fait défiler CETTE
  // dimension ». C'est désormais la source de vérité du mode — il n'y a plus de réglage
  // global (décision utilisateur du 2026-08-05, qui remplace celle du #367).
  //
  // Le moteur de dessin, lui, ne sait faire qu'UN mode à la fois
  // (`styles_dict['default'].shape_position_type`) : cet attribut n'est donc pas un état
  // parallèle, c'est la CONSIGNE que la dimension impose au dessin dès qu'on agit sur
  // elle (changement de tag, défilement de séquence). Une échelle adaptée sur « Unité »
  // et un proportionnel sur « Année » ne coexistent pas à l'écran : le diagramme bascule
  // dans le mode de la dimension que l'on manipule.
  private _position_mode: Type_PositionMode = 'absolute'

  // os#1511 lot 1 — NOMS des niveaux de la dimension, du plus AGRÉGÉ au plus FIN
  // (['filiere', 'transformation', 'produit']).
  //
  // Les niveaux ne font que NOMMER des profondeurs : la HIÉRARCHIE, c'est la parenté des membres
  // (`Class_DataTag.parent`), et le niveau d'un membre se DÉDUIT du nombre de ses ancêtres. Deux
  // sources (le membre dirait son niveau, et sa parenté dirait autre chose) finiraient par se
  // contredire. Une profondeur sans nom en reçoit un par défaut (cf. `levels`).
  //
  // Le niveau COURANT n'est pas stocké : il se déduit de la sélection (cf. `current_level_index`).
  // Un niveau par DIMENSION (décision de Julien du 27/09) : on veut pouvoir croiser un axe fin
  // avec un axe grossier — « les céréales, par pays ».
  private _levels: string[] = []

  // Index des ENFANTS par membre parent, et profondeur de chaque membre. Dérivé de la parenté,
  // jamais sérialisé ; invalidé par tout changement de structure (`invalidateHierarchyIndex`).
  // `_hierarchy_index_of` retient le dictionnaire de membres indexé : un groupe vidé par
  // réaffectation de `_tags` (suppression, copie) se reconnaît sans avoir à le signaler.
  private _children_index: Map<string, Class_DataTag[]> | undefined = undefined
  private _depth_index: Map<string, number> | undefined = undefined
  private _max_depth: number = 0
  private _hierarchy_index_of: object | undefined = undefined

  // os#1516 — recette de palette hiérarchique ; `undefined` = couleurs libres, comme avant.
  private _palette: Type_DimensionPalette | undefined = undefined
  // Pendant un chargement, les membres arrivent un à un avec leur couleur enregistrée : recalculer
  // sur un arbre partiel écraserait ces couleurs par celles d'une hiérarchie incomplète.
  private _palette_suspended: boolean = false

  // os#1511 — UN DIAGRAMME PAR MEMBRE (« petits multiples »). Quand plusieurs nœuds portent la
  // dimension, leurs nœuds engendrés se rangent en BANDES, une par membre — le diagramme se répète
  // une fois par membre, les copies les unes sous les autres — au lieu de s'empiler étape par
  // étape dans le créneau de chaque nœud. `undefined` = automatique : bandes dès que deux nœuds ou
  // plus la portent (cf. `DimensionDisaggregation.bandesParMembre`). Écrit seulement s'il est posé.
  private _member_bands: boolean | undefined = undefined
  // os#1511 — c'est CETTE dimension qui peint les flux d'un diagramme par membre (légende, pinceau).
  private _paints_flows: boolean = false
  // os#1511 — NŒUD DE RÉFÉRENCE de la mise en page désagrégée (Julien, 01/10 : « la faire à partir
  // d'un nœud de référence et tout placer autour de lui »). Il ne bouge pas ; les nœuds engendrés
  // se placent autour de lui le long des flux. `undefined` = automatique
  // (cf. `DimensionDisaggregation.noeudDeReference`). Écrit seulement s'il est posé.
  private _reference_node_id: string | undefined = undefined

  // os#1511 — ORDRE DES MEMBRES dessinés, EN BANDES COMME EN NŒUDS (cf.
  // `Algorithms/DimensionMemberOrder`). `undefined` = défaut (par valeur au premier niveau). Écrit
  // seulement s'il est posé. Remplace `bands_by_value` / `nodes_by_value` (deux cases, même 30/09),
  // relus à la lecture : `false` y voulait dire l'ordre de l'arbre.
  private _members_order: Type_MembersOrder | undefined = undefined

  // 07/10/2026 — LA PORTÉE (ZOOM) DU DIAGRAMME sur cette dimension (os#1511, revirement de Julien :
  // en LIÉ, le zoom est partagé). Les membres dans lesquels on est descendu (antichaîne) ; vide = la
  // racine. Toutes les fenêtres liées (couronne, tableau croisé, Sankey) la lisent ; le diagramme
  // l'applique par sa sélection, restreinte à la portée. Écrite seulement si elle est posée.
  private _focus_ids: string[] = []

  // 07/10/2026 — LES DÉCOCHÉS DU DIAGRAMME (os#1511, réponse de Julien : en LIÉ, ils sont partagés
  // comme la portée). Un membre décoché n'est plus choisi — le diagramme ne le dessine pas — mais il
  // garde sa ligne, grisée, dans les légendes et le tableau de navigation des fenêtres liées.
  private _hidden_ids: string[] = []

  // PROTECTED ATTRIBUTES ===============================================================
  protected _tags: { [_: string]: Class_DataTag; }

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: Class_Sankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Init dict of tags
    this._tags = {}
    // Create and select a first default tag
    if (with_a_tag) {
      const tag = this.addTag('Etiquette 0')
      tag.setSelected()
    }
  }

  // COPY METHODS =======================================================================
  // L'appariement des ids de tags DOIT être transmis au super : sans lui, deux
  // groupes de données appariés par NOM mais portant des ids de tags différents
  // (cas nominal d'`updateFrom`) voient leur `tags_order` réécrit avec les ids de
  // la SOURCE. Les tags de la cible sortent alors de l'ordre affiché — leurs
  // branches de valeurs sur les liens deviennent inatteignables — et les tags de
  // la source sont recréés à vide à côté d'eux : les valeurs taguées de la cible
  // sont perdues à l'écran comme à l'enregistrement.
  protected _copyFrom(
    tagg_to_copy: Class_DataTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    // os#1511 — les membres ont recopié l'id de parent de la SOURCE : on le ramène aux ids de ce
    // groupe (`matching_tags_id` va de nos ids vers ceux de la source).
    const source_to_target: { [source_id: string]: string } = {}
    Object.entries(matching_tags_id).forEach(([target, source]) => { source_to_target[source] = target })
    if (Object.keys(source_to_target).length > 0) {
      (this.tags_list as Class_DataTag[]).forEach(tag => tag.remapParentId(source_to_target))
    }
    this._use_colors = tagg_to_copy.use_colors
    this._is_unit = tagg_to_copy._is_unit
    this._propagate_structure = tagg_to_copy._propagate_structure
    this._position_mode = tagg_to_copy._position_mode
    // os#1511 — tout ce que `_toJSON` écrit se copie : sans ces lignes, réinitialiser une vue
    // (ViewsManager → `sankey.copyFrom`) aplatissait une dimension hiérarchisée.
    // Le niveau courant se déduit de la sélection, recopiée avec les membres.
    this._levels = [...tagg_to_copy._levels]
    this._palette = tagg_to_copy._palette === undefined ? undefined : copyPalette(tagg_to_copy._palette)
    this._member_bands = tagg_to_copy._member_bands
    this._paints_flows = tagg_to_copy._paints_flows
    this._reference_node_id = tagg_to_copy._reference_node_id
    this._members_order = tagg_to_copy._members_order
    this._focus_ids = [...tagg_to_copy._focus_ids]
    this._hidden_ids = [...tagg_to_copy._hidden_ids]
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['use_colors'] = this._use_colors
    json_object['is_unit'] = this._is_unit
    json_object['propagate_structure'] = this._propagate_structure
    // #370 — le mode d'affichage voyage avec la dimension (ancien #369 : il n'était
    // persisté nulle part et retombait sur « absolu » à chaque ouverture).
    json_object['position_mode'] = this._position_mode
    // os#1511 — clé ADDITIVE, écrite seulement quand des niveaux sont nommés. Le niveau courant
    // ne s'écrit plus (`current_level`) : il se déduit de la sélection, qui voyage déjà.
    if (this._levels.length > 0) json_object['levels'] = [...this._levels]
    // os#1516 — clé ADDITIVE, écrite seulement par une dimension qui a reçu une palette hiérarchique.
    if (this._palette !== undefined) json_object['palette'] = copyPalette(this._palette)
    // os#1511 — clé ADDITIVE, écrite seulement quand l'auteur a tranché (sinon : automatique).
    if (this._member_bands !== undefined) json_object['member_bands'] = this._member_bands
    if (this._paints_flows) json_object['paints_flows'] = true
    if (this._reference_node_id !== undefined) json_object['reference_node'] = this._reference_node_id
    // os#1511 — clé ADDITIVE, écrite seulement quand l'auteur a quitté le défaut.
    if (this._members_order !== undefined) json_object['members_order'] = this._members_order
    // os#1511 — clé ADDITIVE, écrite seulement quand le diagramme est zoomé.
    if (this._focus_ids.length > 0) json_object['focus'] = [...this._focus_ids]
    // os#1511 — clé ADDITIVE, écrite seulement quand des membres sont décochés.
    if (this._hidden_ids.length > 0) json_object['hidden_members'] = [...this._hidden_ids]
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    this._palette_suspended = true
    try {
      this._fromJSONDimension(json_object, kwargs)
    } finally {
      this._palette_suspended = false
    }
  }

  private _fromJSONDimension(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    // os#1516 — cf. _toJSON. Absente → couleurs libres. Les couleurs des membres sont relues
    // telles qu'enregistrées : on ne recalcule pas à l'ouverture.
    this._palette = parsePalette(json_object['palette'])
    this._use_colors = getBooleanFromJSON(json_object, 'use_colors', this._use_colors)
    if ( getBooleanFromJSON(json_object, 'is_sequence', false)) {
      this.banner = 'sequence'
    }
    this._is_unit = getBooleanFromJSON(json_object, 'is_unit', this._is_unit)
    this._propagate_structure = getBooleanFromJSON(json_object, 'propagate_structure', this._propagate_structure)
    // #370 — rétro-compatibilité : un fichier antérieur n'a pas la clé, la dimension
    // retombe sur « absolu ». Une valeur inconnue (ou l'ancien mode hérité
    // `parametric`, qui n'est pas proposé par le sélecteur) est ignorée de même.
    const raw_position_mode = getStringFromJSON(json_object, 'position_mode', this._position_mode)
    if (isPositionMode(raw_position_mode)) this._position_mode = raw_position_mode
    // os#1511 — cf. _toJSON. On ne retient que des noms de niveaux non vides et distincts :
    // un doublon rendrait le sélecteur ambigu, et un niveau vide ne serait pas nommable.
    const raw_levels = json_object['levels']
    if (Array.isArray(raw_levels)) {
      const vus = new Set<string>()
      this._levels = raw_levels
        .filter((n): n is string => typeof n === 'string' && n !== '')
        .filter(n => !vus.has(n) && (vus.add(n), true))
    }
    // `current_level` (fichiers d'avant le 02/10) n'est plus lu : le niveau courant se déduit de
    // la sélection relue avec les membres, qui le contredisait parfois.
    if (typeof json_object['member_bands'] === 'boolean') this._member_bands = json_object['member_bands'] as boolean
    this._paints_flows = json_object['paints_flows'] === true
    const reference = json_object['reference_node']
    if (typeof reference === 'string' && reference !== '') this._reference_node_id = reference
    const ordre_lu = json_object['members_order']
    if (typeof ordre_lu === 'string' && (MEMBERS_ORDERS as string[]).includes(ordre_lu)) {
      this.members_order = ordre_lu as Type_MembersOrder
    } else if (json_object['bands_by_value'] === false || json_object['nodes_by_value'] === false) {
      this._members_order = 'tree'
    }
    const focus_lu = json_object['focus']
    if (Array.isArray(focus_lu)) this._focus_ids = focus_lu.filter((v): v is string => typeof v === 'string' && v !== '')
    const decoches_lus = json_object['hidden_members']
    if (Array.isArray(decoches_lus)) this._hidden_ids = decoches_lus.filter((v): v is string => typeof v === 'string' && v !== '')
    // os#1511 — la bannière est lue avant les membres et leur parenté : une dimension hiérarchisée
    // enregistrée « un membre à la fois » passe ici au choix multiple, son membre coché gardé.
    this.invalidateHierarchyIndex()
    this.normalizeBanner()
  }

  /**
   * 07/10/2026 — LA PORTÉE DU DIAGRAMME (os#1511) : les membres existants dans lesquels on est
   * descendu ; vide = la racine. Le diagramme est zoomé quand toute sa sélection tient dans la
   * portée : une sélection qui en sort (un autre sélecteur, la barre du haut) défait le zoom, la
   * portée se lit alors vide.
   */
  public get focus_ids(): string[] {
    const members = this._focus_ids
      .map(id => this.tags_dict[id] as Class_DataTag | undefined)
      .filter((m): m is Class_DataTag => m !== undefined)
    if (members.length === 0) return []
    const selection = this.selected_tags_list as Class_DataTag[]
    const inside = selection.length > 0 && selection.every(s => members.some(f => s === f || s.hasAncestor(f)))
    return inside ? members.map(m => m.id) : []
  }
  /**
   * 07/10/2026 — LES DÉCOCHÉS DU DIAGRAMME (os#1511) : les membres existants décochés, et qui ne
   * sont pas choisis (un membre choisi à nouveau, par n'importe quel sélecteur, n'est plus décoché).
   */
  public get hidden_ids(): string[] {
    return this._hidden_ids.filter(id => {
      const m = this.tags_dict[id] as Class_DataTag | undefined
      return m !== undefined && !m.is_selected
    })
  }
  /** Les décochés tels qu'écrits (instantanés d'historique). */
  public get stored_hidden_ids(): string[] { return [...this._hidden_ids] }
  public set hidden_ids(value: string[]) {
    this._hidden_ids = [...new Set(value.filter(id => typeof id === 'string' && id !== ''))]
  }

  /** La portée telle qu'écrite, sans la confronter à la sélection (instantanés d'historique). */
  public get stored_focus_ids(): string[] { return [...this._focus_ids] }
  public set focus_ids(value: string[]) {
    this._focus_ids = [...new Set(value.filter(id => typeof id === 'string' && id !== ''))]
  }

  /** os#1511 — la dimension choisie pour peindre les flux d'un diagramme par membre. */
  public get paints_flows(): boolean { return this._paints_flows }
  public set paints_flows(value: boolean) { this._paints_flows = value }

  /** os#1511 — un diagramme par membre : `undefined` = automatique (cf. `_member_bands`). */
  public get member_bands(): boolean | undefined { return this._member_bands }
  public set member_bands(value: boolean | undefined) {
    this._member_bands = value
    // Sous des bandes demandées, tous les nœuds portent la dimension (`Node.driving_dimension`), y
    // compris ceux réglés sur une AUTRE : le dessin de toutes les dimensions est à relire.
    ;(this._ref_sankey.data_taggs_list as Class_DataTagGroup[]).forEach(dimension => dimension.drawingChanged())
  }

  /** os#1511 — nœud de référence de la mise en page désagrégée : `undefined` = automatique. */
  public get reference_node_id(): string | undefined { return this._reference_node_id }
  public set reference_node_id(value: string | undefined) {
    this._reference_node_id = (value === undefined || value === '') ? undefined : value
  }

  /** os#1511 — ordre des membres dessinés, en bandes comme en nœuds (défaut : par valeur au premier niveau). */
  public get members_order(): Type_MembersOrder { return this._members_order ?? DEFAULT_MEMBERS_ORDER }
  public set members_order(value: Type_MembersOrder) {
    this._members_order = value === DEFAULT_MEMBERS_ORDER ? undefined : value
  }

  // HIÉRARCHIE DE LA DIMENSION (os#1511 lot 1) =========================================

  /**
   * Noms des niveaux EFFECTIFS, du plus agrégé au plus fin : un par profondeur de la hiérarchie
   * (et au moins autant que de niveaux nommés). Une profondeur sans nom reçoit « Niveau n ».
   * Vide = dimension plate sans niveau nommé.
   */
  public get levels(): string[] {
    const nb = this.level_count
    const noms: string[] = []
    for (let index = 0; index < nb; index++) noms.push(this._levels[index] ?? defaultLevelName(index))
    return noms
  }

  /** Pose les NOMS des niveaux (vides et doublons écartés). Ne touche pas à la parenté. */
  public set levels(noms: string[]) {
    const vus = new Set<string>()
    this._levels = noms
      .filter(n => n !== '')
      .filter(n => !vus.has(n) && (vus.add(n), true))
  }

  /** Les seuls niveaux NOMMÉS par l'auteur, sans les noms par défaut (cf. `levels`). */
  public get named_levels(): string[] { return [...this._levels] }

  /**
   * Nombre de niveaux effectifs : la profondeur de la hiérarchie, ou le nombre de niveaux nommés
   * s'il est plus grand (des noms posés avant la parenté ne disparaissent pas).
   */
  public get level_count(): number {
    const profondeurs = this.is_hierarchical ? this.max_depth + 1 : 0
    return Math.max(this._levels.length, profondeurs)
  }

  /**
   * Vrai si cette dimension porte une hiérarchie : au moins un membre a un parent. La hiérarchie
   * EST la parenté ; nommer des niveaux sans rattacher personne ne hiérarchise rien, et rattacher
   * des membres sans nommer de niveau hiérarchise bel et bien (le repli sur l'agrégat en dépend).
   */
  public get is_hierarchical(): boolean {
    this.ensureHierarchyIndex()
    return (this._children_index as Map<string, Class_DataTag[]>).size > 0
  }

  /** Profondeur du membre le plus profond (0 pour une dimension plate). */
  public get max_depth(): number {
    this.ensureHierarchyIndex()
    return this._max_depth
  }

  /** Oublie l'index des enfants et des profondeurs : la parenté ou les membres ont changé. */
  public invalidateHierarchyIndex() {
    this._children_index = undefined
    this._depth_index = undefined
  }

  /** Enfants directs d'un membre, dans l'ordre du dictionnaire des membres (copie). */
  public childrenOf(tag: Class_DataTag): Class_DataTag[] {
    this.ensureHierarchyIndex()
    return [...((this._children_index as Map<string, Class_DataTag[]>).get(tag.id) ?? [])]
  }

  private ensureHierarchyIndex() {
    if (this._children_index !== undefined && this._depth_index !== undefined &&
      this._hierarchy_index_of === this._tags) return
    const enfants = new Map<string, Class_DataTag[]>()
    const membres = Object.values(this._tags) as Class_DataTag[]
    membres.forEach(membre => {
      const parent = membre.parent
      if (parent === undefined) return
      const liste = enfants.get(parent.id)
      if (liste === undefined) enfants.set(parent.id, [membre])
      else liste.push(membre)
    })
    // Profondeurs mémoïsées. Un CYCLE venu d'un JSON malformé (A sous B, B sous A — le setter
    // `parent` les refuse, pas la lecture) ne doit pas boucler : on le coupe à la première
    // rencontre, comme une racine.
    const profondeurs = new Map<string, number>()
    const en_cours = new Set<string>()
    const profondeur = (membre: Class_DataTag): number => {
      const connue = profondeurs.get(membre.id)
      if (connue !== undefined) return connue
      if (en_cours.has(membre.id)) return 0
      en_cours.add(membre.id)
      const parent = membre.parent
      const p = parent === undefined ? 0 : profondeur(parent) + 1
      en_cours.delete(membre.id)
      profondeurs.set(membre.id, p)
      return p
    }
    let max = 0
    membres.forEach(membre => { max = Math.max(max, profondeur(membre)) })
    this._children_index = enfants
    this._depth_index = profondeurs
    this._max_depth = max
    this._hierarchy_index_of = this._tags
  }

  // LE DESSIN DE LA DIMENSION (os#1511) ================================================
  //
  // Il se redéduisait à six endroits (flux, légende, couleur d'un membre seul, barre du haut),
  // chacun avec sa règle : l'un exigeait des niveaux, l'autre oubliait les nœuds porteurs. Il se
  // décide désormais ICI, et tous le lisent.

  /**
   * Comment la dimension se dessine : `nodes` dès qu'un nœud la porte (`driving_dimension`) —
   * c'est l'attachement qui prime, la bannière ne dit plus rien alors —, sinon `multi` (choix
   * multiple, en bandes), `one` (un membre à la fois, défilé de séquence compris), `other`.
   */
  /**
   * os#1511, 07/10 — LA NATURE DE LA DIMENSION DÉCIDE DU NOMBRE DE MEMBRES LUS, plus un réglage
   * (Julien : « en mode multiple on peut ne cliquer qu'un seul membre, je ne vois pas l'intérêt »).
   * Une dimension HIÉRARCHISÉE est additive (ses membres se somment en leur parent) : on peut
   * toujours en lire plusieurs, « un membre à la fois » devient donc le choix multiple — le membre
   * coché reste, et un membre seul garde sa couleur (`single_member_color`). La séquence (années,
   * scénarios : à ne pas sommer) et les dimensions plates gardent leur bannière.
   */
  protected admissibleBanner(value: tag_banner_type): tag_banner_type {
    if (value !== 'one' || this._tags === undefined) return value
    return this.is_hierarchical ? 'multi' : value
  }

  /** Ramène la bannière à ce que la nature de la dimension admet (relecture, parenté changée). */
  public normalizeBanner(): void {
    const current = this.banner
    if (this.admissibleBanner(current) !== current) this.banner = current
  }

  public get drawing(): Type_DimensionDrawing {
    // Un diagramme par membre demandé découpe des NŒUDS, même quand chacun porte une autre
    // dimension (SOCLE filières : aucun nœud ne porte Filière en propre) ; sans cette règle, la
    // bannière « plusieurs » la dessinait AUSSI en bandes sur les flux (Julien, 07/10 : « il fait
    // les deux »).
    if (this._member_bands === true || this.carriers_count > 0) return 'nodes'
    const banner = this.banner
    if (banner === 'multi') return 'multi'
    if (banner === 'one' || banner === 'topbar' || banner === 'sequence') return 'one'
    return 'other'
  }

  /**
   * Nombre de nœuds qui PORTENT la dimension. Un nœud engendré n'en porte jamais : l'attachement
   * n'est pas recopié sur les membres.
   *
   * Mémoïsé : chaque flux le lit à chaque dessin, et `nodes_list` refait un tableau à chaque
   * appel. La mémo tombe quand un attachement change (`drawingChanged`, appelé par le nœud et par
   * sa suppression) et, par prudence, à la tâche suivante.
   */
  public get carriers_count(): number {
    if (this._carriers_memo === undefined) {
      this._carriers_memo = this._ref_sankey.nodes_list
        .filter((node: Class_NodeElement) => node.driving_dimension === this).length
      queueMicrotask(() => { this._carriers_memo = undefined })
    }
    return this._carriers_memo
  }
  private _carriers_memo: number | undefined = undefined

  /** Un nœud a pris, quitté ou perdu (suppression) cette dimension : le dessin est à relire. */
  public drawingChanged(): void {
    this._carriers_memo = undefined
    this._own_carriers_memo = undefined
  }

  /** Nœuds RÉGLÉS pour porter la dimension, sans ceux qu'un diagramme par membre y ajoute. */
  public get own_carriers_count(): number {
    if (this._own_carriers_memo === undefined) {
      this._own_carriers_memo = this._ref_sankey.nodes_list
        .filter((node: Class_NodeElement) => node.own_driving_dimension === this).length
      queueMicrotask(() => { this._own_carriers_memo = undefined })
    }
    return this._own_carriers_memo
  }
  private _own_carriers_memo: number | undefined = undefined

  /** Choix multiple, pas en nœuds, et plusieurs membres possibles : de quoi faire des bandes. */
  private get _may_draw_bands(): boolean {
    return this.drawing === 'multi' && this.tags_list.length > 1
  }

  /**
   * CETTE dimension est celle que les flux découpent en bandes (`Link.tagged_value_bands`) : la
   * première de la liste qui le peut. Une seule dimension se dessine en bandes à la fois.
   */
  public get draws_bands(): boolean {
    return this._may_draw_bands &&
      this._ref_sankey.data_taggs_list.find(tagg => tagg._may_draw_bands) === this
  }

  /**
   * La dimension se dessine membre par membre, chacun à SA couleur : c'est elle qui fait les
   * bandes, et au moins deux membres sont retenus.
   * Le dessin lit alors `tag.color` sans consulter `use_colors` ; la légende doit donc nommer ces
   * couleurs elle aussi (`tagGroupCarriesFormatting`), faute de quoi elle ne donnait qu'un rappel
   * texte sous des bandes colorées — et aucune commande ne permet d'allumer `use_colors` sur une
   * dimension.
   */
  public get draws_members_in_color(): boolean {
    return this.draws_bands && this.selected_tags_list.length > 1
  }

  /**
   * os#1511 — LA COULEUR D'UN MEMBRE À L'ÉCRAN : la sienne, ou à défaut (vide, « grey » : SOCLE
   * filières, aucune couleur enregistrée) celle de la carte par défaut, par rang dans la dimension.
   * Rien n'est écrit sur le membre : le fichier garde ce qu'il avait.
   */
  public displayColorOf(tag: Class_ProtoTag): string {
    const own = tag.color
    if (own && own !== 'grey') return own
    const tags = this.tags_list
    if (this._fallback_colors === undefined || this._fallback_colors.length !== tags.length) {
      const n = Math.max(11, tags.length)
      const colors = colormap({ colormap: 'jet', nshades: n, format: 'hex', alpha: 1 }) as string[]
      const step = tags.length < 11 ? Math.max(1, Math.floor(11 / Math.max(1, tags.length))) : 1
      this._fallback_colors = tags.map((_t, i) => colors[Math.min(colors.length - 1, i * step)])
    }
    const index = (tags as Class_ProtoTag[]).indexOf(tag)
    return index < 0 ? '#8d929b' : this._fallback_colors[index]
  }
  private _fallback_colors: string[] | undefined = undefined

  /**
   * os#1511 — dessinée EN NŒUDS (un nœud par membre, ou un diagramme par membre) avec au moins deux
   * membres : la légende la liste, pour cocher ou masquer ses membres comme ceux d'une dimension en
   * bandes (Julien, 07/10 : « on ne devait pas avoir la légende des trois groupes ? »).
   */
  public get draws_members_as_nodes(): boolean {
    return this.drawing === 'nodes' && this._in_member_bands_context && this.selected_tags_list.length > 1
  }

  /**
   * os#1511 — un membre montré seul, dans SA couleur : dimension à niveaux, couleurs activées, un
   * seul membre choisi qui porte une vraie couleur. `undefined` sinon — dont la racine « Tous
   * produits », grise. Lu par le flux (`Link.getShapeColorToUse`). Choix multiple compris (07/10) :
   * une dimension hiérarchisée n'a plus de « un membre à la fois », un membre coché seul y tient lieu.
   */
  public get single_member_color(): string | undefined {
    if (!this.use_colors || !this.is_hierarchical) return undefined
    const drawing = this.drawing
    if (drawing !== 'one' && drawing !== 'multi') return undefined
    const selected = this.selected_tags_list
    if (selected.length !== 1) return undefined
    const color = selected[0].color
    return (color && color !== 'grey') ? color : undefined
  }

  /**
   * os#1511 — LES MEMBRES REPLIÉS DANS « AUTRES » d'après leurs totaux : la règle de la couronne
   * (moins de 0,5 %, ou au-delà du 19e ; au moins deux à replier), une seule implémentation pour
   * les bandes et pour les nœuds. Seule l'ASSIETTE des totaux diffère :
   *  - en bandes, les bandes brutes de tous les flux visibles (`globalFoldedMembers`), le flux y
   *    ajoutant son exception locale ;
   *  - en nœuds, les flux d'origine qui touchent un nœud porteur (`DimensionDisaggregation`).
   * L'ordre d'entrée départage les ex æquo.
   */
  public foldedMembersOf(totaux: Iterable<[string, number]>): Set<string> {
    const { folded } = foldSmallParts([...totaux].map(([id, value]) => ({ id, value })))
    return new Set(folded.map(part => part.id))
  }

  /**
   * Les membres repliés dans le nœud « Autres » de la dernière désagrégation en nœuds (cf.
   * `DimensionDisaggregation`). TRANSITOIRE comme ce nœud : rebâti à chaque désagrégation, jamais
   * sérialisé. Le repli se décide par dimension, donc tous ses nœuds porteurs replient les mêmes.
   */
  public nodes_folded_members: Class_DataTag[] = []

  /**
   * os#1511 — les membres REPLIÉS AU TOTAL dans « Autres » (règle arrêtée avec Julien le 01/10) :
   * chaque membre choisi est sommé sur les bandes brutes de tous les flux visibles
   * (`Link.dimensionBandsRaw`), puis la règle de la couronne s'applique à ces totaux (moins de
   * 0,5 %, ou au-delà du 19e ; au moins deux à replier). Le flux y ajoute son exception locale
   * (cf. `Link.tagged_value_bands`).
   *
   * Mémoïsé le temps d'un passage SYNCHRONE : chaque flux d'un même dessin le relit, et le
   * recalculer par flux coûterait n² ; la mémo tombe à la tâche suivante, et dès que la sélection
   * ou les flux visibles changent, donc jamais d'un geste à l'autre. Une lecture RÉENTRANTE (la
   * visibilité d'un flux qui relirait ses bandes) rend l'ensemble vide plutôt que de boucler.
   */
  public globalFoldedMembers(): Set<string> {
    if (this._fold_computing) return new Set()
    const sankey = this._ref_sankey
    this._fold_computing = true
    try {
      const flux = sankey.visible_links_list
      const cle = this.selected_tags_list.map(tag => tag.id).join('|') + '#' + flux.map(lien => lien.id).join('|')
      if (this._fold_memo !== undefined && this._fold_memo.cle === cle) return this._fold_memo.replies
      const totaux = new Map<string, number>()
      flux.forEach(lien => lien.dimensionBandsRaw(this).forEach(bande => {
        totaux.set(bande.id, (totaux.get(bande.id) ?? 0) + bande.value)
      }))
      const replies = this.foldedMembersOf(totaux)
      this._fold_memo = { cle, replies }
      queueMicrotask(() => { this._fold_memo = undefined })
      return replies
    } finally {
      this._fold_computing = false
    }
  }
  private _fold_memo: { cle: string, replies: Set<string> } | undefined = undefined
  private _fold_computing = false

  /**
   * os#1511 — CE QUE LES BANDES DESSINENT VRAIMENT de cette dimension, sur les flux visibles
   * (Julien, 30/09 : « que la légende montre Autres au lieu de toute la liste ») : les membres
   * dessinés en propre sur AU MOINS un flux visible, plus « Autres » s'il existe quelque part.
   *
   * `undefined` si la dimension ne se dessine pas en bandes de couleur
   * (`draws_members_in_color`) — la légende garde alors les membres choisis.
   */
  public get members_drawn_in_bands(): { members: Set<string>, has_others: boolean } | undefined {
    if (!this.draws_members_in_color) return undefined
    const members = new Set<string>()
    let has_others = false
    this._ref_sankey.visible_links_list.forEach(link => {
      link.tagged_value_bands.forEach(band => {
        if (band.folded !== undefined) has_others = true
        else members.add(band.id)
      })
    })
    return { members, has_others }
  }

  // PALETTE HIÉRARCHIQUE (os#1516) ======================================================

  /** Recette de palette (copie), `undefined` si les couleurs des membres sont libres. */
  public get palette(): Type_DimensionPalette | undefined {
    return this._palette === undefined ? undefined : copyPalette(this._palette)
  }

  /**
   * Remet une recette telle quelle, SANS recalculer : c'est le chemin de l'annulation, qui
   * restaure aussi les couleurs d'avant. Pour appliquer une palette, `applyHierarchicalPalette`.
   */
  public set palette(palette: Type_DimensionPalette | undefined) {
    this._palette = palette === undefined ? undefined : copyPalette(palette)
  }

  /**
   * Applique la palette hiérarchique (règle hybride, cf. `HierarchicalPalette`) et la garde comme
   * recette : les couleurs suivront désormais la structure. Les couleurs verrouillées sont gardées.
   */
  public applyHierarchicalPalette(params: Type_HierarchicalPaletteParams = this._palette?.params ?? default_hierarchical_palette_params) {
    this._palette = {
      params: { ...params },
      locks: { ...(this._palette?.locks ?? {}) },
      frozen: false,
    }
    this.recolorFromPalette()
  }

  /** Plus de recalcul automatique quand la structure change (couleurs publiées ou imprimées). */
  public get palette_frozen(): boolean { return this._palette?.frozen ?? false }
  public set palette_frozen(frozen: boolean) {
    if (this._palette === undefined) return
    this._palette.frozen = frozen
    if (!frozen) this.recolorFromPalette()
  }

  /**
   * Couleur choisie À LA MAIN pour un membre. Sous une palette hiérarchique, elle est VERROUILLÉE :
   * le recalcul la respecte et ses descendants s'en dérivent. Sans quoi le prochain recalcul
   * effacerait sans prévenir le choix de l'utilisateur.
   */
  public setMemberColor(tag: Class_DataTag, color: string) {
    if (this._palette === undefined) {
      tag.color = color
      return
    }
    this._palette.locks[tag.id] = color
    tag.color = color
    this.recolorFromPalette(true)
  }

  public isMemberColorLocked(tag: Class_DataTag): boolean {
    return this._palette?.locks[tag.id] !== undefined
  }

  /** Rend un membre à la couleur calculée. */
  public unlockMemberColor(tag: Class_DataTag) {
    if (this._palette === undefined || this._palette.locks[tag.id] === undefined) return
    delete this._palette.locks[tag.id]
    this.recolorFromPalette(true)
  }

  /**
   * À appeler quand la STRUCTURE change (membre ajouté, retiré, reparenté) : recolore les membres
   * non verrouillés, sauf palette figée ou chargement en cours.
   */
  public hierarchyChanged() {
    this.invalidateHierarchyIndex()
    this.normalizeBanner()
    if (this._palette === undefined || this._palette.frozen || this._palette_suspended) return
    this.recolorFromPalette()
  }

  /**
   * Recalcule les couleurs depuis la recette. `force` passe outre `frozen` : un geste explicite
   * (verrouiller, déverrouiller) doit se voir même sur une palette figée.
   */
  public recolorFromPalette(force: boolean = false) {
    if (this._palette === undefined) return
    if (this._palette.frozen && !force) return
    const members = this.tags_list as Class_DataTag[]
    // Verrous orphelins (membre supprimé) : on les oublie, ils ne désignent plus rien.
    Object.keys(this._palette.locks)
      .filter(id => this._tags[id] === undefined)
      .forEach(id => { delete (this._palette as Type_DimensionPalette).locks[id] })
    // Arbre minimal, enfants dans l'ordre d'affichage des membres.
    const nodes = new Map<string, Type_PaletteNode>()
    members.forEach(tag => nodes.set(tag.id, { id: tag.id, children: [] }))
    const roots: Type_PaletteNode[] = []
    members.forEach(tag => {
      const node = nodes.get(tag.id) as Type_PaletteNode
      const parent = tag.parent
      if (parent !== undefined && nodes.has(parent.id)) {
        (nodes.get(parent.id) as Type_PaletteNode).children.push(node)
      } else {
        roots.push(node)
      }
    })
    const colors = computeHierarchicalColors(roots, this._palette.params, this._palette.locks)
    members.forEach(tag => {
      const color = colors[tag.id]
      if (color !== undefined) tag.color = color
    })
  }

  public override addTag(name: string, id: string | undefined = undefined) {
    const tag = super.addTag(name, id)
    this.hierarchyChanged()
    return tag
  }

  public override removeTag(tag: Class_ProtoTag) {
    super.removeTag(tag)
    this.hierarchyChanged()
  }

  /**
   * os#1511 (retour de Julien, 29/09) — cette dimension est-elle DESSINÉE EN NŒUDS, c'est-à-dire
   * un nœud du diagramme la porte-t-il (`Class_NodeElement.driving_dimension`) ?
   *
   * Sert à la LÉGENDE, qui l'écarte alors : « pour les pays qui sont désagrégés en nœud, pas
   * besoin de légende ». Ses membres sont des nœuds NOMMÉS sur le diagramme ; une légende de
   * couleurs n'a de sens que pour ce qui n'est pas nommé à sa place — les bandes d'un flux.
   */
  public get is_drawn_as_nodes(): boolean {
    // SAUF sous un diagramme par membre (Julien, 07/10 : « on ne devait pas avoir la légende des
    // trois groupes ? ») : les noms ne s'écrivent qu'une fois et les flux se peignent par l'une des
    // dimensions — la légende sert à choisir laquelle, et à cocher ou masquer les membres.
    return this.drawing === 'nodes' && !this._in_member_bands_context
  }

  private get _in_member_bands_context(): boolean {
    return (this._ref_sankey.data_taggs_list as Class_DataTagGroup[]).some(t => t.member_bands === true)
  }

  /**
   * os#1511 — CETTE dimension peint-elle les flux du diagramme par membre ? Celle choisie dans la
   * légende (`paints_flows`), sinon une dimension en nœuds à plusieurs membres (les postes), sinon
   * la bande. `false` hors diagramme par membre. Lue aussi par `Link._memberBandColor`.
   */
  public get paints_member_bands_flows(): boolean {
    return flowPainterOf(this._ref_sankey.data_taggs_list as Class_DataTagGroup[]) === this
  }

  /** Peut-elle peindre les flux du diagramme par membre (bouton pinceau de la légende) ? */
  public get may_paint_member_bands_flows(): boolean {
    if (!this._in_member_bands_context) return false
    return this.member_bands === true || (this.drawing === 'nodes' && this.selected_tags_list.length > 1)
  }

  /**
   * Niveau COURANT, DÉDUIT de la sélection : la profondeur du membre choisi le plus fin, bornée
   * aux niveaux effectifs. 0 sans niveau ou sans sélection.
   *
   * Il n'est plus stocké : `selectMembers` le recalculait déjà ainsi, et le garder à part laissait
   * deux vérités se contredire (un fichier relu, une sélection changée par un autre chemin).
   */
  public get current_level_index(): number {
    const nb = this.level_count
    if (nb === 0) return 0
    const plafond = nb - 1
    return (this.selected_tags_list as Class_DataTag[]).reduce(
      (max, membre) => Math.max(max, Math.min(this.depthOf(membre), plafond)), 0)
  }

  /** Nom du niveau courant, `undefined` pour une dimension plate. */
  public get current_level(): string | undefined {
    return this.levels[this.current_level_index]
  }

  /** Profondeur d'un membre = son nombre d'ancêtres. 0 pour une racine. */
  public depthOf(tag: Class_DataTag): number {
    if (this._tags[tag.id] === tag) {
      this.ensureHierarchyIndex()
      const connue = (this._depth_index as Map<string, number>).get(tag.id)
      if (connue !== undefined) return connue
    }
    let depth = 0
    let current = tag.parent
    while (current !== undefined) {
      depth++
      current = current.parent
    }
    return depth
  }

  /**
   * Membres à MONTRER au niveau `index` (le niveau courant par défaut).
   *
   * Règle des hiérarchies DÉSÉQUILIBRÉES, et c'est le point à ne pas rater : toutes les
   * branches n'ont pas la même profondeur (un pays sans sous-région, une filière sans
   * distinction bruts/transformés). On montre donc un membre dont la profondeur vaut le
   * niveau demandé, ET tout membre MOINS PROFOND qui n'a pas d'enfant — sinon la donnée
   * portée par une branche courte disparaîtrait de l'écran en descendant d'un niveau, et les
   * totaux cesseraient d'être justes. Un membre PLUS profond, lui, est représenté par son
   * ancêtre au niveau demandé : il ne se montre pas.
   *
   * Dimension plate : tous les membres, comme avant.
   */
  public membersAtLevel(index: number = this.current_level_index): Class_DataTag[] {
    const tags = Object.values(this._tags) as Class_DataTag[]
    const nb = this.level_count
    if (nb === 0) return tags
    const cible = Math.min(Math.max(0, index), nb - 1)
    this.ensureHierarchyIndex()
    const enfants = this._children_index as Map<string, Class_DataTag[]>
    return tags.filter(tag => {
      const depth = this.depthOf(tag)
      if (depth === cible) return true
      return depth < cible && !enfants.has(tag.id)
    })
  }

  /**
   * os#1511 — Les membres RANGÉS PAR NIVEAU, de quoi faire UNE seule liste en arbre au lieu
   * d'empiler une liste de niveaux et une liste de membres.
   *
   * Deux listes l'une sous l'autre se lisaient mal (retour de Julien, 28/09) : au premier
   * niveau, celle des membres n'avait qu'une option — « Tous produits », « Monde » — et ne
   * servait à rien. Le niveau se DÉDUIT désormais du membre choisi.
   *
   * Chaque membre paraît UNE fois, sous le niveau de sa PROPRE profondeur — et non à tous les
   * niveaux où `membersAtLevel` le montrerait. Une branche courte y est donc rangée à sa
   * profondeur réelle, ce qui la nomme sans la répéter. L'ordre est celui d'un parcours en
   * profondeur depuis les racines : les enfants d'un parent restent groupés.
   *
   * Rend une liste vide pour une dimension plate : il n'y a alors rien à ranger.
   */
  public membersByLevel(): { level: string, index: number, members: Class_DataTag[] }[] {
    const noms = this.levels
    if (noms.length === 0) return []
    const par_profondeur: Class_DataTag[][] = noms.map(() => [])
    const tous = Object.values(this._tags) as Class_DataTag[]
    const ranger = (membre: Class_DataTag) => {
      const profondeur = Math.min(this.depthOf(membre), noms.length - 1)
      par_profondeur[profondeur].push(membre)
      membre.children.forEach(enfant => ranger(enfant as Class_DataTag))
    }
    tous.filter(membre => membre.parent === undefined).forEach(ranger)
    return noms.map((level, index) => ({ level, index, members: par_profondeur[index] }))
  }

  /**
   * os#1511 — Choisit UN NIVEAU ENTIER : tous les membres qu'il montre, d'un coup.
   *
   * C'est l'autre entrée de la liste, à côté des membres eux-mêmes. « Régions continentales »
   * donne les régions ; « Europe » donne l'Europe seule. Le panneau nomme ainsi toujours ce que
   * le dessin montre — ce qui n'était pas le cas quand choisir un membre dessinait ses enfants
   * (« le panneau disait Monde et le dessin Europe, Afrique », 28/09).
   *
   * Rend `false` si la dimension n'a pas de niveaux, ou si le niveau demandé ne montre rien.
   */
  public selectAllAtLevel(index: number): boolean {
    const nb = this.level_count
    if (nb === 0) return false
    // Un index NON FINI passerait les bornes sans bruit (`Math.min(Math.max(0, NaN), n)` vaut NaN).
    if (!Number.isFinite(index)) return false
    const cible = Math.min(Math.max(0, index), nb - 1)
    const membres = this.membersAtLevel(cible)
    if (membres.length === 0) return false
    this.tags_list.forEach(tag => tag.setUnSelected())
    membres.forEach(membre => membre.setSelected())
    return true
  }

  /** Vrai si la sélection courante est EXACTEMENT ce que montre le niveau `index`. */
  public isWholeLevelSelected(index: number): boolean {
    const montres = this.membersAtLevel(index)
    if (montres.length === 0) return false
    const choisis = this.selected_tags_list
    return choisis.length === montres.length && montres.every(membre => membre.is_selected)
  }

  /**
   * os#1511 — Choisit des MEMBRES ; le niveau courant s'en déduit (cf. `current_level_index`).
   *
   * Plusieurs membres sont admis, de profondeurs quelconques : seul le RECOUVREMENT est refusé
   * (un membre et l'un de ses descendants). Quand les deux sont demandés, l'ancêtre tombe.
   */
  public selectMembers(tag_ids: string[]): boolean {
    const demandes = tag_ids
      .map(id => this._tags[id] as Class_DataTag | undefined)
      .filter((membre): membre is Class_DataTag => membre !== undefined)
    if (demandes.length === 0) return false
    // LA SEULE CHOSE INTERDITE EST LE RECOUVREMENT : un membre qui en contient un autre. Tout
    // le reste passe, quelles que soient les profondeurs.
    //
    // Deux règles plus strictes ont été essayées et se sont révélées fausses à l'écran, le
    // 28/09. « Même profondeur » écartait « Oléagineux », qui n'a pas d'enfant et se montre
    // donc à tous les niveaux plus fins. « Ce que montre le niveau le plus fin » écartait
    // « Céréales transformées » coché avec « Blé » et « Maïs », alors que les trois sont
    // disjoints : personne n'est compté deux fois, et lire le détail des céréales brutes à
    // côté des transformées en bloc est un usage légitime.
    //
    // Quand un membre et son descendant sont demandés ensemble, c'est l'ANCÊTRE qui tombe :
    // on garde le détail, qui est ce que le clic le plus fin exprimait.
    const retenus = demandes.filter(membre =>
      !demandes.some(autre => autre !== membre && autre.hasAncestor(membre)))
    if (retenus.length === 0) return false
    this.tags_list.forEach(tag => tag.setUnSelected())
    retenus.forEach(membre => membre.setSelected())
    return true
  }

  // PUBLIC METHODS =====================================================================

  /**
   * #370 — Impose au dessin le mode d'affichage de CETTE dimension.
   *
   * Appelée à chaque changement de sélection de la dimension. Le garde-fou « mode déjà
   * courant → on ne fait rien » n'est pas une optimisation : entrer dans un mode
   * RECAPTURE sa référence géométrique (`captureScaleReference` / `captureProportionalReference`).
   * Ré-entrer à chaque pas d'une séquence recalerait donc la référence sur les données
   * du pas courant — et « échelle adaptée » cesserait justement de tenir la taille du
   * diagramme constante, c'est-à-dire l'inverse du but.
   *
   * @param force vrai pour un choix EXPLICITE de l'utilisateur dans le menu. Sans lui, on
   * ne quitte jamais le mode hérité `parametric` : il n'est pas proposé par le sélecteur,
   * donc toutes les dimensions le contrediraient par leur défaut « absolu » et la première
   * navigation détruirait silencieusement une mise en page paramétrique.
   *
   * Articulation avec le #369 (mode enregistré ARMÉ à l'ouverture, cf.
   * `Class_DrawingArea.suspendPositionModeUntilDataChange`) : à l'ouverture, le mode courant
   * est celui du fichier et le dessin est suspendu en absolu. Au premier changement de
   * sélection, deux cas — si la dimension manipulée porte le mode enregistré, on ne fait
   * rien ici et la suspension se lève d'elle-même au dessin, ce qui réutilise la référence
   * géométrique PERSISTÉE (pas de saut d'échelle) ; sinon on bascule, et `set*Mode` lève la
   * suspension au passage.
   *
   * @param redraw faux quand l'APPELANT redessine juste après (c'est le cas des deux méthodes
   * de sélection ci-dessous, qui enchaînent `updateTagsReferences`). Le dessin fait ici serait
   * intégralement refait par le sien : au chargement de CARTOFOB, il coûtait une passe entière
   * de plus (36 dessins de flux sur 211) — os#1377. C'est la même garde que celle posée par le
   * lot D d'os#1372 sur `applyViewChange`, étendue à cet appelant-ci, que la première ne
   * couvrait pas.
   */
  public applyPositionModeToDrawing(force: boolean = false, redraw: boolean = true): void {
    const drawing_area = this._ref_sankey.drawing_area
    const default_style = this._ref_sankey.default_style
    if (!drawing_area || !default_style) return
    if (default_style.shape_position_type === this._position_mode) return
    if (!force && default_style.shape_position_type === 'parametric') return
    // os#1364 (27/09/2026) — UN DOCUMENT GÉOGRAPHIQUE LE RESTE. Le mode d'un groupe d'étiquettes
    // est un mode d'AFFICHAGE (proportionnel, échelle adaptée, ou « absolu » = aucun) appliqué à
    // chaque changement de sélection ; sur une carte, les positions DÉRIVENT des coordonnées et
    // aucun de ces modes n'a de sens. C'est par ici que changer d'année, de niveau, ou le
    // rafraîchissement qui suit une désagrégation, faisaient quitter la carte : les filières
    // restaient empilées en colonne et le Maroc, poussé vers le bas, n'était jamais reposé.
    if (default_style.shape_position_type === 'geographic') return
    if (this._position_mode === 'proportional') {
      drawing_area.setProportionalMode()
      if (redraw) drawing_area.draw()
    }
    // setScaleAdaptedMode redessine lui-même (cf. displayModes.ts).
    else if (this._position_mode === 'scale_adapted') { drawing_area.setScaleAdaptedMode(redraw) }
    else {
      drawing_area.setAbsoluteMode()
      if (redraw) drawing_area.draw()
    }
  }

  public selectTagsFromId(
    id: string
  ) {

    const old_selected = this.selected_tags_list[0].id
    const _selectTagsFromId = (_: string) => {
      this.tags_list
        .forEach(tag => {
          if (tag.id === _) {
            tag.setSelected()
          }
          else {
            tag.setUnSelected()
          }
        })
      this.checkSelectionCoherence()
      // sa#283 — vues contextuelles : overlay appliqué APRÈS le basculement des tags,
      // AVANT tout redraw (applyPositionModeToDrawing / updateTagsReferences).
      this._ref_sankey.drawing_area.application_data.after_tag_selection_change?.()
      // #370 — agir sur une dimension impose SON mode d'affichage. Avant
      // `updateTagsReferences` (qui redessine) pour que le dessin parte du bon mode.
      // os#1377 — et SANS dessiner : c'est `updateTagsReferences`, juste en dessous, qui
      // dessine — le mode est posé avant lui précisément pour qu'il en parte.
      this.applyPositionModeToDrawing(false, false)
      this.updateTagsReferences()
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    }

    this._ref_sankey.drawing_area.application_data.history.saveUndo(() => _selectTagsFromId(old_selected))
    this._ref_sankey.drawing_area.application_data.history.saveRedo(() => _selectTagsFromId(id))
    _selectTagsFromId(id)
  }

  public selectTagsFromIds(
    ids: string[]
  ) {
    this.tags_list
      .forEach(tag => {
        if (ids.includes(tag.id)) {
          tag.setSelected()
        }
        else {
          tag.setUnSelected()
        }
      })
    this.checkSelectionCoherence()
    // sa#283 — vues contextuelles : même point d'accrochage que selectTagsFromId.
    this._ref_sankey.drawing_area.application_data.after_tag_selection_change?.()
    // #370 — même règle que selectTagsFromId : la dimension manipulée impose son mode.
    // os#1377 — sans dessiner : `updateTagsReferences` le fait juste après.
    this.applyPositionModeToDrawing(false, false)
    this.updateTagsReferences()
  }

  public updateTagsReferences(): void {
    // On datatags update everything is impacted (les bandes de valeurs
    // coordonnées sont dérivées au draw — rien à synchroniser)
    // os#1511 — SAUF les nœuds et flux ENGENDRÉS : un flux engendré porte un scalaire lu à la
    // coordonnée du moment (unité, année…). Changer d'unité sans les refaire gardait les kt sous
    // une échelle en kt de matière grasse, et la mise en page volait en éclats (Julien, 08/10).
    // Pendant un geste groupé (`bypass_redraws`), c'est le geste qui refait et redessine.
    const drawing_area = this._ref_sankey.drawing_area
    if (!drawing_area.bypass_redraws && this._ref_sankey.nodes_list.some(node => node.is_driven_by_dimension)) {
      drawing_area.rebuildDimensionNodes()
    }
    drawing_area.draw()
  }

  // PROTECTED METHODS ==================================================================
  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    return new Class_DataTag(name, this, this._ref_sankey, id)
  }

  // PRIVATE METHODES ===================================================================
  /**
   * Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
   * @private
   * @memberof Class_DataTagGroup
   */
  private checkSelectionCoherence() {
    if (this.selected_tags_list.length === 0) {
      this.tags_list[0]?.setSelected()
    }
  }

  // GETTER =============================================================================
  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_DataTag }}
   * @memberof Class_DataTagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return ordered list of tags from the current group
   * @type {Class_DataTag[]}
   * @memberof Class_DataTagGroup
   */
  public get tags_list(): Class_DataTag[] {
    if (this.tags_order.length > 0)
      return this.tags_order
        .filter(id => id in this.tags_dict)
        .map(id => this.tags_dict[id])
    return Object.values(this.tags_dict)
  }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_DataTagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }

  public get use_colors(): boolean { return this._use_colors }
  public get is_unit(): boolean { return this._is_unit }

  // SETTER ==============================================================================
  public set use_colors(value: boolean) {
    // Avoid useless updates
    if (this._use_colors !== value) {
      this._use_colors = value
      this.updateTagsReferences()
    }
  }

  public set is_unit(value: boolean) { this._is_unit = value }

  // #161 — per-group structure-propagation flag (default true = legacy)
  public get propagate_structure(): boolean { return this._propagate_structure }

  public set propagate_structure(value: boolean) { this._propagate_structure = value }

  // #370 — mode d'affichage propre à la dimension (cf. `applyPositionModeToDrawing`).
  public get position_mode(): Type_PositionMode { return this._position_mode }

  public set position_mode(value: Type_PositionMode) { this._position_mode = value }
}
// CLASS LEVEL TAGGROUP *****************************************************************
/**
 * Tag group for node level - Fusionné avec Class_ProtoLevelTagGroup
 * @export
 * @class Class_LevelTagGroup
 */
export class Class_LevelTagGroup  extends Class_NodeTagGroup{

  // SA#553 - les niveaux decrivent la hierarchie : pas d'etiquette generee
  protected get supports_untagged_tag(): boolean { return false }

  // Display attributes
  private _activated: boolean = false
  private _siblings: string[] = []
  private _antitagged_refs: Class_NodeElement[] = []

  // PROTECTED ATTRIBUTES ===============================================================
  // Groupe de nœuds dont la palette suit l'activation de ce groupe de niveaux
  // (cf. Toolbar.tsx, case « activer » : elle allume/éteint use_colors dessus).
  public linked_tag_group : Class_TagGroup | null = null

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_LevelTagGroup
   */

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_LevelTagGroup.
   * @param {string} id
   * @param {string} name
   * @param {Class_Sankey} sankey
   * @memberof Class_LevelTagGroup
   */
  constructor(id: string, name: string, sankey: Class_Sankey,with_a_tag: boolean = false) {
    super(id,name,sankey,with_a_tag)
    // Un seul niveau sélectionné à la fois : bannière 'one' (le 'multi' de la classe
    // de base n'a pas de sens pour une hiérarchie). C'est aussi le repli de fromJSON
    // pour les fichiers qui portent la bannière hors catalogue « level » (< 0.9,
    // jamais migrée par les fichiers 0.91) : sans lui, le tiroir de filtres rendait
    // une carte vide — hiérarchie invisible et impilotable.
    this.banner = 'one'
  }

  // CLEANING METHODS ====================================================================
  /**
   * Define deletion behavior
   * @memberof Class_LevelTagGroup
   */
  public delete() {
    super.delete()
    this._antitagged_refs.forEach(ref => this.removeAntiTaggedRef(ref))
    this._antitagged_refs = []
  }

  // COPY METHODS ========================================================================
  // #528 — signature alignee sur celle du proto (deux arguments) : sans elle,
  // l'appariement des etiquettes construit par updateFrom n'atteignait jamais
  // Class_ProtoTagGroup._copyFrom pour cette famille, et deux groupes apparies
  // par NOM mais portant des ids d'etiquettes differents perdaient les leurs.
  public copyFrom(
    tagg_to_copy: Class_LevelTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    this._copyFrom(tagg_to_copy, matching_tags_id)
  }

  protected _copyFrom(
    tagg_to_copy: Class_LevelTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    this._activated = tagg_to_copy._activated
    // #528 — copie du tableau, pas de la reference : addSibling/removeSibling
    // ecrivent DANS le tableau, un ajout sur la copie apparaitrait donc sur
    // l'original (et reciproquement). Class_ViewTagGroup le faisait deja.
    this._siblings = [...tagg_to_copy._siblings]
    // #528 — le lien suit le groupe, mais RESOLU dans le diagramme de la copie :
    // recopier la reference telle quelle ferait pointer un groupe de ce sankey
    // vers un groupe d'un AUTRE sankey lors d'un updateFrom (fusion de mise en
    // page), et la case « activer » allumerait la palette du mauvais diagramme.
    this.linked_tag_group = tagg_to_copy.linked_tag_group
      ? (this._ref_sankey.node_taggs_dict[tagg_to_copy.linked_tag_group.id] ?? null)
      : null
  }


  protected _toJSON(json_object: Type_JSON, _kwargs?: Type_JSON) {
    super._toJSON(json_object,_kwargs)

    json_object['activated'] = this._activated
    json_object['siblings'] = this._siblings
    // #528 — la cle etait LUE sans jamais etre ECRITE : un fichier qui declarait
    // le lien le perdait au premier aller-retour par le front, et la case
    // « activer » du bandeau cessait d'allumer la palette du groupe de nœuds
    // associe. L'asymetrie etait invisible au round-trip d'un fichier ecrit par
    // le front, puisqu'il n'ecrivait jamais la cle.
    if (this.linked_tag_group) json_object['linked_tag_group'] = this.linked_tag_group.id
  }

  protected _fromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    super._fromJSON(json_object,kwargs)

    this._activated = getBooleanFromJSON(json_object, 'activated', this._activated)
    this._siblings = getStringListFromJSON(json_object, 'siblings', this._siblings)
    const linked_tag_group_id = getStringOrUndefinedFromJSON(json_object, 'linked_tag_group')
    if (linked_tag_group_id !== undefined)
      this.linked_tag_group = this._ref_sankey.node_taggs_dict[linked_tag_group_id] ?? null
  }

  public addAntiTaggedRef(_: Class_NodeElement) {
    if (!this._antitagged_refs.includes(_)) {
      this._antitagged_refs.push(_)
      _.addAsAntiTagged(this)
    }
  }

  public removeAntiTaggedRef(_: Class_NodeElement) {
    if (this._antitagged_refs.includes(_)) {
      const idx = this._antitagged_refs.indexOf(_)
      this._antitagged_refs.splice(idx, 1)
      _.removeAsAntiTagged(this)
    }
  }

  /**
   * Function to add sibling to current group and referenced group,
   * because they mutually interact at some mechanic
   *
   * @param {Class_LevelTagGroup} _
   * @memberof Class_LevelTagGroup
   */
  public addSibling(_: Class_LevelTagGroup) {
    // Add antagonist grp id to sibling
    if (!this._siblings.includes(_.id)) {
      this._siblings.push(_.id)
    }

    // Add this grp id to sibling antagonist list
    if (!_._siblings.includes(this.id)) {
      _._siblings.push(this.id)
    }
  }

  /**
   * Function to remove sibling to current group and referenced group,
   * because they mutually interact at some mechanic
   *
   * @param {Class_LevelTagGroup} _
   * @memberof Class_LevelTagGroup
   */
  public removeSibling(_: Class_LevelTagGroup) {
    // remove antagonist grp id from sibling
    if (this._siblings.includes(_.id)) {
      const idx = this._siblings.indexOf(_.id)
      this._siblings.splice(idx, 1)
    }

    // remove this grp id from sibling antagonist list
    if (_._siblings.includes(this.id)) {
      const idx = _._siblings.indexOf(this.id)
      _._siblings.splice(idx, 1)
    }
  }

  // PROTECTED METHODS ==================================================================
  protected createTag(name: string, id: string | undefined = undefined): Class_LevelTag {
    const tag = new Class_LevelTag(name, this, this._ref_sankey, id)
    if (Object.keys(this._tags).length == 0) {
      tag.setSelected()
    } else {
      tag.setUnSelected()
    }
    return tag
  }


  public get activated(): boolean { return this._activated }
  public get siblings(): string[] { return this._siblings }
  public get antitagged_refs() { return this._antitagged_refs }
  
  public set activated(value: boolean) {
    this._activated = value
  }

  public set siblings(value: string[]) {
    this._siblings = value
    this._ref_sankey.draw()
  }
}



// CLASS VIEW TAGGROUP ******************************************************************
/**
 * Tag group for view management - calqué sur LevelTagGroup avec sibling et activation
 * @export
 * @class Class_ViewTagGroup
 */
export class Class_ViewTagGroup extends Class_NodeTagGroup {
  // SA#553 - les vues designent des noeuds : pas d'etiquette generee
  protected get supports_untagged_tag(): boolean { return false }
  private _activated: boolean = false
  private _siblings: string[] = []
  // Mode « filtre vue » : quand actif sur un groupe de view tags (banner 'one'),
  // sélectionner une étiquette filtre le diagramme en COURT-CIRCUITANT les level
  // tags (généralisation du mécanisme unitaire) : les nœuds portant l'étiquette
  // sélectionnée sont montrés quel que soit le niveau, les autres étiquettes du
  // groupe sont cachées. (Visibilité seulement — pas de remontée vers les ancêtres.)
  private _view_mode: boolean = false
  // Libellé personnalisable de l'option « vue complète » du sélecteur topbar
  // (BannerViewTagTopbar). Vide = libellé par défaut (traduction Banner.view_full).
  private _full_view_label: string = ''

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_ViewTagGroup
   */

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_ViewTagGroup.
   * @param {string} id
   * @param {string} name
   * @param {Class_Sankey} sankey
   * @param {boolean} [with_a_tag=false]
   * @memberof Class_ViewTagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: Class_Sankey,
    with_a_tag: boolean = false
  ) {
    super(id, name, sankey, with_a_tag)
    // Default banner as 'one' for view tags
    this.banner = 'one'
  }

  // CLEANING METHODS ===================================================================
  /**
   * Define deletion behavior
   * @memberof Class_ViewTagGroup
   */
  public delete() {
    super.delete()
  }

  // COPY METHODS =======================================================================
  // #528 — meme alignement de signature que Class_LevelTagGroup ci-dessus.
  public copyFrom(
    tagg_to_copy: Class_ViewTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    this._copyFrom(tagg_to_copy, matching_tags_id)
  }

  protected _copyFrom(
    tagg_to_copy: Class_ViewTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    this._activated = tagg_to_copy._activated
    this._siblings = [...tagg_to_copy._siblings]
    this._view_mode = tagg_to_copy._view_mode
    this._full_view_label = tagg_to_copy._full_view_label
  }

  protected _toJSON(json_object: Type_JSON, _kwargs?: Type_JSON) {
    super._toJSON(json_object, _kwargs)
    json_object['activated'] = this._activated
    json_object['siblings'] = this._siblings
    json_object['view_mode'] = this._view_mode
    json_object['full_view_label'] = this._full_view_label
  }

  protected _fromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    super._fromJSON(json_object, kwargs)
    this._activated = getBooleanFromJSON(json_object, 'activated', this._activated)
    this._siblings = getStringListFromJSON(json_object, 'siblings', this._siblings)
    this._view_mode = getBooleanFromJSON(json_object, 'view_mode', this._view_mode)
    this._full_view_label = getStringFromJSON(json_object, 'full_view_label', this._full_view_label)
  }

  public get view_mode(): boolean { return this._view_mode }
  public set view_mode(_: boolean) { this._view_mode = _ }

  public get full_view_label(): string { return this._full_view_label }
  public set full_view_label(_: string) { this._full_view_label = _ }

  /**
   * Function to add sibling to current group and referenced group,
   * because they mutually interact at some mechanic
   *
   * @param {Class_ViewTagGroup} _
   * @memberof Class_ViewTagGroup
   */
  public addSibling(_: Class_ViewTagGroup) {
    // Add antagonist grp id to sibling
    if (!this._siblings.includes(_.id)) {
      this._siblings.push(_.id)
    }

    // Add this grp id to sibling antagonist list
    if (!_._siblings.includes(this.id)) {
      _._siblings.push(this.id)
    }
  }

  /**
   * Function to remove sibling to current group and referenced group,
   * because they mutually interact at some mechanic
   *
   * @param {Class_ViewTagGroup} _
   * @memberof Class_ViewTagGroup
   */
  public removeSibling(_: Class_ViewTagGroup) {
    // remove antagonist grp id from sibling
    if (this._siblings.includes(_.id)) {
      const idx = this._siblings.indexOf(_.id)
      this._siblings.splice(idx, 1)
    }

    // remove this grp id from sibling antagonist list
    if (_._siblings.includes(this.id)) {
      const idx = _._siblings.indexOf(this.id)
      _._siblings.splice(idx, 1)
    }
  }

  // PROTECTED METHODS ==================================================================
  /**
   * Create a new ViewTag for this group
   * @protected
   * @param {string} name
   * @param {string} [id]
   * @return {Class_ViewTag}
   * @memberof Class_ViewTagGroup
   */
  protected createTag(name: string, id: string | undefined = undefined): Class_ViewTag {
    const tag = new Class_ViewTag(name, this, this._ref_sankey, id)
    if (Object.keys(this._tags).length == 0) {
      tag.setSelected()
    } else {
      tag.setUnSelected()
    }
    return tag
  }

  // GETTERS ============================================================================
  /**
   * Is this view tag group currently activated
   * @readonly
   * @type {boolean}
   * @memberof Class_ViewTagGroup
   */
  public get activated(): boolean {
    return this._activated
  }

  /**
   * List of sibling tag group ids
   * @readonly
   * @type {string[]}
   * @memberof Class_ViewTagGroup
   */
  public get siblings(): string[] {
    return this._siblings
  }

  // SETTERS ============================================================================
  /**
   * Set activation state
   * @memberof Class_ViewTagGroup
   */
  public set activated(value: boolean) {
    this._activated = value
  }

  /**
   * Set siblings list and redraw
   * @memberof Class_ViewTagGroup
   */
  public set siblings(value: string[]) {
    this._siblings = value
    this._ref_sankey.draw()
  }
}

/**
 * os#1511 — LA DIMENSION QUI PEINT LES FLUX d'un diagramme par membre (Julien, 07/10 : « le premier
 * choix, c'est Ressources et emplois qui peint les branches, et pas les diagrammes ») : celle choisie
 * dans la légende (`paints_flows`), sinon une dimension en nœuds à plusieurs membres, sinon la bande.
 * `undefined` hors diagramme par membre.
 */
export function flowPainterOf(dims: Class_DataTagGroup[]): Class_DataTagGroup | undefined {
  const bande = dims.find(t => t.member_bands === true)
  if (bande === undefined) return undefined
  const peut = (t: Class_DataTagGroup) => t === bande || (t.drawing === 'nodes' && t.selected_tags_list.length > 1)
  return dims.find(t => t.paints_flows && peut(t)) ?? dims.find(t => t !== bande && peut(t)) ?? bande
}
