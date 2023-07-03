/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form,  Modal, Button, ButtonGroup,Col,Row} from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction,i18n } from 'i18next'
// import i18next  from './traduction'
const modalPreferencePropTypes = {
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  ui:PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element),PropTypes.element]).isRequired).isRequired
}
type modalPreferenceTypes = InferProps<typeof modalPreferencePropTypes>


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
        disabled={data.static_sankey}
        onClick={() => {
          data.accordeonToShow = ['MEP']
          set_data({ ...data })

        }}
      >Simple</Button>
      <Button variant='dark'
        disabled={data.static_sankey}
        onClick={() => {
          data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis', 'Leg']
          set_data({ ...data })
        }}
      >Expert</Button>
    </ButtonGroup>,
    'form':[<Form.Check key='MEP' disabled={data.static_sankey} checked={data.accordeonToShow.includes('MEP')} type="checkbox" label={t('Menu.MEP')} onChange={() => {
      preferenceCheck('MEP',data)
      set_data({ ...data })
    }} />,
    <Form.Check key='Node' checked={!data.static_sankey} disabled type="checkbox" label={t('Menu.Noeuds')} />,
    <Form.Check key='EN' disabled={data.static_sankey} checked={data.accordeonToShow.includes('EN')} type="checkbox" label={t('Menu.EN')} onChange={() => {Form.Check
      preferenceCheck('EN',data)
      set_data({ ...data })
    }} />,
    <Form.Check key='flux' checked={!data.static_sankey} disabled type="checkbox" label={t('Menu.flux')} />,
    <Form.Check key='ef' disabled={data.static_sankey} checked={data.accordeonToShow.includes('EF')} type="checkbox" label={t('Menu.EF')} onChange={() => {
      preferenceCheck('EF',data)
      set_data({ ...data })
    }} />,
    <Form.Check key='ed' disabled={data.static_sankey} checked={data.accordeonToShow.includes('ED')} type="checkbox" label={t('Menu.ED')} onChange={() => {
      preferenceCheck('ED',data)
      set_data({ ...data })
    }} />,

    <Form.Check key='leg' disabled={data.static_sankey} checked={data.accordeonToShow.includes('Leg')} type="checkbox" label={t('Menu.Leg')} onChange={() => {
      preferenceCheck('Leg',data)
      set_data({ ...data })
    }} />]


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

