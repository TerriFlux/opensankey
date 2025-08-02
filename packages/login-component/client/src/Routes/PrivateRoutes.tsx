import React, { FC } from 'react'
import { Navigate } from 'react-router-dom'
import { loginComponent } from '../LoginComponent'

type FCType_PrivateRoute = {
    component: JSX.Element,
}

export const PrivateRoute: FC<FCType_PrivateRoute> = ({
  component,
}) => {
  if (loginComponent().has_account) {
    return component
  }
  return <Navigate to="/" />
}

export const LoginRoute: FC<FCType_PrivateRoute> = ({
  component,
}) => {
  if (loginComponent().has_account) {
    return component
  }
  return <Navigate to="/login" />
}