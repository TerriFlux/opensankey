import React, { useState, useEffect, useRef, Validator } from 'react'
import { ReactElementLike } from 'prop-types'
import { Modal,Button, NavDropdown} from 'react-bootstrap'
import parse from 'html-react-parser'
import { useBeforeunload } from 'react-beforeunload'
import LZString from 'lz-string'

import SankeyDraw from './SankeyDraw'
import Menu, { OpenSankeyMenus } from './SankeyMenu'
import { ExempleItem } from './SankeyMenuExamples'
import { SankeySettingsEditionElementTags } from './SankeyMenuConfigurationTags'
import * as SankeyUtils from './SankeyUtils'
import {OpenSankeyConfigurationsMenus} from './SankeyMenuConfiguration'
import {OpenSankeyConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {OpenSankeyMenuConfigurationNodes} from './SankeyMenuConfigurationNodes'

import { linkTooltipsContent, nodeTooltipsContent } from './SankeyTooltip'

import { useTranslation } from 'react-i18next'
import { SankeyData, SankeyLink, SankeyNode } from './types'
import { default_link, default_node, link_text } from './SankeyUtils'
import { OpenSankeyMenuConfigurationLayout } from './SankeyMenuConfigurationLayout'
import { keyHandler } from './SankeyDrawFunction'

type SankeyAppTypes = {
  initial_sankey_data : SankeyData
  exemple_menu        : object
  formations_menu      : object
  logo: string
}

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
  sankey: {
    sankey_data_file:RequestInfo
    sous_filieres : { [ key : string ] : string }
    units: string[]
    flask_logo? : string
    flask_header? : string
    logo_width? : number
    legend_average : string
    legend_uncert : string
    help_text : string
    welcome_text: string
    excel : string
    logo: string,
    advanced: boolean
  }
}

