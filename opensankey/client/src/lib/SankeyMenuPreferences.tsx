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
    'lang':<>{/* <Form.Group as={Row}>
            <Col xs={1}>
              <Form.Label  style={{marginTop:'0.5em'}}>{i18n.language.toUpperCase()}</Form.Label>
            </Col>
            <Col xs={2}>
              <Form.Check
                inline
                style={{marginTop:'0.5em',marginLeft:'0.em'}}
                type='switch'
                checked={i18n.language=='en'}
                onChange={evt => {
                  i18n.changeLanguage((evt.target.checked)?'en':'fr')
                }}
              />
            </Col>
          </Form.Group> */}</>,
    'police':<>{/* <Form.Group as={Row}>
        <Col xs={6}>Charger une police d'icones</Col>
        <Col xs={6}><FormControl
          //Permet de charger les icon, pour l'instant permet de formater les données issus de https://icomoon.io/
          type='file'
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                const result = String((e.target as FileReader).result)
                const js = JSON.parse(result)
                type name_type = {name:string}   
                type icon_type = {paths:string[]}   
                type type1 = {
                  properties: name_type
                  icon: icon_type
                }
                js.icons.map((d : type1) => {
                  const name = d.properties.name as string
                  data.icon_catalog[name] = d.icon.paths[0]
                })
              }
            })()
            reader.readAsText(files[0])
            set_data(data)
          }}
        >
        </FormControl>
        </Col>
      </Form.Group> */}</>,
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
    <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('LL')} type="checkbox" label={t('Menu.LL')} onChange={() => {
      preferenceCheck('LL',data)
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

