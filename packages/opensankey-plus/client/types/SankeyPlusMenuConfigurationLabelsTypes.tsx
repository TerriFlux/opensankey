import { TFunction } from 'i18next'
import {  OSPApplicationContextType, OSPComponentUpdaterType, OSPElementsSelectedType, OSPUiElementsRefType, OSPApplicationDataType, OSPData, OSPShowMenuComponentsType, reDrawOSPLabelsFType } from './Types'
import ReactQuill from 'react-quill'
import { contextMenuType } from 'open-sankey/src/types/Types'

export type OSPMenuPreferenceLabelsFType={
  t:TFunction,
  data:OSPData
  updateMenus:[boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

export interface selected_type  {'label':string;'value':string}

export type OSPMenuConfigurationFreeLabelsFType = {
  applicationData:OSPApplicationDataType,
  applicationContext:OSPApplicationContextType,
  applicationState:OSPElementsSelectedType,
  ComponentUpdater:OSPComponentUpdaterType,
  reDrawOSPLabels:reDrawOSPLabelsFType
}


export type context_zdtFType={
  contextMenu:contextMenuType,
  t:TFunction,
  applicationData:OSPApplicationDataType,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  applicationState:OSPElementsSelectedType,
  ComponentUpdater:OSPComponentUpdaterType,
  reDrawOSPLabels:reDrawOSPLabelsFType
}

export type blur_ZDT_wysiwygFType=(
  r_editor_ZDT:{current:ReactQuill}
) =>void

export type ZDTMenuAsAccordeonItemType={
  data:OSPData,
  uiElementsRef:OSPUiElementsRefType,
  applicationContext:OSPApplicationContextType,
  content_menu_zdt:JSX.Element
}