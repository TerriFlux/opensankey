/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent, useState,  } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormLabel, Row, Col, Modal, Button, InputGroup, Tabs,Tab,OverlayTrigger,Tooltip,FormControl} from 'react-bootstrap'
import { SankeyData, SankeyDataPropTypes, SankeyLink, } from './types'
import { complete_sankey_data } from './SankeyConvert'
import { default_link, default_node, default_sankey_data,clickSaveDiagram } from './SankeyUtils'
import { node_visible_on_svg } from './SankeyDrawFunction'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import { menu_draggable } from './SankeyMenu'
import { FaCheck } from 'react-icons/fa'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TFunction } from 'i18next'
import * as d3 from 'd3'
/**
 * Define ApplyLayoutDialog
 *
 * @type {{ show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
const ApplyLayoutDialogPropTypes = {
  t:PropTypes.func.isRequired,
  show_apply_layout : PropTypes.bool.isRequired,
  set_show_apply_layout: PropTypes.func.isRequired,
  sankey_data : PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_sankey_data : PropTypes.func.isRequired,
  updateLayout:PropTypes.func.isRequired,
  convert_data:PropTypes.func.isRequired,
  node_hspace:PropTypes.number.isRequired,
  set_node_hspace:PropTypes.func.isRequired,
  node_vspace:PropTypes.number.isRequired,
  set_node_vspace:PropTypes.func.isRequired,
  diagramSelector: PropTypes.func.isRequired,
  apply_transformation_additional_elements: PropTypes.func.isRequired,

}

/**
 *
 * @typedef {ApplyLayoutDialogTypes}
 */
type ApplyLayoutDialogTypes = InferProps<typeof ApplyLayoutDialogPropTypes>

