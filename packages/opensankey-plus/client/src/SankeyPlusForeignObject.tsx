import React, { useState } from 'react'
import { Form, Tab, OverlayTrigger, Tooltip, Badge, Col, Row } from 'react-bootstrap'
import { TFunction } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {  faLock } from '@fortawesome/free-solid-svg-icons'
import { Quill } from 'react-quill'
import { Checkbox } from '@chakra-ui/react'
import * as d3 from 'd3'
import ReactQuill from 'react-quill'

import { SankeyPlusData, SankeyPlusNode } from '../types/Types'

import { SmoothClasses} from 'open-sankey/dist/configmenus/SankeyUtils'
import { OSPIsAllNodeNotLocalAttrSameValue } from './SankeyPlusUtils'
import { NodeDisplayed } from './import/OpenSankey'
import {PlusDrawNodesFOFType, SankeyPlusNodeFOFType} from '../types/SankeyPlusForeignObjectTypes'
import { NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'


declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodeFO : SankeyPlusNodeFOFType = (
  t:TFunction,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  d_setter_input_value,
  node_function

)=> {
  const [s_editor_content_fo_node,sEditorContentFoNode]= useState('')

  d_setter_input_value.r_setter_editor_content_fo_node.current=sEditorContentFoNode
  // Create a custom size list of font-size
  const list_size=[]
  for(let i=6;i<=50;i++){
    list_size.push(i+'px')
  }
  
  const Size = Quill.import('attributors/style/size')
  Size.whitelist = list_size
  Quill.register(Size, true)

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      ['bold', 'italic', 'underline','strike'],
      [{ 'size': list_size }],
      [{ 'color': [] }, { 'background': [] }],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'align':[]}],

      ['clean'],
    ],
  }

  const formats = ['font','size',
    'bold', 'italic', 'underline', 'strike','color','background',
    'list', 'bullet','align'
  ]
  const isQuill_invalid=multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].FO_content!==s_editor_content_fo_node:false
  const value_of_key=OSPIsAllNodeNotLocalAttrSameValue(data,multi_selected_nodes.current,['has_FO','is_FO_raw'])

  
  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo=<Form className='FO_zdt_editeur'>
    <Form.Group><ReactQuill
      value={s_editor_content_fo_node}
      onChange={(evt,_,s) => {
        if(s==='user'){
          sEditorContentFoNode(evt)
        }
      }}
      onBlur={()=>{
        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
          d.FO_content = s_editor_content_fo_node
        })
        node_function.RedrawNodes(multi_selected_nodes.current)
      }}
      theme="snow"
      modules={modules}
      formats={formats}
      readOnly={!is_activated?true:!value_of_key['has_FO'][0]}
      style={{
        color:(!is_activated || !value_of_key['has_FO'][0] )?'#666666':'',
        backgroundColor:(!is_activated || !value_of_key['has_FO'][0])?'#cccccc':''}}
    /></Form.Group>
    <Form.Control type='text' isInvalid={isQuill_invalid} style={{display:'none'}}/>
    <Form.Control.Feedback type='invalid'>{t('MEP.onBlurNoEnter')}</Form.Control.Feedback>

  </Form>

  const editor_fo_raw=<Form.Control
    as="textarea"
    rows={5}
    style={{
      color:(!is_activated || !value_of_key['has_FO'][0])?'#666666':'',
      backgroundColor:(!is_activated || !value_of_key['has_FO'][0])?'#cccccc':''}}
    disabled={!is_activated?true:!value_of_key['has_FO'][0]}
    value={multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].FO_content:''}
    onChange={(evt) => {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
        d.FO_content = evt.target.value
      })
      node_function.RedrawNodes(multi_selected_nodes.current)
    }}
  />

  return <Tab key="node_fo" eventKey="node_fo" className='content_editon_elements' title={
    <>
      {t('Noeud.FO.FO')}
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
        <Badge pill bg="info" style={{marginLeft:'5px'}}>Beta</Badge>}
    </>}
  >
    <OverlayTrigger
      key={'foDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'foDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <Row>
        <Col>
          <Checkbox 
            sx={SmoothClasses({})}
            iconColor={value_of_key['has_FO'][1]?'#78C2AD':'white'}
            isDisabled={!is_activated}
            isIndeterminate={value_of_key['has_FO'][1]}
            isChecked={value_of_key['has_FO'][0] as boolean}
            onChange={(evt) => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
                .forEach(d => {
                  d.has_FO = evt.target.checked
                })
              node_function.RedrawNodes(multi_selected_nodes.current)
            }}>
            {t('Noeud.foreign_object.Visibilité')}
          </Checkbox>
        </Col>
      </Row>
    </OverlayTrigger>

    <OverlayTrigger
      key={'foRawDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'foRawDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <Row>
        <Col>
          <Checkbox 
            sx={SmoothClasses({})}
            iconColor={value_of_key['is_FO_raw'][1]?'#78C2AD':'white'}
            isDisabled={!is_activated}
            isIndeterminate={value_of_key['is_FO_raw'][1]}
            isChecked={value_of_key['is_FO_raw'][0] as boolean}
            onChange={(evt) => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
                .forEach(d => {
                  d.is_FO_raw = evt.target.checked
                })
              node_function.RedrawNodes(multi_selected_nodes.current)
            }}>
            {t('Noeud.foreign_object.raw')}
          </Checkbox>
        </Col>
      </Row>
    </OverlayTrigger>

    {(multi_selected_nodes.current.length>0)?
      <OverlayTrigger
        key={'foContentDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?
          (<Tooltip id={'foContentDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
          (!value_of_key['has_FO'][0])?<Tooltip id={'foNotVisible'}>{t('Noeud.foreign_object.not_activated')}</Tooltip>:<></>}
      >
        <Form className='FO_node_editeur'>
          <Form.Group>{multi_selected_nodes.current[0].is_FO_raw?editor_fo_raw:editor_fo}</Form.Group>
        </Form>
      </OverlayTrigger>
      :<></>}
  </Tab>
}


export const PlusDrawNodesFO : PlusDrawNodesFOFType = (
  data : SankeyPlusData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  dict_variable_elements_selected,
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType,
  trad
) => {
  const {ref_getter_mode_selection} =dict_variable_elements_selected
  const node_mouse_over=(data:SankeyPlusData,t:d3.BaseType,event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
    d3.select(t).attr('cursor', (ref_getter_mode_selection.current === 's')? 'pointer' : 'unset')
    if (NodeDisplayed(data,(d as SankeyPlusNode)) && (window.SankeyToolsStatic || event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')

      sankeyTooltip
        .style('opacity', 1)
        .html(NodeTooltipsContent(data,display_nodes, d as SankeyPlusNode,GetLinkValue,trad))
    }
  }

  const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
    if ((NodeDisplayed(data,(d as SankeyPlusNode))) && (window.SankeyToolsStatic || event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')

      const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))
      let pos_tooltip_y= event.clientY
      const size_browser=window.innerHeight
      pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY

      const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))
      let pos_tooltip_x= event.clientX
      const size_browser_w=window.innerWidth
      pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30

      sankeyTooltip
        .style('top',pos_tooltip_y + 'px')
        .style('left',pos_tooltip_x + 'px')
    }
  }

  const add_nodes_fo = (
  ) => {
    //----------------ICON-----------------

    // Add icon to node (if there is one associated to it)
    // then apply selected parameter
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

    const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyPlusNode, d3.BaseType, unknown>)

    ggg_nodes.filter((d)=>{
      return d.has_FO
    }) .append('foreignObject')
      .attr('width',(n)=>+d3.select(' .opensankey #shape_' + n.idNode).attr('width'))
      .attr('height',(n)=>+d3.select(' .opensankey #shape_' + n.idNode).attr('height'))
      .attr('id',(d)=> d.idNode + '_fo')
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,event,d)
      })
      .on('mousemove', function (event,d) {
        node_mouse_move(event,d)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .append('xhtml:div')
      .attr('class','ql-editor')
      .html((d)=>d.FO_content)
  }
  add_nodes_fo()

}

