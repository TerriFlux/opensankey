import React, { FunctionComponent, useState } from 'react'

// import { Form,  Button, ButtonGroup, InputGroup} from 'react-bootstrap'

import { SankeyData } from '../types/Types'
import { TFunction, i18n } from 'i18next'
import { Box, Button, Checkbox, Input, Select } from '@chakra-ui/react'
import { OSTooltip } from '../configmenus/SankeyUtils'
import { OpenSankeyDefaultModalePreferenceContentFType, modalPreferenceTypes, preferenceCheckFType } from './types/SankeyMenuPreferencesTypes'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'


export const OpenSankeyDefaultModalePreferenceContent : OpenSankeyDefaultModalePreferenceContentFType =(
  t:TFunction,
  dict_variable_application_data,
  trad:i18n,
  updateMenus,
  node_function
)=>{
  const {data,display_nodes}=dict_variable_application_data
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
              // ComponentUpdater.updateComponentMenuConfig.current()
              // ComponentUpdater.updatePreference.current()
              updateMenus[1](!updateMenus[0])
            }}
          >Mode Simple</Button>
          <Button variant='menuconfigpanel_option_button_right'
            onClick={() => {
              sessionStorage.setItem('modepref','expert')
              data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
              // ComponentUpdater.updateComponentMenuConfig.current()
              // ComponentUpdater.updatePreference.current()
              updateMenus[1](!updateMenus[0])
            }}
          >Mode Expert</Button>
        </Box>
      </Box>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.accordeonToShow.includes('MEP')}
        onChange={() => {
          preferenceCheck('MEP',data)
          // ComponentUpdater.updateComponentMenuConfig.current()
          // ComponentUpdater.updatePreference.current()
          updateMenus[1](!updateMenus[0])
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
          // ComponentUpdater.updateComponentMenuConfig.current()
          // ComponentUpdater.updatePreference.current()
          updateMenus[1](!updateMenus[0])
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
          // ComponentUpdater.updateComponentMenuConfig.current()
          // ComponentUpdater.updatePreference.current()
          updateMenus[1](!updateMenus[0])
        }}>
        {t('Menu.EF')}
      </Checkbox>,

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.accordeonToShow.includes('ED')}
        onChange={() => {
          preferenceCheck('ED',data)
          // ComponentUpdater.updateComponentMenuConfig.current()
          // ComponentUpdater.updatePreference.current()
          updateMenus[1](!updateMenus[0])
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
            data.node_label_separator=evt.target.value
            // ComponentUpdater.updateComponentMenuConfig.current()
            // ComponentUpdater.updatePreference.current()
            updateMenus[1](!updateMenus[0])
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
  {dict_hook_ref_setter_show_dialog_components,ui,t,pointer_pos
  })=>{
  const content=<>
    {Object.values(ui).map((d,i)=>{
      return <React.Fragment key={i}>{d}</React.Fragment>
    })}
  </>

  return MenuDraggable(dict_hook_ref_setter_show_dialog_components,'ref_setter_show_modal_preference',content,pointer_pos,t('Menu.title_pref'),34)

}

