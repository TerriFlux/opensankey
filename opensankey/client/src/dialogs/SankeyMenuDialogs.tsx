/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent, useState,  } from 'react'

import { Form, FormLabel, Row, Col, Modal, Button, InputGroup, Tabs,Tab,OverlayTrigger,Tooltip,FormControl} from 'react-bootstrap'
import { SankeyData, SankeyLink, dict_hook_ref_setter_show_dialog_componentsType, } from '../types/Types'
import { complete_sankey_data } from '../configmenus/SankeyConvert'
import { DefaultLink, DefaultNode, SmoothClasses } from '../configmenus/SankeyUtils'
import { NodeVisibleOnsSvg,LinkVisibleOnSvg } from '../draw/SankeyDrawFunction'
import { arrangeNodes, ComputeAutoSankey } from '../draw/SankeyDrawLayout'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'
import { FaCheck } from 'react-icons/fa'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TFunction } from 'i18next'
import { Checkbox } from '@chakra-ui/react'
import { UploadExcelImplFuncType } from './types/SankeyPersistenceTypes'
import { ClickSaveDiagramFuncType } from './types/SankeyPersistenceTypes'
import { ApplyLayoutDialogTypes, OpenSankeyDiagramSelectorFType } from './types/SankeyMenuDialogsTypes'



