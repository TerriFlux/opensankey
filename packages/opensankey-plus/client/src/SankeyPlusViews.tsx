// Standard libs
import React, { ChangeEvent, useRef, useState } from 'react'
import * as d3 from 'd3'

import { TFunction } from 'i18next'
import LZString from 'lz-string'
import {
  Diff,
  diff as getDiff,
  applyChange
} from 'deep-diff'

import {
  Form,
  Toast,
  Badge,
  Popover,
  Overlay
} from 'react-bootstrap'
import { FaHome, FaPlus, FaCaretSquareRight, FaCaretSquareLeft } from 'react-icons/fa'
import { FaArrowDown, FaArrowUp, FaMinus, FaSave,FaCheck,FaCopy} from 'react-icons/fa'

// Imported libs
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faListCheck, faXmark, faExclamation, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Checkbox,
  Select,
  Input,
  InputGroup,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalContent
} from '@chakra-ui/react'

// OpenSankey Libs
import { SankeyLinkValueDict, TagsGroup} from 'open-sankey/src/types/Types'
import { SmoothClasses} from 'open-sankey/dist/configmenus/SankeyUtils'

// Local libs
import {
  CheckCurrentViewSavedFType,
  FilterViewFType,
  GetDataFromViewFType,
  getSetDiagramFType,
  OSPKeyHandlerFType,
  MenuEnregistrerViewFType,
  modal_transparent_view_attrFType,
  modal_view_not_savedFType,
  OpenSankeyPlusCheckpointButtonFType,
  RecomputeViewsFType,
  SankeyPlusBannerViewFType,
  SankeyPlusMenuPreferenceViewFType,
  SelecteurViewFType,
  setValueFType,
  view_toast_update_viewFType,
  view_toastFType,
  viewsAccordionFType
} from '../types/SankeyPlusViewsTypes'

import {
  SankeyPlusData,
  differenceType,
  DiffType,
  ViewType,
  SankeyPlusApplicationDataType,
  SankeyUnitData
} from '../types/Types'
import {
  OSTooltip,
  updateLayoutOSTyped
} from './import/OpenSankey'
import { deleteGLabel } from './SankeyPlusLabels'

export const getSetDiagramFunc : getSetDiagramFType = (
  set_master_data: (d:SankeyPlusData | undefined)=>void,
  set_view: (s:string)=>void,
  DefaultSankeyData: ()=>SankeyPlusData
)  => {
  return (
    the_diagram : string,
    set_data : (d:SankeyPlusData)=>void,
    convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void
  ) => {
    const sous_filieres = window.sankey.sous_filieres

    const new_data = JSON.parse(
      JSON.stringify(
        window.sankey[sous_filieres[the_diagram]]
      )
    ) as SankeyPlusData
    convert_data(new_data,DefaultSankeyData)
    d3.select(' .opensankey #svg').on('.zoom', null)
    if (window.SankeyToolsStatic && new_data.view.length > 0) {
      set_master_data(new_data)
      set_view(new_data.view[0].id)
      set_data(GetDataFromView(new_data,new_data.view[0].id) as SankeyPlusData)
    } else {
      set_master_data(undefined)
      set_data(new_data)
      set_view('none')
    }
  }
}

export const view_toast : view_toastFType =(dict_hook_ref_setter_show_dialog_components)=> {
  const show_toast=useState(false)
  dict_hook_ref_setter_show_dialog_components.show_toast_new_view.current=show_toast[1]
  return (<Toast show={show_toast[0]} bg='success' className='toastView' style={{ 'position': 'absolute', 'marginTop': '300px', 'marginLeft': '250px', 'zIndex': 1 }}>
    <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Enregistrement</small> </Toast.Header>
    <Toast.Body>Vue sauvegardée</Toast.Body>
  </Toast>)}

export const view_toast_update_view : view_toast_update_viewFType = (dict_hook_ref_setter_show_dialog_components)=> {
  const show_toast=useState(false)
  dict_hook_ref_setter_show_dialog_components.show_toast_update_view.current=show_toast[1]

  return(<Toast show={show_toast[0]} bg='info' className='toastView' style={{ 'position': 'absolute', 'marginTop': window.innerHeight/4,'marginLeft': window.innerWidth/2, 'zIndex': 100 }}>
    <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Mise à jour</small> </Toast.Header>
    <Toast.Body>Vue mise à jour</Toast.Body>
  </Toast>)}

export const setValue : setValueFType = (
  dataTags: TagsGroup[],
  v_target: SankeyLinkValueDict,
  v_source: SankeyLinkValueDict,
  depth: number
) => {
  const dataTag = Object.values(dataTags)[depth]
  const listKey = Object.keys(dataTag.tags)
  for (const i in listKey) {
    if (depth === dataTags.length - 1 ) {
      v_target[listKey[i]] = v_source[listKey[i]]
    } else {
      if ( v_target[listKey[i]] === undefined ) {
        v_target[listKey[i]] = {}
      }
      setValue(
        dataTags,
        v_target[listKey[i]] as SankeyLinkValueDict,
        v_source[listKey[i]] as SankeyLinkValueDict,
        depth + 1)
    }
  }
}

export const GetDataFromView : GetDataFromViewFType = (
  master_data:SankeyPlusData|undefined,
  id_view_to_see:string
)=>{
  // Copy master data
  if (!master_data) {
    alert('sankey master undefined')
    return undefined
  }
  const copy_master_data= {...master_data}
  copy_master_data.view = []
  let data_init=JSON.parse(JSON.stringify(copy_master_data)) as SankeyPlusData
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
    data_init=view_object.view_data as SankeyPlusData
  }
  updateLayoutOSTyped(data_init,master_data,view_object.heredited_attr_from_master)
  // updateLayout(data_init,master_data,view_object.heredited_attr_from_master)
  return data_init
}

export const FilterView : FilterViewFType = (pre_diff) => {
  return JSON
    .parse(JSON.stringify(pre_diff))
    .filter((d:{path:string[]})=>{
      return !d.path.includes('view')
    })
    .map((d:{path:string[],kind:string,item:{kind:string}})=>{
      if(d.kind === 'D'){
        delete ((d as unknown) as differenceType).lhs
      }
      if(d.kind === 'A' && d.item.kind === 'D'){
        delete ((d as unknown) as differenceType).item.lhs
      }
      if(d.kind === 'E'){
        delete ((d as unknown) as differenceType).lhs
      }
      return d as Diff<undefined, SankeyPlusData>
    })
}

