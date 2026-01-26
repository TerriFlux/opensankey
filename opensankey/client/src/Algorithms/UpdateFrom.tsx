import { Class_NodeElement } from '../Elements/Node'
import { SankeyPersistence } from '../Persistence/SankeyPersistence'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_Sankey } from '../types/Sankey'
import { getStringFromJSON, getStringOrUndefinedFromJSON, Type_JSON } from '../types/Utils'

const matchAndModifyJSONIds = (
  sankey: Class_Sankey,
  json_object: Type_JSON,
  matching_taggs_id: { [_: string]: { [_: string]: string } } = {},
  matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {},
  matching_nodes_id: { [_: string]: string } = {},
  matching_links_id: { [_: string]: string } = {}
) => {
  // Loop on every tag group entries in JSON if there is data -------------------------
  const loop_taggs = {
    'levelTags': sankey._level_taggs,
    'nodeTags': sankey._node_taggs,
    'fluxTags': sankey._flux_taggs,
    'dataTags': sankey._data_taggs,
  }
  Object.entries(loop_taggs)
    .forEach(([tagg_type, tagg_dict]) => {
      if (json_object[tagg_type] !== undefined) {
        // Variable to save matching ids : old -> new
        const curr_matching_taggs_id: { [id: string]: string } = {}
        const curr_matching_tags_id: { [id: string]: { [id: string]: string } } = {}
        // Cast type for linter
        const json = json_object[tagg_type] as Type_JSON
        // Loop on all entries to find tag group and then tags matchs
        Object.entries(json)
          .forEach(([tagg_id, _]) => {
            // Cast type
            const tagg_json = _ as Type_JSON
            // Match tag groups between sankey and JSON that have the same name but different id
            const matching_taggs = Object.values(tagg_dict)
              .filter(tagg => {
                return (
                  (tagg.name === getStringOrUndefinedFromJSON(tagg_json, 'name')) &&
                  (tagg.id !== tagg_id))
              })
            // We need to find a unique matching entry in JSON
            if (matching_taggs.length === 1) {
              curr_matching_taggs_id[tagg_id] = matching_taggs[0].id
            }
            // Then match tags using the same methode
            curr_matching_tags_id[tagg_id] = {}
            Object.entries(tagg_json.tags)
              .forEach(([tag_id, __]) => {
                // Get related tag group
                const new_tagg_id = curr_matching_taggs_id[tagg_id] ?? tagg_id
                const tagg = tagg_dict[new_tagg_id] ?? undefined
                if (tagg) {
                  // Casting type
                  const tag_json = __ as Type_JSON
                  // Match tag group in json data with theses in sankey data using name
                  const matching_tags = tagg.tags_list
                    .filter(tag => {
                      return (
                        (tag.name === getStringOrUndefinedFromJSON(tag_json, 'name')) &&
                        (tag.id !== tag_id))
                    })
                  // We need to find a unique matching entry in JSON
                  if (matching_tags.length === 1) {
                    curr_matching_tags_id[tagg_id][tag_id] = matching_tags[0].id
                  }
                }
              })
          })
        // Save results
        matching_taggs_id[tagg_type] = curr_matching_taggs_id
        matching_tags_id[tagg_type] = curr_matching_tags_id
      }
    })
  // Loop on all nodes ------------------------------------------------------------
  // Cast type for linter
  const nodes_json = json_object['nodes'] as Type_JSON
  Object.entries(nodes_json)
    .forEach(([node_id, _]) => {
      // Cast type for linter
      const node_json = _ as Type_JSON
      // Loop on all existing node and try to find match based on names
      const matching_nodes = sankey.nodes_list
        .filter(node => {
          return (
            (node.name === getStringOrUndefinedFromJSON(node_json, 'name')) &&
            (node.id !== node_id))
        })
      // There must be only one matching node
      if (matching_nodes.length === 1) {
        matching_nodes_id[node_id] = matching_nodes[0].id
      }
    })
  // Loop on all links ------------------------------------------------------------
  // Cast type for linter
  const links_json = json_object['links'] as Type_JSON
  Object.entries(links_json)
    .forEach(([link_id, _]) => {
      // Cast type for linter
      const link_json = _ as Type_JSON
      // Loop on all existing link and try to find match based on names
      const matching_links = sankey.links_list
        .filter(link => {
          let source_id = getStringFromJSON(link_json, 'idSource', '')
          source_id = matching_nodes_id[source_id] ?? source_id
          let target_id = getStringFromJSON(link_json, 'idTarget', '')
          target_id = matching_nodes_id[target_id] ?? target_id
          return (
            (link.source.id === source_id) &&
            (link.target.id === target_id) &&
            (link.id !== link_id))
        })
      // There must be only one matching link
      if (matching_links.length === 1) {
        matching_links_id[link_id] = matching_links[0].id
      }
    })
}

