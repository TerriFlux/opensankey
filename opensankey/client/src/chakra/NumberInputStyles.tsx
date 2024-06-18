import { numberInputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(numberInputAnatomy.keys)

export const numberinput_base_style = definePartsStyle({
  root: {
    width: '100%'
  },
  field: {
    width: '100%',
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

export const menuconfigpanel_option_numberinput = definePartsStyle({
  field: {
    fontSize: '12px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
  }
})

export const menuconfigpanel_option_numberinput_with_right_addon = definePartsStyle({
  field: {
    borderRadius: '6px 0px 0px 6px',
    fontSize: '12px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
  }
})