import type { Class_DataTag, Class_Tag } from '../types/Tag'
import type { Class_DataTagGroup, Class_TagGroup } from '../types/TagGroup'
import { RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY } from '../types/TagAssignmentRule'
import { Type_JSON, makeId, getNumberOrNullFromJSON, getStringOrNullFromJSON, getStringFromJSON, getBooleanFromJSON, getJSONOrUndefinedFromJSON } from '../types/Utils'
import type { Class_LinkElement } from './Link'
import type { Class_NodeElement } from './Node'

// Duck-typing helper to detect link parents without importing Class_LinkElement at runtime
// (avoids circular import: Node -> LinkValues -> Link -> Node)
function isLinkElement(o: unknown): o is Class_LinkElement {
  return o !== null && typeof o === 'object' && 'source' in (o as object) && 'target' in (o as object)
}

// SA#578 — une incertitude calculée est un nombre, ou le mot « infini » : JSON
// n'a pas d'infini.
function getUncertaintyOrNullFromJSON(json_object: Type_JSON, key: string): number | string | null {
  const value = json_object[key] as unknown
  return (typeof value === 'number' || typeof value === 'string') ? value : null
}

// Parent type for value tree and leaf: either a tree node, a link, or a node (for stock values)
export type ValueParentElement = Class_LinkElement | Class_NodeElement

// CONSTANTS **************************************************************************

export const value_option_percent_constants_source = ['%IS', '%OS','%PS']
export const value_option_percent_constants_target = ['%ID', '%OD','%PD']
export const value_option_percent_constants = [...value_option_percent_constants_source,...value_option_percent_constants_target]
export const value_option_constants = ['value', ...value_option_percent_constants, 'unit_ratio', 'intervals'] as const
export type ValueOptionType = typeof value_option_constants[number]

// Display-only unit options expressing the link value as a percent of a node
// stock level (not MFA constraints). '%SS' = stock of source node ("en sortie"),
// '%SD' = stock of destination node ("en entrée").
export const unit_stock_percent_constants = ['%SS', '%SD'] as const
// 'unit_model' (OS#1286) : unité résolue depuis le registre d'unités du diagramme
// (sankey.units) — `unit` porte alors l'id d'une unité ou d'une grandeur, le
// facteur de conversion est le coefficient de l'unité (unit_factor ignoré).
// sa#595 — la valeur normalisée par la RÈGLE d'un nœud : celle du nœud source (le flux est une de
// ses sorties) ou du nœud destination (une de ses entrées), comme `%OS` et `%ID` pour les parts.
export const normalized_rule_constants = ['normalized_source', 'normalized_target'] as const
export const unit_constants = ['unit_name', 'unit_model', 'unit_tag', 'other_unit_tag', ...value_option_percent_constants, ...unit_stock_percent_constants, 'unit_ratio','normalized', ...normalized_rule_constants] as const
export type UnitType = typeof unit_constants[number]

// CLASS ELEMENT VALUE TREE ************************************************************
/**
 * Generic tree node for organizing values by data tags.
 * Children are either all trees (inner nodes) or all values (leaves).
 * @export
 * @class Class_ElementValueTree
 */
type Type_ValueChildren = { [tag_id: string]: Class_ElementValue; } | { [tag_id: string]: Class_ElementValueTree; }

/**
 * os#1528 — UNE BRANCHE PAS ENCORE CONSTRUITE. L'arbre est dense (un enfant par membre, à chaque
 * étage) : sur un gros cube (SOCLE filières agrégées : 36 × 3 × 43 × 4 × 19 = 352 944 feuilles par
 * flux, dont 13 % portent une donnée) le construire à l'ouverture prenait 770 Mo et faisait manquer
 * de mémoire l'éditeur. Une branche garde donc ce qu'il faut pour se construire À LA PREMIÈRE
 * LECTURE de `children` : les dimensions encore à déplier sous elle, le JSON qui la remplit, et
 * l'absence structurelle (#188) à propager. Construite, elle est exactement l'arbre dense d'avant.
 */
type Type_LazyBranch = {
  /** Les dimensions sous cet étage, de haut en bas ; vide : les enfants sont des valeurs. */
  below: Class_DataTagGroup[]
  json: Type_JSON | null
  matching_taggs_id: { [_: string]: string; }
  matching_tags_id: { [_: string]: { [_: string]: string; }; }
  mark_missing_as_absent: boolean
  /** `markStructurallyAbsent` reçue avant la construction. */
  absent: boolean
  /**
   * Réponses déjà calculées sur le JSON en attente (`has_result`…). Ce JSON ne change pas tant que
   * la branche n'est pas construite (toute écriture la construit, et ce sac part avec `_lazy`).
   */
  answers?: { [question: string]: boolean }
}

/**
 * os#1528 — ce JSON de branche doit-il être lu TOUT DE SUITE ? Oui s'il pose des étiquettes de flux
 * ou des valeurs coordonnées sur une valeur : elles s'inscrivent auprès de leurs étiquettes
 * (`addReference`), que la légende, les filtres et la suppression d'une étiquette interrogent sans
 * passer par l'arbre. Le reste (des nombres) peut attendre qu'on le lise.
 */
const jsonNeedsEagerRead = (json: Type_JSON): boolean => {
  for (const key in json) {
    const sub = json[key] as unknown
    if ((key === 'tags' || key === 'tagged_values') && sub !== null && typeof sub === 'object' && Object.keys(sub as object).length > 0) return true
    if (sub !== null && typeof sub === 'object' && !Array.isArray(sub) && jsonNeedsEagerRead(sub as Type_JSON)) return true
  }
  return false
}

export class Class_ElementValueTree {

  // PUBLIC ATTRIBUTES ==================================================================
  public parent: Class_ElementValueTree | ValueParentElement

  public data_tag_group: Class_DataTagGroup

  // os#1528 — enfants construits, ou de quoi les construire (cf. `Type_LazyBranch`).
  private _children: Type_ValueChildren = {}
  private _lazy: Type_LazyBranch | null = null

  /** Les enfants, un par membre du groupe : construits à la première lecture (os#1528). */
  public get children(): Type_ValueChildren {
    if (this._lazy !== null) this._build()
    return this._children
  }
  public set children(_: Type_ValueChildren) {
    this._lazy = null
    this._children = _
  }

  /** os#1528 — la branche est-elle construite ? Faux : rien n'y a encore été lu ni écrit. */
  public get is_built(): boolean { return this._lazy === null }

  /** os#1528 — pas construite, et rien à y lire : toutes ses valeurs sont vierges. */
  private get _is_blank_unbuilt(): boolean {
    return this._lazy !== null && this._lazy.json === null && !this._lazy.absent
  }

  /**
   * os#1528 — lue mais jamais ouverte : la branche attend son JSON et peut répondre sans se
   * construire (cf. `_pendingSome`, `_pendingToJSON`). Pas quand une absence (#188) est à
   * propager : l'absence porte sur les étiquettes que le JSON ne cite PAS, il faut alors construire.
   */
  private get _pending(): Type_LazyBranch | null {
    const lazy = this._lazy
    return lazy !== null && lazy.json !== null && !lazy.absent && !lazy.mark_missing_as_absent ? lazy : null
  }

  /**
   * os#1528 — une feuille du JSON en attente satisfait-elle `test` ? Chaque feuille est lue dans une
   * valeur JETABLE, puis oubliée : la mémoire reste celle d'une valeur, pas celle du cube. Le JSON
   * en attente ne pose ni étiquette ni valeur coordonnée (`jsonNeedsEagerRead`) : le lire ne
   * s'inscrit nulle part.
   */
  private _pendingSome(
    lazy: Type_LazyBranch, question: string, test: (value: Class_ElementValue) => boolean
  ): boolean {
    // La carte « Coordonnées » pose `has_result` / `has_intervals` à CHAQUE rendu, sur tous les
    // flux : sans données réconciliées la réponse est non, et il fallait relire tout le cube
    // (SOCLE synthétiques transfo, ~5 millions de cases) à chaque geste dans l'éditeur de groupe.
    const answers = lazy.answers ?? (lazy.answers = {})
    const known = answers[question]
    if (known !== undefined) return known
    const walk = (json: Type_JSON, group: Class_DataTagGroup, below: Class_DataTagGroup[]): boolean => {
      const [next, ...rest] = below
      return group.tags_list.some(tag => {
        const sub = json[tag.id]
        if (sub === null || typeof sub !== 'object') return false
        if (next !== undefined) return walk(sub as Type_JSON, next, rest)
        const value = this.createValue(this)
        value.fromJSON(sub as Type_JSON, lazy.matching_taggs_id, lazy.matching_tags_id)
        return test(value)
      })
    }
    return (answers[question] = walk(lazy.json as Type_JSON, this.data_tag_group, lazy.below))
  }

  /**
   * os#1528 — écrit le JSON en attente SANS construire la branche. Construire pour écrire, c'était
   * reconstruire tout le cube à chaque enregistrement (SOCLE synthétiques transfo, 8 flux de
   * 680 000 cases : « out of memory » dans Firefox). Chaque feuille passe par une valeur jetable,
   * lue puis écrite : le texte est celui qu'écrit la valeur, pas celui du fichier lu, ce qui garde
   * le point fixe de l'aller-retour (#230) — réécrire le JSON brut le cassait. Seules les étiquettes
   * citées s'écrivent : relue, une étiquette absente donne une valeur vierge.
   */
  private _pendingToJSON(lazy: Type_LazyBranch, kwargs?: Type_JSON): Type_JSON {
    const write = (json: Type_JSON, group: Class_DataTagGroup, below: Class_DataTagGroup[]): Type_JSON => {
      const json_object: Type_JSON = { datatag_group: group.id }
      const [next, ...rest] = below
      group.tags_list.forEach(tag => {
        const sub = json[tag.id]
        if (sub === null || typeof sub !== 'object') return
        if (next !== undefined) {
          json_object[tag.id] = write(sub as Type_JSON, next, rest)
          return
        }
        const value = this.createValue(this)
        value.fromJSON(sub as Type_JSON, lazy.matching_taggs_id, lazy.matching_tags_id)
        json_object[tag.id] = value.toJSON(kwargs)
      })
      return json_object
    }
    return write(lazy.json as Type_JSON, this.data_tag_group, lazy.below)
  }

  /** os#1528 — construit la branche : un enfant par membre, puis ce qu'elle avait reçu. */
  private _build() {
    const lazy = this._lazy as Type_LazyBranch
    this._lazy = null
    const children: { [tag_id: string]: Class_ElementValue | Class_ElementValueTree } = {}
    this._children = children as Type_ValueChildren
    const [next, ...rest] = lazy.below
    this.data_tag_group.tags_list.forEach(tag => {
      children[tag.id] = next !== undefined
        ? new Class_ElementValueTree(this, next, rest)
        : this.createValue(this)
    })
    if (lazy.json !== null) {
      this._readJSON(lazy.json, lazy.matching_taggs_id, lazy.matching_tags_id, lazy.mark_missing_as_absent)
    }
    if (lazy.absent) Object.values(children).forEach(child => child.markStructurallyAbsent())
  }

  public unit_data_tag(child: Class_ElementValueTree | Class_ElementValue): Class_DataTag | undefined {
    if (this.data_tag_group.is_unit) return this.data_tag_group.tags_dict[this.getDataTagIdFromChild(child) as string]
    if (this.parent instanceof Class_ElementValueTree) {
      return this.parent.unit_data_tag(this)
    }
    return undefined
  }

  // PRIVATE ATTRIBUTES =================================================================
  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================
  /**
   * @param below os#1528 — les dimensions à déplier SOUS cet étage (de haut en bas) : la branche
   * les retient et ne construit rien avant qu'on la lise. Vide : ses enfants sont des valeurs.
   */
  constructor(
    parent: Class_ElementValueTree | ValueParentElement,
    data_tag_group: Class_DataTagGroup,
    below: Class_DataTagGroup[] = []
  ) {
    this.parent = parent
    this.data_tag_group = data_tag_group
    this._lazy = {
      below, json: null, matching_taggs_id: {}, matching_tags_id: {}, mark_missing_as_absent: false, absent: false
    }
  }

  protected createValue(_: Class_ElementValueTree | ValueParentElement): Class_ElementValue {
    if (this.parent instanceof Class_ElementValueTree) {
      return this.parent.createValue(_)
    }
    const parent_with_factory = this.parent as { createValue?: (_: Class_ElementValueTree | ValueParentElement) => Class_ElementValue }
    if (typeof parent_with_factory.createValue === 'function') {
      return parent_with_factory.createValue(_)
    }
    // Fallback: create a LinkValue (default for backward compat)
    return new Class_LinkValue(_)
  }

  // CLEANING METHODS ====================================================================
  public delete() {
    if (!this._is_currently_deleted) {
      this._is_currently_deleted = true
      // os#1528 — une branche jamais construite n'a rien à défaire.
      if (this._lazy !== null) {
        this._lazy = null
        this._children = {}
        if (this.parent instanceof Class_ElementValueTree) this.parent.removeChild(this)
        return
      }
      Object.keys(this.children)
        .forEach(id => {
          this.children[id].delete()
        })
      this.children = {}
      if (this.parent instanceof Class_ElementValueTree)
        this.parent.removeChild(this)
    }
  }

  // COPY METHODS =======================================================================
  public copyFrom(element: Class_ElementValueTree) {
    const [allValues, allTrees] = element.kindOfChildren()
    Object.values(this.children)
      .forEach(child => child.delete())
    Object.keys(element.children)
      .forEach(tag_id => {
        const child_to_copy = element.children[tag_id]
        if ((child_to_copy instanceof Class_ElementValueTree) && (allTrees)) {
          const new_child = new Class_ElementValueTree(
            this,
            this.rootElement?.sankey.data_taggs_dict[child_to_copy.data_tag_group.id] as Class_DataTagGroup ?? child_to_copy.data_tag_group)
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_ElementValue) && allValues) {
          const new_child = this.createValue(this)
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
      })
  }

  public get has_result() {
    // os#1528 — une branche vierge non construite n'a ni donnée ni résultat : rien à construire.
    if (this._is_blank_unbuilt) return false
    const pending = this._pending
    if (pending !== null) return this._pendingSome(pending, 'has_result', value => value.has_result)
    let has_result = false
    Object.values(this.children)
      .forEach(child => {
        has_result = has_result || child.has_result
      })
    return has_result
  }

  public get has_intervals() {
    if (this._is_blank_unbuilt) return false
    const pending = this._pending
    if (pending !== null) return this._pendingSome(pending, 'has_intervals', value => value.has_intervals)
    let has_intervals = false
    Object.values(this.children)
      .forEach(child => {
        has_intervals = has_intervals || child.has_intervals
      })
    return has_intervals
  }

  public get has_data() {
    if (this._is_blank_unbuilt) return false
    const pending = this._pending
    if (pending !== null) return this._pendingSome(pending, 'has_data', value => value.has_data)
    let has_data = false
    Object.values(this.children)
      .forEach(child => {
        has_data = has_data || child.has_data
      })
    return has_data
  }

  public get has_collected_data(): boolean {
    if (this._is_blank_unbuilt) return false
    const pending = this._pending
    if (pending !== null) return this._pendingSome(pending, 'has_collected_data', value => value.has_collected_data)
    return Object.values(this.children).some(child => child.has_collected_data)
  }

  public set_only_data() {
    if (this._is_blank_unbuilt) return
    Object.values(this.children)
      .forEach(child => child.set_only_data())
  }

