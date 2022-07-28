import React, { FunctionComponent, useState, useEffect, Validator } from 'react'
import PropTypes, { InferProps,ReactElementLike } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import { SankeySettingsEdition } from './SankeySettingsEdition'
import { SankeySettingsEditionElementTags, SankeySettingsEditionDataTags } from './SankeySettingsEditionTags'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeyLinkEdition from './SankeyLinkEdition'
import Menu, { ExempleItem, ArtefactsItem, processExample } from './SankeyMenu'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import * as SankeyUtils from './SankeyUtils'
import { Dropdown } from 'react-bootstrap'
import GoogleFontLoader from 'react-google-font-loader'

let logo = ''
try {
  logo = require('../css/opensankey.png')
} catch (expt) {
  console.log('opensankey.png not found')
}

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      advanced?: boolean
      logo?: string,
    }
  }

const SankeyAppPropTypes = {
  sankey_data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  exemple_menu: PropTypes.object.isRequired,
  artefacts_menu: PropTypes.object.isRequired
}

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp: FunctionComponent<SankeyAppTypes> = ({ sankey_data, exemple_menu, artefacts_menu }) => {
  const default_node = SankeyUtils.default_node(sankey_data)
  const start_link = (Object.keys(sankey_data.links).length == 0) ? SankeyUtils.default_link(sankey_data) : sankey_data.links[Object.keys(sankey_data.links)[0]]
  const [show_nav, set_show_nav] = useState(false)
  const [show_toast, set_show_toast] = useState(false)
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
  const [selected_link, set_selected_link] = useState(start_link)
  const [data, set_data] = useState<SankeyData>(sankey_data)
  const [selected_node, set_selected_node] = useState(default_node)
  const [multi_selected_nodes, set_multi_selected_nodes] = useState([])
  const [multi_selected_links, set_multi_selected_links] = useState([])
  const [multi_selected_label, set_multi_selected_label] = useState([])

  const [radio_selected] = useState<string>('local')

  const [show_draw, set_show_draw] = useState(false)
  const [mode_selection, set_mode_selection] = useState('s')

  const [view, set_view] = useState('none')
  const [style_to_apply, set_style_to_apply] = useState('default')

  const display_links = data.links

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
        app_name={!window.SankeyToolsStatic ? 'version beta 0.9' : ''}
        set_current_filter={(
          new_current_filter: number
        ) => {
          const { display_style } = data
          display_style.filter = +new_current_filter
          set_data({ ...data })
        }}
        example_menu={<>
          <Dropdown.Item eventKey="data_repo" href="http://open-sankey.fr/fm/index.html" target="_blank">Données</Dropdown.Item>
          <ExempleItem
            exemple_menu={exemple_menu as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
            url_prefix=''
            data={data}
            set_data={set_data}
            current_path={''}
            set_multi_selected_nodes={set_multi_selected_nodes}
            set_multi_selected_links={set_multi_selected_links}
            set_multi_selected_label={set_multi_selected_label}
            callback={processExample}
          /></>}
        portfolio_menu={<>
          <ArtefactsItem
            artefacts_menu={artefacts_menu as unknown as Validator<ReactElementLike[]> | Validator<{ [x: string]: ReactElementLike[]; }>}
            current_path={''}
          /></>}
        logo={!window.SankeyToolsStatic ? logo.replace('static/', 'static/opensankey/') : window.sankey.logo as string}
        set_show_nav={set_show_nav}
        show_nav={show_nav}
        set_show_toast={set_show_toast}
        show_toast={show_toast}
        set_nav_item_active={set_nav_item_active}
        nav_item_active={nav_item_active}
        set_sub_nav_item_active={set_sub_nav_item_active}
        sub_nav_item_active={sub_nav_item_active}
        set_selected_node={set_selected_node}
        selected_node={selected_node}
        set_multi_selected_nodes={set_multi_selected_nodes}
        multi_selected_nodes={multi_selected_nodes}
        set_multi_selected_links={set_multi_selected_links}
        multi_selected_links={multi_selected_links}
        set_selected_link={set_selected_link}
        multi_selected_label={multi_selected_label}
        set_multi_selected_label={set_multi_selected_label}

        selected_link={selected_link}
        url_prefix=''
        settings_edition={
          <SankeySettingsEdition
            data={data}
            set_data={set_data}
          />
        }
        node_edition={
          <SankeyNodeEdition
            data={data}
            set_data={set_data}
            radio_selected={radio_selected}
            set_multi_selected_nodes={set_multi_selected_nodes}
            multi_selected_nodes={multi_selected_nodes}
          />
        }
        link_edition={
          <SankeyLinkEdition
            show={true}
            data={data}
            set_data={set_data}
            selected_link={selected_link}
            multi_selected_links={multi_selected_links}
          />
        }
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

          set_multi_selected_nodes={set_multi_selected_nodes}
          multi_selected_nodes={multi_selected_nodes}

          set_multi_selected_label={set_multi_selected_label}
          multi_selected_label={multi_selected_label}

          set_multi_selected_links={set_multi_selected_links}
          multi_selected_links={multi_selected_links}

          select_node={(n: SankeyNode) => {
            set_selected_node(n)
          }}
          node_arrow_visible={
            (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!display_links[n.inputLinksId[0]].arrow) ? false : true
          }
          select_link={(l: SankeyLink) => {
            set_selected_link(l)
          }}
          link_text={SankeyUtils.link_text}
          test_link_value={SankeyUtils.test_link_value}
          set_show_nav={set_show_nav}
          set_nav_item_active={set_nav_item_active}
          set_sub_nav_item_active={set_sub_nav_item_active}
          nodeTooltipsContent={nodeTooltipsContent}
          linkTooltipsContent={linkTooltipsContent}
          set_show_toast={set_show_toast}
          current={true}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
          view={view}
          set_view={set_view}
        />) : (<></>)
      }


    </div >
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp