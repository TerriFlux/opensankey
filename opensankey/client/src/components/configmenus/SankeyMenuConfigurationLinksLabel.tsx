import React, { useState, MutableRefObject } from 'react'
import { Button, Box } from '@chakra-ui/react'
import {
  SimpleElementCheckbox, ValueKey, MenuSectionCheckbox
} from './MenuCommon'

import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/Element'
import { SankeyMenuLabelComponent } from './MenuLabel'
import { SankeyLinkSelectionSimple } from './SankeyMenuConfigurationLinks'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { default_style_id } from '../../types/Utils'
import { LINKS_ATTRIBUTES_CONFIG, NAME_LABEL_CONFIG, VALUE_LABEL_CONFIG } from '../../Elements/ElementsAttributesConfig'


export const MenuConfigurationLinkLabel = ({ app_data, menu_for_style, additionMenus }: {
  app_data: Class_ApplicationData
  menu_for_style: boolean
  additionMenus: MutableRefObject<Type_AdditionalMenus>,
}) => {
  const { drawing_area } = app_data
  const { sankey } = drawing_area
  const { ref_selected_style_link } = app_data.menu_configuration
  const { link_styles_dict } = app_data.drawing_area.sankey
  // Elements on which this menu applies ------------------------------------------------
  // State variable to trigger this menu refreshing
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Link this menu's update function
  if (!menu_for_style) {
    app_data.menu_configuration.ref_to_menu_config_links_apparence_context_updater.current = () => setCount(a => a + 1)
  } else {
    app_data.menu_configuration.ref_to_menu_config_links_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  const correct_dict_style_to_use = link_styles_dict
  const correct_ref_style_to_use = ref_selected_style_link

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ?
    correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute :
    correct_dict_style_to_use[default_style_id].customisable_attribute

  // Selected links
  let selected_links
  if (!app_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStyle[] | Class_LinkElement[]

  /**
 * Function used to reset menu UI
 */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      app_data.menu_configuration.updateAllComponentsRelatedToLinks()
      // Update menus for link's apparence in case we use this for style
      app_data.menu_configuration.updateComponentRelatedToLinksStyles()
      // Redraw all visible nodes if we modifie link style
      sankey.visible_links_list.forEach(link => link.draw())
    }
    // And update this menu also
    app_data.menu_configuration.updateComponentRelatedToLinksApparence()
  }

  if (menu_for_style) {
    elements = [sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }

  // Elements attributes ----------------------------------------------------------------
  const element_ref = elements[0]
  const value_label_is_visible = (element_ref?.value_label_is_visible ?? LINKS_ATTRIBUTES_CONFIG.value_label_is_visible.default)
  const name_label_is_visible = (element_ref?.name_label_is_visible ?? LINKS_ATTRIBUTES_CONFIG.name_label_is_visible.default)


  const content_value_specific_flow = value_label_is_visible ? <>
    {/* Orienter le texte du label le long du flux  */}
    <SimpleElementCheckbox
      app_data={app_data}
      elements={elements}
      attributeKey={'value_label_on_path' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
    {/* Button to adjust label position in case the label is bigger than the link */}
    <SimpleElementCheckbox
      app_data={app_data}
      elements={elements}
      attributeKey={'value_label_pos_auto' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
  </> : <></>

  const content_label_value = <MenuSectionCheckbox
    app_data={app_data}
    elements={elements}
    attributePath='Flux.labels'
    attributeKey={'value_label_is_visible'}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {value_label_is_visible ?
      <>
        {/* Common component with label component */}
        <SankeyMenuLabelComponent
          app_data={app_data}
          elements={elements}
          attributePath='Flux.labels'
          config={NAME_LABEL_CONFIG}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'value_'} />
        {content_value_specific_flow}
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Button variant={'menuconfigpanel_option_button'}
            onClick={() => {
              app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_shape_attribute_editor.current(true)
              app_data.menu_configuration.r_shape_attributes_set_elements.current(
                elements,
                'Flux.labels',
                'value_label_background',
                disable_attr_props,
                () => null
              )
            }}
          >
            {'Fond'}
          </Button>
          <Button variant={'menuconfigpanel_option_button'}
            onClick={() => {
              app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_value_formatting_editor.current(true)
              app_data.menu_configuration.r_value_formatting_set_elements.current(
                elements,
                'Flux.labels',
                disable_attr_props
              )
            }}
          >
            {'Formattage valeurs'}
          </Button>
        </Box>
      </> :
      <></>}
  </MenuSectionCheckbox>


  const content_name_specific_flow = name_label_is_visible ? <>
    {/* Orienter le texte du label le long du flux  */}
    <SimpleElementCheckbox
      app_data={app_data}
      elements={elements}
      attributeKey={'name_label_on_path' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
    {/* Button to adjust label position in case the label is bigger than the link */}
    <SimpleElementCheckbox
      app_data={app_data}
      elements={elements}
      attributeKey={'name_label_pos_auto' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
  </> : <></>

  const content_label_text = <MenuSectionCheckbox
    app_data={app_data}
    elements={elements}
    attributePath='Flux.labels'
    attributeKey={'name_label_is_visible'}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {name_label_is_visible ? <SankeyMenuLabelComponent
      app_data={app_data}
      elements={elements}
      attributePath='Flux.labels'
      config={VALUE_LABEL_CONFIG}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      prefix={'name_'} /> : <></>}

    {content_name_specific_flow}
    <Button variant={'menuconfigpanel_option_button'}
      onClick={() => {
        app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_shape_attribute_editor.current(true)
        app_data.menu_configuration.r_shape_attributes_set_elements.current(
          elements,
          'Flux.labels',
          'name_label_background',
          disable_attr_props,
          () => null
        )
      }}
    >
      {'Fond'}
    </Button>
  </MenuSectionCheckbox>

  return <>
    {menu_for_style ? <></> : <SankeyLinkSelectionSimple new_data={app_data} />}
    {menu_for_style ? <></> : <ConfigMenuStyleElement
      app_data={app_data}
      selected_elements={selected_links}
      config={LINKS_ATTRIBUTES_CONFIG}
      categories={['value_label', 'name_label']}
      nodesOrLinks={'links'}
    />}
    <>{elements.length > 0 ? <>
      {content_label_value}
      {content_label_text}
    </> : <></>}</>
  </>
}
