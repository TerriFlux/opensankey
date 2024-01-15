import React, { useState } from 'react'
import { Tab, Table, Button, ButtonGroup, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap'
import { SankeyData, SankeyNode } from '../types/Types'
import { LinkVisible,LinkColor,ReturnValueLink} from './SankeyUtils'
import { reorganize_node_outputLinksId,reorganize_node_inputLinksId } from '../draw/SankeyDrawLayout'
import { FaArrowAltCircleUp, FaArrowAltCircleDown} from 'react-icons/fa'
import { TFunction } from 'i18next'
import { SelectVisualyLinks } from '../draw/SankeyDrawFunction' 
import { GetLinkValueFuncType } from './types/SankeyUtilsTypes'
import { SankeyMenuConfigurationNodesIOFType} from './types/SankeyMenuConfigurationNodesIOTypes'

// Search links coming from/going to(io) from a face of it (pos) and return them
const getIOLink=(
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  pos:string,
  io:string,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const n=multi_selected_nodes.current[0]

  let link_io=([] as string[])

  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les flux entrant a gauche
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string

        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x<=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x<0))&& !recy)
        const cond_recy=(recy && n_s.x>=n.x)

        return (cond_no_recy || cond_recy)  && (ori=='hh' ||ori=='vh') && LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }else if(pos=='right'){
      //Recherche tous les flux entrant a droite
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string

        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x>=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x>0))&& !recy)
        const cond_recy=(recy && n_s.x<n.x)

        return  (cond_no_recy ||cond_recy) && (ori=='hh' ||ori=='vh')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }else if(pos=='top'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_s=data.nodes[data.links[k].idSource]

        return n_s.y<n.y && (ori=='vv' ||ori=='hv')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }else if(pos=='bottom'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_s=data.nodes[data.links[k].idSource]

        return n_s.y>=n.y && (ori=='vv' ||ori=='hv')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }
  }else if(io=='output'){
    if(pos=='left'){
      //Recherche tous les flux entrant a gauche
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x<n.x  && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x<=0)) && !recy)
        const cond_recy=(recy && n_t.x>n.x)

        return (( cond_no_recy|| cond_recy)) && (ori=='hh' ||ori=='hv')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }else if(pos=='right'){
      //Recherche tous les flux entrant a droite
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x>=n.x && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x>0))&& !recy)
        const cond_recy=(recy && n_t.x<=n.x)

        return  ( cond_no_recy || cond_recy) && (ori=='hh' ||ori=='hv')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }else if(pos=='top'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]

        return n_t.y<n.y && (ori=='vv' ||ori=='vh')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }else if(pos=='bottom'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]

        return n_t.y>=n.y && (ori=='vv' ||ori=='vh')&& LinkVisible(data.links[k],data,display_nodes,GetLinkValue)
      })
    }
  }
  return link_io

}
/**
   * Switch the link with the one on top of him (similar to drag link)
   *
   * @param {string} k_link
   * @param {string} pos
   * @param {string} io
   */
const handleUpLinkIOPos=(
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  k_link:string,
  pos:string,
  io:string,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,display_nodes,multi_selected_nodes,pos,io,GetLinkValue)
  if(io=='input'){
    if(pos=='left'){


      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='top'){

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }
  }else if(io=='output'){
    if(pos=='left'){


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){

      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)

        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }


    }else if(pos=='top'){


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }
  }

  set_data({...data})
}

/**
   * Switch the link with the one below him (similar to drag link)
   *
   * @param {string} k_link
   * @param {string} pos
   * @param {string} io
   */
const handleDownLinkIOPos=(
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  k_link:string,
  pos:string,
  io:string,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,display_nodes,multi_selected_nodes,pos,io,GetLinkValue)

  if(io=='input'){
    if(pos=='left'){


      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }else if(pos=='top'){

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }else if(pos=='bottom'){

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }
  }else if(io=='output'){
    if(pos=='left'){


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){

      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){

        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='top'){

      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }
  }

  set_data({...data})
}
/**
   * Check if the selected node has links coming from/going to(io) from a face of it (pos)
   *
   * @param {string} io
   * @param {string} pos
   * @returns {boolean}
   */
const has_link_come_from=(
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  io:string,
  pos:string,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const link_io=getIOLink(data,display_nodes,multi_selected_nodes,pos,io,GetLinkValue)
  return link_io.length==0
}


/**
   * Create a html table displaying links attached to the selected node and filtered by where they're coming/going from
   *
   * @param {string} pos
   * @param {string} io
   * @returns {*}
   */
const tab_pos_link=(
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  pos:string,io:string,tab_colored:boolean,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const link_io=getIOLink(data,display_nodes,multi_selected_nodes,pos,io,GetLinkValue)
  return (
    <>
      <Table striped bordered hover className='node_group_tags_definition'>
        <thead>
          <tr>
            <th>{t('Menu.flux')}</th>
            <th>{t('Tags.Position')}</th>
          </tr>
        </thead>
        <tbody>
          {
            link_io.map(
              (k, i) => {
                const color=LinkColor(data.links[k],data,GetLinkValue) as string
                const bc={'backgroundColor': (color && tab_colored)?color:'inherit'}
                const n_s=data.nodes[data.links[k].idSource]
                const n_t=data.nodes[data.links[k].idTarget]

                return (
                  <tr key={i.toString()}>

                    <td style={bc}>{n_s.name+'===>'+n_t.name}</td>
                    <td style={{ 'width': '10%' }}>
                      <ButtonGroup className="button_position" size="sm">
                        <Button variant="info" onClick={() => handleUpLinkIOPos(data,set_data,display_nodes,multi_selected_nodes,k,pos,io,GetLinkValue)}><FaArrowAltCircleUp /></Button>
                        <Button variant="info" onClick={() => handleDownLinkIOPos(data,set_data,display_nodes,multi_selected_nodes,k,pos,io,GetLinkValue)}><FaArrowAltCircleDown /></Button>
                      </ButtonGroup>
                    </td>

                  </tr>
                )
              })
          }
        </tbody>
      </Table>
    </>
  )
}

