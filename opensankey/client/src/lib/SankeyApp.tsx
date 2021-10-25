import React, { FunctionComponent, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import SankeyEdition from './SankeyEdition'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import SankeyLinkEdition from './SankeyLinkEdition'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeySettingsEdition from './SankeySettingsEdition'
import SankeyLinkContextMenu from './SankeyLinkContextMenu'
import SankeyNodeContextMenu from './SankeyNodeContextMenu'
import Menu from './SankeyMenu'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import * as SankeyUtils from './SankeyUtils'

const SankeyAppPropTypes = {
  sankey_data: PropTypes.shape(SankeyDataPropTypes).isRequired,
}

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp: FunctionComponent<SankeyAppTypes> = ({ sankey_data }) => {
  const [show_node, set_show_node] = useState(false)
  const [show_link, set_show_link] = useState(false)
  const [show_graphic_attributes, set_show_graphic_attributes] = useState(false)
  const [show_node_context, set_show_node_context] = useState(false)
  const [show_link_context, set_show_link_context] = useState(false)
  const [selected_link, set_selected_link] = useState(0)
  const [selected_node, set_selected_node] = useState(0)
  const [data, set_data] = useState<SankeyData>(sankey_data)

  let region_index = 0
  const tags_group = sankey_data.tags_catalog.filter(tags_group => tags_group.group_name === 'Regions')
  if (tags_group.length > 1) {
    region_index = tags_group[0].tags.indexOf(tags_group[0].selected_tags[0])
  }

  return (
    <div style={{ 'backgroundColor': 'WhiteSmoke' }}>
      <Menu
        data={data}
        set_data={set_data}
        app_name='Open-Sankey'
        url_prefix=''
      />
      <Row>
        <Col sm={11} style={{ 'color': 'black' }} >
          <SankeyEdition
            data={data}
            set_selected_node={set_selected_node}
            set_selected_link={set_selected_link}
            set_show_link={set_show_link}
            set_show_graphic_attributes={set_show_graphic_attributes}
            set_data={set_data} />
        </Col>
      </Row>
      <SankeyDraw
        data={data}
        select_node={(i: number) => {
          set_selected_node(i)
          set_show_node(true)
        }}
        nodeContextMenu={(i: number) => {
          set_selected_node(i)
          set_show_node_context(true)
        }}
        node_visible={
          (n: SankeyNode) => n.visible ? 'visible' : 'hidden'
        }
        node_label_visible={
          (n: SankeyNode) => n.label_visible ? 'visible' : 'hidden'
        }
        node_arrow_visible={
          (n: SankeyNode) => (n.input_links.length === 0) || (!data.links[n.input_links[0]].arrow) ? false : true
        }
        select_link={(i: number) => {
          set_selected_link(i)
          set_show_link(true)
        }}
        linkContextMenu={(i: number) => {
          set_selected_link(i)
          set_show_link_context(true)
        }}
        link_color={l => l.color}
        node_color={n => n.color}
        link_text={SankeyUtils.link_text}
        link_visible={(l: SankeyLink) => {
          (l.visible && (l.value[region_index] >= Math.max(data.display_style.filter, data.display_style.filter_label))) ? 'visible' : 'hidden'
        }}
        test_link_value={
          (nodes: SankeyNode[], d: SankeyLink, /*selected_tags: string[]*/) => d.value[region_index]
        }
        more_processing={() => void 0}
        redraw_node={() => void 0}
        nodeTooltipsContent={nodeTooltipsContent}
        linkTooltipsContent={linkTooltipsContent}
      />
      <SankeyNodeEdition
        show={show_node}
        data={data}
        set_data={set_data}
        set_show_node={set_show_node}
        selected_node={selected_node}
      />
      <SankeyLinkEdition
        show={show_link}
        data={data}
        set_data={set_data}
        set_show_link={set_show_link}
        selected_link={selected_link}
      />
      <SankeySettingsEdition
        show={show_graphic_attributes}
        set_show_graphic_attributes={set_show_graphic_attributes}
        data={data}
        set_data={set_data}
        set_current_filter={(
          new_current_filter: number
        ) => {
          const { display_style } = data
          display_style.filter = +new_current_filter
          set_data({ ...data })
        }}
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
    </div>
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp