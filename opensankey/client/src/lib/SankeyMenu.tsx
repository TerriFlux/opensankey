/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Ref } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, Modal, Navbar, Nav, NavDropdown, Button, Dropdown, Container, Offcanvas, ToggleButton,Row,Pagination,FormCheck,Carousel,Col} from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyNodePropTypes, SankeyData } from './types'
import { convert_data,complete_sankey_data } from './SankeyConvert'
import FileSaver from 'file-saver'
import { default_node, set_nodes_level, findMaxLinkValue,uploadExcelImpl, processExample,clickSaveExcel,default_link } from './SankeyUtils'
import { FaAngleDoubleLeft,FaUser,FaPowerOff,FaAngleDoubleRight} from 'react-icons/fa'
import {downloadExamples,adjust_sankey_zone} from './SankeyUtils'
import SankeyLoad from './SankeyLoad'
import { SankeyConfigurationMenu } from './SankeyMenuConfiguration'
// import ModalPreference from './SankeyMenuPreferences'
// import { ModalStyleLink, ModalStyleNode } from './SankeyMenuStyles'
import { ExcelModal,ApplyLayoutDialog,ApplySaveJSONDialog } from './SankeyMenuDialogs'
import { TFunction } from 'i18next'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header?: string
      welcome_text: string
    }
  }
/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export type selected_type = {'label':string;'value':string}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any; right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */

const MenuPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  default_sankey_data:PropTypes.func.isRequired,
  logo: PropTypes.string.isRequired,
  logo_terriflux: PropTypes.string.isRequired,
  logo_width: PropTypes.number,
  app_name: PropTypes.string.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}).isRequired,
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}).isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,

  example_menu: PropTypes.element,
  // portfolio_menu: PropTypes.element,
  formations_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,


  nav_item_active: PropTypes.string.isRequired,

  mode_selection: PropTypes.shape({current:PropTypes.string.isRequired}).isRequired,

  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,

  callback:PropTypes.func.isRequired,

  show_load: PropTypes.bool.isRequired,
  set_show_load: PropTypes.func.isRequired,
  processing : PropTypes.bool.isRequired,
  setProcessing : PropTypes.func.isRequired,
  failure : PropTypes.bool.isRequired,
  setFailure : PropTypes.func.isRequired,
  not_started : PropTypes.bool.isRequired,
  setNotStarted : PropTypes.func.isRequired,
  result : PropTypes.string.isRequired,
  setResult : PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
  launch: PropTypes.func.isRequired,
  configurations_menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  show_nav: PropTypes.bool.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_excel_dialog: PropTypes.bool.isRequired,
  set_show_excel_dialog: PropTypes.func.isRequired,
  show_apply_layout: PropTypes.bool.isRequired,
  set_show_apply_layout: PropTypes.func.isRequired,
  show_save_json: PropTypes.bool.isRequired,
  set_show_save_json: PropTypes.func.isRequired,
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  show_publish_dialog:PropTypes.bool.isRequired,
  set_show_publish_dialog: PropTypes.func.isRequired,

  menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  set_welcome_text: PropTypes.func.isRequired,
  show_modalTemplate:PropTypes.bool.isRequired,
  set_show_modalTemplate:PropTypes.func.isRequired,
  cardsTemplate:PropTypes.element.isRequired,
  token:PropTypes.bool.isRequired,
  useNavigate:PropTypes.func.isRequired,
  external_modal:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  menu_banner:PropTypes.object.isRequired,
  loginOut:PropTypes.func.isRequired,
  unsetTokens:PropTypes.func.isRequired,
  // modalShortcut:PropTypes.element.isRequired,
  min_width_and_height :PropTypes.func.isRequired,
  name_user:PropTypes.string.isRequired
  

}





const clickSaveSVG = () => {
  const svg = window.d3.select(' .opensankey#svg-container svg')
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.style('border','0px')
  svg.select('#grid').style('opacity','0')
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  FileSaver.saveAs(blob, 'sankey_diagram.svg')
  svg.style('border','2px solid #d3d3d3')
  svg.select('#grid').style('opacity','1')
}

