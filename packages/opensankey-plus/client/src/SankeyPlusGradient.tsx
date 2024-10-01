// External imports
import React, { FunctionComponent, useRef, useState } from 'react'
import { Box, Checkbox } from '@chakra-ui/react'

// OpenSankey imports
import { OSTooltip, TooltipValueSurcharge } from './deps/OpenSankey/types/Utils'
import { default_shape_is_dashed, isAttributeOverloaded } from './deps/OpenSankey/types/Link'

// Local imports
import type { FCType_MenuConfLinkApparenceDashedOSP, FCType_MenuConfLinkApparenceGradientOSP, FCType_MenuConfLinkDataTextOSP } from './ftypes/SankeyPlusGradientTypes'
import type { Class_LinkStylePlus } from './types/LinkPlus'
import type { Type_GenericLinkElementOSP, Type_GenericNodeElementOSP } from './types/TypesOSP'
import { ConfigMenuTextInput } from './deps/OpenSankey/configmenus/SankeyMenuConfiguration'


export const MenuConfLinkApparenceGradientOSP: FunctionComponent<FCType_MenuConfLinkApparenceGradientOSP> = ({
  new_data_plus,
  menu_for_style,
}) => {

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
  let elements: Class_LinkStylePlus[] | Type_GenericLinkElementOSP[]
  if (menu_for_style) {
    elements = [new_data_plus.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }
  const check_indeterminate = (curr: Type_GenericLinkElementOSP) => {
    return (selected_links[0].shape_is_gradient == curr.shape_is_gradient)
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)

  return elements.length > 0 ? (<OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isDisabled={!new_data_plus.has_sankey_plus}
      isIndeterminate={is_indeterminate}
      isChecked={elements[0].shape_is_gradient}
      iconColor={is_indeterminate ? '#78C2AD' : 'white'}
      onChange={(evt) => {
        const list_node_to_redraw_arrow: Type_GenericNodeElementOSP[] = []
        elements.forEach(element => {
          element.shape_is_gradient = evt.target.checked
          if (!menu_for_style) {
            list_node_to_redraw_arrow.push((element as Type_GenericLinkElementOSP).target)
          }
        });
        //Remove duplicate node in array then redraw link arrow of nodes
        [...new Set(list_node_to_redraw_arrow)].forEach(n => n.drawLinksArrow())
        new_data_plus.menu_configuration.ref_to_save_in_cache_indicator.current(false)

        setForceUpdate(!forceUpdate)
      }}>
      {t('Flux.apparence.grad')}
      {(!menu_for_style) &&
        isAttributeOverloaded(selected_links, 'value_label_on_path') ?
        TooltipValueSurcharge('link_var_', t) :
        <></>}
    </Checkbox>
  </OSTooltip>) : <></>

}

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
  let elements: Class_LinkStylePlus[] | Type_GenericLinkElementOSP[]
  if (menu_for_style) {
    elements = [new_data_plus.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }

  const shape_is_dashed = (elements[0]?.shape_is_dashed ?? default_shape_is_dashed)


  const check_indeterminate = (curr: Type_GenericLinkElementOSP) => {
    return (selected_links[0].shape_is_dashed == curr.shape_is_dashed)
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)
  return <OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isIndeterminate={is_indeterminate}
      isDisabled={!new_data_plus.has_sankey_plus}
      isChecked={shape_is_dashed}
      onChange={(evt) => {
        elements.forEach(element => element.shape_is_dashed = evt.target.checked)
        const list_node_to_redraw_arrow: Type_GenericNodeElementOSP[] = []
        elements.forEach(element => {
          element.shape_is_dashed = evt.target.checked
          if (!menu_for_style) {
            list_node_to_redraw_arrow.push((element as Type_GenericLinkElementOSP).target)
          }
        });

        new_data_plus.menu_configuration.ref_to_save_in_cache_indicator.current(false)

        setForceUpdate(!forceUpdate)
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
    </Checkbox></OSTooltip>
}


export const MenuConfLinkDataText: FunctionComponent<FCType_MenuConfLinkDataTextOSP> = ({ new_data_plus }) => {
  {/* Afficher ou non les donnée sur le Sankey  */ }
  const {drawing_area,menu_configuration, t } = new_data_plus

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  // Ref to input displayed value
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  let selected_links: Type_GenericLinkElementOSP[]
  if (!menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = drawing_area.visible_and_selected_links_list_sorted
  }

  const updateInputsValues = () => {
    // Recreate a updated_selected_links list in the function because it can be called before re-rendering <MenuConfigurationLinksData/>
    // so selected_links can have the list of previous selected links wich can lead to incorrect links value
    const updated_selected_links = !menu_configuration.is_selector_only_for_visible_links ?
      drawing_area.selected_links_list_sorted : drawing_area.visible_and_selected_links_list_sorted

    const value_update = updated_selected_links[0]?.value

    // Update input data value
    ref_set_text_value_input.current(String(value_update?.text_value ?? ''))
  }

  // Current Link value
  const value = selected_links[0]?.value

  // Save current component updater to a variable 
  menu_configuration.ref_to_menu_config_link_data_text_updater.current = () => {
    updateInputsValues()
    setCount(a=>a+1)
  }

  // Updater of component related to link data
  const refreshThisAndUpdateRelatedComponents=()=>{
    menu_configuration.updateComponentRelatedToLinksData()
  }


  return <OSTooltip label={t('Flux.data.tooltips.affichage')}>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name' >
        {t('Flux.data.affichage')}
      </Box>
      <ConfigMenuTextInput
        disabled={!new_data_plus.has_sankey_plus}
        ref_to_set_value={ref_set_text_value_input}
        function_get_value={() => { return value?.text_value }}
        function_on_blur={(_) => {
          // Update text for links
          selected_links.forEach(link => {
            link.text_value = (_ ?? '')
          })
          // Update this menu
          refreshThisAndUpdateRelatedComponents()
        }}
      />
    </Box>
  </OSTooltip>
}
