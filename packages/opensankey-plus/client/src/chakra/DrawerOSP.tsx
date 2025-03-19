
import { defineStyle } from '@chakra-ui/react'


// Style for the drawer containing the configuration menu
export const drawer_sequence=defineStyle({
  dialog:{
    maxWidth:'inherit'
  },
  dialogContainer:{
    width:'inherit',
    zIndex:1
  },
  body:{
    padding:'0'
  }
})
export const drawer_menu_filter=defineStyle({
  dialog:{
    maxWidth:'inherit',
    background:'primaire.5',
    borderRadius:'4px'

  },
  dialogContainer:{
    width:'inherit',
    background:'none',
    zIndex:1
  },
  body:{
    overflow:'unset',
    padding:'0',
  }
})