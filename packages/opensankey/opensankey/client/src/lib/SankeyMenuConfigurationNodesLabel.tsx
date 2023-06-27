import { TFunction } from 'i18next'
import React from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyNode, } from './types'

export const SankeyMenuConfigurationNodesLabel = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_for_style:boolean,
  selected_style_node:string
)=> {

  const parameter_to_modify=(menu_for_style)?data.style_node:data.nodes
  const selected_parameter=(menu_for_style)?[data.style_node[selected_style_node]]:multi_selected_nodes.current

  const isAllLabelVisible = () => {
    let visible = false
    selected_parameter.map(d => visible = (d.label_visible) ? true : visible)
    return visible
  }

  const isAllLabelWhite = () => {
    let visible = false
    selected_parameter.map(d => visible = (d.display_style.label_color) ? true : visible)
    return visible
  }

  const isAllNodeTotal = () => {
    let show_value = false
    selected_parameter.map(d => show_value = (d.show_value) ? true : show_value)
    return show_value
  }

  const isAllNodeLabelValueVert = (arg: string, pos: string) => {
    let all_same = true
    if (selected_parameter.length > 0) {
      if (arg == 'vert') {
        selected_parameter.map(d => all_same = (d.display_style.label_vert_valeur !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        selected_parameter.map(d => all_same = (d.display_style.label_horiz_valeur !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }

  const valueAllNodeLabelBox = () => {
    let display_size = true
    let size = 110
    if (selected_parameter.length != 0) {
      size = selected_parameter[0].display_style.label_box_width
    }
    selected_parameter.map((d) => {
      display_size = (d.display_style.label_box_width == size) ? display_size : false
    })
    const d = (size == 0) ? '' : size
    return (display_size) ? d : 110
  }

  const isAllNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (selected_parameter.length > 0) {
      if (arg == 'vert') {
        selected_parameter.map(d => all_same = (d.display_style.label_vert !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        selected_parameter.map(d => all_same = (d.display_style.label_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }

  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (selected_parameter.length != 0) {
      size = selected_parameter[0].display_style.font_size
    }
    selected_parameter.map((d) => {
      display_size = (d.display_style.font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const allNodeValueFontSize = () => {
    let display_size = true
    let size = 11
    if (selected_parameter.length != 0) {
      size = selected_parameter[0].display_style.value_font_size
    }
    selected_parameter.map((d) => {
      display_size = (d.display_style.value_font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const isAllNodeBold = () => {
    let visible = true
    selected_parameter.map(d => visible = (!d.display_style.bold) ? false : visible)
    return (selected_parameter.length > 0) ? visible : false
  }

  const isAllNodeUpper = () => {
    let visible = true
    selected_parameter.map(d => visible = (!d.display_style.uppercase) ? false : visible)
    return (selected_parameter.length > 0) ? visible : false
  }

  const isAllNodeItalic = () => {
    let visible = true
    selected_parameter.map(d => visible = (!d.display_style.italic) ? false : visible)
    return (selected_parameter.length > 0) ? visible : false
  }

  return <Tab eventKey="label_desc" title={t('Noeud.labels.labels')}>
    <Form>
      {/* Checkbox visibilité noeud */}
      <Form.Group as={Row} >
        <Col xs={4}>{t('Noeud.labels.vdb')}</Col>
        <Col xs={1}>
          <OverlayTrigger
            key={'noeud.labels.tooltips.1'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.1'}>{t('Noeud.labels.tooltips.vdb')} </Tooltip>}>
            <FormCheck inline
              type='switch'
              checked={isAllLabelVisible()}
              onChange={evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.label_visible = evt.target.checked)
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Label en blanc ou noir */}
      <Form.Group as={Row} >
        <Col xs={4}>{t('Noeud.labels.lb')}</Col>
        <Col xs={1}>
          <OverlayTrigger
            key={'noeud.labels.tooltips.2'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.2'}>{t('Noeud.labels.tooltips.lb')} </Tooltip>}>
            <FormCheck inline
              type='switch'
              checked={isAllLabelWhite()}
              onChange={evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.label_color = evt.target.checked)
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Position verticale du label par rapport au noeud */}
      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.pv')}</FormLabel>
        </Col>
        {/* En haut */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.3'}>{t('Noeud.labels.tooltips.haut')} </Tooltip>}>
            <FormCheck disabled={!isAllLabelVisible()}
              type='radio'
              label={t('Noeud.labels.haut')}
              checked={isAllNodeLabelVert('vert', 'top')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_vert = 'top'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* au Milieu */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.4'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.4'}>{t('Noeud.labels.tooltips.Milieu_pv')} </Tooltip>}>
            <FormCheck disabled={!isAllLabelVisible()}
              type='radio'
              label={t('Noeud.labels.Milieu')}
              checked={isAllNodeLabelVert('vert', 'middle')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_vert = 'middle'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* En bas */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.5'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.5'}>{t('Noeud.labels.tooltips.Bas')} </Tooltip>}>
            <FormCheck disabled={!isAllLabelVisible()}
              type='radio'
              label={t('Noeud.labels.Bas')}
              checked={isAllNodeLabelVert('vert', 'bottom')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_vert = 'bottom'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Position laterale du label par rapport au noeud */}
      <Form.Group as={Row} >
        <Col xs={4}>
          <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.ph')}</FormLabel>
        </Col>
        {/* A gauche  */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.6'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.6'}>{t('Noeud.labels.tooltips.gauche')} </Tooltip>}>
            <FormCheck disabled={!isAllLabelVisible()}
              type='radio'
              label={t('Noeud.labels.gauche')}
              checked={isAllNodeLabelVert('horiz', 'left')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_horiz = 'left'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Au milieu */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.7'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.7'}>{t('Noeud.labels.tooltips.Milieu_ph')} </Tooltip>}>
            <FormCheck disabled={!isAllLabelVisible()}
              type='radio'
              label={t('Noeud.labels.Milieu')}
              checked={isAllNodeLabelVert('horiz', 'middle')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_horiz = 'middle'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* A droite */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.8'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.8'}>{t('Noeud.labels.tooltips.droite')} </Tooltip>}>
            <FormCheck disabled={!isAllLabelVisible()}
              type='radio'
              label={t('Noeud.labels.droite')}
              checked={isAllNodeLabelVert('horiz', 'right')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_horiz = 'right'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Taille du texte de label */}
      <Form.Group as={Row} >
        <Col xs={4}>
          <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}</FormLabel>
        </Col>
        <Col xs={5}>
          <FormControl
            min={11}
            type={'number'}
            disabled={!isAllLabelVisible()}
            value={allNodeLabelFontSize()}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.font_size = +evt.target.value)
              set_data({ ...data })
            }}
          />
        </Col>
        <Col style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}}>px</Col>
      </Form.Group>

      {/* Style de police */}
      <Form.Group as={Row} >
        <Col xs={3}>
          <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.police')}</FormLabel>
        </Col>
        {/* Gras */}
        <Col>
          <FormCheck
            type='checkbox'
            label={t('Noeud.labels.gras')}
            checked={isAllNodeBold()}
            disabled={!isAllLabelVisible()}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.bold = evt.target.checked)
                set_data({ ...data })
              }
            }
          />
        </Col>

        {/* en majuscule */}
        <Col>
          <FormCheck
            type='checkbox'
            label={t('Noeud.labels.maj')}
            disabled={!isAllLabelVisible()}
            checked={isAllNodeUpper()}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.uppercase = evt.target.checked)
                set_data({ ...data })
              }
            }
          />
        </Col>

        {/* En italique */}
        <Col>
          <FormCheck
            type='checkbox'
            label={t('Noeud.labels.ita')}
            checked={isAllNodeItalic()}
            disabled={!isAllLabelVisible()}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.italic = evt.target.checked)
                set_data({ ...data })
              }
            }
          />
        </Col>
      </Form.Group>

      {/* Largeur de la zone de texte du label */}
      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}}>
            {t('Noeud.labels.cl')}
          </FormLabel>
        </Col>
        <Col xs={5}>
          <OverlayTrigger
            key={'noeud.labels.tooltips.9'}
            placement={'top'}
            delay={500}
            rootClose
            overlay={<Tooltip id={'noeud.labels.tooltips.9'}>{t('Noeud.labels.tooltips.cl')} </Tooltip>}>
            <FormControl
              value={valueAllNodeLabelBox()}
              type={'number'}
              disabled={!isAllLabelVisible()}
              placeholder={'110'}
              min={0}
              max={500}
              onChange={evt => {
                if (!isNaN(+evt.target.value)) {
                  const val = (+evt.target.value < 0) ? 0 : +evt.target.value
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.label_box_width = val)
                  set_data({ ...data })
                }
              }}/>
          </OverlayTrigger>
        </Col>
        <Col style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}}>px</Col>
      </Form.Group>

      {/* Activer l'affichage de la valeur de la donnée des noeuds */}
      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
      <Form.Group as={Row} >
        <Col xs={4}>
          <FormLabel >{t('Noeud.labels.vdv')} </FormLabel>
        </Col>
        <Col xs={1}>
          <OverlayTrigger
            key={'noeud.labels.tooltips.10'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.10'}>{t('Noeud.labels.tooltips.vdv')} </Tooltip>}>
            <FormCheck inline
              type='switch'
              checked={isAllNodeTotal()}
              onChange={evt => {
                // node.shape_visible = evt.target.checked
                // node.node_visible = node.label_visible || node.shape_visible
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.show_value = evt.target.checked)
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Position vertical de l'affichage des données par rapport au noeud */}
      <Form.Group as={Row} >
        <Col xs={4}>
          <FormLabel style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}} >{t('Noeud.labels.pv')}</FormLabel>
        </Col>
        {/* en haut */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.11'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.11'}>{t('Noeud.labels.tooltips.haut_val')} </Tooltip>}>
            <FormCheck
              disabled={!isAllNodeTotal()}
              type='radio'
              label={t('Noeud.labels.haut')}
              checked={isAllNodeLabelValueVert('vert', 'top')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_vert_valeur = 'top'
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Au milieu */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.12'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.12'}>{t('Noeud.labels.tooltips.Milieu_pv_val')} </Tooltip>}>
            <FormCheck
              disabled={!isAllNodeTotal()}
              type='radio'
              label={t('Noeud.labels.Milieu')}
              checked={isAllNodeLabelValueVert('vert', 'middle')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_vert_valeur = 'middle'
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* EN bas */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.13'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.13'}>{t('Noeud.labels.tooltips.Bas_val')} </Tooltip>}>
            <FormCheck
              type='radio'
              label={t('Noeud.labels.Bas')}
              disabled={!isAllNodeTotal()}
              checked={isAllNodeLabelValueVert('vert', 'bottom')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_vert_valeur = 'bottom'
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Position horizontale de l'affichage des données par rapport au noeud */}
      <Form.Group as={Row}>
        <Col xs={4}>
          <FormLabel style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}} >{t('Noeud.labels.ph')}</FormLabel>
        </Col>

        {/* A gauche */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.14'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.14'}>{t('Noeud.labels.tooltips.gauche_val')} </Tooltip>}>
            <FormCheck disabled={!isAllNodeTotal()}
              type='radio'
              label={t('Noeud.labels.gauche')}
              checked={isAllNodeLabelValueVert('horiz', 'left')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_horiz_valeur = 'left'
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* Au milieu */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.15'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.15'}>{t('Noeud.labels.tooltips.Milieu_ph_val')} </Tooltip>}>
            <FormCheck disabled={!isAllNodeTotal()}
              type='radio'
              label={t('Noeud.labels.Milieu')}
              checked={isAllNodeLabelValueVert('horiz', 'middle')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_horiz_valeur = 'middle'
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>

        {/* A droite */}
        <Col>
          <OverlayTrigger
            key={'noeud.labels.tooltips.16'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.16'}>{t('Noeud.labels.tooltips.droite_val')} </Tooltip>}>
            <FormCheck disabled={!isAllNodeTotal()}
              type='radio'
              label={t('Noeud.labels.droite')}
              checked={isAllNodeLabelValueVert('horiz', 'right')}
              onChange={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.display_style.label_horiz_valeur = 'right'
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Taille de la police du texte de la valeur */}
      <Form.Group as={Row} >
        <Col xs={4}>
          <FormLabel style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}
          </FormLabel>
        </Col>
        <Col xs={5}>
          <FormControl
            min={11}
            type={'number'}
            disabled={!isAllNodeTotal()}
            value={allNodeValueFontSize()}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.value_font_size = +evt.target.value)
              set_data({ ...data })
            }}
          />
        </Col>
        <Col style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}}>px</Col>
      </Form.Group>
    </Form>
  </Tab>
}

