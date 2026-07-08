// Standard libs
import React, { useState } from 'react'
import {
  Select,
} from '@chakra-ui/react'

// OpenSankey Libs
import { default_main_sankey_id } from '@terriflux/opensankey/src/types/Utils'
import { ConfigMenuTextInput } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'

/**
 * View selector for navbar or menuconfig
 * @param {*} {
 *   app_data
 * }
 * @return {*}
 */
export const SelecteurView = (
  { app_data }: { app_data: Class_ApplicationDataOSP }
) => {
  const [s_select_or_edit, sSelectOrEdit] = useState<'edit' | 'select'>('select')

  const has_sankey_plus = app_data.has_sankey_plus
  const has_views = app_data.has_views
  const is_view_master = app_data.is_view_master
  const master_name = app_data.master_view_name || app_data.t('view.actual')

  // JSX elements -----------------------------------------------------------------------

  const selecteur = <Select
    variant='view_select'
    style={is_view_master ? { fontStyle: 'italic', backgroundColor: '#e2e8f0' } : undefined}
    onDoubleClick={() => {
      if (
        has_sankey_plus &&
        has_views &&
        !is_view_master
      ) {
        sSelectOrEdit('edit') // Swith to edition mode
      }
    }}
    onChange={
      (evt: React.ChangeEvent<HTMLSelectElement>) => {
        app_data.setCurrentView(evt.target.value)
        // Update views components (without updating save in cache button)
        app_data.menu_configuration_osp.updateComponentRelatedToViews()
      }
    }
    value={
      // Identité LOGIQUE de la vue courante (une vue light réutilise la DA maître, donc
      // cur_view.id vaudrait le maître ; current_view_id reflète la vraie vue sélectionnée).
      Object.keys(app_data.views_dict).includes(app_data.current_view_id) && app_data.current_view_id !== default_main_sankey_id
        ? app_data.current_view_id
        : default_main_sankey_id
    }
  >
    {/* Maître non listé (option désactivée) : placeholder caché pour que la valeur courante
        « maître » reste affichable sans polluer la liste. */}
    {!app_data.show_master_in_views &&
      <option value={default_main_sankey_id} disabled hidden>{master_name}</option>}
    {
      app_data.views_navigation_order
        .map((view, i) => {
          const is_master_option = view === default_main_sankey_id
          return <option
            key={i}
            value={view}
            style={is_master_option ? { fontStyle: 'italic', backgroundColor: '#e2e8f0' } : undefined}
          >
            {is_master_option ? master_name : app_data.views_dict[view].name}
          </option>
        })
    }
  </Select>

  const text_input = <ConfigMenuTextInput
    t={app_data.t}
    default_value={app_data.views_dict[app_data.current_view_id]?.name}
    function_on_blur={(_) => {
      // Update text for links
      if ((_ !== undefined) && (_ !== null)) {
        app_data.views_dict[app_data.current_view_id].name = _
        //cur_view.name = _
      }
      // Update this menu
      sSelectOrEdit('select')
      // Update views components
      app_data.menu_configuration_osp.updateComponentRelatedToViews()
    }}
    disabled={!has_views}
  />
  return ((s_select_or_edit === 'edit') || (!has_views)) ? text_input : selecteur
}
