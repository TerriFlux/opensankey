// External imports
import React, { FunctionComponent, createRef, useRef, MutableRefObject, RefObject } from 'react'
import { Box, Button, Checkbox, Input, Select, useBoolean } from '@chakra-ui/react'

// Internal types / classes
import {
  OpenSankeyDefaultModalePreferenceContentFType,
  modalPreferenceTypes
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

  // Component updater ------------------------------------------------------------------

  const menus = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
  const checkbox_refs: {[_: string]: RefObject<HTMLInputElement>} = {}
  menus.forEach(menu => checkbox_refs[menu] = useRef<HTMLInputElement>(null))

  const update_checkboxes = (menu_to_show: string[]) => {
    menus.forEach(menu => {
      const checkbox_ref = checkbox_refs[menu]?.current ?? undefined
      const checkbox_checked = checkbox_ref?.checked ?? undefined
      if (
        (checkbox_checked !== undefined) &&
        (checkbox_checked !== menu_to_show.includes(menu))
      ) {
        checkbox_ref?.click()
      }
    })
  }

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
              update_checkboxes(['MEP'])
            }}
          >
            Mode Simple
          </Button>
          <Button variant='menuconfigpanel_option_button_right'
            onClick={() => {
              sessionStorage.setItem('modepref','expert')
              update_checkboxes(['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis'])
            }}
          >
            Mode Expert
          </Button>
        </Box>
      </Box>,

      <Checkbox
        ref={checkbox_refs['MEP']}
        variant='menuconfigpanel_option_checkbox'
        defaultChecked={new_data.menu_configuration.isGivenAccordionShowed('MEP')}
        onChange={() => {
          new_data.menu_configuration.toggleGivenAccordion('MEP')
        }}
      >
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
        ref={checkbox_refs['EN']}
        variant='menuconfigpanel_option_checkbox'
        defaultChecked={new_data.menu_configuration.isGivenAccordionShowed('EN')}
        onChange={() => {
          new_data.menu_configuration.toggleGivenAccordion('EN')
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
        ref={checkbox_refs['EF']}
        variant='menuconfigpanel_option_checkbox'
        defaultChecked={new_data.menu_configuration.isGivenAccordionShowed('EF')}
        onChange={() => {
          new_data.menu_configuration.toggleGivenAccordion('EF')
        }}>
        {t('Menu.EF')}
      </Checkbox>,

      <Checkbox
        ref={checkbox_refs['ED']}
        variant='menuconfigpanel_option_checkbox'
        defaultChecked={new_data.menu_configuration.isGivenAccordionShowed('ED')}
        onChange={() => {
          new_data.menu_configuration.toggleGivenAccordion('ED')
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
          }}
          onBlur={()=>node_function.RedrawNodes(Object.values(display_nodes))}
        />
      </Box></OSTooltip>,
  }
  return ui
}


export const ModalPreference: FunctionComponent<modalPreferenceTypes> = (
  {
    dict_hook_ref_setter_show_dialog_components,
    ui,
    t,
    pointer_pos
  }
)=>{
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

