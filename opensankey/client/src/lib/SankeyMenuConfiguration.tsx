import Accordion from 'react-bootstrap/Accordion'
import { ReactElementLike } from 'prop-types'
import React, { FunctionComponent, Ref, RefObject } from 'react'
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'
import { OpenSankeyConfigurationsMenusFType } from '../types/SankeyMenuConfigurationTypes'


export const OpenSankeyConfigurationsMenus : OpenSankeyConfigurationsMenusFType = (
  applicationData,
  elementsSelected,
  applicationContext,
  uiElementsRef,
  // ref_setter_show_menu_config,
  showMenuComponents,
  nav_item_active:string,
  set_nav_item_active:(d:string)=>void,
  sub_nav_item_active:string,
  set_sub_nav_item_active:(s:string)=>void,
  set_style_to_apply:(s:string)=>void,
  menu_configuration_layout: JSX.Element[],
  menu_configuration_node_tags:JSX.Element,
  menu_configuration_link_tags:JSX.Element,
  menu_configuration_data_tags:JSX.Element,
  menu_configuration_nodes:{
    [s: string]: JSX.Element;
  },
  menu_configuration_links:{
    [s: string]: JSX.Element;
  },
  menu_configuration_free_labels:JSX.Element,
  token:boolean,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  set_display_link_opacity:(s:string)=>void,
  pre_idSource:string,
  pre_idTarget:string
) => {
  const {data,set_data}=applicationData
  const {t}=applicationContext
  const {links_accordion_ref,nodes_accordion_ref}=uiElementsRef
  const {multi_selected_nodes}=elementsSelected
  const {ref_setter_show_menu_config}=showMenuComponents
  return [
    <Accordion.Item
      key='1'
      id='MEP'
      style={{ 'display': (data.accordeonToShow.includes('MEP')) ? 'block' : 'none' }}
      eventKey="1"
      onClick={
        evt => {
          if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '1') {
            set_nav_item_active('')
          } else {
            set_nav_item_active('1')
          }
        }
      }>
      {
        //MENU PARAMETRE GENERAUX
      }
      <Accordion.Header>{t('Menu.MEP')}</Accordion.Header>
      <Accordion.Body>
        {menu_configuration_layout.map((c,i)=>{
          return <React.Fragment key={i}>{c}</React.Fragment>})}
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      key='2'
      style={{ 'display': 'block'  }}
      eventKey="2"
      id="Nodes"
      onClick={
        evt => {
          if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && ((evt.target as unknown) as { textContent: string }).textContent === t('Menu.Noeuds') && nav_item_active === '2') {
            set_nav_item_active('')
          } else {
            set_nav_item_active('2')
          }
        }
      }
    >
      <Accordion.Header>{t('Menu.Noeuds')}</Accordion.Header>
      <Accordion.Body style={{ padding: '0px' }}>
        <Accordion ref={nodes_accordion_ref  as Ref<HTMLDivElement>} activeKey={sub_nav_item_active as string} >
          <Accordion.Item
            key='3'
            style={{ 'display': (data.accordeonToShow.includes('EN')) ? 'block' : 'none' }}
            eventKey="EtiquetteNoeud"
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  set_sub_nav_item_active('')
                  set_nav_item_active('2')
                  ref_setter_show_menu_config.current!(true)

                } else {
                  set_sub_nav_item_active('EtiquetteNoeud')
                  set_nav_item_active('2')
                  ref_setter_show_menu_config.current!(true)


                }
              }
            }
          >
            <Accordion.Header className='level2' >
              {t('Menu.EN')}
            </Accordion.Header>
            <Accordion.Body>
              {menu_configuration_node_tags}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item
            key='4' eventKey='editionNoeud'
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  set_sub_nav_item_active('')
                  set_nav_item_active('2')
                  ref_setter_show_menu_config.current!(true)

                } else {
                  set_sub_nav_item_active('editionNoeud')
                  set_nav_item_active('2')
                  ref_setter_show_menu_config.current!(true)

                }
              }
            }
          >
            <Accordion.Header className='level2' >{t('Menu.EdN')}</Accordion.Header>
            <Accordion.Body>
              <SankeyNodeEdition
                t={t}
                data={data}
                set_data={set_data}
                set_style_to_apply={set_style_to_apply}
                multi_selected_nodes={multi_selected_nodes}
                menu_configuration_nodes={Object.values(menu_configuration_nodes)}
                token={token}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      key='5'
      style={{ 'display': 'block' }}
      id='Flux'
      eventKey="3"
      onClick={evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '3') {
          set_nav_item_active('')
        } else {
          set_nav_item_active('3')
        }
      }}
    >
      <Accordion.Header >{t('Menu.flux')}</Accordion.Header>
      <Accordion.Body  style={{ padding: '0px' }}>
        <Accordion ref={links_accordion_ref as Ref<HTMLDivElement>} activeKey={sub_nav_item_active as string}>
          <Accordion.Item
            key='6'
            eventKey="8"
            style={{ 'display': (data.accordeonToShow.includes('EF')) ? 'block' : 'none' }}
            onClick={evt => {
              if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                set_sub_nav_item_active('')
                set_nav_item_active('3')
                ref_setter_show_menu_config.current!(true)

              } else {
                set_sub_nav_item_active('8')
                set_nav_item_active('3')
                ref_setter_show_menu_config.current!(true)

              }
            }}
          >
            <Accordion.Header className='level2' >{t('Menu.EF')}</Accordion.Header>
            <Accordion.Body>{menu_configuration_link_tags}</Accordion.Body>
          </Accordion.Item>
          <Accordion.Item
            key='7'
            eventKey='editionFlux'
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  set_sub_nav_item_active('')
                  set_nav_item_active('3')
                  ref_setter_show_menu_config.current!(true)

                } else {
                  set_sub_nav_item_active('editionFlux')
                  set_nav_item_active('3')
                  ref_setter_show_menu_config.current!(true)

                }
              }
            }>
            <Accordion.Header className='level2'>{t('Menu.EdF')}</Accordion.Header>
            <Accordion.Body>
              <SankeyMenuConfigurationLinks
                applicationData={applicationData}
                applicationContext={applicationContext}
                elementsSelected={elementsSelected}
                menu_configuration_links={Object.values(menu_configuration_links)}
                displayedInputLinkValueRef={displayedInputLinkValueRef}
                set_display_link_opacity={set_display_link_opacity}
                pre_idSource={pre_idSource}
                pre_idTarget={pre_idTarget}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      key='8'
      id="dataTags"
      eventKey="dimension"
      style={{ 'display': (data.accordeonToShow.includes('ED')) ? 'block' : 'none' }}
      onClick={evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'dimension') {
          set_nav_item_active('')
        } else {
          set_nav_item_active('dimension')
        }
      }}
    >
      <Accordion.Header>{t('Menu.ED')}</Accordion.Header>
      <Accordion.Body>{menu_configuration_data_tags}</Accordion.Body>
    </Accordion.Item>,

    <>{menu_configuration_free_labels}</>,
  ]
}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
export type ConfigurationMenuTypes = {
  accordion_ref: {current:HTMLDivElement},
  nav_item_active: string,
  configuration_menus: JSX.Element[],
}

export const SankeyConfigurationMenu: FunctionComponent<ConfigurationMenuTypes> = (
  {
    nav_item_active,
    accordion_ref,
    configuration_menus
  }
) => {
  return (
    <Accordion ref={accordion_ref as Ref<HTMLDivElement>} activeKey={nav_item_active as string} >
      {configuration_menus.map((c:ReactElementLike, i:number)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Accordion>
  )
}