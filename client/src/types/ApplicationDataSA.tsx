import { CSSProperties, FunctionComponent, useState } from 'react'
import { Class_ApplicationDataOSP } from '../deps/OpenSankey+/types/TypesOSP'
import { Class_IconLibrarySA } from './IconLibrarySA'
import { Class_MenuConfigSA } from './MenuConfigSA'
import { OSColorPickerProps } from '../deps/OpenSankey+/deps/OpenSankey/types/ApplicationData'
import { Box } from '@chakra-ui/react'
import { OSTooltip } from '../deps/OpenSankey+/deps/OpenSankey/types/Utils'
import React from 'react'
import { ColorResult, SketchPicker, SwatchesPicker } from 'react-color'

export class Class_ApplicationDataSA extends Class_ApplicationDataOSP {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _menu_configuration: Class_MenuConfigSA

  // PRIVATE ATTRIBUTES ===============================================================

  private _user_preferences = { color: [] as { name: string, colors: string[] }[], tags: { nodeTaggs: {}, flowTaggs: {}, dataTaggs: {} } }


  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataSA.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataSA
   */
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    super(published_mode, options)
    // OVERRIDE
    this._menu_configuration = this.menu_configuration
    // Default confi
    // _plus = false

    if (this.has_sankey_plus) {
      // Update user palette when connected
      const path = window.location.origin
      const url = path + '/user/get_preference'
      const fetchData = {
        method: 'POST',
      }
      fetch(url, fetchData).then(response => {
        response.text()
          .then(text => {
            if (text !== 'Not connected') {
              const json_dump = JSON.parse(text)
              if (json_dump['palette']) {
                this._user_preferences.color = json_dump['palette']
              }
              if (json_dump['icon_catalog']) {  
                // Update imported icon in catalog to use user icons
                const ls = localStorage.getItem('icon_imported')
                const icon_ls: { [s: string]: { path: string, Vb: string } } = ls != null && ls !== '' ? JSON.parse(ls) : {}
                const cat_parsed = Object.fromEntries(Object.entries(json_dump['icon_catalog']).map(ent => [ent[0], { path: ent[1], Vb: '0 0 1000 1000' }]))
                const icons = { ...icon_ls, ...cat_parsed }
                localStorage.setItem('icon_imported', JSON.stringify(icons))
              }
            }
          })
      })
    }
  }

  // PUBLIC METHODS =====================================================================

  public createNewMenuConfiguration(): Class_MenuConfigSA {
    return new Class_MenuConfigSA()
  }

  public createNewIconLibrary(): Class_IconLibrarySA {
    return new Class_IconLibrarySA()
  }

  /**
   * Function to get a color picker, it override the one from OS by adding user custom palette
   *
   * @param {*} { initialColor, functionOnBlur, isDisabled, textDisabled = '' }
   * @type {FunctionComponent<OSColorPickerProps>}
   * @memberof Class_ApplicationDataSA
   */
  public override OSColorPicker: FunctionComponent<OSColorPickerProps> = ({ initialColor, functionOnBlur, isDisabled, textDisabled = '' }) => {
    const [displayColorPicker, setDisplayColorPicker] = useState(false)
    const [color, setColor] = useState(initialColor)

    /**
     *Event when we click on the 'button
     *
     * @private
     * @memberof OSColorPicker
     */
    const handleClick = () => {
      if (isDisabled !== true)
        setDisplayColorPicker(!displayColorPicker)
    }

    /**
     *Event when we close the picker
     *
     * @private
     * @memberof OSColorPicker
     */
    const handleClose = () => {
      setDisplayColorPicker(false)
      functionOnBlur(color)
    }

    /**
     * event when we change color of picker
     *
     * @private
     * @param {ColorResult} color
     * @memberof OSColorPicker
     */
    const handleChange = (color: ColorResult) => {
      setColor(color.hex)
    }

    // Style of button to open picker, popover containing picker & 'backgroung overlay' that close picker when clicked
    const styles: { [x: string]: CSSProperties; } = {
      color: {
        width: '100%',
        height: '1rem',
        borderRadius: '2px',
        background: `${color}`,
      },
      swatch: {
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        width: '100%',
        height: '1.5rem',
        padding: '5px',
        background: '#fff',
        borderRadius: '1px',
        boxShadow: '0 0 0 1px rgba(124, 104, 104, 0.1)',
        display: 'inline-block',
      },
      popover: {
        position: 'absolute',
        left: '-20%',
        top: '20%',
        zIndex: '2',
      },
      cover: {
        position: 'fixed',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    }
    const list_colors = this._user_preferences.color.map(palette => palette.colors)

    return (<Box>
      <OSTooltip label={isDisabled ? textDisabled : ''}>
        <Box style={styles.swatch} onClick={handleClick}>
          <Box style={styles.color} />
        </Box>
      </OSTooltip>
      {displayColorPicker ? <Box style={styles.popover}>
        <Box style={styles.cover} onClick={handleClose} />
        <Box display={'flex'}>
          <SketchPicker color={color} onChange={handleChange} />
          {this._user_preferences.color.length > 0 ? <SwatchesPicker colors={list_colors} onChange={handleChange} /> : <></>}
        </Box>
      </Box> : null}
    </Box>
    )
  }

  // GETTERS / SETTERS ==================================================================

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigSA { return this._menu_configuration }
  public set menu_configuration(_: Class_MenuConfigSA) { this._menu_configuration = _ }

  // Overrride logo
  public get logo() {
    if (!this._has_sankey_plus)
      return this.logo_opensankey
    else
      return this.logo_sankey_plus
  }

  public get icon_library(): Class_IconLibrarySA { return this._icon_library as Class_IconLibrarySA }
  public get user_preferences() { return this._user_preferences }

}