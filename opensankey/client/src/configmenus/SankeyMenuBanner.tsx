// External Imports
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
import {
  faShareNodes,
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

// Internal Types / Classes
import {
  SankeyData
} from '../types/LegacyType'
import {
  Class_TagGroup,
  Class_LevelTagGroup
} from '../types/Tag'
import {
  addAllDropDownNodeFType,
  AddAllDropDownFluxFType,
  addSimpleLevelDropDownFType,
  DataTagSelectorType,
  setDiagramFuncType,
  stretchButtonsFType,
  ToolbarBuilderFType,
} from './types/SankeyMenuBannerTypes'

// Internal functions / Components
import {
  OSTooltip
} from '../types/Utils'
import {
  Type_MenuSelectionEntry
} from '../topmenus/SankeyMenuTop'
import {
  InitalizeSelectorDetailNodes
} from '../OSModule'


// CONSTANTS ============================================================================

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

// FUNCTIONS ============================================================================

export const setDiagram: setDiagramFuncType = (
  the_diagram,
  applicationData
) => {
  const sous_filieres = window.sankey.sous_filieres

  const new_data = JSON.parse(
    JSON.stringify(
      window.sankey[sous_filieres[the_diagram]]
    )
  )

  applicationData.new_data.fromJSON(new_data)
  // convert_data({ data: new_data } as applicationDataType, DefaultSankeyData) // FIXME when new_data ready for it
  // d3.select(' .opensankey #svg').on('.zoom', null)
  // set_data({ ...new_data })
}


// COMPONENTS ===========================================================================

/**
 * Drop down to select primary level tag
 * @param {*} {
 *   applicationData,
 * }
 * @return {*}
 */
export const AddSimpleLevelDropDown: FunctionComponent<addSimpleLevelDropDownFType> = (
  {
    applicationData
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { new_data } = applicationData
  const level_taggs = new_data.drawing_area.sankey.level_taggs_dict

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_leveltag_filter_updater.current = ()=>setCount(a=>a+1)

  // JSX Component ----------------------------------------------------------------------
  if (Object.keys(level_taggs).includes('Primaire')) {
    const primary_level_tags = level_taggs['Primaire'].tags_list

    if (primary_level_tags.length < 2) {
      return <></>
    }
    else {
      return (
        <>
          {
            <Select
              key={level_taggs['Primaire'].id}
              value={level_taggs['Primaire'].selected_tags_list[0]?.id ?? ''}
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                level_taggs['Primaire'].selectTagsFromId(evt.target.value)
                new_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
                // recall node.draw because selectTagsFromId doesn't lead to applyPositionOnLinks wich compute endpoints 
                // (it isn't done for link not directly displayed after fromJSON)
                new_data.drawing_area.sankey.visible_nodes_list.forEach(n=>n.draw()) 
                new_data.drawing_area.checkAndUpdateAreaSize()
              }}
            >
              {
                level_taggs['Primaire'].tags_list
                  .map(tag => {
                    return (
                      <option
                        key={tag.id}
                        value={tag.id}
                      >
                        {tag.name}
                      </option>)
                  })
              }
            </Select>
          }
        </>
      )
    }
  }
  else {
    return <></>
  }
}

/**
 *
 * Drop down to select node tags
 *
 * @param {*} {
 *   applicationContext,
 *   ComponentUpdater,
 *   applicationData,
 *   level,
 *   node_function,
 *   link_function,
 *   applicationDraw }
 * @return {*}
 */
