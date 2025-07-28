import { Class_ZoneSelection } from '../deps/OpenSankey/Elements/SelectionZone'
import { Class_ContainerElement } from '../deps/OpenSankey/Elements/FreeLabel'
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'

/**
 * Class that helps to create a selection zone for elements on the drawing area
 * @export
 * @class Class_ZoneSelection
 * @extends {ClassTemplate_Element}
 */
export class Class_ZoneSelectionOSP extends Class_ZoneSelection {

  // PROTECTED ATTRIBUTES ===============================================================

  // PRIVATE ATTRIBUTES =================================================================

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ZoneSelection.
   * @param {Class_DrawingArea} drawing_area
   * @param {Class_MenuConfig} menu_config
   * @memberof Class_ZoneSelection
   */
  constructor(
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfigOSP,
  ) {
    // Init parent class attributes
    super(drawing_area, menu_config)
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Function to select elements present in the selection zone
   * (nodes has to be fully inside the zone to be selected)
   * @memberof Class_ZoneSelection
   */
  public selectElementsInside() {
    // Get OpenSankey standard elements
    const nbtype=super.selectElementsInside()
    // Adds OpenSankey+ elements
    this.drawing_area.sankey.containers_list
      .filter(container => {
        // Check if node is horizontally in selection zone
        const is_node_horizontally_in_zone = (
          (container.position_x >= this.position_x) &&
          (container.position_x <= (this.position_x + this.width)) &&
          ((container.position_x + container.label_width) <= (this.position_x + this.width))
        )
        // Check if node is vertically in selection zone
        const is_node_vertically_in_zone = (
          (container.position_y >= this.position_y) &&
          (container.position_y <= (this.position_y + this.height)) &&
          ((container.position_y + container.label_height) <= (this.position_y + this.height))
        )
        // Must be verticalt & horizontaly in selection zone
        return (is_node_horizontally_in_zone && is_node_vertically_in_zone)
      })
      .forEach(container => {
        this.drawing_area.addContainerToSelection(container as Class_ContainerElement)
      })

    return nbtype
  }
}