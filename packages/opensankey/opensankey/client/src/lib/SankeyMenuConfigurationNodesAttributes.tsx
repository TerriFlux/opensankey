import { TFunction } from 'i18next'
import React from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyNode } from './types'

export const OpenSankeyConfigurationNodesAttributes = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}
) => {
  const isAllNodeVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.shape_visible || d.not_to_scale) ? true : visible)
    return visible
  }

  const isAllNodeRect = () => {
    let rect = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => rect = (d.shape !== 'rect') ? false : rect)
    } else {
      rect = false
    }
    return rect
  }

  const isAllNodeCircle = () => {
    let circle = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => circle = (d.shape !== 'ellipse') ? false : circle)
    } else {
      circle = false
    }
    return circle
  }

  const isAllNodeColorSustainable = () => {
    let colorS = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => colorS = (!d.colorSustainable) ? false : colorS)
    } else {
      colorS = false
    }
    return colorS
  }

  const displayedValueNodeWidth = () => {
    let display_width = true
    let width = 0
    if (multi_selected_nodes.current.length != 0) {
      width = multi_selected_nodes.current[0].node_width
    }
    multi_selected_nodes.current.map((d) => {
      display_width = (d.node_width == width) ? display_width : false
    })
    return (display_width) ? width : 0
  }

  const displayedValueNodeHeight = () => {
    let display_height = true
    let width = 0
    if (multi_selected_nodes.current.length != 0) {
      width = multi_selected_nodes.current[0].node_height
    }
    multi_selected_nodes.current.map((d) => {
      display_height = (d.node_height == width) ? display_height : false
    })
    return (display_height) ? width : 0
  }

  // Tableau d'elements de sous-menu attribut de noeuds
  return [
    /* Visibilite du noeud */
    <Form.Group as={Row} key={'node_visibility'} >
      <Col xs={4}>
        <FormLabel >{t('Noeud.apparence.Visibilité')}</FormLabel>
      </Col>
      <Col xs={1}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.Visibilité')} </Tooltip>}>
          <FormCheck inline
            type='switch'
            checked={isAllNodeVisible()}
            onChange={evt => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.shape_visible = evt.target.checked)
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Couleur du noeud */
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.Couleur')}</FormLabel>
      </Col>
      <Col xs={3}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.Couleur')} </Tooltip>}>
          <Form.Control
            type='color'
            disabled={ !isAllNodeVisible()}
            value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].color : '#ffffff'}
            onChange={evt => {
              const color = evt.target.value
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.color = color)
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Figer la couleur */
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.CouleurPérenne')}</FormLabel>
      </Col>
      <Col xs={3}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.CouleurPérenne')} </Tooltip>}>
          <Form.Check
            type='checkbox'
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            checked={isAllNodeColorSustainable()}
            onChange={evt => {
              const checked = evt.target.checked
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.colorSustainable= checked)
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Forme du noeud */
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.Forme')}</FormLabel>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.Forme')} </Tooltip>}>
          <FormCheck
            value="ellipse"
            type='radio'
            label={t('Noeud.apparence.Cercle')}
            disabled={!isAllNodeVisible()}
            checked={isAllNodeCircle()}
            onChange={evt => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.shape = evt.target.value)
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.Forme')} </Tooltip>}>
          <FormCheck
            value="rect"
            type='radio'
            label={t('Noeud.apparence.Rectangle')}
            disabled={!isAllNodeVisible()}
            checked={isAllNodeRect()}
            onChange={evt => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.shape = evt.target.value)
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Largeur minimale du noeud */
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}} >{t('Noeud.apparence.TML')}</FormLabel>
      </Col>
      <Col>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.TML')} </Tooltip>}>
          <FormControl
            min={0} max={100}
            type={'number'}
            value={displayedValueNodeWidth()}
            disabled={!isAllNodeVisible()}
            onChange={
              evt => {
                multi_selected_nodes.current.map(d => d.node_width = +evt.target.value)
                //set_multi_selected_nodes(multi_selected_nodes)
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.node_width = +evt.target.value)
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      <Col style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>px</Col>
    </Form.Group>,

    /* Hauteur minimale du noeud */
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}} >{t('Noeud.apparence.TMH')}</FormLabel>
      </Col>
      <Col>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.apparence.tooltips.TMH')} </Tooltip>}>
          <FormControl
            min={0} max={100}
            type={'number'}
            value={displayedValueNodeHeight()}
            disabled={!isAllNodeVisible()}
            onChange={
              evt => {
                //set_multi_selected_nodes(multi_selected_nodes)
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.node_height = +evt.target.value)
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      <Col style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>px</Col>
    </Form.Group>
  ]
}

export const SankeyMenuConfigurationNodesAttributes = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[]
) => {
  //Function that check if all selected nodes have the same value for some parameter
  return <Tab eventKey="nodes_desc" title={t('Noeud.apparence.apparence')}
    disabled={/*!(node.colorParameter == 'local')*/false}>
    <Form >
      {menu_configuration_nodes_attributes.map((c:JSX.Element,i)=>{
        
        return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Form>
  </Tab>}