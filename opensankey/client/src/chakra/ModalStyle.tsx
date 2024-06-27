import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_base_style = definePartsStyle({
})

const screenHeight = window.innerHeight

export const modal_welcome = definePartsStyle({
  dialog:{
    width:'75%',
    top:'5%',
    maxWidth:'inherit'
  },
  body: {
    maxHeight:(screenHeight*0.6)+'px',
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