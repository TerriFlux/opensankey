import React, { FunctionComponent, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes, SankeyLink, SankeyLinkValue, SankeyLinkValueDict, SankeyNode } from './types'
import SankeyEdition from './SankeyEdition'
import { SankeySettingsEdition, SankeySettingsEditionTags, SankeySettingsEditionTagsLinks } from './SankeySettingsEdition'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeyLinkEdition from './SankeyLinkEdition'
import Menu from './SankeyMenu'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import * as SankeyUtils from './SankeyUtils'
import { Row, Col } from 'react-bootstrap'
import { getLinkValue } from './SankeyUtils'

const SankeyAppPropTypes = {
  sankey_data: PropTypes.shape(SankeyDataPropTypes).isRequired,
}

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp: FunctionComponent<SankeyAppTypes> = ({ sankey_data }) => {
  const start_link = (Object.keys(sankey_data.links).length == 0) ? SankeyUtils.default_link(sankey_data) : sankey_data.links[Object.keys(sankey_data.links)[0]]
  const [show_nav, set_show_nav] = useState(false)
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [selected_link, set_selected_link] = useState(start_link)
  const [selected_node, set_selected_node] = useState(SankeyUtils.default_node())
  const [radio_selected] = useState<string>('local')
  const [data, set_data] = useState<SankeyData>(sankey_data)
  const [agregation_level, set_agregation_level] = useState(0)

  //Selectionne le premier flux par default si il y en a un 
  /*  if(Object.keys(sankey_data.links).length!=0){
     set_selected_link(sankey_data.links[Object.keys(sankey_data.links)[0]])
   } */


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
        agregation_level={agregation_level}
        set_agregation_level={set_agregation_level}
        url_prefix=''
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
          />
        }
        node_edition={
          <SankeyNodeEdition
            data={data}
            set_data={set_data}
            selected_node={selected_node}
            radio_selected={radio_selected}
          />
        }
        link_edition={
          <SankeyLinkEdition
            show={true}
            data={data}
            set_data={set_data}
            selected_link={selected_link}
          />
        }
        settings_edition_tags={
          <SankeySettingsEditionTags
            data={data}
            set_data={set_data}
          />
        }
        settings_edition_tags_links={
          <SankeySettingsEditionTagsLinks
            data={data}
            set_data={set_data}
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
        node_arrow_visible={
          (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!display_links[n.inputLinksId[0]].arrow) ? false : true
        }
        select_link={(l: SankeyLink) => {
          set_selected_link(l)
        }}
        //node_color={n => n.color}
        node_color={(n: SankeyNode) => {
          let colorNode
          // Le couleur est définie dans l'onglet général
          if (n.nodeParameter === 'general') {
            colorNode = '#808080'
          }
          if (n.nodeParameter === 'groupTag') {
            //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
            //on controle ici qu'il y a bien un favorite tag
            if (n.colorTag !== undefined && n.colorTag !== '') {
              const tagGroup = n.colorTag
              colorNode = data.tags_catalog[tagGroup].tags[n.tags[tagGroup][0]].color
            }

          }
          if (n.nodeParameter === 'local') {
            // Le couleur est définie dans les parametres locaux du noeud
            colorNode = n.color
          }

          return colorNode
        }}
        link_text={SankeyUtils.link_text}
        link_visible={(l: SankeyLink) => {
          const { dataTags } = data
          if (!data.nodes[l.idSource].node_visible || !data.nodes[l.idTarget].node_visible) {
            return false
          }
          let val = ((l.value as unknown) as {[key:string]:SankeyLinkValueDict})
          const listKey = [] as string[]
          Object.values(dataTags).filter(d => { return (Object.keys(d.tags).length != 0) && d.banner !== 'display' ? true : false }).map(d => {
            listKey.push(Object.entries(d.tags).filter(([,tag]) => { return tag.selected })[0][0])
          })

          for (const i in listKey) {
            //const val_dict = (val as unknown) as SankeyLinkValueDict
            val = ((val as unknown) as {[key:string]:SankeyLinkValueDict})[listKey[i]] 
          }
          const v = (val as unknown) as SankeyLinkValue
          if (l.colormap !== undefined && l.colormap !== '' ) {
            const selected_tag = v.color_tag[l.colormap]
            if ( l.colormap in dataTags && !dataTags[l.colormap].tags[selected_tag].selected) {
              return false
            }
          }
          if (v.value === 0) {
            if (data.display_style.null_flux) {
              return true
            }
            return false
          }
          return true
        }}
        link_color={(l : SankeyLink)=> {
          if (!l.colormap || l.colormap === '') {
            return l.color
          } else {
            if (l.colormap in  data.dataTags) {
              const selected_tag = getLinkValue(data,l.idLink).color_tag[l.colormap]
              return data.dataTags[l.colormap].tags[selected_tag].color
            } else {
              const source_node = data.nodes[l.idSource]
              const target_node = data.nodes[l.idTarget]
              let selected_tag = ''
              if (source_node.tags[l.colormap].length === 1) {
                selected_tag = source_node.tags[l.colormap][0]
                return data.tags_catalog[l.colormap].tags[selected_tag].color
              } else if (  target_node.tags[l.colormap].length === 1) {
                selected_tag = source_node.tags[l.colormap][0]   
                return data.tags_catalog[l.colormap].tags[selected_tag].color             
              } 
              return l.color
            }
          }
        }}
        test_link_value={(nodes: { [node_id: string]: SankeyNode }, d: SankeyLink) => {
          const { dataTags } = data
          let val = ((d.value as unknown) as {[key:string]:SankeyLinkValueDict})
          const listKey : string[] = [] 
          /* console.log(val)
          console.log(dataTags) */

          //Récupère la liste des tags selectionné pour chaque dataTags ayant au moins un groupe tag
          Object.values(dataTags).filter(d => { return (Object.keys(d.tags).length != 0) && d.banner !== 'display' ? true : false }).map(d => {
            listKey.push(Object.entries(d.tags).filter(([,tag]) => { return tag.selected })[0][0])
          })

          for (const i in listKey) {
            val = ((val as unknown) as {[key:string]:SankeyLinkValueDict})[listKey[i]] 
          }
          return ((val as unknown) as SankeyLinkValue).value
        }}
        set_show_nav={set_show_nav}
        set_nav_item_active={set_nav_item_active}
        nodeTooltipsContent={nodeTooltipsContent}
        linkTooltipsContent={linkTooltipsContent}
      />
    </div >
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp