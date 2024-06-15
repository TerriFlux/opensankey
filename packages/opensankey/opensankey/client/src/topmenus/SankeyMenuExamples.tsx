
import React from 'react'
import { applicationContextType, applicationDataType, applicationStateType } from '../types/Types'
import { DownloadExamples, UploadExemple } from '../dialogs/SankeyPersistence'
import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

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
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  exemple_menu : JSX.Element | ExempleMenuTypes,
  current_path : string,
  launch: (s:string) => void,
  Reinitialization: () => void,
  initial_list:boolean
}

/**
 * Description placeholder
 *
 * @param {ExempleItemTypes} { exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,multi_selected_label,launch}
 * @returns {*}
 */
export const ExempleItem = (
  {
    applicationContext,
    applicationData,
    applicationState,
    exemple_menu,
    current_path,
    launch,Reinitialization,
    initial_list
  }: ExempleItemTypes
) => {
  const {data,set_data,convert_data,get_default_data}=applicationData
  const {url_prefix}=applicationContext
  const {multi_selected_nodes,multi_selected_links}=applicationState
  let content=<></>
  let item=Object.keys(exemple_menu).map(
    (key, index) => {
      const tmp_title = key.replaceAll('_','__').split('__')
      if(tmp_title.length>1){
        tmp_title.shift()
      }
      let title=tmp_title.join(' ')
      if (title === 'Formations') {
        title = 'Démos'
      }
      let the_current_path = current_path !== '' ? current_path + '/' + key : key
      if (key === 'Etude' || key === 'Démos') {
        if (typeof (exemple_menu as subtypeObjectList)[key] === 'string') {
          return <></>
        }
        return <ExempleItem
                applicationContext={applicationContext}
                applicationData={applicationData}
                applicationState={applicationState}
                exemple_menu={(exemple_menu as subtypeObjectList)[key]}
                current_path={the_current_path}
                launch={launch}
                Reinitialization={Reinitialization}
                initial_list={false}
              />
      }
      if (typeof (exemple_menu as subtypeObjectList)[key] === 'string') {
        return <></>
      }
      if (key === 'Files') {
        return <></>
      }      
      return (
        <Menu variant={initial_list?'menu_subnav_initial_item_demo':'menu_subnav_item_demo' } placement='end' key={index} id={key} >
          <MenuButton variant='submenu_nav_btn_dropdown_item_demo' as={Button}  rightIcon={<ChevronRightIcon/>}>
            {title} 
          </MenuButton>
          <MenuList>
            <ExempleItem
              applicationContext={applicationContext}
              applicationData={applicationData}
              applicationState={applicationState}
              exemple_menu={(exemple_menu as subtypeObjectList)[key]}
              current_path={the_current_path}
              launch={launch}
              Reinitialization={Reinitialization}
              initial_list={false}
            />
          </MenuList>
        </Menu>
      )
    }
  )
  if ('Files' in exemple_menu) {
    const files_item=(exemple_menu as subtypeFileList)['Files'].map( (item,index)=> {
      // let path = current_path+'/sankey/'+item
      // if (item.includes('.xlsx')) {
      const path = current_path+'/'+item
      //}
      return (
        <MenuItem
          key={index}
          onClick={() => {
            multi_selected_nodes.current = []
            multi_selected_links.current = []
            if (path.includes('xlsx')) {
              launch(path)
              DownloadExamples(path,url_prefix,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            } else {
              UploadExemple(
                path, url_prefix, data, set_data,Reinitialization,convert_data,get_default_data
              )
            }
            // UploadExemple(
            //   path, url_prefix, data, set_data,Reinitialization,convert_data,get_default_data
            // )}
          }
        }>{item.includes('xlsx') ? item.includes('reconciled') ? item.split('.x')[0].replace(/_/g, ' ').replace('reconciled',' excel') : item.split('.x')[0].replace(/_/g, ' ') + ' excel'
            : item.includes('json') ? item.replace(/_/g, ' ').replace(' layout.json',' sankey') : item.replace('afmsankey_0.9.0.','')
          }</MenuItem>
      )
    } 
    ) as JSX.Element[]
    item = [...item,...files_item]
    // content=<>
    //   {list_item}
    // </>
  }
  content=<>{item}</>

  return content

}

export default ExempleItem

