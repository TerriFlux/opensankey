// External imports
import React, { FunctionComponent, MutableRefObject, useState } from 'react'
import { Box, Button, Input, Select } from '@chakra-ui/react'

import { FaCheck } from 'react-icons/fa'
import { TFunction } from 'i18next'
import {
  applyChange,
  diff as getDiff,
  Diff,
} from 'deep-diff'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

// Local imports
import {
  GetDataFromView,
  RecomputeViews,
  FilterView
} from './SankeyPlusViews'
import {
  OSPData,
  OSPLabel,
  DiffType,
  ViewType
} from '../types/Types'
import {
  OSPDiagramSelectorFType,
  OSPTransformationElementsFType,
  plus_convert_dataFType,
  plus_sankey_layoutFType
} from '../types/SankeyPlusConvertTypes'
import {
  DefaultLink,
  DefaultNode,
  synchronizeNodesandLinksIdOSTyped,
  complete_sankey_data,
  convert_data,
  convert_nodes,
  convert_links,
  convert_tags,
  OSTooltip
} from './import/OpenSankey'

// OpenSankey types
import { SankeyData } from 'open-sankey/src/types/Types'
import { updateLayoutFuncType } from 'open-sankey/src/draw/types/SankeyDrawLayoutTypes'


interface OSPLabelToConvert extends OSPLabel{
  transparent?:boolean,
  name?:string,
  font_size?:number,
  font_weight?:boolean,
  font_uppercase?:boolean,
  position_horiz?:'gauche'|'centre'|'droite'
  position_vert?: 'bas'|'milieu'|'haut'
}

export const plus_all_element_to_transform = [
  'Views', 'icon_catalog', 'freeLabels'
]

