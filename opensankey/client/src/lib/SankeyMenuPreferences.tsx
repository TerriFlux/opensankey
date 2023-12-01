/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form,  Modal, Button, ButtonGroup, InputGroup,OverlayTrigger,Tooltip} from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction,i18n } from 'i18next'
import { FaEyeSlash,FaEye,FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

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
        <InputGroup.Text style={{width:'30%'}}>{t('Menu.MEP')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='MEP' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('MEP')?'primary':'outline-primary'} onClick={() => {
          preferenceCheck('MEP',data)
          set_data({ ...data })
        }} >
          {data.accordeonToShow.includes('MEP')?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'30%'}}>{t('Menu.Noeuds')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='Node' variant={!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)?'primary':'outline-primary'} disabled >
          <FaEye/>
        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'30%'}}>{t('Menu.EN')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='EN' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('EN')?'primary':'outline-primary'} onClick={() => {Button
          preferenceCheck('EN',data)
          set_data({ ...data })
        }} >
          {data.accordeonToShow.includes('EN')?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'30%'}}>{t('Menu.flux')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='flux' variant={!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)?'primary':'outline-primary'} disabled >
          <FaEye/>

        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'30%'}}>{t('Menu.EF')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='ef' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('EF')?'primary':'outline-primary'} onClick={() => {
          preferenceCheck('EF',data)
          set_data({ ...data })
        }} >
          {data.accordeonToShow.includes('EF')?<FaEye/>:<FaEyeSlash/>}

        </Button>
      </InputGroup>,

      <InputGroup>
        <InputGroup.Text style={{width:'30%'}}>{t('Menu.ED')}</InputGroup.Text>
        <Button style={{width:'10%'}} className='btn_menu_config' key='ed' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('ED')?'primary':'outline-primary'} onClick={() => {
          preferenceCheck('ED',data)
          set_data({ ...data })
        }}>
          {data.accordeonToShow.includes('ED')?<FaEye/>:<FaEyeSlash/>}

        </Button>
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
        <InputGroup.Text
          style={{width:'40%'}}>
          {t('Noeud.apparence.override_type_node_shape')}
        </InputGroup.Text>

        <Button className='btn_menu_config'
          style={{width:'10%'}}
          variant={data.override_type_node_shape?'primary':'outline-primary'}
          onClick={() => {
            data.override_type_node_shape=!data.override_type_node_shape
            set_data({ ...data })
          }}>{data.override_type_node_shape?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
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

