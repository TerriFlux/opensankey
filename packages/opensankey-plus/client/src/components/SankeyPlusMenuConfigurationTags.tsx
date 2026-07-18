// External imports
import * as d3 from '@terriflux/opensankey/src/d3Modules'
import React, { useState, FC } from 'react'
import colormap from 'colormap'
import {
  Box,
  Button,
  Input,
  InputGroup,
  Select,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import {
  Class_Tag,
  tag_banner_type,
  Class_LevelTag,
  Class_DataTag,
  Class_ProtoTag,
} from '@terriflux/opensankey/src/types/Tag'

// Local functions / components
import {
  GetRandomInt,
  Type_MacroTagGroup
} from '@terriflux/opensankey/src/types/Utils'

import { MenuColorPicker, WrapperBoxSubSectionMenu } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { Class_ElementValue, Class_LinkValue } from '@terriflux/opensankey/src/Elements/LinkValues'
import { Class_DataTagGroup, Class_FluxTagGroup, Class_LevelTagGroup, Class_NodeTagGroup, Class_ProtoTagGroup, Class_TagGroup } from '@terriflux/opensankey/src/types/TagGroup'

import { OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { default_grey_color } from '@terriflux/opensankey/src/Elements/ElementsAttributesConfig'
import { useModelBinding, useModelSlot } from '@terriflux/opensankey/src/hooks/useModelBinding'

export type FType_SankeySettingsEditionElementTags = {
  new_data: Class_ApplicationDataOSP,
  elementTagNameProp: Type_MacroTagGroup,
  // #1283 — mode « groupe fixe » (édition en place depuis une carte de filtre) :
  // édite CE groupe, sans sélecteur de groupe ni table de gestion des groupes.
  fixed_group_id?: string
}

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

const SankeySettingsEditionElementTags: FC<FType_SankeySettingsEditionElementTags> = ({
  new_data,
  elementTagNameProp,
  fixed_group_id,
}) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_element_visible, icon_element_invisible, icon_random, icon_palette_color, icon_move_element_up, icon_move_element_down } = icon_library
  // Get related tag groups & tags - Can be NodeTags, FluxTags or DataTags --------------

  const tags_group_dict = new_data.drawing_area.sankey.getTagGroupsAsDict(elementTagNameProp)
  const tags_group_list = new_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)
  const [tags_group_entry_id_state, setTagsGroupEntryId] = useState(tags_group_list[0]?.id ?? '')
  // #1283 — en mode groupe fixe, l'id est imposé par la carte (pas de sélecteur).
  const tags_group_entry_id = fixed_group_id ?? tags_group_entry_id_state
  const tags_group_entry = tags_group_dict[tags_group_entry_id]
  const tags_entry = tags_group_entry?.tags_list ?? []

  // Failsafe if selected tag group is not in dict of group (état interne seul)
  if (!fixed_group_id && tags_group_list.length > 0 && !(tags_group_entry_id_state in tags_group_dict))
    setTagsGroupEntryId(new_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)[0]?.id ?? '')


  // Trigger reloading of this component ------------------------------------------------
  // #247 — re-render forcé d'identité stable + slot updater lié au montage (closure fraîche,
  // cleanup au démontage).
  const refreshThis = useModelBinding()
  const updateThis = () => {
    if (tags_group_dict[tags_group_entry_id])
      refreshThis()
    else
      setTagsGroupEntryId(new_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)[0]?.id ?? '')
  }
  useModelSlot(new_data.menu_configuration.ref_to_menu_config_tags_updater[elementTagNameProp], updateThis)

  // Chosen color palette used ----------------------------------------------------------
  // Couleur issues de : https://github.com/d3/d3-scale-chromatic
  const [color_map, setColorMap] = useState('jet')
  const color_maps = new_data.list_color_palette

  // Update function --------------------------------------------------------------------

  const updateThisAndToggleSavingIndicator = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update this menu
    new_data.menu_configuration.updateAllComponentsRelatedToTagsType(elementTagNameProp)
    // Redraw legend since we can show displayed tag
    new_data.drawing_area.legend.draw()
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
    // Create new default tag
    let tag: Class_ProtoTag | Class_LevelTag
    const _handleAddTagButton = () => {
      // Create default tag in current tag group
      tag = tags_group_entry.addDefaultTag()
      // Full update
      updateThisAndRelatedComponents()
    }

    const inv_handleAddTagGrpButton = () => {
      // Delete given tag
      tag.delete()
      // Update menus
      updateThisAndRelatedComponents()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleAddTagGrpButton)
    new_data.history.saveRedo(_handleAddTagButton)
    // Execute original attr mutation
    _handleAddTagButton()
  }

  /**
   * Button handler for taggroup adding
   */
  const handleAddTagGrpButton = () => {
    // Create new default tag group
    let tag_group: Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup | Class_LevelTagGroup

    const _handleAddTagGrpButton = () => {
      tag_group = new_data.drawing_area.sankey.createTagGroup(elementTagNameProp)
      // Toogle saving indicator
      new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
      // Update components related to tags in menu config or toolbar
      new_data.menu_configuration.updateAllComponentsRelatedToTags()
      // Update this menu
      setTagsGroupEntryId(tag_group.id)

      // if we create a data_tag group then we add it selector in the navbar
      if (elementTagNameProp === 'data_taggs') {
        new_data.menu_configuration.ref_to_menu_updater.current()
      }
      updateThisAndRelatedComponents()
    }
    const inv_handleAddTagGrpButton = () => {
      new_data.drawing_area.sankey.removeTagGroup(elementTagNameProp, tag_group)
      // Update menus
      updateThisAndRelatedComponents()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleAddTagGrpButton)
    new_data.history.saveRedo(_handleAddTagGrpButton)
    // Execute original attr mutation
    _handleAddTagGrpButton()
  }

  /**
   * Button handler for tag deletion
   * @param {Class_Tag | Class_LevelTag | Class_DataTag} tag
   */
  const handleDelTag = (tag: Class_Tag | Class_LevelTag | Class_DataTag) => {
    const dict_ref_element = tag.references.map(el => el.id)
    // old_val is an organised dict that contain :
    // - 1 : Tag id
    // - 2 : Tag Name
    // - 3 : ids of elements Refs (nodes,links,...)
    // - 4 : Tag Group
    // - 5 : Tag color
    // - 6 : if It's a dataTag then save link value associated to this of each links

    type typeDictTag = {
      id: string,
      name: string,
      long_name: string,
      elementsRef: string[],
      grp: (Class_TagGroup | Class_LevelTagGroup | Class_DataTagGroup),
      color: string,
      dict_link_value: { [_: string]: { [_: string]: [Class_ElementValue, Class_DataTag[] | undefined]; } }

    }

    const old_val: typeDictTag
      = {
        id: tag.id,
        name: tag.name,
        long_name: tag.long_name,
        elementsRef: dict_ref_element,
        grp: tag.group,
        color: tag.color,
        dict_link_value: {}
      }

    if (tag instanceof Class_DataTag) {
      // Save value of each links in dict
      new_data.drawing_area.sankey.links_list.forEach(l => {
        old_val.dict_link_value[l.id] = l.getAllValues()
      })
    }

    const _handleDelTag = () => {
      // Delete given tag
      tag.delete()

      // If we delete a dataTag that is selected, we select another one (the first of the remaining group)
      if (tag instanceof Class_DataTag && tag.is_selected) {
        tag.group.tags_list[0].setSelected()
      }
      // Update menus
      updateThisAndRelatedComponents()
    }

    const inv_handleDelTag = () => {
      // Special treatement if its a dataTag we are restoring
      if (tag instanceof Class_DataTag) {
        new_data.drawing_area.sankey.links_list.forEach(l => {
          const l_values = old_val.dict_link_value[l.id]
          const val_to_restor = Object.values(l_values).filter(l_val => {
            return l_val[1] !== undefined && l_val[1].includes(tag)
          })
          if (val_to_restor[0][1])
            new_data.drawing_area.sankey.links_dict[l.id].setValuesForDataTags(val_to_restor[0][1], val_to_restor[0][0] as Class_LinkValue)
        })
      }

      // Recreate tag deleted & associate it to ref of deleted tag
      const grp = old_val.grp as Class_ProtoTagGroup
      const clone_tag = grp.addTag(old_val.name, old_val.id)
      clone_tag.setReferenceFromIds(old_val.elementsRef)
      clone_tag.color = old_val.color
      clone_tag.long_name = old_val.long_name
      updateThisAndRelatedComponents()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleDelTag)
    new_data.history.saveRedo(_handleDelTag)
    // Execute original attr mutation
    _handleDelTag()
  }

  /**
   * Button handler for tag group deletion
   *
   * @param {Class_TagGroup | Class_LevelTagGroup | Class_DataTagGroup} tagg
   */
  const handleDelGroupTag = (tagg: Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup) => {
    // old_val is an organised dict that contain :
    // - 1 : Tagg id
    // - 2 : Tagg Name
    // - 3 : Tagg use_colors
    // - 4 : Tagg banner
    // - 5 : Dict containing all info concerning the tags of the group
    // - 6 : if It's a dataTag then save link value associated to this of each links

    type typeDictTag = {
      id: string,
      name: string,
      activated: boolean,
      banner: tag_banner_type,
      dict_tag: { [x: string]: [id: string, name: string, color: string, elementsRef: string[], long_name: string] }
      dict_link_value: { [_: string]: { [_: string]: [Class_ElementValue, Class_DataTag[] | undefined]; } }
    }


    const old_val: typeDictTag
      = {
        id: tagg.id,
        name: tagg.name,
        activated: tagg.use_colors,
        banner: tagg.banner,
        dict_tag: Object.fromEntries(tagg.tags_list.map(tag => [tag.id, [tag.id, tag.name, tag.color, tag.references.map(el => el.id), tag.long_name]])),
        dict_link_value: {}
      }

    if (tagg instanceof Class_DataTagGroup) {
      new_data.drawing_area.sankey.links_list.forEach(l => {
        old_val.dict_link_value[l.id] = l.getAllValues()
      })
    }

    const _handleDelGroupTag = () => {
      // Delete given tag group
      new_data.drawing_area.sankey.removeTagGroup(elementTagNameProp, tagg)
      // Update menus
      updateThisAndRelatedComponents()
    }

    const inv_handleDelGroupTag = () => {
      let clone_tagg: Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup

      // Recreate Group tag to correct type
      if (tagg instanceof Class_NodeTagGroup) {
        clone_tagg = new_data.drawing_area.sankey.addNodeTagGroup(old_val.id, old_val.name, false)
      } else if (tagg instanceof Class_FluxTagGroup) {
        clone_tagg = new_data.drawing_area.sankey.addFluxTagGroup(old_val.id, old_val.name, false)
      } else {
        clone_tagg = new_data.drawing_area.sankey.addDataTagGroup(old_val.id, old_val.name, false)
      }

      // Special treatement if its a dataTag group we are restoring
      if (tagg instanceof Class_DataTagGroup) {
        new_data.drawing_area.sankey.links_list.forEach(l => {
          const l_values = old_val.dict_link_value[l.id]
          const val_to_restor = Object.values(l_values)
          if (val_to_restor[0][1])
            new_data.drawing_area.sankey.links_dict[l.id].setValuesForDataTags(val_to_restor[0][1], val_to_restor[0][0] as Class_LinkValue)
        })
      }

      Object.values(old_val.dict_tag).forEach(tag => {
        const n_tag = clone_tagg.addTag(tag[1], tag[0])
        n_tag.setReferenceFromIds(tag[3])
        n_tag.color = tag[2]
        n_tag.long_name = tag[4]
      })
      clone_tagg.banner = old_val.banner
      clone_tagg.use_colors = old_val.activated

      clone_tagg.updateTagsReferences()

      updateThisAndRelatedComponents()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleDelGroupTag)
    new_data.history.saveRedo(_handleDelGroupTag)
    _handleDelGroupTag()
  }

  /**
   * Button handler for tag group banner modification
   * @param {Class_TagGroup | Class_LevelTagGroup | Class_DataTagGroup} tag_group
   * @param {tag_banner_type} new_banner_type
   */
  const handleBanner = (
    tag_group: Class_TagGroup | Class_LevelTagGroup | Class_DataTagGroup,
    new_banner_type: tag_banner_type
  ) => {
    const old_banner = tag_group.banner

    const _handleBanner = () => {
      // UPdate banner for given tag group
      tag_group.banner = new_banner_type
      // Update menus
      updateThisAndRelatedComponents()
    }

    const inv_handleBanner = () => {
      // UPdate banner for given tag group
      tag_group.banner = old_banner
      // Update menus
      updateThisAndRelatedComponents()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleBanner)
    new_data.history.saveRedo(_handleBanner)
    // Execute original attr mutation
    _handleBanner()
  }

  const handleTagColor = (tag: Class_Tag | Class_DataTag | Class_LevelTag, _: string) => {
    const old_color = tag.color
    const _handleTagColor = () => {
      // Update tag color
      tag.color = _
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    const inv_handleTagColor = () => {
      // Update tag color
      tag.color = old_color
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleTagColor)
    new_data.history.saveRedo(_handleTagColor)
    // Execute original attr mutation
    _handleTagColor()
  }

  const toggleTagSelected = (tag: Class_Tag | Class_DataTag | Class_LevelTag) => {

    const _toggleTagSelected = () => {
      // Inverse selection
      tag.toogleSelected()
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(_toggleTagSelected)
    new_data.history.saveRedo(_toggleTagSelected)
    // Execute original attr mutation
    _toggleTagSelected()
  }

  /**
   * Button hadler for color randomised, can be undone
   *
   */
  const handleRandColor = () => {

    const dict_old_val = Object.fromEntries(tags_entry.map(tag => [tag.id, tag.color]))
    const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
    const nb_of_colors = tags_entry.length

    const _handleRandColor = () => {
      for (const i in d3.range(nb_of_colors)) {
        tags_entry[i].color =
          d3.color(color_selected(+i / nb_of_colors))?.formatHex() ?? default_grey_color
      }
      new_data.drawing_area.draw()
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    const inv_handleRandColor = () => {
      tags_entry.forEach(tag => {
        tag.color = dict_old_val[tag.id]
      })
      new_data.drawing_area.draw()
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleRandColor)
    new_data.history.saveRedo(_handleRandColor)
    // Execute original attr mutation
    _handleRandColor()
  }

  /**
   * Button hadler for color shuffle, can be undone
   *
   */
  const handleShuffleColor = () => {

    const dict_old_val = Object.fromEntries(tags_entry.map(tag => [tag.id, tag.color]))
    const colors = tags_entry.map(tag => tag.color)
    let nb_of_colors = colors.length

    const _handleShuffleColor = () => {
      // Color swaping between tags
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
    }

    const inv_handleShuffleColor = () => {
      tags_entry.forEach(tag => {
        tag.color = dict_old_val[tag.id]
      })
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleShuffleColor)
    new_data.history.saveRedo(_handleShuffleColor)
    // Execute original attr mutation
    _handleShuffleColor()
  }

  /**
   * Button hadler for palette selector, can be undone
   *
   * @param {string} _
   */
  const handleUsePalette = (_: string) => {
    // If custom color map, do nothing
    if (_ === 'custom') {
      return
    }
    const dict_old_val = Object.fromEntries(tags_entry.map(tag => [tag.id, tag.color]))

    const _handleUsePalette = () => {
      // Get random colors from color palette
      const nb_tags = tags_entry.length
      const colors = colormap({
        colormap: _,
        nshades: Math.max(11, nb_tags),
        format: 'hex',
        alpha: 1
      })
      let step = 1
      if (nb_tags < 11) {
        step = Math.round(11 / nb_tags)
      }
      // Apply colors to tags
      tags_entry.forEach(
        (tag, i) => tag.color = colors[i*step]
      )
      // Update displayed menu
      setColorMap(_)
      updateThisAndToggleSavingIndicator()
    }

    const inv_handleUsePalette = () => {
      tags_entry.forEach(tag => {
        tag.color = dict_old_val[tag.id]
      })
      // Update only this menu
      updateThisAndToggleSavingIndicator()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_handleUsePalette)
    new_data.history.saveRedo(_handleUsePalette)
    // Execute original attr mutation
    _handleUsePalette()
  }

  // Position mode toggles --------------------------------------------------------------
  const [showTagPositionMode, setShowTagPositionMode] = useState(false)
  const [showGrpPositionMode, setShowGrpPositionMode] = useState(false)
  // #1283 — nom long fusionné dans la colonne « Nom » : révélé par ligne (bouton
  // Aa) ou d'office quand il diffère du nom court (sinon redondant, place perdue).
  const [longNameShown, setLongNameShown] = useState<Set<string>>(new Set())
  const isLongShown = (tag: { id: string, name: string, long_name: string }) =>
    longNameShown.has(tag.id) || (!!tag.long_name && tag.long_name !== tag.name)
  const toggleLong = (tag_id: string) => setLongNameShown(prev => {
    const next = new Set(prev)
    if (next.has(tag_id)) next.delete(tag_id); else next.add(tag_id)
    return next
  })

  // Tags tables ------------------------------------------------------------------------
  let variant_table_edit_tag = 'table_edit_tag_node'
  let title = t('Tags.EEG')
  if (elementTagNameProp == 'flux_taggs' || elementTagNameProp == 'node_taggs') variant_table_edit_tag = 'table_edit_tag_link'
  if (elementTagNameProp == 'data_taggs') variant_table_edit_tag = 'table_edit_tag_data'
  if (elementTagNameProp == 'flux_taggs' || elementTagNameProp == 'node_taggs') variant_table_edit_tag = 'table_edit_tag_link'
  if (elementTagNameProp == 'level_taggs') title = t('Tags.EditDimensionLevel')
  const variant_table_edit_tag_final = showTagPositionMode ? variant_table_edit_tag + '_pos' : variant_table_edit_tag

  const variant_table_edit_grp = elementTagNameProp == 'data_taggs' ? 'table_edit_grp_tag_data' : 'table_edit_grp_tag_node_link'
  const variant_table_edit_grp_final = showGrpPositionMode ? variant_table_edit_grp + '_pos' : variant_table_edit_grp

  const tagSettingInner = (
    <>
      {/* #1283 — sélecteur de groupe masqué en mode groupe fixe (la carte impose le groupe). */}
      {!fixed_group_id && <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <span>{elementTagNameProp == 'level_taggs' ? t('Tags.Dimension') : t('Tags.GE')}:</span>
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
      </Box>}

      {elementTagNameProp !== 'level_taggs' ? <Box display='grid' gridTemplateColumns='1fr 1fr 1fr'>
        {/* Boutons des palettes de couleur  -------------------------------------------- */}

        {/* Palette de couleur aléatoire  */}
        <OSTooltip label={t('Tags.tooltips.pal')}>
          <Button
            variant='toolbar_button_3'
            onClick={handleRandColor}>
            {icon_palette_color}
          </Button>
        </OSTooltip>

        {/* Melanger les couleur  */}
        <OSTooltip label={t('Tags.tooltips.pal_shuffle')}>
          <Button
            variant='toolbar_button_4'
            onClick={handleShuffleColor}>
            {icon_random}
          </Button>
        </OSTooltip>

        {/* Palettes des couleurs standard */}
        <OSTooltip label={t('Tags.tooltips.pal_std')}>
          <Select
            variant='menuconfigpanel_option_select'
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                handleUsePalette(evt.target.value)
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
      </Box> : <></>}

      {/* Tableaux d'étiquettes  -------------------------------------------------------- */}
      {/* Entete du Tableau des étiquettes  */}
      <TableContainer>
        <Table variant={variant_table_edit_tag_final} >
          <Thead>
            <Tr >
              <Th>
                <Box layerStyle='options_2cols'>
                  {/* Bouton ajout d'une étiquette  */}
                  <OSTooltip label={t('Tags.tooltips.add')}>
                    <Button
                      variant='menuconfigpanel_add_button'
                      size='sizeConfigButton'
                      value='+'
                      onClick={handleAddTagButton}>
                      {icon_add_element}
                    </Button>
                  </OSTooltip>
                  {/* Bouton toggle mode position */}
                  <OSTooltip label={t('Tags.tooltips.position')}>
                    <Button
                      variant={showTagPositionMode ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_add_button'}
                      size='sizeConfigButton'
                      onClick={() => setShowTagPositionMode(!showTagPositionMode)}>
                      {icon_move_element_up}
                    </Button>
                  </OSTooltip>
                </Box>
              </Th>
              {/* #1283 — colonne « Nom » unique ; le nom long (affiché sur le
                  diagramme) se déplie dans la même cellule via le bouton Aa. */}
              <Th>
                {t('Tags.Nom')}
              </Th>
              {showTagPositionMode ?
                <Th>{t('Tags.Position')}</Th>
                : <>
                  {/* Etiquette visible  */}
                  {elementTagNameProp !== 'data_taggs' ?
                    <Th>
                      {t('Tags.Visible')}
                    </Th> : <></>
                  }
                  {elementTagNameProp !== 'level_taggs' ?
                    <Th>
                      {t('Tags.Couleur')}
                    </Th> : <></>
                  }
                </>
              }
            </Tr>
          </Thead>

          {/* Tableau des étqiuettes du groupe  */}
          <Tbody>
            {
              tags_entry.length > 0 ?
                tags_entry.map((tag, tag_idx) => {
                  return (
                    <Tr
                      key={tag.id}
                    >
                      {/* Supprimer une etiquette  */}
                      <Td w='1%'>
                        <OSTooltip label={t('Tags.tooltips.rm')}>
                          <Button
                            variant='menuconfigpanel_del_button_in_table'
                            value='-' onClick={() => { handleDelTag(tag) }}>
                            {icon_remove_element}
                          </Button>
                        </OSTooltip>
                      </Td>
                      {/* #1283 — cellule « Nom » unique : nom court + bouton Aa
                          révélant le nom long (affiché sur le diagramme), qui ne
                          s'affiche d'office que s'il diffère (sinon redondant).
                          Colonne FLEXIBLE (w=100%) : c'est elle qui prend la place. */}
                      <Td w='100%'>
                        <Box display='flex' flexDirection='column' gap='0.15rem'>
                          <Box display='flex' alignItems='center' gap='0.2rem'>
                            <InputGroup variant='menuconfigpanel_option_input_table' flex='1'>
                              <Input
                                variant='menuconfigpanel_option_input_table'
                                id={tag.id}
                                type="text"
                                value={tag.name}
                                onChange={
                                  (evt: React.ChangeEvent) => {
                                    tag.name = (evt.target as HTMLInputElement).value
                                    updateThisAndRelatedComponents()
                                  }
                                } />
                            </InputGroup>
                            <OSTooltip label={t('Tags.NomLong')}>
                              <Button
                                variant={isLongShown(tag) ? 'menuconfigpanel_icon_button_activated' : 'menuconfigpanel_icon_button'}
                                onClick={() => toggleLong(tag.id)}
                              >
                                <Box as='span' fontWeight='600'>Aa</Box>
                              </Button>
                            </OSTooltip>
                          </Box>
                          {isLongShown(tag) && (
                            <InputGroup variant='menuconfigpanel_option_input_table'>
                              <Input
                                // Non-contrôlé (defaultValue + onBlur) : le setter long_name
                                // redessine ; en contrôlé le curseur sautait au début. La key
                                // force le remontage si long_name change de l'extérieur.
                                key={tag.id + '_long_' + tag.long_name}
                                variant='menuconfigpanel_option_input_table'
                                id={tag.id + '_long'}
                                type="text"
                                defaultValue={tag.long_name}
                                placeholder={tag.name}
                                onBlur={
                                  (evt: React.FocusEvent) => {
                                    tag.long_name = (evt.target as HTMLInputElement).value
                                    updateThisAndRelatedComponents()
                                  }
                                } />
                            </InputGroup>
                          )}
                        </Box>
                      </Td>
                      {showTagPositionMode ?
                        /* Boutons monter/descendre l'étiquette */
                        <Td w='1%'>
                          <Box layerStyle="options_2cols">
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              isDisabled={tag_idx === 0}
                              onClick={() => {
                                new_data.history.saveUndo(() => {
                                  tags_group_entry.moveTagDown(tag.id)
                                  updateThisAndToggleSavingIndicator()
                                })
                                new_data.history.saveRedo(() => {
                                  tags_group_entry.moveTagUp(tag.id)
                                  updateThisAndToggleSavingIndicator()
                                })
                                tags_group_entry.moveTagUp(tag.id)
                                updateThisAndToggleSavingIndicator()
                              }}
                            >
                              {icon_move_element_up}
                            </Button>
                            <Button
                              variant='menuconfigpanel_option_button_in_table'
                              isDisabled={tag_idx === tags_entry.length - 1}
                              onClick={() => {
                                new_data.history.saveUndo(() => {
                                  tags_group_entry.moveTagUp(tag.id)
                                  updateThisAndToggleSavingIndicator()
                                })
                                new_data.history.saveRedo(() => {
                                  tags_group_entry.moveTagDown(tag.id)
                                  updateThisAndToggleSavingIndicator()
                                })
                                tags_group_entry.moveTagDown(tag.id)
                                updateThisAndToggleSavingIndicator()
                              }}
                            >
                              {icon_move_element_down}
                            </Button>
                          </Box>
                        </Td>
                        : <>
                          {/* Rendre ou non visible  */}
                          {
                            elementTagNameProp !== 'data_taggs' ?
                              <Td w='1%'>
                                <OSTooltip label={t('Tags.tooltips.visible')}>
                                  <Button
                                    variant='menuconfigpanel_option_button_in_table'
                                    name={'element_visible' + tag.id}
                                    id={tag.id}
                                    onClick={
                                      () => {
                                        toggleTagSelected(tag)
                                      }}
                                  >
                                    {tag.is_selected ? icon_element_visible : icon_element_invisible}
                                  </Button>
                                </OSTooltip>
                              </Td> :
                              <></>
                          }
                          {/* Choix de la couleur — colonne au CONTENU (w='1%'), la
                              largeur flexible va au Nom. Picker borné pour que
                              l'aperçu et la pipette restent collés. */}
                          {
                            elementTagNameProp !== 'level_taggs' ?
                              <Td w='1%'>
                                <OSTooltip label={t('Tags.tooltips.couleur')}>
                                  {/* Picker borné + on annule ici la mise en carré
                                      globale des boutons (compact_sx) qui déformait
                                      la pipette et écartait l'aperçu. */}
                                  <Box
                                    width='3rem'
                                    sx={{ '& button': { width: 'auto', minWidth: 'auto', height: 'auto', padding: 0 } }}
                                  >
                                    <MenuColorPicker
                                      initialColor={tag.color}
                                      onColorChange={(new_color) => {
                                        handleTagColor(tag, new_color)
                                      }}
                                    /></Box>
                                </OSTooltip>
                              </Td> :
                              <></>
                          }
                        </>
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
  // #1283 — en mode groupe fixe : pas de sous-section titrée (la carte identifie
  // déjà le groupe), contenu direct. Sinon, collapsible titré historique.
  const tagSetting = fixed_group_id
    ? tagSettingInner
    : <WrapperBoxSubSectionMenu new_data={new_data} title={title}>{tagSettingInner}</WrapperBoxSubSectionMenu>

  // Tag group menu ---------------------------------------------------------------------
  // #1283 — mode groupe fixe : en-tête COMPACT d'édition du GROUPE lui-même
  // (nom, bannière, unité pour les data, suppression), à la place de la table de
  // gestion multi-groupes. Réutilise les mêmes mutations que la table.
  const fixedGroupHeader = (fixed_group_id && tags_group_entry) ? (
    <Box display='grid' gridTemplateColumns={
      `1fr ${elementTagNameProp !== 'level_taggs' ? 'auto' : ''} ${elementTagNameProp === 'data_taggs' ? 'auto' : ''} auto`
    } gap='0.3rem' alignItems='center' marginBottom='0.3rem'>
      <OSTooltip label={t('Tags.tooltips.nom_grp')}>
        <Input
          variant='menuconfigpanel_option_input'
          value={tags_group_entry.name}
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
            tags_group_entry.name = evt.target.value
            updateThisAndRelatedComponents()
          }}
        />
      </OSTooltip>
      {elementTagNameProp !== 'level_taggs' && (
        <OSTooltip label={t('Tags.tooltips.banner')}>
          <Select
            variant='menuconfigpanel_option_select'
            value={(tags_group_entry as Class_ProtoTagGroup).banner}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
              handleBanner(tags_group_entry as Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup, evt.target.value as tag_banner_type)}
          >
            <option value='none'>{t('Menu.Aucun')}</option>
            <option value='one'>{t('Tags.Unique')}</option>
            <option value='multi'>{t('Tags.Multiple')}</option>
            {elementTagNameProp === 'data_taggs' && <option value='sequence'>{t('Tags.sequence')}</option>}
            {elementTagNameProp === 'data_taggs' && <option value='topbar'>{t('Tags.topbar')}</option>}
          </Select>
        </OSTooltip>
      )}
      {elementTagNameProp === 'data_taggs' && (
        <OSTooltip label={t('Tags.tooltips.unit')}>
          <Switch
            isChecked={(tags_group_entry as Class_DataTagGroup).is_unit}
            onChange={(evt) => {
              (tags_group_entry as Class_DataTagGroup).is_unit = evt.target.checked
              new_data.drawing_area.draw()
              updateThisAndRelatedComponents()
            }}
          />
        </OSTooltip>
      )}
      <OSTooltip label={t('Tags.tooltips.rm_grp')}>
        <Button
          size='xs'
          variant='menuconfigpanel_del_button'
          sx={{ minWidth: 'auto', paddingInline: '0.4rem' }}
          onClick={() => handleDelGroupTag(tags_group_entry as Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup)}
        >
          {icon_remove_element}
        </Button>
      </OSTooltip>
    </Box>
  ) : null

  // #1283 — grammaire compacte UNIQUE pour l'édition en place (mode groupe fixe) :
  // une seule règle normalise boutons carrés, inputs/selects xs, en-têtes de
  // colonne discrets et cellules serrées — plus rien n'est surdimensionné.
  const compact_sx = fixed_group_id ? {
    fontSize: '0.7rem',
    '& th': {
      fontSize: '0.56rem', letterSpacing: 0, textTransform: 'none',
      padding: '0.1rem 0.3rem', height: 'auto', color: 'gray.500'
    },
    '& td': { padding: '0.1rem 0.25rem' },
    '& button': {
      minWidth: '1.4rem', width: '1.4rem', height: '1.4rem',
      padding: 0, fontSize: '0.7rem'
    },
    '& button svg': { width: '0.8rem', height: '0.8rem' },
    '& input, & select': {
      height: '1.4rem', minHeight: 'unset', fontSize: '0.7rem', paddingInline: '0.3rem'
    },
    // La rangée de palettes (3 col) : boutons non carrés (texte/select), on
    // laisse le select respirer.
    '& select': { width: 'auto', minWidth: '3rem' }
  } : undefined

  return (<Box layerStyle='menuconfigpanel_grid' sx={compact_sx}>
    {fixedGroupHeader}
    {/* #1283 — table de GESTION des groupes (ajout/suppression/renommage/bannière
        de tous les groupes) masquée en mode groupe fixe : la carte n'édite qu'UN
        groupe. On ne garde que l'édition de ses étiquettes (tagSetting). */}
    {!fixed_group_id && <WrapperBoxSubSectionMenu new_data={new_data} title={elementTagNameProp == 'level_taggs' ? t('Tags.EditDimension') : t('Tags.EGE')}>
      {/* Groupe d'étiquette  */}
      <TableContainer>
        <Table variant={variant_table_edit_grp_final}>
          {/* Entete du tableau de grouep d'etiquette  */}
          <Thead>
            <Tr>
              {/* Ajouter un groupe */}
              <Th>
                <Box layerStyle='options_2cols'>
                  <OSTooltip label={t('Tags.tooltips.add_grp')}>
                    <Button
                      variant='menuconfigpanel_add_button'
                      size='sizeConfigButton'
                      onClick={handleAddTagGrpButton}>
                      {icon_add_element}
                    </Button>
                  </OSTooltip>
                  {/* Bouton toggle mode position */}
                  <OSTooltip label={t('Tags.tooltips.position')}>
                    <Button
                      variant={showGrpPositionMode ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_add_button'}
                      size='sizeConfigButton'
                      onClick={() => setShowGrpPositionMode(!showGrpPositionMode)}>
                      {icon_move_element_up}
                    </Button>
                  </OSTooltip>
                </Box>
              </Th>
              {/* Autre entetes  */}
              <Th>{t('Tags.Nom')}</Th>
              {showGrpPositionMode ?
                <Th>{t('Tags.Position')}</Th>
                : <>
                  <Th>{t('Tags.Bannière')}</Th>
                  {elementTagNameProp == 'data_taggs' ? <Th>{t('Tags.unit')}</Th> : <></>}
                </>
              }
            </Tr>
          </Thead>
          {/* Liste des groupes d'étiquettes  */}
          <Tbody>
            {
              tags_group_list.map((tag_group, grp_idx) => {

                let dataTagg_special_column = <></>
                const tag_group_as_data_grp = tag_group as Class_DataTagGroup
                if (elementTagNameProp == 'data_taggs') {
                  dataTagg_special_column = <>
                    <OSTooltip label={t('Tags.tooltips.unit')}>
                      <Td>
                        <Switch
                          justifySelf='end'
                          alignSelf='center'
                          height='1.5rem'
                          isChecked={tag_group_as_data_grp.is_unit}
                          onChange={evt => {
                            tag_group_as_data_grp.is_unit = evt.target.checked
                            new_data.drawing_area.draw()
                            // Update menus
                            updateThisAndRelatedComponents()
                          }}
                        />
                      </Td>
                    </OSTooltip>
                  </>

                }
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
                          {icon_remove_element}
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
                    {showGrpPositionMode ?
                      /* Boutons monter/descendre le groupe */
                      <Td>
                        <Box layerStyle="options_2cols">
                          <Button
                            variant='menuconfigpanel_option_button_in_table'
                            isDisabled={grp_idx === 0}
                            onClick={() => {
                              new_data.drawing_area.sankey.moveTagGroupUp(elementTagNameProp, tag_group.id)
                              updateThisAndToggleSavingIndicator()
                            }}
                          >
                            {icon_move_element_up}
                          </Button>
                          <Button
                            variant='menuconfigpanel_option_button_in_table'
                            isDisabled={grp_idx === tags_group_list.length - 1}
                            onClick={() => {
                              new_data.drawing_area.sankey.moveTagGroupDown(elementTagNameProp, tag_group.id)
                              updateThisAndToggleSavingIndicator()
                            }}
                          >
                            {icon_move_element_down}
                          </Button>
                        </Box>
                      </Td>
                      : <>
                        {/* Banniere  */}
                        <Td><OSTooltip label={t('Tags.tooltips.banner')}>
                          <Select
                            variant='menuconfigpanel_option_select_table'
                            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
                              handleBanner(tag_group, (evt.target.value as tag_banner_type))}
                            value={tag_group.banner}
                          >
                            <option
                              key={'none' + tag_group.id}
                              id='NoneBaner'
                              value='none'
                            >
                              {t('Menu.Aucun')}
                            </option>
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
                            </option>:<></>
                            {elementTagNameProp == 'data_taggs' ? <option
                              key={'sequence' + tag_group.id}
                              id='SequenceBaner'
                              value='sequence'
                            >
                              {t('Tags.sequence')}
                            </option> : <></>}
                            {elementTagNameProp == 'data_taggs' ? <option
                              key={'topbar' + tag_group.id}
                              id='TopbarBaner'
                              value='topbar'
                            >
                              {t('Tags.topbar')}
                            </option> : <></>}
                          </Select>
                        </OSTooltip>
                        </Td>
                        {/* is Sequence  */}
                        {dataTagg_special_column}
                      </>
                    }
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
      </TableContainer>
    </WrapperBoxSubSectionMenu>}
    {tags_group_list.length > 0 ? tagSetting : <></>}

  </Box>
  )
}

export default null

export { SankeySettingsEditionElementTags }
