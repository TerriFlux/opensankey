import React, { useState, Fragment, MutableRefObject } from 'react'
import {
  SimpleElementCheckbox, ValueKey, MenuSectionCheckbox
} from './MenuCommon'

import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/ElementStyle'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'
import { SankeyMenuLabelComponent } from './MenuLabel'
import { MenuUnit } from './MenuUnit'
import { SankeyMenuValueLabelComponent } from './MenuValueLabel'
import { SankeyLinkSelectionSimple } from './SankeyMenuConfigurationLinks'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'


export const MenuConfigurationLinkLabel = ({ new_data, menu_for_style, additionMenus }:{
  new_data: Class_ApplicationData
  menu_for_style: boolean
  additionMenus: MutableRefObject<Type_AdditionalMenus>,
}) => {
  const { drawing_area } = new_data
  const { sankey } = drawing_area
  const { ref_selected_style_link } = new_data.menu_configuration

  // Elements on which this menu applies ------------------------------------------------
  // State variable to trigger this menu refreshing
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Link this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_links_apparence_context_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_links_styles_updater.current = () => setCountStyle(a => a + 1)
  }
  // Selected links
  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
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
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      new_data.menu_configuration.updateAllComponentsRelatedToLinks()
      // Update menus for link's apparence in case we use this for style
      new_data.menu_configuration.updateComponentRelatedToLinksStyles()
      // Redraw all visible nodes if we modifie link style
      sankey.visible_links_list.forEach(link => link.draw())
    }
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToLinksApparence()
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
      app_data={new_data}
      elements={elements}
      attributeKey={'value_label_on_path' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
    {/* Button to adjust label position in case the label is bigger than the link */}
    <SimpleElementCheckbox
      app_data={new_data}
      elements={elements}
      attributeKey={'value_label_pos_auto' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
  </> : <></>

  const content_label_value = <MenuSectionCheckbox
    app_data={new_data}
    elements={elements}
    attributePath='Flux.labels'
    attributeKey={'value_label_is_visible'}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {value_label_is_visible ?
      <>
        {/* Common component with label component */}
        <SankeyMenuLabelComponent
          new_data={new_data}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'value_'} />
        {content_value_specific_flow}
        <SankeyMenuValueLabelComponent
          new_data={new_data}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'value_'} />

        {additionMenus.current.additional_link_appearence_value.map((el, idx) => <Fragment key={'additional_apparence_' + idx}>{el(menu_for_style)}</Fragment>)}
      </> :
      <></>}
  </MenuSectionCheckbox>

  const content_unit = <MenuUnit
    new_data={new_data}
    elements={elements}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
  // Content specific to link label, it us not generic so not in SankeyMenuLabelComponent
  const content_name_specific_flow = name_label_is_visible ? <>
    {/* Orienter le texte du label le long du flux  */}
    <SimpleElementCheckbox
      app_data={new_data}
      elements={elements}
      attributeKey={'name_label_on_path' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
    {/* Button to adjust label position in case the label is bigger than the link */}
    <SimpleElementCheckbox
      app_data={new_data}
      elements={elements}
      attributeKey={'name_label_pos_auto' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents} />
  </> : <></>

  const content_label_text = <MenuSectionCheckbox
    app_data={new_data}
    elements={elements}
    attributePath='Flux.labels'
    attributeKey={'name_label_is_visible'}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {name_label_is_visible ? <SankeyMenuLabelComponent
      new_data={new_data}
      elements={elements}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      prefix={'name_'} /> : <></>}

    {content_name_specific_flow}
  </MenuSectionCheckbox>

  return <>
    {menu_for_style ? <></> : <SankeyLinkSelectionSimple new_data={new_data} />}
    {menu_for_style ? <></> : <ConfigMenuStyleElement
      app_data={new_data}
      selected_elements={selected_links}
      config={LINKS_ATTRIBUTES_CONFIG}
      categories={['value_label', 'name_label']}
      nodesOrLinks={'links'}
    />}
    <>{elements.length > 0 ? <>
      {content_label_value}
      {content_unit}
      {content_label_text}
    </> : <></>}</>
  </>
}
