import React from 'react'
import { Col, Form, FormCheck, FormLabel, Row,Tab,OverlayTrigger,Tooltip,Badge } from 'react-bootstrap'
import { TFunction } from 'i18next'

import * as d3 from 'd3'
import {SankeyPlusData,SankeyPlusNode} from './types'

import ReactQuill,{Quill} from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import ImageResize from 'quill-image-resize-module-react'
import {node_displayed} from 'open-sankey/dist/SankeyUtils'

Quill.register('modules/imageResize', ImageResize)
declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodeFO = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean
)=> {
  // const [value, setValue] = useState('')

  const isAllFOVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.has_FO) ? true : visible)
    return visible
  }

  const isAllFORaw = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.is_FO_raw) ? true : visible)
    return visible
  }

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'header': [1, 2, 3, 4, 5, false] }],
      ['bold', 'italic', 'underline','strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'align':[]}],

      ['image'],
      ['clean'],
    ],
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize']
    }
  }

  const formats = ['font',
    'header','size',
    'bold', 'italic', 'underline', 'strike','color','background',
    'list', 'bullet','image','align'
  ]
  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo=<ReactQuill
    value={multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].FO_content:''}
    // onChange={(evt) => {
    //   Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
    //     d.FO_content =evt
    //   })
    // }}
    onBlur={()=>{set_data({ ...data })}}
    theme="snow"
    modules={modules}
    formats={formats}
    readOnly={!is_activated?true:!isAllFOVisible()}
  />
  const editor_fo_raw=<Form.Control
    as="textarea"
    rows={5}
    disabled={!is_activated?true:!isAllFOVisible()}
    value={multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].FO_content:''}
    onChange={(evt) => {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
        d.FO_content = evt.target.value
      })
      set_data({ ...data })
    }}
  />


  return <Tab eventKey="node_fo" title={<>{t('Noeud.FO.FO')} <Badge pill bg="info" style={{marginLeft:'auto'}}>Beta</Badge></>} >
    <OverlayTrigger
      key={'foDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'foDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <Form>
        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:(is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Visibilité')}</FormLabel>
          </Col>
          <Col xs={8}>
            <FormCheck inline
              type='switch'
              checked={isAllFOVisible()}
              disabled={!is_activated}
              onChange={evt => {

                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.has_FO = evt.target.checked)
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:(is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.raw')}</FormLabel>
          </Col>
          <Col xs={8}>
            <FormCheck inline
              type='switch'
              checked={isAllFORaw()}
              disabled={!is_activated}
              onChange={evt => {
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.is_FO_raw = evt.target.checked)
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>
        {multi_selected_nodes.current.length>0?<Form.Group as={Row}>
          {multi_selected_nodes.current[0].is_FO_raw?editor_fo_raw:editor_fo}
        </Form.Group>:<></>}



      </Form></OverlayTrigger>
  </Tab>
}






export const SankeyPlusDrawNodesFO = (
  data:SankeyPlusData,
  mode_selection:string,
  nodeTooltipsContent: (data: SankeyPlusData, d: SankeyPlusNode) => string,

) => {


  const node_mouse_over=(data:SankeyPlusData,t:d3.BaseType,mode_selection:string,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    d3.select(t).attr('cursor', (mode_selection === 's')? 'pointer' : 'unset')
    if (node_displayed(data,(d as SankeyPlusNode)) && (window.SankeyToolsStatic || event.shiftKey)) {
      sankeyTooltip
        .style('opacity', 1)
        .html(nodeTooltipsContent(data, d as SankeyPlusNode))
    }
  }

  const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    if ((node_displayed(data,(d as SankeyPlusNode))) && (window.SankeyToolsStatic || event.shiftKey)) {
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
      .attr('width',(n)=>+d3.select(' .opensankey #' + n.idNode).attr('width'))
      .attr('height',(n)=>+d3.select(' .opensankey #' + n.idNode).attr('height'))
      .attr('id',(d)=> d.idNode + '_fo')
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,event,d,sankeyTooltip)
      })
      .on('mousemove', function (event,d) {
        node_mouse_move(event,d,sankeyTooltip)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .append('xhtml:div')
      .html((d)=>d.FO_content)

  }
  add_nodes_fo()

}

