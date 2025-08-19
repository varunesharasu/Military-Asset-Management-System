"use client"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Military Assets</h2>
          <p>Management System</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className="nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/purchases" className="nav-link">
            Purchases
          </NavLink>
          <NavLink to="/transfers" className="nav-link">
            Transfers
          </NavLink>
          <NavLink to="/assignments" className="nav-link">
            Assignments
          </NavLink>
          {user?.role === "Admin" && (
            <NavLink to="/audit-logs" className="nav-link">
              Audit Logs
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
            {user?.baseId && <div className="user-base">{user.baseId.name}</div>}
          </div>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="content-wrapper">{children}</div>
      </div>
    </div>
  )
}

export default Layout