/**
 *
 * @param {ApplyLayoutDialogTypes} { ref_setter_show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog = ({ 
  t,dict_hook_ref_setter_show_dialog_components, sankey_data, set_sankey_data,
  updateLayout,convert_data,
  diagramSelector,
  elementToDispose,
  apply_transformation_additional_elements,
  DefaultSankeyData
}: ApplyLayoutDialogTypes) => {
  const [prev_sankey_data,set_prev_sankey_data] = useState(sankey_data)
  const [forceUpdate,setForceUpdate] = useState(true)
  const [stretchFactorH,set_stretchFactorH]=useState(1)
  const [stretchFactorV,set_stretchFactorV]=useState(1)
  const [mode_trans,set_mode_trans]=useState('simple')
  const [node_hspace,set_node_hspace] = useState(sankey_data.h_space)
  const [node_vspace,set_node_vspace] = useState(sankey_data.v_space)
  if ( node_hspace !== sankey_data.h_space) {
    set_node_hspace(sankey_data.h_space)
  }
  if ( node_vspace !== sankey_data.v_space) {
    set_node_vspace(sankey_data.v_space)
  }
  const node_visible=NodeVisibleOnsSvg()
  const all_element_to_transform = [
    'addNode', 'addFlux', 'removeNode', 'removeFlux',
    'posNode', 'posFlux', 
    'Values', 
    'attrNode', 'attrFlux', 
    'tagNode', 'tagFlux', 'tagData', 'tagLevel',
    'attrGeneral'
  ]
  const advanced_element_to_transform = [
    'addNode', 'addFlux', 'removeNode', 'removeFlux',
    'posNode', 'posFlux', 
    'Values', 
    'attrNode', 'attrFlux', 
    'attrGeneral'
  ]
  const simple_element_to_transform = [
    'posNode', 'posFlux', 
    'attrNode', 'attrFlux', 
    'attrGeneral'
  ]
  const default_element_to_transform = [
    'posNode', 'posFlux',  
    'attrNode', 'attrFlux',
    'attrGeneral'
  ]

  const applyStretch=(param:string)=>{
    const attr=param=='h'?'x':'y'
    const stretchFactor=param=='h'?stretchFactorH:stretchFactorV
    let min=Object.values(sankey_data.nodes)[0][attr]
    // Cheche la position en y du noeud le plus en haut à gauche
    Object.values(sankey_data.nodes).filter(n=>node_visible.includes(n.idNode) && n.position!='relative').forEach(n=>{
      min=(n[attr]<min)?n[attr]:min
    })

    // Parcours les noeuds --> calcule le delta des position en y entre ceux-ci --> multiplie le delta par le facteur du input -->
    // applique le delta mutiplié par le facteur au noeud
    Object.values(sankey_data.nodes).filter(n=>node_visible.includes(n.idNode) && n.position!='relative').forEach(n=>{
      const delta=n[attr]-min
      n[attr]=min+(delta*stretchFactor)
    })
    set_sankey_data({...sankey_data})
  }
  const content_modal_layout=  <Tabs defaultActiveKey={'import'} >

    <Tab key='import' eventKey='import' title={t('Menu.Transformation.amp_import')} style={{marginBottom:'10px'}}>

      <InputGroup>
        <InputGroup.Text style={{width:'50%'}}>{t('Menu.choseTransforDifficulty')}</InputGroup.Text>
        <Button variant={mode_trans=='simple'?'primary':'outline-primary'} style={{width:50/3+'%'}} onClick={()=>{set_mode_trans('simple')}}>Simple</Button>
        <Button variant={mode_trans=='avancé'?'warning':'outline-warning'} style={{width:50/3+'%'}} onClick={()=>{set_mode_trans('avancé')}}>{t('Avancé')}</Button>
        <Button variant={mode_trans=='expert'?'danger':'outline-danger'} style={{width:50/3+'%'}} onClick={()=>{set_mode_trans('expert')}}>Expert</Button>
      </InputGroup>
      

      {diagramSelector(
        t, convert_data, sankey_data,set_sankey_data, prev_sankey_data, set_prev_sankey_data, 
        updateLayout, elementToDispose,DefaultSankeyData
      )}
      <OverlayTrigger
        key={'TransforShortCut'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransforShortCut'}>{t('Menu.Transformation.tooltips.Shortcuts')} </Tooltip>}
      >
        <InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Shortcuts')}</InputGroup.Text>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant='outline-primary' 
            onClick={() => {
              elementToDispose.current.length = 0
              setForceUpdate(!forceUpdate)
            }}
          >{t('Menu.Transformation.unSelectAll')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant='outline-primary' 
            onClick={() => {
              elementToDispose.current.length = 0
              if(mode_trans==='simple'){
                simple_element_to_transform.forEach(el=>elementToDispose.current.push(el))
              }else if(mode_trans==='avancé'){
                advanced_element_to_transform.forEach(el=>elementToDispose.current.push(el))
              }else{
                all_element_to_transform.forEach(el=>elementToDispose.current.push(el))
              }
              setForceUpdate(!forceUpdate)
            }}
          >{t('Menu.Transformation.selectAll')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant='outline-primary' 
            onClick={() => {
              elementToDispose.current.length = 0
              default_element_to_transform.forEach(el=>elementToDispose.current.push(el))
              setForceUpdate(!forceUpdate)
            }}
          >{t('Menu.Transformation.selectDefault')}</Button>
        
        </InputGroup>  
      </OverlayTrigger>

      {mode_trans!='simple'?
        <OverlayTrigger
          key={'TransforTopology'}
          placement={'bottom'}
          delay={500}
          overlay={<Tooltip id={'TransforTopology'}>{t('Menu.Transformation.tooltips.Topology')} </Tooltip>}
        ><InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Topology')}</InputGroup.Text>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.current.includes('addNode')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.current.includes('addNode')){
                  elementToDispose.current.push('addNode')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.current.splice(elementToDispose.current.indexOf('addNode'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }
            >{t('Menu.Transformation.addNode')}</Button>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.current.includes('removeNode')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.current.includes('removeNode')){
                  elementToDispose.current.push('removeNode')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.current.splice(elementToDispose.current.indexOf('removeNode'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }
            >{t('Menu.Transformation.removeNode')}</Button>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.current.includes('addFlux')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.current.includes('addFlux')){
                  elementToDispose.current.push('addFlux')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.current.splice(elementToDispose.current.indexOf('addFlux'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }>{t('Menu.Transformation.addFlux')}</Button>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.current.includes('removeFlux')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.current.includes('removeFlux')){
                  elementToDispose.current.push('removeFlux')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.current.splice(elementToDispose.current.indexOf('removeFlux'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }>{t('Menu.Transformation.removeFlux')}</Button>
        
          </InputGroup></OverlayTrigger>:<></>}

      {/* Taille et pos des noeud/flux */}
      <OverlayTrigger
        key={'TransforGeometry'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransforGeometry'}>{t('Menu.Transformation.tooltips.Geometry')} </Tooltip>}
      >
        <InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Geometry')}</InputGroup.Text>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={ elementToDispose.current.includes('posNode')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.current.includes('posNode')){
                elementToDispose.current.push('posNode')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('posNode'),1)
                setForceUpdate(!forceUpdate)
              }}
            }>{t('Menu.Transformation.PosNoeud')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={ elementToDispose.current.includes('posFlux')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.current.includes('posFlux')){
                elementToDispose.current.push('posFlux')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('posFlux'),1)
                setForceUpdate(!forceUpdate)
              }}
            }> {t('Menu.Transformation.posFlux')}</Button>
        
        </InputGroup></OverlayTrigger>
      
      {/* Valeur des flux */}
      {mode_trans!='simple'?<OverlayTrigger
        key={'TransforValues'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransforValues'}>{t('Menu.Transformation.tooltips.Values')} </Tooltip>}
      ><InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Values')}</InputGroup.Text>
          <Button 
            className='btn_menu_config' 
            style={{width:'20%'}}
            variant={ elementToDispose.current.includes('Values')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.current.includes('Values')){
                elementToDispose.current.push('Values')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('Values'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{elementToDispose.current.includes('Values')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        
        </InputGroup></OverlayTrigger>:<></>}
      
      <OverlayTrigger
        key={'TransforAttribut'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransforAttribut'}>{t('Menu.Transformation.tooltips.Attribut')} </Tooltip>}
      ><InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Attribut')}</InputGroup.Text>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('attrNode')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.current.includes('attrNode')){
                elementToDispose.current.push('attrNode')
                setForceUpdate(!forceUpdate)

              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('attrNode'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{t('Menu.Transformation.attrNode')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('attrFlux')?'primary':'outline-primary'} 
            onClick={() =>{
              if(!elementToDispose.current.includes('attrFlux')){
                elementToDispose.current.push('attrFlux')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('attrFlux'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{t('Menu.Transformation.attrFlux')}</Button>
        
        </InputGroup></OverlayTrigger>

      {/* Etiquette */}
      {mode_trans=='expert'?<OverlayTrigger
        key={'TransforTags'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransforTags'}>{t('Menu.Transformation.tooltips.Tags')} </Tooltip>}
      ><InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.Tags')}</InputGroup.Text>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('tagNode')?'primary':'outline-primary'} 
            onClick={() =>{
              if(!elementToDispose.current.includes('tagNode')){
                elementToDispose.current.push('tagNode')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('tagNode'),1)
                setForceUpdate(!forceUpdate)

              }}
            }
          >{t('Menu.Transformation.tagNode')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('tagFlux')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.current.includes('tagFlux')){
                elementToDispose.current.push('tagFlux')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('tagFlux'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{t('Menu.Transformation.tagFlux')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('tagData')?'primary':'outline-primary'}
            onClick={() => {
              if(!elementToDispose.current.includes('tagData')){
                elementToDispose.current.push('tagData')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('tagData'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{t('Menu.Transformation.tagData')}</Button>
        
        </InputGroup></OverlayTrigger>:<></>}

      {/* Aggrégation */}
      {mode_trans=='expert'?<OverlayTrigger
        key={'TransfortagLevel'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransfortagLevel'}>{t('Menu.Transformation.tooltips.tagLevel')} </Tooltip>}
      ><InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.tagLevel')}</InputGroup.Text>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('tagLevel')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.current.includes('tagLevel')){
                elementToDispose.current.push('tagLevel')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('tagLevel'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{elementToDispose.current.includes('tagLevel')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </InputGroup></OverlayTrigger>:<></>}
      
      <OverlayTrigger
        key={'TransforattrGeneral'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'TransforattrGeneral'}>{t('Menu.Transformation.tooltips.attrGeneral')} </Tooltip>}
      ><InputGroup><InputGroup.Text style={{width:'20%'}}>{t('Menu.Transformation.attrGeneral')}</InputGroup.Text>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.current.includes('attrGeneral')?'primary':'outline-primary'} 
            onClick={() =>{
              if(!elementToDispose.current.includes('attrGeneral')){
                elementToDispose.current.push('attrGeneral')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.current.splice(elementToDispose.current.indexOf('attrGeneral'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{elementToDispose.current.includes('attrGeneral')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </InputGroup></OverlayTrigger>
      {apply_transformation_additional_elements.map((c:JSX.Element,i:number)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>
      })}
    </Tab>

    <Tab key={'manuelle'} eventKey={'manuelle'} title={t('Menu.Transformation.amp_manuelle')} style={{marginBottom:'10px'}}>
      {/* Ecart horizontal */}
      <Form.Group ><InputGroup.Text style={{width:'20%'}}>{t('MEP.Horizontal')}</InputGroup.Text>
        <OverlayTrigger
          key={'MEP.tooltips.EEN_h'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'tooltip-adjust'}>{t('MEP.tooltips.EEN_h')} </Tooltip>}>
          <FormControl
            type="text"
            value={node_hspace}
            onChange={evt => {
              set_node_hspace(+evt.target.value)
              sankey_data.h_space = +evt.target.value
            }}/>
        </OverlayTrigger>
        
      </Form.Group>
      {/* Ecart Vertical */}
      <Form.Group><InputGroup.Text style={{width:'20%'}}>{t('MEP.Vertical')}</InputGroup.Text>
        <OverlayTrigger
          key={'MEP.tooltips.EEN_v'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.EEN_v'}>{t('MEP.tooltips.EEN_v')} </Tooltip>}>
          <FormControl
            type="text"
            value={node_vspace}
            onChange={evt => {
              set_node_vspace(+evt.target.value)
              sankey_data.v_space = +evt.target.value
            }}/>
        </OverlayTrigger>
        
      </Form.Group>
      <OverlayTrigger
        key={'MEP.tooltips.factExpH'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.factExpH'}>{t('MEP.tooltips.factExpH')} </Tooltip>}>
        <Form.Group>
          

          <Form.Label>
            {t('MEP.factExpH')}
          </Form.Label>
          
          
          <InputGroup>
            <Form.Control
              type='number'
              min={0}
              step={0.1}
              value={stretchFactorH}
              onChange={evt=>{
                set_stretchFactorH(+evt.target.value)
              }}
            />
            <Button
              variant='outline-primary'
              onClick={()=>applyStretch('h')}>
              {t('MEP.stretchH')}
            </Button>
          </InputGroup>
          
        </Form.Group>
      </OverlayTrigger>
      <OverlayTrigger
        key={'MEP.tooltips.factExpV'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.factExpV'}>{t('MEP.tooltips.factExpV')} </Tooltip>}><Form.Group>
          
          <Form.Label>
            {t('MEP.factExpV')}
          </Form.Label>
          
          
          <InputGroup>
            <Form.Control
              type='number'
              min={0}
              step={0.1}
              value={stretchFactorV}
              onChange={evt=>{
                set_stretchFactorV(+evt.target.value)
              }}
            />
            <Button
              variant='outline-primary'
              onClick={()=>applyStretch('v')}>
              {t('MEP.stretchV')}
            </Button>
          </InputGroup>
          
        </Form.Group>
      </OverlayTrigger>

      { /* Positionnement des noeuds */}
      <Form.Group>
        { /* Mise en forme automatique */}<OverlayTrigger
          key={'MEP.tooltips.PA'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.PA'}>{t('MEP.tooltips.PA')} </Tooltip>}>
          <Button
            size="sm"
            onClick={() => {
              ComputeAutoSankey(sankey_data, node_hspace)
              set_sankey_data({ ...sankey_data })
            }}>
            {t('MEP.PA')}
          </Button>
        </OverlayTrigger>{/* Arranger les noeud */}<OverlayTrigger
          key={'MEP.tooltips.AN'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.AN'}>{t('MEP.tooltips.AN')} </Tooltip>}>
          <Button
            size="sm"
            onClick={() => {
              arrangeNodes(sankey_data)
              set_sankey_data({ ...sankey_data })
            }}>
            {t('MEP.AN')}
          </Button>
        </OverlayTrigger>
        
      </Form.Group>
    </Tab>
    <Tab key='trans_topo' eventKey='trans_topo' title={t('Menu.Transformation.trans_topo')} style={{marginBottom:'10px'}}></Tab>
  </Tabs>
  const dragLayout= MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_apply_layout',
    content_modal_layout,
    {current:[window.innerWidth/4,window.innerHeight/4]},
    t('Menu.Transformation.title'),
    60
  )
  return dragLayout

}

/**
 *
 * @type {{ ref_setter_show_save_json: any; set_show_save_json: any; sankey_data: any; set_sankey_data: any; ClickSaveDiagram: any; }}
 */
export type ApplySaveJSONTypes = {
  t : TFunction
  // ref_setter_show_save_json : boolean,
  // set_show_save_json: (_:boolean)=>void,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  sankey_data : SankeyData,
  additionnal_button_option_save_json:JSX.Element[],
  ClickSaveDiagram:ClickSaveDiagramFuncType
}

/**
 *
 * @param {ApplySaveJSONTypes} { ref_setter_show_save_json, set_show_save_json,sankey_data,set_sankey_data,ClickSaveDiagram }
 * @returns {*}
 */
export const ApplySaveJSONDialog = (
  { t,dict_hook_ref_setter_show_dialog_components,sankey_data,additionnal_button_option_save_json,ClickSaveDiagram }: ApplySaveJSONTypes
) => {
  const [mode_save,set_mode_save]=useState(true)
  const [mode_visible_element,set_mode_visible_element]=useState(false)
  const [show_save_json_modal,set_show_save_json_modal]=useState(false)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_save_json.current=set_show_save_json_modal
  return (
    <Modal
      bsSize="large"
      show={show_save_json_modal}
      onHide={() => set_show_save_json_modal(false)}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.SaveJSON')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form >
          <InputGroup>
            <Checkbox 
              sx={SmoothClasses({})}
              maxW={'40%'}
              isChecked={mode_save}
              onChange={() => set_mode_save(!mode_save)}>
              {t('Menu.SaveValue')}
            </Checkbox>
          </InputGroup>
          <InputGroup>
            <Checkbox 
              sx={SmoothClasses({})}
              maxW={'40%'}
              isChecked={mode_visible_element}
              onChange={() => set_mode_visible_element(!mode_visible_element)}>
              {t('Menu.VisibleElement')}
            </Checkbox>
          </InputGroup>
          {additionnal_button_option_save_json}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          size="sm"
          style={{width:'20%'}}
          variant='danger'
          onClick={
            () => {
              set_show_save_json_modal(false)
            }
          }>{t('Menu.close')}
        </Button>
        <Button
          size="sm"
          style={{width:'20%'}}
          onClick={
            () => {
              // Crée une copie pour d'abord enregitrer avec les changements
              // (ClickSaveDiagram utilise data donc on doit faire un set_data avant mais aussi garder la version sans les changements)
              const cpy:SankeyData=JSON.parse(JSON.stringify(sankey_data))
              if(!mode_save){
                Object.values(cpy.links).forEach(d=>{
                  (d as SankeyLink).value={}
                })
              }
              if(mode_visible_element){
                // Si l'on enregistre que les element visible alors on cherche les élements visible dasns le svg
                const link_present=LinkVisibleOnSvg()
                const node_visible=NodeVisibleOnsSvg()
                cpy.links=Object.fromEntries(Object.entries(cpy.links).filter(l=>link_present.includes(l[0])).map(l=>l))
                const key_level_tags=Object.keys(sankey_data.levelTags)
                cpy.nodes=Object.fromEntries(Object.entries(cpy.nodes).filter(n=>node_visible.includes(n[0])).map(n=>{
                  key_level_tags.forEach(klt=>{
                    delete n[1].tags[klt]
                  })
                  n[1].dimensions={}
                  n[1].inputLinksId=n[1].inputLinksId.filter(lid=>link_present.includes(lid))
                  n[1].outputLinksId=n[1].outputLinksId.filter(lid=>link_present.includes(lid))
                  return n
                }))
                cpy.levelTags={}
                cpy.linkZIndex=link_present;
                
                (cpy as unknown as {view:[]}).view=[]
              }

              // set_sankey_data({...sankey_data})
              ClickSaveDiagram(cpy)
              // set_sankey_data({...cpy})
            }
          }>{t('Menu.SaveJSON')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export type ExcelModalTypes = {
  t : TFunction,
  UploadExcelImpl: UploadExcelImplFuncType,
  url_prefix: string,
  launch: (path: string) => void,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType
}

/**
 * Return the modal when we try to open an excel file
 *
 * @param {{ UploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; callback: any; launch: any; }} { UploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,callback,launch }
 * @returns
 */
export const ExcelModal: FunctionComponent<ExcelModalTypes> = ({ t,UploadExcelImpl, url_prefix,launch,dict_hook_ref_setter_show_dialog_components }) => {
  const [input_file_name, set_input_file_name] = useState<Blob | undefined>(undefined)
  const [show_excel_dialog,set_show_excel_dialog]=useState(false)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_excel_dialog.current=set_show_excel_dialog
  return (
    <Modal
      show={show_excel_dialog}
      onHide={()=>set_show_excel_dialog(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Ouvrir Fichier Excel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group as={Row}>
            <Form.Label>Fichier d&apos;entrée excel</Form.Label>
            <Form.Control
              type="file"
              onChange={(evt: ChangeEvent) => {
                set_input_file_name((evt.target as HTMLFormElement).files[0])
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={
            () => {
              launch((input_file_name as unknown as {[name:string]:string}).name)
              UploadExcelImpl(
                set_show_excel_dialog,input_file_name as Blob,url_prefix
              )
            }
          }
        >Ouvrir</Button>
        <Button
          variant="secondary"
          onClick={()=>set_show_excel_dialog(false)}
        >{t('Menu.ca')}</Button>
      </Modal.Footer>
    </Modal>)
}

export const OpenSankeyDiagramSelector : OpenSankeyDiagramSelectorFType = (
  t, 
  convert_data,
  sankey_data,
  set_sankey_data,
  prev_sankey_data,
  set_prev_sankey_data, 
  updateLayout, 
  elementToDispose,
  defaultData
) => {
  const [file_layout,set_file_layout] = useState<Blob[] | undefined>(undefined)
  return <Form>
    <Form.Group as={Row}>
      <Col xs='3'>
        <FormLabel>{t('Menu.Transformation.fmep')}</FormLabel>
      </Col>
      <Col xs='2'>
        <Form.Control
          type="file"
          onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)} />
      </Col>
      <Col xs={3}>
        <Button
          size="sm"
          onClick={() => {
            if (file_layout === undefined) {
              return
            }
            const reader = new FileReader()
            reader.onload = (() => {
              return (
                (e: ProgressEvent<FileReader>) => {
                  let result = (e.target as FileReader).result
                  if (result) {
                    result = String(result)
                    const new_layout = JSON.parse(result)
                    convert_data(new_layout,defaultData)
                    complete_sankey_data(new_layout, defaultData, DefaultNode, DefaultLink)
                    set_prev_sankey_data(JSON.parse(JSON.stringify(sankey_data)))
                    updateLayout(sankey_data, new_layout, elementToDispose.current, true)
                    set_sankey_data({ ...sankey_data })
                  }
                }
              )
            })()
            reader.readAsText(file_layout[0])
          } }>{t('Menu.Transformation.ad')}
        </Button>
      </Col>
      <Col xs={3}>
        <Button
          size="sm"
          onClick={() => {
            set_sankey_data(JSON.parse(JSON.stringify(prev_sankey_data)))
          } }>{t('Menu.Transformation.undo')}
        </Button>
      </Col>
    </Form.Group>
  </Form>
}

