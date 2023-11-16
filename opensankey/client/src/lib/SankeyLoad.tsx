import { TFunction } from 'i18next'
import React,{ useEffect, useState, } from 'react'
import { Button,FormGroup,Form,Col,Row,Modal, ButtonGroup } from 'react-bootstrap'
import Spinner  from 'react-bootstrap/Spinner'
interface SankeyLoadProdTypes {
  t:TFunction
  url_prefix: string,
  successAction: () => void,
  show_dialog : boolean,
  /**
   * Function to change show_dialog value
   *
   * @type {(b:boolean)=>void}
   */
  set_show_dialog : (b:boolean)=>void,
  processing : boolean,
  /**
   * Function to change processing value
   *
   * @type {(b:boolean)=>void}
   */
  setProcessing : (b:boolean)=>void
  failure : boolean,
  /**
   *    * Function to change failure value
   *
   * @type {(b:boolean)=>void}
   */
  setFailure : (b:boolean)=>void
  /**
   * Function to change notStarted value
   *
   * @type {(b:boolean)=>void}
   */
  setNotStarted : (b:boolean)=>void
  result : string;
  setResult: (s:string)=>void,
  is_computing:boolean,
  setIsComputing:(b:boolean)=>void,
}

const SankeyLoad = ({
  t,
  url_prefix,
  successAction,
  show_dialog,set_show_dialog,
  processing,setProcessing,
  failure,setFailure,
  setNotStarted,
  result,setResult,
  is_computing,setIsComputing
} : SankeyLoadProdTypes) => {
  const [value,setValue] = useState([1,2])

  const reset = () => {
    setProcessing(false)
    setFailure(false)
    setIsComputing(false)
    setNotStarted(true)
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
  const failure_status = t('Menu.failur_file')
  const spinner=(processing || is_computing)? <Spinner animation="border" />:<></>
  return (
    <Modal
      bsSize="large"
      show={show_dialog}
      onHide={ () => set_show_dialog(false) }
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
                    failure ? (
                      <Button variant="danger" onClick={reset}>{failure_status}</Button>) : <>
                      {
                        is_computing? (
                          <Button
                            variant='info'>
                            {t('Menu.compute_file')}
                          </Button>):(
                          <Button
                            variant="success"
                            onClick={()=>{
                              successAction()
                              set_show_dialog(false)
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
                  setProcessing(false)
                  setIsComputing(true)
                  setFailure(false)
                }}
                value={value}
                result={result}
                setResult={setResult}
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
export const Counter = ({url_prefix,finishReconciliation,value,result,setResult}:{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}) => {
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
                setResult(data.output)
              }
            )
          }
        })
    }, 5000)
    return () => clearInterval(interval)
  })
  const infos = (result !== undefined) ? result.split('\n') : []
  if ( infos.length > 2) {
    if (result.includes('FINISHED')) {
      //console.log('finished')
      finishReconciliation(false)
    } else if (result.includes('FAILED')) {
      finishReconciliation(true)
    }
  } else {
    //console.log('else')
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
