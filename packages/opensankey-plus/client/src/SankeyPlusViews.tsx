import React, { ChangeEvent, useRef } from 'react'
import * as d3 from 'd3'
import { TFunction } from 'i18next'
import LZString from 'lz-string'

import { Accordion, Button, ButtonGroup, Col, Form, FormControl, Table, Toast,OverlayTrigger,Tooltip,Badge,Popover,Modal, InputGroup } from 'react-bootstrap'
import { FaHome, FaPlus, FaCaretSquareRight, FaCaretSquareLeft, FaEye, FaEyeSlash } from 'react-icons/fa'
import { FaArrowDown, FaArrowUp, FaMinus, FaSave,FaCopy, FaFileExport, FaFileImport, FaFileInvoice,FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileCircleExclamation, faFileCircleCheck, faLock, faFile,faListCheck, faXmark} from '@fortawesome/free-solid-svg-icons'

import { SankeyLinkValue, SankeyLinkValueDict, TagsGroup} from 'open-sankey/src/lib/types'
import { clickSaveDiagram, adjust_sankey_zone, node_displayed } from 'open-sankey/dist/SankeyUtils'
import { updateLayout, apply_input_outputLinksId } from 'open-sankey/dist/SankeyLayout'

import { SankeyPlusData, SankeyPlusNode, SankeyPlusLink, SankeyPlusLabel, differenceType, DiffType, ViewType } from './types'
import { sankey_plus_min_width_and_height } from './SankeyPlusLabels'
/* eslint-disable */
// @ts-ignore
const deep_diff = require('deep-diff')
/* eslint-enable */
export const setDiagram = (
  set_master_data: (d:SankeyPlusData | undefined)=>void,
  set_view: (s:string)=>void
) => {
  return (
    the_diagram : string,
    set_data : (d:SankeyPlusData)=>void,
    convert_data:(d:SankeyPlusData)=>void
  ) => {
    const sous_filieres = window.sankey.sous_filieres

    const new_data = JSON.parse(
      JSON.stringify(
        window.sankey[sous_filieres[the_diagram]]
      )
    ) as SankeyPlusData
    convert_data(new_data)
    d3.select(' .opensankey #svg').on('.zoom', null)
    if (window.SankeyToolsStatic && new_data.view.length > 0) {
      set_master_data(new_data)
      set_view(new_data.view[0].id)
      set_data(get_data_from_view(new_data,new_data.view[0].id))
    } else {
      set_master_data(undefined)
      set_data(new_data)
      set_view('none')
    }
  }
}

export const view_toast = (<Toast bg='success' className='toastView' style={{ 'position': 'absolute', 'marginTop': '300px', 'marginLeft': '250px', 'zIndex': 1 }}>
  <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Enregistrement</small> </Toast.Header>
  <Toast.Body>Vue sauvegardée</Toast.Body>
</Toast>)

export const view_toast_update_view = (<Toast bg='info' className='toastView' style={{ 'position': 'absolute', 'marginTop': window.innerHeight/4,'marginLeft': window.innerWidth/2, 'zIndex': 100 }}>
  <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Mise à jour</small> </Toast.Header>
  <Toast.Body>Vue mise à jour</Toast.Body>
</Toast>)

export const setValue = (
  dataTags: TagsGroup[],
  v_target: {[key:string] : SankeyLinkValue},
  v_source: {[key:string] : SankeyLinkValue},
  depth: number
) => {
  const dataTag = Object.values(dataTags)[depth]
  const listKey = Object.keys(dataTag.tags)
  for (const i in listKey) {
    if (depth === dataTags.length - 1 ) {
      v_target[listKey[i]] = v_source[listKey[i]]
    } else {
      if ( v_target[listKey[i]] === undefined ) {
        (v_target[listKey[i]] as SankeyLinkValueDict) = {}
      }
      setValue(
        dataTags,
        v_target[listKey[i]] as unknown as {[key:string] : SankeyLinkValue},
        v_source[listKey[i]] as unknown as {[key:string] : SankeyLinkValue},
        depth + 1)
    }
  }
}

export const get_data_from_view=(master_data:SankeyPlusData,id_view_to_see:string)=>{
  const applyChange = deep_diff.applyChange
  // Copy master data
  if (!master_data) {
    alert('sankey master undefined')
    return undefined
  }
  const copy_master_data= {...master_data}
  copy_master_data.view = []
  let data_init=JSON.parse(JSON.stringify(copy_master_data))
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
    diff_view.forEach((d :{path:string[],kind:string}) => applyChange(data_init, {}, d))
  }else{
    data_init=view_object.view_data as SankeyPlusData
  }
  updateLayout(data_init,master_data,view_object.heredited_attr_from_master)
  return data_init
  // const del_node_views = diff_view.filter((d : {path:string[],kind:string})=>(d.path[0] === 'nodes' && d.kind === 'D' && d.path.length === 2))
  // del_node_views.forEach((d:{path:string[],kind:string,rhs:boolean|string})=>{
  //   d.kind = 'E'
  //   d.path.push('display')
  //   d.rhs = false
  // })
  // const del_link_views = diff_view.filter((d : {path:string[],kind:string})=>(d.path[0] === 'links' && d.kind === 'D'))
  // del_link_views.forEach((d:{path:string[],kind:string,rhs:boolean})=>{
  //   d.kind = 'E'
  //   d.path.push('link_visible')
  //   d.rhs = false
  // })
  // const ignore_changes = diff_view.filter((d :{path:string[],kind:string})=> (d.kind !== 'N' || d.path.length!==2) && d.path[0] === 'nodes' && master_data.nodes[d.path[1]] === undefined)
  // const ignore_changes2 = diff_view.filter((d :{path:string[],kind:string})=> (d.kind !== 'N' || d.path.length!==2) && d.path[0] === 'links' && master_data.links[d.path[1]] === undefined)
  // const ignore_changes3 = diff_view.filter((d :{path:string[],kind:string,rhs:string})=>
  //   d.kind === 'E' && d.path[0] === 'nodes' && (d.path[2] === 'outputLinksId' || d.path[2] === 'inputLinksId') &&
  //     master_data.links[d.rhs] === undefined)

  // // Apply the changements saved in the view to the copy of master then return 'master data + modification saved in the view'
  // diff_view
  //   .filter((d :{path:string[],kind:string}) => (d.kind === 'N' && d.path.length===2) || d.path[0] !== 'nodes' || master_data.nodes[d.path[1]] !== undefined)
  //   .filter((d :{path:string[],kind:string}) => (d.kind === 'N' && d.path.length===2) || d.path[0] !== 'links' || master_data.links[d.path[1]] !== undefined)
  //   .filter((d :{path:string[],kind:string}) => (d.path[0] !== 'links' || d.kind !== 'D'))
  //   .filter((d :{path:string[],kind:string}) => !(d.path[0] === 'nodeTags' && d.kind === 'E' && d.path.length===5 && d.path[4] === 'color'))
  //   .filter((d :{path:string[],kind:string}) => !(d.kind === 'E' && d.path[0] ==='links' && d.path.length > 3 && d.path[2]==='value'))
  //   .forEach((d :{path:string[],kind:string}) => applyChange(data_init, {}, d))
  // if (ignore_changes.length > 0 || ignore_changes2.length > 0 || ignore_changes3.length > 0) {
  //   compute_default_input_outputLinksId(
  //     data_init.nodes,
  //     data_init.links
  //   )
  // }
}

