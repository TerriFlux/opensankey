/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form,  Modal, Button, ButtonGroup,Col,Row, InputGroup} from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction,i18n } from 'i18next'
import { FaEyeSlash,FaEye } from 'react-icons/fa'
const modalPreferencePropTypes = {
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  ui:PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element),PropTypes.element]).isRequired).isRequired
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
    'lang':<Form.Group key={'1'} as={Row}>
      <Col xs={1}>
        <Form.Label  style={{marginTop:'0.5em'}}>{trad.language.toUpperCase()}</Form.Label>
      </Col>
      <Col xs={2}>
        <Form.Check key=''
          inline
          style={{marginTop:'0.5em',marginLeft:'0.em'}}
          type='switch'
          checked={trad.language=='en'}
          onChange={evt => {
            trad.changeLanguage((evt.target.checked)?'en':'fr')
            set_data({...data})
          }}
        />
      </Col>
    </Form.Group>,


    'mode_expert':<ButtonGroup key={'3'}>
      <Button variant='info'
        disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)}
        onClick={() => {
          sessionStorage.removeItem('modepref')
          data.accordeonToShow = ['MEP']
          set_data({ ...data })

        }}
      >Simple</Button>
      <Button variant='dark'
        disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)}
        onClick={() => {
          sessionStorage.setItem('modepref','expert')
          data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
          set_data({ ...data })
        }}
      >Expert</Button>
    </ButtonGroup>,
    'form':[
      <InputGroup>
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.MEP')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='MEP' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('MEP')?'primary':'outline-primary'} onClick={() => {
          preferenceCheck('MEP',data)
          set_data({ ...data })
        }} >
          {data.accordeonToShow.includes('MEP')?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.Noeuds')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='Node' variant={!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)?'primary':'outline-primary'} disabled >
          <FaEye/>
        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.EN')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='EN' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('EN')?'primary':'outline-primary'} onClick={() => {Button
          preferenceCheck('EN',data)
          set_data({ ...data })
        }} >
          {data.accordeonToShow.includes('EN')?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.flux')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='flux' variant={!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)?'primary':'outline-primary'} disabled >
          <FaEye/>

        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.EF')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='ef' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('EF')?'primary':'outline-primary'} onClick={() => {
          preferenceCheck('EF',data)
          set_data({ ...data })
        }} >
          {data.accordeonToShow.includes('EF')?<FaEye/>:<FaEyeSlash/>}

        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'20%'}}>{t('Menu.ED')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='ed' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('ED')?'primary':'outline-primary'} onClick={() => {
          preferenceCheck('ED',data)
          set_data({ ...data })
        }}>
          {data.accordeonToShow.includes('ED')?<FaEye/>:<FaEyeSlash/>}

        </Button>
      </InputGroup>,

    ]


  }

  return ui
}
export const preferenceCheck = (str: string,data:SankeyData) => {
  if (!data.accordeonToShow.includes(str)) {
    data.accordeonToShow.push(str)
  } else {
    const posElemt = data.accordeonToShow.indexOf(str)
    data.accordeonToShow.splice(posElemt, 1)
  }

}



const ModalPreference: FunctionComponent<modalPreferenceTypes> = ({showPreference,setShowPreference,ui})=>{

  return (<Modal show={showPreference} onHide={() => { setShowPreference(false) }}>
    <Modal.Header closeButton>
      <Modal.Title>Édition Préferences</Modal.Title>
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

