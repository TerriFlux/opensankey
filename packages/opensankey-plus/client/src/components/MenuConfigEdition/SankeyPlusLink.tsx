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
} from '../../deps/OpenSankey/Elements/Link'

import {
  checked,
  sep
} from '../../deps/OpenSankey/components/dialogs/SankeyMenuContextLink'
import { BaseMenuStylePropsPlus, BaseComponentProps } from '../ComponentTypes'
import { isElementAttributeOverloaded, OSTooltip, TooltipValueSurcharge } from '../../deps/OpenSankey/components/configmenus/MenuCommon'
import { LINKS_ATTRIBUTES_CONFIG } from '../../deps/OpenSankey/Elements/LinkAttributesConfig'
import { Class_LinkStyle } from '../../deps/OpenSankey/Elements/ElementStyle'

export const MenuConfLinkApparenceDashedOSP: FC<BaseMenuStylePropsPlus> = ({
  new_data_plus,
  menu_for_style 
}) => {
  {/* Flux hachuré */ }
  // Get data
  const { ref_selected_style_link } = new_data_plus.menu_configuration

  const { t } = new_data_plus
  const [forceUpdate, setForceUpdate] = useState(false)

  // Selected links
  let selected_links
  if (!new_data_plus.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data_plus.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data_plus.drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStyle[] | Class_LinkElement[]
  if (menu_for_style) {
    elements = [new_data_plus.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }

  const shape_is_dashed = (elements[0]?.shape_is_dashed ?? LINKS_ATTRIBUTES_CONFIG.shape_is_dashed.default)


  // Function that can be undone ===================================
  const updateDashedLinks = (_: boolean) => {
    const dict_old_val = Object.fromEntries(elements.map(el => [el.id, el.shape_is_dashed]))

    const _updateDashedLinks = () => {
      elements.forEach(element => element.shape_is_dashed = _)
      setForceUpdate(!forceUpdate)
    }
    const inv_updateDashedLinks = () => {
      elements.forEach(element => element.shape_is_dashed = dict_old_val[element.id])
      setForceUpdate(!forceUpdate)
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateDashedLinks)
    new_data_plus.history.saveRedo(_updateDashedLinks)
    // Execute original attr mutation
    _updateDashedLinks()
  }

  const check_indeterminate = (curr: Class_LinkElement) => {
    return (selected_links[0].shape_is_dashed == curr.shape_is_dashed)
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)
  return <Checkbox
    variant='menuconfigpanel_option_checkbox'
    isIndeterminate={is_indeterminate}
    isDisabled={!new_data_plus.has_sankey_plus}
    isChecked={shape_is_dashed}
    onChange={(evt) => {
      updateDashedLinks(evt.target.checked)
    }}>
    <OSTooltip label={t('Flux.apparence.tooltips.hach')}>
      {t('Flux.apparence.hach') + ' '}
    </OSTooltip>
    {
      (!menu_for_style) &&
        isElementAttributeOverloaded(selected_links, 'shape_is_dashed') ?
        TooltipValueSurcharge('link_var_', t) :
        <></>
    }
  </Checkbox>
}

export const ButtonLinkContextAssignTag: FC<BaseComponentProps> = ({ new_data }) => {
  const { t } = new_data
  const [, setUpdate] = useState(0)
  const contextualised_link = new_data.drawing_area.link_contextualised
  const has_flux_tags = Object.values(new_data.drawing_area.sankey.flux_taggs_dict).length > 0
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
            new_data.drawing_area.sankey.flux_taggs_list
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
                            onClick={() => {
                              new_data.drawing_area.updateSelectedLinksTagAssignation(!has_tag, tag)
                              new_data.drawing_area.link_contextualised = undefined
                              new_data.menu_configuration.ref_to_menu_context_links_updater.current()
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