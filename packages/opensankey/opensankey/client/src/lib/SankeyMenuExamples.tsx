/* eslint @typescript-eslint/no-var-requires: "off" */
import React, {Validator } from 'react'
import PropTypes, { InferProps,ReactElementLike } from 'prop-types'
import { NavDropdown, Dropdown, } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyLabelPropTypes } from './types'
import { uploadExemple,  } from './SankeyUtils'


/**
 * Description placeholder
 *
 * @type {*}
 */
const ExempleMenuDictTypes = PropTypes.objectOf(PropTypes.element.isRequired).isRequired
/**
 * Description placeholder
 *
 * @typedef {ExempleMenuTypes}
 */
type ExempleMenuTypes = InferProps<typeof ExempleMenuDictTypes>

/**
 * Description placeholder
 *
 * @type {{ exemple_menu: any; url_prefix: any; data: any; set_data: any; current_path: any; multi_selected_nodes: any; multi_selected_links: any; multi_selected_label: any; launch: any; }}
 */
const ExempleItemPropTypes = {
  exemple_menu : PropTypes.oneOf([PropTypes.element.isRequired,ExempleMenuDictTypes]).isRequired, 
  url_prefix : PropTypes.string.isRequired, 
  data : PropTypes.shape(SankeyDataPropTypes).isRequired, 
  set_data : PropTypes.func.isRequired, 
  current_path : PropTypes.string.isRequired, 
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  multi_selected_label: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired}).isRequired,
  //callback: PropTypes.func.isRequired,
  launch: PropTypes.func.isRequired
}

/**
 * Description placeholder
 *
 * @typedef {ExempleItemTypes}
 */
type ExempleItemTypes = InferProps<typeof ExempleItemPropTypes>

/**
 * Description placeholder
 *
 * @param {ExempleItemTypes} { exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,multi_selected_label,launch}
 * @returns {*}
 */
export const ExempleItem = ({ exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,multi_selected_label,launch}: ExempleItemTypes) => {
  return (
    <>
      { ('Files' in exemple_menu) 
        ? (exemple_menu['Files'] as string[]).map( (item,index)=> {
          //let the_callback = ()=> 0
          let path = current_path+'/sankey/'+item
          if (!item.includes('.xlsx') && !item.includes('.json')) {
            let url = window.location.origin + '/fm/userfiles/' + current_path + '/' + item
            let suffix = 'ZIP'
            if (!item.includes('zip')) {
              url = url + '/index.html'
              suffix = 'HTML'
            }
            return (
              <Dropdown.Item key={index} href={url} target="_blank">{current_path.split('/').slice(0, -1).pop() + ' ' + suffix}</Dropdown.Item>
            )
          }
          if (item.includes('.xlsx')) {
            //the_callback = callback
            path = current_path+'/'+item
          }
          return (
            <Dropdown.Item
              key={index}
              onClick={() => {
                multi_selected_nodes.current = []
                multi_selected_links.current = []
                multi_selected_label.current = []
                if (path.includes('xlsx')) {
                  launch(path, url_prefix)
                } 
                uploadExemple(
                  path, url_prefix, data, set_data
                )} 
              }
            >{item.includes('xlsx') ? item.includes('reconciled') ? item.split('.x')[0].replace(/_/g, ' ').replace('reconciled',' excel') : item.split('.x')[0].replace(/_/g, ' ') + ' excel'
                : item.includes('json') ? item.replace(/_/g, ' ').replace(' layout.json',' sankey') : item.replace('afmsankey_0.9.0.','')
              }</Dropdown.Item>
          )
        }
        ) : Object.keys(exemple_menu).map(
          (key, index) => {
            let title = key
            if (title === 'artefacts') {
              title = 'Page Web et Zip' 
            }
            if (key == 'Tests') {
              return <></>
            }
            let the_current_path = current_path
            if (!key.includes('OpenSankey')) {
              the_current_path = current_path !== '' ? current_path + '/' + key.replace('Sankey', '').replace('Excel', '') : key.replace('Sankey', '').replace('Excel', '')
            } else {
              the_current_path = current_path !== '' ? current_path + '/' + key : key
            }
            return (
              <>
                <NavDropdown drop='start' key={index} title={title} id={key} >
                  <ExempleItem
                    exemple_menu={(exemple_menu as unknown as {[key:string]:ExempleMenuTypes})[key] as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
                    url_prefix={url_prefix}
                    data={data}
                    set_data={set_data}
                    current_path={the_current_path}
                    multi_selected_links={multi_selected_links}
                    multi_selected_nodes={multi_selected_nodes}
                    multi_selected_label={multi_selected_label}
                    //callback={callback}
                    launch={launch}
                  />
                </NavDropdown>
              </>
            )
          }
        )
      }
    </>
  )
}



ExempleItem.propTypes = ExempleItemPropTypes

export default ExempleItem

