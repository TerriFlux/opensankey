import React, { useState, RefObject, useRef, ReactNode, useMemo,useReducer } from 'react'
import {
  Drawer, Button, Collapse, DrawerContent, DrawerBody, Box, useDisclosure,
  Heading, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, Select, Checkbox, Switch
} from '@chakra-ui/react'

import { ConfigMenuNumberInput } from '../configmenus/SankeyMenuConfiguration'
import { OSMultiSelect, typeElementSelectable, CustomFaEyeCheckIcon, OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_TagGroup, Class_DataTagGroup, Class_LevelTagGroup } from '../../types/TagGroup'
import { Class_ProtoTag } from '../../types/Tag'

const width_fitler_drawer = 270

declare const window: Window &
  typeof globalThis & {
    sankey: {
      data_type: boolean
      data_type_intervals: boolean
    }
  }

/**
 * Component that show filters for for link value and tag group (node,flow &  data)
 *
 * @param {*} { app_data }
 * @return {*} 
 */
export const ToolbarFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [drawerOpen, setDrawerOpen] = useState(app_data.is_static)
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  const width_drawer = (drawerOpen ? width_fitler_drawer + app_data.drawing_area.fit_margin / 2 : 0) + app_data.drawing_area.fit_margin / 2
  app_data.menu_configuration.ref_close_filter_drawer.current = setDrawerOpen
  app_data.menu_configuration.ref_toolbar.current = forceUpdate
  return <>
    <Button
      id='buttonOpenFilterDrawer'
      variant='toolbar_button_open_filter'
      size='sizeToolbarButton'
      style={{
        left: width_drawer,
        top: app_data.drawing_area.getNavBarHeight() + (app_data.drawing_area.fit_margin)
      }}
      onClick={() => setDrawerOpen(!drawerOpen)}
    >
      {
        app_data.icon_library.icon_filter_tags
      }
    </Button>

    <Drawer
      placement='left'
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      blockScrollOnMount={false}
      variant='drawer_menu_filter'
      trapFocus={false}
      onEsc={() => {
        // Override drawer onEscape() to use Class_applicationData 'escape' keyEvent & not the one by default from the <Drawer> component
        const ev = document
        const tmp = new KeyboardEvent('keydown', { key: 'Escape' })
        if (ev.onkeydown) {
          ev.onkeydown(tmp as KeyboardEvent)
        }
      }}
    >
      <DrawerContent
        style={{
          width: 'unset',
          height: 'fit-content',
          boxShadow: 'unset',
          maxWidth: 'unset',
          left: app_data.drawing_area.fit_margin / 2,
          maxHeight: app_data.drawing_area.window_fitting_height,
          //overflowY: 'auto',
          marginTop: (app_data.drawing_area.fit_margin) + document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().y + document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().height
        }}>
        <DrawerBody
          id='drawer_filter'
          style={{ padding: '0', width: width_fitler_drawer }}
        >
          <Box layerStyle='drawerFilterBox'>
            {
              window.sankey?.data_type != false ? <FilterDataType app_data={app_data} /> : <></>
            }
            <FlowValueFilter app_data={app_data} />
            <LevelTagFilter app_data={app_data} />
            <NodeTagGroupFilter app_data={app_data} level={false} />
            <DataTagGroupFilter app_data={app_data} />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer></>
}

const FlowValueFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...app_data.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()) / (l.shape_local_link_scale ?? 1))) + 1
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_toolbar_link_visual_filter_updater.current = () => setCount(a => a + 1)

  // Ref to popover button trigger to trap focus at popover when onBlur of NumberInput
  const ref: RefObject<HTMLButtonElement> = useRef(null)

  return <FilterWrapperBox
    app_data={app_data}
    title={t('Banner.p_aff')}
  >
    <Box
      layerStyle='menuconfigpanel_grid'>

      <Text >
        {t('Banner.filtre')}
      </Text>
      <Box layerStyle='filter_grid_row'>
        <Slider
          variant='slider_filter_link_value'
          min={0}
          max={max_link_value}
          value={app_data.drawing_area.filter_link_value}
          onChange={evt => {
            app_data.drawing_area.filter_link_value = +evt
            setCount(a => a + 1)
            app_data.drawing_area.sankey.visible_links_list.forEach(link => {
              link.draw()
              link.target.drawLinksArrow()
            })
          }
          } >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>

        <ConfigMenuNumberInput
          t={app_data.t}
          default_value={app_data.drawing_area.filter_link_value}
          function_on_blur={(value) => {
            if (value && value > max_link_value) {
              value = max_link_value
            }
            if (value) {
              app_data.drawing_area.filter_link_value = value
              setCount(a => a + 1)
              app_data.drawing_area.sankey.draw()
            }

            ref.current?.focus() //avoid closure of popover
          }}
          minimum_value={0}
          maximum_value={max_link_value}
          stepper={false}
        />
      </Box>

      <Text>
        {t('Banner.fl')}
      </Text>
      <Box layerStyle='filter_grid_row'>

        <Slider
          variant='slider_filter_link_value'
          min={0}
          max={max_link_value}
          value={app_data.drawing_area.filter_label}
          onChange={(evt) => {
            app_data.drawing_area.filter_label = +evt
            setCount(a => a + 1)
            app_data.drawing_area.sankey.visible_links_list.forEach(link => link.drawValue())
          }}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <ConfigMenuNumberInput
          t={app_data.t}
          default_value={app_data.drawing_area.filter_label}
          function_on_blur={(value) => {

            if (value) {
              if (value > max_link_value) {
                value = max_link_value
              }
              app_data.drawing_area.filter_label = value
              setCount(a => a + 1)
              app_data.drawing_area.sankey.links_list.forEach(link => link.drawValue())
            }

            ref.current?.focus() //avoid closure of popover
          }}
          minimum_value={0}
          maximum_value={max_link_value}
          stepper={false}
        />
      </Box>
    </Box>
  </FilterWrapperBox>
}

export const CollapseButton = ({ app_data, isOpen, onToggle }: {
  app_data: Class_ApplicationData, isOpen: boolean, onToggle: () => void
}) => {
  return <Button variant='collapse_filter'
    size='sizeBtnCollapseFilter'
    onClick={onToggle}>
    {isOpen ? app_data.icon_library.icon_collapse_up : app_data.icon_library.icon_collapse_down}
  </Button>
}

export const FilterWrapperBox = ({ app_data, title, defaultOpen, children }: React.PropsWithChildren<{
  app_data: Class_ApplicationData,
  title: string,
  defaultOpen?: boolean
  children: ReactNode
}>) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen })
  return <Box layerStyle={'filter_wrapper'}>
    <Box layerStyle='filter_head_box'>
      <Heading variant='title_filter_tagg'>{title}</Heading>
      <CollapseButton app_data={app_data} isOpen={isOpen} onToggle={onToggle} />
    </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box className='content_filter'>
        {children}
      </Box>
    </Collapse>
  </Box>
}

