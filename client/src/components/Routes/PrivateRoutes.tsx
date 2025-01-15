import React, { FunctionComponent } from 'react'
import { Navigate } from 'react-router-dom'

import { Class_ApplicationDataSA } from '../../types/ApplicationDataSA'

type FCType_PrivateRoute = {
    new_data_app: Class_ApplicationDataSA,
    component: JSX.Element,
}

export const PrivateRoute: FunctionComponent<FCType_PrivateRoute> = ({
  new_data_app,
  component,
}) => {
  if (new_data_app.has_account) {
    return component
  }
  return <Navigate to="/" />
}