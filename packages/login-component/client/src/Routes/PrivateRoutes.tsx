import React from 'react'
import { Navigate } from 'react-router-dom'
import { LoginComponent } from '../LoginComponent'

export const PrivateRoute = ({
  component,loginComponent
}:{
    component: JSX.Element,
    loginComponent: LoginComponent
}) => {
  if (loginComponent.has_account) {
    return component
  }
  return <Navigate to="/" />
}

export const LoginRoute = ({
  component,
  loginComponent
}:{
    component: JSX.Element,
    loginComponent: LoginComponent
}) => {
  if (loginComponent.has_account) {
    return component
  }
  return <Navigate to="/login" />
}