/**
 *
 * @param {ApplyLayoutDialogTypes} { show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog = ({ 
  t,show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data,
  updateLayout,convert_data,node_hspace,set_node_hspace,node_vspace,set_node_vspace,
  diagramSelector,
  apply_transformation_additional_elements,
}: ApplyLayoutDialogTypes) => {
  const [elementToDispose, ] = useState([''])
  const [prev_sankey_data,set_prev_sankey_data] = useState(sankey_data)
  const [forceUpdate,setForceUpdate] = useState(true)
  const [stretchFactorH,set_stretchFactorH]=useState(1)
  const [stretchFactorV,set_stretchFactorV]=useState(1)
  const [mode_trans,set_mode_trans]=useState('simple')
  const node_visible=node_visible_on_svg()

  const all_element_to_transform = [
    'addNode', 'addFlux', 'removeNode', 'removeFlux',
    'posNode', 'posFlux', 
    'Values', 
    'attrNode', 'attrFlux', 
    'tagNode', 'tagFlux', 'tagData', 'tagLevel',
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
      

      {diagramSelector(t, convert_data, sankey_data,set_sankey_data, prev_sankey_data, set_prev_sankey_data, updateLayout, elementToDispose)}
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
              elementToDispose.length = 0
              setForceUpdate(!forceUpdate)
            }}
          >{t('Menu.Transformation.unSelectAll')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant='outline-primary' 
            onClick={() => {
              elementToDispose.length = 0
              all_element_to_transform.forEach(el=>elementToDispose.push(el))
              setForceUpdate(!forceUpdate)
            }}
          >{t('Menu.Transformation.selectAll')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant='outline-primary' 
            onClick={() => {
              elementToDispose.length = 0
              default_element_to_transform.forEach(el=>elementToDispose.push(el))
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
              variant={ elementToDispose.includes('addNode')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.includes('addNode')){
                  elementToDispose.push('addNode')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.splice(elementToDispose.indexOf('addNode'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }
            >{t('Menu.Transformation.addNode')}</Button>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.includes('removeNode')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.includes('removeNode')){
                  elementToDispose.push('removeNode')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.splice(elementToDispose.indexOf('removeNode'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }
            >{t('Menu.Transformation.removeNode')}</Button>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.includes('addFlux')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.includes('addFlux')){
                  elementToDispose.push('addFlux')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.splice(elementToDispose.indexOf('addFlux'),1)
                  setForceUpdate(!forceUpdate)
                }}
              }>{t('Menu.Transformation.addFlux')}</Button>
            <Button 
              className='btn_menu_config'
              style={{width:'20%'}}
              variant={ elementToDispose.includes('removeFlux')?'primary':'outline-primary'} 
              onClick={() => {
                if(!elementToDispose.includes('removeFlux')){
                  elementToDispose.push('removeFlux')
                  setForceUpdate(!forceUpdate)
                }else{
                  elementToDispose.splice(elementToDispose.indexOf('removeFlux'),1)
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
            variant={ elementToDispose.includes('posNode')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.includes('posNode')){
                elementToDispose.push('posNode')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('posNode'),1)
                setForceUpdate(!forceUpdate)
              }}
            }>{t('Menu.Transformation.PosNoeud')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={ elementToDispose.includes('posFlux')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.includes('posFlux')){
                elementToDispose.push('posFlux')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('posFlux'),1)
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
            variant={ elementToDispose.includes('Values')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.includes('Values')){
                elementToDispose.push('Values')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('Values'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{elementToDispose.includes('Values')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        
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
            variant={elementToDispose.includes('attrNode')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.includes('attrNode')){
                elementToDispose.push('attrNode')
                setForceUpdate(!forceUpdate)

              }else{
                elementToDispose.splice(elementToDispose.indexOf('attrNode'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{t('Menu.Transformation.attrNode')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.includes('attrFlux')?'primary':'outline-primary'} 
            onClick={() =>{
              if(!elementToDispose.includes('attrFlux')){
                elementToDispose.push('attrFlux')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('attrFlux'),1)
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
            variant={elementToDispose.includes('tagNode')?'primary':'outline-primary'} 
            onClick={() =>{
              if(!elementToDispose.includes('tagNode')){
                elementToDispose.push('tagNode')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('tagNode'),1)
                setForceUpdate(!forceUpdate)

              }}
            }
          >{t('Menu.Transformation.tagNode')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.includes('tagFlux')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.includes('tagFlux')){
                elementToDispose.push('tagFlux')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('tagFlux'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{t('Menu.Transformation.tagFlux')}</Button>
          <Button 
            className='btn_menu_config'
            style={{width:'20%'}}
            variant={elementToDispose.includes('tagData')?'primary':'outline-primary'}
            onClick={() => {
              if(!elementToDispose.includes('tagData')){
                elementToDispose.push('tagData')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('tagData'),1)
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
            variant={elementToDispose.includes('tagLevel')?'primary':'outline-primary'} 
            onClick={() => {
              if(!elementToDispose.includes('tagLevel')){
                elementToDispose.push('tagLevel')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('tagLevel'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{elementToDispose.includes('tagLevel')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
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
            variant={elementToDispose.includes('attrGeneral')?'primary':'outline-primary'} 
            onClick={() =>{
              if(!elementToDispose.includes('attrGeneral')){
                elementToDispose.push('attrGeneral')
                setForceUpdate(!forceUpdate)
              }else{
                elementToDispose.splice(elementToDispose.indexOf('attrGeneral'),1)
                setForceUpdate(!forceUpdate)
              }}
            }
          >{elementToDispose.includes('attrGeneral')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </InputGroup></OverlayTrigger>
      {apply_transformation_additional_elements(t,forceUpdate,setForceUpdate,elementToDispose).map((c:JSX.Element,i:number)=>{
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
              compute_auto_sankey(sankey_data, node_hspace)
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

  const dragLayout=show_apply_layout?menu_draggable(content_modal_layout,{current:[window.innerWidth/4,window.innerHeight/4]},t('Menu.Transformation.title'),set_show_apply_layout,60):<></>
  return dragLayout

}

/**
 *
 * @type {{ show_save_json: any; set_show_save_json: any; sankey_data: any; set_sankey_data: any; clickSaveDiagram: any; }}
 */
const ApplySaveJSONPropTypes = {
  t:PropTypes.func.isRequired,
  show_save_json : PropTypes.bool.isRequired,
  set_show_save_json: PropTypes.func.isRequired,
  sankey_data : PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_sankey_data:PropTypes.func.isRequired,
  set_view:PropTypes.func
}


type ApplySaveJSONTypes = InferProps<typeof ApplySaveJSONPropTypes>

/**
 *
 * @param {ApplySaveJSONTypes} { show_save_json, set_show_save_json,sankey_data,set_sankey_data,clickSaveDiagram }
 * @returns {*}
 */
