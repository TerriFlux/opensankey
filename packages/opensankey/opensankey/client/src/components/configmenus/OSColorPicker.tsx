import { Box } from '@chakra-ui/react'
import React, { CSSProperties, FunctionComponent, useState } from 'react'
import { ColorResult, SketchPicker } from 'react-color'
import { OSTooltip } from '../../types/Utils'

// Necessary props to call Class
type OSColorPickerProps = {
  initialColor: string;
  functionOnBlur: (x: string) => void;
  isDisabled?: boolean,
  textDisabled?: string
}

export const OSColorPicker: FunctionComponent<OSColorPickerProps> = ({ initialColor, functionOnBlur, isDisabled,textDisabled=''}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false)
  const [color, setColor] = useState(initialColor)

  // Update swatch color when we change color from outside picker
  if(!displayColorPicker && color !==initialColor){
    setColor(initialColor)
  }

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

  return (<Box>
    <OSTooltip label={isDisabled?textDisabled:''}>
      <Box style={styles.swatch} onClick={handleClick}>
        <Box style={styles.color} />
      </Box>
    </OSTooltip>
    {displayColorPicker ? <Box style={styles.popover}>
      <Box style={styles.cover} onClick={handleClose} />
      <SketchPicker color={color} onChange={handleChange} />
    </Box> : null}
  </Box>
  )
}
