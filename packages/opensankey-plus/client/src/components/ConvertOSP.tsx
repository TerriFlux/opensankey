// // External imports
// import React, { FunctionComponent, MutableRefObject, useState } from 'react'
// import { Box, Button, Input, Select } from '@chakra-ui/react'

import React, { FunctionComponent, useState } from 'react'

import { Box, Button } from '@chakra-ui/react'

import type { FCType_TransformationElementsOSP } from '../ftypes/SankeyPlusConvertTypes'
import { OSTooltip, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { DiffType, OSPData } from '../types/LegacyTypes'
import { applyChange } from 'deep-diff'



export const TransformationElementsOSP: FunctionComponent<FCType_TransformationElementsOSP> = ({
  new_data_plus,
}) => {

  const { t, data_var_to_update,menu_configuration,icon_library} = new_data_plus
  const {ref_to_updater_modal_apply_layout_plus}=menu_configuration
  const {icon_activated,icon_unactivated}=icon_library

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
        >{data_var_to_update.current.includes('freeLabels') ? icon_activated : icon_unactivated}</Button>
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
          >{data_var_to_update.current.includes('icon_catalog') ? icon_activated : icon_unactivated}</Button>
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