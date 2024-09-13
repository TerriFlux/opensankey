// // External imports
// import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
// import * as d3 from 'd3'

import { Box, Textarea, TabPanel, Checkbox, Button } from '@chakra-ui/react'
import React, { FunctionComponent, useState, useRef, MutableRefObject } from 'react'
import ReactQuill from 'react-quill'
// 'react-quill' seem to not be updated anymore, for new it doesn't create problem but it make a warning error in console
// to solve it when time will come we can use 'react-quill-new' wich solve this issu (https://github.com/zenoamaro/react-quill/issues/988#issuecomment-2241533429)
import { OSTooltip } from './deps/OpenSankey/types/Utils'
import { OSPNodeFOFType } from '../types/SankeyPlusForeignObjectTypes'
import { Type_GenericNodeElementOSP } from './types/TypesOSP'

// import { Box, Button, Checkbox, TabPanel, Textarea } from '@chakra-ui/react'

// // Local imports
// import { OSPIsAllNodeNotLocalAttrSameValue } from './SankeyPlusUtils'
// import { OSPData, OSPNode } from '../types/Types'
// import { OSPDrawNodesFOFType, OSPNodeFOFType } from '../types/SankeyPlusForeignObjectTypes'
// import { NodeDisplayed } from './import/OpenSankey'

// // OpenSankey types
// import { NodeTooltipsContentFType } from './deps/OpenSankey/draw/types/SankeyTooltipTypes'
// import { GetLinkValueFuncType } from './deps/OpenSankey/configmenus/types/SankeyUtilsTypes'
// import { OSTooltip } from './deps/OpenSankey/configmenus/SankeyUtils'


// declare const window: Window &
// typeof globalThis & {
//   SankeyToolsStatic: boolean
// }

