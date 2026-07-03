import React from 'react'
import { Outlet } from 'react-router-dom'

const DefualtProtectedRouter = () => {
  return (
    <div>
      <Outlet />
    </div>
  )
}

export default DefualtProtectedRouter
