import { accordionAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers
} from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(accordionAnatomy.keys)

export const accordion_sankeytheque = definePartsStyle({
  root: {
    border :'solid 1px grey',
    borderRadius:'6px'
  },

  panel:{
    paddingRight:'0.5em',
    paddingLeft:'0.5em',

  },
  button: {
    fontSize:'0.8rem',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    display:'grid',
    gridTemplateColumns:'10fr 1fr'
  },
  icon:{
    width:'1em',
    height:'1em',
  }
})

