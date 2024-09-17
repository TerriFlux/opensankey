// External imports
import React, { FunctionComponent, useState } from 'react'
import { Checkbox } from '@chakra-ui/react'

// OpenSankey imports
import { OSTooltip, TooltipValueSurcharge } from './deps/OpenSankey/types/Utils'
import { isAttributeOverloaded } from './deps/OpenSankey/types/Link'

// Local imports
import type { FCType_MenuConfLinkApparenceGradientOSP } from '../types/SankeyPlusGradientTypes'
import type { Class_LinkStylePlus } from './types/LinkPlus'
import type { Type_GenericLinkElementOSP, Type_GenericNodeElementOSP } from './types/TypesOSP'


export const MenuConfLinkApparenceGradientOSP: FunctionComponent<FCType_MenuConfLinkApparenceGradientOSP> = ({
  new_data_plus,
  is_activated,
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

  return elements.length > 0 ? (<OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isDisabled={!is_activated}
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
