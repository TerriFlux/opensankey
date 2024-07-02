import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_base_style = definePartsStyle({
  dialog: {
    width: 'fit-content',
    maxWidth: 'inherit',
    display: 'grid',
    gridGap: '1rem',
    padding: '0.25rem',
  },
  body: {
    width: 'fit-content',
    maxWidth:'75vw',
    minWidth:'30vw',
    display: 'grid',
    gridGap: '1rem',
    padding: '0.25rem',
  }
})

export const modal_welcome = definePartsStyle({
  dialog:{
    width:'max-content',
    top:'3rem',
    maxWidth: 'inherit',
  },
  body: {
    maxHeight:'60vh',
    overflowY:'auto'
  }
})

export const modal_select_unit_from_data = definePartsStyle({
  body :{
    '.rd3t-tree-container':{
      height:'80vh'
    }
  }
})
export const modal_select_unit_from_excel = definePartsStyle({
  body :{
    '.rd3t-tree-container':{
      height:'50vh'
    }
  }
})