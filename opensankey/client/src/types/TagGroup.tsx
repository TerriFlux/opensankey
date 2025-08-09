import colormap from 'colormap'
import { Class_LinkElement } from '../Elements/Link'
import { Class_LinkValue } from '../Elements/LinkValues'
import { Class_NodeElement } from '../Elements/Node'
import { Class_Sankey } from './Sankey'
import { tag_banner_type, Class_ProtoTag, Class_Tag, Class_NodeTag, Class_FluxTag, Class_DataTag, Class_LevelTag } from './Tag'
import { Type_JSON, getStringFromJSON, getBooleanFromJSON, getStringListFromJSON } from './Utils'

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
  private _name: string

  // List of tags
  private _tag_count: number = 0

  // Type of banner
  private _banner: tag_banner_type = 'one'

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_TagGroup
   */
  private _is_currently_deleted = false

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
    this._name = name
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
      // Delete all tags properly
      Object.values(this._tags)
        .forEach(tag => {
          tag.delete()
        })
      this._tags = {}
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
    this._name = tagg_to_copy._name
    this._banner = tagg_to_copy._banner
    this._tag_count = tagg_to_copy._tag_count

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
    // Fill group attributes
    json_object['name'] = this._name
    json_object['banner'] = this._banner
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
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    // Read group attributes
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._banner = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
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
    this._name = getStringFromJSON(json_object, 'group_name', this._name)
  }

  // PUBLIC METHODS =====================================================================
  public addTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = this.createTag(name, id)
    this._tags[tag.id] = tag
    this._tag_count = this._tag_count + 1
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
    }
  }

  public selectTagsFromId(
    id: string
  ) {
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
      this.updateTagsReferences()
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToTags()
    }

    const old_selected = this.selected_tags_list[0].id
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
          tag.setSelected(false)
        }
        else {
          tag.setUnSelected(false)
        }
      })
    this.updateTagsReferences()
  }

  public abstract updateTagsReferences(): void;

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
  public get name(): string { return this._name }

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
  public abstract get tags_list(): Class_ProtoTag[];

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

  // SETTERS ============================================================================
  public set name(value: string) { this._name = value }
  public set banner(value: tag_banner_type) { this._banner = value }
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
  private _show_legend: boolean = false

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
    json_object['show_legend'] = this._show_legend
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._show_legend = getBooleanFromJSON(json_object, 'show_legend', this._show_legend)

  }

  protected _copyFrom(
    tagg_to_copy: Class_TagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    this._show_legend = tagg_to_copy.show_legend
  }

  // PUBLIC METHODS =====================================================================
  public updateTagsReferences(): void {
    const ref_updated: (Class_NodeElement | Class_LinkElement | Class_LinkValue)[] = []
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
    this._ref_sankey.drawing_area.checkAndUpdateAreaSize()
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
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_TagGroup
   */
  public get tags_list() { return Object.values(this.tags_dict) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_TagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }

  public get show_legend(): boolean { return this._show_legend }

  // SETTER =============================================================================
  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
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

  // PROTECTED METHODS ==================================================================
  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_NodeTag(name, this, this._ref_sankey, id)
    tag.setSelected()
    return tag
  }

}
// CLASS FLUXTAGGROUP *******************************************************************
/**
 * Class that define a Flux TagGroup object
 * @export
 * @class Class_TagGroup
 */

export class Class_FluxTagGroup extends Class_TagGroup {

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

}
// CLASS DATATAGGROUP *******************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */

export class Class_DataTagGroup extends Class_ProtoTagGroup {

  // PRIVATE ATTRIBUTES =================================================================
  // Display attributes
  private _show_legend: boolean = false

  private _is_sequence: boolean = false
  private _is_unit = false

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
  protected _copyFrom(
    tagg_to_copy: Class_DataTagGroup
  ) {
    super._copyFrom(tagg_to_copy)
    this._show_legend = tagg_to_copy.show_legend
    this._is_sequence = tagg_to_copy._is_sequence
    this._is_unit = tagg_to_copy._is_unit
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['show_legend'] = this._show_legend
    json_object['is_sequence'] = this._is_sequence
    json_object['is_unit'] = this._is_unit
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._show_legend = getBooleanFromJSON(json_object, 'show_legend', this._show_legend)
    this._is_sequence = getBooleanFromJSON(json_object, 'is_sequence', this._is_sequence)
    this._is_unit = getBooleanFromJSON(json_object, 'is_unit', this._is_unit)
  }

