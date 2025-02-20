import React, { FunctionComponent } from 'react'
import { Navigate } from 'react-router-dom'

type FCType_PublicRoute = {
    has_account: boolean,
    component: JSX.Element,
}

export const PublicRoute: FunctionComponent<FCType_PublicRoute> = ({
  has_account,
  component,
}) => {
  if (!has_account) {
    return component
  }
  return <Navigate to="/" />
}