import React,{ useEffect, useState, } from 'react'
import { Button,FormGroup,Form,Col,Row,Modal, ButtonGroup } from 'react-bootstrap'

interface SankeyLoadProdTypes {
  successAction: () => void,
  show_dialog : boolean,
  set_show_dialog : (b:boolean)=>void,
  processing : boolean,
  setProcessing : (b:boolean)=>void
  failure : boolean,
  setFailure : (b:boolean)=>void
  not_started : boolean,
  setNotStarted : (b:boolean)=>void
}

const SankeyLoad = ({
  successAction,
  show_dialog,set_show_dialog,
  processing,setProcessing,
  failure,setFailure,
  not_started,setNotStarted
} : SankeyLoadProdTypes) => {
  const [result,setResult] = useState('')
  const [value,setValue] = useState([1,2])
  
  const reset = () => {
    setProcessing(false)
    setFailure(false)
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
  const success_status = 'Chargement terminée'
  const failure_status = 'Echec du chargement'

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
        <Modal.Title>Chargement du fichier </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form >
          <FormGroup>
            <hr/>   
            <Row>  
              <Col sm={2}>         
                {not_started ? (<></>) :   
                  processing ? (
                    <Button variant="warning"><span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> En traitement...</Button>):(
                    failure ? 
                      <Button variant="danger" onClick={reset}>{failure_status}</Button> : 
                      <Button variant="success" 
                        onClick={()=>{
                          successAction()
                          set_show_dialog(false)
                        }}>{success_status}</Button>
                  )}
              </Col></Row> 
            <hr/> 
            <Row>
              <Col sm={12}><h3 style={{textAlign:'center'}}>Terminal</h3></Col> 
            </Row>
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
                finishReconciliation={()=>{
                  setProcessing(false)
                  setFailure(false)
                  //setNotStarted(true)
                }}
                value={value}
                result={result}
                setResult={setResult} 
              />
            ) : (
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
            )}
          </FormGroup>
        </Form>
      </Modal.Body>
    </Modal>
  )
}


const Counter = ({finishReconciliation,value,result,setResult}:{finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}) => {
  useEffect(() =>{
    const interval = setInterval(() => {
      const path = window.location.href
      const url = path + 'load_process'
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
  //let {value, result} = parent
  const infos = result !== undefined ? result.split('\n') : []
  if ( infos.length > 2) {
    const info = infos[infos.length-2]
    if (info.includes('FINISHED')) {
      finishReconciliation(false)
    } else if (info.includes('FAILED')) {
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