  // PUBLIC METHODS =====================================================================
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
    this.updateTagsReferences()
  }

  public updateTagsReferences(): void {
    // On datatags update everything is impacted
    this._ref_sankey.drawing_area.draw()
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
   * Return dict tag from the current group
   * @type {Class_DataTag[]}
   * @memberof Class_DataTagGroup
   */
  public get tags_list() { return Object.values(this.tags_dict) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_DataTagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }

  public get show_legend(): boolean { return this._show_legend }
  public get is_sequence(): boolean { return this._is_sequence }
  public get is_unit(): boolean { return this._is_unit }

  // SETTER ==============================================================================
  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
  public set is_sequence(value: boolean) { this._is_sequence = value }
  public set is_unit(value: boolean) { this._is_unit = value }
}
// CLASS LEVEL TAGGROUP *****************************************************************
/**
 * Tag group for node level - Fusionné avec Class_ProtoLevelTagGroup
 * @export
 * @class Class_LevelTagGroup
 */
export class Class_LevelTagGroup {

  // PRIVATE ATTRIBUTES =================================================================
  // Name
  private _id: string
  private _name: string

  // List of tags
  private _tag_count: number = 0

  // Type of banner
  private _banner: tag_banner_type = 'one'

  // Display attributes
  private _activated: boolean = false
  private _siblings: string[] = []
  private _antitagged_refs: Class_NodeElement[] = []

  // PROTECTED ATTRIBUTES ===============================================================
  protected _tags: { [_: string]: Class_LevelTag; } = {}
  protected _ref_sankey: Class_Sankey

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_LevelTagGroup
   */
  protected _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_LevelTagGroup.
   * @param {string} id
   * @param {string} name
   * @param {Class_Sankey} sankey
   * @memberof Class_LevelTagGroup
   */
  constructor(id: string, name: string, sankey: Class_Sankey) {
    this._id = id
    this._name = name
    this._ref_sankey = sankey
  }

