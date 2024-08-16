import { Class_ApplicationData } from 'open-sankey/dist/types/ApplicationData'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'



export class Class_ApplicationDataPlus extends Class_ApplicationData {

  private _has_sankey_plus: boolean = true // token for sankeyplus (if user is connected with an account)


  constructor(published_mode: boolean) {
    super(published_mode)

    // OVERRIDE Drawing_Area & MENU CONFIG TO TAKE INTO ACCOUNT ALL NEW VAR. & FUNCTIONS OF OSP
    // TODO : since we change reference of the app_data, verify we cut all link of previous DA & config with app_data
    this.menu_configuration= new Class_MenuConfigPlus()
    this.drawing_area=new Class_DrawingAreaPlus(this.drawing_area.getHeight(), this.drawing_area.getWidth(), this)
    
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

  // Override getter & setter so we can get new type
  override get menu_configuration():Class_MenuConfigPlus{return this._menu_configuration as Class_MenuConfigPlus}
  override set menu_configuration(_:Class_MenuConfigPlus){this._menu_configuration=_}
 
  override get drawing_area() { return this._drawing_area as unknown as Class_DrawingAreaPlus }
  override set drawing_area(_:Class_DrawingAreaPlus) {  this._drawing_area=_ }

}