export const SankeyMenuConfigurationNodesIO : SankeyMenuConfigurationNodesIOFType = (
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  GetLinkValue:GetLinkValueFuncType,
  menu_for_modal=false
) => {
  const { t } = applicationContext
  const { data, set_data, display_nodes } = dict_variable_application_data
  const { multi_selected_nodes, multi_selected_links } = dict_variable_elements_selected

  const [link_io,set_link_io] = useState('output')
  const [link_pos,set_link_pos] = useState('right')
  const [tab_colored,set_tab_colored] = useState(false)

  const logo_enter=<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 512 512" width="15" height="15">
    <g>
      <path d="M170.699,448H72.757c-4.814-0.012-8.714-3.911-8.725-8.725V72.725c0.012-4.814,3.911-8.714,8.725-8.725h97.941   c17.673,0,32-14.327,32-32s-14.327-32-32-32H72.757C32.612,0.047,0.079,32.58,0.032,72.725v366.549   C0.079,479.42,32.612,511.953,72.757,512h97.941c17.673,0,32-14.327,32-32S188.372,448,170.699,448z"/>
      <path d="M480.032,224l-290.987,0.576l73.941-73.941c12.501-12.495,12.506-32.758,0.011-45.259s-32.758-12.506-45.259-0.011   l-82.752,82.752c-37.491,37.49-37.491,98.274-0.001,135.764c0,0,0.001,0.001,0.001,0.001l82.752,82.752   c12.501,12.495,32.764,12.49,45.259-0.011s12.49-32.764-0.011-45.259l-72.811-72.789L480.032,288   c17.673-0.035,31.971-14.391,31.936-32.064S497.577,223.965,479.904,224H480.032z"/>
    </g>
  </svg>
  const logo_exit=<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="15" height="15">
    <g>
      <path d="M170.698,448H72.757c-4.814-0.012-8.714-3.911-8.725-8.725V72.725c0.012-4.814,3.911-8.714,8.725-8.725h97.941   c17.673,0,32-14.327,32-32s-14.327-32-32-32H72.757C32.611,0.047,0.079,32.58,0.032,72.725v366.549   C0.079,479.42,32.611,511.953,72.757,512h97.941c17.673,0,32-14.327,32-32S188.371,448,170.698,448z"/>
      <path d="M483.914,188.117l-82.816-82.752c-12.501-12.495-32.764-12.49-45.259,0.011s-12.49,32.764,0.011,45.259l72.789,72.768   L138.698,224c-17.673,0-32,14.327-32,32s14.327,32,32,32l0,0l291.115-0.533l-73.963,73.963   c-12.042,12.936-11.317,33.184,1.618,45.226c12.295,11.445,31.346,11.436,43.63-0.021l82.752-82.752   c37.491-37.49,37.491-98.274,0.001-135.764c0,0-0.001-0.001-0.001-0.001L483.914,188.117z"/>
    </g>
  </svg>

  // Content to reorganize the i/o of only 1 node at the time
  const content_for_one_node=multi_selected_nodes.current.length===1?<>

    {/* Choisir un lien entrant / sortant */}
    <InputGroup>
      <InputGroup.Text style={{width:'40%'}}>
        {t('Noeud.PF.FES')}
      </InputGroup.Text>

      <ButtonGroup style={{width:'60%'}}>
        
        {/* Choisir un lien entrant */}
        <OverlayTrigger
          key={'noeud.pf.tooltips.2'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.pf.tooltips.2'}>{t('Noeud.PF.tooltips.ent')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            variant={(link_io=='input')?'primary':'outline-primary'}
            onClick={() => {
              set_link_io('input')
              set_link_pos('')
            }}>{logo_enter}</Button>
        </OverlayTrigger>

        {/* Choisir un lien entrant */}
        <OverlayTrigger
          key={'noeud.pf.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.pf.tooltips.1'}>{t('Noeud.PF.tooltips.sort')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            variant={(link_io=='output')?'primary':'outline-primary'}
            onClick={() => {
              set_link_io('output')
              set_link_pos('')
            }}>{logo_exit}</Button>
        </OverlayTrigger>
      </ButtonGroup>
    </InputGroup>

    {/* Choix des liens */}
    <InputGroup>
      <InputGroup.Text style={{width:'40%'}}>
        {t('Noeud.PF.FRN')}
      </InputGroup.Text>

      <ButtonGroup style={{width:'60%'}}>

        {/* Choisir un lien situé à gauche */}
        <OverlayTrigger
          key={'noeud.pf.tooltips.3'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.pf.tooltips.3'}>{t('Noeud.PF.tooltips.gauche')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            disabled={has_link_come_from(data,set_data,display_nodes,multi_selected_nodes,link_io,'left',GetLinkValue)}
            variant={(link_pos=='left')?'primary':'outline-primary'}
            onClick={() => {
              set_link_pos('left')
            }}>
            {t('Noeud.PF.gauche')}
          </Button>
        </OverlayTrigger>

        {/* Choisir un lien situé à droite */}
        <OverlayTrigger
          key={'noeud.pf.tooltips.4'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.pf.tooltips.4'}>{t('Noeud.PF.tooltips.droite')}</Tooltip>}>
          <Button
            className='btn_menu_config'
            disabled={has_link_come_from(data,set_data,display_nodes,multi_selected_nodes,link_io,'right',GetLinkValue)}
            variant={(link_pos=='right')?'primary':'outline-primary'}
            onClick={() => {
              set_link_pos('right')
            }}>
            {t('Noeud.PF.droite')}
          </Button>
        </OverlayTrigger>

        {/* Choisir un lien situé au dessus */}
        <OverlayTrigger
          key={'noeud.pf.tooltips.5'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.pf.tooltips.5'}>{t('Noeud.PF.tooltips.ades')}</Tooltip>}>
          <Button
            className='btn_menu_config'
            disabled={has_link_come_from(data,set_data,display_nodes,multi_selected_nodes,link_io,'top',GetLinkValue)}
            variant={(link_pos=='top')?'primary':'outline-primary'}
            onClick={() => {
              set_link_pos('top')
            }}>
            {t('Noeud.PF.ades')}
          </Button>
        </OverlayTrigger>

        {/* Choisir un lien situé en dessous */}
        <OverlayTrigger
          key={'noeud.pf.tooltips.6'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.pf.tooltips.6'}>{t('Noeud.PF.tooltips.edes')}</Tooltip>}>
          <Button
            className='btn_menu_config'
            disabled={has_link_come_from(data,set_data,display_nodes,multi_selected_nodes,link_io,'bottom',GetLinkValue)}
            variant={(link_pos=='bottom')?'primary':'outline-primary'}
            onClick={() => {
              set_link_pos('bottom')
            }}>
            {t('Noeud.PF.edes')}
          </Button>
        </OverlayTrigger>
      </ButtonGroup>
    </InputGroup>

    {/* Mettre les couleurs des flux dans le tableau pour les indentifier */}
    <InputGroup>
      <InputGroup.Text style={{width:'70%'}}>
        {t('Noeud.PF.lti')}
      </InputGroup.Text>

      <OverlayTrigger
        key={'noeud.pf.tooltips.7'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'noeud.pf.tooltips.7'}>{t('Noeud.PF.tooltips.lti')}</Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'30%'}}
          variant={tab_colored?'primary':'outline-primary'}
          onClick={() => {
            set_tab_colored(!tab_colored)
          }}>
          {t('Noeud.PF.col')}
        </Button>
      </OverlayTrigger>
    </InputGroup>

    {/* Table montrant les noeuds selectionnés  */}
    {tab_pos_link(t,data,set_data,display_nodes,multi_selected_nodes,link_pos,link_io,tab_colored,GetLinkValue)}

  </>:<></>

  const content_always_present=<InputGroup>
    {/* Boutons de rérrangement / selection des flux  */}
    <ButtonGroup>
      <OverlayTrigger
        key={'menu.tooltips.noeud.7'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.7'}>{t('Noeud.tooltips.Reorg')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'33.3%'}}
          variant='primary'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              reorganize_node_inputLinksId(data,d, data.nodes, data.links)
              reorganize_node_outputLinksId(data,d, data.nodes, data.links)
            })
            set_data({ ...data })
          }}>
          {t('Noeud.Reorg')}
        </Button>
      </OverlayTrigger>

      <OverlayTrigger
        key={'menu.tooltips.noeud.8'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.8'}>{t('Noeud.tooltips.SlctOutLink')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'33.3%'}}
          variant='primary'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.outputLinksId.includes(l.idLink)))
              const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
              dict_variable_elements_selected.ref_display_link_opacity.current.forEach(setter=>setter(opacity))
            })
            multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          }}>
          {t('Noeud.SlctOutLink')}
        </Button>
      </OverlayTrigger>

      <OverlayTrigger
        key={'menu.tooltips.noeud.9'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.9'}>{t('Noeud.tooltips.SlctInLink')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'33.4%'}}
          variant='primary'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
              const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
              dict_variable_elements_selected.ref_display_link_opacity.current.forEach(setter=>setter(opacity))
            })
            multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          }}>
          {t('Noeud.SlctInLink')}
        </Button>
      </OverlayTrigger>
    </ButtonGroup>
  </InputGroup>

  const content=<>
    {content_for_one_node}
    {content_always_present}
  </>

  return menu_for_modal?content:<Tab key="node_link_io" eventKey="node_link_io" title={t('Noeud.PF.PF')}>{content}</Tab>
}


