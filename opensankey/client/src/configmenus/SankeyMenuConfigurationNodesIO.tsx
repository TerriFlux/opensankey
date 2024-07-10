import React, { FunctionComponent, useState } from 'react'
import { FaArrowAltCircleUp, FaArrowAltCircleDown} from 'react-icons/fa'

import {
  Box,
  Button,
  Checkbox,
  Select,
  TabPanel,
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  useBoolean,
} from '@chakra-ui/react'

import { LinkVisible, LinkColor, ReturnValueLink, OSTooltip } from './SankeyUtils'
import { GetLinkValueFuncType } from './types/SankeyUtilsTypes'
import { SankeyMenuConfigurationNodesIOFType} from './types/SankeyMenuConfigurationNodesIOTypes'
import { LinkFunctionTypes, SankeyData, SankeyLink, SankeyNode } from '../types/Types'
import { reorganize_node_outputLinksId, reorganize_node_inputLinksId } from '../draw/SankeyDrawLayout'
import { SelectVisualyLinks } from '../draw/SankeyDrawFunction'


/**
   * Search links coming from/going to(io) from a face of it (pos) and return them
   */
const getIOLink = (
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  pos:string,
  io:string
)=>{
  const n=multi_selected_nodes.current[0]

  let link_io=([] as string[])

  if (io=='input') {
    if (pos=='left') {
      //Recherche tous les flux entrant a gauche
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string

        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x<=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x<0))&& !recy)
        const cond_recy=(recy && n_s.x>=n.x)

        return (
          (cond_no_recy || cond_recy) &&
          (ori==='hh' || ori==='vh') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    } else if(pos=='right') {
      //Recherche tous les flux entrant a droite
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string

        const n_s=data.nodes[data.links[k].idSource]
        const cond_no_recy=(((n_s.x>=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x>0))&& !recy)
        const cond_recy=(recy && n_s.x<n.x)

        return (
          (cond_no_recy ||cond_recy) &&
          (ori==='hh' || ori==='vh') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    } else if (pos=='top') {
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_s=data.nodes[data.links[k].idSource]

        return (
          (n_s.y < n.y) &&
          (ori === 'vv' ||ori === 'hv') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    } else if(pos=='bottom') {
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.inputLinksId).filter(k=>{
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_s=data.nodes[data.links[k].idSource]

        return (
          (n_s.y >= n.y) &&
          (ori === 'vv' ||ori === 'hv') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    }
  } else if (io=='output') {
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

        return (
          (cond_no_recy || cond_recy) &&
          (ori === 'hh' || ori === 'hv') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    } else if(pos=='right') {
      //Recherche tous les flux entrant a droite
      link_io = Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const recy=ReturnValueLink(data,data.links[k],'recycling') as boolean
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]
        const cond_no_recy=(((n_t.x>=n.x && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x>0))&& !recy)
        const cond_recy=(recy && n_t.x<=n.x)

        return (
          (cond_no_recy || cond_recy) &&
          (ori==='hh' || ori==='hv') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    } else if (pos=='top') {
      //Recherche tous les flux entrant en haut
      link_io = Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]

        return (
          (n_t.y<n.y) &&
          (ori === 'vv' ||ori === 'vh') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
      })
    } else if (pos=='bottom') {
      //Recherche tous les flux entrant en haut
      link_io=Object.values(n.outputLinksId).filter(k=>{
        if (!data.links[k] ) {
          return false
        }
        const ori=ReturnValueLink(data,data.links[k],'orientation') as string
        const n_t=data.nodes[data.links[k].idTarget]

        return (
          (n_t.y >= n.y) &&
          (ori === 'vv' ||ori === 'vh') &&
          LinkVisible(data.links[k], data, display_nodes)
        )
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
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  k_link:string,
  pos:string,
  io:string,
  GetLinkValue:GetLinkValueFuncType,
  link_function:LinkFunctionTypes,
  setForceUpdate:{ on: () => void; off: () => void; toggle: () => void; },
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,display_nodes,multi_selected_nodes,pos,io)
  if (io=='input') {
    if (pos=='left') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='right') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if(pos=='top') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='bottom') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }
  } else if (io=='output') {
    if (pos=='left') {
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='right') {
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='top') {
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if(pos=='bottom') {
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
  link_function.RedrawLinks(link_io.map(lid=>data.links[lid]))
  setForceUpdate.toggle()
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
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  k_link:string,
  pos:string,
  io:string,
  GetLinkValue:GetLinkValueFuncType,
  link_function:LinkFunctionTypes,
  setForceUpdate:{ on: () => void; off: () => void; toggle: () => void; },
)=>{
  const n=multi_selected_nodes.current[0]
  const link_io=getIOLink(data,display_nodes,multi_selected_nodes,pos,io)

  if (io=='input') {
    if (pos=='left') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='right') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='top') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if(pos=='bottom') {
      //Repositionne le flux avant le flux entrant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.inputLinksId.indexOf(k_link)
        n.inputLinksId.splice(posElemt, 1)
        n.inputLinksId.splice(posElementPrec,0,k_link)
      }
    }
  } else if(io=='output') {
    if (pos=='left') {
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if (pos=='right') {
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if(pos=='top') {
      //Repositionne le flux avant le flux sortant du même coté
      if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
        const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
        const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
        const posElemt = n.outputLinksId.indexOf(k_link)
        n.outputLinksId.splice(posElemt, 1)
        n.outputLinksId.splice(posElementPrec,0,k_link)
      }
    } else if(pos=='bottom') {
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

  link_function.RedrawLinks(link_io.map(lid=>data.links[lid]))
  setForceUpdate.toggle()
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
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  io:string,
  pos:string
)=>{
  const link_io = getIOLink(data, display_nodes, multi_selected_nodes, pos, io)
  return link_io.length!==0
}

/**
   * Computes the default selection between input and output and left/right or top/bottom
   * depending of the existing links.
   *
   * @param {SankeyData} data
   * @param {{ [node_id: string]: SankeyNode }} display_nodes
   * @param {{ [link_id: string]: SankeyLink }} display_links
   * @param {current:SankeyNode[]}: multi_selected_nodes
   * @returns {*}
   */
export const updateDefaultNodeIO=(
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  multi_selected_nodes:{current:SankeyNode[]},
)=>{
  let link_io = 'right'
  let link_pos = 'output'
  if (multi_selected_nodes.current.length===1) {
    const k_display_link=Object.values(display_links).map(l=>l.idLink)
    if (multi_selected_nodes.current[0].inputLinksId.filter(lid=>k_display_link.includes(lid)).length>multi_selected_nodes.current[0].outputLinksId.filter(lid=>k_display_link.includes(lid)).length){
      const obj_list_link={
        left:getIOLink(data,display_nodes,multi_selected_nodes,'left','input').length,
        right:getIOLink(data,display_nodes,multi_selected_nodes,'right','input').length,
        top:getIOLink(data,display_nodes,multi_selected_nodes,'top','input').length,
        bottom:getIOLink(data,display_nodes,multi_selected_nodes,'bottom','input').length,
      }
      const side_with_most_link=Object.entries(obj_list_link)
        .sort(([,a],[,b]) => b-a)[0][0]
      link_io = 'input'
      link_pos = side_with_most_link
    } else {
      const obj_list_link={
        left:getIOLink(data,display_nodes,multi_selected_nodes,'left','output').length,
        right:getIOLink(data,display_nodes,multi_selected_nodes,'right','output').length,
        top:getIOLink(data,display_nodes,multi_selected_nodes,'top','output').length,
        bottom:getIOLink(data,display_nodes,multi_selected_nodes,'bottom','output').length,
      }
      const side_with_most_link=Object.entries(obj_list_link)
        .sort(([,a],[,b]) => b-a)[0][0]

      link_io = 'output'
      link_pos = side_with_most_link
    }
  }
  return [link_pos,link_io]
}

/**
 * Define IO selection menu for nodes
 *
 * @param {*} {
 *   applicationContext,
 *   applicationData,
 *   applicationState,
 *   node_function,
 *   link_function,
 *   ComponentUpdater,
 *   menu_for_modal
 * }
 * @return {*}
 */
export const SankeyMenuConfigurationNodesIO : FunctionComponent<SankeyMenuConfigurationNodesIOFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  node_function,
  link_function,
  ComponentUpdater,
  menu_for_modal
}) => {
  const { t } = applicationContext
  const { data, display_nodes, display_links, new_data } = applicationData
  const { multi_selected_nodes, multi_selected_links } = applicationState
  const { updateComponentMenuNodeIOSelectSideNode } = ComponentUpdater
  const { GetLinkValue }=link_function
  const [ link_io, set_link_io ] = useState('output')
  const [ link_pos, set_link_pos ] = useState('right')
  const [ tab_colored, set_tab_colored ] = useState(false)
  const [ , setForceUpdate ] = useBoolean()

  let IOLink=[] as string[]
  if (multi_selected_nodes.current.length===1) {
    IOLink = getIOLink(data,display_nodes,multi_selected_nodes,applicationState.link_pos.current,applicationState.link_io.current)
  }

  let has_input_links = false
  let has_output_links = false
  if (multi_selected_nodes.current.length===1) {
    has_input_links = (
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'input', 'left') ||
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'input', 'right') ||
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'input', 'top') ||
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'input', 'bottom')
    )
    has_output_links = (
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'output', 'left') ||
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'output', 'right') ||
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'output', 'top') ||
      has_link_come_from(data, display_nodes, multi_selected_nodes, 'output', 'bottom')
    )
  }

  // TODO refaire
  // updateComponentMenuNodeIOSelectSideNode.current = ()=>{
  //   const [pos,io] = updateDefaultNodeIO(data,applicationData.display_nodes,display_links,multi_selected_nodes)
  //   applicationState.link_io.current = io
  //   applicationState.link_pos.current = pos
  //   setForceUpdate.toggle()
  // }

  const content_reorg=<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.Reorg_title')}
    </Box>

    <OSTooltip label={t('Noeud.tooltips.Reorg')}>
      <Button
        variant='menuconfigpanel_option_button'
        onClick={() => {
          Object
            .values(data.nodes)
            .filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
            .map(d => {
              reorganize_node_inputLinksId(data,d, data.nodes, data.links)
              reorganize_node_outputLinksId(data,d, data.nodes, data.links)
            })
          node_function.RedrawNodes(Object.values(applicationData.display_nodes))
          link_function.RedrawLinks(Object.values(applicationData.display_links))
          ComponentUpdater.updateComponenSaveInCache.current(false)
          setForceUpdate.toggle()
        }}
      >
        {t('Noeud.Reorg')}
      </Button>
    </OSTooltip>
  </Box>

  // Content to reorganize the i/o of only 1 node at the time
  const content_for_one_node=(multi_selected_nodes.current.length===1)?
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {/* Choisir un lien entrant / sortant */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <OSTooltip label={t('Noeud.PF.tooltips.io')}>
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.PF.FES')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            applicationState.link_io.current = evt.target.value
            if (has_link_come_from(data, display_nodes, multi_selected_nodes, evt.target.value, 'left')) {
              applicationState.link_pos.current = 'left'
            }
            else if (has_link_come_from(data, display_nodes, multi_selected_nodes, evt.target.value, 'right')) {
              applicationState.link_pos.current = 'right'
            }
            else if (has_link_come_from(data, display_nodes, multi_selected_nodes, evt.target.value, 'top')) {
              applicationState.link_pos.current = 'top'
            }
            else {
              applicationState.link_pos.current = 'bottom'
            }
            setForceUpdate.toggle()
          }}
        >
          {
            has_input_links?
              <option value='input'>{t('Noeud.PF.ent')}</option>:
              <></>
          }
          {
            has_output_links?
              <option value='output'>{t('Noeud.PF.sort')}</option>:
              <></>
          }
        </Select>
      </Box>

      {/* Choix des liens */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <OSTooltip label={t('Noeud.PF.tooltips.side')}>
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.PF.FRN')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          value={applicationState.link_pos.current}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            applicationState.link_pos.current = evt.target.value
            setForceUpdate.toggle()
          }}
        >
          {
            has_link_come_from(data, display_nodes, multi_selected_nodes, applicationState.link_io.current, 'left')?
              <option value='left'>{t('Noeud.PF.gauche')}</option>:
              <></>
          }
          {
            has_link_come_from(data, display_nodes, multi_selected_nodes, applicationState.link_io.current, 'right')?
              <option value='right'>{t('Noeud.PF.droite')}</option>:
              <></>
          }
          {
            has_link_come_from(data, display_nodes, multi_selected_nodes, applicationState.link_io.current, 'top')?
              <option value='top'>{t('Noeud.PF.ades')}</option>:
              <></>
          }
          {
            has_link_come_from(data, display_nodes, multi_selected_nodes, applicationState.link_io.current, 'bottom')?
              <option value='bottom'>{t('Noeud.PF.edes')}</option>:
              <></>
          }
        </Select>
      </Box>

      {/* Mettre les couleurs des flux dans le tableau pour les indentifier */}

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={tab_colored}
        onChange={(evt) => {
          set_tab_colored(evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.PF.tooltips.lti')}>
          {t('Noeud.PF.lti')}
        </OSTooltip>
      </Checkbox>

      {/* Table montrant les noeuds selectionnés  */}
      {
        <>
          <Table
            variant='striped'
            // bordered
            // hover
            // className='node_group_tags_definition'
          >
            <Thead>
              <Tr>
                <Th>{t('Menu.flux')}</Th>
                <Th>{t('Tags.Position')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                IOLink.map((k, i) => {
                  const color=LinkColor(data.links[k],data,GetLinkValue) as string
                  const bc={'backgroundColor': (color && tab_colored)?color:'inherit'}
                  const n_s=data.nodes[data.links[k].idSource]
                  const n_t=data.nodes[data.links[k].idTarget]

                  return (
                    <Tr key={i.toString()}>
                      <td style={bc}>{n_s.name+'===>'+n_t.name}</td>
                      <td style={{ 'width': '10%' }}>
                        <Box layerStyle="options_2cols">
                          <Button
                            variant='menuconfigpanel_option_button'
                            minWidth='0'
                            onClick={() =>
                              handleUpLinkIOPos(
                                data,
                                display_nodes,
                                multi_selected_nodes,
                                k,
                                applicationState.link_pos.current,
                                applicationState.link_io.current,
                                GetLinkValue,
                                link_function,
                                setForceUpdate
                              )
                            }
                          >
                            <FaArrowAltCircleUp />
                          </Button>
                          <Button
                            variant='menuconfigpanel_option_button'
                            minWidth='0'
                            onClick={() =>
                              handleDownLinkIOPos(
                                data,
                                display_nodes,
                                multi_selected_nodes,
                                k,
                                applicationState.link_pos.current,
                                applicationState.link_io.current,
                                GetLinkValue,
                                link_function,
                                setForceUpdate
                              )
                            }
                          >
                            <FaArrowAltCircleDown />
                          </Button>
                        </Box>
                      </td>
                    </Tr>
                  )
                })
              }
            </Tbody>
          </Table>
        </>
      }
    </Box>:
    <></>

  const content_always_present=<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.Slct')}
    </Box>

    {/* Boutons de rérrangement / selection des flux  */}
    <Box
      as='span'
      layerStyle='options_2cols'
    >
      <OSTooltip label={t('Noeud.tooltips.SlctOutLink')}>
        <Button
          variant='menuconfigpanel_option_button_left'
          onClick={() => {
            Object
              .values(data.nodes)
              .filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
              .map(d => {
                multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.outputLinksId.includes(l.idLink)))
                const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
                applicationState.ref_display_link_opacity.current.forEach(setter=>setter(opacity))
              })
            multi_selected_links
              .current
              .forEach(l=>SelectVisualyLinks(l))
          }}
        >
          {t('Noeud.SlctOutLink')}
        </Button>
      </OSTooltip>

      <OSTooltip label={t('Noeud.tooltips.SlctInLink')}>
        <Button
          variant='menuconfigpanel_option_button_right'
          onClick={() => {
            Object
              .values(data.nodes)
              .filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
              .map(d => {
                multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
                const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
                applicationState.ref_display_link_opacity.current.forEach(setter=>setter(opacity))
              })
            multi_selected_links
              .current
              .forEach(l=>SelectVisualyLinks(l))
          }}
        >
          {t('Noeud.SlctInLink')}
        </Button>
      </OSTooltip>
    </Box>
  </Box>

  const content=<Box
    layerStyle='menuconfigpanel_grid'
  >
    {content_reorg}
    {content_for_one_node}
    {content_always_present}
  </Box>

  return menu_for_modal ?
    content :
    <TabPanel>
      {content}
    </TabPanel>

}


