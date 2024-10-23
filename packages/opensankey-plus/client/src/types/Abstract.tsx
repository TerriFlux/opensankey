// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 03/09/2024
// All rights reserved for TerriFlux SARL
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================

import * as d3 from 'd3'

import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_Element } from '../deps/OpenSankey/types/Element'
import { Class_LinkElement } from '../deps/OpenSankey/types/Link'
import { Class_NodeElement } from '../deps/OpenSankey/types/Node'
import { Class_Sankey } from '../deps/OpenSankey/types/Sankey'

import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_ContainerElement } from './FreeLabel'

export abstract class Class_AbstractApplicationDataPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_AbstractNodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_AbstractLinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends Class_ApplicationData
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {
  public abstract get menu_configuration(): Class_MenuConfigPlus
}

export abstract class Class_AbstractDrawingAreaPlus
  <
    Type_GenericSankey extends Class_AbstractSankeyPlus<Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_AbstractNodeElementPlus<Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_AbstractLinkElementPlus<Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends Class_DrawingArea
  <
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {
  public abstract d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null
  public abstract addContainerToSelection(_: Class_AbstractContainerElement<Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>): void
  public abstract get selected_containers_list(): Class_ContainerElement<Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[]
  public abstract get heredited_attr():string[]
}

export abstract class Class_AbstractSankeyPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Class_AbstractSankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_AbstractNodeElementPlus<Type_GenericDrawingArea, Class_AbstractSankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_AbstractLinkElementPlus<Type_GenericDrawingArea, Class_AbstractSankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement>
  >
  extends Class_Sankey
  <
    Type_GenericDrawingArea,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {
  public abstract getIconFromCatalog(id_icon: string): string
  public abstract get containers_list(): Class_AbstractContainerElement<Type_GenericDrawingArea, Class_AbstractSankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>[]
}

export abstract class Class_AbstractNodeElementPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, Class_AbstractNodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, Class_AbstractNodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_AbstractLinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Class_AbstractNodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
  >
  extends Class_NodeElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericLinkElement
  > { }

export abstract class Class_AbstractLinkElementPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Class_AbstractLinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>>,
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Class_AbstractLinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>>,
    Type_GenericNodeElement extends Class_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Class_AbstractLinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>>
  >
  extends Class_LinkElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement
  > { }


export abstract class Class_AbstractContainerElement
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, any, any>, // eslint-disable-line
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, any, any> // eslint-disable-line
  >
  extends Class_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {
  public abstract get label_width(): number
  public abstract get label_height(): number
}
