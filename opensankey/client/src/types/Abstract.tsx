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
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================

import * as d3 from 'd3'
import type { TFunction } from 'i18next'
import type { Class_MenuConfig } from '../types/MenuConfig'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { ClassTemplate_ProtoElement } from '../Elements/Element'
import { Class_LinkStyle } from '../Elements/LinkAttributes'
import { Class_NodeStyle } from '../Elements/NodeAttributes'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_LinkElement } from '../Elements/Link'
import { Class_NodeElement } from '../Elements/Node'
import { Class_DrawingArea } from './DrawingArea'
import { Class_ApplicationData } from './ApplicationData'

// export abstract class ClassAbstract_ApplicationData {
//   // MAndatory methods
//   public abstract sendWaitingToast(
//     funct: () => void,
//     intake?: object
//   ): void
//   public abstract _add_waiting_process(
//     process_id: string,
//     process_func: () => void,
//     timer?:number
//   ):void
//   // Mandatory attributes
//   public abstract version: string
//   // Mandatory getters
//   public abstract get t(): TFunction
//   public abstract get history(): ClassAbstract_ApplicationHistory
//   public abstract get menu_configuration(): Class_MenuConfig
//   public abstract set language(_: string | undefined)
//   public abstract get language(): string | undefined
// }

export abstract class ClassAbstract_ApplicationHistory {
  public abstract saveUndo(f: () => void): void
  public abstract saveRedo(f: () => void): void
}

export abstract class ClassAbstract_DrawingArea {
  // Mandatory attributes
  public abstract application_data: Class_ApplicationData
  public abstract d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null
  public abstract d3_selection_zoom_area: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | null
  public abstract static: boolean
  public abstract bypass_redraws: boolean
  // Mandatory methods
  public abstract isInSelectionMode(): boolean
  public abstract isInEditionMode(): boolean
  //public abstract addElement(): number
  public abstract checkAndUpdateAreaSize(): void
  public abstract deleteNode(_: Class_NodeElement): void
  public abstract deleteLink(_: Class_LinkElement): void
  public abstract addNodeToSelection(_: Class_NodeElement): void
  public abstract removeNodeFromSelection(_: Class_NodeElement): void
  public abstract addLinkToSelection(_: Class_LinkElement): void
  public abstract removeLinkFromSelection(_: Class_LinkElement): void
  public abstract addLegendToSelection(): void
  public abstract removeLegendFromSelection(): void
  public abstract purgeSelection(): void
  public abstract closeAllMenus(): void
  public abstract updateFrom(other_drawing_area: ClassAbstract_DrawingArea, mode: string[]): void
  public abstract draw(): void
  public abstract orderElementOnDA(): void
  public abstract getNavBarHeight(): number
  public abstract getZoomScale():number
  // Mandatory getters
  public abstract get sankey(): ClassAbstract_Sankey
  public abstract get legend(): ClassTemplate_Legend
  public abstract get scale(): number
  public abstract get scaleValueToPx(): (_: number) => number
  public abstract get minimum_flux(): number | undefined
  public abstract get maximum_flux(): number | undefined
  public abstract get filter_link_value(): number
  public abstract get selected_nodes_list(): Class_NodeElement[]
  public abstract get node_contextualised(): Class_NodeElement | undefined
  public abstract set node_contextualised(_: Class_NodeElement | undefined)
  public abstract get selected_links_list(): Class_LinkElement[]
  public abstract get link_contextualised(): Class_LinkElement | undefined
  public abstract set link_contextualised(_: Class_LinkElement | undefined)
  public abstract get ghost_link(): Class_LinkElement | null
  public abstract set ghost_link(_: Class_LinkElement | null)
  public abstract get pointer_pos(): [number, number]
  public abstract set pointer_pos(_: [number, number])
  public abstract get filter_label(): number
  public abstract set filter_label(_: number)
  public abstract get type_data(): string
  public abstract get grid_size(): number
  // MAndatory setters
  public abstract set scale(_: number)
  public abstract get magnetic_nodes(): boolean
  public abstract set magnetic_nodes(b: boolean)
  public abstract get list_g_element(): ClassTemplate_ProtoElement[]

}

