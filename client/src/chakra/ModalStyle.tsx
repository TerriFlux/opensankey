import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_account = definePartsStyle({
  dialogContainer: {
    background: 'blackAlpha.500'
  },
  dialog:{
    display: 'inherit',
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
    gridRowGap: '6px !important',
    width: '100%',
  },
  footer: {
  }
})

export const modal_sankeytheque = definePartsStyle({
  dialogContainer: {
    background: 'blackAlpha.500'
  },
  dialog:{
    display: 'inherit',
    width: '90vw',
    height:'90vh',
    alignSelf: 'center'
  },
  header: {
    minWidth: 'inherit',
    maxWidth: 'inherit',
    width: 'max-content'
  },
  body: {
    display: 'grid',
    gridTemplateColumns:'2fr 10fr',
    // gridAutoFlow: 'row',
    // gridRowGap: '6px !important',
    minWidth: 'inherit',
    maxWidth: 'inherit',
  },
  footer: {
  }
})