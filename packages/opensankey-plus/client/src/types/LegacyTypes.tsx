import { Dispatch, SetStateAction, MutableRefObject } from 'react'
import { Diff } from 'deep-diff'


import type { IType_DictHookRefSetterShowDialogComponents } from '../deps/OpenSankey/types/MenuConfig'

import type { Type_GenericApplicationDataOSP } from './TypesOSP'
import { SankeyNodeStyle, SankeyLinkStyle, SankeyNode, SankeyLinkAttrLocal, SankeyLink, SankeyData } from '../deps/OpenSankey/Persistence/LegacyType'


export type DiffType = {
  diff: Diff<undefined | OSPData, OSPData>[]
}

type OSPNodeStyle = SankeyNodeStyle

export interface OSPLinkStyle extends SankeyLinkStyle {
  gradient: boolean,
}

type OSPNodeVar = {
  iconName: string,
  iconColor: string,
  iconVisible: boolean,
  iconViewBox?: string,
  iconColorSustainable: boolean,

  has_FO: boolean,
  is_FO_raw: boolean,
  FO_content: string,

  is_image: boolean,
  image_src: string,

  hyperlink: string
}

export type OSPNode = SankeyNode & OSPNodeVar


export interface OSPLinkAttrLocal extends SankeyLinkAttrLocal {
  gradient?: boolean,
}

interface OSPLinkIntern {
  local?: OSPLinkAttrLocal
}

export type OSPLink = SankeyLink & OSPLinkIntern

export type ViewType = {
  id: string,
  view_data: DiffType | Omit<OSPData, 'view'>,
  nom: string,
  details: string,
  heredited_attr_from_master: string[]
}

// OSP type that overwrite type or add variable to SankeyData
type OSPDataVar = {
  icon_catalog: { [x: string]: string | null | undefined },
  nodes: { [x: string]: OSPNode }
  links: { [x: string]: OSPLink }
  view: ViewType[],
  current_view: string
  labels: { [x: string]: OSPLabel }
  style_node: { [x: string]: OSPNodeStyle },
  style_link: { [x: string]: OSPLinkStyle },
  background_image: string,
  show_background_image: boolean,
  is_catalog: boolean,
}

export type OSPData = SankeyData & OSPDataVar

export interface OSPLabel {
  // identification
  idLabel: string,
  title: string,
  content: string,
  opacity: number,
  color: string,
  color_border: string,
  transparent_border: boolean,

  label_width: number,
  label_height: number,

  x: number,
  y: number,

  is_image: boolean,
  image_src: string
}

export type OSPShowMenuComponentsType = IType_DictHookRefSetterShowDialogComponents & OSPShowMenuComponentsVarType

export type OSPShowMenuComponentsVarType = {
  ref_setter_show_menu_node_icon: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_import_icons: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_zdt: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_view_not_saved: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
}

// OSP type that overwrite or add variable to for applicationDataType
interface OSPApplicationDataVarType {
  new_data_plus: Type_GenericApplicationDataOSP
}

export type OSPApplicationDataType = OSPApplicationDataVarType

// TO DELETE WHEN UNITARY SANKEY WILL BE MERGE IN SANKEYPLUS
export interface SankeyUnitData extends OSPData {
  unitary_node: string[],
}
