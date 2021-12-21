import React, { FunctionComponent, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import SankeyLinkContextMenu from './SankeyLinkContextMenu'
import SankeyNodeContextMenu from './SankeyNodeContextMenu'
import SankeyEdition from './SankeyEdition'
import { SankeySettingsEdition, SankeySettingsEditionTags, SankeySettingsEditionTagsLinks } from './SankeySettingsEdition'
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
  const start_link = (Object.keys(sankey_data.links).length == 0) ? SankeyUtils.default_link(sankey_data) : sankey_data.links[Object.keys(sankey_data.links)[0]]
  const [show_nav, set_show_nav] = useState(false)
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [show_node_context, set_show_node_context] = useState(false)
  const [show_link_context, set_show_link_context] = useState(false)
  // const [selected_link, set_selected_link] = useState(SankeyUtils.default_link(sankey_data))
  const [selected_link, set_selected_link] = useState(start_link)
  const [selected_node, set_selected_node] = useState(SankeyUtils.default_node())
  const [radio_selected, set_radio_selected] = useState<string>('local')
  const [data, set_data] = useState<SankeyData>(sankey_data)
  const [agregation_level, set_agregation_level] = useState(0)

  //Selectionne le premier flux par default si il y en a un 
  /*  if(Object.keys(sankey_data.links).length!=0){
     set_selected_link(sankey_data.links[Object.keys(sankey_data.links)[0]])
   } */


  const display_links = data.links

  const getValueIndex = (
    data: SankeyData
  ) => {
    let region_index = 0
    const regions_tags_group = data.tags_catalog['Regions']
    if (regions_tags_group) {
      Object.entries(regions_tags_group.tags).forEach((tag, i) => {
        if (tag[1].selected) {
          region_index = i
        }
      })
    }
    let period_index = 0
    const periods_tags_group = data.tags_catalog['Periods']
    if (periods_tags_group) {
      Object.entries(periods_tags_group.tags).forEach((tag, i) => {
        if (tag[1].selected) {
          period_index = i
        }
      })
      return region_index * Object.keys(periods_tags_group).length + period_index
    }
    return region_index
  }

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
        agregation_level={agregation_level}
        set_agregation_level={set_agregation_level}
        url_prefix=''
        getValueIndex={getValueIndex}
        settings_edition={
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
            getValueIndex={getValueIndex}
          />
        }
        node_edition={
          <SankeyNodeEdition
            data={data}
            set_data={set_data}
            selected_node={selected_node}
            radio_selected={radio_selected}
            getValueIndex={getValueIndex}
          />
        }
        link_edition={
          <SankeyLinkEdition
            show={true}
            data={data}
            set_data={set_data}
            selected_link={selected_link}
            getValueIndex={getValueIndex}
          />
        }
        settings_edition_tags={
          <SankeySettingsEditionTags
            data={data}
            set_data={set_data}
            getValueIndex={getValueIndex}
          />
        }
        settings_edition_tags_links={
          <SankeySettingsEditionTagsLinks
            data={data}
            set_data={set_data}
            getValueIndex={getValueIndex}
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
          // set_show_node_context(true)
          set_show_node_context(false)
        }}
        node_arrow_visible={
          (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!display_links[n.inputLinksId[0]].arrow) ? false : true
        }
        select_link={(l: SankeyLink) => {
          set_selected_link(l)
        }}
        linkContextMenu={(l: SankeyLink) => {
          set_selected_link(l)
          // set_show_link_context(true)
          set_show_link_context(false)
        }}
        link_color={l => l.color}
        //node_color={n => n.color}
        node_color={n => {
          let colorNode
          // Le couleur est définie dans l'onglet général
          if (n.node_parameter === 'general') {
            colorNode = '#808080'
          }
          if (n.node_parameter === 'groupTag') {
            // Le couleur est définie dans les parametres du groupTag pour le favoriteTag
            // on controle ici qu'il y a bien un favorite tag
            if (n.tag_favorite['tagGroup'] !== undefined) {
              const tagGroup = n.tag_favorite['tagGroup']
              const tagElement = n.tag_favorite['tagElement']
              colorNode = data.tags_catalog[tagGroup].tags[tagElement].color
            }

          }
          if (n.node_parameter === 'local') {
            // Le couleur est définie dans les parametres locaux du noeud
            colorNode = n.color
          }

          return colorNode
        }}
        link_text={SankeyUtils.link_text}
        link_visible={(l: SankeyLink) => {
          if (!data.nodes[l.idSource].node_visible || !data.nodes[l.idTarget].node_visible) {
            return false
          }
          if (data.display_style.null_flux) {
            return true
          }
          if (l.value[0] === 0) {
            return false
          }
          return true
        }}
        /* test_link_value_init={ (nodes: { [node_id : string] : SankeyNode }, d: SankeyLink, selected_tags: string[]) => {
          return d.value[getValueIndex(data)]
        }} */

        test_link_value={(nodes: { [node_id: string]: SankeyNode }, d: SankeyLink) => {
          const { dataTags } = data
          let val = d.valueV2 as any
          const listKey = [] as any
          /* console.log(val)
          console.log(dataTags) */

          //Récupère la liste des tags selectionné pour chaque dataTags ayant au moins un groupe tag
          Object.values(dataTags).filter(d => { return (Object.keys(d.tags).length != 0) ? true : false }).map(d => {
            listKey.push(Object.values(d.tags).filter(dd => { return dd['selected'] })[0]['name'])
          })

          for (const i in listKey) {
            val = val[listKey[i]]
          }
          return val['value']
        }}
        set_show_nav={set_show_nav}
        set_nav_item_active={set_nav_item_active}
        nodeTooltipsContent={nodeTooltipsContent}
        linkTooltipsContent={linkTooltipsContent}
        getValueIndex={getValueIndex}
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