  public addFrom(element: Class_ElementValueTree) {
    const [allValues, allTrees] = element.kindOfChildren()
    Object.keys(element.children)
      .forEach(tag_id => {
        const child_to_copy = element.children[tag_id]
        if ((child_to_copy instanceof Class_ElementValueTree) && (allTrees)) {
          (this.children[tag_id] as Class_ElementValueTree).addFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_ElementValue) && allValues) {
          (this.children[tag_id] as Class_ElementValue).addFrom(child_to_copy)
        }
      })
  }

  public toJSON(
    kwargs?: Type_JSON
  ) {
    const json_object: Type_JSON = {}
    json_object['datatag_group'] = this.data_tag_group.id
    // os#1528 — une branche vierge non construite ne s'écrit pas feuille par feuille : relue, une
    // étiquette absente du JSON donne une valeur vierge, exactement ce qu'elle porte.
    if (this._is_blank_unbuilt) return json_object
    // Une branche lue mais jamais ouverte s'écrit depuis son JSON, sans se construire.
    const pending = this._pending
    if (pending !== null) return this._pendingToJSON(pending, kwargs)
    Object.entries(this.children)
      .forEach(([id, child]) => {
        json_object[id] = child.toJSON(kwargs)
      })
    return json_object
  }

  /**
   * @param mark_missing_as_absent FICHIERS LEGACY (cf. `SankeyPersistence.fromJSON`) : une
   * étiquette de dataTag que le fichier ne mentionne PAS pour ce flux vaut « le flux n'existe
   * pas là », et non « valeur pas encore saisie ». Les feuilles correspondantes sont donc
   * marquées `structurally_absent` (#188), ce qui les masque au lieu de les tracer en fantôme
   * pointillé. Sans ce marquage, un diagramme legacy à granularités alternatives (un flux par
   * niveau, cf. « Filière végétale » : 18 flux au niveau 1, 50 au 2, 124 au 3) affichait à
   * chaque niveau les flux des DEUX autres en pointillé. Les fichiers modernes portent le
   * marqueur eux-mêmes (SEP l'écrit à la réconciliation) : pour eux une feuille absente garde
   * son sens de valeur manquante, d'où la garde de version.
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; } = {},
    matching_tags_id: { [_: string]: { [_: string]: string; }; } = {},
    mark_missing_as_absent = false
  ) {
    // os#1528 — une branche non construite GARDE son JSON pour la construction (sauf s'il pose des
    // étiquettes, cf. `jsonNeedsEagerRead`) : c'est ce qui épargne à l'ouverture tout le cube.
    if (this._is_blank_unbuilt && this._lazy !== null && !jsonNeedsEagerRead(json_object)) {
      this._lazy.json = json_object
      this._lazy.matching_taggs_id = matching_taggs_id
      this._lazy.matching_tags_id = matching_tags_id
      this._lazy.mark_missing_as_absent = mark_missing_as_absent
      return
    }
    // Construite (ou à construire maintenant, `children` y pourvoit) : lecture immédiate.
    this._readJSON(json_object, matching_taggs_id, matching_tags_id, mark_missing_as_absent)
  }

  private _readJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; },
    matching_tags_id: { [_: string]: { [_: string]: string; }; },
    mark_missing_as_absent: boolean
  ) {
    const cited_tag_ids = new Set<string>()
    Object.entries(json_object)
      .filter(([id,]) => id !== 'datatag_group')
      .forEach(([id, sub_json_object]) => {
        if (typeof sub_json_object === 'object') {
          cited_tag_ids.add(id)
          const child = this.children[id]
          if (child instanceof Class_ElementValueTree)
            child.fromJSON(
              sub_json_object as Type_JSON,
              matching_taggs_id,
              matching_tags_id,
              mark_missing_as_absent
            )
          else
            child?.fromJSON(
              sub_json_object as Type_JSON,
              matching_taggs_id,
              matching_tags_id
            )
        }
      })
    if (!mark_missing_as_absent) return
    Object.entries(this.children)
      .filter(([id,]) => !cited_tag_ids.has(id))
      .forEach(([, child]) => child.markStructurallyAbsent())
  }

  /** Cf. `fromJSON` : propage le marqueur #188 à toutes les feuilles de la branche. */
  public markStructurallyAbsent() {
    // os#1528 — retenue pour la construction : marquer ne doit pas construire la branche.
    if (this._lazy !== null) { this._lazy.absent = true; return }
    Object.values(this.children).forEach(child => child.markStructurallyAbsent())
  }

  // PUBLIC METHODS =====================================================================
  public expand(data_tag_group: Class_DataTagGroup) {
    // os#1528 — branche vierge non construite : la dimension s'ajoute sous les autres, comme le
    // ferait le dépliage de chacune de ses feuilles (vierges : rien à recopier).
    if (this._is_blank_unbuilt && this._lazy !== null) {
      if (this.data_tag_group !== data_tag_group && !this._lazy.below.includes(data_tag_group)) {
        this._lazy.below.push(data_tag_group)
      }
      return this
    }
    if (this.data_tag_group !== data_tag_group)
      Object.keys(this.children)
        .forEach(id => {
          this.children[id] = this.children[id].expand(data_tag_group)
        })
    return this
  }

  public prune(data_tag_group: Class_DataTagGroup) {
    if (this.data_tag_group === data_tag_group) {
      const parent = this.parent
      const id = Object.keys(this.children)[0]
      const child = this.children[id]
      delete this.children[id]
      if (parent instanceof Class_ElementValueTree) {
        parent.removeAndReplaceChild(this, child)
        return parent
      }
      else {
        return child
      }
    }
    else {
      Object.keys(this.children)
        .forEach(id => {
          const child = this.children[id]
          if (child instanceof Class_ElementValueTree)
            child.prune(data_tag_group)
        })
      return this
    }
  }

  public extend(data_tag: Class_DataTag) {
    const [allValues, allTrees] = this.kindOfChildren()
    const isEmpty = Object.keys(this.children).length === 0
    if (allValues && (!allTrees || isEmpty)) {
      if (data_tag.group === this.data_tag_group) {
        if (!this.children[data_tag.id]) {
          const _ = this.createValue(this)
          this.children[data_tag.id] = _
        }
        return this.children[data_tag.id]
      }
    }
    else if ((!allValues) && allTrees) {
      if (data_tag.group === this.data_tag_group) {
        if (!this.children[data_tag.id]) {
          const ref_child = Object.values(this.children)[0]
          if (ref_child instanceof Class_ElementValueTree) {
            const _ = new Class_ElementValueTree(this, ref_child.data_tag_group)
            this.children[data_tag.id] = _
            _.copyFrom(ref_child)
          }
        }
        return this.children[data_tag.id]
      }
      else {
        let output: Class_ElementValue | Class_ElementValueTree | undefined = undefined
        Object.values(this.children)
          .forEach(child => {
            const _ = child.extend(data_tag)
            if (_ && (!output)) output = _
          })
        return output
      }
    }
    return undefined
  }

  public reduce(data_tag: Class_DataTag) {
    if (data_tag.group === this.data_tag_group) {
      this.removeChildFromDataTagId(data_tag.id)
    }
    else {
      Object.values(this.children)
        .forEach(child => {
          if (child instanceof Class_ElementValueTree)
            child.reduce(data_tag)
        })
    }
  }

  public removeChild(child: Class_ElementValue | Class_ElementValueTree) {
    const id = this.getDataTagIdFromChild(child)
    if (id) this.removeChildFromDataTagId(id)
  }

  /**
   * #285 — replie le niveau d'arbre du groupe donné SANS PERTE avant un
   * prune(group) : chaque tranche (feuille sous un tag du groupe) est
   * « remontée » en valeurs coordonnées par le tag libre correspondant, puis
   * les valeurs des autres tranches sont transférées dans la tranche
   * SÉLECTIONNÉE, qui est placée en première position (celle que prune()
   * conserve). Les valeurs des flux n'étant pas additives (2026-07-18, ex.
   * unités parallèles), la valeur principale du flux reste celle de la tranche
   * sélectionnée — pas une somme. Les résultats de résolution des autres
   * tranches sont abandonnés.
   */
  public collapseGroup(
    group: Class_DataTagGroup,
    tag_for: (tag_id: string) => Class_Tag | undefined,
    selected_tag_id: string | undefined = undefined
  ) {
    if (this.data_tag_group === group) {
      const keys = Object.keys(this.children)
      if (keys.length === 0) return
      const sel_key = (selected_tag_id && keys.includes(selected_tag_id)) ? selected_tag_id : keys[0]
      keys.forEach(key => this._liftSlice(this.children[key], tag_for(key)))
      const selected = this.children[sel_key]
      keys.filter(key => key !== sel_key)
        .forEach(key => this._mergeSliceInto(selected, this.children[key]))
      // prune() conserve la PREMIÈRE clé : y placer la tranche sélectionnée
      if (sel_key !== keys[0]) {
        const first = this.children[keys[0]]
        this.children[keys[0]] = selected
        this.children[sel_key] = first
      }
    }
    else {
      Object.values(this.children)
        .forEach(child => {
          if (child instanceof Class_ElementValueTree) child.collapseGroup(group, tag_for, selected_tag_id)
        })
    }
  }

  /**
   * Annote une tranche avec son tag libre : les sous-valeurs existantes
   * reçoivent la coordonnée en plus ; une feuille sans sous-valeur mais avec
   * une donnée devient une sous-valeur unique portant cette donnée.
   */
  private _liftSlice(
    node: Class_ElementValue | Class_ElementValueTree,
    tag: Class_Tag | undefined
  ) {
    if (node instanceof Class_ElementValueTree) {
      Object.values(node.children).forEach(child => this._liftSlice(child, tag))
      return
    }
    if (node.has_tagged_values) {
      if (tag) node.tagged_values_list.forEach(sub => sub.addTag(tag))
      return
    }
    if (node instanceof Class_LinkValue) {
      const v = node.valueData ?? node.valueResult
      if (v !== null) {
        const sub = node.addTaggedValue()
        sub.value = v
        if (tag) tag.addReference(sub)
      }
    }
  }

  /**
   * Fusionne la tranche source dans la cible (feuille à feuille) : transfert
   * des valeurs coordonnées UNIQUEMENT — les scalaires de la cible (tranche
   * sélectionnée) sont conservés tels quels, pas de somme (valeurs non
   * additives).
   */
  private _mergeSliceInto(
    target: Class_ElementValue | Class_ElementValueTree,
    source: Class_ElementValue | Class_ElementValueTree
  ) {
    if ((target instanceof Class_ElementValueTree) && (source instanceof Class_ElementValueTree)) {
      Object.keys(source.children).forEach(key => {
        if (target.children[key] !== undefined)
          this._mergeSliceInto(target.children[key], source.children[key])
      })
      return
    }
    if ((target instanceof Class_ElementValue) && (source instanceof Class_ElementValue)) {
      // Transfert des valeurs coordonnées (déjà étiquetées par _liftSlice)
      source.tagged_values_list.forEach(sub => {
        target.addTaggedValue().copyFrom(sub)
      })
    }
  }

  public getValueForDataTags(data_tags: Class_DataTag[]): Class_ElementValue | null {
    if (data_tags.length === 0) return null
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    if (matching_tags.length !== 1) return null
    const child = this.children[matching_tags[0].id]
    if (child !== undefined) {
      if (child instanceof Class_ElementValue)
        // #161 — a flux pruned for this dataTag does not exist there: treat it
        // as having no value, so the link is not drawn for this dataTag (same
        // path as a missing leaf). Only triggers for option-on files; with no
        // marker (legacy/default) the behaviour is unchanged.
        return child.structurally_absent ? null : child
      else return child.getValueForDataTags(remaining_tags)
    }
    else {
      return null
    }
  }

  /**
   * os#1511 lot 1 — VALEURS CONTRIBUTRICES pour une position du cube, agrégat compris.
   *
   * `getValueForDataTags` adresse un POINT : il exige exactement un membre par dimension et
   * rend la valeur qui s'y trouve, ou rien. Depuis qu'une dimension peut porter une
   * hiérarchie, viser un membre PARENT doit rendre ce que portent ses feuilles — sans quoi
   * « lire les céréales » ne montrerait rien alors que la donnée existe, produit par produit.
   *
   * Cette méthode rend la LISTE des valeurs à additionner, et non leur somme, parce que le
   * nombre à sommer n'est pas décidable ici : selon le flux, la couche lue est la donnée
   * saisie ou le résultat réconcilié (cf. `_reads_collected_layer`). L'appelant, lui, le
   * sait déjà.
   *
   * - `null` : ABSENT. Rien à dessiner — à distinguer d'un zéro, qui est une valeur.
   * - un seul élément : la valeur portée AU NIVEAU DEMANDÉ ; elle fait foi, l'agrégat n'est
   *   qu'un recours. C'est ce qui permet de charger un fichier où seuls les totaux sont
   *   connus, sans que le calcul ne les écrase.
   * - plusieurs : les feuilles à additionner.
   *
   * Une feuille `structurally_absent` (#161) est SAUTÉE, jamais comptée pour zéro : « ce flux
   * n'existe pas ici » n'est pas « il vaut 0 ». Si toutes les feuilles d'un parent sont
   * absentes, le parent l'est aussi — sinon le diagramme se remplirait de flux fantômes.
   */
  public getContributingValues(data_tags: Class_DataTag[]): Class_ElementValue[] | null {
    if (data_tags.length === 0) return null
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    if (matching_tags.length === 0) return null
    // os#1511 — PLUSIEURS MEMBRES VISÉS sur cet axe : on additionne ce que chacun apporte.
    //
    // `getValueForDataTags` adresse un point et refuse ce cas ; les contributions, elles, sont
    // faites pour être sommées. Sans cela, mettre une dimension en choix multiple pendant qu'une
    // autre pilote des nœuds effaçait le flux entier : le nœud engendré demandait sa valeur avec
    // deux filières visées, et n'obtenait rien. Constaté à l'écran le 28/09.
    //
    // Les membres visés sont des frères — l'interface interdit de mêler deux niveaux — donc
    // rien n'est compté deux fois. Mêler un parent et son enfant le ferait, et c'est la raison
    // de cet interdit.
    if (matching_tags.length > 1) {
      const cumul: Class_ElementValue[] = []
      matching_tags.forEach(membre => {
        const part = this.getContributingValues([membre, ...remaining_tags])
        if (part !== null) cumul.push(...part)
      })
      return cumul.length > 0 ? cumul : null
    }
    const member = matching_tags[0]

    // 1. Ce que porte le membre visé lui-même.
    const carried = this._contributionOf(this.children[member.id], remaining_tags)
    if (carried !== null) return carried

    // 2. À défaut, ses feuilles. Un membre sans descendance est sa propre feuille : il n'y a
    //    alors rien de plus à tenter, et on rend ABSENT plutôt que de reboucler sur lui.
    const leaves = member.leaves
    if (leaves.length === 1 && leaves[0] === member) return null
    const contributions: Class_ElementValue[] = []
    leaves.forEach(leaf => {
      const contribution = this._contributionOf(this.children[leaf.id], remaining_tags)
      if (contribution !== null) contributions.push(...contribution)
    })
    return contributions.length > 0 ? contributions : null
  }

  /**
   * os#1511 — ce qu'un nœud du trie apporte : rien s'il est absent ou vide, lui-même si c'est
   * une valeur renseignée, et sinon la récursion sur la dimension suivante.
   *
   * Le trie est DENSE — son constructeur crée un enfant pour chaque membre du groupe — donc
   * un membre parent a toujours son nœud, vide. « Porte une valeur » ne peut pas se lire à la
   * présence de la clé : il faut que la valeur ait une donnée ou un résultat.
   */
  private _contributionOf(
    child: Class_ElementValue | Class_ElementValueTree | undefined,
    remaining_tags: Class_DataTag[]
  ): Class_ElementValue[] | null {
    if (child === undefined) return null
    if (child instanceof Class_ElementValue) {
      if (child.structurally_absent) return null
      if (!child.has_data && !child.has_result) return null
      return [child]
    }
    return child.getContributingValues(remaining_tags)
  }

  // #188 — mirror getValueForDataTags but return the structurally-absent marker
  // of the matching leaf. getValueForDataTags returns null for an absent leaf,
  // which is indistinguishable from a plain missing value; a Link needs the
  // marker itself to stay hidden (not drawn as a dashed zero phantom) for a
  // dataTag where the flux does not exist.
  public getStructurallyAbsentForDataTags(data_tags: Class_DataTag[]): boolean {
    if (data_tags.length === 0) return false
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    if (matching_tags.length !== 1) return false
    const child = this.children[matching_tags[0].id]
    if (child === undefined) return false
    if (child instanceof Class_ElementValue) return child.structurally_absent
    return child.getStructurallyAbsentForDataTags(remaining_tags)
  }

  public setValueForDataTags(data_tags: Class_DataTag[], val: Class_ElementValue) {
    if (data_tags.length === 0) return
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    if (matching_tags.length !== 1) return null
    const child = this.children[matching_tags[0].id]
    if (child == undefined) {
      this.children[matching_tags[0].id] = val
    }
    else {
      if (child instanceof Class_ElementValueTree)
        child.setValueForDataTags(remaining_tags, val)
    }
  }

  public getTextValueForDataTags(data_tags: Class_DataTag[]): string | null {
    const value = this.getValueForDataTags(data_tags)
    if (value !== null) {
      return value.text_value
    }
    else {
      return null
    }
  }

  /**
   * os#1511 — la fratrie est balayée jusqu'au fils, plus au-delà : un même objet n'est jamais
   * rangé sous deux étiquettes (chaque entrée reçoit une valeur fraîchement construite), donc
   * s'arrêter au premier trouvé rend le même résultat. On évite aussi le tableau de clés :
   * appelée pour chaque feuille d'un cube de 116 772, cette allocation se voyait au profil.
   */
  public getDataTagIdFromChild(child: Class_ElementValue | Class_ElementValueTree): string | undefined {
    for (const tag_id in this.children) {
      if (this.children[tag_id] === child) return tag_id
    }
    return undefined
  }

  public getDataTagsIdCombination(child: Class_ElementValue | Class_ElementValueTree): string[] {
    const id = this.getDataTagIdFromChild(child)
    if (id) {
      if (this.parent instanceof Class_ElementValueTree) {
        const prev_id = this.parent.getDataTagsIdCombination(this)
        prev_id.push(id)
        return prev_id
      }
      else return [id]
    }
    return []
  }

  public getMaxValue() {
    // os#1528 — des feuilles vierges valent 0 (cf. `Class_LinkValue.getMaxValue`).
    if (this._is_blank_unbuilt) return this.data_tag_group.tags_list.length > 0 ? 0 : null
    let max: number | null = null
    Object.entries(this.children)
      .forEach(child => {
        const _ = child[1].getMaxValue()
        max = ((max ?? 0) <= _ ? _ : max)
      })
    return max
  }

  public getAllValues() {
    let out: { [_: string]: [Class_ElementValue, Class_DataTag[] | undefined]; } = {}
    Object.values(this.children)
      .forEach(child => {
        const _ = child.getAllValues()
        out = {
          ...out,
          ..._
        }
      })

    Object.values(out)
      .forEach(_ => {
        if (_[1] && this.data_tag)
          _[1].push(this.data_tag)
      })
    return out
  }

  // PRIVATE METHODS ====================================================================
  private kindOfChildren() {
    let allElementValue = true
    let allElementValueTree = true
    Object.values(this.children)
      .forEach(child => {
        allElementValue = allElementValue && (child instanceof Class_ElementValue)
        allElementValueTree = allElementValueTree && (child instanceof Class_ElementValueTree)
      })
    return [allElementValue, allElementValueTree]
  }

  private removeAndReplaceChild(
    child: Class_ElementValue | Class_ElementValueTree,
    new_child: Class_ElementValue | Class_ElementValueTree
  ) {
    const id = this.getDataTagIdFromChild(child)
    if (id) {
      this.removeChildFromDataTagId(id)
      this.children[id] = new_child
      new_child.parent = this
    }
  }

  private removeChildFromDataTagId(id: string) {
    if (this.children[id]) {
      this.children[id].delete()
      delete this.children[id]
    }
  }

  // GETTERS / SETTERS ==================================================================
  public get rootElement(): ValueParentElement | null {
    if (this.parent instanceof Class_ElementValueTree) return this.parent.rootElement
    return this.parent
  }

  public get link(): Class_LinkElement | null {
    const root = this.rootElement
    return isLinkElement(root) ? root : null
  }

  public get data_tag() {
    if (this.parent instanceof Class_ElementValueTree)
      return this.parent.data_tag_group.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null

    else
      return null
  }
}

