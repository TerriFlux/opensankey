import type { Class_DataTag, Class_Tag } from '../types/Tag'
import type { Class_DataTagGroup, Class_TagGroup } from '../types/TagGroup'
import { Type_JSON, makeId, getNumberOrNullFromJSON, getStringOrNullFromJSON, getStringFromJSON, getJSONOrUndefinedFromJSON } from '../types/Utils'
import { Class_LinkElement } from './Link'

// CLASS LINK TREE VALUE ****************************************************************
/**
 * Define a node for value
 * @export
 * @class Class_LinkValueTree
 * @implements {TreeNodeInterface}
 */

export class Class_LinkValueTree {

  // PUBLIC ATTRIBUTES ==================================================================
  public parent: Class_LinkValueTree | Class_LinkElement
  public children: { [tag_id: string]: Class_LinkValue; } | { [tag_id: string]: Class_LinkValueTree; }

  public data_tag_group: Class_DataTagGroup

  public unit_data_tag(child: Class_LinkValueTree | Class_LinkValue): Class_DataTag | undefined {
    if (this.data_tag_group.is_unit) return this.data_tag_group.tags_dict[this.getDataTagIdFromChild(child) as string]
    if (this.parent instanceof Class_LinkValueTree) {
      return this.parent.unit_data_tag(this)
    }
    return undefined
  }

  // PRIVATE ATTRIBUTES =================================================================
  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_LinkValueTree.
   * @param {(Class_LinkValueTree | Class_LinkElement)} parent
   * @param {Class_DataTagGroup} tag_group
   * @memberof Class_LinkValueTree
   */
  constructor(
    parent: Class_LinkValueTree | Class_LinkElement,
    data_tag_group: Class_DataTagGroup
  ) {
    // Instanciate parent
    this.parent = parent
    // Instanciate taggroup
    this.data_tag_group = data_tag_group
    // Instanciate children
    this.children = {}
    data_tag_group.tags_list.forEach(tag => {
      this.children[tag.id] = this.createLinkValue(this)
    })
  }

  protected createLinkValue(_: Class_LinkValueTree | Class_LinkElement): Class_LinkValue {
    if (this.parent instanceof Class_LinkValueTree) {
      return this.parent.createLinkValue(_)
    }
    return (this.parent as Class_LinkElement).createLinkValue(_)
  }