const clickSavePDF = (data:SankeyData) => {
  const svg = window.d3.select(' .opensankey#svg-container svg')
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.style('border','0px')
  svg.select('#grid').style('opacity','0')
  svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML
  svg.style('border','2px solid #d3d3d3')
  svg.select('#grid').style('opacity','1')

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)

  const path = window.location.href
  let url = path + '/opensankey/sankey/save_pdf'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/pdf' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.pdf')
  }
  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_pdf'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

const clickSavePNG = (data:SankeyData) => {
  const svg = window.d3.select(' .opensankey#svg-container svg')
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.style('border','0px')
  svg.select('#grid').style('opacity','0')
  svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML
  svg.style('border','2px solid #d3d3d3')
  svg.select('#grid').style('opacity','1')

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)

  const path = window.location.href
  let url = path + '/opensankey/sankey/save_png'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/png' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.png')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_png'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

const goToUserDoc = () => {
  const path = window.location.href
  const url = path + 'doc'
  fetch(url, {
    method:'GET'
  }).then((response) => {
    if(response.redirected){
      return window.open(response.url, '_blank')
    }
  }).then( win => win?.focus() )
}

export const OpenSankeyMenus = (
  t:TFunction,
  setShowPreference:(b:boolean)=>void,
  reinitialization:()=>void,
  default_sankey_data:()=>SankeyData,
  set_show_publish_dialog:(b:boolean)=>void,
  set_show_apply_layout:(b:boolean)=>void,
  set_show_excel_dialog:(b:boolean)=>void,
  set_show_save_json:(b:boolean)=>void,
  showStyleEdition:()=>void,
  showStyleEditionLink:()=>void,
  set_show_welcome:(b:boolean)=>void,
  set_never_see_again:(b:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  url_prefix:string,
  set_show_modalTemplate:(b:boolean)=>void,
  external_edition_item:JSX.Element[],
  externale_save_item:JSX.Element[],
) => {
  const _load_json = useRef<HTMLInputElement>(null)
  return  [
    <NavDropdown key={'files'}  title={t('Menu.Fichiers')} id={'files'} >
      <NavDropdown drop='end' id='ouvrir' title={t('Menu.ouvrir')}  >
        <Dropdown.Item
          onClick={() => {
            if (_load_json.current) {
              _load_json.current.name = ''
              _load_json.current.click()
            }
          }} >JSON</Dropdown.Item>
        <Form.Control
          type="file"
          ref={_load_json}
          style={{ display: 'none' }}
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                reinitialization()
                let result = String((e.target as FileReader).result)
                const new_data = default_sankey_data()
                result = result.split('<br>').join('\\\\n')
                const result_data = JSON.parse(result)
                Object.assign(new_data, result_data)
                if (result_data.version === undefined) {
                  (new_data.version as unknown as undefined) = undefined
                }
                convert_data(new_data)
                complete_sankey_data(new_data,default_sankey_data,default_node,default_link)
                set_nodes_level(data)
                set_data(new_data)
                const test = document.getElementsByClassName('navbar')
                let margin_top = 0
                if (test && test.length > 0) {
                  margin_top = test[0].getBoundingClientRect().height
                  d3.select(' .opensankey #svg-container').style('margin-top',margin_top+'px')
                }
              }
            })()
            reader.readAsText(files[0])
          }}
        />
        <Dropdown.Item
          onClick={() => set_show_excel_dialog(true)}
        >Excel</Dropdown.Item>
      </NavDropdown>
      <NavDropdown  drop='end' id='enregistrer' title={t('Menu.enregistrer')} >
        <Dropdown.Item onClick={()=>{
          set_show_save_json(true)
        }} >JSON</Dropdown.Item>
        {/* <Dropdown.Item onClick={()=>clickSaveExcelSimple(url_prefix,data)} >Excel Simple</Dropdown.Item> */}
        <Dropdown.Item onClick={()=>clickSaveExcel('/opensankey/',data)} >Excel</Dropdown.Item>
        {externale_save_item}
      </NavDropdown>
      <NavDropdown drop='end' id='exporter' title={t('Menu.exporter')} >
        <Dropdown.Item onClick={clickSaveSVG} >{t('Menu.exporter')} SVG</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSavePDF(data)} >{t('Menu.exporter')} PDF</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSavePNG(data)} >{t('Menu.exporter')} PNG</Dropdown.Item>
      </NavDropdown>
      <Dropdown.Item onClick={() => { setShowPreference(true) }}>{t('Menu.preference')}</Dropdown.Item>
      <Dropdown.Item onClick={() => { set_show_modalTemplate(true) }}>{t('Menu.templates')}</Dropdown.Item>
    </NavDropdown>,
    <NavDropdown key={'edition'} id={'edition'} title={t('Menu.Edition')} >
      <Dropdown.Item onClick={reinitialization} >{t('Menu.reinit')}</Dropdown.Item>
      {/* <Dropdown.Item onClick={() => set_show_publish_dialog(true)} >{t('Menu.pub')}</Dropdown.Item>     */}
      <Dropdown.Item onClick={() => set_show_apply_layout(true)}>{t('Menu.amp')}</Dropdown.Item>
      <Dropdown.Item onClick={showStyleEdition}>{t('Menu.esn')}</Dropdown.Item>
      <Dropdown.Item onClick={showStyleEditionLink}>{t('Menu.esf')}</Dropdown.Item>
      {external_edition_item}
    </NavDropdown >,
    <NavDropdown key={'Aide'} id={'Aide'} title={t('Menu.Aide')} >
      <Dropdown.Item onClick={() =>{ 
        set_show_welcome(true)
        set_never_see_again(false)
        localStorage.setItem('dontSeeAggainWelcome','0')
      }}>
        {t('DisplayWelcome')}</Dropdown.Item>
      <Dropdown.Item onClick={() => goToUserDoc()} >{t('Menu.doc')}</Dropdown.Item>
    </NavDropdown >,
  ]



}

