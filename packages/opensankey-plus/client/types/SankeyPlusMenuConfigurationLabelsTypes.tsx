import {   OSPApplicationDataType } from './Types'
import ReactQuill from 'react-quill'

export type OSPMenuPreferenceLabelsFType={
  applicationData:OSPApplicationDataType,
  updateMenus:[boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

export interface selected_type  {'label':string;'value':string}

export type OSPMenuConfigurationFreeLabelsFType = {
  applicationData:OSPApplicationDataType,
}


export type context_zdtFType={
  applicationData:OSPApplicationDataType,
}

export type blur_ZDT_wysiwygFType=(
  r_editor_ZDT:{current:ReactQuill}
) =>void

export type ZDTMenuAsAccordeonItemType={
  applicationData:OSPApplicationDataType
  content_menu_zdt:JSX.Element

}