export const plus_convert_data : plus_convert_dataFType = (
  data:OSPData,
  DefaultSankeyData: ()=>OSPData
)=>{

  data.background_image=(data.background_image===undefined)?'':data.background_image

  data.show_background_image=(data.show_background_image===undefined)?false:data.show_background_image

  if (!data.labels) {
    data.labels = {}
  }
  if(!data.accordeonToShow.includes('LL') && Object.keys(data.labels).length>0){
    data.accordeonToShow.push('LL')
  }
  if(data.labels){
    Object.values(data.labels).forEach((l:OSPLabelToConvert)=>{
      if(l.title===undefined){
        let idZdt = Object.keys(data.labels).length
        const tab_title=Object.values(data.labels).map(zdt=>zdt.title)
        while (tab_title.includes('Zone de texte '+idZdt) ) {
          idZdt = idZdt+1
        }
        l.title='Zone de texte '+idZdt
      }
      // CONVERT TEXT ZONE TRANSPARENT -> OPACITY (0-100)
      if(l.transparent!==undefined){
        l.opacity=l.transparent?0:100
        delete ((l as unknown) as OSPLabelToConvert ).transparent
      }

      if(l.name!==undefined){
        const new_content=l.name
        if (l.font_uppercase) {
          l.content = new_content.toUpperCase()
        }
        if (l.font_size === 40) {
          l.content=new_content?'<h3>'+l.content+'</h3>':''
        } else if (l.font_size === 30) {
          l.content=new_content?'<h4>'+l.content+'</h4>':''
        } else {
          l.content=new_content?l.content:''
        }
        if (l.font_weight) {
          l.content=new_content?'<strong>'+l.content+'</strong>':''
        }
        if (l.position_horiz === 'gauche' ) {
          l.content=new_content?'<p class="ql-align-left">'+l.content+'</p>':''
        }
        if (l.position_horiz === 'centre' ) {
          l.content=new_content?'<p class="ql-align-center">'+l.content+'</p>':''
        }
        if (l.position_horiz === 'droite' ) {
          l.content=new_content?'<p class="ql-align-right">'+l.content+'</p>':''
        }
        // if (l.position_vert === 'haut' ) {
        //  not possible to convert
        // }
        // if (l.position_vert === 'milieu' ) {
        //  not possible to convert
        // }
        // if (l.position_vert === 'bas' ) {
        //  not possible to convert
        // }
        delete l.name
      }
      const keys = ['idLabel','title','content','opacity','color','color_border','transparent_border','label_width','label_height','x','y','x_label','y_label','is_image','image_src']
      const keys_to_remove : string[]=[]
      Object.keys(l).forEach(key=>{
        if (!keys.includes(key)) {
          keys_to_remove.push(key)
        }
      })
      keys_to_remove.forEach(key=>delete (l as unknown as {[s:string]:string})[key])

      if(l.is_image===undefined){
        l.is_image=false
        l.image_src=''
      }
    })
  }

  if(data.current_view===undefined){
    data.current_view='none'
  }

  if (!data.view) {
    return
  }
  const key_view=Object.values(data.view).map(v=>v.id)
  if(data.current_view &&data.current_view!=='none' && !key_view.includes(data.current_view)){
    data.current_view='none'
  }
  // Convert old view (when we copied the entire data)
  data.view.forEach((v)=>{
    if(v.heredited_attr_from_master===undefined){
      v.heredited_attr_from_master=['']
    }
    if((v.view_data as unknown as OSPData ).version){
      complete_sankey_data(
        v.view_data as OSPData,
        DefaultSankeyData,
        DefaultNode,DefaultLink);
      (v.view_data as unknown as OSPData ).view= []
      convert_tags(v.view_data as unknown as OSPData)
      convert_nodes(v.view_data as unknown as OSPData)
      convert_links(v.view_data as unknown as OSPData)
      convert_data(v.view_data as unknown as OSPData, DefaultSankeyData)
      plus_convert_data((v.view_data as unknown as OSPData ),DefaultSankeyData)
    }
    else if ((v.view_data as unknown as DiffType).diff!==undefined) {
      const d_view = GetDataFromView(data, v.id) as OSPData
      convert_data(d_view, DefaultSankeyData)
      plus_convert_data(d_view, DefaultSankeyData)
      const copy_data = {...data}
      copy_data.view = []
      const converted_master = JSON.parse(JSON.stringify(copy_data))
      convert_data(converted_master, DefaultSankeyData)
      plus_convert_data(converted_master, DefaultSankeyData)
      let differences = getDiff(converted_master, d_view)
      differences = (differences !== undefined)?differences:[]
      differences = FilterView(differences)
      v.view_data = {diff: differences}
    }
  })
  Object.values(data.links).forEach(l=>{
    const convert_link = l as unknown as {gradient?:boolean}
    if (convert_link.gradient) {
      delete convert_link.gradient
      if (!l.local) {
        l.local = {}
      }
      l.local!.gradient = true
    }
  })
}

