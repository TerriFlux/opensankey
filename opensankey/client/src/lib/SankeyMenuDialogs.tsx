/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent, useState,  } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormLabel, Row, Col, Modal, Button, FormGroup } from 'react-bootstrap'
import { SankeyData, SankeyDataPropTypes, SankeyLink, } from './types'
import { updateLayout } from './SankeyLayout'
import { complete_sankey_data, convert_data } from './SankeyConvert'
import { default_link, default_node, default_sankey_data,clickSaveDiagram } from './SankeyUtils'

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
  set_sankey_data : PropTypes.func.isRequired
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
export const ApplyLayoutDialog = ({ t,show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }: ApplyLayoutDialogTypes) => {
  const [file_layout,set_file_layout] = useState<Blob[] | undefined>(undefined)
  const [elementToDispose, ] = useState([''])
  const [forceUpdate,setForceUpdate] = useState(true)
  return (
    <Modal
      size="xl"
      show={show_apply_layout}
      onHide={() => set_show_apply_layout(false)}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.amp')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
      </Modal.Body>
    </Modal>
  )
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

