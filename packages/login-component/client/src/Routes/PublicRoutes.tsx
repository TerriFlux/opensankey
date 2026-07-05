import React, { FC } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginComponent } from '../LoginComponent'

export const PublicRoute = ({
  component,
  loginComponent
}: {
  component: JSX.Element,
  loginComponent: LoginComponent
}) => {
  if (!loginComponent.has_account) {
    return component
  }
  return <Navigate to="/" />
}