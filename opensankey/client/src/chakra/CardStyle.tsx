import { cardAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(cardAnatomy.keys)


  
// Define the base component styles
export const card_base_style = definePartsStyle({
  body:{
    margin:'auto',
    svg:{
      margin:'auto'
    }
  }
})

export const card_icon_selected = definePartsStyle({
  container:{
    borderWidth:'4px',
    borderColor:'openSankey.50'
  }
})

export const card_icon_not_selected = definePartsStyle({
  container:{
    borderWidth:'1px',
    borderColor:'grey'
  }
})

export const card_import_icon = definePartsStyle({
  container:{
    backgroundColor:'teal',
    borderWidth:'1px',
    borderColor:'grey'
  }
})