import React, { FunctionComponent, useState } from 'react'
import { Row, Tabs, Button, ButtonGroup, Col, Dropdown, Form, FormControl, FormCheck, FormGroup, FormLabel, OverlayTrigger, Tooltip} from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyData, SankeyDataPropTypes, SankeyLinkPropTypes, SankeyNode, SankeyNodePropTypes,SankeyLinkValue } from './types'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import { cut_name,default_node,delete_node } from './SankeyUtils'
import * as d3 from 'd3'
import { FaPlus, FaMinus} from 'react-icons/fa'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenu'
import { SankeyMenuConfigurationNodesIO } from './SankeyMenuConfigurationNodesIO'
import {SankeyMenuConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {SankeyMenuConfigurationNodesLabel} from './SankeyMenuConfigurationNodesLabel'
import {SankeyMenuConfigurationNodesTags} from './SankeyMenuConfigurationNodesTags'
import {SankeyMenuConfigurationNodesTooltip} from './SankeyMenuConfigurationNodesTooltip'
import { textwrap } from 'd3-textwrap'
import { TFunction } from 'i18next'

const SankeyNodeEditionPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,
  menu_configuration_nodes: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  style_editable:PropTypes.bool.isRequired,
  token:PropTypes.bool.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

export const OpenSankeyMenuConfigurationNodes = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_configuration_nodes_attributes:JSX.Element[],
  link_io:string,set_link_io:React.Dispatch<React.SetStateAction<string>>,
  link_pos:string,set_link_pos:React.Dispatch<React.SetStateAction<string>>,
  tab_colored:boolean,set_tab_colored:React.Dispatch<React.SetStateAction<boolean>>,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data.nodeTags).length > 0 ? Object.keys(data.nodeTags)[0] : '')

  const ui : {[s:string] : JSX.Element}= {
    'Attributes'      : SankeyMenuConfigurationNodesAttributes(t,menu_configuration_nodes_attributes),
    'Labels'          : SankeyMenuConfigurationNodesLabel(t,data,set_data,multi_selected_nodes),
    'Tooltip'         : SankeyMenuConfigurationNodesTooltip(t,data,set_data,multi_selected_nodes),
  }

  if (Object.keys(data.nodeTags).length > 0 && data.accordeonToShow.includes('EN') ) {
    ui['Tags'] = SankeyMenuConfigurationNodesTags(t,data,set_data,multi_selected_nodes,tags_group_key,set_tags_group_key)
  }
  if (multi_selected_nodes.current.length == 1) {
    ui['Entrées Sorties'] = SankeyMenuConfigurationNodesIO(t,data,set_data,multi_selected_nodes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,getLinkValue)
  }
  return ui
}

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = (
  {t,data, set_data,selected_node, multi_selected_nodes,multi_selected_links,style_to_apply,set_style_to_apply, menu_configuration_nodes,style_editable,token }
) => {
  const [forceUpdate, setForceUpdate] = useState(false)

  const tmpNodes = Object.fromEntries(Object.entries(data.nodes).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS = Object.values(tmpNodes).filter(d=>(data.displayed_node_selector)?d.display:true).map((d) => { return { 'label': d.name, 'value': d.idNode } })

  const selected : selected_type[] = multi_selected_nodes.current.map((d) => { return { 'label': d.name, 'value': d.idNode } })

  //Renvoie le menu déroulant pour la sélection des noeuds
  const dropdownMultiNode = () => {
    const DD = (
      <div id='DD_multi_node'>
        <MultiSelect
          valueRenderer={(selected: selected_type[]) => {
            return selected.length ? selected.map(({ label })=> label + ', ') : t('Noeud.NS')
          }}
          options={INITIAL_OPTIONS}
          value={selected}
          overrideStrings={{
            'selectAll': t('Noeud.TS'),
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.idNode)))
            multi_selected_nodes.current = m_s
            Object.values(data.nodes).forEach( n =>
              d3.select(' .opensankey #' + n.idNode).attr('stroke-width',0)
            )
            multi_selected_nodes.current.forEach( n =>
              d3.select(' .opensankey #' + n.idNode).attr('stroke-width',2)
            )
            setForceUpdate(!forceUpdate)
            set_data({...data})
          }}
          labelledBy={'hello'}/>
      </div>)
    return DD
  }

  const add_new_node = () => {
    const { nodes } = data
    const node: SankeyNode = default_node(data)

    // Méthode pour incrementer idNode
    const listId: number[] = []
    Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
    const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
    node.idNode = 'node' + idNode
    node.name = node.idNode
    if (Object.keys(nodes).length < 5) {
      node.x = Object.keys(nodes).length * 200 + 200
    } else {
      node.x = 200
    }
    nodes[node.idNode] = node
    for (const tag_group_key in data.nodeTags) {
      node.tags[tag_group_key] = []
    }
    //WARNING : le set_multi_select ne semble pas changer les noeuds sélectionnés avant d'appliquer le style
    //set_multi_selected_nodes([node])
    multi_selected_nodes.current = [node]
    style_to_apply = 'default'
    apply_style_to_nodes()
    set_data({...data})
  }

  const apply_style_to_nodes = () => {
    const style = data.style_node[style_to_apply]
    multi_selected_nodes.current.map(d => {
      //Style Noeud
      d.shape_visible = style.shape_visible
      d.color = style.color
      d.shape = style.shape
      d.node_width = style.node_width
      d.node_height = style.node_height

      //Syle label
      d.label_visible = style.label_visible
      d.show_value = style.show_value
      d.display_style.font_size = style.display_style.font_size
      d.display_style.bold = style.display_style.bold
      d.display_style.uppercase = style.display_style.uppercase
      d.display_style.italic = style.display_style.italic
      d.display_style.label_box_width = style.display_style.label_box_width
      d.display_style.label_vert = style.display_style.label_vert
      d.display_style.label_horiz = style.display_style.label_horiz
      d.display_style.font_family = style.display_style.font_family
    })
    set_data({ ...data })
  }

  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_node[style_to_display].name, 20) : 'Multiple style parmi les noeuds sélectionnés'

      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  return (<>
  {
    (token==false && Object.keys(data.nodes).length>15)?<>
    <Row>
      <FormLabel style={{'color':'red'}}>{t('Menu.warningLimitNode')}</FormLabel>
    </Row>
    </>:<></>
  }
    <Row >
      {/* Boutton pour ajouter un noeud */}
      <Col xs={1}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.noeud.plus')} </Tooltip>}>
            <Button
              size="sm"
              disabled={token==false && Object.keys(data.nodes).length>15}
              onClick={() => {
                set_style_to_apply('default')
                add_new_node()
                style_to_apply = 'default'
                apply_style_to_nodes()
            }}>
              <FaPlus/>
            </Button>
        </OverlayTrigger>
      </Col>

      {/* Liste déroulante pour selectionner un noeud */}
      <Col xs={10}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.noeud.slct')} </Tooltip>}>
            {dropdownMultiNode()}
        </OverlayTrigger>
      </Col>

      {/* Boutton pour supprimer le noeud selectionné */}
      <Col xs={1}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.noeud.rm')} </Tooltip>}>
            <Button
              size="sm"
              variant='danger'
              disabled={multi_selected_nodes.current.length == 0}
              onClick={
                () => {
                  multi_selected_nodes.current.map(d => delete_node(data, d))
                  selected_node.current = default_node(data)
                  multi_selected_nodes.current = []
                  // Object.values(data.nodes).forEach( n =>
                  //   d3.select(' .opensankey #' + n.idNode).attr('stroke-width',0)
                  // )
                  // setForceUpdate(!forceUpdate)
                  set_data({ ...data })
            }}>
              <FaMinus />
            </Button>
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Checkbox permettant d'afficher que les noeuds visibles dans le selecteur */}
    <FormGroup as={Row}>
      <Col xs={10}>
        <FormLabel >{t('Menu.dns')}</FormLabel>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.noeud.dns')} </Tooltip>}>
            <FormCheck inline type='switch' checked={data.displayed_node_selector} onChange={evt=>{
              // const c=evt.target.checkeds
              data.displayed_node_selector=evt.target.checked
              set_data({...data})
            }}/>
        </OverlayTrigger>
      </Col>
    </FormGroup>

    {/* Styles par défaut */}
    <Row >
      <Col xs={1}>
        <FormLabel>Style:</FormLabel>
      </Col>

      <Col xs={6}>
        {(style_editable)?(
          <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">{style_of_selected_nodes()}</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => {
                set_style_to_apply('')
                multi_selected_nodes.current.map(n => {
                  n.style = ''
                })
                set_data({ ...data })
              }}>{'Aucun'}</Dropdown.Item>
              {Object.keys(data.style_node).map((d,i) => {
                return (<Dropdown.Item
                  key={i}
                  onClick={() => {
                    set_style_to_apply(d)
                    multi_selected_nodes.current.map(n => {
                      n.style = d
                    })
                    set_data({ ...data })
                  }}
                >{data.style_node[d].name}</Dropdown.Item>)
              })}
            </Dropdown.Menu>
          </Dropdown>
        ):(<Form.Label>{style_of_selected_nodes()}</Form.Label>)}
      </Col>

      <Col xs={5}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.tooltips.AS')} </Tooltip>}>
            <Button
              size="sm"
              variant='info'
              onClick={() => {apply_style_to_nodes()}}>
                {t('Noeud.AS')}
            </Button>
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Affichage du nom des noeuds selectionnés */}
    <Form.Group as={Row} >
      <Col xs={1} >
        <FormLabel >Nom</FormLabel>
      </Col>

      <Col xs={10} >
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.tooltips.Nom')} </Tooltip>}>
           <FormControl
              value={
                (multi_selected_nodes.current.length != 1) ? '' : multi_selected_nodes.current[0].name
              }
              onChange={evt => {
                if (multi_selected_nodes.current.length != 1) {
                  return
                }
                multi_selected_nodes.current[0].name = evt.target.value
                const d = multi_selected_nodes.current[0]
                d3.select(' .opensankey #' + d.idNode + '_text').text(evt.target.value)
                const wrap = textwrap()
                  .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
                  .method('tspans')
                d3.select(' .opensankey #ggg_' + d.idNode + ' text')
                  .call(wrap)
                if (!d.x_label || data.show_structure === 'structure') {
                  d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                    const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
                    if (d.display_style.label_horiz == 'middle') {
                      return width / 2
                    } else if (d.display_style.label_horiz == 'right') {
                      return d.display_style.label_vert == 'middle' ? width : 0
                    } else {
                      return 0
                    }
                  })
                }
                d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                  const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
                  if (d.x_label) {
                    return d.x_label
                  } else if (d.display_style.label_horiz == 'middle') {
                    return width / 2
                  } else if (d.display_style.label_horiz == 'right') {
                    return width
                  } else {
                    return 0
                  }
                })
                setForceUpdate(!forceUpdate)
              }}
              disabled={(multi_selected_nodes.current.length == 1) ? false : true} />
        </OverlayTrigger>
      </Col>

      <Col xs={3}>
      </Col>
    </Form.Group>

    {/* Declenché si des neouds sont selectionnées */}
    {(multi_selected_nodes.current.length !== 0) ? (
      <Row>
        <Col sm={12}>
          <Tabs defaultActiveKey="nodes_desc" id="node_attributes">
            {menu_configuration_nodes.map((c:JSX.Element)=>{
              return c})}
          </Tabs>

          {/* Boutons de rérrangement / selection des flux  */}
          <ButtonGroup as={Row}>
            <Col>
              <OverlayTrigger
                key={'tooltip-adjust'}
                placement={'top'}
                delay={500}
                overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.tooltips.Reorg')} </Tooltip>}>
                  <Button
                    size="sm"
                    style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                    onClick={
                      () => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                          reorganize_node_inputLinksId(d, data.nodes, data.links)
                          reorganize_node_outputLinksId(d, data.nodes, data.links)
                        })
                        set_data({ ...data })
                  }}>
                    {t('Noeud.Reorg')}
                  </Button>
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger
                key={'tooltip-adjust'}
                placement={'top'}
                delay={500}
                overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.tooltips.SlctOutLink')} </Tooltip>}>
                  <Button
                    size="sm"
                    style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                    onClick={
                      () => {
                        multi_selected_links.current = []
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                          multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.outputLinksId.includes(l.idLink)))
                        })
                        multi_selected_links.current.forEach(l=>d3.selectAll(' .opensankey #gg_' + l.idLink + ' rect').attr('fill-opacity', '1'))
                  }}>
                    {t('Noeud.SlctOutLink')}
                  </Button>
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger
                key={'tooltip-adjust'}
                placement={'top'}
                delay={500}
                overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.tooltips.SlctInLink')} </Tooltip>}>
                  <Button
                    size="sm"
                    style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                    onClick={
                      () => {
                        multi_selected_links.current = []
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                          multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
                        })
                        multi_selected_links.current.forEach(l=>d3.selectAll(' .opensankey #gg_' + l.idLink + ' rect').attr('fill-opacity', '1'))
                  }}>
                    {t('Noeud.SlctInLink')}
                  </Button>
              </OverlayTrigger>
            </Col>
          </ButtonGroup>
        </Col>
      </Row >) : (<></>)}</>
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition