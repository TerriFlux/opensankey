/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form,  Modal, Button, ButtonGroup} from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction } from 'i18next'
const modalPreferencePropTypes = {
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  ui:PropTypes.object.isRequired 
}
type modalPreferenceTypes = InferProps<typeof modalPreferencePropTypes>


export const OpenSankeyDefaultModalePreferenceContent=(
  t:TFunction,
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  set_mode_selection:React.Dispatch<React.SetStateAction<string>>,
)=>{

  const ui={
    'mode':<ButtonGroup>
      <Button variant={(data.static_sankey)?'success':'outline-success'}
        onClick={() => {
          data.accordeonToShow = ['Vis','Leg']
          set_mode_selection('s')
          data.static_sankey = true
          set_data({ ...data })

        }}
      >Visualisation</Button>
      <Button variant={(data.static_sankey)?'outline-warning':'warning'}
        onClick={() => {
          data.static_sankey = false
          set_data({ ...data })
        }}
      >Construction</Button>
    </ButtonGroup>,
    'mode_expert':<ButtonGroup>
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
    'form':[<Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('MEP')} type="checkbox" label={t('Menu.MEP')} onChange={() => {
      preferenceCheck('MEP',data)
      set_data({ ...data })
    }} />,
    <Form.Check checked={!data.static_sankey} disabled type="checkbox" label={t('Menu.Noeuds')} />,
    <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('EN')} type="checkbox" label={t('Menu.EN')} onChange={() => {Form.Check
      preferenceCheck('EN',data)
      set_data({ ...data })
    }} />,
    <Form.Check checked={!data.static_sankey} disabled type="checkbox" label={t('Menu.flux')} />,
    <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('EF')} type="checkbox" label={t('Menu.EF')} onChange={() => {
      preferenceCheck('EF',data)
      set_data({ ...data })
    }} />,
    <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('ED')} type="checkbox" label={t('Menu.ED')} onChange={() => {
      preferenceCheck('ED',data)
      set_data({ ...data })
    }} />,
   
    <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('Leg')} type="checkbox" label="Légends" onChange={() => {
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
      {Object.values(ui).map(d=>d)}
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

