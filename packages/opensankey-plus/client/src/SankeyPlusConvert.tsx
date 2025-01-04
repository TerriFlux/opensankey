// // External imports
// import React, { FunctionComponent, MutableRefObject, useState } from 'react'
// import { Box, Button, Input, Select } from '@chakra-ui/react'

import React, { FunctionComponent, useState } from 'react'
import { FaCheck } from 'react-icons/fa'

import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button } from '@chakra-ui/react'

import type { FCType_TransformationElementsOSP } from './ftypes/SankeyPlusConvertTypes'
import { OSTooltip, Type_JSON } from './deps/OpenSankey/types/Utils'
import { DiffType, OSPData, ViewType } from './types/LegacyTypes'
import { applyChange } from 'deep-diff'

// import { FaCheck } from 'react-icons/fa'
// import { TFunction } from 'i18next'
// import {
//   applyChange,
//   diff as getDiff,
//   Diff,
// } from 'deep-diff'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faXmark } from '@fortawesome/free-solid-svg-icons'

// // Local imports
// import {
//   GetDataFromView,
//   RecomputeViews,
//   FilterView
// } from './SankeyPlusViews'
// import {
//   OSPData,
//   OSPLabel,
//   DiffType,
//   ViewType
// } from '../types/Types'
// import {
//   FType_DiagramSelectorOSP,
//   FCType_TransformationElementsOSP,
//   FType_ConvertDataOSP,
//   FType_SankeyLayoutOSP
// } from '../types/SankeyPlusConvertTypes'
// import {
//   DefaultLink,
//   DefaultNode,
//   synchronizeNodesandLinksIdOSTyped,
//   complete_sankey_data,
//   convert_data,
//   convert_nodes,
//   convert_links,
//   convert_tags,
//   OSTooltip
// } from './import/OpenSankey'

// // OpenSankey types
// import { SankeyData } from './deps/OpenSankey/types/Types'
// import { updateLayoutFuncType } from './deps/OpenSankey/draw/types/SankeyDrawLayoutTypes'


// interface OSPLabelToConvert extends OSPLabel{
//   transparent?:boolean,
//   name?:string,
//   font_size?:number,
//   font_weight?:boolean,
//   font_uppercase?:boolean,
//   position_horiz?:'gauche'|'centre'|'droite'
//   position_vert?: 'bas'|'milieu'|'haut'
// }

// export const plus_all_element_to_transform = [
//   'Views', 'icon_catalog', 'freeLabels'
// ]

// export const plus_convert_data : FType_ConvertDataOSP = (
//   data:OSPData,
//   DefaultSankeyData: ()=>OSPData
// )=>{

//   data.background_image=(data.background_image===undefined)?'':data.background_image

//   data.show_background_image=(data.show_background_image===undefined)?false:data.show_background_image

//   if (!data.labels) {
//     data.labels = {}
//   }
//   if(!data.accordeonToShow.includes('LL') && Object.keys(data.labels).length>0){
//     data.accordeonToShow.push('LL')
//   }
//   if(data.labels){
//     Object.values(data.labels).forEach((l:OSPLabelToConvert)=>{
//       if(l.title===undefined){
//         let idZdt = Object.keys(data.labels).length
//         const tab_title=Object.values(data.labels).map(zdt=>zdt.title)
//         while (tab_title.includes('Zone de texte '+idZdt) ) {
//           idZdt = idZdt+1
//         }
//         l.title='Zone de texte '+idZdt
//       }
//       // CONVERT TEXT ZONE TRANSPARENT -> OPACITY (0-100)
//       if(l.transparent!==undefined){
//         l.opacity=l.transparent?0:100
//         delete ((l as unknown) as OSPLabelToConvert ).transparent
//       }

