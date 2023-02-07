import React, { FunctionComponent, useState, useRef, useEffect, Validator } from 'react'
import PropTypes, { InferProps,ReactElementLike } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import { SankeySettingsEdition } from './SankeySettingsEdition'
import { SankeySettingsEditionElementTags } from './SankeySettingsEditionTags'
import Menu, { ExempleItem } from './SankeyMenu'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import * as SankeyUtils from './SankeyUtils'
import GoogleFontLoader from 'react-google-font-loader'
import { useBeforeunload } from 'react-beforeunload'
import LZString from 'lz-string'
import { keyHandler } from './SankeyDrawFunction'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      advanced?: boolean
      logo?: string,
      logo_width: number
    }
  }

const SankeyAppPropTypes = {
  sankey_data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  exemple_menu: PropTypes.object.isRequired,
  formations_menu: PropTypes.object.isRequired,
  logo: PropTypes.string.isRequired,
}

export const settings_edition = (
  data:SankeyData,
  set_data :(data:SankeyData)=>void,
) => {
  return <SankeySettingsEdition 
    data={data} 
    set_data={set_data}
  />
}

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp: FunctionComponent<SankeyAppTypes> = ({ sankey_data, exemple_menu,formations_menu,logo }) => {
  const default_node = SankeyUtils.default_node(sankey_data)
  const start_link = (Object.keys(sankey_data.links).length == 0) ? SankeyUtils.default_link(sankey_data) : sankey_data.links[Object.keys(sankey_data.links)[0]]

  const selected_link = useRef(start_link)
  const [data, set_data] = useState<SankeyData>(sankey_data)
  const selected_node = useRef(default_node)
  const multi_selected_nodes = useRef([])
  const multi_selected_links = useRef([])
  const multi_selected_label = useRef([])
  const button_ref = useRef<HTMLLabelElement>(null)
  const accordion_ref = useRef<HTMLDivElement>(null)
  const links_accordion_ref = useRef<HTMLDivElement>(null)
  const nodes_accordion_ref = useRef<HTMLDivElement>(null)
  const [nav_item_active, set_nav_item_active] = useState<string>('')

  const [show_draw, set_show_draw] = useState(false)
  const [mode_selection, set_mode_selection] = useState('s')
  const [style_to_apply, set_style_to_apply] = useState('default')

  const display_links = data.links

  const [show_load,set_show_load] = useState(false)
  const [processing,setProcessing] = useState(false)
  const [failure,setFailure] = useState(false)
  const [not_started,setNotStarted] = useState(true)
  const [path,setPath] = useState('')

  const launch = (path:string) => {
    setPath(path)
    set_show_load(true)
    setProcessing(true)
    setFailure(true)
    setNotStarted(false)
  }
  
  // Reformat la fonction pour qu'elle puisse être envoyé à document.onkeydown qui n'accepte les fonction que si elles ont pour paramètres
  //  event de type KeyBoardEvent
  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,data,multi_selected_nodes,multi_selected_links,set_data,accordion_ref,button_ref)
  }
  //Event listener sur les touche du clavier
  //Réagis à :
  //-Flêches qui déplace les noeuds sélectionnés
  //-Echape qui ferme la navbar
  //-Ctrl+S qui sauvegarde une vue 
  document.onkeydown = formatKeyHandler

  useBeforeunload((event : BeforeUnloadEvent) => {
    event.preventDefault()
    localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  })

  return (

    <div style={{ 'backgroundColor': 'WhiteSmoke' }}>
      <GoogleFontLoader
        fonts={data.display_style.font_family.map((d) => {
          return { 'font': d }
        })}
      />
      <Menu
        data={data}
        set_data={set_data}
        show_menu={true}
        app_name={!window.SankeyToolsStatic ? 'Pré-version 1.0' : ''}
        set_current_filter={(
          new_current_filter: number
        ) => {
          const { display_style } = data
          display_style.filter = +new_current_filter
          set_data({ ...data })
        }}
        callback={()=>0}
        launch={launch}
        nav_item_active={nav_item_active}
        set_nav_item_active={set_nav_item_active}
        formations_menu={<>
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
          /></>}
        example_menu={<>
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
          /></>}
        logo={!window.SankeyToolsStatic ? logo.replace('static/', 'static/opensankey/') : window.sankey.logo as string}
        logo_width={!window.SankeyToolsStatic ? 100 : window.sankey.logo_width}        
        selected_node={selected_node}
        multi_selected_nodes={multi_selected_nodes}
        multi_selected_links={multi_selected_links}
        multi_selected_label={multi_selected_label}
        accordion_ref={accordion_ref}
        nodes_accordion_ref={nodes_accordion_ref}
        links_accordion_ref={links_accordion_ref}
        button_ref={button_ref}        
        selected_link={selected_link}
        url_prefix=''
        path={path}
        settings_edition={settings_edition(data,set_data)}
        node_edition={null}
        link_edition={null}
        settings_edition_node_tags={
          <SankeySettingsEditionElementTags
            data={data}
            set_data={set_data}
            elementTagNameProp='nodeTags'
            elementNameProp='nodes'
          />
        }
        settings_edition_link_tags={
          <SankeySettingsEditionElementTags
            data={data}
            set_data={set_data}
            elementTagNameProp='fluxTags'
            elementNameProp='links'
          />
        }
        settings_edition_data_tags={
          <SankeySettingsEditionElementTags
            data={data}
            set_data={set_data}
            elementTagNameProp='dataTags'
            elementNameProp='links'
          />
        }
        views_item={false}
        mode_selection={mode_selection}
        set_mode_selection={set_mode_selection}
        style_to_apply={style_to_apply}
        set_style_to_apply={set_style_to_apply}
        show_load={show_load}
        set_show_load={set_show_load}
        processing={processing}
        setProcessing={setProcessing}
        failure={failure}
        setFailure={setFailure}
        not_started={not_started}
        setNotStarted={setNotStarted}    
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
        (show_draw) ? (<SankeyDraw
          data={data}
          set_data={set_data}

          multi_selected_nodes={multi_selected_nodes}
          multi_selected_label={multi_selected_label}
          multi_selected_links={multi_selected_links}

          select_node={(n: SankeyNode) => {
            selected_node.current = n
          }}
          node_arrow_visible={
            (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!display_links[n.inputLinksId[0]].arrow) ? false : true
          }
          select_link={(l: SankeyLink) => {
            selected_link.current = l
          }}
          link_text={SankeyUtils.link_text}
          nodeTooltipsContent={nodeTooltipsContent}
          linkTooltipsContent={linkTooltipsContent}
          button_ref={button_ref}
          accordion_ref={accordion_ref}
          nodes_accordion_ref={nodes_accordion_ref}
          links_accordion_ref={links_accordion_ref}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
        />) : (<></>)
      }


    </div >
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp