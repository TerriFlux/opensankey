// Standard libs
import React, {
  FunctionComponent,
  Ref,
} from 'react'
import { ReactElementLike } from 'prop-types'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box
} from '@chakra-ui/react'

// Local libs
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'
import { OpenSankeyConfigurationsMenusFType } from './types/SankeyMenuConfigurationTypes'


/**
 *  Define configuration menu
 *
 * @param { TODO type } applicationData - TODO description
 * @param { TODO type } applicationState - TODO description
 * @param { TODO type } applicationContext - TODO description
 * @param { TODO type } uiElementsRef - TODO description
 * @param { TODO type } dict_hook_ref_setter_show_dialog_components - TODO description
 * @param { TODO type } menu_configuration_layout - TODO description
 * @param { TODO type } menu_configuration_node_tags - TODO description
 * @param { TODO type } menu_configuration_link_tags - TODO description
 * @param { TODO type } menu_configuration_data_tags - TODO description
 * @param { TODO type } menu_configuration_nodes - TODO description
 * @param { TODO type } menu_configuration_links - TODO description
 * @param { TODO type } additional_accordion_edition_elements - TODO description
 * @param { TODO type } token - TODO description
 *
 */
export const OpenSankeyConfigurationsMenus : OpenSankeyConfigurationsMenusFType = (
  applicationData,
  applicationState,
  applicationContext,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  menu_configuration_layout,
  menu_configuration_node_tags,
  menu_configuration_link_tags,
  menu_configuration_data_tags,
  menu_configuration_nodes,
  menu_configuration_links,
  additional_accordion_edition_elements,
  link_function,
  ComponentUpdater,
  contextMenu,
  alt_key_pressed,
  node_function

) => {
  const {data}=applicationData
  const {t}=applicationContext
  const {links_accordion_ref, nodes_accordion_ref,accordion_ref} = uiElementsRef
  const {multi_selected_nodes}=applicationState
  // const {ref_setter_show_menu_config}=dict_hook_ref_setter_show_dialog_components
  const show_menu_config_tag = (
    (data.accordeonToShow.includes('EN') ||
     data.accordeonToShow.includes('EF') ||
     data.accordeonToShow.includes('ED')))
  return [
    data.accordeonToShow.includes('MEP')?
      <AccordionItem>
        {
          //MENU PARAMETRE GENERAUX
        }
        <AccordionButton
      onClick={()=>{
        const scroll_x = window.scrollX
        const scroll_y = window.scrollY
        setTimeout(() => {
          document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
        },50)}}
        >
          <Box
            as='span'
            layerStyle='menuconfig_entry'>
            {t('Menu.MEP')}
          </Box>
          <AccordionIcon/>
        </AccordionButton>
        <AccordionPanel>
          <Box layerStyle='menuconfigpanel_grid'>
            {menu_configuration_layout}
          </Box>
        </AccordionPanel>
      </AccordionItem>:
      <></>,

    <AccordionItem>
      {
        //MENU ITEMS
      }
      <AccordionButton
        ref={accordion_ref as Ref<HTMLButtonElement>}
        onClick={()=>{
          const scroll_x = window.scrollX
          const scroll_y = window.scrollY
          setTimeout(() => {
            document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
         },50)
        }
        }
      >
        <Box
          as='span'
          layerStyle='menuconfig_entry'>
          {t('Menu.Elements')}
        </Box>
        <AccordionIcon/>
      </AccordionButton>
      <AccordionPanel>
        <Accordion
          allowToggle
          variant='accordion_sublevel_style'
        >
          <AccordionItem>
            {
              //MENU NODES
            }
            <AccordionButton
              ref={nodes_accordion_ref as Ref<HTMLButtonElement>}
              onClick={()=>{
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
               },50)
              }}
            >
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.EdN')}
              </Box>
              <AccordionIcon/>
            </AccordionButton>
            <AccordionPanel>
              <SankeyNodeEdition
                applicationContext={applicationContext}
                applicationData={applicationData}
                applicationState={applicationState}
                multi_selected_nodes={multi_selected_nodes}
                menu_configuration_nodes={menu_configuration_nodes}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                node_function={node_function}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            {
              //MENU LINKS
            }
            <AccordionButton
              ref={links_accordion_ref as Ref<HTMLButtonElement>}
              onClick={()=>{
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
               },50)
              }}
            >
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.EdF')}
              </Box>
              <AccordionIcon/>
            </AccordionButton>
            <AccordionPanel>
              <SankeyMenuConfigurationLinks
                applicationData={applicationData}
                applicationContext={applicationContext}
                applicationState={applicationState}
                menu_configuration_links={menu_configuration_links}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                contextMenu={contextMenu}
                uiElementsRef={uiElementsRef}
                alt_key_pressed={alt_key_pressed}
                dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
                node_function={node_function}
              />
            </AccordionPanel>
          </AccordionItem>
          {additional_accordion_edition_elements}
        </Accordion>
      </AccordionPanel>
    </AccordionItem>,

    show_menu_config_tag?
      <AccordionItem>
        {
          //MENU ETIQUETTES
        }
        <AccordionButton
          onClick={()=>{
            const scroll_x = window.scrollX
            const scroll_y = window.scrollY
            setTimeout(() => {
              document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
            },50)
          }}        
        >
          <Box
            as='span'
            layerStyle='menuconfig_entry'>
            {t('Menu.Etiquettes')}
          </Box>
          <AccordionIcon/>
        </AccordionButton>
        <AccordionPanel>
          <Accordion
            allowToggle
            variant="accordion_sublevel_style"
          >
            <AccordionItem
              style={{ 'display': (data.accordeonToShow.includes('EN')) ? 'initial' : 'none' }}
            >
              {
                //MENU ETIQUETTES DE NOEUDS
              }
              <AccordionButton
                onClick={()=>{
                  const scroll_x = window.scrollX
                  const scroll_y = window.scrollY
                  setTimeout(() => {
                    document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
                },50)
                }}>
                <Box
                  as='span'
                  layerStyle='submenuconfig_entry'>
                  {t('Menu.EN')}
                </Box>
                <AccordionIcon/>
              </AccordionButton>
              <AccordionPanel>
                {menu_configuration_node_tags}
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem
              style={{ 'display': (data.accordeonToShow.includes('EF')) ? 'initial' : 'none' }}
            >
              {
                //MENU ETIQUETTES DE FLUX
              }
              <AccordionButton
              onClick={()=>{
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
               },50)
              }}
              >
                <Box
                  as='span'
                  layerStyle='submenuconfig_entry'>
                  {t('Menu.EF')}
                </Box>
                <AccordionIcon/>
              </AccordionButton>
              <AccordionPanel>
                {menu_configuration_link_tags}
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem
              style={{ 'display': (data.accordeonToShow.includes('ED')) ? 'initial' : 'none' }}
            >
              {
                //MENU ETIQUETTES DE DONNÉES
              }
              <AccordionButton
              onClick={()=>{
                const scroll_x = window.scrollX
                const scroll_y = window.scrollY
                setTimeout(() => {
                  document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
               },50)
              }}
              >
                <Box
                  as='span'
                  layerStyle='submenuconfig_entry'>
                  {t('Menu.ED')}
                </Box>
                <AccordionIcon/>
              </AccordionButton>
              <AccordionPanel>
                {menu_configuration_data_tags}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </AccordionPanel>
      </AccordionItem>:
      <></>
  ]
}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
export type ConfigurationMenuTypes = {
  configuration_menus: JSX.Element[],
}

export const SankeyConfigurationMenu: FunctionComponent<ConfigurationMenuTypes> = (
  {
    configuration_menus
  }
) => {

  return (
    <Accordion allowToggle>
      {configuration_menus.map((c:ReactElementLike, i:number)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Accordion>
  )
}