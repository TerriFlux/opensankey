import { TFunction } from 'i18next'
import React from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyNode } from './types'
import { return_correct_node_attribute_value,assign_node_value_to_correct_var,is_node_diplaying_value_local,is_all_node_attr_same_value } from './SankeyUtils'



export const SankeyMenuConfigurationNodesLabel = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_for_style:boolean,
  selected_style_node:string,
  menu_for_modal=false
)=> {

  const parameter_to_modify=(menu_for_style)?data.style_node:data.nodes
  const selected_parameter=(menu_for_style)?[data.style_node[selected_style_node]]:multi_selected_nodes.current

  
  const isAllLabelVisible=is_all_node_attr_same_value(data,selected_parameter,'label_visible',menu_for_style) as boolean


  const isAllLabelWhite =is_all_node_attr_same_value(data,selected_parameter,'label_color',menu_for_style) as boolean

  const isAllNodeTotal =is_all_node_attr_same_value(data,selected_parameter,'show_value',menu_for_style) as boolean

  const valueAllNodeLabelBox =is_all_node_attr_same_value(data,selected_parameter,'label_box_width',menu_for_style) as number

  const allNodeLabelFontSize =is_all_node_attr_same_value(data,selected_parameter,'font_size',menu_for_style) as number

  const allNodeValueFontSize =is_all_node_attr_same_value(data,selected_parameter,'value_font_size',menu_for_style) as number
  

  const isAllNodeBold =is_all_node_attr_same_value(data,selected_parameter,'bold',menu_for_style) as boolean

  const isAllNodeUpper =is_all_node_attr_same_value(data,selected_parameter,'uppercase',menu_for_style) as boolean

  const isAllNodeItalic =is_all_node_attr_same_value(data,selected_parameter,'italic',menu_for_style) as boolean

  const isAllNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (selected_parameter.length > 0) {
      if (arg == 'vert') {
        // selected_parameter.map(d => all_same = (d.display_style.label_vert !== pos) ? false : all_same)
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_vert',menu_for_style)!==pos) ? false : all_same)

      } else if (arg == 'horiz') {
        // selected_parameter.map(d => all_same = (d.display_style.label_horiz !== pos) ? false : all_same)
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_horiz',menu_for_style)!==pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }

  const isAllNodeLabelValueVert = (arg: string, pos: string) => {
    let all_same = true
    if (selected_parameter.length > 0) {
      if (arg == 'vert') {
        // selected_parameter.map(d => all_same = (d.display_style.label_vert_valeur !== pos) ? false : all_same)
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_vert_valeur',menu_for_style)!== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        // selected_parameter.map(d => all_same = (d.display_style.label_horiz_valeur !== pos) ? false : all_same)
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_horiz_valeur',menu_for_style)!== pos) ? false : all_same)

      }
    } else {
      all_same = false
    }
    
    return all_same
  }
  const content= <Form>
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
            checked={isAllLabelVisible}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'label_visible',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Label en blanc ou noir */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.lb')+(is_node_diplaying_value_local(multi_selected_nodes,'label_color',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={1}>
        <OverlayTrigger
          key={'noeud.labels.tooltips.2'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.labels.tooltips.2'}>{t('Noeud.labels.tooltips.lb')} </Tooltip>}>
          <FormCheck inline
            type='switch'
            checked={isAllLabelWhite}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'label_color',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Position verticale du label par rapport au noeud */}
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.pv')+(is_node_diplaying_value_local(multi_selected_nodes,'label_vert',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      {/* En haut */}
      <Col>
        <OverlayTrigger
          key={'noeud.labels.tooltips.3'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.labels.tooltips.3'}>{t('Noeud.labels.tooltips.haut')} </Tooltip>}>
          <FormCheck disabled={!isAllLabelVisible && !menu_for_style}
            type='radio'
            label={t('Noeud.labels.top')}
            checked={isAllNodeLabelVert('vert', 'top')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_vert','top',menu_for_style)
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
          <FormCheck disabled={!isAllLabelVisible && !menu_for_style}
            type='radio'
            label={t('Noeud.labels.middle')}
            checked={isAllNodeLabelVert('vert', 'middle')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_vert','middle',menu_for_style)
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
          <FormCheck disabled={!isAllLabelVisible && !menu_for_style}
            type='radio'
            label={t('Noeud.labels.bottom')}
            checked={isAllNodeLabelVert('vert', 'bottom')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_vert','bottom',menu_for_style)
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
        <FormLabel style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.ph')+(is_node_diplaying_value_local(multi_selected_nodes,'label_horiz',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      {/* A gauche  */}
      <Col>
        <OverlayTrigger
          key={'noeud.labels.tooltips.6'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.labels.tooltips.6'}>{t('Noeud.labels.tooltips.gauche')} </Tooltip>}>
          <FormCheck disabled={!isAllLabelVisible && !menu_for_style}
            type='radio'
            label={t('Noeud.labels.left')}
            checked={isAllNodeLabelVert('horiz', 'left')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_horiz','left',menu_for_style)
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
          <FormCheck disabled={!isAllLabelVisible && !menu_for_style}
            type='radio'
            label={t('Noeud.labels.middle')}
            checked={isAllNodeLabelVert('horiz', 'middle')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_horiz','middle',menu_for_style)
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
          <FormCheck disabled={!isAllLabelVisible && !menu_for_style}
            type='radio'
            label={t('Noeud.labels.right')}
            checked={isAllNodeLabelVert('horiz', 'right')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_horiz','right',menu_for_style)
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
        <FormLabel style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')+(is_node_diplaying_value_local(multi_selected_nodes,'font_size',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={5}>
        <FormControl
          min={11}
          type={'number'}
          disabled={!isAllLabelVisible && !menu_for_style}
          value={allNodeLabelFontSize}
          onChange={evt => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'font_size',+evt.target.value,menu_for_style))
            set_data({ ...data })
          }}
        />
      </Col>
      <Col style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}}>px</Col>
    </Form.Group>

    {/* Style de police */}
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.police')}</FormLabel>
      </Col>
      {/* Gras */}
      <Col>
        <FormCheck
          type='checkbox'
          label={t('Noeud.labels.gras')+(is_node_diplaying_value_local(multi_selected_nodes,'bold',menu_for_style)?'*':'')}
          checked={isAllNodeBold}
          disabled={!isAllLabelVisible && !menu_for_style}
          onChange={
            evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'bold',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }
          }
        />
      </Col>

      {/* en majuscule */}
      <Col>
        <FormCheck
          type='checkbox'
          label={t('Noeud.labels.maj')+(is_node_diplaying_value_local(multi_selected_nodes,'uppercase',menu_for_style)?'*':'')}
          disabled={!isAllLabelVisible && !menu_for_style}
          checked={isAllNodeUpper}
          onChange={
            evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'uppercase',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }
          }
        />
      </Col>

      {/* En italique */}
      <Col>
        <FormCheck
          type='checkbox'
          label={t('Noeud.labels.ita')+(is_node_diplaying_value_local(multi_selected_nodes,'italic',menu_for_style)?'*':'')}
          checked={isAllNodeItalic}
          disabled={!isAllLabelVisible && !menu_for_style}
          onChange={
            evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'italic',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }
          }
        />
      </Col>
    </Form.Group>

    {/* Largeur de la zone de texte du label */}
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}}>
          {t('Noeud.labels.cl')+(is_node_diplaying_value_local(multi_selected_nodes,'label_box_width',menu_for_style)?'*':'')}
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
            value={valueAllNodeLabelBox}
            type={'number'}
            disabled={!isAllLabelVisible && !menu_for_style}
            placeholder={'110'}
            min={0}
            max={500}
            onChange={evt => {
              if (!isNaN(+evt.target.value)) {
                const val = (+evt.target.value < 0) ? 0 : +evt.target.value
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'label_box_width',val,menu_for_style))
                set_data({ ...data })
              }
            }}/>
        </OverlayTrigger>
      </Col>
      <Col style={{color:(isAllLabelVisible||menu_for_style)?'#555555':'#DADADA'}}>px</Col>
    </Form.Group>

    {/* Activer l'affichage de la valeur de la donnée des noeuds */}
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeTotal||menu_for_style)?'#555555':'#DADADA'}}>{t('Noeud.labels.vdv')} </FormLabel>
      </Col>
      <Col xs={1}>
        <OverlayTrigger
          key={'noeud.labels.tooltips.10'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.labels.tooltips.10'}>{t('Noeud.labels.tooltips.vdv')} </Tooltip>}>
          <FormCheck inline
            type='switch'
            checked={isAllNodeTotal}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'show_value',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Position vertical de l'affichage des données par rapport au noeud */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeTotal||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.pv')+(is_node_diplaying_value_local(multi_selected_nodes,'label_vert_valeur',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      {/* en haut */}
      <Col>
        <OverlayTrigger
          key={'noeud.labels.tooltips.11'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.labels.tooltips.11'}>{t('Noeud.labels.tooltips.haut_val')} </Tooltip>}>
          <FormCheck
            disabled={!isAllNodeTotal&& !menu_for_style}
            type='radio'
            label={t('Noeud.labels.top')}
            checked={isAllNodeLabelValueVert('vert', 'top')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_vert_valeur','top',menu_for_style)
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
            disabled={!isAllNodeTotal&& !menu_for_style}
            type='radio'
            label={t('Noeud.labels.middle')}
            checked={isAllNodeLabelValueVert('vert', 'middle')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_vert_valeur','middle',menu_for_style)
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
            label={t('Noeud.labels.bottom')}
            disabled={!isAllNodeTotal&& !menu_for_style}
            checked={isAllNodeLabelValueVert('vert', 'bottom')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_vert_valeur','bottom',menu_for_style)
              })
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Position horizontale de l'affichage des données par rapport au noeud */}
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeTotal||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.ph')+(is_node_diplaying_value_local(multi_selected_nodes,'label_horiz_valeur',menu_for_style)?'*':'')}</FormLabel>
      </Col>

      {/* A gauche */}
      <Col>
        <OverlayTrigger
          key={'noeud.labels.tooltips.14'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.labels.tooltips.14'}>{t('Noeud.labels.tooltips.gauche_val')} </Tooltip>}>
          <FormCheck disabled={!isAllNodeTotal&& !menu_for_style}
            type='radio'
            label={t('Noeud.labels.left')}
            checked={isAllNodeLabelValueVert('horiz', 'left')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_horiz_valeur','left',menu_for_style)
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
          <FormCheck disabled={!isAllNodeTotal&& !menu_for_style}
            type='radio'
            label={t('Noeud.labels.middle')}
            checked={isAllNodeLabelValueVert('horiz', 'middle')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_horiz_valeur','middle',menu_for_style)
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
          <FormCheck disabled={!isAllNodeTotal&& !menu_for_style}
            type='radio'
            label={t('Noeud.labels.right')}
            checked={isAllNodeLabelValueVert('horiz', 'right')}
            onChange={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                assign_node_value_to_correct_var(d,'label_horiz_valeur','right',menu_for_style)
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
        <FormLabel style={{color:(isAllNodeTotal||menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}
        </FormLabel>
      </Col>
      <Col xs={5}>
        <FormControl
          min={11}
          type={'number'}
          disabled={!isAllNodeTotal&& !menu_for_style}
          value={allNodeValueFontSize}
          onChange={evt => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'value_font_size',+evt.target.value,menu_for_style))
            set_data({ ...data })
          }}
        />
      </Col>
      <Col style={{color:(isAllNodeTotal||menu_for_style)?'#555555':'#DADADA'}}>px</Col>
    </Form.Group>
  </Form>


  return menu_for_modal?content:<Tab eventKey="label_desc" title={t('Noeud.labels.labels')}>{content}</Tab>
}

