// // External imports
// import * as d3 from 'd3'

import React, { FunctionComponent, useState } from 'react'
import { Checkbox } from '@chakra-ui/react'

import { OSTooltip, TooltipValueSurcharge } from './deps/OpenSankey/types/Utils'
import { isAttributeOverloaded } from './deps/OpenSankey/types/Link'

import type { MenuConfLinkApparenceGradientFType } from '../types/SankeyPlusGradientTypes'
import type { Class_LinkStylePlus } from './Types/LinkPlus'
import type { Type_GenericLinkElementOSP, Type_GenericNodeElementOSP } from './Types/TypesOSP'


// import { Checkbox } from '@chakra-ui/react'

export const MenuConfLinkApparenceGradient: FunctionComponent<MenuConfLinkApparenceGradientFType> = ({
  applicationData,
  is_activated,
  menu_for_style,
}) => {

  // Get data
  const { new_data } = applicationData
  const { ref_selected_style_link } = new_data.menu_configuration

  const { t } = new_data
  const [forceUpdate, setForceUpdate] = useState(false)
  // I have to do this because when we change selected_style_link it only re-render SankeyModalStyleLink
  // who re-render MenuConfigurationLinksAppearence
  // but MenuConfLinkApparenceGradient is rendered outside the scope of SankeyModalStyleLink
  // so selected_style_link can be out of sync with the real selected_style_link
  // if (menu_for_style && !Object.keys(data.style_link).includes(selected_style_link.current)) {
  //   selected_style_link.current = (Object.keys(data.style_link)[0])
  // }

  // Selected links
  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStylePlus[] | Type_GenericLinkElementOSP[]
  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
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
        new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

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
