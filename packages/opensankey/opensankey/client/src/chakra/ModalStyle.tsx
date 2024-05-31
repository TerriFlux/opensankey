import { modalAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(modalAnatomy.keys)

export const modal_base_style = definePartsStyle({
})

export const modal_select_unit_from_data = definePartsStyle({
    body :{
      '.rd3t-tree-container':{
      height:'80vh'
    }
    }
  })
