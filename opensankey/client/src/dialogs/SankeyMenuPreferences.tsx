// External imports
import React, { FunctionComponent } from 'react'
import { Box, Button, Checkbox, Input, Select } from '@chakra-ui/react'

// Internal types / classes
import { SankeyData } from '../types/Types'
import {
  OpenSankeyDefaultModalePreferenceContentFType,
  modalPreferenceTypes,
  preferenceCheckFType
} from './types/SankeyMenuPreferencesTypes'

// Internal components / functions
import { OSTooltip } from '../configmenus/SankeyUtils'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'


// COMPONENTS ===========================================================================
export const OpenSankeyDefaultModalePreferenceContent : OpenSankeyDefaultModalePreferenceContentFType =(
  applicationContext,
  applicationData,
  trad,
  node_function
)=>{
  // Data -------------------------------------------------------------------------------
  const { t } = applicationContext
  const { new_data, data, display_nodes } = applicationData

  // JSX Component ----------------------------------------------------------------------

  const ui={
    'lang':  <Box layerStyle='menuconfigpanel_row_2cols' >

      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.lang')}</Box>
      <Select
        variant='menuconfigpanel_option_select'
        value={trad.language}
        onChange={evt=>{
          trad.changeLanguage((evt.target.value))
        }}
      >
        <option key={'francais'} value={'fr'}>Français</option>
        <option key={'english'} value={'en'}>English</option>
      </Select>
    </Box>,


    'form':[
      <h4>{t('Menu.pref_title_sub_menu')}</h4>,
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        <Box layerStyle='options_2cols' >

          <Button variant='menuconfigpanel_option_button_left'
            onClick={() => {
              sessionStorage.removeItem('modepref')
              data.accordeonToShow = ['MEP']
              new_data.menu_configuration.ref_to_menu_updater.current()
            }}
          >
            Mode Simple
          </Button>
          <Button variant='menuconfigpanel_option_button_right'
            onClick={() => {
              sessionStorage.setItem('modepref','expert')
              data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
              new_data.menu_configuration.ref_to_menu_updater.current()
            }}
          >
            Mode Expert
          </Button>
        </Box>
      </Box>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.accordeonToShow.includes('MEP')}
        onChange={() => {
          preferenceCheck('MEP',data)
          new_data.menu_configuration.ref_to_menu_updater.current()
        }}>
        {t('Menu.MEP')}
      </Checkbox>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked
        disabled
      >
        {t('Menu.Noeuds')}
      </Checkbox>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.accordeonToShow.includes('EN')}
        onChange={() => {
          preferenceCheck('EN',data)
          new_data.menu_configuration.ref_to_menu_updater.current()
        }}>
        {t('Menu.EN')}
      </Checkbox>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked
        disabled
      >
        {t('Menu.flux')}
      </Checkbox>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.accordeonToShow.includes('EF')}
        onChange={() => {
          preferenceCheck('EF',data)
          new_data.menu_configuration.ref_to_menu_updater.current()
        }}>
        {t('Menu.EF')}
      </Checkbox>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.accordeonToShow.includes('ED')}
        onChange={() => {
          preferenceCheck('ED',data)
          new_data.menu_configuration.ref_to_menu_updater.current()
        }}>
        {t('Menu.ED')}
      </Checkbox>,
    ],
    'node_label_sep':<OSTooltip label={t('Menu.tooltips.node_label_sep')}>
      <Box layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep')}</Box>
        <Input
          variant='menuconfigpanel_option_input' value={data.node_label_separator}
          onChange={evt=>{
            data.node_label_separator = evt.target.value  // TODO passer dans new_data
            new_data.menu_configuration.ref_to_menu_updater.current()
          }}
          onBlur={()=>node_function.RedrawNodes(Object.values(display_nodes))}
        />
      </Box></OSTooltip>,
  }
  return ui
}

export const preferenceCheck : preferenceCheckFType  = (str: string,data:SankeyData) => {
  sessionStorage.removeItem('modepref')
  if (!data.accordeonToShow.includes(str)) {
    data.accordeonToShow.push(str)
  } else {
    const posElemt = data.accordeonToShow.indexOf(str)
    data.accordeonToShow.splice(posElemt, 1)
  }
}

export const ModalPreference: FunctionComponent<modalPreferenceTypes> = (
  {
    dict_hook_ref_setter_show_dialog_components,
    ui,
    t,
    pointer_pos
})=>{
  const content = <>
    {Object.values(ui).map((d,i)=>{
      return <React.Fragment key={i}>{d}</React.Fragment>
    })}
  </>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
    dialog_name={'ref_setter_show_modal_preference'}
    content={content}
    pointer_pos={pointer_pos}
    title={t('Menu.title_pref')}
  />
}

