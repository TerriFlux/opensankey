import { selectAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(selectAnatomy.keys)

export const select_base_style = definePartsStyle({
  field: {
    height: '2rem',
    border: 'solid 1px',
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
      border: 'solid 2px',
      borderColor: 'openSankey.100',
    }
  }
})

export const select_custom_style = definePartsStyle({
  field: {
    borderRadius: '0px 6px 6px 0px',
    fontSize: '12px'
  }
})

export const menuconfigpanel_option_select = definePartsStyle({
  field: {
    height: '2rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})

// Style of selector in table of tags
export const menuconfigpanel_option_select_table = definePartsStyle({
  field: {
    paddingLeft:'0.25rem',
    height: 'revert',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})

