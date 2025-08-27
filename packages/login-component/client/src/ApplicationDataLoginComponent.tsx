import { Class_MenuConfig } from "./deps/OpenSankey+/deps/OpenSankey/types/MenuConfig"
import { Class_ApplicationDataOSP } from "./deps/OpenSankey+/types/ApplicationDataOSP"
import { Class_IconLibraryLoginComponent } from "./IconLibraryLoginComponent"
import { LoginComponent } from "./LoginComponent"
import { Class_MenuConfigLoginComponent } from "./MenuConfigLoginComponent"

export class Class_ApplicationDataLoginComponent extends Class_ApplicationDataOSP {
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    super(published_mode, options)
    this._login_component = new LoginComponent

  }

  public get login_component() { return this._login_component}
  private _login_component : LoginComponent

  public createNewMenuConfiguration() {
    return new Class_MenuConfigLoginComponent() as Class_MenuConfig
  }

  public createNewIconLibrary() {
    return new Class_IconLibraryLoginComponent()
  }

  public get icon_library() { return this._icon_library as Class_IconLibraryLoginComponent }

  // Override getter & setter so we can get new type
  public get menu_configuration_login_component() { return this._menu_configuration  as Class_MenuConfigLoginComponent }
  public set menu_configuration_login_component(_:Class_MenuConfigLoginComponent) { this._menu_configuration = _ }

}