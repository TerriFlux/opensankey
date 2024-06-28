
import * as d3 from 'd3'
import React, { FunctionComponent, useState } from 'react'
import {
  TFunction
} from 'i18next'
import {
  MultiSelect
} from 'react-multi-select-component'
import {
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'

import {
  Checkbox,
  Button,
  Popover,
  PopoverHeader,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  PopoverCloseButton,
  Text,
  Box,
  NumberInput,
  NumberInputField,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  Switch,
  Input,
  useBoolean
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes,
  faArrowPointer,
  faCodeBranch,
  faDiagramProject,
  faArrowsLeftRight,
  faArrowsUpDown,
  faSliders,
  faExpand,
  faCompress,
  faDatabase
} from '@fortawesome/free-solid-svg-icons'


import {
  ComponentUpdaterType,
  LinkFunctionTypes,
  NodeFunctionTypes,
  SankeyData,
  TagsCatalog,
  TagsGroup,
  applicationDataType,
  applicationDrawType
} from '../types/Types'
import { Class_TagGroup, Class_TagGroupNodeLevel } from '../types/Tag'
import { Class_Sankey } from '../types/Sankey'
import {
  ConvertDataFuncType
} from './types/SankeyConvertTypes'
import {
  addAllDropDownNodeFType,
  addSimpleLevelDropDownFType,
  DataTagSelectorType,
  setDiagramFuncType,
  stretchButtonsFType,
  ToolbarBuilderFType
} from './types/SankeyMenuBannerTypes'
import {
  GetSankeyMinWidthAndHeightFuncType
} from './types/SankeyUtilsTypes'


import {
  AdjustSankeyZone,
  RecursionDataTag,
  FindMaxLinkValue,
  OSTooltip
} from './SankeyUtils'
import {
  Type_MenuSelectionEntry
} from '../topmenus/SankeyMenuTop'
import {
  AddAllDropDownFluxFType
} from '../topmenus/types/SankeyMenuTopTypes'
import {
  DeleteGNodes
} from '../draw/SankeyDrawNodes'
import {
  DeleteGLinks
} from '../draw/SankeyDrawLinks'
import {
  actualizeDrawAreaFrame
} from '../draw/SankeyDrawEventFunction'



const logo_btn_node = <svg xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 1000 1000"
>
  <g>
    <path fill='white'
      d="M 435.70361,960.79501 C 350.22649,949.82238 261.96589,915.39353 193.9882,866.50597 163.20037,844.36434 110.42254,791.79542 88.305497,761.24143 49.96462,708.2749 20.606804,641.3553 8.7012843,579.78731 1.1564833,540.77059 2.1056594,451.27991 10.483615,411.75451 30.112374,319.14968 74.774594,242.06005 149.02313,172.62714 222.44528,103.96702 301.98959,64.109696 406.48828,43.619095 c 44.96331,-8.816681 140.529,-8.838777 188.04918,-0.04116 99.52543,18.420444 182.06463,59.983275 256.52561,129.174095 98.18988,91.23994 145.35936,197.4015 145.35936,327.15153 0,98.99093 -23.71782,173.08006 -82.53285,257.81431 -26.22705,37.78513 -92.88087,100.73366 -133.44443,126.02608 -55.61062,34.6748 -121.23357,60.33256 -184.48001,72.12931 -35.81933,6.68106 -125.18544,9.42686 -160.26153,4.92423 z M 544.61248,668.63813 c 99.75914,-24.22166 161.76345,-119.49651 136.53287,-209.79385 -26.1424,-93.5601 -128.0682,-151.41024 -225.21172,-127.8236 -34.4769,8.37091 -60.6477,22.50957 -86.81216,46.89947 -74.79093,69.71819 -74.83819,174.84659 -0.10308,243.55666 49.55119,45.56053 112.53023,62.4749 175.60067,47.16132 z"
    />
  </g>
</svg>

const logo_btn_filter_link = <svg xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 1000 1000"
>
  <g>
    <path fill='white'
      d="m 839.13562,990.34075 c -29.57916,-9.80167 -47.77206,-22.51396 -66.75179,-46.64282 l -7.83282,-9.95778 -292.2135,-1.08702 C 181.46009,931.57107 180.00752,931.52649 154.64689,922.90111 89.784105,900.84066 37.048095,848.14524 14.695818,783.05761 2.0661707,746.28139 2.0661707,686.55501 14.695818,649.77879 36.825233,585.34017 86.869331,534.59283 152.12462,510.41885 l 24.12285,-8.93639 320.02259,-2.04433 320.02255,-2.04437 29.28674,-14.47779 c 35.27426,-17.43768 57.25443,-39.89067 74.32581,-75.92461 11.09419,-23.4174 12.26739,-29.41576 12.26739,-62.72089 0,-33.30513 -1.1732,-39.30349 -12.26739,-62.72088 -17.07235,-36.03604 -39.0514,-58.48713 -74.32829,-75.92461 l -29.28919,-14.47779 -290.29503,-1.08752 -290.29505,-1.08749 -8.01866,10.19406 c -14.95065,19.00667 -28.11301,29.60621 -49.4932,39.8564 C 148.1947,253.40107 107.7417,253.48387 77.39573,239.22887 47.498505,225.18475 34.179573,212.71691 18.997457,184.56235 6.9677052,162.25364 5.8251341,157.27659 5.8251341,127.18419 5.8251341,97.091777 6.9677052,92.114727 18.997457,69.806022 33.666242,42.60338 45.828841,30.856071 75.040965,15.676166 91.925346,6.9022401 99.691061,5.3875989 127.79073,5.3875989 c 28.09968,0 35.86539,1.5146412 52.74977,10.2885671 10.88959,5.6587 25.18002,14.81617 31.75653,20.349929 14.68863,12.359685 34.36245,50.741761 37.81695,73.777935 l 2.56395,17.09767 285.47577,1.11036 285.47576,1.11039 25.66102,9.99582 c 51.30801,19.98615 84.06821,46.1781 112.20134,89.70554 44.37948,68.66358 44.37948,162.22951 0,230.89309 -28.51458,44.11761 -69.75657,75.79552 -120.41793,92.49278 -19.66774,6.4822 -45.96913,7.18439 -339.19715,9.0561 l -317.87619,2.02902 -25.89377,12.26739 c -36.03987,17.07417 -58.487435,39.05116 -75.92461,74.33286 -13.680849,27.68132 -14.477787,31.34314 -14.477787,66.52304 0,35.1799 0.796938,38.84171 14.477787,66.52303 17.437175,35.2817 39.88474,57.25869 75.92461,74.33286 l 25.89377,12.26739 281.56,1.08946 281.55999,1.08943 2.73785,-18.53385 c 3.40449,-23.04719 22.82808,-60.33283 38.14285,-73.21937 6.34477,-5.33877 20.4456,-14.33672 31.33519,-19.99542 16.82437,-8.74272 24.74999,-10.30128 52.74977,-10.37308 30.17439,-0.0775 35.00867,1.02527 57.37816,13.08782 28.15456,15.18212 40.6224,28.50105 54.66652,58.39827 20.81192,44.30469 10.29799,102.23813 -24.95176,137.48793 -29.47651,29.47646 -83.6751,43.81954 -120.0435,31.76808 z"
    />
  </g>
</svg>

// Delete all local node variable : local_aggregation when we switch general aggregation
const delete_local_aggregation = (data: SankeyData) => {
  Object.values(data.nodes).filter(n => n.local !== undefined).forEach(n => {
    if (n.local) {
      delete n.local.local_aggregation
    }
  })
}

export const addSimpleLevelDropDown: addSimpleLevelDropDownFType = (
  applicationData,
  applicationDraw,
  node_function,
  link_function,
) => {
  const { new_data } = applicationData

  const level_taggs= new_data.drawing_area.sankey.getTagGroupsAsDict('level_taggs')

  if (Object.keys(level_taggs).includes('Primaire')) {

    if (Object.keys(level_taggs['Primaire'].tags).length < 2) {
      return <></>
    }
    const tmp = Object.entries(level_taggs['Primaire'].tags).filter(tag => tag[1].selected)
    const selected = tmp.length > 0 ? tmp[0][0] : ''
    return (
      <>
        {<Select
          key={level_taggs['Primaire'].name}
          value={selected}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            // delete_local_aggregation(data)
            handleSimpleDropdown(evt, level_taggs['Primaire'])
            redrawSankeyWithSelectedTag(
              applicationData,
              applicationDraw,
              node_function,
              link_function
            )
          }}>{
            Object.entries(level_taggs['Primaire'].tags).map(([tag_key, tag], i) => {
              return (<option key={i} value={tag_key}>{tag.name}</option>)
            })}
        </Select>}
      </>)
  } else {
    return <></>
  }

}

