/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Ref } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, Container, Offcanvas, ToggleButton,Row,Col,Card } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyData } from './types'
import { convert_data } from './SankeyConvert'
import FileSaver from 'file-saver'
import { default_sankey_data, default_node, set_nodes_level, findMaxLinkValue,uploadExcelImpl, processExample } from './SankeyUtils'
import { FaAngleDoubleLeft,FaPowerOff,FaUser} from 'react-icons/fa'
import SankeyMenuBanner from './SankeyMenuBanner'
import {downloadExamples} from './SankeyUtils'
import SankeyLoad from './SankeyLoad'
import { SankeyConfigurationMenu } from './SankeyMenuConfiguration'
import ModalPreference from './SankeyMenuPreferences'
import { ModalStyleLink, ModalStyleNode } from './SankeyMenuStyles'
import { PublishModal,ExcelModal,ApplyLayoutDialog,ApplySaveJSONDialog } from './SankeyMenuDialogs'
import { TFunction } from 'i18next'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header?: string
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
  logo: PropTypes.string.isRequired,
  logo_width: PropTypes.number,
  app_name: PropTypes.string.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement).isRequired}).isRequired,
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement).isRequired}).isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,

  example_menu: PropTypes.element,
  // portfolio_menu: PropTypes.element,
  formations_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,

  set_current_filter: PropTypes.func.isRequired,

  nav_item_active: PropTypes.string.isRequired,

  mode_selection: PropTypes.string.isRequired,
  set_mode_selection: PropTypes.func.isRequired,

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
  selected_style_link: PropTypes.string.isRequired,
  set_selected_style_link: PropTypes.func.isRequired,
  selected_style_node: PropTypes.string.isRequired,
  set_selected_style_node: PropTypes.func.isRequired,
  show_publish_dialog:PropTypes.bool.isRequired,
  set_show_publish_dialog: PropTypes.func.isRequired,
  showStyleNode:PropTypes.bool.isRequired,
  setShowStyleNode: PropTypes.func.isRequired,
  showStyleLink:PropTypes.bool.isRequired,
  setShowStyleLink: PropTypes.func.isRequired,
  showShortcut:PropTypes.bool.isRequired,
  setshowShortcut: PropTypes.func.isRequired,
  showHelp:PropTypes.bool.isRequired,
  setshowHelp: PropTypes.func.isRequired,

  menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  show_modalTemplate:PropTypes.bool.isRequired,
  set_show_modalTemplate:PropTypes.func.isRequired,
  cardsTemplate:PropTypes.element.isRequired,
  token:PropTypes.bool.isRequired,
  useNavigate:PropTypes.func.isRequired

}

const clickSaveDiagram = (data:SankeyData) => {
  const data_to_save = { ...data }
  const str_data = JSON.stringify(data_to_save, null, 2)
  const blob = new Blob([str_data], { type: 'text/plain;charset=utf-8' })
  FileSaver.saveAs(blob, 'sankey_diagram.json')
}
const clickSaveExcel = (url_prefix:string,data:SankeyData) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
  let url = root + url_prefix + 'sankey/save_excel'
  const fetchData = {
    method: 'POST',
    body: JSON.stringify(data)
  }
  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    FileSaver.saveAs(newBlob, 'sankey.xlsx')
  }
  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = root + url_prefix + 'sankey/clean_excel'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}
const clickSaveExcelSimple = (url_prefix:string,data:SankeyData) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
  let url = root + url_prefix + 'sankey/save_excel_simple'
  const fetchData = {
    method: 'POST',
    body: JSON.stringify(data)
  }
  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    FileSaver.saveAs(newBlob, 'sankey.xlsx')
  }
  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = root + url_prefix + 'sankey/clean_excel'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
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
  svg.style('border','2px solid #78c2ad')
  svg.select('#grid').style('opacity','1')
}
const clickSavePDF = (data:SankeyData) => {
  const svg = window.d3.select(' .opensankey#svg-container svg')
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)

  const path = window.location.href
  let url = path + 'sankey/save_pdf'
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
    url = path + 'sankey/clean_pdf'
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
  svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)

  const path = window.location.href
  let url = path + 'sankey/save_png'
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
    url = path + 'sankey/clean_png'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

