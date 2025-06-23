import React, { FunctionComponent, useState, RefObject, useRef, MutableRefObject, ReactNode } from 'react'
import { Drawer, Button, Collapse, DrawerContent, DrawerBody, Box, useDisclosure, Heading, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, Select } from '@chakra-ui/react'
import { ConfigMenuNumberInput } from '../../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'
import { FCType_ToolbarFilter, FCType_FlowValueFilter } from './type'
import { Type_GenericApplicationDataOSP } from '../../types/TypesOSP'
import { NodeTagGroupFilter } from './NodeTagGroupFilter'
import { FlowTagGroupFilter } from './FlowTagGroupFilter'
import { DataTagGroupFilter } from './DataTagGroupFilter'
import { LevelTagFilter } from './LevelTagFilter'


// Types for FunctionComponent ==========================================

type FCType_CollapseButton = { new_data: Type_GenericApplicationDataOSP, isOpen: boolean, onToggle: () => void }

type FCType_FilterTagGroup = {
  new_data: Type_GenericApplicationDataOSP,
  title: string,
  children: ReactNode,

}

// General fixed variable ==========================================
const width_fitler_drawer = 270

export const title_filter_column = (new_data: Type_GenericApplicationDataOSP) => <Box
  as='span'
  layerStyle='popover_sidebar_row_tag_filter'
>
  <Box textStyle='h2'>{new_data.t('Menu.group')}</Box>
  <Box textStyle='h2'>{new_data.t('Menu.color')}</Box>
</Box>


// JSX Components ==========================================


/**
 * Component that show filters for for link value and tag group (node,flow &  data)
 *
 * @param {*} { new_data }
 * @return {*} 
 */
export const ToolbarFilter: FunctionComponent<FCType_ToolbarFilter> = ({ new_data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const width_drawer = (drawerOpen ? width_fitler_drawer + new_data.drawing_area.fit_margin / 2 : 0) + new_data.drawing_area.fit_margin / 2
  new_data.menu_configuration.ref_close_filter_drawer.current = setDrawerOpen

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

const FlowValueFilter: FunctionComponent<FCType_FlowValueFilter> = ({ new_data }) => {
  const { t } = new_data

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...new_data.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()) / (l.shape_local_link_scale ?? 1))) + 1
  const [, setCount] = useState(0)

  new_data.menu_configuration.ref_to_toolbar_link_visual_filter_updater.current = () => setCount(a => a + 1)

  // Ref to popover button trigger to trap focus at popover when onBlur of NumberInput
  const ref: RefObject<HTMLButtonElement> = useRef(null)

  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < 2; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  ref_set_number_inputs[0].current(String(new_data.drawing_area.filter_link_value))
  ref_set_number_inputs[1].current(String(new_data.drawing_area.filter_label))

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
          ref_to_set_value={ref_set_number_inputs[0]}
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
          ref_to_set_value={ref_set_number_inputs[1]}
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

export const CollapseButton: FunctionComponent<FCType_CollapseButton> = ({ new_data, isOpen, onToggle }) => {
  return <Button variant='collapse_filter'
    size='sizeBtnCollapseFilter'
    onClick={onToggle}>
    {isOpen ? new_data.icon_library.icon_collapse_up : new_data.icon_library.icon_collapse_down}
  </Button>
}

export const FilterWrapperBox: FunctionComponent<FCType_FilterTagGroup> = ({
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

export const FilterDataType: FunctionComponent<FCType_ToolbarFilter> = ({ new_data }) => {
  const { t } = new_data
  const [s_is_data_type_reconcilied, sIsDataTypeReconcilied] = useState(['reconciled', 'free_value', 'free_interval'].includes(new_data.drawing_area.type_data))
  const data_type_not_reconcilied = ['data', 'structure', 'free_value', 'free_interval'].includes(new_data.drawing_area.type_data)
  const [s_type_value, sTypeValue] = useState<'data' | 'structure' | 'reconciled'>(data_type_not_reconcilied ? (new_data.drawing_area.type_data as 'data' | 'structure' | 'reconciled') : 'reconciled')
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
          new_data.drawing_area.type_data = evt.target.value as 'data' | 'structure' | 'reconciled'
          sTypeValue(evt.target.value as 'data' | 'structure' | 'reconciled')
          if (evt.target.value === 'reconciled') {
            sIsDataTypeReconcilied(true)
          } else {
            sIsDataTypeReconcilied(false)
          }
          setCount(a => a + 1)
          redrawNodeLinkLegend()
        }}>
        <option key='structure' value='structure' >{t('Banner.t_v_s')}</option>
        <option key='data' value='data' >{t('Banner.t_v_c')}</option>
        {/* If data is reconcilied add option*/}
        <option key='reconciled' value='reconciled' >{t('Banner.t_v_r')}</option> : <></>
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
        <option key='none' value='reconciled' >{t('Banner.t_v_s')}</option>
        <option key='free_interval' value='free_interval' >{t('Banner.t_v_i')}</option>
        <option key='free_value' value='free_value' >{t('Banner.t_v_pv')}</option>
      </Select>
    </Box></>

  return <FilterWrapperBox
    new_data={new_data}
    title={t('Banner.title_data_type')}>
    {content}
  </FilterWrapperBox>
}