export const RecomputeViews : RecomputeViewsFType = (
  new_master_data: SankeyPlusData | undefined,
  prev_master_data: SankeyPlusData| undefined,
  set_master_data: (d:SankeyPlusData| undefined,)=>void
) =>{
  if ( prev_master_data) {
    new_master_data!.view.forEach(current_v => {
      if ( prev_master_data.view.filter(v=>v.id===current_v.id).length === 0) {
        return
      }
      const data_view=GetDataFromView(prev_master_data,current_v.id) as SankeyPlusData

      if((current_v.view_data as SankeyPlusData).version){
        current_v.view_data=data_view
      }
      else{
        let difference = getDiff(new_master_data, data_view)
        difference = (difference !== undefined) ? difference : []
        difference = FilterView(difference)
        if (difference.length > 0) {
          (current_v.view_data as DiffType).diff = difference
        }
      }
    })
  }
  // master data is now set
  set_master_data({...JSON.parse(JSON.stringify(new_master_data))})
}

export const OSPKeyHandler : OSPKeyHandlerFType = (
  applicationContext,
  e: KeyboardEvent,
  dict_variable_application_data,
  dict_variable_elements_selected,
  dict_hook_ref_setter_show_dialog_components,
  reDrawPlusLabels,
  ComponentUpdater
) => {
  const {t,has_open_sankey_plus}=applicationContext
  const {show_toast_new_view}=dict_hook_ref_setter_show_dialog_components
  const {data,set_data,master_data,set_master_data,view,set_view,set_view_not_saved}=dict_variable_application_data
  const {multi_selected_label}=dict_variable_elements_selected
  const is_master=dict_variable_application_data.view==='none'
  if(e.key==='a' && e.ctrlKey){
    e.preventDefault()
    multi_selected_label.current=Object.values(data.labels)
    reDrawPlusLabels(multi_selected_label.current)
    ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())
  }
  // Clone current data,if its a view clone the view
  if (has_open_sankey_plus && e.key === 'x' && (e.ctrlKey||e.metaKey)) {
    e.preventDefault()

    if (is_master) {
      // If we do a control+X while we are on is_master data, we create view empty
      // data is is_master data and master_data might not be  se
      const new_ind = 'view_' + String(new Date().getTime())
      // const copy_data = {diff:[]}
      const copy_data = JSON.parse(JSON.stringify(data))
      const new_master_data = data
      new_master_data.view.push({
        id: new_ind,
        view_data: copy_data,
        nom: 'data_' + new_ind,
        details: '',
        heredited_attr_from_master:[]
      })
      RecomputeViews(new_master_data,master_data,set_master_data)
      // is_master data is now set
      // at this stage data is a view and is equal with is_master data
      show_toast_new_view.current!(true)
      setTimeout(function () {
        show_toast_new_view.current!(false)
      }, 3000)
      set_view(new_ind)
      new_master_data.current_view=new_ind
      set_master_data({...new_master_data})
      set_data({...copy_data})
    } else {
      const new_ind = 'view_' + String(new Date().getTime())
      const current_view_object=master_data!.view.filter(v=>v.id === view)[0]

      const copy_data = JSON.parse(JSON.stringify(current_view_object.view_data))
      master_data!.view.push({
        id: new_ind,
        view_data: copy_data,
        nom: t('view.prefix_copy')+' '+current_view_object.nom,
        details: '',
        heredited_attr_from_master:[]

      })


      // is_master data is now set
      master_data!.current_view=new_ind
      set_view(new_ind)
      set_master_data({...master_data!})
      // get view data & set_data to avoid synchronisation problem
      const n_data=GetDataFromView(master_data,new_ind)
      if(n_data){
        set_data({...n_data})
      }
    }
  }

  if(e.key==='s' && e.ctrlKey && !e.shiftKey){
    e.preventDefault()

    dict_variable_application_data.function_on_wait.current=()=>{
      ComponentUpdater.updateComponenSaveInCache.current(false)

      if(view!=='none'){
        // If we do a control+S while we are on a view, we save the difference between the data we are handling
        // and the is_master data. These difference are the saved the view we are currently on
        // Get difference between master_data and the current data then save it in view
        let difference = getDiff(master_data, data)
        difference = (difference !== undefined)?difference:[]
        difference = difference.filter((d) => !(d.path!.includes('view')))
        difference = FilterView(difference)

        // Check wich format of the view is better optimized for memory storage
        const raw_is_smaller_than_diff=JSON.stringify(data).length<JSON.stringify(difference).length
        master_data!.view.filter(v => v.id === view)[0].view_data = raw_is_smaller_than_diff?JSON.parse(JSON.stringify(data)):{diff:difference}

        // Save is_master data with the view we are currently working on updated
        set_master_data({...master_data!})
        // Save master_data data in localStorage
        localStorage.setItem('data', LZString.compress(JSON.stringify(master_data)))
        dict_hook_ref_setter_show_dialog_components.show_toast_update_view.current!(false)

      }else{
        // Save current data (wich is master_data)
        localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
        localStorage.setItem('last_save', 'true')
      }
      ComponentUpdater.updateComponenSaveInCache.current(true)

    }

    if(view!=='none'){
      dict_hook_ref_setter_show_dialog_components.show_toast_update_view.current!(true)
    }
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_waiting.current(true)




  }
  // Changing view to is_master
  if (!is_master && e.key === 'F7') {

    // Check if there is unsaved change before we switch view
    // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
    let saved=true
    if(view !== 'none' && has_open_sankey_plus ){
      const diff = CheckCurrentViewSaved(master_data, data,view)
      if(diff.length>0 && !window.SankeyToolsStatic){
        saved = false
        set_view_not_saved(view)
        set_view('none')
      }
    }

    if(saved){
      set_view('none')
      set_data(JSON.parse(JSON.stringify(master_data)))
    }
  }
  // Changing view to next or previous
  if ([ 'F8', 'F9'].includes(e.key)) {
    if (e.key === 'F8') {
      // going backward
      //Cherche la position de la vue sélectionné dans le tableau de vue
      let ind = -1
      master_data!.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      if (ind === -1) {
        ind = 1
      } else if (ind===0) {
        ind = Object.keys(master_data!.view).length
      }
      const data_view=GetDataFromView(master_data,master_data!.view[ind-1].id) as SankeyPlusData

      // Check if there is unsaved change before we switch view
      // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
      let saved=true
      if(view !== 'none' &&  has_open_sankey_plus ){
        const diff = CheckCurrentViewSaved(master_data, data, view)
        if (diff.length>0 && !window.SankeyToolsStatic) {
          saved=false
          set_view_not_saved(view)
          set_view(master_data!.view[ind-1].id)
        }
      }
      if(saved){
        set_data({...data_view as SankeyPlusData})
        set_view(master_data!.view[ind-1].id)
      }

    } else if (e.key === 'F9') {
      let new_master_data : SankeyPlusData | undefined
      if (is_master) {
        new_master_data = data
        RecomputeViews(new_master_data,master_data,set_master_data)
      } else {
        new_master_data = master_data
      }
      //Cherche la position de la vue sélectionné dans le tableau de vue
      let ind = -1
      new_master_data!.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante
      if (ind === Object.keys(new_master_data!.view).length - 1) {
        ind = -1
      } else if (ind === -1) {
        ind = -1
      }
      // Check if there is unsaved change before we switch view
      // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
      if(view==='none'){
        new_master_data!.current_view=master_data!.view[ind+1].id
        set_master_data(new_master_data)
      }
      let saved=true
      if(view !== 'none' && has_open_sankey_plus ){
        const diff=CheckCurrentViewSaved(new_master_data,data,view)
        if(diff.length>0 && !window.SankeyToolsStatic){
          saved=false
          set_view_not_saved(view)
          set_view(master_data!.view[ind+1].id)
        }
      }
      const data_view=GetDataFromView(new_master_data,new_master_data!.view[ind+1].id) as SankeyPlusData
      if(saved){
        set_data(data_view)
        set_view(new_master_data!.view[ind+1].id)
      }
      //}
    }
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ((document.activeElement?.tagName==='INPUT')? d3.select(document.activeElement).attr('value')==='menuConfigButton':true) && (!document.activeElement?.className.includes('ql-editor'))) {
    // Deplace les zdt sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
    // (exemples : le input de la largeur minimal d'un noeud)
    e.preventDefault()
    if (e.key === 'ArrowUp') {
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
        if (d !== undefined) {
          return d.idLabel
        }
      }).includes(f.idLabel)).map(d => {

        d.y = d.y - data.grid_square_size

        let y_max = 0
        Object.values(data.labels).map(d => {
          y_max = (d.y > y_max) ? d.y : y_max
        })
        //Diminue hauteur svg si le noeud est près du bord
        if (y_max < data.height - 100 && data.height - 100 >= window.innerHeight) {
          data.height -= 90
        }
      })
    } else if (e.key === 'ArrowDown') {
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
        if (d !== undefined) {
          return d.idLabel
        }
      }).includes(f.idLabel)).map(d => {


        d.y = d.y + data.grid_square_size

        //Augumente hauteur svg si le noeud est près du bord
        if (d.y > data.height - 100) {
          data.height += 100
        }
      })
    } else if (e.key === 'ArrowLeft') {
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
        if (d !== undefined) {
          return d.idLabel
        }
      }).includes(f.idLabel)).map(d => {


        d.x = d.x - data.grid_square_size

        //Diminue largeur svg si le noeud est près du bord
        if (d.x < data.width - 100 && data.width - 100 >= window.innerWidth - 40) {
          data.width -= 50
        }
      })
    } else if (e.key === 'ArrowRight') {
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
        if (d !== undefined) {
          return d.idLabel
        }
      }).includes(f.idLabel)).map(d => {


        d.x = d.x + data.grid_square_size

        //Augumente largeur svg si le noeud est près du bord
        if (d.x > data.width - 100) {
          data.width += 100
        }
      })
    }
    reDrawPlusLabels(multi_selected_label.current)
  }

  // Add deselection of all selected zdt
  if (e.key === 'Escape') {

    multi_selected_label.current.forEach(l=>{
      d3.select('#'+l.idLabel+ ' rect').attr('stroke-width',1)
    })
    multi_selected_label.current=[]

  }

  if(e.key==='Delete' && (!document.activeElement?.className.includes('ql-editor'))){
    if(document.activeElement?.tagName!=='INPUT' || d3.select(document.activeElement).attr('value')==='menuConfigButton')
    {
      deleteGLabel(multi_selected_label.current,dict_variable_elements_selected)
      data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
      multi_selected_label.current=[]
      ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())
    }
  }
}

