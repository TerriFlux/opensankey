// External libs
import React, { ChangeEvent, FunctionComponent, MutableRefObject, RefObject, useRef, useState } from 'react'
import { FaCheck, FaFileImport, FaPause, FaPlay } from 'react-icons/fa'
import { Box, Checkbox, Button, Input, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, PopoverContent, Popover, PopoverBody, PopoverCloseButton, PopoverHeader, PopoverTrigger, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text, Accordion, PopoverArrow, Select, Stepper, useSteps, Step, StepIndicator, StepSeparator, StepStatus, StepTitle, Menu, MenuButton, MenuItem, MenuList, ButtonGroup, MenuDivider } from '@chakra-ui/react'

// Internal imports
import {
  FCType_ImportImageAsSvgBg,
  FCType_MenuConfEditionDataTag,
  FCType_ToolBarLinkVisualFilter,
  FCType_ToolBarTagFilter,
  FType_AddSimpleLevelDropDown,
  FType_InitalizeSelectorDetailNodes,
} from './ftypes/SankeyPlusUtilsTypes'
import {
  CustomFaEyeCheckIcon,
  getBooleanFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  OSTooltip,
  Type_JSON
} from './deps/OpenSankey/types/Utils'
import { SankeySettingsEditionElementTags } from './MenuConfigEdition/SankeyPlusMenuConfigurationTags'
import { faDatabase, faFolderTree, faRepeat, faSliders } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AddAllDropDownFlux, AddAllDropDownNode, DataTagSelector } from './deps/OpenSankey/configmenus/SankeyMenuBanner'
import { default_container_content } from './types/FreeLabel'
import { OSPData, ViewType } from './types/LegacyTypes'
import { GetOldDataFromView } from './SankeyPlusConvert'
import { ConfigMenuNumberInput } from './deps/OpenSankey/configmenus/SankeyMenuConfiguration'
import { Type_GenericApplicationDataOSP } from './types/TypesOSP'
import { Class_DataTagGroup } from './deps/OpenSankey/types/Tag'
import { ChevronRightIcon } from '@chakra-ui/icons'

export const ImportImageAsSvgBg: FunctionComponent<FCType_ImportImageAsSvgBg> = ({
  new_data_plus,
}) => {
  const _load_image = useRef<HTMLInputElement>(null)
  const [, setCount] = useState(0)
  const { drawing_area, t, has_sankey_plus } = new_data_plus
  const content_image = <>
    {/* Import image */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={drawing_area.show_background_image}
        isDisabled={!has_sankey_plus}
        icon={<CustomFaEyeCheckIcon />}
        onChange={(evt) => {
          drawing_area.show_background_image = evt.target.checked
          drawing_area.drawBgImage()
          setCount(a => a + 1)
        }}
      >
        {t('MEP.show_image')}
      </Checkbox>
      <OSTooltip label={!has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box>
          <Button
            variant='menuconfigpanel_option_button'
            isDisabled={!drawing_area.show_background_image || !has_sankey_plus}
            onClick={() => {
              if (_load_image.current) {
                _load_image.current.name = ''
                _load_image.current.click()
              }
            }}
          >
            <FaFileImport />
          </Button>
          <Input
            ref={_load_image}
            style={{ display: 'none' }}
            accept='image/*'
            type="file"
            value={''}
            disabled={!has_sankey_plus}
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (() => {
                return (e: ProgressEvent<FileReader>) => {
                  const resultat = (e.target as FileReader).result
                  const res = resultat?.toString().replaceAll('=', '')
                  drawing_area.background_image = (res as string)
                  drawing_area.drawBgImage()
                }
              })()
              reader.readAsDataURL(files[0])
            }}
          />
        </Box>
      </OSTooltip>
    </Box>
  </>
  return content_image
}