export const AddAllDropDownNode: FunctionComponent<addAllDropDownNodeFType> = ({
  applicationContext,
  ComponentUpdater,
  applicationData,
  level,
  node_function,
  link_function,
  applicationDraw }
) => {
  const { new_data } = applicationData
  const { t } = applicationContext
  const { GetSankeyMinWidthAndHeight } = applicationDraw
  const [, setForceUpdate] = useBoolean()
  const node_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('node_taggs')
  const flux_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('flux_taggs')
  const data_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')
  const level_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('level_taggs')
  const { nodesColorMap, nodes_dict } = new_data.drawing_area.sankey
  let banner_grouptag: [string, Class_TagGroup][] | [string, Class_TagGroupNodeLevel][] = Object.entries(node_taggs).filter(([, tags_group]) => tags_group.banner !== 'none')
  if (level) {
    const nb_level_tag = Object.values(level_taggs).filter(tags_group => (Object.keys(tags_group.tags).length > 0)).length
    if (nb_level_tag > 1) {
      banner_grouptag = Object.entries(level_taggs).filter(([, tags_group]) => tags_group.name !== 'Primaire' && Object.keys(tags_group.tags).length > 0)
    } else {
      banner_grouptag = Object.entries(level_taggs).filter(([, tags_group]) => Object.keys(tags_group.tags).length > 1)
    }
  }

  const redrawNodeLinkLegend = () => {
    new_data.drawing_area.sankey.nodes_list.forEach(n => n.reset())
    new_data.drawing_area.sankey.links_list.forEach(l => l.reset())
    console.log(new_data.drawing_area.legend)
    new_data.drawing_area.legend.reset()
    ComponentUpdater.updateComponenSaveInCache.current(false)
  }

  const allDD = banner_grouptag.map(([, tags_group]) => {
    const tags_selected = Object.entries(node_taggs).filter((k) => { return k[1] == tags_group })[0]

    // Create a btn that can either be a switch to activate tag color palette
    // or in some case for level tag activating or deactivating antagonazing tags
    let btn_switch = <></>
    if (tags_group.banner !== 'level') {
      btn_switch = <Switch
        justifySelf='end'
        alignSelf='center'
        height='1rem'
        isChecked={nodesColorMap == tags_selected[0]}
        onChange={evt => {
          Object.values(node_taggs).forEach(tags_group => tags_group.show_legend = false)
          Object.values(data_taggs).forEach(tags_group => tags_group.show_legend = false)

          new_data.drawing_area.sankey.nodesColorMap = 'no_colormap'
          if (evt.target.checked) {

            new_data.drawing_area.sankey.nodesColorMap = tags_selected[0]
            node_taggs[tags_selected[0]].show_legend = true
          }
          redrawSankeyWithSelectedTag(applicationData, applicationDraw, node_function, link_function)
          setForceUpdate.toggle()
        }}
      />
    }
    else if (level && Object.values(tags_group.tags).length > 0) {
      const tags_group_node_level = tags_group as Class_TagGroupNodeLevel
      btn_switch = ((tags_group_node_level.siblings !== undefined) && (tags_group_node_level.siblings.length > 0)) ?
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={tags_group_node_level.activated}
          icon={tags_group_node_level.activated ? <FaEye style={{ fill: 'rgb(120, 194, 173)' }} /> : <FaEyeSlash />}
          onChange={evt => {
            tags_group_node_level.activated = evt.target.checked
            const first_antagonist_tag = level_taggs[tags_group_node_level.siblings[0]] as Class_TagGroupNodeLevel
            // Respectively activate and desactivate in the two antagonist tags  group
            // Same as of current tag group
            first_antagonist_tag.siblings.forEach(sibling => (level_taggs[sibling] as Class_TagGroupNodeLevel).activated = tags_group_node_level.activated)
            // Opposed to current tag group
            tags_group_node_level.siblings.forEach(sibling => (level_taggs[sibling] as Class_TagGroupNodeLevel).activated = !tags_group_node_level.activated)
            redrawSankeyWithSelectedTag(
              applicationData, applicationDraw, node_function, link_function
            )
            setForceUpdate.toggle()
          }}
        /> :
        <></>
    }

    // Create the tag selector
    // It can either select one tag at the time or multiple at the time
    let selector = <></>
    if (tags_group.banner == 'one') {
      selector = <Select
        key={tags_group.name}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          handleSimpleDropdown(evt, tags_group)
          redrawSankeyWithSelectedTag(applicationData, applicationDraw, node_function, link_function)
          setForceUpdate.toggle()
        }}>{
          Object.entries(tags_group.tags).map(([tag_key, tag], i) => {
            return (<option key={i} value={tag_key}>{tag.name}</option>)
          })}
      </Select>
    }
    else if (tags_group.banner === 'level' && Object.values(tags_group.tags).length > 0) {
      if (Object.keys(tags_group.tags).length < 1) {
        return <></>
      }
      const tmp = Object.entries(tags_group.tags).filter(tag => tag[1].selected)
      const selected = tmp.length > 0 ? tmp[0][0] : ''

      selector = <Select
        key={tags_group.name}
        defaultValue={selected}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // delete_local_aggregation(data)
          handleSimpleDropdown(evt, tags_group)
          redrawSankeyWithSelectedTag(
            applicationData,
            applicationDraw,
            node_function,
            link_function
          )
          setForceUpdate.toggle()
        }}>{
          Object.entries(tags_group.tags).map(([tag_key, tag], i) => {
            return (<option key={i} value={tag_key}>{tag.name}</option>)
          })}
      </Select>
    }
    else if (tags_group.banner == 'multi') {
      const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })

      selector = <MultiSelect
        className={'multidropdown_filter_node_link'}
        // style={{widthMax:'200px', color: 'black' }}
        valueRenderer={(selected: Type_MenuSelectionEntry[]) => {
          return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
        }}
        labelledBy={'dropdown_node_filter'}
        overrideStrings={{
          'selectAll': 'Tout sélectionner',
        }}
        value={selected}
        options={options}
        onChange={(selected: [{ label: string, value: string }]) => {
          HandleMultiDropdown(selected, tags_group, new_data.drawing_area.sankey)
          redrawSankeyWithSelectedTag(applicationData, applicationDraw, node_function, link_function)
          setForceUpdate.toggle()
        }}
      />
    }
    return (
      <Box layerStyle='menuconfig_grid'>
        <Box layerStyle='menuconfigpanel_option_name' >
          {tags_group.name}
        </Box>
        <Box layerStyle='popover_sidebar_row_tag_filter'>
          <OSTooltip label={t('Banner.ndd_lst')}>
            {selector}
          </OSTooltip>
          <OSTooltip label={t('Banner.ndd_chk')} >
            <Box
              justifySelf='end'
            >
              {btn_switch}
            </Box>
          </OSTooltip>
        </Box>
      </Box>
    )
  })
  return (<>{allDD}</>)
}

