/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent, useState } from 'react'

import { Form,  Modal, Button, ButtonGroup, InputGroup,OverlayTrigger,Tooltip} from 'react-bootstrap'
import { SankeyData } from '../types/Types'
import { TFunction,i18n } from 'i18next'
import { Checkbox } from '@chakra-ui/react'
import { SmoothClasses } from '../configmenus/SankeyUtils'
import { OpenSankeyDefaultModalePreferenceContentFType, modalPreferenceTypes, preferenceCheckFType } from './types/SankeyMenuPreferencesTypes'


declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const OpenSankeyDefaultModalePreferenceContent : OpenSankeyDefaultModalePreferenceContentFType =(
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  trad:i18n
)=>{
  const ui={
    'lang':<InputGroup key={'1'}>
      <InputGroup.Text >{t('Menu.lang')}</InputGroup.Text>
      <Form.Select
        size='sm'
        value={trad.language}
        onChange={(evt)=>{
          trad.changeLanguage((evt.target.value))
          set_data({...data})
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
            set_data({ ...data })

          }}
        >Mode Simple</Button>
        <Button variant='dark'
          disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)}
          onClick={() => {
            sessionStorage.setItem('modepref','expert')
            data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
            set_data({ ...data })
          }}
        >Mode Expert</Button>
      
      </ButtonGroup>,
      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked={data.accordeonToShow.includes('MEP')}
          onChange={() => {
            preferenceCheck('MEP',data)
            set_data({ ...data })
          }}>
          {t('Menu.MEP')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked
          disabled
        >
          {t('Menu.Noeuds')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked={data.accordeonToShow.includes('EN')}
          onChange={() => {
            preferenceCheck('EN',data)
            set_data({ ...data })
          }}>
          {t('Menu.EN')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked
          disabled
        >
          {t('Menu.flux')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked={data.accordeonToShow.includes('EF')}
          onChange={() => {
            preferenceCheck('EF',data)
            set_data({ ...data })
          }}>
          {t('Menu.EF')}
        </Checkbox>
      </InputGroup>,

      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked={data.accordeonToShow.includes('ED')}
          onChange={() => {
            preferenceCheck('ED',data)
            set_data({ ...data })
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
          set_data({...data})
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
  {dict_hook_ref_setter_show_dialog_components,ui,t
  })=>{
  const [show_pref,set_show_pref]=useState(false)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_preference.current=set_show_pref
  return (<Modal show={show_pref} onHide={() => { set_show_pref(false) }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('Menu.title_pref')}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {Object.values(ui).map((d,i)=>{
        return <React.Fragment key={i}>{d}</React.Fragment>
      })}
    </Modal.Body>
  </Modal>)
}