  // CLEANING METHODS ====================================================================
  /**
   * Define deletion behavior
   * @memberof Class_LevelTagGroup
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      
      // Delete all tags properly
      Object.values(this._tags).forEach(tag => {
        tag.delete()
      })
      this._tags = {}
      
      // Unref antitags
      this._antitagged_refs.forEach(ref => this.removeAntiTaggedRef(ref))
      this._antitagged_refs = []
      
      // Garbage collection will do the rest ...
    }
  }

  // COPY METHODS ========================================================================
  public copyFrom(tagg_to_copy: Class_LevelTagGroup) {
    this._copyFrom(tagg_to_copy)
  }

  protected _copyFrom(tagg_to_copy: Class_LevelTagGroup) {
    // Common attributes
    this._name = tagg_to_copy._name
    this._banner = tagg_to_copy._banner
    this._tag_count = tagg_to_copy._tag_count
    this._activated = tagg_to_copy._activated
    this._siblings = tagg_to_copy._siblings

    // Synchronize tags
    // Synchronise current tag group's tag with tag group to copy
    this.tags_list.forEach(tag => {
      // Delete tags not present in new layout but present in curr
      if (!(tag.id in tagg_to_copy.tags_dict))
        this.removeTag(tag)
      // Transfer tags attr present in new layout and in curr
      else
        tag.copyFrom(tagg_to_copy.tags_dict[tag.id])
    })
    
    // Add tag present in tagg_to_copy but not this
    tagg_to_copy.tags_list.forEach(tag => {
      if (!(tag.id in this.tags_dict))
        this.addTag(tag.name, tag.id).copyFrom(tag)
    })
  }

  // JSON METHODS =======================================================================
  public toJSON(kwargs?: Type_JSON) {
    const json_object = {} as Type_JSON
    this._toJSON(json_object, kwargs)
    return json_object
  }

  protected _toJSON(json_object: Type_JSON, _kwargs?: Type_JSON) {
    // Fill group attributes
    json_object['name'] = this._name
    json_object['banner'] = this._banner
    json_object['activated'] = this._activated
    json_object['siblings'] = this._siblings
    
    // Update tags infos
    const json_object_tags = {} as Type_JSON
    this.tags_list.forEach(tag => {
      json_object_tags[tag.id] = tag.toJSON()
    })
    json_object['tags'] = json_object_tags
  }

  public fromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    this._fromJSON(json_object, kwargs)
  }

  protected _fromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    
    // Read group attributes
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._banner = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
    this._activated = getBooleanFromJSON(json_object, 'activated', this._activated)
    this._siblings = getStringListFromJSON(json_object, 'siblings', this._siblings)
    
    // Create new tags & read their attributes
    const matching_tags_id: { [_: string]: string; } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: string; } : {}
    Object.entries(json_object['tags']).forEach(([_, tag_json]) => {
      // Get or Create tag
      const tag_id = matching_tags_id[_] ?? _
      const tag = this._tags[_] ?? this.addTag(tag_id, tag_id) // Tag will be renamed in fromJSON method

      // Update tag with json
      tag.fromJSON(tag_json as Type_JSON)
    })
  }

  private fromLegacyJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'group_name', this._name)
  }

  // PUBLIC METHODS =====================================================================
  public addTag(name: string, id: string | undefined = undefined): Class_LevelTag {
    const tag = this.createTag(name, id)
    this._tags[tag.id] = tag
    this._tag_count = this._tag_count + 1
    return tag
  }

  public addDefaultTag(): Class_LevelTag {
    const n = String(this._tag_count)
    const name = 'Etiquette ' + n
    return this.addTag(name)
  }

  public removeTag(_: Class_LevelTag) {
    if (this._tags[_.id] !== undefined) {
      _.delete()
      delete this._tags[_.id]
    }
  }

  public selectTagsFromId(id: string) {
    // Change selection but do not redraw
    const _selectTagsFromId = (_: string) => {
      this.tags_list.forEach(tag => {
        if (tag.id === _) {
          tag.setSelected()
        } else {
          tag.setUnSelected()
        }
      })
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
    }
    
    const old_selected = this.selected_tags_list[0].id
    this._ref_sankey.drawing_area.application_data.history.saveUndo(() => _selectTagsFromId(old_selected))
    this._ref_sankey.drawing_area.application_data.history.saveRedo(() => _selectTagsFromId(id))
    _selectTagsFromId(id)
  }

  public selectTagsFromIds(ids: string[]) {
    // Change selection but do not redraw
    this.tags_list.forEach(tag => {
      if (ids.includes(tag.id)) {
        tag.setSelected()
      } else {
        tag.setUnSelected()
      }
    })
  }

  public sibling_activated() {
    return this._siblings.filter(tagg => {
      return this._ref_sankey.level_taggs_dict[tagg].activated
    }).map(tagg => this._ref_sankey.level_taggs_dict[tagg])
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

  // GETTERS ============================================================================
  /**
   * Id of tag group
   * @readonly
   * @type {string}
   * @memberof Class_LevelTagGroup
   */
  public get id(): string { return this._id }

  /**
   * Name of tag group (!= id)
   * @type {string}
   * @memberof Class_LevelTagGroup
   */
  public get name(): string { return this._name }

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_LevelTag }}
   * @memberof Class_LevelTagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return list tag from the current group
   * @readonly
   * @memberof Class_LevelTagGroup
   */
  public get tags_list() { return Object.values(this.tags_dict) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_LevelTagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }

  /**
   * True if tag group has tags
   * @readonly
   * @memberof Class_LevelTagGroup
   */
  public get has_tags() { return this.tags_list.length > 0 }

  /**
   * True if tag group has tags selected
   * @readonly
   * @memberof Class_LevelTagGroup
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
  public get activated(): boolean { return this._activated }
  public get siblings(): string[] { return this._siblings }
  public get antitagged_refs() { return this._antitagged_refs }

  public set name(value: string) { this._name = value }
  public set banner(value: tag_banner_type) { this._banner = value }
  
  public set activated(value: boolean) {
    // Avoid useless updates
    if (this._activated !== value) {
      this._activated = value
      if (this._activated === true) {
        this._siblings.forEach(sib_tagg_id => {
          if (this._ref_sankey.level_taggs_dict[sib_tagg_id])
            this._ref_sankey.level_taggs_dict[sib_tagg_id].activated = false
        })
      }
      this._ref_sankey.draw()
    }
  }

  public set siblings(value: string[]) {
    this._siblings = value
    this._ref_sankey.draw()
  }
}