// Backward-compatible alias
export { Class_ElementValueTree as Class_LinkValueTree }

/** os#1511 — un vecteur de n cases vides ; cf. le constructeur de `Class_ElementValue`. */
const vecteurVide = (n: number): (number | null)[] => (n === 1) ? [null] : new Array(n).fill(null)

// CLASS ELEMENT VALUE (BASE) ***********************************************************
/**
 * Abstract base class for element values (link flux, stock, etc.).
 * Provides common infrastructure: parent chain, id, tags, tree operations.
 * Subclasses define their own value fields.
 *
 * @export
 * @class Class_ElementValue
 */
// SA#487 / SA#507 — le vocabulaire de la valeur objectif, partagé par toutes
// les surfaces où une valeur de flux se saisit : le panneau des flux, l'onglet
// tableur, et demain toute autre. Il reprend exactement celui du parser Excel
// (io_excel_constants) : ce qui s'écrit dans un classeur doit s'écrire dans
// l'application, sinon le même modèle ne se dit pas de la même façon selon la
// porte par laquelle on entre.
//
// Ce sont des CLÉS internes, pas des mots que l'utilisateur écrit : l'intention
// se saisit en posant une incertitude infinie, et la valeur visée en regard.
// SA#487 avait d'abord fait écrire « min » / « max » dans la case Valeur ; ces
// deux mots-clés sont supprimés (2026-09-10).
export const VALUE_OBJECTIVE_MIN = 'min'
export const VALUE_OBJECTIVE_MAX = 'max'

/**
 * SA#507 — orthographes de l'infini, dans la case Valeur comme dans la case
 * Incertitude. Mêmes mots que côté parser (io_excel_constants), pour qu'une
 * étude se saisisse indifféremment dans le classeur ou dans l'application.
 */
const INFINITY_KEYWORDS = [
  'infini', 'infinie', 'infinis', 'infinies', 'inf', 'infty',
  'infinity', 'infinite', '∞',
]

/**
 * SA#507 — « infini », écrit avec ou sans signe. Rend 0 si ce n'en est pas un,
 * +1 ou -1 sinon : le signe compte dans la case Valeur, où « -infini » dit
 * « le plus petit possible ».
 */
export function parseInfinity(text: string | null | undefined): number {
  if (text === null || text === undefined) return 0
  let word = String(text).trim().toLowerCase().replace(/^\+/, '')
  let sign = 1
  if (word.startsWith('-')) {
    sign = -1
    word = word.slice(1).trim()
  }
  return INFINITY_KEYWORDS.includes(word) ? sign : 0
}

/**
 * SA#507 — l'intention que porte la case Valeur d'un flux DÉJÀ déclaré objectif
 * (incertitude infinie) : « infini » y dit « la plus grande valeur possible »,
 * « -infini » « la plus petite ». Tout le reste rend null — c'est un nombre, et
 * ce nombre est la cible.
 *
 * Le mot ne devient JAMAIS un nombre : la sentinelle passée telle quelle à un
 * solveur ruinait son conditionnement (SA#487).
 */
export function parseValueObjective(text: string | null | undefined): string | null {
  const infinity = parseInfinity(text)
  if (infinity > 0) return VALUE_OBJECTIVE_MAX
  if (infinity < 0) return VALUE_OBJECTIVE_MIN
  return null
}

export class Class_ElementValue {

  // PUBLIC ATTRIBUTES ==================================================================
  public parent: Class_ElementValueTree | ValueParentElement

  public unit_data_tag(): Class_DataTag | undefined {
    if (this.parent instanceof Class_ElementValueTree) {
      return this.parent.unit_data_tag(this)
    }
    return undefined
  }

  public text_value: string | null = null

  // #161 — true when this (flux, dataTag) cell was pruned by the no-propagation
  // option: the flux does not exist for this dataTag. Used to omit the link
  // from the diagram for that dataTag (see getValueForDataTags). Default false.
  public structurally_absent: boolean = false

  // SA#487 — intention d'optimisation portée par la cellule Valeur de la feuille
  // de données : « min » / « max » au lieu d'un nombre, et le rang de
  // déclaration qui arbitre entre plusieurs demandes concurrentes. Le front ne
  // les fabrique ni ne les interprète — c'est le moteur qui établit la valeur —
  // mais il doit les RECONDUIRE : sans cela, ouvrir puis enregistrer une étude
  // depuis l'application effacerait la demande, puisque toJSON réécrit le
  // dictionnaire champ par champ.
  public value_objective: string | null = null
  public value_objective_rank: number | null = null
  // SA#507 — la valeur visée, quand l'intention en désigne une. TOUJOURS finie :
  // « infini » se dit par l'intention (« max » / « min »), jamais par un nombre.
  public value_objective_target: number | null = null

  /** Cf. `Class_ElementValueTree.fromJSON` : feuille qu'un fichier legacy ne mentionne pas. */
  public markStructurallyAbsent() {
    this.structurally_absent = true
  }

  // VALUE VECTORS =====================================================================
  // Each vector has length = vectorSize (set by subclass).
  // Each index represents a different quantity (e.g. source/target for links, initial/variation for stocks).
  protected _data_value: (number | null)[]
  protected _data_min: (number | null)[]
  protected _data_max: (number | null)[]
  protected _data_uncertainty: (number | null)[]
  protected _result_value: (number | null)[]
  protected _result_min: (number | null)[]
  protected _result_max: (number | null)[]

  /** Subclasses override to define vector size */
  protected get vectorSize(): number { return 1 }

  // PRIVATE ATTRIBUTES ==================================================================
  /**
   * os#1511 — FABRIQUÉ À LA DEMANDE. OS#1367 avait déjà établi que cet identifiant n'est pas
   * une identité mais une clé de dictionnaire temporaire, jamais écrite dans le fichier ; rien
   * n'oblige donc à le tirer tant que personne ne le lit. Or sur le SOCLE (148 produits × 263
   * pays × 3 années) le cube compte 116 772 feuilles par élément, et le profil V8 imputait
   * 2,6 s au seul tirage aléatoire — pour des chaînes que le chargement ne consulte jamais.
   */
  private _id: string | null = null
  private _flux_tags: Class_Tag[] = []
  private _taggs_dict: { [x: string]: Class_Tag[]; } = {}
  // #284 — sous-valeurs à coordonnée éparse (NOTE-FUSION-TAGS.md §3.0). Une
  // feuille sans sous-valeur explicite équivaut à une unique sous-valeur
  // implicite portant toute la quantité avec les tags de la feuille
  // (_flux_tags). La somme des sous-valeurs n'est PAS contrainte par le modèle.
  private _tagged_values: Class_ElementTaggedValue[] = []
  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================
  constructor(parent: Class_ElementValueTree | ValueParentElement) {
    this.parent = parent
    const n = this.vectorSize
    // os#1511 — `[null]` plutôt que `new Array(1).fill(null)` dans le cas courant (les flux) :
    // le second fabrique un tableau TROUÉ puis le bouche, que V8 range dans une famille plus
    // lente que le littéral. Sept vecteurs par feuille et 116 772 feuilles par élément : la
    // différence se lit au chronomètre.
    this._data_value = vecteurVide(n)
    this._data_min = vecteurVide(n)
    this._data_max = vecteurVide(n)
    this._data_uncertainty = vecteurVide(n)
    this._result_value = vecteurVide(n)
    this._result_min = vecteurVide(n)
    this._result_max = vecteurVide(n)
    // os#1511 — l'identifiant n'est plus tiré ici (cf. `_id` et le getter `id`). La combinaison
    // de dataTags n'y entrait de toute façon pas : le nom était un `const` et la boucle qui
    // l'épelait jetait son résultat. Elle coûtait pourtant cher, car `data_tags_id` remonte
    // l'arbre en cherchant à chaque étage la clé du fils par BALAYAGE de la fratrie
    // (`getDataTagIdFromChild`) — or à la construction le fils n'y est pas encore posé, donc le
    // balayage était intégral et rendait toujours la liste vide. Le profil V8 du SOCLE (148
    // produits × 263 pays × 3 années) lui imputait 4,6 s des 12 s de construction, pour rien.
  }

