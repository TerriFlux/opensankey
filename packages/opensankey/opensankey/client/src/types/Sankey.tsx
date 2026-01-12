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
import { base_styles, elementStyleConfigs, ElementStyleConfigsDict, ElementStyleKey } from '../Elements/ElementStyle'
import { Class_LinkElement, defaultLinkId, sortLinksElementsByIds } from '../Elements/Link'
import { Class_NodeElement } from '../Elements/Node'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_DataTag } from '../types/Tag'
import { Class_NodeTagGroup, Class_FluxTagGroup, Class_DataTagGroup, Class_LevelTagGroup } from './TagGroup'
import {
  default_main_sankey_id,
  default_style_id,
  Type_MacroTagGroup,
  randomId,
  CutName,
  makeId,
  default_style_name,
} from '../types/Utils'
import { sortNodesElements } from '../Elements/NodeBase'
import {
  ALL_ATTRIBUTES_CONFIG,
  Type_customisable_style_attr
} from '../Elements/ElementsAttributesConfig'
import { Class_ElementStyle, Class_ProtoElement, StorageType } from '../Elements/Element'
import { Class_ContainerElement } from '../Elements/TextZone'

export class Class_Sankey {
  public drawing_area: Class_DrawingArea

  private _id: string
  public name: string
  protected _is_visible: boolean = true

  protected _nodes: { [_: string]: Class_NodeElement } = {}
  private _links: { [_: string]: Class_LinkElement } = {}
  protected _containers: { [_: string]: Class_ContainerElement } = {}
  protected _container_activated: boolean = true
  public _styles: { [_: string]: Class_ElementStyle } = {}

  public _node_taggs: { [_: string]: Class_NodeTagGroup } = {}
  public _flux_taggs: { [_: string]: Class_FluxTagGroup } = {}
  public _data_taggs: { [_: string]: Class_DataTagGroup } = {}
  public _level_taggs: { [_: string]: Class_LevelTagGroup } = {}
  protected _nodes_dimensions: { [_: string]: Class_NodeDimension } = {}
  protected _node_tags_fingerprint: string
  protected _flux_tags_fingerprint: string
  protected _data_tags_fingerprint: string

  private _icon_catalog: { [x: string]: string } = {}

  public normalised_link?: Class_LinkElement

  constructor(
    drawing_area: Class_DrawingArea,
    id: string = default_main_sankey_id
  ) {
    this.drawing_area = drawing_area
    this._id = id
    this.name = this.id
    this._node_tags_fingerprint = randomId()
    this._flux_tags_fingerprint = randomId()
    this._data_tags_fingerprint = randomId()

    this._icon_catalog = {}

    this._styles[default_style_id] = this.createNewElementStyle(default_style_id, default_style_name, false)
    base_styles.forEach(style_id => this.create_node_internal_style(style_id, elementStyleConfigs))
  }

  public get dimensions_list() {
    return Object.values(this._nodes_dimensions)
  }

  public delete() {
    // Properly delete all nodes & link
    this.nodes_list.forEach(n => { n.delete() /* Will also trigger delete() on links*/ })
    this.containers_list.forEach(container => container.delete())
    this._containers = {}

    this._nodes = {}
    this._links = {}
    this.styles_list.forEach(sn => {
      sn.delete()
    })
    this._styles = {}

    this.node_taggs_list.forEach(grp => grp.delete())
    this.flux_taggs_list.forEach(grp => grp.delete())
    this.data_taggs_list.forEach(grp => grp.delete())
    this.level_taggs_list.forEach(grp => grp.delete())
    this._node_taggs = {}
    this._flux_taggs = {}
    this._data_taggs = {}
    this._level_taggs = {}
    this.dimensions_list.forEach(dim => dim.delete())
  }

  public setVisible() { this._is_visible = true }
  public setInvisible() { this._is_visible = false }
  public toggleVisibility() { this._is_visible = !this._is_visible }
  public get is_visible() { return this._is_visible }



  public delete_all_nodes_and_links() {
    // Properly delete all nodes & link (links will be deleted by node.delete())      
    this.nodes_list.forEach(n => {
      n.delete() // Will also trigger delete() on links
    })
    this._nodes = {}
    this._links = {}
  }

