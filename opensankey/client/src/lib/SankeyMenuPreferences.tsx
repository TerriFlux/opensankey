/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form,  Modal, Button, ButtonGroup, InputGroup,OverlayTrigger,Tooltip} from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction,i18n } from 'i18next'
import { Checkbox } from '@chakra-ui/react'
import { SmoothClasses } from './SankeyUtils'
const modalPreferencePropTypes = {
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  ui:PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element),PropTypes.element]).isRequired).isRequired,
  t:PropTypes.func.isRequired
}
type modalPreferenceTypes = InferProps<typeof modalPreferencePropTypes>

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const OpenSankeyDefaultModalePreferenceContent=(
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
          isChecked>
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

    // Button to allow the user to choose the shape of the node even if it has the node tags 'Type de noeud'
    'override_node_shape':<OverlayTrigger
      key={'noeud.apparence.tooltips.ons'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.apparence.tooltips.4'}>{t('Noeud.apparence.tooltips.override_type_node_shape')} </Tooltip>}>

      <InputGroup>


        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'30%'}
          isChecked={data.override_type_node_shape}
          onChange={() => {
            data.override_type_node_shape=!data.override_type_node_shape
            set_data({ ...data })
          }}>
          {t('Noeud.apparence.override_type_node_shape')}
        </Checkbox>
      </InputGroup>
    </OverlayTrigger>


  }

  return ui
}
export const preferenceCheck = (str: string,data:SankeyData) => {
  sessionStorage.removeItem('modepref')
  if (!data.accordeonToShow.includes(str)) {
    data.accordeonToShow.push(str)
  } else {
    const posElemt = data.accordeonToShow.indexOf(str)
    data.accordeonToShow.splice(posElemt, 1)
  }

}



const ModalPreference: FunctionComponent<modalPreferenceTypes> = ({showPreference,setShowPreference,ui,t})=>{

  return (<Modal show={showPreference} onHide={() => { setShowPreference(false) }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('Menu.title_pref')}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {Object.values(ui).map((d,i)=>{
        return <React.Fragment key={i}>{d}</React.Fragment>
      })}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => { setShowPreference(false) }}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>)
}

ModalPreference.propTypes = modalPreferencePropTypes

export default ModalPreference

