/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { NavDropdown, Dropdown, } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyLink } from '../types/Types'
import { UploadExemple } from '../dialogs/SankeyPersistence'
import { ConvertDataFuncType } from '../configmenus/types/SankeyConvertTypes'
import {  DefaultSankeyDataFuncType } from '../configmenus/types/SankeyUtilsTypes'

/**
 * Description placeholder
 *
 * @type {*}
 */
export type ExempleMenuTypes = {[_:string]:ExempleMenuTypes|string[]}

type subtypeFileList={[_:string]:string[]}
type subtypeObjectList={[_:string]:ExempleMenuTypes}

/**
 * Description placeholder
 *
 * @type {{ exemple_menu: any; url_prefix: any; data: any; set_data: any; current_path: any; multi_selected_nodes: any; multi_selected_links: any; multi_selected_label: any; launch: any; }}
 */
export type ExempleItemTypes = {
  exemple_menu : JSX.Element | ExempleMenuTypes,
  url_prefix : string, 
  data : SankeyData, 
  set_data : (_:SankeyData)=>void 
  current_path : string, 
  multi_selected_nodes: {current:SankeyNode[]},
  multi_selected_links: {current:SankeyLink[]},
  launch: (s:string) => void,
  Reinitialization: () => void,
  convert_data:ConvertDataFuncType,
  DefaultSankeyData:DefaultSankeyDataFuncType
}

/**
 * Description placeholder
 *
 * @param {ExempleItemTypes} { exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,multi_selected_label,launch}
 * @returns {*}
 */
export const ExempleItem = (
  { exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,launch,Reinitialization,convert_data,DefaultSankeyData
  }: ExempleItemTypes) => {
  return (
    <>
      { ('Files' in exemple_menu) 
        ? (exemple_menu as subtypeFileList)['Files'].map( (item,index)=> {
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
            path = current_path+'/'+item
          }
          return (
            <Dropdown.Item
              key={index}
              onClick={() => {
                multi_selected_nodes.current = []
                multi_selected_links.current = []
                if (path.includes('xlsx')) {
                  launch(path)
                }
                UploadExemple(
                  path, url_prefix, data, set_data,Reinitialization,convert_data,DefaultSankeyData
                )} 
              }
            >{item.includes('xlsx') ? item.includes('reconciled') ? item.split('.x')[0].replace(/_/g, ' ').replace('reconciled',' excel') : item.split('.x')[0].replace(/_/g, ' ') + ' excel'
                : item.includes('json') ? item.replace(/_/g, ' ').replace(' layout.json',' sankey') : item.replace('afmsankey_0.9.0.','')
              }</Dropdown.Item>
          )
        }
        ) : Object.keys(exemple_menu).map(
          (key, index) => {
            const tmp_title = key.replaceAll('_','__').split('__')
            if(tmp_title.length>1){
              tmp_title.shift()
            }
            const title=tmp_title.join(' ')
            
            if (key === 'artefacts') {
              return <></> 
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
                <NavDropdown drop='end' key={index} title={title} id={key} >
                  <ExempleItem
                    exemple_menu={(exemple_menu as subtypeObjectList)[key]}
                    url_prefix={url_prefix}
                    data={data}
                    set_data={set_data}
                    current_path={the_current_path}
                    multi_selected_links={multi_selected_links}
                    multi_selected_nodes={multi_selected_nodes}
                    launch={launch}
                    Reinitialization={Reinitialization}
                    convert_data={convert_data}
                    DefaultSankeyData={DefaultSankeyData}
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

export default ExempleItem