/**
 *
 *
 * @param {React.ChangeEvent<HTMLSelectElement>} evt
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const handleSimpleDropdown = (
  evt: React.ChangeEvent<HTMLSelectElement>,
  tags_group: Class_TagGroup,
) => {
  const val = evt.target.value
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
}

/**
 *
 *
 * @param {[{ label: string, value: string }]} selected
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const HandleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: Class_TagGroup, sankey_data: Class_Sankey,
) => {
  const tab_sel = selected.map((d) => {
    return d.value
  })
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
  // Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
  if (tab_sel.length == 0 && Object.values(sankey_data.getTagGroupsAsDict('data_taggs')).map(dt => dt.name).includes(tags_group.name)) {
    Object.entries(tags_group.tags)[0][1].selected = true
  }
}



declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyData }
  }

export const setDiagram: setDiagramFuncType = (
  the_diagram: string,
  set_data: (d: SankeyData) => void,
  convert_data: ConvertDataFuncType,
  DefaultSankeyData: () => SankeyData,
) => {
  const sous_filieres = window.sankey.sous_filieres

  const new_data = JSON.parse(
    JSON.stringify(
      window.sankey[sous_filieres[the_diagram]]
    )
  ) as SankeyData
  convert_data(new_data, DefaultSankeyData)
  d3.select(' .opensankey #svg').on('.zoom', null)
  set_data({ ...new_data })
}

const redrawNodeLinkLegend = (
  applicationData: applicationDataType,
  node_function: NodeFunctionTypes,
  link_function: LinkFunctionTypes,
  ComponentUpdater: ComponentUpdaterType,
  applicationDraw: applicationDrawType
) => {
  node_function.RedrawNodes(Object.values(applicationData.display_nodes))
  link_function.RedrawLinks(Object.values(applicationData.display_links))
  applicationDraw.reDrawLegend()
  ComponentUpdater.updateComponenSaveInCache.current(false)
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export const ToolbarBuilder: FunctionComponent<ToolbarBuilderFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  filter,
  set_current_filter,
  detail_level,
  url_prefix,
  first_selected_node,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  additional_link_visual_filter_content,
  node_function,
  link_function,
  ComponentUpdater,
  applicationDraw
}) => {

  const { new_data } = applicationData
  const { sankey } = new_data.drawing_area
  const { t } = applicationContext
  // const { ref_getter_mode_selection, ref_setter_mode_selection } = applicationState
  const { GetSankeyMinWidthAndHeight } = applicationDraw

  // ===================Create hooks used in this component========================

  const [s_is_data_type_reconcilied, sIsDataTypeReconcilied] = useState(['reconciled', 'free_value', 'free_interval'].includes(new_data.show_structure))
  const [s_force_update, sforceUpdate] = useBoolean()
  const data_type_not_reconcilied = ['data', 'structure', 'free_value', 'free_interval'].includes(new_data.show_structure)
  const [s_type_value, sTypeValue] = useState<'data' | 'structure' | 'reconciled'>(data_type_not_reconcilied ? (new_data.show_structure as 'data' | 'structure' | 'reconciled') : 'reconciled')
  const [mode_selection, sModeSelection] = useState('ln')
  const [, setForceUpdate] = useBoolean()
  let btn_mouse_mode_edition = <></>

  // ref_getter_mode_selection.current = mode_selection
  // ref_setter_mode_selection.current = sModeSelection

  const node_filter = Object.entries(sankey.getTagGroupsAsDict('node_taggs')).filter(([, v]) => v.banner !== 'none').length > 0
  const flux_filter = Object.entries(sankey.getTagGroupsAsDict('flux_taggs')).filter(([, v]) => v.banner !== 'none').length > 0
  const level_filter = Object.entries(sankey.getTagGroupsAsDict('level_taggs')).length > 0
  const logo_btn_fs = s_force_update ? faCompress : faExpand

  /**
   * Change the mouse behavior
   */
  // const setSelectionMode = (val: string) => {
  //   sModeSelection(val)
  //   //- trigger update
  //   const tutu = filter
  //   set_current_filter(filter + 1)
  //   set_current_filter(tutu)
  //   d3.selectAll(' .opensankey #svg #path-flux').remove()
  //   if (val == 's' && (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 || first_selected_node.current)) {
  //     data.nodes = Object.fromEntries(Object.entries(data.nodes).filter(n => n[1].name != 'node_tmp'))
  //     first_selected_node.current = undefined
  //   }
  // }

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  let max_link_value = 0
  // TODO re implement it with new value class

  // Object.values(sankey.links_dict).forEach(link => {
  //   const new_max_link_value = FindMaxLinkValue(
  //     max_link_value,
  //     link.value
  //   )
  //   max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  // })
  max_link_value += 1

  const redrawNodeLinkLegend = () => {
    sankey.nodes_list.forEach(n => n.reset())
    sankey.links_list.forEach(l => l.reset())
    new_data.drawing_area.legend.reset()

    ComponentUpdater.updateComponenSaveInCache.current(false)
  }

  const legend_filter = <Box
    as='span'
    layerStyle='popover_sidebar_row_tag_filter'
  >
    <Box textStyle='h2'>{t('Menu.group')}</Box>
    <Box textStyle='h2'>{t('Menu.color')}</Box>
  </Box>



  // ===================Create the popover diplayed near the buttons========================
  // Checkbox that adjust the label position according to the link stroke width

  //Popover element to handle filter on links, it contians :
  // - filter on link (if value of link is inferior to filter then the link is not displayed)
  // - filter on link label
  const popover_link_visual_filter = <Popover
    variant='toolbar_popover_window'
    placement='left'
    id="popover_link_value_filter"
  >
    <PopoverTrigger>
      <Button
        variant='toolbar_button_3'
        id='btn_open_popover_link_value_filter'
      >
        <FontAwesomeIcon icon={faSliders} />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverCloseButton />
      <PopoverHeader >{t('Banner.p_aff')}</PopoverHeader>
      <PopoverBody >
        <Box
          layerStyle='menuconfigpanel_grid'
          gridTemplateColumns='1fr'
        >
          <Text
            fontSize='h3'
          >
            {t('Banner.p_aff_filtre_links')}
          </Text>

          <Box
            layerStyle='popover_sidebar_layout_filter'
          >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Banner.filtre')}
            </Box>
            <Slider
              min={0}
              max={max_link_value}
              defaultValue={filter}
              onChange={evt => {
                set_current_filter(Number(evt))
                setForceUpdate.toggle()
              }
              } >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>

            <NumberInput
              min={0}
              max={filter}
              defaultValue={filter}
              onChange={(evt) => {
                let tmp = +evt
                if (tmp > max_link_value) {
                  tmp = max_link_value
                }
                set_current_filter(tmp)
                setForceUpdate.toggle()
              }}>
              <NumberInputField />
            </NumberInput>
          </Box>

          <Box
            layerStyle='popover_sidebar_layout_filter'
          >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Banner.fl')}
            </Box>
            <Slider
              min={0}
              max={max_link_value}
              value={new_data.filter_label}
              onChange={(evt) => {
                applicationData.new_data.filter_label = +evt
                setForceUpdate.toggle()
                redrawNodeLinkLegend()
              }}>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>

            <NumberInput
              min={0}
              max={max_link_value}
              value={new_data.filter_label}
              onChange={(evt) => {
                let tmp = +evt
                if (tmp > max_link_value) {
                  tmp = max_link_value
                }
                applicationData.new_data.filter_label = tmp
                setForceUpdate.toggle()
                redrawNodeLinkLegend()
              }}
            >
              <NumberInputField />
            </NumberInput>
          </Box>
          {additional_link_visual_filter_content}
        </Box>
      </PopoverBody>
    </PopoverContent>
  </Popover>


  const struc_data_reconciled = <Popover
    variant='toolbar_popover_window'
    placement='left'
    id='popover_data_type'
  >
    <PopoverTrigger>
      <Button
        variant='toolbar_button_5'
        id='btn_open_popover_data_type'
      >
        <FontAwesomeIcon icon={faDiagramProject} />
      </Button>
    </PopoverTrigger>

    <PopoverContent>
      <PopoverCloseButton />
      <PopoverHeader >{t('Banner.sdr')}</PopoverHeader>
      <PopoverBody>
        <Box
          layerStyle='menuconfig_grid'
        >
          <Box fontStyle='h3' >
            {t('Banner.type_value')}
          </Box>

          <Select
            value={s_type_value}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              new_data.show_structure = evt.target.value as 'data' | 'structure' | 'reconciled'
              sTypeValue(evt.target.value as 'data' | 'structure' | 'reconciled')
              if (evt.target.value === 'reconciled') {
                sIsDataTypeReconcilied(true)
              } else {
                sIsDataTypeReconcilied(false)
              }
              setForceUpdate.toggle()
              redrawNodeLinkLegend()
            }}>
            <option key='structure' value='structure' >{t('Banner.t_v_s')}</option>
            <option key='data' value='data' >{t('Banner.t_v_c')}</option>
            <option key='reconciled' value='reconciled' >{t('Banner.t_v_r')}</option>
          </Select>
        </Box>

        <Box
          layerStyle='menuconfig_grid'
          display={s_is_data_type_reconcilied ? '' : 'none' }
        >
          <Box fontStyle='h3' >
            {t('Banner.indetermined_value')}
          </Box>
          <Select
            value={new_data.show_structure}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              new_data.show_structure = evt.target.value as 'reconciled' | 'free_value' | 'free_interval'
              setForceUpdate.toggle()
              redrawNodeLinkLegend()
            }}>
            <option key='none' value='reconciled' >{t('Banner.t_v_s')}</option>
            <option key='free_interval' value='free_interval' >{t('Banner.t_v_i')}</option>
            <option key='free_value' value='free_value' >{t('Banner.t_v_pv')}</option>
          </Select>
        </Box>
      </PopoverBody>
    </PopoverContent>
  </Popover>
  const node_tag_filter_content = <AddAllDropDownNode
    applicationContext={applicationContext}
    ComponentUpdater={ComponentUpdater}
    applicationData={applicationData}
    level={false}
    node_function={node_function}
    link_function={link_function}
    applicationDraw={applicationDraw}
  />

  //Popover element to handle node tags
  // Its a list of dropdown for each groupNodeTag where we can choose wiche group to apply and wiche tag from these group to display when selected
  const filter_color_node = <Popover
    variant='toolbar_popover_window'
    placement='left'
    id='popover_node_tag_filter'
  >
    <PopoverTrigger>
      <Button
        variant='toolbar_button_4'
        id='btn_open_popover_node_tag_filter'
      >
        {logo_btn_node}
      </Button>
    </PopoverTrigger>

    <PopoverContent>
      <PopoverCloseButton />
      <PopoverHeader >{t('Banner.fdn')}</PopoverHeader>
      <PopoverBody>
        {legend_filter}
        <>{(Object.entries(sankey.getTagGroupsAsDict('node_taggs')).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
          {node_tag_filter_content}</>
        ) : (<>
          <Input placeholder="Pas de filtrage" isDisabled /></>)
        }</>
      </PopoverBody>
    </PopoverContent>
  </Popover>

  //Popover element to handle the display of data tags
  const filter_data = <Popover
    variant='toolbar_popover_window'
    placement='left'
    id='popover_data_tag_filter'
  >
    <PopoverTrigger>
      <Button
        variant='toolbar_button_4'
        id='btn_open_popover_data_tag_filter'
      >
        <FontAwesomeIcon icon={faDatabase} />
      </Button>
    </PopoverTrigger>

    <PopoverContent>
      <PopoverCloseButton />
      <PopoverHeader >{t('Banner.sdd')}</PopoverHeader>
      <PopoverBody>
        {legend_filter}
        <DataTagSelector
          applicationData={applicationData}
          applicationDraw={applicationDraw}
          node_function={node_function}
          link_function={link_function}
          ComponentUpdater={ComponentUpdater}
          in_popover={true}
        />
      </PopoverBody>
    </PopoverContent>
  </Popover>

  //Popover element to handle the display of link tags
  const filter_color_link = <Popover
    variant='toolbar_popover_window'
    placement='left'
    id='popover_link_tag_filter'
  >
    <PopoverTrigger>
      <Button
        variant='toolbar_button_4'
        id='btn_open_popover_link_tag_filter'
      >
        {logo_btn_filter_link}
      </Button>
    </PopoverTrigger>

    <PopoverContent>
      <PopoverCloseButton />
      <PopoverHeader >{t('Banner.fdf')}</PopoverHeader>
      <PopoverBody>
        {legend_filter}
        {AddAllDropDownFlux(t, applicationData, node_function, link_function, ComponentUpdater, applicationDraw)}
      </PopoverBody>
    </PopoverContent>
  </Popover>


  // ===========Creation Button to show popover========================

  const button_fullscreen = <>
    <OSTooltip
      placement='left'
      label={s_force_update ? t('Banner.quit_fullscreen') : t('Banner.fullscreen')}
    >
      <Button
        variant='toolbar_button_6'
        id='button_fullscreen'
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
          sforceUpdate.toggle()
        }}
      >
        <FontAwesomeIcon icon={logo_btn_fs} />
      </Button>
    </OSTooltip>
  </>


  // Add button for the edition of the sankey
  if (!window.SankeyToolsStatic) {
    btn_mouse_mode_edition = <>
      {/* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */}
      <OSTooltip
        placement='left'
        label={(mode_selection == 's') ? t('Banner.tooltipLiason') : t('Banner.tooltipSelection')}
      >
        <Button
          variant='toolbar_button_1'
          id='button_selection_edition'
          onClick={() => {
            applicationData.new_data?.drawing_area.switchMode()
            setForceUpdate.toggle()
          }} >
          <FontAwesomeIcon icon={(
            applicationData.new_data?.drawing_area.isInEditionMode() ?
              faShareNodes :
              faArrowPointer
            )}
          />
        </Button>
      </OSTooltip>
    </>

  }

  const btn_aggrega_level = (level_filter) ? <>
    <OSTooltip
      placement='left'
      label={t('Banner.hlp_1_txt_2')}>
      {detail_level}
    </OSTooltip>
  </>:
    <></>

  const btn_link_display = <><OSTooltip placement='left' label={t('Banner.hlp_1_txt_8')}>
    {popover_link_visual_filter}
  </OSTooltip>
  {/* Popover to display the link-filter */}
  </>


  const btn_show_data_type=url_prefix !== '' ?<><OSTooltip placement='left' label={t('Banner.sdr')}>
    {struc_data_reconciled}
  </OSTooltip>
  </>:
  <OSTooltip placement='left' label={t('Banner.tooltipStructure')}>
    <Button variant={'success'} onClick={() => {
      new_data.show_structure = new_data.show_structure == 'reconciled' ? 'structure' : 'reconciled'
      setForceUpdate.toggle()
      redrawNodeLinkLegend()

    }} >
      <FontAwesomeIcon icon={faCodeBranch} />
    </Button>
  </OSTooltip>

  const btn_show_node_filter = (node_filter) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_node_tag_filter')}>
      {filter_color_node}
    </OSTooltip>
  </>:
  <></>

  const btn_show_link_filter = (flux_filter) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_link_tag_filter')}>
      {filter_color_link}
    </OSTooltip></> : <></>

  const btn_show_data_filter = (Object.values(new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')).length > 0) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_data_tag_filter')}>
      {filter_data}
    </OSTooltip></> : <></>

  const btn_show_help_in_static = window.SankeyToolsStatic ? <OSTooltip placement='left' label={t('Banner.tooltipHelp')}>
    <Button variant='info' onClick={() => { never_see_again.current = false; localStorage.removeItem('dontSeeAggainWelcome'), dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current!(true) }} >
      ?
    </Button>
  </OSTooltip> : <></>


  // ===================Assemble different item for the toolbar========================

  return <>
    {btn_mouse_mode_edition}

    {/* Add the button to choose the aggregation level  */}
    {btn_aggrega_level}

    {/* Popover to display the link visual filter */}
    {btn_link_display}

    {/* Button to display node, link & data Tags filter */}
    {btn_show_node_filter}
    {btn_show_link_filter}
    {btn_show_data_filter}
    {btn_show_data_type}

    {stretchButtons(applicationData, GetSankeyMinWidthAndHeight, t)}

    {btn_show_help_in_static}

    {button_fullscreen}
  </>
}
/**
 *  Function that return stretch buttons for the sideBar
 *
 * @param {*} applicationData
 * @param {GetSankeyMinWidthAndHeightFuncType} GetSankeyMinWidthAndHeight
 * @param {TFunction} t
 * @return {*}
 */