//       if(l.name!==undefined){
//         l.content=l.name
//         if (!l.content.includes('<p')) {
//           if (l.font_uppercase && !l.content.includes('ql-align-center')) {
//             l.content = l.content.toUpperCase()
//           }
//           // if (l.font_size === 40) {
//           //   l.content=l.content?'<h3>'+l.content+'</h3>':''
//           // } else if (l.font_size === 30) {
//           //   l.content=l.content?'<h4>'+l.content+'</h4>':''
//           // } else {
//           //   l.content=l.content?l.content:''
//           // }
//           if (l.font_weight) {
//             l.content=l.content?'<strong>'+l.content+'</strong>':''
//           }
//           if (l.position_horiz === 'gauche' ) {
//             l.content=l.content?'<p class="ql-align-left">'+l.content+'</p>':''
//           }
//           if (l.position_horiz === 'centre' ) {
//             l.content=l.content?'<p class="ql-align-center">'+l.content+'</p>':''
//           }
//           if (l.position_horiz === 'droite' ) {
//             l.content=l.content?'<p class="ql-align-right">'+l.content+'</p>':''
//           }
//         }
//         // if (l.position_vert === 'haut' ) {
//         //  not possible to convert
//         // }
//         // if (l.position_vert === 'milieu' ) {
//         //  not possible to convert
//         // }
//         // if (l.position_vert === 'bas' ) {
//         //  not possible to convert
//         // }
//         delete l.name
//       }
//       const keys = ['idLabel','title','content','opacity','color','color_border','transparent_border','label_width','label_height','x','y','x_label','y_label','is_image','image_src']
//       const keys_to_remove : string[]=[]
//       Object.keys(l).forEach(key=>{
//         if (!keys.includes(key)) {
//           keys_to_remove.push(key)
//         }
//       })
//       keys_to_remove.forEach(key=>delete (l as unknown as {[s:string]:string})[key])

//       if(l.is_image===undefined){
//         l.is_image=false
//         l.image_src=''
//       }
//     })
//   }

//   if(data.current_view===undefined){
//     data.current_view='none'
//   }

//   if (!data.view) {
//     return
//   }
//   if(!data.accordeonToShow.includes('Vis')){
//     data.accordeonToShow.push('Vis')
//   }
//   const key_view=Object.values(data.view).map(v=>v.id)
//   if(data.current_view &&data.current_view!=='none' && !key_view.includes(data.current_view)){
//     data.current_view='none'
//   }
//   // Convert old view (when we copied the entire data)
//   data.view.forEach((v)=>{
//     if(v.heredited_attr_from_master===undefined){
//       v.heredited_attr_from_master=['']
//     }
//     if((v.view_data as unknown as OSPData ).version){
//       complete_sankey_data(
//         v.view_data as OSPData,
//         DefaultSankeyData,
//         DefaultNode,DefaultLink);
//       (v.view_data as unknown as OSPData ).view= []
//       convert_tags(v.view_data as unknown as OSPData)
//       convert_nodes(v.view_data as unknown as OSPData)
//       convert_links(v.view_data as unknown as OSPData)
//       convert_data(v.view_data as unknown as OSPData, DefaultSankeyData)
//       plus_convert_data((v.view_data as unknown as OSPData ),DefaultSankeyData)
//       if(!(v.view_data as unknown as OSPData ).accordeonToShow.includes('Vis')){
//         (v.view_data as unknown as OSPData ).accordeonToShow.push('Vis')
//       }
//     }
//     else if ((v.view_data as unknown as DiffType).diff!==undefined) {
//       const d_view = GetDataFromView(data, v.id) as OSPData
//       convert_data(d_view, DefaultSankeyData)
//       plus_convert_data(d_view, DefaultSankeyData)
//       if(!d_view.accordeonToShow.includes('Vis')){
//         d_view.accordeonToShow.push('Vis')
//       }
//       const copy_data = {...data}
//       copy_data.view = []
//       const converted_master = JSON.parse(JSON.stringify(copy_data))
//       convert_data(converted_master, DefaultSankeyData)
//       plus_convert_data(converted_master, DefaultSankeyData)
//       let differences = getDiff(converted_master, d_view)
//       differences = (differences !== undefined)?differences:[]
//       differences = FilterView(differences)
//       v.view_data = {diff: differences}
//     }
//   })
//   Object.values(data.links).forEach(l=>{
//     const convert_link = l as unknown as {gradient?:boolean}
//     if (convert_link.gradient) {
//       delete convert_link.gradient
//       if (!l.local) {
//         l.local = {}
//       }
//       l.local!.gradient = true
//     }
//   })
// }

