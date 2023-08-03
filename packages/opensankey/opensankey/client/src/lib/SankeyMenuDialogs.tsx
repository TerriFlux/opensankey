/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent, useState,  } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormLabel, Row, Col, Modal, Button, FormGroup, Tabs,Tab,OverlayTrigger,Tooltip,InputGroup,FormControl} from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLink, } from './types'
import { complete_sankey_data } from './SankeyConvert'
import { default_link, default_node, default_sankey_data,clickSaveDiagram } from './SankeyUtils'
import { node_visible_on_svg } from './SankeyDrawFunction'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import { menu_draggable } from './SankeyMenu'
/**
 * Define ApplyLayoutDialog
 *
 * @type {{ show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
const ApplyLayoutDialogPropTypes = {
  t:PropTypes.func.isRequired,
  show_apply_layout : PropTypes.bool.isRequired,
  set_show_apply_layout: PropTypes.func.isRequired,
  sankey_data : SankeyDataPropTypes,
  set_sankey_data : PropTypes.func.isRequired,
  updateLayout:PropTypes.func.isRequired,
  convert_data:PropTypes.func.isRequired,
  node_hspace:PropTypes.number.isRequired,
  set_node_hspace:PropTypes.func.isRequired,
  node_vspace:PropTypes.number.isRequired,
  set_node_vspace:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data:PropTypes.func.isRequired,

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
export const ApplyLayoutDialog = ({ t,show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data,updateLayout,convert_data,node_hspace,set_node_hspace,node_vspace,set_node_vspace,data,set_data }: ApplyLayoutDialogTypes) => {
  const [file_layout,set_file_layout] = useState<Blob[] | undefined>(undefined)
  const [elementToDispose, ] = useState([''])
  const [forceUpdate,setForceUpdate] = useState(true)
  const [stretchFactorH,set_stretchFactorH]=useState(1)
  const [stretchFactorV,set_stretchFactorV]=useState(1)
  const node_visible=node_visible_on_svg()

  const applyStretch=(param:string)=>{
    const attr=param=='h'?'x':'y'
    const stretchFactor=param=='h'?stretchFactorH:stretchFactorV
    let min=Object.values(data.nodes)[0][attr]
    // Cheche la position en y du noeud le plus en haut à gauche
    Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && n.position!='relative').forEach(n=>{
      min=(n[attr]<min)?n[attr]:min
    })

    // Parcours les noeuds --> calcule le delta des position en y entre ceux-ci --> multiplie le delta par le facteur du input -->
    // applique le delta mutiplié par le facteur au noeud
    Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && n.position!='relative').forEach(n=>{
      const delta=n[attr]-min
      n[attr]=min+(delta*stretchFactor)
    })
    set_data({...data})
  }
  const content_modal_layout=  <Tabs defaultActiveKey={'import'} >

    <Tab eventKey='import' title={t('Menu.amp_import')} style={{marginBottom:'10px'}}>
      <Form >
        <Form.Group as={Row} >
          <Col xs={3}>
            <FormLabel>{t('Menu.fmep')}</FormLabel>
          </Col>
          <Col xs={5}>
            <Form.Control
              type="file"
              onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)}
            />
          </Col>
          <Col xs={4}>
            <Button
              size="sm"
              onClick={
                () => {
                  if (file_layout === undefined) {
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = (() => {
                    return (
                      (e: ProgressEvent<FileReader>) => {
                        let result = (e.target as FileReader).result
                        if (result) {
                          result = String(result)//.split('<br>').join('\\\\n')
                          const new_layout = JSON.parse(result)
                          convert_data(new_layout)
                          complete_sankey_data(new_layout,default_sankey_data,default_node,default_link)
                          updateLayout(sankey_data, new_layout,elementToDispose)
                          set_sankey_data({ ...sankey_data })
                        }
                      }
                    )
                  })()
                  reader.readAsText(file_layout[0])
                }
              }>{t('Menu.ad')}
            </Button>
          </Col>
        </Form.Group>
      </Form>
      <Form.Label>{t('Menu.textDisposition')}</Form.Label>
      <FormGroup as={Row}>
        <Col xs={2}>
          <Form.Check inline checked={ elementToDispose.includes('posNode')} value='posNode' label={t('Menu.PosNoeud')} onChange={(evt) => {
            if(evt.target.checked){
              elementToDispose.push('posNode')
              setForceUpdate(!forceUpdate)
            }else{
              elementToDispose.splice(elementToDispose.indexOf('posNode'),1)
              setForceUpdate(!forceUpdate)
            }}}/>
        </Col>
        <Col xs={2}>
          <Form.Check inline checked={elementToDispose.includes('attrNode')} value='attrNode' label={t('Menu.attrNode')} onChange={(evt) => {
            if(evt.target.checked){
              elementToDispose.push('attrNode')
              setForceUpdate(!forceUpdate)

            }else{
              elementToDispose.splice(elementToDispose.indexOf('attrNode'),1)
              setForceUpdate(!forceUpdate)
            }}}/>
        </Col>
        <Col xs={2}>
          <Form.Check inline checked={elementToDispose.includes('attrFlux')} value='attrFlux' label={t('Menu.attrFlux')} onChange={(evt) =>{
            if(evt.target.checked){
              elementToDispose.push('attrFlux')
              setForceUpdate(!forceUpdate)
            }else{
              elementToDispose.splice(elementToDispose.indexOf('attrFlux'),1)
              setForceUpdate(!forceUpdate)
            }}}/>
        </Col>
        <Col xs={2}>
          <Form.Check inline checked={elementToDispose.includes('tagNode')} value='tagNode' label={t('Menu.tagNode')} onChange={(evt) =>{
            if(evt.target.checked){
              elementToDispose.push('tagNode')
              setForceUpdate(!forceUpdate)
            }else{
              elementToDispose.splice(elementToDispose.indexOf('tagNode'),1)
              setForceUpdate(!forceUpdate)

            }}}/>
        </Col>
        <Col xs={2}>
          <Form.Check inline checked={elementToDispose.includes('tagFlux')} value='tagFlux' label={t('Menu.tagFlux')} onChange={(evt) => {
            if(evt.target.checked){
              elementToDispose.push('tagFlux')
              setForceUpdate(!forceUpdate)
            }else{
              elementToDispose.splice(elementToDispose.indexOf('tagFlux'),1)
              setForceUpdate(!forceUpdate)
            }}}/>
        </Col>
        <Col xs={2}>
          <Form.Check inline checked={elementToDispose.includes('attrGeneral')} value='attrGeneral' label={t('Menu.attrGeneral')} onChange={(evt) =>{
            if(evt.target.checked){
              elementToDispose.push('attrGeneral')
              setForceUpdate(!forceUpdate)

            }else{
              elementToDispose.splice(elementToDispose.indexOf('attrGeneral'),1)
              setForceUpdate(!forceUpdate)
            }}}/>
        </Col>
      </FormGroup>
    </Tab>

    <Tab eventKey={'manuelle'} title={t('Menu.amp_manuelle')} style={{marginBottom:'10px'}}>
      {/* Ecart horizontal */}
      <Form.Group as={Row} >
        <Col xs={7}>
          <FormLabel>{t('MEP.Horizontal')}</FormLabel>
        </Col>
        <Col xs={5}>
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
                data.h_space = +evt.target.value
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>
      {/* Ecart Vertical */}
      <Form.Group as={Row}>
        <Col xs={7}>
          <FormLabel>{t('MEP.Vertical')}</FormLabel>
        </Col>
        <Col xs={5}>
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
                data.v_space = +evt.target.value
              }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>
      <OverlayTrigger
        key={'MEP.tooltips.factExpH'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.factExpH'}>{t('MEP.tooltips.factExpH')} </Tooltip>}>
        <Form.Group as={Row}>
          <Col xs={7}>

            <Form.Label>
              {t('MEP.factExpH')}
            </Form.Label>
          </Col>
          <Col xs={5}>
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
          </Col>
        </Form.Group>
      </OverlayTrigger>
      <OverlayTrigger
        key={'MEP.tooltips.factExpV'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.factExpV'}>{t('MEP.tooltips.factExpV')} </Tooltip>}>
        
        <Form.Group as={Row}>
          <Col xs={7}>
            <Form.Label>
              {t('MEP.factExpV')}
            </Form.Label>
          </Col>
          <Col xs={5}>
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
          </Col>
        </Form.Group>
      </OverlayTrigger>

      { /* Positionnement des noeuds */}
      <Form.Group as={Row}>
        { /* Mise en forme automatique */}
        <Col xs={6}>
          <OverlayTrigger
            key={'MEP.tooltips.PA'}
            placement={'top'}
            delay={500}
            rootClose
            overlay={<Tooltip id={'MEP.tooltips.PA'}>{t('MEP.tooltips.PA')} </Tooltip>}>
            <Button
              size="sm"
              onClick={() => {
                compute_auto_sankey(data, node_hspace)
                set_data({ ...data })
              }}>
              {t('MEP.PA')}
            </Button>
          </OverlayTrigger>
        </Col>
        {/* Arranger les noeud */}
        <Col xs={6}>
          <OverlayTrigger
            key={'MEP.tooltips.AN'}
            placement={'top'}
            delay={500}
            rootClose
            overlay={<Tooltip id={'MEP.tooltips.AN'}>{t('MEP.tooltips.AN')} </Tooltip>}>
            <Button
              size="sm"
              onClick={() => {
                arrangeNodes(data)
                set_data({ ...data })
              }}>
              {t('MEP.AN')}
            </Button>
          </OverlayTrigger>
        </Col>
      </Form.Group>
    </Tab>
  </Tabs>

  const dragLayout=show_apply_layout?menu_draggable(content_modal_layout,{current:[window.innerWidth/4,window.innerHeight/4]},t('Menu.MEP'),set_show_apply_layout,60):<></>
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
  sankey_data:SankeyDataPropTypes,
  set_sankey_data:PropTypes.func.isRequired,
}


type ApplySaveJSONTypes = InferProps<typeof ApplySaveJSONPropTypes>

/**
 *
 * @param {ApplySaveJSONTypes} { show_save_json, set_show_save_json,sankey_data,set_sankey_data,clickSaveDiagram }
 * @returns {*}
 */
export const ApplySaveJSONDialog = ({ t,show_save_json, set_show_save_json,sankey_data,set_sankey_data }: ApplySaveJSONTypes) => {
  const [mode_save,set_mode_save]=useState(true)
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
          <Form.Group as={Row} >
            <Col xs={1}>
              <Form.Check
                inline
                type='switch'
                style={{marginTop: '-0.25em', marginBottom:'0em'}}
                checked={mode_save}
                onChange={(evt)=>set_mode_save(evt.target.checked)}/>
            </Col>
            <Col xs={7}>
              <FormLabel style={{justifyContent: 'left', marginLeft: '-2.75em'}}>{t('Menu.SaveValue')}</FormLabel>
            </Col>
            <Col xs={4}>
              <Button
                size="sm"
                onClick={
                  () => {
                    // Crée une copie pour d'abord enregitrer avec les changements
                    // (clickSaveDiagram utilise data donc on doit faire un set_data avant mais aussi garder la version sans les changements)
                    const cpy=JSON.parse(JSON.stringify(sankey_data))
                    if(!mode_save){
                      Object.values(sankey_data.links).map(d=>{
                        (d as SankeyLink).value={}
                        return d
                      })
                    }
                    set_sankey_data({...sankey_data})
                    clickSaveDiagram(sankey_data)
                    set_sankey_data({...cpy})
                  }
                }>{t('Menu.SaveJSON')}
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
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

