import { defineStyle } from '@chakra-ui/react'

export const button_base_style = defineStyle({
  width: '100%',
  margin: '0',
  padding: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: 'openSankey.50',
  bgColor: 'openSankey.50',
  _hover: {
    borderColor: 'openSankey.200',
    bg: 'openSankey.200',
    bgColor: 'openSankey.200',
  },
  _disabled: {
    borderColor: 'grey.300',
    bg: 'grey.300',
    bgColor: 'grey.300',
  }
})

export const menuconfigpanel_option_button = defineStyle({
  size: 'xs',
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
})

export const menuconfigpanel_add_button = defineStyle({
  size: 'xs',
  height: '2rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'green.100',
  bgColor: 'green.100',
  _hover: {
    bg: 'green.200',
    bgColor: 'green.200',
  },
})

export const menuconfigpanel_del_button = defineStyle({
  size: 'xs',
  height: '2rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'red.100',
  bgColor: 'red.100',
  _hover: {
    bg: 'red.200',
    bgColor: 'red.200',
  },
})