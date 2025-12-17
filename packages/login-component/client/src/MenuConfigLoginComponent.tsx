// import { MutableRefObject, useRef } from 'react'
// import { Class_MenuConfigOSP } from './deps/OpenSankey+/types/MenuConfigOSP'

// export class Class_MenuConfigLoginComponent extends Class_MenuConfigOSP {

//   private _ref_to_additional_menus_updater: MutableRefObject<(() => void)>

//   /**
//    * Creates an instance of Class_MenuConfigOSP.
//    * @memberof Class_MenuConfigOSP
//    */
//   constructor() {
//     super()
//     this._ref_to_additional_menus_updater = useRef(() => null)
//   }

//   // PUBLIC METHODS ====================================================================
//   public override updateAllMenuComponents(): void {
//     super.updateAllMenuComponents()
//     this.updateComponentsRelatedToLoginComponent()
//   }

//   public updateComponentsRelatedToLoginComponent() {
//     this._ref_to_additional_menus_updater.current()
//   }

//   public get ref_to_additional_menus_updater() {return this._ref_to_additional_menus_updater}

// }