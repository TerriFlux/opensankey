// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  ReactGrid, Column, Row, CellChange, TextCell, NumberCell, Id, MenuOption,
  SelectionMode, DefaultCellTypes, Cell, Compatible, CellLocation
} from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { Type_GenericApplicationData, Type_GenericDrawingArea, Type_GenericLinkElement, Type_GenericNodeElement } from '../../types/Types'
import { parseLocaleNumber } from '../../types/Utils'
import { ClassTemplate_Sankey } from '../../types/Sankey'
import { ClassTemplate_NodeElement } from '../../types/Node'
import { defaultLinkId } from '../../types/Link';

type Type_AnyAbstractNodeElement = ClassTemplate_NodeElement<
Type_GenericDrawingArea,
ClassTemplate_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement
>

export const SpreadSheet: FunctionComponent<{ new_data: Type_GenericApplicationData }> = (
  { new_data }: { new_data: Type_GenericApplicationData }
) => {
  interface SpreadSheetFluxType {
    source: string
    target: string
    value: number
  }

  const getFluxFromSankey = (): SpreadSheetFluxType[] => {
    const a = new_data.drawing_area.sankey.links_list.map((l, i) => {
      return {
        source: l.source.name,
        target: l.target.name,
        value: l.data_value!,
      }
    })
    a.push({ source: '', target: '', value: 0 })
    return a
  }
  const name2id: { [_: string]: string } = {}
  new_data.drawing_area.sankey.nodes_list.forEach(n => { name2id[n.name] = n.id; })
  new_data.drawing_area.sankey.links_list.forEach(l => { name2id[defaultLinkId(l.source,l.target)] = l.id; })

  const [columns, setColumns] = useState<Column[]>([
    { columnId: 'source', width: 150, resizable: true },
    { columnId: 'target', width: 150, resizable: true },
    { columnId: 'value', width: 150, resizable: true }
  ])
  const [spreadSheetFlux, setSpreadSheetFlux] = useState<SpreadSheetFluxType[]>(getFluxFromSankey())
  const synchronizeSpreadSheetWithSankey = () => setSpreadSheetFlux(getFluxFromSankey())
  new_data.ref_to_spreadsheet.current = () => {
    synchronizeSpreadSheetWithSankey()
  }

  const addNode = (
    name: string
  ) => {
    const new_node = new_data.drawing_area.addNewDefaultNodeToSankey()
    new_node.name = name
    return new_node
  }

  const addLink = (
    cur_flux: SpreadSheetFluxType
  ) => {
    const source_name = cur_flux.source
    const target_name = cur_flux.target
    if ( source_name == '' || target_name == '') {
      return 
    }
    let source_node: Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]) {
      source_node = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
    } else {
      source_node = addNode(source_name)
      name2id[source_name] = source_node.id
    }
    let target_node: Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]) {
      target_node = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
    } else {
      target_node = addNode(target_name)
      name2id[target_name] = target_node.id
    }
    if (new_data.drawing_area.sankey.links_dict[defaultLinkId(source_node, target_node)] == undefined) {
      const l = new_data.drawing_area.sankey.addNewLink(
        source_node,
        target_node
      )
      l.data_value = +cur_flux.value;
      (l as unknown as { shape_is_gradient: boolean }).shape_is_gradient = true
    }
  }

  async function getCellsFromClipboardPlainText(): Promise<Compatible<Cell>[][]> {
    const text = await navigator.clipboard.readText().catch(() => {
      throw new Error("Failed to read textual data from clipboard!");
    });

    return text.split("\n").map((line) =>
      line.split("\t").map((textValue) => ({
        type: "text",
        text: textValue,
        value: parseLocaleNumber(textValue),
      }))
    )
  }

  return <ReactGrid
    rows={[
      {
        rowId: 'header',
        cells: [
          { type: 'header', text: new_data.t('Flux.src') },
          { type: 'header', text: new_data.t('Flux.trgt') },
          { type: 'header', text: new_data.t('Flux.value') },
        ]
      },
      ...spreadSheetFlux.map<Row>((flux, idx) => (
        {
          rowId: idx,
          cells: [
            { type: 'text' as 'text', text: flux.source } as DefaultCellTypes,
            { type: 'text' as 'text', text: flux.target } as DefaultCellTypes,
            { type: 'number', value: flux.value }
          ]
        }
      ))
    ]as Row<Cell>[]}
    columns={columns}
    onCellsChanged={
      (changes: CellChange[])  => {
        //const changes = cur_changes as CellChange<TextCell|NumberCell>[]
        changes.filter(change => change.type === "number").forEach(change => {
          const fluxIndex = change.rowId as number
          const fieldName = change.columnId as 'value'
          const l = new_data.drawing_area.sankey.links_list[fluxIndex]
          if (l) {
            l.data_value = (change.newCell as NumberCell).value
            new_data.drawing_area.updateScaleAtLinkValueSetting()
          }
          spreadSheetFlux[fluxIndex][fieldName] = (change.newCell as NumberCell).value
        })
        // Three possible actions 
        // - new link with two new node
        // - new link with two existing nodes
        // - new link with one existing node and the other to create
        // - modifying source or/and target of link
        // - rename node

        let redraw = false
        let updateTable = false

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
            setSpreadSheetFlux([...spreadSheetFlux])
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
            l.source = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as TextCell).text]]
          } else {
            l.target = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as TextCell).text]]
          }
          synchronizeSpreadSheetWithSankey()
        })

        // 3. Change node name
        changes.filter(change =>
          change.type === 'text' && change.rowId !== spreadSheetFlux.length - 1 && name2id[(change.newCell as TextCell).text] == undefined
        ).forEach(change => {
          const fluxIndex = change.rowId as number
          const fieldName = change.columnId as 'source' | 'target'
          const prev_node_name = (change.previousCell as TextCell).text
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
          id: "paste",
          label: "Paste",
          handler: () => {
            getCellsFromClipboardPlainText().then(rows => {
              console.log(selectedRanges)
              const columnsId = columns.map(c => c.columnId) as Id[]
              const current_row = selectedRanges[0][0].rowId as number
              const current_col = columnsId.indexOf(selectedRanges[0][0].columnId) as number
              //const new_flux = spreadSheetFlux
              rows.pop()
              if (current_row + rows.length > spreadSheetFlux.length) {
                for (let i = spreadSheetFlux.length; i < current_row + rows.length; i++) {
                  spreadSheetFlux.push(({ source: '', target: '', value: 0 }))
                }
              }
              rows.forEach(
                (r, i) => r.forEach((item, j) => {
                  const row_flux = spreadSheetFlux[current_row + i]
                  const fieldName = columnsId[current_col + j] as 'source' | 'target'
                  row_flux[fieldName] = item.text
                })
              )
              let redraw = false
              let synchronizeSpreadSheet = false
              spreadSheetFlux.forEach(flux => {
                const source_name = flux.source
                const target_name = flux.target
                if (isNaN(flux.value)) {
                  flux.value = (flux.value as unknown as string).replace(' ', '').replace('\r', '') as unknown as number
                }
                flux.value = +flux.value
                if (!name2id[source_name] || !name2id[target_name]) {
                  addLink(flux)
                  redraw = true
                } else {
                  const sourceNode = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
                  const targetNode = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
                  const l =  new_data.drawing_area.sankey.links_dict[name2id[defaultLinkId(sourceNode,targetNode)]]          
                  if (l) {
                    l.data_value = flux.value
                  }
                  synchronizeSpreadSheet = true
                }
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

