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
import { base_styles, elementStyleConfigs, ElementStyleConfigsDict, ElementStyleKey, LinkExportCloseStyle, LinkImportCloseStyle, LinkImportExportAboveBelowStyle, LinkImportExportCloseStyle, LinkStyle, NodeExportBelowStyle, NodeExportCloseStyle, NodeImportAboveStyle, NodeImportCloseStyle, NodeImportExportAboveBelowStyle, NodeImportExportCloseStyle, NodeSectorStyle, NodeStyle } from '../Elements/ElementStyle'
import { Class_LinkElement, defaultLinkId, sortLinksElementsByIds } from '../Elements/Link'
import { Class_NodeElement } from '../Elements/Node'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_DataTag } from '../types/Tag'
import { Class_NodeTagGroup, Class_FluxTagGroup, Class_DataTagGroup, Class_LevelTagGroup, Class_ViewTagGroup } from './TagGroup'
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
import { ALL_ATTRIBUTES_CONFIG, default_title_bold, default_title_font_size, default_title_id, default_title_text } from '../Elements/ElementsAttributesConfig'
import { Class_ElementStyle, Class_ProtoElement, StorageType } from '../Elements/Element'
import { Class_ContainerElement } from '../Elements/TextZone'

// One Ratio Flux constraint row (mirror of SankeyExcelParser
// iter_ratio_flux_constraints / the "Ratio Flux" Excel sheet). "*" on a side
// denotes an aggregate of all incoming/outgoing flux of the other node.
export type Type_RatioFluxConstraint = {
  origin: string,
  destination: string,
  origin_ref: string,
  destination_ref: string,
  coef: number | null,
  min: number | null,
  max: number | null,
  data_tag: string | null,
  data_tag_ref: string | null,
  traduction: string | null,
}

// One Ratio Stock Flux constraint row (#156, mirror of SankeyExcelParser
// iter_ratio_stock_flux_constraints / the "Ratio Stock Flux" Excel sheet):
//   flux[origin -> destination, période] = coef × S[stock, période réf]
export type Type_RatioStockFluxConstraint = {
  origin: string,
  destination: string,
  coef: number | null,
  min: number | null,
  max: number | null,
  stock: string,
  data_tag: string | null,
  data_tag_ref: string | null,
  traduction: string | null,
}

// One Stock Chaining constraint row (#156, mirror of
// iter_stock_chaining_constraints / the "Chaînage Stock" Excel sheet):
//   S[stock, période] = coef × S[stock, période réf] + Δstock[delta_stock, période]
export type Type_StockChainingConstraint = {
  stock: string,
  coef: number | null,
  delta_stock: string,
  data_tag: string | null,
  data_tag_ref: string | null,
  traduction: string | null,
}

