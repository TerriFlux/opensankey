import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_account = definePartsStyle({
  dialogContainer: {
    background: 'blackAlpha.500'
  },
  dialog:{
    minWidth: '33vw',
    maxWidth: '66vw',
    width: 'fit-content',
    alignSelf: 'center'
  },
  header: {
    minWidth: 'inherit',
    maxWidth: 'inherit',
    width: 'max-content'
  },
  body: {
    display: 'grid',
    gridAutoFlow: 'row',
    gridRowGap: '6px !important'
  },
  footer: {
  }
})