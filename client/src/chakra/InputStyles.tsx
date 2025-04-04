
import { inputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys)

export const input_user_pages = definePartsStyle({
  addon: {
    height: '2rem',
  },
  field: {
    height: '2rem',
  },
})


export const register_input = definePartsStyle({
  addon: {
    height: '2rem',
    minWidth: '10rem'
  },
  field: {
    height: '2rem',
    width: '100%'
  }
})