// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  FaMinus,
  FaPlus,
} from 'react-icons/fa'
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
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

// Local types
import { MultiSelect } from 'react-multi-select-component'
import { Class_LevelTag, Class_LevelTagGroup } from '../../deps/OpenSankey/types/Tag'
import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'

export type FCType_SankeyPlusEditionLevelTag = { new_data: Class_ApplicationDataOSP }

export type Type_MenuSelectionEntry = { 'label': string; 'value': string }

export const MenuConfigurationLevelTags: FunctionComponent<FCType_SankeyPlusEditionLevelTag> = ({ new_data }) => {
  const { t } = new_data

  const tags_group_list = new_data.drawing_area.sankey.level_taggs_list
  const tags_group_dict = new_data.drawing_area.sankey.getTagGroupsAsDict('level_taggs')
  const [tags_group_entry_id, setTagsGroupEntryId] = useState(tags_group_list[0]?.id ?? '')
  const tags_group_entry = tags_group_dict[tags_group_entry_id] as Class_LevelTagGroup
  const tags_entry = tags_group_entry?.tags_list ?? []

  // Trigger reloading of this component ------------------------------------------------

  const [, setCount] = useState(0)
  const updateThis = () => {
    if (tags_group_dict[tags_group_entry_id])
      setCount(a => a + 1)
    else
      setTagsGroupEntryId(new_data.drawing_area.sankey.getTagGroupsAsList('level_taggs')[0]?.id ?? '')
  }
  new_data.menu_configuration.ref_to_menu_config_tags_updater['level_taggs'].current = updateThis

  // Update function --------------------------------------------------------------------

  const updateThisAndToggleSavingIndicator = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update this menu
    new_data.menu_configuration.updateAllComponentsRelatedToTagsType('level_taggs')
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
    // Create default tag in current tag group
    tags_group_entry.addDefaultTag()
    // Full update
    updateThisAndRelatedComponents()
  }

  /**
   * Button handler for tag group deletion
   *
   * @param {Class_LevelTagGroup} tagg
   */
  const handleDelGroupTag = (tagg: Class_LevelTagGroup) => {
    // Delete given tag group
    new_data.drawing_area.sankey.removeTagGroup('level_taggs', tagg)
    // Update menus
    updateThisAndRelatedComponents()
  }

  /**
   * Button handler for taggroup adding
   */
  const handleAddTagGrpButton = () => {
    // Create new default tag group
    const tag_group = new_data.drawing_area.sankey.createTagGroup('level_taggs')
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update components related to tags in menu config or toolbar
    new_data.menu_configuration.updateAllComponentsRelatedToTags()
    // Update this menu
    setTagsGroupEntryId(tag_group.id)

  }

  /**
   * Button handler for tag deletion
   * @param { Class_LevelTag} tag
   */
  const handleDelTag = (tag: Class_LevelTag) => {
    // Delete given tag
    tag.delete()
    // Update menus
    updateThisAndRelatedComponents()
  }


  // Variable containing edition of tags of selected group
  const tagSetting = (<>
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Text>{t('Tags.GE')}:</Text>

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
    </Box>
    {/* Tableaux d'étiquettes  -------------------------------------------------------- */}

    <TableContainer>
      <Table variant={'table_edit_tag_level'} >
        {/* Entete du Tableau des étiquettes  */}
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


  // Edition of group level tag isn't in a <Table> Component like for node & link tags 
  // because here we use a <MultiSelect> component that 'break' visually the table when we open a selector 

  return <Box layerStyle='menuconfigpanel_grid'>
    {/* Groupe d'étiquette  */}

    <Box layerStyle={'element_list_config_level_grp'}
    >
      <OSTooltip label={t('Tags.tooltips.add_grp')}>
        <Button
          size={'sm'}
          variant='menuconfigpanel_add_button'
          onClick={handleAddTagGrpButton}>
          <FaPlus />
        </Button>
      </OSTooltip>
      <strong>{t('Tags.Nom')}</strong>
      <strong>{t('Tags.siblings')}</strong>

    </Box>
    {tags_group_list.map(tag_group => {
      const list_grp_sibling = tag_group.siblings.map(sib => tags_group_dict[sib])

      // List of possible sibling (all level group except this one)
      const possible_sibling = tags_group_list.filter(other_grp => other_grp !== tag_group).map((d) => { return { 'label': d.name, 'value': d.id } })
      // List of sibling of this group
      const selected_sibling = list_grp_sibling.map((d) => { return { 'label': d.name, 'value': d.id } })

      return (
        <Box layerStyle={'element_list_config_level_grp'}
          key={tag_group.id}
        >
          {/* Suppression d'un groupe  */}
          <OSTooltip label={t('Tags.tooltips.rm_grp')}>
            <Button
              size={'sm'}
              variant='menuconfigpanel_del_button_in_table'
              onClick={() => handleDelGroupTag(tag_group)}
            >
              <FaMinus />
            </Button>
          </OSTooltip>
          {/* Renommer le groupe d'étiquettes */}
          <OSTooltip label={t('Tags.tooltips.nom_grp')}>
            <InputGroup variant='menuconfigpanel_option_input_table' >
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
          {/* sibling selector to affect siblings to current group */}
          <OSTooltip label={t('Tags.tooltips.sibling')}>
            <Box layerStyle='submenuconfig_droplist'>
              {/* Position custom pour MultiSelect */}
              <Box height='2rem' width='10rem'>
                <MultiSelect
                  hasSelectAll={false}
                  valueRenderer={(entries: Type_MenuSelectionEntry[]) => entries.filter(d => d !== undefined).length ? entries.map(({ label }) => label + ', ') : 'Aucun groupe antagoniste'}
                  options={possible_sibling}
                  value={selected_sibling}
                  onChange={(options_selected: [{ label: string, value: string }]) => {
                    // Update selection list
                    const entries_values = options_selected.map(d => d.value)
                    tags_group_list.forEach(grp_sibling => {
                      if (entries_values.includes(grp_sibling.id)) {
                        tag_group.addSibling(grp_sibling)
                      }
                      else {
                        tag_group.removeSibling(grp_sibling)
                      }
                    })
                    // Update all menus
                    updateThisAndRelatedComponents()
                  }}
                /></Box></Box>
          </OSTooltip>
        </Box>
      )
    })}
    {tags_group_list.length > 0 ? tagSetting : <></>}
  </Box>
}