export const SelecteurView : SelecteurViewFType =(
  dict_variable_application_data,
  dict_variable_elements_selected,
  t:TFunction,
  set_view_not_saved:(s:string)=>void,
  has_open_sankey_plus:boolean
)=>{
  const {data,set_data,master_data,set_master_data,view,set_view}=dict_variable_application_data
  const {multi_selected_nodes,multi_selected_links,multi_selected_label}= dict_variable_elements_selected

  let vname = ''
  if ((master_data && master_data.current_view && master_data.current_view!=='none' &&master_data.view.length>0)) {
    if (master_data.view.filter(v=>v.id===master_data.current_view).length > 0) {
      vname = master_data.view.filter(v=>v.id===master_data.current_view)[0].nom
    } else {
      vname = ''
    }
  }
  const [s_value_editor_name_view,sValueEditorNameView]=useState(vname)
  const [s_select_or_edit,sSelectOrEdit]=useState('select')
  dict_variable_elements_selected.r_setter_value_editor_name_view.current=sValueEditorNameView

  const selecteur=<Select
    variant='menuconfigpanel_option_select'
    onDoubleClick={()=>has_open_sankey_plus && master_data && master_data.current_view && master_data.current_view!=='none' ?sSelectOrEdit('edit'):<></>}
    onChange={
      (evt: React.ChangeEvent<HTMLSelectElement>) => {
        multi_selected_nodes.current = []
        multi_selected_links.current = []
        multi_selected_label.current = []
        // Depending on the value selected we :
        //  - If we select a view :Get a modified version of master data according to the modifications saved in the view selected
        //      and save original master data in a variable that the view can't modify
        //  - If we select master('none'): Get the data we are workinkg on to be the master data

        // Verify if we saved the view before changing the view
        // If not, we display a modal that will warn the user with the possibility to save before exit
        let saved=true
        if(view !== 'none' ){
          const difference=CheckCurrentViewSaved(master_data,data,view)
          if(difference.length !== 0 && !window.SankeyToolsStatic){
            saved=false
            set_view_not_saved(view)
            set_view(evt.target.value)
          }
        }

        if(saved){
          if (evt.target.value === '') {
            return
          } else if(evt.target.value !== 'none'){
            let new_master_data : SankeyPlusData
            if (view === 'none') {
              new_master_data = JSON.parse(JSON.stringify(data))
              RecomputeViews(new_master_data,master_data,set_master_data)
            } else {
              new_master_data= JSON.parse(JSON.stringify(master_data)) as SankeyPlusData
            }
            set_view(evt.target.value)
            const data_view=GetDataFromView(new_master_data,evt.target.value) as SankeyPlusData
            set_data(data_view)
            new_master_data.current_view=evt.target.value
            set_master_data(new_master_data)


          } else if(evt.target.value === 'none'){
            set_view(evt.target.value)
            set_data(JSON.parse(JSON.stringify(master_data)))
          }
        }
      }
    }
    value={view}
  >
    <option hidden value={'none'}>{t('view.actual')}</option>
    {master_data ? master_data.view.map(d => {
      return <option key={d.id} value={d.id}>{d.nom}</option>
    }) : <></>}
  </Select>

  const editeur_name=<Input
    variant='menuconfigpanel_option_input'
    value={s_value_editor_name_view}
    onChange={(evt)=>{
      sValueEditorNameView(evt.target.value)
    }}
    onBlur={()=>{
      master_data!.view.filter(v=>v.id===view)[0].nom=s_value_editor_name_view
      set_master_data({...master_data!})
      sSelectOrEdit('select')
    }}
  />

  return has_open_sankey_plus && s_select_or_edit==='edit'?editeur_name:selecteur
}
export const viewsAccordion : viewsAccordionFType = (
  dict_variable_application_data,
  t:TFunction,
  is_activated:boolean,
  convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void,
  DefaultSankeyData: ()=>SankeyPlusData,
  view_selector
) => {
  const {data,set_data,master_data,set_master_data,view,set_view}= dict_variable_application_data
  const _load_json = useRef<HTMLInputElement>(null)

  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)

  return <>
    <AccordionItem
      // id='Visualisation'
      style={{ 'display': (data.accordeonToShow.includes('Vis')) ? 'initial' : 'none' }}
      // eventKey="Visualisation"
      // onClick={
      //   evt => {
      //     if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && uiElementsRef.ref_nav_item_active.current === 'Visualisation') {
      //       uiElementsRef.ref_setter_nav_item_active.current!('')
      //     } else {
      //       uiElementsRef.ref_setter_nav_item_active.current!('Visualisation')
      //     }
      //   }
      // }
    >
      <AccordionButton>
        <Box as='span' layerStyle='menuconfig_entry'>
          {t('view.storytelling')}
        </Box>
        {(!is_activated)?
          <OSTooltip label={t('Menu.sankeyPlusDisabled')}>
            <Badge pill
              bg="white"
              style={{marginLeft:'5px', fontSize:'1.3em'}}>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
            </Badge>
          </OSTooltip>:
          <Badge pill bg='info' style={{marginLeft:'auto'}}>Beta</Badge>}
        <AccordionIcon/>
      </AccordionButton>
      <AccordionPanel>
        <Box layerStyle='menuconfigpanel_grid'>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              {t('view.select')}
            </Box>
            <InputGroup
              variant='menuconfigpanel_option_input'>
              {view_selector}
            </InputGroup>
          </Box>
          <Table size='sm'>
            <Thead>
              <Tr>
                <Th>{t('view.name')}</Th>
                <Th>Position</Th>
                <Th>{t('view.delete')}</Th>
                {/* <Th>{t('view.copy')}</Th>
                <Th>{t('view.import')}</Th>
                <Th>{t('view.export')}</Th> */}
              </Tr>
            </Thead>
            <Tbody>
              {master_data ? Object.values(master_data.view).map(d => {
                return (
                  <Tr style={{ 'border': (d.id === view) ? '2px solid #5a9282' : 'none' }}>
                    <Td>
                      <Input
                        variant='menuconfigpanel_option_input'
                        value={d.nom}
                        isDisabled={!is_activated}
                        onChange={evt => {
                        // Change the name of the view
                          master_data.view.filter(v => v.id === d.id)[0].nom = evt.target.value
                          set_master_data({...master_data})
                        }}
                      />
                    </Td>
                    <Td>
                      {/* Change the position of the view in the liste of view from master data */}
                      <Button variant='menuconfigpanel_option_btn_in_table' isDisabled={!is_activated}
                        onClick={
                          () => {
                            let ind = -1
                            master_data.view.map((v, i) => {
                              ind = (v.id === d.id) ? i : ind
                            })
                            const toShift = master_data.view[ind]
                            master_data.view.splice(ind, 1)
                            master_data.view.splice(ind - 1, 0, toShift)
                            set_master_data({...master_data})
                            set_data({ ...data })
                          }
                        }
                      ><FaArrowUp />
                      </Button>
                      <Button variant='menuconfigpanel_option_btn_in_table' isDisabled={!is_activated}
                        onClick={
                          () => {
                            let ind = -1
                            master_data.view.map((v, i) => {
                              ind = (v.id === d.id) ? i : ind
                            })
                            const toShift = master_data.view[ind]
                            master_data.view.splice(ind, 1)
                            master_data.view.splice(ind + 1, 0, toShift)
                            set_master_data({...master_data})
                            set_data({ ...data })
                          }
                        }
                      ><FaArrowDown />
                      </Button>
                    </Td>
                    <Td><Button
                      variant='menuconfigpanel_del_button_in_table'
                      isDisabled={!is_activated}
                      onClick={
                        // Delete the view
                        () => {
                          let ind = -1
                          master_data.view.map((v, i) => {
                            ind = (v.id === d.id) ? i : ind
                          })
                          master_data.view.splice(ind, 1)
                          // If master is not a catalog & we delete the current view then we go to master
                          // If master is a catalog and the catalog of view is empty then we got to master
                          if((master_data.current_view===view && master_data.is_catalog===false) || (master_data.view.length===0 && master_data.is_catalog===true)){
                            set_view('none')
                            set_data({ ...master_data })
                          }else if(master_data.is_catalog && master_data.view.length>0){
                          // If master is a catalog and the catalog is not empty then we got to the first view
                            set_view(master_data.view[0].id)
                            const tmp=GetDataFromView(master_data,master_data.view[0].id) as SankeyPlusData
                            set_data({ ...tmp })
                          }
                          if(master_data.view.length===0){
                            master_data.is_catalog=false
                            set_data({...master_data})

                          }
                          set_master_data({...master_data})
                        }
                      }
                    ><FaMinus /></Button></Td>
                  </Tr>
                )
              }) : <></>}
            </Tbody>
          </Table>
        </Box>


      </AccordionPanel>
    </AccordionItem>

    <Form.Control
      type="file"
      ref={_load_json}
      style={{ display: 'none' }}
      onChange={(evt: ChangeEvent) => {
        const files = (evt.target as HTMLFormElement).files
        const reader = new FileReader()

        reader.onload = (() => {
          return (e: ProgressEvent<FileReader>) => {
            const result = String((e.target as FileReader).result)
            const result_data = JSON.parse(result)
            let ind = -1
            master_data!.view.map((v, i) => {
              ind = (v.id === _load_json.current?.id) ? i : ind
            })
            const cur_view = master_data!.view[ind]
            const imported_data=JSON.parse(JSON.stringify(result_data))
            imported_data.view=[]
            convert_data(imported_data,DefaultSankeyData)
            let difference = getDiff(master_data, imported_data)
            difference = JSON.parse(
              JSON.stringify(
                (difference !== undefined)?
                  difference:[]
              )
            )
            difference = (difference as Diff<undefined, SankeyPlusData>[]).filter((d) => !(d.path!.includes('view')))
            cur_view.view_data = { diff: difference }

            cur_view.nom = (files[0].name).replace('.json','')

            set_master_data({...master_data!})
            set_data({...imported_data})
            set_view(cur_view.id)
          }
        })()
        reader.readAsText(files[0])
      }}
    />
  </>
}