export const FilterDataType = ({ app_data, defaultOpen }: { app_data: Class_ApplicationData, defaultOpen?: boolean }) => {
  const { t } = app_data
  const [_, sIsDataTypeReconcilied] = useState(['reconciled', 'free_value', 'free_interval'].includes(app_data.drawing_area.type_data))
  const data_type_not_reconcilied = ['data', 'structure'].includes(app_data.drawing_area.type_data)
  const [s_type_value, sTypeValue] = useState<'data' | 'data_label' | 'structure' | 'reconciled'>(data_type_not_reconcilied ? (app_data.drawing_area.type_data as 'data' | 'structure' | 'reconciled') : 'reconciled')
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_toolbar_updater.current = () => setCount(a => a + 1)

  const redrawNodeLinkLegend = () => {
    app_data.drawing_area.sankey.nodes_list.forEach(n => n.resetLinkVisibilitiesMemorization())
    app_data.drawing_area.sankey.draw()
    app_data.drawing_area.legend.draw()
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
  }
  let has_results = false
  app_data.drawing_area.sankey.links_list.forEach(l => has_results = has_results || l.has_result)
  let has_intervals = false
  app_data.drawing_area.sankey.links_list.forEach(l => has_intervals = has_intervals || l.has_intervals)

  const content = <>
    <Box
      layerStyle='menuconfig_grid'
    >
      <Box fontStyle='h3' >
        {t('Banner.sdr')}
      </Box>
      <Select
        value={s_type_value}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          app_data.drawing_area.type_data = evt.target.value as 'data' | 'data_label' | 'structure' | 'reconciled'
          sTypeValue(evt.target.value as 'data' | 'structure' | 'reconciled' | 'data_label')
          if (evt.target.value === 'reconciled') {
            sIsDataTypeReconcilied(true)
          } else {
            sIsDataTypeReconcilied(false)
          }
          setCount(a => a + 1)
          redrawNodeLinkLegend()
        }}>
        <option key='structure' value='structure' >{t('Banner.structure')}</option>
        {has_results ? <>
          <option key='data' value='data' >{t('Banner.collected_data')}</option>
          <option key='data_label' value='data_label' >{t('Banner.collected_data_label')}</option>
          <option key='reconciled' value='reconciled' >{t('Banner.reconciled')}</option>
        </> : <option key='reconciled' value='reconciled' >{t('Banner.only_data')}</option>}
      </Select>
    </Box>
    {has_intervals && window.sankey?.data_type_intervals !== false ?
      <Box
        layerStyle='menuconfig_grid'
      //display={s_is_data_type_reconcilied && app_data.is_reconcilied ? '' : 'none'}
      >
        <Box fontStyle='h3' >
          {t('Banner.indetermined_value')}
        </Box>
        <Select
          value={app_data.drawing_area.type_data}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            app_data.drawing_area.type_data = evt.target.value as 'reconciled' | 'free_value' | 'free_interval'
            setCount(a => a + 1)
            redrawNodeLinkLegend()
          }}>
          <option key='none' value='reconciled' >{t('Banner.structure')}</option>
          <option key='free_interval' value='free_interval' >{t('Banner.free_interval')}</option>
          <option key='free_value' value='free_value' >{t('Banner.free_value')}</option>
        </Select>
      </Box> : <></>}
  </>

  return <FilterWrapperBox
    app_data={app_data}
    title={t('Banner.title_data_type')}
    defaultOpen={defaultOpen}>
    {content}
  </FilterWrapperBox>
}
// Types pour la configuration des différents modes
type TagFilterMode = 'element' | 'level' | 'data'
interface TagFilterConfig {
  mode: TagFilterMode
  title_key: string
  show_title_column: boolean
  show_palette_switch: boolean
  show_type_selection_header: boolean
  update_method: string
  ref_updater_key: string
}
const TAG_FILTER_CONFIGS: Record<TagFilterMode, TagFilterConfig> = {
  element: {
    mode: 'element',
    title_key: 'fdn',
    show_title_column: true,
    show_palette_switch: true,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToNodeTags',
    ref_updater_key: 'ref_to_nodetag_filter_updater'
  },
  level: {
    mode: 'level',
    title_key: 'ndd',
    show_title_column: false,
    show_palette_switch: false,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToNodeTags',
    ref_updater_key: 'ref_to_leveltag_filter_updater'
  },
  data: {
    mode: 'data',
    title_key: 'sdd',
    show_title_column: false,
    show_palette_switch: false,
    show_type_selection_header: true,
    update_method: 'updateAllComponentsRelatedToDataTags',
    ref_updater_key: 'ref_to_datatag_filter_updater'
  },
  // flow: {
  //   mode: 'flow',
  //   title_key: 'fdf',
  //   show_title_column: true,
  //   show_palette_switch: true,
  //   show_type_selection_header: false,
  //   update_method: 'updateAllComponentsRelatedToFluxTags',
  //   ref_updater_key: 'ref_to_fluxtag_filter_updater'
  // }
}

/**
 * Composant unifié pour filtrer tous les types de tags
 */