const stretchButtons: stretchButtonsFType = (
  applicationData,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  t: TFunction
) => {
  return <> <OSTooltip placement='left' label={t('Banner.tooltipAdjustH')}>
    <Button variant='toolbar_button_6' onClick={() => { AdjustSankeyZone(applicationData, GetSankeyMinWidthAndHeight) }} >
      <FontAwesomeIcon icon={faArrowsLeftRight} />
    </Button>
  </OSTooltip>
  <OSTooltip placement='left' label={t('Banner.tooltipAdjustV')} >
    <Button variant='toolbar_button_6' onClick={() => { AdjustSankeyZone(applicationData, GetSankeyMinWidthAndHeight, false, true) }} >
      <FontAwesomeIcon icon={faArrowsUpDown} />
    </Button>
  </OSTooltip></>
}


/**
 * Function that generate dropdown for each groupTag of linkTags
 *
 * @param {TFunction} t
 * @param {TagsCatalog} fluxTags
 * @param {applicationDataType} applicationData
 * @param {NodeFunctionTypes} node_function
 * @param {LinkFunctionTypes} link_function
 * @param {ComponentUpdaterType} ComponentUpdater
 * @param {ComponentUpdaterType} applicationDraw
 * @return {JSX.Element}
 */
const AddAllDropDownFlux: AddAllDropDownFluxFType = (
  t: TFunction,
  applicationData,
  node_function,
  link_function,
  ComponentUpdater,
  applicationDraw
) => {
  const [, setForceUpdate] = useBoolean()
  const { new_data } = applicationData
  const node_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('node_taggs')
  const flux_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('flux_taggs')
  const data_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')
  const level_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('level_taggs')
  const { linksColorMap, links_dict} = new_data.drawing_area.sankey
  const banner_grouptag = Object.values(flux_taggs).filter(tags_group => { return ((tags_group.banner == 'one') || (tags_group.banner == 'multi')) })
  const allDD = banner_grouptag.map(tags_group => {
    const the_tags_group = tags_group
    const tags_selected = Object.entries(flux_taggs).filter((k) => { return k[1] == the_tags_group })[0]

    // Create the tag selector
    // It can either select one tag at the time or multiple at the time
    let selector = <></>
    if (the_tags_group.banner == 'one') {
      selector = <Select
        key={the_tags_group.name}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          handleSimpleDropdown(evt, the_tags_group)
          redrawSankeyWithSelectedTag(applicationData, applicationDraw, node_function, link_function)
          setForceUpdate.toggle()
        }}>{
          Object.entries(the_tags_group.tags).map(([tag_key, tag], i) => {
            return (<option key={i} value={tag_key}>{tag.name}</option>)
          })}
      </Select>
    } else {
      const options = Object.entries(the_tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(the_tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      selector = <MultiSelect
        className={'multidropdown_filter_node_link'}
        // style={{ color: 'black',width:'200px' }}
        valueRenderer={(selected: Type_MenuSelectionEntry[]) => {
          return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
        }}
        labelledBy={'dropdown_node_filter'}
        overrideStrings={{
          'selectAll': 'Tout sélectionner',
        }}
        value={selected}
        options={options}
        onChange={(selected: [{ label: string, value: string }]) => {
          HandleMultiDropdown(selected, the_tags_group, new_data.drawing_area.sankey)
          redrawSankeyWithSelectedTag(applicationData, applicationDraw, node_function, link_function)
          setForceUpdate.toggle()

        }}
      />
    }

    return (
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
        >
          {the_tags_group.name}
        </Box>
        <Box
          as='span'
          layerStyle='popover_sidebar_row_tag_filter'
        >
          <OSTooltip label={t('Banner.ndd_lst')}>
            {selector}
          </OSTooltip>
          <OSTooltip label={t('Banner.ndd_chk')} >
            <Box
              justifySelf='end'
              alignSelf='center'
              height='1rem'
            >
              <Switch
                isChecked={new_data.drawing_area.sankey.linksColorMap == tags_selected[0]}
                onChange={evt => {
                  Object.values(flux_taggs).forEach(tags_group => { tags_group.show_legend = false })
                  Object.values(data_taggs).forEach(tags_group => tags_group.show_legend = false)

                  new_data.drawing_area.sankey.linksColorMap = 'no_colormap'
                  if (evt.target.checked) {
                    new_data.drawing_area.sankey.linksColorMap = tags_selected[0]
                    flux_taggs[tags_selected[0]].show_legend = true
                  }
                  setForceUpdate.toggle()
                  redrawNodeLinkLegend(applicationData, node_function, link_function, ComponentUpdater, applicationDraw)
                }}
              />
            </Box>
          </OSTooltip>
        </Box>
      </Box>)
  })
  return (<>{allDD.map((c, i) => { return <React.Fragment key={i}>{c}</React.Fragment> })}</>)
}

