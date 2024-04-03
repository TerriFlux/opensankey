import { TFunction } from 'i18next'
import React, { useState } from 'react'
import { Form,
  Tab,
  OverlayTrigger,
  Tooltip,
  FormControl,
  Button,
  ButtonGroup,
  Dropdown,
  Col,
  Row,
  InputGroup} from 'react-bootstrap'
import { SankeyNodeAttrLocal } from '../types/Types'
import { ReturnCorrectNodeAttributeValue,
  AssignNodeValueToCorrectVar,
  IsNodeDisplayingValueLocal,
  IsAllNodeAttrSameValue,
  CutName,
  SmoothClasses,
  TooltipValueSurcharge,
  ApplyStyleToNodes} from './SankeyUtils'
import { FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaBold,
  FaItalic,
  FaLock,
  FaLockOpen,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaEye,
  FaEyeSlash} from 'react-icons/fa'
import { Checkbox } from '@chakra-ui/react'
import { OpenSankeyConfigurationNodesAttributesFType } from './types/SankeyMenuConfigurationNodesAttributesTypes'

export const OpenSankeyConfigurationNodesAttributes : OpenSankeyConfigurationNodesAttributesFType = (
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  menu_for_style,
  ref_selected_style_node,
  advanced_appearence_content,
  advanced_label_content,
  advanced_label_value_content,
  link_function,
  ComponentUpdater,
  node_function
) => {
  const { t } = applicationContext
  const { data } = dict_variable_application_data
  const { multi_selected_nodes } = dict_variable_elements_selected
  const [forceUpdate,setForceUpdate]=useState(false)
  const parameter_to_modify=(menu_for_style)?data.style_node:data.nodes
  const selected_parameter=(menu_for_style)?[data.style_node[ref_selected_style_node.current]]:multi_selected_nodes.current
  const {updateComponentMenuConfigNodeAppearence,updateComponentMenuConfigNode}= ComponentUpdater
  const {RedrawNodes}=node_function
  const {RedrawLinks}=link_function
  updateComponentMenuConfigNodeAppearence.current=()=>setForceUpdate(!forceUpdate)
  
  const updateMenuConfigNode=()=>{
    RedrawNodes(multi_selected_nodes.current)
    if(!menu_for_style){
      updateComponentMenuConfigNode.current()
    }
    ComponentUpdater.updateComponenSaveInCache.current(false)
    setForceUpdate(!forceUpdate)
  }
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

  const list_of_key=['shape_visible','colorSustainable','node_width',
    'node_height','label_visible','label_color','label_background','show_value',
    'label_box_width','font_size','value_font_size','font_family','bold','uppercase',
    'italic','label_vert','label_horiz','label_vert_valeur','label_horiz_valeur','shape','node_arrow_angle_factor','node_arrow_angle_direction'] as (keyof SankeyNodeAttrLocal)[]

  const list_value=IsAllNodeAttrSameValue(data,selected_parameter,list_of_key,menu_for_style)

  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? CutName(data.style_node[style_to_display].name,20 ) : 'Multiple style parmi les noeuds sélectionnés'
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  // Check if the 1st selected node has a tag selected from the group tag 'Type de noeud' so we can disable the selection of the node shape
  const content_appearence=<Form.Group>
    {/* Visibilite du noeud */}

    <Row className='input_row' key={'node_visibility'} >
      <Col>
        <Checkbox 
          sx={SmoothClasses({text_as_title:true})}
          icon={(list_value['shape_visible'][0] as boolean)?<FaEye/>:<FaEyeSlash/>}
          iconColor={list_value['shape_visible'][1]?'#78C2AD':'white'}
          isIndeterminate={list_value['shape_visible'][1]}
          isChecked={list_value['shape_visible'][0] as boolean}
          onChange={(evt) => {
            Object.values(parameter_to_modify)
              .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
              .forEach(d => AssignNodeValueToCorrectVar(d,'shape_visible',evt.target.checked,menu_for_style))
            updateMenuConfigNode()
            
          }}>
          <OverlayTrigger
            key={'noeud.apparence.tooltips.1'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.apparence.tooltips.1'}>{t('Noeud.apparence.tooltips.Visibilité')} </Tooltip>}>
            <> {t('Noeud.apparence.Visibilité')}
              {(IsNodeDisplayingValueLocal(multi_selected_nodes,'shape_visible',menu_for_style)?TooltipValueSurcharge('node_var',t):<></>)}
            </>
          </OverlayTrigger>
        </Checkbox>
      </Col>
    </Row>
      
    {/* In this position of the array, there is an input who can change the node visibility (hide if intermediary)(dev) */}
    {advanced_appearence_content.splice(1,1)}

    <Row>
      <span className='title_grp_attributes'>{t('Menu.edition')}</span>
    </Row>

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
      <Row className='input_row'>
        <Col>
          <Form.Label
          >
            {t('Noeud.apparence.Couleur')}{(IsNodeDisplayingValueLocal(multi_selected_nodes,'color',menu_for_style)?<>{TooltipValueSurcharge('node_var_',t)}</>:<></>)}
          </Form.Label>
        </Col>

        <Col>
          {(getBrowserName()==='Firefox')?<Form.Control
            type='color'
            id='form_color_node'
            className='btn_menu_config'
            value={(selected_parameter.length == 1) ? (ReturnCorrectNodeAttributeValue(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'color',evt.target.value,menu_for_style))
              updateMenuConfigNode()
              if(!menu_for_style){
                // Redraw link attached to modified node that are 'produit' because we specified a user case where 'produit' nodes control link color 
                let link_to_update:string[]=[]
                multi_selected_nodes.current.filter(n=>n.tags&&n.tags['Type de noeud'] && n.tags['Type de noeud'].includes('produit')).forEach(n=>{
                  link_to_update=link_to_update.concat(n.outputLinksId)
                  link_to_update=link_to_update.concat(n.inputLinksId)
                })
                link_to_update=[...new Set(link_to_update)]
                const list_links=link_to_update.map(lid=>data.links[lid])
                RedrawLinks(list_links)
              }else{
                RedrawLinks(Object.values(dict_variable_application_data.display_links))
              }
            }}
          />:<Form.Control
            type='color'
            id='form_color_node'
            className='btn_menu_config'
            name='form_color_node'
            value={(selected_parameter.length == 1) ? (ReturnCorrectNodeAttributeValue(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'color',evt.target.value,menu_for_style))
            }}
            onBlurCapture={()=>{
              updateMenuConfigNode()
              if(!menu_for_style){
                // Redraw link attached to modified node that are 'produit' because we specified a user case where 'produit' nodes control link color 
                let link_to_update:string[]=[]
                multi_selected_nodes.current.filter(n=>n.tags&&n.tags['Type de noeud'] && n.tags['Type de noeud'].includes('produit')).forEach(n=>{
                  link_to_update=link_to_update.concat(n.outputLinksId)
                  link_to_update=link_to_update.concat(n.inputLinksId)
                })
                link_to_update=[...new Set(link_to_update)]
                const list_links=link_to_update.map(lid=>data.links[lid])
                RedrawLinks(list_links)
              }else{
                RedrawLinks(Object.values(dict_variable_application_data.display_links))
              }
            }}
          />}</Col>
        <Col>
          <OverlayTrigger
            key={'noeud.apparence.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'noeud.apparence.tooltips.3'}>{t('Noeud.apparence.tooltips.CouleurPérenne')} </Tooltip>}>
            <Button
              //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
              variant={list_value['colorSustainable'][0]?'primary':'outline-primary'}
              className='btn_menu_config'
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'colorSustainable',!list_value['colorSustainable'][0],menu_for_style))
                updateMenuConfigNode()
                updateMenuConfigNode()
                
              }}>{list_value['colorSustainable'][0]?<FaLock/>:<FaLockOpen/>}</Button>
          </OverlayTrigger>
        </Col>
      </Row>
    </OverlayTrigger>

    {/* Forme du noeud */}
    <OverlayTrigger
      key={'noeud.apparence.tooltips.4'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.apparence.tooltips.4'}>{t('Noeud.apparence.tooltips.Forme')} </Tooltip>}>

      <Row className='input_row'>
        <Col>
          <Form.Label>
            {t('Noeud.apparence.Forme')}{(IsNodeDisplayingValueLocal(multi_selected_nodes,'shape',menu_for_style)?<>{TooltipValueSurcharge('node_var_',t)}</>:<></>)}
          </Form.Label>
        </Col>
        <Col>
          <ButtonGroup 
            className='btn_menu_config'>
            <Button 
              value="ellipse"
              variant={list_value['shape'][0]==='ellipse'?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'shape','ellipse',menu_for_style))
                updateMenuConfigNode()
                
              }}>{t('Noeud.apparence.Cercle')}</Button>

            <Button 
              variant={list_value['shape'][0]==='rect'?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'shape','rect',menu_for_style))
                updateMenuConfigNode()
                
              }}>{t('Noeud.apparence.Rectangle')}</Button>

            <Button 
              variant={list_value['shape'][0]==='arrow'?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'shape','arrow',menu_for_style))
                updateMenuConfigNode()
                
              }}>{t('Noeud.apparence.arrow')}</Button>  
          </ButtonGroup>

        </Col>
      </Row>
    </OverlayTrigger>

    { /* Change the angle of the arrow shaped node */ 
      list_value['shape'][0]==='arrow'?<>
        <OverlayTrigger
          key={'noeud.apparence.tooltips.arrow_angle'}
        
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'noeud.apparence.tooltips.arrow_angle'}>{t('Noeud.apparence.tooltips.arrow_angle')} </Tooltip>}>
          <Row className='input_row'>
            <Col><Form.Label >{t('Noeud.apparence.arrow_angle')}{(IsNodeDisplayingValueLocal(multi_selected_nodes,'node_arrow_angle_factor',menu_for_style)?<>{TooltipValueSurcharge('node_var_',t)}</>:<></>)}</Form.Label></Col>
            <Col xs={5}>
              <Form.Range min={5} 
                max={45}
                step={5}
                value={list_value['node_arrow_angle_factor'][0] as number}
                onChange={(evt)=>{
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_factor',+evt.target.value,menu_for_style))
                  updateMenuConfigNode()
                          
                }}

              /></Col>
            <Col xs={1}><Form.Label>{list_value['node_arrow_angle_factor'][0]}°</Form.Label></Col>
          </Row>
        </OverlayTrigger>

        <Row >
          <Col>
            <Form.Label>
              {t('Noeud.apparence.angle_orientation')}
            </Form.Label>
          </Col>
          <Col>
            <ButtonGroup>
              <Button
                className='btn_menu_config'
                variant={list_value['node_arrow_angle_direction'][0]==='left'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','left',menu_for_style))
                  updateMenuConfigNode()
                  
                }}
              ><FaArrowLeft/></Button>

              <Button
                className='btn_menu_config'                variant={list_value['node_arrow_angle_direction'][0]==='right'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','right',menu_for_style))
                  updateMenuConfigNode()
                  
                }}
              ><FaArrowRight/></Button>

              <Button
                className='btn_menu_config'        
                variant={list_value['node_arrow_angle_direction'][0]==='top'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','top',menu_for_style))
                  updateMenuConfigNode()
                  
                }}
              ><FaArrowUp/></Button>

              <Button
                className='btn_menu_config'        
                variant={list_value['node_arrow_angle_direction'][0]==='bottom'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','bottom',menu_for_style))
                  updateMenuConfigNode()
                  
                }}
              ><FaArrowDown/></Button>
            </ButtonGroup>
          </Col>
        </Row>
      
      
      </>:<></>
    }

    <Row>
      <span className='title_grp_attributes'>{t('Noeud.size')}</span>
    </Row>

    {/* Largeur minimale du noeud */}
    <OverlayTrigger
      key={'noeud.apparence.tooltips.6'}
      placement={'top'}
      delay={500}
      rootClose
      overlay={<Tooltip id={'noeud.apparence.tooltips.6'}>{t('Noeud.apparence.tooltips.TML')} </Tooltip>}>
      <Row className='input_row'>
        <Col><Form.Label >
          {t('Noeud.apparence.TML')}
        </Form.Label>
        </Col>

        <Col xs={5}>
          <FormControl
            min={0}
            step={1}
            type={'number'}
            className='btn_menu_config'
            value={list_value['node_width'][0] as number}
            onChange={
              evt => {
                const val=evt.target.value
                let value=40
                if(!isNaN(+val)){
                  value=Math.abs(Math.round(+val))
                }
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'node_width',value,menu_for_style))
                updateMenuConfigNode()

                if(!menu_for_style){
                  // Redraw link attached to modified node when the modification to the node 
                  // modify links path
                  let link_to_update:string[]=[]
                  multi_selected_nodes.current.forEach(n=>{
                    link_to_update=link_to_update.concat(n.outputLinksId)
                    link_to_update=link_to_update.concat(n.inputLinksId)
                  })
                  link_to_update=[...new Set(link_to_update)]
                  const list_links=link_to_update.map(lid=>data.links[lid])
                  RedrawLinks(list_links)
                }else{
                  RedrawLinks(Object.values(dict_variable_application_data.display_links))
                }
                
              }}/>
        </Col>

        <Col xs={1}>
          <Form.Label>
            px
          </Form.Label>
        </Col>
      </Row>
    </OverlayTrigger>

    {/* Hauteur minimale du noeud */}
    <OverlayTrigger
      key={'noeud.apparence.tooltips.7'}
      placement={'top'}
      delay={500}
      rootClose
      overlay={<Tooltip id={'noeud.apparence.tooltips.7'}>{t('Noeud.apparence.tooltips.TMH')} </Tooltip>}>
      <Row className='input_row'>
        <Col><Form.Label>
          {t('Noeud.apparence.TMH')}
        </Form.Label>
        </Col>
        <Col xs={5}>
          <FormControl
            min={0} 
            type={'number'}
            className='btn_menu_config'
            value={list_value['node_height'][0] as number}
            onChange={
              evt => {
                const val=evt.target.value
                let value=40
                if(!isNaN(+val)){
                  value=Math.abs(Math.round(+val))
                }
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'node_height',value,menu_for_style))
                updateMenuConfigNode()
                if(!menu_for_style){
                  // Redraw link attached to modified node when the modification to the node 
                  // modify links path
                  let link_to_update:string[]=[]
                  multi_selected_nodes.current.forEach(n=>{
                    link_to_update=link_to_update.concat(n.outputLinksId)
                    link_to_update=link_to_update.concat(n.inputLinksId)
                  })
                  link_to_update=[...new Set(link_to_update)]
                  const list_links=link_to_update.map(lid=>data.links[lid])
                  RedrawLinks(list_links)
                }else{
                  RedrawLinks(Object.values(dict_variable_application_data.display_links))

                }
              }}/>
        </Col>

        <Col xs={1}>
          <Form.Label>
            px
          </Form.Label>
        </Col>
      </Row>
    </OverlayTrigger>
    {advanced_appearence_content}
  </Form.Group>

  const svg_label_top=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_bottom=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_center=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z"/></svg>
  const svg_label_upper=<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z"/><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z"/></g></svg>

  const content_label= <>{/* Checkbox visibilité noeud */}
    <OverlayTrigger
      key={'noeud.labels.tooltips.1'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.labels.tooltips.1'}>{t('Noeud.labels.tooltips.vdb')} </Tooltip>}>
      <Row className='input_row'>
        <Col><Checkbox 
          sx={SmoothClasses({text_as_title:true})}
          icon={(list_value['label_visible'][0] as boolean)?<FaEye/>:<FaEyeSlash/>}
          iconColor={list_value['label_visible'][1]?'#78C2AD':'white'}
          isIndeterminate={list_value['label_visible'][1]}
          isChecked={list_value['label_visible'][0] as boolean}
          onChange={(evt) => {
            Object.values(parameter_to_modify)
              .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
              .forEach(d => AssignNodeValueToCorrectVar(d,'label_visible',evt.target.checked,menu_for_style))
            updateMenuConfigNode()
            
          }}>
          {t('Noeud.labels.vdb')}
          {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_visible',menu_for_style)?TooltipValueSurcharge('node_var',t):<></>)}
        </Checkbox>
        </Col>
      </Row>
    </OverlayTrigger>
    {list_value['label_visible'][0] as boolean?<Form.Group>
      <Row>
        <span className='title_grp_attributes'>{t('Menu.edition')}</span>
      </Row>
      <span style={{fontSize:'14px' ,fontStyle:'italic'}}>{t('Noeud.text')}</span>
      {/* Label en blanc ou noir */}
      <OverlayTrigger
        key={'noeud.labels.tooltips.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'noeud.labels.tooltips.2'}>{t('Noeud.labels.tooltips.lb')} </Tooltip>}>
        <Row className='input_row'>
          <Col>
            <Checkbox 
              sx={SmoothClasses({})}
              iconColor={list_value['label_color'][1]?'#78C2AD':'white'}
              isIndeterminate={list_value['label_color'][1]}
              isChecked={list_value['label_color'][0] as boolean}
              onChange={(evt) => {
                Object.values(parameter_to_modify)
                  .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                  .forEach(d => AssignNodeValueToCorrectVar(d,'label_color',evt.target.checked,menu_for_style))
                updateMenuConfigNode()
                
              }}>
              {t('Noeud.labels.lb')}
              {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_color',menu_for_style)?TooltipValueSurcharge('node_var',t):<></>)}
            </Checkbox>
          </Col>

        </Row>
      </OverlayTrigger>

      <span style={{fontSize:'14px' ,fontStyle:'italic'}}>Police</span>

      {/* Police et taille du texte de label */}
      <Row>
        <InputGroup as={Col} className='input_row'>
          <ButtonGroup style={{width:'33%'}} >
            {/* Gras */}
            <Button
              style={{'borderRadius':'5px 0px 0px 5px'}}
              variant={list_value['bold'][0]?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  AssignNodeValueToCorrectVar(d,'bold',!list_value['bold'][0],menu_for_style)
                })
                updateMenuConfigNode()
                
              }}><FaBold/></Button>

            {/* en majuscule */}
            <Button
              variant={list_value['uppercase'][0]?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  AssignNodeValueToCorrectVar(d,'uppercase',!list_value['uppercase'][0],menu_for_style)
                })
                updateMenuConfigNode()
                
              }}>{svg_label_upper}</Button>

            {/* En italique */}
            <Button
              variant={list_value['italic'][0]?'primary':'outline-primary'}
              onClick={() => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                  AssignNodeValueToCorrectVar(d,'italic',!list_value['italic'][0],menu_for_style)
                })
                updateMenuConfigNode()
                
              }}><FaItalic/></Button>
          </ButtonGroup>
          <Form.Select
            value={list_value['font_family'][0]?(ReturnCorrectNodeAttributeValue(data,selected_parameter[0],'font_family',menu_for_style) as string):''}
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'font_family', evt.target.value,menu_for_style))
                updateMenuConfigNode()
                
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
            value={list_value['font_size'][0] as number}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'font_size',+evt.target.value,menu_for_style))
              updateMenuConfigNode()
              
            }}
          />
          <InputGroup.Text>px</InputGroup.Text>
        </InputGroup>
      </Row>

      {/* Ajout fond coloré pour meilleur visibilité si label sur flux */}
      <OverlayTrigger
        key={'noeud.labels.tooltips.l_bg'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'noeud.labels.tooltips.l_bg'}>{t('Noeud.labels.tooltips.l_bg')} </Tooltip>}>
        <Row className='input_row'>
          <Col>
            <Checkbox 
              sx={SmoothClasses({})}
              iconColor={list_value['label_background'][1]?'#78C2AD':'white'}
              isIndeterminate={list_value['label_background'][1]}
              isChecked={list_value['label_background'][0] as boolean}
              onChange={(evt) => {
                Object.values(parameter_to_modify)
                  .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                  .forEach(d => AssignNodeValueToCorrectVar(d,'label_background',evt.target.checked,menu_for_style))
                updateMenuConfigNode()
                
              }}>
              {t('Noeud.labels.l_bg')}
              {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_background',menu_for_style)?TooltipValueSurcharge('node_var',t):<></>)}
            </Checkbox>
          </Col>
        </Row>
      </OverlayTrigger>

      <Row>
        <span className='title_grp_attributes'>{t('MEP.leg_pos')}</span>
      </Row>
      
      {/* Largeur de la zone de texte du label */}
      <OverlayTrigger
        key={'noeud.labels.tooltips.9'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'noeud.labels.tooltips.9'}>{t('Noeud.labels.tooltips.cl')} </Tooltip>}>
        <Row className='input_row'>
          <Col>
            <Form.Label>{t('Menu.larg')}{(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_box_width',menu_for_style)?<>{TooltipValueSurcharge('node_var_',t)}</>:<></>)}</Form.Label>
          </Col>
          <Col xs={5}>
            <FormControl
              className='btn_menu_config'
              value={list_value['label_box_width'][0] as (string | number)}
              type={'number'}
              placeholder={'110'}
              min={0}
              max={500}
              onChange={evt => {
                if (!isNaN(+evt.target.value)) {
                  const val = (+evt.target.value < 0) ? 0 : +evt.target.value
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'label_box_width',val,menu_for_style))
                  updateMenuConfigNode()
                  
                }
              }}/>
          </Col>
          <Col xs={1}>
            <Form.Label >
            px
            </Form.Label>
          </Col>
        </Row>
      </OverlayTrigger>
      
      {/* Position  du label par rapport au noeud */}
      <Row className='input_row'>
        <Col>
          <Form.Label >{'Position'}</Form.Label>
        </Col>

        {/* Position horizontale */}
        <Col>
          <ButtonGroup style={{width:'50%'}}>
            {/* A gauche  */}
            <OverlayTrigger
              key={'noeud.labels.tooltips.6'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'noeud.labels.tooltips.6'}>{t('Noeud.labels.tooltips.gauche')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={list_value['label_horiz'][0]=== 'left'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_horiz','left',menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_horiz'][0]=== 'middle'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_horiz','middle',menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_horiz'][0]==='right'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_horiz','right',menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  })
                  updateMenuConfigNode()
                  
                }}><FaAlignRight/></Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Position verticale */}
          <ButtonGroup style={{width:'50%'}}>
            {/* En haut */}
            <OverlayTrigger
              key={'noeud.labels.tooltips.3'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'noeud.labels.tooltips.3'}>{t('Noeud.labels.tooltips.haut')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={list_value['label_vert'][0]==='top'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_vert','top',menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_vert'][0]==='middle'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_vert','middle',menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_vert'][0]==='bottom'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_vert','bottom',menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  })
                  updateMenuConfigNode()
                  
                }}>{svg_label_bottom}</Button>
            </OverlayTrigger>
          </ButtonGroup></Col>
      
      </Row>

      {advanced_label_content}
    
    </Form.Group>:<></>}</>

  const content_label_value=<><OverlayTrigger
    key={'noeud.labels.tooltips.10'}
    placement={'top'}
    delay={500}
    overlay={<Tooltip id={'noeud.labels.tooltips.10'}>{t('Noeud.labels.tooltips.vdv')} </Tooltip>}>
    <Row className='input_row'>
      <Col>
        <Checkbox 
          sx={SmoothClasses({text_as_title:true})}
          icon={(list_value['show_value'][0] as boolean)?<FaEye/>:<FaEyeSlash/>}
          iconColor={list_value['show_value'][1]?'#78C2AD':'white'}
          isIndeterminate={list_value['show_value'][1]}
          isChecked={list_value['show_value'][0] as boolean}
          onChange={(evt) => {
            Object.values(parameter_to_modify)
              .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
              .forEach(d => AssignNodeValueToCorrectVar(d,'show_value',evt.target.checked,menu_for_style))
            updateMenuConfigNode()
            
          }}>
          {t('Noeud.labels.vdv')}
          {(IsNodeDisplayingValueLocal(multi_selected_nodes,'show_value',menu_for_style)?TooltipValueSurcharge('node_var',t):<></>)}
        </Checkbox>
      </Col>
    </Row>
  </OverlayTrigger>
  {list_value['show_value'][0] as boolean?
    <Form.Group>
      <Row>
        <span className='title_grp_attributes'>{t('Menu.edition')}</span>
      </Row>
      
      {/* Taille de la police du texte de la valeur */}
      <Row className='input_row'>
        <Col>
          <Form.Label>Police</Form.Label>
        </Col>
        <Col xs={5}>
          <FormControl
            min={11}
            type={'number'}
            value={list_value['value_font_size'][0] as number}
            onChange={evt => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'value_font_size',+evt.target.value,menu_for_style))
              updateMenuConfigNode()
              
            }}
          />
        </Col>
        <Col xs={1}>
          <Form.Label style={{width:'10%'}}>px</Form.Label>
        </Col>
      </Row>

      <Row>
        <span className='title_grp_attributes'>Position</span>
      </Row>
      {/* Position de l'affichage des données par rapport au noeud */}
      <Row className='input_row'>
        <Col><Form.Label >{'Position'}</Form.Label></Col>
        <Col>
          {/* Horizontale */}
          <ButtonGroup style={{width:'50%'}}>
            {/* A gauche */}
            <OverlayTrigger
              key={'noeud.labels.tooltips.14'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'noeud.labels.tooltips.14'}>{t('Noeud.labels.tooltips.gauche_val')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={list_value['label_horiz_valeur'][0]==='left'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_horiz_valeur','left',menu_for_style)
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_horiz_valeur'][0]==='middle'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_horiz_valeur','middle',menu_for_style)
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_horiz_valeur'][0]==='right'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_horiz_valeur','right',menu_for_style)
                  })
                  updateMenuConfigNode()
                  
                }}><FaAlignRight/></Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Verticale */}
          <ButtonGroup style={{width:'50%'}}>
            {/* en haut */}

            <OverlayTrigger
              key={'noeud.labels.tooltips.11'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'noeud.labels.tooltips.11'}>{t('Noeud.labels.tooltips.haut_val')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={list_value['label_vert_valeur'][0]==='top'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_vert_valeur','top',menu_for_style)
                  })
                  updateMenuConfigNode()
                  
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
                variant={list_value['label_vert_valeur'][0]==='middle'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_vert_valeur','middle',menu_for_style)
                  })
                  updateMenuConfigNode()
                  
                }}>{svg_label_center}</Button>
            </OverlayTrigger>

            {/* EN bas */}
            <OverlayTrigger
              key={'noeud.labels.tooltips.13'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'noeud.labels.tooltips.13'}>{t('Noeud.labels.tooltips.Bas_val')} </Tooltip>}>
              <Button className='btn_menu_config'
                variant={list_value['label_vert_valeur'][0]==='bottom'?'primary':'outline-primary'}
                onClick={() => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => {
                    AssignNodeValueToCorrectVar(d,'label_vert_valeur','bottom',menu_for_style)
                  })
                  updateMenuConfigNode()
                  
                }}>{svg_label_bottom}</Button>
            </OverlayTrigger>
          </ButtonGroup>
        </Col>
      </Row>

    
    

      {advanced_label_value_content}
    </Form.Group>:<></>}</>

  const style_node=!menu_for_style? <Row className='input_row'>
    <Col xs={2}>
      <Form.Label>{t('Noeud.Style')}</Form.Label></Col>
    <Col>
      <Dropdown>
        <Dropdown.Toggle
          className='btn_menu_config'
          variant='outline-primary'>{style_of_selected_nodes()}</Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.keys(data.style_node).map((d,i) => {
            return (<Dropdown.Item
              key={i}
              onClick={() => {
                ref_selected_style_node.current = d
                multi_selected_nodes.current.map(n => {
                  n.style = d
                })
                ApplyStyleToNodes(multi_selected_nodes,node_function)
                ComponentUpdater.updateComponenSaveInCache.current(false)
                
              }}
            >{data.style_node[d].name}</Dropdown.Item>)
          })}
        </Dropdown.Menu>
      </Dropdown>
    </Col>
    <Col>
      <OverlayTrigger
        key={'menu.tooltips.noeud.5'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.5'}>{t('Noeud.tooltips.AS')} </Tooltip>}>
        <Button 
          className='btn_menu_config'
          variant='outline-primary'
         
          onClick={() => {
            ApplyStyleToNodes(multi_selected_nodes,node_function)
            ComponentUpdater.updateComponenSaveInCache.current(false)

          }}>
          {t('Noeud.AS')}
        </Button>
      </OverlayTrigger></Col>
  </Row>:<></>

  // Tableau d'elements de sous-menu attribut de noeuds
  return [
    <React.Fragment key={'style_node'}>{style_node}</React.Fragment>,

    <React.Fragment key={'sep_1'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>,
    <React.Fragment key={'app'}>{content_appearence}</React.Fragment>,

    <React.Fragment key={'sep_2'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>,
    <React.Fragment key={'lab'}>{content_label}</React.Fragment>,

    <React.Fragment key={'sep_3'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>,
    <React.Fragment key={'val'}>{content_label_value}</React.Fragment>
  ]
}

export const SankeyMenuConfigurationNodesAttributes = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[],
  for_modal = false
) => {
  //Function that check if all selected nodes have the same value for some parameter
  return for_modal ? <Form className='content_editon_elements' >
    {menu_configuration_nodes_attributes.map((c:JSX.Element,i)=>{
      return <React.Fragment key={i}>{c}</React.Fragment>})}
  </Form>:<Tab key='nodes_desc' className='content_editon_elements' eventKey="nodes_desc" title={t('Noeud.apparence.apparence')}>
    <Form >
      {menu_configuration_nodes_attributes.map((c:JSX.Element,i)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Form>
  </Tab>}