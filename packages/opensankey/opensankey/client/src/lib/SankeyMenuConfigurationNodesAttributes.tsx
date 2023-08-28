import { TFunction } from 'i18next'
import React from 'react'
import { Form, Tab, OverlayTrigger, Tooltip,FormControl, Button, ButtonGroup, InputGroup,Dropdown } from 'react-bootstrap'
import { SankeyData, SankeyNode } from './types'
import { return_correct_node_attribute_value,assign_node_value_to_correct_var,is_node_diplaying_value_local,is_all_node_attr_same_value,cut_name} from './SankeyUtils'
import { FaAlignLeft,FaAlignCenter,FaAlignRight,FaBold,FaItalic, FaLock, FaLockOpen, FaEye, FaEyeSlash,FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
export const OpenSankeyConfigurationNodesAttributes = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_for_style:boolean,
  selected_style_node:string,
  set_style_to_apply:(s:string)=>void,
  advanced_appearence_content:JSX.Element[],
  advanced_label_content:JSX.Element[],
  advanced_label_value_content:JSX.Element[],
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

  const isAllNodeColorSustainable=is_all_node_attr_same_value(data,selected_parameter,'colorSustainable',menu_for_style) as boolean

  const displayedValueNodeWidth=is_all_node_attr_same_value(data,selected_parameter,'node_width',menu_for_style) as number

  const displayedValueNodeHeight=is_all_node_attr_same_value(data,selected_parameter,'node_height',menu_for_style) as number

  const isAllLabelVisible=is_all_node_attr_same_value(data,selected_parameter,'label_visible',menu_for_style) as boolean

  const isAllLabelWhite =is_all_node_attr_same_value(data,selected_parameter,'label_color',menu_for_style) as boolean
  const isAllLabelBackGroundColored =is_all_node_attr_same_value(data,selected_parameter,'label_background',menu_for_style) as boolean

  const isAllNodeTotal =is_all_node_attr_same_value(data,selected_parameter,'show_value',menu_for_style) as boolean

  const valueAllNodeLabelBox =is_all_node_attr_same_value(data,selected_parameter,'label_box_width',menu_for_style) as number

  const allNodeLabelFontSize =is_all_node_attr_same_value(data,selected_parameter,'font_size',menu_for_style) as number

  const allNodeValueFontSize =is_all_node_attr_same_value(data,selected_parameter,'value_font_size',menu_for_style) as number

  const allNodeFF =is_all_node_attr_same_value(data,selected_parameter,'font_family',menu_for_style) as boolean

  const isAllNodeBold =is_all_node_attr_same_value(data,selected_parameter,'bold',menu_for_style) as boolean

  const isAllNodeUpper =is_all_node_attr_same_value(data,selected_parameter,'uppercase',menu_for_style) as boolean

  const isAllNodeItalic =is_all_node_attr_same_value(data,selected_parameter,'italic',menu_for_style) as boolean

  const isAllNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (selected_parameter.length > 0) {
      if (arg == 'vert') {
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_vert',menu_for_style)!==pos) ? false : all_same)
      } else if (arg == 'horiz') {
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
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_vert_valeur',menu_for_style)!== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        selected_parameter.map(d => all_same = (return_correct_node_attribute_value(data,d,'label_horiz_valeur',menu_for_style)!== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }

  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_node[style_to_display].name, 20) : 'Multiple style parmi les noeuds sélectionnés'
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  const apply_style_to_nodes = () => {
    multi_selected_nodes.current.map(d => {
      // Delete local value so the used value come from the style
      delete d.local
    })
    set_data({ ...data })
  }

  const content_appearence=<Form.Group>
    {/* Visibilite du noeud */}
    <OverlayTrigger
      key={'noeud.apparence.tooltips.1'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.apparence.tooltips.1'}>{t('Noeud.apparence.tooltips.Visibilité')} </Tooltip>}>
      <InputGroup key={'node_visibility'} >
        <InputGroup.Text style={{width:'40%'}}>
          {t('Noeud.apparence.Visibilité')+(is_node_diplaying_value_local(multi_selected_nodes,'shape_visible',menu_for_style)?'*':'')}
        </InputGroup.Text><Button
          className='btn_menu_config'
          style={{width:'60%'}}
          //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
          variant={isAllNodeVisible?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'shape_visible',!isAllNodeVisible,menu_for_style))
            set_data({ ...data })
          }}>{isAllNodeVisible?<FaEye/>:<FaEyeSlash/>}</Button>
      </InputGroup>
    </OverlayTrigger>

    {isAllNodeVisible?<>
      {/* Couleur du noeud */}
      <OverlayTrigger
        key={'noeud.apparence.tooltips.2'}
        placement={'top'}
        delay={500}
        overlay={
          <Tooltip id={'noeud.apparence.tooltips.2'}>
            {t('Noeud.apparence.tooltips.Couleur')}
          </Tooltip>
        }>
        <InputGroup>
          <InputGroup.Text
            style={{width:'40%'}}
          >
            {t('Noeud.apparence.Couleur')+(is_node_diplaying_value_local(multi_selected_nodes,'color',menu_for_style)?'*':'')}
          </InputGroup.Text>
          <Form.Label for="form_color_node"
            style={{
              width:'50%',
              background:(selected_parameter.length == 1) ? (return_correct_node_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string): '#ffffff',
              border:'1px solid #ced4da',
            }}/>
          {(getBrowserName()==='Firefox')?<Form.Control
            style={{width:'50%',display:'none'}}
            type='color'
            id='form_color_node'
            name='form_color_node'
            value={(selected_parameter.length == 1) ? (return_correct_node_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'color',evt.target.value,menu_for_style))
              set_data({ ...data })
            }}
          />:<Form.Control
            style={{width:'50%',display:'none'}}
            type='color'
            id='form_color_node'
            name='form_color_node'
            value={(selected_parameter.length == 1) ? (return_correct_node_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'color',evt.target.value,menu_for_style))
              // set_data({ ...data })
            }}
            onBlurCapture={()=>{
              set_data({ ...data })
            }}
          />}
          <OverlayTrigger
            key={'noeud.apparence.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.apparence.tooltips.3'}>{t('Noeud.apparence.tooltips.CouleurPérenne')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              style={{width:'10%'}}
              //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
              variant={isAllNodeColorSustainable?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'colorSustainable',!isAllNodeColorSustainable,menu_for_style))
                set_data({ ...data })
              }}>{isAllNodeColorSustainable?<FaLock/>:<FaLockOpen/>}</Button>
          </OverlayTrigger>
        </InputGroup>
      </OverlayTrigger>

      {/* Forme du noeud */}
      <OverlayTrigger
        key={'noeud.apparence.tooltips.4'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'noeud.apparence.tooltips.4'}>{t('Noeud.apparence.tooltips.Forme')} </Tooltip>}>

        <InputGroup >
          <InputGroup.Text
            style={{width:'40%'}}
          >
            {t('Noeud.apparence.Forme')+(is_node_diplaying_value_local(multi_selected_nodes,'shape',menu_for_style)?'*':'')}
          </InputGroup.Text>

          <Button className='btn_menu_config'
            style={{width:'30%'}}
            value="ellipse"
            variant={isAllNodeCircle()?'primary':'outline-primary'}
            onClick={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'shape','ellipse',menu_for_style))
              set_data({ ...data })
            }}>{t('Noeud.apparence.Cercle')}</Button>

          <Button className='btn_menu_config'
            style={{width:'30%'}}
            variant={isAllNodeRect()?'primary':'outline-primary'}
            onClick={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>assign_node_value_to_correct_var(d,'shape','rect',menu_for_style))
              set_data({ ...data })
            }}>{t('Noeud.apparence.Rectangle')}</Button>
        </InputGroup>
      </OverlayTrigger>

      {/* Largeur minimale du noeud */}
      <OverlayTrigger
        key={'noeud.apparence.tooltips.6'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'noeud.apparence.tooltips.6'}>{t('Noeud.apparence.tooltips.TML')} </Tooltip>}>
        <InputGroup>
          <InputGroup.Text style={{width:'40%'}}>
            {t('Noeud.apparence.TML')}
          </InputGroup.Text>

          <FormControl
            min={0}
            step={1}
            type={'number'}
            value={displayedValueNodeWidth}
            onChange={
              evt => {
                const val=evt.target.value
                let value=40
                if(!isNaN(+val)){
                  value=Math.abs(Math.round(+val))
                }
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'node_width',value,menu_for_style))
                set_data({ ...data })
              }}/>

          <InputGroup.Text style={{width:'10%'}}>
            px
          </InputGroup.Text>
        </InputGroup>
      </OverlayTrigger>

      {/* Hauteur minimale du noeud */}
      <OverlayTrigger
        key={'noeud.apparence.tooltips.7'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'noeud.apparence.tooltips.7'}>{t('Noeud.apparence.tooltips.TMH')} </Tooltip>}>
        <InputGroup>
          <InputGroup.Text style={{width:'40%'}}>
            {t('Noeud.apparence.TMH')}
          </InputGroup.Text>

          <FormControl
            min={0} max={100}
            type={'number'}
            value={displayedValueNodeHeight}
            onChange={
              evt => {
                const val=evt.target.value
                let value=40
                if(!isNaN(+val)){
                  value=Math.abs(Math.round(+val))
                }
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'node_height',value,menu_for_style))
                set_data({ ...data })
              }}/>

          <InputGroup.Text style={{width:'10%'}}>
            px
          </InputGroup.Text>
        </InputGroup>
      </OverlayTrigger>
      {advanced_appearence_content}
    </>:<></>}
  </Form.Group>

  const svg_label_top=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_bottom=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_center=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z"/></svg>
  const svg_label_upper=<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z"/><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z"/></g></svg>

  const content_label= <Form.Group>
    {/* Checkbox visibilité noeud */}
    <OverlayTrigger
      key={'noeud.labels.tooltips.1'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.labels.tooltips.1'}>{t('Noeud.labels.tooltips.vdb')} </Tooltip>}>
      <InputGroup>
        <InputGroup.Text style={{width:'40%'}}>
          {t('Noeud.labels.vdb')}
        </InputGroup.Text>

        <Button
          className='btn_menu_config'
          style={{width:'60%'}}
          //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
          variant={isAllLabelVisible?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'label_visible',!isAllLabelVisible,menu_for_style))
            set_data({ ...data })
          }}>{isAllLabelVisible?<FaEye/>:<FaEyeSlash/>}</Button>
      </InputGroup>
    </OverlayTrigger>

    {isAllLabelVisible? <>
      {/* Label en blanc ou noir */}
      <OverlayTrigger
        key={'noeud.labels.tooltips.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'noeud.labels.tooltips.2'}>{t('Noeud.labels.tooltips.lb')} </Tooltip>}>
        <InputGroup>
          <InputGroup.Text
            style={{width:'40%'}}
          >
            {t('Noeud.labels.lb')+(is_node_diplaying_value_local(multi_selected_nodes,'label_color',menu_for_style)?'*':'')}
          </InputGroup.Text>
          <Button
            className='btn_menu_config'
            style={{width:'60%'}}
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            variant={isAllLabelWhite?'primary':'outline-primary'}
            onClick={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'label_color',!isAllLabelWhite,menu_for_style))
              set_data({ ...data })
            }}>{isAllLabelWhite?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </InputGroup>
      </OverlayTrigger>

      {/* Ajout fond coloré pour meilleur visibilité si label sur flux */}
      <OverlayTrigger
        key={'noeud.labels.tooltips.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'noeud.labels.tooltips.2'}>{t('Noeud.labels.tooltips.l_bg')} </Tooltip>}>
        <InputGroup>
          <InputGroup.Text style={{width:'40%'}} >
            {t('Noeud.labels.l_bg')+(is_node_diplaying_value_local(multi_selected_nodes,'label_background',menu_for_style)?'*':'')}
          </InputGroup.Text>

          <Button
            className='btn_menu_config'
            style={{width:'60%'}}
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            variant={isAllLabelBackGroundColored?'primary':'outline-primary'}
            onClick={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'label_background',!isAllLabelBackGroundColored,menu_for_style))
              set_data({ ...data })
            }}>{isAllLabelBackGroundColored?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </InputGroup>
      </OverlayTrigger>

      {/* Position  du label par rapport au noeud */}
      <InputGroup>
        <InputGroup.Text style={{width:'30%'}}>{'Position'}</InputGroup.Text>
        <ButtonGroup style={{width:'35%'}}>
          {/* A gauche  */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.6'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.6'}>{t('Noeud.labels.tooltips.gauche')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelVert('horiz', 'left')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_horiz','left',menu_for_style)
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}><FaAlignLeft/></Button>
          </OverlayTrigger>

          {/* Au milieu */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.7'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.7'}>{t('Noeud.labels.tooltips.Milieu_ph')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelVert('horiz', 'middle')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_horiz','middle',menu_for_style)
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}><FaAlignCenter/></Button>
          </OverlayTrigger>

          {/* A droite */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.8'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.8'}>{t('Noeud.labels.tooltips.droite')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelVert('horiz', 'right')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_horiz','right',menu_for_style)
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}><FaAlignRight/></Button>
          </OverlayTrigger>
        </ButtonGroup>

        {/* En haut */}
        <ButtonGroup style={{width:'35%'}}>
          <OverlayTrigger
            key={'noeud.labels.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.3'}>{t('Noeud.labels.tooltips.haut')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelVert('vert', 'top')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_vert','top',menu_for_style)
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}>{svg_label_top}</Button>
          </OverlayTrigger>

          {/* au Milieu */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.4'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.4'}>{t('Noeud.labels.tooltips.Milieu_pv')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelVert('vert', 'middle')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_vert','middle',menu_for_style)
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}>{svg_label_center}</Button>
          </OverlayTrigger>

          {/* En bas */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.5'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.5'}>{t('Noeud.labels.tooltips.Bas')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelVert('vert', 'bottom')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_vert','bottom',menu_for_style)
                  delete d.x_label
                  delete d.y_label
                })
                set_data({ ...data })
              }}>{svg_label_bottom}</Button>
          </OverlayTrigger>
        </ButtonGroup>
      </InputGroup>

      {/* Police et taille du texte de label */}
      <InputGroup>
        <InputGroup.Text style={{width:'30%'}} >{'Police'}</InputGroup.Text>

        {/* Gras */}
        <Button
          className='btn_menu_config'
          style={{width:'7.5%'}}
          variant={isAllNodeBold?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
              assign_node_value_to_correct_var(d,'bold',!isAllNodeBold,menu_for_style)
            })
            set_data({ ...data })
          }}><FaBold/></Button>

        {/* en majuscule */}
        <Button
          className='btn_menu_config'
          style={{width:'7.5%'}}
          variant={isAllNodeUpper?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
              assign_node_value_to_correct_var(d,'uppercase',!isAllNodeUpper,menu_for_style)
            })
            set_data({ ...data })
          }}>{svg_label_upper}</Button>

        {/* En italique */}
        <Button
          className='btn_menu_config'
          style={{width:'7.5%'}}
          variant={isAllNodeItalic?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
              assign_node_value_to_correct_var(d,'italic',!isAllNodeItalic,menu_for_style)
            })
            set_data({ ...data })
          }}><FaItalic/></Button>

        <Form.Select
          value={allNodeFF?(return_correct_node_attribute_value(data,selected_parameter[0],'font_family',menu_for_style) as string):''}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'font_family', evt.target.value,menu_for_style))
              set_data({ ...data })
            }}>
          {data.display_style.font_family.map((d) => {
            return <option
              style={{fontFamily:d}}
              key={'ff-' + d}
              value={d}
            >{d}</option>
          })}
        </Form.Select>

        <FormControl
          min={11}
          type={'number'}
          value={allNodeLabelFontSize}
          onChange={evt => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'font_size',+evt.target.value,menu_for_style))
            set_data({ ...data })
          }}
        />
        <InputGroup.Text style={{width:'10%'}}>
          px
        </InputGroup.Text>
      </InputGroup>

      {/* Largeur de la zone de texte du label */}
      <OverlayTrigger
        key={'noeud.labels.tooltips.9'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'noeud.labels.tooltips.9'}>{t('Noeud.labels.tooltips.cl')} </Tooltip>}>
        <InputGroup>
          <InputGroup.Text style={{width:'40%'}}>{t('Noeud.labels.cl')+(is_node_diplaying_value_local(multi_selected_nodes,'label_box_width',menu_for_style)?'*':'')}</InputGroup.Text>
          <FormControl
            value={valueAllNodeLabelBox}
            type={'number'}
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
          <InputGroup.Text style={{width:'10%'}}>
            px
          </InputGroup.Text>
        </InputGroup>
      </OverlayTrigger>
      {advanced_label_content}
    </>:<></>}
  </Form.Group>

  const content_label_value=<Form.Group>
    <OverlayTrigger
      key={'noeud.labels.tooltips.10'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.labels.tooltips.10'}>{t('Noeud.labels.tooltips.vdv')} </Tooltip>}>
      <InputGroup>
        <InputGroup.Text style={{width:'40%'}}>{t('Noeud.labels.vdv')} </InputGroup.Text>

        <Button
          className='btn_menu_config'
          style={{width:'60%'}}
          //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
          variant={isAllNodeTotal?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'show_value',!isAllNodeTotal,menu_for_style))
            set_data({ ...data })
          }}>{isAllNodeTotal?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
      </InputGroup>
    </OverlayTrigger>

    {isAllNodeTotal? <>

      {/* Position de l'affichage des données par rapport au noeud */}
      <InputGroup>
        <InputGroup.Text style={{width:'40%'}}>{'Position'}</InputGroup.Text>
        {/* Horizontale */}
        <ButtonGroup style={{width:'30%'}}>
          {/* A gauche */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.14'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.14'}>{t('Noeud.labels.tooltips.gauche_val')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelValueVert('horiz', 'left')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_horiz_valeur','left',menu_for_style)
                })
                set_data({ ...data })
              }}><FaAlignLeft/></Button>
          </OverlayTrigger>

          {/* Au milieu */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.15'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.15'}>{t('Noeud.labels.tooltips.Milieu_ph_val')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelValueVert('horiz', 'middle')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_horiz_valeur','middle',menu_for_style)
                })
                set_data({ ...data })
              }}><FaAlignCenter/></Button>
          </OverlayTrigger>

          {/* A droite */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.16'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.16'}>{t('Noeud.labels.tooltips.droite_val')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelValueVert('horiz', 'right')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_horiz_valeur','right',menu_for_style)
                })
                set_data({ ...data })
              }}><FaAlignRight/></Button>
          </OverlayTrigger>
        </ButtonGroup>

        {/* Verticale */}
        <ButtonGroup style={{width:'30%'}}>
          {/* en haut */}

          <OverlayTrigger
            key={'noeud.labels.tooltips.11'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.11'}>{t('Noeud.labels.tooltips.haut_val')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelValueVert('vert', 'top')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_vert_valeur','top',menu_for_style)
                })
                set_data({ ...data })
              }}>{svg_label_top}</Button>
          </OverlayTrigger>

          {/* Au milieu */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.12'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.12'}>{t('Noeud.labels.tooltips.Milieu_pv_val')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={isAllNodeLabelValueVert('vert', 'middle')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_vert_valeur','middle',menu_for_style)
                })
                set_data({ ...data })
              }}>{svg_label_center}</Button>
          </OverlayTrigger>

          {/* EN bas */}
          <OverlayTrigger
            key={'noeud.labels.tooltips.13'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.labels.tooltips.13'}>{t('Noeud.labels.tooltips.Bas_val')} </Tooltip>}>
            <Button className='btn_menu_config'
              variant={isAllNodeLabelValueVert('vert', 'bottom')?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  assign_node_value_to_correct_var(d,'label_vert_valeur','bottom',menu_for_style)
                })
                set_data({ ...data })
              }}>{svg_label_bottom}</Button>
          </OverlayTrigger>
        </ButtonGroup>
      </InputGroup>

      {/* Taille de la police du texte de la valeur */}
      <InputGroup>
        <InputGroup.Text style={{width:'40%'}}>{t('Noeud.labels.tp')}</InputGroup.Text>
        <FormControl
          min={11}
          type={'number'}
          value={allNodeValueFontSize}
          onChange={evt => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'value_font_size',+evt.target.value,menu_for_style))
            set_data({ ...data })
          }}
        />
        <InputGroup.Text style={{width:'10%'}}>px</InputGroup.Text>
      </InputGroup>
    </>:<></>}

    {advanced_label_value_content}
  </Form.Group>

  const style_node=!menu_for_style? <InputGroup >
    <InputGroup.Text style={{width:'25%'}}>{t('Noeud.Style')}</InputGroup.Text>
    <Dropdown  >
      <Dropdown.Toggle
        style={{width:'50%'}}
        variant='outline-primary'>{style_of_selected_nodes()}</Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => {
          set_style_to_apply('')
          multi_selected_nodes.current.map(n => {
            n.style = ''
          })
          set_data({ ...data })
        }}>{'Aucun'}</Dropdown.Item>
        {Object.keys(data.style_node).map((d,i) => {
          return (<Dropdown.Item
            key={i}
            onClick={() => {
              set_style_to_apply(d)
              multi_selected_nodes.current.map(n => {
                n.style = d
              })
              set_data({ ...data })
            }}
          >{data.style_node[d].name}</Dropdown.Item>)
        })}
      </Dropdown.Menu>
    </Dropdown>

    <OverlayTrigger
      key={'menu.tooltips.noeud.5'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'menu.tooltips.noeud.5'}>{t('Noeud.tooltips.AS')} </Tooltip>}>
      <Button className='btn_menu_config'
        size="sm"
        variant='outline-primary'
        style={{width:'25%'}}
        onClick={() => {
          apply_style_to_nodes()
          set_data({ ...data })
        }}>
        {t('Noeud.AS')}
      </Button>
    </OverlayTrigger>
  </InputGroup>:<></>

  // Tableau d'elements de sous-menu attribut de noeuds
  return [
    <React.Fragment key={'style_node'}>{style_node}</React.Fragment>,

    <React.Fragment key={'sep_1'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>,
    <h4 style={{fontSize:'14px' ,fontWeight:'bold'}}>{t('Noeud.apparence.apparence')}</h4>,
    <React.Fragment key={'app'}>{content_appearence}</React.Fragment>,

    <React.Fragment key={'sep_2'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>,
    <h4 style={{fontSize:'14px' ,fontWeight:'bold'}}>{t('Noeud.labels.labels')}</h4>,
    <React.Fragment key={'lab'}>{content_label}</React.Fragment>,

    <React.Fragment key={'sep_3'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>,
    <h4 style={{fontSize:'14px' ,fontWeight:'bold'}}>{t('Noeud.labels.node_value')}</h4>,
    <React.Fragment key={'val'}>{content_label_value}</React.Fragment>
  ]
}

export const SankeyMenuConfigurationNodesAttributes = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[],
  for_modal = false
) => {
  //Function that check if all selected nodes have the same value for some parameter
  return for_modal ? <Form >
    {menu_configuration_nodes_attributes.map((c:JSX.Element,i)=>{
      return <React.Fragment key={i}>{c}</React.Fragment>})}
  </Form>:<Tab eventKey="nodes_desc" title={t('Noeud.apparence.apparence')}>
    <Form >
      {menu_configuration_nodes_attributes.map((c:JSX.Element,i)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Form>
  </Tab>}