// État d'affichage du tableur (UniverSpreadSheet) persisté par diagramme :
//   - active_sheet : onglet sélectionné à la réouverture (id Univer, ex. SHEET_ID_FLUX) ;
//   - sheet_overrides : choix explicites de visibilité d'onglet { [sheetId]: hidden } ;
//   - col_overrides : choix explicites de visibilité de colonne { [sheetId]: { [colIndex]: hidden } }.
// Tout est optionnel/additif : absent des anciens fichiers -> comportement par défaut (onglets vides
// masqués, colonnes par défaut, onglet Flux actif).
export type Type_SpreadsheetState = {
  active_sheet?: string,
  sheet_overrides?: { [sheetId: string]: boolean },
  col_overrides?: { [sheetId: string]: { [col: number]: boolean } },
}

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
  public _view_taggs: { [_: string]: Class_ViewTagGroup } = {}  // NOUVEAU

  // Tag groups ordering
  private _taggs_order: { [type: string]: string[] } = {
    'node_taggs': [],
    'flux_taggs': [],
    'data_taggs': [],
    'level_taggs': [],
    'view_taggs': [],
  }
  
  protected _nodes_dimensions: { [_: string]: Class_NodeDimension } = {}
  protected _node_tags_fingerprint: string
  protected _flux_tags_fingerprint: string
  protected _data_tags_fingerprint: string

  private _icon_catalog: { [x: string]: string } = {}

  // Ratio Flux constraints — diagram-level relations between flux (incl. the
  // %IS/%OS/... family), canonical representation shared with the Excel parser
  // (sankeyexcelparser#116). Stored natively because value_option per-link can
  // only express a subset (no flux<->flux, no min/max, no "*" aggregates).
  private _ratio_flux_constraints: Type_RatioFluxConstraint[] = []
  // Stock constraints (#156), same diagram-level canonical representation,
  // shared with the Excel parser and edited from the spreadsheet tabs.
  private _ratio_stock_flux_constraints: Type_RatioStockFluxConstraint[] = []
  private _stock_chaining_constraints: Type_StockChainingConstraint[] = []
  // État d'affichage du tableur Univer (onglet actif, onglets/colonnes masqués), persisté par
  // diagramme. Pure préférence d'UI (n'affecte pas le modèle/calcul). Voir Type_SpreadsheetState.
  private _spreadsheet_state: Type_SpreadsheetState = {}

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
    this._ratio_flux_constraints = []
    this._ratio_stock_flux_constraints = []
    this._stock_chaining_constraints = []
    this._spreadsheet_state = {}

    this._styles[default_style_id] = this.createNewElementStyle(default_style_id, default_style_name, false)
    base_styles.forEach(style_id => this.create_internal_style(style_id, elementStyleConfigs))
  }

  public get dimensions_list() {
    return Object.values(this._nodes_dimensions)
  }

  public get ratio_flux_constraints(): Type_RatioFluxConstraint[] {
    return this._ratio_flux_constraints
  }

  public set ratio_flux_constraints(_: Type_RatioFluxConstraint[]) {
    this._ratio_flux_constraints = _ ?? []
  }

  public get ratio_stock_flux_constraints(): Type_RatioStockFluxConstraint[] {
    return this._ratio_stock_flux_constraints
  }

  public set ratio_stock_flux_constraints(_: Type_RatioStockFluxConstraint[]) {
    this._ratio_stock_flux_constraints = _ ?? []
  }

  public get stock_chaining_constraints(): Type_StockChainingConstraint[] {
    return this._stock_chaining_constraints
  }

  public set stock_chaining_constraints(_: Type_StockChainingConstraint[]) {
    this._stock_chaining_constraints = _ ?? []
  }

  public get spreadsheet_state(): Type_SpreadsheetState {
    return this._spreadsheet_state
  }

  public set spreadsheet_state(_: Type_SpreadsheetState) {
    this._spreadsheet_state = _ ?? {}
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
    this.view_taggs_list.forEach(grp => grp.delete())  // NOUVEAU
    this._node_taggs = {}
    this._flux_taggs = {}
    this._data_taggs = {}
    this._level_taggs = {}
    this._view_taggs = {}  // NOUVEAU
    Object.keys(this._taggs_order).forEach(k => this._taggs_order[k] = [])
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
    // NOUVEAU : Copie des view tags
    Object.entries(sankey_to_copy._view_taggs)
      .forEach(([idx, view_tagg_to_copy]) => {
        this.addViewTagGroup(idx, view_tagg_to_copy.name)
          .copyFrom(view_tagg_to_copy)
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
        this.addNewContainer(idx, container_to_copy.name)
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
  public create_internal_style(id: ElementStyleKey, configs: ElementStyleConfigsDict) {
    if (this._styles[id]) {
      return
    }
    const new_style = this.createNewElementStyle(id, configs[id].name, true)
    const config = configs[id].config

    Object.keys(config).forEach(key => {
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

  /**
   * Retourne la zone de texte marquée comme titre du diagramme (ou undefined).
   */
  public getTitleContainer(): Class_ContainerElement | undefined {
    return this.containers_list.find(c => c.is_title)
  }

  /**
   * Retourne le container titre, en le créant s'il n'existe pas. À la création :
   * gras, plus gros, centré, sans cadre, positionné en haut et centré sur le
   * contenu. C'est une zone de texte normale, éditable via l'interface ZDT.
   */
  public getOrCreateTitleContainer(): Class_ContainerElement {
    const existing = this.getTitleContainer()
    if (existing) return existing
    const title = this.addNewContainer(default_title_id, default_title_text)
    title.is_title = true
    // Le titre édite un texte de label indépendant (name_label_text), il ne
    // renomme PAS la zone de texte (name reste l'identifiant interne).
    title.name_label_custom = true
    title.name_label_text = default_title_text
    title.name_label_bold = true
    title.name_label_font_size = default_title_font_size
    title.name_label_horiz = 'middle'
    title.shape_border_visible = false
    title.shape_color_visible = false
    const pos = this._computeTitleTopCenter(title.getShapeWidthToUse())
    title.setPosXY(pos.x, pos.y)
    return title
  }

  /**
   * Position par défaut du titre : centré horizontalement sur la bbox logique
   * des nœuds visibles, juste au-dessus.
   */
  private _computeTitleTopCenter(title_width: number): { x: number, y: number } {
    const nodes = this.visible_nodes_list
    if (nodes.length === 0) return { x: 0, y: 0 }
    let min_x = Infinity, max_x = -Infinity, min_y = Infinity
    nodes.forEach(n => {
      min_x = Math.min(min_x, n.position_x)
      max_x = Math.max(max_x, n.position_x + n.getShapeWidthToUse())
      min_y = Math.min(min_y, n.position_y)
    })
    return { x: (min_x + max_x) / 2 - title_width / 2, y: min_y - 60 }
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

    // Sauvegarder les styles actuels pour l'undo
    const curr_custom_styles: { [x: string]: Class_ElementStyle[] } = {}
    selected_nodes.forEach(node => {
      curr_custom_styles[node.id] = node.getCustomStyles()
    })

    // Method to get old style via undo
    const inv_switchToStyle = () => {
      selected_nodes.forEach(node => {
        node.replaceStyles(curr_custom_styles[node.id])
      })
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    // Method to get new style via redo
    const _switchToStyle = () => {
      ref_selected_style.current = n_style.id
      selected_nodes.forEach(node => {
        if (node.hasStyle(n_style.id) && !add) {
          // Retirer le style
          node.removeStyleById(n_style.id)
        }
        if (!node.hasStyle(n_style.id) && add) {
          // Ajouter le style
          node.addStyle(n_style)
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
    selected_nodes.forEach(node => {
      curr_attr[node.id] = node.attributes
    })

    // Method to get old attr via undo
    const inv_resetAttrToStyleVal = () => {
      selected_nodes.forEach(node => node.attributes = curr_attr[node.id])
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    // Method to get new attr via redo
    const _resetAttrToStyleVal = () => {
      selected_nodes.forEach(node => node.resetAttributes())
      this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    this.drawing_area.application_data.history.saveUndo(inv_resetAttrToStyleVal)
    this.drawing_area.application_data.history.saveRedo(_resetAttrToStyleVal)
    _resetAttrToStyleVal()
  }

  /**
   * Enlève toutes les surcharges d'un style par rapport au style par défaut
   * (équivalent de resetAttrSelectedElements, mais pour un style édité).
   */
  public resetAttrStyle(style: Class_ElementStyle) {
    const menu = this.drawing_area.application_data.menu_configuration
    const curr_attr = { ...style.attributes }

    const inv_resetAttrStyle = () => {
      style.attributes = { ...curr_attr }
      menu.updateAllComponentsRelatedToNodes()
      menu.updateComponentRelatedToStyles()
    }

    const _resetAttrStyle = () => {
      style.resetOverloadedAttributes()
      menu.updateAllComponentsRelatedToNodes()
      menu.updateComponentRelatedToStyles()
    }

    this.drawing_area.application_data.history.saveUndo(inv_resetAttrStyle)
    this.drawing_area.application_data.history.saveRedo(_resetAttrStyle)
    _resetAttrStyle()
  }

  /** Enlève une surcharge précise d'un style (équivalent deleteLocalAttrSelectedElements). */
  public deleteLocalAttrStyle(style: Class_ElementStyle, k: keyof typeof ALL_ATTRIBUTES_CONFIG) {
    if (k in ALL_ATTRIBUTES_CONFIG) {
      style.deleteAttribute(k as string)
      style.redrawReferences()
    }
    const menu = this.drawing_area.application_data.menu_configuration
    menu.updateAllComponentsRelatedToNodes()
    menu.updateComponentRelatedToStyles()
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
      if (!this._taggs_order['level_taggs'].includes(id))
        this._taggs_order['level_taggs'].push(id)
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addLevelTagGroup(id + '_0', name + '_0')
    }
  }
  // NOUVEAU : Méthode pour ajouter un ViewTagGroup
  public addViewTagGroup(
    id: string,
    name: string
  ): Class_ViewTagGroup {
    if (!this._view_taggs[id]) {
      const tag_group = new Class_ViewTagGroup(id, name, this, false)
      tag_group.activated = true
      tag_group.banner = 'one'
      this._view_taggs[id] = tag_group
      if (!this._taggs_order['view_taggs'].includes(id))
        this._taggs_order['view_taggs'].push(id)
      return tag_group
    }
    else {
      return this.addViewTagGroup(id + '_0', name + '_0')
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
      if (!this._taggs_order['node_taggs'].includes(id))
        this._taggs_order['node_taggs'].push(id)
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
      if (!this._taggs_order['flux_taggs'].includes(id))
        this._taggs_order['flux_taggs'].push(id)
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
      if (!this._taggs_order['data_taggs'].includes(id))
        this._taggs_order['data_taggs'].push(id)
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addDataTagGroup(id + '_0', name + '_0', with_a_tag)
    }
  }


  public createTagGroup(type_group: Type_MacroTagGroup, with_a_tag = true) {
    const n = Object.values(this.getTagGroupsAsDict(type_group)).length
    const id = type_group + n
    const name = 'Tag Group ' + n
    
    if (type_group === 'level_taggs') {
      return this.addLevelTagGroup(id, name)
    }
    else if (type_group === 'view_taggs') {  // NOUVEAU
      return this.addViewTagGroup(id, name)
    }
    else if (type_group === 'node_taggs') {
      return this.addNodeTagGroup(id, name, with_a_tag)
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
      // Remove from order
      const order = this._taggs_order[type_group]
      if (order) {
        const idx = order.indexOf(id)
        if (idx >= 0) order.splice(idx, 1)
      }
    }
  }

  public removeTagGroup(
    type_group: Type_MacroTagGroup,
    tagg: Class_NodeTagGroup | Class_FluxTagGroup | Class_LevelTagGroup | Class_DataTagGroup
  ) {
    this.removeTagGroupWithId(type_group, tagg.id)
  }


  public getTagGroupsAsList(type_group: Type_MacroTagGroup) {
    const dict = this.getTagGroupsAsDict(type_group)
    const order = this._taggs_order[type_group]
    if (order && order.length > 0)
      return order
        .filter(id => id in dict)
        .map(id => dict[id])
    return Object.values(dict)
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
    else if (type_group === 'level_taggs') {
      return this._level_taggs
    }
    else if (type_group === 'view_taggs') {  // NOUVEAU
      return this._view_taggs
    }
    else {
      return this._level_taggs  // Fallback
    }
  }

  public moveTagGroupUp(type_group: Type_MacroTagGroup, id: string) {
    const order = this._taggs_order[type_group]
    if (order) {
      const idx = order.indexOf(id)
      if (idx > 0) {
        order.splice(idx, 1)
        order.splice(idx - 1, 0, id)
      }
    }
  }

  public moveTagGroupDown(type_group: Type_MacroTagGroup, id: string) {
    const order = this._taggs_order[type_group]
    if (order) {
      const idx = order.indexOf(id)
      if (idx >= 0 && idx < order.length - 1) {
        order.splice(idx, 1)
        order.splice(idx + 1, 0, id)
      }
    }
  }

  public getTagGroupsOrder(type_group: Type_MacroTagGroup) {
    return this._taggs_order[type_group] ?? []
  }

  public setTagGroupsOrder(type_group: Type_MacroTagGroup, order: string[]) {
    this._taggs_order[type_group] = order
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
  public get view_taggs_dict() { return this._view_taggs }
  public get view_taggs_list() { return Object.values(this._view_taggs) }
  /**
   * Groupes de view tags en « mode filtre » (activés + view_mode), HORS les groupes
   * unitaires câblés (unitary/product_unitary/sector_unitary, qui ont leur propre
   * logique de voisinage dans is_unitary_tag). Sélectionner une étiquette d'un tel
   * groupe filtre la visibilité en court-circuitant les level tags (cf.
   * Node.viewTagVisibility). Visibilité seulement — pas de remontée vers les ancêtres.
   */
  public get view_mode_groups(): Class_ViewTagGroup[] {
    return this.view_taggs_list.filter(t =>
      t.activated && t.view_mode &&
      t.id !== 'unitary' && t.id !== 'product_unitary' && t.id !== 'sector_unitary')
  }
  /** True dès qu'au moins un groupe de view tags est en mode filtre. */
  public get view_mode_active(): boolean {
    return this.view_mode_groups.length > 0
  }
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

    const process_nodes = this.nodes_list
    const echangeTag = this.node_taggs_dict['type de noeud'].tags_dict['echange']
    const import_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )

    if (import_nodes.length > 0) {
      if (import_nodes[0].hasStyle(NodeImportExportCloseStyle)) {
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

    // Persister le mode (les nœuds import/export siblings étant régénérés au chargement,
    // leur style seul ne survit pas ; SplitIOrE lira ce drapeau).
    this.drawing_area.import_export_above_below = !close

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
      // Mode "close" pour les imports
      import_nodes.forEach((n, _i) => {
        // if (i == 0) n.sibling!.replaceStyles([
        //   node_styles_dict[NodeSectorStyle],
        //   node_styles_dict[NodeImportExportCloseStyle],
        // ])
        n.replaceStyles([
          node_styles_dict[NodeStyle],
          node_styles_dict[NodeImportExportCloseStyle],
          node_styles_dict[NodeImportCloseStyle]
        ])

        const firstOutputLink = n.getFirstOutputLink()
        if (firstOutputLink) {
          firstOutputLink.replaceStyles([
            node_styles_dict[LinkStyle],
            link_styles_dict[LinkImportExportCloseStyle],
            link_styles_dict[LinkImportCloseStyle]
          ])
        }
      })

      // Mode "close" pour les exports
      export_nodes.forEach(n => {
        n.replaceStyles([
          node_styles_dict[NodeStyle],
          node_styles_dict[NodeImportExportCloseStyle],
          node_styles_dict[NodeExportCloseStyle]
        ])

        const firstInputLink = n.getFirstInputLink()
        if (firstInputLink) {
          firstInputLink.replaceStyles([
            node_styles_dict[LinkStyle],
            link_styles_dict[LinkImportExportCloseStyle],
            link_styles_dict[LinkExportCloseStyle]
          ])
        }
      })
    } else {
      // Mode "above/below" pour les imports
      import_nodes.forEach((n, _i) => {
        // if (i == 0) n.sibling!.replaceStyles([
        //   node_styles_dict[NodeSectorStyle],
        //   node_styles_dict[NodeImportExportAboveBelowStyle],
        // ])
        n.replaceStyles([
          node_styles_dict[NodeStyle],
          node_styles_dict[NodeSectorStyle],
          node_styles_dict[NodeImportExportAboveBelowStyle],
          node_styles_dict[NodeImportAboveStyle]
        ])

        const firstOutputLink = n.getFirstOutputLink()
        if (firstOutputLink) {
          firstOutputLink.replaceStyles([
            node_styles_dict[LinkStyle],
            link_styles_dict[LinkImportExportAboveBelowStyle]
          ])
        }
      })

      // Mode "above/below" pour les exports
      export_nodes.forEach(n => {
        n.replaceStyles([
          node_styles_dict[NodeStyle],
          node_styles_dict[NodeSectorStyle],
          node_styles_dict[NodeImportExportAboveBelowStyle],
          node_styles_dict[NodeExportBelowStyle]
        ])

        const firstInputLink = n.getFirstInputLink()
        if (firstInputLink) {
          firstInputLink.replaceStyles([
            node_styles_dict[LinkStyle],
            link_styles_dict[LinkImportExportAboveBelowStyle]
          ])
        }
      })
    }

    this.drawing_area.nodePositioning.arrangeTrade(true)
    this.drawing_area.draw()
  }
}

