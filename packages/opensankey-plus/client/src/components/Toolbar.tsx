import React, { FC, useState, RefObject, useRef, ReactNode } from 'react'
import { 
  Drawer, Button, Collapse, DrawerContent, DrawerBody, Box, useDisclosure, 
  Heading, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, Select, Checkbox, Switch 
} from '@chakra-ui/react'

import { ConfigMenuNumberInput } from '../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { OSMultiSelect, typeElementSelectable, CustomFaEyeCheckIcon, OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { Class_TagGroup, Class_DataTagGroup, Class_NodeTagGroup, Class_LevelTagGroup } from '../deps/OpenSankey/types/TagGroup'


type FCType_CollapseButton = { new_data: Class_ApplicationDataOSP, isOpen: boolean, onToggle: () => void }

type FCType_FilterTagGroup = {
  new_data: Class_ApplicationDataOSP,
  title: string,
  children: ReactNode,

}

interface BaseComponentProps {
  new_data: Class_ApplicationDataOSP
}
interface BaseComponentPropsPlus {
  new_data_plus: Class_ApplicationDataOSP
}
/**
 * Type de base pour les composants avec niveau
 */
export interface BaseLevelProps extends BaseComponentProps {
  level: boolean
}

const width_fitler_drawer = 270

/**
 * Component that show filters for for link value and tag group (node,flow &  data)
 *
 * @param {*} { new_data }
 * @return {*} 
 */
export const ToolbarFilter: FC<BaseComponentProps> = ({ new_data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const width_drawer = (drawerOpen ? width_fitler_drawer + new_data.drawing_area.fit_margin / 2 : 0) + new_data.drawing_area.fit_margin / 2
  new_data.menu_configuration_osp.ref_close_filter_drawer.current = setDrawerOpen

  return <>
    <Button
      id='buttonOpenFilterDrawer'
      variant='toolbar_button_open_filter'
      size='sizeToolbarButton'
      style={{
        left: width_drawer,
        top: new_data.drawing_area.getNavBarHeight() + (new_data.drawing_area.fit_margin)
      }}
      onClick={() => setDrawerOpen(!drawerOpen)}
    >
      {new_data.icon_library.icon_filter_tags}
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
          left: new_data.drawing_area.fit_margin / 2,
          maxHeight: new_data.drawing_area.window_fitting_height,
          overflowY: 'auto',
          marginTop: (new_data.drawing_area.fit_margin) + document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().y + document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().height
        }}>
        <DrawerBody
          id='drawer_filter'
          style={{ padding: '0', width: width_fitler_drawer }}
        >
          <Box layerStyle='drawerFilterBox'>
            <FilterDataType new_data={new_data} />
            <FlowValueFilter new_data={new_data} />
            <LevelTagFilter new_data_plus={new_data} />
            <NodeTagGroupFilter new_data={new_data} level={false} />
            <FlowTagGroupFilter new_data={new_data} />
            <DataTagGroupFilter new_data={new_data} />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer></>
}

