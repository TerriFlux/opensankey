// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 03/09/2024
// All rights reserved for TerriFlux SARL
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================

import * as d3 from 'd3'
import type { TFunction } from 'i18next'
import type { Class_AbstractLinkElement, Class_AbstractLinkStyle } from './AbstractLink'
import type { Class_AbstractNodeElement, Class_AbstractNodeStyle, Class_AbstractNodeDimension } from './AbstractNode'
import type { Class_MenuConfig } from './MenuConfig'
import { Class_Legend } from './Legend'
import { Type_GenericSankeyOS } from './TypesOS'

type Type_AbstractLinkElement = Class_AbstractLinkElement<Class_AbstractDrawingArea, Class_AbstractSankey>
type Type_AbstractNodeElement = Class_AbstractNodeElement<Class_AbstractDrawingArea, Class_AbstractSankey>
type Type_GenericDrawingArea = Class_AbstractDrawingArea

export abstract class Class_AbstractApplicationData {
  // MAndatory methods
  public abstract sendWaitingToast(
    funct: () => void,
    intake?: Object
  ): void
  // Mandatory attributes
  public abstract version: string
  // Mandatory getters
  public abstract get t(): TFunction
  public abstract get menu_configuration(): Class_MenuConfig
  public abstract get node_label_separator(): string
  public abstract set node_label_separator(_:string)
  public abstract get node_label_separator_part() : 'before' | 'after'
  public abstract set node_label_separator_part(_:'before' | 'after')
}

export abstract class Class_AbstractDrawingArea {
  // Mandatory attributes
  public abstract application_data: Class_AbstractApplicationData
  public abstract d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null
  public abstract static: boolean
  public abstract bypass_redraws: boolean
  // Mandatory methods
  public abstract isInSelectionMode(): boolean
  public abstract isInEditionMode(): boolean
  public abstract addElement(): number
  public abstract recenterElements(): void
  public abstract checkAndUpdateAreaSize(): void
  public abstract deleteNode(_: Type_AbstractNodeElement): void
  public abstract deleteLink(_: Type_AbstractLinkElement): void
  public abstract addNodeToSelection(_: Type_AbstractNodeElement): void
  public abstract removeNodeFromSelection(_: Type_AbstractNodeElement): void
  public abstract addLinkToSelection(_: Type_AbstractLinkElement): void
  public abstract removeLinkFromSelection(_: Type_AbstractLinkElement): void
  public abstract purgeSelection(): void
  public abstract closeAllMenus(): void
  public abstract updateFrom(other_drawing_area: Class_AbstractDrawingArea, mode: string[]): void
  public abstract draw(): void
  public abstract orderElements(): void
  public abstract computeParametricV(): void
  // Mandatory getters
  public abstract get sankey(): Class_AbstractSankey
  public abstract get legend(): Class_Legend<Type_GenericDrawingArea, Type_GenericSankeyOS>
  public abstract get scale(): number
  public abstract get scaleValueToPx(): (_: number) => number
  public abstract get need_to_recompute_scale(): boolean
  public abstract get minimum_flux(): number | undefined
  public abstract get maximum_flux(): number | undefined
  public abstract get filter_link_value(): number
  public abstract get selected_nodes_list(): Type_AbstractNodeElement[]
  public abstract get node_contextualised(): Type_AbstractNodeElement | undefined
  public abstract set node_contextualised(_: Type_AbstractNodeElement | undefined)
  public abstract get selected_links_list(): Type_AbstractLinkElement[]
  public abstract get link_contextualised(): Type_AbstractLinkElement | undefined
  public abstract set link_contextualised(_: Type_AbstractLinkElement | undefined)
  public abstract get ghost_link(): Type_AbstractLinkElement | null
  public abstract set ghost_link(_: Type_AbstractLinkElement | null)
  public abstract get pointer_pos(): [number, number]
  public abstract set pointer_pos(_: [number, number])
  public abstract get filter_label(): number
  public abstract set filter_label(_: number)
  public abstract get show_structure(): string
  // MAndatory setters
  public abstract set scale(_: number)
}

