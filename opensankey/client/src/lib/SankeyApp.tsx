import React, { FunctionComponent, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import SankeyLinkContextMenu from './SankeyLinkContextMenu'
import SankeyNodeContextMenu from './SankeyNodeContextMenu'
import SankeyEdition from './SankeyEdition'
import { SankeySettingsEdition, SankeySettingsEditionTags } from './SankeySettingsEdition'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeyLinkEdition from './SankeyLinkEdition'
import Menu from './SankeyMenu'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import * as SankeyUtils from './SankeyUtils'
import { Row, Col } from 'react-bootstrap'

const SankeyAppPropTypes = {
  sankey_data: PropTypes.shape(SankeyDataPropTypes).isRequired,
}

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp: FunctionComponent<SankeyAppTypes> = ({ sankey_data }) => {
  const [show_nav, set_show_nav] = useState(false)
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [show_node_context, set_show_node_context] = useState(false)
  const [show_link_context, set_show_link_context] = useState(false)
  const [selected_link, set_selected_link] = useState(SankeyUtils.default_link())
  const [selected_node, set_selected_node] = useState(SankeyUtils.default_node())
  const [radio_selected, set_radio_selected] = useState<string>('local')
  const [data, set_data] = useState<SankeyData>(sankey_data)
  const [agregation_level,set_agregation_level] = useState(0)

  const display_links = data.links
  
  return (
    <div style={{ 'backgroundColor': 'WhiteSmoke' }}>
      <Menu
        data={data}
        set_data={set_data}
        app_name='Open-Sankey'
        set_show_nav={set_show_nav}
        show_nav={show_nav}
        set_nav_item_active={set_nav_item_active}
        nav_item_active={nav_item_active}
        set_selected_node={set_selected_node}
        selected_node={selected_node}
        set_selected_link={set_selected_link}
        selected_link={selected_link}
        radio_selected={radio_selected}
        set_radio_selected={set_radio_selected}
        agregation_level={agregation_level}
        set_agregation_level={set_agregation_level}
        url_prefix=''
        getValueIndex={() => 0 }
        settings_edition= {
          <SankeySettingsEdition
            data={data}
            set_data={set_data}
            set_current_filter={(
              new_current_filter: number
            ) => {
              const { display_style } = data
              display_style.filter = +new_current_filter
              set_data({ ...data })
            }}
            getValueIndex={() => 0 }
          />
        }
        node_edition= {
          <SankeyNodeEdition
            data={data}
            set_data={set_data}
            selected_node={selected_node}
            radio_selected={radio_selected}
            getValueIndex={() => 0 }
          />
        }
        link_edition={
          <SankeyLinkEdition
            show={true}
            data={data}
            set_data={set_data}
            selected_link={selected_link}
            getValueIndex={() => 0 }
          />
        }
        settings_edition_tags = {
          <SankeySettingsEditionTags
            data={data}
            set_data={set_data}
            getValueIndex={() => 0}
          />
        }
      />
      <Row>
        <Col sm={11} style={{ 'color': 'black' }} >
          <SankeyEdition
            data={data}
            set_data={set_data} />
        </Col>
      </Row>
      <SankeyDraw
        data={data}
        set_data={set_data}
        select_node={(n: SankeyNode) => {
          set_selected_node(n)
        }}
        nodeContextMenu={(n: SankeyNode) => {
          set_selected_node(n)
          set_show_node_context(true)
        }}
        node_arrow_visible={
          (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!display_links[n.inputLinksId[0]].arrow) ? false : true
        }
        select_link={(l: SankeyLink) => {
          set_selected_link(l)
        }}
        linkContextMenu={(l: SankeyLink) => {
          set_selected_link(l)
          set_show_link_context(true)
        }}
        link_color={l => l.color}
        node_color={n => n.color}
        link_text={SankeyUtils.link_text}
        link_visible={(l: SankeyLink) => {
          if ( !data.nodes[l.idSource].node_visible || !data.nodes[l.idTarget].node_visible ) {
            return false
          }
          if ( data.display_style.null_flux ) {
            return true
          }
          if (l.value[0] === 0 ) {
            return false
          }
          return true
        }}
        test_link_value={ (nodes: { [node_id : string] : SankeyNode }, d: SankeyLink, /*selected_tags: string[]*/) => {
          return d.value[0]
        }}
        set_show_nav={set_show_nav}
        set_nav_item_active={set_nav_item_active}
        nodeTooltipsContent={nodeTooltipsContent}
        linkTooltipsContent={linkTooltipsContent}
        getValueIndex={() => 0 } 
      />
      <SankeyNodeContextMenu
        data={data}
        set_data={set_data}
        show={show_node_context}
        closeNodeContextMenu={() => {
          set_show_node_context(false)
        }}
        selected_node={selected_node}
      />
      <SankeyLinkContextMenu
        data={data}
        set_data={set_data}
        show={show_link_context}
        closeLinkContextMenu={() => {
          set_show_link_context(false)
        }}
        selected_link={selected_link} />
    </div >
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp