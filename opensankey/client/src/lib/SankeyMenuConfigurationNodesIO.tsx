import React from 'react'
import { Row, Form, FormLabel, Col, FormCheck,Tab, Table, Button, ButtonGroup} from 'react-bootstrap'
import { SankeyData, SankeyNode } from './types'
import { link_visible,link_color} from './SankeyUtils'
import { FaArrowAltCircleUp, FaArrowAltCircleDown} from 'react-icons/fa'
import { TFunction } from 'i18next'

// Search links coming from/going to(io) from a face of it (pos) and return them
const getIOLink=(
  data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},
  pos:string,
  io:string
)=>{
  const n=multi_selected_nodes.current[0]

  let link_io=([] as string[])

  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les liens entrant a gauche
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x<=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x<0))&& !data.links[k].recycling)
        const cond_recy=(data.links[k].recycling && n_s.x>n.x)
        return (cond_no_recy || cond_recy)  && (data.links[k].orientation=='hh' ||data.links[k].orientation=='vh') && link_visible(data.links[k],data)
      })
    }else if(pos=='right'){
      //Recherche tous les liens entrant a droite
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x>=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x>0))&& !data.links[k].recycling)
        const cond_recy=(data.links[k].recycling && n_s.x<n.x)
        return  (cond_no_recy ||cond_recy) && (data.links[k].orientation=='hh' ||data.links[k].orientation=='vh')&& link_visible(data.links[k],data)
      })
    }else if(pos=='top'){
      //Recherche tous les liens entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const n_s=data.nodes[data.links[k].idSource]
        return n_s.y<n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
      })
    }else if(pos=='bottom'){
      //Recherche tous les liens entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const n_s=data.nodes[data.links[k].idSource]
        return n_s.y>=n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
      })
    }
  }else if(io=='output'){
    if(pos=='left'){
      //Recherche tous les liens entrant a gauche
      link_io=Object.values(n.outputLinksId).filter(k=>{
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x<n.x  && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x<=0)) && !data.links[k].recycling)
        const cond_recy=(data.links[k].recycling && n_t.x>n.x)
        return (( cond_no_recy|| cond_recy)) && (data.links[k].orientation=='hh' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
      })
    }else if(pos=='right'){ 
      //Recherche tous les liens entrant a droite
      link_io=Object.values(n.outputLinksId).filter(k=>{
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x>=n.x && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x>0))&& !data.links[k].recycling)
        const cond_recy=(data.links[k].recycling && n_t.x<n.x)
        return  ( cond_no_recy || cond_recy) && (data.links[k].orientation=='hh' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
      })
    }else if(pos=='top'){
      //Recherche tous les liens entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        const n_t=data.nodes[data.links[k].idTarget]
        return n_t.y<n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='vh')&& link_visible(data.links[k],data)
      })
    }else if(pos=='bottom'){
      //Recherche tous les liens entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        const n_t=data.nodes[data.links[k].idTarget]
        return n_t.y>=n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='vh')&& link_visible(data.links[k],data)
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
  io:string
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,multi_selected_nodes,pos,io)
  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les liens entrant a gauche
        

      //Repositionne le liens avant le liens entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      } 

    }else if(pos=='right'){
      //Recherche tous les liens entrant a droite
        
      //Repositionne le liens avant le liens entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='top'){
      //Recherche tous les liens entrant en haut
        
      //Repositionne le liens avant le liens entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Recherche tous les liens entrant en haut
     
      //Repositionne le liens avant le liens entrant du même coté
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
      //Recherche tous les liens sortant a gauche


      //Repositionne le liens avant le liens sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){
      //Recherche tous les liens sortant a droite

      //Repositionne le liens avant le liens sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)

        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }


    }else if(pos=='top'){
      //Recherche tous les liens sortant en haut
 
        
      //Repositionne le liens avant le liens sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Recherche tous les liens sortant en bas


      //Repositionne le liens avant le liens sortant du même coté
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
  io:string
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,multi_selected_nodes,pos,io)

  if(io=='input'){
    if(pos=='left'){
      //Recherche tous les liens entrant a gauche
        

      //Repositionne le liens avant le liens entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      } 

    }else if(pos=='right'){
      //Recherche tous les liens entrant a droite
        
      //Repositionne le liens avant le liens entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }else if(pos=='top'){
      //Recherche tous les liens entrant en haut
 
      //Repositionne le liens avant le liens entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }else if(pos=='bottom'){
      //Recherche tous les liens entrant en haut

      //Repositionne le liens avant le liens entrant du même coté
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
      //Recherche tous les liens sortant a gauche


      //Repositionne le liens avant le liens sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='right'){
      //Recherche tous les liens sortant a droite
        
      //Repositionne le liens avant le liens sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){

        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='top'){
      //Recherche tous les liens sortant en haut

      //Repositionne le liens avant le liens sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }

    }else if(pos=='bottom'){
      //Recherche tous les liens sortant en bas
      //Repositionne le liens avant le liens sortant du même coté
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
  pos:string
)=>{
  const link_io=getIOLink(data,multi_selected_nodes,pos,io)
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
  pos:string,io:string,tab_colored:boolean
)=>{
  const link_io=getIOLink(data,multi_selected_nodes,pos,io)
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
                const color=link_color(data.links[k],data)
                const bc={'backgroundColor': (color && tab_colored)?color:'inherit'}
                const n_s=data.nodes[data.links[k].idSource]
                const n_t=data.nodes[data.links[k].idTarget]

                return (
                  <tr key={i.toString()}>
                      
                    <td style={bc}>{n_s.name+'===>'+n_t.name}</td>
                    <td style={{ 'width': '10%' }}>
                      <ButtonGroup className="button_position" size="sm">
                        <Button variant="info" onClick={() => handleUpLinkIOPos(data,set_data,multi_selected_nodes,k,pos,io)}><FaArrowAltCircleUp /></Button>
                        <Button variant="info" onClick={() => handleDownLinkIOPos(data,set_data,multi_selected_nodes,k,pos,io)}><FaArrowAltCircleDown /></Button>
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
        <Col xs={3}>
          <FormCheck
            value="output"
            type='radio'
            label={t('Noeud.PF.sort')}
            checked={link_io=='output'}
            onChange={() => {
              set_link_io('output')
              set_link_pos('')
            }}
          />
        </Col>
        <Col xs={3}>
          <FormCheck
            value="input"
            type='radio'
            label={t('Noeud.PF.ent')}
            checked={link_io=='input'}
            onChange={() => {
              set_link_io('input')
              set_link_pos('')
            }}
          />
        </Col>

      </Form.Group>

      <Form.Group as={Row}>
        <Col xs={2}>
          <FormLabel >{t('Noeud.PF.FRN')}</FormLabel>
        </Col>
        <Col xs={2}>
          <FormCheck
            disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'left')}
            value="left"
            type='radio'
            label={t('Noeud.labels.gauche')}
            checked={link_pos=='left'}
            onChange={() => {
              set_link_pos('left')
            }}
          />
        </Col>
        <Col xs={2}>
          <FormCheck
            disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'right')}
            value="right"
            type='radio'
            label={t('Noeud.labels.droite')}
            checked={link_pos=='right'}
            onChange={() => {
              set_link_pos('right')
            }}
          />
        </Col>
        <Col xs={3}>
          <FormCheck
            disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'top')}
            value="top"
            type='radio'
            label={t('Noeud.PF.ades')}
            checked={link_pos=='top'}
            onChange={() => {
              set_link_pos('top')
            }}
          />
        </Col>
        <Col xs={3}>
          <FormCheck
            disabled={has_link_come_from(data,set_data,multi_selected_nodes,link_io,'bottom')}
            value="bottom"
            type='radio'
            label={t('Noeud.PF.edes')}
            checked={link_pos=='bottom'}
            onChange={() => {
              set_link_pos('bottom')
            }}
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Col xs={8}>
          <FormLabel >{t('Noeud.PF.lti')}</FormLabel>
        </Col>
        <Col xs={3}>
          <FormCheck
            value="bottom"
            type='checkbox'
            label={t('Noeud.PF.col')}
            checked={tab_colored}
            onChange={() => {
              //console.log(tab_colored)
              set_tab_colored(!tab_colored)
            }}
          />
        </Col>
      </Form.Group>
    </Form>
    {tab_pos_link(t,data,set_data,multi_selected_nodes,link_pos,link_io,tab_colored)}
  </Tab>
}


 