// export const diagramSelectorOSP : FType_DiagramSelectorOSP = (
//   applicationData
// ) => {
//   const {master_data,set_master_data,view,get_default_data} =applicationData
//   const [s_diagram_type, sDiagramType] = useState('File')
//   const [view_selected, set_view_selected] = useState('none')

//   const OSPDiagramSelectorInner = (
//     t: TFunction,
//     convert_data: (s:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void,
//     sankey_data: SankeyData,
//     set_sankey_data: (s:SankeyData)=>void,
//     prev_sankey_data: SankeyData,
//     set_prev_sankey_data: (s:SankeyData)=>void,
//     updateLayout: updateLayoutFuncType,
//     dataVarToUpdate : MutableRefObject<string[]>
//   ) => {
//     const [file_layout, set_file_layout] = useState<Blob[] | undefined>(undefined)

//     return (<Box>
//       <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
//         {t('Menu.Transformation.fmep')}
//       </Box>
//       <Box layerStyle='options_3cols'>
//         <Box layerStyle='options_2cols'>

//           <Button
//             variant={s_diagram_type==='File'?'menuconfigpanel_option_button_secondary_activated':'menuconfigpanel_option_button_secondary'}
//             onClick={
//               () => {
//                 sDiagramType('File')
//               }}>{t('Menu.other_file')}</Button>
//           <Button
//             variant={s_diagram_type==='View'?'menuconfigpanel_option_button_secondary_activated':'menuconfigpanel_option_button_secondary'}
//             onClick={
//               () => {
//                 sDiagramType('View')
//               }}>{t('Menu.view_actual_file')}</Button>
//         </Box>

//         {/* If s_diagram_type is file then use data from file to modify current data
//           else if it's view then use data from a view */}
//         {s_diagram_type==='File' ? <Input
//           type="file"
//           onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)} /> :
//           <Select
//             onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> {
//               set_view_selected(evt.target.value)
//             }}>
//             <option key='none' value='none'>{t('view.actual')}</option>
//             {master_data ? master_data.view.map(d => {
//               return <option key={d.id} value={d.id}>{d.nom}</option>
//             }) : <></>}
//           </Select>
//         }

//         <Box layerStyle='options_2cols'>
//           <Button
//             variant='menuconfigpanel_option_button'
//             onClick={() => {
//               if (s_diagram_type === 'View') {
//                 if (view_selected === 'none') {
//                   // View selected is master data
//                   if (view === 'none' ) {
//                     // No update of master data by master data
//                     return
//                   }
//                   //- current view is updated by master data
//                   updateLayout(sankey_data,master_data!,dataVarToUpdate.current)
//                   set_sankey_data({ ...JSON.parse(JSON.stringify(sankey_data)) })
//                 } else {
//                   // A view is selected to update either another view or the master data
//                   if (view === view_selected ) {
//                     // No update of view by itself
//                     return
//                   }
//                   const data_view=GetDataFromView(master_data,view_selected) as OSPData
//                   updateLayout(sankey_data,data_view,dataVarToUpdate.current)
//                   const copy_data = JSON.parse(JSON.stringify(sankey_data))
//                   set_sankey_data(copy_data)
//                   if (view === 'none' ) {
//                     RecomputeViews(copy_data,master_data,set_master_data)
//                   }
//                 }
//                 return
//               }
//               if (file_layout === undefined) {
//                 return
//               }
//               const reader = new FileReader()
//               reader.onload = (() => {
//                 return (
//                   (e: ProgressEvent<FileReader>) => {
//                     let result = (e.target as FileReader).result
//                     if (result) {
//                       result = String(result) //.split('<br>').join('\\\\n')
//                       const new_layout = JSON.parse(result)
//                       convert_data(new_layout,get_default_data)
//                       complete_sankey_data(new_layout, get_default_data, DefaultNode, DefaultLink)
//                       set_prev_sankey_data(JSON.parse(JSON.stringify(sankey_data)))
//                       updateLayout(sankey_data, new_layout, dataVarToUpdate.current,true)
//                       const copy_data = { ...JSON.parse(JSON.stringify(sankey_data)) }
//                       set_sankey_data(copy_data)
//                       if (view === 'none' ) {
//                         // if master is being updated we need to set it.
//                         set_master_data(copy_data)
//                       }
//                     }
//                   }
//                 )
//               })()
//               reader.readAsText(file_layout[0])
//             } }>{t('Menu.Transformation.ad')}
//           </Button>

