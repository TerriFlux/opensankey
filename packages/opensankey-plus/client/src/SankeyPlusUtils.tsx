// External libs
import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import { FaFileImport } from 'react-icons/fa'
import { Box, Checkbox, Button, Input, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, PopoverContent, NumberInput, NumberInputField, Popover, PopoverBody, PopoverCloseButton, PopoverHeader, PopoverTrigger, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text } from '@chakra-ui/react'

// Internal imports
import {
  FCType_ImportImageAsSvgBg,
  FCType_MenuConfEditionDataTag,
  FCType_ToolBarLinkVisualFilter,
} from './ftypes/SankeyPlusUtilsTypes'
import {
  CustomFaEyeCheckIcon,
  OSTooltip
} from './deps/OpenSankey/types/Utils'
import { t } from 'i18next'
import { SankeySettingsEditionElementTags } from './deps/OpenSankey/configmenus/SankeyMenuConfigurationTags'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

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


export const MenuConfEditionDataTag: FunctionComponent<FCType_MenuConfEditionDataTag> = ({
  new_data_plus
}) => {
  return <AccordionItem
    isDisabled={new_data_plus.has_sankey_plus}
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
}


/**
 * A button for the toolbar that allow to filter displayed link based on their link value
 *
 * @param {*} {new_data_plus}
 * @return {*} 
 */
export const ToolBarLinkVisualFilter: FunctionComponent<FCType_ToolBarLinkVisualFilter> = ({ new_data_plus }) => {
  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...new_data_plus.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()))) + 1
  const [, setCount] = useState(0)
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
              defaultValue={new_data_plus.drawing_area.filter_link_value}
              onChange={evt => {
                new_data_plus.drawing_area.filter_link_value = +evt
                setCount(a => a + 1)
                // new_data_plus.drawing_area.sankey.links_list.forEach(link => link.draw()) // go through all link to undraw those who don't pass filter
                // new_data_plus.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
                new_data_plus.drawing_area.sankey.draw()
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
              value={new_data_plus.drawing_area.filter_link_value}
              onChange={(evt) => {
                let tmp = +evt
                if (tmp > max_link_value) {
                  tmp = max_link_value
                }
                new_data_plus.drawing_area.filter_link_value = tmp
                setCount(a => a + 1)

              }}
              onBlur={() => {
                // new_data_plus.drawing_area.sankey.links_list.forEach(link => link.draw()) // go through all link to undraw those who don't pass filter
                // new_data_plus.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
                new_data_plus.drawing_area.sankey.draw()

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

            <NumberInput
              allowMouseWheel
              min={0}
              max={max_link_value}
              value={new_data_plus.drawing_area.filter_label}
              onChange={(evt) => {
                let tmp = +evt
                if (tmp > max_link_value) {
                  tmp = max_link_value
                }
                new_data_plus.drawing_area.filter_label = tmp
                setCount(a => a + 1)
                new_data_plus.drawing_area.sankey.links_list.forEach(link => link.drawLabel())
              }}
            >
              <NumberInputField />
            </NumberInput>
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