  // CLEANING METHODS ====================================================================
  /**
   * Define deletion behavior
   * - Remove self from parent
   * - Delete childrens
   * @memberof Class_LinkValueTree
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Delete children
      Object.keys(this.children)
        .forEach(id => {
          this.children[id].delete()
        })
      this.children = {}
      // Unref from parent
      if (this.parent instanceof Class_LinkValueTree)
        this.parent.removeChild(this)
      // // Unref taggroup
      // this.data_tag_group = null
    }
  }

  // COPY METHODS =======================================================================
  public copyFrom(element: Class_LinkValueTree) {
    // Check types of children
    const [allValues, allTrees] = element.kindOfChildren()
    // Clean children
    Object.values(this.children)
      .forEach(child => child.delete())
    // Copy children recursively
    Object.keys(element.children)
      .forEach(tag_id => {
        const child_to_copy = element.children[tag_id]
        if ((child_to_copy instanceof Class_LinkValueTree) && (allTrees)) {
          const new_child = new Class_LinkValueTree(
            this,
            this.link?.sankey.data_taggs_dict[child_to_copy.data_tag_group.id] as Class_DataTagGroup ?? child_to_copy.data_tag_group) // Fallback should never happen !!
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_LinkValue) && allValues) {
          const new_child = this.createLinkValue(this)
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

  public addFrom(element: Class_LinkValueTree) {
    // Check types of children
    const [allValues, allTrees] = element.kindOfChildren()
    // Copy children recursively
    Object.keys(element.children)
      .forEach(tag_id => {
        const child_to_copy = element.children[tag_id]
        if ((child_to_copy instanceof Class_LinkValueTree) && (allTrees)) {
          (this.children[tag_id] as Class_LinkValueTree).addFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_LinkValue) && allValues) {
          (this.children[tag_id] as Class_LinkValue).addFrom(child_to_copy)
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
    // All parentality relations are sets via sankey struct with fromJSON + addDataTag
    // So it is not necessary to read datatag group -> it should be the same as in JSON
    // if (this.data_tag_group.id !== json_object['datatag_group'])
    //   console.error('Erreur lecture valeur dans JSON : datatag group are not matching')
    // else {
    Object.entries(json_object)
      .filter(([id,]) => id !== 'datatag_group') // Skip this entry in JSON
      .forEach(([id, sub_json_object]) => {
        if (typeof sub_json_object === 'object')
          this.children[id]?.fromJSON(
            sub_json_object as Type_JSON,
            matching_taggs_id,
            matching_tags_id
          )
      })
    //}
  }

  // PUBLIC METHODS =====================================================================
  /**
   * Add new children related to new tagGroup
   * Always add in the bottom of the tree
   * @param {Class_DataTagGroup} data_tag_group
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public expand(data_tag_group: Class_DataTagGroup) {
    if (this.data_tag_group !== data_tag_group) // Protection against tag group already present
      Object.keys(this.children)
        .forEach(id => {
          this.children[id] = this.children[id].expand(data_tag_group)
        })
    return this
  }

  /**
   * Remove all children related to given tag group
   * - Either prune bottom of tree (simple case)
   * - Or slice tree to keep sub-combinations of tags
   * @param {Class_DataTagGroup} data_tag_group
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public prune(data_tag_group: Class_DataTagGroup) {
    // If data_tag_group correspond to this tree's tag group - do the pruning process
    if (this.data_tag_group === data_tag_group) {
      // Keep parent ref in memory
      const parent = this.parent
      // Keep first child ref in memory
      const id = Object.keys(this.children)[0]
      const child = this.children[id]
      // Delete ref to first child
      delete this.children[id]
      // Re-attach tree together
      if (parent instanceof Class_LinkValueTree) {
        // When pruning this, first child is preserve because ref has been deleted from children table
        parent.removeAndReplaceChild(this, child)
        return parent
      }
      else {
        // Parent is LinkElement
        return child
      }
    }

    // If data_tag_group is different than the one used by
    else {
      // Recurse, only if children are also trees
      Object.keys(this.children)
        .forEach(id => {
          const child = this.children[id]
          if (child instanceof Class_LinkValueTree)
            child.prune(data_tag_group)
        })
      return this
    }
  }

  /**
   * Add new child from given data_tag
   * @param {Class_Tag} data_tag
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public extend(data_tag: Class_DataTag) {
    // What kind of children
    const [allValues, allTrees] = this.kindOfChildren()
    // Case 1 : Last node tree before values
    if (allValues && (!allTrees)) {
      // Tag must be from this tree's data_tag group
      if (data_tag.group === this.data_tag_group) {
        // If not already existing, create a new child // given data_tag
        if (!this.children[data_tag.id]) {
          const _ = this.createLinkValue(this)
          this.children[data_tag.id] = _
        }
        // Return child // given data_tag
        return this.children[data_tag.id]
      }
    }

    // Case 2 : Current children's are also tree
    else if ((!allValues) && allTrees) {
      // If data_tag's group correspond to this tree's data_tag group - add new child
      if (data_tag.group === this.data_tag_group) {
        // If not already existing, create a new child // given data_tag
        if (!this.children[data_tag.id]) {
          const ref_child = Object.values(this.children)[0] // Never undefined beacause of test on (!allValues && AllTrees)
          if (ref_child instanceof Class_LinkValueTree) {
            // Create and reference
            const _ = new Class_LinkValueTree(this, ref_child.data_tag_group)
            this.children[data_tag.id] = _
            // Recursivly copy values / sub-trees
            _.copyFrom(ref_child)
          }
        }
        // Return child // given data_tag
        return this.children[data_tag.id]
      }

      // Tag group is different than the one used
      else {
        // Go deeper recursivley
        let output: Class_LinkValue | Class_LinkValueTree | undefined = undefined
        Object.values(this.children)
          .forEach(child => {
            // Child can only be Class_LinkValueTree because of test on (!allValues && AllTrees)
            const _ = child.extend(data_tag)
            // Return something not undefined if possible
            if (_ && (!output)) output = _
          })
        return output
      }
    }
    return undefined
  }

  /**
   * Remove child related to given dataTag
   * @param {Class_Tag} data_tag
   * @memberof Class_LinkValueTree
   */
  public reduce(data_tag: Class_DataTag) {
    // Tag is from correct data_tag group
    if (data_tag.group === this.data_tag_group) {
      this.removeChildFromDataTagId(data_tag.id)
    }

    // Recursive call
    else {
      Object.values(this.children)
        .forEach(child => {
          if (child instanceof Class_LinkValueTree)
            child.reduce(data_tag)
        })
    }
  }

