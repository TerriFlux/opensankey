// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { Class_DrawingArea } from './DrawingArea'
import {
  Class_LinkStyle, nodeStyleConfigs, Class_NodeStyle, linkStyleConfigs, NodeStyleConfigsDict,
  product_sector_styles, NodeStyleKey, node_exchanges_style, LinkStyleConfigsDict, LinkStyleKey,
  link_exchanges_style, Class_ContainerStyle  // ← AJOUTER ICI
} from '../Elements/ElementStyle'
import { NODES_ATTRIBUTES_CONFIG } from '../Elements/NodeAttributesConfig'
import { LINKS_ATTRIBUTES_CONFIG } from '../Elements/LinkAttributesConfig'
import { CONTAINERS_ATTRIBUTES_CONFIG } from '../Elements/ContainerAttributesConfig'
import { Class_LinkElement, defaultLinkId, sortLinksElementsByIds } from '../Elements/Link'
import { Class_LinkAttribute, Type_customisable_flow_style_attr } from '../Elements/LinkAttributes'
import { Class_NodeElement, sortNodesElements } from '../Elements/Node'
import { Class_NodeAttribute, Type_customisable_node_style_attr } from '../Elements/NodeAttributes'
import { Class_ContainerElement } from '../Elements/TextZone'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_DataTag, Class_Tag, } from '../types/Tag'
import { Class_NodeTagGroup, Class_FluxTagGroup, Class_DataTagGroup, Class_LevelTagGroup } from './TagGroup'
import {
  Type_JSON,
  getJSONFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON,
  default_main_sankey_id,
  default_style_id,
  Type_MacroTagGroup,
  randomId,
  CutName,
  makeId,
  default_style_name,
  default_save_only_visible_elements,
  default_save_with_values
} from '../types/Utils'

