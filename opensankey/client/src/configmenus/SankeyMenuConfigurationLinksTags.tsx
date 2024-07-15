import React, { FunctionComponent, useState } from 'react'
import { Box, Checkbox, Select, TabPanel } from '@chakra-ui/react'
import { MenuConfigurationLinksTagsFType } from './types/SankeyMenuConfigurationLinksTagsTypes'

export const MenuConfigurationLinksTags : FunctionComponent<MenuConfigurationLinksTagsFType> = ({
  applicationData,
  applicationState,
  applicationContext,
  menu_for_modal,
  ComponentUpdater,
  node_function,
  link_function
})=>{
  const {new_data}=applicationData
  const flux_taggs = new_data.drawing_area.sankey.flux_taggs_dict
  const data_taggs = new_data.drawing_area.sankey.data_taggs_dict
  const selected_links=new_data.drawing_area.selected_links_list
  const flux_reference_for_displayed_value=selected_links[0]

  const {t}=applicationContext
  const [forceUpdate,setForceUpdate]=useState(false)
  const newEntries = new Map(Object.entries(data_taggs).map(([dataTagKey, dataTag]) => {
    return (dataTag.tags_list.length > 0) ? [
      dataTagKey,
      dataTag.selected_tags_list.length > 0 ? Object.entries(dataTag.tags_dict).filter(tag => tag[1].is_selected)[0][0] : Object.keys(dataTag.tags_dict)[0]] : ['n', 'n']
  }))
  const dataTagsSelected = Object.fromEntries(newEntries)

  const [tags_group_key, set_tags_group_key] = useState(Object.keys(flux_taggs).length > 0 ? Object.keys(flux_taggs)[0] : '')
  const [data_tags_selected, set_data_tags_selected] = useState(dataTagsSelected)

  if (Object.keys(data_tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_data_tags_selected(dataTagsSelected)
  }
  const tags_visible = Object.keys(flux_taggs).length > 0

  // const ValueSelectedParameter = (): SankeyLinkValue => {
  //   if(multi_selected_links.current.length==0){
  //     return ({} as SankeyLinkValue)
  //   }else{
  //     if ( Object.keys(data.links).length === 0 || !(multi_selected_links.current[0].idLink in data.links) ) {
  //       let val = JSON.parse(JSON.stringify(Object(multi_selected_links.current[0].value)))
  //       Object.values(data_tags_selected).map(tag_selected => {
  //         if (val[tag_selected] === undefined) {
  //           val[tag_selected] = {}
  //         }
  //         val = val[tag_selected]
  //       })
  //       return val
  //     }
  //     let val = JSON.parse(JSON.stringify(Object(data.links[multi_selected_links.current[0].idLink].value)))
  //     Object.values(data_tags_selected).map(tag_selected => {
  //       if (val[tag_selected] === undefined) {
  //         val[tag_selected] = {'display_value': '',tags:{},value:0}
  //       }
  //       val = val[tag_selected]
  //     })
  //     return val
  //   }

  // }
  // Si le tags_group_key n'est pas (qu'il soit vide ou différent) dans la liste des keys de flux_taggs, alors on met à jour en prenant le premier
  if(!Object.keys(flux_taggs).includes(tags_group_key) && Object.keys(flux_taggs).length>0){
    set_tags_group_key(Object.keys(flux_taggs)[0])
  }
  const content =<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Menu.EF')}</Box>

    {/* Groupe d'étiquettes  */}
    <Select
      variant='menuconfigpanel_option_select'
      onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {set_tags_group_key(evt.target.value)
        setForceUpdate(!forceUpdate)
      }}
      value={tags_group_key}
    >
      {Object.entries(flux_taggs).map(
        (tags_group, i) =>
          <option
            key={i}
            value={tags_group[0]}>
            {tags_group[1].name}
          </option>)}
    </Select>

    {//Définition des valeurs selon les paramètre dataTags
      Object.entries(data_taggs).map(([dataTagKey, dataTag]) => {
        if (Object.keys(dataTag.tags_dict).length != 0) {
          return (<>
            <Box
              as='span'
              layerStyle='menuconfigpanel_part_title_3'
            >
              {dataTag.name}
            </Box>
            <Select
              variant='menuconfigpanel_option_select'
              name={dataTagKey}
              value={data_tags_selected[dataTagKey]}
              onChange={
                (evt: React.ChangeEvent<HTMLSelectElement>) => {
                  //Modifie les paramètres selectionnés
                  const { name, value } = evt.target
                  set_data_tags_selected(prevState => ({
                    ...prevState,
                    [name]: value
                  }))
                  setForceUpdate(!forceUpdate)
                }}>
              {Object.entries(dataTag.tags_dict).map(([tag_key, tag]) => {
                return (
                  <option key={tag.name} value={tag_key}>{tag.name}</option>
                )
              })}
            </Select></>
          )
        }
      })}

    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {
        (
          tags_visible &&
          tags_group_key != '' &&
          Object.keys(flux_taggs).includes(tags_group_key) &&
          selected_links.length!=0
        )
        ?
          Object.entries(flux_taggs[tags_group_key].tags_dict)
            .map(([tag_key,tag]) => {
              const is_selected = (
                flux_reference_for_displayed_value.tags[tags_group_key] &&
                flux_reference_for_displayed_value.tags[tags_group_key] === (tag))
              return (
                <Checkbox
                  variant='menuconfigpanel_option_checkbox'
                  isChecked={is_selected}
                  onChange={(evt) => {
                    const visible = evt.target.checked
                    selected_links.forEach(l=>{
                      if (visible) {
                        l.tags[tags_group_key]=tag
                      }
                      else {
                        // Remove deselected tag from links
                        delete l.tags[tags_group_key]
                      }
                    })
                    selected_links.forEach(l=>l.draw())
                    ComponentUpdater.updateComponenSaveInCache.current(false)
                    setForceUpdate(!forceUpdate)
                  }}>
                  {tag.name}
                </Checkbox>
              )
            })
        :
          <></>
      }
    </Box>
  </Box>



  return menu_for_modal?content:
    // [
    //   <Tab>
    //     <Box
    //       layerStyle='submenuconfig_tab'
    //     >
    //       {t('Noeud.tags_node.tags')}
    //     </Box>
    //   </Tab>,
    <TabPanel >
      {content}
    </TabPanel>
}
