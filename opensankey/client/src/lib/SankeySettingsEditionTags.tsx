import React, { useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, Table, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { findMaxLinkValue } from './SankeyUtils'
import { SankeyDataPropTypes, SankeyLinkValue, SankeyLinkValueDict, TagsGroup } from './types'
import { FaArrowAltCircleUp, FaArrowAltCircleDown, FaPlus, FaMinus } from 'react-icons/fa'
import { addDataTags } from './SankeyUtils'
import colormap from 'colormap'
import {useTranslation} from 'react-i18next'


const SankeySettingsEditionTagsPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  elementTagNameProp: PropTypes.oneOf(['nodeTags','fluxTags']).isRequired,
  elementNameProp: PropTypes.oneOf(['nodes','links']).isRequired
}
type SankeySettingsEditionTagsTypes = InferProps<typeof SankeySettingsEditionTagsPropTypes>

const SankeySettingsEditionElementTags: FunctionComponent<SankeySettingsEditionTagsTypes> = ({ data, set_data,elementTagNameProp,elementNameProp }) => {
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data[elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags']).length > 0 ? Object.keys(data[elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'])[0] : '')
  const colormaps = [
    'custom',
    'jet', 'hsv', 'hot', 'cool', 'spring', 'summer', 'autumn', 'winter', 'bone',
    'copper', 'greys', 'YIGnBu', 'greens', 'YIOrRd', 'bluered', 'RdBu', 'picnic',
    'rainbow', 'portland', 'blackbody', 'earth', 'electric',
    'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'rainbow-soft',
    'bathymetry', 'cdom', 'chlorophyll', 'density', 'freesurface-blue', 'freesurface-red', 'oxygen', 'par', 'phase', 'salinity', 'temperature', 'turbidity', 'velocity-blue', 'velocity-green',
    'cubehelix'
  ]
  const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
  //Permet de modifier le type de bannier pour le groupTag (si ce non Aucun)
  const handleBanner = (tags_group_key: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    data[elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'][tags_group_key].banner = evt.target.value
    set_data({ ...data })
  }
  const {t} =useTranslation()

  let element_tags : string [] = []
  if ( Object.keys(data[elementTagName]).length > 0 && tags_group_key !== '') {
    if (tags_group_key in data[elementTagName]) {
      element_tags = Object.keys(data[elementTagName][tags_group_key].tags)
    } else {
      console.log('tutu')
    }
  }
  // --------------------------------------------
  //ajoute un étiquette au groupe selectionné 
  const handleAddTagButton = () => {
    const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    // Méthode pour incrementer idElement
    const listId: number[] = []
    Object.keys(data[elementTagName][tags_group_key].tags).forEach(elt => listId.push(Number(elt.replace('element', ''))))
    const idElement = listId.length > 0 ? Math.max(...listId) + 1 : 0
    data[elementTagName][tags_group_key].tags['element' + idElement] = { name: 'étiquette' + idElement, color: '#000000', selected: true }
    const nb_tags = Object.keys(data[elementTagName][tags_group_key].tags).length
    const colors = colormap({
      colormap: data[elementTagName][tags_group_key].color_map,
      nshades: Math.max(11, nb_tags),
      format: 'hex',
      alpha: 1
    })
    let step = 1
    if (nb_tags < 11) {
      step = Math.round(11 / nb_tags)
    }
    Object.keys(data[elementTagName][tags_group_key].tags).forEach(
      (tag_key, i) => data[elementTagName][tags_group_key].tags[tag_key].color = colors[i * step]
    )
    // if (elementTagName === 'nodeTags' && data.nodeTags[tags_group_key].banner === 'level') {
    //   Object.values(data.nodes).forEach(node=>node.dimensions[tags_group_key] = {parent_name : undefined})
    // }

    set_data({ ...data })
  }
  //Ajoute un groupTag
  const handleAddTagGrpButton = () => {
    const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    const elementName = elementNameProp === 'nodes' ? 'nodes' : 'links'
    // Méthode pour incrementer idGroup
    const idGroup = Object.keys(data[elementTagName]).length+1
    //la clé est unique grâce au timestamp mais le nom est liée au nombre de grouptag
    const k='tag_group_' + String(new Date().getTime())
    data[elementTagName][k] = {
      group_name: 'Étiquette Group ' + idGroup,
      show_legend: false,
      color_map: 'jet',
      tags: {},
      banner: 'multi',
      activated: true,
      siblings: []
    }
    if (elementName === 'nodes' ) {
      Object.values(data[elementName]).forEach(n => n.tags[k] = [])
    }
    if (Object.keys(data[elementTagName]).length === 1) {
      Object.values(data[elementName]).forEach(n => n.colorTag = Object.keys(data[elementTagName])[0])
    }
    set_tags_group_key(k)
    set_data({ ...data })
  }

  const handleDelTag = (n: string) => {
    const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    //const elementName = elementTagNameProp === 'nodeTags' ? 'nodes' : 'links'
    delete data[elementTagName][tags_group_key].tags[n]

    //Object.values(data[elementName]).forEach(el=> el.tags[tags_group_key] = el.tags[tags_group_key].filter((tag:string)=>tag !== n))

    set_data({ ...data })
  }

  const handleDelGroupTag = (tags_group_key: string) => {
    const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    const elementName = elementNameProp === 'nodes' ? 'nodes' : 'links'
    delete data[elementTagName][tags_group_key]
    Object.values(data[elementName]).forEach(
      n => {
        if (n.colorTag === tags_group_key) {
          n.colorTag = ''
        }
        if (elementNameProp === 'nodes') {
          delete n.tags[tags_group_key]
        }
      })
    if (Object.keys(data[elementTagName]).length > 0) {
      const lastElmt = Object.keys(data[elementTagName])[Object.keys(data[elementTagName]).length - 1]
      set_tags_group_key(lastElmt)
    }
    set_data({ ...data })
  }

  const handleUpGrpTag = (i: string) => {
    const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    const listElmt = Object.keys(data[elementTagName])
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: TagsGroup } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = data[elementTagName][elt]
    })
    for (const member in data[elementTagName]) delete data[elementTagName][member]
    Object.assign(data[elementTagName], new_cat)
    set_data({ ...data })
  }

  const handleDownGrpTag = (i: string) => {
    const elementTagName = elementTagNameProp === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    const listElmt = Object.keys(data[elementTagName])
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: TagsGroup } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = data[elementTagName][elt]
    })
    for (const member in data[elementTagName]) delete data[elementTagName][member]
    Object.assign(data[elementTagName], new_cat)
    set_data({ ...data })
  }

  const tagSetting = (<>
    <Form.Group as={Row} >
      <Col>
        <FormLabel >{t('Tags.GE')}:</FormLabel>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_tags_group_key(evt.target.value)
            set_data({ ...data })
          }}>
          {Object.keys(data[elementTagName]).map(
            (key, i) =>
              <option
                key={i}
                value={key}
                selected={tags_group_key === key} >
                {data[elementTagName][key].group_name}
              </option>
          )}
        </Form.Select>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            data[elementTagName][tags_group_key].color_map = evt.target.value
            const nb_tags = Object.keys(data[elementTagName][tags_group_key].tags).length
            if (evt.target.value === 'custom') {
              return
            }
            const colors = colormap({
              colormap: evt.target.value,
              nshades: Math.max(11, nb_tags),
              format: 'hex',
              alpha: 1
            })
            let step = 1
            if (nb_tags < 11) {
              step = Math.round(11 / nb_tags)
            }
            Object.keys(data[elementTagName][tags_group_key].tags).forEach(
              (tag_key, i) => data[elementTagName][tags_group_key].tags[tag_key].color = colors[i * step]
            )
            set_data({ ...data })
          }}>
          {colormaps.map(
            (cur_colormap, i) =>
              <option
                key={i}
                value={cur_colormap}
                selected={data[elementTagName][tags_group_key] && data[elementTagName][tags_group_key].color_map === cur_colormap} >
                {cur_colormap}
              </option>
          )}
        </Form.Select>
      </Col>
    </Form.Group>

    <Table striped bordered hover responsive='sm' size='sm' className='node_tags_definition'>
      <thead>
        <tr>

          <th><Button variant="success" value='+' onClick={handleAddTagButton}><FaPlus /></Button> </th>
          <th>{t('Tags.Nom')}</th>
          <th>{t('Tags.Visible')}</th>
          <th>{t('Tags.Couleur')}</th>
          { elementNameProp === 'nodes' ? (<th>{t('Tags.Forme')}</th>) : (<></>)}
        </tr>
      </thead>
      <tbody>
        {element_tags.length > 0 ? element_tags.map(
          (tag_key, i) => {
            return (
              <tr key={i.toString()}>
                <td style={{ 'width': '10%' }}><Button variant="danger" value='-' onClick={() => { handleDelTag(tag_key) }}><FaMinus /></Button></td>

                <td style={{ 'width': '33%' }}>
                  <FormControl /* size='sm' */
                    id={i.toString()}
                    type="text"
                    value={data[elementTagName][tags_group_key].tags[tag_key].name}
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const name = new_nb_element.value
                        data[elementTagName][tags_group_key].tags[tag_key].name = name
                        set_data({ ...data })
                      }
                    } /></td>
                <td style={{ 'width': '10%' }}>
                  <Form.Check inline={true}
                    name={'element_visible' + tag_key}
                    checked={data[elementTagName][tags_group_key].tags[tag_key].selected}
                    id={tag_key}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const tag_key = new_nb_element.id
                        const visible = new_nb_element.checked
                        data[elementTagName][tags_group_key].tags[tag_key].selected = visible
                        set_data({ ...data })
                      }
                    } />
                </td>
                <td><Form.Control
                  type="color"
                  value={data[elementTagName][tags_group_key].tags[tag_key].color as string}
                  onChange={
                    evt => {
                      data[elementTagName][tags_group_key].tags[tag_key].color = evt.target.value
                      set_data({ ...data })
                    }
                  }
                /></td>
                { elementNameProp === 'nodes' ? (
                  <Form.Select 
                    onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                      data[elementTagName][tags_group_key].tags[tag_key].shape = evt.target.value
                      set_data({ ...data })
                    }}
                    value={data[elementTagName][tags_group_key].tags[tag_key].shape as string}
                  >
                    <option key={'rect' + i} id='rect' value='rect'>Rectangle</option>
                    <option key={'circle' + i} id='circle' value='ellipse'>Circle</option>
                  </Form.Select>) : (<></>)
                }
              </tr>
            )
          }) : (<></>)}
      </tbody>
    </Table>

  </>
  )
  return (
    <>
      <Table striped bordered hover className='node_group_tags_definition'>
        <thead>
          <tr>
            <th><Button variant="success" onClick={handleAddTagGrpButton}><FaPlus /></Button></th>
            <th>{t('Tags.Nom')}</th>
            <th>{t('Tags.Leg')}</th>
            <th>{t('Tags.tags')}</th>
            <th>{t('Tags.Bannière')}</th>
            <th>{t('Tags.Position')}</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(data[elementTagName]).map(
              (tags_group_key, i) => {
                return (
                  <tr key={i.toString()}>
                    <td style={{ 'width': '10%' }}>
                      <Button variant="danger" onClick={() => handleDelGroupTag(tags_group_key)}><FaMinus /></Button>
                    </td>
                    <td>
                      <FormControl
                        id={i.toString()}
                        type="text"
                        value={data[elementTagName][tags_group_key].group_name}
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const new_name = (evt.target as HTMLInputElement).value
                            data[elementTagName][tags_group_key].group_name = new_name
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>
                      <Form.Check inline={true}
                        // Permet de selection le étiquette pour l'affichage dans la légende
                        name={'element_legend_' + tags_group_key}
                        checked={data[elementTagName][tags_group_key].show_legend}
                        id={tags_group_key}
                        type='switch'
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const new_nb_element = evt.target as HTMLInputElement
                            const tags_group_key = new_nb_element.id
                            const visible = new_nb_element.checked
                            data[elementTagName][tags_group_key].show_legend = visible
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>{Object.keys(data[elementTagName][tags_group_key].tags).length}</td>
                    <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(tags_group_key, evt)}>
                      <option key={'none' + i} id='NoneBaner' selected={data[elementTagName][tags_group_key].banner === 'none' || !data[elementTagName][tags_group_key].banner} value='none'>{t('Tags.Aucun')}</option>
                      <option key={'one' + i} id='OneBaner' selected={data[elementTagName][tags_group_key].banner === 'one'} value='one'>{t('Tags.Unique')}</option>
                      <option key={'multi' + i} id='MultipleBaner' selected={data[elementTagName][tags_group_key].banner === 'multi'} value='multi'>{t('Tags.Multiple')}</option>
                      <option key={'level' + i} id='LevelBaner' selected={data[elementTagName][tags_group_key].banner === 'level'} value='level'>{t('Tags.Niveau')}</option>
                    </Form.Select>
                    <td style={{ 'width': '10%' }}>
                      <ButtonGroup className="button_position" size="sm">
                        <Button variant="info" onClick={() => handleUpGrpTag(tags_group_key)}><FaArrowAltCircleUp /></Button>
                        <Button variant="info" onClick={() => handleDownGrpTag(tags_group_key)}><FaArrowAltCircleDown /></Button>
                      </ButtonGroup>
                    </td>

                  </tr>
                )
              })
          }
        </tbody>
      </Table>
      {Object.keys(data[elementTagName]).length > 0 ? tagSetting : <></>}
    </>
  )
}

const SankeySettingsDataTagsPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
}
type SankeySettingsEditionDataTagsTypes = InferProps<typeof SankeySettingsDataTagsPropTypes>

const SankeySettingsEditionDataTags: FunctionComponent<SankeySettingsEditionDataTagsTypes> = ({ data, set_data }) => {
  const [data_tags_group_key, set_data_tags_group_key] = useState(Object.keys(data.dataTags).length > 0 ? Object.keys(data.dataTags)[0] : '')

  const { links, dataTags } = data
  const {t} =useTranslation()

  let max_link_value = 0
  Object.values(links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  // --------------------------------------------
  //ajoute un étiquette au group selectionné 
  const handleAddTagButton = () => {
    const { dataTags } = data
    //Si le DataTag n'a pas de étiquette alors le premier crée sera selectionné par defaut
    const selectedDefault = (Object.keys(dataTags[data_tags_group_key].tags).length == 0) ? true : false
    //création d'un étiquette par defaut
    // Méthode pour incrementer idElement
    const listId: number[] = []
    Object.keys(dataTags[data_tags_group_key].tags).forEach(elt => listId.push(Number(elt.replace('element', ''))))
    const idElement = listId.length > 0 ? Math.max(...listId) + 1 : 0
    dataTags[data_tags_group_key].tags['element' + idElement] = { name: 'étiquette' + idElement, color: '#000000', selected: selectedDefault }

    const dataTagsArray = Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
    Object.values(data.links).forEach(
      l => {
        addDataTags(dataTagsArray, l.value as unknown as {[key:string] : SankeyLinkValue}, 0)
      }
    )

    set_data({ ...data })
  }
  //Ajoute un groupTag
  const handleAddTagGrpButton = () => {
    const { dataTags } = data

    // Méthode pour incrementer idGroup
    const listId: number[] = []
    Object.keys(dataTags).forEach(elt => listId.push(Number(elt.replace('tag_group_', ''))))
    const idGroup = listId.length > 0 ? Math.max(...listId) + 1 : 0
    dataTags['tag_group_' + idGroup] = {
      group_name: 'Étiquette Group ' + idGroup,
      show_legend: false,
      color_map: 'jet',
      tags: {},
      banner: 'multi',
      activated: true,
      siblings: []
    }

    set_data_tags_group_key('tag_group_' + idGroup)
    set_data({ ...data })
  }
  //supprime étiquette
  const handleDelTag = (n: string) => {
    const { dataTags } = data
    delete dataTags[data_tags_group_key].tags[n]

    set_data({ ...data })
  }
  //supprime groupTag
  const handleDelGroupTag = (tags_group_key: string) => {
    const { dataTags } = data
    delete dataTags[tags_group_key]
    if (Object.keys(dataTags).length > 0) {
      const lastElmt = Object.keys(dataTags)[Object.keys(dataTags).length - 1]
      set_data_tags_group_key(lastElmt)
    }
    set_data({ ...data })
  }
  
  const tagSetting = (<>
    <Form.Group as={Row} >
      <Col xs={2}>
        <FormLabel >Groupe d'étiquettes:</FormLabel>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_data_tags_group_key(evt.target.value)
            set_data({ ...data })
          }}>
          {Object.keys(dataTags).map(
            (key, i) =>
              <option
                key={i}
                value={key}
                selected={data_tags_group_key === key} >
                {dataTags[key].group_name}
              </option>
          )}
        </Form.Select>
      </Col>
    </Form.Group>

    <Table striped bordered hover responsive='sm' size='sm' className='link_tags_definition'>
      <thead>
        <tr>
          <th><Button variant="success" value='+' onClick={handleAddTagButton}><FaPlus /></Button></th>
          <th>{t('Tags.Nom')}</th>
          <th>{t('Tags.selct')}</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(dataTags).length > 0 && data_tags_group_key !== '' ? Object.keys(dataTags[data_tags_group_key].tags).map(
          (tag_key, i) => {
            return (
              <tr key={i.toString()}>
                <td style={{ 'width': '10%' }}><Button variant="danger" onClick={() => { handleDelTag(tag_key) }}><FaMinus /></Button></td>

                <td /* style={{ 'width': '33%' }} */>
                  <FormControl size='sm'
                    id={i.toString()}
                    type="text"
                    value={dataTags[data_tags_group_key].tags[tag_key].name}
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const { dataTags } = data
                        const new_nb_element = evt.target as HTMLInputElement
                        const name = new_nb_element.value
                        for (const l in data.links) {
                          ((data.links[l].value as unknown) as SankeyLinkValueDict) = JSON.parse(JSON.stringify(data.links[l].value).replaceAll('"' + dataTags[data_tags_group_key].tags[tag_key].name + '"', '"' + name + '"')) as SankeyLinkValueDict

                        }
                        dataTags[data_tags_group_key].tags[tag_key].name = name
                        set_data({ ...data })
                      }
                    } /></td>
                <td /* style={{ 'width': '10%' }} */>
                  <Form.Check inline={true}
                    name={'element_selected' + tag_key}
                    checked={dataTags[data_tags_group_key].tags[tag_key].selected}
                    id={tag_key}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const tag_key = new_nb_element.id
                        const visible = new_nb_element.checked
                        Object.values(dataTags[data_tags_group_key].tags).map(d => {
                          d.selected = false
                        })
                        dataTags[data_tags_group_key].tags[tag_key].selected = visible
                        set_data({ ...data })
                      }
                    } />
                </td>


              </tr>
            )
          }) : (<></>)}
      </tbody>
    </Table>
  </>
  )

  return (
    <>
      <Table striped bordered responsive='sm' size='sm' hover className='data_group_tag_definition'>
        <thead>
          <tr>
            <th><Button variant="success" onClick={handleAddTagGrpButton}><FaPlus /></Button></th>
            <th>{t('Tags.Nom')}</th>
            <th>{t('Tags.tags')}</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(dataTags).map(
              (data_tags_group_key, i) => {
                return (
                  <tr key={i.toString()}>
                    <td style={{ 'width': '10%' }}>
                      <Button variant="danger" onClick={() => handleDelGroupTag(data_tags_group_key)}><FaMinus /></Button>
                    </td>
                    <td>
                      <FormControl
                        id={i.toString()}
                        type="text"
                        value={dataTags[data_tags_group_key].group_name}
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const { dataTags } = data
                            const new_name = (evt.target as HTMLInputElement).value
                            dataTags[data_tags_group_key].group_name = new_name
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>{Object.keys(dataTags[data_tags_group_key].tags).length}</td>
                  </tr>
                )
              })
          }
        </tbody>
      </Table>
      {Object.keys(dataTags).length > 0 ? tagSetting : <></>}
    </>
  )
}

SankeySettingsEditionElementTags.propTypes = SankeySettingsEditionTagsPropTypes
SankeySettingsEditionDataTags.propTypes = SankeySettingsDataTagsPropTypes

export default null

export { SankeySettingsEditionElementTags, SankeySettingsEditionDataTags }