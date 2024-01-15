import React,{ useEffect, useState, } from 'react'
import { Button,FormGroup,Form,Col,Row,Modal, ButtonGroup } from 'react-bootstrap'
import Spinner  from 'react-bootstrap/Spinner'
import { processFunctionsType, dict_hook_ref_setter_show_dialog_componentsType, applicationContextType, applicationDrawType, dict_variable_application_dataType } from '../types/Types'
import { ConvertDataFuncType } from '../configmenus/types/SankeyConvertTypes'
interface SankeyLoadProdTypes {
  applicationContext: applicationContextType,
  applicationDraw: applicationDrawType,
  dict_variable_application_data: dict_variable_application_dataType,
  successAction: () => void,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  processFunctions:processFunctionsType,
  convert_data:ConvertDataFuncType
}

const SankeyLoad = ({
  applicationContext,
  applicationDraw,
  dict_variable_application_data,
  successAction,
  processFunctions,
  dict_hook_ref_setter_show_dialog_components,
  convert_data
} : SankeyLoadProdTypes) => {
  const { t,url_prefix } = applicationContext
  const { ref_processing, ref_setter_processing, failure, ref_result, not_started, RetrieveExcelResults}=processFunctions

  const [value,setValue] = useState([1,2])
  const [show_load_dialog,set_show_load_dialog] = useState(false)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_load.current=set_show_load_dialog
  const [result,set_result] = useState('')
  const [processing,set_processing] = useState(false)
  ref_result.current = set_result
  ref_setter_processing.current = set_processing
  const [is_computing,set_is_computing] = useState(false)

  const reset = () => {
    set_processing(false)
    ref_processing.current = false
    failure.current = false
    set_is_computing(false)
    not_started.current = true
  }

  const handleChange = (evt:MouseEvent) => {
    if ( value.includes(+(evt.target as HTMLFormElement).value) ) {
      value.splice(value.indexOf((evt.target as HTMLFormElement).value))
    } else {
      value.push(+(evt.target as HTMLFormElement).value)
    }
    setValue([...value])
  }

  const infos = result !== undefined ? result.split('\n') : []
  const success_status = t('Menu.loaded_file')
  const failure_status = t('Menu.failure_file')
  const spinner=(processing || is_computing)? <Spinner animation="border" />:<></>

  if (!not_started.current && !processing) {
    const path = window.location.href
    const url = path + applicationContext.url_prefix + 'loads_retrieves_result'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text().then(text => {
        try {
          RetrieveExcelResults(
            text,
            dict_variable_application_data.set_data,
            applicationDraw.updateLayout,
            ()=>null,
            applicationDraw.GetSankeyMinWidthAndHeight,
            convert_data,
            dict_variable_application_data.get_default_data
          )
        } catch(err) {
          alert(err)
        }
      }).then(()=>{
        set_is_computing(false)
      })
    })
    set_processing(false)
    ref_processing.current = false
    failure.current = false
    not_started.current = true
  }

  return (
    <Modal
      bsSize="large"
      show={show_load_dialog}
      onHide={ () => set_show_load_dialog(false) }
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Modal.Header closeButton>
        <Modal.Title>Chargement du fichier {spinner}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form >
          <FormGroup>
            <Row>
              <Col sm={5}/>
              <Col sm={2}>
                {
                  processing ? (
                    <Button variant="warning">
                      <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
                      {t('Menu.load_file')}
                    </Button>):(
                    failure.current ? (
                      <Button variant="danger" onClick={reset}>{failure_status}</Button>) : <>
                      {
                        is_computing ? (
                          <Button
                            variant='info'>
                            {t('Menu.compute_file')}
                          </Button>):(
                          <Button
                            variant="success"
                            onClick={()=>{
                              successAction()
                              set_show_load_dialog(false)
                            }}>{success_status}</Button>)
                      }</>
                  )
                }
              </Col><Col sm={5}/></Row>
            <br/>
            <br/>
            <br/>
            <Row>
              <Col sm={12}>
                <ButtonGroup>
                  <Button onClick={evt=>handleChange(evt as unknown as MouseEvent)} value={1} variant={value.includes(1) ? 'info' : 'light'} >Infos</Button>
                  <Button onClick={evt=>handleChange(evt as unknown as MouseEvent)} value={2} variant={value.includes(2) ? 'danger' : 'light'} >Erreurs</Button>
                  <Button onClick={evt=>handleChange(evt as unknown as MouseEvent)} value={3} variant={value.includes(3) ? 'warning' : 'light'} >Debug</Button>
                </ButtonGroup></Col>
            </Row>
            {processing ? (
              <Counter
                url_prefix={url_prefix}
                finishReconciliation={()=>{
                  set_processing(false)
                  ref_processing.current = false
                  set_is_computing(true)
                  failure.current = false
                }}
                value={value}
                result={result}
                set_result={set_result}
              />
            ) : (<>
              <Row >
                <Col sm={12} >
                  {infos.map(
                    (info) => (
                      value.includes(2) && info.includes('ERROR') ?
                        (<div style={{color:'red'}}>{info.replace('ERROR','')}</div>)
                        : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
                          (<div style={{color:'blue'}}>{info.replace('INFO','')}</div>)
                          : value.includes(3) && (info.includes('DEBUG') ) ?
                            (<div style={{color:'orange'}}>{info.replace('DEBUG','')}</div>) : (null)
                    )
                  )
                  }
                </Col>
              </Row>
            </>
            )}
          </FormGroup>
        </Form>
      </Modal.Body>
    </Modal>
  )
}


/**
 * Description placeholder
 *
 * @param {{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}} {url_prefix,finishReconciliation,value,result,setResult}
 * @returns {void; value: {}; result: string; setResult: (x: string) => void; }) => any}
 */
export const Counter = ({
  url_prefix,
  finishReconciliation,
  value,result,set_result
}:{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,set_result:(_:string)=>void}) => {
  useEffect(() =>{
    const interval = setInterval(() => {
      const root = window.location.href
      const url = root + url_prefix + 'load_process'
      const fetchData = {
        method: 'POST',
        body: ''
      }
      fetch(url, fetchData).then(
        function(response) {
          if(response.ok) {
            response.json().then(
              function (data) {
                set_result(data.output)
              }
            )
          }
        })
    }, 5000)
    return () => clearInterval(interval)
  })
  const infos = result.split('\n')
  if ( infos.length > 2) {
    if (result.includes('FINISHED')) {
      finishReconciliation(false)
    } else if (result.includes('FAILED')) {
      finishReconciliation(true)
    }
  }
  return (
    <Row >
      <Col sm={12} >
        {infos.map(
          info => (
            value.includes(2) && info.includes('ERROR') ?
              (<div style={{color:'red'}}>{info.replace('ERROR','')}</div>)
              : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
                (<div style={{color:'blue'}}>{info.replace('INFO','')}</div>)
                : value.includes(3) && (info.includes('DEBUG') ) ?
                  (<div style={{color:'orange'}}>{info.replace('DEBUG','')}</div>) : (null)
          )
        )
        }
      </Col>
    </Row>
  )
}

export default SankeyLoad