const FlowValueFilter: FC<BaseComponentProps> = ({ new_data }) => {
  const { t } = new_data

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...new_data.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()) / (l.shape_local_link_scale ?? 1))) + 1
  const [, setCount] = useState(0)

  new_data.menu_configuration_osp.ref_to_toolbar_link_visual_filter_updater.current = () => setCount(a => a + 1)

  // Ref to popover button trigger to trap focus at popover when onBlur of NumberInput
  const ref: RefObject<HTMLButtonElement> = useRef(null)

  return <FilterWrapperBox
    new_data={new_data}
    title={t('Banner.p_aff')}
  >
    <Box
      layerStyle='menuconfigpanel_grid'>

      <Text textStyle='h3'>
        {t('Banner.filtre')}
      </Text>
      <Box layerStyle='filter_grid_row'>
        <Slider
          variant='slider_filter_link_value'
          min={0}
          max={max_link_value}
          value={new_data.drawing_area.filter_link_value}
          onChange={evt => {
            new_data.drawing_area.filter_link_value = +evt
            setCount(a => a + 1)
            new_data.drawing_area.sankey.visible_links_list.forEach(link => {
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
          t={new_data.t}
          default_value={new_data.drawing_area.filter_link_value}
          function_on_blur={(value) => {
            if (value && value > max_link_value) {
              value = max_link_value
            }
            if (value) {
              new_data.drawing_area.filter_link_value = value
              setCount(a => a + 1)
              new_data.drawing_area.sankey.draw()
            }

            ref.current?.focus() //avoid closure of popover
          }}
          minimum_value={0}
          maximum_value={max_link_value}
          stepper={false}
        />
      </Box>

      <Text textStyle='h3'>
        {t('Banner.fl')}
      </Text>
      <Box layerStyle='filter_grid_row'>

        <Slider
          variant='slider_filter_link_value'
          min={0}
          max={max_link_value}
          value={new_data.drawing_area.filter_label}
          onChange={(evt) => {
            new_data.drawing_area.filter_label = +evt
            setCount(a => a + 1)
            new_data.drawing_area.sankey.visible_links_list.forEach(link => link.drawValue())
          }}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <ConfigMenuNumberInput
          t={new_data.t}
          default_value={new_data.drawing_area.filter_label}
          function_on_blur={(value) => {

            if (value) {
              if (value > max_link_value) {
                value = max_link_value
              }
              new_data.drawing_area.filter_label = value
              setCount(a => a + 1)
              new_data.drawing_area.sankey.links_list.forEach(link => link.drawValue())
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

export const CollapseButton: FC<FCType_CollapseButton> = ({ new_data, isOpen, onToggle }) => {
  return <Button variant='collapse_filter'
    size='sizeBtnCollapseFilter'
    onClick={onToggle}>
    {isOpen ? new_data.icon_library.icon_collapse_up : new_data.icon_library.icon_collapse_down}
  </Button>
}

export const FilterWrapperBox: FC<FCType_FilterTagGroup> = ({
  new_data,
  title,
  children
}) => {
  const { isOpen, onToggle } = useDisclosure()
  return <Box layerStyle={'filter_wrapper'}>
    <Box layerStyle='filter_head_box'>
      <Heading variant='title_filter_tagg'>{title}</Heading>
      <CollapseButton new_data={new_data} isOpen={isOpen} onToggle={onToggle} />
    </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box className='content_filter'>
        {children}
      </Box>
    </Collapse>
  </Box>
}

export const FilterDataType: FC<BaseComponentProps> = ({ new_data }) => {
  const { t } = new_data
  const [s_is_data_type_reconcilied, sIsDataTypeReconcilied] = useState(['reconciled', 'free_value', 'free_interval'].includes(new_data.drawing_area.type_data))
  const data_type_not_reconcilied = ['data', 'structure'].includes(new_data.drawing_area.type_data)
  const [s_type_value, sTypeValue] = useState<'data' | 'data_label' | 'structure' | 'reconciled'>(data_type_not_reconcilied ? (new_data.drawing_area.type_data as 'data' | 'structure' | 'reconciled') : 'reconciled')
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_toolbar_updater.current = () => setCount(a => a + 1)

  const redrawNodeLinkLegend = () => {
    new_data.drawing_area.sankey.draw()
    new_data.drawing_area.legend.draw()
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
  }

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
          new_data.drawing_area.type_data = evt.target.value as 'data' | 'data_label' | 'structure' | 'reconciled'
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
        <option key='data' value='data' >{t('Banner.collected_data')}</option>
        <option key='data_label' value='data_label' >{t('Banner.collected_data_label')}</option>
        <option key='reconciled' value='reconciled' >{t('Banner.reconciled')}</option> : <></>
      </Select>
    </Box>

    <Box
      layerStyle='menuconfig_grid'
      display={s_is_data_type_reconcilied && new_data.is_reconcilied ? '' : 'none'}
    >
      <Box fontStyle='h3' >
        {t('Banner.indetermined_value')}
      </Box>
      <Select
        value={new_data.drawing_area.type_data}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          new_data.drawing_area.type_data = evt.target.value as 'reconciled' | 'free_value' | 'free_interval'
          setCount(a => a + 1)
          redrawNodeLinkLegend()
        }}>
        <option key='none' value='reconciled' >{t('Banner.structure')}</option>
        <option key='free_interval' value='free_interval' >{t('Banner.free_interval')}</option>
        <option key='free_value' value='free_value' >{t('Banner.free_value')}</option>
      </Select>
    </Box></>

  return <FilterWrapperBox
    new_data={new_data}
    title={t('Banner.title_data_type')}>
    {content}
  </FilterWrapperBox>
}
// Types pour la configuration des différents modes
type TagFilterMode = 'node' | 'level' | 'data' | 'flow'
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
  node: {
    mode: 'node',
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
  flow: {
    mode: 'flow',
    title_key: 'fdf',
    show_title_column: true,
    show_palette_switch: true,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToFluxTags',
    ref_updater_key: 'ref_to_fluxtag_filter_updater'
  }
}
interface UnifiedTagGroupFilterProps {
  new_data: Class_ApplicationData
  mode: TagFilterMode
  level?: boolean // Pour compatibilité avec l'ancien code
}
/**
 * Composant unifié pour filtrer tous les types de tags
 */

export const UnifiedTagGroupFilter: FC<UnifiedTagGroupFilterProps> = ({ new_data, mode, level = false }) => {
  const config = TAG_FILTER_CONFIGS[mode]
  const { t } = new_data

  // Component updater
  const [, setCount] = useState(0)

  // Configuration du updater selon le mode
  if (config.ref_updater_key && new_data.menu_configuration[config.ref_updater_key as keyof typeof new_data.menu_configuration]) {
    //@ts-expect-error xxx
    new_data.menu_configuration[config.ref_updater_key as keyof typeof new_data.menu_configuration].current = () => setCount(a => a + 1)
  }

  // Récupération des tags selon le mode
  const getTagsForMode = (): Class_TagGroup[] => {
    switch (mode) {
      case 'node':
        return Object.values(new_data.drawing_area.sankey.node_taggs_dict)
          .filter(tagg => tagg.banner !== 'none') as unknown as Class_TagGroup[]
      case 'level':
        const level_taggs = new_data.drawing_area.sankey.level_taggs_dict
        const nb_of_level_taggs = Object.values(level_taggs).filter(tagg => tagg.has_tags).length
        return Object.values(level_taggs).filter(tagg => tagg.has_tags) as unknown as Class_TagGroup[]
      case 'data':
        return Object.values(new_data.drawing_area.sankey.data_taggs_dict)
          .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi') as unknown as Class_TagGroup[]
      case 'flow':
        return Object.values(new_data.drawing_area.sankey.flux_taggs_dict)
          .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi') as unknown as Class_TagGroup[]
      default:
        return [] as unknown as Class_TagGroup[]
    }
  }
  const updateComponents = () => {
    if (config.update_method == 'updateAllComponentsRelatedToNodeTags') {
      new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToFluxTags') {
      new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToDataTags') {
      new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToLevelTags') {
      new_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
    }
  }

  const taggs_in_banner = getTagsForMode()

  // Fonction générique pour appliquer une palette
  const setApplyTagGroupPalette = (tagg: Class_TagGroup, checked: boolean) => {
    const taggs_dict = mode === 'node'
      ? new_data.drawing_area.sankey.node_taggs_dict
      : new_data.drawing_area.sankey.flux_taggs_dict

    const dict_old_val = Object.fromEntries(Object.values(taggs_dict).map(t => [t.id, t.use_colors]))

    const applyPalette = () => {
      Object.values(taggs_dict).forEach(t => t.use_colors = false)
      if (checked) {
        tagg.use_colors = true
      }
      new_data.drawing_area.legend.draw()
      updateComponents()
    }

    const revertPalette = () => {
      Object.values(taggs_dict).forEach(t => t.use_colors = dict_old_val[t.id])
      new_data.drawing_area.legend.draw()
      updateComponents()


    }

    new_data.history.saveUndo(revertPalette)
    new_data.history.saveRedo(applyPalette)
    applyPalette()
  }

  // Gestion des actions spécifiques selon le mode
  const handleTagSelection = (tagg: Class_TagGroup, values:string[]) => {
    if (values.length>1) {
      tagg.selectTagsFromIds(values)
    } else {
      tagg.selectTagsFromId(values[0])
    } 

    // Actions spécifiques selon le mode
    switch (mode) {
      case 'node':
      case 'level':
        new_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
        new_data.drawing_area.draw()
        break
      case 'data':
        handleDataTagSelection(tagg as unknown as Class_DataTagGroup, values)
        break
      case 'flow':
        new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
        break
    }
    updateComponents()
  }

  // Logique spécifique pour les data tags
  const handleDataTagSelection = (tagg: Class_DataTagGroup, entries: string[]) => {
    new_data.drawing_area.sankey.links_list.forEach(l => {
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
          const child_link = new_data.drawing_area.sankey.addNewLink(l.source, l.target)
          child_link.copyFrom(l)
          l.addChildLink(child_link, tag)
        })
      }
    })

    new_data.drawing_area.draw()
    new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.reorganizeIOLinks())
    new_data.drawing_area.orderElementOnDA()
  }

  // Création du sélecteur selon le type de banner
  const createSelector = (tagg: Class_TagGroup) => {
    if (tagg.banner === 'one' || tagg.banner === 'level') {
      const selected_value = tagg.selected_tags_list[0]?.id ?? ''
      return (
        <Select
          key={tagg.name}
          value={selected_value}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            handleTagSelection(tagg, [evt.target.value])
          } }
        >
          {tagg.tags_list.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </Select>
      )
    } else if (tagg.banner === 'multi') {
      const options = tagg.tags_list.map(tag => ({
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
          } } />
      )
    }
    return <></>
  }

  // Création du bouton switch/checkbox selon le mode
  const createActionButton = (tagg: Class_TagGroup) => {
    if (mode === 'node' && config.show_palette_switch) {
      const casted_tag = tagg as Class_NodeTagGroup
      return (
        <Switch
          justifySelf='end'
          alignSelf='center'
          height='1rem'
          isChecked={casted_tag.use_colors}
          onChange={evt => setApplyTagGroupPalette(casted_tag, evt.target.checked)} />
      )
    } else if (mode === 'level' && tagg instanceof Class_LevelTagGroup && (tagg as Class_LevelTagGroup).has_tags) {
      const level_tagg = tagg as Class_LevelTagGroup
      return (level_tagg.siblings !== undefined && level_tagg.siblings.length > 0) ? (
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={level_tagg.activated}
          icon={<CustomFaEyeCheckIcon />}
          onChange={evt => {
            level_tagg.activated = evt.target.checked
            new_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
            new_data.drawing_area.draw()
            updateComponents()
          } } />
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
              new_data.drawing_area.sankey.remove_child_links()
            }
            tagg.selectTagsFromId(tagg.tags_list[0].id)
            updateComponents()
          } } />
      )
    } else if (mode === 'flow' && config.show_palette_switch) {
      return (
        <Switch
          isChecked={tagg.use_colors}
          onChange={evt => setApplyTagGroupPalette(tagg, evt.target.checked)} />
      )
    }
    return <></>
  }

  // Génération des sélecteurs
  const SelectorOfTagsByGroup = taggs_in_banner.map(tagg => {
    if (Object.keys(tagg.tags_dict || {}).length < 1) {
      return <></>
    }

    const selector = createSelector(tagg)
    const actionButton = createActionButton(tagg)

    return (
      <Box key={tagg.id} layerStyle={mode === 'data' ? 'menuconfigpanel_grid' : 'menuconfig_grid'}>
        <Box layerStyle='menuconfigpanel_option_name'>
          {tagg.name}
        </Box>
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

  const title_filter_column = (new_data: Class_ApplicationDataOSP) => <Box layerStyle='filter_grid_row'>
    <Box></Box>
    <Box justifySelf='end' alignSelf='center'>{new_data.t('Menu.color')}</Box>
  </Box>

  // En-tête spécial pour les data tags
  const TypeSelectionHeader = config.show_type_selection_header ? (<Box layerStyle='filter_grid_row'>
    <Box></Box>
    <Box justifySelf='end' alignSelf='center'>{t('Menu.type_selection')}</Box>
  </Box>
  ) : null

  // Rendu final
  return SelectorOfTagsByGroup.length > 0 ? (
    <FilterWrapperBox new_data={new_data as Class_ApplicationDataOSP} title={t(`Banner.${config.title_key}`)}>
      {config.show_title_column ? title_filter_column(new_data as Class_ApplicationDataOSP) : null}
      {TypeSelectionHeader}
      {SelectorOfTagsByGroup}
    </FilterWrapperBox>
  ) : <></>
}
// Composants wrapper pour maintenir la compatibilité avec l'API existante

export const NodeTagGroupFilter: FC<BaseLevelProps> = ({ new_data, level }) => (
  <UnifiedTagGroupFilter new_data={new_data} mode={level ? 'level' : 'node'} />
)

export const LevelTagFilter: FC<BaseComponentPropsPlus> = ({ new_data_plus }) => {
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_leveltag_filter_updater.current = () => setCount(a => a + 1)

  const level_filter = Object.entries(new_data_plus.drawing_area.sankey.level_taggs_dict).length > 0
  const content_popover = <UnifiedTagGroupFilter new_data={new_data_plus} mode="level" />

  return level_filter ? content_popover : <></>
}

export const DataTagGroupFilter: FC<BaseComponentProps> = ({ new_data }) => (
  <UnifiedTagGroupFilter new_data={new_data} mode="data" />
)

export const FlowTagGroupFilter: FC<BaseComponentProps> = ({ new_data }) => (
  <UnifiedTagGroupFilter new_data={new_data} mode="flow" />
)
