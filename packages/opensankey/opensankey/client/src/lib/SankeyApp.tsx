import React, { FunctionComponent, useState, useRef, useEffect, Validator } from 'react'
import PropTypes, { InferProps,ReactElementLike } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import { SankeySettingsEdition } from './SankeySettingsEdition'
import { SankeySettingsEditionElementTags, SankeySettingsEditionDataTags } from './SankeySettingsEditionTags'
// import SankeyNodeEdition from './SankeyNodeEdition'
// import SankeyLinkEdition from './SankeyLinkEdition'
import Menu, { ExempleItem } from './SankeyMenu'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import * as SankeyUtils from './SankeyUtils'
import GoogleFontLoader from 'react-google-font-loader'
import { useBeforeunload } from 'react-beforeunload'
import LZString from 'lz-string'

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

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp: FunctionComponent<SankeyAppTypes> = ({ sankey_data, exemple_menu,formations_menu,logo }) => {
  const default_node = SankeyUtils.default_node(sankey_data)
  const start_link = (Object.keys(sankey_data.links).length == 0) ? SankeyUtils.default_link(sankey_data) : sankey_data.links[Object.keys(sankey_data.links)[0]]
  // const [show_nav, set_show_nav] = useState(false)
  const [show_toast, set_show_toast] = useState(false)
  // const [nav_item_active, set_nav_item_active] = useState<string>('')
  // const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
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

  const [show_draw, set_show_draw] = useState(false)
  const [mode_selection, set_mode_selection] = useState('s')

  const [view, set_view] = useState('none')
  const [style_to_apply, set_style_to_apply] = useState('default')

  const display_links = data.links

  const [mode_visualisation, set_mode_visualisation] = useState(false)
  
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
        app_name={!window.SankeyToolsStatic ? 'Pré-version 1.0' : ''}
        set_current_filter={(
          new_current_filter: number
        ) => {
          const { display_style } = data
          display_style.filter = +new_current_filter
          set_data({ ...data })
        }}
        callback={()=>0}
        formations_menu={<>
          <ExempleItem 
            exemple_menu={formations_menu as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
            data={data}
            set_data={set_data}
            current_path={'Formations'}
            url_prefix='/opensankey/'
            multi_selected_links={multi_selected_links}
            multi_selected_nodes={multi_selected_nodes}
            multi_selected_label={multi_selected_label}
            callback={()=>0}
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
            callback={()=>0}
          /></>}
        logo={!window.SankeyToolsStatic ? logo.replace('static/', 'static/opensankey/') : window.sankey.logo as string}
        logo_width={!window.SankeyToolsStatic ? 100 : window.sankey.logo_width}        
        set_show_toast={set_show_toast}
        show_toast={show_toast}
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
        settings_edition={
          <SankeySettingsEdition
            data={data}
            set_data={set_data}
          />
        }
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
          <SankeySettingsEditionDataTags
            data={data}
            set_data={set_data}
          />
        }
        view={view}
        set_view={set_view}
        mode_selection={mode_selection}
        set_mode_selection={set_mode_selection}
        style_to_apply={style_to_apply}
        set_style_to_apply={set_style_to_apply}
        mode_visualisation={mode_visualisation}
        set_mode_visualisation={set_mode_visualisation}

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
        (show_draw && view == 'none') ? (<SankeyDraw
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
          // test_link_value={SankeyUtils.test_link_value}
          nodeTooltipsContent={nodeTooltipsContent}
          linkTooltipsContent={linkTooltipsContent}
          set_show_toast={set_show_toast}
          button_ref={button_ref}
          accordion_ref={accordion_ref}
          nodes_accordion_ref={nodes_accordion_ref}
          links_accordion_ref={links_accordion_ref}
          current={true}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
          view={view}
          set_view={set_view}
          mode_visualisation={mode_visualisation}
        />) : (<></>)
      }


    </div >
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp