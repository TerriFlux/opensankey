import { tabsAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(tabsAnatomy.keys)


export const tabs_data_source_for_unitary=definePartsStyle({
  root:{
    width:'100%'
  },
  list:{
    display:'unset'
  }
})