import React, { FunctionComponent, useState } from 'react'
import { Row, Col, Form, FormCheck } from 'react-bootstrap'
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
  const tags_visible = Object.keys(data.tags_catalog).length > 0 || Object.keys(data.dataTags).filter(tags_key=>data.dataTags[tags_key].banner === 'display').length > 0
  const [colormap, set_colormap] = useState(
    tags_visible ? 
      (Object.keys(data.dataTags).filter(tags_key=>data.dataTags[tags_key].banner === 'display').length > 0 ?
        Object.keys(data.dataTags).filter(tags_key=>data.dataTags[tags_key].banner === 'display')[0]
        : (Object.keys(data.tags_catalog).filter(tags_key=>data.tags_catalog[tags_key].banner !== 'one').length > 0 ?
          Object.keys(data.tags_catalog).filter(tags_key=>data.tags_catalog[tags_key].banner !== 'one')[0] : ''))
      : ''
  )
  const [use_colormap,set_use_colormap] = useState(false)

  const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup) => {
    const val = evt.target.value
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
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

  const addPalette = () => {
    if ( Object.entries(data.dataTags).filter(tags=>tags[1].banner === 'display').length === 0 && Object.entries(data.tags_catalog).length == 0 ) {
      return (<></>)
    }
    return (
      <Row>
        <Col>
          <FormCheck
            type='switch'
            label='Palette'
            checked={use_colormap === true}
            onChange={ evt => {
              let the_colormap = colormap
              if (colormap === '' || colormap === undefined) {
                the_colormap = tags_visible ? Object.keys(data.tags_catalog).filter(tags_key=>data.tags_catalog[tags_key].banner !== 'one')[0] :''
                if (the_colormap === '' || colormap === undefined) {
                  the_colormap = tags_visible ? Object.keys(data.dataTags).filter(tags_key=>data.dataTags[tags_key].banner === 'display')[0] :''
                }
              }
              if (evt.target.checked) {
                Object.values(data.links).forEach(link=>link.colormap = the_colormap)
              } else {
                Object.values(data.links).forEach(link=>link.colormap = '')                  
              }
              set_use_colormap(evt.target.checked)
              if (colormap in tags_catalog) {
                Object.values(tags_catalog).forEach(tags_group=>tags_group.show_legend = false)
                tags_catalog[the_colormap].show_legend = evt.target.checked
              }
              set_colormap(the_colormap)
              set_data({ ...data })
            }}
          />
        </Col>
        <Col>    
          <Form.Select
            disabled={!use_colormap}
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                Object.values(data.links).forEach(link=>link.colormap = evt.target.value)
                //set_link_tag_favorite((link_tag_favorite === tags_group_key) ? '' : tags_group_key)
                set_colormap(evt.target.value)
                if (evt.target.value in tags_catalog) {
                  Object.values(tags_catalog).forEach(tags_group=>tags_group.show_legend = false)
                  tags_catalog[evt.target.value].show_legend = true
                }
                set_data({...data})
              }}>
            {Object.entries(data.dataTags).filter(tags_group=>tags_group[1].banner === 'display').map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={tags_group[0]}
                  selected={colormap === tags_group[0]} >
                  {tags_group[1].group_name}
                </option>)}
            {Object.entries(data.tags_catalog).filter(tags_group=>tags_group[1].banner === 'multi').map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={tags_group[0]}
                  selected={colormap === tags_group[0]} >
                  {tags_group[1].group_name}
                </option>)}
          </Form.Select>
        </Col>
      </Row>
    )
  }

  return (
    <>
      <div className='herowrap' style={{ 'backgroundColor': 'gainsboro', 'marginLeft': '0' }}>
        <Row style={{ 'marginTop': '0px', 'marginBottom': '10px' }}>
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
          <Col sm={4}>
            <Form id='dropdown_banner_node' className='dropdown_banner_node'>
              {addPalette()}
            </Form>
          </Col>
        </Row>
      </div>
    </>
  )
}

SankeyEdition.propTypes = SankeyEditionPropTypes

export default SankeyEdition

