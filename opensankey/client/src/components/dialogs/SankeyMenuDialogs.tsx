// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { useState, } from 'react'
import {Box,Button,Input,Select} from '@chakra-ui/react'
import { Type_JSON } from '../../types/Utils'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { DecompressedJSONData, decompressUploadedFileUniversal } from '../../Persistence/UniversalJSONCompression'
import { updateFrom } from '../../Algorithms/UpdateFrom'
import { DrawingAreaPersistence } from '../../Persistence/SankeyPersistence'


// ===========================================================================
// Shared grid component — used by ApplyLayoutDialog & ModalTransparentViewAttrOSP
// ===========================================================================

export type UpdateModeGridProps = {
  attrs: string[]
  onToggle: (key: string) => void
  t: (key: string) => string
  /** When true: show Ajouts/Suppressions/Values/Tags/tagLevel rows (default true) */
  show_expert_rows?: boolean
}

export const UpdateModeGrid = ({ attrs, onToggle, t, show_expert_rows = true }: UpdateModeGridProps) => {
  const btn = (key: string, label: string) => (
    <Button
      variant={attrs.includes(key) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
      onClick={() => onToggle(key)}
    >{label}</Button>
  )
  const btn_disabled = (key: string, label: string, disabled: boolean) => (
    <Button
      isDisabled={disabled}
      variant={attrs.includes(key) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
      onClick={() => { if (!disabled) onToggle(key) }}
    >{label}</Button>
  )
  const nodeLabel = t('Menu.Transformation.attrNode')
  const fluxLabel = t('Menu.Transformation.attrFlux')
  const zdtLabel  = t('Menu.Transformation.ZdT')

  return <>
    {show_expert_rows && <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Ajouts')}</Box>
      <Box layerStyle='options_4cols'>
        {btn('addNode', nodeLabel)}{btn('addFlux', fluxLabel)}{btn('addFreeLabel', zdtLabel)}
      </Box>
    </Box>}

    {show_expert_rows && <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Suppressions')}</Box>
      <Box layerStyle='options_4cols'>
        {btn('removeNode', nodeLabel)}{btn('removeFlux', fluxLabel)}{btn('removeFreeLabel', zdtLabel)}
      </Box>
    </Box>}

    <OSTooltip label={t('Menu.Transformation.tooltips.Attribut')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('attrNode', nodeLabel)}{btn('attrFlux', fluxLabel)}{btn('attrFreeLabel', zdtLabel)}
        </Box>
      </Box>
    </OSTooltip>

    <OSTooltip label={t('Menu.Transformation.tooltips.Geometry')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Geometry')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('posNode', nodeLabel)}{btn('posFlux', fluxLabel)}{btn('posFreeLabel', zdtLabel)}
        </Box>
      </Box>
    </OSTooltip>

    {show_expert_rows && <OSTooltip label={t('Menu.Transformation.tooltips.Values')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('Values', t('Menu.Transformation.Values'))}
        </Box>
      </Box>
    </OSTooltip>}

    {show_expert_rows && <OSTooltip label={t('Menu.Transformation.tooltips.Tags')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Tags')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('tagNode', t('Menu.Transformation.tagNode'))}
          {btn('tagFlux', t('Menu.Transformation.tagFlux'))}
          {btn('tagData', t('Menu.Transformation.tagData'))}
        </Box>
      </Box>
    </OSTooltip>}

    {show_expert_rows && <OSTooltip label={t('Menu.Transformation.tooltips.tagLevel')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.tagLevel')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('tagLevel', t('Menu.Transformation.tagLevel'))}
        </Box>
      </Box>
    </OSTooltip>}

    <OSTooltip label={t('Menu.Transformation.tooltips.attrDrawingArea')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('attrDrawingArea', t('Menu.Transformation.attrGeneral'))}
        </Box>
      </Box>
    </OSTooltip>

    <OSTooltip label={t('Menu.Transformation.tooltips.Styles')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Styles')}</Box>
        <Box layerStyle='options_4cols'>
          {btn('styleDA', t('Menu.Transformation.attrGeneral'))}
          {btn_disabled('styleNode', nodeLabel, !attrs.includes('styleDA'))}
          {btn_disabled('styleFlux', fluxLabel, !attrs.includes('styleDA'))}
          {btn_disabled('styleFreeLabel', zdtLabel, !attrs.includes('styleDA'))}
        </Box>
      </Box>
    </OSTooltip>
  </>
}

// ===========================================================================

/**
 *
 * @param  { ref_setter_show_modal_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog = ({
  new_data
}: {
  new_data: Class_ApplicationData
}) => {
  const { data_var_to_update, t, menu_configuration } = new_data
  const { ref_to_updater_modal_apply_layout } = menu_configuration

  const [, setForceUpdate] = useState(true)
  const [mode_trans, set_mode_trans] = useState('simple')

  ref_to_updater_modal_apply_layout.current = () => setForceUpdate(b => !b)

  const simple_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]
  const default_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]

  const content_modal_layout = <Box layerStyle='menuconfigpanel_grid' >
    {OpenSankeyDiagramSelector(new_data)}

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.choseTransforDifficulty')}
      </Box>
      <Box layerStyle='options_3cols' >
        <Button variant={mode_trans == 'simple' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('simple'); new_data.menu_configuration.ref_to_menu_updater.current() }}>Basiques</Button>
        <Button variant={mode_trans == 'expert' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('expert'); new_data.menu_configuration.ref_to_menu_updater.current() }}>Tous</Button>
      </Box>
    </Box>

    <OSTooltip label={t('Menu.Transformation.tooltips.Shortcuts')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Shortcuts')}</Box>
        <Box layerStyle='options_4cols' >

          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.length = 0
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.unSelectAll')}</Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.length = 0
              if (mode_trans === 'simple') {
                simple_element_to_transform.forEach(el => data_var_to_update.push(el))
              } else {
                new_data.transform_layout_all_attr.forEach(el => data_var_to_update.push(el))
              }
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.selectAll')}</Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.length = 0
              default_element_to_transform.forEach(el => data_var_to_update.push(el))
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.selectDefault')}</Button>

        </Box>
      </Box>
    </OSTooltip>

    <UpdateModeGrid
      attrs={data_var_to_update}
      onToggle={key => {
        const elem_style_keys = ['styleNode', 'styleFlux', 'styleFreeLabel']
        if (!data_var_to_update.includes(key)) {
          data_var_to_update.push(key)
          if (key === 'Values' && !data_var_to_update.includes('tagData'))
            data_var_to_update.push('tagData')
          // element style buttons require styleDA
          if (elem_style_keys.includes(key) && !data_var_to_update.includes('styleDA'))
            data_var_to_update.push('styleDA')
        } else {
          if (key === 'tagData' && data_var_to_update.includes('Values')) return
          data_var_to_update.splice(data_var_to_update.indexOf(key), 1)
          // disabling styleDA also disables element styles
          if (key === 'styleDA')
            elem_style_keys.forEach(k => {
              const i = data_var_to_update.indexOf(k)
              if (i >= 0) data_var_to_update.splice(i, 1)
            })
        }
        menu_configuration.updateComponentApplyLayout()
      }}
      t={t}
      show_expert_rows={mode_trans !== 'simple'}
    />
  </Box>

  const dragLayout = <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_apply_layout'}
    content={content_modal_layout}
    title={t('Menu.Transformation.title')}
  />
  return dragLayout

}

export const OpenSankeyDiagramSelector = (app_data: Class_ApplicationData) => {
  const { t, data_var_to_update } = app_data
  const view_sources = app_data.layout_view_sources
  const has_views = view_sources.length > 0

  const [source_mode, set_source_mode] = useState<'file' | 'view'>('file')
  const [file_layout, set_file_layout] = useState<FileList | null>(null)
  const [selected_view_id, set_selected_view_id] = useState<string>(view_sources[0]?.id ?? '')
  const [isProcessing, setIsProcessing] = useState(false)

  const applySourceDA = (tmp_DA: ReturnType<typeof app_data.createNewDrawingArea>) => {
    app_data.drawing_area.bypass_redraws = true
    updateFrom(app_data.drawing_area, tmp_DA, data_var_to_update)
    app_data.drawing_area.draw()
  }

  const handleFileLoad = async () => {
    if (!file_layout || file_layout.length === 0) return
    const file = file_layout[0]
    setIsProcessing(true)
    try {
      const json_object: DecompressedJSONData = await decompressUploadedFileUniversal(file)
      const tmp_DA = app_data.createNewDrawingArea()
      tmp_DA.bypass_redraws = true
      DrawingAreaPersistence.fromJSON(tmp_DA, json_object as Type_JSON)
      tmp_DA.afterFromJSON()
      applySourceDA(tmp_DA)
    } catch (error) {
      console.error('❌ Erreur lors du traitement du fichier:', error)
      alert(`Erreur lors du chargement du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewLoad = () => {
    if (!selected_view_id) return
    const tmp_DA = app_data.getDrawingAreaFromViewId(selected_view_id)
    if (!tmp_DA) return
    applySourceDA(tmp_DA)
  }

  return (
    <Box>
      <Box as='span' layerStyle='menuconfigpanel_part_title_2'>
        {t('Menu.Transformation.fmep')}
      </Box>

      {has_views && <Box layerStyle='menuconfigpanel_row_2cols' style={{ marginBottom: '6px' }}>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.sourceType')}</Box>
        <Box layerStyle='options_2cols'>
          <Button
            variant={source_mode === 'file' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => set_source_mode('file')}
          >{t('Menu.Transformation.sourceFile')}</Button>
          <Button
            variant={source_mode === 'view' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => set_source_mode('view')}
          >{t('Menu.Transformation.sourceView')}</Button>
        </Box>
      </Box>}

      {source_mode === 'file' ? <Box layerStyle='menuconfigpanel_row_2cols'>
        <Input
          type="file"
          aria-label=''
          accept=".json,.json.gz,.json.zip,.json.br,.json.deflate,.gz,.zip,.br,.deflate"
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => set_file_layout(evt.target.files)}
        />
        <Box layerStyle='options_2cols'>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={handleFileLoad}
            isLoading={isProcessing}
            loadingText="Traitement..."
            disabled={!file_layout || file_layout.length === 0}
          >
            {t('Menu.Transformation.ad')}
          </Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => { /* undo placeholder */ }}
          >
            {t('Menu.Transformation.undo')}
          </Button>
        </Box>
      </Box> : <Box layerStyle='menuconfigpanel_row_2cols'>
        <Select
          value={selected_view_id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => set_selected_view_id(evt.target.value)}
        >
          {view_sources.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </Select>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={handleViewLoad}
          disabled={!selected_view_id}
        >
          {t('Menu.Transformation.ad')}
        </Button>
      </Box>}
    </Box>
  )
}