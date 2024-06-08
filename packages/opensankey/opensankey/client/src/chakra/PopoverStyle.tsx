import { popoverAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(popoverAnatomy.keys)


  
// Define the base component styles
export const popover_base_style = definePartsStyle({
})

export const popover_btn_sideBar = definePartsStyle({
  content:{
    width:'100%',
  }
})