export const filter_view=(pre_diff:{path:string[],kind:string,item:{kind:string}}[])=>{
  return JSON.parse(JSON.stringify(pre_diff))
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
      return d
    })
}

export const recompute_views = (
  new_master_data: SankeyPlusData,
  prev_master_data: SankeyPlusData,
  set_master_data: (d:SankeyPlusData)=>void
) =>{
  if ( prev_master_data) {
    new_master_data.view.forEach(current_v => {
      if ( prev_master_data.view.filter(v=>v.id===current_v.id).length === 0) {
        return
      }
      const data_view=get_data_from_view(prev_master_data,current_v.id) as SankeyPlusData
      
      if((current_v.view_data as SankeyPlusData).version){
        current_v.view_data=data_view
      }else{
        let difference = deep_diff.diff(new_master_data,data_view)
        difference = (difference !== undefined) ? difference : []
        difference = filter_view(difference)
        if (difference.length > 0) {
          (current_v.view_data as DiffType).diff = difference
        }
      }
      
    })
  }
  // master data is now set
  set_master_data({...JSON.parse(JSON.stringify(new_master_data))})
}

export const keyHandler = (
  e: KeyboardEvent,
  master:boolean,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  view:string,
  set_view:React.Dispatch<React.SetStateAction<string>>,
  multi_selected_labels:{current:SankeyPlusLabel[]},
  set_show_toast_new_view:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_toast_updated_view:React.Dispatch<React.SetStateAction<boolean>>,
  connected:boolean,
  set_view_not_saved:(s:string)=>void,
) => {
  // Applique le control de touche issu de opensankey (pour eviter de copier/coller et avoir de potentiel différence)
  // Apply keyHandling from opensankey (to avoid copy/paste that can generate error)
  // OpenSankey_keyHandler(
  //   e, data,
  //   multi_selected_nodes,
  //   multi_selected_links,
  //   set_data,
  //   accordion_ref,
  //   button_ref,
  //   set_show_nav,
  //   mode_selection,set_show_menu_node_apparence,set_show_menu_node_label,set_show_menu_node_io,set_show_menu_link_data,set_show_menu_link_appearence,set_show_menu_link_label,set_contextualised_node,set_contextualised_link,set_show_context_zdd)
  if(e.key==='a' && e.ctrlKey){
    e.preventDefault()
    multi_selected_labels.current=Object.values(data.labels)
    set_data({...data})

  }
  // Clone current data,if its a view clone the view
  if (connected && e.key === 'x' && (e.ctrlKey||e.metaKey)) {
    e.preventDefault()

    if (master) {
      // If we do a control+X while we are on master data, we create view empty
      // data is master data and master_data might not be  se
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
      recompute_views(new_master_data,master_data,set_master_data)
      // master data is now set
      // at this stage data is a view and is equal with master data
      set_show_toast_new_view(true)
      setTimeout(function () {
        set_show_toast_new_view(false)
      }, 3000)
    } else {
      const new_ind = 'view_' + String(new Date().getTime())
      const current_view_object=master_data.view.filter(v=>v.id === view)[0]

      const copy_data = JSON.parse(JSON.stringify(current_view_object.view_data))
      master_data.view.push({
        id: new_ind,
        view_data: copy_data,
        nom: 'copy of '+current_view_object.nom,
        details: '',
        heredited_attr_from_master:[]

      })
      
     
      // master data is now set
      //set_master_data({...master_data})
      set_view(new_ind)
    }
  }

  if(e.key==='s' && e.ctrlKey && !e.shiftKey){

    e.preventDefault()
    if(view!=='none'){
      // If we do a control+S while we are on a view, we save the difference between the data we are handling
      // and the master data. These difference are the saved the view we are currently on


      // Get difference between master_data and the current data then save it in view
      let difference = deep_diff.diff(master_data, data)
      difference=(difference !== undefined)?difference:[]
      difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
      difference=filter_view(difference)

      // Check wich format of the view is better optimized for memory storage
      const raw_is_smaller_than_diff=JSON.stringify(data).length<JSON.stringify(difference).length
      master_data.view.filter(v => v.id === view)[0].view_data = raw_is_smaller_than_diff?JSON.parse(JSON.stringify(data)):{diff:difference}

      // Save master data with the view we are currently working on updated
      set_master_data({...master_data})
      // Save master_data data in localStorage
      localStorage.setItem('data', LZString.compress(JSON.stringify(master_data)))

      // set_data({...data})
      set_show_toast_updated_view(true)
      setTimeout(function () {
        set_show_toast_updated_view(false)
      }, 3000)
    }else{
      // Save current data (wich is master_data)
      localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
    }



  }
  // Changing view to master
  if (!master && e.key === 'F7') {

    // Check if there is unsaved change before we switch view
    // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
    let saved=true
    if(view !== 'none' && connected ){
      const diff=check_current_view_saved(master_data,data,view)
      if(diff.length>0 && !window.SankeyToolsStatic){
        saved=false
        set_view_not_saved(view)
        set_view('none')
      }
    }

    if(saved){
      set_view('none')
      set_data(JSON.parse(JSON.stringify(master_data)))
      setTimeout(()=>{
        adjust_sankey_zone(master_data,sankey_plus_min_width_and_height)
      },100)

    }
  }
  // Changing view to next or previous
  if ([ 'F8', 'F9'].includes(e.key)) {
    if (e.key === 'F8') {
      // going backward
      //Cherche la position de la vue sélectionné dans le tableau de vue
      let ind = -1
      master_data.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      if (ind === -1) {
        ind = 1
      } else if (ind===0) {
        ind = Object.keys(master_data.view).length
      }
      const data_view=get_data_from_view(master_data,master_data.view[ind-1].id) as SankeyPlusData

      // Check if there is unsaved change before we switch view
      // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
      let saved=true
      if(view !== 'none' &&  connected ){
        const diff=check_current_view_saved(master_data,data,view)
        if(diff.length>0 && !window.SankeyToolsStatic){
          saved=false
          set_view_not_saved(view)
          set_view(master_data.view[ind-1].id)
        }
      }
      if(saved){
        set_data({...data_view as SankeyPlusData})
        set_view(master_data.view[ind-1].id)
        // adjust_sankey_zone(master_data.view[ind-1].view_data as SankeyPlusData,min_width_and_height)
        setTimeout(()=>{
          adjust_sankey_zone({...data_view as SankeyPlusData},sankey_plus_min_width_and_height)
        },100)
      }

    } else if (e.key === 'F9') {
      let new_master_data : SankeyPlusData
      if (master) {
        new_master_data = data
        recompute_views(new_master_data,master_data,set_master_data)
      } else {
        new_master_data = master_data
      }
      //Cherche la position de la vue sélectionné dans le tableau de vue
      let ind = -1
      new_master_data.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante
      if (ind === Object.keys(new_master_data.view).length - 1) {
        ind = -1
      } else if (ind === -1) {
        ind = -1
      }
      // Check if there is unsaved change before we switch view
      // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
      if(view==='none'){
        new_master_data.current_view=master_data.view[ind+1].id
        set_master_data(new_master_data)
      }
      let saved=true
      if(view !== 'none' && connected ){
        const diff=check_current_view_saved(new_master_data,data,view)
        if(diff.length>0 && !window.SankeyToolsStatic){
          saved=false
          set_view_not_saved(view)
          set_view(master_data.view[ind+1].id)
        }
      }
      const data_view=get_data_from_view(new_master_data,new_master_data.view[ind+1].id) as SankeyPlusData
      if(saved){
        set_data(data_view)
        set_view(new_master_data.view[ind+1].id)
        setTimeout(()=>{
          adjust_sankey_zone({...data_view as SankeyPlusData},sankey_plus_min_width_and_height)
        },100)
      }
      //}
    }
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ((document.activeElement?.tagName==='INPUT')? d3.select(document.activeElement).attr('value')==='menuConfigButton':true) && (!document.activeElement?.className.includes('ql-editor'))) {
    // Deplace les zdt sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
    // (exemples : le input de la largeur minimal d'un noeud)
    e.preventDefault()
    if (e.key === 'ArrowUp') {
      Object.values(data.labels).filter(f => multi_selected_labels.current.map(d => {
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
      Object.values(data.labels).filter(f => multi_selected_labels.current.map(d => {
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
      Object.values(data.labels).filter(f => multi_selected_labels.current.map(d => {
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
      Object.values(data.labels).filter(f => multi_selected_labels.current.map(d => {
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
    set_data({ ...data })
  }

  // Add deselection of all selected zdt
  if (e.key === 'Escape') {

    multi_selected_labels.current.forEach(l=>{
      d3.select('#'+l.idLabel+ ' rect').attr('stroke-width',1)
    })
    multi_selected_labels.current=[]

  }

  if(e.key==='Delete' && (!document.activeElement?.className.includes('ql-editor'))){
    if(document.activeElement?.tagName!=='INPUT' || d3.select(document.activeElement).attr('value')==='menuConfigButton')
    {

      data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_labels.current.map(l => l.idLabel).includes(d[0])))
      multi_selected_labels.current=[]
      set_data({...data})
    }
  }
}

const selecteur_view=(data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  set_view_not_saved:(s:string)=>void,
  // fullscreen=false
)=>{
  return <Form.Select id="selectionNode"
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
          const difference=check_current_view_saved(master_data,data,view)
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
              recompute_views(new_master_data,master_data,set_master_data)
            } else {
              new_master_data= JSON.parse(JSON.stringify(master_data)) as SankeyPlusData
            }
            set_view(evt.target.value)
            const data_view=get_data_from_view(new_master_data,evt.target.value) as SankeyPlusData
            set_data(data_view)
            new_master_data.current_view=evt.target.value
            set_master_data(new_master_data)

            setTimeout(()=>{
              adjust_sankey_zone({...data_view as SankeyPlusData},sankey_plus_min_width_and_height)
            },100)

          } else if(evt.target.value === 'none'){
            set_view(evt.target.value)
            set_data(JSON.parse(JSON.stringify(master_data)))
            setTimeout(()=>{
              adjust_sankey_zone(master_data,sankey_plus_min_width_and_height)
            },100)
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
  </Form.Select>
}
export const viewsAccordion = (
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  nav_item_active: string,
  set_nav_item_active: (s:string)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  _load_json:{current:HTMLInputElement},
  t:TFunction,
  is_activated:boolean,
  set_view_not_saved:(s:string)=>void,
  convert_data:(d:SankeyPlusData)=>void

) => {

  const _load_multiple_json = useRef<HTMLInputElement>(null)

  const selector=selecteur_view(data,set_data,view,set_view,multi_selected_nodes,multi_selected_links,multi_selected_label,master_data,set_master_data,t,set_view_not_saved)
  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)
  const popover_for_apply_display_from_view=<Popover id="popover-apply_display" style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('view.applyDisplayFromView')}</Popover.Header>
    <Popover.Body >
      <Form.Select id="selectionNode"
        onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            multi_selected_nodes.current = []
            multi_selected_links.current = []
            multi_selected_label.current = []

            const paramerters=['posNode','attrNode','attrFlux','tagNode','tagFlux','attrGeneral']

            if (evt.target.value === '') {
              return
            }else if(evt.target.value !== 'none'){
              const data_view=get_data_from_view(master_data,evt.target.value)
              data_view.view=[]
              updateLayout(data,data_view,paramerters)
              set_data({...data})
            } else if(evt.target.value === 'none'){
              const copy_master=JSON.parse(JSON.stringify(master_data))
              copy_master.view=[]
              updateLayout(data,copy_master,paramerters)
              set_data({...data})
            }
          }
        }
        value={view}
      >
        {view !== 'none'}<option disabled={view === 'none'} value={'none'}>{t('view.actual')}</option>
        {master_data ? master_data.view.map(d => {
          return <option key={d.id} disabled={view === d.id} value={d.id}>{d.nom}</option>
        }) : <></>}
      </Form.Select>
    </Popover.Body>
  </Popover>

  return <><Accordion.Item
    id='Visualisation'
    eventKey="Visualisation"
    style={{ 'display': 'block' }}
    onClick={
      evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'Visualisation') {
          set_nav_item_active('')
        } else {
          set_nav_item_active('Visualisation')
        }
      }
    }>
    <Accordion.Header>
      Storytelling
      {(!is_activated)?
        <OverlayTrigger
          key={'textZoneDisabled'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'textZoneDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>}
        >
          <Badge pill
            bg="white"
            style={{marginLeft:'5px', fontSize:'1.3em'}}>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Badge>
        </OverlayTrigger>:
        <Badge pill bg='info' style={{marginLeft:'auto'}}>Beta</Badge>}
    </Accordion.Header>
    <Accordion.Body>
      <OverlayTrigger
        key={'tooltip-apply_display'}
        placement={'left'}
        trigger={'click'}
        rootClose
        overlay={popover_for_apply_display_from_view}>
        <InputGroup>
          <InputGroup.Text
            style={{
              color:!(is_activated)?'#666666':'',
              backgroundColor:!(is_activated)?'#cccccc':'',
              width:'30%'}}>
            {t('view.select')}
          </InputGroup.Text>
          <>{selector}</>
          <Button
            variant='light'
            style={{width:'20%'}}
            disabled={!is_activated}
            id='button-apply_display' >
            <FaFileInvoice/>
          </Button>
        </InputGroup>
      </OverlayTrigger>

      <Form>
        <Table bordered size='sm'
          style={{
            color:!(is_activated)?'#666666':'',
            backgroundColor:!(is_activated)?'#cccccc':''}}>
          <thead>
            <tr>
              <th>{t('view.name')}</th>
              <th>Position</th>
              <th>{t('view.delete')}</th>
              {/* <th>{t('view.copy')}</th>
              <th>{t('view.import')}</th>
              <th>{t('view.export')}</th> */}
            </tr>
          </thead>
          <tbody>
            {master_data ? Object.values(master_data.view).map(d => {
              return (
                <tr style={{ 'border': (d.id === view) ? '2px solid #5a9282' : 'none' }}>
                  <td><FormControl size='sm'
                    value={d.nom}
                    disabled={!is_activated}
                    onChange={evt => {
                      // Change the name of the view
                      master_data.view.filter(v => v.id === d.id)[0].nom = evt.target.value
                      set_master_data({...master_data})
                    }}
                  /></td>
                  <td>
                    {/* Change the position of the view in the liste of view from master data */}
                    <ButtonGroup className="button_position" size="sm">
                      <Button
                        size="sm"
                        variant="light"
                        disabled={!is_activated}
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
                      ><FaArrowUp /></Button><Button
                        size="sm"
                        variant="light"
                        disabled={!is_activated}
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
                      ><FaArrowDown /></Button>
                    </ButtonGroup>

                  </td>
                  <td><Button
                    size="sm"
                    variant='light'
                    disabled={!is_activated}
                    onClick={
                      // Delete the view
                      () => {
                        let ind = -1
                        master_data.view.map((v, i) => {
                          ind = (v.id === d.id) ? i : ind
                        })
                        master_data.view.splice(ind, 1)
                        set_view('none')
                        set_master_data({...master_data})
                        set_data({ ...master_data })
                      }
                    }
                  ><FaMinus /></Button></td>
                  {/* <td><Button
                    disabled={!is_activated}
                    size="sm"
                    variant='success'
                    onClick={
                      () => {
                        // Create a copy of the view
                        const cur_view = d
                        const copy_view_data = JSON.parse(JSON.stringify(cur_view.view_data))
                        const new_ind = 'view_' + String(new Date().getTime())

                        copy_view_data.view = []
                        master_data.view.push({
                          id: new_ind,
                          view_data: copy_view_data,
                          nom: 'copy of ' + cur_view.nom,
                          details: ''
                        })
                        set_view(new_ind)
                        set_master_data({...master_data})
                        set_data(get_data_from_view(master_data,new_ind))
                      }
                    }
                  ><FaCopy /></Button></td>
                  <td><Button
                    size="sm"
                    variant='secondary'
                    onClick={
                      () => {
                        // Allow us to import a view by loading a sankey then updating the view like if we did a Ctrl+S
                        if (_load_json.current) {
                          _load_json.current.name = ''
                          _load_json.current.click()
                          _load_json.current.id = d.id
                        }
                      }
                    }
                  ><FaFileImport /></Button></td>
                  <td>
                    <Button variant='warning'
                      onClick={()=>{
                        const to_download=get_data_from_view(master_data,d.id)
                        to_download.view=[]
                        clickSaveDiagram(to_download,d.nom)
                      }}
                    ><FaFileExport/></Button>
                  </td> */}

                </tr>
              )
            }) : <></>}
          </tbody>
        </Table>
      </Form>

      <InputGroup>
        <Button
          style={{width:'50%', height:'2.5em'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={is_activated?'outline-primary':'primary'}
          onClick={()=>{
            master_data.view.forEach(v=>{
              const to_download=get_data_from_view(master_data,v.id)
              to_download.view=[]
              clickSaveDiagram(to_download,v.nom)
            })
          }}>
          {t('view.exportAll')}
        </Button>
        <Button
          style={{width:'50%', height:'2.5em'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={is_activated?'outline-primary':'primary'}
          onClick={
            () => {
              // Allow us to import a view by loading a sankey then updating the view like if we did a Ctrl+S
              if (_load_multiple_json.current) {
                _load_multiple_json.current.name = ''
                _load_multiple_json.current.click()
              }
            }
          }
        >
          {t('view.importMultiple')}
        </Button>
      </InputGroup>
    </Accordion.Body>
  </Accordion.Item>

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
          master_data.view.map((v, i) => {
            ind = (v.id === _load_json.current?.id) ? i : ind
          })
          const cur_view = master_data.view[ind]
          const imported_data=JSON.parse(JSON.stringify(result_data))
          imported_data.view=[]
          convert_data(imported_data)
          let difference = deep_diff.diff(master_data,imported_data)
          difference=JSON.parse(JSON.stringify((difference !== undefined)?difference:[]))
          difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
          cur_view.view_data = {diff:difference}

          cur_view.nom = (files[0].name).replace('.json','')

          set_master_data({...master_data})
          set_data({...imported_data})
          set_view(cur_view.id)
        }
      })()
      reader.readAsText(files[0])
    }}
  />

  <Form.Control
    multiple
    className='multipleImport'
    type="file"
    ref={_load_multiple_json}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files

      master_data=(master_data)?master_data:JSON.parse(JSON.stringify(data))
      // Parcours tous les element de l'objet (contient le blob des fichiers mais aussi une variable length)
      for(const i in files){
        const reader = new FileReader()
        reader.onload = (() => {
          return (e: ProgressEvent<FileReader>) => {
            const result = String((e.target as FileReader).result)
            const result_data = JSON.parse(result)
            const imported_data=JSON.parse(JSON.stringify(result_data)) as SankeyPlusData

            const keep_visible_nodes = true
            if (keep_visible_nodes) {
              const initial_nodes = JSON.parse(JSON.stringify(imported_data.nodes))
              const visible_nodes = Object.values(imported_data.nodes).filter(n => node_displayed(data,n))
              const visible_links = Object.values(imported_data.links).filter(l =>
                node_displayed(imported_data,imported_data.nodes[l.idSource]) && node_displayed(imported_data,imported_data.nodes[l.idTarget])
              )
              imported_data.nodes = Object.assign({}, ...visible_nodes.map(n => ({ [n.idNode]: { ...n } })))
              imported_data.links = Object.assign({}, ...visible_links.map(l => ({ [l.idLink]: { ...l } })))
              apply_input_outputLinksId(initial_nodes,imported_data)
            }

            imported_data.view=[]
            convert_data(imported_data)
            let difference = deep_diff.diff(master_data,imported_data)
            difference=JSON.parse(JSON.stringify((difference !== undefined)?difference:[]))
            difference=filter_view(difference)

            const new_ind = 'view_' + String(new Date().getTime())
            const copy_data = {diff:difference}
            master_data.view.push({
              id: new_ind,
              view_data: copy_data,
              nom: (files[i].name).replace('.json',''),
              details: '',
              heredited_attr_from_master:[]

            })

          }
        })()
        // Permet d'executer la transformation des blob en vues tout en evitant la var length
        //   files : {0:Blob,1:Blob,2:...,n:Blob, length:n-1}
        if(!isNaN(+i)){
          reader.readAsText(files[i])
        }
      }
      set_data({...master_data})
      set_master_data({...master_data})
      set_view('none')

    }}
  />

  </>
}

// Function to check if the current data of the view is unsaved
// We compare the differences saved in the master_data with the current changement of the view
export const check_current_view_saved=(master_data:SankeyPlusData,data:SankeyPlusData,view:string)=>{
  const original_diff=get_data_from_view(master_data,view)
  const data_updated_layout=JSON.parse(JSON.stringify(data))
  const updated_diff=JSON.parse(JSON.stringify(original_diff))

  updateLayout(data_updated_layout,master_data,master_data.view.filter(v=>v.id===view)[0].heredited_attr_from_master)
  updateLayout(updated_diff,master_data,master_data.view.filter(v=>v.id===view)[0].heredited_attr_from_master)

  let difference = deep_diff.diff(updated_diff, data_updated_layout)
  difference=(difference !== undefined)?difference:[]
  difference=difference.filter((d:{path:string[],kind:string,item:{kind:string}})=>{
    // Ne prend pas en compte les modif de vue, de la largeur ou hauteur du sankey
    return d.path[0] !== 'current_view' && d.path[0] !== 'view'  && d.path[0] !== 'width' && d.path[0] !== 'height'
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
export const SankeyPlusBannerView=(data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  connected:boolean,
  set_view_not_saved:(s:string)=>void,
  _load_json:{current:HTMLInputElement},
  set_show_modal_transparent_view_attr:(b:boolean)=>void

)=>{

  // const elementNavBar=document.getElementsByClassName('bg-light')[0]
  //const elementHerowrap=document.getElementsByClassName('herowrap')[0]

  // const height_Herowrap=(elementHerowrap)?elementHerowrap.getBoundingClientRect().height:0

  const m_d=master_data?master_data:data
  const current_view = m_d.view.filter(v=>v.id===m_d.current_view)[0]


  // Boolean used to change the logo of the button to save the current view :
  //  - if there is no differences between the the saved view and the current view, then the logo has a check
  //  - else if it contain difference, the logo contain an exclamation point
  let is_different=false
  if(view !== 'none' && master_data && connected){
    const diff=check_current_view_saved(master_data,data,view)
    if(diff.length>0){
      is_different=true
    }
  }

  const has_views = master_data?true:false
  const next_button_disabled = m_d.view && (m_d.view.map(d=>d.id).indexOf(view) === m_d.view.length-1)
  const prev_button_disabled = m_d.view && (m_d.view.map(d=>d.id).indexOf(view) === 0 || view === 'none')

  const buttonCreateView=<OverlayTrigger
    key={'buttonCreateViewDisabled'}
    placement={'bottom'}
    delay={500}
    overlay={(!connected)?(
      <Tooltip id={'buttonCreateViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
      <Tooltip id={'buttonCreateView'}>{t('Menu.tooltips.buttonCreateView')} </Tooltip>}
  >
    <span>
      <Button
        size='sm'
        variant='light'
        disabled={!connected}
        onClick={() => {
          const ev = document
          const t=new KeyboardEvent('keydown',{key:'x',ctrlKey:true})
          if (ev.onkeydown) {
            ev.onkeydown(t)
          }
        }}
      >
        <Col><FaPlus
          style={{opacity:(!connected)?'0.6':'1'}}/>
        </Col>
        {!connected?
          <Col>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                fontSize:'1em',
                position: 'absolute',
                right: '0.1em',
                bottom: '0em',
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Col>
          :<></>}
        <Col style={{'fontSize':'9px'}}>{t('Menu.addView')}</Col>
      </Button>
    </span>
  </OverlayTrigger>

  const buttonUpdateView=<OverlayTrigger
    key={'buttonUpdateViewDisabled'}
    placement={'bottom'}
    delay={500}
    overlay={(!connected)?(
      <Tooltip id={'buttonUpdateViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
      <Tooltip id={'buttonSaveView'}>{t('Menu.tooltips.saveView')} </Tooltip>}
  >
    <span>
      <Button
        size='sm'
        disabled={!connected}
        variant='light'
        onClick={() => {
          const ev = document
          const t=new KeyboardEvent('keydown',{key:'s',ctrlKey:true})
          if (ev.onkeydown) {
            ev.onkeydown(t)
          }
        }}
      >
        {!connected?<>
          <Col><FontAwesomeIcon
            icon={faFile}
            style={{opacity:(!connected)?'0.6':'1'}}/>
          </Col>
          <Col>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                fontSize:'1em',
                position: 'absolute',
                right: '0.1em',
                bottom: '0em',
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Col></>
          :<Col>{is_different?
            <FontAwesomeIcon icon={faFileCircleExclamation}/>:
            <FontAwesomeIcon icon={faFileCircleCheck} />}
          </Col>}
        <Col style={{'fontSize':'9px'}}>{t('Menu.updateView')}</Col>
      </Button>
    </span>
  </OverlayTrigger>


  const button_heredited_attr_from_master=<OverlayTrigger
    key={'buttonCloneMasterAttrViewDisabled'}
    placement={'bottom'}
    delay={500}
    overlay={(!connected)?(
      <Tooltip id={'buttonCloneMasterAttrViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
      <Tooltip id={'buttonCloneMasterAttrView'}>{t('Menu.tooltips.buttonCloneMasterAttrView')} </Tooltip>}
  >
    <span>
      <Button
        size='sm'
        variant='light'
        disabled={!connected}
        onClick={
          () => {
            set_show_modal_transparent_view_attr(true)
          }
        }
      >
        <Col>
          <FontAwesomeIcon style={{opacity:(!connected)?'0.6':'1'}} icon={faListCheck} />
        </Col>
        {!connected?
          <Col>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                fontSize:'1em',
                position: 'absolute',
                right: '0.1em',
                bottom: '0em',
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Col>
          :<></>}
        <Col style={{'fontSize':'9px',whiteSpace:'break-spaces',lineHeight:'0.8'}}>{t('view.keep_master_var')}</Col>
      </Button>
    </span>
  </OverlayTrigger>


  const button_clone_view=<OverlayTrigger
    key={'buttonCloneViewDisabled'}
    placement={'bottom'}
    delay={500}
    overlay={(!connected)?(
      <Tooltip id={'buttonCloneViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
      <Tooltip id={'buttonCloneView'}>{t('Menu.tooltips.buttonCloneView')} </Tooltip>}
  >
    <span>
      <Button
        size='sm'
        variant='light'
        disabled={!connected}
        onClick={
          () => {
            // Create a copy of the view
            const copy_view_data = JSON.parse(JSON.stringify(current_view.view_data))
            const new_ind = 'view_' + String(new Date().getTime())

            copy_view_data.view = []
            master_data.view.push({
              id: new_ind,
              view_data: copy_view_data,
              nom: 'copy of ' + current_view.nom,
              details: '',
              heredited_attr_from_master:[]

            })
            set_view(new_ind)
            set_master_data({...master_data})
            set_data(get_data_from_view(master_data,new_ind))
          }
        }
      >
        <Col><FaCopy
          style={{opacity:(!connected)?'0.6':'1'}}/>
        </Col>
        {!connected?
          <Col>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                fontSize:'1em',
                position: 'absolute',
                right: '0.1em',
                bottom: '0em',
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Col>
          :<></>}
        <Col style={{'fontSize':'9px'}}>{t('view.copy')}</Col>
      </Button>
    </span>
  </OverlayTrigger>


  const button_import_view=<OverlayTrigger
    key={'buttonImportViewDisabled'}
    placement={'bottom'}
    delay={500}
    overlay={(!connected)?(
      <Tooltip id={'buttonImportViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
      <Tooltip id={'buttonImportView'}>{t('Menu.tooltips.buttonImportView')} </Tooltip>}
  >
    <span>
      <Button
        size='sm'
        variant='light'
        disabled={!connected}
        onClick={
          () => {
            // Allow us to import a view by loading a sankey then updating the view like if we did a Ctrl+S
            if (_load_json.current) {
              _load_json.current.name = ''
              _load_json.current.click()
              _load_json.current.id = master_data.current_view
            }
          }
        }
      >
        <Col><FaFileImport
          style={{opacity:(!connected)?'0.6':'1'}}/>
        </Col>
        {!connected?
          <Col>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                fontSize:'1em',
                position: 'absolute',
                right: '0.1em',
                bottom: '0em',
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Col>
          :<></>}
        <Col style={{'fontSize':'9px'}}>{t('view.import')}</Col>
      </Button>
    </span>
  </OverlayTrigger>


  const button_export_view=<OverlayTrigger
    key={'buttonExportViewDisabled'}
    placement={'bottom'}
    delay={500}
    overlay={(!connected)?(
      <Tooltip id={'buttonExportViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
      <Tooltip id={'buttonExportView'}>{t('Menu.tooltips.buttonExportView')} </Tooltip>}
  >
    <span>
      <Button
        size='sm'
        variant='light'
        disabled={!connected}
        onClick={()=>{
          const to_download=get_data_from_view(master_data,current_view.id)
          to_download.view=[]
          clickSaveDiagram(to_download,current_view.nom)
        }}
      >
        <Col><FaFileExport
          style={{opacity:(!connected)?'0.6':'1'}}/>
        </Col>
        {!connected?
          <Col>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                fontSize:'1em',
                position: 'absolute',
                right: '0.1em',
                bottom: '0em',
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Col>
          :<></>}
        <Col style={{'fontSize':'9px'}}>{t('view.import')}</Col>
      </Button>
    </span>
  </OverlayTrigger>

  return <>
    <OverlayTrigger
      key={'buttonHomeViewDisabled'}
      placement={'bottom'}
      delay={500}
      overlay={(!connected && !has_views)?
        <Tooltip id={'buttonHomeViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>:
        <Tooltip id={'buttonHme'}>{t('Menu.tooltips.home')} </Tooltip>}
    >
      <span>
        <Button
          size='sm'
          variant='light'
          disabled={(!connected && !has_views)}
          onClick={() => {
            const ev = document
            const tmp = { key: 'F7' }
            if (ev.onkeydown) {
              ev.onkeydown(tmp as KeyboardEvent)
            }
          }}>
          <Col><FaHome
            style={{opacity:(!connected && !has_views)?'0.6':'1'}}/>
          </Col>
          {(!connected && !has_views)?
            <Col>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  fontSize:'1em',
                  position: 'absolute',
                  right: '0.1em',
                  bottom: '0em',
                  color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
            </Col>
            :<></>}
          <Col style={{'fontSize':'9px'}}>{t('Menu.home')}</Col>
        </Button>
      </span>
    </OverlayTrigger>

    {buttonCreateView}
    {buttonUpdateView}

    <OverlayTrigger
      key={'buttonPrevViewDisabled'}
      placement={'bottom'}
      delay={500}
      overlay={(!connected && !has_views)?
        <Tooltip id={'buttonPrevViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>:
        <Tooltip id={'buttonPrevView'}>{t('Menu.tooltips.PrevViewButton')} </Tooltip>}
    >
      <span>
        <Button
          size='sm'
          variant={'light'}
          disabled={prev_button_disabled || !has_views}
          onClick={() => {
            const ev = document
            const tmp = { key: 'F8' }
            if (ev.onkeydown) {
              ev.onkeydown(tmp as KeyboardEvent)
            }
          }}>
          <Col><FaCaretSquareLeft
            style={{opacity:(prev_button_disabled || !has_views)?'0.6':'1'}}/>
          </Col>
          {(!connected && !has_views)?
            <Col>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  fontSize:'1em',
                  position: 'absolute',
                  right: '0.1em',
                  bottom: '0em',
                  color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
            </Col>
            :<></>}
          <Col style={{'fontSize':'9px'}}>{t('Menu.precView')}</Col>
        </Button>
      </span>
    </OverlayTrigger>

    <OverlayTrigger
      key={'buttonNextViewDisabled'}
      placement={'bottom'}
      delay={500}
      overlay={(!connected && !has_views)?(
        <Tooltip id={'buttonNextViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
        <Tooltip id={'buttonNextView'}>{t('Menu.tooltips.NextViewButton')} </Tooltip>}
    >
      <span>
        <Button
          size='sm'
          variant={'light'}
          disabled={next_button_disabled || !has_views}
          onClick={() => {
            const ev = document
            const tmp = { key: 'F9'}
            if (ev.onkeydown) {
              ev.onkeydown(tmp as KeyboardEvent)
            }
          }}>
          <Col><FaCaretSquareRight
            style={{opacity:(next_button_disabled || !has_views)?'0.6':'1'}}
          /></Col>
          {(!connected && !has_views)?
            <Col>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  fontSize:'1em',
                  position: 'absolute',
                  right: '0.1em',
                  bottom: '0em',
                  color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
            </Col>
            :<></>}
          <Col style={{'fontSize':'9px'}}>{t('Menu.nextView')}</Col>
        </Button>
      </span>
    </OverlayTrigger>
    {(master_data?master_data:{view:[] as string[]}).view.length>0?<>{selecteur_view(data,set_data,view,set_view,multi_selected_nodes,multi_selected_links,multi_selected_label,master_data,set_master_data,t,set_view_not_saved)}</>:<></>}
    {(master_data?master_data:{view:[] as string[]}).view.length>0 && master_data.current_view!=='none' && !window.SankeyToolsStatic?<>
      {button_heredited_attr_from_master}
      {button_clone_view}
      {button_import_view}
      {button_export_view}
    </>
      :<></>

    }
  </>
}

export const SankeyPlusMenuPreferenceView=(data:SankeyPlusData,set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,preferenceCheck:(str: string, data: SankeyPlusData) => void)=>{
  return <InputGroup>
    <InputGroup.Text style={{width:'20%'}}>Storytelling</InputGroup.Text>
    <Button style={{width:'10%'}} className='btn_menu_config' key='Vis' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('Vis')?'primary':'outline-primary'} onClick={() => {
      preferenceCheck('Vis',data)
      set_data({ ...data })
    }} >
      {data.accordeonToShow.includes('Vis')?<FaEye/>:<FaEyeSlash/>}
    </Button>
  </InputGroup>
}


// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export const modal_view_not_saved=(view_not_saved:string,set_view_not_saved:(s:string)=>void,t:TFunction,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string

)=>{
  return (
    <Modal
      size="lg"
      show={view_not_saved !== ''}
      backdrop={'static'}
      centered>
      <Modal.Header>
        <Modal.Title>{t('view.ns')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {t('view.warn_ns')}
      </Modal.Body>
      <Modal.Footer>
        <Button variant='danger'
          onClick={()=>{
            // Don't save the view before changing to the selected one
            if(view !== 'none'){
              const data_view=get_data_from_view(master_data,view) as SankeyPlusData
              set_data(data_view)
              setTimeout(()=>{
                adjust_sankey_zone(data_view,sankey_plus_min_width_and_height)
              },100)
            } else if(view === 'none'){
              set_data({...master_data})
              setTimeout(()=>{
                adjust_sankey_zone(master_data,sankey_plus_min_width_and_height)
              },100)
            }
            set_view_not_saved('')
          }}
        >{t('view.dont_save')}</Button>
        <Button variant='success'
          onClick={()=>{
            // Save the view before changing to the selected one

            let difference = deep_diff.diff(master_data, data)
            difference=(difference !== undefined)?difference:[]
            difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
            master_data.view.filter(v => v.id === view_not_saved)[0].view_data = {diff:difference}

            if(view !== 'none'){
              const data_view=get_data_from_view(master_data,view) as SankeyPlusData
              set_master_data({...JSON.parse(JSON.stringify(master_data))})
              set_data(data_view)
              setTimeout(()=>{
                adjust_sankey_zone(data_view,sankey_plus_min_width_and_height)
              },100)

            } else if(view === 'none'){
              set_data({...JSON.parse(JSON.stringify(master_data))})
              setTimeout(()=>{
                adjust_sankey_zone(master_data,sankey_plus_min_width_and_height)
              },100)
            }
            set_view_not_saved('')
          }}
        >{t('view.save')}</Button>
      </Modal.Footer>
    </Modal>)
}

export const toolbar_fullscreen=(data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  connected:boolean,
  set_view_not_saved:(s:string)=>void,
  _load_json:{current:HTMLInputElement},
  set_show_modal_transparent_view_attr:(b:boolean)=>void
)=>{
  const buttons_view= SankeyPlusBannerView(data,set_data,view,set_view,multi_selected_nodes,multi_selected_links,multi_selected_label,master_data,set_master_data,t,connected,set_view_not_saved,_load_json,set_show_modal_transparent_view_attr)
  const group_btn=<ButtonGroup>
    {buttons_view}
  </ButtonGroup>
  return <>{group_btn}</>

}

export const modal_transparent_view_attr=(show_modal_transparent_view_attr:boolean,
  set_show_modal_transparent_view_attr:(b:boolean)=>void,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  current_view:ViewType,
  t:TFunction
)=>{
  return <Modal size='xl' show={show_modal_transparent_view_attr} onHide={()=>{
    recompute_views(data,data,set_data)
    set_show_modal_transparent_view_attr(false)}}>
    <Modal.Header closeButton>{t('view.setTransparentAttr')}</Modal.Header>
    <Modal.Body>
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Topology')}</InputGroup.Text>
         
        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('addNode')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('addNode')){
              current_view.heredited_attr_from_master.push('addNode')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('addNode'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{t('Menu.Transformation.addNode')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('removeNode')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('removeNode')){
              current_view.heredited_attr_from_master.push('removeNode')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('removeNode'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{t('Menu.Transformation.removeNode')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('addFlux')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('addFlux')){
              current_view.heredited_attr_from_master.push('addFlux')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('addFlux'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }>{t('Menu.Transformation.addFlux')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('removeFlux')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('removeFlux')){
              current_view.heredited_attr_from_master.push('removeFlux')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('removeFlux'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }>{t('Menu.Transformation.removeFlux')}</Button>
            
      </InputGroup>           
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Geometry')}</InputGroup.Text>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('posNode')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('posNode')){
              current_view.heredited_attr_from_master.push('posNode')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('posNode'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }>{t('Menu.Transformation.PosNoeud')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('posFlux')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('posFlux')){
              current_view.heredited_attr_from_master.push('posFlux')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('posFlux'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }> {t('Menu.Transformation.posFlux')}</Button>
            
      </InputGroup>
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Values')}</InputGroup.Text>

        <Button 
          className='btn_menu_config' 
          style={{width:'20%'}}
          variant={ current_view.heredited_attr_from_master.includes('Values')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('Values')){
              current_view.heredited_attr_from_master.push('Values')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('Values'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{current_view.heredited_attr_from_master.includes('Values')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
            
      </InputGroup>
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Attribut')}</InputGroup.Text>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('attrNode')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('attrNode')){
              current_view.heredited_attr_from_master.push('attrNode')
                    
    
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('attrNode'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{t('Menu.Transformation.attrNode')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('attrFlux')?'primary':'outline-primary'} 
          onClick={() =>{
            if(!current_view.heredited_attr_from_master.includes('attrFlux')){
              current_view.heredited_attr_from_master.push('attrFlux')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('attrFlux'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{t('Menu.Transformation.attrFlux')}</Button>
            
      </InputGroup>
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Tags')}</InputGroup.Text>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('tagNode')?'primary':'outline-primary'} 
          onClick={() =>{
            if(!current_view.heredited_attr_from_master.includes('tagNode')){
              current_view.heredited_attr_from_master.push('tagNode')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagNode'),1)
                    
    
            }}
          }
        >{t('Menu.Transformation.tagNode')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('tagFlux')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('tagFlux')){
              current_view.heredited_attr_from_master.push('tagFlux')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagFlux'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{t('Menu.Transformation.tagFlux')}</Button>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('tagData')?'primary':'outline-primary'}
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('tagData')){
              current_view.heredited_attr_from_master.push('tagData')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagData'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{t('Menu.Transformation.tagData')}</Button>
            
      </InputGroup>
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.tagLevel')}</InputGroup.Text>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('tagLevel')?'primary':'outline-primary'} 
          onClick={() => {
            if(!current_view.heredited_attr_from_master.includes('tagLevel')){
              current_view.heredited_attr_from_master.push('tagLevel')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('tagLevel'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{current_view.heredited_attr_from_master.includes('tagLevel')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
            
      </InputGroup>
      <InputGroup>
            
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.attrGeneral')}</InputGroup.Text>

        <Button 
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={current_view.heredited_attr_from_master.includes('attrGeneral')?'primary':'outline-primary'} 
          onClick={() =>{
            if(!current_view.heredited_attr_from_master.includes('attrGeneral')){
              current_view.heredited_attr_from_master.push('attrGeneral')
            }else{
              current_view.heredited_attr_from_master.splice(current_view.heredited_attr_from_master.indexOf('attrGeneral'),1)
            }
            set_data({...data})
            set_master_data({...master_data})

          }
          }
        >{current_view.heredited_attr_from_master.includes('attrGeneral')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
            
      </InputGroup>

    </Modal.Body>

    <Modal.Footer><Button onClick={()=>{
      updateLayout(data,master_data,current_view.heredited_attr_from_master)
      set_data({...data})
    }}>{t('view.updateViewWithMasterVar')}</Button></Modal.Footer>
  </Modal>
}