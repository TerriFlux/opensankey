/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { Dispatch, MutableRefObject, SetStateAction, useState } from 'react'
import { Form, FormControl, FormLabel, Row, Col, Modal, Button, Dropdown, InputGroup } from 'react-bootstrap'
import {  CutName,DefaultNodeStyle,DefaultLinkStyle, GetLinkValue } from '../configmenus/SankeyUtils'
import { FaPlus, FaMinus} from 'react-icons/fa'
import {SankeyMenuConfigurationNodesAttributes} from '../configmenus/SankeyMenuConfigurationNodesAttributes'
import {MenuConfigurationLinksAppearence} from '../configmenus/SankeyMenuConfigurationLinksAppearence'
import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../types/Types'
import { SankeyModalStyleLinkFType, SankeyModalStyleNodeFType } from './types/SankeyStyleTypes'


export const SankeyModalStyleNode : SankeyModalStyleNodeFType = (
  applicationContext,
  dict_variable_application_data,
  ref_show_style_node,
  ref_selected_style_node,
  node_attribute_tab
) => {
  const { t } = applicationContext
  const { data, set_data } = dict_variable_application_data
  const [ selected_style_node,set_selected_style_node] = useState('default')
  ref_selected_style_node.current = selected_style_node
  const [ show_style_node, set_show_style_node ] = useState(false)
  ref_show_style_node.current = set_show_style_node
  if(data.style_node && !Object.keys(data.style_node).includes(selected_style_node)){
    set_selected_style_node('default')
  }

  const closeStyleEdition = () => {
    set_show_style_node(false)
  }


  return(
    <Modal show={show_style_node} onHide={closeStyleEdition} size={'lg'}  >
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.esn')}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='sankey-menu content_editon_elements'>
        <Form.Group>
          <InputGroup>
            <Button
              onClick={() => {
                const new_style = DefaultNodeStyle()
                new_style.name = 'New Style'
                const new_id = 'style_node_' + String(new Date().getTime())
                new_style.idNode=new_id
                data.style_node[new_id] = new_style
                set_data({ ...data })
                ref_selected_style_node.current = new_style.idNode
                set_selected_style_node(new_style.idNode)
              }}><FaPlus /></Button>

            {
            // Drodown to select the style to modify
            // The dropdown is not visible when sankey+ isn't activated
            }
            <Dropdown>
              <Dropdown.Toggle style={{width:'50%'}} variant="success" id="dropdown-basic">{(selected_style_node !== '') ? CutName(data.style_node[selected_style_node].name, 30) : 'Choix Style'}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(data.style_node).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { 
                    ref_selected_style_node.current = d
                    set_selected_style_node(d) 

                  }}>{data.style_node[d].name}</Dropdown.Item>)

                })}
              </Dropdown.Menu>
            </Dropdown>

            <Button
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
        {SankeyMenuConfigurationNodesAttributes(t,node_attribute_tab,true)}
      </Modal.Body>
    </Modal>
  )
}


//Modal et fonctions pour l'edition et affectation des style de flux
export const SankeyModalStyleLink : SankeyModalStyleLinkFType= (
  applicationContext:applicationContextType,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  ref_show_style_link: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  additional_link_appearence_items:JSX.Element[]
) => {
  const {data,set_data}=dict_variable_application_data
  const {t}=applicationContext
  const {ref_selected_style_link}=dict_variable_elements_selected
  const [selected_style_link,set_selected_style_link] = useState('default')
  ref_selected_style_link.current = selected_style_link
  const [show_style_link, set_show_style_link] = useState(false)
  ref_show_style_link.current = set_show_style_link


  const closeStyleEditionLink = () => {
    set_show_style_link(false)
  }

  return (
    <Modal show={show_style_link} onHide={closeStyleEditionLink} size={'lg'}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.esf')}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='content_editon_elements'>
        <Form.Group>
          <InputGroup >
            <Button  onClick={() => {
              const new_style = DefaultLinkStyle()
              new_style.name = 'New Style'
              const new_id = 'style_link_' + String(new Date().getTime())
              new_style.idLink = new_id
              data.style_link[new_id] = new_style
              set_data({ ...data })
              set_selected_style_link(new_style.idLink)

            }}><FaPlus /></Button>
            <Dropdown>
              <Dropdown.Toggle style={{width:'50%'}}  variant="success" id="dropdown-basic">{(selected_style_link !== '') ? CutName(data.style_link[selected_style_link].name, 30) : 'Choix Style'}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(data.style_link).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_link(d) }}>{data.style_link[d].name}</Dropdown.Item>)
                })}
              </Dropdown.Menu>
            </Dropdown>
            <Button
              variant='danger'
              disabled={selected_style_link === 'default'}
              onClick={
                () => {
                  delete data.style_link[selected_style_link]
                  set_selected_style_link((Object.keys(data.style_link).length > 0) ? Object.keys(data.style_link)[0] : '')
                }
              }
            ><FaMinus /></Button>
          </InputGroup>
        </Form.Group>
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
            {MenuConfigurationLinksAppearence(
              dict_variable_application_data,dict_variable_elements_selected,applicationContext,additional_link_appearence_items,
              true,GetLinkValue,true
            )
            }
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  )
}
