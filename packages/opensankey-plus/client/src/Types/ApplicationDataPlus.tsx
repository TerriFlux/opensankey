import { Class_ApplicationData, initial_window_height, initial_window_width } from 'open-sankey/src/types/ApplicationData'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'



export class Class_ApplicationDataPlus extends Class_ApplicationData {

  private _has_sankey_plus: boolean = true // token for sankeyplus (if user is connected with an account)


  private _icon_catalog: { [x: string]: string | null | undefined; }

  constructor(published_mode: boolean) {
    super(published_mode)

    // OVERRID DA & MENU CONFIG TO TAKE INTO ACCOUNT ALL NEW VAR. & FUNCTIONS OF OSP
    // TODO : since we change reference of the app_data, verify we cut all link of previous DA & config with app_data
    this.drawing_area = new Class_DrawingAreaPlus(this.drawing_area.getHeight(), this.drawing_area.getWidth(), this)
    this.menu_configuration = new Class_MenuConfigPlus()

    this._icon_catalog = {}

    let logo_sankey_plus = ''
    try {
      /* eslint-disable */
      // @ts-ignore
      logo_sankey_plus = require('../css/OSP.png')
      /* eslint-enable */
      const path = window.location.href
      if (!path.includes('localhost')) {
        logo_sankey_plus = logo_sankey_plus.replace('static/', 'static/opensankey/')
      }
    } catch (expt) {
      console.log('terriflux.png not found')
    }
    this.logo = logo_sankey_plus
  }

  // GETTER & SETTER ==================================

  public get has_sankey_plus(): boolean { return this._has_sankey_plus }
  public set has_sankey_plus(value: boolean) { this._has_sankey_plus = value }

  // Create a getter for menu_config with the cast of OSP (we can't override getter signature so we create a new one)
  public get menu_configuration_plus() { return this.menu_configuration as Class_MenuConfigPlus }
  // Create a getter for menu_config with the cast of OSP (we can't override getter signature so we create a new one)
  public get drawing_area_plus() { return this.drawing_area as Class_DrawingAreaPlus }

  public get icon_catalog(): { [x: string]: string | null | undefined; } { return this._icon_catalog }
  public set icon_catalog(value: { [x: string]: string | null | undefined; }) { this._icon_catalog = value }

}