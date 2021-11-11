import React, { FunctionComponent, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import SankeyLinkContextMenu from './SankeyLinkContextMenu'
import SankeyNodeContextMenu from './SankeyNodeContextMenu'
import SankeyEdition from './SankeyEdition'
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
  const [selected_link, set_selected_link] = useState(0)
  const [selected_node, set_selected_node] = useState(0)
  const [data, set_data] = useState<SankeyData>(sankey_data)
  const [selected_id_link, set_selected_id_link] = useState<string>('')

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
        set_selected_id_link={set_selected_id_link}
        selected_id_link={selected_id_link}
        url_prefix=''
        getValueIndex={() => 0 }
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
        select_node={(i: number) => {
          set_selected_node(i)
          //set_show_node(true)
        }}
        nodeContextMenu={(i: number) => {
          set_selected_node(i)
          set_show_node_context(true)
        }}
        node_label_visible={
          (n: SankeyNode) => n.label_visible ? 'visible' : 'hidden'
        }
        node_arrow_visible={
          (n: SankeyNode) => !n.visible || (n.input_links.length === 0) || (!data.links[n.input_links[0]].arrow) ? false : true
        }
        select_link={(i: number) => {
          set_selected_link(i)
          //set_show_link(true)
        }}
        linkContextMenu={(i: number) => {
          set_selected_link(i)
          set_show_link_context(true)
        }}
        link_color={l => l.color}
        node_color={n => n.color}
        link_text={SankeyUtils.link_text}
        link_visible={(l: SankeyLink) => l.visible }
        test_link_value={ (nodes: SankeyNode[], d: SankeyLink, /*selected_tags: string[]*/) => {
          return d.value[0]
        }}
        more_processing={() => void 0}
        //redraw_node={() => void 0}
        set_show_nav={set_show_nav}
        set_nav_item_active={set_nav_item_active}
        set_selected_id_link={set_selected_id_link}
        selected_id_link={selected_id_link}
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