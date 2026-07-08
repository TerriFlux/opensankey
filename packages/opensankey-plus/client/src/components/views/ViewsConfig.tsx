// Standard libs
import React, { useState } from 'react'
import {
  Box,
  Input,
  InputGroup,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  Checkbox,
} from '@chakra-ui/react'

// OpenSankey Libs
import { default_main_sankey_id } from '@terriflux/opensankey/src/types/Utils'
import { WrapperBoxSubSectionMenu } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { Class_DrawingAreaOSP } from '../../types/DrawingAreaOSP'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'
import { SelecteurView } from './SelecteurView'

/**
 * Content for view config in menu configuration
 * @param {*} {
 *   app_data,
 * }
 * @return {*}
 */
export const ViewsConfig = (
  { app_data }: { app_data: Class_ApplicationDataOSP }
) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library, menu_configuration_osp, drawing_area } = app_data
  const { icon_remove_element, icon_move_element_up, icon_move_element_down } = icon_library

  // Components updaters ----------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  menu_configuration_osp.ref_to_views_config_updater.current = refreshThis

  // Local variables --------------------------------------------------------------------
  const drawing_area_plus = drawing_area as Class_DrawingAreaOSP
  const is_activated = app_data.has_sankey_plus
  const curr_view = drawing_area_plus
  const list_view = app_data.views_navigation_order // maître en tête si show_master_in_views

  // JSX elements -----------------------------------------------------------------------

  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)

  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('view.storytelling')}>
    <Box layerStyle='menuconfigpanel_grid'>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('view.select')}
        </Box>
        <InputGroup
          variant='menuconfigpanel_option_input'>
          <SelecteurView app_data={app_data} />
        </InputGroup>
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('view.show_master_in_list')}
        </Box>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isDisabled={!is_activated}
          isChecked={app_data.show_master_in_views}
          onChange={() => {
            app_data.show_master_in_views = !app_data.show_master_in_views
            menu_configuration_osp.updateComponentRelatedToViews()
            refreshThis()
          }}
        />
      </Box>
      <Table variant='table_view' size='sm'>
        <Thead>
          <Tr>
            <Th>{t('view.name')}</Th>
            <Th>Position</Th>
            <Th>{t('view.delete')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {list_view.map((view_id, idx) => {
            const is_master = view_id == default_main_sankey_id
            return (
              <React.Fragment key={idx}>
                <Tr style={{ 'border': (view_id === curr_view.id) ? '2px solid #5a9282' : 'none' }}>
                  <Td>
                    <Input
                      variant='menuconfigpanel_option_input'
                      // Maître : libellé éditable dédié (master_view_name), placeholder = défaut.
                      value={is_master ? app_data.master_view_name : app_data.views_dict[view_id].name}
                      placeholder={is_master ? t('view.actual') : undefined}
                      isDisabled={!is_activated}
                      onChange={evt => {
                        if (is_master) app_data.master_view_name = evt.target.value
                        else app_data.views_dict[view_id].name = evt.target.value
                        refreshThis()
                      }}
                      onBlur={() => {
                        menu_configuration_osp.updateComponentRelatedToViews()
                      }}
                    />
                  </Td>
                  <Td>
                    {/* Change the position of the view in the liste of view from master data */}
                    <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={() => { app_data.moveViewUpInOrder(view_id); menu_configuration_osp.updateComponentRelatedToViews() }}
                    >
                      {icon_move_element_up}
                    </Button>
                    <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={() => { app_data.moveViewDownInOrder(view_id); menu_configuration_osp.updateComponentRelatedToViews() }}
                    >
                      {icon_move_element_down}
                    </Button>
                  </Td>
                  <Td>
                    <Button
                      variant='menuconfigpanel_del_button_in_table'
                      isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={
                        // Delete the view
                        () => {
                          app_data.deleteView(view_id)
                          menu_configuration_osp.updateComponentRelatedToViews()
                        }
                      }
                    >
                      {icon_remove_element}
                    </Button>
                  </Td>
                </Tr>
              </React.Fragment>
            )
          })}
        </Tbody>
      </Table>
    </Box>

  </WrapperBoxSubSectionMenu>
}
