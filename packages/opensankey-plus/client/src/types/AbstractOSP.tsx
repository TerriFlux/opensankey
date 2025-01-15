// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 03/09/2024
// All rights reserved for TerriFlux SARL
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================

import * as d3 from 'd3'

import { ClassTemplate_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { ClassTemplate_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { ClassTemplate_Element } from '../deps/OpenSankey/types/Element'
import { ClassTemplate_LinkElement } from '../deps/OpenSankey/types/Link'
import { ClassTemplate_NodeElement } from '../deps/OpenSankey/types/Node'
import { ClassTemplate_Sankey } from '../deps/OpenSankey/types/Sankey'

import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { Class_ContainerElement } from './FreeLabel'

export abstract class ClassAbstract_ApplicationDataOSP
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericSankey extends ClassAbstract_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassAbstract_NodeElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassAbstract_LinkElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends ClassTemplate_ApplicationData
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {
  public abstract get menu_configuration(): Class_MenuConfigOSP
  // Mandatory methods
  public abstract deleteView(id: string): void
}

export abstract class ClassAbstract_DrawingAreaOSP
  <
    Type_GenericSankey extends ClassAbstract_SankeyOSP<ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassAbstract_NodeElementOSP<ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassAbstract_LinkElementOSP<ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends ClassTemplate_DrawingArea
  <
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {
  public abstract d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null

  public abstract addContainerToSelection(_: ClassAbstract_ContainerElement<ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>): void
  public abstract moveSelectedNodesFromDragEvent(event: d3.D3DragEvent<SVGGElement, unknown, unknown>): void
  public abstract moveSelectedContainerFromDragEvent(event: d3.D3DragEvent<SVGGElement, unknown, unknown>): void
  public abstract addContainerElement(): number
  public abstract orderElementsConatianer():void

  public abstract get selected_containers_list(): Class_ContainerElement<ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[]
  public abstract get heredited_attr(): string[]
}

export abstract class ClassAbstract_SankeyOSP
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<ClassAbstract_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassAbstract_NodeElementOSP<Type_GenericDrawingArea, ClassAbstract_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassAbstract_LinkElementOSP<Type_GenericDrawingArea, ClassAbstract_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement>
  >
  extends ClassTemplate_Sankey
  <
    Type_GenericDrawingArea,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {
  public abstract getIconFromCatalog(id_icon: string): string
  public abstract get containers_list(): ClassAbstract_ContainerElement<Type_GenericDrawingArea, ClassAbstract_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>[]
}

export abstract class ClassAbstract_NodeElementOSP
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<Type_GenericSankey, ClassAbstract_NodeElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericSankey extends ClassAbstract_SankeyOSP<Type_GenericDrawingArea, ClassAbstract_NodeElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassAbstract_LinkElementOSP<Type_GenericDrawingArea, Type_GenericSankey, ClassAbstract_NodeElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
  >
  extends ClassTemplate_NodeElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericLinkElement
  > { }

export abstract class ClassAbstract_LinkElementOSP
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, ClassAbstract_LinkElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>>,
    Type_GenericSankey extends ClassAbstract_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, ClassAbstract_LinkElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>>,
    Type_GenericNodeElement extends ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, ClassAbstract_LinkElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>>
  >
  extends ClassTemplate_LinkElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement
  > { }


export abstract class ClassAbstract_ContainerElement
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<Type_GenericSankey, any, any>, // eslint-disable-line
    Type_GenericSankey extends ClassAbstract_SankeyOSP<Type_GenericDrawingArea, any, any> // eslint-disable-line
  >
  extends ClassTemplate_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {
  public abstract get label_width(): number
  public abstract get label_height(): number
}