//           <Button
//             variant='menuconfigpanel_option_button'
//             onClick={() => {
//               const copy_data = { ...JSON.parse(JSON.stringify(prev_sankey_data)) }
//               set_sankey_data(copy_data)
//               if (view === 'none' ) {
//                 // if master is being updated we need to set it.
//                 set_master_data(copy_data)
//               }
//             } }>{t('Menu.Transformation.undo')}
//           </Button>

//         </Box>
//       </Box>


//     </Box>)
//   }
//   return OSPDiagramSelectorInner
// }

export const TransformationElementsOSP: FunctionComponent<FCType_TransformationElementsOSP> = ({
  new_data_plus,
}) => {

  const { t, data_var_to_update,menu_configuration} = new_data_plus
  const {ref_to_updater_modal_apply_layout_plus}=menu_configuration

  const [, setForceUpdate] = useState(false)
  ref_to_updater_modal_apply_layout_plus.current=()=>setForceUpdate(b=>!b)
  if (!new_data_plus.has_sankey_plus) {
    return <></>
  }
  return <>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.freeLabels')}</Box>
      <Box layerStyle='options_4cols' >
        <Button
          variant={data_var_to_update.current.includes('freeLabels') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
          onClick={() => {
            if (!data_var_to_update.current.includes('freeLabels')) {
              data_var_to_update.current.push('freeLabels')
            } else {
              data_var_to_update.current.splice(data_var_to_update.current.indexOf('freeLabels'), 1)
            }
            menu_configuration.updateComponentApplyLayout()
          }
          }
        >{data_var_to_update.current.includes('freeLabels') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}</Button>
      </Box>
    </Box>

    {/* TODO : re implent this when view will be implemented with view */}
    {/* <OSTooltip label={!is_master?t('Menu.Transformation.disabled_view'):''} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Views')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            isDisabled={!is_master}
            variant={is_master && data_var_to_update.current.includes('Views')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
            onClick={() => {
              if(!data_var_to_update.current.includes('Views')){
                data_var_to_update.current.push('Views')
                setForceUpdate(!forceUpdate)
              }else{
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('Views'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{is_master && data_var_to_update.current.includes('Views')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </Box>
      </Box>
    </OSTooltip> */}

    <OSTooltip label={t('Menu.Transformation.list_icon_tooltip')} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.list_icon')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.current.includes('icon_catalog') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.current.includes('icon_catalog')) {
                data_var_to_update.current.push('icon_catalog')
              } else {
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('icon_catalog'), 1)
              }
              menu_configuration.updateComponentApplyLayout()
            }
            }
          >{data_var_to_update.current.includes('icon_catalog') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}</Button>
        </Box>
      </Box>
    </OSTooltip></>
}

// export const sankeyLayoutOSP : FType_SankeyLayoutOSP =(
//   data:OSPData,
//   new_layout:OSPData,
//   mode:string[]
// )=>{
//   if (mode.includes('freeLabels') && new_layout.labels) {
//     if (!data.labels) {
//       data.labels = {}
//     }
//     const differences = getDiff(data.labels, new_layout.labels)
//     if (differences) {
//       differences.forEach((difference) => applyChange(data.labels, {}, difference))
//     }
//   }