const get_sync_lists = (
  to_sync: { [id: string]: unknown },
  as_ref: { [id: string]: unknown },
  matching_id: { [id: string]: string }
) => {
  const revert_matching_id: { [id: string]: string } = {}
  if (matching_id) {
    Object.entries(matching_id).forEach(([k, v]) => revert_matching_id[v] = k)
  }
  // Transfer node style from new_layout style node  to corresponding style in current
  const to_sync_ids = Object.keys(to_sync)
  const as_ref_ids = Object.keys(as_ref)

  // Styles can be to remove, to add or to update
  const to_remove = to_sync_ids
    .filter(id => !(as_ref_ids.includes(matching_id[id] ?? id)))
  const to_add = as_ref_ids
    .filter(id => !to_sync_ids.includes(revert_matching_id[id] ?? id))
  const to_update = to_sync_ids
    .filter(id => as_ref_ids.includes(matching_id[id] ?? id))

  return [
    to_remove,
    to_add,
    to_update
  ]
}

export const updateFrom = (
  drawing_area: Class_DrawingArea,
  other_drawing_area: Class_DrawingArea,
  mode: string[]
) => {
  // Transfert all attributes = Copy everything from other drawing area
  const all = mode.includes('*')
  // Transfer DA attributs
  if (mode.includes('attrDrawingArea') || all) {
    // const scale_to_keep = drawing_area.scale
    drawing_area._copyAttrFrom(other_drawing_area)
    // drawing_area._scale = scale_to_keep
    drawing_area._scaleValueToPx.domain([0, drawing_area._scale])
    if (other_drawing_area.legend)
      drawing_area.legend.copyFrom(other_drawing_area.legend)
    drawing_area.list_g_element = other_drawing_area.list_g_element
  }

  const matching_taggs_id: { [_: string]: { [_: string]: string } } = {}
  const matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {}
  const matching_nodes_id: { [_: string]: string } = {}
  const matching_links_id: { [_: string]: string } = {}
  matchAndModifyJSONIds(
    other_drawing_area.sankey,
    SankeyPersistence.toJSON(drawing_area.sankey),
    matching_taggs_id,
    matching_tags_id,
    matching_nodes_id,
    matching_links_id
  )
  const revert_matching_links_id: { [id: string]: string } = {}
  Object.entries(matching_links_id).forEach(([k, v]) => revert_matching_links_id[v] = k)

  if (mode.includes('attrDrawingArea') || all) {

    // Nodes styles can be to remove, to add or to update
    const [ns_to_remove, ns_to_add, ns_to_update] = get_sync_lists(drawing_area.sankey.styles_dict, other_drawing_area.sankey.styles_dict, {})

    // Update styles
    ns_to_remove
      .forEach(id => {
        drawing_area.sankey.styles_dict[id].delete()
      })
    ns_to_add
      .forEach(id => {
        const ns = other_drawing_area.sankey.styles_dict[id]
        drawing_area.sankey.addNewElementStyle(ns.id, ns.name)
        drawing_area.sankey.styles_dict[ns.id].copyFrom(ns)
      })
    ns_to_update
      .forEach(id => {
        drawing_area.sankey.styles_dict[id].copyFrom(other_drawing_area.sankey.styles_dict[id])
      })

    // Link styles can be to remove, to add or to update
    // const [ls_to_remove, ls_to_add, ls_to_update] = Class_Sankey.get_sync_lists(drawing_area.sankey._link_styles, other_drawing_area.sankey._link_styles, {})

    // // Update styles
    // ls_to_remove
    //   .forEach(id => {
    //     drawing_area.sankey._link_styles[id].delete()
    //   })
    // ls_to_add
    //   .forEach(id => {
    //     const ls = other_drawing_area.sankey._link_styles[id]
    //     drawing_area.sankey.addNewLinkStyle(ls.id, ls.name)
    //     drawing_area.sankey._link_styles[ls.id].copyFrom(ls)
    //   })
    // ls_to_update
    //   .forEach(id => {
    //     drawing_area.sankey._link_styles[id].copyFrom(other_drawing_area.sankey._link_styles[id])
    //   })
  }

  // Update level_tag_dict ------------------------------------------------------------

  //if (mode.includes('tagLevel') || all) {
  // Finds the corresponding tag group by ids
  // const [to_remove, to_add, to_update] = Class_Sankey.get_sync_lists(drawing_area.sankey._level_taggs, other_drawing_area.sankey._level_taggs, matching_taggs_id['levelTags'])

  // // Update taggs
  // to_remove
  //   .forEach(id => {
  //     drawing_area.sankey.removeTagGroupWithId('level_taggs', id)
  //   })
  // to_add
  //   .forEach(id => {
  //     const ltagg = other_drawing_area.sankey._level_taggs[matching_taggs_id['levelTags'][id] ?? id]
  //     drawing_area.sankey.addLevelTagGroup(ltagg.id, ltagg.name)
  //     drawing_area.sankey._level_taggs[id].copyFrom(ltagg)
  //   })
  // to_update
  //   .forEach(id => {
  //     drawing_area.sankey._level_taggs[id].copyFrom(other_drawing_area.sankey._level_taggs[matching_taggs_id['levelTags'][id] ?? id])
  //   })
  if (mode.includes('tagLevel') || all) {
    if (matching_taggs_id?.['levelTags']) {
      matching_taggs_id['levelTags']['dimension 1'] = 'Primaire'
      Object.values(drawing_area.sankey._level_taggs).forEach(tagg =>
        tagg.tags_list.forEach(tag => {
          const sourceTag = other_drawing_area.sankey._level_taggs[matching_taggs_id['levelTags'][tagg.id]]?.tags_dict?.[tag.id]
          if (sourceTag) tag.is_selected = sourceTag.is_selected
        })
      )
    }
  }

  // Update node_tag_dict ------------------------------------------------------------
  if (mode.includes('tagNode') || all) {
    // Finds the corresponding tag group by ids
    const [to_remove, to_add, to_update] = get_sync_lists(drawing_area.sankey._node_taggs, other_drawing_area.sankey._node_taggs, matching_taggs_id['nodeTags'])

    // Update taggs
    to_remove
      .forEach(id => {
        drawing_area.sankey.removeTagGroupWithId('node_taggs', id)
      })
    to_add
      .forEach(id => {
        const ntagg = other_drawing_area.sankey._node_taggs[matching_taggs_id['nodeTags'][id] ?? id]
        drawing_area.sankey.addNodeTagGroup(ntagg.id, ntagg.name)
        drawing_area.sankey._node_taggs[id].copyFrom(ntagg)
      })
    to_update
      .forEach(id => {
        drawing_area.sankey._node_taggs[id].copyFrom(other_drawing_area.sankey._node_taggs[matching_taggs_id['nodeTags'][id] ?? id], matching_tags_id['nodeTags'][id])
      })
  }

  // Update flux_tag_dict ------------------------------------------------------------
  if (mode.includes('tagFlux') || all) {
    // Finds the corresponding tag group by ids
    const [to_remove, to_add, to_update] = get_sync_lists(drawing_area.sankey._flux_taggs, other_drawing_area.sankey._flux_taggs, matching_taggs_id['fluxTags'])

    // Update taggs
    to_remove
      .forEach(id => {
        drawing_area.sankey.removeTagGroupWithId('flux_taggs', id)
      })
    to_add
      .forEach(id => {
        const ftagg = other_drawing_area.sankey._flux_taggs[matching_taggs_id['fluxTags'][id] ?? id]
        drawing_area.sankey.addFluxTagGroup(ftagg.id, ftagg.name)
        drawing_area.sankey._flux_taggs[id].copyFrom(ftagg)
      })
    to_update
      .forEach(id => {
        drawing_area.sankey._flux_taggs[id].copyFrom(other_drawing_area.sankey._flux_taggs[matching_taggs_id['fluxTags'][id] ?? id], matching_tags_id['fluxTags'][id])
      })
  }

  // Update data_tag_dict ------------------------------------------------------------

  if (mode.includes('tagData') || all) {

    // Finds the corresponding tag group by ids
    const [to_remove, to_add, to_update] = get_sync_lists(drawing_area.sankey._data_taggs, other_drawing_area.sankey._data_taggs, matching_taggs_id['dataTags'])

    // Update taggs
    to_remove
      .forEach(id => {
        drawing_area.sankey.removeTagGroupWithId('data_taggs', id)
      })
    to_add
      .forEach(id => {
        const dtagg = other_drawing_area.sankey._data_taggs[matching_taggs_id['dataTags'][id] ?? id]
        drawing_area.sankey.addDataTagGroup(dtagg.id, dtagg.name)
        drawing_area.sankey._data_taggs[id].copyFrom(dtagg)
      })
    to_update
      .forEach(id => {
        drawing_area.sankey._data_taggs[id].copyFrom(other_drawing_area.sankey._data_taggs[matching_taggs_id['dataTags'][id] ?? id], matching_tags_id['dataTags'][id])
      })
  }

  // Nodes  ---------------------------------------------------------------------------

  const add_nodes = mode.includes('addNode')
  const remove_nodes = mode.includes('removeNodes')
  const sync_nodes_tags = mode.includes('tagNode')
  const sync_nodes_positions = mode.includes('posNode')
  const sync_nodes_attr = mode.includes('attrNode')

  if (
    add_nodes ||
    remove_nodes ||
    sync_nodes_tags ||
    sync_nodes_positions ||
    sync_nodes_attr ||
    all
  ) {
    const [to_remove, to_add, to_update] = get_sync_lists(drawing_area.sankey.nodes_dict, other_drawing_area.sankey.nodes_dict, matching_nodes_id)

    // Add nodes that are in other sankey but not in this sankey
    if (add_nodes || all) {
      to_add
        .forEach(id => {
          const n = other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id]
          drawing_area.sankey.addNewNode(n.id, n.name)
          drawing_area.sankey.nodes_dict[id].copyFrom(n)
          return id
        })
    }

    // Delete nodes that are in other sankey but not in this sankey
    if (remove_nodes || all) {
      to_remove
        .forEach(id => {
          drawing_area.sankey.drawing_area.deleteNode(drawing_area.sankey.nodes_dict[id])
        })
    }

    // With attrNode we transfer node attr
    if (sync_nodes_attr || all) {
      // Transfer node attr from new_layout node to correspondinf node in current
      to_update
        .forEach(id => {
          const n = drawing_area.sankey.nodes_dict[id]
          const on = other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id]
          n.copyAttrFrom(on) // Copy attributes
          //n.position = pn // Reapply position
          return id
        })
    }

    // Update nodes ref to node_taggs
    if ((sync_nodes_tags) || all) {
      to_update
        .forEach(id => {
          drawing_area.sankey.nodes_dict[id].copyTagsReferencingFrom(other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id], matching_taggs_id['nodeTags'], matching_tags_id['nodeTags'])
          drawing_area.sankey.nodes_dict[id].copyDimensionsFrom(other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id])
        })


      // Update nodes ref to node added
      if ((add_nodes) || all) {
        to_add
          .forEach(id => {
            drawing_area.sankey.nodes_dict[id].copyTagsReferencingFrom(other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id], matching_taggs_id['nodeTags'], matching_tags_id['nodeTags'])
            drawing_area.sankey.nodes_dict[id].copyDimensionsFrom(other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id])
          })
      }

    }

    // Update node position from other sankey
    if (sync_nodes_positions || all) {
      to_update
        .forEach(id => {
          const n = other_drawing_area.sankey.nodes_dict[matching_nodes_id[id] ?? id]
          drawing_area.sankey.nodes_dict[id].setPosXY(n.position_x, n.position_y)
        })
    }
  }

  // Links -------------------------------------------------------------------------

  const add_flux = mode.includes('addFlux')
  const remove_flux = mode.includes('removeFlux')
  const pos_flux = mode.includes('posFlux')
  const sync_flux_tags = mode.includes('tagFlux')
  const sync_flux_values = mode.includes('Values')
  const sync_flux_attr = mode.includes('attrFlux')

  if (
    add_flux ||
    remove_flux ||
    sync_flux_tags ||
    sync_flux_values ||
    sync_flux_attr ||
    all
  ) {
    const [to_remove, to_add, to_update] = get_sync_lists(drawing_area.sankey.links_dict, other_drawing_area.sankey.links_dict, matching_links_id)

    // Add link in new that are not in current then add them
    if (add_flux || all) {
      to_add
        .forEach(id => {
          const link = other_drawing_area.sankey.links_dict[matching_links_id[id] ?? id]
          const similar_src_curr = drawing_area.sankey.nodes_dict[link.source.id]
          const similar_trgt_curr = drawing_area.sankey.nodes_dict[link.target.id]
          if (similar_src_curr && similar_trgt_curr) {
            // Copy with exactly the same atributs, source, targets, id, ...
            drawing_area.sankey.addNewLinkWithId(
              id,
              similar_src_curr as Class_NodeElement,
              similar_trgt_curr as Class_NodeElement
            )
            drawing_area.sankey.links_dict[id].copyFrom(link)
          }
        })
    }

    // Remove link in current that are not in new then delete them
    if (remove_flux || all) {
      to_remove
        .forEach(id => {
          drawing_area.sankey.drawing_area.deleteLink(drawing_area.sankey.links_dict[id])
        })
    }

    if (pos_flux || all) {
      to_update
        .forEach(id => {
          const link = drawing_area.sankey.links_dict[id]
          // Source node
          const source = drawing_area.sankey.nodes_dict[link.source.id]
          const other_source = other_drawing_area.sankey.nodes_dict[other_drawing_area.sankey.links_dict[matching_links_id[id] ?? id].source.id]
          source.keepLinkOrderingFrom(other_source, revert_matching_links_id)
          // Target node
          const target = drawing_area.sankey.nodes_dict[link.target.id]
          const other_target = other_drawing_area.sankey.nodes_dict[other_drawing_area.sankey.links_dict[matching_links_id[id] ?? id].target.id]
          target.keepLinkOrderingFrom(other_target, revert_matching_links_id)
        })
    }

    // With attrFlux we transfer link attr
    if (sync_flux_attr || all) {
      to_update
        .forEach(id => {
          const link = drawing_area.sankey.links_dict[id]
          // Save positions
          // const sp = structuredClone(link.source.display.position)
          // const tp = structuredClone(link.target.display.position)
          // Copy all attributes
          link.copyAttrFrom(other_drawing_area.sankey.links_dict[matching_links_id[id] ?? id])
          // Keep positions
          // link.source.display.position = sp
          // link.target.display.position = tp
        })
    }

    if (add_flux || remove_flux || all) {
      const list_link_post_update = drawing_area.sankey.links_list.map(l => l.id)
      // Update links ordering
      const to_update_reorder = Object.assign([] as string[], to_update)
      if (add_flux || all) to_update_reorder.concat(to_add)
      to_update_reorder
        .filter(id => list_link_post_update.includes(id)) // only keep link really added
        .forEach(id => {
          // Source node
          const source = drawing_area.sankey.nodes_dict[drawing_area.sankey.links_dict[id].source.id]
          const other_source = other_drawing_area.sankey.nodes_dict[other_drawing_area.sankey.links_dict[matching_links_id[id] ?? id].source.id]
          source.keepLinkOrderingFrom(other_source, revert_matching_links_id)
          // Target node
          const target = drawing_area.sankey.nodes_dict[drawing_area.sankey.links_dict[id].target.id]
          const other_target = other_drawing_area.sankey.nodes_dict[other_drawing_area.sankey.links_dict[matching_links_id[id] ?? id].target.id]
          target.keepLinkOrderingFrom(other_target, revert_matching_links_id)
        })
    }

    // Values  ------------------------------------------------------------------------

    let to_update_for_values = Object.assign([] as string[], to_update)
    if (all || add_flux) to_update_for_values = to_update_for_values.concat(to_add)
    // /!\ other sankey must but an ancient version of the current sankey because each link value has an unique id
    if (((sync_flux_tags || sync_flux_values)) || all) {
      // To speed up matching process between values ids (that are random)
      // We compute corresp value ids for sync_flux_tags & sync_flux_values
      const values_corresp_ids: { [id_flux: string]: { [id_value: string]: string } } = {}
      to_update_for_values
        .forEach(id_flux => {
          // avoid recomputation
          const values = drawing_area.sankey.links_dict[id_flux].getAllValues()
          const other_values = other_drawing_area.sankey.links_dict[matching_links_id[id_flux] ?? id_flux].getAllValues()
          // Init corresps list
          values_corresp_ids[id_flux] = {}
          if (Object.keys(values).length > 0) {
            // Case 1 : No datatags - only one value per flux
            if (Object.values(values)[1] === undefined) {
              values_corresp_ids[id_flux][Object.keys(values)[0]] = Object.keys(other_values)[0]
            }
            // Case 2 : Datatags are present
            else {
              Object.entries(values)
                .forEach(([id_value, [, dtags]]) => {
                  if (dtags !== undefined) { // Should never be the case
                    // Find values match based on datatags ids
                    const dtags_id = dtags.map(dtag => dtag.id)
                    Object.entries(other_values)
                      .filter(([, [, other_dtags]]) => {
                        if (other_dtags !== undefined)
                          return (
                            JSON.stringify(dtags_id) ===
                            JSON.stringify(other_dtags.map(other_dtag => other_dtag.id))
                          )
                        else
                          return false // Should never be the case
                      })
                      .forEach(([id_other_value,]) => {
                        values_corresp_ids[id_flux][id_value] = id_other_value
                      })
                  }
                })
            }
          }
        })

      // Update refs between values and flux_tags
      if ((sync_flux_tags && (add_flux || remove_flux)) || all) {
        to_update_for_values
          .forEach(id_flux => {
            // Avid recomputation
            const link = drawing_area.sankey.links_dict[id_flux]
            const values = link.getAllValues()
            const other_link = other_drawing_area.sankey.links_dict[matching_links_id[id_flux] ?? id_flux]
            const other_values = other_link.getAllValues()
            // Loop on all current values for given flux id_flux
            Object.entries(values)
              .forEach(([id_value, [value,]]) => {
                // Remove all tags for all current fluxs
                value.flux_tags_list
                  .forEach(tag => {
                    value.removeTag(tag)
                  })
                // Get corresponding value to copy
                const id_other_value = values_corresp_ids[id_flux][id_value]
                if (id_other_value !== undefined) {
                  const other_value = other_values[id_other_value][0]
                  // Apply same flux-tag relationship from new_layout to current sankey's fluxs
                  other_value.flux_tags_list
                    .filter(tag => tag.group.id in drawing_area.sankey._flux_taggs)
                    .filter(tag => tag.id in drawing_area.sankey._flux_taggs[tag.group.id].tags_dict)
                    .forEach(tag => value.addTag(tag))
                }
              })
          })
      }

      // Apply links values from other sankey to current links
      if (sync_flux_values || all) {
        to_update_for_values
          .forEach(id_flux => {
            // Avid recomputation
            const link = drawing_area.sankey.links_dict[id_flux]
            const values = link.getAllValues()
            const other_link = other_drawing_area.sankey.links_dict[matching_links_id[id_flux] ?? id_flux]
            const other_values = other_link.getAllValues()
            // Loop on all current values for given flux id_flux
            Object.entries(values)
              .forEach(([id_value, [value,]]) => {
                // Get corresponding value to copy
                const id_other_value = values_corresp_ids[id_flux][id_value]
                if (id_other_value !== undefined) {
                  value.copyFrom(other_values[id_other_value][0])
                }
              })
          })
      }
    }
  }


  // Update icon catalog
  if (mode.includes('icon_catalog') || all) {
    Object.entries(other_drawing_area.sankey.icon_catalog).filter(icon => icon[0] && icon[1]).forEach(icon => {
      drawing_area.sankey.icon_catalog[icon[0]] = icon[1]
    })
  }
  // Update Containers
  const list_curr_container = drawing_area.sankey.containers_list
  const list_new_container = other_drawing_area.sankey.containers_list
  if (mode.includes('freeLabels') || all) {
    // Add new container present in new but not current
    list_new_container.filter(new_cont => !list_curr_container.map(curr_cont => curr_cont.id).includes(new_cont.id))
      .forEach(cont => {
        drawing_area.sankey.addNewContainer(cont.id, cont.name)
        drawing_area.sankey.containers_dict[cont.id].copyFrom(cont)
      })

    // Delete container present in current but not new
    list_curr_container.filter(curr_cont => !list_new_container.map(new_cont => new_cont.id).includes(curr_cont.id))
      .forEach(cont => {
        drawing_area.sankey.deleteContainer(cont)
      })

    // Update container in current that are also in new
    list_new_container.filter(new_cont => list_curr_container.map(curr_cont => curr_cont.id).includes(new_cont.id))
      .forEach(cont => {
        drawing_area.sankey.containers_dict[cont.id].copyFrom(cont)
      })
  }
}