  /**
   * Remove given child from children (ie prune tree)
   * @private
   * @param {(Class_LinkValue | Class_LinkValueTree)} child
   * @memberof Class_LinkValueTree
   */
  public removeChild(child: Class_LinkValue | Class_LinkValueTree) {
    // Get child's id
    const id = this.getDataTagIdFromChild(child)
    // Remove it
    if (id) this.removeChildFromDataTagId(id)
  }

  public getValueForDataTags(data_tags: Class_DataTag[]): Class_LinkValue | null {
    // Failsafe
    if (data_tags.length === 0) return null
    // Get value recursively
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    // Failsafe
    if (matching_tags.length !== 1) return null
    // Recursive
    const child = this.children[matching_tags[0].id]
    if (child !== undefined) {
      if (child instanceof Class_LinkValue) return child
      else return child.getValueForDataTags(remaining_tags)
    }
    else {
      return null
    }
  }

  public setLinkValueForDataTags(data_tags: Class_DataTag[], val: Class_LinkValue) {
    // Failsafe
    if (data_tags.length === 0) return
    // Get value recursively
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    // Failsafe
    if (matching_tags.length !== 1) return null
    // Recursive
    const child = this.children[matching_tags[0].id]
    if (child == undefined) {
      this.children[matching_tags[0].id] = val
    }
    else {
      if (child instanceof Class_LinkValueTree)
        child.setLinkValueForDataTags(remaining_tags, val)
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
   * Find corresponding id for given child
   * @param {(Class_LinkValue | Class_LinkValueTree)} child
   * @memberof Class_LinkValueTree
   */
  public getDataTagIdFromChild(child: Class_LinkValue | Class_LinkValueTree): string | undefined {
    let id = undefined
    Object.keys(this.children)
      .forEach(tag_id => {
        if (this.children[tag_id] === child) {
          id = tag_id
        }
      })
    return id
  }

  /**
   * Return combinason of datatags if to reach given child
   * @param {(Class_LinkValue | Class_LinkValueTree)} child
   * @return {*}  {string[]}
   * @memberof Class_LinkValueTree
   */
  public getDataTagsIdCombination(child: Class_LinkValue | Class_LinkValueTree): string[] {
    const id = this.getDataTagIdFromChild(child)
    if (id) {
      if (this.parent instanceof Class_LinkValueTree) {
        const prev_id = this.parent.getDataTagsIdCombination(this)
        prev_id.push(id)
        return prev_id
      }
      else return [id]
    }
    return []
  }

  /**
   * Browse children & search for the maximum value among them
   *
   * @return {*}
   * @memberof Class_LinkValueTree
   */
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
    let out: { [_: string]: [Class_LinkValue, Class_DataTag[] | undefined]; } = {}
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
    let allLinkValue = true
    let allLinkValueTree = true
    Object.values(this.children)
      .forEach(child => {
        allLinkValue = allLinkValue && (child instanceof Class_LinkValue)
        allLinkValueTree = allLinkValueTree && (child instanceof Class_LinkValueTree)
      })
    return [allLinkValue, allLinkValueTree]
  }

  private removeAndReplaceChild(
    child: Class_LinkValue | Class_LinkValueTree,
    new_child: Class_LinkValue | Class_LinkValueTree
  ) {
    // Get current child id
    const id = this.getDataTagIdFromChild(child)
    // Delete current child
    if (id) {
      this.removeChildFromDataTagId(id)
      // Replace and update cross refs
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
  public get link(): Class_LinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent as Class_LinkElement
  }

  public get data_tag() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.data_tag_group.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null

    else
      return null
  }
}
export const value_option_percent_constants_source = ['%IS', '%OS','%PS']
export const value_option_percent_constants_target = ['%ID', '%OD','%PD']
export const value_option_percent_constants = [...value_option_percent_constants_source,...value_option_percent_constants_target]
export const value_option_constants = ['value', ...value_option_percent_constants, 'unit_ratio'] as const
export type ValueOptionType = typeof value_option_constants[number]
export const unit_constants = ['unit_name', 'unit_tag', 'other_unit_tag', ...value_option_percent_constants, 'unit_ratio','normalized'] as const
export type UnitType = typeof unit_constants[number]

// CLASS LINK VALUE *********************************************************************
/**
 * Define a link value object
 *
 * @export
 * @class Class_LinkValue
 */
export class Class_LinkValue {

