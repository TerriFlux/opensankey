// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { cardAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(cardAnatomy.keys)



// Define the base component styles
export const card_base_style = definePartsStyle({
  body: {
    margin: 'auto',
    svg: {
      margin: 'auto'
    }
  }
})

export const card_icon_selected = definePartsStyle({
  container: {
    borderWidth: '4px',
    borderColor: 'primaire.5'
  }
})

export const card_icon_not_selected = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderColor: 'grey'
  }
})

export const card_import_icon = definePartsStyle({
  container: {
    backgroundColor: 'teal',
    borderWidth: '1px',
    borderColor: 'grey'
  }
})

export const card_account = definePartsStyle({
  container: {
    marginTop: '6rem',
  },
  header: {
    textAlign: 'center',
    bg: 'primaire.5',
    color: 'white',
    textStyle: 'h2',
  },
  body: {
    width: '100%'
  },
})

export const card_register = definePartsStyle({
  container: {
    marginTop: '175px',
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'primaire.5',
    width: '40vw',
  },
  header: {
    textAlign: 'center',
    bg: 'primaire.5',
    color: 'white',
    textStyle: 'h2',
  },
  body: {
    width: '90%',
    display: 'grid',
    gridRowGap: '10px',
  },
})

export const cards_template = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  },
  header: {
    textStyle: 'h3',
  },
})

export const cards_empty_template = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  }
})