  // CLEANING METHODS ===================================================================
  /**
   * @param detach_from_parent os#1511 — `false` quand l'appelant REMPLACE lui-même l'entrée du
   * parent (cf. `expand`) : le retrait chercherait la clé du fils par balayage de la fratrie,
   * pour la voir écrasée juste après. Sur le SOCLE ce balayage pesait 9,8 s au profil V8.
   */
  public delete(detach_from_parent = true) {
    if (!this._is_currently_deleted) {
      this._is_currently_deleted = true
      if (detach_from_parent && this.parent instanceof Class_ElementValueTree)
        this.parent.removeChild(this)
      this.flux_tags_list.forEach(tag => tag.removeReference(this))
      this._flux_tags = []
      this._taggs_dict = {}
      this._tagged_values.slice().forEach(sub => sub.delete())
      this._tagged_values = []
    }
  }

  // COPY METHODS =======================================================================
  public copyFrom(element: Class_ElementValue) {
    // Copy value vectors
    const n = Math.min(this._data_value.length, element._data_value.length)
    for (let i = 0; i < n; i++) {
      this._data_value[i] = element._data_value[i]
      this._data_min[i] = element._data_min[i]
      this._data_max[i] = element._data_max[i]
      this._data_uncertainty[i] = element._data_uncertainty[i]
      this._result_value[i] = element._result_value[i]
      this._result_min[i] = element._result_min[i]
      this._result_max[i] = element._result_max[i]
    }
    this.text_value = element.text_value
    // SA#487 : recopiée avec le reste, sinon une duplication de flux perdrait
    // l'intention sans que rien ne le dise (cf. #385).
    this.value_objective = element.value_objective
    this.value_objective_rank = element.value_objective_rank
    this.value_objective_target = element.value_objective_target
    // Tags - Cleaning
    this.flux_tags_list.forEach(tag => tag.removeReference(this))
    this._flux_tags = []
    this._taggs_dict = {}
    // Re-associating
    element.flux_tags_list
      .forEach(flux_tag => {
        flux_tag.addReference(this)
      })
    // Sub-values (#284)
    this._tagged_values.slice().forEach(sub => sub.delete())
    this._tagged_values = []
    element.tagged_values_list
      .forEach(sub => {
        this.addTaggedValue().copyFrom(sub)
      })
  }

  public addFrom(_element: Class_ElementValue) {
    // Base: no-op, subclasses implement value-specific addition
  }

  // SERIALIZATION ======================================================================
  public toJSON(_kwargs?: Type_JSON): Type_JSON {
    const json_object: Type_JSON = {}
    // OS#1367 — l'`id` d'une valeur n'est PLUS écrit. Il est fabriqué au
    // constructeur par makeId(), avec un suffixe aléatoire : ce n'est pas une
    // identité mais une clé de dictionnaire temporaire (getAllValues,
    // Class_Tag._references), reconstruite à chaque chargement. Rien ne le
    // référence dans le fichier — la coordonnée d'une valeur, c'est son flux et
    // ses tags, c'est-à-dire sa position dans la structure. Sur un gros
    // diagramme ces chaînes pesaient ~18 % du poids du JSON.
    // La LECTURE reste tolérante (cf. fromJSON) : un fichier ancien porte
    // encore ces id et les conserve.
    // SA#580 - les etiquettes d'un groupe attribue par regles se calculent : jamais ecrites
    const written_taggs = this.flux_taggs_list.filter(tagg => !tagg.is_rule_based)
    if (written_taggs.length > 0) {
      json_object['tags'] = Object.fromEntries(
        written_taggs
          .map(tagg => [
            tagg.id,
            this.flux_tags_list
              .filter(tag => (tag.group === tagg))
              .map(tag => tag.id)
          ]))
    }
    if (this._tagged_values.length > 0) {
      json_object['tagged_values'] = this._tagged_values.map(sub => sub.toJSON()) as unknown as Type_JSON
    }
    return json_object
  }

  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; } = {},
    _matching_tags_id: { [_: string]: { [_: string]: string; }; } = {}
  ) {
    // OS#1367 — tolérance de lecture : l'id n'est plus écrit, mais un fichier
    // ancien en porte un ; on l'adopte alors tel quel, sinon on garde celui du
    // constructeur. os#1511 — l'absence se lit sans TOUCHER à `this._id` : le consulter
    // comme valeur de repli forcerait le tirage que la construction paresseuse évite.
    if (typeof json_object['id'] === 'string') this._id = json_object['id'] as string
    // Get Flux tags
    const flux_taggs_dict = (this.link?.drawing_area.sankey.flux_taggs_dict ?? {})
    Object.entries(json_object['tags'] ?? {})
      .filter(([_id_tagg, list]) => {
        const tagg_id = _id_tagg
        const tag_ids = list
        return (
          (tagg_id in flux_taggs_dict) &&
          (tag_ids.length > 0))
      })
      .forEach(([id, list]) => {
        const tagg_id = matching_taggs_id[id] ?? id
        const tagg = flux_taggs_dict[tagg_id] as Class_TagGroup
        const tag_ids = list
        tagg.tags_list
          .filter(tag => tag_ids.includes(tag.id))
          .forEach(tag => this.addTag(tag))
      })
    // Sub-values (#284)
    const tagged_values_json = json_object['tagged_values']
    if (Array.isArray(tagged_values_json)) {
      tagged_values_json
        .filter(sub_json => typeof sub_json === 'object' && sub_json !== null)
        .forEach(sub_json => {
          this.addTaggedValue().fromJSON(sub_json as Type_JSON)
        })
    }
  }

  // PUBLIC METHODS =====================================================================
  public draw() {
    this.link?.draw()
  }

  public expand(data_tag_group: Class_DataTagGroup) {
    const new_parent = new Class_ElementValueTree(this.parent, data_tag_group)
    // Le sous-arbre a une valeur par membre : il ne reste qu'à y recopier celle qu'on déplie. On
    // passait auparavant par `extend`, un par membre, qui reclasse tous les enfants
    // (`kindOfChildren`) à chaque appel pour finir par rendre un enfant qui existait déjà — n
    // appels balayant n enfants, donc un coût en n².
    //
    // C'est ce que le profil V8 a montré sur le SOCLE, où déplier 263 pays sous 148 produits
    // faisait 5 millions de comparaisons : 45 s dans `kindOfChildren`, 23 s dans
    // `getDataTagIdFromChild`. Mesuré le 28/09.
    //
    // os#1528 — une valeur VIERGE (celle d'un flux qu'on vient de créer, dont on déplie les
    // dimensions) n'a rien à recopier : le sous-arbre reste non construit, et c'est tout le gain.
    if (!this.is_blank) {
      Object.values(new_parent.children).forEach(child => {
        if (child instanceof Class_ElementValue) child.copyFrom(this)
      })
    }
    // Les QUATRE appelants de `expand` rangent eux-mêmes le sous-arbre rendu à la place de la
    // feuille dépliée (`this.children[id] = …`, `this._values = …`). Se retirer du parent serait
    // donc chercher une clé pour la voir écrasée dans la foulée : 9,8 s au profil V8 du SOCLE,
    // passées dans le balayage de fratrie de `getDataTagIdFromChild`. Mesuré le 28/09.
    this.delete(false)
    return new_parent
  }

  public hasGivenTag(tag: Class_Tag) {
    // #285 (fusion) — un tag peut être porté par le flux ENTIER (_flux_tags) ou,
    // sur un flux ventilé, par une de ses valeurs coordonnées. La légende et le
    // filtrage comptent l'usage via ce test : sans les tagged_values, un flux
    // fusionné (ex. import e!Sankey) ferait disparaître ses tags de la légende.
    // SA#580 - groupe attribue par regles : le port se calcule sur la valeur, les etiquettes
    // affectees a la main (avant que le groupe ne devienne « par regles ») ne comptent plus.
    if (tag?.group?.is_rule_based) {
      const ruled = tag.group.ruleTagFor(this)
      return tag.is_untagged ? ruled === undefined : ruled === tag
    }
    // SA#553 - etiquette generee : portee quand la valeur ne porte aucune autre etiquette du groupe
    if (tag?.is_untagged) return !this.carriesTagOfGroup(tag.group.id)
    return this._flux_tags.includes(tag) ||
      this._tagged_values.some(tv => tv.tags_list.includes(tag))
  }

  /** SA#553 - la valeur porte-t-elle une etiquette (ordinaire) du groupe, sur le flux ou une valeur coordonnee ? */
  public carriesTagOfGroup(group_id: string): boolean {
    // SA#580 - groupe attribue par regles : porte une etiquette si la regle en attribue une
    const rule_group = this.rule_flux_taggs_list.find(tagg => tagg.id === group_id)
    if (rule_group) return rule_group.ruleTagFor(this) !== undefined
    return (this._taggs_dict[group_id]?.length ?? 0) > 0 ||
      this._tagged_values.some(tv => tv.tags_list.some(tag => tag.group.id === group_id))
  }

  public addTag(tag: Class_Tag) {
    // SA#553 - le port de l'etiquette generee se calcule, il ne s'affecte pas
    // SA#580 - ni celui d'une etiquette d'un groupe attribue par regles
    if (tag?.is_untagged || tag?.group?.is_rule_based) return
    if (!this.hasGivenTag(tag)) {
      this._flux_tags.push(tag)
      this.addTagToGroupTagDict(tag)
      tag.addReference(this)
      this.draw()
    }
  }

  public removeTag(tag: Class_Tag) {
    // SA#580 - `hasGivenTag` calcule le port des groupes par regles : on retire ce qui est STOCKE
    if (this._flux_tags.includes(tag)) {
      const idx = this._flux_tags.indexOf(tag)
      this._flux_tags.splice(idx, 1)
      this.removeTagToGroupTagDict(tag)
      tag.removeReference(this)
      this.draw()
    }
  }

  // SUB-VALUES (#284) ==================================================================
  public addTaggedValue(id: string | undefined = undefined): Class_ElementTaggedValue {
    const sub = new Class_ElementTaggedValue(this, id)
    this._tagged_values.push(sub)
    return sub
  }

  public removeTaggedValue(sub: Class_ElementTaggedValue) {
    const idx = this._tagged_values.indexOf(sub)
    if (idx >= 0) {
      this._tagged_values.splice(idx, 1)
      sub.delete()
    }
  }

  public get tagged_values_list(): Class_ElementTaggedValue[] { return [...this._tagged_values] }

  public get has_tagged_values(): boolean { return this._tagged_values.length > 0 }

  /**
   * os#1528 — la valeur est-elle VIERGE, telle qu'à sa construction ? Rien de saisi, de calculé,
   * d'étiqueté ni de marqué : la recopier ne transmettrait rien. Les sous-classes ajoutent leurs
   * propres champs.
   */
  public get is_blank(): boolean {
    const empty = (v: (number | null)[]) => v.every(x => x === null)
    return empty(this._data_value) && empty(this._data_min) && empty(this._data_max) &&
      empty(this._data_uncertainty) && empty(this._result_value) && empty(this._result_min) &&
      empty(this._result_max) && this.text_value === null && !this.structurally_absent &&
      this.value_objective === null && this.value_objective_rank === null &&
      this.value_objective_target === null && this._flux_tags.length === 0 && this._tagged_values.length === 0
  }

  public get has_result(): boolean { return false }
  public get has_intervals(): boolean { return false }
  public get has_data(): boolean { return false }
  public get has_collected_data(): boolean { return false }
  public set_only_data() { /* subclasses override */ }

  public getMaxValue(): number {
    return 0
  }

  public getAllValues(): { [_: string]: [Class_ElementValue, Class_DataTag[] | undefined]; } {
    const tmp: { [_: string]: [Class_ElementValue, Class_DataTag[] | undefined]; } = {}
    if (this.data_tag)
      tmp[this.id] = [this, [this.data_tag]]
    else
      tmp[this.id] = [this, undefined]
    return tmp
  }

  // PRIVATE ===================================================
  private addTagToGroupTagDict(tag: Class_Tag) {
    const grp_id = tag.group.id
    if (grp_id in this._taggs_dict) {
      if (!(this._taggs_dict[grp_id].includes(tag)))
        this._taggs_dict[grp_id].push(tag)
    } else {
      this._taggs_dict[grp_id] = [tag]
    }
  }

  private removeTagToGroupTagDict(tag: Class_Tag) {
    const grp_id = tag.group.id
    if (grp_id in this._taggs_dict) {
      const idx = this._taggs_dict[grp_id].indexOf(tag)
      this._taggs_dict[grp_id].splice(idx, 1)
      if (Object.values(this._taggs_dict[grp_id]).length == 0) {
        delete this._taggs_dict[grp_id]
      }
    }
  }

  // GETTERS / SETTERS ==================================================================
  /** os#1511 — tiré au premier regard, et pas avant (cf. `_id`). */
  public get id(): string {
    if (this._id === null) this._id = makeId((this.link?.id ?? '') + '_value_')
    return this._id
  }

  public get rootElement(): ValueParentElement | null {
    if (this.parent instanceof Class_ElementValueTree) return this.parent.rootElement
    return this.parent
  }

  public get link(): Class_LinkElement | null {
    const root = this.rootElement
    return isLinkElement(root) ? root : null
  }

  public get flux_tags_dict() {
    return this._flux_tags
  }

  public get flux_tags_list() {
    return Object.values(this._flux_tags)
  }

  public get flux_taggs_dict() {
    const taggs: { [_: string]: Class_TagGroup; } = {}
    this.flux_tags_list
      .forEach(tag => {
        if (!taggs[tag.group.id])
          taggs[tag.group.id] = tag.group
      })
    return taggs
  }

  public get taggs_dict() {
    return this._taggs_dict
  }

  /** SA#580 - groupes de flux du diagramme qui attribuent leurs etiquettes par regles. */
  public get rule_flux_taggs_list(): Class_TagGroup[] {
    const sankey = this.link?.sankey
    if (!sankey) return []
    return sankey.flux_taggs_list.filter(tagg => tagg.is_rule_based)
  }

  /**
   * SA#580 - etiquettes que la valeur PORTE A L'ECRAN : celles qui lui sont affectees, hors
   * groupes par regles, plus celles que ces groupes lui attribuent. C'est ce que lisent l'affichage
   * (visibilite, styles, couleur, info-bulle, libelles) ; `flux_tags_list` reste ce qui est STOCKE
   * (ecriture du fichier, copies).
   */
  public get effective_flux_tags_list(): Class_Tag[] {
    const rule_taggs = this.rule_flux_taggs_list
    if (rule_taggs.length === 0) return this.flux_tags_list
    const tags = this._flux_tags.filter(tag => !tag.group.is_rule_based)
    rule_taggs.forEach(tagg => {
      const tag = tagg.ruleTagFor(this) as Class_Tag | undefined
      if (tag) tags.push(tag)
    })
    return tags
  }

  /** SA#580 - pendant de `taggs_dict` pour `effective_flux_tags_list`. */
  public get effective_taggs_dict(): { [x: string]: Class_Tag[]; } {
    if (this.rule_flux_taggs_list.length === 0) return this._taggs_dict
    const dict: { [x: string]: Class_Tag[]; } = {}
    this.effective_flux_tags_list.forEach(tag => {
      (dict[tag.group.id] ??= []).push(tag)
    })
    return dict
  }

  /** SA#580 - grandeur mesuree par une regle d'attribution ; aucune sur une valeur generique. */
  public ruleQuantity(_quantity: string): number | undefined { return undefined }

  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }

  public get data_tags_id() {
    if (this.parent instanceof Class_ElementValueTree)
      return this.parent.getDataTagsIdCombination(this)
    else
      return []
  }

  public get data_tagg() {
    if (this.parent instanceof Class_ElementValueTree)
      return this.parent.data_tag_group
    else
      return null
  }

  public get data_tag() {
    if (this.parent instanceof Class_ElementValueTree)
      return this.data_tagg?.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null
    else
      return null
  }
}