  // PUBLIC ATTRIBUTES ==================================================================
  public parent: Class_LinkValueTree | Class_LinkElement

  public unit_data_tag() : Class_DataTag | undefined{
    if (this.parent instanceof Class_LinkValueTree) {
      return this.parent.unit_data_tag(this)
    }
    return undefined
  }
  
  private _ratio_unit_tag: Class_DataTag | null

  public get ratio_unit_tag() {return this._ratio_unit_tag}
  public set ratio_unit_tag(_) {this._ratio_unit_tag = _}

  public get has_result() {
    return this.result_value !== null || this.value_option != 'value'
  }

  public get has_intervals() {
    return this.result_max !== null || this.result_min!== null
  }

  public get has_data() {
    return this.data_value !== null || this.value_option != 'value'
  }
  public set_only_data() {
    this.data_value = this.result_value
    this.result_value = null
  }

  public get valueResult(): number | null {
    if (this.result_value != undefined) {
      return this.result_value
    }
    if (this.data_value == null) {
      return null
    }
    if (this.value_option == 'unit_ratio') {
      const ratio_unit_tag_value = this.link?.valueForTag(this._ratio_unit_tag!)
      if (ratio_unit_tag_value == this) return this.data_value
      return (ratio_unit_tag_value?.valueResult??ratio_unit_tag_value?.valueData??1) * this.data_value!
    } else if (this.value_option == '%IS') {
      const multiplier = this.data_value / 100
      if (this.parent == this.link) {
        let total_source = 0
        this.link!.source.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueCurrent ?? 0)
        return total_source * multiplier
      } /*else {
        const data_tags_id = this.data_tags_id
        const data_tags: Class_ProtoTag[] = []
        this.link?.sankey.data_taggs_list.forEach((tagg, i) => data_tags.push(tagg.tags_dict[data_tags_id[i]]))
        let total_source = 0
        this.link!.source.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueCurrent ?? 0)
        return total_source * multiplier
      }*/
    } else if (this.value_option == '%OS') {
      let total_target = 0
      let ok = true
      this.link!.source.output_links_list.filter(l => l != this.link && l.is_visible).forEach(l => {
        if (!l.valueCurrent) {
          ok = false
          return
        }
        total_target += l.valueCurrent
      })
      if (!ok || !total_target) return null
      return total_target * (this.data_value) / (100 - this.data_value)

    } else if (this.value_option == '%OD') {
      const multiplier = this.data_value / 100
      if (this.parent == this.link) {
        let total_target = 0
        this.link!.target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
        return total_target * multiplier
      } /*else {
        const data_tags_id = this.data_tags_id
        const data_tags: Class_ProtoTag[] = []
        this.link?.sankey.data_taggs_list.forEach((tagg, i) => data_tags.push(tagg.tags_dict[data_tags_id[i]]))
        let total_target = 0
        this.link!.target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
        return total_target * multiplier
      }*/
    } else if (this.value_option == '%ID') {
      let total_target = 0
      let ok = true
      this.link!.target.input_links_list.filter(l => l != this.link && l.is_visible).forEach(l => {
        if (!l.valueCurrent) {
          ok = false
          return
        }
        total_target += l.valueCurrent
      })
      if (!ok) return null
      return total_target * (this.data_value) / (100 - this.data_value)
    } else if (this.value_option == '%PS') {
      const multiplier = this.data_value / 100
      const parent_source = this.link!.source.dimensions_as_child[0].parent!
      const parent_link = parent_source.output_links_list.find(l=>l.target==this.link!.target)
      return parent_link?parent_link.valueCurrent!*multiplier : null
    } else if (this.value_option == '%PD') {
      const multiplier = this.data_value / 100
      const parent_target = this.link!.target.dimensions_as_child[0].parent!
      const parent_link = parent_target.output_links_list.find(l=>l.source==this.link!.source)
      return parent_link? parent_link.valueCurrent!*multiplier: null
    }
    return null
  }

