import { Box, Text } from '@chakra-ui/react'
import React, { CSSProperties, useState, useEffect } from 'react'
import { ColorResult, SketchPicker } from 'react-color'
import { OSTooltip } from './MenuCommon'

// Déclaration du type pour l'EyeDropper API
declare global {
  interface Window {
    EyeDropper?: {
      new(): EyeDropper
    }
  }
}

interface EyeDropper {
  open(): Promise<{ sRGBHex: string }>
}


export const MenuColorPicker = ({
  initialColor,
  label = '',
  onColorChange,
  isDisabled = false,
  disabledTooltip = '',
  showLabel = true,
  size = 'md',
  showEyeDropper = true
}: {
  initialColor: string
  label?: string
  onColorChange: (color: string) => void
  isDisabled?: boolean
  disabledTooltip?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  showEyeDropper?: boolean
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false)
  const [color, setColor] = useState(initialColor)
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false)

  // Vérifier si l'EyeDropper API est supportée
  useEffect(() => {
    setIsEyeDropperSupported('EyeDropper' in window)
  }, [])

  // Update swatch color when we change color from outside picker
  if (!displayColorPicker && color !== initialColor) {
    setColor(initialColor)
  }

  /**
   * Utiliser l'EyeDropper natif du navigateur
   */
  const useEyeDropper = async () => {

    if (!window.EyeDropper || isDisabled) return

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      const newColor = result.sRGBHex
      setColor(newColor)
      onColorChange(newColor)
    } catch (error) {

    }
  }

  /**
   * Event when we click on the color button
   */
  const handleClick = () => {
    if (!isDisabled) {
      setDisplayColorPicker(!displayColorPicker)
    }
  }

  /**
   * Event when we close the picker
   */
  const handleClose = () => {
    setDisplayColorPicker(false)
    onColorChange(color)
  }

  /**
   * Event when we change color in picker
   */
  const handleChange = (color: ColorResult) => {
    setColor(color.hex)
  }

  // Styles for the color picker components
  const styles: { [x: string]: CSSProperties } = {
    colorPreview: {
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
      display: 'grid',
      gridTemplateColumns: '7fr 1fr',
      gridColumnGap: '0.25rem',
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

  return (
    <Box>

      {showLabel && (
        <Text fontSize="sm" color={isDisabled ? 'gray.400' : 'gray.700'} minW="fit-content">
          {label}
        </Text>
      )}


      <Box style={styles.swatch} >
        <OSTooltip label={isDisabled ? disabledTooltip : `Cliquer pour changer la couleur`}>
          <Box style={styles.colorPreview} onClick={handleClick} />
        </OSTooltip>
        {/* Bouton EyeDropper */}
        {showEyeDropper && (
          <OSTooltip label={
            !isEyeDropperSupported
              ? "Pipette non supportée dans ce navigateur"
              : isDisabled
                ? disabledTooltip
                : "Sélectionner une couleur à l'écran"
          }>
            <Box
              onClick={useEyeDropper}
            >✏️</Box>
          </OSTooltip>
        )}
      </Box>


      {/* Color Picker Popover */}
      {
        displayColorPicker && (
          <Box style={styles.popover}>
            <Box style={styles.cover} onClick={handleClose} />
            <SketchPicker
              color={color}
              onChange={handleChange}
              disableAlpha={false}
            />
            {/* {this._user_preferences.color.length > 0 ? <SwatchesPicker colors={list_colors} onChange={handleChange} /> : <></>} */}
          </Box>
        )
      }

      {/* Message si EyeDropper n'est pas supporté
      {showEyeDropper && !isEyeDropperSupported && (
        <Text fontSize="xs" color="orange.500" mt={1}>
          💡 La pipette nécessite Chrome/Edge 95+ ou Firefox avec flag activé
        </Text>
      )} */}
    </Box >
  )
}