// CLASS ELEMENT SUB VALUE **************************************************************
/**
 * #284 — Sous-valeur d'une feuille (NOTE-FUSION-TAGS.md §3.0) : détail facultatif
 * d'une Class_ElementValue portant une quantité et une coordonnée éparse — au
 * plus UN tag par groupe de tags de flux, sur zéro ou plusieurs groupes.
 * Permet plusieurs quantités étiquetées différemment sur un même flux sans
 * dupliquer le lien (ex. A→B = 6 {acier, route} + 4 {cuivre, rail}).
 *
 * @export
 * @class Class_ElementTaggedValue
 */
export class Class_ElementTaggedValue {

  // PUBLIC ATTRIBUTES ==================================================================
  public parent: Class_ElementValue

  // PRIVATE ATTRIBUTES =================================================================
  private _id: string
  private _value: number | null = null
  private _tags: Class_Tag[] = []
  private _is_currently_deleted = false
  // #285 — la bande (cette valeur taguée) affiche-t-elle son propre label de
  // valeur sur le dessin ? Piloté PAR BANDE dans la config valeur du flux, et
  // indépendant du label de total du flux. Défaut false (total seul, style
  // e!Sankey) ; le seuil de taille (filter_label) s'applique ensuite par bande.
  private _label_visible = false

  // CONSTRUCTOR ========================================================================
  constructor(
    parent: Class_ElementValue,
    id: string | undefined = undefined
  ) {
    this.parent = parent
    this._id = id ?? makeId(parent.id + '_sub')
  }

  // CLEANING METHODS ===================================================================
  public delete() {
    if (!this._is_currently_deleted) {
      this._is_currently_deleted = true
      this._tags.slice().forEach(tag => tag.removeReference(this))
      this._tags = []
      this.parent.removeTaggedValue(this)
    }
  }

  // COPY METHODS =======================================================================
  public copyFrom(sub_to_copy: Class_ElementTaggedValue) {
    this._value = sub_to_copy._value
    this._label_visible = sub_to_copy._label_visible
    this._tags.slice().forEach(tag => tag.removeReference(this))
    this._tags = []
    sub_to_copy.tags_list.forEach(tag => tag.addReference(this))
  }

  // SERIALIZATION ======================================================================
  public toJSON(): Type_JSON {
    const json_object: Type_JSON = {}
    // OS#1367 — l'`id` d'une sous-valeur n'est plus écrit non plus. Ce qui
    // désigne une sous-valeur dans le fichier, c'est sa POSITION dans le
    // tableau `tagged_values` : la lecture les recrée dans l'ordre, l'encodage
    // delta des vues (#254) remplace un tableau en bloc, et l'id ne sert qu'en
    // mémoire (clé de Class_Tag._references, fermetures undo/redo du menu
    // d'édition, qui capturent l'id de la session courante). Aucune autre
    // partie du fichier ne le référence.
    if (this._value !== null) json_object['value'] = this._value
    if (this._label_visible) json_object['label_visible'] = true
    if (this._tags.length > 0)
      json_object['tags'] = Object.fromEntries(
        this._tags.map(tag => [tag.group.id, tag.id]))
    return json_object
  }

  public fromJSON(json_object: Type_JSON) {
    // OS#1367 — tolérance de lecture (cf. Class_ElementValue.fromJSON).
    this._id = getStringFromJSON(json_object, 'id', this._id)
    this._value = getNumberOrNullFromJSON(json_object, 'value')
    this._label_visible = getBooleanFromJSON(json_object, 'label_visible', this._label_visible)
    const flux_taggs_dict = (this.parent.link?.drawing_area.sankey.flux_taggs_dict ?? {})
    Object.entries((json_object['tags'] ?? {}) as { [_: string]: string })
      .forEach(([tagg_id, tag_id]) => {
        const tagg = flux_taggs_dict[tagg_id]
        const tag = tagg?.tags_dict[tag_id]
        if (tag) (tag as Class_Tag).addReference(this)
      })
  }

  // PUBLIC METHODS =====================================================================
  public draw() { this.parent.draw() }

  public hasGivenTag(tag: Class_Tag) { return this._tags.includes(tag) }

  /**
   * Ajoute un tag à la coordonnée. Contrainte du modèle : au plus un tag par
   * groupe — un tag existant du même groupe est remplacé.
   */
  public addTag(tag: Class_Tag) {
    // SA#553 - le port de l'etiquette generee se calcule, il ne s'affecte pas
    // SA#580 - ni celui d'une etiquette d'un groupe attribue par regles
    if (tag?.is_untagged || tag?.group?.is_rule_based) return
    if (!this.hasGivenTag(tag)) {
      this._tags
        .filter(t => t.group === tag.group)
        .forEach(t => t.removeReference(this))
      this._tags.push(tag)
      tag.addReference(this)
      this.draw()
    }
  }

  public removeTag(tag: Class_Tag) {
    if (this.hasGivenTag(tag)) {
      this._tags.splice(this._tags.indexOf(tag), 1)
      tag.removeReference(this)
      this.draw()
    }
  }

  public getTagForGroup(tagg: Class_TagGroup): Class_Tag | undefined {
    return this._tags.find(tag => tag.group === tagg)
  }

  // GETTERS / SETTERS ==================================================================
  public get id() { return this._id }

  public get value(): number | null { return this._value }
  public set value(_: number | null) { this._value = _ }

  public get label_visible(): boolean { return this._label_visible }
  public set label_visible(_: boolean) { this._label_visible = _ }

  public get tags_list(): Class_Tag[] { return [...this._tags] }
}

// CLASS LINK VALUE *********************************************************************
/**
 * Value object for link flux.
 * Holds data/result/target/min/max scalars for a single flux.
 *
 * @export
 * @class Class_LinkValue
 * @extends {Class_ElementValue}
 */
export class Class_LinkValue extends Class_ElementValue {

  // Vector indices for links: 0 = source, 1 = target
  static readonly SRC = 0
  static readonly TGT = 1

