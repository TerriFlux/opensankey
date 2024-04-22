import { menuAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(menuAnatomy.keys)

export const menu_button_base_style = definePartsStyle({})

// Style used in subnav item droplist to limit minimum-width of item in the list 
// (sometime the text of the item is short and the 'button' of the item is much larger) 
export const menu_button_subnav_style=definePartsStyle({
  list:{
    minWidth:'inherit'
  }
})