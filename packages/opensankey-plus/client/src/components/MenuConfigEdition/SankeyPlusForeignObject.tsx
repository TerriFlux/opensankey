// External imports
import React, { FunctionComponent, useState, useRef, MutableRefObject } from 'react'
import ReactQuill from 'react-quill' // 'react-quill' seem to not be updated anymore, for new it doesn't create problem but it make a warning error in console to solve it when time will come we can use 'react-quill-new' wich solve this issu (https://github.com/zenoamaro/react-quill/issues/988#issuecomment-2241533429)

import {
  Box,
  Textarea,
  TabPanel,
  Checkbox,
  Button
} from '@chakra-ui/react'

// OpenSankey imports
import { OSTooltip } from '../../deps/OpenSankey/types/Utils'

// Local imports
import type { FCType_NodeForeignObjectOSP } from './types/SankeyPlusForeignObjectTypes'
import type { Type_GenericNodeElementOSP } from '../../types/TypesOSP'

export const NodeForeignObjectOSP: FunctionComponent<FCType_NodeForeignObjectOSP> = ({
  new_data_plus,
  is_activated,
}) => {
  const { drawing_area, t } = new_data_plus

  const [s_editor_content_fo_node, sEditorContentFoNode] = useState('')
  const [, setCount] = useState(0)
  const selected_nodes = drawing_area.selected_nodes_list
  new_data_plus.menu_configuration.r_editor_content_fo_node_updater.current=()=>setCount(a=>a+1)
  let s_tmp_editor_content_fo_node = s_editor_content_fo_node
  new_data_plus.menu_configuration.r_setter_editor_content_fo_node.current = sEditorContentFoNode

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

  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align'
  ]

  const has_FO = (selected_nodes[0]?.has_FO ?? false)
  const is_FO_raw = (selected_nodes[0]?.is_FO_raw ?? false)

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
  // Functions we can undo ========================================

  const updateFOVisibility = (_:boolean) => {
    const dict_old_value: { [x: string]: boolean } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.has_FO
    })
    const _updateFOVisibility = () => {
      selected_nodes.forEach(n => {
        n.has_FO=_
        n.draw()
      })
      setCount(a=>a+1)
    }

    const inv_updateFOVisibility = () => {
      selected_nodes.forEach(n => {
        n.has_FO = dict_old_value[n.id]
        n.draw()
      })
      setCount(a=>a+1)
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateFOVisibility)
    new_data_plus.history.saveRedo(_updateFOVisibility)
    // Execute original attr mutation
    _updateFOVisibility()
  }

  const updateFORaw = (_:boolean) => {
    const dict_old_value: { [x: string]: boolean } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.is_FO_raw
    })
    const _updateFORaw = () => {
      selected_nodes.forEach(n => {
        n.is_FO_raw=_
        n.draw()
      })
      setCount(a=>a+1)
    }

    const inv_updateFORaw = () => {
      selected_nodes.forEach(n => {
        n.is_FO_raw = dict_old_value[n.id]
        n.draw()
      })
      setCount(a=>a+1)
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateFORaw)
    new_data_plus.history.saveRedo(_updateFORaw)
    // Execute original attr mutation
    _updateFORaw()
  }

  
  const applyEditor=()=>{
    const dict_old_value:{[x:string]:string}={}
    selected_nodes.map(node => dict_old_value[node.id] =node.FO_content)

    const _applyEditor=()=>{
      selected_nodes.map(node => node.FO_content = s_tmp_editor_content_fo_node)
      sEditorContentFoNode(s_tmp_editor_content_fo_node)
      // Toogle saving indicator
      new_data_plus.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    const inv_applyEditor=()=>{
      selected_nodes.map(node => node.FO_content = dict_old_value[node.id])
      sEditorContentFoNode(selected_nodes[0].FO_content)
    }

    new_data_plus.history.saveUndo(inv_applyEditor)
    new_data_plus.history.saveRedo(_applyEditor)

    _applyEditor()
  }


  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo = <Box style={{ 'height': '300px' }}>
    <ReactQuill
      className='quill_editor'
      value={selected_nodes.length>0?selected_nodes[0].FO_content:''}
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
        color: (!is_activated || !has_FO) ? '#666666' : '',
        backgroundColor: (!is_activated || !has_FO) ? '#cccccc' : '',
        overflowY: 'scroll'
      }}
    />
  </Box>

  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  const editor_fo_raw = <Textarea
    rows={5}
    color={(!is_activated || !has_FO) ? '#666666' : ''}
    backgroundColor={(!is_activated || !has_FO) ? '#cccccc' : ''}
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
        isChecked={has_FO}
        onChange={(evt) => {
          updateFOVisibility(evt.target.checked)
        }}
      >
        {is_activated ? <>{t('Noeud.foreign_object.Visibilité')}</> : <OSTooltip label={t('Menu.sankeyOSPDisabled')}>{t('Noeud.foreign_object.Visibilité')}</OSTooltip>}
      </Checkbox>
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isDisabled={!is_activated}
        isIndeterminate={is_indeterminated}
        isChecked={is_FO_raw}
        onChange={(evt) => {
          updateFORaw(evt.target.checked)
        }}
      >
        {is_activated ? <>{t('Noeud.foreign_object.raw')}</> : <OSTooltip label={t('Menu.sankeyOSPDisabled')}>{t('Noeud.foreign_object.raw')}</OSTooltip>}
      </Checkbox>

      {
        (selected_nodes.length > 0) ?

          <OSTooltip label={is_activated ? (!has_FO ? t('Noeud.foreign_object.not_activated') : '') : t('Menu.sankeyOSPDisabled')}>
            {
              (is_FO_raw) ?
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
          onClick={applyEditor}
        >
          {t('Noeud.FO.submit')}
        </Button>
      </Box>
    </Box>
  </TabPanel>
}
