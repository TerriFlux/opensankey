// External imports
import * as d3 from 'd3'
import React, { useState, FunctionComponent } from 'react'
import {
  FaEye,
  FaEyeSlash,
  FaMinus,
  FaPalette,
  FaPlus,
  FaRandom,
} from 'react-icons/fa'
import colormap from 'colormap'
import {
  Box,
  Button,
  Input,
  InputGroup,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

// Local types
import { SankeySettingsEditionElementTagsTypes } from './types/SankeyMenuConfigurationTagsTypes'
import { Class_ProtoTag, Class_ProtoTagGroup, tag_banner_type } from '../types/Tag'

// Local functions / components

import { default_grey_color, OSTooltip } from '../types/Utils'
import { GetRandomInt } from '../types/Legacy'

const list_palette_color = [
  d3.interpolateBlues,
  d3.interpolateBrBG,
  d3.interpolateBuGn,
  d3.interpolatePiYG,
  d3.interpolatePuOr,
  d3.interpolatePuBu,
  d3.interpolateRdBu,
  d3.interpolateRdGy,
  d3.interpolateRdYlBu,
  d3.interpolateRdYlGn,
  d3.interpolateSpectral,
  d3.interpolateTurbo,
  d3.interpolateViridis,
  d3.interpolateInferno,
  d3.interpolateMagma,
  d3.interpolatePlasma,
  d3.interpolateCividis,
  d3.interpolateWarm,
  d3.interpolateCool,
  d3.interpolateCubehelixDefault,
  d3.interpolateRainbow,
  d3.interpolateSinebow
]

const SankeySettingsEditionElementTags: FunctionComponent<SankeySettingsEditionElementTagsTypes> = ({
  applicationData,
  elementTagNameProp,
}) => {
  const { new_data } = applicationData
  const { t } = new_data
  
  // Get related tag groups & tags - Can be NodeTags, FluxTags or DataTags --------------

  const tags_group_dict = new_data.drawing_area.sankey.getTagGroupsAsDict(elementTagNameProp)
  const tags_group_list = new_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)
  const [tags_group_entry_id, setTagsGroupEntryId] = useState(tags_group_list[0]?.id ?? '')
  const tags_group_entry = tags_group_dict[tags_group_entry_id]
  const tags_entry = tags_group_entry?.tags_list ?? []

  // Trigger reloading of this component ------------------------------------------------

  const [, setCount] = useState(0)
  const updateThis = () => {
    if (tags_group_dict[tags_group_entry_id])
      setCount(a=>a+1)
    else
      setTagsGroupEntryId(new_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)[0]?.id ?? '')
  }
  new_data.menu_configuration.ref_to_menu_config_tags_updater[elementTagNameProp].current = updateThis

  // Chosen color palette used ----------------------------------------------------------
  // Couleur issues de : https://github.com/d3/d3-scale-chromatic
  const [color_map, setColorMap] = useState('jet')
  const color_maps = [
    'custom',
    'jet',
    'hsv',
    'hot',
    'cool',
    'spring',
    'summer',
    'autumn',
    'winter',
    'bone',
    'copper',
    'greys',
    'YIGnBu',
    'greens',
    'YIOrRd',
    'bluered',
    'RdBu',
    'picnic',
    'rainbow',
    'portland',
    'blackbody',
    'earth',
    'electric',
    'viridis',
    'inferno',
    'magma',
    'plasma',
    'warm',
    'cool',
    'rainbow-soft',
    'bathymetry',
    'cdom',
    'chlorophyll',
    'density',
    'freesurface-blue',
    'freesurface-red',
    'oxygen',
    'par',
    'phase',
    'salinity',
    'temperature',
    'turbidity',
    'velocity-blue',
    'velocity-green',
    'cubehelix'
  ]

  // Update function --------------------------------------------------------------------

  const updateThisAndToggleSavingIndicator = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update this menu
    new_data.menu_configuration.updateAllComponentsRelatedToTagsType(elementTagNameProp)
  }

  const updateThisAndRelatedComponents = () => {
    // Update components related to tags in menu config or toolbar
    new_data.menu_configuration.updateAllComponentsRelatedToTags()
    // Update the rest
    updateThisAndToggleSavingIndicator()
  }

  // Buttons handlers -------------------------------------------------------------------

  /**
   * Button handler for tag adding in current tag group
   */
  const handleAddTagButton = () => {
    // Create default tag in current tag group
    tags_group_entry.addDefaultTag()
    // Full update
    updateThisAndRelatedComponents()
  }

  /**
   * Button handler for taggroup adding
   */
  const handleAddTagGrpButton = () => {
    // Create new default tag group
    const tag_group = new_data.drawing_area.sankey.createTagGroup(elementTagNameProp)
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update components related to tags in menu config or toolbar
    new_data.menu_configuration.updateAllComponentsRelatedToTags()
    // Update this menu
    setTagsGroupEntryId(tag_group.id)
  }

  /**
   * Button handler for tag deletion
   * @param {Class_ProtoTag} tag
   */
  const handleDelTag = (tag: Class_ProtoTag) => {
    // Delete given tag
    tag.delete()
    // Update menus
    updateThisAndRelatedComponents()
  }

  /**
   * Button handler for tag group deletion
   *
   * @param {Class_TagGroup} tagg
   */
  const handleDelGroupTag = (tagg: Class_ProtoTagGroup) => {
    // Delete given tag group
    new_data.drawing_area.sankey.removeTagGroup(elementTagNameProp, tagg)
    // Update menus
    updateThisAndRelatedComponents()
  }

  /**
   * Button handler for tag group banner modification
   * @param {Class_ProtoTagGroup} tag_group
   * @param {tag_banner_type} new_banner_type
   */
  const handleBanner = (
    tag_group: Class_ProtoTagGroup,
    new_banner_type: tag_banner_type
  ) => {
    // UPdate banner for given tag group
    tag_group.banner = new_banner_type
    // Update menus
    updateThisAndRelatedComponents()
  }

  // Tags tables ------------------------------------------------------------------------
  let variant_table_edit_tag = 'table_edit_tag_node'
  if (elementTagNameProp == 'flux_taggs') variant_table_edit_tag = 'table_edit_tag_link'
  if (elementTagNameProp == 'data_taggs') variant_table_edit_tag = 'table_edit_tag_data'

  const tagSetting = (<>
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    {t('Tags.GE')}:
    <Box display='grid' gridTemplateColumns='2fr 1fr 1fr 1fr'>

      {/* Tag group selector ---------------------------------------------------------- */}
      <Select
        variant='menuconfigpanel_option_select'
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          setTagsGroupEntryId(evt.target.value)
        }}
        value={tags_group_entry_id}
      >
        {
          tags_group_list.map(
            (tags_group) =>
              <option
                key={tags_group.id}
                value={tags_group.id}
              >
                {tags_group.name}
              </option>
          )}
      </Select>

      {/* Boutons des palettes de couleur  -------------------------------------------- */}

      {/* Palette de couleur aléatoire  */}
      <OSTooltip label={t('Tags.tooltips.pal')}>
        <Button
          variant='toolbar_button_3'
          height='100%'
          onClick={() => {
            const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
            const nb_of_colors = tags_entry.length
            for (const i in d3.range(nb_of_colors)) {
              tags_entry[i].color =
                d3.color(color_selected(+i / nb_of_colors))?.formatHex() ?? default_grey_color
            }
            // Update only this menu
            updateThisAndToggleSavingIndicator()
          }}>
          <FaPalette />
        </Button>
      </OSTooltip>

      {/* Melanger les couleur  */}
      <OSTooltip label={t('Tags.tooltips.pal_shuffle')}>
        <Button
          variant='toolbar_button_4'
          height='100%'
          onClick={() => {
            // Color swaping between tags
            const colors = tags_entry.map(tag => tag.color)
            let nb_of_colors = colors.length
            if (nb_of_colors > 2) {
              // Algo for 3+ colors
              for (const i in d3.range(nb_of_colors)) {
                nb_of_colors = colors.length
                const color_to_select_id = GetRandomInt(nb_of_colors)
                const color_to_select = colors.splice(color_to_select_id, 1)
                if (color_to_select != undefined && color_to_select != null) {
                  tags_entry[i].color = color_to_select[0]
                }
                else {
                  tags_entry[i].color = default_grey_color
                }
              }
            }
            else if (nb_of_colors > 1) {
              // Algo for 2 colors
              // Do nothing for 1 color
              tags_entry[0].color = colors[1]
              tags_entry[1].color = colors[0]
            }
            // Update only this menu
            updateThisAndToggleSavingIndicator()
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
              // If custom color map, do nothing
              if (evt.target.value === 'custom') {
                return
              }
              // Get random colors from color palette
              const nb_tags = tags_entry.length
              const colors = colormap({
                colormap: evt.target.value,
                nshades:  nb_tags,
                format: 'hex',
                alpha: 1
              })
              // Apply colors to tags
              tags_entry.forEach(
                (tag, i) => tag.color = colors[i]
              )
              // Update displayed menu
              setColorMap(evt.target.value)
              updateThisAndToggleSavingIndicator()
            }}
          value={color_map}
        >
          {
            color_maps.map(
              (cur_colormap, i) =>
                <option
                  key={i}
                  value={cur_colormap}
                >
                  {cur_colormap}
                </option>
            )
          }
        </Select>
      </OSTooltip>
    </Box>

    {/* Tableaux d'étiquettes  -------------------------------------------------------- */}

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
                  value='+'
                  onClick={handleAddTagButton}>
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
          {
            tags_entry.length > 0 ?
              tags_entry.map(tag => {
                return (
                  <Tr
                    key={tag.id}
                  >
                    {/* Supprimer une etiquette  */}
                    <Td >
                      <OSTooltip label={t('Tags.tooltips.rm')}>
                        <Button
                          variant='menuconfigpanel_del_button_in_table'
                          value='-' onClick={() => { handleDelTag(tag) }}>
                          <FaMinus />
                        </Button>
                      </OSTooltip>
                    </Td>
                    {/* Renommer l'étiquette  */}
                    {/* Met une largeur de cellue plus petite quand c'est les étiquettes de noeud car le tableau contient une colonne de plsu (forme) */}
                    <Td >
                      <OSTooltip label={t('Tags.tooltips.nom')}>
                        <InputGroup variant='menuconfigpanel_option_input_table' >
                          {/* TODO change with ConfigMenuTextInput */}
                          <Input
                            variant='menuconfigpanel_option_input_table'
                            id={tag.id}
                            type="text"
                            value={tag.name}
                            onChange={
                              (evt: React.ChangeEvent) => {
                                // Change tag name
                                tag.name = (evt.target as HTMLInputElement).value
                                // Update all related menus
                                updateThisAndRelatedComponents()
                              }
                            } />
                        </InputGroup>
                      </OSTooltip>
                    </Td>
                    {/* Rendre ou non visible  */}
                    {
                      elementTagNameProp !== 'data_taggs' ?
                        <Td >
                          <OSTooltip label={t('Tags.tooltips.visible')}>
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              name={'element_visible' + tag.id}
                              id={tag.id}
                              onClick={
                                () => {
                                  // Inverse selection
                                  tag.toogleSelected()
                                  // Update only this menu
                                  updateThisAndToggleSavingIndicator()
                                }}
                            >
                              {tag.is_selected ? <FaEye /> : <FaEyeSlash />}
                            </Button>
                          </OSTooltip>
                        </Td> :
                        <></>
                    }
                    {/* Choix de la couleur*/}
                    <Td >
                      <OSTooltip label={t('Tags.tooltips.couleur')}>
                        <Input padding='0.25rem' width='revert' height='revert'
                          type='color'
                          value={tag.color}
                          onChange={
                            evt => {
                              // Update tag color
                              tag.color = evt.target.value
                              // Update only this menu
                              updateThisAndToggleSavingIndicator()
                            }} />
                      </OSTooltip>
                    </Td>
                    {/* Chosir la forme du noeud  */}
                    {
                      /* {elementNameProp === 'nodes' ?
                        <Td>
                          <OSTooltip label={t('Tags.tooltips.forme')}>
                            <Select variant='menuconfigpanel_option_select_table'
                              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                                tags_group_entry.tags_dict[tag_key].shape = evt.target.value
                                redrawGenereal()
                                refreshThis.toggle()
                              }}
                              value={tags_group_entry.tags_dict[tag_key].shape as string}
                            >
                              <option key={'rect' + i} id='rect' value='rect'>Rectangle</option>
                              <option key={'circle' + i} id='circle' value='ellipse'>Circle</option>
                            </Select>
                          </OSTooltip>
                        </Td> :
                        <></>
                      */
                    }
                  </Tr>
                )
              }) :
              <></>
          }
        </Tbody>
      </Table>
    </TableContainer>
  </>
  )

  // Tag group menu ---------------------------------------------------------------------
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
              tags_group_list.map(tag_group => {
                return (
                  <Tr
                    key={tag_group.id}
                  >
                    {/* Suppression d'un groupe  */}
                    <Td>
                      <OSTooltip label={t('Tags.tooltips.rm_grp')}>
                        <Button
                          size={'sm'}
                          variant='menuconfigpanel_del_button_in_table'
                          onClick={() => handleDelGroupTag(tag_group)}
                        >
                          <FaMinus />
                        </Button>
                      </OSTooltip>
                    </Td>
                    {/* Renommer le groupe d'étiquettes */}
                    <Td>
                      <OSTooltip label={t('Tags.tooltips.nom_grp')}>
                        <InputGroup variant='menuconfigpanel_option_input_table' >
                          {/* TODO change with ConfigMenuTextInput */}
                          <Input
                            variant='menuconfigpanel_option_input_table'
                            id={tag_group.id}
                            type="text"
                            value={tag_group.name}
                            onChange={
                              (evt: React.ChangeEvent) => {
                                // Change tag group name
                                const new_name = (evt.target as HTMLInputElement).value
                                tag_group.name = new_name
                                // Update all related menus
                                updateThisAndRelatedComponents()
                              }} />
                        </InputGroup>
                      </OSTooltip>
                    </Td>
                    {/* Banniere  */}
                    <Td>
                      <OSTooltip label={t('Tags.tooltips.banner')}>
                        <Select
                          variant='menuconfigpanel_option_select_table'
                          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
                            handleBanner(tag_group, (evt.target.value as tag_banner_type))}
                          value={tag_group.banner}
                        >
                          {
                            (elementTagNameProp != 'data_taggs') ?
                              <option
                                key={'none' + tag_group.id}
                                id='NoneBaner'
                                value='none'
                              >
                                {t('Menu.Aucun')}
                              </option> :
                              <></>
                          }
                          <option
                            key={'one' + tag_group.id}
                            id='OneBaner'
                            value='one'
                          >
                            {t('Tags.Unique')}
                          </option>
                          <option
                            key={'multi' + tag_group.id}
                            id='MultipleBaner'
                            value='multi'
                          >
                            {t('Tags.Multiple')}
                          </option>
                        </Select>
                      </OSTooltip>
                    </Td>
                    {/* Monter ou descendre groupe d'étiquette  */}
                    {/*
                      (elementTagNameProp != 'data_taggs') ?
                        <Td>
                          Monter le groupe d'étiquette *
                          <OSTooltip label={t('Tags.tooltips.up')}>
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              borderRadius='6px 0px 0px 6px'
                              onClick={() => handleUpGrpTag(tags_group_entry_id)}>
                              <FaArrowAltCircleUp />
                            </Button>
                          </OSTooltip>
                            Descendre le groupe d'étiquettes
                          <OSTooltip label={t('Tags.tooltips.down')}>
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              borderRadius='0px 6px 6px 0px'
                              onClick={() => handleDownGrpTag(tags_group_entry_id)}>
                              <FaArrowAltCircleDown />
                            </Button>
                          </OSTooltip>
                        </Td> :
                        <></>
                    */}
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
      </TableContainer>
      {tags_group_list.length > 0 ? tagSetting : <></>}
    </Box>
  )
}

export default null

export { SankeySettingsEditionElementTags }