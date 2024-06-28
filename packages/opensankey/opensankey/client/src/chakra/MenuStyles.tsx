import { menuAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(menuAnatomy.keys)

export const menu_button_base_style = definePartsStyle({
  button: {
    height: '3rem',
    width: '4rem',
    borderRadius: '6px',
    textStyle: 'h4',
    fontSize: '9px',
    border:'0px',
    span : {
      display: 'grid',
      gridColumnGap: '0',
      gridRowGap: '0',
      padding:'0',
      margin:'0',
    },
  },
  list:{
    minWidth:'inherit'
  },
  item: {
    display: 'grid',
    textStyle: 'h4',
    fontSize: '12px',
  }})

// Style used in subnav item droplist to limit minimum-width of item in the list
// (sometime the text of the item is short and the 'button' of the item is much larger)
export const menu_button_subnav_style = definePartsStyle({
  button: {
    width: '4rem',
    margin:'0.2rem, 0rem, 0.2rem, 0.75rem',
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
    span : {
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '2fr 1fr',
    },
    _hover: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
  },
  item: {
    gridTemplateColumns: '1.5rem auto',
  }
})

export const menu_button_subnav_account_style = definePartsStyle({
  button: {
    color: 'white',
    borderColor: 'primaire.2',
    bg: 'primaire.2',
    bgColor: 'primaire.2',
    span : {
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr',
    },
    _hover: {
      color: 'white',
      borderColor: 'secondaire.2',
      bg: 'secondaire.2',
      bgColor: 'secondaire.2',
    },
  },
  item: {
    display: 'flex',
  }
})

export const menu_subnav_item_demo = definePartsStyle({
  button: {
    width: '8rem',
    margin:'0.2rem, 0rem, 0.2rem, 0.75rem',
    textStyle: 'h4',
    fontSize: '12px',
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
    span : {
      gridTemplateColumns: '7fr 1fr',
      gridTemplateRows: '1fr',
    },
    _hover: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
  },
  list: {
    display: 'grid',
    gridAutoFlow: 'row',
  }
})