export const UnifiedTagGroupFilter = ({ app_data, mode, }: {
  app_data: Class_ApplicationData
  mode: TagFilterMode
}) => {
  const config = TAG_FILTER_CONFIGS[mode]
  const { t, drawing_area } = app_data
  const { sankey } = drawing_area
  // Component updater
  const [, setCount] = useState(0)

  const active_level_taggs = useMemo(
    () => new Set(
      sankey.visible_nodes_list.flatMap(node => [
        ...node.dimensions_as_parent,
        ...node.dimensions_as_child
      ].map(dimension => dimension.related_level_tagg))
    ),
    [sankey.visible_nodes_list]
  )

  // Configuration du updater selon le mode
  if (config.ref_updater_key && app_data.menu_configuration[config.ref_updater_key as keyof typeof app_data.menu_configuration]) {
    //@ts-expect-error xxx
    app_data.menu_configuration[config.ref_updater_key as keyof typeof app_data.menu_configuration].current = () => setCount(a => a + 1)
  }

  // Récupération des tags selon le mode
  const getTagsForMode = (): Class_TagGroup[] => {
    switch (mode) {
    case 'element':
      return [...Object.values(sankey.node_taggs_dict), ...Object.values(sankey.flux_taggs_dict)]
        .filter(tagg => tagg.banner !== 'none') as unknown as Class_TagGroup[]
    case 'level': {
      const level_taggs = sankey.level_taggs_dict
      return Object.values(level_taggs).filter(tagg => tagg.has_tags && tagg.banner !== 'none' /*&& active_level_taggs.has(tagg)*/) as unknown as Class_TagGroup[]
    }
    case 'data':
      return Object.values(app_data.drawing_area.sankey.data_taggs_dict)
        .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi') as unknown as Class_TagGroup[]
      // case 'flow':
      //   return Object.values(app_data.drawing_area.sankey.flux_taggs_dict)
      //     .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi') as unknown as Class_TagGroup[]
    default:
      return [] as unknown as Class_TagGroup[]
    }
  }
  const getActiveTagsForMode = (): Set<Class_ProtoTag> => {
    switch (mode) {
    case 'element':
      return new Set([...sankey.nodes_list.flatMap(node => node.tags_list), ...sankey.links_list.flatMap(link => link.flux_tags_list)]) as unknown as Set<Class_ProtoTag>
    case 'level': {
      const level_taggs = sankey.level_taggs_dict
      return new Set(Object.values(level_taggs).filter(
        tagg => tagg.has_tags && tagg.banner !== 'none' && active_level_taggs.has(tagg)
      ).flatMap(tagg => tagg.tags_list)) as unknown as Set<Class_ProtoTag>
    }
    case 'data':
      return new Set(Object.values(app_data.drawing_area.sankey.data_taggs_dict)
        .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi').flatMap(tagg => tagg.tags_list))
    default:
      return {} as Set<Class_ProtoTag>
    }
  }
  const updateComponents = () => {
    if (config.update_method == 'updateAllComponentsRelatedToNodeTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
      app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
      // } else if (config.update_method == 'updateAllComponentsRelatedToFluxTags') {
      //   app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToDataTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToLevelTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
    }
  }

  const taggs_in_banner = getTagsForMode()

  // Fonction générique pour appliquer une palette
  const setApplyTagGroupPalette = (tagg: Class_TagGroup, checked: boolean) => {
    const taggs_dict = { ...sankey.node_taggs_dict, ...sankey.flux_taggs_dict }

    const dict_old_val = Object.fromEntries(Object.values(taggs_dict).map(t => [t.id, t.use_colors]))

    const applyPalette = () => {
      //Object.values(taggs_dict).forEach(t => t.use_colors = false)
      if (checked) {
        tagg.use_colors = true
      } else {
        tagg.use_colors = false
      }
      app_data.drawing_area.legend.draw()
      app_data.drawing_area.orderElementOnDA()
      updateComponents()
    }

    const revertPalette = () => {
      Object.values(taggs_dict).forEach(t => t.use_colors = dict_old_val[t.id])
      app_data.drawing_area.legend.draw()
      updateComponents()


    }

    app_data.history.saveUndo(revertPalette)
    app_data.history.saveRedo(applyPalette)
    applyPalette()
  }

  // Gestion des actions spécifiques selon le mode
  const handleTagSelection = (tagg: Class_TagGroup, values: string[]) => {
    //app_data.drawing_area.bypass_redraws = true
    app_data.drawing_area.bypass_autofit = true
    if (values.length > 1) {
      tagg.selectTagsFromIds(values)
    } else {
      tagg.selectTagsFromId(values[0])
    }

    // Actions spécifiques selon le mode
    switch (mode) {
    case 'level':
      if (app_data.drawing_area.sankey.default_node_style.position_type == 'parametric') {
        app_data.drawing_area.nodePositioning.computeParametricVForTagg(tagg as unknown as Class_LevelTagGroup)
      }
      app_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
      app_data.drawing_area.draw()
      app_data.drawing_area.sankey.nodes_list.forEach(node => node.reorganizeIOLinks())
      app_data.drawing_area.orderElementOnDA()
      break
    case 'data':
      handleDataTagSelection(tagg as unknown as Class_DataTagGroup, values)
      break
    case 'element':
      app_data.drawing_area.bypass_compute_positions = true
      app_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
      app_data.drawing_area.bypass_compute_positions = false
      app_data.drawing_area.orderElementOnDA()
      break
    }
    app_data.drawing_area.bypass_autofit = false
    updateComponents()
  }

  // Logique spécifique pour les data tags
  const handleDataTagSelection = (tagg: Class_DataTagGroup, entries: string[]) => {
    app_data.drawing_area.sankey.links_list.forEach(l => {
      if (l.is_multi_link) return

      if (entries.length === 1) {
        Object.keys(l.child_links).forEach(key => {
          l.child_links[key].delete()
          delete l.child_links[key]
        })
      } else {
        tagg.tags_list.forEach(tag => {
          if (!tag.is_selected && tag.id in l.child_links) {
            l.child_links[tag.id].delete()
            delete l.child_links[tag.id]
          }
        })
        tagg.selected_tags_list.forEach(tag => {
          if (tag.id in l.child_links || l.is_multi_link) return
          const child_link = app_data.drawing_area.sankey.addNewLink(l.source, l.target)
          child_link.copyFrom(l)
          l.addChildLink(child_link, tag)
        })
      }
    })

    app_data.drawing_area.draw()
    app_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.reorganizeIOLinks())
    app_data.drawing_area.orderElementOnDA()
  }

  // Création du sélecteur selon le type de banner
  const createSelector = (tagg: Class_TagGroup/*, active_tags: Set<Class_ProtoTag>*/) => {
    if (tagg.banner === 'one') {
      const selected_value = tagg.selected_tags_list[0]?.id ?? ''
      return (
        <Select
          key={tagg.name}
          value={selected_value}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            handleTagSelection(tagg, [evt.target.value])
          }}
        >
          {tagg.tags_list/*.filter(tag => active_tags.has(tag))*/.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </Select>
      )
    } else if (tagg.banner === 'multi') {
      const options = tagg.tags_list/*.filter(tag => active_tags.has(tag))*/.map(tag => ({
        label: tag.name,
        value: tag.id,
        selected: tag.is_selected,
        disabled: mode === 'data' && tagg.selected_tags_list.length < 2 && tag.id === tagg.selected_tags_list[0]?.id
      }))

      return (
        <OSMultiSelect
          t={t}
          elements={options}
          onClick={(entries: typeElementSelectable) => {
            handleTagSelection(tagg, entries.map(_ => _.value))
          }} />
      )
    }
    return <></>
  }

  // Création du bouton switch/checkbox selon le mode
  const createActionButton = (tagg: Class_TagGroup) => {
    if (mode === 'element' && config.show_palette_switch) {
      //const casted_tag = tagg as Class_NodeTagGroup
      return (
        <Switch
          justifySelf='end'
          alignSelf='center'
          height='1rem'
          isChecked={tagg.use_colors}
          onChange={evt => setApplyTagGroupPalette(tagg, evt.target.checked)} />
      )
    } else if (mode === 'level' && tagg instanceof Class_LevelTagGroup && (tagg as Class_LevelTagGroup).has_tags) {
      const level_tagg = tagg as Class_LevelTagGroup
      return (level_tagg.siblings !== undefined && level_tagg.siblings.filter(tagg => app_data.drawing_area.sankey.level_taggs_dict[tagg].banner != 'none').length > 0) ? (
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={level_tagg.activated}
          icon={<CustomFaEyeCheckIcon />}
          onChange={evt => {
            level_tagg.activated = evt.target.checked
            const selected_tag = level_tagg.selected_tags_list.map(t => t.id)[0]
            level_tagg.selectTagsFromId(level_tagg.tags_list[0]?.id ?? '')
            // level_tagg.siblings.forEach(sibling => {
            //   app_data.drawing_area.sankey.level_taggs_dict[sibling].activated = !level_tagg.activated
            // })
            app_data.drawing_area.bypass_autofit = true
            // app_data.drawing_area.sankey.showAccordingToLevelTags()
            app_data.drawing_area.nodePositioning.computeParametricVForTagg(level_tagg)
            app_data.drawing_area.resetAllVerticalIntervals()
            level_tagg.selectTagsFromId(selected_tag ?? '')
            app_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
            app_data.drawing_area.draw()
            app_data.drawing_area.sankey.nodes_list.forEach(n => n.reorganizeIOLinks())
            app_data.drawing_area.bypass_autofit = false
            updateComponents()
          }} />
      ) : <></>
    } else if (mode === 'data') {
      return (
        <Switch
          justifySelf='end'
          alignSelf='center'
          height='1rem'
          isChecked={tagg.banner === 'multi'}
          onChange={evt => {
            tagg.banner = evt.target.checked ? 'multi' : 'one'
            if (tagg.banner === 'one') {
              app_data.drawing_area.sankey.remove_child_links()
            }
            tagg.selectTagsFromId(tagg.tags_list[0].id)
            updateComponents()
          }} />
      )
    }
    // } else if (mode === 'flow' && config.show_palette_switch) {
    //   return (
    //     <Switch
    //       isChecked={tagg.use_colors}
    //       onChange={evt => setApplyTagGroupPalette(tagg, evt.target.checked)} />
    //   )
    // }
    return <></>
  }

  // Génération des sélecteurs
  const SelectorOfTagsByGroup = taggs_in_banner.map(tagg => {
    if (Object.keys(tagg.tags_dict || {}).length < 1) {
      return <></>
    }
    const selector = createSelector(tagg/*, getActiveTagsForMode()*/)

    const actionButton = createActionButton(tagg)

    return (
      <Box key={tagg.id} layerStyle={mode === 'data' ? 'menuconfigpanel_grid' : 'menuconfig_grid'}>
        {mode === 'level' && tagg.name === 'Primaire' ? <></> :
          <Box layerStyle='menuconfigpanel_option_name'>
            {tagg.name}
          </Box>}
        <Box layerStyle='filter_grid_row'>
          <OSTooltip label={t('Banner.ndd_lst')}>
            {selector}
          </OSTooltip>
          <OSTooltip label={t('Banner.ndd_chk')}>
            <Box justifySelf='end' alignSelf='center'>
              {actionButton}
            </Box>
          </OSTooltip>
        </Box>
      </Box>
    )
  })

  const title_filter_column = (app_data: Class_ApplicationData) => <Box layerStyle='filter_grid_row'>
    <Box></Box>
    <Box justifySelf='end' alignSelf='center'>{app_data.t('Menu.color')}</Box>
  </Box>

  // En-tête spécial pour les data tags
  const TypeSelectionHeader = config.show_type_selection_header ? (<Box layerStyle='filter_grid_row'>
    <Box></Box>
    <Box justifySelf='end' alignSelf='center'>{t('Menu.type_selection')}</Box>
  </Box>
  ) : null

  let title_key = config.title_key
  if (mode === 'level' && taggs_in_banner.length > 0 && taggs_in_banner[0].name === 'Primaire') title_key = 'ndd_one'

  // Rendu final
  return SelectorOfTagsByGroup.length > 0 ? (
    <FilterWrapperBox app_data={app_data} title={t(`Banner.${title_key}`)} defaultOpen={app_data.is_static}>
      {config.show_title_column ? title_filter_column(app_data) : null}
      {TypeSelectionHeader}
      {SelectorOfTagsByGroup}
    </FilterWrapperBox>
  ) : <></>
}
// Composants wrapper pour maintenir la compatibilité avec l'API existante

export const NodeTagGroupFilter = ({ app_data, level }: { app_data: Class_ApplicationData, level: boolean }) => (
  <UnifiedTagGroupFilter app_data={app_data} mode={level ? 'level' : 'element'} />
)

export const LevelTagFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_leveltag_filter_updater.current = () => setCount(a => a + 1)

  const nb_level_taggs = Object.entries(app_data.drawing_area.sankey.level_taggs_dict).length
  if (nb_level_taggs == 0) {
    return <></>
  }
  if (nb_level_taggs == 1) {
    const level_tagg = Object.values(app_data.drawing_area.sankey.level_taggs_dict)[0]
    if (level_tagg.tags_list.length == 1) {
      return <></>
    }
  }
  const content_popover = <UnifiedTagGroupFilter app_data={app_data} mode="level" />

  return content_popover
}

export const DataTagGroupFilter = ({ app_data }: { app_data: Class_ApplicationData }) =>
  <UnifiedTagGroupFilter app_data={app_data} mode="data" />

// export const FlowTagGroupFilter = ({ app_data }:{app_data:Class_ApplicationData}) =>
//   <UnifiedTagGroupFilter app_data={app_data} mode="element" />
// )
