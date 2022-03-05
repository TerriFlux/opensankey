import React, { FunctionComponent, useState } from 'react'
import { Row, Col, Form, FormCheck, FormLabel, FormControl } from 'react-bootstrap'
import { SankeyDataPropTypes, TagsGroup, } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { MultiSelect } from 'react-multi-select-component'
import { convert_data } from './SankeyConvert'
const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired
}

declare const window: Window &
  typeof globalThis & {
    sankey: {
      sous_filieres: { [key: string]: string }
    }
  }

type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>

const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data }) => {
  const { tags_catalog, dataTags } = data
  const tags_visible = Object.keys(data.tags_catalog).length > 0 || Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display').length > 0
  const [colormap, set_colormap] = useState(
    tags_visible ?
      (Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display').length > 0 ?
        Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display')[0]
        : (Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one').length > 0 ?
          Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one')[0] : ''))
      : ''
  )
  const [use_colormap, set_use_colormap] = useState(false)
  const [diagram, set_diagram] = useState('')

  const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup) => {
    const val = evt.target.value
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
    set_data({ ...data })
  }

  // const handleMultiDropdown = (selected: string[], tags_group: TagsGroup) => {
  //   Object.entries(tags_group.tags).forEach(tag => tag[1].selected = selected.includes(tag[1].name))
  //   set_data({ ...data })
  // }
  const handleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup) => {
    const tab_sel = selected.map((d) => {
      console.log(d)
      return d.value
    })
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
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
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '100px' }}>
              {/* <DropdownMultiselect
                key={tags_group.group_name}
                selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)}
                name={tags_group.group_name}
                options={Object.entries(tags_group.tags).map(tag => tag[1].name)}
                handleOnChange={(selected: string[]) => { handleMultiDropdown(selected, tags_group) }} />
                 */}
              <MultiSelect
                valueRenderer={(selected : any, _options :any) => {
                  return selected.length? selected.map(({ label } : any) => label+', '): 'Aucun tag sélectionné'
                }}
                labelledBy={'hello'}
                // hasSelectAll={false}
                value={selected}
                options={options}
                onChange={(selected: [{ label: string, value: string }]) => {
                  handleMultiDropdown(selected, tags_group)
                }} />
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
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col /* style={{ width: '100px' }} */>
              {/* <DropdownMultiselect
                key={tags_group.group_name}
                selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)}
                name={tags_group.group_name}
                options={Object.entries(tags_group.tags).map(tag => tag[1].name)}
              handleOnChange={(selected: string[]) => { handleMultiDropdown(selected, tags_group) }}
              /> */}
              <MultiSelect
                labelledBy={'hello'}
                value={selected}
                options={options}
                onChange={(selected: [{ label: string, value: string }]) => {
                  handleMultiDropdown(selected, tags_group)
                }} />
            </Col>
          </Row>)
      }


    })
    return allDD
  }

  const addPalette = () => {
    if (Object.entries(data.dataTags).filter(tags => tags[1].banner === 'display').length === 0 && Object.entries(data.tags_catalog).length == 0) {
      return (<></>)
    }
    return (
      <Row>
        <Col>
          <FormCheck
            type='switch'
            label='Palette'
            checked={use_colormap === true}
            onChange={evt => {
              let the_colormap = colormap
              const apply_to_node = Object.keys(data.tags_catalog).includes(colormap)
              if (colormap === '' || colormap === undefined) {
                the_colormap = tags_visible ? Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one')[0] : ''
                if (the_colormap === '' || colormap === undefined) {
                  the_colormap = tags_visible ? Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display')[0] : ''
                }
              }
              if (evt.target.checked) {
                Object.values(data.links).forEach(link => link.colormap = the_colormap)
                if (apply_to_node) {
                  Object.values(data.nodes).forEach(node => {
                    if (node.type === 'sector') {
                      return
                    }
                    node.nodeParameter = 'groupTag'
                    node.colorTag = the_colormap
                  })
                }
              } else {
                Object.values(data.links).forEach(link => link.colormap = '')
                if (apply_to_node) {
                  Object.values(data.nodes).forEach(node => {
                    node.nodeParameter = 'local'
                    //node.colorTag = the_colormap
                  })
                }
              }
              set_use_colormap(evt.target.checked)
              Object.values(tags_catalog).forEach(tags_group => tags_group.show_legend = false)
              Object.values(dataTags).forEach(tags_group => tags_group.show_legend = false)
              if (the_colormap in tags_catalog) {
                tags_catalog[the_colormap].show_legend = evt.target.checked
              }
              if (the_colormap in dataTags) {
                dataTags[the_colormap].show_legend = evt.target.checked
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
                const apply_to_node = Object.keys(data.tags_catalog).includes(evt.target.value)
                Object.values(data.links).forEach(link => link.colormap = evt.target.value)
                if (apply_to_node) {
                  Object.values(data.nodes).forEach(node => {
                    if (node.type === 'sector') {
                      return
                    }
                    node.nodeParameter = 'groupTag'
                    node.colorTag = evt.target.value
                  })
                } else {
                  Object.values(data.nodes).forEach(node => {
                    if (node.type === 'sector') {
                      return
                    }
                    node.nodeParameter = 'general'
                  })
                }
                //set_link_tag_favorite((link_tag_favorite === tags_group_key) ? '' : tags_group_key)
                set_colormap(evt.target.value)
                if (evt.target.value in tags_catalog) {
                  Object.values(tags_catalog).forEach(tags_group => tags_group.show_legend = false)
                  tags_catalog[evt.target.value].show_legend = true
                }
                Object.values(tags_catalog).forEach(tags_group => tags_group.show_legend = false)
                Object.values(dataTags).forEach(tags_group => tags_group.show_legend = false)
                if (evt.target.value in tags_catalog) {
                  tags_catalog[evt.target.value].show_legend = true
                }
                if (evt.target.value in dataTags) {
                  dataTags[evt.target.value].show_legend = true
                }
                set_data({ ...data })
              }}>
            {Object.entries(data.dataTags).filter(tags_group => tags_group[1].banner === 'display').map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={tags_group[0]}
                  selected={colormap === tags_group[0]} >
                  {tags_group[1].group_name}
                </option>)}
            {Object.entries(data.tags_catalog).filter(tags_group => tags_group[1].banner === 'multi').map(
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

  const setDiagram = (evt: React.ChangeEvent) => {

    const the_diagram = (evt.target as HTMLInputElement).value as string
    const sous_filieres = window.sankey.sous_filieres
    const new_data = JSON.parse(JSON.stringify((window.sankey as any)[sous_filieres[the_diagram] as any]))
    //Object.assign(sankey_data, new_data)
    convert_data(new_data)
    new_data.static_sankey = true
    //set_level(agregation_level)
    set_diagram(the_diagram)
    let height = 0
    Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
    let min_height = 2000
    Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
    let max_vert_shift = 0
    Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

    new_data.height = Math.max(500, height + max_vert_shift + 200)
    set_data({ ...new_data })
  }

  let sous_filieres = undefined
  if (window.sankey && window.sankey.sous_filieres) {
    console.log(window.sankey.sous_filieres)
    sous_filieres = window.sankey.sous_filieres
  }
  const diagram_label = 'Diagrammes'
  const marginTop = data.static_sankey ? '0px' : '0px'

  return (
    <>
      <div className='herowrap'
        style={{
          backgroundColor: 'gainsboro',
          marginLeft: '0',
          paddingBottom: '3px',
          justifyContent: 'space-evenly',
          alignItems: '<baseline-position>'
        }}>
        <Row style={{ marginTop: marginTop, 'paddingBottom': '5px', 'paddingTop': '5px' }}>
          {(data.static_sankey && sous_filieres) ? (
            <Col>
              <Form.Group as={Col} style={{ marginLeft: '30px' }}>
                <Row>
                  <FormLabel className="text-center" >{diagram_label}</FormLabel>
                </Row>
                <Row>
                  <Form.Select
                    onChange={setDiagram}>
                    {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} selected={diagram === name} >{name}</option>)}
                  </Form.Select>
                </Row>
              </Form.Group>
            </Col>) : (<div />)}
          <Col>
            <Form id='dropdown_banner_node' className='dropdown_banner_node'>
              {addAllDropDownNode()}
            </Form>
          </Col>
          <Col>
            <Form id='dropdown_banner_node' className='dropdown_banner_node'>
              {addAllDropDownLinks()}
            </Form>
          </Col>
          <Col>
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

