import { sliderAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'


const { definePartsStyle } =
  createMultiStyleConfigHelpers(sliderAnatomy.keys)

export const baseStyleStepper = {
  // select the indicator part
}

export const slider_filter_link_value = definePartsStyle({
  container: {
    width: '85%',
    margin: 'auto'
  },
  thumb: {
    boxSize: 4
  }
})