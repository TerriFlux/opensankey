import React, { FunctionComponent } from 'react'
import { Button, Row, Col, ButtonGroup, Form } from 'react-bootstrap'
import { SankeyNode, SankeyLink, SankeyDataPropTypes, TagsCatalogPropTypes, TagsCatalog } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { default_link, default_node, setSelectedTags } from './SankeyUtils'
import DropdownMultiselect from 'react-multiselect-dropdown-bootstrap'
import * as d3 from 'd3'
const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_selected_node: PropTypes.func.isRequired,
  set_selected_link: PropTypes.func.isRequired,
  set_show_link: PropTypes.func.isRequired,
  set_show_graphic_attributes: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>


const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data, set_selected_node, set_selected_link, set_show_link, set_show_graphic_attributes }) => {
  const { tags_catalog, tags_catalog_v2, nodes } = data

  const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_cat: any) => {
    const val = evt.target.value
    tags_cat.selected_tags = [val]
    setSelectedTags(data)
    set_data({ ...data })
    // Zoom sur les parties du SANKEY affichées à l'écran
    // A faire, et il y a sans doute mieux
    //console.log(d3.select('.g_nodes'))    
    // setTimeout(function () {
    //   const nodeWidth = (d3.select('.g_nodes').node() as any).getBoundingClientRect().width
    //   const svgWidth = (d3.select('svg').node() as any).getBoundingClientRect().width
    //   console.log(nodeWidth)
    //   console.log(svgWidth)
    //   console.log(svgWidth / nodeWidth)
    //   nodes
    //     .filter(function (d: any) { return d.visible })
    //     .forEach(function (d) {
    //       //console.log(d3.select('gg_' + d.idNode).node())
    //       d3.select('ggg_' + d.idNode)
    //         .attr('transform', 'translateX(150px)')
    //     })
    //   // d3.selectAll('.node')
    //   //   .filter(function (d: any) { return d.visible })
    //   //   //.attr('transform', 'translate('+svgWidth / nodeWidth+'%,0)')
    //   //   .each(function (d) {
    //   //     // console.log(this)
    //   //     //(d as any).x = (d as any).x * (svgWidth / nodeWidth.width) - nodeWidth.left
    //   //   })
    //   set_data({ ...data })
    // }, 2000)

  }

  const handleMultiDropdown = (selected: any, tags_cat: any) => {
    console.log(selected)
    tags_cat.selected_tags = selected
    setSelectedTags(data)
    set_data({ ...data })
  }

  const addDropdown = () => {
    const banner_grouptag = tags_catalog.filter(d => { return d.banner == 'one' || d.banner == 'multi' })
    const simpleDrop = banner_grouptag.filter(d => d.banner == 'one').map(n => {
      return (
        <Row key={n.group_name}>
          <Col>{n.group_name}</Col>
          <Col>
            <Form.Select key={n.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, n) }}>{n.tags.map(m => {
              return (<option key={m} value={m}>{m}</option>)
            })}
            </Form.Select>
          </Col>
        </Row>)
    })

    const multiDrop = banner_grouptag.filter(d => d.banner == 'multi').map(n => {
      return (
        <Row key={n.group_name}>
          <Col>{n.group_name}</Col>
          <Col>
            <DropdownMultiselect key={n.group_name} selected={n.selected_tags} name={n.group_name} options={n.tags} handleOnChange={(selected: any) => { handleMultiDropdown(selected, n) }} />
          </Col>
        </Row>)
    })

    return [simpleDrop, multiDrop]
    // return tags_catalog.filter(d => { return d.banner == 'one' || d.banner == 'multi' })
    //   .map((t, i) => <Form.Select>{t.tags.map((n, y) => <option key={y} value={n}>{n}</option>)} </Form.Select>)
  }

  const addDropdownV2 = () => {
    const banner_grouptag = Object.entries(tags_catalog_v2).filter(([k, d]) => { return d.banner == 'one' || d.banner == 'multi' })
    const simpleDrop = banner_grouptag.filter(([k, d]) => { return d.banner == 'one' }).map(([k, n]) => {
      return (
        <Row key={n.group_name}>
          <Col>{n.group_name}</Col>
          <Col>
            
            {<Form.Select key={n.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, n) }}>{
              Object.entries(n.tags).map(([m, v]) => {
                return (<option key={m} value={m}>{m}</option>)
              })}
            </Form.Select>}
          </Col>
        </Row>)
    })

    const multiDrop = banner_grouptag.filter(([k, d]) => { return d.banner == 'multi' }).map(([k, n]) => {
      return (
        <Row key={n.group_name}>
          <Col>{n.group_name}</Col>
          <Col>
            <DropdownMultiselect key={n.group_name} selected={n.selected_tags} name={n.group_name} options={n.tags} handleOnChange={(selected: any) => { handleMultiDropdown(selected, n) }} />
          </Col>
        </Row>)
    })

    return [simpleDrop, multiDrop]
    // return tags_catalog.filter(d => { return d.banner == 'one' || d.banner == 'multi' })
    //   .map((t, i) => <Form.Select>{t.tags.map((n, y) => <option key={y} value={n}>{n}</option>)} </Form.Select>)
  }
  
  return (
    <>
      {/* {console.log(tags_catalog.filter(d => { return d.banner == 'one' || d.banner == 'multi' }))} */}
      <div className='herowrap' style={{ 'backgroundColor': 'gainsboro', 'marginLeft': '0' }}>
        <Row style={{ 'marginTop': '90px', 'marginBottom': '10px' }}>
          <Col sm={4}  >
            <Form id='dropdown_banner'>
              {addDropdownV2()}
            </Form>
          </Col>
        </Row>
      </div>
    </>
  )
}

/* const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data, set_selected_node, set_selected_link, set_show_link, set_show_graphic_attributes }) => {
  const add_new_node = () => {
    const { nodes } = data

    const node: SankeyNode = default_node()
    node.id = nodes.length
    node.name = 'n' + nodes.length
    node.x = nodes.length * 50
    nodes.push(node)
    set_selected_node(nodes.length - 1)
    set_data({ ...data })
  }

  const add_new_link = () => {
    const { nodes, links } = data

    if (nodes.length < 2) {
      return
    }
    const link: SankeyLink = default_link()
    const link_pos = links.length

    links.push(link)
    link.source_name = nodes[0].name
    link.target_name = nodes[1].name

    nodes[0].output_links.push(link_pos)
    nodes[1].input_links.push(link_pos)

    set_selected_link(links.length - 1)
    set_data({ ...data })
    set_show_link(true)
  }

  return (
    <div className='herowrap' style={{ 'backgroundColor': 'gainsboro', 'marginLeft': '0' }}>
      <Row style={{ 'marginTop': '10px', 'marginBottom': '10px' }}>
        <Col sm={4}  >
          <ButtonGroup vertical style={{ 'marginLeft': '10px' }}>
            <Button size="sm" style={{ 'marginBottom': '3px' }} onClick={add_new_node}>
              Ajouter Noeud
            </Button>
            <Button size="sm" style={{ 'marginBottom': '3px' }} onClick={add_new_link}>
              Ajouter Flux
            </Button>
            <Button size="sm" onClick={() => set_show_graphic_attributes(true)}>
              Réglages
            </Button>
          </ButtonGroup>
        </Col>
      </Row>
    </div>
  )
} */

SankeyEdition.propTypes = SankeyEditionPropTypes

export default SankeyEdition