// Function to check if the current data of the view is unsaved
// We compare the differences saved in the master_data with the current changement of the view
export const CheckCurrentViewSaved : CheckCurrentViewSavedFType =(
  master_data:SankeyPlusData| undefined,
  data:SankeyPlusData| undefined,
  view:string
) => {
  const view_data = GetDataFromView(master_data,view)
  //const data=JSON.parse(JSON.stringify(data))
  //const updated_diff=JSON.parse(JSON.stringify(original_diff))

  //updateLayout(data_updated_layout,master_data,master_data.view.filter(v=>v.id===view)[0].heredited_attr_from_master)
  //updateLayout(updated_diff,master_data,master_data.view.filter(v=>v.id===view)[0].heredited_attr_from_master)

  let difference = getDiff(view_data, data)
  difference = (difference !== undefined)?difference:[]
  difference = difference.filter((d)=>{
    // Ne prend pas en compte les modif de vue, de la largeur ou hauteur du sankey
    return (
      (d.path![0] !== 'current_view') &&
      (d.path![0] !== 'view') &&
      (d.path![0] !== 'width') &&
      (d.path![0] !== 'height') &&
      !(d.path!.length === 4 && d.path![3] === 'vert_shift'))
  })
  return difference
}

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyPlusData }
  }

// Fucntion that return a toolbar to navigate,create or modify view, it contain :
// - a button to return to master data
// - a button to create a view if we are currently on master data
// - 2 button to navigate in the list of view
// - a dropdown to directly select the view we want to display (or select master data)
// Then if we are in a view there is additionnal button
// - a button to choose variable of the view that get their value from master
// - a button to clone the actual view
// a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'Type de noeud'
export const SankeyPlusBannerView : SankeyPlusBannerViewFType =(
  dict_variable_application_data,
  applicationContext,
  dict_hook_ref_setter_show_dialog_components,
  convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void,
  view_selector
)=>{
  const {data,set_data,master_data,set_master_data,get_default_data,view,set_view}=dict_variable_application_data
  const {ref_setter_show_modal_transparent_view_attr}=dict_hook_ref_setter_show_dialog_components
  const m_d=master_data?master_data:data
  const [show_modify_name_view,set_show_modify_name_view]=useState(false)
  const target_popover_modify_view_name=useRef(null)
  const _load_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }
  const {t,has_open_sankey_plus}=applicationContext
  const has_views = master_data?master_data.view.length>0:false
  const next_button_disabled = m_d.view && (m_d.view.map(d=>d.id).indexOf(view) === m_d.view.length-1)
  const prev_button_disabled = m_d.view && (m_d.view.map(d=>d.id).indexOf(view) === 0 || view === 'none')

  const buttonCreateView=<OSTooltip placement='bottom' label={(!has_open_sankey_plus)?(t('Menu.sankeyPlusDisabled')):t('view.tooltips.buttonCreateView')}>
    <Box>
      <Button
        variant='submenu_nav_btn'
        isDisabled={!has_open_sankey_plus}
        onClick={() => {
          const ev = document
          const t=new KeyboardEvent('keydown',{key:'x',ctrlKey:true})
          if (ev.onkeydown) {
            ev.onkeydown(t)
          }
        }}
      >
        <FaPlus
          style={{opacity:(!has_open_sankey_plus)?'0.6':'1'}}/>
        {!has_open_sankey_plus?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('Menu.addView')}
      </Button>
    </Box>

  </OSTooltip>


  // TO DELETE WHEN UNITARY SANKEY WILL BE MERGE IN SANKEYPLUS
  const special_cast_for_unit_sankey=data as SankeyUnitData

  const button_heredited_attr_from_master=!(special_cast_for_unit_sankey.unitary_node && special_cast_for_unit_sankey.unitary_node.length>0)?<OSTooltip
    placement='bottom'
    label={(!has_open_sankey_plus)?(t('Menu.sankeyPlusDisabled')):t('view.tooltips.buttonCloneMasterAttrView')}>
    <Box>
      <Button
        variant='submenu_nav_btn'
        isDisabled={!has_open_sankey_plus}
        onClick={
          () => {
            ref_setter_show_modal_transparent_view_attr.current(true)
          }
        }
      >
        <FontAwesomeIcon style={{opacity:(!has_open_sankey_plus)?'0.6':'1'}} icon={faListCheck} />
        {!has_open_sankey_plus?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('view.keep_master_var')}
      </Button>
    </Box>
  </OSTooltip>:<></>

  const create_data_catalog=<OSTooltip placement='bottom' label={(!has_open_sankey_plus)?(t('Menu.sankeyPlusDisabled')):t('view.tooltips.catalog_data')}>
    <Box>
      <Button
        variant= {master_data && master_data.is_catalog?'submenu_nav_btn':'submenu_nav_btn'}
        isDisabled={!has_open_sankey_plus}
        onClick={
          () => {
            if (_load_json_catalog.current) {
              _load_json_catalog.current.name = ''
              _load_json_catalog.current.click()
            }
          }
        }
      >
        <FaCopy
          style={{opacity:(!has_open_sankey_plus)?'0.6':'1'}}/>
        {!has_open_sankey_plus?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('view.catalog')}
      </Button>
    </Box>
  </OSTooltip>


  const button_delete_actual_view=<OSTooltip placement='bottom' label={(!has_open_sankey_plus)?(t('Menu.sankeyPlusDisabled')):t('view.tooltips.button_delete_actual_view')}>
    <Box>
      <Button
        variant='submenu_nav_btn'
        isDisabled={!has_open_sankey_plus}
        onClick={
          // Delete the view
          () => {
            let ind = -1
            master_data!.view.map((v, i) => {
              ind = (v.id === view) ? i : ind
            })
            master_data!.view.splice(ind, 1)
            // If master is not a catalog & we delete the current view then we go to master
            // If master is a catalog and the catalog of view is empty then we got to master
            if((master_data!.current_view===view && master_data!.is_catalog===false) || (master_data!.view.length===0 && master_data!.is_catalog===true)){
              set_view('none')
              set_data({ ...master_data! })
            }else if(master_data!.is_catalog && master_data!.view.length>0){
              // If master is a catalog and the catalog is not empty then we got to the first view
              set_view(master_data!.view[0].id)
              const tmp=GetDataFromView(master_data,master_data!.view[0].id) as SankeyPlusData
              set_data({ ...tmp })
            }
            if(master_data!.view.length===0){
              master_data!.is_catalog=false
              set_data({...master_data!})
            }
            set_master_data({...master_data!})
          }
        }>

        <FaMinus/>
        {!has_open_sankey_plus?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('view.delete')}
      </Button>
    </Box>
  </OSTooltip>



  const popover_modify_view_name=
  <Popover id="popover-link-filter" style={{maxWidth:'100%','overflowY':'auto'}}>
    <Popover.Header as="h3">{t('view.modify_name_view')}</Popover.Header>
    <Popover.Body >
      <Form.Control
        type='text'
        value={master_data && master_data.current_view && master_data.current_view!=='none'?master_data.view.filter(v=>v.id===master_data!.current_view)[0].nom:''}
        onChange={(evt)=>{
          master_data?master_data.view.filter(v=>v.id===master_data!.current_view).forEach(v=>v.nom=evt.target.value):''
          set_data({...data})
        }}
      >

      </Form.Control>
    </Popover.Body>
  </Popover>


  const file_reder_for_catalog=<Form.Control
    type="file"
    multiple
    accept='.json'
    ref={_load_json_catalog}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files
      const cpy_master_data=(master_data)?master_data:JSON.parse(JSON.stringify(data))
      cpy_master_data!.is_catalog=true
      cpy_master_data!.nodeTags={}
      cpy_master_data!.fluxTags={}
      cpy_master_data!.dataTags={}
      cpy_master_data!.nodes={}
      cpy_master_data!.links={}
      cpy_master_data!.labels={}
      cpy_master_data!.linkZIndex=[]

      // Parcours tous les element de l'objet (contient le blob des fichiers mais aussi une variable length)
      for(const i in files){
        const reader = new FileReader()
        reader.onload = (() => {
          return (e: ProgressEvent<FileReader>) => {
            const result = String((e.target as FileReader).result)
            const result_data = JSON.parse(result)
            const imported_data=JSON.parse(JSON.stringify(result_data)) as SankeyPlusData
            convert_data(imported_data,get_default_data)
            let new_ind = 'view_' + String(new Date().getTime())
            let first_data={} as SankeyPlusData
            if(imported_data.view && imported_data.view.length>0){
              // Import all view from the coming file
              imported_data.view.forEach((v,i2)=>{
                const view_from_imported_data=GetDataFromView(imported_data,v.id) as SankeyPlusData
                convert_data(view_from_imported_data,get_default_data)

                if(i2===0 && i==='0'){
                  new_ind=v.id
                  first_data=view_from_imported_data
                }
                cpy_master_data!.view.push({
                  id: v.id,
                  view_data: view_from_imported_data,
                  nom: (files[i].name).replace('.json','')+' '+v.nom,
                  details: '',
                  heredited_attr_from_master:[]
                })
              })
            }else{
              // Import only master data  when it doesn't have view
              imported_data.view=[]
              first_data=imported_data
              cpy_master_data!.view.push({
                id: new_ind,
                view_data: imported_data,
                nom: (files[i].name).replace('.json',''),
                details: '',
                heredited_attr_from_master:[]
              })
            }
            if(i==='0'){

              set_view(new_ind)
              cpy_master_data!.current_view=new_ind
              set_data({...first_data})
            }
            set_master_data({...cpy_master_data!})

          }
        })()
        // Permet d'executer la transformation des blob en vues tout en evitant la var length
        //   files : {0:Blob,1:Blob,2:...,n:Blob, length:n-1}
        if(!isNaN(+i)){
          reader.readAsText(files[i])
        }
      }
    }}
  />
  return <><Overlay
    key={'popover-link-filter'}
    placement={'bottom'}
    target={target_popover_modify_view_name}
    rootClose
    show={show_modify_name_view}
    onHide={()=>{set_show_modify_name_view(false)}}
  >
    {popover_modify_view_name}
  </Overlay>
  {window.SankeyToolsStatic ? <></> : file_reder_for_catalog}
  {window.SankeyToolsStatic ? <></> : create_data_catalog}
  {window.SankeyToolsStatic ? <></> : <OSTooltip placement='bottom' label={(!has_open_sankey_plus && !has_views)?t('Menu.sankeyPlusDisabled'):t('view.tooltips.home')}>
    <Box>
      <Button
        variant='submenu_nav_btn'
        isDisabled={((!has_open_sankey_plus && !has_views)||(master_data && master_data.is_catalog))}
        onClick={() => {
          const ev = document
          const tmp = { key: 'F7' }
          if (ev.onkeydown) {
            ev.onkeydown(tmp as KeyboardEvent)
          }
        }}>

        <FaHome
          style={{opacity:((has_open_sankey_plus && has_views) && (master_data && !master_data.is_catalog))?'1':'0.6'}}/>
        {(!has_open_sankey_plus && !has_views)?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('Menu.home')}
      </Button>
    </Box>
  </OSTooltip>}

  {window.SankeyToolsStatic ? <></> : buttonCreateView}


  <OSTooltip placement='bottom' label={(!has_open_sankey_plus && !has_views)?t('Menu.sankeyPlusDisabled'):t('view.tooltips.PrevViewButton')}>
    <Box>
      <Button
        variant='submenu_nav_btn'
        isDisabled={prev_button_disabled || !has_views}
        onClick={() => {
          const ev = document
          const tmp = { key: 'F8' }
          if (ev.onkeydown) {
            ev.onkeydown(tmp as KeyboardEvent)
          }
        }}>
        <FaCaretSquareLeft
          style={{opacity:(prev_button_disabled || !has_views)?'0.6':'1'}}/>
        {(!has_open_sankey_plus && !has_views)?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('Menu.precView')}
      </Button>
    </Box>
  </OSTooltip>

  <OSTooltip placement='bottom' label={(!has_open_sankey_plus && !has_views)?(t('Menu.sankeyPlusDisabled')):t('view.tooltips.NextViewButton')}>
    <Box>
      <Button
        variant='submenu_nav_btn'
        isDisabled={next_button_disabled || !has_views}
        onClick={() => {
          const ev = document
          const tmp = { key: 'F9'}
          if (ev.onkeydown) {
            ev.onkeydown(tmp as KeyboardEvent)
          }
        }}>

        <FaCaretSquareRight
          style={{opacity:(next_button_disabled || !has_views)?'0.6':'1'}}
        />
        {(!has_open_sankey_plus && !has_views)?
          <FontAwesomeIcon
            icon={faLock}
            style={{
              fontSize:'1em',
              position: 'absolute',
              right: '0.1em',
              bottom: '0em',
              color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          :<></>}
        {t('Menu.nextView')}
      </Button>
    </Box>
  </OSTooltip>
  {view_selector}

  {(master_data?master_data:{view:[] as string[]}).view.length>0 && master_data!.current_view!=='none' && !window.SankeyToolsStatic?<>
    {button_delete_actual_view}
    {master_data && !master_data.is_catalog?button_heredited_attr_from_master:<></>}
  </>
    :<></>

  }
  </>
}

export const SankeyPlusMenuPreferenceView : SankeyPlusMenuPreferenceViewFType =(
  t:TFunction,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  preferenceCheck:(str: string, data: SankeyPlusData) => void
)=>{
  return <Checkbox
    variant='menuconfigpanel_option_checkbox'
    isChecked={data.accordeonToShow.includes('Vis')}
    onChange={() => {
      preferenceCheck('Vis',data)
      set_data({ ...data })
    }}>
    {t('view.storytelling')}
  </Checkbox>
}


// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export const modal_view_not_saved : modal_view_not_savedFType =(
  view_not_saved:string,
  set_view_not_saved:(s:string)=>void,
  t:TFunction,
  dict_variable_application_data
)=>{
  const {data,set_data,view,master_data,set_master_data}=dict_variable_application_data
  return (
    <Modal
      size="lg"
      isOpen={view_not_saved !== ''}
      onClose={()=>null}
    >
      <ModalContent>
        <ModalHeader>
          {t('view.ns')}
        </ModalHeader>
        <ModalBody>
          {t('view.warn_ns')}
        </ModalBody>
        <ModalFooter>
          <Button variant='danger'
            onClick={()=>{
            // Don't save the view before changing to the selected one
              if(view !== 'none'){
                const data_view=GetDataFromView(master_data,view) as SankeyPlusData
                set_data(data_view)
              } else if(view === 'none'){
                set_data({...master_data!})
              }
              set_view_not_saved('')
            }}
          >{t('view.dont_save')}</Button>
          <Button variant='success'
            onClick={()=>{
            // Save the view before changing to the selected one

              let difference = getDiff(master_data, data)
              difference = (difference !== undefined)?difference:[]
              difference = difference.filter((d)=>!(d.path!.includes('view')))
            master_data!.view.filter(v => v.id === view_not_saved)[0].view_data = {diff:difference}

            if(view !== 'none'){
              const data_view=GetDataFromView(master_data,view) as SankeyPlusData
              set_master_data({...JSON.parse(JSON.stringify(master_data))})
              set_data(data_view)

            } else if(view === 'none'){
              set_data({...JSON.parse(JSON.stringify(master_data))})
            }
            set_view_not_saved('')
            }}
          >{t('view.save')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>)
}

// export const toolbar_fullscreen=(data:SankeyPlusData,
//   set_data:(d:SankeyPlusData)=>void,
//   view:string,
//   set_view:(s:string)=>void,
//   multi_selected_nodes:{current:SankeyPlusNode[]},
//   multi_selected_links:{current:SankeyPlusLink[]},
//   multi_selected_label:{current:SankeyPlusLabel[]},
//   master_data:SankeyPlusData,
//   set_master_data:(d:SankeyPlusData)=>void,
//   t:TFunction,
//   has_open_sankey_plus:boolean,
//   view_not_saved:string,
//   set_view_not_saved:(s:string)=>void,
//   _load_json:{current:HTMLInputElement},
//   _load_json_catalog:{current:HTMLInputElement},

//   set_ref_setter_show_modal_transparent_view_attr:(b:boolean)=>void,
//   show_modal_selection_link_ref_in_unitary_sankey:boolean,
//   set_show_modal_selection_link_ref_in_unitary_sankey:(b:boolean)=>void,
//   s_value_editor_name_view:string,
//   sValueEditorNameView:(s:string)=>void,
//   select_or_edit:'select'|'edit',
//   sSelectOrEdit:(s:'select'|'edit')=>void,
//   convert_data:(d:SankeyPlusData)=>void
// )=>{
//   const buttons_view= SankeyPlusBannerView(data,set_data,
//     view,set_view,view_not_saved,
//     multi_selected_nodes,multi_selected_links,multi_selected_label,
//     master_data,set_master_data,
//     t,
//     has_open_sankey_plus,set_view_not_saved,
//     _load_json,_load_json_catalog,set_ref_setter_show_modal_transparent_view_attr,
//     show_modal_selection_link_ref_in_unitary_sankey,set_show_modal_selection_link_ref_in_unitary_sankey,s_value_editor_name_view,sValueEditorNameView,
//     select_or_edit,sSelectOrEdit,convert_data
//   )
//   const group_btn=<ButtonGroup>
//     {buttons_view}
//   </ButtonGroup>
//   return <>{group_btn}</>

// }

export const modal_transparent_view_attr : modal_transparent_view_attrFType =(
  dict_hook_ref_setter_show_dialog_components,
  dict_variable_application_data,
  t:TFunction
)=>{
  const current_view=dict_variable_application_data.master_data?.view.filter(v=>v.id===dict_variable_application_data.master_data!.current_view)[0]??{} as ViewType
  const {data,set_data,master_data,set_master_data}=dict_variable_application_data as SankeyPlusApplicationDataType
  const {ref_setter_show_modal_transparent_view_attr}=dict_hook_ref_setter_show_dialog_components
  const [show_modal,set_show_modal]=useState(false)
  ref_setter_show_modal_transparent_view_attr.current=set_show_modal
  if(master_data && master_data.current_view!==undefined && master_data?.current_view!=='none' && dict_variable_application_data.data!==undefined){

    return  <Modal size='xl' isOpen={show_modal} onClose={()=>{
      RecomputeViews(data,data,set_data as (d: SankeyPlusData | undefined) => void)
      set_show_modal(false)}}>
      <ModalContent>
        <ModalHeader>{t('view.setTransparentAttr')}</ModalHeader>
        <ModalBody>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.Transformation.Topology')}
            </Box>
            <Box layerStyle='options_4cols'>
              <Button
                variant={current_view.heredited_attr_from_master.includes('addNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('addNode')){
                    current_view.heredited_attr_from_master.push('addNode')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('addNode'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})

                }
                }
              >{t('Menu.Transformation.addNode')}</Button>

              <Button
                variant={current_view.heredited_attr_from_master.includes('removeNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('removeNode')){
                    current_view.heredited_attr_from_master.push('removeNode')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('removeNode'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})

                }
                }
              >{t('Menu.Transformation.removeNode')}</Button>

              <Button
                variant={current_view.heredited_attr_from_master.includes('addFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('addFlux')){
                    current_view.heredited_attr_from_master.push('addFlux')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('addFlux'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})

                }
                }>{t('Menu.Transformation.addFlux')}</Button>

              <Button
                variant={current_view.heredited_attr_from_master.includes('removeFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('removeFlux')){
                    current_view.heredited_attr_from_master.push('removeFlux')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('removeFlux'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})

                }
                }>{t('Menu.Transformation.removeFlux')}</Button>
            </Box>
          </Box>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.Transformation.Geometry')}
            </Box>
            <Box layerStyle='options_4cols'>
              <Button
                variant={current_view.heredited_attr_from_master.includes('posNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('posNode')){
                    current_view.heredited_attr_from_master.push('posNode')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('posNode'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {t('Menu.Transformation.PosNoeud')}
              </Button>
              <Button
                variant={current_view.heredited_attr_from_master.includes('posFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('posFlux')){
                    current_view.heredited_attr_from_master.push('posFlux')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('posFlux'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {t('Menu.Transformation.posFlux')}</Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={ current_view.heredited_attr_from_master.includes('Values')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('Values')){
                    current_view.heredited_attr_from_master.push('Values')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('Values'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})

                }
                }
              >{current_view.heredited_attr_from_master.includes('Values')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}
              </Button>
            </Box>

          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={current_view.heredited_attr_from_master.includes('attrNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('attrNode')){
                    current_view.heredited_attr_from_master.push('attrNode')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('attrNode'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {t('Menu.Transformation.attrNode')}
              </Button>

              <Button
                variant={current_view.heredited_attr_from_master.includes('attrFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() =>{
                  if(!current_view.heredited_attr_from_master.includes('attrFlux')){
                    current_view.heredited_attr_from_master.push('attrFlux')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('attrFlux'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {t('Menu.Transformation.attrFlux')}
              </Button>
            </Box>
          </Box>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Tags')}</Box>
            <Box layerStyle='options_4cols'>
              <Button
                variant={current_view.heredited_attr_from_master.includes('tagNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() =>{
                  if(!current_view.heredited_attr_from_master.includes('tagNode')){
                    current_view.heredited_attr_from_master.push('tagNode')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagNode'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {t('Menu.Transformation.tagNode')}
              </Button>
              <Button
                variant={current_view.heredited_attr_from_master.includes('tagFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('tagFlux')){
                    current_view.heredited_attr_from_master.push('tagFlux')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagFlux'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {t('Menu.Transformation.tagFlux')}
              </Button>
              <Button
                variant={current_view.heredited_attr_from_master.includes('tagData')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('tagData')){
                    current_view.heredited_attr_from_master.push('tagData')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagData'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }
                }
              >{t('Menu.Transformation.tagData')}</Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.tagLevel')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={current_view.heredited_attr_from_master.includes('tagLevel')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() => {
                  if(!current_view.heredited_attr_from_master.includes('tagLevel')){
                    current_view.heredited_attr_from_master.push('tagLevel')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagLevel'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {current_view.heredited_attr_from_master.includes('tagLevel')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}
              </Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={current_view.heredited_attr_from_master.includes('attrGeneral')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                onClick={() =>{
                  if(!current_view.heredited_attr_from_master.includes('attrGeneral')){
                    current_view.heredited_attr_from_master.push('attrGeneral')
                  }else{
                    current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('attrGeneral'),1)
                  }
                  set_data({...data})
                  set_master_data({...master_data!})
                }}>
                {current_view.heredited_attr_from_master.includes('attrGeneral')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}
              </Button>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter><Button onClick={()=>{
          updateLayoutOSTyped(data,master_data!,current_view.heredited_attr_from_master)
          // updateLayout(data,master_data,current_view.heredited_attr_from_master)
          set_data({...data})
        }}>{t('view.updateViewWithMasterVar')}</Button></ModalFooter>
      </ModalContent>
    </Modal>
  } return <></>
}

export const MenuEnregistrerView : MenuEnregistrerViewFType = (
  master_data:SankeyPlusData|undefined,
  t:TFunction,
  save_only_view:boolean,
  set_save_only_view:(b:boolean)=>void
)=>{
  return <Form.Group>
    <Checkbox
      sx={SmoothClasses({})}
      maxW={'40%'}
      isChecked={save_only_view}
      onChange={() => set_save_only_view(!save_only_view)}>
      <OSTooltip label={t('view.tooltips.buttonExportView')}>
        {t('view.export')}
      </OSTooltip>
    </Checkbox>
  </Form.Group>
}



export const OpenSankeyPlusCheckpointButton : OpenSankeyPlusCheckpointButtonFType = (
  master_data:SankeyPlusData|undefined,
  data:SankeyPlusData,
  view:string,
  view_not_saved:string,
  has_open_sankey_plus:boolean,
  t:TFunction
)=>{

  // Boolean used to change the logo of the button to save the current view :
  //  - if there is no differences between the the saved view and the current view, then the logo has a check
  //  - else if it contain difference, the logo contain an exclamation point
  const is_different=false
  if(view !== 'none' && view_not_saved ==='' && master_data && has_open_sankey_plus){
    // find another way with a variable. Checking the all view consumes too much time
    // const diff=CheckCurrentViewSaved(master_data,data,view)
    // if(diff.length>0){
    //   is_different=true
    // }
  }

  return   <OSTooltip
    label={(!has_open_sankey_plus)?(t('Menu.sankeyPlusDisabled')):t('view.tooltips.saveView')}>
    <Button
      isDisabled={!has_open_sankey_plus}
      variant='light'
      onClick={() => {
        const ev = document
        const t=new KeyboardEvent('keydown',{key:'s',ctrlKey:true})
        if (ev.onkeydown) {
          ev.onkeydown(t)
        }
      }}
    >
      <FontAwesomeIcon
        icon={faFloppyDisk}
        style={{opacity:(!has_open_sankey_plus)?'0.6':'1',width:'2rem',height:'2rem'}}/>
      {!has_open_sankey_plus?<>
        <FontAwesomeIcon
          icon={faLock}
          style={{
            fontSize:'1em',
            color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
      </>
        :<>{is_different?
          <FontAwesomeIcon
            icon={faExclamation}
            style={{
              fontSize:'1em',
              color: 'rgba(var(--bs-danger-rgb), var(--bs-bg-opacity))'}} />
          :<></>}</>
      }
    </Button>
  </OSTooltip>
}



// const getNodeFromTree=(path:number[],tree:treeFolderType):{id:string,checked?:number}=>{

//   if(tree.children && path.length>0){
//     const index=path.shift()??-1
//     const sub_tree=tree.children[index]
//     return getNodeFromTree(path,sub_tree)
//   }else{
//     const id=tree.id,checked=tree.checked
//     return {id,checked}
//   }
// }