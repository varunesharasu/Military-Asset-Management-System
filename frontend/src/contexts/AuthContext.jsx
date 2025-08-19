"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("token"))

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common["Authorization"]
    }
  }, [token])

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        try {
          const response = await axios.get("/api/auth/verify-token")
          setUser(response.data.user)
          setToken(storedToken)
        } catch (error) {
          console.error("Token verification failed:", error)
          localStorage.removeItem("token")
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      })

      const { token: newToken, user: userData } = response.data

      localStorage.setItem("token", newToken)
      setToken(newToken)
      setUser(userData)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed"
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("token")
      setToken(null)
      setUser(null)
      delete axios.defaults.headers.common["Authorization"]
    }
  }

  const updateProfile = async (userData) => {
    try {
      const response = await axios.put("/api/auth/profile", userData)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed"
      return { success: false, message }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed"
      return { success: false, message }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === "Admin",
    isBaseCommander: user?.role === "BaseCommander",
    isLogisticsOfficer: user?.role === "LogisticsOfficer",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
