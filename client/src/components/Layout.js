"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/Layout.css"

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const { user, logout, hasPermission } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

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
      description: "Overview & Analytics"
    },
    {
      path: "/purchases",
      label: "Purchases",
      icon: "🛒",
      roles: ["admin", "logistics_officer"],
      description: "Procurement Management"
    },
    {
      path: "/transfers",
      label: "Transfers",
      icon: "🚚",
      roles: ["admin", "base_commander", "logistics_officer"],
      description: "Asset Transfers"
    },
    {
      path: "/assignments",
      label: "Assignments",
      icon: "👥",
      roles: ["admin", "base_commander"],
      description: "Personnel Assignments"
    },
  ]

  const filteredNavItems = navigationItems.filter((item) => hasPermission(item.roles))

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading MAMS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <div className="icon-shield">⚡</div>
            </div>
            <div className="brand-text">
              <h2>MAMS</h2>
              <span className="brand-subtitle">Military Asset Management</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>×</button>
        </div>

        <nav className="nav-menu">
          <div className="nav-section">
            <span className="nav-section-title">Navigation</span>
            {filteredNavItems.map((item, index) => (
              <div key={item.path} className="nav-item" style={{animationDelay: `${index * 0.1}s`}}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="nav-icon-wrapper">
                    <span className="nav-icon">{item.icon}</span>
                  </div>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                  <div className="nav-arrow">→</div>
                </Link>
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <div className="avatar-image">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="status-indicator"></div>
            </div>
            <div className="user-info">
              <div className="user-name">
                {user?.rank} {user?.firstName} {user?.lastName}
              </div>
              <div className="user-role">{user?.role?.replace("_", " ")}</div>
              {user?.assignedBase && <div className="user-base">📍 {user.assignedBase}</div>}
            </div>
          </div>
          
          <div className="footer-actions">
            <button onClick={handleLogout} className="logout-btn">
              <span className="btn-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                <span></span>
                <span></span>
                <span></span>
              </button>
              <div className="header-title">
                <h1>Military Asset Management System</h1>
                <span className="header-subtitle">Real-time Operations Dashboard</span>
              </div>
            </div>
            
            <div className="header-right">
              <div className="real-time-info">
                <div className="time-display">
                  <span className="time">{currentTime.toLocaleTimeString()}</span>
                  <span className="date">{currentTime.toLocaleDateString()}</span>
                </div>
                <div className="status-badge">
                  <span className="status-dot"></span>
                  <span>Live</span>
                </div>
              </div>
              
              <div className="user-header-info">
                <div className="user-details">
                  <div className="user-name">
                    {user?.rank} {user?.firstName} {user?.lastName}
                  </div>
                  <div className="user-role">{user?.role?.replace("_", " ")}</div>
                </div>
                <div className="user-avatar-small">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          <div className="content">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default Layout
