import { tagAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers
} from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(tagAnatomy.keys)


export const tag_base_style=definePartsStyle({
})
export const tag_dev_navbar = definePartsStyle({
  container:{
    position:'absolute',
    color:'white',
    background:'primaire.3',
    fontSize:'0.4rem',
    minHeight:'0.6rem',
    right:'0px',
    bottom:'0.2rem'
  }
})
