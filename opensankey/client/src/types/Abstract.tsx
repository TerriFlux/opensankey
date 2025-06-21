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
import type { ClassAbstract_LinkElement, ClassAbstract_LinkStyle } from './AbstractLink'
import type { ClassAbstract_NodeElement, ClassAbstract_NodeStyle, ClassAbstract_NodeDimension } from '../types/AbstractNode'
import type { Class_MenuConfig } from '../types/MenuConfig'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { Type_GenericSankey } from './Types'

type TypeAbstract_LinkElement = ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
export type TypeAbstract_NodeElement = ClassAbstract_NodeElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
type Type_GenericDrawingArea = ClassAbstract_DrawingArea

export abstract class ClassAbstract_ApplicationData {
  // MAndatory methods
  public abstract sendWaitingToast(
    funct: () => void,
    intake?: object
  ): void
  public abstract _add_waiting_process(
    process_id: string,
    process_func: () => void,
    timer?:number
  ):void
  // Mandatory attributes
  public abstract version: string
  // Mandatory getters
  public abstract get t(): TFunction
  public abstract get history(): ClassAbstract_ApplicationHistory
  public abstract get menu_configuration(): Class_MenuConfig
  public abstract get node_label_separator(): string
  public abstract set node_label_separator(_: string)
  public abstract get node_label_separator_part(): 'before' | 'after'
  public abstract set node_label_separator_part(_: 'before' | 'after')
  public abstract set language(_: string | undefined)
  public abstract get language(): string | undefined
}

export abstract class ClassAbstract_ApplicationHistory {
  public abstract saveUndo(f: () => void): void
  public abstract saveRedo(f: () => void): void
}

export abstract class ClassAbstract_DrawingArea {
  // Mandatory attributes
  public abstract application_data: ClassAbstract_ApplicationData
  public abstract d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null
  public abstract d3_selection_zoom_area: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | null
  public abstract static: boolean
  public abstract bypass_redraws: boolean
  // Mandatory methods
  public abstract isInSelectionMode(): boolean
  public abstract isInEditionMode(): boolean
  public abstract addElement(): number
  public abstract checkAndUpdateAreaSize(): void
  public abstract deleteNode(_: TypeAbstract_NodeElement): void
  public abstract deleteLink(_: TypeAbstract_LinkElement): void
  public abstract addNodeToSelection(_: TypeAbstract_NodeElement): void
  public abstract removeNodeFromSelection(_: TypeAbstract_NodeElement): void
  public abstract addLinkToSelection(_: TypeAbstract_LinkElement): void
  public abstract removeLinkFromSelection(_: TypeAbstract_LinkElement): void
  public abstract addLegendToSelection(): void
  public abstract removeLegendFromSelection(): void
  public abstract purgeSelection(): void
  public abstract closeAllMenus(): void
  public abstract updateFrom(other_drawing_area: ClassAbstract_DrawingArea, mode: string[]): void
  public abstract draw(): void
  public abstract orderElementOnDA(): void
  public abstract computeParametricV(): void
  public abstract getNavBarHeight(): number
  public abstract getZoomScale():number
  // Mandatory getters
  public abstract get sankey(): ClassAbstract_Sankey
  public abstract get legend(): ClassTemplate_Legend<Type_GenericDrawingArea, Type_GenericSankey>
  public abstract get scale(): number
  public abstract get scaleValueToPx(): (_: number) => number
  public abstract get minimum_flux(): number | undefined
  public abstract get maximum_flux(): number | undefined
  public abstract get filter_link_value(): number
  public abstract get selected_nodes_list(): TypeAbstract_NodeElement[]
  public abstract get node_contextualised(): TypeAbstract_NodeElement | undefined
  public abstract set node_contextualised(_: TypeAbstract_NodeElement | undefined)
  public abstract get selected_links_list(): TypeAbstract_LinkElement[]
  public abstract get link_contextualised(): TypeAbstract_LinkElement | undefined
  public abstract set link_contextualised(_: TypeAbstract_LinkElement | undefined)
  public abstract get ghost_link(): TypeAbstract_LinkElement | null
  public abstract set ghost_link(_: TypeAbstract_LinkElement | null)
  public abstract get pointer_pos(): [number, number]
  public abstract set pointer_pos(_: [number, number])
  public abstract get filter_label(): number
  public abstract set filter_label(_: number)
  public abstract get type_data(): string
  public abstract get grid_size(): number
  public abstract get vertical_spacing() : number
  // MAndatory setters
  public abstract set scale(_: number)
  public abstract get magnetic_nodes(): boolean
  public abstract set magnetic_nodes(b: boolean)
  public abstract get list_g_element(): string[]

}

