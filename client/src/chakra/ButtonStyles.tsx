import { defineStyle } from '@chakra-ui/react'


export const menutop_button_goto_dashboard = defineStyle({
  padding: '0.25rem',
  alignSelf: 'center',
  justifySelf: 'center',
  height: '3rem',
  width: '4rem',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'primaire.2',
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  color: 'white',
  fill: 'white',
  _hover: {
    borderColor: 'secondaire.2',
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
  },
})

export const menutop_button_logout = defineStyle({
  padding: '0.25rem',
  alignSelf: 'center',
  justifySelf: 'center',
  height: '3rem',
  width: '4rem',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  color: 'white',
  fill: 'white',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
})

const _btn_lone_navigation = {
  height: '3rem',
  maxW: '11rem',
  marginLeft: '1rem',
  marginRight: '1rem',
  paddingTop: '1rem',
  paddingBottom: '1rem',
  alignSelf: 'center',
  justifySelf: 'center',
  textAlign: 'center'
}

export const btn_lone_navigation = defineStyle(_btn_lone_navigation)

export const btn_lone_navigation_primary = defineStyle({
  ..._btn_lone_navigation,
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  borderColor: 'primaire.1',
  _hover: {
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
    borderColor: 'secondaire.1',
  },
})

export const btn_lone_navigation_secondary = defineStyle({
  ..._btn_lone_navigation,
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'primaire.2',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
})

export const btn_lone_navigation_tertiary = defineStyle({
  ..._btn_lone_navigation,
  bg: 'primaire.5',
  bgColor: 'primaire.5',
  borderColor: 'primaire.5',
  _hover: {
    bg: 'secondaire.5',
    bgColor: 'secondaire.5',
    borderColor: 'secondaire.5',
  },
})

export const btn_lone_navigation_tertiary_negative = defineStyle({
  ..._btn_lone_navigation,
  color: 'primaire.5',
  fill: 'primaire.5',
  path: 'primaire.5',
  bg: 'white',
  bgColor: 'white',
  border: 'none',
  _hover: {
    color: 'tertiaire.5',
    fill: 'tertiaire.5',
    path: 'tertiaire.5',
    bg: 'white',
    bgColor: 'white',
    border: 'none',
  },
})

const _btn_accountpage = {
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'primaire.2',
  justifySelf: 'center',
  alignSelf: 'center',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  }
}

export const btn_accountpage = defineStyle({
  ..._btn_accountpage
})

export const btn_accountpage_negative = defineStyle({
  ..._btn_accountpage,
  bg: 'gray.50',
  bgColor: 'gray.50',
  borderColor: 'primaire.2',
  border: '2px solid',
  color: 'primaire.2',
  _hover: {
    bg: 'gray.50',
    bgColor: 'gray.50',
    borderColor: 'secondaire.2',
    color: 'secondaire.2'
  }
})

export const btn_accountpage_embedded = defineStyle({
  ..._btn_accountpage,
  height: '90%',
  width: '90%'
})

export const btn_accountpage_danger = defineStyle({
  ..._btn_accountpage,
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  borderColor: 'primaire.1',
  _hover: {
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
    borderColor: 'secondaire.1',
  }
})

export const button_open_card_sankeytheque=defineStyle({
  bg: 'primaire.6',
  bgColor: 'primaire.6',
  borderColor: 'primaire.6',
  whiteSpace:'inherit',
  _hover: {
    bg: 'tertiaire.6',
    bgColor: 'tertiaire.6',
    borderColor: 'tertiaire.6',
  }
})

export const button_sankey_open_json=defineStyle({
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'primaire.2',
  whiteSpace:'inherit',
  _hover: {
    bg: 'tertiaire.2',
    bgColor: 'tertiaire.2',
    borderColor: 'tertiaire.2',
  }
})

export const button_sankey_open_excel=defineStyle({
  bg: 'primaire.3',
  bgColor: 'primaire.3',
  borderColor: 'primaire.3',
  whiteSpace:'inherit',
  _hover: {
    bg: 'tertiaire.3',
    bgColor: 'tertiaire.3',
    borderColor: 'tertiaire.3',
  }
})
