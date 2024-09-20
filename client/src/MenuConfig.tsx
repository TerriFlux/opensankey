import { MutableRefObject, useRef } from 'react'
import { Class_MenuConfigPlus } from './deps/OpenSankey+/types/MenuConfigPlus'

export class Class_MenuConfigSA extends Class_MenuConfigPlus {

  // PRIVATE ATTRIBUTES =================================================================

  /* ========================================
    Updater of Sankey application menus
    ========================================*/

  private _ref_to_additional_menus_updater: MutableRefObject<(() => void)>

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfigPlus.
   * @memberof Class_MenuConfigPlus
   */
  constructor() {
    // Init parent class
    super()
    // New attributes
    this._ref_to_additional_menus_updater = useRef(() => null)
  }

  // PUBLIC METHODS ====================================================================

  public updateComponentsRelatedToSA() {
    this._ref_to_additional_menus_updater.current()
  }

  // GETTERS / SETTERS ==================================================================

  public get ref_to_additional_menus_updater() { return this._ref_to_additional_menus_updater}
}