export const OpenSankeyMenus = (
  t:TFunction,
  setShowPreference:(b:boolean)=>void,
  reinitialization:()=>void,
  set_show_publish_dialog:(b:boolean)=>void,
  set_show_apply_layout:(b:boolean)=>void,
  set_show_excel_dialog:(b:boolean)=>void,
  set_show_save_json:(b:boolean)=>void,
  showStyleEdition:()=>void,
  showStyleEditionLink:()=>void,
  setshowShortcut:(b:boolean)=>void,
  setshowHelp:(b:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  url_prefix:string,
  set_show_modalTemplate:(b:boolean)=>void,
  token:boolean,
  set_token:(b:boolean)=>void,
) => {
  const _load_json = useRef<HTMLInputElement>(null)
  const loginOut=()=>{
    set_token(false)
  }
  
  return [
    <NavDropdown  title={t('Menu.Fichiers')} id="files" >
      <NavDropdown drop='start' id='ouvrir' title={t('Menu.ouvrir')}  >
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
                let result = String((e.target as FileReader).result)
                const new_data = default_sankey_data()
                result = result.split('<br>').join('\\\\n')
                const result_data = JSON.parse(result)
                Object.assign(new_data, result_data)
                if (result_data.version === undefined) {
                  (new_data.version as unknown as undefined) = undefined
                }
                convert_data(new_data)
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
      <NavDropdown  drop='start' id='enregistrer' title={t('Menu.enregistrer')} >
        <Dropdown.Item onClick={()=>{
          set_show_save_json(true)
        }} >JSON</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSaveExcelSimple(url_prefix,data)} >Excel Simple</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSaveExcel(url_prefix,data)} >Excel</Dropdown.Item>
      </NavDropdown>
      <NavDropdown drop='start' id='exporter' title={t('Menu.exporter')} >
        <Dropdown.Item onClick={clickSaveSVG} >{t('Menu.exporter')} SVG</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSavePDF(data)} >{t('Menu.exporter')} PDF</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSavePNG(data)} >{t('Menu.exporter')} PNG</Dropdown.Item>
      </NavDropdown>
      <Dropdown.Item onClick={() => { setShowPreference(true) }}>{t('Menu.preference')}</Dropdown.Item>
      <Dropdown.Item onClick={() => { set_show_modalTemplate(true) }}>{t('Menu.template')}</Dropdown.Item>
    </NavDropdown>,
    <NavDropdown id='edition' title={t('Menu.Edition')} >
      <Dropdown.Item onClick={reinitialization} >{t('Menu.reinit')}</Dropdown.Item>
      <Dropdown.Item onClick={() => set_show_publish_dialog(true)} >{t('Menu.pub')}</Dropdown.Item>    
      <Dropdown.Item onClick={() => set_show_apply_layout(true)}>{t('Menu.amp')}</Dropdown.Item>
      <Dropdown.Item onClick={showStyleEdition}>{t('Menu.esn')}</Dropdown.Item>
      <Dropdown.Item onClick={showStyleEditionLink}>{t('Menu.esf')}</Dropdown.Item>
    </NavDropdown >,
    <NavDropdown id='Aide' title={t('Menu.Aide')} >
      <Dropdown.Item onClick={() => setshowShortcut(true)} >{t('Menu.rc')}</Dropdown.Item>
      <Dropdown.Item onClick={() => setshowHelp(true)}>{t('Menu.as')}</Dropdown.Item>
      {(token)?<Dropdown.Item><Button variant='danger' onClick={()=>loginOut()}><FaPowerOff/></Button></Dropdown.Item>:<></>}
    </NavDropdown >,
    
  ]}

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
    nav_item_active,
    show_nav,
    set_show_nav,
    logo, logo_width,app_name,
    button_ref,
    accordion_ref,
    selected_node,
    selected_link,
    url_prefix,
    set_current_filter,
    mode_selection,
    set_mode_selection,
    callback,
    show_load,
    set_show_load,
    processing,setProcessing,
    failure,setFailure,
    not_started,setNotStarted,
    path,
    launch,
    configurations_menus,
    show_excel_dialog, set_show_excel_dialog,
    show_apply_layout, set_show_apply_layout,
    show_save_json, set_show_save_json,
    showPreference, setShowPreference,
    selected_style_link, set_selected_style_link,
    selected_style_node, set_selected_style_node,
    show_publish_dialog,set_show_publish_dialog,
    showStyleNode, setShowStyleNode,
    showStyleLink, setShowStyleLink,
    showShortcut, setshowShortcut,
    showHelp, setshowHelp,
    menus,
    show_modalTemplate,
    set_show_modalTemplate,
    cardsTemplate,
    token,
    useNavigate
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
    const url = path + 'loads_retrieves_result'
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
          Object.assign(data,processExample(server_data))
          callback(data)
          delete (data as SankeyData & { layout?: SankeyData }).layout
          set_data({ ...data })
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
    if (button_ref && button_ref.current ) {
      button_ref.current.click()
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
      return t('Menu.confSankey')
    } else {
      return <FaAngleDoubleLeft />
    }

  }

  const publishImpl = (file_path:string) =>{
    // const form_data = new FormData()
    // form_data.append('file', input_file)

    const path = window.location.href

    const url = path + url_prefix + 'sankey/publish'

    const new_data = JSON.parse(JSON.stringify(data))
    new_data.file_name = file_path

    const fetchData = {
      method: 'POST',
      body: JSON.stringify(new_data, null, 2)
    }

    fetch(url, fetchData).then( response => {
      if (!response.ok) {
        alert(response)
      }
    })
    set_show_publish_dialog(false)
  }

  //Modal for shortcut
  const modalShortcut = (
    <Modal size={'lg'} show={showShortcut} onHide={() => setshowShortcut(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.rc')}</Modal.Title>
      </Modal.Header>
      <Modal.Body >
        <p>Fonctionnement des clics :</p>
        <p><b>CTRL + Clic (noeuds) :</b> Sélectionne le noeuds click dans l'onglet "<b>Noeuds</b>" du menu</p>
        <p><b>CTRL + Clic (flux) :</b> Sélectionne le flux click dans l'onglet "<b>Flux</b>" du menu</p>
        <p><b>Suppr</b> ou <b>Retour arrière :</b> Supprime les noeuds et flux sélectionnés</p>
        <p><b>Clic (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
        <p><b>Clic droit (noeuds) :</b>  Agrége le noeud</p>
        <p><b>Alt Clic droit (noeuds) :</b>  Désagrége le noeud</p>
        <p><b>Alt Clic (label noeuds) :</b>  Déplace le label</p>
        <p><b>CTRL + S :</b> Sauvegarde la configuration actuelle dans une vue, qui peut ensuite être visualisé dans le Menu Vue </p>
        <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
        <p><b>Echap :</b> Ferme le Menu si il est ouvert </p>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setshowShortcut(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>

  )
  // Modal designed to show additional help
  const modalHelp = (
    <Modal size={'lg'} show={showHelp} onHide={() => setshowHelp(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Aide</Modal.Title>
      </Modal.Header>
      <Modal.Body >
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setshowHelp(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
  const navigate=useNavigate()
  return (
    <>
      {//Ajout des pop up des différents menu d'edition (style,raccourci clavier, aide supplémentaire)
      
      } 
      { !data.static_sankey ? (
        <ModalStyleNode
          t={t}
          data={data}
          set_data={set_data}
          showStyle={showStyleNode}
          setShowStyle={setShowStyleNode}
          selected_style_node={selected_style_node}
          set_selected_style_node={set_selected_style_node}
        />
      ): (<></>)}
      { <ModalPreference
        t={t}
        data={data}
        set_data={set_data}
        showPreference={showPreference}
        setShowPreference={setShowPreference}
        set_mode_selection={set_mode_selection}
      />}
      { !data.static_sankey ? (
        <ModalStyleLink
          t={t}
          data={data}
          set_data={set_data}
          showStyleLink={showStyleLink}
          setShowStyleLink={setShowStyleLink}
          selected_style_link={selected_style_link}
          set_selected_style_link={set_selected_style_link}
          selected_link={selected_link}
        />
      ): (<></>)}
      { !data.static_sankey ? (
        modalShortcut
      ): (<></>)}
      { !data.static_sankey ? (
        modalHelp
      ): (<></>)}

      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} >
        <Container className='MenuNavigation'>
          <Navbar.Brand href="#"><img src={logo} width={logo_width ? logo_width : 200} /> {app_name} </Navbar.Brand>
          {!window.SankeyToolsStatic ? (<>
            <Nav>
              {menus}
              <Button style={{'marginRight':'15px','width':'35px','height':'35px','backgroundColor':(!token)?'#ff7851':'#78c2ad','borderColor':(!token)?'#ff7851':'#78c2ad'}} onClick={()=> (token)?navigate('/dashboard'):navigate('/login')}><FaUser/></Button>
              {!data.static_sankey ? (
                <ButtonGroup className="mb-2" style={{ 'width': (show_nav) ? '537px' : '80px' }}>
                  <ToggleButton
                    ref={button_ref as Ref<HTMLLabelElement>}
                    id="toggle-check"
                    type="checkbox"
                    variant="outline-primary"
                    checked={show_nav}
                    onChange={(e) => { setChecked(e.currentTarget.checked) }}
                    onClick={toggleShow}
                    value="1">{menuButton()}
                  </ToggleButton>
                </ButtonGroup>) : (<></>)
              }
            </Nav></>
          ) : (<><br />
            <h2>{window.sankey.header}</h2>
            <br /></>)}
        </Container>
      </Navbar>
      {// Si nous travaillons sur les données actuelle alors on affiche le bandeau de filtrage 
        //si on affiche une vue, fait apparaitre des boutons pour changer de vue avec des animations
      }
      <SankeyMenuBanner
        t={t}
        data={data}
        set_data={set_data}
        mode_selection={mode_selection}
        set_mode_selection={set_mode_selection}
        set_current_filter={set_current_filter}
        url_prefix={url_prefix}
      /> 
      {(show_nav && !data.static_sankey) ? 
        <Offcanvas className='sankey-menu' show={true} placement='end' /*onHide={set_show_nav(false)}*/ {...props} style={{ 'width': '540px', 'marginTop': '71px', 'marginRight': '15px'}}>
          <Offcanvas.Body style={{ 'padding': '0px 0px 0px 0px' }}>
            <SankeyConfigurationMenu 
              nav_item_active={nav_item_active}
              accordion_ref={accordion_ref!}
              configuration_menus={configurations_menus} />
          </Offcanvas.Body>
        </Offcanvas>
        : <></>}

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
        clickSaveDiagram={clickSaveDiagram}
      />
      <ApplyLayoutDialog
        t={t}
        show_apply_layout={show_apply_layout}
        set_show_apply_layout={set_show_apply_layout}
        sankey_data={data}
        set_sankey_data={set_data}
      />
      {show_excel_dialog ? (
        <ExcelModal
          t={t}
          launch={launch}
          handleCloseDialog={() => set_show_excel_dialog(false)}
          uploadExcelImpl={uploadExcelImpl}
          set_data={set_data}
          data={data}
          set_show_excel_dialog={set_show_excel_dialog}
          url_prefix={url_prefix}
          callback={callback} />
      ) :
        (<div />)
      }
      { show_publish_dialog ?  (
        <PublishModal
          t={t}
          set_show_publish_dialog={set_show_publish_dialog} 
          publishImpl = {publishImpl}
          file_path_initial = {data.file_name as string}/>
      ) :
        (<div/>)
      }
      { show_load ?  (
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
        />
      ) :
        (<div/>)
      }
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

