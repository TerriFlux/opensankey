import React, { FunctionComponent } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { SankeyDataPropTypes, TagsGroup, } from './types'
import PropTypes, { InferProps } from 'prop-types'
import DropdownMultiselect from 'react-multiselect-dropdown-bootstrap'
const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>

const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data }) => {
  const { tags_catalog, dataTags } = data

  const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup) => {
    const val = evt.target.value
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[1].name)
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

  const handleMultiDropdown = (selected: string[], tags_group: TagsGroup) => {
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = selected.includes(tag[1].name))
    set_data({ ...data })
  }
  const addAllDropDownNode = () => {
    const banner_grouptag = Object.entries(tags_catalog).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '100px' }}>
              {<Form.Select key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group) }}>{
                Object.entries(tags_group.tags).map(([tag_key, tag]) => {
                  return (<option key={tag_key} value={tag_key}>{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
          </Row>)
      } else if (tags_group.banner == 'multi') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '100px' }}>
              <DropdownMultiselect
                key={tags_group.group_name}
                selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)}
                name={tags_group.group_name}
                options={Object.entries(tags_group.tags).map(tag => tag[1].name)}
                handleOnChange={(selected: string[]) => { handleMultiDropdown(selected, tags_group) }} />
            </Col>
          </Row>)
      }


    })
    return allDD
  }
  const addAllDropDownLinks = () => {
    const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col /* style={{ width: '100px' }} */>
              {<Form.Select key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group) }}>{
                Object.entries(tags_group.tags).map(([tag_key, tag]) => {
                  return (<option key={tag_key} value={tag.name} selected={tag.selected}>{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
          </Row>)
      } else if (tags_group.banner == 'multi') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col /* style={{ width: '100px' }} */>
              <DropdownMultiselect
                key={tags_group.group_name}
                selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)}
                name={tags_group.group_name}
                options={Object.entries(tags_group.tags).map(tag => tag[1].name)}
                handleOnChange={(selected: string[]) => { handleMultiDropdown(selected, tags_group) }} />
            </Col>
          </Row>)
      }


    })
    return allDD
  }

  return (
    <>
      <div className='herowrap' style={{ 'backgroundColor': 'gainsboro', 'marginLeft': '0' }}>
        <Row style={{ 'marginTop': '90px', 'marginBottom': '10px' }}>
          <Col sm={4}  >
            <Form id='dropdown_banner_node' className='dropdown_banner_node'>
              {addAllDropDownNode()}
            </Form>
          </Col>
          <Col sm={4}>
            <Form id='dropdown_banner_node' className='dropdown_banner_node'>
              {addAllDropDownLinks()}
            </Form>
          </Col>
        </Row>
      </div>
    </>
  )
}

SankeyEdition.propTypes = SankeyEditionPropTypes

export default SankeyEdition

