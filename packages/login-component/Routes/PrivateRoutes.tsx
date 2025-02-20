import React, { FunctionComponent } from 'react'
import { Navigate } from 'react-router-dom'

type FCType_PrivateRoute = {
    has_account: boolean,
    component: JSX.Element,
}

export const PrivateRoute: FunctionComponent<FCType_PrivateRoute> = ({
  has_account,
  component,
}) => {
  if (has_account) {
    return component
  }
  return <Navigate to="/" />
}