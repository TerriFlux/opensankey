import React from 'react'
import { faTable } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, MenuList, MenuItem, Menu, MenuButton, } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { CONVERTER_CONFIGS } from '@terriflux/opensankey/src/components/dialogs/PersistenceProcessDialogConfigs'

export const AFMEditionMenu = ({ app_data }: {
  app_data: Class_ApplicationDataOSP
}) => {

  const { t } = app_data

  // #1258 — icône servie par icon_library (fin du SVG inline codé en dur).
  const svg_reconcile = (
    <Box as='span' fontSize='1.25rem' display='inline-flex'>
      {app_data.icon_library.icon_afm}
    </Box>
  )

  return <>
    <Menu
      variant='menu_button_subnav_style'
      placement='bottom-start'
    >
      <OSTooltip
        placement='bottom' label={t('Menu.tooltips.reconcil')}>
        <MenuButton>
          <Box
            gridColumn='1'
            gridColumnEnd="span 2"
            gridRow="1"
          >
            {svg_reconcile}
          </Box>
          <Box
            gridColumn="1"
            gridRow="2"
          >
            {t('Menu.afm_reconcil')}
          </Box>
          <Box
            gridColumn="2"
            gridRow="2"
            height="1rem"
            width="1rem"
          >
            <ChevronDownIcon
              style={{ 'height': '1rem', 'width': '1rem' }}
            />
          </Box>
        </MenuButton>
      </OSTooltip>

      <MenuList>
        <MenuItem
          onClick={() => {
            app_data.menu_configuration.ref_universal_converter_set_config.current(
              CONVERTER_CONFIGS['reconciliation'], '', false
            )
            app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
          }}>
          <FontAwesomeIcon
            style={{ 'height': '1rem', 'width': '1rem' }}
            icon={faTable}
          />
          <Box>
            {t('Menu.afm_reconcil_excel')}
          </Box>
        </MenuItem>
      </MenuList>
    </Menu>
  </>
}