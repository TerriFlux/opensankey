import Accordion from 'react-bootstrap/Accordion'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyLabelPropTypes, SankeyLink, SankeyData, SankeyNode, SankeyLabel } from './types'
import React, { FunctionComponent, useState, Ref } from 'react'
import {useTranslation} from 'react-i18next'
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
import SankeyLabelEdition from './SankeyMenuConfigurationLabel'
import SankeyMenuConfigurationLegend from './SankeyMenuConfigurationLegend'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'

export const OpenSankeyConfigurationsMenus = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  show_menu:boolean,
  nav_item_active:string,
  set_nav_item_active:(d:string)=>void,
  settings_edition: JSX.Element,
  settings_edition_node_tags:JSX.Element, 
  settings_edition_link_tags:JSX.Element, 
  settings_edition_data_tags:JSX.Element,
  nodes_accordion_ref:Ref<HTMLDivElement>,
  links_accordion_ref:Ref<HTMLDivElement>,
  selected_node:{current:SankeyNode},
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  selected_link:{current:SankeyLink},
  multi_selected_label:{current: SankeyLabel[] },
  style_to_apply:string,
  set_style_to_apply:(s:string)=>void,
  set_show_nav:(d:boolean)=>void
) => {
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
  const {t} =useTranslation()

  return [
    <Accordion.Item
      id='MEP'
      style={{ 'display': (show_menu && data.accordeonToShow.includes('MEP')) ? 'block' : 'none' }}
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
        {settings_edition}
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      style={{ 'display': (show_menu) ? 'block' : 'none' }}
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
            style={{ 'display': (show_menu && data.accordeonToShow.includes('EN')) ? 'block' : 'none' }}
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
            <Accordion.Header style={{ marginLeft: '25px'/*,padding:'10px' */ }} >
              {t('Menu.EN')}
            </Accordion.Header>
            <Accordion.Body>
              {settings_edition_node_tags}
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
                data={data}
                set_data={set_data}
                style_to_apply={style_to_apply}
                set_style_to_apply={set_style_to_apply}
                selected_node={selected_node}
                multi_selected_nodes={multi_selected_nodes}
                multi_selected_links={multi_selected_links}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      style={{ 'display': (show_menu) ? 'block' : 'none' }}
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
            style={{ 'display': (show_menu && data.accordeonToShow.includes('EF')) ? 'block' : 'none' }}
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
            <Accordion.Body>{settings_edition_link_tags}</Accordion.Body>
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
                data={data}
                set_data={set_data}
                selected_link={selected_link}
                multi_selected_links={multi_selected_links}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      id="dataTags"
      eventKey="dimension"
      style={{ 'display': (show_menu && data.accordeonToShow.includes('ED')) ? 'block' : 'none' }}
      onClick={evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'dimension') {
          set_nav_item_active('')
        } else {
          set_nav_item_active('dimension')
        }
      }}
    >
      <Accordion.Header>{t('Menu.ED')}</Accordion.Header>
      <Accordion.Body>{settings_edition_data_tags}</Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      id="LL"
      eventKey="7"
      style={{ 'display': (show_menu && data.accordeonToShow.includes('LL')) ? 'block' : 'none' }}
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
        <SankeyLabelEdition
          data={data}
          set_data={set_data}
          multi_selected_label={multi_selected_label}
        />
      </Accordion.Body>
    </Accordion.Item>,
    <Accordion.Item
      id="Legend"
      style={{ 'display': (show_menu && data.accordeonToShow.includes('Leg')) ? 'block' : 'none' }}
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
        <SankeyMenuConfigurationLegend
          data={data}
          set_data={set_data}
        />
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
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  show_menu: PropTypes.bool.isRequired,
  settings_edition: PropTypes.element.isRequired,
  settings_edition_node_tags: PropTypes.element.isRequired,
  settings_edition_link_tags: PropTypes.element.isRequired,
  settings_edition_data_tags: PropTypes.element.isRequired,

  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement).isRequired}).isRequired,
  nodes_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement).isRequired}).isRequired,
  links_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement).isRequired}).isRequired,

  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  multi_selected_label: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired}).isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,

  nav_item_active: PropTypes.string.isRequired,
  set_nav_item_active: PropTypes.func.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,

  configuration_menus: PropTypes.func.isRequired
}
/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type ConfigurationMenuTypes = InferProps<typeof ConfigurationMenuPropTypes>

export const SankeyConfigurationMenu: FunctionComponent<ConfigurationMenuTypes> = (
  { data, set_data,
    show_menu,
    nav_item_active,set_nav_item_active,
    settings_edition,
    settings_edition_node_tags, settings_edition_link_tags, settings_edition_data_tags,
    accordion_ref,
    nodes_accordion_ref,
    links_accordion_ref,
    selected_node,
    multi_selected_nodes,
    multi_selected_links,
    selected_link,
    multi_selected_label,
    style_to_apply,
    set_style_to_apply,
    set_show_nav,
    configuration_menus
  }
) => {
  return (
    <Accordion ref={accordion_ref as Ref<HTMLDivElement>} activeKey={nav_item_active as string} >
      {configuration_menus(
        data, set_data,show_menu,nav_item_active,set_nav_item_active,
        settings_edition,settings_edition_node_tags, settings_edition_link_tags, settings_edition_data_tags,
        nodes_accordion_ref,links_accordion_ref,
        selected_node,multi_selected_nodes,multi_selected_links,selected_link,multi_selected_label,
        style_to_apply,set_style_to_apply,set_show_nav
      ).map((c:JSX.Element)=>c)}
    </Accordion>
  )
}