export const OSPNodeFO: FunctionComponent<OSPNodeFOFType> = ({
  applicationData,
  is_activated,
}) => {
  const [s_editor_content_fo_node, sEditorContentFoNode] = useState('')
  const [, setCount] = useState(0)
  const { new_data } = applicationData
  const { drawing_area, t } = new_data
  const selected_nodes = drawing_area.selected_nodes_list

  let s_tmp_editor_content_fo_node = s_editor_content_fo_node
  new_data.menu_configuration.r_setter_editor_content_fo_node.current = sEditorContentFoNode

  let s_tmp_editor_content_changed = false
  if (selected_nodes.length > 0) {
    if (selected_nodes[0].FO_content !== s_editor_content_fo_node) {
      s_tmp_editor_content_changed = true
    }
  }

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'size': [] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],

      ['clean'],
    ],
  }

  const formats = ['font', 'size',
    'bold', 'italic', 'underline', 'strike', 'color', 'background',
    'list', 'bullet', 'align'
  ]


  /**
   *
   * function that go throught all Type_NodeElement of an array & check if they're all equals
   * (to the first )
   *
   * @param {Type_NodeElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Type_GenericNodeElementOSP,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)
  //   const value_of_key = OSPIsAllNodeNotLocalAttrSameValue(data,selected_nodes,['has_FO','is_FO_raw'])

  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo = <Box style={{ 'height': '300px' }}>
    <ReactQuill
      className='quill_editor'
      value={s_editor_content_fo_node}
      onChange={(evt, _, s) => {
        if (s === 'user') {
          s_tmp_editor_content_fo_node = evt
          if (!s_tmp_editor_content_changed) {
            sEditorContentFoNode(s_tmp_editor_content_fo_node)
          }
        }
      }}
      onBlur={() => {
        sEditorContentFoNode(s_tmp_editor_content_fo_node)
      }}
      theme="snow"
      modules={modules}
      formats={formats}
      readOnly={!is_activated}
      style={{
        color: (!is_activated || !selected_nodes[0].has_FO) ? '#666666' : '',
        backgroundColor: (!is_activated || !selected_nodes[0].has_FO) ? '#cccccc' : '',
        overflowY: 'scroll'
      }}
    />
  </Box>

  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  const editor_fo_raw = <Textarea
    rows={5}
    color={(!is_activated || !selected_nodes[0].has_FO) ? '#666666' : ''}
    backgroundColor={(!is_activated || !selected_nodes[0].has_FO) ? '#cccccc' : ''}
    disabled={!is_activated}
    ref={inputRef}
    defaultValue={s_editor_content_fo_node}
    onChange={(evt) => {
      s_tmp_editor_content_fo_node = evt.target.value
      if (!s_tmp_editor_content_changed) {
        sEditorContentFoNode(s_tmp_editor_content_fo_node)
      }
    }}
    onBlur={() => {
      sEditorContentFoNode(s_tmp_editor_content_fo_node)
    }}
  />

  return <TabPanel>
    <Box
      layerStyle='menuconfigpanel_grid'
    >

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isDisabled={!is_activated}
        isIndeterminate={is_indeterminated}
        isChecked={selected_nodes[0].has_FO}
        onChange={(evt) => {
          selected_nodes
            .forEach(d => {
              d.has_FO = evt.target.checked
              d.draw()
            })
          setCount(a => a + 1)
        }}
      >
        {is_activated ? <>{t('Noeud.foreign_object.Visibilité')}</> : <OSTooltip label={t('Menu.sankeyOSPDisabled')}>{t('Noeud.foreign_object.Visibilité')}</OSTooltip>}
      </Checkbox>
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isDisabled={!is_activated}
        isIndeterminate={is_indeterminated}
        isChecked={selected_nodes[0].is_FO_raw}
        onChange={(evt) => {
          selected_nodes
            .forEach(d => {
              d.is_FO_raw = evt.target.checked
              d.draw()
            })
          setCount(a => a + 1)
        }}
      >
        {is_activated ? <>{t('Noeud.foreign_object.raw')}</> : <OSTooltip label={t('Menu.sankeyOSPDisabled')}>{t('Noeud.foreign_object.raw')}</OSTooltip>}
      </Checkbox>

      {
        (selected_nodes.length > 0) ?

          <OSTooltip label={is_activated ? (!selected_nodes[0].has_FO ? t('Noeud.foreign_object.not_activated') : '') : t('Menu.sankeyOSPDisabled')}>
            {
              (selected_nodes[0].is_FO_raw) ?
                editor_fo_raw :
                editor_fo
            }
          </OSTooltip>
          : <></>
      }

      <Box
        as='span'
        layerStyle='options_2cols'
      >
        <Button
          variant='menuconfigpanel_option_button_left'
          isDisabled={!is_activated || !s_tmp_editor_content_changed}
          backgroundColor='red.200'
          onClick={() => {
            if (selected_nodes.length > 0) {
              if (typeof selected_nodes[0].FO_content !== 'undefined') {
                // Reset textaera
                if (typeof inputRef.current !== 'undefined') {
                  if (inputRef.current !== null) {
                    inputRef.current.value = selected_nodes[0].FO_content
                  }
                }
                // Reset state value
                sEditorContentFoNode(selected_nodes[0].FO_content)
              }
              else {
                // Reset textaera
                if (typeof inputRef.current !== 'undefined') {
                  if (inputRef.current !== null) {
                    inputRef.current.value = ''
                  }
                }
                // Reset state value
                sEditorContentFoNode('')
              }
            }
            else {
              // Reset textaera
              if (typeof inputRef.current !== 'undefined') {
                if (inputRef.current !== null) {
                  inputRef.current.value = ''
                }
              }
              // Reset state value
              sEditorContentFoNode('')
            }
            setCount(a => a + 1)
          }}
        >
          {t('Noeud.FO.cancel')}
        </Button>
        <Button
          variant='menuconfigpanel_option_button_right'
          isDisabled={!is_activated || !s_tmp_editor_content_changed}
          onClick={() => {
            selected_nodes
              .forEach(d => {
                d.FO_content = s_tmp_editor_content_fo_node
                d.draw()
              })
            sEditorContentFoNode(s_tmp_editor_content_fo_node)
          }}
        >
          {t('Noeud.FO.submit')}
        </Button>
      </Box>
    </Box>
  </TabPanel>
}


// export const OSPDrawNodesFO : OSPDrawNodesFOFType = (
//   data : OSPData,
//   display_nodes : { [node_id: string]: OSPNode },
//   applicationState,
//   NodeTooltipsContent: NodeTooltipsContentFType,
//   GetLinkValue:GetLinkValueFuncType,
//   trad
// ) => {
//   const {ref_getter_mode_selection} =applicationState
//   const node_mouse_over=(data:OSPData,t:d3.BaseType,event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
//     d3.select(t).attr('cursor', (ref_getter_mode_selection.current === 's')? 'pointer' : 'unset')
//     if (NodeDisplayed(data,(d as OSPNode)) && (window.SankeyToolsStatic || event.shiftKey)) {
//       const sankeyTooltip=d3.select('.sankey-tooltip')

//       sankeyTooltip
//         .style('opacity', 1)
//         .html(NodeTooltipsContent(data,display_nodes, d as OSPNode,GetLinkValue,trad))
//     }
//   }

//   const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
//     if ((NodeDisplayed(data,(d as OSPNode))) && (window.SankeyToolsStatic || event.shiftKey)) {
//       const sankeyTooltip=d3.select('.sankey-tooltip')

//       const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))
//       let pos_tooltip_y= event.clientY
//       const size_browser=window.innerHeight
//       pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY

//       const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))
//       let pos_tooltip_x= event.clientX
//       const size_browser_w=window.innerWidth
//       pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30

//       sankeyTooltip
//         .style('top',pos_tooltip_y + 'px')
//         .style('left',pos_tooltip_x + 'px')
//     }
//   }

//   const add_nodes_fo = (
//   ) => {
//     //----------------ICON-----------------

//     // Add icon to node (if there is one associated to it)
//     // then apply selected parameter
//     const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

//     const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, OSPNode, d3.BaseType, unknown>)

//     ggg_nodes.filter((d)=>{
//       return d.has_FO
//     }) .append('foreignObject')
//       .attr('width',(n)=>+d3.select(' .opensankey #shape_' + n.idNode).attr('width'))
//       .attr('height',(n)=>+d3.select(' .opensankey #shape_' + n.idNode).attr('height'))
//       .attr('id',(d)=> d.idNode + '_fo')
//       .on('mouseover', function (event, d) {
//         node_mouse_over(data,this,event,d)
//       })
//       .on('mousemove', function (event,d) {
//         node_mouse_move(event,d)
//       })
//       .on('mouseout', function () {
//         sankeyTooltip.style('opacity', 0)
//       })
//       .append('xhtml:div')
//       .attr('class','ql-editor')
//       .html((d)=>d.FO_content)
//   }
//   add_nodes_fo()

// }

