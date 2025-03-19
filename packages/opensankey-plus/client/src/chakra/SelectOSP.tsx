import { selectAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'


const { definePartsStyle } =
  createMultiStyleConfigHelpers(selectAnatomy.keys)


export const view_select = definePartsStyle({
  field: {
    height: '1.25rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})