/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type MenuTypes = InferProps<typeof MenuPropTypes>




/**
 * Description placeholder
 *
 * @param {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 *
 * @returns
 */
const Menu: FunctionComponent<MenuTypes> = (
  { t,data, set_data,
    default_sankey_data,
    nav_item_active,
    show_nav,
    set_show_nav,
    logo,logo_terriflux, logo_width,app_name,
    button_ref,
    accordion_ref,
    selected_node,
    url_prefix,
    callback,
    show_load,
    set_show_load,
    processing,setProcessing,
    failure,setFailure,
    not_started,setNotStarted,
    result,setResult,
    path,
    launch,
    configurations_menus,
    show_excel_dialog, set_show_excel_dialog,
    show_apply_layout, set_show_apply_layout,
    show_save_json, set_show_save_json,
    menus,
    set_welcome_text,
    show_modalTemplate,
    set_show_modalTemplate,
    cardsTemplate,
    token,
    useNavigate,
    external_modal,
    menu_banner,
    loginOut,
    unsetTokens,
    min_width_and_height,
    name_user
  }
) => {
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1


  if (not_started == false && processing == false) {
    const path = window.location.href
    const url = path + url_prefix + 'loads_retrieves_result'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text().then(text => {
        try {
          const server_data = JSON.parse(text)
          if ((data as SankeyData & { layout?: SankeyData }).layout ) {
            server_data.layout = (data as SankeyData & { layout?: SankeyData }).layout
          }
          
          const new_data=Object.assign(default_sankey_data(),processExample(server_data))
          callback(new_data)
          delete (new_data as SankeyData & { layout?: SankeyData }).layout
          set_data({ ...new_data })
          //set_show_load(false)
        } catch(err) {
          alert(err)
        }
      })
    })
    setProcessing(false)
    setFailure(false)
    setNotStarted(true)
  }

  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => {
    set_show_nav(!show_nav)

    
    if(!show_nav){
      // Lors de l'ouverture du menu, enregistre l'échelle de la zone de sankey 
      // et la position des scroll bar 

      const scaleOfSVG=d3.select(' .opensankey #svg').attr('transform').split(' ').filter(s=>s.includes('scale'))[0].replace('scale(','').replace(')','')
      sessionStorage.setItem('scale',scaleOfSVG)

      const SL=document.getElementsByTagName ('html')[0]?.scrollLeft
      const string_SL=(SL!==undefined)?SL.toString():'none'
      sessionStorage.setItem('scrollLeft',string_SL)

      const ST=document.getElementsByTagName ('html')[0]?.scrollTop
      const string_ST=(ST!==undefined)?ST.toString():'none'
      sessionStorage.setItem('scrollTop',string_ST)

      adjust_sankey_zone(data,min_width_and_height,true)
    }else{
      // Lors de la fermeture du menu, remet l'échelle de la zone de sankey avant l'ouverture du menu
      // et replace la position des scroll bar comme elles etaient avant
      const scaleToUse=sessionStorage.getItem('scale')
      const SlToUse=sessionStorage.getItem('scrollLeft')
      const StToUse=sessionStorage.getItem('scrollTop')
      
      if(scaleToUse){
        d3.select(' .opensankey #svg').attr('transform','translate(0,0) scale('+scaleToUse+')')
      }else{
        adjust_sankey_zone(data,min_width_and_height)
      }
      if(SlToUse && StToUse){
        document.getElementsByTagName ('html')[0]?.scrollTo(+SlToUse,+StToUse)
      }
      sessionStorage.removeItem('scale')
      sessionStorage.removeItem('scrollLeft')
      sessionStorage.removeItem('scrollTop')
    }
  }
  const setChecked = useState(false)[1]

  let node = data.nodes[selected_node.current.idNode]
  if (node === undefined) {
    node = default_node(data)
  }

  const props = {
    scroll: true,
    backdrop: false,
  }

  const menuButton = () => {
    if (show_nav) {
      return <FaAngleDoubleRight style={{marginTop:'50px'}} />
    } else {
      return <FaAngleDoubleLeft style={{marginTop:'50px'}} />
    }

  }


  const has_scrollbar_shift=window.innerWidth-document.getElementsByTagName('html')[0].clientWidth
  

  const navigate=useNavigate()
  const returnToApp=()=>{
    navigate('/')
    set_data({...data})
  }
  const toolbar=Object.values(menu_banner).map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})
  
  return (
    <>
      {external_modal.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}
      {/* Top Navbar with navigation and edition elements */}
      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} >
        <Container className='MenuNavigation'>
          {!window.SankeyToolsStatic?<>
            <Navbar.Brand style={{marginRight:'0px'}} href="https://terriflux.com/" ><img src={logo_terriflux} width={100} /> </Navbar.Brand>
            <div style={{display:'inline-block',width:'0px',marginLeft:'5px',marginRight:'5px',height:'40px',borderRight:'solid 1px #ddd',borderLeft:'solid 1px #ddd',padding:'0'}}></div>
          </>:<></>
          }
          
          <Navbar.Brand href="#" onClick={()=>set_welcome_text(window.sankey.welcome_text)}><img src={logo} width={logo_width ? logo_width : 200} /> </Navbar.Brand>
          {!window.SankeyToolsStatic ? (<>
            <Nav className='me-auto'>
              {menus.map((c,i)=>{
                return <React.Fragment key={i}>{c}</React.Fragment>
              })}
            </Nav>
            {toolbar}

            <Nav>
              <Col>
                <Button style={{'marginRight':'15px','width':'35px','height':'35px','backgroundColor':(!token)?'#ff7851':'#78c2ad','borderColor':(!token)?'#ff7851':'#78c2ad'}} onClick={()=> (token)?navigate('/dashboard'):navigate('/login')}><FaUser/></Button>
                <Form.Label style={{display:'contents'}}>{(token)?name_user:t('connect')}</Form.Label>
                {token?<Button style={{'marginRight':'15px','width':'35px','height':'35px'}}variant='danger' onClick={()=>loginOut(unsetTokens,returnToApp)}><FaPowerOff/></Button>:<></>}
               
              </Col>
            </Nav>
          </>
          ) : (<>
            <Col><h4 onClick={()=>set_welcome_text(window.sankey.welcome_text)}><a href="#" style={{color:"#666"}}>{window.sankey.header}</a></h4></Col>
            {toolbar}
          </>)} 
        </Container>
      </Navbar>
      {/* Bottom Navbar with some more info */}
      <Navbar bg='light' fixed='bottom' style={{fontSize:'0.85em'}} >
        <Container className='sankeyFooter' >

          <span style={{display:'inline'}}>
        ©<a  href="https://terriflux.com/" ><img width={75} src={logo_terriflux} /></a> - Tous droits réservés
          </span>
          <span style={{display:'inline'}}>
            {app_name}
          </span>
          <span style={{display:'inline'}}><a href='https://terriflux.com/mentions-legales/'>Mention légales</a></span>
          <span style={{display:'inline'}}>
          9 rue du Rocher de Lorzier, 38430 Moirans  +33 (0)6 21 83 56 76
          </span>

        </Container>
      </Navbar>
      
      {(!data.static_sankey) ?<Offcanvas className='sankey-menu' show={show_nav} placement='end' /*onHide={set_show_nav(false)}*/ {...props} style={{ 'width': '540px', 'marginTop':document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height }}>
        <Offcanvas.Body style={{ 'padding': '0px 0px 0px 0px' }}>
          <SankeyConfigurationMenu
            nav_item_active={nav_item_active}
            accordion_ref={accordion_ref}
            configuration_menus={configurations_menus} />
        </Offcanvas.Body>
      </Offcanvas>
        : <></>}

      {!data.static_sankey ? (
        <ToggleButton style={{ 'width':'40px',height:'120px', position:'fixed',top:window.innerHeight/2,left:window.innerWidth-40-((show_nav)?540+has_scrollbar_shift:has_scrollbar_shift),zIndex:100 }}
          ref={button_ref as Ref<HTMLLabelElement>}
          id="toggle-check"
          type="checkbox"
          variant="outline-primary"
          checked={show_nav}
          onChange={(e) => { setChecked(e.currentTarget.checked)}}
          onClick={toggleShow}
          value="menuConfigButton">{menuButton()}
        </ToggleButton>
      ) : (<></>)
      }

      {
        processing ? (
          <Modal.Dialog >
            <Button className="btn btn-sm btn-warning col-md-12">
              <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
            </Button></Modal.Dialog>) : (<></>)
      }
      <ApplySaveJSONDialog
        t={t}
        show_save_json={show_save_json}
        set_show_save_json={set_show_save_json}
        sankey_data={data}
        set_sankey_data={set_data}
      />
      <ApplyLayoutDialog
        t={t}
        show_apply_layout={show_apply_layout}
        set_show_apply_layout={set_show_apply_layout}
        sankey_data={data}
        set_sankey_data={set_data}
      />

      <ExcelModal
        t={t}
        launch={launch}
        handleCloseDialog={() => set_show_excel_dialog(false)}
        uploadExcelImpl={uploadExcelImpl}
        set_data={set_data}
        data={data}
        show_excel_dialog={show_excel_dialog}
        set_show_excel_dialog={set_show_excel_dialog}
        url_prefix={url_prefix}
        callback={callback} />

      <SankeyLoad
        url_prefix={url_prefix}
        successAction={()=>downloadExamples(path, url_prefix, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        show_dialog={show_load}
        set_show_dialog={set_show_load}
        processing={processing}
        setProcessing={setProcessing}
        failure={failure}
        setFailure={setFailure}
        setNotStarted={setNotStarted}
        result={result}
        setResult={setResult}
      />

      {
      // {modalTemplate}
        <Modal size={'xl'}  show={show_modalTemplate} onHide={() => set_show_modalTemplate(false)}>
          <Modal.Header closeButton>{t('Banner.sdr')}</Modal.Header>
          <Modal.Body>
            <Row md={4}>
              {cardsTemplate}
            </Row>
          </Modal.Body>
        </Modal>

      }
    </>
  )
}

