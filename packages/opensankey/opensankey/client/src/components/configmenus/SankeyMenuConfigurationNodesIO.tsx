// // ==================================================================================================
// // The MIT License (MIT)
// // ==================================================================================================
// // Copyright (c) 2025 TerriFlux
// // 
// // Permission is hereby granted, free of charge, to any person obtaining a copy
// // of this software and associated documentation files (the "Software"), to deal
// // in the Software without restriction, including without limitation the rights
// // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// // copies of the Software, and to permit persons to whom the Software is
// // furnished to do so, subject to the following conditions:
// // 
// // The above copyright notice and this permission notice shall be included in
// // all copies or substantial portions of the Software.
// // 
// // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// // THE SOFTWARE.
// // ==================================================================================================
// // Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// // ==================================================================================================

// import React, { FC, useState } from 'react'
// import { DragDropContext, Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'

// import {
//   Box,
//   Button,
//   Checkbox,
//   Select,
//   Table,
//   Tbody,
//   Th,
//   Thead,
//   Tr,
// } from '@chakra-ui/react'

// /*************************************************************************************************/

// import { WrapperBoxSubSectionMenu } from './MenuCommon'
// import { Class_LinkElement } from '../../Elements/Link'
// import { Class_NodeElement } from '../../Elements/Node'
// import { BaseApplicationDataType } from '../SankeyMenuTypes'
// import { OSTooltip } from './MenuCommon'
// import { Type_Side } from '../../Elements/ElementsAttributesConfig'
// import { SankeyNodeSelection } from './MenuElementsSelection'
// import { Class_ApplicationData } from '../../types/ApplicationData'

// /*************************************************************************************************/

// /**
//  * Define IO selection menu for nodes
//   *
//   * @param {*} {
//   *   app_data,
//   *   menu_for_modal
//   * }
//   * @return {*}
//   */
// export const SankeyMenuConfigurationNodesIO = ({app_data}:{app_data:Class_ApplicationData}) => {

//   // Function used to force this component to reload
//   const [, setCount] = useState(0)

//   // Link this menu's update function
//   app_data.menu_configuration.ref_to_menu_config_nodes_io_updater.current = () => setCount(a => a + 1)

//   const content = <>
//     <SankeyNodeSelection app_data={app_data} />
//   </>
//   return content

// }