export const MenuConfEditionTag: FunctionComponent<FCType_MenuConfEditionDataTag> = ({
  new_data_plus
}) => {

  const [, setUpdate] = useState(0)
  const { t } = new_data_plus
  const show_menu_config_tag = (
    new_data_plus.menu_configuration.isGivenAccordionShowed('EN') ||
    new_data_plus.menu_configuration.isGivenAccordionShowed('EF') ||
    new_data_plus.menu_configuration.isGivenAccordionShowed('ED')
  )

  new_data_plus.menu_configuration.ref_to_accordion_edition_tag_updater.current = () => setUpdate(a => a + 1)
  return show_menu_config_tag ?
    <AccordionItem>
      {
        //MENU ETIQUETTES
      }
      <AccordionButton
        onClick={() => {
          const scroll_x = window.scrollX
          const scroll_y = window.scrollY
          setTimeout(() => {
            document.getElementsByTagName('html')[0]?.scrollTo(scroll_x, scroll_y)
          }, 50)
        }}
      >
        <Box
          as='span'
          layerStyle='menuconfig_entry'>
          {t('Menu.Etiquettes')}
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>
        <Accordion
          allowToggle
          variant="accordion_sublevel_style"
        >
          <AccordionItem
            style={{ 'display': (new_data_plus.menu_configuration.isGivenAccordionShowed('EN')) ? 'initial' : 'none' }}
          >
            {
              //MENU ETIQUETTES DE NOEUDS
            }
            <AccordionButton
              onClick={() => {
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName('html')[0]?.scrollTo(scroll_x, scroll_y)
                }, 50)
              }}>
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.EN')}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <SankeySettingsEditionElementTags
                new_data={new_data_plus}
                elementTagNameProp='node_taggs'
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem
            style={{ 'display': (new_data_plus.menu_configuration.isGivenAccordionShowed('EF')) ? 'initial' : 'none' }}
          >
            {
              //MENU ETIQUETTES DE FLUX
            }
            <AccordionButton
              onClick={() => {
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName('html')[0]?.scrollTo(scroll_x, scroll_y)
                }, 50)
              }}
            >
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.EF')}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <SankeySettingsEditionElementTags
                new_data={new_data_plus}
                elementTagNameProp='flux_taggs'
              />
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem
            isDisabled={!new_data_plus.has_sankey_plus}
            style={{ 'display': (new_data_plus.menu_configuration.isGivenAccordionShowed('ED')) ? 'initial' : 'none' }}
          >
            {
              //MENU ETIQUETTES DE DONNÉES
            }
            <AccordionButton
              onClick={() => {
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName('html')[0]?.scrollTo(scroll_x, scroll_y)
                }, 50)
              }}
            >
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.ED')}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <SankeySettingsEditionElementTags
                new_data={new_data_plus}
                elementTagNameProp='data_taggs'
              />
            </AccordionPanel>
          </AccordionItem>

        </Accordion>
      </AccordionPanel>
    </AccordionItem> :
    <></>

}


/**
 * A button for the toolbar that allow to filter displayed link based on their link value
 *
 * @param {*} {new_data_plus}
 * @return {*}
 */