export const OSPDiagramSelector : OSPDiagramSelectorFType = (
  applicationData
) => {
  const {master_data,set_master_data,view,get_default_data} =applicationData
  const [s_diagram_type, sDiagramType] = useState('File')
  const [view_selected, set_view_selected] = useState('none')

  const OSPDiagramSelectorInner = (
    t: TFunction,
    convert_data: (s:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void,
    sankey_data: SankeyData,
    set_sankey_data: (s:SankeyData)=>void,
    prev_sankey_data: SankeyData,
    set_prev_sankey_data: (s:SankeyData)=>void,
    updateLayout: updateLayoutFuncType,
    dataVarToUpdate : MutableRefObject<string[]>
  ) => {
    const [file_layout, set_file_layout] = useState<Blob[] | undefined>(undefined)

    return (<Box>
      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        {t('Menu.Transformation.fmep')}
      </Box>
      <Box layerStyle='options_3cols'>
        <Box layerStyle='options_2cols'>

          <Button
            variant={s_diagram_type==='File'?'menuconfigpanel_option_button_secondary':'menuconfigpanel_option_button_light'}
            onClick={
              () => {
                sDiagramType('File')
              }}>{t('Menu.other_file')}</Button>
          <Button
            variant={s_diagram_type==='View'?'menuconfigpanel_option_button_secondary':'menuconfigpanel_option_button_light'}
            onClick={
              () => {
                sDiagramType('View')
              }}>{t('Menu.view_actual_file')}</Button>
        </Box>

        {/* If s_diagram_type is file then use data from file to modify current data
          else if it's view then use data from a view */}
        {s_diagram_type==='File' ? <Input
          type="file"
          onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)} /> :
          <Select
            onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> {
              set_view_selected(evt.target.value)
            }}>
            <option key='none' value='none'>{t('view.actual')}</option>
            {master_data ? master_data.view.map(d => {
              return <option key={d.id} value={d.id}>{d.nom}</option>
            }) : <></>}
          </Select>
        }

        <Box layerStyle='options_2cols'>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              if (s_diagram_type === 'View') {
                if (view_selected === 'none') {
                  // View selected is master data
                  if (view === 'none' ) {
                    // No update of master data by master data
                    return
                  }
                  //- current view is updated by master data
                  updateLayout(sankey_data,master_data!,dataVarToUpdate.current)
                  set_sankey_data({ ...JSON.parse(JSON.stringify(sankey_data)) })
                } else {
                  // A view is selected to update either another view or the master data
                  if (view === view_selected ) {
                    // No update of view by itself
                    return
                  }
                  const data_view=GetDataFromView(master_data,view_selected) as OSPData
                  updateLayout(sankey_data,data_view,dataVarToUpdate.current)
                  const copy_data = JSON.parse(JSON.stringify(sankey_data))
                  set_sankey_data(copy_data)
                  if (view === 'none' ) {
                    RecomputeViews(copy_data,master_data,set_master_data)
                  }
                }
                return
              }
              if (file_layout === undefined) {
                return
              }
              const reader = new FileReader()
              reader.onload = (() => {
                return (
                  (e: ProgressEvent<FileReader>) => {
                    let result = (e.target as FileReader).result
                    if (result) {
                      result = String(result) //.split('<br>').join('\\\\n')
                      const new_layout = JSON.parse(result)
                      convert_data(new_layout,get_default_data)
                      complete_sankey_data(new_layout, get_default_data, DefaultNode, DefaultLink)
                      set_prev_sankey_data(JSON.parse(JSON.stringify(sankey_data)))
                      updateLayout(sankey_data, new_layout, dataVarToUpdate.current,true)
                      const copy_data = { ...JSON.parse(JSON.stringify(sankey_data)) }
                      set_sankey_data(copy_data)
                      if (view === 'none' ) {
                        // if master is being updated we need to set it.
                        set_master_data(copy_data)
                      }
                    }
                  }
                )
              })()
              reader.readAsText(file_layout[0])
            } }>{t('Menu.Transformation.ad')}
          </Button>

          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              const copy_data = { ...JSON.parse(JSON.stringify(prev_sankey_data)) }
              set_sankey_data(copy_data)
              if (view === 'none' ) {
                // if master is being updated we need to set it.
                set_master_data(copy_data)
              }
            } }>{t('Menu.Transformation.undo')}
          </Button>

        </Box>
      </Box>


    </Box>)
  }
  return OSPDiagramSelectorInner
}