  public update() {
    this.dimensions_list.forEach(dimension => {
      dimension.unsetForcingToShow()
    })
  }

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
    Object.entries(sankey_to_copy._styles)
      .forEach(([idx, style_to_copy]) => {
        this.addNewElementStyle(idx, style_to_copy.name)
          .copyFrom(style_to_copy)
      })
    // Object.entries(sankey_to_copy._link_styles)
    //   .forEach(([idx, link_style_to_copy]) => {
    //     this.addNewLinkStyle(idx, link_style_to_copy.name)
    //       .copyFrom(link_style_to_copy)
    //   })
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
    Object.entries(sankey_to_copy._containers)
      .forEach(([idx, container_to_copy]) => {
        this.addNewContainer(idx,container_to_copy.name)
          .copyFrom(container_to_copy)
      })
    // Copy icon catalog fom sankey
    Object.entries(sankey_to_copy.icon_catalog)
      .forEach(([idx, icon_path]) => {
        this._icon_catalog[idx] = icon_path
      })
  }

  public get container_activated() { return this._container_activated }
  public set container_activated(_) { this._container_activated = _ }

  public isMouseOverAnExistingContainer(): boolean {
    let cont_id: string
    for (cont_id in this.containers_dict) {
      if (this.containers_dict[cont_id].isMouseOver())
        return true
    }
    return false
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
  public create_node_internal_style(id: ElementStyleKey, configs: ElementStyleConfigsDict) {
    if (this._styles[id]) {
      return
    }
    const new_style = this.createNewElementStyle(id, configs[id].name, true)
    const config = configs[id].config

    Object.keys(config).forEach(key => {
      new_style.customisable_attribute[key as Type_customisable_style_attr] = true
      //@ts-expect-error xxx
      new_style[key] = config[key]
    }
    )
    this._styles[id] = new_style
  }

  public draw() {
    // // Draw links
    // this.links_list.forEach(link => link.draw())
    // Draw nodes
    this.nodes_list.forEach(node => node.draw())
    this.containers_list.forEach(container => container.draw())
    //this.nodes_list.forEach(node => node.unDraw())
    //this.visible_nodes_list_sorted.forEach(node => node.draw()) 
    this.drawing_area.orderElementOnDA()
  }
  public linkValueHasReconciliedData = () => {
    return this.links_list.some(link => link.has_result)
  }
  public get id(): string { return this._id }
  public set id(_) { this._id = _ }

  /////////////////////////////////////////////////////////////////////////////
  // Gestion des éléments
  ////////////////////////////////////////////////////////////////////////////
  public elementFromId(id: string) {
    if (id in this.nodes_dict) {
      return this.nodes_dict[id]
    }
    if (id in this.links_dict) {
      return this.links_dict[id]
    }
    if (id in this.containers_dict) {
      return this.containers_dict[id]
      //return { id: cont.id, name: cont.title, is_selected: cont.is_selected, is_visible: cont.is_visible }
    }

    return { name: id, is_selected: false, is_visible: false }
  }

  public get elements_list() { return [...this.nodes_list, ...this.links_list, ...this.containers_list] }
  public get visible_elements_list() { return this.elements_list.filter(el => el.is_visible) }

  public get nodes_dict() { return this._nodes }
  public get nodes_list(): Class_NodeElement[] { return Object.values(this._nodes) }
  public get nodes_list_sorted(): Class_NodeElement[] { return this.nodes_list.sort((a, b) => sortNodesElements(a, b)) }
  public get visible_nodes_list(): Class_NodeElement[] { return Object.values(this._nodes).filter(node => node.is_visible) }
  public get visible_nodes_list_sorted(): Class_NodeElement[] { return this.visible_nodes_list.sort((a, b) => sortNodesElements(a, b)) }

  public get links_dict() { return this._links }
  public get links_list(): Class_LinkElement[] { return Object.values(this._links) }
  public get links_list_sorted(): Class_LinkElement[] { return this.links_list.sort((a, b) => sortLinksElementsByIds(a, b)) }
  public get visible_links_list(): Class_LinkElement[] { return Object.values(this._links).filter(node => node.is_visible) }
  public get visible_links_list_sorted(): Class_LinkElement[] { return this.visible_links_list.sort((a, b) => sortLinksElementsByIds(a, b)) }

  public get containers_dict() { return this._containers }
  public get containers_list() { return Object.values(this._containers) }
  public get containers_list_sorted() { return this.containers_list.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)) }
  public get visible_containers_list() { return this.containers_list.filter(zdt => zdt.is_visible) }

  private _addLabel(zdt: Class_ContainerElement) { this._containers[zdt.id] = zdt }
  private _addNode(node: Class_NodeElement) { this._nodes[node.id] = node }
  private _addLink(link: Class_LinkElement) { this._links[link.id] = link }

  protected createNewNode(id: string, name: string): Class_NodeElement {
    const node = new Class_NodeElement(id, name, this.drawing_area)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElement, target: Class_NodeElement): Class_LinkElement {
    const link = new Class_LinkElement(id, source, target, this.drawing_area)
    return link
  }

  public addNewNode(id: string, name: string): Class_NodeElement {
    if (!this._nodes[id]) {
      // Create node
      const node = this.createNewNode(id, name)
      // Set node to default position
      node.draw()
      // Update registry of nodes
      this._addNode(node)
      return node
    }
    else {
      return this.addNewNode(id + '_0', name + '_0')
    }
  }
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
  public addNewContainer(id: string, name: string): Class_ContainerElement {
    if (!this._containers[id]) {
      // Create node
      const zdt = new Class_ContainerElement(
        id,
        name,
        this.drawing_area)
      // Set node to default position
      zdt.draw()
      // Update registry of nodes
      this._addLabel(zdt)
      return zdt
    }
    else {
      return this.addNewContainer(id + '_0', name)
    }
  }

  public addNewDefaultNode(): Class_NodeElement {
    const n = String(Object.values(this._nodes).length)
    const id = 'node' + n
    const name = 'Node ' + n
    return this.addNewNode(id, name)
  }
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
  public addNewDefaultContainer() {
    const n = String(Object.values(this._containers).length)
    const id = 'shape' + n
    const name = 'Forme ' + n
    return this.addNewContainer(id, name)
  }

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
      //node.initDefaultPosXY()
      // Update registry of nodes
      this._addNode(node)
      return node
    }
    else {
      return this.addNewNode(id + '_0', name + '_0')
    }
  }
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
  public deleteLink(link: Class_LinkElement) { delete this._links[link.id] }
  public deleteContainer(container: Class_ContainerElement) { delete this._containers[container.id] }

  /////////////////////////////////////////////////////////////////////////////
  // Gestion des styles
  ////////////////////////////////////////////////////////////////////////////

  public deleteLocalAttrSelectedElements(k: keyof typeof ALL_ATTRIBUTES_CONFIG, selected_elements_list: Class_ProtoElement[]) {
    selected_elements_list.forEach(link => {
      if (k in ALL_ATTRIBUTES_CONFIG) {
        link.delete_attribute(k)
        link.draw()
      }
    })
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  public createNewElementStyle(id: string, name: string, is_deletable?: boolean): Class_ElementStyle {
    return new Class_ElementStyle(
      ALL_ATTRIBUTES_CONFIG, id, name, is_deletable!, this.default_style, this.drawing_area
    )
  }

  public get default_style() { return this._styles[default_style_id] }

  public addNewDefaultElementStyle() {
    const _ = String(this.styles_list.length)
    const id = makeId('id')
    return this.addNewElementStyle(
      'style_node_' + id,
      'Style ' + _)
  }

  public addNewElementStyle(
    id: string,
    name: string
  ): Class_ElementStyle {
    if (!this._styles[id]) {
      const style = new Class_ElementStyle(
        ALL_ATTRIBUTES_CONFIG,
        id, name, true, this.default_style, this.drawing_area
      )
      this._styles[id] = style
      return style
    }
    else {
      return this.addNewElementStyle(id + ' (dup)', name)
    }
  }

  public deleteElementStyle(style: Class_ElementStyle) {
    if (this._styles[style.id] !== undefined) {
      this._styles[style.id].delete()
      delete this._styles[style.id]
    }
  }

  public getStyleOfSelectedElements() {
    const selected_nodes = this.drawing_area.selected_elements_list
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

  public switchElementStyle(n_style: Class_ElementStyle, add: boolean) {
    const selected_nodes = this.drawing_area.selected_elements_list
    const { ref_selected_style } = this.drawing_area.application_data.menu_configuration
    const curr_style: { [x: string]: Class_ElementStyle[] } = {}
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
      ref_selected_style.current = n_style.id
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

  public resetAttrSelectedElements() {
    const selected_nodes = this.drawing_area.selected_elements_list

    const curr_attr: { [x: string]: StorageType<typeof ALL_ATTRIBUTES_CONFIG> } = {}
    selected_nodes.map(node => {
      curr_attr[node.id] = node.attributes
    })
    // Method to get old attr via undo
    const inv_resetAttrToStyleVal = () => {
      selected_nodes.map(node => node.attributes = curr_attr[node.id])
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


  public get styles_dict() { return this._styles }
  public get element_default_style() { return this._styles[default_style_id] }
  public get styles_list() { return Object.values(this._styles) }
  public get styles_list_sorted() {
    return this.styles_list
      .sort((a, b) => sortNodesElements(a, b))
  }


  /////////////////////////////////////////////////////////////////////////////
  //  Gestions des tags et dimensions
  /////////////////////////////////////////////////////////////////////////////

  public addNodeDimension(dim: Class_NodeDimension) {
    if (this._nodes_dimensions[dim.id + dim.parent.id]) {
      return
    }
    this._nodes_dimensions[dim.id + dim.parent.id] = dim
  }

  public removeNodeDimension(dim: Class_NodeDimension) {
    if (!this._nodes_dimensions[dim.id + dim.parent.id]) {
      return
    }
    delete this._nodes_dimensions[dim.id + dim.parent.id]
  }

  public showAccordingToLevelTags() {
    Object.values(this._nodes_dimensions).forEach(dim => {
      dim.unsetForcingToShow()
    })
  }

  public addLevelTagGroup(
    id: string,
    name: string
  ): Class_LevelTagGroup {
    if (!this._level_taggs[id]) {
      // Create
      const tag_group = new Class_LevelTagGroup(id, name, this, false)
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

  public removeTagGroup(
    type_group: Type_MacroTagGroup,
    tagg: Class_NodeTagGroup | Class_FluxTagGroup | Class_LevelTagGroup | Class_DataTagGroup
  ) {
    this.removeTagGroupWithId(type_group, tagg.id)
  }


  public getTagGroupsAsList(type_group: Type_MacroTagGroup) {
    return Object.values(this.getTagGroupsAsDict(type_group))
  }

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

  public nodeTagsUpdated() { this._node_tags_fingerprint = randomId() }
  public fluxTagsUpdated() { this._flux_tags_fingerprint = randomId() }
  public dataTagsUpdated() { this._data_tags_fingerprint = randomId() }

  public get selected_node_tags_links_list(): Class_LinkElement[] {
    return Object.values(this._links)
      .filter(link =>
        link.source.are_related_node_tags_selected && link.target.are_related_node_tags_selected
      )
  }
  public get selected_tags_nodes_list(): Class_NodeElement[] {
    return Object.values(this._nodes)
      .filter(node => node.are_related_node_tags_selected)
  }

  public get node_taggs_dict() { return this._node_taggs }
  public get node_taggs_list() { return Object.values(this._node_taggs) }
  public get node_tags_fingerprint() { return this._node_tags_fingerprint }

  public get flux_taggs_dict() { return this._flux_taggs }
  public get flux_taggs_list() { return Object.values(this._flux_taggs) }
  public get flux_tags_fingerprint() { return this._flux_tags_fingerprint }

  public get data_taggs_dict() { return this._data_taggs }
  public get data_taggs_list() { return Object.values(this._data_taggs) }
  public get data_taggs_entries() { return Object.entries(this._data_taggs) }
  public get data_tags_fingerprint() { return this._data_tags_fingerprint }

  public get selected_data_tags_list() {
    const data_tags: Class_DataTag[] = []
    this.data_taggs_list.forEach(data_tagg => {
      data_tags.push(...data_tagg.selected_tags_list)
    })
    return data_tags
  }

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

  public get level_taggs_dict() { return this._level_taggs }
  public get level_taggs_list() { return Object.values(this._level_taggs) }

  // Icons
  public get icon_catalog(): { [x: string]: string } { return this._icon_catalog }
  public set icon_catalog(value: { [x: string]: string }) { this._icon_catalog = value }
  public getIconFromCatalog(id_icon: string) {
    const icon = this.icon_catalog[id_icon]
    if (icon !== undefined && icon !== null) {
      return icon
    }
    return ''
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
      if (import_nodes[0].style.includes(this.styles_dict['NodeImportExportCloseStyle'])) {
        return 'close'
      } else {
        return 'above_below'
      }
    }
    return 'none'
  }

  public setTrade = (close: boolean) => {
    const node_styles_dict = this.styles_dict
    const link_styles_dict = this.styles_dict
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
}

