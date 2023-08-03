import { TFunction } from 'i18next'
import React from 'react'
import { Row, Form,  FormLabel, Col, FormCheck, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyNode } from './types'
import { return_correct_node_attribute_value,assign_node_value_to_correct_var,is_node_diplaying_value_local,is_all_node_attr_same_value} from './SankeyUtils'
export const OpenSankeyConfigurationNodesAttributes = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_for_style:boolean,
  selected_style_node:string
) => {
  const parameter_to_modify=(menu_for_style)?data.style_node:data.nodes
  const selected_parameter=(menu_for_style)?[data.style_node[selected_style_node]]:multi_selected_nodes.current

  const getBrowserName = () => {
    const browserInfo = navigator.userAgent
    let browser
    if (browserInfo.includes('Opera') || browserInfo.includes('Opr')) {
      browser = 'Opera'
    } else if (browserInfo.includes('Edg')) {
      browser = 'Edge'
    } else if (browserInfo.includes('Chrome')) {
      browser = 'Chrome'
    } else if (browserInfo.includes('Safari')) {
      browser = 'Safari'
    } else if (browserInfo.includes('Firefox')) {
      browser = 'Firefox'
    } else {
      browser = 'unknown'
    }
    return browser
  }

  // const isAllNodeVisible = () => {
  //   let visible = false
  //   selected_parameter.map(d => visible = (return_correct_node_attribute_value(data,d,'shape_visible',menu_for_style) || return_correct_node_attribute_value(data,d,'not_to_scale',menu_for_style)) ? true : visible)
  //   return visible
  // }
  const isAllNodeVisible=is_all_node_attr_same_value(data,selected_parameter,'shape_visible',menu_for_style) as boolean

  const isAllNodeRect = () => {
    let rect = true
    if (selected_parameter.length > 0) {
      selected_parameter.map(d => rect = (return_correct_node_attribute_value(data,d,'shape',menu_for_style) !== 'rect') ? false : rect)
    } else {
      rect = false
    }
    return rect
  }



  const isAllNodeCircle = () => {
    let circle = true
    if (selected_parameter.length > 0) {
      selected_parameter.map(d => circle = (return_correct_node_attribute_value(data,d,'shape',menu_for_style) !== 'ellipse') ? false : circle)
    } else {
      circle = false
    }
    return circle
  }

  // const isAllNodeColorSustainable = () => {
  //   let colorS = true
  //   if (selected_parameter.length > 0) {
  //     selected_parameter.map(d => colorS = (!(return_correct_node_attribute_value(data,d,'colorSustainable',menu_for_style) as boolean)) ? false : colorS)
  //   } else {
  //     colorS = false
  //   }
  //   return colorS
  // }

  const isAllNodeColorSustainable=is_all_node_attr_same_value(data,selected_parameter,'colorSustainable',menu_for_style) as boolean


  // const displayedValueNodeWidth = () => {
  //   let display_width = true
  //   let width = 0
  //   if (selected_parameter.length != 0) {
  //     // width = selected_parameter[0].node_width
  //     width = return_correct_node_attribute_value(data,selected_parameter[0],'node_width',menu_for_style) as number
  //   }
  //   selected_parameter.map((d) => {
  //     display_width = (return_correct_node_attribute_value(data,d,'node_width',menu_for_style) == width) ? display_width : false
  //   })
  //   return (display_width) ? width : 0
  // }

  // const displayedValueNodeWidth=is_all_node_attr_same_value(data,selected_parameter,'node_width',menu_for_style) as number


  // const displayedValueNodeHeight = () => {
  //   let display_height = true
  //   let height = 0
  //   if (selected_parameter.length != 0) {
  //     // height = selected_parameter[0].node_height
  //     height = return_correct_node_attribute_value(data,selected_parameter[0],'node_height',menu_for_style) as number

  //   }
  //   selected_parameter.map((d) => {
  //     // display_height = (d.node_height == height) ? display_height : false
  //     display_height = (return_correct_node_attribute_value(data,d,'node_height',menu_for_style) == height) ? display_height : false

  //   })
  //   return (display_height) ? height : 0
  // }
  // const displayedValueNodeHeight=is_all_node_attr_same_value(data,selected_parameter,'node_height',menu_for_style) as number


  // Tableau d'elements de sous-menu attribut de noeuds
  return [
    /* Visibilite du noeud */
    <Form.Group as={Row} key={'node_visibility'} >
      <Col xs={4}>
        <FormLabel >{t('Noeud.apparence.Visibilité')+(is_node_diplaying_value_local(multi_selected_nodes,'shape_visible',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={1}>
        <OverlayTrigger
          key={'noeud.apparence.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.apparence.tooltips.1'}>{t('Noeud.apparence.tooltips.Visibilité')} </Tooltip>}>
          <FormCheck inline
            type='switch'
            checked={isAllNodeVisible}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'shape_visible',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Couleur du noeud */
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Couleur')+(is_node_diplaying_value_local(multi_selected_nodes,'color',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={3}>
        <OverlayTrigger
          key={'noeud.apparence.tooltips.2'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.apparence.tooltips.2'}>{t('Noeud.apparence.tooltips.Couleur')} </Tooltip>}>
          {(getBrowserName()==='Firefox')?<Form.Control
            type='color'
            disabled={ menu_for_style?false:!isAllNodeVisible}
            value={(selected_parameter.length == 1) ? (return_correct_node_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'color',evt.target.value,menu_for_style))
              set_data({ ...data })
              
            }}
          />:<Form.Control
            type='color'
            disabled={ menu_for_style?false:!isAllNodeVisible}
            value={(selected_parameter.length == 1) ? (return_correct_node_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'color',evt.target.value,menu_for_style))
              // set_data({ ...data })
            }}
            onBlurCapture={()=>{
              set_data({ ...data })
            }}
          />}  
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Figer la couleur */
    <Form.Group as={Row}>
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}}>{t('Noeud.apparence.CouleurPérenne')+(is_node_diplaying_value_local(multi_selected_nodes,'colorSustainable',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={3}>
        <OverlayTrigger
          key={'noeud.apparence.tooltips.3'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.apparence.tooltips.3'}>{t('Noeud.apparence.tooltips.CouleurPérenne')} </Tooltip>}>
          <Form.Check
            type='checkbox'
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            checked={isAllNodeColorSustainable}
            onChange={evt => {
              const checked = evt.target.checked
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'colorSustainable',checked,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    /* Forme du noeud */
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Forme')+(is_node_diplaying_value_local(multi_selected_nodes,'shape',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'noeud.apparence.tooltips.4'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.apparence.tooltips.4'}>{t('Noeud.apparence.tooltips.Forme')} </Tooltip>}>
          <FormCheck
            value="ellipse"
            type='radio'
            label={t('Noeud.apparence.Cercle')}
            disabled={menu_for_style?false:!isAllNodeVisible}
            checked={isAllNodeCircle()}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'shape',evt.target.value,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'noeud.apparence.tooltips.5'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'noeud.apparence.tooltips.5'}>{t('Noeud.apparence.tooltips.Forme')} </Tooltip>}>
          <FormCheck
            value="rect"
            type='radio'
            label={t('Noeud.apparence.Rectangle')}
            disabled={menu_for_style?false:!isAllNodeVisible}
            checked={isAllNodeRect()}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'shape',evt.target.value,menu_for_style))
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

    // /* Largeur minimale du noeud */
    // <Form.Group as={Row} >
    //   <Col xs={4}>
    //     <FormLabel style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.apparence.TML')+(is_node_diplaying_value_local(multi_selected_nodes,'node_width',menu_for_style)?'*':'')}</FormLabel>
    //   </Col>
    //   <Col>
    //     <OverlayTrigger
    //       key={'noeud.apparence.tooltips.6'}
    //       placement={'top'}
    //       delay={500}
    //       rootClose
    //       overlay={<Tooltip id={'noeud.apparence.tooltips.6'}>{t('Noeud.apparence.tooltips.TML')} </Tooltip>}>
    //       <FormControl
    //         min={0} max={100}
    //         type={'number'}
    //         value={displayedValueNodeWidth}
    //         disabled={menu_for_style?false:!isAllNodeVisible}
    //         onChange={
    //           evt => {
    //             selected_parameter.map(d=>assign_node_value_to_correct_var(d,'node_width',+evt.target.value,menu_for_style))
    //             // selected_parameter.map(d => d.node_width = +evt.target.value,menu_for_style)
    //             //set_multi_selected_nodes(multi_selected_nodes)
    //             Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'node_width',evt.target.value,menu_for_style))
    //             set_data({ ...data })
    //           }}/>
    //     </OverlayTrigger>
    //   </Col>
    //   <Col style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}}>px</Col>
    // </Form.Group>,

    // /* Hauteur minimale du noeud */
    // <Form.Group as={Row} >
    //   <Col xs={4}>
    //     <FormLabel style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}} >{t('Noeud.apparence.TMH')+(is_node_diplaying_value_local(multi_selected_nodes,'node_height',menu_for_style)?'*':'')}</FormLabel>
    //   </Col>
    //   <Col>
    //     <OverlayTrigger
    //       key={'noeud.apparence.tooltips.7'}
    //       placement={'top'}
    //       delay={500}
    //       rootClose
    //       overlay={<Tooltip id={'noeud.apparence.tooltips.7'}>{t('Noeud.apparence.tooltips.TMH')} </Tooltip>}>
    //       <FormControl
    //         min={0} max={100}
    //         type={'number'}
    //         value={displayedValueNodeHeight}
    //         disabled={menu_for_style?false:!isAllNodeVisible}
    //         onChange={
    //           evt => {
    //             //set_multi_selected_nodes(multi_selected_nodes)
    //             Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'node_height',evt.target.value,menu_for_style))
    //             set_data({ ...data })
    //           }}/>
    //     </OverlayTrigger>
    //   </Col>
    //   <Col style={{color:(isAllNodeVisible || menu_for_style)?'#555555':'#DADADA'}}>px</Col>
    // </Form.Group>
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