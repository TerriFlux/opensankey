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
import pako from 'pako'
import { Box, Button, Input, Select, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { Type_JSON } from '../../types/Utils'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_DrawingArea } from '../../types/DrawingArea'
import { DecompressedJSONData, decompressUploadedFileUniversal } from '../../Persistence/UniversalJSONCompression'
import { DrawingAreaPersistence } from '../../Persistence/SankeyPersistence'
import { updateFrom } from '../../Algorithms/UpdateFrom'


// ===========================================================================
// Shared grid component — used by ApplyLayoutDialog & ModalTransparentViewAttrOSP
// ===========================================================================

export type UpdateModeGridProps = {
  attrs: string[]
  onToggle: (key: string) => void
  t: (key: string) => string
  /** When true: show Ajouts/Suppressions/Values/Tags/tagLevel rows (default true) */
  show_expert_rows?: boolean
  /** If provided, keys returning true will have their row greyed out */
  is_row_disabled?: (key: string) => boolean
  /** Optional extra tab injected by OSP or other extensions */
  extra_tab?: {
    label: string
    /** If provided and returns true: tab header is greyed and content disabled */
    disabled?: () => boolean
    render: (attrs: string[], onToggle: (key: string) => void, t: (key: string) => string) => React.ReactNode
  }
}

