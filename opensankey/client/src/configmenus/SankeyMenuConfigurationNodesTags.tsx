import React, { FunctionComponent, useState } from 'react'
import {
  SankeyNode,
} from '../types/Types'
import {
  Box,
  Checkbox,
  Select,
  TabPanel
} from '@chakra-ui/react'
import { SankeyMenuConfigurationNodesTagsFType } from './types/SankeyMenuConfigurationNodesTagsTypes'
import { Class_NodeElement } from '../types/Node'
import { Class_Tag } from '../types/Tag'


/**
   * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
   * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
   * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
   *
   * @type {*}
   */
export const SankeyMenuConfigurationNodesTags : FunctionComponent<SankeyMenuConfigurationNodesTagsFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  node_function,
  ComponentUpdater,
  menu_for_modal
})=> {
  const { t } = applicationContext
  const { new_data} = applicationData
  const sankey_data=new_data.drawing_area.sankey
  const list_node_selected=new_data.drawing_area.selected_nodes_list

  const [tags_group_key, set_tags_group_key] = useState(Object.keys(sankey_data.node_taggs).length > 0 ? Object.keys(sankey_data.node_taggs)[0] : '')
  const [forceUpdate, setForceUpdate]=useState(false)
  const tags_visible = Object.keys(sankey_data.node_taggs).length > 0

  if ((tags_group_key == '' && Object.keys(sankey_data.node_taggs).length > 0) || (!Object.keys(sankey_data.node_taggs).includes(tags_group_key) && Object.keys(sankey_data.node_taggs).length > 0)) {
    set_tags_group_key(Object.keys(sankey_data.node_taggs)[0])
  }

  const content= <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Menu.EN')}
    </Box>

    {/* Groupe d'étiquettes  */}
    <Select
      variant='menuconfigpanel_option_select'
      value={tags_group_key}
      onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}
    >
      {
        Object
          .entries(sankey_data.node_taggs)
          .map((tags_group, i) =>
            <option
              key={i}
              value={tags_group[0]}
            >
              {tags_group[1].name}
            </option>
          )
      }
    </Select>

    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {
        tags_visible && tags_group_key != '' && Object.keys(sankey_data.node_taggs).includes(tags_group_key) ?
          Object
            .entries(sankey_data.node_taggs[tags_group_key].tags)
            .map(tags => {
              const allChecked = IsAllNodeTagsSame(list_node_selected,tags[1],tags_group_key)
              return (
                <Checkbox
                  variant='menuconfigpanel_tag_checkbox'
                  isIndeterminate={allChecked[1]}
                  isChecked={allChecked[0] as boolean}
                  onChange={(evt) => {
                    const visible = evt.target.checked
                    list_node_selected.map(d => {
                      if (visible) {
                        if (!d.tags[tags_group_key]) {
                          d.tags[tags_group_key] = []
                        }
                        d.tags[tags_group_key].push(tags[1])
                        // If the groue tage is 'Type de noeud' then we change the style
                        // to style of product or sector
                        // if(tags_group_key==='Type de noeud'){
                        //   if(tags[0]==='secteur'){
                        //     d.style='NodeSectorStyle'
                        //   }else  if(tags[0]==='produit'){
                        //     d.style='NodeProductStyle'
                        //   }
                        // }
                      } else {
                        // Remove deselected tag from array of selected for the groupe tag tags_group_key of selected nodes
                        d.tags[tags_group_key].splice(d.tags[tags_group_key].indexOf(tags[1]),1)

                        // If the groue tage is 'Type de noeud' then we change the style
                        // to style of product or sector according to tag still affected
                        // if neither 'produit' or 'secteur' are affected the change style to default
                        // if(tags_group_key==='Type de noeud' && d.tags[tags_group_key].length==0){
                        //   d.style='default'
                        // } else if (
                        //   (tags_group_key==='Type de noeud') &&
                        //   (d.tags[tags_group_key].includes('secteur') || d.tags[tags_group_key].includes('produit'))
                        // ){
                        //   if (tags[0]==='secteur') {
                        //     d.style='NodeProductStyle'
                        //   } else if (tags[0]==='produit'){
                        //     d.style='NodeSectorStyle'
                        //   }
                        // }
                      }
                    })
                    setForceUpdate(!forceUpdate)
                    // node_function.RedrawNodes(multi_selected_nodes.current)
                    list_node_selected.forEach(n=>n.reset())
                    ComponentUpdater.updateComponenSaveInCache.current(false)
                  }}
                >
                  {tags[1].name}
                </Checkbox>
              )}):
          (<></>)
      }
    </Box>
  </Box>

  return menu_for_modal ? content:
  // <><Tab>
  //   <Box
  //     layerStyle='submenuconfig_tab'
  //   >
  //     {t('Noeud.tabs.tags')}
  //   </Box>
  // </Tab>,
    <TabPanel>
      {content}
    </TabPanel>
}

// Check if all value of the attribute "k" is the same in the selected nodes (or selected style)
// If the value come from local attribute or the style of the node doesn't matter, we look only the value
const IsAllNodeTagsSame=(list_nodes:Class_NodeElement[],tag_class_obj:Class_Tag,key_grp_tag:string)=>{
  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  let store_value=[false,false]

  if(list_nodes.length>0){
    // For each selected nodes

    list_nodes.map((d,i) => {
      const val=(key_grp_tag in d.tags && d.tags[key_grp_tag].includes(tag_class_obj))
      if(i===0){
        store_value=[val,false]
      }else{
        store_value[1]=val!==store_value[0]?true:store_value[1]
      }

    })
  }else{
    store_value=[false,false]
  }
  return store_value
}