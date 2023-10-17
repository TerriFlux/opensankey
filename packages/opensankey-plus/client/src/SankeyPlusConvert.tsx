
import {SankeyPlusData,SankeyPlusLabel,DiffType, ViewType} from './types'
import {convert_tags,convert_links,convert_nodes,convert_data,complete_sankey_data} from 'open-sankey/dist/SankeyConvert'
import { get_data_from_view, recompute_views,filter_view } from './SankeyPlusViews'
import { default_sankey_data,default_link, default_node } from 'open-sankey/dist/SankeyUtils'
import { InputGroup, Button, Form } from 'react-bootstrap'
import React, { useState } from 'react'
import { TFunction } from 'i18next'
import { FaCheck } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

interface SankeyPlusLabelToConvert extends SankeyPlusLabel{
  transparent?:boolean,
  name?:string,
  font_size?:number
}

/* eslint-disable */
// @ts-ignore
const deep_diff = require('deep-diff')
/* eslint-enable */


export const plus_convert_data = (data:SankeyPlusData)=>{
  if(data.background_image===undefined){
    data.background_image=''
  }
  if (!data.labels) {
    data.labels = {}
  }
  if(data.labels){
    Object.values(data.labels).forEach((l:SankeyPlusLabelToConvert)=>{
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
        delete ((l as unknown) as SankeyPlusLabelToConvert ).transparent
      }

      if(((l as unknown) as SankeyPlusLabelToConvert ).name!==undefined){
        const new_content=((l as unknown) as SankeyPlusLabelToConvert).name
        if (((l as unknown) as SankeyPlusLabelToConvert).font_size === 40) {
          l.content=new_content?'<h3>'+new_content+'</h3>':''   
        } else if (((l as unknown) as SankeyPlusLabelToConvert).font_size === 30) {
          l.content=new_content?'<h4>'+new_content+'</h4>':''        
        } else {
          l.content=new_content?new_content:''
        }
        delete ((l as unknown) as SankeyPlusLabelToConvert ).name
      }
      const keys = ['idLabel','title','content','opacity','color','color_border','transparent_border','label_width','label_height','x','y','x_label','y_label']
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

  if(data.unitary_node===undefined){
    data.unitary_node=[]
  }
  if(data.process_transfo_ref===undefined){
    data.process_transfo_ref={}
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
    if((v.view_data as unknown as SankeyPlusData ).version){
      complete_sankey_data(v.view_data,default_sankey_data,default_node,default_link)
      convert_tags(v.view_data as unknown as SankeyPlusData)
      convert_nodes(v.view_data as unknown as SankeyPlusData)
      convert_links(v.view_data as unknown as SankeyPlusData)
      plus_convert_data((v.view_data as unknown as SankeyPlusData ))
      // let difference = deep_diff.diff(data, v.view_data)
      // difference=(difference!==undefined)?difference:[]
      // difference=JSON.parse(JSON.stringify(difference)).map((d:{path:string[],kind:string,item:{kind:string}})=>{
      //   if(d.kind==='D'){
      //     delete ((d as unknown) as differenceType).lhs
      //   }
      //   if(d.kind==='A' && d.item.kind==='D'){
      //     delete ((d as unknown) as differenceType).item.lhs
      //   }
      //   if(d.kind==='E'){
      //     delete ((d as unknown) as differenceType).lhs
      //   }
      //   return d
      // })
      // difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'));
      // (v.view_data as {diff:object[]}) = {
      //   diff : difference
      // }


    } else if((v.view_data as unknown as DiffType).diff!==undefined){
      const d_view=get_data_from_view(data,v.id)
      convert_data(d_view)
      plus_convert_data(d_view)
      const copy_data={...data}
      copy_data.view=[]
      const converted_master=JSON.parse(JSON.stringify(copy_data))
      convert_data(converted_master)
      plus_convert_data(converted_master)
      let difference = deep_diff.diff(converted_master, d_view)
      difference=(difference !== undefined)?difference:[]
      difference=filter_view(difference)
      v.view_data={diff:difference}
    }

  })
}

export const OpenSankeyPlusDiagramSelector = (
  master_data : SankeyPlusData,
  set_master_data : (d:SankeyPlusData)=>void,
  view : string,
  view_selected:string,
  set_view_selected:(s:string)=>void,
  diagramType:string,
  setDiagramType:(s:string)=>void,
) => {
  const OpenSankeyPlusDiagramSelectorInner = (
    t: TFunction, 
    convert_data: (s:SankeyPlusData)=>null,
    sankey_data: SankeyPlusData,
    set_sankey_data: (s:SankeyPlusData)=>null,
    prev_sankey_data: SankeyPlusData,
    set_prev_sankey_data: (s:SankeyPlusData)=>void, 
    updateLayout: (data: SankeyPlusData,new_layout: SankeyPlusData,mode:string[])=>void, 
    elementToDispose : string[]
  ) => {
    const [file_layout, set_file_layout] = useState<Blob[] | undefined>(undefined)

    return <InputGroup>
      
      <InputGroup.Text style={{width:'20%'}} >{t('Menu.Transformation.fmep')}</InputGroup.Text>
      <Button 
        className='btn_menu_config' 
        style={{width:'10%'}}
        variant={diagramType==='File'?'primary':'outline-primary'}
        onClick={
          () => {
            setDiagramType('File')
          }}>Fichier</Button>
      <Button 
        className='btn_menu_config'
        style={{width:'10%'}}
        variant={diagramType==='View'?'primary':'outline-primary'}
        onClick={
          () => {
            setDiagramType('View')
          }}>Vues</Button>
      
      {diagramType==='File' ? <>
        <Form.Control
          type="file"
          onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)} />
      </> : 
        
        <Form.Select 
          onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> {
            set_view_selected(evt.target.value)
          }}>
          <option key='none' value='none'>{t('view.actual')}</option>
          {master_data ? master_data.view.map(d => {
            return <option key={d.id} value={d.id}>{d.nom}</option>
          }) : <></>}
        </Form.Select>
      }
      
      <Button
        className='btn_menu_config'
        style={{width:'15%'}}
        onClick={() => {
          if (diagramType === 'View') {
            if (view_selected === 'none') {
              // View selected is master data
              if (view === 'none' ) {
                // No update of master data by master data
                return
              }
              //- current view is updated by master data
              updateLayout(sankey_data,master_data,elementToDispose)
              set_sankey_data({ ...JSON.parse(JSON.stringify(sankey_data)) })
            } else {
              // A view is selected to update either another view or the master data
              if (view === view_selected ) {
                // No update of view by itself
                return
              }                
              const data_view=get_data_from_view(master_data,view_selected)
              updateLayout(sankey_data,data_view,elementToDispose)
              const copy_data = JSON.parse(JSON.stringify(sankey_data))
              set_sankey_data(copy_data)
              if (view === 'none' ) {
                recompute_views(copy_data,master_data,set_master_data)
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
                  convert_data(new_layout)
                  complete_sankey_data(new_layout, default_sankey_data, default_node, default_link)
                  set_prev_sankey_data(JSON.parse(JSON.stringify(sankey_data)))
                  updateLayout(sankey_data, new_layout, elementToDispose)
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
        className='btn_menu_config'
        style={{width:'15%'}}
        onClick={() => {
          const copy_data = { ...JSON.parse(JSON.stringify(prev_sankey_data)) }
          set_sankey_data(copy_data)
          if (view === 'none' ) {
            // if master is being updated we need to set it.
            set_master_data(copy_data)
          }
        } }>{t('Menu.Transformation.undo')}
      </Button>
      
    </InputGroup>
  }
  return OpenSankeyPlusDiagramSelectorInner
}

export const apply_transformation_opensankey_plus_elements = (
  t:TFunction,
  forceUpdate: boolean,
  setForceUpdate: (b:boolean)=>null,
  elementToDispose: string[]
) => {return [
  <InputGroup>
    <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.freeLabels')}</InputGroup.Text>
    <Button
      className='btn_menu_config'
      style={{width:'20%'}}
      variant={elementToDispose.includes('freeLabels')?'primary':'outline-primary'} 
      onClick={() => {
        if(!elementToDispose.includes('freeLabels')){
          elementToDispose.push('freeLabels')
          setForceUpdate(!forceUpdate)
        }else{
          elementToDispose.splice(elementToDispose.indexOf('freeLabels'),1)
          setForceUpdate(!forceUpdate)
        }}
      }
    >{elementToDispose.includes('freeLabels')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
    
  </InputGroup>,
  <InputGroup>
    <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Views')}</InputGroup.Text>
    <Button
      className='btn_menu_config'
      style={{width:'20%'}}
      variant={elementToDispose.includes('Views')?'primary':'outline-primary'} 
      onClick={() => {
        if(!elementToDispose.includes('Views')){
          elementToDispose.push('Views')
          setForceUpdate(!forceUpdate)
        }else{
          elementToDispose.splice(elementToDispose.indexOf('Views'),1)
          setForceUpdate(!forceUpdate)
        }}
      }
    >{elementToDispose.includes('Views')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
  </InputGroup> 
]}

export const plus_sankey_layout=(
  data:SankeyPlusData,
  new_layout:SankeyPlusData,
  mode:string[]
)=>{
  if (mode.includes('freeLabels') && new_layout.labels) {
    if (!data.labels) {
      data.labels = {}
    }
    const difference = deep_diff.diff(data.labels, new_layout.labels)
    if (difference) {
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.labels, {}, diff))
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
          if((view_of_new_layout.view_data as SankeyPlusData ).version){
            data.view.push(view_of_new_layout)
          }else if((view_of_new_layout.view_data as DiffType).diff!==undefined){
            (view_of_new_layout.view_data as DiffType).diff.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(view_data, {}, diff))
            const data_view_diff = deep_diff.diff(data,view_data) as {path:string[],kind:string,rhs:string}[]
            (view_of_new_layout.view_data as DiffType).diff = data_view_diff.filter((d:{path:string[]}) => !d.path.includes('view'))
            data.view.push(view_of_new_layout)
          }
           
        }
      }
      )
    }
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
