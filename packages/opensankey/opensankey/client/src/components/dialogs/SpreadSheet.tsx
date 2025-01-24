// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  ReactGrid, Column, Row, CellChange, TextCell, NumberCell, Id, MenuOption,
  SelectionMode, DefaultCellTypes, Cell, CellTemplate, Compatible, getCellProperty,
  isAlphaNumericKey, isNavigationKey, keyCodes, Uncertain, UncertainCompatible
} from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { Type_GenericApplicationData, Type_GenericDrawingArea, Type_GenericLinkElement, Type_GenericNodeElement } from '../../types/Types';
import { ClassTemplate_Sankey } from '../../types/Sankey';
import { ClassTemplate_NodeElement } from '../../types/Node';
// COMPONENTS ===========================================================================


export const SpreadSheet: FunctionComponent<{ new_data: Type_GenericApplicationData }> = (
  { new_data }: { new_data: Type_GenericApplicationData }
) => {
  const getColumns = (): Column[] => [
    { columnId: 'source', width: 150, resizable: true },
    { columnId: 'target', width: 150, resizable: true },
    { columnId: 'value', width: 150, resizable: true }
  ]
  interface Flux {
    source: string
    target: string
    value: number
  }

  const getFlux = (): Flux[] => {
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
  const tmp_nodes = new_data.drawing_area.sankey.nodes_list.map(n => { name2id[n.name] = n.id; return { 'label': n.name, 'value': n.name } })
  tmp_nodes.push({ 'label': '', 'value': '' })
  const [nodes, setNodes] = useState(tmp_nodes)

  const [columns, setColumns] = React.useState<Column[]>(getColumns());
  const [flux, setFlux] = React.useState<Flux[]>(getFlux())

  new_data.ref_to_spreadsheet.current = () => {
    //const lastRow = flux[flux.length-1]
    setFlux(getFlux())
    setNodes(tmp_nodes)
  }

  const headerRow: Row = {
    rowId: 'header',
    cells: [
      { type: 'header', text: 'Source' },
      { type: 'header', text: 'Target' },
      { type: 'header', text: 'Value' },
    ]
  }

  const getRows = (all_flux: Flux[]): Row[] => [
    headerRow,
    ...all_flux.map<Row>((flux, idx) => (
      {
        rowId: idx,
        cells: [
          { type: 'select' as 'text', text: flux.source, options: nodes, isOpen: false } as DefaultCellTypes,
          { type: 'select' as 'text', text: flux.target, options: nodes, isOpen: false } as DefaultCellTypes,
          { type: 'number', value: flux.value }
        ]
      }
    ))
  ]

  const handleColumnResize = (ci: Id, width: number) => {
    setColumns((prevColumns: Column[]) => {
      const columnIndex = prevColumns.findIndex(el => el.columnId === ci);
      const resizedColumn = prevColumns[columnIndex];
      const updatedColumn = { ...resizedColumn, width };
      prevColumns[columnIndex] = updatedColumn;
      return [...prevColumns];
    });
  }

  const addNode = (
    i: number,
    name: string
  ) => {
    const new_node = new_data.drawing_area.addNewDefaultNodeToSankey()
    new_node.name = name
    return new_node
  }
  type Type_AnyAbstractNodeElement = ClassTemplate_NodeElement<Type_GenericDrawingArea, ClassTemplate_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>

  const addLink = (
    i: number
  ) => {
    const source_name = flux[i].source
    const target_name = flux[i].target
    let source_node: Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]) {
      source_node = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
    } else {
      source_node = addNode(i, source_name)
    }
    let target_node: Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]) {
      target_node = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
    } else {
      target_node = addNode(i, target_name)
    }
    const l = new_data.drawing_area.sankey.addNewLink(
      source_node,
      target_node
    )
    l.data_value = flux[i].value
  }

  const applyChangesToFlux = (
    changes: CellChange<SelectCell | NumberCell>[],
    prevFlux: Flux[]
  ): Flux[] => {
    changes.filter(change => change.type === "number").forEach(change => {
      const fluxIndex = change.rowId as number
      const fieldName = change.columnId as 'value'
      const l = new_data.drawing_area.sankey.links_list[fluxIndex]
      if (l) {
        l.data_value = (change.newCell as NumberCell).value
        new_data.drawing_area.updateScaleAtLinkValueSetting()
      }
      prevFlux[fluxIndex][fieldName] = (change.newCell as NumberCell).value
    })
    // Three possible actions 
    // - new link with two new node
    // - new link with two existing nodes
    // - new link with one existing node and the other to create
    // - modifying source or/and target of link
    // - rename node

    let redraw = false

    // 1. New Flux
    changes.filter(change => change.type === "select" && change.rowId == prevFlux.length - 1).forEach(change => {
      const fluxIndex = change.rowId as number
      const fieldName = change.columnId as 'source' | 'target'
      prevFlux[fluxIndex][fieldName] = (change.newCell as SelectCell).text
      const otherfieldName = change.columnId == 'source' ? 'target' : 'source'
      if (prevFlux[fluxIndex][otherfieldName] != '' && prevFlux[fluxIndex][fieldName] != '') {
        addLink(fluxIndex)
        redraw = true
      }
    })

    // 2. Modify flux
    changes.filter(change =>
      change.type === "select" && change.rowId !== prevFlux.length - 1 && name2id[change.newCell.text!] != undefined
    ).forEach(change => {
      const fluxIndex = change.rowId as number
      const fieldName = change.columnId as 'source' | 'target'
      const l = new_data.drawing_area.sankey.links_list[fluxIndex]

      if (fieldName == 'source') {
        l.source = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as SelectCell).text]]
      } else {
        l.target = new_data.drawing_area.sankey.nodes_dict[name2id[(change.newCell as SelectCell).text]]
      }
    })

    // 3. Change node name
    changes.filter(change =>
      change.type === "select" && change.rowId !== prevFlux.length - 1 && name2id[change.newCell.text] == undefined
    ).forEach(change => {
      const fluxIndex = change.rowId as number
      const fieldName = change.columnId as 'source' | 'target'
      const prev_node_name = (change.previousCell as SelectCell).text
      const new_node_name = (change.newCell as SelectCell).text
      prevFlux[fluxIndex][fieldName] = new_node_name
      const l = new_data.drawing_area.sankey.links_list[fluxIndex]

      if (fieldName == 'source') {
        l.source.name = new_node_name
      } else {
        l.target.name = new_node_name
      }
      const nodeIdx = nodes.map(n => n.label).indexOf(prev_node_name)

      const copy_nodes = nodes.filter((n: { label: string; value: string; }) => n.label != prev_node_name)
      copy_nodes.splice(nodeIdx, 0, { 'label': new_node_name, 'value': new_node_name })
      setNodes(copy_nodes)
      //new_data.ref_to_spreadsheet.current()
    })

    if (redraw) {
      new_data.drawing_area.computeAutoSankey(true)
      new_data.sendWaitingToast(
        () => {
          new_data.draw()
        })
    }
    new_data.sendWaitingToast(() => {
      new_data.ref_to_spreadsheet.current()
    })
    return [...prevFlux]
  }

  const handleChanges = (changes: CellChange<SelectCell | NumberCell>[]) => {
    applyChangesToFlux(changes, flux)
    // setFlux(
    //   (prevFlux: Flux[]) => applyChangesToFlux(changes, prevFlux)
    // )
  }

  const handleContextMenu = (
    selectedRowIds: Id[],
    selectedColIds: Id[],
    selectionMode: SelectionMode,
    menuOptions: MenuOption[]
  ): MenuOption[] => {
    if (selectionMode === "row") {
      menuOptions = [
        ...menuOptions,
        {
          id: "removeFlux",
          label: "Remove Flux",
          handler: () => {
            selectedRowIds.forEach(i =>
              new_data.drawing_area.deleteLink(new_data.drawing_area.sankey.links_list[i as number])
            )
            setFlux((prevFlux: Flux[]) => {
              return [...prevFlux.filter((flux, idx) => !selectedRowIds.includes(idx))]
            })
            new_data.sendWaitingToast(
              () => {
                new_data.draw()
              })
          }
        }
      ];
    } else {
      menuOptions = [
        ...menuOptions,
        {
          id: "addFlux",
          label: "Add Flux",
          handler: () => {
            // setPeople(prevPeople => {
            //   return [...prevPeople.filter((person, idx) => !selectedRowIds.includes(idx))]
            // })
          }
        }
      ];
    }
    return menuOptions;
  }


  const rows = getRows(flux)

  return <ReactGrid
    customCellTemplates={{ select: new SelectCellTemplate }}
    rows={rows}
    columns={columns}
    enableRangeSelection
    enableRowSelection
    onCellsChanged={handleChanges as unknown as (changes: CellChange[]) => void}
    onColumnResized={handleColumnResize}
    onContextMenu={handleContextMenu}
  />
}