Menu.propTypes = MenuPropTypes

export default Menu

export //Modal for shortcut
const OpenSankeyModalShortcut = (t:TFunction,
  showShortcut:boolean,
  setshowShortcut:React.Dispatch<React.SetStateAction<boolean>>,
  additional_shortcut_item:JSX.Element[]
)=>{
  return <Modal size={'lg'} show={showShortcut} onHide={() => setshowShortcut(false)}>
    <Modal.Header closeButton>
      <Modal.Title>{t('Menu.rc')}</Modal.Title>
    </Modal.Header>
    <Modal.Body >
      <h4 style={{textAlign:'center'}}>Raccourcis de l'application OpenSankey</h4>
      
      <h5>Avec la souris en mode sélection :</h5>
      <p><b>Click (noeuds) :</b> Sélectionne le noeud cliqué</p>
      <p><b>CTRL + Click (noeuds) :</b> Sélectionne le noeud cliqué et ouvre l'onglet "<b>Noeuds</b>" du menu</p>
      <p><b>Click (flux) :</b> Sélectionne le flux cliqué</p>
      <p><b>CTRL + Click (flux) :</b> Sélectionne le flux cliqué et ouvre l'onglet "<b>Flux</b>" du menu</p>
      <p><b>Click (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
      <p><b>Click droit (noeuds) :</b>  Agrége le noeud</p>
      <p><b>Alt Click droit (noeuds) :</b>  Désagrége le noeud</p>
      <p><b>Alt + Drag (label noeuds) :</b>  Déplace le label</p>
      <p><b>Shift + survole (noeuds) :</b>  Affiche la valeur des flux entrant et sortant du noeud dans une tooltip</p>
      <p><b>Shift + survole (flux) :</b>  Affiche la valeur du flux dans une tooltip </p>
      
      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      
      <h5>Avec la souris en mode édition :</h5>
      <p><b>Click (zone de dessin) :</b> Ajoute un noeud à l'endroit cliqué</p>
      <p><b>Drag (à partir de la zone de dessin) :</b> Crée un noeud au point de départ du drag puis crée un flux partir du noeud crée vers : soit un noeud déjà existant si l'on drop dessus, soit crée un noeud si l'on drop sur la zone de dessin </p>
      <p><b>Drag (à partir d'un noeud) :</b> Créer un flux partir du  noeud de départ du drag vers : soit un noeud déjà existant si l'on drop dessus, soit crée un noeud si l'on drop sur la zone de dessin  </p>
      
      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      
      <h5>Autres raccourcis :</h5>
      <p><b>Suppr :</b> Supprime les noeuds et flux sélectionnés</p>
      <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
      <p><b>Drag (bouton du milieu de la souris et en dehors d'un noeud/flux)</b> Permet de déplacer le sankey complet  </p>

      <p><b>Echap :</b> Ferme le Menu si il est ouvert et remet la fonction de la souris en tant que sélecteur </p>

      {additional_shortcut_item}

    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setshowShortcut(false)}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
}
  
export const OpenSankeyModalWelcome=(t:TFunction,
  active_page:string,
  set_active_page:(s:string)=>void,
  show_modal_welcome:boolean,
  set_show_modal_welcome:(b:boolean)=>void,
  never_see_again:boolean,
  set_never_see_again:(b:boolean)=>void,
  additional_shortcut_item:JSX.Element[],
  external_pagination:JSX.Element[],
  external_content:{[s:string]:JSX.Element},
  exemple_menu: object,
)=>{
    


  const content_rc=<>
    <h4 style={{textAlign:'center'}}>Raccourcis de l'application OpenSankey</h4>
          
    <h5>Avec la souris en mode sélection :</h5>
    <p><b>Click (noeuds) :</b> Sélectionne le noeud cliqué</p>
    <p><b>CTRL + Click (noeuds) :</b> Sélectionne le noeud cliqué et ouvre l'onglet "<b>Noeuds</b>" du menu</p>
    <p><b>Click (flux) :</b> Sélectionne le flux cliqué</p>
    <p><b>CTRL + Click (flux) :</b> Sélectionne le flux cliqué et ouvre l'onglet "<b>Flux</b>" du menu</p>
    <p><b>Click (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
    <p><b>Click droit (noeuds) :</b>  Agrége le noeud</p>
    <p><b>Alt Click droit (noeuds) :</b>  Désagrége le noeud</p>
    <p><b>Alt Drag (label noeuds) :</b>  Déplace le label</p>
      
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      
    <h5>Avec la souris en mode édition :</h5>
    <p><b>Click (zone de dessin) :</b> Ajoute un noeud à l'endroit cliqué</p>
    <p><b>Drag (à partir de la zone de dessin) :</b> Crée un noeud au point de départ du drag puis crée un flux à partir du noeud crée vers : soit un noeud déjà existant si l'on drop dessus, soit un noeud que l'on crée à l'endroit où l'on drop sur la zone de dessin</p>
    <p><b>Drag (à partir d'un noeud) :</b> Créer un flux à partir du  noeud de départ du drag vers : soit un noeud déjà existant si l'on drop dessus, soit un noeud que l'on crée à l'endroit où l'on drop sur la zone de dessin  </p>
      
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      
    <h5>Autres raccourcis :</h5>
    <p><b>Suppr :</b> Supprime les noeuds et flux sélectionnés</p>
    <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
    <p><b>Drag (bouton du milieu de la souris et en dehors d'un noeud/flux)</b> Permet de déplacer le sankey complet  </p>

    <p><b>Echap :</b> Ferme le Menu quand il est ouvert et remet la fonction de la souris en tant que sélecteur </p>
      
    {additional_shortcut_item}

  </>
  external_content['rc']=content_rc

  const tmp=JSON.parse(JSON.stringify(exemple_menu))
    let list_template_data=[] as string[]
    // Si exemple_menu contient OpenSankey et que ce sous dossier contient les templates simple alors remple la liste des templates avec les modèle simples
    if(Object.keys(tmp).length!==0 && Object.keys(tmp).includes('OpenSankey') && Object.keys(tmp['OpenSankey']).includes('easy_template') ){
        list_template_data=tmp['OpenSankey']['easy_template'].filter((f:string)=>!f.includes('.xlsx'))
    // Si l'un des sous dossier d'OpenSankey dans exemple_menu est expert_template alors ajoute les modèles expert à la liste des modèles
        if( Object.keys(tmp['OpenSankey']).includes('expert_template') ){
          list_template_data.push(tmp['OpenSankey']['expert_template'])
          list_template_data=list_template_data.flat()
        }
    }

   
  const content_carousel=<Carousel variant='dark' >
    {list_template_data.map((_,idx) =>
        {
        const title=_.split('.').splice(0,1).join('')
        return (<Carousel.Item>
          <img src={'/fm/userfiles/OpenSankey/image_preview/'+title+'.png'}   style={{'objectFit':'contain','width':'100%','height':'650px',display:'inline-block'}}   />
          <Carousel.Caption style={{display:'inline-block'}}><p>{title.replaceAll('_',' ')}</p></Carousel.Caption>
        </Carousel.Item>)
      })
    }

  </Carousel>
  external_content['carousel']=content_carousel
    
  
  
  return <Modal scrollable size='xl' show={show_modal_welcome && !never_see_again} onHide={()=>{
    set_show_modal_welcome(false)
  }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('welcome.welcome')}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {external_content[active_page]}
    </Modal.Body>

    {window.SankeyToolsStatic ? <></> : <Modal.Footer style={{justifyContent:'center'}}>
      <Pagination >
        {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}
        <Pagination.Item active={active_page==='carousel'} key={'carousel'} onClick={()=>{
          set_active_page('carousel')
        }}>
            Exemples
        </Pagination.Item>

        <Pagination.Item active={active_page==='rc'} key={'rc'} onClick={()=>{
          set_active_page('rc')
        }}>
          {t('Menu.rc')}
        </Pagination.Item>
      </Pagination>
      <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again} onChange={evt=>{
        set_never_see_again(evt.target.checked)
        localStorage.setItem('dontSeeAggainWelcome','1')
      }}/>
    </Modal.Footer>}
  </Modal>
}
