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
import React, { FunctionComponent, useState } from 'react'
import {
  ReactGrid,
  Column,
  Row,
  CellChange,
  TextCell,
  NumberCell,
  Id,
  MenuOption,
  SelectionMode,
  Cell,
  Compatible,
  CellLocation
} from '@silevis/reactgrid'
import '@silevis/reactgrid/styles.css'


import { parseLocaleNumber, Type_JSON } from '../../types/Utils'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_LinkElement, defaultLinkId } from '../../Elements/Link'
import { Class_ApplicationData } from '../../types/ApplicationData'



// Define the structure of a flux (flow) row in the spreadsheet
interface IType_SpreadSheetFlux {
  id: string, // Link id
  source: string // Source node of the flow
  target: string // Target node of the flow
  valueData?: number // Collected value (valueData)
  valueResult?: number // Calculated value (valueResult)
}



// Main SpreadSheet component
export const SpreadSheet: FunctionComponent<{ new_data: Class_ApplicationData }> = (
  { new_data }: { new_data: Class_ApplicationData }
) => {
  const { menu_configuration } = new_data

  // // Fonction pour déterminer si on doit afficher la colonne "Valeurs calculées"
  // const shouldShowCalculatedValues = (): boolean => {
  //   return new_data.drawing_area.sankey.links_list.some(l => l.valueResult !== null && l.valueResult !== undefined)
  // }

  // Extract flux data from the Sankey diagram and prepare it for the spreadsheet
  const getFluxFromSankey = (new_data: Class_ApplicationData): IType_SpreadSheetFlux[] => {
    const a: IType_SpreadSheetFlux[] = new_data.drawing_area.sankey.links_list
      .map((l) => {
        return {
          id: l.id, //Link id
          source: l.source.name,
          target: l.target.name,
          valueData: l.valueData!, // Valeurs collectées
          valueResult: l.valueResult! // Valeurs calculées
        }
      })
    // Add an empty row for new flux input
    a.push({ id: 'empty', source: '', target: '' })
    return a
  }

  // Générer les colonnes dynamiquement
  const getColumns = (): Column[] => {
    const innerW = window.innerWidth
    const baseColumns: Column[] = [
      { columnId: 'source', width: innerW * 0.050, resizable: true },
      { columnId: 'target', width: innerW * 0.050, resizable: true },
      { columnId: 'valueData', width: innerW * 0.030, resizable: true },
      { columnId: 'valueResult', width: innerW * 0.030, resizable: true } // Valeurs collectées
    ]
    
    // Ajouter la colonne "Valeurs calculées" si nécessaire
    // if (shouldShowCalculatedValues()) {
    //   baseColumns.push({ columnId: 'valueResult', width: innerW * 0.045, resizable: true })
    // }
    
    return baseColumns
  }

  // Table header
  const headerRow: Row = {
    rowId: 'header', // Header row
    cells: [
      { type: 'header', text: new_data.t('Flux.src') },
      { type: 'header', text: new_data.t('Flux.trgt') },
      { type: 'header', text: new_data.t('Flux.value') },
      { type: 'header', text: 'Val. Calculée' }
    ]
  }

    // Get all table rows
  const getRows = (all_flux: IType_SpreadSheetFlux[]): Row[] => [
    headerRow as Row,
    ...all_flux.map<Row>((flux, idx) => {
      return {
        rowId: idx,
        cells: [
          { type: 'text', text: flux.source },
          { type: 'text', text: flux.target },
          { type: 'number', value: flux.valueData as number },
          { type: 'number', value: flux.valueResult as number }
        ]
      }
    })
  ]
  // // Get all table rows
  // const getRows = (all_flux: IType_SpreadSheetFlux[]): Row[] => {
  //   const headerRow = getHeaderRow()
  //   const showCalculated = shouldShowCalculatedValues()
    
  //   const dataRows = all_flux.map<Row>((flux, idx) => {
  //     const baseCells = [
  //       { type: 'text', text: flux.source },
  //       { type: 'text', text: flux.target },
  //       { type: 'number', value: flux.valueData as number }
  //     ]
      
  //     // Ajouter la cellule "Valeurs calculées" si nécessaire
  //     if (showCalculated) {
  //       baseCells.push({ type: 'number', value: flux.valueResult as number })
  //     }
      
  //     return {
  //       rowId: idx,
  //       cells: baseCells
  //     }
  //   })
    
  //   return [headerRow as Row, ...dataRows]
  // }

// Define the spreadsheet rows and columns
  const [spreadSheetFlux, setSpreadSheetFlux] = useState<IType_SpreadSheetFlux[]>(getFluxFromSankey(new_data))
  const rows = getRows(spreadSheetFlux)
  const [columns, setColumns] = useState<Column[]>(getColumns())

  // Fonction pour mettre à jour les colonnes quand les données changent
  const updateColumns = () => {
    setColumns(getColumns())
  }

  // Map node and link names to their IDs for quick lookups
  const name2id: { [_: string]: string } = {}
  new_data.drawing_area.sankey.nodes_list.forEach(n => { name2id[n.name] = n.id })
  new_data.drawing_area.sankey.links_list.forEach(l => { name2id[defaultLinkId(l.source, l.target)] = l.id })

  // Function to synchronize spreadsheet data with Sankey data
  const synchronizeSpreadSheetWithSankey = () => {
    setSpreadSheetFlux(getFluxFromSankey(new_data))
    updateColumns() // Mettre à jour les colonnes aussi
  }

  // Provide a reference to update the spreadsheet externally
  new_data.menu_configuration.ref_to_spreadsheet.current = () => {
    synchronizeSpreadSheetWithSankey()
  }


  // Provide a reference to update the spreadsheet externally
  new_data.menu_configuration.ref_to_spreadsheet.current = () => {
    synchronizeSpreadSheetWithSankey()
  }

  // Function to add a new node to the Sankey diagram
  const addNode = (name: string) => {
    const new_node = new_data.drawing_area.sankey.addNewNodeWithName(name)
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
    if (new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]) {
      source_node = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
    }
    else {
      source_node = addNode(source_name)
      createdNodes.push({ id: source_node.id, name: source_name })
      name2id[source_name] = source_node.id
    }

    // Retrieve or create the target node
    let target_node: Class_NodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]) {
      target_node = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
    }
    else {
      target_node = addNode(target_name)
      createdNodes.push({ id: target_node.id, name: target_name })
      name2id[target_name] = target_node.id
    }

    // Add the link if it doesn't exist
    if (!new_data.drawing_area.sankey.links_dict[defaultLinkId(source_node, target_node)]) {
      const l = new_data.drawing_area.sankey.addNewLink(
        source_node,
        target_node
      )
      // Set the value of the link, if provided
      if (cur_flux.valueData) {
        l.value!.valueData = +cur_flux.valueData
      }
      if (cur_flux.valueResult) {
        l.value!.valueResult = +cur_flux.valueResult
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
        value: parseLocaleNumber(textValue),
      }))
    )
  }

  const redraw = () => {
    new_data.drawing_area.nodePositioning.computeAutoSankeyWithToast(true)
    new_data.draw()
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
      const dict_old_val: { [x: string]: { valueData?: number | null, valueResult?: number | null } } = {}
      const dict_new_val: { [x: string]: { valueData?: number | null, valueResult?: number | null } } = {}
      
      // Execute original function ----------------------------
      valueChanged.forEach(change => {
        const fluxIndex = change.rowId as number
        const fieldName = change.columnId as 'valueData' | 'valueResult'
        const l = new_data.drawing_area.sankey.links_list[fluxIndex]
        
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

        if (fieldName === 'valueData') {
          dict_old_val[l.id].valueData = l.valueData
          if (isNaN((change.newCell as NumberCell).value)) {
            l.valueData = null
            dict_new_val[l.id].valueData = null
          } else {
            l.valueData = (change.newCell as NumberCell).value
            dict_new_val[l.id].valueData = (change.newCell as NumberCell).value
          }
          spreadSheetFlux[fluxIndex].valueData = (change.newCell as NumberCell).value
        } else if (fieldName === 'valueResult') {
          dict_old_val[l.id].valueResult = l.valueResult
          if (isNaN((change.newCell as NumberCell).value)) {
            l.valueResult = null
            dict_new_val[l.id].valueResult = null
          } else {
            l.valueResult = (change.newCell as NumberCell).value
            dict_new_val[l.id].valueResult = (change.newCell as NumberCell).value
          }
          spreadSheetFlux[fluxIndex].valueResult = (change.newCell as NumberCell).value
        }
        
        new_data.drawing_area.updateScaleAtLinkValueSetting()
      })

      // Create undo of original function ----------------------------
      const undoUpdateLinksValues = () => {
        Object.entries(dict_old_val).forEach(([linkId, values]) => {
          const link = new_data.drawing_area.sankey.links_dict[linkId]
          if (values.valueData !== undefined) {
            link.valueData = values.valueData
          }
          if (values.valueResult !== undefined) {
            link.valueResult = values.valueResult
          }
        })
        new_data.drawing_area.updateScaleAtLinkValueSetting()
        synchronizeSpreadSheetWithSankey() // Utiliser la fonction complète pour mettre à jour les colonnes
        menu_configuration.updateComponentRelatedToLinksData()
      }

      // Create redo of original function ----------------------------
      const redoUpdateLinksValues = () => {
        Object.entries(dict_new_val).forEach(([linkId, values]) => {
          const link = new_data.drawing_area.sankey.links_dict[linkId]
          if (values.valueData !== undefined) {
            link.valueData = values.valueData
          }
          if (values.valueResult !== undefined) {
            link.valueResult = values.valueResult
          }
        })
        new_data.drawing_area.updateScaleAtLinkValueSetting()
        synchronizeSpreadSheetWithSankey() // Utiliser la fonction complète pour mettre à jour les colonnes
        menu_configuration.updateComponentRelatedToLinksData()
      }

      //Save undo/redo
      new_data.history.saveUndo(undoUpdateLinksValues)
      new_data.history.saveRedo(redoUpdateLinksValues)

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
          synchronizeSpreadSheetWithSankey() // Mettre à jour complètement
        }
      })

      // Create undo of original function ----------------------------
      const undoNewFlux = () => {
        // Delete created elements 
        if (createdElements.length > 0) {
          createdElements.forEach(tupleElements => {
            const l = new_data.drawing_area.sankey.links_dict[tupleElements[0].id]
            new_data.drawing_area.deleteLink(l)
            tupleElements[1].forEach(nid => {
              const n = new_data.drawing_area.sankey.nodes_dict[nid.id]
              new_data.drawing_area.deleteNode(n)
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
              new_data.drawing_area.sankey.addNewNode(n.id, n.name)
            })
            const src = new_data.drawing_area.sankey.nodes_dict[line[0].idSrc]
            const trgt = new_data.drawing_area.sankey.nodes_dict[line[0].idTrgt]
            new_data.drawing_area.sankey.addNewLink(src, trgt)
          })
          redraw()
          menu_configuration.updateComponentRelatedToLinksData()
        } else {
          setSpreadSheetFlux([...spreadSheetFlux])//Update Table
        }
      }
      //Save undo/redo
      new_data.history.saveUndo(undoNewFlux)
      new_data.history.saveRedo(redoNewFlux)
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
        const l = new_data.drawing_area.sankey.links_list[fluxIndex]

        const prevNode = l[fieldName]
        dict_old_id[l.id] = {}
        dict_old_id[l.id][fieldName] = l[fieldName].id//save old id of source

        l[fieldName] = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as TextCell).text]]

        dict_new_id[l.id] = {}
        dict_new_id[l.id][fieldName] = l[fieldName].id  //save new id of source

        if (!prevNode.hasInputLinks() && !prevNode.hasOutputLinks()) {
          dict_old_id[l.id].deletedJSON = prevNode.toJSON()//save json of deleted node
          // Remove lone nodes
          new_data.drawing_area.deleteNode(prevNode)
        }
        menu_configuration.updateComponentRelatedToLinksData()
      })

      // Create undo of original function ----------------------------
      const undoModifyFlux = () => {
        const dict_l = new_data.drawing_area.sankey.links_dict
        const dict_n = new_data.drawing_area.sankey.nodes_dict

        Object.entries(dict_old_id).forEach(ent_l => {
          if (ent_l[1].source !== undefined) {
            if (!(ent_l[1].source in dict_n)) {
              // If node was deleted, recreate it 
              const del_node_name = ent_l[1]?.deletedJSON?.name as string
              new_data.drawing_area.sankey.addNewNode(ent_l[1].source, del_node_name)
              if (ent_l[1].deletedJSON)
                dict_n[ent_l[1].source].fromJSON(ent_l[1].deletedJSON) //restore node deleted with json
            }
            dict_l[ent_l[0]].source = dict_n[ent_l[1].source]
          }

          if (ent_l[1].target !== undefined) {
            if (!(ent_l[1].target in dict_n)) {
              // If node was deleted, recreate it 
              const del_node_name = ent_l[1]?.deletedJSON?.name as string
              new_data.drawing_area.sankey.addNewNode(ent_l[1].target, del_node_name)
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
        const dict_l = new_data.drawing_area.sankey.links_dict
        const dict_n = new_data.drawing_area.sankey.nodes_dict

        Object.entries(dict_new_id).forEach(ent_l => {
          if (ent_l[1].source !== undefined) {
            const prevSrc = dict_l[ent_l[0]].source
            dict_l[ent_l[0]].source = dict_n[ent_l[1].source]
            if (!prevSrc.hasInputLinks() && !prevSrc.hasOutputLinks()) {
              // delete lone node
              prevSrc.delete()
              new_data.drawing_area.deleteNode(prevSrc)
            }
          }

          if (ent_l[1].target !== undefined) {
            const prevTarget = dict_l[ent_l[0]].target
            dict_l[ent_l[0]].target = dict_n[ent_l[1].target]
            if (!prevTarget.hasInputLinks() && !prevTarget.hasOutputLinks()) {
              // delete lone node
              prevTarget.delete()
              new_data.drawing_area.deleteNode(prevTarget)
            }
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }
      //Save undo/redo
      new_data.history.saveUndo(undoModifyFlux)
      new_data.history.saveRedo(redoModifyFlux)
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
        const l = new_data.drawing_area.sankey.links_list[fluxIndex]

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
            new_data.drawing_area.sankey.links_dict[ent_l[0]].source.name = ent_l[1].src
          }
          if (ent_l[1].trgt !== undefined) {
            new_data.drawing_area.sankey.links_dict[ent_l[0]].target.name = ent_l[1].trgt
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }

      // Create redo of original function ----------------------------
      const redoChangeNodeName = () => {
        Object.entries(dict_new_name).forEach(ent_l => {
          if (ent_l[1].src !== undefined) {
            new_data.drawing_area.sankey.links_dict[ent_l[0]].source.name = ent_l[1].src
          }
          if (ent_l[1].trgt !== undefined) {
            new_data.drawing_area.sankey.links_dict[ent_l[0]].target.name = ent_l[1].trgt
          }
        })
        menu_configuration.updateComponentRelatedToLinksData()
      }
      //Save undo/redo
      new_data.history.saveUndo(undoChangeNodeName)
      new_data.history.saveRedo(redoChangeNodeName)
    }
  }

  // Render the ReactGrid component
  return <ReactGrid
    rows={rows}
    columns={columns}
    onCellsChanged={
      (changes: CellChange[]) => {
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
    onContextMenu={(
      selectedRowIds: Id[],
      selectedColIds: Id[],
      selectionMode: SelectionMode,
      menuOptions: MenuOption[],
      selectedRanges: Array<CellLocation[]>
    ): MenuOption[] => {
      return [
        {
          id: 'paste',
          label: new_data.t('SpreadSheet.paste'),
          handler: () => {
            if (window.navigator.userAgent.includes('Firefox')) {
              alert('Cette fonctionnalité ne fonctionne pas sur Firefox.')
              return
            }
            getCellsFromClipboardPlainText().then((rows) => {
              rows = rows.filter(r => r.length == 2 || r.length == 3) //Only keep row with [source,target] or [source,target,value]
              // Paste and handle clipboard data
              if (rows.length == 1) {
                return
              }

              //Snapshot of current sankey before update 
              const prevSankey = new_data.drawing_area.toJSON()

              // Format spreadsheet with pasted rows =============================

              const columnsId = columns.map(c => c.columnId) as Id[]
              const current_row = selectedRanges[0][0].rowId as number
              const current_col = columnsId.indexOf(selectedRanges[0][0].columnId) as number
              const linksToRemove = []

              if (current_col == 0 && current_row < spreadSheetFlux.length - 1) {
                for (let i = current_row; i <= current_row + rows.length - 1; i++) {
                  // Go throught row from current row index to current row index + number of row to paste 
                  // If these row contain links content then add to delete list
                  if (i < new_data.drawing_area.sankey.links_list.length) {
                    //If we have a link to delete 
                    const l = new_data.drawing_area.sankey.links_list[i]
                    linksToRemove.push(l)
                  }
                }
              }

              linksToRemove.forEach(l => new_data.drawing_area.deleteLink(l))//delete links
              new_data.drawing_area.sankey.nodes_list.forEach(n => {
                if (!n.hasInputLinks() && !n.hasOutputLinks()) {
                  // Remove lone nodes
                  new_data.drawing_area.deleteNode(n)
                }
              })
              // If we paste more rows than there is available space then add rows on spreadsheet
              if (current_row + rows.length > spreadSheetFlux.length) {
                for (let i = spreadSheetFlux.length; i < current_row + rows.length; i++) {
                  spreadSheetFlux.push(({ id: 'empty', source: '', target: '' }))
                }
              }
              // Paste rows by modifying cell content
              rows.forEach(
                (r, i) => {
                  r.forEach((item, j) => {
                    const row_flux = spreadSheetFlux[current_row + i]
                    const fieldName = columnsId[current_col + j] as 'source' | 'target'
                    row_flux[fieldName] = item.text.replace('\r', '')
                  })
                  const row_flux = spreadSheetFlux[current_row + i]
                  row_flux.id = row_flux.source + ' --> ' + row_flux.target //Modify row id
                }
              )

              // Go throught spreadsheet & add link if not present in data =============================

              let redraw = false
              let synchronizeSpreadSheet = false
              const elementCreated: ([typeCreatedLink, typeCreatedNode[]] | undefined)[] = []
              spreadSheetFlux.forEach(flux => {
                if (flux.valueData && isNaN(flux.valueData)) {
                  flux.valueData = (flux.valueData as unknown as string).replace(' ', '').replace('\r', '') as unknown as number
                }
                if (flux.valueData) {
                  flux.valueData = +flux.valueData
                }
                if (!((flux.id) in new_data.drawing_area.sankey.links_dict)) {
                  elementCreated.push(addLink(flux)) //add created element in list for undo
                  redraw = true
                }
                synchronizeSpreadSheet = true
              })
              //Snapshot of current sankey after update 
              const nextSankey = new_data.drawing_area.toJSON()

              // Post-paste functions ====================================
              if (redraw) {
                new_data.drawing_area.nodePositioning.computeAutoSankeyWithToast(true)
                new_data.draw()
                new_data.drawing_area.setToModeEdition(false)
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
                    new_data.drawing_area.sankey.deleteNode(new_data.drawing_area.sankey.nodes_dict[node.id])
                  })
                })
                new_data.drawing_area.fromJSON(prevSankey, false)

                // new_data.drawing_area.computeAutoSankey(true)
                new_data.draw()
                menu_configuration.updateComponentRelatedToLinksData()
              }

              const redoPaste = () => {
                new_data.drawing_area.fromJSON(nextSankey, false)
                new_data.drawing_area.nodePositioning.computeAutoSankeyWithToast(true)
                new_data.draw()
                menu_configuration.updateComponentRelatedToLinksData()
              }
              //Save undo/redo
              new_data.history.saveUndo(undoPaste)
              new_data.history.saveRedo(redoPaste)
            })
          }
        }
      ]
    }}
  />
}