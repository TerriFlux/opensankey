// External imports
import React, {
  FunctionComponent,
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

// OpenSankey imports
import {
  OSTooltip,
  TooltipValueSurcharge
} from '../../deps/OpenSankey/types/Utils'
import {
  isAttributeOverloaded
} from '../../deps/OpenSankey/Elements/Link'
import {
  default_link_value_label_nb_significant_digits,
  default_link_value_label_scientific_notation,
  default_link_value_label_significant_digits,
  default_shape_is_dashed
} from '../../deps/OpenSankey/Elements/LinkAttributes'
import { Class_LinkStyle } from '../../deps/OpenSankey/Elements/LinkAttributes'

import {
  checked,
  sep
} from '../../deps/OpenSankey/components/dialogs/SankeyMenuContextLink'

// Local imports
import type {
  FCType_MenuConfLinkApparenceDashedOSP,
  FCType_MenuConfLinkScientificPrecision,
  FCType_MenuContextLink
} from './types/SankeyPlusGradientTypes'
import type {
  Class_LinkStyleOSP
} from '../../types/LinkOSP'
import type {
  Type_GenericLinkElementOSP,
} from '../../types/TypesOSP'
import { ConfigMenuNumberInput } from '../../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'




export const MenuConfLinkApparenceDashedOSP: FunctionComponent<FCType_MenuConfLinkApparenceDashedOSP> = ({ new_data_plus,
  menu_for_style }) => {
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
  let elements: Class_LinkStyleOSP[] | Type_GenericLinkElementOSP[]
  if (menu_for_style) {
    elements = [new_data_plus.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }

  const shape_is_dashed = (elements[0]?.shape_is_dashed ?? default_shape_is_dashed)


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

  const check_indeterminate = (curr: Type_GenericLinkElementOSP) => {
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
        isAttributeOverloaded(selected_links, 'shape_is_dashed') ?
        TooltipValueSurcharge('link_var_', t) :
        <></>
    }
  </Checkbox>
}

export const MenuConfLinkScientificPrecision: FunctionComponent<FCType_MenuConfLinkScientificPrecision> = ({ new_data_plus, menu_for_style }) => {
  {/* Afficher ou non les donnée sur le Sankey  */ }
  const { drawing_area, menu_configuration, t } = new_data_plus
  const { ref_selected_style_link } = new_data_plus.menu_configuration
  // Function used to force this component to reload
  const [, setCount] = useState(0)
  menu_configuration.ref_to_menu_config_link_scientific_precision_updater.current = () => setCount(a => a + 1)
  // Ref to input displayed value

  let selected_links: Type_GenericLinkElementOSP[]
  if (!menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = drawing_area.visible_and_selected_links_list_sorted
  }
  // Elements on which menu modification applies
  let elements: Class_LinkStyle[] | Type_GenericLinkElementOSP[]
  if (menu_for_style) {
    elements = [new_data_plus.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    Class_LinkStyle
    elements = selected_links
  }


  const value_label_scientific_notation = (elements[0]?.value_label_scientific_notation ?? default_link_value_label_scientific_notation)
  const value_label_significant_digits = (elements[0]?.value_label_significant_digits ?? default_link_value_label_significant_digits)
  const value_label_nb_significant_digits = (elements[0]?.value_label_nb_significant_digits ?? default_link_value_label_nb_significant_digits)

  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void> = useRef((_: string | null | undefined) => null)
  ref_set_number_inputs.current(String(value_label_nb_significant_digits))


  // const check_indeterminate = (curr: Type_GenericLinkElementOSP) => {
  //   return (elements[0].shape_is_gradient == curr.shape_is_gradient)
  // }
  // const is_indeterminate = !elements.every(check_indeterminate)


  /**
 * Function used to reset menu UI
 */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data_plus.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setCount(a => a + 1)
    if (menu_for_style) {
      new_data_plus.menu_configuration.updateAllComponentsRelatedToLinks()
      // Update menus for link's apparence in case we use this for style
      new_data_plus.menu_configuration.updateComponentRelatedToLinksStyles()
      // Redraw all visible nodes if we modifie link style
      new_data_plus.drawing_area.sankey.visible_links_list.forEach(link => link.draw())
    }
    // And update this menu also
    new_data_plus.menu_configuration.updateComponentRelatedToLinksApparence()
  }


  return <>
    {/* Choose number of significant number */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols_little_input' >
      {/* Choix d'affichage du nombre de chiffre significatifs  */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={value_label_significant_digits}
        onChange={(evt) => {
          elements.forEach(element => {
            element.value_label_significant_digits = evt.target.checked
            if (evt.target.checked) {
              element.value_label_scientific_notation = false
              element.value_label_custom_digit = false
            }
          })
          refreshThisAndUpdateRelatedComponents()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.significantDigits')}>
          {t('Flux.label.significantDigits') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
            isAttributeOverloaded(selected_links, 'value_label_significant_digits') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>
      {value_label_significant_digits ?
        /* Choose number of custom digit */

        /* <Box layerStyle='menuconfigpanel_option_name'>
                {t('Flux.label.NbDigit')}
              </Box> */
        <OSTooltip label={t('Flux.label.tooltips.significantDigits')}>
          <ConfigMenuNumberInput
            t={new_data_plus.t}
            ref_to_set_value={ref_set_number_inputs}
            default_value={value_label_nb_significant_digits}
            menu_for_style={/*menu_for_style*/false}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              elements.forEach(element =>
                element.value_label_nb_significant_digits = value ?? undefined)
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </OSTooltip>
        : <></>
      }
    </Box>
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={value_label_scientific_notation}
      onChange={(evt) => {
        elements.forEach(element => {
          if (evt.target.checked) {
            element.value_label_custom_digit = false
          }
          element.value_label_scientific_notation = evt.target.checked
        })
        refreshThisAndUpdateRelatedComponents()
      }}>
      <OSTooltip label={t('Flux.label.tooltips.scientificNotation')}>
        {t('Flux.label.scientificNotation') + ' '}
      </OSTooltip>
      {
        (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'value_label_scientific_notation') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>
      }
    </Checkbox>

  </>
}


export const ButtonLinkContextAssignTag: FunctionComponent<FCType_MenuContextLink> = ({ new_data }) => {
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
                            new_data.drawing_area.link_contextualised=undefined
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