import { drawerAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(drawerAnatomy.keys)

// Define the base component styles
export const drawer_base_style = definePartsStyle({})

// Style for the drawer containing the configuration menu
export const drawer_menu_config=definePartsStyle({
  dialog:{
    maxWidth:'inherit'
  },
  dialogContainer:{
    width:'inherit'
  },
  body:{
    padding:'0'
  }
})

