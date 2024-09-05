import { Class_ZoneSelection } from "../deps/OpenSankey/types/Selection_Zone"
import { Class_DrawingAreaPlus } from "./DrawingAreaPlus"
import { Class_MenuConfigPlus } from "./MenuConfigPlus"
import { Class_SankeyPlus } from "./SankeyPlus"

/**
 * Class that helps to create a selection zone for elements on the drawing area
 * @export
 * @class Class_ZoneSelection
 * @extends {Class_Element}
 */
export class Class_ZoneSelectionPlus extends Class_ZoneSelection<Class_DrawingAreaPlus, Class_SankeyPlus>
 {

  // PROTECTED ATTRIBUTES ===============================================================

  // PRIVATE ATTRIBUTES =================================================================

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ZoneSelection.
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {Class_MenuConfig} menu_config
   * @memberof Class_ZoneSelection
   */
  constructor(
    drawing_area: Class_DrawingAreaPlus,
    menu_config: Class_MenuConfigPlus,
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
    super.selectElementsInside()
    
    this.drawing_area.sankey.free_labels_list
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
        this.drawing_area.addFreeLabelToSelection(container)
      })
  }

  // GETTERS / SETTERS ==================================================================

}