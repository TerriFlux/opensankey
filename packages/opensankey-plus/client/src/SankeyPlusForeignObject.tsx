import React from 'react'
import { Form, Tab, OverlayTrigger, Tooltip, Badge, InputGroup, Button } from 'react-bootstrap'
import { TFunction } from 'i18next'

import * as d3 from 'd3'
import { SankeyPlusData, SankeyPlusNode } from './types'

import ReactQuill from 'react-quill'

import { node_displayed} from 'open-sankey/dist/SankeyUtils'

import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faLock } from '@fortawesome/free-solid-svg-icons'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodeFO = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  editor_content_fo_node:string,
  set_editor_content_fo_node:(s:string)=>void,

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
      ['bold', 'italic', 'underline','strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
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

  const is_all_fo_visible = isAllFOVisible()
  const is_all_fo_raw = isAllFORaw()

  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo=<ReactQuill
    value={editor_content_fo_node}
    onChange={(evt,_,s) => {
      if(s==='user'){
        // Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
        //   d.FO_content = evt
        //   const node_width = return_value_node(data,d,'node_width') as number
        //   d.FO_content = d.FO_content.replace('<img src=','<img width="'+node_width+'" src=')
        // })
        set_editor_content_fo_node(evt)
      }
    }}
    theme="snow"
    modules={modules}
    formats={formats}
    readOnly={!is_activated?true:!is_all_fo_visible}
    style={{
      color:(!is_activated || !is_all_fo_visible )?'#666666':'',
      backgroundColor:(!is_activated || !is_all_fo_visible)?'#cccccc':''}}
  />
  const editor_fo_raw=<Form.Control
    as="textarea"
    rows={5}
    style={{
      color:(!is_activated || !is_all_fo_visible)?'#666666':'',
      backgroundColor:(!is_activated || !is_all_fo_visible)?'#cccccc':''}}
    disabled={!is_activated?true:!is_all_fo_visible}
    value={multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].FO_content:''}
    onChange={(evt) => {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
        d.FO_content = evt.target.value
      })
      set_data({ ...data })
    }}
  />

  return <Tab key="node_fo" eventKey="node_fo" title={
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
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'75%'}}
        >
          {t('Noeud.foreign_object.Visibilité')}
        </InputGroup.Text>

        <Button
          style={{width:'25%'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={is_all_fo_visible?'primary':'outline-primary'}
          onClick={
            () => {
              Object.values(data.nodes).filter(
                f => multi_selected_nodes.current.map(
                  d => d.idNode).includes(
                  f.idNode)).map(
                d => d.has_FO = !is_all_fo_visible)
              set_data({ ...data })
            }
          }
        >
          {is_all_fo_visible?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>
    </OverlayTrigger>

    <OverlayTrigger
      key={'foRawDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'foRawDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'75%'}}
        >
          {t('Noeud.foreign_object.raw')}
        </InputGroup.Text>

        <Button
          style={{width:'25%'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={is_all_fo_raw?'primary':'outline-primary'}
          onClick={
            () => {
              Object.values(data.nodes).filter(
                f => multi_selected_nodes.current.map(
                  d => d.idNode).includes(f.idNode)).map(
                d => d.is_FO_raw = !is_all_fo_raw)
              set_data({ ...data })
            }
          }
        >
          {is_all_fo_raw?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}
        </Button>
      </InputGroup>
    </OverlayTrigger>

    {(multi_selected_nodes.current.length>0)?
      <OverlayTrigger
        key={'foContentDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?
          (<Tooltip id={'foContentDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):
          (!is_all_fo_visible)?<Tooltip id={'foNotVisible'}>{t('Noeud.foreign_object.not_activated')}</Tooltip>:<></>}
      >
        <Form className='FO_node_editeur'>
          <Form.Group>{multi_selected_nodes.current[0].is_FO_raw?editor_fo_raw:editor_fo}</Form.Group>
          <Button
            onClick={()=>{

              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                d.FO_content = editor_content_fo_node
              })
              set_data({...data})
            }}
          >{t('Menu.updateFOZdd')}</Button>
        </Form>
      </OverlayTrigger>
      :<></>}
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
      .attr('width',(n)=>+d3.select(' .opensankey #shape_' + n.idNode).attr('width'))
      .attr('height',(n)=>+d3.select(' .opensankey #shape_' + n.idNode).attr('height'))
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
      .attr('class','ql-editor')
      .html((d)=>d.FO_content)
  }
  add_nodes_fo()

}