export const ToolBarLinkVisualFilter: FunctionComponent<FCType_ToolBarLinkVisualFilter> = ({ new_data_plus }) => {
  const { t } = new_data_plus
  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...new_data_plus.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()) / (l.local_link_scale ?? 1))) + 1
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_toolbar_link_visual_filter_updater.current = () => setCount(a => a + 1)

  // Ref to popover button trigger to trap focus at popover when onBlur of NumberInput
  const ref: RefObject<HTMLButtonElement> = useRef(null)

  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < 2; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  ref_set_number_inputs[0].current(String(new_data_plus.drawing_area.filter_link_value))
  ref_set_number_inputs[1].current(String(new_data_plus.drawing_area.filter_label))

  {/* Popover to display the link-filter */ }
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
        ref={ref}
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
              value={new_data_plus.drawing_area.filter_link_value}
              onChange={evt => {
                new_data_plus.drawing_area.filter_link_value = +evt
                setCount(a => a + 1)
                new_data_plus.drawing_area.sankey.visible_links_list.forEach(link => {
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
              ref_to_set_value={ref_set_number_inputs[0]}
              default_value={new_data_plus.drawing_area.filter_link_value}
              function_on_blur={(value) => {
                if (value && value > max_link_value) {
                  value = max_link_value
                }
                if (value) {
                  new_data_plus.drawing_area.filter_link_value = value
                  setCount(a => a + 1)
                  new_data_plus.drawing_area.sankey.draw()
                }

                ref.current?.focus() //avoid closure of popover
              }}
              minimum_value={0}
              maximum_value={max_link_value}
              stepper={false}
            />

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
              value={new_data_plus.drawing_area.filter_label}
              onChange={(evt) => {
                new_data_plus.drawing_area.filter_label = +evt
                setCount(a => a + 1)
                new_data_plus.drawing_area.sankey.visible_links_list.forEach(link => link.drawLabel())
              }}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <ConfigMenuNumberInput
              ref_to_set_value={ref_set_number_inputs[1]}
              default_value={new_data_plus.drawing_area.filter_label}
              function_on_blur={(value) => {

                if (value) {
                  if (value > max_link_value) {
                    value = max_link_value
                  }
                  new_data_plus.drawing_area.filter_label = value
                  setCount(a => a + 1)
                  new_data_plus.drawing_area.sankey.links_list.forEach(link => link.drawLabel())
                }

                ref.current?.focus() //avoid closure of popover
              }}
              minimum_value={0}
              maximum_value={max_link_value}
              stepper={false}
            />
          </Box>
          {/* {additional_link_visual_filter_content} */}
        </Box>
      </PopoverBody>
    </PopoverContent>
  </Popover>
  return <OSTooltip placement='left' label={t('Banner.hlp_1_txt_8')}>
    {popover_link_visual_filter}
  </OSTooltip>
}

export const ToolBarNodeTagFilter: FunctionComponent<FCType_ToolBarTagFilter> = ({ new_data_plus }) => {
  const [, setCount] = useState(0)
  const { drawing_area, t } = new_data_plus
  const { sankey } = drawing_area
  new_data_plus.menu_configuration.ref_to_toolbar_node_tag_updater.current = () => setCount(a => a + 1)
  // Logo of the button
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
  // Title in the popover
  const legend_filter = <Box
    as='span'
    layerStyle='popover_sidebar_row_tag_filter'
  >
    <Box textStyle='h2'>{t('Menu.group')}</Box>
    <Box textStyle='h2'>{t('Menu.color')}</Box>
  </Box>

  const node_filter = Object.entries(sankey.node_taggs_dict).filter(([, v]) => v.banner !== 'none').length > 0

  // Content of the popover
  const node_tag_filter_content = <AddAllDropDownNode
    new_data={new_data_plus}
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

  // Button to add to the toolbar
  const btn_show_node_filter = (node_filter) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_node_tag_filter')}>
      {filter_color_node}
    </OSTooltip>
  </> :
    <></>

  return btn_show_node_filter

}

export const ToolBarLinkTagFilter: FunctionComponent<FCType_ToolBarTagFilter> = ({ new_data_plus }) => {
  const [, setCount] = useState(0)
  const { drawing_area, t } = new_data_plus
  const { sankey } = drawing_area
  new_data_plus.menu_configuration.ref_to_toolbar_link_tag_updater.current = () => setCount(a => a + 1)

  // Logo of the button
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

  // Title in the popover
  const legend_filter = <Box
    as='span'
    layerStyle='popover_sidebar_row_tag_filter'
  >
    <Box textStyle='h2'>{t('Menu.group')}</Box>
    <Box textStyle='h2'>{t('Menu.color')}</Box>
  </Box>


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
          new_data={new_data_plus}
        />
      </PopoverBody>
    </PopoverContent>
  </Popover>

  const flux_filter = Object.entries(sankey.flux_taggs_dict).filter(([, v]) => v.banner !== 'none').length > 0


  const btn_show_link_filter = (flux_filter) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_link_tag_filter')}>
      {filter_color_link}
    </OSTooltip></> : <></>

  return btn_show_link_filter

}

export const ToolBarDataTagFilter: FunctionComponent<FCType_ToolBarTagFilter> = ({ new_data_plus }) => {
  const [, setCount] = useState(0)
  const { t } = new_data_plus

  new_data_plus.menu_configuration.ref_to_toolbar_data_tag_updater.current = () => setCount(a => a + 1)

  // Title in the popover
  const legend_filter = <Box
    as='span'
    layerStyle='popover_sidebar_row_tag_filter'
  >
    <Box textStyle='h2'>{t('Menu.group')}</Box>
    <Box textStyle='h2'>{t('Menu.color')}</Box>
  </Box>

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
          new_data={new_data_plus}
          in_popover={true}
        />
      </PopoverBody>
    </PopoverContent>
  </Popover>


  const btn_show_data_filter = (new_data_plus.drawing_area.sankey.data_taggs_list.length > 0) ? <>
    <OSTooltip placement='left' label={t('Banner.hlp_data_tag_filter')}>
      {filter_data}
    </OSTooltip></> : <></>

  return btn_show_data_filter

}


export const ToolBarLevelFilter: FunctionComponent<FCType_ToolBarTagFilter> = ({ new_data_plus }) => {
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_leveltag_filter_updater.current = () => setCount(a => a + 1)

  const level_filter = Object.entries(new_data_plus.drawing_area.sankey.level_taggs_dict).length > 0
  const only_primary = new_data_plus.drawing_area.sankey.level_taggs_list.length == 1 && new_data_plus.drawing_area.sankey.level_taggs_list[0].name == 'Primaire'
  const mutli_level = new_data_plus.drawing_area.sankey.level_taggs_list.length > 0
  let content_popover = <></>

  if (only_primary) { // Only have primary level group tag
    content_popover = <AddSimpleLevelDropDown
      new_data={new_data_plus}
    />
  } else if (mutli_level) { // has other level group tag than 'Primaire'
    content_popover = <AddAllDropDownNode
      new_data={new_data_plus}
      level={true} />
  }



  return (level_filter) ? <>
    <OSTooltip
      placement='left'
      label={new_data_plus.t('Banner.hlp_1_txt_2')}>
      {
        <Popover placement='left' id='popover_details_level'>
          <PopoverTrigger>
            <Button variant='toolbar_button_2' id='btn_open_popover_details_level'>
              <FontAwesomeIcon icon={faFolderTree} />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>{new_data_plus.t('Banner.ndd')}</PopoverHeader>
            <PopoverBody>
              {content_popover}
            </PopoverBody>
          </PopoverContent>

        </Popover>
      }
    </OSTooltip>
  </> :
    <></>
}

/**
 * TODO Description
 * @param {*} new_data
 * @return {*}
 */
export const initalizeSelectorDetailNodes: FType_InitalizeSelectorDetailNodes = (
  new_data
) => {
  const { t } = new_data

  return <Popover placement='left' id='popover_details_level'>
    <PopoverTrigger>
      <Button variant='toolbar_button_2' id='btn_open_popover_details_level'>
        <FontAwesomeIcon icon={faFolderTree} />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverArrow />
      <PopoverCloseButton />
      <PopoverHeader>{t('Banner.ndd')}</PopoverHeader>
      <PopoverBody>
        <>
          {
            (new_data.drawing_area.sankey.level_taggs_list.length > 0) ?
              (<>
                {
                  <AddSimpleLevelDropDown
                    new_data={new_data}
                  />
                }
              </>) :
              (<>
                <Input
                  placeholder="Pas de filtrage"
                  isDisabled
                />
              </>)
          }
        </>
      </PopoverBody>
    </PopoverContent>

  </Popover>
}


/**
 * Drop down to select primary level tag
 * @param {*} {
 *   new_data,
 * }
 * @return {*}
 */
export const AddSimpleLevelDropDown: FunctionComponent<FType_AddSimpleLevelDropDown> = (
  {
    new_data
  }
) => {
  // Data -------------------------------------------------------------------------------
  const level_taggs = new_data.drawing_area.sankey.level_taggs_dict

  // Component updater ------------------------------------------------------------------
  // const [, setCount] = useState(0)


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
                // setCount(a=>a+1)
                // recall node.draw because selectTagsFromId doesn't lead to applyPositionOnLinks wich compute endpoints
                // (it isn't done for link not directly displayed after fromJSON)
                new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
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

export const convert_data_plus_legacy = (json_object: Type_JSON) => {
  const containers = getJSONOrUndefinedFromJSON(json_object, 'labels')
  if (containers) {
    // Convert name of variable from legacy Free label to variable name of new Free labels
    Object.values(containers).forEach(el => {
      const cont = el as Type_JSON

      if (cont.name !== undefined) {
        cont.content = cont.name as string
        if (!cont.content.includes('<p')) {
          if (cont.font_uppercase && !cont.content.includes('ql-align-center')) {
            cont.content = cont.content.toUpperCase()
          }

          if (cont.font_weight) {
            cont.content = cont.content ? '<strong>' + cont.content + '</strong>' : ''
          }
          if (cont.position_horiz === 'gauche') {
            cont.content = cont.content ? '<p class="ql-align-left">' + cont.content + '</p>' : ''
          }
          if (cont.position_horiz === 'centre') {
            cont.content = cont.content ? '<p class="ql-align-center">' + cont.content + '</p>' : ''
          }
          if (cont.position_horiz === 'droite') {
            cont.content = cont.content ? '<p class="ql-align-right">' + cont.content + '</p>' : ''
          }
        }
      }

      const container_content = getStringFromJSON(cont, 'content', default_container_content)
      const container_opacity = getBooleanFromJSON(cont, 'transparent', false)
      const container_opacity_int = getNumberOrUndefinedFromJSON(cont, 'opacity')
      if (container_opacity_int !== undefined) {
        cont['opacity'] = container_opacity_int
      } else if (container_opacity) {
        cont['opacity'] = 0
      } else {
        cont['opacity'] = 100
      }
      cont['content'] = container_content

    })
  }


  const old_views = getOldViewsFromJSON(json_object, 'view') as ViewType[]
  if (old_views && old_views.length > 0) {
    json_object.views = {} as Type_JSON
    // Convert old views
    old_views.forEach((v) => {
      if (v.heredited_attr_from_master === undefined) {
        v.heredited_attr_from_master = []
      }
      // Convert old views that are diff to json
      const d_view = GetOldDataFromView(json_object as unknown as OSPData, v.id)
      if (d_view) {
        (json_object.views as Type_JSON)[v.id] = d_view as unknown as Type_JSON
      }

      // Set Name of view
      ((json_object.views as Type_JSON)[v.id] as Type_JSON).name = v.nom;
      // Set heredited from master attr
      ((json_object.views as Type_JSON)[v.id] as Type_JSON).heredited_attr = v.heredited_attr_from_master
    })
  }
}

export function getArrayFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: Array<ViewType>
) {
  if (json_object[key] && typeof json_object[key] === typeof fallback_value) {
    return json_object[key]
  }
  return fallback_value
}


export function getOldViewsFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    const _ = getArrayFromJSON(json_object, key, [])
    if (Object.keys(_).length > 0)
      return _
  }
  return undefined
}

type FCType_DrawerSequenceDataTagg = { new_data: Type_GenericApplicationDataOSP }

export const DrawerSequenceDataTagg: FunctionComponent<FCType_DrawerSequenceDataTagg> = ({ new_data }) => {
  const [, setUpdate] = useState(0)
  new_data.menu_configuration.ref_to_drawer_sequence_data_tag_updater.current = () => setUpdate(a => a + 1)
  const [active_grp, setActiveGrp] = useState('')

  const list_grp_seq = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(grp => (grp as Class_DataTagGroup).is_sequence)
  const dict_data_grp = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')
  const list_grp_seq_id = list_grp_seq.map(grp => grp.id)
  const has_sequence = list_grp_seq.length > 0

  if (has_sequence && !list_grp_seq_id.includes(active_grp)) {
    setActiveGrp(list_grp_seq_id[0])
  }
  const ref_set_number_input = useRef((_: string | null | undefined) => null)
  ref_set_number_input.current(String(new_data.menu_configuration.timeout_sequence))

  // Create stepper of active groupe
  const stepper_sequence: JSX.Element = <StepperDataTagg new_data={new_data} DataGroup={dict_data_grp[active_grp] as Class_DataTagGroup} />

  // Logo of the button to start/pause the sequence
  const logo_btn = !new_data.menu_configuration.is_playing_sequence ? <FaPlay /> : <FaPause />
  const setter_timeout = <Box layerStyle='config_timeout_sequence' >
    <Box layerStyle='menuconfigpanel_option_name'>
      {new_data.t('Tags.sequence_timeout')}
    </Box>

    <ConfigMenuNumberInput
      default_value={new_data.menu_configuration.timeout_sequence}
      ref_to_set_value={ref_set_number_input}
      minimum_value={1}
      function_on_blur={(value) => {
        if (value) {
          if (value > 0) {
            new_data.menu_configuration.timeout_sequence = value
          }
        }
      }}
      unit_text='ms'
    />
  </Box>

  // If multiple dataTagg are a sequence we can add a Menu to choose which one we want to launch
  const select_active_grp = list_grp_seq.length > 1 ? <>
    {list_grp_seq.map(el => {
      return <MenuItem
        onClick={() => setActiveGrp(el.id)}
        icon={active_grp === el.id ? <FaCheck /> : <></>}
        style={{ display: 'block' }}
      >
        {el.name}
      </MenuItem>
    })}
    <MenuDivider />
  </> : <></>

  // Menu with option like selective active sequence & timeout between steps
  const option_btn = <Menu>
    <MenuButton
      as={Button}
      isDisabled={new_data.menu_configuration.is_playing_sequence}
      variant={new_data.menu_configuration.is_playing_sequence ? 'button_dataTagg_sequence_menu_play' : 'button_dataTagg_sequence_menu_pause'}
    >
      <ChevronRightIcon />
    </MenuButton>
    <MenuList>
      {select_active_grp}
      {setter_timeout}
    </MenuList>
  </Menu>

  return has_sequence ? (
    <Box
      layerStyle='box_sequence'
    >
      <ButtonGroup isAttached>
        <Button
          variant={new_data.menu_configuration.is_playing_sequence ? 'button_dataTagg_sequence_play' : 'button_dataTagg_sequence_pause'}
          onClick={() => {
            // Either launch or stop data sequence
            if (new_data.menu_configuration.is_playing_sequence) {
              // Stop sequence
              new_data.menu_configuration.is_playing_sequence = false
            } else {
              // Start sequence
              new_data.menu_configuration.is_playing_sequence = true
              const curr_active_grp = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')[active_grp] as Class_DataTagGroup
              new_data.menu_configuration.launchDataSequence(curr_active_grp)
            }
            setUpdate(a => a + 1)
          }}
        >
          {logo_btn}
        </Button>
        <Button
          variant={new_data.menu_configuration.is_sequence_loop ? 'button_dataTagg_sequence_play' : 'button_dataTagg_sequence_pause'}
          onClick={() => {
            // Switch 'is sequence loop' value 
            new_data.menu_configuration.is_sequence_loop = !new_data.menu_configuration.is_sequence_loop
            setUpdate(a => a + 1)
          }}>
          <FontAwesomeIcon icon={faRepeat} />
        </Button>
        {option_btn}
      </ButtonGroup>
      {stepper_sequence}
    </Box>
  ) : <></>
}
type FCType_StepperDataTagg = { new_data: Type_GenericApplicationDataOSP, DataGroup: Class_DataTagGroup }

// Compoenent returing a stepper of a dataTagg where each step is a tag of the group with visual indication to which tag is selected
const StepperDataTagg: FunctionComponent<FCType_StepperDataTagg> = ({ new_data, DataGroup }) => {
  const stepper_sequence = DataGroup.tags_list.map((tag, idx) => { return { id_tag: tag.id, title: tag.name, selected: tag.is_selected, id: idx } })
  const selected_id = stepper_sequence.find(el => el.selected)?.id ?? -1
  const { activeStep, setActiveStep } = useSteps({
    index: selected_id,
    count: stepper_sequence.length,
  })

  if (activeStep !== -1 && activeStep !== selected_id) {
    setActiveStep(selected_id)
  }
  // Fucntion used when we click on a step to manually switch to clicked tag
  const switchCurrTag = (idx: number) => {
    DataGroup.selectTagsFromId(stepper_sequence[idx].id_tag)
    new_data.drawing_area.checkAndUpdateAreaSize()
    new_data.menu_configuration.updateAllComponentsRelatedToDataTags()

  }

  return <Box layerStyle='box_stepper'>
    {/* First stepper that have progression bar of the sequence with steps */}
    <Stepper index={activeStep} size={'sm'} variant='sequenceStepper'>
      {stepper_sequence.map((step, index) => (
        <Step key={index} onClick={() => switchCurrTag(index)}>
          <>
            <Box width='100%'>
              <Box display='flex' alignItems='center'>
                <StepIndicator
                  sx={{
                    '[data-status=complete] &': {
                      background: 'white',
                      borderWidth: '2px',
                      borderColor: 'secondaire.3',
                    },
                    '[data-status=active] &': {
                      background: 'primaire.3',
                      borderColor: 'secondaire.3',
                    },
                    '[data-status=incomplete] &': {
                      background: 'white',
                      borderColor: 'secondaire.3',
                    },
                  }}
                >
                  <StepStatus />

                </StepIndicator>

                <StepSeparator sx={{
                  '[data-status=complete] &': {
                    background: 'lightgrey',
                  },
                  '[data-status=active] &': {
                    background: 'lightgrey',
                  },
                  '[data-status=incomplete] &': {
                    background: 'lightgrey',
                  },
                }} />
              </Box>

            </Box>
          </>
        </Step>
      ))}
    </Stepper>
    
    {/* Second stepper just to have text well aligned with indicator */}
    <Stepper index={activeStep} size={'sm'} variant='sequenceStepper'>
      {stepper_sequence.map((step, index) => (
        <Step key={index} onClick={() => switchCurrTag(index)}>
          <>
            <Box width='100%'>
              <Box display='flex' alignItems='center'>

                <StepTitle >{step.title}</StepTitle>
              </Box>

            </Box>
          </>

        </Step>

      ))}
    </Stepper>
  </Box>
}