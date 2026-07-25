import type { Class_DataTag, Class_Tag } from '../types/Tag'
import type { Class_DataTagGroup, Class_TagGroup } from '../types/TagGroup'
import { Type_JSON, makeId, getNumberOrNullFromJSON, getStringOrNullFromJSON, getStringFromJSON, getBooleanFromJSON, getJSONOrUndefinedFromJSON } from '../types/Utils'
import type { Class_LinkElement } from './Link'
import type { Class_NodeElement } from './Node'

// Duck-typing helper to detect link parents without importing Class_LinkElement at runtime
// (avoids circular import: Node -> LinkValues -> Link -> Node)
function isLinkElement(o: unknown): o is Class_LinkElement {
  return o !== null && typeof o === 'object' && 'source' in (o as object) && 'target' in (o as object)
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
export const unit_constants = ['unit_name', 'unit_model', 'unit_tag', 'other_unit_tag', ...value_option_percent_constants, ...unit_stock_percent_constants, 'unit_ratio','normalized'] as const
export type UnitType = typeof unit_constants[number]

// CLASS ELEMENT VALUE TREE ************************************************************
/**
 * Generic tree node for organizing values by data tags.
 * Children are either all trees (inner nodes) or all values (leaves).
 * @export
 * @class Class_ElementValueTree
 */
export class Class_ElementValueTree {

  // PUBLIC ATTRIBUTES ==================================================================
  public parent: Class_ElementValueTree | ValueParentElement
  public children: { [tag_id: string]: Class_ElementValue; } | { [tag_id: string]: Class_ElementValueTree; }

  public data_tag_group: Class_DataTagGroup

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
  constructor(
    parent: Class_ElementValueTree | ValueParentElement,
    data_tag_group: Class_DataTagGroup
  ) {
    this.parent = parent
    this.data_tag_group = data_tag_group
    this.children = {}
    data_tag_group.tags_list.forEach(tag => {
      this.children[tag.id] = this.createValue(this)
    })
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
    let has_result = false
    Object.values(this.children)
      .forEach(child => {
        has_result = has_result || child.has_result
      })
    return has_result
  }

  public get has_intervals() {
    let has_intervals = false
    Object.values(this.children)
      .forEach(child => {
        has_intervals = has_intervals || child.has_intervals
      })
    return has_intervals
  }

  public get has_data() {
    let has_data = false
    Object.values(this.children)
      .forEach(child => {
        has_data = has_data || child.has_data
      })
    return has_data
  }

  public get has_collected_data(): boolean {
    return Object.values(this.children).some(child => child.has_collected_data)
  }

  public set_only_data() {
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
    Object.entries(this.children)
      .forEach(([id, child]) => {
        json_object[id] = child.toJSON(kwargs)
      })
    return json_object
  }

  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; } = {},
    matching_tags_id: { [_: string]: { [_: string]: string; }; } = {}
  ) {
    Object.entries(json_object)
      .filter(([id,]) => id !== 'datatag_group')
      .forEach(([id, sub_json_object]) => {
        if (typeof sub_json_object === 'object')
          this.children[id]?.fromJSON(
            sub_json_object as Type_JSON,
            matching_taggs_id,
            matching_tags_id
          )
      })
  }

  // PUBLIC METHODS =====================================================================
  public expand(data_tag_group: Class_DataTagGroup) {
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

  public getDataTagIdFromChild(child: Class_ElementValue | Class_ElementValueTree): string | undefined {
    let id = undefined
    Object.keys(this.children)
      .forEach(tag_id => {
        if (this.children[tag_id] === child) {
          id = tag_id
        }
      })
    return id
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

// CLASS ELEMENT VALUE (BASE) ***********************************************************
/**
 * Abstract base class for element values (link flux, stock, etc.).
 * Provides common infrastructure: parent chain, id, tags, tree operations.
 * Subclasses define their own value fields.
 *
 * @export
 * @class Class_ElementValue
 */
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
  private _id: string
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
    this._data_value = new Array(n).fill(null)
    this._data_min = new Array(n).fill(null)
    this._data_max = new Array(n).fill(null)
    this._data_uncertainty = new Array(n).fill(null)
    this._result_value = new Array(n).fill(null)
    this._result_min = new Array(n).fill(null)
    this._result_max = new Array(n).fill(null)
    const name = (this.link?.id ?? '') + '_value_'
    this.data_tags_id
      .forEach(tag_id => name + '_' + tag_id)
    this._id = makeId(name)
  }

  // CLEANING METHODS ===================================================================
  public delete() {
    if (!this._is_currently_deleted) {
      this._is_currently_deleted = true
      if (this.parent instanceof Class_ElementValueTree)
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
    json_object['id'] = this._id
    if (this.flux_taggs_list.length > 0) {
      json_object['tags'] = Object.fromEntries(
        this.flux_taggs_list
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
    this._id = getStringFromJSON(json_object, 'id', this._id)
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
    data_tag_group.tags_list.forEach(tag => {
      const _ = new_parent.extend(tag)
      if (_ instanceof Class_ElementValue)
        _.copyFrom(this)
    })
    this.delete()
    return new_parent
  }

  public hasGivenTag(tag: Class_Tag) {
    // #285 (fusion) — un tag peut être porté par le flux ENTIER (_flux_tags) ou,
    // sur un flux ventilé, par une de ses valeurs coordonnées. La légende et le
    // filtrage comptent l'usage via ce test : sans les tagged_values, un flux
    // fusionné (ex. import e!Sankey) ferait disparaître ses tags de la légende.
    return this._flux_tags.includes(tag) ||
      this._tagged_values.some(tv => tv.tags_list.includes(tag))
  }

  public addTag(tag: Class_Tag) {
    if (!this.hasGivenTag(tag)) {
      this._flux_tags.push(tag)
      this.addTagToGroupTagDict(tag)
      tag.addReference(this)
      this.draw()
    }
  }

  public removeTag(tag: Class_Tag) {
    if (this.hasGivenTag(tag)) {
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
  public get id() { return this._id }

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
    json_object['id'] = this._id
    if (this._value !== null) json_object['value'] = this._value
    if (this._label_visible) json_object['label_visible'] = true
    if (this._tags.length > 0)
      json_object['tags'] = Object.fromEntries(
        this._tags.map(tag => [tag.group.id, tag.id]))
    return json_object
  }

  public fromJSON(json_object: Type_JSON) {
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

  public get ratio_unit_tag() { return this._ratio_unit_tag }
  public set ratio_unit_tag(_) { this._ratio_unit_tag = _ }

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
