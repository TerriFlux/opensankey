import { inputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys)

export const input_base_style = definePartsStyle({
  addon: {
    height: '2rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'gray.50',
    textStyle: 'h4',
    bg: 'gray.50',
    bgColor: 'gray.50',
  },
  field: {
    height: '2rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'gray.50',
    textStyle: 'h4',
    bg: 'white',
    bgColor: 'white',
    _disabled: {
      bg: 'gray.300',
      bgColor: 'gray.300'
    },
    _focus: {
      border: 'solid 2px ',
      borderColor: 'primaire.2',
    }
  }
})

export const menuconfigpanel_option_input = definePartsStyle({
  addon: {
    minWidth: '4.5rem',
    fontSize: '12px',
    bg: 'gray.100',
    bgColor: 'gray.100',
  },
  field: {
    fontSize: '12px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
  }
})

export const menuconfigpanel_option_input_table = definePartsStyle({
  addon: {
    bg: 'gray.100',
    bgColor: 'gray.100',
  },
  field: {
    paddingLeft: '0.25rem',
    paddingRight: '0.25rem',
    height:'revert',
  }
})

export const menuconfigpanel_option_input_color = definePartsStyle({
  field: {
    padding: '0.25rem'
  }
})
