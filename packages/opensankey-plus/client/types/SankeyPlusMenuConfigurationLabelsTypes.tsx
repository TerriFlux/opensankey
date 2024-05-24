import { TFunction } from 'i18next'
import {  PlusApplicationContextType, PlusComponentUpdaterType, PlusElementsSelectedType, PlusUiElementsRefType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusShowMenuComponentsType, reDrawPlusLabelsFType } from './Types'
import ReactQuill from 'react-quill'
import { contextMenuType } from 'open-sankey/src/types/Types'

export type SankeyPlusMenuPreferenceLabelsFType={
  t:TFunction,
  data:SankeyPlusData,
  updateMenus:[boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

export interface selected_type  {'label':string;'value':string}

export type SankeyPlusMenuConfigurationFreeLabelsFType = {
  applicationData:SankeyPlusApplicationDataType,
  applicationContext:PlusApplicationContextType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  ComponentUpdater:PlusComponentUpdaterType,
  reDrawPlusLabels:reDrawPlusLabelsFType
}


export type context_zdtFType=(
  contextMenu:contextMenuType,
  t:TFunction,
  applicationData:SankeyPlusApplicationDataType,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  ComponentUpdater:PlusComponentUpdaterType,
  reDrawPlusLabels:reDrawPlusLabelsFType
) => JSX.Element

export type blur_ZDT_wysiwygFType=(
  r_editor_ZDT:{current:ReactQuill}
) =>void

export type ZDTMenuAsAccordeonItemType={
  data:SankeyPlusData,
  uiElementsRef:PlusUiElementsRefType,
  applicationContext:PlusApplicationContextType,
  content_menu_zdt:JSX.Element
}