export abstract class ClassAbstract_Sankey {
  public abstract drawing_area: Type_GenericDrawingArea
  // Mandatory getters
  public abstract get is_visible(): boolean
  public abstract get nodes_dict(): { [_: string]: TypeAbstract_NodeElement }
  public abstract get nodes_list(): TypeAbstract_NodeElement[]
  public abstract get nodes_list_sorted(): TypeAbstract_NodeElement[]
  public abstract get visible_nodes_list(): TypeAbstract_NodeElement[]
  public abstract get visible_nodes_list_sorted(): TypeAbstract_NodeElement[]
  public abstract get links_dict(): { [_: string]: TypeAbstract_LinkElement }
  public abstract get links_list(): TypeAbstract_LinkElement[]
  public abstract get links_list_sorted(): TypeAbstract_LinkElement[]
  public abstract get visible_links_list(): TypeAbstract_LinkElement[]
  public abstract get visible_links_list_sorted(): TypeAbstract_LinkElement[]
  public abstract get node_styles_dict(): { [id: string]: ClassAbstract_NodeStyle }
  public abstract get default_node_style(): ClassAbstract_NodeStyle
  public abstract get node_styles_list(): ClassAbstract_NodeStyle[]
  public abstract get node_styles_list_sorted(): ClassAbstract_NodeStyle[]
  public abstract get link_styles_dict(): { [id: string]: ClassAbstract_LinkStyle }
  public abstract get default_link_style(): ClassAbstract_LinkStyle
  public abstract get link_styles_list(): ClassAbstract_LinkStyle[]
  public abstract get link_styles_list_sorted(): ClassAbstract_LinkStyle[]
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
  public abstract get unit_data_tag(): string | null | undefined
  public abstract get unit_first_datatag(): string | null | undefined
  // Mandatory methods
  public abstract draw(): void
  public abstract addNewDefaultNode(): TypeAbstract_NodeElement
  public abstract addNewNode(id: string, name: string): TypeAbstract_NodeElement
  public abstract addNewLink(s: TypeAbstract_NodeElement, t: TypeAbstract_NodeElement): TypeAbstract_LinkElement
  public abstract addNewLinkWithId(i: string, s: TypeAbstract_NodeElement, t: TypeAbstract_NodeElement): TypeAbstract_LinkElement
  public abstract addNewNodeStyle(id: string, name: string): ClassAbstract_NodeStyle
  public abstract addNewLinkStyle(id: string, name: string): ClassAbstract_LinkStyle
  public abstract nodeTagsUpdated(): void
  public abstract fluxTagsUpdated(): void
  public abstract dataTagsUpdated(): void
  public abstract addLevelTagGroup(id: string,name: string): ClassAbstract_ProtoLevelTagGroup
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
  public abstract get dimensions_list_as_tag_for_children(): ClassAbstract_NodeDimension[]
  public abstract get dimensions_list_as_tag_for_parent(): ClassAbstract_NodeDimension[]
  public abstract addAsParentLevel(_: ClassAbstract_NodeDimension): void
  public abstract removeParentLevel(_: ClassAbstract_NodeDimension): void
  public abstract addAsChildrenLevel(_: ClassAbstract_NodeDimension): void
  public abstract removeChildrenLevel(_: ClassAbstract_NodeDimension): void
}


