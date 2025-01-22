// External imports
import React, { FunctionComponent,useState } from 'react'
import { ReactGrid, Column, Row, CellChange, TextCell,NumberCell,Id,MenuOption,SelectionMode,DefaultCellTypes  } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { Type_GenericApplicationData, Type_GenericDrawingArea, Type_GenericLinkElement, Type_GenericNodeElement } from '../../types/Types';
import { ClassTemplate_Sankey } from '../../types/Sankey';
import { ClassTemplate_NodeElement } from '../../types/Node';
// COMPONENTS ===========================================================================


export const SpreadSheet: FunctionComponent<{new_data:Type_GenericApplicationData}> = (
  {new_data} : {new_data:Type_GenericApplicationData}
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
    isSourceOpen: boolean
    isTargetOpen: boolean
  }

  const getFlux = (): Flux[] => { 
    const a = new_data.drawing_area.sankey.links_list.map((l,i)=> {
      return {
        source: l.source.name, 
        target: l.target.name,
        value: l.data_value!,
        isSourceOpen: false,
        isTargetOpen: false,
      }
    })
    if (a.length ==0) {
      a.push({ source: 'Editer nom', target: 'Editer nom', value: 0,isSourceOpen: false,isTargetOpen: false,})
    } else {
      a.push({ source: '', target: '', value: 0,isSourceOpen: false,isTargetOpen: false,})
    }
    return a
  }
  const name2id :{[_:string]:string} = {}
  const tmp_nodes = new_data.drawing_area.sankey.nodes_list.map(n=>{name2id[n.name] = n.id;return{'label':n.name, 'value' :n.name}})
  tmp_nodes.push({'label':'Editer nom', 'value' :'Editer nom'})
  const [nodes,setNodes] = useState(tmp_nodes)

  //const [update,setUpdate] = useState(false)
  const [columns, setColumns] = React.useState<Column[]>(getColumns());
  const [flux, setFlux] = React.useState<Flux[]>(getFlux())

  new_data.ref_to_spreadsheet.current = () => {
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

  const source_cell = (flux:Flux)=>{
    if (flux.source == 'Editer nom') {
      return { type: 'text', text: flux.source}
    }
    return { type: 'dropdown', selectedValue: flux.source, values:nodes, isOpen:flux.isSourceOpen }
  }

  const target_cell = (flux:Flux)=>{
    if (flux.target == 'Editer nom') {
      return { type: 'text', text: flux.source}
    }
    return { type: 'dropdown', selectedValue: flux.target, values:nodes, isOpen:flux.isTargetOpen }
  }

  const getRows = (all_flux: Flux[]): Row[] => [
    headerRow,
    ...all_flux.map<Row>((flux, idx) => (
      {
        rowId: idx,
        cells: [
          source_cell(flux) as DefaultCellTypes,
          target_cell(flux) as DefaultCellTypes,
          { type: 'number', value: flux.value }
        ]
      }
    ))
  ]

  const handleColumnResize = (ci: Id, width: number) => {
    setColumns((prevColumns:Column[]) => {
        const columnIndex = prevColumns.findIndex(el => el.columnId === ci);
        const resizedColumn = prevColumns[columnIndex];
        const updatedColumn = { ...resizedColumn, width };
        prevColumns[columnIndex] = updatedColumn;
        return [...prevColumns];
    });
  }

  const addNode = ( 
    i:number,
    name:string
  ) => {
    const new_node = new_data.drawing_area.addNewDefaultNodeToSankey()
    new_node.name = name
    return new_node
  }
  type Type_AnyAbstractNodeElement = ClassTemplate_NodeElement<Type_GenericDrawingArea, ClassTemplate_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>

  const addLink = ( 
    i:number
  ) => {
    const source_name = flux[i].source
    const target_name = flux[i].target
    let source_node : Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]) {
      source_node = new_data.drawing_area.sankey.nodes_dict[name2id[source_name]]
    } else {
      source_node = addNode(i,source_name)
    }
    let target_node : Type_AnyAbstractNodeElement | undefined
    if (new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]) {
      target_node = new_data.drawing_area.sankey.nodes_dict[name2id[target_name]]
    } else {
      target_node = addNode(i,target_name)
    }
    const l = new_data.drawing_area.sankey.addNewLink(
      source_node,
      target_node
    )
    l.data_value = flux[i].value
  }

  const applyChangesToFlux = (
    changes: CellChange[],
    prevFlux: Flux[]
  ): Flux[] => {
    changes.forEach((change) => {
      const fluxIndex = change.rowId as number
      let create_links = false
      let modify_links = false
      let modify_node = false
      if (change.type === "number") {
        const fieldName = change.columnId as 'value'
        const l = new_data.drawing_area.sankey.links_list[fluxIndex]
        if (l) {
          l.data_value = (change.newCell as NumberCell).value
          new_data.drawing_area.updateScaleAtLinkValueSetting()
        }
        prevFlux[fluxIndex][fieldName] = (change.newCell as NumberCell).value

      }
      if (change.type === "text") {
        const fieldName = change.columnId as 'source' | 'target'
        const l = new_data.drawing_area.sankey.links_list[fluxIndex]
        if (l) {
          modify_node = true
        } else {
          nodes.push({'label':(change.newCell as TextCell).text, 'value' :(change.newCell as TextCell).text})
          create_links = true
        }
        prevFlux[fluxIndex][fieldName] = (change.newCell as TextCell).text
      }
      if (change.type === "dropdown") {
        const fieldName = change.columnId as 'source' | 'target'
        /**
         * Checking for an opening/closing of a dropdown list
         */
        if (change.previousCell.isOpen !== change.newCell.isOpen) {
          if (fieldName == 'source') {
            prevFlux[fluxIndex].isSourceOpen = change.newCell.isOpen!
          } else {
            prevFlux[fluxIndex].isTargetOpen = change.newCell.isOpen!
          }
          /**
           * Finally updating the value of a selected option, selection of new value always causes
           * the closing of a dropdown
           */
          if (
            change.previousCell.selectedValue !== change.newCell.selectedValue
          ) {
            console.log(
              `${change.previousCell.selectedValue} -> ${change.newCell.selectedValue}`
            );
            if (prevFlux[fluxIndex][fieldName] == 'Editer nom') {
              create_links = true
            } else if (prevFlux[fluxIndex].source !== '' && prevFlux[fluxIndex].target !== '') {
              modify_links = true
            }
            prevFlux[fluxIndex][fieldName] = change.newCell.selectedValue!
          }
        }
      }
      const create_or_modify = prevFlux[fluxIndex].source != 'Editer nom' && prevFlux[fluxIndex].target != 'Editer nom' &&
          prevFlux[fluxIndex].source != '' && prevFlux[fluxIndex].target != ''
      if (create_links && create_or_modify
      ) {
        addLink(fluxIndex)
        new_data.drawing_area.computeAutoSankey(true)
        new_data.sendWaitingToast(
          () => {
            new_data.draw()
          })
        new_data.sendWaitingToast(()=>{
          new_data.ref_to_spreadsheet.current()
        })
      } else if (modify_links && create_or_modify && change.type === "dropdown") {
        const l = new_data.drawing_area.sankey.links_list[fluxIndex]
        if (l) {
          l.source = new_data.drawing_area.sankey.nodes_dict[name2id[change.newCell.selectedValue!]]
          new_data.drawing_area.computeAutoSankey(true)
          new_data.sendWaitingToast(()=>{
            new_data.ref_to_spreadsheet.current()
          })
        } else {
          addLink(fluxIndex)
          new_data.drawing_area.computeAutoSankey(true)
          new_data.sendWaitingToast(
            () => {
              new_data.draw()
            })
          new_data.sendWaitingToast(()=>{
            new_data.ref_to_spreadsheet.current()
          })          
        }
      } else if (modify_node) {
        const node = new_data.drawing_area.sankey.links_list[fluxIndex][change.columnId as 'source' | 'target']
        node.name = (change.newCell as TextCell).text
        new_data.sendWaitingToast(()=>{
          new_data.ref_to_spreadsheet.current()
        })
      }
    })
    return [...prevFlux]
  }

  const handleChanges = (changes: CellChange[]) => { 
    setFlux(
      (prevFlux : Flux[]) => applyChangesToFlux(changes, prevFlux)
    ) 
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
            selectedRowIds.forEach(i=>
              new_data.drawing_area.deleteLink(new_data.drawing_area.sankey.links_list[i as number])
            )
            setFlux((prevFlux:Flux[]) => {
              return [...prevFlux.filter((flux, idx) => !selectedRowIds.includes(idx))]
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
    rows={rows} 
    columns={columns}
    enableRangeSelection
    enableRowSelection
    onCellsChanged={handleChanges}
    onColumnResized={handleColumnResize}
    onContextMenu={handleContextMenu}
  />
}

