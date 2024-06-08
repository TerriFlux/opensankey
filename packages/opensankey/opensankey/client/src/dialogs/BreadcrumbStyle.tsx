import { breadcrumbAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(breadcrumbAnatomy.keys)


  
// Define the base component styles
export const breadcrumb_base_style = definePartsStyle({
 
})
export const pagination_welecome = definePartsStyle({
  item:{
    span:{
      color:'openSankey.200'
    }
  }
})