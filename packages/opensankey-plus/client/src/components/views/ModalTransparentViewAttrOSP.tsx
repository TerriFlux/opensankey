// Standard libs
import React, { FC, useEffect, useRef, useState } from 'react'
import {
  Box,
  CloseButton,
  Select,
  Button,
  Text,
} from '@chakra-ui/react'

// OpenSankey Libs
import { default_main_sankey_id } from '@terriflux/opensankey/src/types/Utils'
import { updateFrom } from '@terriflux/opensankey/src/Algorithms/UpdateFrom'
import { UpdateModeGrid } from '@terriflux/opensankey/src/components/dialogs/SankeyMenuDialogs'
import { Class_DrawingAreaOSP } from '../../types/DrawingAreaOSP'
import { BaseComponentPropsPlus, DraggableComponent, drawingZoneDraggableBounds } from './viewsShared'

export const ModalTransparentViewAttrOSP: FC<BaseComponentPropsPlus> = (
  { app_data }
): JSX.Element => {

  const { t } = app_data
  const [display_menu, set_display_menu] = useState(false)
  const [, setUpdater] = useState(0)
  const [selected_source, set_selected_source] = useState(default_main_sankey_id)
  const nodeRef = useRef(null)

  // Re-rendre (donc recalculer les bornes draggable) au toggle du tableur/doc.
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(() => setUpdater(a => a + 1))
  }, [])

  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP
  app_data.menu_configuration_osp.ref_to_modal_view_attributes_switcher.current = set_display_menu
  app_data.menu_configuration_osp.ref_to_modal_view_attr_updater.current = () => setUpdater((a: number) => a + 1)

  const updateComponent = () => {
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setUpdater(a => a + 1)
  }

  const has_sankey_plus = app_data.has_sankey_plus
  const has_master_sankey = app_data.has_master_sankey
  const is_view_master = app_data.is_view_master

  if (!has_sankey_plus || !has_master_sankey || is_view_master) return <></>

  const simple_attr = ['posNode', 'posFlux', 'attrNode', 'attrFlux', 'attrDrawingArea']
  const all_attr = app_data.transform_layout_all_attr

  const view_id = drawing_area_plus.id
  const attrs_by_source = app_data.heredited_attr[view_id] ?? {}

  // Sources disponibles = maître + toutes les autres vues sauf la vue courante
  const view_sources = [
    { id: default_main_sankey_id, name: t('view.actual') },
    ...app_data.views_order
      .filter(id => id !== default_main_sankey_id && id !== view_id)
      .map(id => ({ id, name: app_data.views_dict[id].name }))
  ]

  // S'assurer que selected_source est valide pour la vue courante
  const valid_source = view_sources.some(s => s.id === selected_source) ? selected_source : default_main_sankey_id
  const heredited = attrs_by_source[valid_source] ?? []

  const setAttrForSource = (src: string, attrs: string[]) => {
    if (!app_data.heredited_attr[view_id]) app_data.heredited_attr[view_id] = {}
    app_data.heredited_attr[view_id][src] = attrs
  }

  const content = <Box layerStyle='menuconfigpanel_grid'>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.sourceType')}</Box>
      <Select
        value={valid_source}
        onChange={evt => set_selected_source(evt.target.value)}
      >
        {view_sources.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}{(attrs_by_source[s.id]?.length ?? 0) > 0 ? ' *' : ''}
          </option>
        ))}
      </Select>
    </Box>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Shortcuts')}</Box>
      <Box layerStyle='options_4cols'>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { setAttrForSource(valid_source, []); updateComponent() }}
        >{t('Menu.Transformation.unSelectAll')}</Button>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { setAttrForSource(valid_source, [...simple_attr]); updateComponent() }}
        >Basiques</Button>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { setAttrForSource(valid_source, [...all_attr]); updateComponent() }}
        >{t('Menu.Transformation.selectAll')}</Button>
      </Box>
    </Box>

    <UpdateModeGrid
      attrs={heredited}
      onToggle={key => {
        const next = heredited.includes(key)
          ? heredited.filter((k: string) => k !== key)
          : [...heredited, key]
        setAttrForSource(valid_source, next)
        updateComponent()
      }}
      t={t}
      show_expert_rows={true}
    />

    <Button
      onClick={() => {
        ;[default_main_sankey_id, ...app_data.views_order].forEach((source_id: string) => {
          const attrs = attrs_by_source[source_id]
          if (attrs && attrs.length > 0) {
            const source_da = app_data.getDrawingAreaFromViewId(source_id)
            if (source_da) updateFrom(drawing_area_plus, source_da, attrs)
          }
        })
        app_data.draw()
      }}
    >
      {t('view.updateViewWithMasterVar')}
    </Button>

  </Box>

  return <DraggableComponent
    nodeRef={nodeRef}
    handle='.title_menu'
    defaultPosition={{ x: window.innerWidth / 4, y: window.innerHeight / 4 }}
    bounds={drawingZoneDraggableBounds(app_data, nodeRef)}
  >
    <Box
      ref={nodeRef}
      layerStyle='menu_draggable_layout'
      hidden={!display_menu}
      position='absolute'
      minW='10vw'
      maxW='40vw'
      zIndex='2'
    >
      <Box className='title_menu' layerStyle='menu_draggable_title_layout'>
        <Text justifySelf='start' fontStyle='h1' margin='0'>
          {t('view.setTransparentAttr')}
        </Text>
        <CloseButton justifySelf='end' onClick={() => set_display_menu(false)} />
      </Box>
      <Box layerStyle='menu_draggable_content_layout'>
        {content}
      </Box>
    </Box>
  </DraggableComponent>
}