export const OSPTransformationElements : FunctionComponent<OSPTransformationElementsFType> = ({
  applicationData,
  applicationContext,
  ComponentUpdater
}) => {
  const {data,master_data,dataVarToUpdate}=applicationData
  const data_to_use=master_data?master_data:data
  // Variable used to check if we are in a view, if so we disabled the possibility to check Views in the menu transfromation
  const is_current_data_master=data_to_use.current_view==='none'
  const [forceUpdate,setForceUpdate]=useState(false)
  const {updateComponentBtnUpdateLayout}=ComponentUpdater
  updateComponentBtnUpdateLayout.current=()=>setForceUpdate(!forceUpdate)
  if (!applicationContext.has_open_sankey_plus) {
    return <></>
  }
  return <>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{applicationContext.t('Menu.Transformation.freeLabels')}</Box>
      <Box layerStyle='options_4cols' >
        <Button
          variant={dataVarToUpdate.current.includes('freeLabels')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button_light'}
          onClick={() => {
            if(!dataVarToUpdate.current.includes('freeLabels')){
              dataVarToUpdate.current.push('freeLabels')
              setForceUpdate(!forceUpdate)
            }else{
              dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('freeLabels'),1)
              setForceUpdate(!forceUpdate)
            }}
          }
        >{dataVarToUpdate.current.includes('freeLabels')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
      </Box>
    </Box>

    <OSTooltip label={!is_current_data_master?applicationContext.t('Menu.Transformation.disabled_view'):''} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{applicationContext.t('Menu.Transformation.Views')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            disabled={!is_current_data_master}
            variant={dataVarToUpdate.current.includes('Views')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button_light'}
            onClick={() => {
              if(!dataVarToUpdate.current.includes('Views')){
                dataVarToUpdate.current.push('Views')
                setForceUpdate(!forceUpdate)
              }else{
                dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('Views'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{dataVarToUpdate.current.includes('Views')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </Box>
      </Box>
    </OSTooltip>

    <OSTooltip label={applicationContext.t('Menu.Transformation.list_icon_tooltip')} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{applicationContext.t('Menu.Transformation.list_icon')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            disabled={!is_current_data_master}
            variant={dataVarToUpdate.current.includes('icon_catalog')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button_light'}
            onClick={() => {
              if(!dataVarToUpdate.current.includes('icon_catalog')){
                dataVarToUpdate.current.push('icon_catalog')
                setForceUpdate(!forceUpdate)
              }else{
                dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('icon_catalog'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{dataVarToUpdate.current.includes('icon_catalog')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </Box>
      </Box>
    </OSTooltip></>
}

export const plus_sankey_layout : plus_sankey_layoutFType =(
  data:OSPData,
  new_layout:OSPData,
  mode:string[]
)=>{
  if (mode.includes('freeLabels') && new_layout.labels) {
    if (!data.labels) {
      data.labels = {}
    }
    const differences = getDiff(data.labels, new_layout.labels)
    if (differences) {
      differences.forEach((difference) => applyChange(data.labels, {}, difference))
    }
  }

  if (mode.includes('Views') && new_layout.view) {
    if (new_layout.view) {
      if (!(data.view)) {
        data.view = []
      }
      new_layout.view.forEach ((view_of_new_layout:ViewType )=> {
        const view_data=JSON.parse(JSON.stringify(new_layout))
        if (data.view.filter(d_view=>d_view.nom === view_of_new_layout.nom ).length===0) {
          if((view_of_new_layout.view_data as OSPData ).version) {
            // Views are copied identical to what they were
            view_of_new_layout.heredited_attr_from_master = ['']
            // nodeId and linkId must be synchronized with new master
            synchronizeNodesandLinksIdOSTyped(
              view_of_new_layout.view_data as OSPData,
              data)
            data.view.push(view_of_new_layout)
          }
          else if ((view_of_new_layout.view_data as DiffType).diff!==undefined) {
            (view_of_new_layout.view_data as DiffType)
              .diff
              .forEach((difference) => applyChange(view_data, {}, difference))
            // nodeId and linkId must be synchronized with new master
            synchronizeNodesandLinksIdOSTyped(view_data,data)
            const data_view_diff = getDiff(data, view_data) as Diff<undefined, OSPData>[]
            (view_of_new_layout.view_data as DiffType).diff = data_view_diff.filter((d) => !(d.path!.includes('view')))
            // Views are copied identical to what they were
            view_of_new_layout.heredited_attr_from_master = ['']
            data.view.push(view_of_new_layout)
          }
        }
      }
      )
    }
  }

  if(mode.includes('icon_catalog')){
    // Import catalog of icon
    Object.entries(new_layout.icon_catalog).filter(icon=>icon[0] && icon[1]).forEach(icon=>{
      data.icon_catalog[icon[0]]=icon[1]
    })
  }

  if(mode.includes('attrNode')){
    Object.entries(data.nodes).forEach( ([key,node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }

      // Add icon fromm imported layout if it has all the attribut
      if(layoutNode.iconVisible!==undefined && layoutNode.iconColor && layoutNode.iconName ){
        node.iconVisible=layoutNode.iconVisible
        node.iconColor=layoutNode.iconColor
        node.iconName=layoutNode.iconName
      }
      // Add ForeignObject from imported layout if it has all the attribut
      if(layoutNode.has_FO!==undefined && layoutNode.is_FO_raw && layoutNode.FO_content ){
        node.has_FO=layoutNode.has_FO
        node.is_FO_raw=layoutNode.is_FO_raw
        node.FO_content=layoutNode.FO_content
      }

    })
  }
}
