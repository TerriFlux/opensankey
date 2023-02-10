import React from 'react'
import { Col, Form, FormCheck, FormLabel, Row } from "react-bootstrap"
import { SankeyData, SankeyNode } from 'open-sankey/src/lib/types'
import { TFunction } from 'i18next'

export const SankeyPlusNodesAttributes = (
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
  const isAllNodeToScale = () => {
    let toScale = false
    multi_selected_nodes.current.map(d => toScale = (d.not_to_scale) ? true : toScale)
    return toScale
  }
  const isAllNodeNotToScaleOrientation = (orientation:string) => {
    let same_orientation = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => same_orientation = (d.not_to_scale_direction !== orientation) ? false : same_orientation)
    } else {
      same_orientation = false
    }
    return same_orientation
  }
  return [
    <Form.Group as={Row} >
    <Col xs={4}>
      <FormLabel >{t('Noeud.apparence.toScale')}</FormLabel>
    </Col>
    <Col xs={1}>
      <FormCheck inline
        type='switch'
        checked={isAllNodeToScale()}
        onChange={evt => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale = evt.target.checked)
          set_data({ ...data })
        }}
      />
    </Col>

  </Form.Group>,
  <Col xs={5}>
    <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.Orientation')}</FormLabel>
  </Col>,
  <Form.Group as={Row} >       
    <Col  xs={3}>
      <FormCheck
        value="left"
        type='radio'
        label={t('Noeud.apparence.toScaleLeft')}
        disabled={!isAllNodeToScale()}
        checked={isAllNodeNotToScaleOrientation('left')}
        onChange={evt => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
          set_data({ ...data })
        }}
      />
    </Col>
    <Col xs={3}>
      <FormCheck
        value="right"
        type='radio'
        label={t('Noeud.apparence.toScaleRight')}
        disabled={!isAllNodeToScale()}
        checked={isAllNodeNotToScaleOrientation('right')}
        onChange={evt => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
          set_data({ ...data })
        }}
      />
    </Col>
    <Col xs={3}>
      <FormCheck
        value="top"
        type='radio'
        label={t('Noeud.apparence.toScaleTop')}
        disabled={!isAllNodeToScale()}
        checked={isAllNodeNotToScaleOrientation('top')}
        onChange={evt => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
          set_data({ ...data })
        }}
      />
    </Col>
    <Col xs={3}>
      <FormCheck
        value="bottom"
        type='radio'
        label={t('Noeud.apparence.toScaleBottom')}
        disabled={!isAllNodeToScale()}
        checked={isAllNodeNotToScaleOrientation('bottom')}
        onChange={evt => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
          set_data({ ...data })
        }}
      />
    </Col>
  </Form.Group>]
}