/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_Sankey {
  /**
   * Allows to toggle Sankey visibility
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_SankeyOSP
   */
  protected _is_visible: boolean = true

  protected _link_styles: { [_: string]: Class_LinkStyle } = {}
  protected _node_styles: { [_: string]: Class_NodeStyle } = {}
  protected _container_styles: { [_: string]: Class_ContainerStyle } = {}

  protected _nodes_dimensions: { [_: string]: Class_NodeDimension } = {}

  public name: string

  public normalised_link?: Class_LinkElement

  public addNodeDimension(dim: Class_NodeDimension) {
    if (this._nodes_dimensions[dim.id]) {
      return
    }
    this._nodes_dimensions[dim.id] = dim
  }

  public removeNodeDimension(dim: Class_NodeDimension) {
    if (!this._nodes_dimensions[dim.id]) {
      return
    }
    delete this._nodes_dimensions[dim.id]
  }

  public showAccordingToLevelTags() {
    Object.values(this._nodes_dimensions).forEach(dim => {
      dim.unsetForcingToShow()
    })
  }

  protected createNewNode(id: string, name: string): Class_NodeElement {
    const node = new Class_NodeElement(id, name, this.drawing_area)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElement, target: Class_NodeElement): Class_LinkElement {
    const link = new Class_LinkElement(id, source, target, this.drawing_area)
    return link
  }

  protected createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStyle {
    const style = new Class_LinkStyle(id, name, is_deletable)
    return style
  }
  protected createNewContainerStyle(id: string, name: string, is_deletable?: boolean): Class_ContainerStyle {
    const style = new Class_ContainerStyle(id, name, is_deletable)
    return style
  }

  public get default_link_style() {
    return this._link_styles[default_style_id]
  }
  public get default_container_style() {
    return this._container_styles[default_style_id]
  }
  // Sankey visibility - for views
  public setVisible() { this._is_visible = true }
  public setInvisible() { this._is_visible = false }
  public toggleVisibility() { this._is_visible = !this._is_visible }
  public get is_visible() { return this._is_visible }
  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Drawing area where sankey belongs
   * @type {Class_DrawingArea}
   * @memberof Class_Sankey
   */
  public drawing_area: Class_DrawingArea

  // PROTECTED ATTRIBUTES ===============================================================



  /**
   * Use a status key to indicated that something has change on datatags
   * @protected
   * @type {string}
   * @memberof Class_Sankey
   */
  protected _node_tags_fingerprint: string
  protected _flux_tags_fingerprint: string
  protected _data_tags_fingerprint: string

  private _icon_catalog: { [x: string]: string } = {}
  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Unique id for sankey
   *
   * @private
   * @type {string}
   * @memberof Class_Sankey
   */
  private _id: string

  /**
   * Nodes
   *
   * @protected
   * @type {{ [_: string]: Class_NodeElement }}
   * @memberof Class_Sankey
   */
  protected _nodes: { [_: string]: Class_NodeElement } = {}

  // Links
  private _links: { [_: string]: Class_LinkElement } = {}


  // Tags
  private _node_taggs: { [_: string]: Class_NodeTagGroup } = {}
  private _flux_taggs: { [_: string]: Class_FluxTagGroup } = {}
  private _data_taggs: { [_: string]: Class_DataTagGroup } = {}
  private _level_taggs: { [_: string]: Class_LevelTagGroup } = {}



  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(
    drawing_area: Class_DrawingArea,
    id: string = default_main_sankey_id
  ) {
    this.drawing_area = drawing_area
    this._id = id
    // New attributes
    this.name = this.id  // Default name = id
    // Init updating keys
    this._node_tags_fingerprint = randomId()
    this._flux_tags_fingerprint = randomId()
    this._data_tags_fingerprint = randomId()

    this._icon_catalog = {}

    this._link_styles[default_style_id] = this.createNewLinkStyle(default_style_id, default_style_name, false)
    this._node_styles[default_style_id] = this.createNewNodeStyle(default_style_id, default_style_name, false)
    this._container_styles[default_style_id] = this.createNewContainerStyle(default_style_id, default_style_name, false)
  }

  private static get_sync_lists(
    to_sync: { [id: string]: unknown },
    as_ref: { [id: string]: unknown },
    matching_id: { [id: string]: string }
  ) {
    const revert_matching_id: { [id: string]: string } = {}
    if (matching_id) {
      Object.entries(matching_id).forEach(([k, v]) => revert_matching_id[v] = k)
    }
    // Transfer node style from new_layout style node  to corresponding style in current
    const to_sync_ids = Object.keys(to_sync)
    const as_ref_ids = Object.keys(as_ref)

    // Styles can be to remove, to add or to update
    const to_remove = to_sync_ids
      .filter(id => !(as_ref_ids.includes(matching_id[id] ?? id)))
    const to_add = as_ref_ids
      .filter(id => !to_sync_ids.includes(revert_matching_id[id] ?? id))
    const to_update = to_sync_ids
      .filter(id => as_ref_ids.includes(matching_id[id] ?? id))

    return [
      to_remove,
      to_add,
      to_update
    ]
  }
  /**
   * Remove a single attribute from local Class_NodeAttribute
   *
   * @param {keyof Class_NodeAttribute} k
   * @memberof Class_DrawingArea
   */
  public deleteLocalAttrSelectedNodes(
    k: keyof typeof NODES_ATTRIBUTES_CONFIG, selected_nodes_list: Class_NodeElement[]) {

    selected_nodes_list.forEach(n => {
      if (k in n.display.attributes) {
        delete n.display.attributes[k]
        n.draw()
      }
    })
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }

  /**
   * Remove a single attribute from local Class_LinkAttribute
   *
   * @param {keyof Class_LinkAttribute} k
   * @memberof Class_DrawingArea
   */
  public deleteLocalAttrSelectedLinks(k: keyof typeof LINKS_ATTRIBUTES_CONFIG, selected_links_list: Class_LinkElement[]) {
    selected_links_list.forEach(link => {
      if (k in LINKS_ATTRIBUTES_CONFIG) {
        link.display.attributes.delete_attribute(k)
        link.drawWithNodes()
      }
    })
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }
  public deleteLocalAttrSelectedContainers(
    k: keyof typeof CONTAINERS_ATTRIBUTES_CONFIG,
    selected_containers_list: Class_ContainerElement[]
  ) {
    selected_containers_list.forEach(container => {
      if (k in CONTAINERS_ATTRIBUTES_CONFIG) {
        container.attributes.delete_attribute(k)
        container.draw()
      }
    })
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToContainers()
  }

  public tradeOption() {
    if (!this.node_taggs_dict['type de noeud']) {
      return
    }
    //this.drawing_area.bypass_redraws = true
    const process_nodes = this.nodes_list
    const echangeTag = this.node_taggs_dict['type de noeud'].tags_dict['echange']
    const import_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )
    if (import_nodes.length > 0) {
      if (import_nodes[0].style.includes(this.node_styles_dict['NodeImportExportCloseStyle'])) {
        return 'close'
      } else {
        return 'above_below'
      }
    }
    return 'none'
  }

  public setTrade = (close: boolean) => {
    const node_styles_dict = this.node_styles_dict
    const link_styles_dict = this.link_styles_dict
    if (!this.node_taggs_dict['type de noeud']) {
      return
    }
    this.drawing_area.bypass_redraws = true
    const process_nodes = this.nodes_list
    const echangeTag = this.node_taggs_dict['type de noeud'].tags_dict['echange']
    const import_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )
    const export_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
    )
    if (close) {
      import_nodes.forEach((n, i) => {
        if (i == 0) n.sibling!.style = [
          node_styles_dict['NodeSectorStyle'],
          node_styles_dict['NodeImportExportCloseStyle'],
        ]
        n.style = [
          node_styles_dict['NodeSectorStyle'],
          node_styles_dict['NodeImportExportCloseStyle'],
          node_styles_dict['NodeImportCloseStyle']
        ]
        n.getFirstOutputLink()!.style = [
          link_styles_dict['LinkImportExportCloseStyle'],
          link_styles_dict['LinkImportCloseStyle']
        ]
      })
      export_nodes.forEach(n => {
        n.style = [
          node_styles_dict['NodeSectorStyle'],
          node_styles_dict['NodeImportExportCloseStyle'],
          node_styles_dict['NodeExportCloseStyle']
        ]
        n.getFirstInputLink()!.style = [
          link_styles_dict['LinkImportExportCloseStyle'],
          link_styles_dict['LinkExportCloseStyle']
        ]
      })
    } else {
      import_nodes.forEach((n, i) => {
        if (i == 0) n.sibling!.style = [
          node_styles_dict['NodeSectorStyle'],
          node_styles_dict['NodeImportExportAboveBelowStyle'],
        ]
        n.style = [
          node_styles_dict['NodeSectorStyle'],
          node_styles_dict['NodeImportExportAboveBelowStyle'],
          node_styles_dict['NodeImportAboveStyle']
        ]
        n.getFirstOutputLink()!.style = [
          link_styles_dict['LinkImportExportAboveBelowStyle'],
          link_styles_dict['LinkImportAboveStyle']
        ]
      })
      export_nodes.forEach(n => {
        n.style = [
          node_styles_dict['NodeSectorStyle'],
          node_styles_dict['NodeImportExportAboveBelowStyle'],
          node_styles_dict['NodeExportBelowStyle']
        ]
        n.getFirstInputLink()!.style = [
          link_styles_dict['LinkImportExportAboveBelowStyle'],
          link_styles_dict['LinkExportBelowStyle']
        ]
      })
    }
    this.drawing_area.nodePositioning.arrangeTrade(true)
    this.drawing_area.draw()
  }
  // CLEANING METHODS ===================================================================

  public delete() {
    // Properly delete all nodes & link
    this.nodes_list.forEach(n => {
      n.delete() // Will also trigger delete() on links
    })
    this._nodes = {}
    this._links = {}
    // Properly delete all node styles
    this.node_styles_list.forEach(sn => {
      sn.delete()
    })
    this._node_styles = {}
    // Properly delete all link styles
    this.link_styles_list.forEach(sl => {
      sl.delete()
    })
    this._link_styles = {}
    // Properly delete all tags groups -> will delete related tags also
    this.node_taggs_list.forEach(grp => grp.delete())
    this.flux_taggs_list.forEach(grp => grp.delete())
    this.data_taggs_list.forEach(grp => grp.delete())
    this.level_taggs_list.forEach(grp => grp.delete())
    this._node_taggs = {}
    this._flux_taggs = {}
    this._data_taggs = {}
    this._level_taggs = {}
  }

  public delete_all_nodes_and_links() {
    // Properly delete all nodes & link (links will be deleted by node.delete())      
    this.nodes_list.forEach(n => {
      n.delete() // Will also trigger delete() on links
    })
    this._nodes = {}
    this._links = {}
  }

  // COPY METHODS =======================================================================

  /**
   * Copy everything from input sankey to copy
   * @param {Class_Sankey<Class_DrawingArea, Class_NodeElement, Class_LinkElement>} sankey_to_copy
   * @memberof Class_Sankey
   */
  public copyFrom(sankey_to_copy: Class_Sankey): void {
    // First clean everything
    this.delete()
    // Then copy tags
    Object.entries(sankey_to_copy._node_taggs)
      .forEach(([idx, node_tagg_to_copy]) => {
        this.addNodeTagGroup(idx, node_tagg_to_copy.name)
          .copyFrom(node_tagg_to_copy)
      })
    Object.entries(sankey_to_copy._flux_taggs)
      .forEach(([idx, flux_tagg_to_copy]) => {
        this.addFluxTagGroup(idx, flux_tagg_to_copy.name)
          .copyFrom(flux_tagg_to_copy)
      })
    Object.entries(sankey_to_copy._level_taggs)
      .forEach(([idx, level_tagg_to_copy]) => {
        this.addLevelTagGroup(idx, level_tagg_to_copy.name)
          .copyFrom(level_tagg_to_copy)
      })
    Object.entries(sankey_to_copy._data_taggs)
      .forEach(([idx, data_tagg_to_copy]) => {
        this.addDataTagGroup(idx, data_tagg_to_copy.name)
          .copyFrom(data_tagg_to_copy)
      })
    // Then copy styles
    Object.entries(sankey_to_copy._node_styles)
      .forEach(([idx, node_style_to_copy]) => {
        this.addNewNodeStyle(idx, node_style_to_copy.name)
          .copyFrom(node_style_to_copy)
      })
    Object.entries(sankey_to_copy._link_styles)
      .forEach(([idx, link_style_to_copy]) => {
        this.addNewLinkStyle(idx, link_style_to_copy.name)
          .copyFrom(link_style_to_copy)
      })
    // Then copy links
    Object.entries(sankey_to_copy._links)
      .forEach(([idx, link_to_copy]) => {
        this.addNewLinkWithId(
          idx,
          this._nodes[link_to_copy.source.id] ?? this.addNewNode(link_to_copy.source.id, link_to_copy.source.name), // Get or create source
          this._nodes[link_to_copy.target.id] ?? this.addNewNode(link_to_copy.target.id, link_to_copy.target.name) // Get or create target
        )
          .copyFrom(link_to_copy)
      })
    // Then copy nodes
    Object.entries(sankey_to_copy._nodes)
      .forEach(([idx, node_to_copy]) => {
        const node = (this._nodes[idx] ?? this.addNewNode(idx, node_to_copy.name))
        node.copyFrom(node_to_copy)
        node.keepLinkOrderingFrom(node_to_copy, {}) // Same ordering
      })

    // Copy icon catalog fom sankey
    Object.entries(sankey_to_copy.icon_catalog)
      .forEach(([idx, icon_path]) => {
        this._icon_catalog[idx] = icon_path
      })
  }

  /**
   * Copy some of all the other sankey attributes to this sankey
   * Modes list can contains all these options :
   * - 'attrDrawingArea' - Copy Attributes related to display on drawing area (ie styles)
   * - 'tagLevel' - Copy level tags
   * - 'tagNode' - Copy node tags
   * - 'tagFlux' - Copy flux tags
   * - 'tagData' - Copy data tags
   * @param {Class_Sankey<Class_DrawingArea, Class_NodeElement, Class_LinkElement>} other_sankey
   * @param {string[]} mode
   * @memberof Class_Sankey
   */
  public updateFrom(
    other_sankey: Class_Sankey,
    mode: string[],
  ) {
    const matching_taggs_id: { [_: string]: { [_: string]: string } } = {}
    const matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {}
    const matching_nodes_id: { [_: string]: string } = {}
    const matching_links_id: { [_: string]: string } = {}
    other_sankey.matchAndModifyJSONIds(
      this.toJSON(),
      matching_taggs_id,
      matching_tags_id,
      matching_nodes_id,
      matching_links_id
    )
    const revert_matching_links_id: { [id: string]: string } = {}
    Object.entries(matching_links_id).forEach(([k, v]) => revert_matching_links_id[v] = k)
    // Local variables to avoid recomputations ------------------------------------------

    const all = mode.includes('*')

    // Transfer DA attribut from other sankey to current (+ nodes/links style)------------

    if (mode.includes('attrDrawingArea') || all) {

      // Nodes styles can be to remove, to add or to update
      const [ns_to_remove, ns_to_add, ns_to_update] = Class_Sankey.get_sync_lists(this._node_styles, other_sankey._node_styles, {})

      // Update styles
      ns_to_remove
        .forEach(id => {
          this._node_styles[id].delete()
        })
      ns_to_add
        .forEach(id => {
          const ns = other_sankey._node_styles[id]
          this.addNewNodeStyle(ns.id, ns.name)
          this._node_styles[ns.id].copyFrom(ns)
        })
      ns_to_update
        .forEach(id => {
          this._node_styles[id].copyFrom(other_sankey._node_styles[id])
        })

      // Link styles can be to remove, to add or to update
      const [ls_to_remove, ls_to_add, ls_to_update] = Class_Sankey.get_sync_lists(this._link_styles, other_sankey._link_styles, {})

      // Update styles
      ls_to_remove
        .forEach(id => {
          this._link_styles[id].delete()
        })
      ls_to_add
        .forEach(id => {
          const ls = other_sankey._link_styles[id]
          this.addNewLinkStyle(ls.id, ls.name)
          this._link_styles[ls.id].copyFrom(ls)
        })
      ls_to_update
        .forEach(id => {
          this._link_styles[id].copyFrom(other_sankey._link_styles[id])
        })
    }

    // Update level_tag_dict ------------------------------------------------------------

    //if (mode.includes('tagLevel') || all) {
    // Finds the corresponding tag group by ids
    // const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(this._level_taggs, other_sankey._level_taggs, matching_taggs_id['levelTags'])

    // // Update taggs
    // to_remove
    //   .forEach(id => {
    //     this.removeTagGroupWithId('level_taggs', id)
    //   })
    // to_add
    //   .forEach(id => {
    //     const ltagg = other_sankey._level_taggs[matching_taggs_id['levelTags'][id] ?? id]
    //     this.addLevelTagGroup(ltagg.id, ltagg.name)
    //     this._level_taggs[id].copyFrom(ltagg)
    //   })
    // to_update
    //   .forEach(id => {
    //     this._level_taggs[id].copyFrom(other_sankey._level_taggs[matching_taggs_id['levelTags'][id] ?? id])
    //   })
    if (mode.includes('tagLevel') || all) {
      matching_taggs_id['levelTags']['dimension 1'] = 'Primaire'
      Object.values(this._level_taggs).forEach(tagg =>
        tagg.tags_list.forEach(tag => {
          const sourceTag = other_sankey._level_taggs[matching_taggs_id['levelTags'][tagg.id]]?.tags_dict?.[tag.id]
          if (sourceTag) tag.is_selected = sourceTag.is_selected
        })
      )
    }

    // Update node_tag_dict ------------------------------------------------------------
    if (mode.includes('tagNode') || all) {
      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(this._node_taggs, other_sankey._node_taggs, matching_taggs_id['nodeTags'])

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('node_taggs', id)
        })
      to_add
        .forEach(id => {
          const ntagg = other_sankey._node_taggs[matching_taggs_id['nodeTags'][id] ?? id]
          this.addNodeTagGroup(ntagg.id, ntagg.name)
          this._node_taggs[id].copyFrom(ntagg)
        })
      to_update
        .forEach(id => {
          this._node_taggs[id].copyFrom(other_sankey._node_taggs[matching_taggs_id['nodeTags'][id] ?? id], matching_tags_id['nodeTags'][id])
        })
    }

    // Update flux_tag_dict ------------------------------------------------------------
    if (mode.includes('tagFlux') || all) {
      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(this._flux_taggs, other_sankey._flux_taggs, matching_taggs_id['fluxTags'])

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('flux_taggs', id)
        })
      to_add
        .forEach(id => {
          const ftagg = other_sankey._flux_taggs[matching_taggs_id['fluxTags'][id] ?? id]
          this.addFluxTagGroup(ftagg.id, ftagg.name)
          this._flux_taggs[id].copyFrom(ftagg)
        })
      to_update
        .forEach(id => {
          this._flux_taggs[id].copyFrom(other_sankey._flux_taggs[matching_taggs_id['fluxTags'][id] ?? id], matching_tags_id['fluxTags'][id])
        })
    }

    // Update data_tag_dict ------------------------------------------------------------

    if (mode.includes('tagData') || all) {

      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(this._data_taggs, other_sankey._data_taggs, matching_taggs_id['dataTags'])

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('data_taggs', id)
        })
      to_add
        .forEach(id => {
          const dtagg = other_sankey._data_taggs[matching_taggs_id['dataTags'][id] ?? id]
          this.addDataTagGroup(dtagg.id, dtagg.name)
          this._data_taggs[id].copyFrom(dtagg)
        })
      to_update
        .forEach(id => {
          this._data_taggs[id].copyFrom(other_sankey._data_taggs[matching_taggs_id['dataTags'][id] ?? id], matching_tags_id['dataTags'][id])
        })
    }

    // Nodes  ---------------------------------------------------------------------------

    const add_nodes = mode.includes('addNode')
    const remove_nodes = mode.includes('removeNodes')
    const sync_nodes_tags = mode.includes('tagNode')
    const sync_nodes_positions = mode.includes('posNode')
    const sync_nodes_attr = mode.includes('attrNode')

    if (
      add_nodes ||
      remove_nodes ||
      sync_nodes_tags ||
      sync_nodes_positions ||
      sync_nodes_attr ||
      all
    ) {
      const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(this._nodes, other_sankey._nodes, matching_nodes_id)

      // Add nodes that are in other sankey but not in this sankey
      if (add_nodes || all) {
        to_add
          .forEach(id => {
            const n = other_sankey._nodes[matching_nodes_id[id] ?? id]
            this.addNewNode(n.id, n.name)
            this._nodes[id].copyFrom(n)
            return id
          })
      }

      // Delete nodes that are in other sankey but not in this sankey
      if (remove_nodes || all) {
        to_remove
          .forEach(id => {
            this.drawing_area.deleteNode(this._nodes[id])
          })
      }

      // With attrNode we transfer node attr
      if (sync_nodes_attr || all) {
        // Transfer node attr from new_layout node to correspondinf node in current
        to_update
          .forEach(id => {
            const n = this._nodes[id]
            const pn = structuredClone(n.display.position) // Save position
            const on = other_sankey._nodes[matching_nodes_id[id] ?? id]
            n.copyAttrFrom(on) // Copy attributes
            n.display.position = pn // Reapply position
            return id
          })
      }

      // Update nodes ref to node_taggs
      if ((sync_nodes_tags) || all) {
        to_update
          .forEach(id => {
            this._nodes[id].copyTagsReferencingFrom(other_sankey._nodes[matching_nodes_id[id] ?? id], matching_taggs_id['nodeTags'], matching_tags_id['nodeTags'])
          })


        // Update nodes ref to node added
        if ((add_nodes) || all) {
          to_add
            .forEach(id => {
              this._nodes[id].copyTagsReferencingFrom(other_sankey._nodes[matching_nodes_id[id] ?? id], matching_taggs_id['nodeTags'], matching_tags_id['nodeTags'])
            })
        }

      }

      // Update node position from other sankey
      if (sync_nodes_positions || all) {
        to_update
          .forEach(id => {
            const n = other_sankey._nodes[matching_nodes_id[id] ?? id]
            this._nodes[id].setPosXY(n.position_x, n.position_y)
          })
      }
    }

    // Links -------------------------------------------------------------------------

    const add_flux = mode.includes('addFlux')
    const remove_flux = mode.includes('removeFlux')
    const pos_flux = mode.includes('posFlux')
    const sync_flux_tags = mode.includes('tagFlux')
    const sync_flux_values = mode.includes('Values')
    const sync_flux_attr = mode.includes('attrFlux')

    if (
      add_flux ||
      remove_flux ||
      sync_flux_tags ||
      sync_flux_values ||
      sync_flux_attr ||
      all
    ) {
      const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(this._links, other_sankey._links, matching_links_id)

      // Add link in new that are not in current then add them
      if (add_flux || all) {
        to_add
          .forEach(id => {
            const link = other_sankey._links[matching_links_id[id] ?? id]
            const similar_src_curr = this._nodes[link.source.id]
            const similar_trgt_curr = this._nodes[link.target.id]
            if (similar_src_curr && similar_trgt_curr) {
              // Copy with exactly the same atributs, source, targets, id, ...
              this.addNewLinkWithId(
                id,
                similar_src_curr as Class_NodeElement,
                similar_trgt_curr as Class_NodeElement
              )
              this._links[id].copyFrom(link)
            }
          })
      }

      // Remove link in current that are not in new then delete them
      if (remove_flux || all) {
        to_remove
          .forEach(id => {
            this.drawing_area.deleteLink(this._links[id])
          })
      }

      if (pos_flux || all) {
        to_update
          .forEach(id => {
            const link = this._links[id]
            // Source node
            const source = this._nodes[link.source.id]
            const other_source = other_sankey._nodes[other_sankey._links[matching_links_id[id] ?? id].source.id]
            source.keepLinkOrderingFrom(other_source, revert_matching_links_id)
            // Target node
            const target = this._nodes[link.target.id]
            const other_target = other_sankey._nodes[other_sankey._links[matching_links_id[id] ?? id].target.id]
            target.keepLinkOrderingFrom(other_target, revert_matching_links_id)
          })
      }

      // With attrFlux we transfer link attr
      if (sync_flux_attr || all) {
        to_update
          .forEach(id => {
            const link = this._links[id]
            // Save positions
            const sp = structuredClone(link.source.display.position)
            const tp = structuredClone(link.target.display.position)
            // Copy all attributes
            link.copyAttrFrom(other_sankey._links[matching_links_id[id] ?? id])
            // Keep positions
            link.source.display.position = sp
            link.target.display.position = tp
          })
      }

      if (add_flux || remove_flux || all) {
        const list_link_post_update = this.links_list.map(l => l.id)
        // Update links ordering
        const to_update_reorder = Object.assign([] as string[], to_update)
        if (add_flux || all) to_update_reorder.concat(to_add)
        to_update_reorder
          .filter(id => list_link_post_update.includes(id)) // only keep link really added
          .forEach(id => {
            // Source node
            const source = this._nodes[this._links[id].source.id]
            const other_source = other_sankey._nodes[other_sankey._links[matching_links_id[id] ?? id].source.id]
            source.keepLinkOrderingFrom(other_source, revert_matching_links_id)
            // Target node
            const target = this._nodes[this._links[id].target.id]
            const other_target = other_sankey._nodes[other_sankey._links[matching_links_id[id] ?? id].target.id]
            target.keepLinkOrderingFrom(other_target, revert_matching_links_id)
          })
      }

      // Values  ------------------------------------------------------------------------

      let to_update_for_values = Object.assign([] as string[], to_update)
      if (all || add_flux) to_update_for_values = to_update_for_values.concat(to_add)
      // /!\ other sankey must but an ancient version of the current sankey because each link value has an unique id
      if (((sync_flux_tags || sync_flux_values)) || all) {
        // To speed up matching process between values ids (that are random)
        // We compute corresp value ids for sync_flux_tags & sync_flux_values
        const values_corresp_ids: { [id_flux: string]: { [id_value: string]: string } } = {}
        to_update_for_values
          .forEach(id_flux => {
            // avoid recomputation
            const values = this._links[id_flux].getAllValues()
            const other_values = other_sankey._links[matching_links_id[id_flux] ?? id_flux].getAllValues()
            // Init corresps list
            values_corresp_ids[id_flux] = {}
            if (Object.keys(values).length > 0) {
              // Case 1 : No datatags - only one value per flux
              if (Object.values(values)[1] === undefined) {
                values_corresp_ids[id_flux][Object.keys(values)[0]] = Object.keys(other_values)[0]
              }
              // Case 2 : Datatags are present
              else {
                Object.entries(values)
                  .forEach(([id_value, [, dtags]]) => {
                    if (dtags !== undefined) { // Should never be the case
                      // Find values match based on datatags ids
                      const dtags_id = dtags.map(dtag => dtag.id)
                      Object.entries(other_values)
                        .filter(([, [, other_dtags]]) => {
                          if (other_dtags !== undefined)
                            return (
                              JSON.stringify(dtags_id) ===
                              JSON.stringify(other_dtags.map(other_dtag => other_dtag.id))
                            )
                          else
                            return false // Should never be the case
                        })
                        .forEach(([id_other_value,]) => {
                          values_corresp_ids[id_flux][id_value] = id_other_value
                        })
                    }
                  })
              }
            }
          })

        // Update refs between values and flux_tags
        if ((sync_flux_tags && (add_flux || remove_flux)) || all) {
          to_update_for_values
            .forEach(id_flux => {
              // Avid recomputation
              const link = this._links[id_flux]
              const values = link.getAllValues()
              const other_link = other_sankey._links[matching_links_id[id_flux] ?? id_flux]
              const other_values = other_link.getAllValues()
              // Loop on all current values for given flux id_flux
              Object.entries(values)
                .forEach(([id_value, [value,]]) => {
                  // Remove all tags for all current fluxs
                  value.flux_tags_list
                    .forEach(tag => {
                      value.removeTag(tag)
                    })
                  // Get corresponding value to copy
                  const id_other_value = values_corresp_ids[id_flux][id_value]
                  if (id_other_value !== undefined) {
                    const other_value = other_values[id_other_value][0]
                    // Apply same flux-tag relationship from new_layout to current sankey's fluxs
                    other_value.flux_tags_list
                      .filter(tag => tag.group.id in this._flux_taggs)
                      .filter(tag => tag.id in this._flux_taggs[tag.group.id].tags_dict)
                      .forEach(tag => value.addTag(tag))
                  }
                })
            })
        }

        // Apply links values from other sankey to current links
        if (sync_flux_values || all) {
          to_update_for_values
            .forEach(id_flux => {
              // Avid recomputation
              const link = this._links[id_flux]
              const values = link.getAllValues()
              const other_link = other_sankey._links[matching_links_id[id_flux] ?? id_flux]
              const other_values = other_link.getAllValues()
              // Loop on all current values for given flux id_flux
              Object.entries(values)
                .forEach(([id_value, [value,]]) => {
                  // Get corresponding value to copy
                  const id_other_value = values_corresp_ids[id_flux][id_value]
                  if (id_other_value !== undefined) {
                    value.copyFrom(other_values[id_other_value][0])
                  }
                })
            })
        }
      }
    }


    // Update icon catalog
    if (mode.includes('icon_catalog') || all) {
      Object.entries(other_sankey.icon_catalog).filter(icon => icon[0] && icon[1]).forEach(icon => {
        this.icon_catalog[icon[0]] = icon[1]
      })
    }
  }

  public create_child_links() {
    const data_tagg = Object.values(this._data_taggs).filter(tagg => tagg.banner == 'multi')[0]
    if (!data_tagg) return
    const selected_tags = data_tagg.tags_list.map(tag => tag.is_selected)
    if (selected_tags.length == 1) return
    this.links_list.forEach(l => {
      if (l.is_multi_link) {
        return
      }
      data_tagg.tags_list.forEach(tag => {
        if (!tag.is_selected) {
          if (tag.id in l.child_links) {
            l.child_links[tag.id].delete()
            delete l.child_links[tag.id]
          }
        }
      })
      data_tagg.selected_tags_list.forEach(tag => {
        if (tag.id in l.child_links || l.is_multi_link) {
          return
        }
        const child_link = this.addNewLink(l.source, l.target)
        child_link.copyFrom(l)
        l.addChildLink(child_link, tag)
      })
    })
  }

  public remove_child_links() {
    this.links_list.filter(l => Object.values(l.child_links).length > 0).forEach(l => {
      Object.keys(l.child_links).forEach(key => {
        l.child_links[key].delete()
        delete l.child_links[key]
        //delete this.links_dict[key]
      })
    })
  }
  public create_node_internal_style(id: NodeStyleKey, configs: NodeStyleConfigsDict) {
    if (this._node_styles[id]) {
      return
    }
    const new_style = this.createNewNodeStyle(id, configs[id].name, true)
    const config = configs[id].config
    const position = configs[id].position
    Object.keys(config).forEach(key => {
      new_style.customisable_attribute[key as Type_customisable_node_style_attr] = true
      //@ts-expect-error xxx
      new_style[key] = config[key]
    }
    )
    if (position) {
      Object.keys(position).forEach(key => {
        //@ts-expect-error xxx
        new_style.position[key] = position[key]
      }
      )
    }
    this._node_styles[id] = new_style
  }
  public create_link_internal_style(id: LinkStyleKey, configs: LinkStyleConfigsDict) {
    if (this._link_styles[id]) {
      return
    }
    const new_style = this.createNewLinkStyle(id, id, true)
    const config = configs[id].config
    Object.keys(config).forEach(key => {
      new_style.customisable_attribute[key as Type_customisable_flow_style_attr] = true
      //@ts-expect-error xxx
      new_style[key] = config[key]
    }
    )
    this._link_styles[id] = new_style
  }

  /**
   * Extract sankey as a JSON struct
   *
   * @param {boolean} [only_visible_elements=false]
   * @param {boolean} [with_values=true]
   * @return {*}
   * @memberof Class_Sankey
   */
  public toJSON(
    keep_sibling: boolean = false,
    only_visible_elements: boolean = default_save_only_visible_elements,
    with_values: boolean = default_save_with_values,
  ) {
    // Create json struct
    const json_object = {} as Type_JSON
    const json_object_levelTags = {} as Type_JSON
    const json_object_nodeTags = {} as Type_JSON
    const json_object_fluxTags = {} as Type_JSON
    const json_object_dataTags = {} as Type_JSON
    const json_object_styles_nodes = {} as Type_JSON
    const json_object_styles_links = {} as Type_JSON
    const json_object_styles_containers = {} as Type_JSON
    const json_object_nodes = {} as Type_JSON
    const json_object_links = {} as Type_JSON
    // Id
    json_object['id'] = this._id
    // Add tag groups
    if (this.level_taggs_list.length > 0) {
      json_object['levelTags'] = json_object_levelTags
      this.level_taggs_list.forEach(tagg => {
        json_object_levelTags[tagg.id] = tagg.toJSON()
      })
    }
    if (this.node_taggs_list.length > 0) {
      json_object['nodeTags'] = json_object_nodeTags
      this.node_taggs_list.forEach(tagg => {
        json_object_nodeTags[tagg.id] = tagg.toJSON()
      })
    }
    if (this.flux_taggs_list.length > 0) {
      json_object['fluxTags'] = json_object_fluxTags
      this.flux_taggs_list.forEach(tagg => {
        json_object_fluxTags[tagg.id] = tagg.toJSON()
      })
    }
    if (this.data_taggs_list.length > 0) {
      json_object['dataTags'] = json_object_dataTags
      this.data_taggs_list.forEach(tagg => {
        json_object_dataTags[tagg.id] = tagg.toJSON()
      })
    }
    // Add Styles
    json_object['style_node'] = json_object_styles_nodes
    this.node_styles_list.forEach(style => {
      json_object_styles_nodes[style.id] = style.toJSON(null, style.id != 'default' ? this._node_styles['default'] : null);
      (json_object_styles_nodes[style.id] as Type_JSON)['name'] = style.name
    })
    json_object['style_link'] = json_object_styles_links
    this.link_styles_list.forEach(style => {
      json_object_styles_links[style.id] = style.toJSON(null, style.id != 'default' ? this._link_styles['default'] : null);
      (json_object_styles_links[style.id] as Type_JSON)['name'] = style.name
    })
    json_object['style_zdt'] = json_object_styles_containers
    this.container_styles_list.forEach(style => {
      json_object_styles_containers[style.id] = {}
      Object.entries(style.toJSON({})).forEach(([key, value]) => {
        //@ts-expect-error xxx
        json_object_styles_containers[style.id][key] = value
      });
      (json_object_styles_containers[style.id] as Type_JSON)['name'] = style.name
    })
    // Add nodes
    json_object['nodes'] = json_object_nodes
    const nodes_list = (only_visible_elements ? this.visible_nodes_list : this.nodes_list)
    const echangeTag = this.node_taggs_dict['type de noeud'] ? this.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    this.remove_child_links()

    nodes_list
      .forEach(node => {
        if (!keep_sibling && node.hasGivenTag(echangeTag as Class_Tag) && node.sibling) {
          if (!json_object_nodes[node.sibling.id]) json_object_nodes[node.sibling.id] = node.sibling.toJSON({ 'only_visible_elements': only_visible_elements })
          return
        }
        json_object_nodes[node.id] = node.toJSON({ 'only_visible_elements': only_visible_elements })
      })
    // Add links
    json_object['links'] = json_object_links
    const links_list = (only_visible_elements ? this.visible_links_list : this.links_list)

    let has_results = false
    links_list.forEach(l => has_results = has_results || l.has_result)
    links_list.filter(l => !l.is_multi_link)
      .forEach(link => {
        json_object_links[link.id] = link.toJSON({ 'with_values': with_values, 'has_results': has_results })
      })


    // Icon catalog
    if (Object.keys(this._icon_catalog).length > 0) json_object['icon_catalog'] = this._icon_catalog as Type_JSON

    this.create_child_links()
    // Out
    return json_object
  }

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {{[_:string]:any} json_object
   * @memberof ClassTemplate_Legend
  */
  public fromJSON(
    json_object: Type_JSON,
    match_and_update: boolean = false
  ) {
    // Id
    this._id = getStringFromJSON(json_object, 'id', this._id)
    // If we use json object only for updateing layout,
    // we need to find correspondances for tags, nodes and links ids
    // from input JSON to this Sankey
    const matching_taggs_id: { [_: string]: { [_: string]: string } } = {}
    const matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {}
    const matching_nodes_id: { [_: string]: string } = {}
    const matching_links_id: { [_: string]: string } = {}
    if (match_and_update) {
      this.matchAndModifyJSONIds(
        json_object,
        matching_taggs_id,
        matching_tags_id,
        matching_nodes_id,
        matching_links_id
      )
    }

    // First read styles
    if (json_object['style_node'] !== undefined) {
      // Set node styles from json data
      Object.entries(json_object['style_node'])
        .forEach(([style_id, style_json]) => {
          // Create a node style
          const new_style = this._node_styles[style_id] ?? this.createNewNodeStyle(style_id, style_id, true)
          // Set node style value to node from JSON
          new_style.fromJSON(style_json as Type_JSON, null, style_id != 'default' ? this._node_styles['default'] : null)
          new_style.name = getStringFromJSON(style_json, 'name', new_style.id)
          // Add node style to sankey
          this._node_styles[style_id] = new_style
        })
    }
    if (json_object['style_link'] !== undefined) {
      // Set link styles from json data
      Object.entries(json_object['style_link'])
        .forEach(([style_id, style_json]) => {
          // Create a link style
          const new_style = this._link_styles[style_id] ?? this.createNewLinkStyle(style_id, style_id, true)
          // Set link style value to link style from JSON
          new_style.fromJSON(style_json as Type_JSON, null, style_id != 'default' ? this._link_styles['default'] : null)
          new_style.name = getStringFromJSON(style_json, 'name', new_style.id)
          // Add link style to sankey
          this._link_styles[style_id] = new_style
        })
    }
    if (json_object['style_zdt'] !== undefined) {
      // Set link styles from json data
      Object.entries(json_object['style_zdt'])
        .forEach(([style_id, style_json]) => {
          // Create a link style
          const new_style = this._container_styles[style_id] ?? this.createNewContainerStyle(style_id, style_id, true)
          // Set link style value to link style from JSON
          new_style.fromJSON(style_json as Type_JSON, null, style_id != 'default' ? this._container_styles['default'] : null)
          new_style.name = getStringFromJSON(style_json, 'name', new_style.id)
          // Add link style to sankey
          this._container_styles[style_id] = new_style
        })
    }

    // Then read tag groups

    let json_entry = 'nodeTags'
    if (json_object[json_entry] !== undefined) {
      // Set node tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a node tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._node_taggs[tagg_id] ?? this.addNodeTagGroup(tagg_id, tagg_id, false)  // Will be renamed in fromJSON()
          // Set node tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {}
          )
        })
      // Create default style for 'Type de noeud' if they don't exist
      if (Object.keys(json_object[json_entry]).includes('type de noeud')) {
        product_sector_styles.forEach(style_id => this.create_node_internal_style(style_id, nodeStyleConfigs))
        node_exchanges_style.forEach(style_id => this.create_node_internal_style(style_id, nodeStyleConfigs))
        link_exchanges_style.forEach(style_id => this.create_link_internal_style(style_id, linkStyleConfigs))
      }
    }
    json_entry = 'fluxTags'
    if (json_object[json_entry] !== undefined) {
      // Set flux tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._flux_taggs[tagg_id] ?? this.addFluxTagGroup(tagg_id, tagg_id, false)  // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    json_entry = 'dataTags'
    if (json_object[json_entry] !== undefined) {
      // Set data tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._data_taggs[tagg_id] ?? this.addDataTagGroup(tagg_id, tagg_id, false) // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    json_entry = 'levelTags'
    if (json_object[json_entry] !== undefined) {
      // Set level tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or create a level tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._level_taggs[tagg_id] ?? this.addLevelTagGroup(tagg_id, tagg_id)  // Will be renamed in fromJSON()
          // Set level tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }

    if (Object.keys(this._level_taggs).length > 1) {
      this.removeTagGroupWithId('level_taggs', 'Primaire')
    }
    // Then read links
    const json_link_object = getJSONFromJSON(json_object, 'links', {})
    Object.entries(json_link_object)
      .forEach(([_, link_json]) => {
        // Get related nodes id
        let source_node_id = getStringOrUndefinedFromJSON(link_json as Type_JSON, 'idSource')
        let target_node_id = getStringOrUndefinedFromJSON(link_json as Type_JSON, 'idTarget')
        if (source_node_id && target_node_id) {
          // Get or create related nodes
          source_node_id = matching_nodes_id[source_node_id] ?? source_node_id
          const source = this._nodes[source_node_id] ?? this.addNewNode(source_node_id, source_node_id)
          target_node_id = matching_nodes_id[target_node_id] ?? target_node_id
          const target = this._nodes[target_node_id] ?? this.addNewNode(target_node_id, target_node_id)
          // Get or create link
          const link_id = matching_links_id[_] ?? _
          const link = this._links[link_id] ?? this.addNewLinkWithId(link_id, source, target)
          // Set link value to link from JSON
          link.fromJSON(
            link_json as Type_JSON,
            {
              'matching_taggs_id': matching_taggs_id['fluxTags'] ?? {},
              'matching_tags_id': matching_tags_id['fluxTags'] ?? {}
            }
          )
        }
      })
    let has_data = false
    this.links_list.forEach(l => has_data = has_data || l.has_data)
    if (!has_data) {
      this.links_list.forEach(l => l.set_only_data())
    }
    // Then read nodes
    const json_node_object = getJSONFromJSON(json_object, 'nodes', {})
    Object.entries(json_node_object)
      .forEach(([_, node_json]) => {
        // Get or Create a node
        const node_id = matching_nodes_id[_] ?? _
        const node = this._nodes[node_id] ?? this.addNewNode(node_id, node_id)
        // Set node value to node from JSON
        node.fromJSON(
          node_json as Type_JSON,
          {
            'matching_taggs_id': { ...matching_taggs_id['nodeTags'], ...matching_taggs_id['levelTags'] },
            'matching_tags_id': { ...matching_tags_id['nodeTags'], ...matching_tags_id['levelTags'] }
          })
        // Order links io position in each nodes
        node.linksFromJSON(
          getJSONFromJSON(json_node_object, node.id, {}),
          matching_links_id
        )
        // Set dimensions
        node.dimensionsFromJSON(
          node_json as Type_JSON,
          matching_nodes_id,
          matching_taggs_id['levelTags'] ?? {},
          matching_tags_id['levelTags'] ?? {}
        )
      })

    this.create_child_links()
    // Icon catalog
    this._icon_catalog = getJSONFromJSON(json_object, 'icon_catalog', this._icon_catalog) as { [x: string]: string }
  }

  public matchAndModifyJSONIds(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: { [_: string]: string } } = {},
    matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {},
    matching_nodes_id: { [_: string]: string } = {},
    matching_links_id: { [_: string]: string } = {}
  ) {
    // Loop on every tag group entries in JSON if there is data -------------------------
    const loop_taggs = {
      'levelTags': this._level_taggs,
      'nodeTags': this._node_taggs,
      'fluxTags': this._flux_taggs,
      'dataTags': this._data_taggs,
    }
    Object.entries(loop_taggs)
      .forEach(([tagg_type, tagg_dict]) => {
        if (json_object[tagg_type] !== undefined) {
          // Variable to save matching ids : old -> new
          const curr_matching_taggs_id: { [id: string]: string } = {}
          const curr_matching_tags_id: { [id: string]: { [id: string]: string } } = {}
          // Cast type for linter
          const json = json_object[tagg_type] as Type_JSON
          // Loop on all entries to find tag group and then tags matchs
          Object.entries(json)
            .forEach(([tagg_id, _]) => {
              // Cast type
              const tagg_json = _ as Type_JSON
              // Match tag groups between sankey and JSON that have the same name but different id
              const matching_taggs = Object.values(tagg_dict)
                .filter(tagg => {
                  return (
                    (tagg.name === getStringOrUndefinedFromJSON(tagg_json, 'name')) &&
                    (tagg.id !== tagg_id))
                })
              // We need to find a unique matching entry in JSON
              if (matching_taggs.length === 1) {
                curr_matching_taggs_id[tagg_id] = matching_taggs[0].id
              }
              // Then match tags using the same methode
              curr_matching_tags_id[tagg_id] = {}
              Object.entries(tagg_json.tags)
                .forEach(([tag_id, __]) => {
                  // Get related tag group
                  const new_tagg_id = curr_matching_taggs_id[tagg_id] ?? tagg_id
                  const tagg = tagg_dict[new_tagg_id] ?? undefined
                  if (tagg) {
                    // Casting type
                    const tag_json = __ as Type_JSON
                    // Match tag group in json data with theses in sankey data using name
                    const matching_tags = tagg.tags_list
                      .filter(tag => {
                        return (
                          (tag.name === getStringOrUndefinedFromJSON(tag_json, 'name')) &&
                          (tag.id !== tag_id))
                      })
                    // We need to find a unique matching entry in JSON
                    if (matching_tags.length === 1) {
                      curr_matching_tags_id[tagg_id][tag_id] = matching_tags[0].id
                    }
                  }
                })
            })
          // Save results
          matching_taggs_id[tagg_type] = curr_matching_taggs_id
          matching_tags_id[tagg_type] = curr_matching_tags_id
        }
      })
    // Loop on all nodes ------------------------------------------------------------
    // Cast type for linter
    const nodes_json = json_object['nodes'] as Type_JSON
    Object.entries(nodes_json)
      .forEach(([node_id, _]) => {
        // Cast type for linter
        const node_json = _ as Type_JSON
        // Loop on all existing node and try to find match based on names
        const matching_nodes = this.nodes_list
          .filter(node => {
            return (
              (node.name === getStringOrUndefinedFromJSON(node_json, 'name')) &&
              (node.id !== node_id))
          })
        // There must be only one matching node
        if (matching_nodes.length === 1) {
          matching_nodes_id[node_id] = matching_nodes[0].id
        }
      })
    // Loop on all links ------------------------------------------------------------
    // Cast type for linter
    const links_json = json_object['links'] as Type_JSON
    Object.entries(links_json)
      .forEach(([link_id, _]) => {
        // Cast type for linter
        const link_json = _ as Type_JSON
        // Loop on all existing link and try to find match based on names
        const matching_links = this.links_list
          .filter(link => {
            let source_id = getStringFromJSON(link_json, 'idSource', '')
            source_id = matching_nodes_id[source_id] ?? source_id
            let target_id = getStringFromJSON(link_json, 'idTarget', '')
            target_id = matching_nodes_id[target_id] ?? target_id
            return (
              (link.source.id === source_id) &&
              (link.target.id === target_id) &&
              (link.id !== link_id))
          })
        // There must be only one matching link
        if (matching_links.length === 1) {
          matching_links_id[link_id] = matching_links[0].id
        }
      })
  }




  // PUBLIC METHODS =====================================================================

  // All --------------------------------------------------------------------------------

  public draw() {
    // // Draw links
    // this.links_list.forEach(link => link.draw())
    // Draw nodes
    this.nodes_list.forEach(node => node.draw())
    //this.nodes_list.forEach(node => node.unDraw())
    //this.visible_nodes_list_sorted.forEach(node => node.draw()) 
    this.drawing_area.orderElementOnDA()
  }

  // Nodes related ----------------------------------------------------------------------
  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewNodeWithName(name: string): Class_NodeElement {
    // Fonction pour normaliser les caractères accentués
    const normalizeAccents = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }
    const id = normalizeAccents(name)
      .toLowerCase()                    // Convertir en minuscules
      .replace(/[^a-z0-9 ]/g, '')      // Garder seulement lettres, chiffres et espaces
      .split(' ')                      // Séparer par les espaces
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliser chaque mot
      .join('')
    if (!this._nodes[id]) {
      // Create node
      const node = this.createNewNode(id, name)
      // Set node to default position
      node.initDefaultPosXY()
      // Update registry of nodes
      this._addNode(node)
      return node
    }
    else {
      return this.addNewNode(id + '_0', name + '_0')
    }
  }

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewNode(id: string, name: string): Class_NodeElement {
    if (!this._nodes[id]) {
      // Create node
      const node = this.createNewNode(id, name)
      // Set node to default position
      node.initDefaultPosXY()
      // Update registry of nodes
      this._addNode(node)
      return node
    }
    else {
      return this.addNewNode(id + '_0', name + '_0')
    }
  }

  /**
   * Create and add a node for this Sankey with default name
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultNode(): Class_NodeElement {
    const n = String(Object.values(this._nodes).length)
    const id = 'node' + n
    const name = 'Node ' + n
    return this.addNewNode(id, name)
  }

  /**
  * Get a specific node from this Sankey
  * @param {string} id
  * @return {*}
  * @memberof Class_Sankey
  */
  public getNode(id: string) {
    if (id in this._nodes) {
      return this._nodes[id]
    }
    return null
  }

  /**
   * Delete a given node from Sankey -> node may still exist somewhere
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public deleteNode(node: Class_NodeElement) {
    if (this._nodes[node.id] !== undefined) {
      // if we remove a node we also have to remove it link attached to it
      node.input_links_list.forEach(l => this.drawing_area.deleteLink(l as Class_LinkElement))
      node.output_links_list.forEach(l => this.drawing_area.deleteLink(l as Class_LinkElement))

      // Delete node in sankey
      const _ = this._nodes[node.id]
      delete this._nodes[node.id]
      _.delete()
    }
  }

  // Links related ----------------------------------------------------------------------

  /**
   * Create a new link from source to target
   *
   * @param {Class_NodeElement} source
   * @param {Class_NodeElement} target
   * @return {*}  {Class_LinkElement}
   * @memberof Class_Sankey
   */
  public addNewLink(
    source: Class_NodeElement,
    target: Class_NodeElement,
  ) {
    return this.addNewLinkWithId(
      defaultLinkId(source, target),
      source,
      target
    )
  }

  /**
   * Create a new link from source to target.
   * Check that we always have unique id
   *
   * @private
   * @param {string} id
   * @param {Class_NodeElement} source
   * @param {Class_NodeElement} target
   * @return {*}  {Class_LinkElement}
   * @memberof Class_Sankey
   */
  public addNewLinkWithId(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
  ): Class_LinkElement {
    if (!this._links[id]) {
      const link = this.createNewLink(id, source, target)
      this._addLink(link)
      return link
    }
    else {
      return this.addNewLinkWithId(
        id + ' (dup)',
        source,
        target)
    }
  }

  /**
   * Create a new default link : select a default source and default target
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultLink() {
    let source: Class_NodeElement
    let target: Class_NodeElement
    if (this.nodes_list.length > 2) {
      source = this.nodes_list[0]
      target = this.nodes_list[1]
    }
    else if (this.nodes_list.length == 1) {
      source = this.nodes_list[0]
      target = this.addNewDefaultNode()
      target.setPosXY(source.position_x + 100, source.position_y + 100)
    }
    else {
      source = this.addNewDefaultNode() // Set with default position
      target = this.addNewDefaultNode()
      target.setPosXY(source.position_x + 100, source.position_y + 100)
    }
    return this.addNewLink(source, target)
  }

  /**
   * Get link object by its id
   *
   * @param {string} id
   * @return {*}
   * @memberof Class_Sankey
   */
  public getLink(id: string) {
    if (id in this._links) {
      return this._links[id]
    }
    return null
  }

  /**
   * Remove a given link from sankey
   * @param {Class_LinkElement} link
   * @memberof Class_Sankey
   */
  public removeLink(link: Class_LinkElement) {
    delete this._links[link.id]
  }



  // TODO : add correct keyword in test 'if('extensions' in (l?.value??{}))' 
  // when MFADATA will be implemented with class
  /**
   * Test if data is reconcilied by searching some key word in links value
   * (keyword like : free_mini,free_maxi,data_value,data_source,...)
   *
   * @memberof Class_Sankey
   */
  public linkValueHasReconciliedData = () => {
    return this.links_list.some(link => link.has_result)
  }

  // Style related -----------------------------------------------------------------------

  /**
   * Create a new default style for node
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultNodeStyle() {
    const _ = String(this.node_styles_list.length)
    const id = makeId('id')
    return this.addNewNodeStyle(
      'style_node_' + id,
      'Style ' + _)
  }

  /**
   * Create a new style for node
   * @param {string} id
   * @param {string} name
   * @return {*}  {Class_NodeStyle}
   * @memberof Class_Sankey
   */
  public addNewNodeStyle(
    id: string,
    name: string
  ): Class_NodeStyle {
    if (!this._node_styles[id]) {
      const style = new Class_NodeStyle(id, name, true)
      this._node_styles[id] = style
      return style
    }
    else {
      return this.addNewNodeStyle(id + ' (dup)', name)
    }
  }
  public addNewContainerStyle(
    id: string,
    name: string
  ): Class_ContainerStyle {
    if (!this._node_styles[id]) {
      const style = new Class_ContainerStyle(id, name, true)
      this._container_styles[id] = style
      return style
    }
    else {
      return this.addNewContainerStyle(id + ' (dup)', name)
    }
  }

  /**
   * Delete a given style
   * @param {Class_NodeStyle} style
   * @memberof Class_Sankey
   */
  public deleteNodeStyle(style: Class_NodeStyle) {
    if (this._node_styles[style.id] !== undefined) {
      this._node_styles[style.id].delete()
      delete this._node_styles[style.id]
    }
  }

  /**
   * Create a new default style for link
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultLinkStyle() {
    const _ = String(this.link_styles_list.length)
    const id = makeId('id')
    return this.addNewLinkStyle(
      'style_link_' + id,
      'Style ' + _)
  }

  public addNewDefaultContainerStyle() {
    const _ = String(this.container_styles_list.length)
    const id = makeId('id')
    return this.addNewContainerStyle(
      'style_link_' + id,
      'Style ' + _)
  }

  /**
   * Create a new style for link
   * @param {string} id
   * @param {string} name
   * @return {*}  {LinkAttributes}
   * @memberof Class_Sankey
   */
  public addNewLinkStyle(
    id: string,
    name: string
  ): Class_LinkStyle {
    if (!this._link_styles[id]) {
      const style = new Class_LinkStyle(id, name, true)
      this._link_styles[id] = style
      return style
    }
    else {
      return this.addNewLinkStyle(id + ' (dup)', name)
    }
  }

  /**
   * Delete a given style
   * @param {Class_NodeStyle} style
   * @memberof Class_Sankey
   */
  public deleteLinkStyle(style: Class_LinkStyle) {
    if (this._link_styles[style.id] !== undefined) {
      this._link_styles[style.id].delete()
      delete this._link_styles[style.id]
    }
  }

  public deleteContainerStyle(style: Class_ContainerStyle) {
    if (this._container_styles[style.id] !== undefined) {
      this._container_styles[style.id].delete()
      delete this._container_styles[style.id]
    }
  }

  /**
 * Return style of selected nodes
 *
 * @return {*} 
 * @memberof Class_Sankey
 */
  public getStyleOfSelectedNodes() {
    const selected_nodes = this.drawing_area.selected_nodes_list
    if (selected_nodes.length !== 0) {
      const style = selected_nodes[0].style
      const list_id_style = style.map(s => s.id)
      let inchangee = true
      selected_nodes.forEach(node => {
        inchangee = (node.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
      })

      return (inchangee) ?
        CutName([...style].reverse()[0].name, 25) :
        this.drawing_area.application_data.t('Noeud.multi_style')
    }
    else {
      return default_style_id
    }
  }

  /**
  * Function that change selected nodes style and save undo
  *
  * @param {Class_NodeStyle} n_style
  */
  public switchNodeStyle(n_style: Class_NodeStyle, add: boolean) {
    const selected_nodes = this.drawing_area.selected_nodes_list
    const { ref_selected_style_node } = this.drawing_area.application_data.menu_configuration
    const curr_style: { [x: string]: Class_NodeStyle[] } = {}
    selected_nodes.map(node => {
      curr_style[node.id] = node.style
    })
    // Method to get old style via undo
    const inv_switchToStyle = () => {
      selected_nodes.map(node => {
        node.style = curr_style[node.id]
      })
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    // Method to get new style via redo
    const _switchToStyle = () => {
      ref_selected_style_node.current = n_style.id
      selected_nodes.map(node => {
        const list_id_style_node = node.style.map(s => s.id)
        if (list_id_style_node.includes(n_style.id) && !add) {
          const idx = node.style.findIndex(style => style.id == n_style.id)
          node.style.splice(idx, 1)
        }
        if (!list_id_style_node.includes(n_style.id) && add) {
          node.style.push(n_style)
        }
      })
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    this.drawing_area.application_data.history.saveUndo(inv_switchToStyle)
    this.drawing_area.application_data.history.saveRedo(_switchToStyle)

    _switchToStyle()
  }

  /**
* Function that change selected nodes style and save undo
*
* @param {Class_NodeStyle} n_style
*/
  public switchContainerStyle(n_style: Class_ContainerStyle, add: boolean) {
    const selected_zdt = this.drawing_area.selected_containers_list
    const { ref_selected_style_container } = this.drawing_area.application_data.menu_configuration
    const curr_style: { [x: string]: Class_ContainerStyle[] } = {}
    selected_zdt.map(node => {
      curr_style[node.id] = node.style
    })
    // Method to get old style via undo
    const inv_switchToStyle = () => {
      selected_zdt.map(node => {
        node.style = curr_style[node.id]
      })
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToContainers()
    }

    // Method to get new style via redo
    const _switchToStyle = () => {
      ref_selected_style_container.current = n_style.id
      selected_zdt.map(node => {
        const list_id_style_node = node.style.map(s => s.id)
        if (list_id_style_node.includes(n_style.id) && !add) {
          const idx = node.style.findIndex(style => style.id == n_style.id)
          node.style.splice(idx, 1)
        }
        if (!list_id_style_node.includes(n_style.id) && add) {
          node.style.push(n_style)
        }
      })
      selected_zdt.forEach(zdt => zdt.draw())
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToContainers()
    }

    this.drawing_area.application_data.history.saveUndo(inv_switchToStyle)
    this.drawing_area.application_data.history.saveRedo(_switchToStyle)

    _switchToStyle()
  }

  /**
  *Function to delete all local value of attribute so the value used come from the style
  *
  * @memberof Class_Sankey
  */
  public resetAttrSelectedNodes() {
    const selected_nodes = this.drawing_area.selected_nodes_list as Class_NodeElement[]

    const curr_attr: { [x: string]: Class_NodeAttribute } = {}
    selected_nodes.map(node => {
      curr_attr[node.id] = node.display.attributes
    })
    // Method to get old attr via undo
    const inv_resetAttrToStyleVal = () => {
      selected_nodes.map(node => node.display.attributes = curr_attr[node.id])
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }
    // Method to get new attr via redo
    const _resetAttrToStyleVal = () => {
      selected_nodes.map(node => node.resetAttributes())
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    this.drawing_area.application_data.history.saveUndo(inv_resetAttrToStyleVal)
    this.drawing_area.application_data.history.saveRedo(_resetAttrToStyleVal)
    _resetAttrToStyleVal()
  }

  /**
   * Return style of selected links
   *
   * @return {*} 
   * @memberof Class_Sankey
   */
  public getStyleOfSelectedLinks() {
    const selected_links = this.drawing_area.selected_links_list
    if (selected_links.length !== 0) {
      const style = selected_links[0].style
      const list_id_style = style.map(s => s.id)

      let inchangee = true
      selected_links.map(link => {
        inchangee = (link.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
      })
      return (inchangee) ?
        CutName([...style].reverse()[0].name, 25) :
        this.drawing_area.application_data.t('Noeud.multi_style')
    }
    else {
      return default_style_id
    }
  }

  /**
   * Function that change selected links style and save undo
   *
   * @param {Class_LinkStyle} n_style
   */
  public switchLinkStyle(n_style: Class_LinkStyle, add: boolean) {
    const selected_links = this.drawing_area.selected_links_list
    const { ref_selected_style_link } = this.drawing_area.application_data.menu_configuration
    const curr_style: { [x: string]: Class_LinkStyle[] } = {}
    selected_links.map(link => {
      curr_style[link.id] = link.style
    })
    // Method to get old style via undo
    const inv_switchToStyle = () => {
      selected_links.map(link => {
        link.style = curr_style[link.id]
        link.drawWithNodes()
      })
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    // Method to get new style via redo
    const _switchToStyle = () => {
      ref_selected_style_link.current = n_style.id
      selected_links.map(link => {
        const list_id_style_node = link.style.map(s => s.id)
        if (list_id_style_node.includes(n_style.id) && !add) {
          const idx = link.style.findIndex(style => style.id == n_style.id)
          link.style.splice(idx, 1)
        }
        if (!list_id_style_node.includes(n_style.id) && add) {
          link.style.push(n_style)
        }
        link.drawWithNodes()
      })
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    this.drawing_area.application_data.history.saveUndo(inv_switchToStyle)
    this.drawing_area.application_data.history.saveRedo(_switchToStyle)

    _switchToStyle()
  }

  /**
    *Function to delete all local value of attribute so the value used come from the style
    *
  * @memberof Class_Sankey
  */
  public resetAttrSelectedLinks() {
    const selected_links = this.drawing_area.selected_links_list

    const curr_attr: { [x: string]: Class_LinkAttribute } = {}
    selected_links.map(link => {
      curr_attr[link.id] = link.display.attributes
    })
    // Method to get old attr via undo
    const inv_resetAttrToStyleVal = () => {
      selected_links.map(link => link.display.attributes = curr_attr[link.id])
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }
    // Method to get new attr via redo
    const _resetAttrToStyleVal = () => {
      selected_links.map(link => link.resetAttributes())
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    this.drawing_area.application_data.history.saveUndo(inv_resetAttrToStyleVal)
    this.drawing_area.application_data.history.saveRedo(_resetAttrToStyleVal)
    _resetAttrToStyleVal()
  }

  public addLevelTagGroup(
    id: string,
    name: string
  ): Class_LevelTagGroup {
    if (!this._level_taggs[id]) {
      // Create
      const tag_group = new Class_LevelTagGroup(id, name, this)
      tag_group.activated = true
      // Update
      this._level_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addLevelTagGroup(id + '_0', name + '_0')
    }
  }

  public addNodeTagGroup(
    id: string,
    name: string,
    with_a_tag: boolean = true
  ): Class_NodeTagGroup {
    if (!this._node_taggs[id]) {
      // Create
      const tag_group = new Class_NodeTagGroup(id, name, this, with_a_tag)
      // Update
      this._node_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addNodeTagGroup(id + '_0', name + '_0', with_a_tag)
    }
  }

  public addFluxTagGroup(
    id: string,
    name: string,
    with_a_tag: boolean = true
  ): Class_FluxTagGroup {
    if (!this._flux_taggs[id]) {
      // Create
      const tag_group = new Class_FluxTagGroup(id, name, this, with_a_tag)
      // Update
      this._flux_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addFluxTagGroup(id + '_0', name + '_0', with_a_tag)
    }
  }

  public addDataTagGroup(
    id: string,
    name: string,
    with_a_tag: boolean = true
  ): Class_DataTagGroup {
    if (!this._data_taggs[id]) {
      // Create
      const tag_group = new Class_DataTagGroup(id, name, this, with_a_tag)
      // Update value tree
      this.links_list.forEach(link => link.addDataTagGroup(tag_group))
      // Update
      this._data_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addDataTagGroup(id + '_0', name + '_0', with_a_tag)
    }
  }

  /**
   * Create a TagGroup and add it to to specified group
   *
   * @return {*}
   * @memberof Class_Sankey
   */
  public createTagGroup(type_group: Type_MacroTagGroup) {
    // Get a new id
    const n = Object.values(this.getTagGroupsAsDict(type_group)).length
    const id = type_group + n
    const name = 'Tag Group ' + n
    // Create
    if (type_group === 'level_taggs') {
      return this.addLevelTagGroup(id, name)
    }
    else if (type_group === 'node_taggs') {
      return this.addNodeTagGroup(id, name)
    }
    else if (type_group === 'flux_taggs') {
      return this.addFluxTagGroup(id, name)
    }
    else {
      return this.addDataTagGroup(id, name)
    }
  }

  /**
   * Properly remove tag group related to given id
   * @param {Type_MacroTagGroup} type_group
   * @param {string} id
   * @memberof Class_Sankey
   */
  public removeTagGroupWithId(type_group: Type_MacroTagGroup, id: string) {
    const macro_tag_group = this.getTagGroupsAsDict(type_group)
    if (macro_tag_group[id] !== undefined) {
      // Get Tag group
      const tag_group = macro_tag_group[id]
      // Prune value tree for data tags
      if (tag_group instanceof Class_DataTagGroup)
        this.links_list.forEach(link => link.removeDataTagGroup(tag_group))
      // Delete tag groupe properly
      tag_group.delete()
      // Remove reference to tag group
      delete macro_tag_group[id]
    }
  }

  /**
   * Properly remove tag group
   * @param {Type_MacroTagGroup} type_group
   * @param {Class_NodeTagGroup | Class_FluxTagGroup | Class_LevelTagGroup | Class_DataTagGroup} tagg
   * @memberof Class_Sankey
   */
  public removeTagGroup(
    type_group: Type_MacroTagGroup,
    tagg: Class_NodeTagGroup | Class_FluxTagGroup | Class_LevelTagGroup | Class_DataTagGroup
  ) {
    this.removeTagGroupWithId(type_group, tagg.id)
  }

  /**
   * Return list of group tag from specified group type
   * @param {Type_MacroTagGroup} type_group
   * @return {*}
   * @memberof Class_Sankey
   */
  public getTagGroupsAsList(type_group: Type_MacroTagGroup) {
    return Object.values(this.getTagGroupsAsDict(type_group))
  }

  /**
   * Return dict of group tag from specified group type
   * @param {Type_MacroTagGroup} type_group
   * @return {*}
   * @memberof Class_Sankey
   */
  public getTagGroupsAsDict(type_group: Type_MacroTagGroup) {
    if (type_group === 'node_taggs') {
      return this._node_taggs
    }
    else if (type_group === 'flux_taggs') {
      return this._flux_taggs
    }
    else if (type_group === 'data_taggs') {
      return this._data_taggs
    }
    else {
      return this._level_taggs
    }
  }

  /**
   * Update data tags random key to ensure that element's visibilty will be recalculated
   * @memberof Class_Sankey
   */
  public nodeTagsUpdated() {
    this._node_tags_fingerprint = randomId()
  }

  /**
   * Update data tags random key to ensure that element's visibilty will be recalculated
   * @memberof Class_Sankey
   */
  public fluxTagsUpdated() {
    this._flux_tags_fingerprint = randomId()
  }

  /**
   * Update data tags random key to ensure that element's visibilty will be recalculated
   * @memberof Class_Sankey
   */
  public dataTagsUpdated() {
    this._data_tags_fingerprint = randomId()
  }

  // PRIVATE METHODS ====================================================================

  // Nodes related ----------------------------------------------------------------------

  /**
   * Add a given node to Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  protected _addNode(node: Class_NodeElement) { this._nodes[node.id] = node }

  // Links related ----------------------------------------------------------------------

  /**
   * Add a given link to Sankey
   * @param {Class_LinkElement} link
   * @memberof Class_Sankey
   */
  private _addLink(link: Class_LinkElement) {
    this._links[link.id] = link
  }
  public get id(): string { return this._id }
  public set id(_) { this._id = _ }
  // Nodes related ----------------------------------------------------------------------

  /**
   * Get all nodes as dict
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_dict() {
    return this._nodes
  }

  /**
   * Sorts nodes from lower v coordinates to higher v
   * @memberof Class_Sankey
   */
  public sortNodes() {
    const echangeTag = this.node_taggs_dict['type de noeud'] ? this.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const sorted_nodes = this.nodes_list.filter(n => !echangeTag || !n.hasGivenTag(echangeTag))
    sorted_nodes.sort((n1, n2) => {
      if (n1.position_v >= 0 || n2.position_v >= 0) {
        return n1.position_v - n2.position_v
      } else {
        return n2.position_v - n1.position_v
      }
    })
    const import_nodes = this.nodes_list.filter(n =>
      echangeTag && n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )
    import_nodes.sort((n1, n2) => {
      if (n1.position_v >= 0 || n2.position_v >= 0) {
        return n1.position_v - n2.position_v
      } else {
        return n2.position_v - n1.position_v
      }
    })
    const export_nodes = this.nodes_list.filter(n =>
      echangeTag && n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
    )
    export_nodes.sort((n1, n2) => {
      if (n1.position_v >= 0 || n2.position_v >= 0) {
        return n1.position_v - n2.position_v
      } else {
        return n2.position_v - n1.position_v
      }
    })
    const all_nodes = [...import_nodes, ...sorted_nodes, ...export_nodes]
    this._nodes = Object.assign({}, ...all_nodes.map((n) => ({ [n.id]: n })))
  }

  /**
   * Get all nodes as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list(): Class_NodeElement[] {
    return Object.values(this._nodes)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list_sorted(): Class_NodeElement[] {
    return this.nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  /**
   * Get all visible nodes as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_nodes_list(): Class_NodeElement[] {
    return Object.values(this._nodes)
      .filter(node => node.is_visible)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_nodes_list_sorted(): Class_NodeElement[] {
    return this.visible_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  // Links related ----------------------------------------------------------------------

  /**
   * Return a dict with all the links of the sankey
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_dict() {
    return this._links
  }

  /**
   * Return a list with all the links of the sankey
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_list(): Class_LinkElement[] {
    return Object.values(this._links)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_list_sorted(): Class_LinkElement[] {
    return this.links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  /**
   * Get all visible links as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_links_list(): Class_LinkElement[] {
    return Object.values(this._links)
      .filter(node => node.is_visible)
  }

  /**
   * Get all links sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_links_list_sorted(): Class_LinkElement[] {
    return this.visible_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  // Styles related ---------------------------------------------------------------------

  /**
   * Return the object containing all the style
   * @readonly
   * @memberof Class_Sankey
   */
  public get node_styles_dict() {
    return this._node_styles
  }

  /**
   * Return default style for nodes
   * @readonly
   * @memberof Class_Sankey
   */
  public get default_node_style() {
    return this._node_styles[default_style_id]
  }

  /**
   * Return all the style as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get node_styles_list() {
    return Object.values(this._node_styles)
  }

  /**
   * Return all the style as a sorted list
   * @readonly
   * @memberof Class_Sankey
   */
  public get node_styles_list_sorted() {
    return this.node_styles_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  /**
   * Return the object containing all the style
   * @readonly
   * @memberof Class_Sankey
   */
  public get link_styles_dict() {
    return this._link_styles
  }

  /**
   * Return the object containing all the container styles
   * @readonly
   * @memberof Class_Sankey
   */
  public get container_styles_dict() {
    return this._container_styles
  }

  /**
   * Return all the style as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get link_styles_list() {
    return Object.values(this._link_styles)
  }

  /**
   * Return all the container styles as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get container_styles_list() {
    return Object.values(this._container_styles)
  }

  /**
   * Return all the style as a sorted list
   * @readonly
   * @memberof Class_Sankey
   */
  public get link_styles_list_sorted() {
    return this.link_styles_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }
  /**
   * Return all the container styles as a sorted list
   * @readonly
   * @memberof Class_Sankey
   */
  public get container_styles_list_sorted() {
    return this.container_styles_list
      .sort((a, b) => {
        // Tri par nom
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      })
  }
  // Tags related -----------------------------------------------------------------------

  public get node_taggs_dict() {
    return this._node_taggs
  }

  public get node_taggs_list() {
    return Object.values(this._node_taggs)
  }

  public get node_tags_fingerprint() {
    return this._node_tags_fingerprint
  }

  public get flux_taggs_dict() {
    return this._flux_taggs
  }

  public get flux_taggs_list() {
    return Object.values(this._flux_taggs)
  }

  public get flux_tags_fingerprint() {
    return this._flux_tags_fingerprint
  }

  public get data_taggs_dict() {
    return this._data_taggs
  }

  public get data_taggs_list() {
    return Object.values(this._data_taggs)
  }

  public get data_taggs_entries() {
    return Object.entries(this._data_taggs)
  }

  public get data_tags_fingerprint() {
    return this._data_tags_fingerprint
  }

  /**
   * Return an array  of id of tag selected of that data_taggs
   *
   * @readonly
   * @memberof Class_Sankey
   */
  public get selected_data_tags_list() {
    const data_tags: Class_DataTag[] = []
    this.data_taggs_list.forEach(data_tagg => {
      data_tags.push(...data_tagg.selected_tags_list)
    })
    return data_tags
  }

  /**
   * Return an object wherekey are data_taggs id ,
   * and value an array of id of tag selected of that data_taggs
   *
   * @readonly
   * @memberof Class_Sankey
   */
  public get selected_data_tags_entries() {
    const obj_data_tags_selected: { [x: string]: Class_DataTag } = {}
    this.data_taggs_list.forEach(data_tagg => {
      obj_data_tags_selected[data_tagg.id] = data_tagg.selected_tags_list[0]
    })
    return obj_data_tags_selected
  }

  /**
   * Return an array of possible path to link value,
   * it use the combinitation of all tags from different data_taggs
   *
   * Exemple :
   * [
   *
   * [grp1_key1,grp2_key1],
   *
   * [grp1_key1,grp2_key2],
   *
   * [grp1_key2,grp2_key1],
   *
   * [grp1_key2,grp2_key2],
   * ...
   * ]
   * *
   * @readonly
   * @memberof Class_Sankey
   */
  public get list_combinatorial_data_taggs_path() {
    const list_tag_by_grp: string[][] = []
    this.data_taggs_list.forEach(data_tagg => {
      list_tag_by_grp.push(data_tagg.tags_list.map(tag => tag.id))
    })
    return list_tag_by_grp
  }

  public get level_taggs_dict() {
    return this._level_taggs
  }

  public get level_taggs_list() {
    return Object.values(this._level_taggs)
  }

  protected createNewNodeStyle(id: string, name: string, is_deletable?: boolean): Class_NodeStyle {
    return new Class_NodeStyle(id, name, is_deletable)
  }
  // Icons
  public get icon_catalog(): { [x: string]: string } { return this._icon_catalog }
  public set icon_catalog(value: { [x: string]: string }) { this._icon_catalog = value }
  /**
   * Return the path of the icon, if it doesn't exist return an empty string
   *
   * @param {string} id_icon
   * @return {*}
   * @memberof Class_Sankey
   */
  public getIconFromCatalog(id_icon: string) {
    const icon = this.icon_catalog[id_icon]
    if (icon !== undefined && icon !== null) {
      return icon
    }
    return ''
  }
}
