/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { Form, FormControl, FormLabel, Row, Col, Modal, Button, Dropdown, Tabs } from 'react-bootstrap'
// import { SankeyLink } from 'open-sankey/src/lib/types'
import {SankeyPlusData,SankeyPlusLink} from './types'
import { default_node, default_link,cut_name } from 'open-sankey/dist/SankeyUtils'
import { FaPlus, FaMinus} from 'react-icons/fa'
import { TFunction } from 'i18next'
import {OpenSankeyConfigurationNodesAttributes,SankeyMenuConfigurationNodesAttributes} from 'open-sankey/dist/SankeyMenuConfigurationNodesAttributes'
import {SankeyMenuConfigurationNodesLabel} from 'open-sankey/dist/SankeyMenuConfigurationNodesLabel'
import {SankeyMenuConfigurationLinksAppearence} from 'open-sankey/dist/SankeyMenuConfigurationLinksAppearence'
import {SankeyMenuConfigurationLinksLabel} from 'open-sankey/dist/SankeyMenuConfigurationLinksLabel'
// /**
//  * Variable that define the Menu element, it's variable and function
//  *
//  * @type {{ data: any; set_data: any; right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
//  */
// const MenuStyleNodePropTypes = {
//   t:PropTypes.func.isRequired,
//   data: PropTypes.shape(SankeyDataPropTypes).isRequired,
//   set_data: PropTypes.func.isRequired,
//   setShowStyle:PropTypes.func.isRequired,
//   showStyle:PropTypes.bool.isRequired,
//   selected_style_node: PropTypes.string.isRequired,
//   set_selected_style_node:PropTypes.func.isRequired
// }


// /**
//  * Description placeholder
//  *
//  * @typedef {MenuTypes}
//  */
// type MenuStyleNodeTypes = InferProps<typeof MenuStyleNodePropTypes>

