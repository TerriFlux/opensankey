import React, { FunctionComponent } from 'react'
import { Navigate } from 'react-router-dom'
import { loginComponent } from '../LoginComponent'

type FCType_PublicRoute = {
    component: JSX.Element,
}

export const PublicRoute: FunctionComponent<FCType_PublicRoute> = ({
  component,
}) => {
  if (!loginComponent().has_account) {
    return component
  }
  return <Navigate to="/" />
}