export const ApplySaveJSONDialog = ({ t,show_save_json, set_show_save_json,sankey_data,set_sankey_data,set_view }: ApplySaveJSONTypes) => {
  const [mode_save,set_mode_save]=useState(true)
  const [mode_visible_element,set_mode_visible_element]=useState(false)

  return (
    <Modal
      bsSize="large"
      show={show_save_json}
      onHide={() => set_show_save_json(false)}
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
            <InputGroup.Text style={{width:'40%'}}>{t('Menu.SaveValue')}</InputGroup.Text>
            <Button
              style={{width:'40%'}}
              className='btn_menu_config'
              variant={mode_save?'primary':'outline-primary'}
              onClick={()=>set_mode_save(!mode_save)}>
              {mode_save?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}
            </Button>
          </InputGroup>
          <InputGroup>
            <InputGroup.Text style={{width:'40%'}}>{t('Menu.VisibleElement')}</InputGroup.Text>
            <Button
              style={{width:'40%'}}
              className='btn_menu_config'
              variant={mode_visible_element?'primary':'outline-primary'}
              onClick={()=>set_mode_visible_element(!mode_visible_element)}>
              {mode_visible_element?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}
            </Button>
          </InputGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          size="sm"
          style={{width:'20%'}}
          variant='danger'
          onClick={
            () => {
              set_show_save_json(false)
            }
          }>{t('Menu.close')}
        </Button>
        <Button
          size="sm"
          style={{width:'20%'}}
          onClick={
            () => {
              // Crée une copie pour d'abord enregitrer avec les changements
              // (clickSaveDiagram utilise data donc on doit faire un set_data avant mais aussi garder la version sans les changements)
              const cpy=JSON.parse(JSON.stringify(sankey_data))
              if(!mode_save){
                Object.values(sankey_data.links).forEach(d=>{
                  (d as SankeyLink).value={}
                })
              }
              if(mode_visible_element){
                // Si l'on enregistre que les element visible alors on cherche les élements visible dasns le svg
                const link_present=[] as string[]
                d3.selectAll('.gg_links .link').each(s=>{
                  const d=s as SankeyLink
                  link_present.push(d.idLink)
                })
                const node_visible=node_visible_on_svg()
                sankey_data.links=Object.fromEntries(Object.entries(sankey_data.links).filter(l=>link_present.includes(l[0])).map(l=>l))
                sankey_data.nodes=Object.fromEntries(Object.entries(sankey_data.nodes).filter(n=>node_visible.includes(n[0])).map(n=>n))
              }

              if(set_view){
                set_view('none')
              }
              set_sankey_data({...sankey_data})
              clickSaveDiagram(sankey_data)
              set_sankey_data({...cpy})
            }
          }>{t('Menu.SaveJSON')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

const ExcelModalPropTypes = {
  t:PropTypes.func.isRequired,
  uploadExcelImpl: PropTypes.func.isRequired,
  handleCloseDialog: PropTypes.func.isRequired,
  set_data: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  show_excel_dialog: PropTypes.bool.isRequired,
  set_show_excel_dialog: PropTypes.func.isRequired,
  url_prefix: PropTypes.string.isRequired,
  callback: PropTypes.func.isRequired,
  launch: PropTypes.func.isRequired
}

type ExcelModalTypes = InferProps<typeof ExcelModalPropTypes>

/**
 * Return the modal when we try to open an excel file
 *
 * @param {{ uploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; callback: any; launch: any; }} { uploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,callback,launch }
 * @returns
 */
export const ExcelModal: FunctionComponent<ExcelModalTypes> = ({ t,uploadExcelImpl, handleCloseDialog, set_data, data,show_excel_dialog, set_show_excel_dialog,url_prefix,callback,launch }) => {
  const [input_file_name, set_input_file_name] = useState<Blob | undefined>(undefined)

  return (
    <Modal
      show={show_excel_dialog}
      onHide={handleCloseDialog}
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
              launch('')
              uploadExcelImpl(data,set_data,set_show_excel_dialog,input_file_name,url_prefix,callback)
            }
          }
        >Ouvrir</Button>
        <Button
          variant="secondary"
          onClick={handleCloseDialog}
        >{t('Menu.ca')}</Button>
      </Modal.Footer>
    </Modal>)
}

ExcelModal.propTypes = ExcelModalPropTypes

export const OpenSankeyDiagramSelector = (
  t: TFunction, 
  convert_data: (s:SankeyData)=>null,
  sankey_data: SankeyData,
  set_sankey_data: (s:SankeyData)=>null,
  prev_sankey_data: SankeyData,
  set_prev_sankey_data: (s:SankeyData)=>void, 
  updateLayout: (data: SankeyData,new_layout: SankeyData,mode:string[])=>void, 
  elementToDispose : string[]
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
                    convert_data(new_layout)
                    complete_sankey_data(new_layout, default_sankey_data, default_node, default_link)
                    set_prev_sankey_data(JSON.parse(JSON.stringify(sankey_data)))
                    updateLayout(sankey_data, new_layout, elementToDispose)
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

