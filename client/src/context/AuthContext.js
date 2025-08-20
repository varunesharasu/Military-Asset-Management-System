"use client"

import { createContext, useState, useContext, useEffect } from "react"
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

  // Set up axios defaults
  const API_BASE_URL = process.env.REACT_APP_API_URL || "https://military-asset-management-system-36vf.onrender.com/api"
  axios.defaults.baseURL = API_BASE_URL

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      // Verify token and get user data
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await axios.get("/auth/me")
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem("token")
      delete axios.defaults.headers.common["Authorization"]
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await axios.post("/auth/login", credentials)
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const hasPermission = (requiredRoles) => {
    if (!user) return false
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role)
    }
    return user.role === requiredRoles
  }

  const canAccessBase = (base) => {
    if (!user) return false
    if (user.role === "admin") return true
    return user.assignedBase === base
  }

  const value = {
    user,
    login,
    logout,
    hasPermission,
    canAccessBase,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