  // LINK-SPECIFIC ATTRIBUTES ===========================================================
  private _ratio_unit_tag: Class_DataTag | null
  // Free-text metadata of the data row (Données sheet "Source" / "URL" / "Hypothèse" columns).
  private _data_source: string | null = null
  private _data_url: string | null = null
  private _data_hypothesis: string | null = null
  // #426 — index de l'explication de CETTE cellule dans le catalogue du
  // diagramme. Écrit uniquement quand il diffère de celui du flux, qui couvre
  // déjà les combinaisons d'étiquettes qui répondent la même chose.
  // Volontairement absent de `copyFrom` : un flux dupliqué est un autre flux,
  // que le solveur n'a jamais vu — il ne doit hériter d'aucune explication.
  private _determination: number | null = null
  // SA#578 — incertitude de la valeur calculée, posée par le calcul du bilan :
  // relative en % (comme data_uncertainty) et absolue, à 2σ, ou « infini » pour
  // une valeur que rien ne borne. `_result_uncertainty_bound` vaut « reached »
  // ou « near » quand la valeur touche une borne ou en est proche. Réécrites
  // telles quelles — le front ne les calcule pas — et, comme l'explication,
  // absentes de `copyFrom`.
  private _result_uncertainty: number | string | null = null
  private _result_uncertainty_abs: number | string | null = null
  private _result_uncertainty_bound: string | null = null

  public get ratio_unit_tag() { return this._ratio_unit_tag }
  public set ratio_unit_tag(_) { this._ratio_unit_tag = _ }

  // #426 — voir _determination.
  public get determination() { return this._determination }
  public set determination(_: number | null) { this._determination = _ }

  // SA#578 — voir _result_uncertainty.
  public get result_uncertainty() { return this._result_uncertainty }
  public get result_uncertainty_abs() { return this._result_uncertainty_abs }
  public get result_uncertainty_bound() { return this._result_uncertainty_bound }

  /**
   * SA#580 - grandeurs des groupes attribues par regles. Incertitude relative calculee : le % du
   * calcul du bilan ; « infini » (rien ne borne la valeur) = `Infinity`, la tranche la moins fiable ;
   * aucune pour une valeur non calculee ou un flux nul (une incertitude relative n'y a pas de sens).
   */
  public override ruleQuantity(quantity: string): number | undefined {
    if (quantity !== RULE_QUANTITY_COMPUTED_RELATIVE_UNCERTAINTY) return undefined
    const uncertainty = this._result_uncertainty
    if (uncertainty === null || this._result_value[Class_LinkValue.SRC] === 0) return undefined
    if (typeof uncertainty === 'number') return uncertainty
    const parsed = Number(uncertainty)
    return (uncertainty.trim() !== '' && Number.isFinite(parsed)) ? parsed : Number.POSITIVE_INFINITY
  }

  public get data_source() { return this._data_source }
  public set data_source(_: string | null) { this._data_source = _ }
  public get data_url() { return this._data_url }
  public set data_url(_: string | null) { this._data_url = _ }
  public get data_hypothesis() { return this._data_hypothesis }
  public set data_hypothesis(_: string | null) { this._data_hypothesis = _ }

  public value_option: ValueOptionType = 'value'

  protected get vectorSize() { return 2 }

  // CONSTRUCTOR ========================================================================
  constructor(parent: Class_ElementValueTree | ValueParentElement) {
    super(parent)
    this._ratio_unit_tag = null
  }

  // OVERRIDES ==========================================================================
  public override get is_blank(): boolean {
    return super.is_blank && this.value_option === 'value' && this._ratio_unit_tag === null &&
      this._data_source === null && this._data_url === null && this._data_hypothesis === null &&
      this._determination === null && this._result_uncertainty === null &&
      this._result_uncertainty_abs === null && this._result_uncertainty_bound === null
  }

  public get has_result() {
    return this._result_value[Class_LinkValue.SRC] !== null || (this.value_option != 'value' && this.value_option != 'intervals')
  }

  public get has_intervals() {
    // #208 — un flux libre dont les contraintes figent min == max est déterminé,
    // pas un intervalle : il ne doit donc pas être traité comme indéterminé
    // (sinon linkIsStructure le force en "structure" et il apparaît comme flux
    // nul/indéterminé au lieu d'afficher sa valeur réconciliée result_value).
    const mn = this._result_min[Class_LinkValue.SRC]
    const mx = this._result_max[Class_LinkValue.SRC]
    if (mn === null || mx === null) return false
    return mn !== mx
  }

  public get has_data() {
    return this._data_value[Class_LinkValue.SRC] !== null || this._data_min[Class_LinkValue.SRC] !== null || (this.value_option != 'value' && this.value_option != 'intervals')
  }

  // Valeur collectée SAISIE uniquement (donnée mesurée ou borne min) — exclut les
  // flux définis seulement par ratio/% (contrairement à has_data ci-dessus).
  public get has_collected_data(): boolean {
    return this._data_value[Class_LinkValue.SRC] !== null || this._data_min[Class_LinkValue.SRC] !== null
  }

  public set_only_data() {
    this._data_value[Class_LinkValue.SRC] = this._result_value[Class_LinkValue.SRC]
    this._result_value[Class_LinkValue.SRC] = null
  }

  // FLUX ACCESSORS (source = index 0) ==================================================
  public get valueResult(): number | null {
    if (this._result_value[Class_LinkValue.SRC] != undefined) {
      return this._result_value[Class_LinkValue.SRC]
    }
    if (this._data_value[Class_LinkValue.SRC] == null) {
      return null
    }
    return null
  }

  public set valueResult(_) {
    this._result_value[Class_LinkValue.SRC] = _
  }

  public get valueData() {
    return this._data_value[Class_LinkValue.SRC]
  }

  public set valueData(_) {
    this._data_value[Class_LinkValue.SRC] = _
    this._result_value[Class_LinkValue.SRC] = null
  }

  /**
   * os#1511 — LA COUCHE LUE : la donnée saisie si `collected`, sinon le résultat réconcilié, à
   * défaut la donnée quand elle est une valeur ou un intervalle saisi. La seule lecture de couche
   * du flux (cf. `Class_LinkElement.readLayer`, qui sait laquelle le dessin montre).
   */
  public readLayer(collected: boolean): number | null {
    if (collected) return this.valueData ?? null
    return this.valueResult ??
      ((this.value_option === 'value' || this.value_option === 'intervals') ? this.valueData : null) ?? null
  }

  // Target (destination) value = index 1
  public get valueResultTarget() {
    return this._result_value[Class_LinkValue.TGT]
  }

  public set valueResultTarget(_) {
    this._result_value[Class_LinkValue.TGT] = _
  }

  public get valueDataTarget() {
    return this._data_value[Class_LinkValue.TGT]
  }

  public set valueDataTarget(_) {
    this._data_value[Class_LinkValue.TGT] = _
    this._result_value[Class_LinkValue.TGT] = null
  }

  // Min/Max/Uncertainty accessors (source = index 0)
  public get data_min() { return this._data_min[Class_LinkValue.SRC] }
  public set data_min(_: number | null) { this._data_min[Class_LinkValue.SRC] = _ }
  public get data_max() { return this._data_max[Class_LinkValue.SRC] }
  public set data_max(_: number | null) { this._data_max[Class_LinkValue.SRC] = _ }
  public get data_uncertainty() { return this._data_uncertainty[Class_LinkValue.SRC] }
  public set data_uncertainty(_: number | null) { this._data_uncertainty[Class_LinkValue.SRC] = _ }

  public get result_min() { return this._result_min[Class_LinkValue.SRC] }
  public set result_min(_: number | null) { this._result_min[Class_LinkValue.SRC] = _ }
  public get result_max() { return this._result_max[Class_LinkValue.SRC] }
  public set result_max(_: number | null) { this._result_max[Class_LinkValue.SRC] = _ }

  // COPY METHODS =======================================================================
  public copyFrom(element: Class_ElementValue) {
    if (element instanceof Class_LinkValue) {
      this.value_option = element.value_option
      this.ratio_unit_tag = element.ratio_unit_tag
      this.data_source = element.data_source
      this.data_url = element.data_url
      this.data_hypothesis = element.data_hypothesis
    }
    // Copy vectors via base class
    super.copyFrom(element)
  }

  public addFrom(element: Class_ElementValue) {
    if (!(element instanceof Class_LinkValue)) return
    if (element.value_option=='%PS' || element.value_option=='%PD' ) {
      this.value_option = element.value_option
      this._data_value[Class_LinkValue.SRC] = element.valueData
    }
    this._data_value[Class_LinkValue.SRC] = element.valueData === null ? null : (this._data_value[Class_LinkValue.SRC] ?? 0) + element.valueData!
    this._result_value[Class_LinkValue.SRC] = element.valueResult === null ? null : (this._result_value[Class_LinkValue.SRC] ?? 0) + element.valueResult!
    if (element.valueDataTarget !== null) {
      this._data_value[Class_LinkValue.TGT] = (this._data_value[Class_LinkValue.TGT] ?? 0) + element.valueDataTarget
    }
    if (element.valueResultTarget !== null) {
      this._result_value[Class_LinkValue.TGT] = (this._result_value[Class_LinkValue.TGT] ?? 0) + element.valueResultTarget
    }
  }

  // SERIALIZATION ======================================================================
  /**
   * §3.0ter — valeur que doit voir le solveur (champ scalaire historique) :
   * quand le flux est ventilé par des groupes PORTEURS, c'est la valeur du
   * TAG SÉLECTIONNÉ (le scalaire interne n'est qu'un cache) ; null sinon
   * (le scalaire fait foi).
   */
  private solverDataValue(): number | null {
    const sankey = this.link?.drawing_area.sankey
    if (!sankey) return null
    const carrying = sankey.flux_taggs_list.filter(tagg => tagg.carries_values)
    if (carrying.length === 0) return null
    const tvs = this.tagged_values_list.filter(tv => tv.value !== null)
    if (tvs.length === 0) return null
    const match = tvs.find(tv =>
      carrying.every(tagg => {
        const mine = tv.getTagForGroup(tagg)
        return !mine || mine.is_selected
      }) && carrying.some(tagg => tv.getTagForGroup(tagg)))
    return match?.value ?? this._data_value[Class_LinkValue.SRC] ?? tvs[0].value
  }

