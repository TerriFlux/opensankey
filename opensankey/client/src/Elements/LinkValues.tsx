import type { Class_DataTag, Class_Tag } from '../types/Tag'
import type { Class_DataTagGroup, Class_TagGroup } from '../types/TagGroup'
import { Type_JSON, makeId, getNumberOrNullFromJSON, getStringOrNullFromJSON, getStringFromJSON, getJSONOrUndefinedFromJSON } from '../types/Utils'
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

export const unit_constants = ['unit_name', 'unit_tag', 'other_unit_tag', ...value_option_percent_constants, 'unit_ratio','normalized'] as const
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

  public getValueForDataTags(data_tags: Class_DataTag[]): Class_ElementValue | null {
    if (data_tags.length === 0) return null
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    if (matching_tags.length !== 1) return null
    const child = this.children[matching_tags[0].id]
    if (child !== undefined) {
      if (child instanceof Class_ElementValue) return child
      else return child.getValueForDataTags(remaining_tags)
    }
    else {
      return null
    }
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
    return this._flux_tags.includes(tag)
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

  public get has_result(): boolean { return false }
  public get has_intervals(): boolean { return false }
  public get has_data(): boolean { return false }
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

  public get ratio_unit_tag() { return this._ratio_unit_tag }
  public set ratio_unit_tag(_) { this._ratio_unit_tag = _ }

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
  public toJSON(_kwargs?: Type_JSON) {
    const json_object = super.toJSON(_kwargs)
    // Source values (index 0)
    if (this._data_value[Class_LinkValue.SRC] != null) json_object['data_value'] = this._data_value[Class_LinkValue.SRC] as number
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
