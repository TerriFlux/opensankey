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

import { editableAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
    createMultiStyleConfigHelpers(editableAnatomy.keys)



// Define the base component styles
export const editable_base_style = definePartsStyle({
})

export const name_file_editable = definePartsStyle({
  preview: {
    display: 'block',
    alignItems: 'center',
    paddingLeft:'1rem',
    paddingRight:'1rem',
    height: '2rem',
    fontSize: '1rem',
    bg: 'primaire.3',
    border: '1px solid',
    borderColor: 'primaire.3',
    color: 'white',
    maxW: '15rem',
    minW: '8rem',
    width: 'unset',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  input: {
    display: 'block',
    height: '2rem',
    fontSize: '1rem',
    bg: 'primaire.3',
    border: '1px solid',
    borderColor: 'primaire.3',
    color: 'white',
    maxW: '15rem',
    minW: '8rem',
    width: 'unset',
    overflow: 'visible',
    // textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  _active: {
    secondaire: 'primaire.3',
  }
})

export const edit_name_palette=definePartsStyle({
  preview:{
    fontSize:'0.8rem',
    width:'100%',
    padding:'0',
    height:'1.5rem',
    border:'1px solid',
    borderColor:'primaire.5',
  },
  input:{
    fontSize:'0.8rem',
    height:'1.5rem',
    border:'1px solid',
    borderColor:'primaire.5'
  }
})