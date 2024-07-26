import React, { FunctionComponent, useState } from 'react'
import { FaArrowAltCircleUp, FaArrowAltCircleDown} from 'react-icons/fa'

import {
  Box,
  Button,
  Checkbox,
  Select,
  TabPanel,
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  useBoolean,
} from '@chakra-ui/react'

import { OSTooltip } from './SankeyUtils'
import { SankeyMenuConfigurationNodesIOFType } from './types/SankeyMenuConfigurationNodesIOTypes'
import { Class_LinkElement, Type_Side } from '../types/Link'


/**
 * Define IO selection menu for nodes
 *
 * @param {*} {
 *   applicationContext,
 *   applicationData,
 *   applicationState,
 *   node_function,
 *   link_function,
 *   ComponentUpdater,
 *   menu_for_modal
 * }
 * @return {*}
 */
export const SankeyMenuConfigurationNodesIO : FunctionComponent<SankeyMenuConfigurationNodesIOFType> = ({
  applicationContext,
  applicationData,
  menu_for_modal
}) => {

  // Data -------------------------------------------------------------------------------

  const { t } = applicationContext
  const { new_data } = applicationData

  const list_nodes_selected = new_data.drawing_area.selected_nodes_list
  let has_at_least_one_input_link = false
  let has_at_least_one_output_link = false
  list_nodes_selected.forEach(node => {
    has_at_least_one_input_link = (has_at_least_one_input_link || node.hasOutputLinks())
    has_at_least_one_output_link = (has_at_least_one_output_link || node.hasOutputLinks())
  })

  const unique_node_selected = (list_nodes_selected.length === 1) ? list_nodes_selected[0] : undefined
  const has_input_links = unique_node_selected?.hasInputLinks() ?? false
  const has_output_links = unique_node_selected?.hasOutputLinks() ?? false

  const output_direction = 'o'
  const input_direction = 'i'
  const [direction_selected, setSelectedDirection] = useState<string | undefined>(undefined)
  const [side_selected, setSelectedSide] = useState<Type_Side | undefined>(undefined)

  // Set direction state
  if (!direction_selected) {
    if (has_input_links)
      setSelectedDirection(input_direction)
    else if (has_output_links)
      setSelectedDirection(output_direction)
  }
  else {
    if (!has_input_links && (direction_selected === input_direction))
      setSelectedDirection(undefined)
    else if (!has_output_links && (direction_selected === output_direction))
      setSelectedDirection(undefined)
  }

  // Set selected side
  if (direction_selected && !side_selected) {
    if (direction_selected === input_direction)
      setSelectedSide(unique_node_selected?.input_links_list[0]?.target_side ?? undefined)
    else
      setSelectedSide(unique_node_selected?.output_links_list[0]?.source_side ?? undefined)
  }
  else if (!direction_selected && side_selected) {
    setSelectedSide(undefined)  // reset selected side
  }

  // Set list of links to reorganize
  let links_to_reorganize: {[_ in Type_Side]:Class_LinkElement[]} = {'right': [], 'left': [], 'top': [], 'bottom': []}
  if ( unique_node_selected && direction_selected && side_selected )  {
    Object.keys(links_to_reorganize)
      .forEach((_) => {
        const side = _ as Type_Side
        if (direction_selected === output_direction){
          links_to_reorganize[side] = unique_node_selected.getOutputLinksForGivenSide(side)
        }
        else {
          links_to_reorganize[side] = unique_node_selected.getInputLinksForGivenSide(side)
        }
      })
  }

  // Boolean to color or not link table
  const [ tab_colored, setTabColored ] = useState(false)

  // Components updaters ---------------------------------------------------------------

  // Function used to force this component to reload
  const [ , refreshThis ] = useBoolean()

  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_config_node_io_updater.current = refreshThis.toggle

  /**
   * Local refresh function
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    refreshThis.toggle()
  }

  // JSX Components ---------------------------------------------------------------------

  const content_reorg=<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.Reorg_title')}
    </Box>

    <OSTooltip label={t('Noeud.tooltips.Reorg')}>
      <Button
        variant='menuconfigpanel_option_button'
        isDisabled= {!has_at_least_one_input_link && !has_at_least_one_output_link}
        onClick={() => {
          list_nodes_selected.forEach(node => node.reorganizeIOLinks())
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {t('Noeud.Reorg')}
      </Button>
    </OSTooltip>
  </Box>

  // Content to reorganize the i/o of only 1 node at the time
  const content_for_one_node = (
    unique_node_selected &&
    direction_selected &&
    side_selected
  ) ?
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {/* Choisir un lien entrant / sortant */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <OSTooltip label={t('Noeud.PF.tooltips.io')}>
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.PF.FES')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          value={direction_selected}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedDirection(evt.target.value)
          }}
        >
          {
            has_input_links?
              <option
                value={input_direction}
              >
                {t('Noeud.PF.ent')}
              </option>:
              <></>
          }
          {
            has_output_links?
              <option
                value={output_direction}
              >
                {t('Noeud.PF.sort')}
              </option>:
              <></>
          }
        </Select>
      </Box>

      {/* Choix des liens */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <OSTooltip label={t('Noeud.PF.tooltips.side')}>
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.PF.FRN')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          value={side_selected as string}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedSide(evt.target.value as Type_Side)
          }}
        >
          {
            (links_to_reorganize['left'].length > 0) ?
              <option value='left'>{t('Noeud.PF.gauche')}</option>:
              <></>
          }
          {
            (links_to_reorganize['right'].length > 0)?
              <option value='right'>{t('Noeud.PF.droite')}</option>:
              <></>
          }
          {
            (links_to_reorganize['top'].length > 0)?
              <option value='top'>{t('Noeud.PF.ades')}</option>:
              <></>
          }
          {
            (links_to_reorganize['bottom'].length > 0)?
              <option value='bottom'>{t('Noeud.PF.edes')}</option>:
              <></>
          }
        </Select>
      </Box>

      {/* Mettre les couleurs des flux dans le tableau pour les indentifier */}

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={tab_colored}
        onChange={(evt) => {
          setTabColored(evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.PF.tooltips.lti')}>
          {t('Noeud.PF.lti')}
        </OSTooltip>
      </Checkbox>

      {/* Table montrant les noeuds selectionnés  */}
      {
        <>
          <Table
            variant='striped'
          >
            <Thead>
              <Tr>
                <Th>{t('Menu.flux')}</Th>
                <Th>{t('Tags.Position')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                links_to_reorganize[side_selected]
                  .map((link, link_idx) => {
                    const color = link.getPathColorToUse()
                    const bc = { 'backgroundColor': (color && tab_colored) ? color : 'inherit' }
                    const first_link = (link_idx === 0)
                    const last_link = link_idx === (links_to_reorganize[side_selected].length - 1)

                    return (
                      <Tr key={link.id}>
                        <td style={bc}>{link.name}</td>
                        <td style={{ 'width': '10%' }}>
                          <Box layerStyle="options_2cols">
                            <Button
                              variant='menuconfigpanel_option_button'
                              isDisabled={first_link}
                              minWidth='0'
                              onClick={() => {
                                if (!first_link) {
                                  unique_node_selected.moveLinkToPositionInOrderBefore(
                                    link,
                                    links_to_reorganize[side_selected][link_idx - 1]
                                  )
                                }
                                refreshThisAndUpdateRelatedComponents()
                              }}
                            >
                              <FaArrowAltCircleUp />
                            </Button>
                            <Button
                              variant='menuconfigpanel_option_button'
                              isDisabled={last_link}
                              minWidth='0'
                              onClick={() => {
                                if (!last_link) {
                                  unique_node_selected.moveLinkToPositionInOrderAfter(
                                    link,
                                    links_to_reorganize[side_selected][link_idx + 1]
                                  )
                                }
                                refreshThisAndUpdateRelatedComponents()
                              }}
                            >
                              <FaArrowAltCircleDown />
                            </Button>
                          </Box>
                        </td>
                      </Tr>
                    )
                  })
              }
            </Tbody>
          </Table>
        </>
      }
    </Box>:
    <></>

  const content_always_present = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.Slct')}
    </Box>

    {/* Boutons de rérrangement / selection des flux  */}
    <Box
      as='span'
      layerStyle='options_2cols'
    >
      <OSTooltip label={t('Noeud.tooltips.SlctOutLink')}>
        <Button
          variant='menuconfigpanel_option_button_left'
          isDisabled= {!has_at_least_one_output_link}
          onClick={() => {
            new_data.drawing_area.purgeSelectionOfLinks()
            list_nodes_selected
              .forEach(node => {
                node.output_links_list
                  .forEach(link => new_data.drawing_area.addLinkToSelection(link))
              })
          }}
        >
          {t('Noeud.SlctOutLink')}
        </Button>
      </OSTooltip>

      <OSTooltip label={t('Noeud.tooltips.SlctInLink')}>
        <Button
          variant='menuconfigpanel_option_button_right'
          isDisabled= {!has_at_least_one_input_link}
          onClick={() => {
            new_data.drawing_area.purgeSelectionOfLinks()
            list_nodes_selected
              .forEach(node => {
                node.input_links_list
                  .forEach(link => new_data.drawing_area.addLinkToSelection(link))
              })
          }}
        >
          {t('Noeud.SlctInLink')}
        </Button>
      </OSTooltip>
    </Box>
  </Box>

  const content=<Box
    layerStyle='menuconfigpanel_grid'
  >
    {content_reorg}
    {content_for_one_node}
    {content_always_present}
  </Box>

  return menu_for_modal ?
    content :
    <TabPanel>
      {content}
    </TabPanel>

}