/** Function that return a simple or multiple dropdown of groupTag of data and links
 This allow us to choose wich grouptag to select and wich tag of these group to display*/
export const DataTagSelector: FunctionComponent<DataTagSelectorType> = ({
  applicationData,
  applicationDraw,
  node_function,
  link_function,
  ComponentUpdater,
  in_popover
}) => {
  const { data, new_data } = applicationData
  const [, setForceUpdate] = useBoolean()
  const data_taggs = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')
  const banner_grouptag = Object.entries(data_taggs).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
  const allDD = banner_grouptag.map(([, tags_group]) => {
    let selector = <></>
    if (tags_group.banner == 'one') {
      let selected = ''
      if (Object.entries(tags_group.tags).filter(([, v]) => v.selected).length > 0) {
        selected = Object.entries(tags_group.tags).filter(([, v]) => v.selected)[0][0]
      }
      selector = <Select
        key={tags_group.name}
        defaultValue={selected}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            // let had_suffix = false
            // const pl = Object.entries(links_dict).map(l => {
            //   const suffixeStart = l[0].indexOf('_')
            //   // if (suffixeStart >= 0) {
            //   //   had_suffix = true
            //   //   l[0] = l[0].slice(0, suffixeStart)
            //   //   l[1].idLink = l[0]
            //   //   nodes_dict[l[1].idSource].outputLinksId = nodes_dict[l[1].idSource].outputLinksId.filter(nl => nl.indexOf('_') == -1)
            //   //   nodes_dict[l[1].idTarget].inputLinksId = nodes_dict[l[1].idTarget].inputLinksId.filter(nl => nl.indexOf('_') == -1)

            //   //   //Ajoute dans les noeuds source/target les id de flux
            //   //   const ind_in_src = nodes_dict[l[1].idSource].outputLinksId.indexOf(l[1].idLink)
            //   //   if (ind_in_src == -1) {
            //   //     nodes_dict[l[1].idSource].outputLinksId.push(l[0])
            //   //   }
            //   //   const ind_in_trgt = nodes_dict[l[1].idTarget].inputLinksId.indexOf(l[1].idLink)
            //   //   if (ind_in_trgt == -1) {
            //   //     nodes_dict[l[1].idTarget].inputLinksId.push(l[0])
            //   //   }
            //   // }
            //   return l
            // })
            // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
            // const pureLinks = Object.fromEntries(pl)
            // links_dict = pureLinks
            // if (had_suffix) {
            //   data.linkZIndex = Object.keys(pureLinks)
            // }
            handleSimpleDropdown(evt, tags_group)
            // redrawSankeyWithSelectedTag(
            //   applicationData,
            //   GetSankeyMinWidthAndHeight,
            //   node_function,
            //   link_function
            // )
            new_data.drawing_area.sankey.links_list.forEach(l=>l.reset())
            setForceUpdate.toggle()
            new_data.menu_configuration.updateComponentMenu.current()
        }}>
        {
          Object.entries(tags_group.tags).map(([tag_key, tag], i) => {
            return (<option key={i} value={tag_key} >{tag.name}</option>)
          })}
      </Select>
    }
    else {
      const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name, 'disabled': ((selected.length < 2 && tag[1].name == selected[0].label)) } })
      selector = <MultiSelect
        className={'multidropdown_filter_node_link'}
        labelledBy={'dropdown_link_filter'}
        overrideStrings={{
          'selectAll': 'Tout sélectionner',
        }}
        value={selected}
        options={options}
        onChange={(selected: [{ label: string, value: string }]) => {
          HandleMultiDropdown(selected, tags_group, new_data.drawing_area.sankey)
        }}
      />
    }

    return (
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        <Box
          as='span'
          layerStyle='menuconfigpanel_option_name'
        >
          {tags_group.name}
        </Box>
        <Box
          layerStyle={in_popover ? 'popover_sidebar_row_tag_filter' : ''}
        >
          {selector}
          {
            in_popover ?
              <Switch
                justifySelf='end'
                alignSelf='center'
                height='1rem'
                isChecked={(banner_grouptag.length > 0) ? (Object.values(data.dataTags).slice(banner_grouptag.length - 1, banner_grouptag.length)[0].show_legend) : false}
                onChange={evt => {
                  //Déselecitonne tous les type de tag
                  Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                  Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)
                  Object.values(data.links).forEach(el => {
                    el.colorTag = 'no_colormap'
                  })
                  data.linksColorMap = 'no_colormap'
                  //Met le dernier dataTag en tant que couleur a suivre pour les flux
                  if (evt.target.checked) {
                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.linksColorMap = 'dataTags_' + Object.keys(data.dataTags).slice(banner_grouptag.length - 1, banner_grouptag.length)[0]
                    Object.values(data.dataTags).slice(banner_grouptag.length - 1, banner_grouptag.length)[0].show_legend = evt.target.checked
                  }
                  setForceUpdate.toggle()
                  redrawNodeLinkLegend(applicationData, node_function, link_function, ComponentUpdater, applicationDraw)
                }}
              /> :
              <></>
          }
        </Box>
      </Box>)
  })

  return <>{allDD}</>
}

