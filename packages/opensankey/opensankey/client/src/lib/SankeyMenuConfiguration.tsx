import Accordion from 'react-bootstrap/Accordion'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyLink, SankeyData, SankeyNode, SankeyLabel } from './types'
import React, { FunctionComponent, useState, Ref } from 'react'
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
// import SankeyLabelEdition from './SankeyMenuConfigurationLabel'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'
import { TFunction } from 'i18next'

export const OpenSankeyConfigurationsMenus = (
  t:TFunction,
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  nav_item_active:string,
  set_nav_item_active:(d:string)=>void,
  nodes_accordion_ref:Ref<HTMLDivElement>,
  links_accordion_ref:Ref<HTMLDivElement>,
  selected_node:{current:SankeyNode},
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  selected_link:{current:SankeyLink},
  multi_selected_label:{current: SankeyLabel[] },
  style_to_apply:string,
  set_style_to_apply:(s:string)=>void,
  set_show_nav:(d:boolean)=>void,
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
  menu_configuration_free_labels:JSX.Element[],
  menu_configuration_legends:JSX.Element[]

) => {
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
  return [
    <Accordion.Item
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
        {menu_configuration_layout}
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
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
            style={{ 'display': (data.accordeonToShow.includes('EN')) ? 'block' : 'none' }}
            eventKey="EtiquetteNoeud"
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  set_sub_nav_item_active('')
                  set_nav_item_active('2')
                  set_show_nav(true)
                } else {
                  set_sub_nav_item_active('EtiquetteNoeud')
                  set_nav_item_active('2')
                  set_show_nav(true)

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

          <Accordion.Item eventKey='editionNoeud'
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  set_sub_nav_item_active('')
                  set_nav_item_active('2')
                  set_show_nav(true)
                } else {
                  set_sub_nav_item_active('editionNoeud')
                  set_nav_item_active('2')
                  set_show_nav(true)

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
                style_to_apply={style_to_apply}
                set_style_to_apply={set_style_to_apply}
                selected_node={selected_node}
                multi_selected_nodes={multi_selected_nodes}
                multi_selected_links={multi_selected_links}
                menu_configuration_nodes={Object.values(menu_configuration_nodes)}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
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
            eventKey="8"
            style={{ 'display': (data.accordeonToShow.includes('EF')) ? 'block' : 'none' }}
            onClick={evt => {
              if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                set_sub_nav_item_active('')
                set_nav_item_active('3')
                set_show_nav(true)
              } else {
                set_sub_nav_item_active('8')
                set_nav_item_active('3')
                set_show_nav(true)
              }
            }}
          >
            <Accordion.Header className='level2' >{t('Menu.EF')}</Accordion.Header>
            <Accordion.Body>{menu_configuration_link_tags}</Accordion.Body>
          </Accordion.Item>
          <Accordion.Item  
            eventKey='editionFlux'
            onClick={
              evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                  set_sub_nav_item_active('')
                  set_nav_item_active('3')
                  set_show_nav(true)
                } else {
                  set_sub_nav_item_active('editionFlux')
                  set_nav_item_active('3')
                  set_show_nav(true)

                }
              }
            }>
            <Accordion.Header className='level2'>Edition Flux</Accordion.Header>
            <Accordion.Body>
              <SankeyMenuConfigurationLinks
                t={t}
                data={data}
                set_data={set_data}
                selected_link={selected_link}
                multi_selected_links={multi_selected_links}
                menu_configuration_links={Object.values(menu_configuration_links)}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
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
    <Accordion.Item
      id="LL"
      eventKey="7"
      style={{ 'display': (data.accordeonToShow.includes('LL')) ? 'block' : 'none' }}
      onClick={evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '7') {
          set_nav_item_active('')
        } else {
          set_nav_item_active('7')
        }
      }}
    >
      <Accordion.Header>{t('Menu.LL')}</Accordion.Header>
      <Accordion.Body>
        {/* <SankeyLabelEdition
          t={t}
          data={data}
          set_data={set_data}
          multi_selected_label={multi_selected_label}
        /> */}
        {menu_configuration_free_labels}
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      id="Legend"
      style={{ 'display': (data.accordeonToShow.includes('Leg')) ? 'block' : 'none' }}
      eventKey="legend"
      onClick={
        evt => {
          if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'legend') {
            set_nav_item_active('')
          } else {
            set_nav_item_active('legend')
          }
        }
      }>
      <Accordion.Header>{t('Menu.Leg')}</Accordion.Header>
      <Accordion.Body>
        {menu_configuration_legends}
      </Accordion.Body>
    </Accordion.Item>
  ]
}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
const ConfigurationMenuPropTypes = {
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement).isRequired}).isRequired,
  nav_item_active: PropTypes.string.isRequired,
  configuration_menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired
}
/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type ConfigurationMenuTypes = InferProps<typeof ConfigurationMenuPropTypes>

export const SankeyConfigurationMenu: FunctionComponent<ConfigurationMenuTypes> = (
  { 
    nav_item_active,
    accordion_ref,
    configuration_menus
  }
) => {
  return (
    <Accordion ref={accordion_ref as Ref<HTMLDivElement>} activeKey={nav_item_active as string} >
      {configuration_menus}
    </Accordion>
  )
}