export const SankeyApp = ({initial_sankey_data,exemple_menu,formations_menu,logo} : SankeyAppTypes) => {


  //- All
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [style_to_apply, set_style_to_apply] = useState('default')
  const [mode_selection, set_mode_selection] = useState('s')
  const selected_link = useRef(default_link(initial_sankey_data))
  const selected_node = useRef(default_node(initial_sankey_data))
  const multi_selected_nodes = useRef([])
  const multi_selected_links = useRef([])
  const multi_selected_label = useRef([])
  const button_ref = useRef<HTMLLabelElement>(null)
  const accordion_ref = useRef<HTMLDivElement>(null)
  const links_accordion_ref = useRef<HTMLDivElement>(null)
  const nodes_accordion_ref = useRef<HTMLDivElement>(null)
  const [data,set_data] = useState<SankeyData>(initial_sankey_data)

  //- Processess
  const [processing,setProcessing] = useState(false)
  const [failure,setFailure] = useState(false)
  const [not_started,setNotStarted] = useState(true)
  const [path,setPath] = useState('')

  //- Styles
  const [selected_style_link, set_selected_style_link] = useState('default')
  const [selected_style_node, set_selected_style_node] = useState('default')

  //- Modals and Dialogs
  const [welcome_text,set_welcome_text] = useState(window.sankey ? window.sankey.welcome_text : '')
  const [show_draw, set_show_draw] = useState(false)
  const [show_load,set_show_load] = useState(false)
  const [show_excel_dialog, set_show_excel_dialog] = useState(false)
  const [show_apply_layout, set_show_apply_layout] = useState(false)
  const [show_save_json, set_show_save_json] = useState(false)
  const [showPreference, setShowPreference] = useState(false)
  //Modal et fonctions pour l'édition et affectation des styles de noeud
  const [showStyle, setShowStyle] = useState(false)
  const showStyleEdition = () => {
    setShowStyle(true)
  }
  //Modal et fonctions pour l'edition et affectation des style de flux
  const [showStyleLink, setShowStyleLink] = useState(false)
  const showStyleEditionLink = () => {
    setShowStyleLink(true)
  }
  const [showShortcut, setshowShortcut] = useState(false)
  const [show_publish_dialog,set_show_publish_dialog] = useState(false)
  const [showHelp, setshowHelp] = useState(false)
  
  const {t} =useTranslation()

  //Réinitialise data et vide les noeud/liens sélectionnés 
  const reinitialization = () => {
    const data = SankeyUtils.default_sankey_data()
    multi_selected_nodes.current = []
    multi_selected_links.current = []
    multi_selected_label.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('initial_data')
    set_selected_style_node('default')
    set_selected_style_link('default')
    set_data({ ...data })
  }

  const launch = (path:string) => {
    setPath(path)
    set_show_load(true)
    setProcessing(true)
    setFailure(true)
    setNotStarted(false)
  }

  //- 1. Builds Configuration Menus
  //- 1.1 Builds Configuration Menus Layout
  const menu_configuration_layout = OpenSankeyMenuConfigurationLayout(data,set_data)
  //- 1.2 Builds Configuration Menus Node 
  //- 1.2.1 Builds Configuration Menus Node Attributes 
  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(data,set_data,multi_selected_nodes)
  const menu_configuration_nodes = OpenSankeyMenuConfigurationNodes(data,set_data,multi_selected_nodes,menu_configuration_nodes_attributes)
  //- 1.2.1 Builds Configuration Menus Node Tags 
  const menu_configuration_nodes_tags=<SankeySettingsEditionElementTags
    data={data}
    set_data={set_data}
    elementTagNameProp='nodeTags'
    elementNameProp='nodes' />
  //- 1.3 Builds Configuration Menus Links 
  const  menu_configuration_link_tags=<SankeySettingsEditionElementTags
    data={data}
    set_data={set_data}
    elementTagNameProp='fluxTags'
    elementNameProp='links' />
  //- 1.4 Builds Configuration Menus DataTags 
  const  menu_configuration_data_tags=<SankeySettingsEditionElementTags
    data={data}
    set_data={set_data}
    elementTagNameProp='dataTags'
    elementNameProp='links' />
  const [show_nav,set_show_nav] = useState(false)
  //- End of 1.
  const configurations_menus =  OpenSankeyConfigurationsMenus(
    data, set_data,
    nav_item_active,set_nav_item_active,
    nodes_accordion_ref,links_accordion_ref,
    selected_node,multi_selected_nodes,multi_selected_links,selected_link,multi_selected_label,
    style_to_apply,set_style_to_apply,set_show_nav,
    menu_configuration_layout,menu_configuration_nodes_tags, menu_configuration_link_tags, menu_configuration_data_tags,
    menu_configuration_nodes
  )

  //- 2. Build Menus
  const sankey_menus = OpenSankeyMenus(
    t,setShowPreference,reinitialization,set_show_publish_dialog,set_show_apply_layout,set_show_excel_dialog,
    set_show_save_json,showStyleEdition,showStyleEditionLink,
    setshowShortcut,setshowHelp,data,set_data,''
  )
  sankey_menus.splice(2,0,<NavDropdown title={t('Menu.Formations')} id="formation" >
    <ExempleItem 
      exemple_menu={formations_menu as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
      data={data}
      set_data={set_data}
      current_path={'Formations'}
      url_prefix=''
      multi_selected_links={multi_selected_links}
      multi_selected_nodes={multi_selected_nodes}
      multi_selected_label={multi_selected_label}
      launch={launch}
    /></NavDropdown >
  )
  sankey_menus.splice(3,0,<NavDropdown title={t('Menu.Exemples')} id="exemples" >
    <ExempleItem
      exemple_menu={exemple_menu as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
      url_prefix=''
      data={data}
      set_data={set_data}
      current_path={''}
      multi_selected_nodes={multi_selected_nodes}
      multi_selected_links={multi_selected_links}
      multi_selected_label={multi_selected_label}
      launch={launch}
    /></NavDropdown >
  )

  //- 3. Sankey Draws
  useBeforeunload((event : BeforeUnloadEvent) => {
    event.preventDefault()
    localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  })

  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,data,multi_selected_nodes,multi_selected_links,set_data,accordion_ref,button_ref)
  }
  //Event listener sur les touche du clavier
  //Réagis à :
  //-Flêches qui déplace les noeuds sélectionnés
  //-Echape qui ferme la navbar
  //-Ctrl+S qui sauvegarde une vue 
  //document.onkeydown = formatKeyHandler
  document.onkeydown = formatKeyHandler

  return (
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <>
        <Menu 
          data={data} 
          set_data={set_data}
          show_nav={show_nav}
          set_show_nav={set_show_nav}
          nav_item_active={nav_item_active}
          callback={()=>null}
          path={path}
          launch={launch}
          url_prefix={ ''}
          logo={!window.SankeyToolsStatic ? logo.replace('static/', 'static/opensankey/') : window.sankey.logo as string}
          logo_width={!window.SankeyToolsStatic ? 100 : window.sankey.logo_width}       
          app_name={!window.SankeyToolsStatic ? 'Pré-version 1.0' : ''}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
          style_to_apply={style_to_apply}
          set_style_to_apply={set_style_to_apply}
          set_current_filter={(
            new_current_filter: number
          ) => {
            const { display_style } = data
            display_style.filter = +new_current_filter
            set_data({ ...data })
          }}
          selected_node={selected_node}
          accordion_ref={accordion_ref as {current : HTMLDivElement}}
          button_ref={button_ref as {current : HTMLLabelElement}}   
          selected_link={selected_link}
          show_load={show_load}
          set_show_load={set_show_load}
          processing={processing}
          setProcessing={setProcessing}
          failure={failure}
          setFailure={setFailure}
          not_started={not_started}
          setNotStarted={setNotStarted}
          configurations_menus={configurations_menus}
          menus={sankey_menus}
          show_excel_dialog={show_excel_dialog}
          show_apply_layout={show_apply_layout}
          show_save_json={show_save_json}
          showPreference={showPreference}
          showStyleNode={showStyle}
          show_publish_dialog={show_publish_dialog}
          showHelp={showHelp}
          setshowHelp={setshowHelp}
          selected_style_node={selected_style_node}
          selected_style_link={selected_style_link}
          showStyleLink={showStyleLink}
          showShortcut={showShortcut}
          setshowShortcut={setshowShortcut}
          set_show_excel_dialog={set_show_excel_dialog}
          set_show_apply_layout={set_show_apply_layout}
          set_show_save_json={set_show_save_json}
          setShowPreference={setShowPreference}
          set_selected_style_link={set_selected_style_link}
          set_selected_style_node={set_selected_style_node}
          set_show_publish_dialog={set_show_publish_dialog}
          setShowStyleNode={setShowStyle}
          setShowStyleLink={setShowStyleLink}
        />
        {//Ajout d'un delay pour laisser le temps au Menu de render pour ensuite utiliser sa hauteur afin d'ajouter un margin top au draw
        }
        {useEffect(() => {
          const timer = setTimeout(() => {
            set_show_draw(true)
          }, 100)
          return () => clearTimeout(timer)
        }, [])}
        {
          (show_draw ) ? (<SankeyDraw
            data={data}
            set_data={set_data}
            multi_selected_nodes={multi_selected_nodes}
            multi_selected_label={multi_selected_label}
            multi_selected_links={multi_selected_links}
            accordion_ref={accordion_ref}
            nodes_accordion_ref={nodes_accordion_ref}
            links_accordion_ref={links_accordion_ref}
            button_ref={button_ref}   
            select_node={(n: SankeyNode) => {
              selected_node.current = n
            }}
            node_arrow_visible={
              (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!data.links[n.inputLinksId[0]].arrow) ? false : true
            }

            select_link={(l: SankeyLink) => {
              selected_link.current = l
            }}
            link_text = { link_text }
            nodeTooltipsContent={nodeTooltipsContent }
            linkTooltipsContent={linkTooltipsContent }
            mode_selection={mode_selection}
            set_mode_selection={set_mode_selection}
          />) : (<></>)}
        <Modal 
          bsSize="large" 
          show={welcome_text !== undefined && welcome_text !== ''} 
          onHide={()=>{
            set_welcome_text('')
          }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Modal.Header closeButton>
            <Modal.Title>Lisez Moi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {welcome_text ? parse(welcome_text) : ''}
            <Button 
              onClick={()=>{
                set_welcome_text('')
              }}
            >J&apos;ai lu</Button>
          </Modal.Body>
        </Modal>
      </>
    </div>
  )
}

export default SankeyApp