  public toJSON(_kwargs?: Type_JSON) {
    const json_object = super.toJSON(_kwargs)
    // Source values (index 0) — §3.0ter : le scalaire sérialisé est la valeur
    // du tag sélectionné quand le flux est ventilé (cf. solverDataValue)
    const solver_value = this.solverDataValue()
    if (solver_value !== null) json_object['data_value'] = solver_value
    else if (this._data_value[Class_LinkValue.SRC] != null) json_object['data_value'] = this._data_value[Class_LinkValue.SRC] as number
    if (this._data_min[Class_LinkValue.SRC] != null) json_object['data_min'] = this._data_min[Class_LinkValue.SRC] as number
    if (this._data_max[Class_LinkValue.SRC] != null) json_object['data_max'] = this._data_max[Class_LinkValue.SRC] as number
    if (this._data_uncertainty[Class_LinkValue.SRC] != null) json_object['data_uncertainty'] = this._data_uncertainty[Class_LinkValue.SRC] as number

    if (this._result_value[Class_LinkValue.SRC] != null) json_object['result_value'] = this._result_value[Class_LinkValue.SRC] as number
    if (this._result_min[Class_LinkValue.SRC] != null) json_object['result_min'] = this._result_min[Class_LinkValue.SRC] as number
    if (this._result_max[Class_LinkValue.SRC] != null) json_object['result_max'] = this._result_max[Class_LinkValue.SRC] as number

    // Target values (index 1)
    if (this._data_value[Class_LinkValue.TGT] != null) json_object['data_value_target'] = this._data_value[Class_LinkValue.TGT] as number
    if (this._result_value[Class_LinkValue.TGT] != null) json_object['result_value_target'] = this._result_value[Class_LinkValue.TGT] as number

    if (this.text_value) json_object['text_value'] = this.text_value
    if (this.value_option !== 'value') json_object['value_option'] = this.value_option
    if (this._ratio_unit_tag) json_object['ratio_unit_tag'] = this._ratio_unit_tag.id
    if (this._data_source != null) json_object['data_source'] = this._data_source
    if (this._data_url != null) json_object['data_url'] = this._data_url
    if (this._data_hypothesis != null) json_object['data_hypothesis'] = this._data_hypothesis
    // #161 — preserve the structurally-absent marker on save.
    if (this.structurally_absent) json_object['structurally_absent'] = true
    // #426 — l'explication propre à cette cellule. Réécrite telle quelle : le
    // front ne la fabrique pas, il n'a pas la matrice de contraintes.
    if (this._determination !== null) json_object['determination'] = this._determination
    // SA#578 — incertitude calculée, même régime que l'explication.
    if (this._result_uncertainty !== null) json_object['result_uncertainty'] = this._result_uncertainty
    if (this._result_uncertainty_abs !== null) json_object['result_uncertainty_abs'] = this._result_uncertainty_abs
    if (this._result_uncertainty_bound !== null) {
      json_object['result_uncertainty_bound'] = this._result_uncertainty_bound
    }
    // SA#487 — « min » / « max » demandé sur cette cellule, et son rang.
    if (this.value_objective !== null) json_object['data_value_objective'] = this.value_objective
    if (this.value_objective_rank !== null) {
      json_object['data_value_objective_rank'] = this.value_objective_rank
    }
    // SA#507 — la cible visée, même régime.
    if (this.value_objective_target !== null) {
      json_object['data_value_objective_target'] = this.value_objective_target
    }
    return json_object
  }

  private fromJSONLegacy(json_object: Type_JSON) {
    const json_extension_object = getJSONOrUndefinedFromJSON(json_object, 'extension')
    if (json_extension_object) {
      this._data_value[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_extension_object, 'data_value')
      this._result_value[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'value')
      this.text_value = getStringOrNullFromJSON(json_object, 'display_value')
      if (json_extension_object['free_mini'] != undefined) {
        this._result_min[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_extension_object, 'free_mini')
      }
      if (json_extension_object['free_maxi'] != undefined) {
        this._result_max[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_extension_object, 'free_maxi')
      }
    } else {
      this._result_value[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'value')
      this.text_value = getStringOrNullFromJSON(json_object, 'display_value')
    }
  }

  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; } = {},
    matching_tags_id: { [_: string]: { [_: string]: string; }; } = {}
  ) {
    super.fromJSON(json_object, matching_taggs_id, matching_tags_id)
    // #161 — the flux does not exist for this dataTag (pruned by the
    // no-propagation option). Absent in legacy files -> defaults to false.
    this.structurally_absent = getBooleanFromJSON(json_object, 'structurally_absent', false)
    // #426 — explication propre à la cellule ; absente d'un fichier antérieur
    // ou d'une cellule qui répond comme son flux (cf. Class_LinkElement).
    this._determination = getNumberOrNullFromJSON(json_object, 'determination')
    // SA#578 — absente d'un fichier antérieur ou d'une valeur non calculée.
    this._result_uncertainty = getUncertaintyOrNullFromJSON(json_object, 'result_uncertainty')
    this._result_uncertainty_abs = getUncertaintyOrNullFromJSON(json_object, 'result_uncertainty_abs')
    this._result_uncertainty_bound = getStringOrNullFromJSON(json_object, 'result_uncertainty_bound')
    // SA#487 — absent des fichiers antérieurs : la cellule n'exprime alors
    // aucune intention, et rien ne change.
    this.value_objective = getStringOrNullFromJSON(json_object, 'data_value_objective')
    this.value_objective_rank = getNumberOrNullFromJSON(json_object, 'data_value_objective_rank')
    // SA#507 — absente des fichiers antérieurs, et d'une intention qui dit une
    // direction (« la plus petite ») plutôt qu'une cible.
    this.value_objective_target = getNumberOrNullFromJSON(
      json_object, 'data_value_objective_target')
    if (Object.prototype.hasOwnProperty.call(json_object, 'value')) {
      this.fromJSONLegacy(json_object)
    }
    else {
      this._data_value[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'data_value')
      this._data_max[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'data_max')
      this._data_min[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'data_min')
      this._data_uncertainty[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'data_uncertainty')

      this._result_value[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'result_value')
      this._result_max[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'result_max')
      this._result_min[Class_LinkValue.SRC] = getNumberOrNullFromJSON(json_object, 'result_min')

      this._data_value[Class_LinkValue.TGT] = getNumberOrNullFromJSON(json_object, 'data_value_target')
      this._result_value[Class_LinkValue.TGT] = getNumberOrNullFromJSON(json_object, 'result_value_target')

      this._data_source = getStringOrNullFromJSON(json_object, 'data_source')
      this._data_url = getStringOrNullFromJSON(json_object, 'data_url')
      this._data_hypothesis = getStringOrNullFromJSON(json_object, 'data_hypothesis')

      this.text_value = getStringFromJSON(json_object, 'text_value', this.text_value!)
      this.value_option = getStringFromJSON(json_object, 'value_option', 'value') as ValueOptionType
      const { data_taggs_list } = this.link?.sankey ?? { data_taggs_list: [] }
      const unit_data_tagg = data_taggs_list.find(tagg => tagg.is_unit)
      this.ratio_unit_tag = (unit_data_tagg?.tags_dict[getStringFromJSON(json_object, 'ratio_unit_tag', '')] ?? null)
    }
  }

  // PUBLIC METHODS =====================================================================
  public getMaxValue() {
    return Math.max(this._data_value[Class_LinkValue.SRC] ?? 0, this._result_value[Class_LinkValue.SRC] ?? 0)
  }
}


// CLASS STOCK VALUE ********************************************************************
/**
 * Value object for node stocks.
 * Holds initial and variation data/result (vector of size 2).
 *
 * @export
 * @class Class_StockValue
 * @extends {Class_ElementValue}
 */
export class Class_StockValue extends Class_ElementValue {

  // Vector indices for stocks: 0 = initial, 1 = variation
  static readonly INI = 0
  static readonly VAR = 1

  protected get vectorSize() { return 2 }

  // CONSTRUCTOR ========================================================================
  constructor(parent: Class_ElementValueTree | ValueParentElement) {
    super(parent)
  }

  // OVERRIDES ==========================================================================
  public get has_result(): boolean {
    return this._result_value[Class_StockValue.INI] !== null || this._result_value[Class_StockValue.VAR] !== null
  }

  public get has_intervals(): boolean {
    return false
  }

  public get has_data(): boolean {
    return this._data_value[Class_StockValue.INI] !== null || this._data_value[Class_StockValue.VAR] !== null
  }

  public set_only_data() {
    this._data_value[Class_StockValue.INI] = this._result_value[Class_StockValue.INI]
    this._result_value[Class_StockValue.INI] = null
    this._data_value[Class_StockValue.VAR] = this._result_value[Class_StockValue.VAR]
    this._result_value[Class_StockValue.VAR] = null
  }

  // STOCK ACCESSORS ====================================================================
  public get stockInitialData() { return this._data_value[Class_StockValue.INI] }
  public set stockInitialData(_: number | null) { this._data_value[Class_StockValue.INI] = _ }
  public get stockInitialResult() { return this._result_value[Class_StockValue.INI] }
  public set stockInitialResult(_: number | null) { this._result_value[Class_StockValue.INI] = _ }

  public get stockVariationData() { return this._data_value[Class_StockValue.VAR] }
  public set stockVariationData(_: number | null) { this._data_value[Class_StockValue.VAR] = _ }
  public get stockVariationResult() { return this._result_value[Class_StockValue.VAR] }
  public set stockVariationResult(_: number | null) { this._result_value[Class_StockValue.VAR] = _ }

  public get has_stock_data(): boolean {
    return this._data_value[Class_StockValue.INI] !== null || this._data_value[Class_StockValue.VAR] !== null
  }

  // COPY METHODS =======================================================================
  public copyFrom(element: Class_ElementValue) {
    super.copyFrom(element)
  }

  public addFrom(element: Class_ElementValue) {
    if (!(element instanceof Class_StockValue)) return
    for (const i of [Class_StockValue.INI, Class_StockValue.VAR]) {
      if (element._data_value[i] !== null)
        this._data_value[i] = (this._data_value[i] ?? 0) + element._data_value[i]!
      if (element._result_value[i] !== null)
        this._result_value[i] = (this._result_value[i] ?? 0) + element._result_value[i]!
    }
  }

  // SERIALIZATION ======================================================================
  public toJSON(_kwargs?: Type_JSON) {
    const json_object = super.toJSON(_kwargs)
    if (this._data_value[Class_StockValue.INI] != null) json_object['initial_stock'] = this._data_value[Class_StockValue.INI] as number
    if (this._result_value[Class_StockValue.INI] != null) json_object['initial_stock_result'] = this._result_value[Class_StockValue.INI] as number
    if (this._data_value[Class_StockValue.VAR] != null) json_object['stock_variation'] = this._data_value[Class_StockValue.VAR] as number
    if (this._result_value[Class_StockValue.VAR] != null) json_object['stock_variation_result'] = this._result_value[Class_StockValue.VAR] as number
    return json_object
  }

  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; } = {},
    matching_tags_id: { [_: string]: { [_: string]: string; }; } = {}
  ) {
    super.fromJSON(json_object, matching_taggs_id, matching_tags_id)
    this._data_value[Class_StockValue.INI] = getNumberOrNullFromJSON(json_object, 'initial_stock')
    this._result_value[Class_StockValue.INI] = getNumberOrNullFromJSON(json_object, 'initial_stock_result')
    this._data_value[Class_StockValue.VAR] = getNumberOrNullFromJSON(json_object, 'stock_variation')
    this._result_value[Class_StockValue.VAR] = getNumberOrNullFromJSON(json_object, 'stock_variation_result')
  }

  // PUBLIC METHODS =====================================================================
  public getMaxValue() {
    const ini_d = this._data_value[Class_StockValue.INI] ?? 0
    const ini_r = this._result_value[Class_StockValue.INI] ?? 0
    const var_d = this._data_value[Class_StockValue.VAR] ?? 0
    const var_r = this._result_value[Class_StockValue.VAR] ?? 0
    return Math.max(ini_d, ini_r, ini_d + var_d, ini_r + var_r)
  }
}
