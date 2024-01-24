import Accordion from 'react-bootstrap/Accordion'
import { ReactElementLike } from 'prop-types'
import React, { FunctionComponent, MutableRefObject, Ref, useState } from 'react'
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'
import { OpenSankeyConfigurationsMenusFType } from './types/SankeyMenuConfigurationTypes'


export const OpenSankeyConfigurationsMenus : OpenSankeyConfigurationsMenusFType = (
  dict_variable_application_data,
  dict_variable_elements_selected,
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
  token
) => {
  const [navitemactive, setnavitemactive] = useState('')
  const [subnavitemactive, setsubnavitemactive] = useState('')
  const { ref_setter_nav_item_active, ref_setter_sub_nav_item_active, ref_nav_item_active} = uiElementsRef
  ref_setter_nav_item_active.current = setnavitemactive
  ref_setter_sub_nav_item_active.current = setsubnavitemactive
  ref_nav_item_active.current = navitemactive

  const {data,set_data}=dict_variable_application_data
  const {t}=applicationContext
  const {links_accordion_ref,nodes_accordion_ref}=uiElementsRef
  const {multi_selected_nodes}=dict_variable_elements_selected
  const {ref_setter_show_menu_config}=dict_hook_ref_setter_show_dialog_components
  return [
    <Accordion.Item
      key='1'
      id='MEP'
      style={{ 'display': (data.accordeonToShow.includes('MEP')) ? 'block' : 'none' }}
      eventKey="1"
      onClick={
        evt => {
          if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && navitemactive === '1') {
            setnavitemactive('')
          } else {
            setnavitemactive('1')
          }
        }}>
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
      id="SubAccordionElements"
      onClick={
        evt => {
          if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && ((evt.target as unknown) as { textContent: string }).textContent === t('Menu.Elements') && navitemactive === '2') {
            setnavitemactive('')
          } else {
            setnavitemactive('2')
          }
        }}
    >
      <Accordion.Header>{t('Menu.Elements')}</Accordion.Header>
      <Accordion.Body style={{ padding: '0px' }}>
        <Accordion  activeKey={subnavitemactive} >
          <Accordion.Item
            key='4' eventKey='editionNoeud'
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  setsubnavitemactive('')
                } else {
                  setsubnavitemactive('editionNoeud')
                }
                setnavitemactive('2')
                ref_setter_show_menu_config.current(true)
              }
            }
            ref={nodes_accordion_ref  as Ref<HTMLDivElement>}
          >
            <Accordion.Header className='level2' >{t('Menu.EdN')}</Accordion.Header>
            <Accordion.Body>
              <SankeyNodeEdition
                t={t}
                data={data}
                set_data={set_data}
                multi_selected_nodes={multi_selected_nodes}
                menu_configuration_nodes={Object.values(menu_configuration_nodes)}
                token={token}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item
            ref={links_accordion_ref as Ref<HTMLDivElement>}
            key='7'
            eventKey='editionFlux'
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  setsubnavitemactive('')
                  setnavitemactive('3')
                  ref_setter_show_menu_config.current(true)

                } else {
                  setsubnavitemactive('editionFlux')
                  setnavitemactive('3')
                  ref_setter_show_menu_config.current(true)

                }
              }
            }>
            <Accordion.Header className='level2'>{t('Menu.EdF')}</Accordion.Header>
            <Accordion.Body>
              <SankeyMenuConfigurationLinks
                dict_variable_application_data={dict_variable_application_data}
                applicationContext={applicationContext}
                dict_variable_elements_selected={dict_variable_elements_selected}
                menu_configuration_links={Object.values(menu_configuration_links)}
              />
            </Accordion.Body>
          </Accordion.Item>
          {additional_accordion_edition_elements}
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,

    <Accordion.Item
      key='5'
      style={{ 'display': 'block' }}
      id='SubAccordionEtiquette'
      eventKey="3"
      onClick={evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && navitemactive === '3') {
          setnavitemactive('')
        } else {
          setnavitemactive('3')
        }
      }}
    >
      <Accordion.Header >{t('Menu.Etiquettes')}</Accordion.Header>
      <Accordion.Body  style={{ padding: '0px' }}>
        <Accordion activeKey={subnavitemactive}>
          <Accordion.Item
            key='3'
            style={{ 'display': (data.accordeonToShow.includes('EN')) ? 'block' : 'none' }}
            eventKey="EtiquetteNoeud"
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  setsubnavitemactive('')
                } else {
                  setsubnavitemactive('EtiquetteNoeud')
                }
                setnavitemactive('2')
                ref_setter_show_menu_config.current(true)
              }}
          >
            <Accordion.Header className='level2' >
              {t('Menu.EN')}
            </Accordion.Header>
            <Accordion.Body>
              {menu_configuration_node_tags}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item
            key='6'
            eventKey="8"
            style={{ 'display': (data.accordeonToShow.includes('EF')) ? 'block' : 'none' }}
            onClick={evt => {
              if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                setsubnavitemactive('')
              } else {
                setsubnavitemactive('8')
              }
              setnavitemactive('3')
              ref_setter_show_menu_config.current(true)
            }}
          >
            <Accordion.Header className='level2' >{t('Menu.EF')}</Accordion.Header>
            <Accordion.Body>{menu_configuration_link_tags}</Accordion.Body>
          </Accordion.Item>

          <Accordion.Item
            key='dt'
            id="dataTags"
            eventKey="dimension"
            style={{ 'display': (data.accordeonToShow.includes('ED')) ? 'block' : 'none' }}
            onClick={evt => {
              if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && navitemactive === 'dimension') {
                setsubnavitemactive('')
              } else {
                setsubnavitemactive('dimension')
              }
            }}
          >
            <Accordion.Header className='level2'>{t('Menu.ED')}</Accordion.Header>
            <Accordion.Body>{menu_configuration_data_tags}</Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,

  ]
}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
export type ConfigurationMenuTypes = {
  accordion_ref: MutableRefObject<HTMLDivElement|null>,
  ref_nav_item_active: MutableRefObject<string>,
  configuration_menus: JSX.Element[],
}

export const SankeyConfigurationMenu: FunctionComponent<ConfigurationMenuTypes> = (
  {
    ref_nav_item_active,
    accordion_ref,
    configuration_menus
  }
) => {
  return (
    <Accordion ref={accordion_ref as Ref<HTMLDivElement>} activeKey={ref_nav_item_active.current} >
      {configuration_menus.map((c:ReactElementLike, i:number)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Accordion>
  )
}