//   if (mode.includes('Views') && new_layout.view) {
//     if (new_layout.view) {
//       if (!(data.view)) {
//         data.view = []
//       }
//       new_layout.view.forEach ((view_of_new_layout:ViewType )=> {
//         const view_data=JSON.parse(JSON.stringify(new_layout))
//         if (data.view.filter(d_view=>d_view.nom === view_of_new_layout.nom ).length===0) {
//           if((view_of_new_layout.view_data as OSPData ).version) {
//             // Views are copied identical to what they were
//             view_of_new_layout.heredited_attr_from_master = ['']
//             // nodeId and linkId must be synchronized with new master
//             synchronizeNodesandLinksIdOSTyped(
//               view_of_new_layout.view_data as OSPData,
//               data)
//             data.view.push(view_of_new_layout)
//           }
//           else if ((view_of_new_layout.view_data as DiffType).diff!==undefined) {
//             (view_of_new_layout.view_data as DiffType)
//               .diff
//               .forEach((difference) => applyChange(view_data, {}, difference))
//             // nodeId and linkId must be synchronized with new master
//             synchronizeNodesandLinksIdOSTyped(view_data,data)
//             const data_view_diff = getDiff(data, view_data) as Diff<undefined, OSPData>[]
//             (view_of_new_layout.view_data as DiffType).diff = data_view_diff.filter((d) => !(d.path!.includes('view')))
//             // Views are copied identical to what they were
//             view_of_new_layout.heredited_attr_from_master = ['']
//             data.view.push(view_of_new_layout)
//           }
//         }
//       }
//       )
//     }
//   }

//   if(mode.includes('icon_catalog')){
//     // Import catalog of icon
//     Object.entries(new_layout.icon_catalog).filter(icon=>icon[0] && icon[1]).forEach(icon=>{
//       data.icon_catalog[icon[0]]=icon[1]
//     })
//   }

//   if(mode.includes('attrNode')){
//     Object.entries(data.nodes).forEach( ([key,node]) => {
//       const layoutNode = new_layout.nodes[key]
//       if (!layoutNode) {
//         return
//       }

//       // Add icon fromm imported layout if it has all the attribut
//       if(layoutNode.iconVisible!==undefined && layoutNode.iconColor && layoutNode.iconName ){
//         node.iconVisible=layoutNode.iconVisible
//         node.iconColor=layoutNode.iconColor
//         node.iconName=layoutNode.iconName
//       }
//       // Add ForeignObject from imported layout if it has all the attribut
//       if(layoutNode.has_FO!==undefined && layoutNode.is_FO_raw && layoutNode.FO_content ){
//         node.has_FO=layoutNode.has_FO
//         node.is_FO_raw=layoutNode.is_FO_raw
//         node.FO_content=layoutNode.FO_content
//       }
//       // Add ForeignObject from imported layout if it has all the attribut
//       if(layoutNode.image_src!==undefined && layoutNode.is_image ){
//         node.image_src=layoutNode.image_src
//         node.is_image=layoutNode.is_image
//       }

//     })
//   }
// }



export const GetOldDataFromView  = (
  master_data:OSPData|undefined,
  id_view_to_see:string
)=>{
  // Copy master data
  if (!master_data) {
    alert('sankey master undefined')
    return undefined
  }
  const copy_master_data= {...master_data}
  copy_master_data.view = [];
  (copy_master_data as unknown as Type_JSON).views = {}
  //const view_of_master= master_data.view as unknown as ViewType[]
  let data_init=JSON.parse(JSON.stringify(copy_master_data)) as OSPData
  // Get the difference from the view
  if (master_data.view.filter(v=>v.id === id_view_to_see).length === 0) {
    alert('view not found')
    return data_init
  }
  const view_object=master_data.view.filter(v=>v.id === id_view_to_see)[0]

  if((view_object.view_data as DiffType).diff){
    const diff_view=(view_object.view_data as DiffType).diff
    if (!diff_view) {
      return data_init
    }
    diff_view.forEach((d) => applyChange(data_init, {}, d))
  }else{
    data_init=view_object.view_data as OSPData
  }
  return data_init
}