  public set valueResult(_) {
    this.result_value = _
  }

  public get valueData() {
    return this.data_value
  }

  public set valueData(_) {
    this.data_value = _
    this.result_value = null
  }

  public value_option: ValueOptionType = 'value'

  protected data_value: number | null = null
  protected data_min: number | null = null
  protected data_max: number | null = null

  protected result_value: number | null = null
  public result_min: number | null = null
  public result_max: number | null = null

  public text_value: string | null = null


  // PRIVATE ATTRIBUTES ==================================================================
  /**
   * id of value
   */
  private _id: string

  /**
   * FluxTags
   * @private
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_LinkElement
   */
  private _flux_tags: Class_Tag[] = []

  // Sorted tag by group
  private _taggs_dict: { [x: string]: Class_Tag[]; } = {}

  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================
  constructor(parent: Class_LinkValueTree | Class_LinkElement) {
    // Parents / Children relations
    this.parent = parent
    // Id
    const name = (this.link?.id ?? '') + '_value_'
    this.data_tags_id
      .forEach(tag_id => name + '_' + tag_id)
    this._id = makeId(name)
    this._ratio_unit_tag = null
  }

  // CLEANING METHODS ===================================================================
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Unref from parent
      if (this.parent instanceof Class_LinkValueTree)
        this.parent.removeChild(this)
      // Remove reference of self in related tags
      this.flux_tags_list.forEach(tag => tag.removeReference(this))
      this._flux_tags = []
      this._taggs_dict = {}
    }
  }

  // COPY METHODS =======================================================================
  public copyFrom(element: Class_LinkValue) {
    this.data_value = element.data_value
    this.data_min = element.data_min
    this.data_max = element.data_max

    this.result_value = element.result_value
    this.result_min = element.result_min
    this.result_max = element.result_max

    this.text_value = element.text_value
    this.value_option = element.value_option
    this.ratio_unit_tag = element.ratio_unit_tag
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


  public addFrom(element: Class_LinkValue) {
    if (element.value_option=='%PS' || element.value_option=='%PD' ) {
      // TODO
      this.value_option = element.value_option
      this.data_value = element.data_value
    }
    this.data_value = element.valueData === null ? null : this.data_value! + element.valueData!
    this.result_value = element.valueResult === null ? null : this.result_value! + element.valueResult!
  }

  /**
   * Extract this link value as JSON
   *
   * @return {*}
   * @memberof Class_LinkValue
   */
  public toJSON() {
    // Init output JSON
    const json_object: Type_JSON = {}
    json_object['id'] = this._id
    // Fill data
    json_object['id'] = this._id
    if (this.data_value != null) json_object['data_value'] = this.data_value
    if (this.data_min != null) json_object['data_min'] = this.data_min
    if (this.data_max != null) json_object['data_max'] = this.data_max

    if (this.result_value != null) json_object['result_value'] = this.result_value
    // if (kwargs && kwargs['has_results'] && this.valueResult) {
    //   json_object['result_value'] = this.valueResult!
    // }
    if (this.result_min != null) json_object['result_min'] = this.result_min
    if (this.result_max != null) json_object['result_max'] = this.result_max

    if (this.text_value) json_object['text_value'] = this.text_value
    if (this.value_option !== 'value') json_object['value_option'] = this.value_option
    if (this._ratio_unit_tag) json_object['ratio_unit_tag'] = this._ratio_unit_tag.id
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
    // Output
    return json_object
  }

  private fromJSONLegacy(json_object: Type_JSON) {
    const json_extension_object = getJSONOrUndefinedFromJSON(json_object, 'extension')
    if (json_extension_object) {
      this.data_value = getNumberOrNullFromJSON(json_extension_object, 'data_value')
      this.result_value = getNumberOrNullFromJSON(json_object, 'value')
      if (json_extension_object['free_mini'] != undefined) {
        this.result_min = getNumberOrNullFromJSON(json_extension_object, 'free_mini')
      }
      if (json_extension_object['free_maxi'] != undefined) {
        this.result_max = getNumberOrNullFromJSON(json_extension_object, 'free_maxi')
      }
    } else {
      this.result_value = getNumberOrNullFromJSON(json_object, 'value')
      this.text_value = getStringOrNullFromJSON(json_object, 'display_value')
    }
  }

  /**
   * Read this link value from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_LinkValue
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string; } = {},
    _matching_tags_id: { [_: string]: { [_: string]: string; }; } = {}
  ) {
    this._id = getStringFromJSON(json_object, 'id', this._id)
    // Update attributes
    if (Object.prototype.hasOwnProperty.call(json_object, 'value')) { // Value key => Legacy JSON
      this.fromJSONLegacy(json_object)
    }
    else {
      this.data_value = getNumberOrNullFromJSON(json_object, 'data_value')
      this.data_max = getNumberOrNullFromJSON(json_object, 'data_max')
      this.data_min = getNumberOrNullFromJSON(json_object, 'data_min')

      this.result_value = getNumberOrNullFromJSON(json_object, 'result_value')
      this.result_max = getNumberOrNullFromJSON(json_object, 'result_max')
      this.result_min = getNumberOrNullFromJSON(json_object, 'result_min')

      this.text_value = getStringFromJSON(json_object, 'text_value',this.text_value!)
      this.value_option = getStringFromJSON(json_object, 'value_option', 'value') as ValueOptionType
      const { data_taggs_list } = this.link?.sankey ?? { data_taggs_list: [] }
      const unit_data_tagg = data_taggs_list.find(tagg => tagg.is_unit)
      this.ratio_unit_tag = (unit_data_tagg?.tags_dict[getStringFromJSON(json_object, 'ratio_unit_tag', '')] ?? null)
    }
    // Get Flux tags
    // In JSON here are how supposed tags var is :
    // tags: {key_grp_tag: [key_tag, ...] }
    // where 'key_grp_tag' represent the id of a flux tag group
    // &  '[key_tag, ...]' represent the array of id of tag selected
    // for that flux tag group
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
    const new_parent = new Class_LinkValueTree(this.parent, data_tag_group)
    // Copy values from child in grandchildren
    data_tag_group.tags_list.forEach(tag => {
      const _ = new_parent.extend(tag)
      if (_ instanceof Class_LinkValue) // Should always be the case here, but needed
        _.copyFrom(this)
    })
    // Clean self
    this.delete()
    // Return new parent
    return new_parent
  }

  /**
   * Check if given flux tag is referenced by value
   * @param {Class_Tag} tag
   * @return {*}
   * @memberof Class_LinkElement
   */
  public hasGivenTag(tag: Class_Tag) {
    return this._flux_tags.includes(tag)
  }

  /**
   * Add and cross-reference a Flux tag with this value
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public addTag(tag: Class_Tag) {
    if (!this.hasGivenTag(tag)) {
      this._flux_tags.push(tag)
      this.addTagToGroupTagDict(tag)
      tag.addReference(this)
      this.draw()
    }
  }

  /**
   * Remove given tag and cross-reference from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    if (this.hasGivenTag(tag)) {
      const idx = this._flux_tags.indexOf(tag)
      this._flux_tags.splice(idx, 1)
      this.removeTagToGroupTagDict(tag)
      tag.removeReference(this)
      this.draw()
    }
  }

  /**
   * Function that can be used instead of the one in Class_linkValueTree so the recursive function stop & return a value
   *
   * @return {*}
   * @memberof Class_LinkValue
   */
  public getMaxValue() {
    return Math.max(this.data_value ?? 0, this.result_value ?? 0)
  }

  public getAllValues() {
    const tmp: { [_: string]: [Class_LinkValue, Class_DataTag[] | undefined]; } = {}
    if (this.data_tag)
      tmp[this.id] = [this, [this.data_tag]]

    else
      tmp[this.id] = [this, undefined]
    return tmp
  }

  // PRIVATE ===================================================
  /**
   * Add tag to dict of tag sorted by group
   *
   * @private
   * @param {Class_Tag} tag
   * @memberof Class_LinkValue
   */
  private addTagToGroupTagDict(tag: Class_Tag) {
    const grp_id = tag.group.id
    if (grp_id in this._taggs_dict) {
      if (!(this._taggs_dict[grp_id].includes(tag)))
        this._taggs_dict[grp_id].push(tag)
    } else {
      this._taggs_dict[grp_id] = [tag]
    }
  }

  /**
   * Remove tag from dict of tag sorted by group
   *
   * @private
   * @param {Class_Tag} tag
   * @memberof Class_LinkValue
   */
  private removeTagToGroupTagDict(tag: Class_Tag) {
    const grp_id = tag.group.id
    if (grp_id in this._taggs_dict) {
      const idx = this._taggs_dict[grp_id].indexOf(tag)
      this._taggs_dict[grp_id].splice(idx, 1)

      // After removing a tag check if the flow has other tag from the group,
      //  if not remove tag group entries from flow so are_related_flux_tags_selected don't take into account groupTag not linked to flow
      if (Object.values(this._taggs_dict[grp_id]).length == 0) {
        delete this._taggs_dict[grp_id]
      }
    }
  }

  // GETTERS / SETTERS ==================================================================
  /**
   * Id of value
   *
   * @readonly
   * @memberof Class_LinkValue
   */
  public get id() { return this._id }

  /**
   * Related link of value
   *
   * @readonly
   * @type {(Class_LinkElement | null)}
   * @memberof Class_LinkValue
   */
  public get link(): Class_LinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent
  }

  /**
   * Dict as [id: tag] of flux tags related to this value
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_tags_dict() {
    return this._flux_tags
  }

  /**
   * Array of flux tags related to this value
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_tags_list() {
    return Object.values(this._flux_tags)
  }

  /**
   * Dict as [id: tag group] of tag groups related to link
   * @readonly
   * @memberof Class_LinkElement
   */
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

  /**
   * Array of tag groups related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }

  public get data_tags_id() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.getDataTagsIdCombination(this)

    else
      return []
  }

  public get data_tagg() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.data_tag_group

    else
      return null
  }

  public get data_tag() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.data_tagg?.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null

    else
      return null
  }
}
