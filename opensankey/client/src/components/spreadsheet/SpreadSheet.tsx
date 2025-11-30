// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// External imports
import React, { useState } from 'react'
import { Checkbox } from '@chakra-ui/react'
import {
  ReactGrid, Column, Row, CellChange, TextCell, NumberCell, Id, MenuOption,
  Cell, Compatible, DefaultCellTypes
} from '@silevis/reactgrid'
import '@silevis/reactgrid/styles.css'

import { parseLocaleNumber, Type_JSON } from '../../types/Utils'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { defaultLinkId } from '../../Elements/Link'
import { applyRandomColors } from '../../Algorithms/Colors'

// Define the structure of a flux (flow) row in the spreadsheet
interface IType_SpreadSheetFlux {
  id: string, // Link id
  source: string // Source node of the flow
  target: string // Target node of the flow
  value_data?: number // Collected value
  value_result?: number // Calculated value
}

// Main SpreadSheet component
export const SpreadSheet = (
  { app_data }: { app_data: Class_ApplicationData }
) => {
  const { menu_configuration, drawing_area } = app_data
  const { sankey } = drawing_area

  const [, set_freeze] = useState(menu_configuration.spreadsheet_freeze)
  // // Fonction pour déterminer si on doit afficher la colonne "Valeurs calculées"
  // const shouldShowCalculatedValues = (): boolean => {
  //   return links_list.some(l => l.valueResult !== null && l.valueResult !== undefined)
  // }

  // Extract flux data from the Sankey diagram and prepare it for the spreadsheet
  const getFluxFromSankey = (): IType_SpreadSheetFlux[] => {
    const { links_list } = sankey
    const a: IType_SpreadSheetFlux[] = links_list
      .map((l) => {
        return {
          id: l.id, //Link id
          source: l.source.name,
          target: l.target.name,
          value_data: l.value ? l.value.valueData! : undefined,
          value_result: l.value?l.value.valueResult! : undefined
        }
      })
    // Add an empty row for new flux input
    a.push({ id: 'empty', source: '', target: '' })
    return a
  }
  //@ts-expect-error xxx
  const col_sizes = app_data.has_sankey_afm ? [0.05, 0.05, 0.03, 0.03] : [0.055, 0.055, 0.045]
  // Générer les colonnes dynamiquement
  const getColumns = (): Column[] => {
    const innerW = window.innerWidth
    const baseColumns: Column[] = [
      { columnId: 'source', width: innerW * col_sizes[0], resizable: true },
      { columnId: 'target', width: innerW * col_sizes[1], resizable: true },
      { columnId: 'value_data', width: innerW * col_sizes[2], resizable: true }
    ]

    // Ajouter la colonne "Valeurs calculées" seulement si l'utilisateur est développeur
    //@ts-expect-error xxx
    if (app_data.has_sankey_afm) {
      baseColumns.push({ columnId: 'value_result', width: innerW * col_sizes[3], resizable: true })
    }

    return baseColumns
  }

  // Table header - générer dynamiquement selon is_dev
  const getHeaderRow = (): Row => {
    const baseCells = [
      { type: 'header', text: app_data.t('Flux.src') },
      { type: 'header', text: app_data.t('Flux.trgt') },
      { type: 'header', text: app_data.t('Flux.value') }
    ]
    //@ts-expect-error xxx
    if (app_data.has_sankey_afm) {
      baseCells.push({ type: 'header', text: app_data.t('Flux.calculated_value') })
    }

    return {
      rowId: 'header',
      cells: baseCells as DefaultCellTypes[]
    }
  }

  // Get all table rows
  const getRows = (all_flux: IType_SpreadSheetFlux[]): Row[] => {
    const headerRow = getHeaderRow()

    const dataRows = all_flux.map<Row>((flux, idx) => {
      const baseCells = [
        { type: 'text', text: flux.source },
        { type: 'text', text: flux.target },
        { type: 'number', value: flux.value_data as number }
      ]

      // Ajouter la cellule "Valeurs calculées" seulement si l'utilisateur est développeur
      //@ts-expect-error xxx
      if (app_data.has_sankey_afm) {
        baseCells.push({ type: 'number', value: flux.value_result as number })
      }

      return {
        rowId: idx,
        cells: baseCells as DefaultCellTypes[]
      }
    })

    return [headerRow as Row, ...dataRows]
  }
  // Define the spreadsheet rows and columns
  const [spreadSheetFlux, setSpreadSheetFlux] = useState<IType_SpreadSheetFlux[]>(getFluxFromSankey())
  const rows = getRows(spreadSheetFlux)
  const [columns, setColumns] = useState<Column[]>(getColumns())

  // Fonction pour mettre à jour les colonnes quand les données changent
  const updateColumns = () => {
    setColumns(getColumns())
  }

  // Map node and link names to their IDs for quick lookups
  const name2id: { [_: string]: string } = {}
  drawing_area.sankey.nodes_list.forEach(n => { name2id[n.name] = n.id })
  drawing_area.sankey.links_list.forEach(l => { name2id[defaultLinkId(l.source, l.target)] = l.id })

  // Function to synchronize spreadsheet data with Sankey data
  const synchronizeSpreadSheetWithSankey = () => {
    setSpreadSheetFlux(getFluxFromSankey())
    updateColumns() // Mettre à jour les colonnes aussi
  }

  // Provide a reference to update the spreadsheet externally
  app_data.menu_configuration.ref_to_spreadsheet.current = () => {
    synchronizeSpreadSheetWithSankey()
  }

  // Function to add a new node to the Sankey diagram
  const addNode = (name: string) => {
    const new_node = sankey.addNewNodeWithName(name)
    new_node.name = name // Set the name of the new node
    return new_node
  }

  type typeCreatedNode = { name: string, id: string }
  type typeCreatedLink = { id: string; idSrc: string, idTrgt: string }
  // Function to add a new link (flux) between two nodes
  const addLink = (cur_flux: IType_SpreadSheetFlux): [typeCreatedLink, typeCreatedNode[]] | undefined => {
    const source_name = cur_flux.source
    const target_name = cur_flux.target
    const createdNodes: typeCreatedNode[] = []//List of created nodes id when creating a link from (used for undo/redo)

    // Skip if source or target is empty
    if (source_name === '' || target_name === '') {
      return
    }

    // Retrieve or create the source node
    let source_node: Class_NodeElement | undefined
    if (drawing_area.sankey.nodes_dict[name2id[source_name]]) {
      source_node = drawing_area.sankey.nodes_dict[name2id[source_name]]
    }
    else {
      source_node = addNode(source_name)
      createdNodes.push({ id: source_node.id, name: source_name })
      name2id[source_name] = source_node.id
    }

    // Retrieve or create the target node
    let target_node: Class_NodeElement | undefined
    if (drawing_area.sankey.nodes_dict[name2id[target_name]]) {
      target_node = drawing_area.sankey.nodes_dict[name2id[target_name]]
    }
    else {
      target_node = addNode(target_name)
      createdNodes.push({ id: target_node.id, name: target_name })
      name2id[target_name] = target_node.id
    }

    // Add the link if it doesn't exist
    if (!sankey.links_dict[defaultLinkId(source_node, target_node)]) {
      const l = sankey.addNewLink(
        source_node,
        target_node
      )
      // Set the value of the link, if provided
      if (cur_flux.value_data) {
        l.value!.valueData = +cur_flux.value_data
      }
      if (cur_flux.value_result) {
        l.value!.valueResult = +cur_flux.value_result
      }

      return [{ id: l.id, idSrc: l.source.id, idTrgt: l.target.id }, createdNodes]
    }
  }

  // Function to get cells from clipboard and parse them into spreadsheet rows
  async function getCellsFromClipboardPlainText(): Promise<Compatible<Cell>[][]> {
    const text = await navigator.clipboard.readText().catch(() => {
      throw new Error('Failed to read textual data from clipboard!')
    })

    // Parse the clipboard text into rows and columns
    const lines = text.split('\n')
    return lines.map((line) =>
      line.split('\t').map((textValue) => ({
        type: 'text',
        text: textValue,
        value: parseLocaleNumber(textValue)
      }))
    )
  }

  const redraw = () => {
    if (!app_data.menu_configuration.spreadsheet_freeze) {
      drawing_area.nodePositioning.computeAutoSankeyWithToast(true, true)
    }
    app_data.draw()
  }


  // Functions called in onCellChanges that can be undone ===============================================

  /**
     * Function called in onChanges of Spreadsheet to change value of link
     * MODIFIÉE pour gérer les deux types de valeurs
     *
     * @param {CellChange[]} changes
     */
  const updateLinksValues = (changes: CellChange[]) => {
    const valueChanged = changes.filter(change => change.type === 'number')
    // Only excecute function & save undo if we have changed value cell
    if (valueChanged.length > 0) {
      const dict_old_val: { [x: string]: { value_data?: number | null, value_result?: number | null } } = {}
      const dict_new_val: { [x: string]: { value_data?: number | null, value_result?: number | null } } = {}

      // Execute original function ----------------------------
      valueChanged.forEach(change => {
        const fluxIndex = change.rowId as number
        const fieldName = change.columnId as 'value_data' | 'value_result'
        const l = drawing_area.sankey.links_list[fluxIndex]

        // Error can't find link
        if (l == undefined) {
          synchronizeSpreadSheetWithSankey()
          return
        }

        // Sauvegarder les anciennes valeurs
        if (!dict_old_val[l.id]) {
          dict_old_val[l.id] = {}
        }
        if (!dict_new_val[l.id]) {
          dict_new_val[l.id] = {}
        }

        if (fieldName === 'value_data') {
          dict_old_val[l.id].value_data = l.value?.valueData
          if (isNaN((change.newCell as NumberCell).value)) {
            l.value!.valueData = null
            dict_new_val[l.id].value_data = null
          } else {
            l.value!.valueData = (change.newCell as NumberCell).value
            dict_new_val[l.id].value_data = (change.newCell as NumberCell).value
          }
          spreadSheetFlux[fluxIndex].value_data = (change.newCell as NumberCell).value
        } else if (fieldName === 'value_result') {
          dict_old_val[l.id].value_result = l.value?.valueResult
          if (isNaN((change.newCell as NumberCell).value)) {
            l.value!.valueResult = null
            dict_new_val[l.id].value_result = null
          } else {
            l.value!.valueResult = (change.newCell as NumberCell).value
            dict_new_val[l.id].value_result = (change.newCell as NumberCell).value
          }
          spreadSheetFlux[fluxIndex].value_result = (change.newCell as NumberCell).value
        }
        drawing_area.updateScaleAtLinkValueSetting()
        l.source.draw()
        l.target.draw()
      })

      // Create undo of original function ----------------------------
      const undoUpdateLinksValues = () => {
        Object.entries(dict_old_val).forEach(([linkId, values]) => {
          const link = sankey.links_dict[linkId]
          if (values.value_data !== undefined) {
            link.value!.valueData = values.value_data
          }
          if (values.value_result !== undefined) {
            link.value!.valueResult = values.value_result
          }
        })
        drawing_area.updateScaleAtLinkValueSetting()
        synchronizeSpreadSheetWithSankey() // Utiliser la fonction complète pour mettre à jour les colonnes
        menu_configuration.updateComponentRelatedToLinksData()
      }

      // Create redo of original function ----------------------------
      const redoUpdateLinksValues = () => {
        Object.entries(dict_new_val).forEach(([linkId, values]) => {
          const link = sankey.links_dict[linkId]
          if (values.value_data !== undefined) {
            link.value!.valueData = values.value_data
          }
          if (values.value_result !== undefined) {
            link.value!.valueResult = values.value_result
          }
        })
        drawing_area.updateScaleAtLinkValueSetting()
        synchronizeSpreadSheetWithSankey() // Utiliser la fonction complète pour mettre à jour les colonnes
        menu_configuration.updateComponentRelatedToLinksData()
      }

      //Save undo/redo
      app_data.history.saveUndo(undoUpdateLinksValues)
      app_data.history.saveRedo(redoUpdateLinksValues)

      synchronizeSpreadSheetWithSankey() // Mettre à jour complètement (colonnes + données)
      menu_configuration.updateComponentRelatedToLinksData()
    }
  }

  // Dans la fonction newFlux, modifier la partie value :
  const newFlux = (changes: CellChange[]) => {
    const new_flux = changes.filter(change => change.type === 'text' && change.rowId == spreadSheetFlux.length - 1)
    const createdElements: [typeCreatedLink, typeCreatedNode[]][] = []

    if (new_flux.length > 0) {
      new_flux.forEach(change => {
        const fluxIndex = change.rowId as number
        const fieldName = change.columnId as 'source' | 'target'
        spreadSheetFlux[fluxIndex][fieldName] = (change.newCell as TextCell).text

        if (
          (spreadSheetFlux[fluxIndex]['target'] !== '') &&
          (spreadSheetFlux[fluxIndex]['source'] !== '')
        ) {
          const c_element = addLink(spreadSheetFlux[fluxIndex])
          if (c_element) {
            createdElements.push(c_element)
          }
          redraw()
          menu_configuration.updateComponentRelatedToLinksData()
        } else {
          setSpreadSheetFlux([...spreadSheetFlux])//Update Table
        }
      })

      // Create undo of original function ----------------------------
      const undoNewFlux = () => {
        // Delete created elements 
        if (createdElements.length > 0) {
          createdElements.forEach(tupleElements => {
            const l = sankey.links_dict[tupleElements[0].id]
            drawing_area.deleteLink(l)
            tupleElements[1].forEach(nid => {
              const n = drawing_area.sankey.nodes_dict[nid.id]
              drawing_area.deleteNode(n)
            })
          })
          redraw()
          menu_configuration.updateComponentRelatedToLinksData()
        } else {
          setSpreadSheetFlux([...spreadSheetFlux])//Update Table
        }
      }

      // Create redo of original function ----------------------------
      const redoNewFlux = () => {
        if (createdElements.length > 0) {
          // Delete created elements 
          createdElements.forEach(line => {
            line[1].forEach(n => {
              sankey.addNewNode(n.id, n.name)
            })
            const src = drawing_area.sankey.nodes_dict[line[0].idSrc]
            const trgt = drawing_area.sankey.nodes_dict[line[0].idTrgt]
            sankey.addNewLink(src, trgt)
          })
          redraw()
          menu_configuration.updateComponentRelatedToLinksData()
        } else {
          setSpreadSheetFlux([...spreadSheetFlux])//Update Table
        }
      }
      //Save undo/redo
      app_data.history.saveUndo(undoNewFlux)
      app_data.history.saveRedo(redoNewFlux)
    }
  }

  /**
   * Function called in onChanges of Spreadsheet to change source/target of existing links,
   * then if previous source/target doesn't have IO links delete it 
   *
   * @param {CellChange[]} changes
   */
  const modifyFlux = (changes: CellChange[]) => {
    const modifFlux = changes.filter(change =>
      change.type === 'text' && change.rowId !== spreadSheetFlux.length - 1 && name2id[(change.newCell as TextCell).text!] != undefined
    )

    // Only excecute function & save undo if we have to modify links source or target
    if (modifFlux.length > 0) {
      const dict_old_id: { [oldId: string]: { source?: string, target?: string, deletedJSON?: Type_JSON } } = {}
      const dict_new_id: { [oldId: string]: { source?: string, target?: string } } = {}

      // Execute original function ----------------------------
      modifFlux.forEach(change => {
        const fluxIndex = change.rowId as number
        const fieldName = change.columnId as 'source' | 'target'
        const l = drawing_area.sankey.links_list[fluxIndex]

        const prevNode = l[fieldName]
        dict_old_id[l.id] = {}
        dict_old_id[l.id][fieldName] = l[fieldName].id//save old id of source

        l[fieldName] = drawing_area.sankey.nodes_dict[name2id[(change.newCell as TextCell).text]]

        dict_new_id[l.id] = {}
        dict_new_id[l.id][fieldName] = l[fieldName].id  //save new id of source

        if (!prevNode.hasInputLinks() && !prevNode.hasOutputLinks()) {
          dict_old_id[l.id].deletedJSON = prevNode.toJSON()//save json of deleted node
          // Remove lone nodes
          drawing_area.deleteNode(prevNode)
        }
        menu_configuration.updateComponentRelatedToLinksData()
      })

      // Create undo of original function ----------------------------
      const undoModifyFlux = () => {
        const dict_l = sankey.links_dict
        const dict_n = drawing_area.sankey.nodes_dict

        Object.entries(dict_old_id).forEach(ent_l => {
          if (ent_l[1].source !== undefined) {
            if (!(ent_l[1].source in dict_n)) {
              // If node was deleted, recreate it 
              const del_node_name = ent_l[1]?.deletedJSON?.name as string
              sankey.addNewNode(ent_l[1].source, del_node_name)
              if (ent_l[1].deletedJSON)
                dict_n[ent_l[1].source].fromJSON(ent_l[1].deletedJSON) //restore node deleted with json
            }
            dict_l[ent_l[0]].source = dict_n[ent_l[1].source]
          }

          if (ent_l[1].target !== undefined) {
            if (!(ent_l[1].target in dict_n)) {
              // If node was deleted, recreate it 
              const del_node_name = ent_l[1]?.deletedJSON?.name as string
              sankey.addNewNode(ent_l[1].target, del_node_name)
              if (ent_l[1].deletedJSON)
                dict_n[ent_l[1].target].fromJSON(ent_l[1].deletedJSON) //restore node deleted with json
            }
            dict_l[ent_l[0]].target = dict_n[ent_l[1].target]
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }

      // Create redo of original function ----------------------------
      const redoModifyFlux = () => {
        const dict_l = sankey.links_dict
        const dict_n = drawing_area.sankey.nodes_dict

        Object.entries(dict_new_id).forEach(ent_l => {
          if (ent_l[1].source !== undefined) {
            const prevSrc = dict_l[ent_l[0]].source
            dict_l[ent_l[0]].source = dict_n[ent_l[1].source]
            if (!prevSrc.hasInputLinks() && !prevSrc.hasOutputLinks()) {
              // delete lone node
              prevSrc.delete()
              drawing_area.deleteNode(prevSrc)
            }
          }

          if (ent_l[1].target !== undefined) {
            const prevTarget = dict_l[ent_l[0]].target
            dict_l[ent_l[0]].target = dict_n[ent_l[1].target]
            if (!prevTarget.hasInputLinks() && !prevTarget.hasOutputLinks()) {
              // delete lone node
              prevTarget.delete()
              drawing_area.deleteNode(prevTarget)
            }
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }
      //Save undo/redo
      app_data.history.saveUndo(undoModifyFlux)
      app_data.history.saveRedo(redoModifyFlux)
    }
  }

  /**
   * Function called in onChanges of Spreadsheet to change name of a node, it rename all occurence in the spreadsheet
   *
   * @param {CellChange[]} changes
   */
  const ChangeNodeName = (changes: CellChange[]) => {
    const ChangeName = changes.filter(change =>
      change.type === 'text' && change.rowId !== spreadSheetFlux.length - 1 && name2id[(change.newCell as TextCell).text] == undefined
    )

    // Only excecute function & save undo if we change name of a node
    if (ChangeName.length > 0) {
      const dict_old_name: { [oldId: string]: { src: string | undefined, trgt: string | undefined } } = {}
      const dict_new_name: { [oldId: string]: { src: string | undefined, trgt: string | undefined } } = {}

      // Execute original function ----------------------------
      ChangeName.forEach(change => {
        const fluxIndex = change.rowId as number
        const fieldName = change.columnId as 'source' | 'target'
        const _prev_node_name = (change.previousCell as TextCell).text
        const new_node_name = (change.newCell as TextCell).text
        spreadSheetFlux[fluxIndex][fieldName] = new_node_name
        const l = drawing_area.sankey.links_list[fluxIndex]

        if (fieldName == 'source') {
          dict_old_name[l.id] = { src: l.source.name, trgt: undefined }
          l.source.name = new_node_name
          dict_new_name[l.id] = { src: new_node_name, trgt: undefined }
        } else {
          dict_old_name[l.id] = { src: undefined, trgt: l.target.name }
          l.target.name = new_node_name
          dict_new_name[l.id] = { src: undefined, trgt: new_node_name }
        }
        menu_configuration.updateComponentRelatedToLinksData()
      })

      // Create undo of original function ----------------------------
      const undoChangeNodeName = () => {
        Object.entries(dict_old_name).forEach(ent_l => {
          if (ent_l[1].src !== undefined) {
            sankey.links_dict[ent_l[0]].source.name = ent_l[1].src
          }
          if (ent_l[1].trgt !== undefined) {
            sankey.links_dict[ent_l[0]].target.name = ent_l[1].trgt
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }

      // Create redo of original function ----------------------------
      const redoChangeNodeName = () => {
        Object.entries(dict_new_name).forEach(ent_l => {
          if (ent_l[1].src !== undefined) {
            sankey.links_dict[ent_l[0]].source.name = ent_l[1].src
          }
          if (ent_l[1].trgt !== undefined) {
            sankey.links_dict[ent_l[0]].target.name = ent_l[1].trgt
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }
      //Save undo/redo
      app_data.history.saveUndo(undoChangeNodeName)
      app_data.history.saveRedo(redoChangeNodeName)
    }
  }

  // Render the ReactGrid component
  return <><ReactGrid
    rows={rows}
    columns={columns}
    onCellsChanged={
      (changes: CellChange[]) => {
        drawing_area.setToModeEdition(false)
        // Four possible actions :
        // - Modifying link value
        // - New link 
        // - Modifying source or/and target of link
        // - Rename node

        // 1. Changes Values
        updateLinksValues(changes)

        // 2. New Flux
        newFlux(changes)

        // 3. Modify flux
        modifyFlux(changes)

        // 4. Change node name
        ChangeNodeName(changes)
      }
    }
    onColumnResized={(ci: Id, width: number) => {
      // Allow resizing columns
      setColumns((prevColumns: Column[]) => {
        const columnIndex = prevColumns.findIndex(el => el.columnId === ci)
        const resizedColumn = prevColumns[columnIndex]
        const updatedColumn = { ...resizedColumn, width }
        prevColumns[columnIndex] = updatedColumn
        return [...prevColumns]
      })
    }}
    onContextMenu={(): MenuOption[] => {
      return [
        {
          id: 'paste',
          label: app_data.t('SpreadSheet.paste'),
          handler: () => {
            if (window.navigator.userAgent.includes('Firefox')) {
              alert('Cette fonctionnalité ne fonctionne pas sur Firefox.')
              return
            }
            getCellsFromClipboardPlainText().then((rows) => {
              rows = rows.filter(r => r.length == 2 || r.length == 3) //Only keep row with [source,target] or [source,target,value]
              // Paste and handle clipboard data
              if (rows.length == 0) {
                return
              }
              if (rows.length == 1) {
                return
              }

              //Snapshot of current sankey before update 
              const prevSankey = drawing_area.toJSON()
              drawing_area.sankey.delete_all_nodes_and_links() // Clear all nodes & links

              // AJOUT: Réinitialiser complètement le spreadsheet
              spreadSheetFlux.length = 0 // Vider le tableau

              // Créer les nouvelles lignes à partir des données collées
              rows.forEach((r) => {
                const newFlux: IType_SpreadSheetFlux = {
                  id: 'empty',
                  source: r[0]?.text?.replace('\r', '') || '',
                  target: r[1]?.text?.replace('\r', '') || '',
                  value_data: r[2]?.value || undefined
                }
                spreadSheetFlux.push(newFlux)
              })

              // Ajouter la ligne vide pour les nouveaux flux
              spreadSheetFlux.push({ id: 'empty', source: '', target: '' })

              let redraw = false
              let synchronizeSpreadSheet = false
              const elementCreated: ([typeCreatedLink, typeCreatedNode[]] | undefined)[] = []
              spreadSheetFlux.forEach(flux => {
                if (flux.value_data && isNaN(flux.value_data)) {
                  flux.value_data = (flux.value_data as unknown as string).replace(' ', '').replace('\r', '') as unknown as number
                }
                if (flux.value_data) {
                  flux.value_data = +flux.value_data
                }
                if (!((flux.id) in sankey.links_dict)) {
                  elementCreated.push(addLink(flux)) //add created element in list for undo
                  redraw = true
                }
                synchronizeSpreadSheet = true
              })
              //Snapshot of current sankey after update 
              const nextSankey = drawing_area.toJSON()

              // Post-paste functions ====================================
              if (redraw) {
                drawing_area.nodePositioning.computeAutoSankeyWithToast(true, true)
                applyRandomColors(app_data, app_data.drawing_area.sankey.links_list)
                app_data.draw()
                drawing_area.setToModeEdition(false)
                menu_configuration.updateComponentRelatedToLinksData()
              }
              if (synchronizeSpreadSheet) {
                menu_configuration.updateComponentRelatedToLinksData()
              }

              const undoPaste = () => {
                elementCreated.forEach(ec => {
                  if (ec == undefined) {
                    return
                  }
                  ec[1].forEach(node => {
                    // delete node from sankey.node_dict & not directly from elementCreated because
                    //  element in elementCreated can be element not refered in nodes_dict (especially after a redo, so we call an object with the same id)  
                    sankey.deleteNode(drawing_area.sankey.nodes_dict[node.id])
                  })
                })
                drawing_area.fromJSON(prevSankey,{}, false)

                // drawing_area.computeAutoSankey(true)
                app_data.draw()
                menu_configuration.updateComponentRelatedToLinksData()
              }

              const redoPaste = () => {
                drawing_area.fromJSON(nextSankey,{}, false)
                drawing_area.nodePositioning.computeAutoSankeyWithToast(true, true)
                app_data.draw()
                menu_configuration.updateComponentRelatedToLinksData()
              }
              //Save undo/redo
              app_data.history.saveUndo(undoPaste)
              app_data.history.saveRedo(redoPaste)
            })
          }
        }
      ]
    }}
  />
  <Checkbox
    variant='menuconfigpanel_option_checkbox'
    isChecked={menu_configuration.spreadsheet_freeze}
    onChange={(evt) => {
      set_freeze(evt.target.checked)
      menu_configuration.spreadsheet_freeze = evt.target.checked
    }}
  >
    {'Freeze'}
  </Checkbox>
  </>
}