export const UpdateModeGrid = ({ attrs, onToggle, t, show_expert_rows = true, extra_tab, is_row_disabled }: UpdateModeGridProps) => {
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

  const nodeLabel  = t('Menu.Transformation.attrNode')
  const fluxLabel  = t('Menu.Transformation.attrFlux')
  const zdtLabel   = t('Menu.Transformation.ZdT')
  const addLabel   = t('Menu.Transformation.Ajouts')
  const delLabel   = t('Menu.Transformation.Suppressions')
  const attrLabel  = t('Menu.Transformation.Attribut')
  const geoLabel   = t('Menu.Transformation.Geometry')
  const majLabel   = t('Menu.Transformation.updateTags')
  const majElemLabel = t('Menu.Transformation.updateElementTags')

  // Column header cell
  const hdr = (label: string) => (
    <Box fontSize='xs' textAlign='center' fontWeight='semibold' px='1'>{label}</Box>
  )

  // Grid cols: 4 (expert) or 2 (simple)
  const elemGrid = show_expert_rows
    ? { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }
    : { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '4px' }

  const elemRow = (label: string, addKey: string, removeKey: string, attrKey: string, posKey: string) => (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' mb='1'>
      <Box layerStyle='menuconfigpanel_option_name'>{label}</Box>
      <Box sx={elemGrid}>
        {show_expert_rows && btn(addKey, '+')}
        {show_expert_rows && btn(removeKey, '−')}
        {btn(attrKey, 'X')}
        {btn(posKey, 'X')}
      </Box>
    </Box>
  )

  const tagGrid = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px' }
  const tagGridAssign = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }

  // assignKey: string → 4e colonne « Maj assignation » active ; null → 4e colonne vide
  // (ligne dans un onglet 4-cols mais sans assignation, ex. Niveaux de détail) ;
  // undefined → onglet 3-cols classique (Données).
  const tagRow = (label: string, addKey: string, removeKey: string, updateKey: string, assignKey?: string | null) => {
    const disabled = is_row_disabled?.(updateKey) ?? false
    const has_assign_col = assignKey !== undefined
    return (
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' mb='1' opacity={disabled ? 0.45 : 1} pointerEvents={disabled ? 'none' : undefined}>
        <Box layerStyle='menuconfigpanel_option_name'>{label}</Box>
        <Box sx={has_assign_col ? tagGridAssign : tagGrid}>
          {btn(addKey, '+')}{btn(removeKey, '−')}{btn(updateKey, 'X')}
          {has_assign_col && (assignKey ? btn(assignKey, 'X') : <Box />)}
        </Box>
      </Box>
    )
  }

  const elemHeader = <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
    <Box />
    <Box sx={elemGrid}>
      {show_expert_rows && hdr(addLabel)}
      {show_expert_rows && hdr(delLabel)}
      {hdr(attrLabel)}
      {hdr(geoLabel)}
    </Box>
  </Box>

  const tagHeader = <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
    <Box />
    <Box sx={tagGrid}>{hdr(addLabel)}{hdr(delLabel)}{hdr(majLabel)}</Box>
  </Box>

  const tagHeaderAssign = <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
    <Box />
    <Box sx={tagGridAssign}>{hdr(addLabel)}{hdr(delLabel)}{hdr(majLabel)}{hdr(majElemLabel)}</Box>
  </Box>

  const tabSx = {
    display: 'inline-flex !important', width: 'auto !important', height: 'auto !important',
    padding: '2px 8px !important', margin: '0 !important', borderRadius: '4px !important',
    fontSize: '0.75rem', fontWeight: 'semibold', cursor: 'pointer',
    border: '1px solid', borderColor: 'gray.300', color: 'gray.600',
    _selected: { bg: 'gray.100', color: 'gray.800', borderColor: 'gray.500' },
  }

  const tp = (children: React.ReactNode) => (
    <TabPanel p='1'>{children}</TabPanel>
  )

  return <Tabs variant='unstyled' isLazy mt='0' key={show_expert_rows ? 'expert' : 'simple'}>
    <TabList sx={{ display: 'flex !important', flexDirection: 'row !important', flexWrap: 'wrap', gap: '4px', mb: '1', alignItems: 'center', height: 'fit-content !important', minHeight: '0 !important', padding: '0 !important', border: 'none !important' }}>
      <Tab sx={tabSx}>{t('Menu.Transformation.elementsTitle')}</Tab>
      {show_expert_rows && <Tab sx={tabSx}>{t('Menu.Transformation.tagGroupsTitle')}</Tab>}
      {show_expert_rows && <Tab sx={tabSx}>{t('Menu.Transformation.dataTitle')}</Tab>}
      <Tab sx={tabSx}>{t('Menu.Transformation.attrGeneral')}</Tab>
      {show_expert_rows && extra_tab && <Tab sx={extra_tab.disabled?.() ? { ...tabSx, opacity: 0.45, cursor: 'default' } : tabSx}>{extra_tab.label}</Tab>}
    </TabList>
    <TabPanels border='1px solid' borderColor='gray.200' borderRadius='4px'>

      {tp(<>
        {elemHeader}
        {elemRow(nodeLabel, 'addNode',      'removeNode',      'attrNode',      'posNode')}
        {elemRow(fluxLabel, 'addFlux',      'removeFlux',      'attrFlux',      'posFlux')}
        {elemRow(zdtLabel,  'addFreeLabel', 'removeFreeLabel', 'attrFreeLabel', 'posFreeLabel')}
      </>)}

      {show_expert_rows && tp(<>
        {tagHeaderAssign}
        {tagRow(t('Menu.Transformation.tagNode'),  'addTagNode',  'removeTagNode',  'tagNode',  'assignTagNode')}
        {tagRow(t('Menu.Transformation.tagFlux'),  'addTagFlux',  'removeTagFlux',  'tagFlux',  'assignTagFlux')}
        {tagRow(t('Menu.Transformation.tagLevel'), 'addTagLevel', 'removeTagLevel', 'tagLevel', null)}
      </>)}

      {show_expert_rows && tp(<>
        {tagHeader}
        {tagRow(t('Menu.Transformation.tagData'), 'addTagData', 'removeTagData', 'tagData')}
        <OSTooltip label={t('Menu.Transformation.tooltips.Values')}>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>
            <Box layerStyle='options_4cols'>{btn('Values', 'X')}</Box>
          </Box>
        </OSTooltip>
      </>)}

      {tp(<>
        <OSTooltip label={t('Menu.Transformation.tooltips.attrDrawingArea')}>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>
            <Box layerStyle='options_4cols'>
              {btn('attrDrawingArea', 'X')}
              {btn('scale', t('Menu.Transformation.scale'))}
            </Box>
          </Box>
        </OSTooltip>
        <OSTooltip label={t('Menu.Transformation.tooltips.Styles')}>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Styles')}</Box>
            <Box layerStyle='options_4cols'>
              {btn('styleDA', 'X')}
              {btn_disabled('styleNode', nodeLabel, !attrs.includes('styleDA'))}
              {btn_disabled('styleFlux', fluxLabel, !attrs.includes('styleDA'))}
              {btn_disabled('styleFreeLabel', zdtLabel, !attrs.includes('styleDA'))}
            </Box>
          </Box>
        </OSTooltip>
        <OSTooltip label={t('Menu.Transformation.tooltips.doc')}>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.doc')}</Box>
            <Box layerStyle='options_4cols'>{btn('doc', 'X')}</Box>
          </Box>
        </OSTooltip>
      </>)}

      {show_expert_rows && extra_tab && tp(extra_tab.render(attrs, onToggle, t))}

    </TabPanels>
  </Tabs>
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

  ref_to_updater_modal_apply_layout.current = () => setForceUpdate((b: boolean) => !b)

  const simple_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]
  const default_element_to_transform = [
    'posNode', 'posFlux', 'posFreeLabel',
    'attrNode', 'attrFlux', 'attrFreeLabel',
    'attrDrawingArea',
    'styleDA', 'styleNode', 'styleFlux', 'styleFreeLabel'
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
      extra_tab={menu_configuration.extra_apply_layout_tab}
      is_row_disabled={menu_configuration.apply_layout_is_row_disabled}
      onToggle={key => {
        const elem_style_keys = ['styleNode', 'styleFlux', 'styleFreeLabel']
        if (!data_var_to_update.includes(key)) {
          data_var_to_update.push(key)
          // Values requires addTagData to create missing value slots in target
          if (key === 'Values' && !data_var_to_update.includes('addTagData'))
            data_var_to_update.push('addTagData')
          // element style buttons require styleDA
          if (elem_style_keys.includes(key) && !data_var_to_update.includes('styleDA'))
            data_var_to_update.push('styleDA')
        } else {
          // Prevent removing addTagData while Values depends on it
          if (key === 'addTagData' && data_var_to_update.includes('Values')) return
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

  const snapshotDA = (drawing_area: Class_DrawingArea): Uint8Array =>
    pako.gzip(JSON.stringify(DrawingAreaPersistence.toJSON(drawing_area)))

  // Restore via a freshly-built DA rather than fromJSON on the existing one:
  // *Persistence.fromJSON calls don't reset _storage before populating, so
  // a plain in-place restore would leak state from the post-snapshot DA.
  const restoreDA = (snapshot: Uint8Array) => {
    const json = JSON.parse(pako.ungzip(snapshot, { to: 'string' })) as Type_JSON
    const newDA = app_data.createNewDrawingArea(app_data.drawing_area.id)
    newDA.bypass_redraws = true
    app_data.loadDrawingAreaFromJSON(newDA, json)
    newDA.afterFromJSON()
    app_data.replaceDrawingArea(newDA)
    newDA.draw()
  }

  const applySourceDA = (tmp_DA: ReturnType<typeof app_data.createNewDrawingArea>, source_json?: Type_JSON) => {
    const expanded_mode = app_data.expandLayoutMode(data_var_to_update)
    const before = snapshotDA(app_data.drawing_area)
    app_data.drawing_area.bypass_redraws = true

    // IID=83 — sibling import/export nodes are not stored in the MEP JSON: they are
    // regenerated by splitTrade() with default dx/dy=0. updateFrom() would then copy
    // those zero offsets onto the current diagram, resetting user-defined positions.
    // Preserve the current diagram's sibling offsets so we can restore them after.
    const saved_sibling_dx = new Map<string, number>()
    const saved_sibling_dy = new Map<string, number>()
    const echangeTag = app_data.drawing_area.sankey.node_taggs_dict['type de noeud']?.tags_dict?.['echange']
    if (echangeTag) {
      app_data.drawing_area.sankey.nodes_list
        .filter(n => n.hasGivenTag(echangeTag) && n.sibling)
        .forEach(n => {
          saved_sibling_dx.set(n.id, n.shape_position_dx)
          saved_sibling_dy.set(n.id, n.shape_position_dy)
        })
    }

    updateFrom(app_data.drawing_area, tmp_DA, expanded_mode)

    // Restore sibling offsets and recompute their absolute positions
    if (echangeTag && saved_sibling_dx.size > 0) {
      app_data.drawing_area.sankey.nodes_list
        .filter(n => n.hasGivenTag(echangeTag) && n.sibling)
        .forEach(n => {
          if (saved_sibling_dx.has(n.id)) n.shape_position_dx = saved_sibling_dx.get(n.id)!
          if (saved_sibling_dy.has(n.id)) n.shape_position_dy = saved_sibling_dy.get(n.id)!
        })
      app_data.drawing_area.nodePositioning.arrangeTrade(true)
    }

    app_data.drawing_area.draw()
    // Si la doc a été transférée, resynchroniser le panneau Doc s'il est ouvert (il lit
    // documentation_markdown dans un state local, non rafraîchi par le seul draw()).
    if (expanded_mode.includes('doc')) app_data.menu_configuration.ref_to_doc.current()
    app_data.post_apply_layout_callback?.(tmp_DA, source_json ?? null, expanded_mode)
    const after = snapshotDA(app_data.drawing_area)
    app_data.history.saveUndo(() => restoreDA(before))
    app_data.history.saveRedo(() => restoreDA(after))
  }

  const handleFileLoad = async () => {
    if (!file_layout || file_layout.length === 0) return
    const file = file_layout[0]
    setIsProcessing(true)
    try {
      const json_object: DecompressedJSONData = await decompressUploadedFileUniversal(file)
      const tmp_DA = app_data.createNewDrawingArea()
      tmp_DA.bypass_redraws = true
      app_data.loadDrawingAreaFromJSON(tmp_DA, json_object as Type_JSON)
      tmp_DA.afterFromJSON()
      // La doc (onglet Doc) est un champ niveau ApplicationData, non chargé par
      // loadDrawingAreaFromJSON (qui ne traite que le niveau DA). On l'extrait du JSON
      // source et on la stocke en transitoire sur la DA temporaire pour qu'updateFrom
      // (mode 'doc') puisse la transférer — tmp_DA partage app_data avec le diagramme
      // courant, donc on ne peut pas passer par application_data.
      const src_json = json_object as Type_JSON
      tmp_DA.imported_documentation_markdown =
        typeof src_json['documentation_markdown'] === 'string'
          ? src_json['documentation_markdown'] as string
          : ''
      tmp_DA.imported_documentation_images =
        (src_json['documentation_images'] && typeof src_json['documentation_images'] === 'object')
          ? src_json['documentation_images'] as { [id: string]: string }
          : {}
      applySourceDA(tmp_DA, json_object as Type_JSON)
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
            onClick={() => app_data.history.applyUndo()}
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