const redrawSankeyWithSelectedTag = (
  applicationData: applicationDataType,
  applicationDraw: applicationDrawType,
  node_function: NodeFunctionTypes,
  link_function: LinkFunctionTypes
) => {
  const { data, new_data } = applicationData
  const { GetSankeyMinWidthAndHeight } = applicationDraw
  const old_displayed_nodes = Object.values(applicationData.display_nodes).map(n => n.idNode)
  const old_displayed_links = Object.values(applicationData.display_links).map(l => l.idLink)

  node_function.recomputeDisplayedElement()

  const new_displayed_nodes = Object.values(applicationData.display_nodes).map(n => n.idNode)
  const new_displayed_links = Object.values(applicationData.display_links).map(l => l.idLink)

  // Delete Nodes/Links no longer in displayed elements
  DeleteGNodes(old_displayed_nodes.filter(nid => !new_displayed_nodes.includes(nid)).map(id => id))
  DeleteGLinks(old_displayed_links.filter(lid => !new_displayed_links.includes(lid)).map(id => id))

  // Create Nodes/Links that are now visually present with the new aggregation levels
  const node_to_add_svg = new_displayed_nodes.filter(nid => !old_displayed_nodes.includes(nid)).map(id => applicationData.data.nodes[id])
  node_function.CreateNodesOnSVG(node_to_add_svg)
  const ll = new_displayed_links.filter(lid => !old_displayed_links.includes(lid))
  node_function.RedrawNodes(Object.values(applicationData.display_nodes))
  link_function.RedrawLinks(Object.values(applicationData.display_links))

  new_data.drawing_area.sankey.nodes_list.forEach(n => n.reset())
  new_data.drawing_area.sankey.links_list.forEach(l => l.reset())
  new_data.drawing_area.legend.reset()

  if (ll.length != 0) {
    link_function.CreateLinksOnSVG(ll.map(id => data.links[id]))
    // Still redraw already present nodes/links because they can have some shape variation with the appearence of new nodes/links
    //redrawNodeLinkLegend(applicationData,node_function,link_function,ComponentUpdater,applicationDraw)
    actualizeDrawAreaFrame(applicationData, GetSankeyMinWidthAndHeight)
  }
}