export abstract class Class_AbstractSankey {
  public abstract drawing_area: Type_GenericDrawingArea
  // Mandatory getters
  public abstract get is_visible(): boolean
  public abstract get nodes_dict(): { [_: string]: Type_AbstractNodeElement }
  public abstract get nodes_list(): Type_AbstractNodeElement[]
  public abstract get nodes_list_sorted(): Type_AbstractNodeElement[]
  public abstract get visible_nodes_list(): Type_AbstractNodeElement[]
  public abstract get visible_nodes_list_sorted(): Type_AbstractNodeElement[]
  public abstract get links_dict(): { [_: string]: Type_AbstractLinkElement }
  public abstract get links_list(): Type_AbstractLinkElement[]
  public abstract get links_list_sorted(): Type_AbstractLinkElement[]
  public abstract get visible_links_list(): Type_AbstractLinkElement[]
  public abstract get visible_links_list_sorted(): Type_AbstractLinkElement[]
  public abstract get node_styles_dict(): { [id: string]: Class_AbstractNodeStyle }
  public abstract get default_node_style(): Class_AbstractNodeStyle
  public abstract get node_styles_list(): Class_AbstractNodeStyle[]
  public abstract get node_styles_list_sorted(): Class_AbstractNodeStyle[]
  public abstract get link_styles_dict(): { [id: string]: Class_AbstractLinkStyle }
  public abstract get default_link_style(): Class_AbstractLinkStyle
  public abstract get link_styles_list(): Class_AbstractLinkStyle[]
  public abstract get link_styles_list_sorted(): Class_AbstractLinkStyle[]
  public abstract get node_taggs_dict(): { [id: string]: Class_AbstractTagGroup }
  public abstract get node_taggs_list(): Class_AbstractTagGroup[]
  public abstract get flux_taggs_dict(): { [id: string]: Class_AbstractTagGroup }
  public abstract get flux_taggs_list(): Class_AbstractTagGroup[]
  public abstract get data_taggs_dict(): { [id: string]: Class_AbstractTagGroup }
  public abstract get data_taggs_list(): Class_AbstractTagGroup[]
  public abstract get data_taggs_entries(): [string, Class_AbstractTagGroup][]
  public abstract get selected_data_tags_list(): Class_AbstractTag[]
  public abstract get selected_data_tags_entries(): { [id: string]: Class_AbstractTag }
  public abstract get list_combinatorial_data_taggs_path(): string[][]
  public abstract get level_taggs_dict(): { [id: string]: Class_AbstractLevelTagGroup }
  public abstract get level_taggs_list(): Class_AbstractLevelTagGroup[]
  // Mandatory methods
  public abstract addNewDefaultNode(): Type_AbstractNodeElement
  public abstract addNewNode(id: string, name: string): Type_AbstractNodeElement
  public abstract addNewLink(s: Type_AbstractNodeElement, t: Type_AbstractNodeElement): Type_AbstractLinkElement
  public abstract addNewLinkWithId(i: string, s: Type_AbstractNodeElement, t: Type_AbstractNodeElement): Type_AbstractLinkElement
  public abstract addNewNodeStyle(id: string, name: string): Class_AbstractNodeStyle
  public abstract addNewLinkStyle(id: string, name: string): Class_AbstractLinkStyle
}

export abstract class Class_AbstractTagGroup {
  public abstract get id(): string
  public abstract get name(): string
  public abstract get tags_dict(): { [id: string]: Class_AbstractTag }
  public abstract get tags_list(): Class_AbstractTag[]
  public abstract get selected_tags_list(): Class_AbstractTag[]
  public abstract get show_legend(): boolean
}

export abstract class Class_AbstractLevelTagGroup {
  public abstract sibling_activated(): Class_AbstractLevelTagGroup[]
  public abstract get id(): string
  public abstract get name(): string
  public abstract get tags_dict(): { [id: string]: Class_AbstractLevelTag }
  public abstract get tags_list(): Class_AbstractLevelTag[]
  public abstract get selected_tags_list(): Class_AbstractLevelTag[]
  public abstract get activated(): boolean
  public abstract set activated(boolean)
}

export abstract class Class_AbstractTag {
  public abstract get id(): string
  public abstract get name(): string
  public abstract get color(): string
  public abstract get group(): Class_AbstractTagGroup
}

export abstract class Class_AbstractLevelTag {
  public abstract get id(): string
  public abstract get name(): string
  public abstract get color(): string
  public abstract get group(): Class_AbstractLevelTagGroup
  public abstract get is_selected(): boolean
  public abstract get has_upper_dimensions(): boolean
  public abstract get dimensions_list_as_tag_for_children(): Class_AbstractNodeDimension[]
  public abstract get dimensions_list_as_tag_for_parent(): Class_AbstractNodeDimension[]
  public abstract addAsParentLevel(_: Class_AbstractNodeDimension): void
  public abstract removeParentLevel(_: Class_AbstractNodeDimension): void
  public abstract addAsChildrenLevel(_: Class_AbstractNodeDimension): void
  public abstract removeChildrenLevel(_: Class_AbstractNodeDimension): void
}


