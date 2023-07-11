import React from 'react'
import { Row, Form, FormLabel, Col, FormCheck,Tab, Table, Button, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyNode,SankeyLinkValue } from './types'
import { link_visible,link_color,return_value_link} from './SankeyUtils'
import { FaArrowAltCircleUp, FaArrowAltCircleDown} from 'react-icons/fa'
import { TFunction } from 'i18next'

// Search links coming from/going to(io) from a face of it (pos) and return them
const getIOLink=(
  data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},
  pos:string,
  io:string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  const n=multi_selected_nodes.current[0]

  let link_io=([] as string[])

  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les flux entrant a gauche
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const recy=return_value_link(data,data.links[k],'recycling') as boolean
        const ori=return_value_link(data,data.links[k],'orientation') as string

        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x<=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x<0))&& !recy)
        const cond_recy=(recy && n_s.x>n.x)

        return (cond_no_recy || cond_recy)  && (ori=='hh' ||ori=='vh') && link_visible(data.links[k],data,getLinkValue)
      })
    }else if(pos=='right'){
      //Recherche tous les flux entrant a droite
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const recy=return_value_link(data,data.links[k],'recycling') as boolean
        const ori=return_value_link(data,data.links[k],'orientation') as string

        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x>=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x>0))&& !recy)
        const cond_recy=(recy && n_s.x<n.x)

        return  (cond_no_recy ||cond_recy) && (ori=='hh' ||ori=='vh')&& link_visible(data.links[k],data,getLinkValue)
      })
    }else if(pos=='top'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const ori=return_value_link(data,data.links[k],'orientation') as string
        const n_s=data.nodes[data.links[k].idSource]

        return n_s.y<n.y && (ori=='vv' ||ori=='hv')&& link_visible(data.links[k],data,getLinkValue)
      })
    }else if(pos=='bottom'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const ori=return_value_link(data,data.links[k],'orientation') as string
        const n_s=data.nodes[data.links[k].idSource]

        return n_s.y>=n.y && (ori=='vv' ||ori=='hv')&& link_visible(data.links[k],data,getLinkValue)
      })
    }
  }else if(io=='output'){
    if(pos=='left'){
      //Recherche tous les flux entrant a gauche
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const recy=return_value_link(data,data.links[k],'recycling') as boolean
        const ori=return_value_link(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x<n.x  && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x<=0)) && !recy)
        const cond_recy=(recy && n_t.x>n.x)

        return (( cond_no_recy|| cond_recy)) && (ori=='hh' ||ori=='hv')&& link_visible(data.links[k],data,getLinkValue)
      })
    }else if(pos=='right'){
      //Recherche tous les flux entrant a droite
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const recy=return_value_link(data,data.links[k],'recycling') as boolean
        const ori=return_value_link(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x>=n.x && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x>0))&& !recy)
        const cond_recy=(recy && n_t.x<n.x)

        return  ( cond_no_recy || cond_recy) && (ori=='hh' ||ori=='hv')&& link_visible(data.links[k],data,getLinkValue)
      })
    }else if(pos=='top'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const ori=return_value_link(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]

        return n_t.y<n.y && (ori=='vv' ||ori=='vh')&& link_visible(data.links[k],data,getLinkValue)
      })
    }else if(pos=='bottom'){
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const ori=return_value_link(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]
        
        return n_t.y>=n.y && (ori=='vv' ||ori=='vh')&& link_visible(data.links[k],data,getLinkValue)
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
  multi_selected_nodes:{current:SankeyNode[]},
  k_link:string,
  pos:string,
  io:string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,multi_selected_nodes,pos,io,getLinkValue)
  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les flux entrant a gauche


      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){
      //Recherche tous les flux entrant a droite

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='top'){
      //Recherche tous les flux entrant en haut

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Recherche tous les flux entrant en haut

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
      //Recherche tous les flux sortant a gauche


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){
      //Recherche tous les flux sortant a droite

      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)

        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }


    }else if(pos=='top'){
      //Recherche tous les flux sortant en haut


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Recherche tous les flux sortant en bas


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
  multi_selected_nodes:{current:SankeyNode[]},
  k_link:string,
  pos:string,
  io:string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,multi_selected_nodes,pos,io,getLinkValue)

  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les flux entrant a gauche


      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){
      //Recherche tous les flux entrant a droite

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }else if(pos=='top'){
      //Recherche tous les flux entrant en haut

      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }else if(pos=='bottom'){
      //Recherche tous les flux entrant en haut

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
      //Recherche tous les flux sortant a gauche


      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){
      //Recherche tous les flux sortant a droite

      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){

        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='top'){
      //Recherche tous les flux sortant en haut

      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Recherche tous les flux sortant en bas
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
  multi_selected_nodes:{current:SankeyNode[]},
  io:string,
  pos:string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  const link_io=getIOLink(data,multi_selected_nodes,pos,io,getLinkValue)
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
  multi_selected_nodes:{current:SankeyNode[]},
  pos:string,io:string,tab_colored:boolean,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  const link_io=getIOLink(data,multi_selected_nodes,pos,io,getLinkValue)
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
                const color=link_color(data.links[k],data,getLinkValue) as string
                const bc={'backgroundColor': (color && tab_colored)?color:'inherit'}
                const n_s=data.nodes[data.links[k].idSource]
                const n_t=data.nodes[data.links[k].idTarget]

                return (
                  <tr key={i.toString()}>

                    <td style={bc}>{n_s.name+'===>'+n_t.name}</td>
                    <td style={{ 'width': '10%' }}>
                      <ButtonGroup className="button_position" size="sm">
                        <Button variant="info" onClick={() => handleUpLinkIOPos(data,set_data,multi_selected_nodes,k,pos,io,getLinkValue)}><FaArrowAltCircleUp /></Button>
                        <Button variant="info" onClick={() => handleDownLinkIOPos(data,set_data,multi_selected_nodes,k,pos,io,getLinkValue)}><FaArrowAltCircleDown /></Button>
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

export const SankeyMenuConfigurationNodesIO = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  link_io:string,
  set_link_io:React.Dispatch<React.SetStateAction<string>>,
  link_pos:string,
  set_link_pos:React.Dispatch<React.SetStateAction<string>>,
  tab_colored:boolean,
  set_tab_colored:React.Dispatch<React.SetStateAction<boolean>>,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  // const [link_io,set_link_io]=useState<string>('output')
  // const [link_pos,set_link_pos]=useState<string>('right')
  // const [tab_colored,set_tab_colored]=useState<boolean>(false)

  return <Tab eventKey="node_link_io" title={t('Noeud.PF.PF')}>
    <Form>
      <Form.Group as={Row}>
        <Col xs={6}>
          <FormLabel >{t('Noeud.PF.FES')}</FormLabel>
        </Col>

        {/* Choisir un lien entrant */}
        <Col xs={3}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.1'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.1'}>{t('Noeud.PF.tooltips.sort')} </Tooltip>}>
            <FormCheck
              value="output"
              type='radio'
              label={t('Noeud.PF.sort')}
              checked={link_io=='output'}
              onChange={() => {
                set_link_io('output')
                set_link_pos('')
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Choisir un lien entrant */}
        <Col xs={3}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.2'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.2'}>{t('Noeud.PF.tooltips.ent')} </Tooltip>}>
            <FormCheck
              value="input"
              type='radio'
              label={t('Noeud.PF.ent')}
              checked={link_io=='input'}
              onChange={() => {
                set_link_io('input')
                set_link_pos('')
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      <Form.Group as={Row}>
        <Col xs={2}>
          <FormLabel >{t('Noeud.PF.FRN')}</FormLabel>
        </Col>

        {/* Choisir un lien situé à gauche */}
        <Col xs={2}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.3'}>{t('Noeud.PF.tooltips.gauche')} </Tooltip>}>
            <FormCheck
              disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'left',getLinkValue)}
              value="left"
              type='radio'
              label={t('Noeud.PF.gauche')}
              checked={link_pos=='left'}
              onChange={() => {
                set_link_pos('left')
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Choisir un lien situé à droite */}
        <Col xs={2}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.4'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.4'}>{t('Noeud.PF.tooltips.droite')}</Tooltip>}>
            <FormCheck
              disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'right',getLinkValue)}
              value="right"
              type='radio'
              label={t('Noeud.PF.droite')}
              checked={link_pos=='right'}
              onChange={() => {
                set_link_pos('right')
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Choisir un lien situé au dessus */}
        <Col xs={3}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.5'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.5'}>{t('Noeud.PF.tooltips.ades')}</Tooltip>}>
            <FormCheck
              disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'top',getLinkValue)}
              value="top"
              type='radio'
              label={t('Noeud.PF.ades')}
              checked={link_pos=='top'}
              onChange={() => {
                set_link_pos('top')
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Choisir un lien situé en dessous */}
        <Col xs={3}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.6'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.6'}>{t('Noeud.PF.tooltips.edes')}</Tooltip>}>
            <FormCheck
              disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'bottom',getLinkValue)}
              value="bottom"
              type='radio'
              label={t('Noeud.PF.edes')}
              checked={link_pos=='bottom'}
              onChange={() => {
                set_link_pos('bottom')
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Mettre les couleurs des flux dans le tableau pour les indentifier */}
      <Form.Group as={Row}>
        <Col xs={8}>
          <FormLabel >{t('Noeud.PF.lti')}</FormLabel>
        </Col>
        <Col xs={3}>
          <OverlayTrigger
            key={'noeud.pf.tooltips.7'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.pf.tooltips.7'}>{t('Noeud.PF.tooltips.lti')}</Tooltip>}>
            <FormCheck
              value="bottom"
              type='checkbox'
              label={t('Noeud.PF.col')}
              checked={tab_colored}
              onChange={() => {
                //console.log(tab_colored)
                set_tab_colored(!tab_colored)
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>
    </Form>
    {tab_pos_link(t,data,set_data,multi_selected_nodes,link_pos,link_io,tab_colored,getLinkValue)}
  </Tab>
}