export const SankeyPlusModalStyleNode  = (t:TFunction,data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  showStyle:boolean,
  setShowStyle:React.Dispatch<React.SetStateAction<boolean>>,
  selected_style_node:string,
  set_selected_style_node:React.Dispatch<React.SetStateAction<string>>,
  editable:boolean
) => {

  if(selected_style_node !== 'default' && !editable){
    set_selected_style_node('default')
  }


  const closeStyleEdition = () => {
    setShowStyle(false)
  }
  const tab_node_style_attribute=OpenSankeyConfigurationNodesAttributes(t,data,set_data,{current:[]},true,selected_style_node)
  const applyStyleToNodes = () => {
    const style = data.style_node[selected_style_node]
    Object.values(data.nodes).filter(d => d.style !== '' && d.style === selected_style_node).map(d => {
      //Style Noeud
      d.shape_visible = style.shape_visible
      d.color = style.color
      d.shape = style.shape


      d.node_width = style.node_width
      d.node_height = style.node_height

      //Syle label
      d.label_visible = style.label_visible
      d.show_value = style.show_value
      d.display_style.font_size = style.display_style.font_size
      d.display_style.bold = style.display_style.bold
      d.display_style.uppercase = style.display_style.uppercase
      d.display_style.italic = style.display_style.italic
      d.display_style.label_box_width = style.display_style.label_box_width
      d.display_style.label_vert = style.display_style.label_vert
      d.display_style.label_horiz = style.display_style.label_horiz
      d.display_style.font_family = style.display_style.font_family

    })

    set_data({ ...data })
  }



  return(
    <Modal show={showStyle} onHide={closeStyleEdition} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>Édition Style</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >
          {(editable)?<Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = default_node(data)
              new_style.name = 'New Style'
              const new_id = 'style_node_' + String(new Date().getTime())
              data.style_node[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>:<></>}
          {
            // Drodown to select the style to modify
            // The dropdown is not visible when sankey+ isn't activated
          }
          {(editable)?<Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">{(selected_style_node !== '') ? cut_name(data.style_node[selected_style_node].name, 30) : 'Choix Style'}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(data.style_node).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_node(d) }}>{data.style_node[d].name}</Dropdown.Item>)

                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>:<></>}

          {(editable)?<Col xs={1}>
            <Button
              size="sm"
              variant='danger'
              disabled={selected_style_node === 'default'}
              onClick={
                () => {
                  delete data.style_node[selected_style_node]
                  set_selected_style_node((Object.keys(data.style_node).length > 0) ? Object.keys(data.style_node)[0] : '')
                }
              }
            ><FaMinus /></Button>

          </Col>:<></>}
          <Col xs={5}>
            <Button variant="warning" onClick={applyStyleToNodes}>{t('Noeud.apparence.asn')}</Button>
          </Col>
        </Row>

        <Form.Group as={Row} >
          <Col xs={2} >
            <FormLabel >{t('Menu.ns')}</FormLabel>
          </Col>
          <Col xs={10} >

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
          </Col>

        </Form.Group>


        <Col md={12}>
          <Tabs defaultActiveKey="nodes_desc" id="node_attributes">
            {SankeyMenuConfigurationNodesAttributes(t,tab_node_style_attribute)}

            {SankeyMenuConfigurationNodesLabel(t,data,set_data,{current:[]},true,'default')}
          </Tabs>
        </Col>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEdition}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}


//Modal et fonctions pour l'edition et affectation des style de flux
export const SankeyPlusModalStyleLink = (t:TFunction,data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  showStyleLink:boolean,
  setShowStyleLink:React.Dispatch<React.SetStateAction<boolean>>,
  selected_link:{current:SankeyPlusLink},
  selected_style_link:string,
  set_selected_style_link:React.Dispatch<React.SetStateAction<string>>,
  editable:boolean,
  additional_link_appearence_items:JSX.Element[]
) => {

  if(selected_style_link !== 'default' && !editable){
    set_selected_style_link('default')
  }
  const closeStyleEditionLink = () => {
    setShowStyleLink(false)
  }
  const applyStyleToLinks = () => {
    const style = data.style_link[selected_style_link]
    Object.values(data.links).filter(d => d.style !== '' && d.style === selected_style_link).map(d => {
      d.recycling = style.recycling
      d.orientation = style.orientation
      d.arrow = style.arrow

      // display_attribute
      d.label_position = style.label_position
      d.orthogonal_label_position = style.orthogonal_label_position
      d.label_on_path = style.label_on_path
      d.label_visible = style.label_visible
      d.text_color = style.text_color
      d.color = style.color

      d.gradient = style.gradient

      d.curvature = style.curvature
      d.curved = style.curved
    })

    set_data({ ...data })
  }

  return (
    <Modal show={showStyleLink} onHide={closeStyleEditionLink} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>Édition Style</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >

          {(editable)?<Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = default_link(data)
              new_style.idLink = 'New Style'
              const new_id = 'style_link_' + String(new Date().getTime())
              data.style_link[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>:<></>}

          {(editable)?<Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle disabled={!editable} variant="success" id="dropdown-basic">{(selected_style_link !== '') ? cut_name(data.style_link[selected_style_link].idLink, 30) : 'Choix Style'}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(data.style_link).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_link(d) }}>{data.style_link[d].idLink}</Dropdown.Item>)
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>:<></>}


          {(editable)?<Col xs={1}>
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

          </Col>:<></>}

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
              disabled={!editable}
              value={
                (selected_style_link !== '') ? data.style_link[selected_style_link].idLink : ''
              }

              onChange={evt => {
                data.style_link[selected_style_link].idLink = evt.target.value
                set_data({ ...data })
              }}
            />
          </Col>

        </Form.Group>


        <Row>
          <Col md={12}>
            <Tabs defaultActiveKey="flux_attributes" id="settings-layout">

              {SankeyMenuConfigurationLinksAppearence(data,selected_link,{current:[]},set_data,t,additional_link_appearence_items,true,selected_style_link)}
              {SankeyMenuConfigurationLinksLabel(data,{current:[]},set_data,t,true,selected_style_link)}

            </Tabs>
          </Col>
        </Row>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEditionLink}>Close</Button>
      </Modal.Footer>
    </Modal>
  )

}
