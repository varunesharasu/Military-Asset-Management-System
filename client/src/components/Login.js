"use client"

import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/Login.css"

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { user, login } = useAuth()

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(formData)

    if (!result.success) {
      setError(result.message)
    }

    setLoading(false)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="background-pattern"></div>
      <div className="floating-elements">
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
      </div>

      {/* Header Bar */}
      <div className="login-header-bar">
        <div className="header-content">
          <div className="system-info">
            <span className="system-name">MAMS v2.0</span>
            <span className="classification">UNCLASSIFIED</span>
          </div>
          <div className="time-display">
            <span className="current-time">{currentTime.toLocaleTimeString()}</span>
            <span className="current-date">{currentTime.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="brand-section">
              <div className="brand-icon">
                <div className="icon-container">
                  <span className="military-shield">🛡️</span>
                  <div className="icon-pulse"></div>
                </div>
              </div>
              <div className="brand-text">
                <h1>Military Asset Management</h1>
                <p>Secure Authentication Portal</p>
              </div>
            </div>
            <div className="security-badge">
              <span className="badge-icon">🔐</span>
              <span className="badge-text">Secure Login</span>
              <div className="security-indicator"></div>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-message">{error}</span>
                  <button 
                    type="button" 
                    className="alert-close"
                    onClick={() => setError("")}
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    <span className="label-text">Username or Email</span>
                    <span className="label-icon">👤</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="form-control"
                      required
                      autoComplete="username"
                      placeholder="Enter your username or email"
                    />
                    <div className="input-focus-border"></div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <span className="label-text">Password</span>
                    <span className="label-icon">🔑</span>
                  </label>
                  <div className="input-wrapper password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                    <div className="input-focus-border"></div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="login-btn" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🚀</span>
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="card-footer">
            <div className="security-notice">
              <div className="notice-header">
                <span className="notice-icon">🔒</span>
                <span className="notice-title">Security Notice</span>
              </div>
              <p className="notice-text">
                This is a secure military system. Unauthorized access is prohibited 
                and monitored. All activities are logged.
              </p>
            </div>
            
            <div className="system-status">
              <div className="status-item">
                <span className="status-dot online"></span>
                <span className="status-label">System Online</span>
              </div>
              <div className="status-item">
                <span className="status-dot secure"></span>
                <span className="status-label">SSL Secured</span>
              </div>
              <div className="status-item">
                <span className="status-dot monitored"></span>
                <span className="status-label">Monitored</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Information Panel */}
        <div className="info-panel">
          <div className="panel-content">
            <h3>System Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Version</span>
                <span className="info-value">MAMS 2.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value status-operational">Operational</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Update</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Security Level</span>
                <span className="info-value security-high">High</span>
              </div>
            </div>
            
            <div className="help-section">
              <h4>Need Help?</h4>
              <p>Contact your system administrator for login assistance or technical support.</p>
              <div className="contact-info">
                <span>📧 support@military.gov</span>
                <span>📞 1-800-MILITARY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span>© 2024 Military Asset Management System</span>
            <span>All rights reserved</span>
          </div>
          <div className="footer-right">
            <span>Powered by Advanced Security Framework</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
