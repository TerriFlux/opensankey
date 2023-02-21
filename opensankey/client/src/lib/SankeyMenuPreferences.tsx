/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Button, ButtonGroup, FormCheck, FormGroup } from 'react-bootstrap'
import { SankeyDataPropTypes } from './types'
import i18n from 'i18next'

const modalPreferencePropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  set_mode_selection:PropTypes.func.isRequired
}
type modalPreferenceTypes = InferProps<typeof modalPreferencePropTypes>

const ModalPreference: FunctionComponent<modalPreferenceTypes> = ({t,data,set_data,showPreference,setShowPreference,set_mode_selection})=>{
  const preferenceCheck = (str: string) => {
    if (!data.accordeonToShow.includes(str)) {
      data.accordeonToShow.push(str)
    } else {
      const posElemt = data.accordeonToShow.indexOf(str)
      data.accordeonToShow.splice(posElemt, 1)
    }
  
  }
  return (<Modal show={showPreference} onHide={() => { setShowPreference(false) }}>
    <Modal.Header closeButton>
      <Modal.Title>Édition Préferences</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form.Group as={Row}>
        {/* <Col xs={1}>
          <Form.Label  style={{marginTop:'0.5em'}}>{i18n.language.toUpperCase()}</Form.Label>
        </Col> */}
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
      </Form.Group>
      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>

      <Form.Group as={Row}>
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
      </Form.Group>

      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
      <ButtonGroup>
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
      </ButtonGroup>

      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
      
      <ButtonGroup>
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
      </ButtonGroup>
      <Form>
        <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('MEP')} type="checkbox" label={t('Menu.MEP')} onChange={() => {
          preferenceCheck('MEP')
          set_data({ ...data })
        }} />
        <Form.Check checked={!data.static_sankey} disabled type="checkbox" label={t('Menu.Noeuds')} />
        <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('EN')} type="checkbox" label={t('Menu.EN')} onChange={() => {Form.Check
          preferenceCheck('EN')
          set_data({ ...data })
        }} />
        <Form.Check checked={!data.static_sankey} disabled type="checkbox" label={t('Menu.flux')} />
        <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('EF')} type="checkbox" label={t('Menu.EF')} onChange={() => {
          preferenceCheck('EF')
          set_data({ ...data })
        }} />
        <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('ED')} type="checkbox" label={t('Menu.ED')} onChange={() => {
          preferenceCheck('ED')
          set_data({ ...data })
        }} />
        <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('LL')} type="checkbox" label={t('Menu.LL')} onChange={() => {
          preferenceCheck('LL')
          set_data({ ...data })
        }} />
        {/* <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('Vis')} type="checkbox" label="Storytelling" onChange={() => {
          preferenceCheck('Vis')
          set_data({ ...data })
        }} /> */}
        <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('Leg')} type="checkbox" label="Légends" onChange={() => {
          preferenceCheck('Leg')
          set_data({ ...data })
        }} />

      </Form>
      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
      
      <FormGroup as={Row}>
        <Col xs={10}>
          <FormLabel >{t('Menu.dns')}</FormLabel>        
        </Col>
        <Col xs={2}>
          <FormCheck inline type='switch' checked={data.displayed_node_selector} onChange={evt=>{
            // const c=evt.target.checkeds
            data.displayed_node_selector=evt.target.checked
            set_data({...data})
          }}/>        
        </Col>
      </FormGroup>
      <FormGroup as={Row}>
        <Col xs={10}>
          <FormLabel >{t('Menu.dls')}</FormLabel>        
        </Col>
        <Col xs={2}>
          <FormCheck inline type='switch' checked={data.displayed_link_selector} onChange={evt=>{
            // const c=evt.target.checkeds
            data.displayed_link_selector=evt.target.checked
            set_data({...data})
          }}/>        
        </Col>
      </FormGroup>
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

