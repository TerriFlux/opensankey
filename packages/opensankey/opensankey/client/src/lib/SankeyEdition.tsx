import React, { FunctionComponent } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { SankeyDataPropTypes, TagsGroup, } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { setSelectedTags } from './SankeyUtils'
import DropdownMultiselect from 'react-multiselect-dropdown-bootstrap'
const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>

const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data }) => {
  const { tags_catalog } = data

  const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group:TagsGroup) => {
    const val = evt.target.value
    Object.entries(tags_group.tags).forEach(tag=> tag[1].selected = val === tag[1].name )
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

  const handleMultiDropdown = (selected: string[],tags_group:TagsGroup) => {
    console.log(selected)
    Object.entries(tags_group.tags).forEach(tag=> tag[1].selected = selected.includes(tag[1].name) )
    setSelectedTags(data)
    set_data({ ...data })
  }

  const addDropdown = () => {
    const banner_grouptag = Object.entries(tags_catalog).filter(([, tags_group]) => { return tags_group.banner == 'one' || tags_group.banner == 'multi' })
    const simpleDrop = banner_grouptag.filter(([, tags_group]) => { return tags_group.banner == 'one' }).map(([, tags_group]) => {
      return (
        <Row key={tags_group.group_name}>
          <Col>{tags_group.group_name}</Col>
          <Col style={{width: '100px'}}>
            {<Form.Select key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group) }}>{
              Object.entries(tags_group.tags).map(([tag_key, tag]) => {
                return (<option key={tag_key} value={tag_key}>{tag.name}</option>)
              })}
            </Form.Select>}
          </Col>
        </Row>)
    })

    const multiDrop = banner_grouptag.filter(([, tags_group]) => { return tags_group.banner == 'multi' }).map(([, tags_group]) => {
      return (
        <Row key={tags_group.group_name}>
          <Col>{tags_group.group_name}</Col>
          <Col style={{width: '100px'}}>
            <DropdownMultiselect 
              key={tags_group.group_name} 
              selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)} 
              name={tags_group.group_name} 
              options={Object.entries(tags_group.tags).map(tag => tag[1].name)} 
              handleOnChange={(selected : string[]) => { handleMultiDropdown(selected, tags_group) }} />
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
              {addDropdown()}
            </Form>
          </Col>
        </Row>
      </div>
    </>
  )
}

SankeyEdition.propTypes = SankeyEditionPropTypes

export default SankeyEdition

