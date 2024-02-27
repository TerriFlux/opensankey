import { inputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys)

export const input_base_style = definePartsStyle({
  addon: {
    height: '2rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'grey.50',
    textStyle: 'h4',
    bg: 'grey.50',
    bgColor: 'grey.50',
  },
  field: {
    height: '2rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'grey.50',
    textStyle: 'h4',
    bg: 'white',
    bgColor: 'white',
    _disabled: {
      bg: 'grey.300',
      bgColor: 'grey.300'
    },
    _focus: {
      border: 'solid 2px ',
      borderColor: 'openSankey.100',
    }
  }
})

export const menuconfigpanel_option_input = definePartsStyle({
  addon: {
    minWidth: '4.5rem',
    fontSize: '12px',
    bg: 'grey.100',
    bgColor: 'grey.100',
  },
  field: {
    fontSize: '12px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
  }
})

export const menuconfigpanel_option_input_color = definePartsStyle({
  field: {
    padding: '0.25rem'
  }
})
