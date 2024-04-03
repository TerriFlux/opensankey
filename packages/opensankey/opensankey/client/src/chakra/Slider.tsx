import { sliderAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(sliderAnatomy.keys)

export const slider_base_style = definePartsStyle({
  thumb: {
    width: '1.5rem',
    height: '1.5rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'grey.50',
    bg: 'openSankey.50',
    bgColor: 'openSankey.50',
  },
  filledTrack: {
    bg: 'openSankey.50',
    bgColor: 'openSankey.50',
  },
  mark: {
    textAlign: 'center',
    color: 'grey.50',
    width: '1.5rem',
    zIndex: '2',
    marginTop: '-0.25rem',
    marginLeft: '-0.75rem',
    padding: '0px'
  }
})
