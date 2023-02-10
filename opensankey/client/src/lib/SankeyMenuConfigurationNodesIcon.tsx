import React, { useState } from 'react'
import { Row, Form,FormLabel, Col, FormCheck, Tab } from 'react-bootstrap'
import { SankeyData,  SankeyNode } from './types'
import { useTranslation } from 'react-i18next'

export const SankeyMenuConfigurationNodesIcon = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}
)=> {
  const {t} =useTranslation()
  const [radio_selected] = useState<string>('local')
  const isAllIconSame = (param: string) => {
    let icon = true

    multi_selected_nodes.current.map(d => {
      icon = (d.iconName == param) ? icon : false
    })
    return icon
  }
  const valueAllIconRatio = () => {
    let display_ratio = true
    let ratio = 100
    if (multi_selected_nodes.current.length != 0) {
      ratio = multi_selected_nodes.current[0].iconRatio
    }
    multi_selected_nodes.current.map((d) => {
      display_ratio = (d.iconRatio == ratio) ? display_ratio : false
    })
    const d = (ratio == 0) ? '' : ratio
    return (display_ratio) ? d : 100
  }
  const isAllIconVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.iconVisible) ? true : visible)
    return visible
  }
  return <Tab eventKey="node_icon" title={t('Noeud.icon.icon')}>
    <Form >
      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel >{t('Noeud.apparence.Visibilité')}</FormLabel>
        </Col>
        <Col xs={5}>
          <FormCheck inline
            type='switch'
            checked={isAllIconVisible()}
            onChange={evt => {

              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconVisible = evt.target.checked)
              set_data({ ...data })
            }}
          />
        </Col>
      </Form.Group>


      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}}>{t('Noeud.icon.si')}</FormLabel>
        </Col>
        <Col xs={5}>
          <Form.Select
            disabled={!isAllIconVisible()}
            onChange={(evt : React.ChangeEvent<HTMLSelectElement>) => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                d.iconName = evt.target.value
              })
              set_data({ ...data })
            }}
          >
            <option key={0} value={'none'} selected={isAllIconSame('none')}>{t('Noeud.icon.Aucun')}</option>

            {Object.keys(data.icon_catalog).map((n, i) => {
              return <option key={i + 1} value={n} selected={isAllIconSame(n)}>{n}</option>
            })}
          </Form.Select>
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}} >{t('Noeud.apparence.Couleur')}</FormLabel>
        </Col>
        <Col xs={3}>
          <Form.Control
            type='color'
            disabled={radio_selected !== 'local' || !isAllIconVisible()}
            value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff'}
            onChange={evt => {
              const color = evt.target.value
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconColor = color)
              set_data({ ...data })
            }}
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}} >{t('Noeud.icon.rIN')}</FormLabel>
        </Col>
        <Col xs={3}>
          <Form.Control
            type='number'
            disabled={radio_selected !== 'local' || !isAllIconVisible()}
            value={valueAllIconRatio()}
            onChange={evt => {
              let ratio = +evt.target.value
              ratio = (ratio > 100) ? 100 : ratio
              ratio = (ratio < 0) ? 0 : ratio
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconRatio = ratio)
              set_data({ ...data })
            }}
          />
        </Col>
        <Col xs={4}>
          <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}} >%</FormLabel>
        </Col>
      </Form.Group>
    </Form>
  </Tab>
}