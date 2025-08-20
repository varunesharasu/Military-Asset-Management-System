"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/Layout.css"

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, hasPermission } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const navigationItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      roles: ["admin", "base_commander", "logistics_officer"],
    },
    {
      path: "/purchases",
      label: "Purchases",
      icon: "🛒",
      roles: ["admin", "logistics_officer"],
    },
    {
      path: "/transfers",
      label: "Transfers",
      icon: "🚚",
      roles: ["admin", "base_commander", "logistics_officer"],
    },
    {
      path: "/assignments",
      label: "Assignments",
      icon: "👥",
      roles: ["admin", "base_commander"],
    },
  ]

  const filteredNavItems = navigationItems.filter((item) => hasPermission(item.roles))

  return (
    <div className="main-layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <h2>MAMS</h2>
          <div className="brand-subtitle">Military Asset Management</div>
        </div>

        <nav className="nav-menu">
          {filteredNavItems.map((item) => (
            <div key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user?.rank} {user?.firstName} {user?.lastName}
              </div>
              <div className="user-role">{user?.role?.replace("_", " ")}</div>
              {user?.assignedBase && <div className="user-base">Base: {user.assignedBase}</div>}
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary logout-btn">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                ☰
              </button>
              <h1>Military Asset Management System</h1>
            </div>
            <div className="user-info">
              <div className="user-details">
                <div className="user-name">
                  {user?.rank} {user?.firstName} {user?.lastName}
                </div>
                <div className="user-role">{user?.role?.replace("_", " ")}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  )
}

export default Layout
