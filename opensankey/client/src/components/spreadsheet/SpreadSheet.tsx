// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  ReactGrid, Column, Row, CellChange, TextCell, NumberCell, Id, MenuOption,
  SelectionMode, DefaultCellTypes, Cell, Compatible, CellLocation
} from '@silevis/reactgrid' 
import '@silevis/reactgrid/styles.css'

import { Type_GenericApplicationData, Type_GenericDrawingArea, Type_GenericLinkElement, Type_GenericNodeElement } from '../../types/Types'
import { parseLocaleNumber } from '../../types/Utils'
import { ClassTemplate_Sankey } from '../../types/Sankey'
import { ClassTemplate_NodeElement } from '../../Elements/Node'
import { defaultLinkId } from '../../Elements/Link'

// Define a type for generic abstract node elements
type Type_AnyAbstractNodeElement = ClassTemplate_NodeElement<
  Type_GenericDrawingArea,
  ClassTemplate_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
  Type_GenericLinkElement
>;

// Main SpreadSheet component
export const SpreadSheet: FunctionComponent<{ new_data: Type_GenericApplicationData }> = (
  { new_data }: { new_data: Type_GenericApplicationData }
) => {
  // Define the structure of a flux (flow) row in the spreadsheet
  interface SpreadSheetFluxType {
    source: string // Source node of the flow
    target: string // Target node of the flow
    value?: number // Value of the flow (optional)
  }

  // Extract flux data from the Sankey diagram and prepare it for the spreadsheet
  const getFluxFromSankey = (): SpreadSheetFluxType[] => {
    const a: SpreadSheetFluxType[] = new_data.drawing_area.sankey.links_list.map((l) => {
      return {
        source: l.source.name, // Get source node name
        target: l.target.name, // Get target node name
        value: l.data_value!,  // Get the value of the link
      }
    })
    // Add an empty row for new flux input
    a.push({ source: '', target: '' })
    return a
  }

  // Map node and link names to their IDs for quick lookups
  const name2id: { [_: string]: string } = {}
  new_data.drawing_area.sankey.nodes_list.forEach(n => { name2id[n.name] = n.id })
  new_data.drawing_area.sankey.links_list.forEach(l => { name2id[defaultLinkId(l.source, l.target)] = l.id })

  // Define the spreadsheet columns and their properties
  const [columns, setColumns] = useState<Column[]>([
    { columnId: 'source', width: 150, resizable: true },
    { columnId: 'target', width: 150, resizable: true },
    { columnId: 'value', width: 150, resizable: true }
  ])

  // State to hold the flux data displayed in the spreadsheet
  const [spreadSheetFlux, setSpreadSheetFlux] = useState<SpreadSheetFluxType[]>(getFluxFromSankey())

  // Function to synchronize spreadsheet data with Sankey data
  const synchronizeSpreadSheetWithSankey = () => setSpreadSheetFlux(getFluxFromSankey())

  // Provide a reference to update the spreadsheet externally
  new_data.menu_configuration.ref_to_spreadsheet.current = () => {
    synchronizeSpreadSheetWithSankey()
  }

  // Function to add a new node to the Sankey diagram
  const addNode = (name: string) => {
    const new_node = new_data.drawing_area.addNewDefaultNodeToSankey()
    new_node.name = name // Set the name of the new node
    return new_node
  }

  // Function to add a new link (flux) between two nodes
  const addLink = (cur_flux: SpreadSheetFluxType) => {
    const source_name = cur_flux.source
    const target_name = cur_flux.target

    // Skip if source or target is empty
    if (source_name === '' || target_name === '') {
      return
    }

    // Retrieve or create the source node
    let source_node: Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]) {
      source_node = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
    } else {
      source_node = addNode(source_name)
      name2id[source_name] = source_node.id
    }

    // Retrieve or create the target node
    let target_node: Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]) {
      target_node = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
    } else {
      target_node = addNode(target_name)
      name2id[target_name] = target_node.id
    }

    // Add the link if it doesn't exist
    if (!new_data.drawing_area.sankey.links_dict[defaultLinkId(source_node, target_node)]) {
      const l = new_data.drawing_area.sankey.addNewLink(
        source_node,
        target_node
      )
      // Set the value of the link, if provided
      if (cur_flux.value) {
        l.data_value = +cur_flux.value
      }
    }
  }

  // Function to get cells from clipboard and parse them into spreadsheet rows
  async function getCellsFromClipboardPlainText(): Promise<Compatible<Cell>[][]> {
    const text = await navigator.clipboard.readText().catch(() => {
      throw new Error('Failed to read textual data from clipboard!')
    })

    // Parse the clipboard text into rows and columns
    const lines = text.split('\n')
    const new_lines =  lines.map((line) =>
      line.split('\t').map((textValue) => ({
        type: 'text',
        text: textValue,
        value: parseLocaleNumber(textValue),
      }))
    )
    return new_lines
  }

  // Render the ReactGrid component
  return <ReactGrid
    rows={[
      {
        rowId: 'header', // Header row
        cells: [
          { type: 'header', text: new_data.t('Flux.src') },
          { type: 'header', text: new_data.t('Flux.trgt') },
          { type: 'header', text: new_data.t('Flux.value') },
        ]
      },
      ...spreadSheetFlux.map<Row>((flux, idx) => (
        {
          rowId: idx, // Unique ID for each row
          cells: [
            { type: 'text' as const, text: flux.source } as DefaultCellTypes,
            { type: 'text' as const, text: flux.target } as DefaultCellTypes,
            { type: 'number', value: flux.value as number }
          ]
        }
      ))
    ] as Row<Cell>[]}
    columns={columns}
    onCellsChanged={
      (changes: CellChange[]) => {
        let redraw = false
        let updateTable = false

        changes.filter(change => change.type === 'number').forEach(change => {
          const fluxIndex = change.rowId as number
          const fieldName = change.columnId as 'value'
          const l = new_data.drawing_area.sankey.links_list[fluxIndex]
          if (l) {
            if (isNaN((change.newCell as NumberCell).value)) {
              l.data_value = null
            } else {
              l.data_value = (change.newCell as NumberCell).value
            }
            new_data.drawing_area.updateScaleAtLinkValueSetting()
          }
          spreadSheetFlux[fluxIndex][fieldName] = (change.newCell as NumberCell).value
          updateTable = true
        })
        // Three possible actions
        // - new link with two new node
        // - new link with two existing nodes
        // - new link with one existing node and the other to create
        // - modifying source or/and target of link
        // - rename node

        // 1. New Flux
        changes.filter(change => change.type === 'text' && change.rowId == spreadSheetFlux.length - 1).forEach(change => {
          const fluxIndex = change.rowId as number
          const fieldName = change.columnId as 'source' | 'target'
          spreadSheetFlux[fluxIndex][fieldName] = (change.newCell as TextCell).text
          const otherfieldName = change.columnId == 'source' ? 'target' : 'source'
          if (spreadSheetFlux[fluxIndex][otherfieldName] != '' && spreadSheetFlux[fluxIndex][fieldName] != '') {
            addLink(spreadSheetFlux[fluxIndex])
            redraw = true
          } else {
            updateTable = true
          }
        })

        // 2. Modify flux
        changes.filter(change =>
          change.type === 'text' && change.rowId !== spreadSheetFlux.length - 1 && name2id[(change.newCell as TextCell).text!] != undefined
        ).forEach(change => {
          const fluxIndex = change.rowId as number
          const fieldName = change.columnId as 'source' | 'target'
          const l = new_data.drawing_area.sankey.links_list[fluxIndex]

          if (fieldName == 'source') {
            const prevSource = l.source
            l.source = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as TextCell).text]]
            if (!prevSource.hasInputLinks() && !prevSource.hasOutputLinks()) {
              // Remove lone nodes
              new_data.drawing_area.deleteNode(prevSource)
            }
          } else {
            const prevTarget = l.target
            l.target = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as TextCell).text]]
            if (!prevTarget.hasInputLinks() && !prevTarget.hasOutputLinks()) {
              // Remove lone nodes
              new_data.drawing_area.deleteNode(prevTarget)
            }
          }

          synchronizeSpreadSheetWithSankey()
        })

        // 3. Change node name
        changes.filter(change =>
          change.type === 'text' && change.rowId !== spreadSheetFlux.length - 1 && name2id[(change.newCell as TextCell).text] == undefined
        ).forEach(change => {
          const fluxIndex = change.rowId as number
          const fieldName = change.columnId as 'source' | 'target'
          const _prev_node_name = (change.previousCell as TextCell).text
          const new_node_name = (change.newCell as TextCell).text
          spreadSheetFlux[fluxIndex][fieldName] = new_node_name
          const l = new_data.drawing_area.sankey.links_list[fluxIndex]

          if (fieldName == 'source') {
            l.source.name = new_node_name
          } else {
            l.target.name = new_node_name
          }
          synchronizeSpreadSheetWithSankey()
        })

        if (redraw) {
          new_data.drawing_area.computeAutoSankey(true)
          new_data.draw()
        }
        if (updateTable) {
          setSpreadSheetFlux([...spreadSheetFlux])
        }
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

              // Paste and handle clipboard data
              if (rows.length == 1) {
                return
              }
              const columnsId = columns.map(c => c.columnId) as Id[]
              const current_row = selectedRanges[0][0].rowId as number
              const current_col = columnsId.indexOf(selectedRanges[0][0].columnId) as number
              const linksToRemove = []
              if (current_col == 0 && current_row<spreadSheetFlux.length-1) {
                for (let i = spreadSheetFlux.length-2; i>=current_row; i--) {
                  const l =  new_data.drawing_area.sankey.links_list[i]
                  linksToRemove.push(l)
                }
              }
              linksToRemove.forEach(l=>new_data.drawing_area.deleteLink(l))
              new_data.drawing_area.sankey.nodes_list.forEach(n=>{
                if (!n.hasInputLinks() && !n.hasOutputLinks()) {
                  // Remove lone nodes
                  new_data.drawing_area.deleteNode(n)
                }
              })

              rows.pop()
              if (current_row + rows.length > spreadSheetFlux.length) {
                for (let i = spreadSheetFlux.length; i < current_row + rows.length; i++) {
                  spreadSheetFlux.push(({ source: '', target: '' }))
                }
              }
              rows.forEach(
                (r, i) => r.forEach((item, j) => {
                  const row_flux = spreadSheetFlux[current_row + i]
                  const fieldName = columnsId[current_col + j] as 'source' | 'target'
                  row_flux[fieldName] = item.text.replace('\r', '')
                })
              )
              let redraw = false
              let synchronizeSpreadSheet = false
              spreadSheetFlux.forEach(flux => {
                const source_name = flux.source
                const target_name = flux.target
                if (flux.value && isNaN(flux.value)) {
                  flux.value = (flux.value as unknown as string).replace(' ', '').replace('\r', '') as unknown as number
                }
                if (flux.value) {
                  flux.value = +flux.value
                }
                //if (!name2id[source_name] || !name2id[target_name]) {
                  addLink(flux)
                  redraw = true
                //} else {
                  // const sourceNode = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
                  // const targetNode = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
                  // const l = new_data.drawing_area.sankey.links_dict[name2id[defaultLinkId(sourceNode, targetNode)]]
                  // if (l && flux.value) {
                  //   l.data_value = flux.value
                  // }
                  synchronizeSpreadSheet = true
                //}
              })
              if (redraw) {
                new_data.drawing_area.computeAutoSankey(true)
                new_data.draw()
              }
              if (synchronizeSpreadSheet) {
                synchronizeSpreadSheetWithSankey()
              }
            })
          }
        }
      ]
    }}
  />
}
