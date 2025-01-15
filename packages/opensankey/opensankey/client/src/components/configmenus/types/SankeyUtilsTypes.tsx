import { PlacementWithLogical } from '@chakra-ui/react'
import { ReactNode } from 'react'

export type OSTooltpFuncType={
  delay?:number,
  label:string,
  placement?:PlacementWithLogical
  children:ReactNode
}