"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if roles are specified
  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="alert alert-error">
          <h3>Access Denied</h3>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
