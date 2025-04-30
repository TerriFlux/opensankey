import { Dispatch, MutableRefObject, SetStateAction, useRef } from 'react'
import { Class_MenuConfigOSP } from '../deps/OpenSankey+/types/MenuConfigOSP'

type SAShowMenuComponentsVarType = {
  ref_setter_show_modal_sankeytheque: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
}
export class Class_MenuConfigSA extends Class_MenuConfigOSP {


  // PRIVATE ATTRIBUTES =================================================================

  /* ========================================
    Updater of Sankey application menus
    ========================================*/

  private _ref_to_additional_menus_updater: MutableRefObject<(() => void)>
  private _ref_to_btn_top_sankeytheque_updater: MutableRefObject<(() => void)>
  private _ref_to_btn_top_pref_updater: MutableRefObject<(() => void)>

  private _dict_setter_show_dialog_SA: SAShowMenuComponentsVarType

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfigOSP.
   * @memberof Class_MenuConfigOSP
   */
  constructor() {
    // Init parent class
    super()
    // New attributes
    this._ref_to_additional_menus_updater = useRef(() => null)
    this._ref_to_btn_top_sankeytheque_updater = useRef(() => null)
    this._ref_to_btn_top_pref_updater = useRef(() => null)
    this._dict_setter_show_dialog_SA = {
      ref_setter_show_modal_sankeytheque: useRef(() => null)
    }
  }

  // PUBLIC METHODS ====================================================================

  public updateComponentsRelatedToSA() {
    this._ref_to_additional_menus_updater.current()
    this._ref_to_btn_top_pref_updater.current()
    this._ref_to_btn_top_sankeytheque_updater.current()
  }

  public override updateAllMenuComponents(): void {
    super.updateAllMenuComponents()
    this.updateComponentsRelatedToSA()
  }

  // GETTERS / SETTERS ==================================================================

  public get show_splashscreen(): boolean {
    return super.show_splashscreen
  }

  public set show_splashscreen(_: boolean) {
    super.show_splashscreen = _
    this._ref_to_additional_menus_updater.current()
  }

  public get ref_to_additional_menus_updater() { return this._ref_to_additional_menus_updater }
  public get ref_to_btn_top_sankeytheque_updater() { return this._ref_to_btn_top_sankeytheque_updater }
  public get ref_to_btn_top_pref_updater() { return this._ref_to_btn_top_pref_updater }
  public get dict_setter_show_dialog_SA() { return this._dict_setter_show_dialog_SA }
}