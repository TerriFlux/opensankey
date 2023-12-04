/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { Form, FormControl, FormLabel, Row, Col, Modal, Button, Dropdown, InputGroup } from 'react-bootstrap'
// import { SankeyLink } from 'open-sankey/src/lib/types'
import {  CutName,DefaultNodeStyle,DefaultLinkStyle } from './SankeyUtils'
import { FaPlus, FaMinus} from 'react-icons/fa'
import { TFunction } from 'i18next'
import {OpenSankeyConfigurationNodesAttributes,SankeyMenuConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {SankeyMenuConfigurationLinksAppearence} from './SankeyMenuConfigurationLinksAppearence'
import { SankeyData } from './types'




export const SankeyPlusModalStyleNode  = (t:TFunction,data:SankeyData,
  set_data:(d:SankeyData)=>void,
  showStyle:boolean,
  setShowStyle:React.Dispatch<React.SetStateAction<boolean>>,
  selected_style_node:string,
  set_selected_style_node:React.Dispatch<React.SetStateAction<string>>,
  additional_node_attribute:JSX.Element[],
  set_style_to_apply:(s:string)=>void,
) => {

  if(!Object.keys(data.style_node).includes(selected_style_node)){
    set_selected_style_node('default')
  }

  const closeStyleEdition = () => {
    setShowStyle(false)
  }
  const tab_node_style_attribute=OpenSankeyConfigurationNodesAttributes(t,data,set_data,{current:[]},true,selected_style_node,set_style_to_apply,[],[],[])
  additional_node_attribute.forEach(el=>tab_node_style_attribute.push(el))

  return(
    <Modal show={showStyle} onHide={closeStyleEdition} size={'lg'}  >
      <Modal.Header>
        <Modal.Title>{t('Menu.esn')}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='sankey-menu'>
        <Form.Group>
          <InputGroup>
            <Col>
              <Button style={{width:'20%'}} onClick={() => {
                const new_style = DefaultNodeStyle()
                new_style.name = 'New Style'
                const new_id = 'style_node_' + String(new Date().getTime())
                new_style.idNode=new_id
                data.style_node[new_id] = new_style
                set_data({ ...data })
              }}><FaPlus /></Button>
            </Col>

            {
            // Drodown to select the style to modify
            // The dropdown is not visible when sankey+ isn't activated
            }
            <Col>
              <Dropdown>
                <Dropdown.Toggle style={{width:'50%'}} variant="success" id="dropdown-basic">{(selected_style_node !== '') ? CutName(data.style_node[selected_style_node].name, 30) : 'Choix Style'}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.keys(data.style_node).map((d,i) => {
                    return (<Dropdown.Item key={i} onClick={() => { set_selected_style_node(d) }}>{data.style_node[d].name}</Dropdown.Item>)

                  })}
                </Dropdown.Menu>
              </Dropdown>
            </Col>

            <Col>
              <Button
                style={{width:'20%'}}
                variant='danger'
                disabled={selected_style_node === 'default'}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(n=>n.style==selected_style_node).forEach(n=>n.style='default')
                    delete data.style_node[selected_style_node]
                    set_selected_style_node((Object.keys(data.style_node).length > 0) ? Object.keys(data.style_node)[0] : '')
                  }
                }
              ><FaMinus /></Button>

            </Col>
          </InputGroup>

          <InputGroup>
            <InputGroup.Text style={{width:'30%'}}>{t('Menu.ns')}</InputGroup.Text>
            <FormControl
              disabled={(selected_style_node === 'default')?true:false}
              value={
                (selected_style_node !== '') ? data.style_node[selected_style_node].name : ''
              }

              onChange={evt => {
                data.style_node[selected_style_node].name = evt.target.value
                set_data({ ...data })
              }}
            />
          </InputGroup>
        </Form.Group>
        {SankeyMenuConfigurationNodesAttributes(t,tab_node_style_attribute,true)}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEdition}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}


//Modal et fonctions pour l'edition et affectation des style de flux
export const SankeyPlusModalStyleLink = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  showStyleLink:boolean,
  setShowStyleLink:React.Dispatch<React.SetStateAction<boolean>>,
  selected_style_link:string,
  set_selected_style_link:React.Dispatch<React.SetStateAction<string>>,
  additional_link_appearence_items:JSX.Element[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void
) => {

  if(selected_style_link !== 'default'){
    set_selected_style_link('default')
  }
  const closeStyleEditionLink = () => {
    setShowStyleLink(false)
  }
  const applyStyleToLinks = () => {
    Object.values(data.links).filter(d => d.style !== '' && d.style === selected_style_link).map(d => {
      delete d.local
    })

    set_data({ ...data })
  }

  return (
    <Modal show={showStyleLink} onHide={closeStyleEditionLink} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.esf')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >

          <Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = DefaultLinkStyle()
              new_style.name = 'New Style'
              const new_id = 'style_link_' + String(new Date().getTime())
              new_style.idLink = new_id
              data.style_link[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>

          <Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">{(selected_style_link !== '') ? CutName(data.style_link[selected_style_link].name, 30) : 'Choix Style'}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(data.style_link).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_link(d) }}>{data.style_link[d].name}</Dropdown.Item>)
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>


          <Col xs={1}>
            <Button
              size="sm"
              variant='danger'
              disabled={selected_style_link === 'default'}
              onClick={
                () => {
                  delete data.style_link[selected_style_link]
                  set_selected_style_link((Object.keys(data.style_link).length > 0) ? Object.keys(data.style_link)[0] : '')
                }
              }
            ><FaMinus /></Button>

          </Col>

          <Col xs={5}>
            <Button variant="warning" onClick={applyStyleToLinks}>{t('Flux.asf')}</Button>
          </Col>
        </Row>

        <Form.Group as={Row} >
          <Col xs={2} >
            <FormLabel >{t('Menu.ns')}</FormLabel>
          </Col>
          <Col xs={10} >

            <FormControl
              value={
                (selected_style_link !== '') ? data.style_link[selected_style_link].name : ''
              }

              onChange={evt => {
                data.style_link[selected_style_link].name = evt.target.value
                set_data({ ...data })
              }}
            />
          </Col>

        </Form.Group>


        <Row>
          <Col md={12}>

            {SankeyMenuConfigurationLinksAppearence(data,{current:[]},set_data,t,additional_link_appearence_items,true,selected_style_link,display_link_opacity,set_display_link_opacity,true)}
          </Col>
        </Row>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEditionLink}>Close</Button>
      </Modal.Footer>
    </Modal>
  )

}
