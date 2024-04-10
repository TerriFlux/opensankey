/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent } from 'react'

import { Form,  Button, ButtonGroup, InputGroup,OverlayTrigger,Tooltip} from 'react-bootstrap'
import { SankeyData } from '../types/Types'
import { TFunction,i18n } from 'i18next'
import { Checkbox } from '@chakra-ui/react'
import { SmoothClasses } from '../configmenus/SankeyUtils'
import { OpenSankeyDefaultModalePreferenceContentFType, modalPreferenceTypes, preferenceCheckFType } from './types/SankeyMenuPreferencesTypes'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'


declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const OpenSankeyDefaultModalePreferenceContent : OpenSankeyDefaultModalePreferenceContentFType =(
  t:TFunction,
  data:SankeyData,
  trad:i18n,
  ComponentUpdater
)=>{
  const ui={
    'lang':<InputGroup key={'1'}>
      <InputGroup.Text >{t('Menu.lang')}</InputGroup.Text>
      <Form.Select
        size='sm'
        value={trad.language}
        onChange={(evt)=>{
          trad.changeLanguage((evt.target.value))
        }}
      >
        <option key={'francais'} value={'fr'}>Français</option>
        <option key={'english'} value={'en'}>English</option>
      </Form.Select>
    </InputGroup>,


    'form':[
      <h4>{t('Menu.pref_title_sub_menu')}</h4>,
      <ButtonGroup key={'3'}>
        <Button variant='info'
          disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)}
          onClick={() => {
            sessionStorage.removeItem('modepref')
            data.accordeonToShow = ['MEP']
            ComponentUpdater.updateComponentMenuConfig.current()

          }}
        >Mode Simple</Button>
        <Button variant='dark'
          disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)}
          onClick={() => {
            sessionStorage.setItem('modepref','expert')
            data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
            ComponentUpdater.updateComponentMenuConfig.current()
          }}
        >Mode Expert</Button>
      
      </ButtonGroup>,
      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          isChecked={data.accordeonToShow.includes('MEP')}
          onChange={() => {
            preferenceCheck('MEP',data)
            ComponentUpdater.updateComponentMenuConfig.current()

          }}>
          {t('Menu.MEP')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          isChecked
          disabled
        >
          {t('Menu.Noeuds')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          isChecked={data.accordeonToShow.includes('EN')}
          onChange={() => {
            preferenceCheck('EN',data)
            ComponentUpdater.updateComponentMenuConfig.current()

          }}>
          {t('Menu.EN')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          isChecked
          disabled
        >
          {t('Menu.flux')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          isChecked={data.accordeonToShow.includes('EF')}
          onChange={() => {
            preferenceCheck('EF',data)
            ComponentUpdater.updateComponentMenuConfig.current()

          }}>
          {t('Menu.EF')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          isChecked={data.accordeonToShow.includes('ED')}
          onChange={() => {
            preferenceCheck('ED',data)
            ComponentUpdater.updateComponentMenuConfig.current()

          }}>
          {t('Menu.ED')}
        </Checkbox>
      </InputGroup>,
    ],
    'node_label_sep':<OverlayTrigger
      key={'Banner.ndd_lst.1'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'node_label_sep'}>{t('Menu.tooltips.node_label_sep')} </Tooltip>}><InputGroup>
        <InputGroup.Text>{t('Menu.node_label_sep')}</InputGroup.Text>
        <Form.Control type='text' value={data.node_label_separator} onChange={(evt)=>{
          data.node_label_separator=evt.target.value
          ComponentUpdater.updateComponentMenuConfig.current()
            

        }}></Form.Control>
      </InputGroup></OverlayTrigger>,

    


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

