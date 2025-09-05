// External imports
import React, {
  FC,
  MutableRefObject,
  useRef,
  useState
} from 'react'

import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import {
  ChevronRightIcon
} from '@chakra-ui/icons'


import {
  Class_LinkElement,
} from '../deps/OpenSankey/Elements/Link'

import {
  checked,
  sep
} from '../deps/OpenSankey/components/dialogs/SankeyMenuContextLink'
import { isElementAttributeOverloaded, OSTooltip, TooltipValueSurcharge } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { LINKS_ATTRIBUTES_CONFIG } from '../deps/OpenSankey/Elements/LinkAttributesConfig'
import { Class_LinkStyle } from '../deps/OpenSankey/Elements/ElementStyle'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'

export interface BaseComponentProps {
  new_data: Class_ApplicationDataOSP
}
export interface BaseComponentPropsPlus {
  new_data_plus: Class_ApplicationDataOSP
}



export const ButtonLinkContextAssignTag = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area, menu_configuration } = app_data
  const [, setUpdate] = useState(0)
  const contextualised_link = drawing_area.link_contextualised
  const has_flux_tags = Object.values(drawing_area.sankey.flux_taggs_dict).length > 0
  return (
    (contextualised_link !== undefined) &&
    (has_flux_tags)
  ) ? <>
    {sep}
    <Menu placement='end'>
      <MenuButton
        variant='contextmenu_button'
        as={Button}
        rightIcon={<ChevronRightIcon />}
        className="dropdown-basic"
      >
        {t('Menu.Transformation.tagFlux_assign')}
      </MenuButton>

      <MenuList>
        {
          drawing_area.sankey.flux_taggs_list
            .filter(tagg => tagg.has_tags)
            .map((tagg, i) => {
              return <Menu key={i} placement='end'>
                <MenuButton
                  variant='contextmenu_button'
                  as={Button}
                  rightIcon={<ChevronRightIcon />}
                  className="dropdown-basic"
                >
                  {tagg.name}
                </MenuButton>
                <MenuList>
                  {
                    tagg.tags_list
                      .map(tag => {
                        const has_tag = contextualised_link.hasGivenTag(tag)
                        return <MenuItem
                          display='flex'
                          closeOnSelect={false}
                          onClick={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            drawing_area.updateSelectedLinksTagAssignation(!has_tag, tag)
                            menu_configuration.ref_to_menu_context_links_updater.current()
                            setUpdate(a => a + 1)
                          }}
                        >
                          {tag.name}
                          {checked(has_tag)}
                        </MenuItem>
                      })
                  }
                </MenuList>
              </Menu>
            })
        }
      </MenuList>
    </Menu></> :
    <></>
}