export const AddAllDropDownNode: FunctionComponent<addAllDropDownNodeFType> = (
  {
    applicationData,
    level
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { new_data } = applicationData
  const { t } = new_data

  // Tag group dicts
  const node_taggs = new_data.drawing_area.sankey.node_taggs_dict
  const level_taggs = new_data.drawing_area.sankey.level_taggs_dict

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_nodetag_filter_updater.current = ()=>setCount(a=>a+1)

  let taggs_in_banner: Class_TagGroup[] | Class_LevelTagGroup[]
  if (level) {
    const nb_of_level_taggs = Object.values(level_taggs).filter(tagg => tagg.has_tags).length
    if (nb_of_level_taggs > 1) {
      taggs_in_banner = Object.values(level_taggs)
        .filter(tagg =>
          (tagg.name !== 'Primaire') &&
          (tagg.has_tags))
    }
    else {
      taggs_in_banner = Object.values(level_taggs)
        .filter(tagg => tagg.has_tags)
    }
  }
  else {
    taggs_in_banner = Object.values(node_taggs)
      .filter(tagg => tagg.banner !== 'none')
  }

  // JSX Components --------------------------------------------------------------------
  const allDD = taggs_in_banner.map(tagg => {
    // Create a btn that can either be a switch to activate tag color palette
    // or in some case for level tag activating or deactivating antagonists tags
    let btn_switch = <></>
    if (
      (tagg instanceof Class_TagGroup) &&
      (tagg.banner !== 'level')
    ) {
      btn_switch = <Switch
        justifySelf='end'
        alignSelf='center'
        height='1rem'
        isChecked={tagg.show_legend}
        onChange={evt => {
          // Reset values
          new_data.drawing_area.sankey.nodes_color_map = 'no_colormap'
          Object.values(node_taggs).forEach(tagg => tagg.show_legend = false)
          // Update this tagg group value
          if (evt.target.checked) {
            new_data.drawing_area.sankey.nodes_color_map = tagg.id
            tagg.show_legend = true
          }
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      />
    }
    else if (
      (level) &&
      (tagg instanceof Class_LevelTagGroup) &&
      (tagg.has_tags)
    ) {
      // Cast type to exclude Class_TagGroup
      const level_tagg = tagg as Class_LevelTagGroup
      // Create swith button
      btn_switch = (
        (level_tagg.siblings !== undefined) &&
        (level_tagg.siblings.length > 0)
      ) ?
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={level_tagg.activated}
          icon={
            level_tagg.activated ?
              <FaEye style={{ fill: 'rgb(120, 194, 173)' }} /> :
              <FaEyeSlash />
          }
          onChange={evt => {
            level_tagg.activated = evt.target.checked
            const first_antagonist_level_tagg = level_taggs[level_tagg.siblings[0]]
            // Respectively activate and desactivate in the two antagonist tags  group
            // Same as of current tag group
            first_antagonist_level_tagg.siblings
              .forEach(sibling => level_taggs[sibling].activated = level_tagg.activated)
            // Opposed to current tag group
            level_tagg.siblings
              .forEach(sibling => level_taggs[sibling].activated = !level_tagg.activated)
            // Refresh this & related component
            new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
          }}
        /> :
        <></>
    }

    // Create the tag selector
    // It can either select one tag at the time or multiple at the time
    let selector = <></>
    if (tagg.banner == 'one') {
      selector = <Select
        key={tagg.name}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // Set tag with given id as selected : other are unselected
          tagg.selectTagsFromId(evt.target.value)
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      >
        {
          tagg.tags_list
            .map(tag => {
              return (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </option>
              )
            })
        }
      </Select>
    }
    else if (
      (tagg.banner === 'level') &&
      tagg.has_tags
    ) {
      if (Object.keys(tagg.tags_dict).length < 1) {
        return <></>
      }
      selector = <Select
        key={tagg.name}
        value={tagg.selected_tags_list[0]?.id ?? ''}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // Set tag with given id as selected : other are unselected
          tagg.selectTagsFromId(evt.target.value)
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      >
        {
          tagg.tags_list
            .map(tag => {
              return (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </option>
              )
            })
        }
      </Select>
    }
    else if (tagg.banner === 'multi') {
      const tags_options = tagg.tags_list
        .map(tag => { return { 'label': tag.name, 'value': tag.id } })
      const selected_tags_options = tagg.selected_tags_list
        .map(tag => { return { 'label': tag.name, 'value': tag.id } })

      selector = <MultiSelect
        className={'multidropdown_filter_node_link'}
        // style={{widthMax:'200px', color: 'black' }}
        valueRenderer={(curr_selected_tags_options: Type_MenuSelectionEntry[]) => {
          return curr_selected_tags_options.length ?
            curr_selected_tags_options.map(({ label }) => label + ', ') :
            'Aucun tag sélectionné'
        }}
        labelledBy={'dropdown_node_filter'}
        overrideStrings={{
          'selectAll': 'Tout sélectionner',
        }}
        value={selected_tags_options}
        options={tags_options}
        onChange={(curr_selected_tags_options: [{ label: string, value: string }]) => {
          // Set tags with given id as selected : other are unselected
          tagg.selectTagsFromIds(curr_selected_tags_options.map(_ => _.value))
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      />
    }

    return (
      <Box layerStyle='menuconfig_grid'>
        <Box layerStyle='menuconfigpanel_option_name' >
          {tagg.name}
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
 * Function that generate dropdown for each groupTag of linkTags
 * @param {TFunction} t
 * @param {*} applicationData
 * @param {*} node_function
 * @param {*} link_function
 * @param {*} ComponentUpdater
 * @param {*} applicationDraw
 * @return {*}
 */
export const AddAllDropDownFlux: FunctionComponent<AddAllDropDownFluxFType> = (
  {
    applicationData
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { new_data } = applicationData
  const { t } = new_data

  // Tag group dicts
  const flux_taggs_dict = new_data.drawing_area.sankey.flux_taggs_dict
  const flux_taggs_with_banner = Object.values(flux_taggs_dict)
    .filter(flux_tagg => {
      return ((flux_tagg.banner === 'one') || (flux_tagg.banner === 'multi'))
    })

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_fluxtag_filter_updater.current = ()=>setCount(a=>a+1)

  // JSX Components --------------------------------------------------------------------
  // Create drop down
  const allDD = flux_taggs_with_banner
    .map(flux_tagg => {
      // Create the tag selector
      // It can either select one tag at the time or multiple at the time
      let selector = <></>
      if (flux_tagg.banner == 'one') {
        selector = <Select
          key={flux_tagg.name}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            // Set correct tag as selected
            flux_tagg.selectTagsFromId(evt.target.value)
            // Update related components (includes this)
            new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
          }}
        >
          {
            flux_tagg.tags_list.map(tag => {
              return (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              )
            })
          }
        </Select>
      }
      else {
        const options = flux_tagg.tags_list
          .map(tag => { return { 'label': tag.name, 'value': tag.id } })
        const options_selected = flux_tagg.tags_list
          .filter(tag => tag.is_selected)
          .map(tag => { return { 'label': tag.name, 'value': tag.id } })
        selector = <MultiSelect
          className={'multidropdown_filter_node_link'}
          valueRenderer={(options_selected: Type_MenuSelectionEntry[]) => {
            return (
              options_selected.length ?
                options_selected.map(({ label }) => label + ', ') :
                'Aucun tag sélectionné')
          }}
          labelledBy={'dropdown_node_filter'}
          overrideStrings={{
            'selectAll': 'Tout sélectionner', // TODO Mettre traduction ici
          }}
          value={options_selected}
          options={options}
          onChange={(options_selected: [{ label: string, value: string }]) => {
            // Set correct tags as selected
            flux_tagg.selectTagsFromIds(options_selected.map(_ => _.value))
            // Update related components (includes this)
            new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
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
            {flux_tagg.name}
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
                  isChecked={new_data.drawing_area.sankey.links_color_map === flux_tagg.id}
                  onChange={evt => {
                    // Reset default colormap for all fluxtaggs
                    Object.values(flux_taggs_dict)
                      .forEach(flux_tagg => { flux_tagg.show_legend = false })
                    new_data.drawing_area.sankey.links_color_map = 'no_colormap'
                    // Update values for this fluxtagg
                    if (evt.target.checked) {
                      new_data.drawing_area.sankey.links_color_map = flux_tagg.id
                      flux_tagg.show_legend = true
                    }
                    // Update related components (includes this)
                    new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
                  }}
                />
              </Box>
            </OSTooltip>
          </Box>
        </Box>)
    })

  // Output -----------------------------------------------------------------------------
  return (<>{allDD.map((c, i) => { return <React.Fragment key={i}>{c}</React.Fragment> })}</>)
}

/**
 * Function that return a simple or multiple dropdown of groupTag of data and links
 * This allow us to choose wich grouptag to select and wich tag of these group to display
 * @param {*} {
 *   applicationData,
 *   applicationDraw,
 *   node_function,
 *   link_function,
 *   ComponentUpdater,
 *   in_popover
 * }
 * @return {*}
 */
export const DataTagSelector: FunctionComponent<DataTagSelectorType> = ({
  applicationData,
  in_popover
}) => {
  // Data -------------------------------------------------------------------------------
  const { new_data } = applicationData
  const data_taggs = new_data.drawing_area.sankey.data_taggs_dict
  const data_taggs_with_banner = Object.values(data_taggs)
    .filter(tagg => { return (tagg.banner == 'one' || tagg.banner == 'multi') })
  let show_legend_for_data_taggs = (data_taggs_with_banner.length > 0) // False if no data taggs
  data_taggs_with_banner
    .forEach(tagg => show_legend_for_data_taggs = show_legend_for_data_taggs && tagg.show_legend)

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_datatag_filter_updater.current = ()=>setCount(a=>a+1)

  // JSX Components --------------------------------------------------------------------
  const allDD = data_taggs_with_banner
    .map(tagg => {
      let selector = <></>
      if (tagg.banner == 'one') {
        const selected_tag_id = tagg.selected_tags_list[0]?.id ?? ''
        selector = <Select
          key={tagg.id}
          value={selected_tag_id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            tagg.selectTagsFromId(evt.target.value)
            new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
          }}
        >
          {
            tagg.tags_list
              .map(tag => {
                return (
                  <option key={tag.id} value={tag.id} >{tag.name}</option>
                )
              })
          }
        </Select>
      }
      else {
        const selected_options = tagg.selected_tags_list
          .map((tag) => { return { 'label': tag.name, 'value': tag.id } })
        const options = tagg.tags_list
          .map((tag) => {
            return {
              'label': tag.name,
              'value': tag.id,
              'disabled': (
                (selected_options.length < 2) &&
                (tag.id == selected_options[0].value)
              )
            }
          })
        selector = <MultiSelect
          className={'multidropdown_filter_node_link'}
          labelledBy={'dropdown_link_filter'}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          value={selected_options}
          options={options}
          onChange={(curr_selected_options: [{ label: string, value: string }]) => {
            tagg.selectTagsFromIds(curr_selected_options.map(_ => _.value))
            new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
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
            {tagg.name}
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
                  isChecked={tagg.show_legend}
                  onChange={evt => {
                    // Met à jour l'indicateur de legende pour tous les tags
                    Object.values(data_taggs_with_banner)
                      .forEach(tagg => tagg.show_legend = false)
                    tagg.show_legend = evt.target.checked
                    new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
                  }}
                /> :
                <></>
            }
          </Box>
        </Box>)
    })

  // Output -----------------------------------------------------------------------------
  return <>{allDD}</>
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export const ToolbarBuilder: FunctionComponent<ToolbarBuilderFType> = (
  {
    applicationData,
    url_prefix,
    additional_link_visual_filter_content,
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { new_data } = applicationData
  const { t } = new_data
  const { sankey } = new_data.drawing_area
  // const { ref_getter_mode_selection, ref_setter_mode_selection } = applicationState

  // ===================Create hooks used in this component========================

  const [s_is_data_type_reconcilied, sIsDataTypeReconcilied] = useState(['reconciled', 'free_value', 'free_interval'].includes(new_data.drawing_area.show_structure))
  const [s_force_update, sforceUpdate] = useBoolean()
  const data_type_not_reconcilied = ['data', 'structure', 'free_value', 'free_interval'].includes(new_data.drawing_area.show_structure)
  const [s_type_value, sTypeValue] = useState<'data' | 'structure' | 'reconciled'>(data_type_not_reconcilied ? (new_data.drawing_area.show_structure as 'data' | 'structure' | 'reconciled') : 'reconciled')
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_toolbar_updater.current = ()=>setCount(a=>a+1)
  let btn_mouse_mode_edition = <></>


  const node_filter = Object.entries(sankey.node_taggs_dict).filter(([, v]) => v.banner !== 'none').length > 0
  const flux_filter = Object.entries(sankey.flux_taggs_dict).filter(([, v]) => v.banner !== 'none').length > 0
  const level_filter = Object.entries(sankey.level_taggs_dict).length > 0
  const logo_btn_fs = s_force_update ? faCompress : faExpand

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(...new_data.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue())))

  const redrawNodeLinkLegend = () => {
    sankey.draw()
    new_data.drawing_area.legend.draw()
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
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
              defaultValue={new_data.drawing_area.filter_link_value}
              onChange={evt => {
                applicationData.new_data.drawing_area.filter_link_value = +evt
                setCount(a=>a+1)
                // new_data.drawing_area.sankey.links_list.forEach(link => link.draw()) // go through all link to undraw those who don't pass filter
                // new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
                new_data.drawing_area.sankey.draw()
              }
              } >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>

            <NumberInput
              allowMouseWheel
              min={0}
              max={max_link_value}
              value={new_data.drawing_area.filter_link_value}
              onChange={(evt) => {
                let tmp = +evt
                if (tmp > max_link_value) {
                  tmp = max_link_value
                }
                applicationData.new_data.drawing_area.filter_link_value = tmp
                setCount(a=>a+1)

              }}
              onBlur={()=>{
                // new_data.drawing_area.sankey.links_list.forEach(link => link.draw()) // go through all link to undraw those who don't pass filter
                // new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
                new_data.drawing_area.sankey.draw()

              }}
            >
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
              value={new_data.drawing_area.filter_label}
              onChange={(evt) => {
                applicationData.new_data.drawing_area.filter_label = +evt
                setCount(a=>a+1)
                new_data.drawing_area.sankey.visible_links_list.forEach(link => link.drawLabel())
              }}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>

            <NumberInput
              allowMouseWheel
              min={0}
              max={max_link_value}
              value={new_data.drawing_area.filter_label}
              onChange={(evt) => {
                let tmp = +evt
                if (tmp > max_link_value) {
                  tmp = max_link_value
                }
                applicationData.new_data.drawing_area.filter_label = tmp
                setCount(a=>a+1)
                new_data.drawing_area.sankey.links_list.forEach(link => link.drawLabel())
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
              new_data.drawing_area.show_structure = evt.target.value as 'data' | 'structure' | 'reconciled'
              sTypeValue(evt.target.value as 'data' | 'structure' | 'reconciled')
              if (evt.target.value === 'reconciled') {
                sIsDataTypeReconcilied(true)
              } else {
                sIsDataTypeReconcilied(false)
              }
              setCount(a=>a+1)
              redrawNodeLinkLegend()
            }}>
            <option key='structure' value='structure' >{t('Banner.t_v_s')}</option>
            <option key='data' value='data' >{t('Banner.t_v_c')}</option>
            <option key='reconciled' value='reconciled' >{t('Banner.t_v_r')}</option>
          </Select>
        </Box>

        <Box
          layerStyle='menuconfig_grid'
          display={s_is_data_type_reconcilied ? '' : 'none'}
        >
          <Box fontStyle='h3' >
            {t('Banner.indetermined_value')}
          </Box>
          <Select
            value={new_data.drawing_area.show_structure}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              new_data.drawing_area.show_structure = evt.target.value as 'reconciled' | 'free_value' | 'free_interval'
              setCount(a=>a+1)
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
    applicationData={applicationData}
    level={false}
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
        <>{(Object.entries(sankey.node_taggs_dict).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
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
        <AddAllDropDownFlux
          applicationData={applicationData}
        />
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
        label={(new_data.drawing_area.isInEditionMode()) ? t('Banner.tooltipLiason') : t('Banner.tooltipSelection')}
      >
        <Button
          variant='toolbar_button_1'
          id='button_selection_edition'
          onClick={() => {
            applicationData.new_data?.drawing_area.switchMode()
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
      {
        InitalizeSelectorDetailNodes(applicationData)
      }
    </OSTooltip>
  </> :
    <></>

  const btn_link_display = <><OSTooltip placement='left' label={t('Banner.hlp_1_txt_8')}>
    {popover_link_visual_filter}
  </OSTooltip>
  {/* Popover to display the link-filter */}
  </>


  const btn_show_data_type = url_prefix !== '' ? <><OSTooltip placement='left' label={t('Banner.sdr')}>
    {struc_data_reconciled}
  </OSTooltip>
  </> :
    <OSTooltip placement='left' label={t('Banner.tooltipStructure')}>
      <Button variant={'success'} onClick={() => {
        new_data.drawing_area.show_structure = new_data.drawing_area.show_structure == 'reconciled' ? 'structure' : 'reconciled'
        setCount(a=>a+1)
        redrawNodeLinkLegend()

      }} >
        <FontAwesomeIcon icon={faCodeBranch} />
      </Button>
    </OSTooltip>

  const btn_show_node_filter = (node_filter) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_node_tag_filter')}>
      {filter_color_node}
    </OSTooltip>
  </> :
    <></>

  const btn_show_link_filter = (flux_filter) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_link_tag_filter')}>
      {filter_color_link}
    </OSTooltip></> : <></>

  const btn_show_data_filter = (new_data.drawing_area.sankey.data_taggs_list.length > 0) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_data_tag_filter')}>
      {filter_data}
    </OSTooltip></> : <></>

  const btn_show_help_in_static = window.SankeyToolsStatic ? <OSTooltip placement='left' label={t('Banner.tooltipHelp')}>
    <Button variant='info' onClick={() => { new_data.menu_configuration.never_see_again.current = false; localStorage.removeItem('dontSeeAggainWelcome'), applicationData.new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true) }} >
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

    {stretchButtons(applicationData, t)}

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
  t: TFunction
) => {
  return <> <OSTooltip placement='left' label={t('Banner.tooltipAdjustH')}>
    <Button variant='toolbar_button_6' onClick={() => applicationData.new_data.drawing_area.areaFitHorizontally()} >
      <FontAwesomeIcon icon={faArrowsLeftRight} />
    </Button>
  </OSTooltip>
  <OSTooltip placement='left' label={t('Banner.tooltipAdjustV')} >
    <Button variant='toolbar_button_6' onClick={() => { applicationData.new_data.drawing_area.areaFitVertically() }} >
      <FontAwesomeIcon icon={faArrowsUpDown} />
    </Button>
  </OSTooltip></>
}



