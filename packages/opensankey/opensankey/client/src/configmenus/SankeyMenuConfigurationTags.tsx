import React, { useState, FunctionComponent } from 'react'

import { FaPlus, FaMinus, FaPalette, FaRandom } from 'react-icons/fa'
import colormap from 'colormap'
import * as d3 from 'd3'
import { GetRandomInt, OSTooltip } from './SankeyUtils'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { SankeySettingsEditionElementTagsTypes } from './types/SankeyMenuConfigurationTagsTypes'
import { TableContainer, Table, Th, Thead, Tr, Button, Tbody, Td, Box, Input, InputGroup, Select, useBoolean } from '@chakra-ui/react'
import { tag_banner_type } from '../types/Tag'
const list_palette_color = [d3.interpolateBlues, d3.interpolateBrBG, d3.interpolateBuGn, d3.interpolatePiYG, d3.interpolatePuOr,
  d3.interpolatePuBu, d3.interpolateRdBu, d3.interpolateRdGy, d3.interpolateRdYlBu, d3.interpolateRdYlGn, d3.interpolateSpectral,
  d3.interpolateTurbo, d3.interpolateViridis, d3.interpolateInferno, d3.interpolateMagma, d3.interpolatePlasma, d3.interpolateCividis,
  d3.interpolateWarm, d3.interpolateCool, d3.interpolateCubehelixDefault, d3.interpolateRainbow, d3.interpolateSinebow]

const SankeySettingsEditionElementTags: FunctionComponent<SankeySettingsEditionElementTagsTypes> = ({
  applicationContext,
  applicationData,
  elementTagNameProp,
  ComponentUpdater,
  reDrawLegend
}) => {
  const { new_data } = applicationData
  const { sankey } = new_data.drawing_area
  const { t } = applicationContext
  const [, setForceUpdate] = useBoolean()
  const tags_group_dict = new_data.drawing_area.sankey.getTagGroupsAsDict(elementTagNameProp)
  const tags_group_list = new_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)
  const [tags_group_key, set_tags_group_key] = useState(
    Object.keys(tags_group_dict).length > 0 ?
      Object.keys(tags_group_dict)[0] :
      ''
  )
  const [color_map, setColorMap] = useState('jet')

  /**
   * Current tag group modifying
   */
  const group_tag = tags_group_dict[tags_group_key]

  /**
   * List of tag group of current family of tag group (node,links,data)
   */


  const { updateComponenSaveInCache } = ComponentUpdater

  const colormaps = [
    'custom',
    'jet', 'hsv', 'hot', 'cool', 'spring', 'summer', 'autumn', 'winter', 'bone',
    'copper', 'greys', 'YIGnBu', 'greens', 'YIOrRd', 'bluered', 'RdBu', 'picnic',
    'rainbow', 'portland', 'blackbody', 'earth', 'electric',
    'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'rainbow-soft',
    'bathymetry', 'cdom', 'chlorophyll', 'density', 'freesurface-blue', 'freesurface-red', 'oxygen', 'par', 'phase', 'salinity', 'temperature', 'turbidity', 'velocity-blue', 'velocity-green',
    'cubehelix'
  ]

  const redrawGenereal = () => {
    new_data.drawing_area.drawElements();
    new_data.menu_configuration.updateComponentToolbar.current()
    updateComponenSaveInCache.current(false)
  }

  //Permet de modifier le type de bannier pour le groupTag (si ce non Aucun)
  const handleBanner = (tags_group_key: string, new_banner_type: tag_banner_type) => {
    group_tag.banner = new_banner_type
    setForceUpdate.toggle()
    redrawGenereal()
  }
  // Couleur issu de : https://github.com/d3/d3-scale-chromatic

  let element_tags: string[] = []
  if (tags_group_list.length > 0 && tags_group_key !== '') {
    const list_key_grp_tag = tags_group_list.map(grp => grp.id)
    if (list_key_grp_tag.includes(tags_group_key)) {
      element_tags = Object.keys(group_tag.tags)
    } else {
      console.log('tutu')
    }
  }

  // --------------------------------------------

  //add a tags to the selected groupTag
  const handleAddTagButton = () => {
    const new_key = Object.keys(group_tag.tags).length
    group_tag.addTag('key_tag_' + new_key, 'Tag')
    setForceUpdate.toggle()
    redrawGenereal()
  }

  //add a groupTag
  const handleAddTagGrpButton = () => {
    // Old
    // const k = AddGroupTag(data, elementTagNameProp, tags_group_key, elementNameProp)
    // set_tags_group_key(k)
    // setForceUpdate.toggle()
    // redrawGenereal()

    // New
    const tag_group = new_data.drawing_area.sankey.createTagGroup(elementTagNameProp)
    set_tags_group_key(tag_group.id)
    setForceUpdate.toggle()
  }


  // Delete a tag
  const handleDelTag = (n: string) => {

    delete group_tag.tags[n]
    setForceUpdate.toggle()
    redrawGenereal()
  }


  // Delete a groupTag
  const handleDelGroupTag = (tags_group_key: string) => {
    // delete group_tag
    new_data.drawing_area.sankey.removeTagGroupWithId(elementTagNameProp, tags_group_key)

    if (tags_group_list.length > 0) {
      const lastElmt = tags_group_list[tags_group_list.length - 1].id
      set_tags_group_key(lastElmt)
    }

    // If we delete a group data tag then we have to reset links value since the link value tree structure change drastically
    // if (elementTagNameProp === 'data_taggs') {
    //   resetLinkValueAfterDeleteDTGrp(data)
    // }
    setForceUpdate.toggle()
  }

  // Switch the position of the groupTag with the one before him on the list of grouptag
  // const handleUpGrpTag = (i: string) => {

  //   const listElmt = Object.keys(data[elementTagNameProp])
  //   const posElemt = listElmt.indexOf(i)
  //   listElmt.splice(posElemt, 1)
  //   listElmt.splice(posElemt - 1, 0, i)
  //   const new_cat: { [key: string]: TagsGroup } = {}
  //   listElmt.forEach(elt => {
  //     new_cat[elt] = data[elementTagNameProp][elt]
  //   })
  //   for (const member in data[elementTagNameProp]) delete data[elementTagNameProp][member]
  //   Object.assign(data[elementTagNameProp], new_cat)
  //   setForceUpdate.toggle()
  // }
  // // Switch the position of the groupTag with the one after him on the list of grouptag
  // const handleDownGrpTag = (i: string) => {

  //   const listElmt = Object.keys(data[elementTagNameProp])
  //   const posElemt = listElmt.indexOf(i)
  //   listElmt.splice(posElemt, 1)
  //   listElmt.splice(posElemt + 1, 0, i)
  //   const new_cat: { [key: string]: TagsGroup } = {}
  //   listElmt.forEach(elt => {
  //     new_cat[elt] = data[elementTagNameProp][elt]
  //   })
  //   for (const member in data[elementTagNameProp]) delete data[elementTagNameProp][member]
  //   Object.assign(data[elementTagNameProp], new_cat)
  //   setForceUpdate.toggle()

  // }
  let variant_table_edit_tag = 'table_edit_tag_node'
  if (elementTagNameProp == 'flux_taggs') variant_table_edit_tag = 'table_edit_tag_link'
  if (elementTagNameProp == 'data_taggs') variant_table_edit_tag = 'table_edit_tag_data'
  const tagSetting = (<>
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    {t('Tags.GE')}:
    <Box display='grid' gridTemplateColumns='2fr 1fr 1fr 1fr'>
      <Select
        variant='menuconfigpanel_option_select'
        onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_tags_group_key(evt.target.value)
            setForceUpdate.toggle()
          }}
        value={tags_group_key}>
        {tags_group_list.map(
          (key, i) =>
            <option
              key={i}
              value={key.id}
            >
              {tags_group_list[i].name}
            </option>
        )}
      </Select>

      {/* Boutons des palettes de couleur  */}
      {/* Palette de couleur aléatoire  */}
      <OSTooltip label={t('Tags.tooltips.pal')}>
        <Button
          backgroundColor='#9E9CFB'
          value='rand'
          size='sm'
          onClick={() => {
            const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
            const size_color = Object.keys(group_tag.tags).length
            for (const i in d3.range(size_color)) {
              group_tag.tags[element_tags[i]].color = d3.color(color_selected(+i / size_color))?.formatHex() ?? 'grey'

            }
            redrawGenereal()
            setForceUpdate.toggle()
          }}>
          <FaPalette />
        </Button>
      </OSTooltip>
      {/* Melanger les couleur  */}
      <OSTooltip label={t('Tags.tooltips.pal_shuffle')}>
        <Button
          backgroundColor='#9CFBC5'
          value='alea'
          size='sm'
          onClick={() => {
            const color = element_tags.map(d => {
              return group_tag.tags[d].color
            })
            let size_color = color.length
            for (const i in d3.range(size_color)) {
              size_color = color.length
              const color_to_select = GetRandomInt(size_color)
              const c = color.splice(color_to_select, 1)
              if (c != undefined && c != null) {
                const v = c[0]
                group_tag.tags[element_tags[i]].color = v
              }
            }
            redrawGenereal()
            setForceUpdate.toggle()
          }}>
          <FaRandom />
        </Button>
      </OSTooltip>

      {/* Palettes des couleurs standard */}
      <OSTooltip label={t('Tags.tooltips.pal_std')}>
        <Select
          variant='menuconfigpanel_option_select'
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              setColorMap(evt.target.value)
              const nb_tags = Object.keys(group_tag.tags).length
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
              Object.keys(group_tag.tags).forEach(
                (tag_key, i) => group_tag.tags[tag_key].color = colors[i * step]
              )
              redrawGenereal()
              setForceUpdate.toggle()
            }}
          // value={(tags_group_list.length > 0 && group_tag && tags_group_key != '') ? group_tag.color_map : ''}
          value={color_map}
        >
          {colormaps.map(
            (cur_colormap, i) =>
              <option key={i} value={cur_colormap}>{cur_colormap}</option>
          )}
        </Select>
      </OSTooltip>
    </Box>

    {/* Entete du Tableau des étiquettes  */}
    <TableContainer>
      <Table variant={variant_table_edit_tag} >
        <Thead>
          <Tr >
            <Th>
              {/* Bouton ajout d'une étiquette  */}
              <OSTooltip label={t('Tags.tooltips.add')}>
                <Button
                  variant='menuconfigpanel_add_button'
                  value='+' onClick={handleAddTagButton}>
                  <FaPlus />
                </Button>
              </OSTooltip>
            </Th>
            {/* Nom de l'étqiuette  */}
            <Th>
              {t('Tags.Nom')}
            </Th>
            {/* Etiquette visible  */}
            {elementTagNameProp !== 'data_taggs' ?
              <Th>
                {t('Tags.Visible')}
              </Th> : <></>
            }
            <Th>
              {t('Tags.Couleur')}
            </Th>
            {/* {elementNameProp === 'nodes' ?
              <Th>
                {t('Tags.Forme')}
              </Th> : <></>
            } */}
          </Tr>
        </Thead>

        {/* Tableau des étqiuettes du groupe  */}
        <Tbody>
          {element_tags.length > 0 ? element_tags.map(
            (tag_key, i) => {
              const tag_visible = group_tag.tags[tag_key].selected
              return (
                <Tr key={i.toString()} >
                  {/* Supprimer une etiquette  */}
                  <Td >
                    <OSTooltip label={t('Tags.tooltips.rm')}>
                      <Button
                        variant='menuconfigpanel_del_button_in_table'
                        value='-' onClick={() => { handleDelTag(tag_key) }}>
                        <FaMinus />
                      </Button>
                    </OSTooltip>
                  </Td>
                  {/* Renommer l'étiquette  */}
                  {/* Met une largeur de cellue plus petite quand c'est les étiquettes de noeud car le tableau contient une colonne de plsu (forme) */}
                  <Td >
                    <OSTooltip label={t('Tags.tooltips.nom')}>
                      <InputGroup variant='menuconfigpanel_option_input_table' >
                        <Input
                          variant='menuconfigpanel_option_input_table'
                          id={i.toString()}
                          type="text"
                          value={group_tag.tags[tag_key].name}
                          onChange={
                            (evt: React.ChangeEvent) => {
                              const new_nb_element = evt.target as HTMLInputElement
                              const name = new_nb_element.value
                              group_tag.tags[tag_key].name = name
                              redrawGenereal()
                              setForceUpdate.toggle()
                            }
                          } />
                      </InputGroup>
                    </OSTooltip>
                  </Td>
                  {/* Rendre ou non visible  */}
                  {elementTagNameProp !== 'data_taggs' ?
                    <Td >
                      <OSTooltip label={t('Tags.tooltips.visible')}>
                        <Button
                          variant='menuconfigpanel_option_button_in_table'
                          name={'element_visible' + tag_key}
                          id={tag_key}
                          onClick={
                            () => {
                              const visible = !tag_visible
                              group_tag.tags[tag_key].selected = visible
                              redrawGenereal()
                              setForceUpdate.toggle()
                            }}>{tag_visible ? <FaEye /> : <FaEyeSlash />}</Button>
                      </OSTooltip>

                    </Td> : <></>
                  }
                  {/* Choix de la couleur*/}
                  <Td >
                    <OSTooltip label={t('Tags.tooltips.couleur')}>
                      <Input padding='0.25rem' width='revert' height='revert'
                        type='color'
                        value={group_tag.tags[tag_key].color as string}
                        onChange={
                          evt => {
                            group_tag.tags[tag_key].color = evt.target.value
                            redrawGenereal()
                            setForceUpdate.toggle()
                          }} />
                    </OSTooltip>
                  </Td>
                  {/* Chosir la forme du noeud  */}
                  {/* {elementNameProp === 'nodes' ? (
                    <Td>
                      <OSTooltip label={t('Tags.tooltips.forme')}>
                        <Select variant='menuconfigpanel_option_select_table'
                          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                            group_tag.tags[tag_key].shape = evt.target.value
                            redrawGenereal()
                            setForceUpdate.toggle()
                          }}
                          value={group_tag.tags[tag_key].shape as string}
                        >
                          <option key={'rect' + i} id='rect' value='rect'>Rectangle</option>
                          <option key={'circle' + i} id='circle' value='ellipse'>Circle</option>
                        </Select>
                      </OSTooltip>
                    </Td>
                  ) :
                    (<></>)

                  } */}
                </Tr>
              )
            }) : (<></>)}
        </Tbody>
      </Table>
    </TableContainer>
  </>
  )

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Groupe d'étiquette  */}
      <TableContainer>
        <Table variant='table_edit_grp_tag_node_link'>
          {/* Entete du tableau de grouep d'etiquette  */}
          <Thead>
            <Tr>
              {/* Ajouter un groupe */}
              <Th>
                <OSTooltip label={t('Tags.tooltips.add_grp')}>
                  <Button
                    variant='menuconfigpanel_add_button'
                    onClick={handleAddTagGrpButton}>
                    <FaPlus />
                  </Button>
                </OSTooltip>
              </Th>
              {/* Autre entetes  */}
              <Th>{t('Tags.Nom')}</Th>
              <Th>{t('Tags.Bannière')}</Th>
              {/* {(elementTagNameProp != 'data_taggs') ? <Th>{t('Tags.Position')}</Th> : <></>} */}
            </Tr>
          </Thead>
          {/* Liste des groupes d'étiquettes  */}
          <Tbody>
            {
              tags_group_list.map(
                (tags_group_key, i) => {
                  return (
                    <Tr key={i.toString()}>
                      {/* Suppression d'un groupe  */}
                      <Td>
                        <OSTooltip label={t('Tags.tooltips.rm_grp')}>
                          <Button
                            size={'sm'}
                            variant='menuconfigpanel_del_button_in_table'
                            onClick={() => handleDelGroupTag(tags_group_key.id)}>
                            <FaMinus />
                          </Button>
                        </OSTooltip>
                      </Td>
                      {/* Renommer le groupe d'étiquettes */}
                      <Td>
                        <OSTooltip label={t('Tags.tooltips.nom_grp')}>
                          <InputGroup variant='menuconfigpanel_option_input_table' >
                            <Input
                              variant='menuconfigpanel_option_input_table'
                              id={i.toString()}
                              type="text"
                              value={group_tag.name}
                              onChange={
                                (evt: React.ChangeEvent) => {
                                  const new_name = (evt.target as HTMLInputElement).value
                                  group_tag.name = new_name
                                  setForceUpdate.toggle()
                                }} />
                          </InputGroup>
                        </OSTooltip>
                      </Td>
                      {/* Banniere  */}
                      <Td>
                        <OSTooltip label={t('Tags.tooltips.banner')}>
                          <Select
                            variant='menuconfigpanel_option_select_table'
                            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(tags_group_key.id, (evt.target.value as tag_banner_type))}
                            value={group_tag.banner}
                          >
                            {(elementTagNameProp != 'data_taggs') ? <option key={'none' + i} id='NoneBaner' value='none'>{t('Menu.Aucun')}</option> : <></>}
                            <option key={'one' + i} id='OneBaner' value='one'>{t('Tags.Unique')}</option>
                            <option key={'multi' + i} id='MultipleBaner' value='multi'>{t('Tags.Multiple')}</option>
                          </Select>
                        </OSTooltip>
                      </Td>
                      {/* Monter ou descendre groupe d'étiquette  */}
                      {/* {(elementTagNameProp != 'data_taggs') ?
                        <Td>
                           Monter le groupe d'étiquette *
                          <OSTooltip label={t('Tags.tooltips.up')}>
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              borderRadius='6px 0px 0px 6px'
                              onClick={() => handleUpGrpTag(tags_group_key)}>
                              <FaArrowAltCircleUp />
                            </Button>
                          </OSTooltip>
                           Descendre le groupe d'étiquettes
                          <OSTooltip label={t('Tags.tooltips.down')}>
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              borderRadius='0px 6px 6px 0px'
                              onClick={() => handleDownGrpTag(tags_group_key)}>
                              <FaArrowAltCircleDown />
                            </Button>
                          </OSTooltip>
                        </Td> : <></>
                      } */}
                    </Tr>
                  )
                })
            }
          </Tbody>
        </Table></TableContainer>
      {tags_group_list.length > 0 ? tagSetting : <></>}
    </Box>
  )
}

export default null

export { SankeySettingsEditionElementTags }