export abstract class ClassAbstract_Sankey {
  public abstract drawing_area: Class_DrawingArea
  // Mandatory getters
  public abstract get is_visible(): boolean
  public abstract get nodes_dict(): { [_: string]: Class_NodeElement }
  public abstract get nodes_list(): Class_NodeElement[]
  public abstract get nodes_list_sorted(): Class_NodeElement[]
  public abstract get visible_nodes_list(): Class_NodeElement[]
  public abstract get visible_nodes_list_sorted(): Class_NodeElement[]
  public abstract get links_dict(): { [_: string]: Class_LinkElement }
  public abstract get links_list(): Class_LinkElement[]
  public abstract get links_list_sorted(): Class_LinkElement[]
  public abstract get visible_links_list(): Class_LinkElement[]
  public abstract get visible_links_list_sorted(): Class_LinkElement[]
  public abstract get node_styles_dict(): { [id: string]: Class_NodeStyle }
  public abstract get default_node_style(): Class_NodeStyle
  public abstract get node_styles_list(): Class_NodeStyle[]
  public abstract get node_styles_list_sorted(): Class_NodeStyle[]
  public abstract get link_styles_dict(): { [id: string]: Class_LinkStyle }
  public abstract get default_link_style(): Class_LinkStyle
  public abstract get link_styles_list(): Class_LinkStyle[]
  public abstract get link_styles_list_sorted(): Class_LinkStyle[]
  public abstract get node_taggs_dict(): { [id: string]: ClassAbstract_ProtoTagGroup }
  public abstract get node_taggs_list(): ClassAbstract_ProtoTagGroup[]
  public abstract get node_tags_fingerprint(): string
  public abstract get flux_taggs_dict(): { [id: string]: ClassAbstract_ProtoTagGroup }
  public abstract get flux_taggs_list(): ClassAbstract_ProtoTagGroup[]
  public abstract get flux_tags_fingerprint(): string
  public abstract get data_taggs_dict(): { [id: string]: ClassAbstract_ProtoTagGroup }
  public abstract get data_taggs_list(): ClassAbstract_ProtoTagGroup[]
  public abstract get data_taggs_entries(): [string, ClassAbstract_ProtoTagGroup][]
  public abstract get data_tags_fingerprint(): string
  public abstract get selected_data_tags_list(): ClassAbstract_ProtoTag[]
  public abstract get selected_data_tags_entries(): { [id: string]: ClassAbstract_ProtoTag }
  public abstract get list_combinatorial_data_taggs_path(): string[][]
  public abstract get level_taggs_dict(): { [id: string]: ClassAbstract_ProtoLevelTagGroup }
  public abstract get level_taggs_list(): ClassAbstract_ProtoLevelTagGroup[]
  // Mandatory methods
  public abstract draw(): void
  public abstract addNewDefaultNode(): Class_NodeElement
  public abstract addNewNode(id: string, name: string): Class_NodeElement
  public abstract addNewLink(s: Class_NodeElement, t: Class_NodeElement): Class_LinkElement
  public abstract addNewLinkWithId(i: string, s: Class_NodeElement, t: Class_NodeElement): Class_LinkElement
  public abstract addNewNodeStyle(id: string, name: string): Class_NodeStyle
  public abstract addNewLinkStyle(id: string, name: string): Class_LinkStyle
  public abstract nodeTagsUpdated(): void
  public abstract fluxTagsUpdated(): void
  public abstract dataTagsUpdated(): void
  public abstract addLevelTagGroup(id: string,name: string): ClassAbstract_ProtoLevelTagGroup

  public abstract getIconFromCatalog(id_icon: string): string
  public abstract get containers_list(): ClassAbstract_ContainerElement[]
}

export abstract class ClassAbstract_ContainerElement {
  public abstract get label_width(): number
  public abstract get label_height(): number
}

export abstract class ClassAbstract_ProtoTagGroup {
  public abstract get id(): string
  public abstract get name(): string
  public abstract get tags_dict(): { [id: string]: ClassAbstract_ProtoTag }
  public abstract get tags_list(): ClassAbstract_ProtoTag[]
  public abstract get selected_tags_list(): ClassAbstract_ProtoTag[]
  public abstract get show_legend(): boolean
}

export abstract class ClassAbstract_ProtoLevelTagGroup {
  public abstract sibling_activated(): ClassAbstract_ProtoLevelTagGroup[]
  public abstract get id(): string
  public abstract get name(): string
  public abstract get tags_dict(): { [id: string]: ClassAbstract_ProtoLevelTag }
  public abstract get tags_list(): ClassAbstract_ProtoLevelTag[]
  public abstract get selected_tags_list(): ClassAbstract_ProtoLevelTag[]
  public abstract get activated(): boolean
  public abstract set activated(boolean)
}

export abstract class ClassAbstract_ProtoTag {

  public abstract setReferenceFromIds(list_id: string[]): void

  public abstract get id(): string
  public abstract get name(): string
  public abstract get color(): string
  public abstract get group(): ClassAbstract_ProtoTagGroup
}

export abstract class ClassAbstract_ProtoLevelTag {
  public abstract get id(): string
  public abstract get name(): string
  public abstract get color(): string
  public abstract get group(): ClassAbstract_ProtoLevelTagGroup
  public abstract get is_selected(): boolean
  public abstract get has_upper_dimensions(): boolean
  public abstract get dimensions_list_as_tag_for_children(): Class_NodeDimension[]
  public abstract get dimensions_list_as_tag_for_parent(): Class_NodeDimension[]
  public abstract addAsParentLevel(_: Class_NodeDimension): void
  public abstract removeParentLevel(_: Class_NodeDimension): void
  public abstract addAsChildrenLevel(_: Class_NodeDimension): void
  public abstract removeChildrenLevel(_: Class_NodeDimension): void
}