interface IOption {
  label: string
  value: string
}

export interface SelectCell extends Cell {
  type: "select"
  text: string
  options: IOption[]
  isOpen: boolean
}

export class SelectCellTemplate implements CellTemplate<Cell | SelectCell> {
  private wasEscKeyPressed = false;

  getCompatibleCell(
    uncertainCell: Uncertain<SelectCell>
  ): Compatible<SelectCell> {
    const isOpen = getCellProperty(uncertainCell, "isOpen", "boolean");
    const text = getCellProperty(uncertainCell, "text", "string");
    const options = getCellProperty(uncertainCell, "options", "object");
    const value = parseFloat(text);
    return { ...uncertainCell, text, value, options, isOpen };
  }
  render(
    cell: Compatible<SelectCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<SelectCell>, commit: boolean) => void
  ): JSX.Element {
    const options = getCellProperty(cell, "options", "object");
    if (isInEditMode || (!options.map((o: { label: string; value: string; }) => o.label).includes(cell.text))) {
      const value = cell.text.toLocaleLowerCase();
      return (
        <input
          className="rg-input"
          ref={(input) => {
            if (input) {
              input.focus();
              input.setSelectionRange(input.value.length, input.value.length);
            }
          }}
          defaultValue={cell.text}
          onChange={(e) => {
            return
            const tmp = this.getCompatibleCell({ ...cell, text: e.currentTarget.value })
            onCellChanged(tmp, true)
          }}
          onBlur={(e) => {
            onCellChanged(this.getCompatibleCell({ ...cell, text: e.currentTarget.value }), !this.wasEscKeyPressed);
            this.wasEscKeyPressed = false;
          }}
          onCopy={(e) => e.stopPropagation()}
          onCut={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          //placeholder={cell.placeholder}
          onKeyDown={(e) => {
            if (isAlphaNumericKey(e.keyCode) || isNavigationKey(e.keyCode)) e.stopPropagation();
            if (e.keyCode === keyCodes.ESCAPE) this.wasEscKeyPressed = true;
          }}
        />)
    }
    let nb_click = 0
    return (
      <select
        ref={(input) => {
          input && input.focus();
        }}
        defaultValue={cell.text}
        onChange={(e) =>
          onCellChanged(
            this.getCompatibleCell({ ...cell, text: e.currentTarget.options[e.currentTarget.selectedIndex].value }),
            true
          )
        }
        onCopy={(e) => e.stopPropagation()}
        onCut={(e) => e.stopPropagation()}
        onPaste={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          cell.isOpen = !cell.isOpen
          console.log(cell.isOpen)
          if (!cell.isOpen) {
            e.stopPropagation()
          }
        }}
      >
        {cell.text == '' ? (cell.options.map((opt, idx) => <option key={idx} value={opt.value}>{opt.value}</option>))
          : (cell.options.filter(opt => opt.label != '').map((opt, idx) => <option key={idx} value={opt.value}>{opt.value}</option>))
        }
      </select>
    );
  }

  handleKeyDown(
    cell: Compatible<SelectCell>,
    keyCode: number,
    ctrl: boolean,
    shift: boolean,
    alt: boolean
  ): { cell: Compatible<SelectCell>; enableEditMode: boolean } {
    if (!ctrl && !alt && isAlphaNumericKey(keyCode))
      return { cell, enableEditMode: true };
    return {
      cell,
      enableEditMode:
        keyCode === 1,
    };
  }

  update(cell: Compatible<SelectCell>, cellToMerge: UncertainCompatible<SelectCell>): Compatible<SelectCell> {
    return this.getCompatibleCell({ ...cell, text: cellToMerge.text })
  }
}